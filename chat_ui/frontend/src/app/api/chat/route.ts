/**
 * Chat API Route - Claude Integration with Tool Use
 *
 * Handles chat messages via Anthropic Claude API WITH TOOLS.
 * Claude can query Coperniq work orders, contacts, and assets.
 *
 * NO OpenAI - Uses Anthropic Claude only
 *
 * Model Selection:
 * - claude-opus-4.5 (default) - Best reasoning, agentic tasks
 * - claude-sonnet-4.5 - Fast, efficient for simple tasks
 */

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

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

// MEP Domain Expert System Prompt with Tool Instructions
const SYSTEM_PROMPT = `You are an AI assistant for Kipper Energy Solutions, a MEP (Mechanical, Electrical, Plumbing) contractor.

## Your Capabilities
You have DIRECT ACCESS to Coperniq (the contractor's operating system) through tools:
- get_work_orders: Query all work orders, filter by status or trade
- get_contacts: Look up customer information
- get_projects: View ongoing projects
- create_work_order: Schedule new service calls

## When Users Ask About Data
ALWAYS use your tools to get REAL data. Examples:
- "How many work orders today?" → Use get_work_orders tool
- "Show me HVAC jobs" → Use get_work_orders with trade filter
- "Who is our customer?" → Use get_contacts tool

## Trade Expertise
You support: HVAC, Plumbing, Electrical, Solar, Low Voltage, Fire & Safety, Roofing

## Key Certifications You Understand
- HVAC: EPA 608, NATE, ACCA
- Electrical: NEC codes, OSHA 30
- Plumbing: UPC codes, Backflow certifications
- Solar: NABCEP PV, NEC 690/705
- Fire: NFPA 72, sprinkler inspection

Be helpful, concise, and professional. When discussing technical topics, use industry-standard terminology.`;

// Claude Tool Definitions for Coperniq
const TOOLS = [
  {
    name: 'get_work_orders',
    description: 'Get work orders from Coperniq. Can filter by status (pending, scheduled, in_progress, completed) or trade (HVAC, Plumbing, Electrical, Solar, Fire Protection).',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'pending', 'scheduled', 'in_progress', 'completed'],
          description: 'Filter by status. Use "all" for all work orders.',
        },
        trade: {
          type: 'string',
          enum: ['all', 'HVAC', 'Plumbing', 'Electrical', 'Solar', 'Fire Protection', 'Low Voltage', 'Roofing'],
          description: 'Filter by trade. Use "all" for all trades.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return. Default 10.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_contacts',
    description: 'Get customer contacts from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search by customer name or company.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results. Default 10.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_projects',
    description: 'Get ongoing projects from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'active', 'completed', 'on_hold'],
          description: 'Filter by project status.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results. Default 10.',
        },
      },
      required: [],
    },
  },
];

// Execute tools against Coperniq API
async function executeTool(toolName: string, toolInput: Record<string, unknown>, apiKey: string): Promise<string> {
  try {
    switch (toolName) {
      case 'get_work_orders': {
        const [requestsRes, projectsRes] = await Promise.all([
          fetch(`${COPERNIQ_API_URL}/requests`, {
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          }),
          fetch(`${COPERNIQ_API_URL}/projects`, {
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          }),
        ]);

        const requests = requestsRes.ok ? await requestsRes.json() : [];
        const projects = projectsRes.ok ? await projectsRes.json() : [];

        // Combine and transform
        let workOrders = [
          ...(Array.isArray(requests) ? requests : requests.data || []).map((r: Record<string, unknown>) => ({
            id: `req-${r.id}`,
            title: r.title || 'Untitled',
            status: r.status,
            trade: r.trade || 'General',
            customer: (r.client as Record<string, unknown>)?.name || (r.primaryContact as Record<string, unknown>)?.name || 'Unassigned',
            type: 'request',
          })),
          ...(Array.isArray(projects) ? projects : projects.data || []).map((p: Record<string, unknown>) => ({
            id: `proj-${p.id}`,
            title: p.title || 'Untitled',
            status: p.status,
            stage: p.stage,
            trade: p.trade || 'General',
            customer: (p.client as Record<string, unknown>)?.name || (p.primaryContact as Record<string, unknown>)?.name || 'Unassigned',
            type: 'project',
          })),
        ];

        // Apply filters
        const { status, trade, limit = 10 } = toolInput;
        if (status && status !== 'all') {
          workOrders = workOrders.filter((wo) => wo.status?.toLowerCase().includes(String(status).toLowerCase()));
        }
        if (trade && trade !== 'all') {
          workOrders = workOrders.filter((wo) => wo.trade?.toLowerCase() === String(trade).toLowerCase());
        }

        workOrders = workOrders.slice(0, Number(limit));

        return JSON.stringify({
          total: workOrders.length,
          work_orders: workOrders,
        });
      }

      case 'get_contacts': {
        const response = await fetch(`${COPERNIQ_API_URL}/contacts`, {
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        });
        const contacts = response.ok ? await response.json() : [];
        let results = Array.isArray(contacts) ? contacts : contacts.data || [];

        const { search, limit = 10 } = toolInput;
        if (search) {
          const searchLower = String(search).toLowerCase();
          results = results.filter((c: Record<string, unknown>) =>
            String(c.name || '').toLowerCase().includes(searchLower) ||
            String(c.companyName || '').toLowerCase().includes(searchLower)
          );
        }

        return JSON.stringify({
          total: results.slice(0, Number(limit)).length,
          contacts: results.slice(0, Number(limit)),
        });
      }

      case 'get_projects': {
        const response = await fetch(`${COPERNIQ_API_URL}/projects`, {
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        });
        const projects = response.ok ? await response.json() : [];
        let results = Array.isArray(projects) ? projects : projects.data || [];

        const { status, limit = 10 } = toolInput;
        if (status && status !== 'all') {
          results = results.filter((p: Record<string, unknown>) =>
            String(p.status || '').toLowerCase().includes(String(status).toLowerCase())
          );
        }

        return JSON.stringify({
          total: results.slice(0, Number(limit)).length,
          projects: results.slice(0, Number(limit)),
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`Tool ${toolName} error:`, error);
    return JSON.stringify({ error: `Failed to execute ${toolName}`, details: String(error) });
  }
}

export async function POST(request: NextRequest) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const coperniqApiKey = process.env.COPERNIQ_API_KEY;

  if (!anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const { messages, model: modelAlias = DEFAULT_MODEL } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Resolve model alias to full model ID
    const modelId = AVAILABLE_MODELS[modelAlias] || AVAILABLE_MODELS[DEFAULT_MODEL];

    console.log(`Chat request using model: ${modelAlias} -> ${modelId}`);

    // Build conversation with any existing messages
    let conversationMessages: Array<{ role: string; content: unknown }> = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Agentic loop: Keep calling Claude until we get a final text response
    let finalResponse = '';
    let loopCount = 0;
    const MAX_LOOPS = 5;

    while (loopCount < MAX_LOOPS) {
      loopCount++;

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: coperniqApiKey ? TOOLS : [], // Only include tools if Coperniq is configured
          messages: conversationMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();

      // Check stop_reason to determine next action
      if (data.stop_reason === 'end_turn') {
        // Claude finished - extract text
        const textBlock = data.content?.find((block: { type: string }) => block.type === 'text');
        finalResponse = textBlock?.text || 'I apologize, but I could not generate a response.';
        break;
      }

      if (data.stop_reason === 'tool_use') {
        // Claude wants to use a tool - execute it and continue
        const toolUseBlocks = data.content?.filter((block: { type: string }) => block.type === 'tool_use') || [];

        if (toolUseBlocks.length === 0) {
          // No tool blocks found, extract any text
          const textBlock = data.content?.find((block: { type: string }) => block.type === 'text');
          finalResponse = textBlock?.text || 'I apologize, but I could not generate a response.';
          break;
        }

        // Add assistant's response to conversation
        conversationMessages.push({
          role: 'assistant',
          content: data.content,
        });

        // Execute each tool and collect results
        const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];

        for (const toolBlock of toolUseBlocks) {
          console.log(`Executing tool: ${toolBlock.name}`, toolBlock.input);

          const result = await executeTool(
            toolBlock.name,
            toolBlock.input || {},
            coperniqApiKey || ''
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result,
          });
        }

        // Add tool results to conversation
        conversationMessages.push({
          role: 'user',
          content: toolResults,
        });

        console.log(`Tool loop ${loopCount}: Executed ${toolResults.length} tools, continuing...`);
      } else {
        // Unknown stop_reason or max_tokens - extract what we have
        const textBlock = data.content?.find((block: { type: string }) => block.type === 'text');
        finalResponse = textBlock?.text || 'I apologize, but I ran into a limit processing your request.';
        break;
      }
    }

    if (loopCount >= MAX_LOOPS && !finalResponse) {
      finalResponse = 'I apologize, but I reached the maximum number of operations. Please try a simpler request.';
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: finalResponse,
      },
      toolsUsed: loopCount > 1,
      model: modelId,
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
