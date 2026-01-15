// ============================================================================
// Kipper Energy Solutions - Type Definitions
// ============================================================================

// Agent Types
export type AgentStatus = 'online' | 'busy' | 'offline';

export interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: AgentStatus;
  activeTasks: number;
  lastActivity?: string;
  description?: string;
  trade?: TradeName;
  systemPrompt?: string;
}

// Chat Types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  model?: 'claude-opus-4.5' | 'claude-sonnet-4.5' | 'claude-haiku-4.5';
  sessionId?: string;
}

export interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model?: string;
}

// Work Order Types
export type WorkOrderStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TradeName = 'HVAC' | 'Plumbing' | 'Electrical' | 'Solar' | 'Fire Protection';

export interface WorkOrder {
  id: string;
  title: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  trade: TradeName;
  customer: string;
  address?: string;
  scheduledDate?: string;
  createdAt: string;
  technicianId?: string;
  technicianName?: string;
}

// Contact Types
export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address?: string;
  createdAt: string;
}

// Asset Types
export interface Asset {
  id: string;
  make: string;
  model: string;
  serialNumber?: string;
  installDate?: string;
  warrantyEnd?: string;
  siteId?: string;
  siteName?: string;
}

// Voice AI Types
export type CallStatus = 'ringing' | 'active' | 'on_hold' | 'ended';
export type CallDirection = 'inbound' | 'outbound';

export interface VoiceCall {
  id: string;
  callerName: string;
  callerPhone: string;
  direction: CallDirection;
  status: CallStatus;
  duration: number;
  startTime: string;
  agentId?: string;
  transcriptPreview?: string;
}

// Quick Action Types
export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  description?: string;
  query: string;
}

// Stats Types
export interface DashboardStats {
  activeCalls: number;
  openWorkOrders: number;
  scheduledToday: number;
  completedToday: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
