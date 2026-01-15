/**
 * Chat API Route - Claude Integration
 *
 * Handles chat messages via Anthropic Claude API.
 * Pattern from: solarappraisal-ai/src/app/api/chat/route.ts
 *
 * NO OpenAI - Uses Anthropic Claude only
 *
 * Model Selection:
 * - claude-opus-4.5 (default) - Best reasoning, agentic tasks
 * - claude-sonnet-4.5 - Fast, efficient for simple tasks
 */

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Available Claude models (NO OpenAI)
// Source: https://platform.claude.com/docs/en/about-claude/models/overview
const AVAILABLE_MODELS = {
  // Claude 4.5 Family (Latest)
  'claude-opus-4.5': 'claude-opus-4-5-20251101',     // Premium: $5/$25 per MTok
  'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929', // Best balance: $3/$15 per MTok
  'claude-haiku-4.5': 'claude-haiku-4-5-20251001',   // Fastest: $1/$5 per MTok
  // Legacy aliases for convenience
  'opus': 'claude-opus-4-5-20251101',
  'sonnet': 'claude-sonnet-4-5-20250929',
  'haiku': 'claude-haiku-4-5-20251001',
} as const;

type ModelAlias = keyof typeof AVAILABLE_MODELS;

// Default to Opus 4.5 for superior reasoning
const DEFAULT_MODEL: ModelAlias = 'claude-opus-4.5';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: ModelAlias;
  stream?: boolean;
  sessionId?: string;
}

// MEP Domain Expert System Prompt
const SYSTEM_PROMPT = `You are an AI assistant for MEP (Mechanical, Electrical, Plumbing) contractors.
You help with:
- Work order management and scheduling
- HVAC system troubleshooting and diagnostics
- Electrical panel inspections and load calculations
- Plumbing service calls and backflow testing
- Solar installation and commissioning
- Fire protection system maintenance

You have access to Coperniq, the contractor's operating system.
Be helpful, concise, and professional. When discussing technical topics, use industry-standard terminology.

Key certifications you understand:
- HVAC: EPA 608, NATE, ACCA
- Electrical: NEC codes, OSHA 30
- Plumbing: UPC codes, Backflow certifications
- Solar: NABCEP PV, NEC 690/705
- Fire: NFPA 72, sprinkler inspection`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const { messages, model: modelAlias = DEFAULT_MODEL, stream = false } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Resolve model alias to full model ID
    const modelId = AVAILABLE_MODELS[modelAlias] || AVAILABLE_MODELS[DEFAULT_MODEL];

    console.log(`Chat request using model: ${modelAlias} -> ${modelId}`);

    // Transform messages for Claude API format
    const claudeMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the assistant's response
    const assistantMessage = data.content?.[0]?.text || 'I apologize, but I could not generate a response.';

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: assistantMessage,
      },
      usage: data.usage,
      model: data.model,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your message. Please try again.',
        }
      },
      { status: 500 }
    );
  }
}

// Health check endpoint with model info
export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    status: hasApiKey ? 'healthy' : 'missing_api_key',
    provider: 'anthropic',
    defaultModel: AVAILABLE_MODELS[DEFAULT_MODEL],
    availableModels: Object.keys(AVAILABLE_MODELS).filter(k => !['opus', 'sonnet'].includes(k)),
    modelAliases: AVAILABLE_MODELS,
  });
}
