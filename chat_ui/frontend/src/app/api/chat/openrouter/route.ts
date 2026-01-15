/**
 * OpenRouter Chat API Route
 *
 * Provides access to Chinese LLMs (DeepSeek, Qwen) via OpenRouter.
 * NO OpenAI - Uses only DeepSeek, Qwen, and other non-OpenAI models.
 *
 * Best models for reasoning and MOE:
 * - DeepSeek-R1: Top reasoning (97.3% MATH-500)
 * - DeepSeek-V3.2: GPT-5 class performance
 * - Qwen3-235B-A22B: Massive MoE with 22B active params
 * - QwQ-32B: Best open-weight reasoning
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Best Chinese LLMs (NO OpenAI)
// Source: https://openrouter.ai/models
const AVAILABLE_MODELS = {
  // DeepSeek Models (Best value + reasoning)
  'deepseek-r1': 'deepseek/deepseek-r1-0528',           // Top reasoning model
  'deepseek-v3.2': 'deepseek/deepseek-v3.2-20251201',   // Latest, GPT-5 class
  'deepseek-v3.1': 'deepseek/deepseek-chat-v3.1',       // Great balance
  'deepseek-prover': 'deepseek/deepseek-prover-v2',     // Math/logic focused

  // Qwen Models (Alibaba - excellent multilingual)
  'qwen3-max': 'qwen/qwen3-max',                        // Most capable
  'qwen3-235b': 'qwen/qwen3-235b-a22b',                 // MoE flagship
  'qwen3-coder': 'qwen/qwen3-coder',                    // Best for code
  'qwq-32b': 'qwen/qwq-32b',                            // Reasoning (o1-mini competitor)

  // Qwen VLM (Vision-Language)
  'qwen3-vl-235b': 'qwen/qwen3-vl-235b-a22b-instruct',  // Vision + reasoning
  'qwen3-vl-32b': 'qwen/qwen3-vl-32b-instruct',         // Faster vision

  // Aliases for convenience
  'deepseek': 'deepseek/deepseek-v3.2-20251201',
  'qwen': 'qwen/qwen3-max',
  'reasoning': 'deepseek/deepseek-r1-0528',
  'vision': 'qwen/qwen3-vl-235b-a22b-instruct',
  'coder': 'qwen/qwen3-coder',
} as const;

type ModelAlias = keyof typeof AVAILABLE_MODELS;

// Default to DeepSeek V3.2 for best value
const DEFAULT_MODEL: ModelAlias = 'deepseek-v3.2';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: ModelAlias;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
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
Be helpful, concise, and professional. When discussing technical topics, use industry-standard terminology.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not configured');
    return NextResponse.json(
      { error: 'OpenRouter API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const {
      messages,
      model: modelAlias = DEFAULT_MODEL,
      temperature = 0.7,
      max_tokens = 4096,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Resolve model alias to full model ID
    const modelId = AVAILABLE_MODELS[modelAlias] || AVAILABLE_MODELS[DEFAULT_MODEL];

    console.log(`OpenRouter request using model: ${modelAlias} -> ${modelId}`);

    // Add system message if not present
    const messagesWithSystem: ChatMessage[] = messages[0]?.role === 'system'
      ? messages
      : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Kipper Energy Chat',
      },
      body: JSON.stringify({
        model: modelId,
        messages: messagesWithSystem,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the assistant's response
    const assistantMessage = data.choices?.[0]?.message?.content ||
      'I apologize, but I could not generate a response.';

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: assistantMessage,
      },
      usage: data.usage,
      model: data.model,
      provider: 'openrouter',
    });
  } catch (error) {
    console.error('OpenRouter Chat API error:', error);
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
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;

  return NextResponse.json({
    status: hasApiKey ? 'healthy' : 'missing_api_key',
    provider: 'openrouter',
    defaultModel: AVAILABLE_MODELS[DEFAULT_MODEL],
    availableModels: Object.keys(AVAILABLE_MODELS).filter(
      k => !['deepseek', 'qwen', 'reasoning', 'vision', 'coder'].includes(k)
    ),
    modelAliases: AVAILABLE_MODELS,
    capabilities: {
      reasoning: ['deepseek-r1', 'qwq-32b'],
      coding: ['qwen3-coder', 'deepseek-v3.2'],
      vision: ['qwen3-vl-235b', 'qwen3-vl-32b'],
      moe: ['qwen3-235b', 'deepseek-v3.2'],
    },
  });
}
