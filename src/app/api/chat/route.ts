import { NextRequest, NextResponse } from 'next/server';
import { CostOptimizerClient } from '@/services/CostOptimizerClient';

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
 * POST /api/chat - Chat endpoint using Claude SDK and CostOptimizerClient
 *
 * Accepts:
 *   - message: string (required) - User's message
 *   - history: ChatMessage[] (required) - Conversation history
 *
 * Returns:
 *   - response: string - AI's response
 *   - cost: number (optional) - Cost of the request
 *   - provider: string (optional) - Provider used
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

    // Validate inputs
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!Array.isArray(history)) {
      return NextResponse.json(
        { error: 'History must be an array' },
        { status: 400 }
      );
    }

    // Build conversation context
    const conversationContext = history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create full prompt with conversation history
    const prompt = conversationContext
      ? `${conversationContext}\nuser: ${message}\nassistant:`
      : `user: ${message}\nassistant:`;

    // Call cost optimizer
    try {
      const costOptimizer = getCostOptimizer();
      const result = await costOptimizer.complete(prompt, {
        task_type: 'conversation',
        complexity: 'simple',
        max_tokens: 500
      });

      return NextResponse.json({
        response: result.response,
        cost: result.cost,
        provider: result.provider
      });
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
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
