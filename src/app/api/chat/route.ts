import { NextRequest, NextResponse } from 'next/server';
import { CostOptimizerClient } from '@/services/CostOptimizerClient';
import { RequirementsExtractor, ExtractedRequirements } from '@/services/RequirementsExtractor';
import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  cost?: number;
  provider?: string;
  requirementsExtracted?: ExtractedRequirements;
  buildStarted?: boolean;
  projectId?: string;
  buildStatus?: any;
  error?: string;
}

// Allow dependency injection for testing
let costOptimizerInstance: CostOptimizerClient | null = null;

export function setCostOptimizer(client: CostOptimizerClient | null) {
  costOptimizerInstance = client;
}

function getCostOptimizer(): CostOptimizerClient {
  if (costOptimizerInstance) {
    return costOptimizerInstance;
  }
  return new CostOptimizerClient({
    baseURL: process.env.COST_OPTIMIZER_URL || 'http://localhost:8000'
  });
}

/**
 * Check if user message indicates build confirmation
 */
function isBuildConfirmation(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  const confirmationKeywords = [
    'yes',
    'ready',
    'build it',
    'build',
    'start',
    'go ahead',
    'proceed',
    "let's go",
    'do it'
  ];

  return confirmationKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Format requirements into a user request string
 */
function formatUserRequest(requirements: ExtractedRequirements, conversation: ChatMessage[]): string {
  const parts: string[] = [];

  // Add project type
  if (requirements.projectType) {
    parts.push(`Build a ${requirements.projectType.replace('_', ' ')}`);
  } else {
    parts.push('Build an application');
  }

  // Add language and framework
  if (requirements.language) {
    parts.push(`using ${requirements.language}`);
  }
  if (requirements.framework) {
    parts.push(`with ${requirements.framework}`);
  }

  // Add features
  if (requirements.features && requirements.features.length > 0) {
    parts.push(`Features: ${requirements.features.join(', ')}`);
  }

  // Add constraints
  if (requirements.constraints && requirements.constraints.length > 0) {
    parts.push(`Constraints: ${requirements.constraints.join(', ')}`);
  }

  // Include original user messages for context
  const userMessages = conversation
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join('. ');

  if (userMessages) {
    parts.push(`\n\nOriginal request: ${userMessages}`);
  }

  return parts.join('. ');
}

/**
 * POST /api/chat - Chat endpoint using Claude SDK and CostOptimizerClient
 *
 * Task 7: Connects chat to orchestrator
 * 1. Extracts requirements from conversation
 * 2. Asks clarifying questions when confidence is low/medium
 * 3. Triggers build when confidence is high and user confirms
 *
 * Accepts:
 *   - message: string (required) - User's message
 *   - history: ChatMessage[] (required) - Conversation history
 *
 * Returns:
 *   - response: string - AI's response
 *   - cost: number (optional) - Cost of the request
 *   - provider: string (optional) - Provider used
 *   - requirementsExtracted: ExtractedRequirements (optional) - Extracted requirements
 *   - buildStarted: boolean (optional) - Whether build was triggered
 *   - projectId: string (optional) - ID of started project
 *   - buildStatus: object (optional) - Status of the build
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    // Parse request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { message, history } = body;

    // Input validation constants
    const MAX_MESSAGE_LENGTH = 10000;
    const MAX_HISTORY_SIZE = 50;

    // Validate inputs
    if (typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 }
      );
    }

    if (!Array.isArray(history)) {
      return NextResponse.json(
        { error: 'History must be an array' },
        { status: 400 }
      );
    }

    if (history.length > MAX_HISTORY_SIZE) {
      return NextResponse.json(
        { error: `History too large (max ${MAX_HISTORY_SIZE} messages)` },
        { status: 400 }
      );
    }

    // Validate history message structure
    for (const msg of history) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        return NextResponse.json(
          { error: 'Invalid message format in history' },
          { status: 400 }
        );
      }
    }

    // TASK 7: Extract requirements from conversation
    const costOptimizer = getCostOptimizer();
    const requirementsExtractor = new RequirementsExtractor(costOptimizer);

    let requirements: ExtractedRequirements | null = null;
    try {
      // Build full conversation including current message
      const fullConversation = [
        ...history,
        { id: uuidv4(), role: 'user' as const, content: message }
      ];

      requirements = await requirementsExtractor.extractFromConversation(fullConversation);
    } catch (error) {
      // If requirements extraction fails, continue with normal chat
      console.error('Requirements extraction failed:', error);
    }

    // Build conversation context for AI response
    const conversationContext = history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create full prompt with conversation history
    const prompt = conversationContext
      ? `${conversationContext}\nuser: ${message}\nassistant:`
      : `user: ${message}\nassistant:`;

    // Call cost optimizer for AI response
    let aiResponse: string;
    let cost: number;
    let provider: string;

    try {
      const result = await costOptimizer.complete(prompt, {
        task_type: 'conversation',
        complexity: 'simple',
        max_tokens: 500
      });

      aiResponse = result.response;
      cost = result.cost;
      provider = result.provider;
    } catch (error) {
      // Check if circuit breaker is open
      if (error instanceof Error && error.message.includes('Circuit breaker is open')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again in a moment.' },
          { status: 503 }
        );
      }

      // Other errors
      throw error;
    }

    // TASK 7: Check if we should trigger build
    const shouldBuild =
      requirements !== null &&
      requirements.confidence === 'high' &&
      isBuildConfirmation(message);

    if (shouldBuild && requirements) {
      // Trigger AgentOrchestrator
      try {
        const orchestrator = new AgentOrchestrator({ costOptimizerClient: costOptimizer });
        const userRequest = formatUserRequest(requirements, [...history, { id: uuidv4(), role: 'user', content: message }]);

        const buildResult = await orchestrator.startProject({
          userRequest,
          userId: 'chat-user-' + uuidv4(),
          organizationId: 'chat-org-default',
          projectName: requirements.projectType
            ? `${requirements.language || 'app'}-${requirements.projectType}`
            : 'chat-project'
        });

        return NextResponse.json({
          response: aiResponse,
          cost,
          provider,
          requirementsExtracted: requirements,
          buildStarted: true,
          projectId: buildResult.projectId,
          buildStatus: buildResult.status
        });
      } catch (buildError) {
        console.error('Build startup error:', buildError);
        return NextResponse.json({
          response: aiResponse,
          cost,
          provider,
          requirementsExtracted: requirements,
          buildStarted: false,
          error: 'Failed to start build process. Please try again.'
        });
      }
    }

    // Return normal chat response with extracted requirements
    return NextResponse.json({
      response: aiResponse,
      cost,
      provider,
      ...(requirements && { requirementsExtracted: requirements })
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
