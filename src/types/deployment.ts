import { ModelMetadata } from './models'
import { Organization } from '@/contexts/HuggingFaceAuth'

export interface DeploymentRequest {
  modelId: string
  organization: Organization
  templateId?: string
  scaling?: DeploymentScaling
  customConfig?: DeploymentCustomConfig
  estimatedUsage?: UsageEstimate
}

export interface DeploymentScaling {
  minReplicas: number
  maxReplicas: number
  autoScale: boolean
  scaleDownDelay?: number
  targetUtilization?: number
}

export interface DeploymentCustomConfig {
  gpuType?: string
  memoryLimit?: number
  timeout?: number
  envVars?: Record<string, string>
  quantization?: 'none' | 'awq' | 'gptq' | 'bnb'
}

export interface UsageEstimate {
  dailyRequests: number
  avgTokensPerRequest: number
  peakHoursPerDay: number
  expectedConcurrentUsers: number
}

export interface DeploymentResult {
  deploymentId: string
  endpointId: string
  endpointUrl: string
  status: DeploymentStatus
  model: ModelMetadata
  configuration: DeploymentConfiguration
  cost: DeploymentCost
  monitoring: DeploymentMonitoring
  createdAt: string
  estimatedReadyTime: number
}

export type DeploymentStatus =
  | 'creating'
  | 'building'
  | 'deploying'
  | 'running'
  | 'scaling'
  | 'stopped'
  | 'failed'
  | 'terminated'

export interface DeploymentConfiguration {
  templateId: string
  containerImage: string
  gpuType: string
  gpuCount: number
  memoryGB: number
  scaling: DeploymentScaling
  envVars: Record<string, string>
  ports: number[]
  healthCheck: HealthCheckConfig
  scalerSettings?: {
    min: number;
    max: number;
  };
  networkSettings?: {
    ports?: number[];
    allowedPorts?: number[];
  };
}

export interface HealthCheckConfig {
  path: string
  interval: number
  timeout: number
  retries: number
  initialDelay: number
}

export interface DeploymentCost {
  hourlyRate: number
  dailyEstimate: number
  monthlyEstimate: number
  actualSpend: number
  currency: 'USD'
  breakdown: {
    compute: number
    storage: number
    bandwidth: number
    other: number
  }
}

export interface DeploymentMonitoring {
  status: DeploymentStatus
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  workers: {
    total: number
    ready: number
    busy: number
    idle: number
    failed: number
  }
  performance: {
    requestsPerSecond: number
    avgResponseTime: number
    p95ResponseTime: number
    errorRate: number
    uptime: number
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
    gpuUsage: number
    diskUsage: number
  }
  lastActivity: string
  lastHealthCheck: string
}

export interface DeploymentAction {
  type: 'start' | 'stop' | 'restart' | 'scale' | 'update' | 'terminate'
  parameters?: Record<string, any>
  reason?: string
}

export interface DeploymentLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: 'system' | 'container' | 'user'
  deploymentId: string
  metadata?: Record<string, any>
}

export interface DeploymentEvent {
  id: string
  deploymentId: string
  type: 'status_change' | 'scaling' | 'health_change' | 'cost_alert' | 'performance_alert'
  timestamp: string
  data: any
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface DeploymentStats {
  totalDeployments: number
  activeDeployments: number
  failedDeployments: number
  totalCost: number
  averageUptime: number
  totalRequests: number
  organizationBreakdown: {
    [key in Organization]: {
      deployments: number
      cost: number
      uptime: number
    }
  }
}

export interface DeploymentTemplate {
  id: string
  name: string
  description: string
  framework: 'vllm' | 'sglang' | 'transformers'
  supportedModels: string[]
  gpuRequirements: {
    minMemory: number
    recommendedMemory: number
    supportedTypes: string[]
  }
  costEstimate: {
    hourly: number
    monthly: number
  }
  features: string[]
  limitations: string[]
}

// API Response types
export interface DeploymentListResponse {
  deployments: DeploymentResult[]
  total: number
  page: number
  limit: number
  stats: DeploymentStats
}

export interface DeploymentCreationResponse {
  success: boolean
  deployment?: DeploymentResult
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Real-time updates
export interface DeploymentUpdate {
  deploymentId: string
  status?: DeploymentStatus
  monitoring?: Partial<DeploymentMonitoring>
  cost?: Partial<DeploymentCost>
  timestamp: string
}

// Utilities
export type DeploymentFilter = {
  status?: DeploymentStatus[]
  organization?: Organization[]
  model?: string[]
  dateRange?: {
    start: string
    end: string
  }
  costRange?: {
    min: number
    max: number
  }
}

export type DeploymentSort = {
  field: 'createdAt' | 'status' | 'cost' | 'uptime' | 'requests'
  order: 'asc' | 'desc'
}

export default DeploymentResult