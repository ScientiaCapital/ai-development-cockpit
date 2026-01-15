/**
 * Agents API Route - Agent Status & Management
 *
 * Returns status of AI agents in the system.
 * Pattern from: langgraph-voice-agents architecture
 */

import { NextRequest, NextResponse } from 'next/server';

// Agent types based on langgraph-voice-agents patterns
type AgentStatus = 'online' | 'offline' | 'busy' | 'error';
type AgentType = 'voice' | 'chat' | 'vision' | 'dispatch';

interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  trade?: string;
  model?: string;
  lastActive?: string;
  capabilities: string[];
  metrics?: {
    tasksCompleted?: number;
    avgResponseTime?: number;
    successRate?: number;
  };
}

// Agent configurations - these would come from a database in production
const AGENTS: Agent[] = [
  {
    id: 'hvac-voice',
    name: 'HVAC Voice Agent',
    type: 'voice',
    status: 'online',
    description: 'Voice-enabled HVAC troubleshooting and scheduling assistant',
    trade: 'HVAC',
    model: 'claude-sonnet-4-5',
    capabilities: [
      'Equipment diagnostics',
      'Scheduling appointments',
      'Parts lookup',
      'Load calculations',
    ],
    lastActive: new Date().toISOString(),
    metrics: {
      tasksCompleted: 156,
      avgResponseTime: 1.2,
      successRate: 94.5,
    },
  },
  {
    id: 'dispatch-ai',
    name: 'Smart Dispatch',
    type: 'dispatch',
    status: 'online',
    description: 'AI-powered technician routing and scheduling optimization',
    model: 'claude-sonnet-4-5',
    capabilities: [
      'Route optimization',
      'Skill matching',
      'Priority scoring',
      'Real-time rescheduling',
    ],
    lastActive: new Date().toISOString(),
    metrics: {
      tasksCompleted: 89,
      avgResponseTime: 0.8,
      successRate: 97.2,
    },
  },
  {
    id: 'vision-inspector',
    name: 'Vision Inspector',
    type: 'vision',
    status: 'online',
    description: 'VLM-powered equipment recognition and blueprint analysis',
    model: 'qwen3-vl-30b',
    capabilities: [
      'Equipment identification',
      'Blueprint analysis',
      'Code compliance checking',
      'Serial number extraction',
    ],
    lastActive: new Date().toISOString(),
    metrics: {
      tasksCompleted: 234,
      avgResponseTime: 3.5,
      successRate: 89.1,
    },
  },
  {
    id: 'electrical-agent',
    name: 'Electrical Expert',
    type: 'chat',
    status: 'online',
    description: 'NEC code expert for panel inspections and load analysis',
    trade: 'Electrical',
    model: 'claude-sonnet-4-5',
    capabilities: [
      'NEC code lookup',
      'Load calculations',
      'Panel inspections',
      'Circuit tracing',
    ],
    lastActive: new Date().toISOString(),
    metrics: {
      tasksCompleted: 78,
      avgResponseTime: 1.5,
      successRate: 96.8,
    },
  },
  {
    id: 'plumbing-agent',
    name: 'Plumbing Pro',
    type: 'chat',
    status: 'offline',
    description: 'Plumbing diagnostics and backflow test management',
    trade: 'Plumbing',
    model: 'claude-sonnet-4-5',
    capabilities: [
      'Backflow testing',
      'Camera inspections',
      'Water heater service',
      'Drain diagnostics',
    ],
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    metrics: {
      tasksCompleted: 45,
      avgResponseTime: 1.8,
      successRate: 92.3,
    },
  },
  {
    id: 'solar-commissioning',
    name: 'Solar Commissioning',
    type: 'chat',
    status: 'online',
    description: 'Solar PV system commissioning and performance analysis',
    trade: 'Solar',
    model: 'claude-sonnet-4-5',
    capabilities: [
      'System commissioning',
      'Performance monitoring',
      'Interconnection support',
      'Warranty tracking',
    ],
    lastActive: new Date().toISOString(),
    metrics: {
      tasksCompleted: 112,
      avgResponseTime: 2.1,
      successRate: 95.6,
    },
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const trade = searchParams.get('trade');
  const status = searchParams.get('status');

  let filteredAgents = [...AGENTS];

  // Filter by type
  if (type) {
    filteredAgents = filteredAgents.filter((agent) => agent.type === type);
  }

  // Filter by trade
  if (trade) {
    filteredAgents = filteredAgents.filter((agent) => agent.trade === trade);
  }

  // Filter by status
  if (status) {
    filteredAgents = filteredAgents.filter((agent) => agent.status === status);
  }

  // Calculate summary stats
  const summary = {
    total: AGENTS.length,
    online: AGENTS.filter((a) => a.status === 'online').length,
    offline: AGENTS.filter((a) => a.status === 'offline').length,
    busy: AGENTS.filter((a) => a.status === 'busy').length,
    byType: {
      voice: AGENTS.filter((a) => a.type === 'voice').length,
      chat: AGENTS.filter((a) => a.type === 'chat').length,
      vision: AGENTS.filter((a) => a.type === 'vision').length,
      dispatch: AGENTS.filter((a) => a.type === 'dispatch').length,
    },
  };

  return NextResponse.json({
    agents: filteredAgents,
    summary,
  });
}

// Get single agent by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, action } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const agent = AGENTS.find((a) => a.id === agentId);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Handle actions (for future agent management)
    if (action === 'restart') {
      return NextResponse.json({
        message: `Agent ${agent.name} restart initiated`,
        agent: { ...agent, status: 'online' as AgentStatus },
      });
    }

    if (action === 'stop') {
      return NextResponse.json({
        message: `Agent ${agent.name} stopped`,
        agent: { ...agent, status: 'offline' as AgentStatus },
      });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to process agent request' },
      { status: 500 }
    );
  }
}
