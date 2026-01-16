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
// Order Type - distinguishes dispatch source/workflow
export type OrderType = 'work' | 'office' | 'field';

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  trade: TradeName;
  orderType: OrderType; // work=dispatched, office=admin, field=tech-created
  customer: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  scheduledDate?: string;
  createdAt: string;
  technicianId?: string;
  technicianName?: string;
  equipment?: string[];
  notes?: string;
  forms?: { name: string; status: string }[];
  photos?: string[];
  serviceHistory?: { date: string; description: string }[];
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
export type QuickActionType = 'chat' | 'panel' | 'modal' | 'vision';
export type PanelViewType = 'workorders' | 'schedule' | 'customers' | 'projects' | 'requests' | 'invoices' | 'vision';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  description?: string;
  query: string;
  actionType?: QuickActionType;  // Default: 'chat'
  panelView?: PanelViewType;      // For actionType: 'panel'
  filter?: string;                // Optional filter for panel views
}

// Stats Types - Industry-Relevant KPIs for C&I/Industrial MEP Contractors
export interface DashboardStats {
  // Operational KPIs
  openWorkOrders: number;
  scheduledToday: number;
  completedToday: number;
  completedThisWeek: number;

  // Financial KPIs
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  arOver30Days: number;

  // Efficiency KPIs (critical for field service)
  firstTimeFixRate: number; // % - target >80%
  avgResponseTime: number; // hours
  techUtilization: number; // % - target 75-85%

  // Pipeline KPIs
  activeProjects: number;
  pendingEstimates: number;
  openServiceCalls: number;

  // Inventory
  catalogItemCount: number;
  lowStockItems: number;

  // Legacy (for backward compat)
  activeCalls?: number;
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
