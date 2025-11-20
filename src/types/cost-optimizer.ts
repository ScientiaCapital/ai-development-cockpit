/**
 * Cost Optimizer Type Definitions
 *
 * TypeScript interfaces for the ai-cost-optimizer integration.
 * Implements intelligent multi-LLM routing with cost optimization.
 */

import { Organization } from '@/contexts/HuggingFaceAuth'

// Re-export Organization type for use by other modules
export type { Organization }

/**
 * Cost optimization tiers for model routing
 */
export type CostTier = 'free' | 'mid' | 'premium'

/**
 * Supported LLM providers
 */
export type Provider =
  | 'gemini'      // Google Gemini Flash (free tier)
  | 'claude'      // Anthropic Claude (Haiku/Sonnet)
  | 'openrouter'  // OpenRouter (multi-model aggregator)
  | 'runpod'      // RunPod Chinese LLMs (Qwen, DeepSeek)
  | 'cerebras'    // Cerebras (experimental)

/**
 * Complexity analysis result for a prompt
 * Determines which tier/model should handle the request
 */
export interface ComplexityScore {
  /** Overall complexity score (0-100) */
  score: number

  /** Number of tokens in the prompt */
  tokenCount: number

  /** Whether prompt contains complex keywords (explain, design, analyze, etc.) */
  hasComplexKeywords: boolean

  /** Estimated processing latency in milliseconds */
  estimatedLatency: number

  /** Recommended cost tier based on analysis */
  recommendedTier: CostTier

  /** Recommended provider for this request */
  recommendedProvider: Provider

  /** Confidence score for the recommendation (0-1) */
  confidence: number

  /** Keywords found that influenced the complexity score */
  detectedKeywords?: string[]

  /** Reasoning for the recommendation (for debugging) */
  reasoning?: string
}

/**
 * Configuration for a specific LLM provider
 */
export interface ProviderConfig {
  /** Provider identifier */
  name: Provider

  /** Cost tier classification */
  tier: CostTier

  /** Display name for UI */
  displayName: string

  /** Cost per 1M input tokens (USD) */
  costPerInputToken: number

  /** Cost per 1M output tokens (USD) */
  costPerOutputToken: number

  /** Maximum tokens this provider can handle */
  maxTokens: number

  /** Whether this provider is currently enabled */
  enabled: boolean

  /** Average latency in milliseconds */
  averageLatency: number

  /** Specific models available from this provider */
  models: {
    /** Model identifier */
    id: string

    /** Model display name */
    name: string

    /** Whether this model is recommended for production */
    recommended: boolean
  }[]

  /** Provider-specific configuration */
  config?: {
    apiKey?: string
    endpoint?: string
    organization?: string
    [key: string]: any
  }
}

/**
 * Request for optimized LLM completion
 */
export interface OptimizationRequest {
  /** User's prompt/query */
  prompt: string

  /** Organization making the request */
  organizationId: Organization

  /** User ID (if authenticated) */
  userId?: string

  /** Maximum tokens to generate */
  maxTokens?: number

  /** Temperature for generation (0-1) */
  temperature?: number

  /** Force specific provider (override auto-routing) */
  forceProvider?: Provider

  /** Force specific cost tier (override auto-routing) */
  forceTier?: CostTier

  /** System message/context */
  systemMessage?: string

  /** Conversation history for context */
  conversationHistory?: {
    role: 'user' | 'assistant' | 'system'
    content: string
  }[]

  /** Whether to stream the response */
  stream?: boolean

  /** Additional metadata */
  metadata?: {
    [key: string]: any
  }
}

/**
 * Response from optimized LLM completion
 */
export interface OptimizationResponse {
  /** Generated content */
  content: string

  /** Model that generated the response */
  model: string

  /** Provider that handled the request */
  provider: Provider

  /** Cost tier used */
  tier: CostTier

  /** Token usage details */
  tokensUsed: {
    /** Input/prompt tokens */
    input: number

    /** Output/completion tokens */
    output: number

    /** Total tokens (input + output) */
    total: number
  }

  /** Cost breakdown */
  cost: {
    /** Input token cost (USD) */
    input: number

    /** Output token cost (USD) */
    output: number

    /** Total cost (USD) */
    total: number
  }

  /** Actual processing latency in milliseconds */
  latency: number

  /** Cost savings compared to default model (USD) */
  savings: number

  /** Savings percentage compared to default model */
  savingsPercentage: number

  /** Complexity analysis that determined routing */
  complexityAnalysis: ComplexityScore

  /** Request timestamp */
  timestamp: string

  /** Unique request ID for tracking */
  requestId: string

  /** Whether response was cached */
  cached: boolean

  /** Finish reason (completed, length, stop, etc.) */
  finishReason?: string
}

/**
 * Cost statistics and analytics
 */
export interface CostStats {
  /** Organization these stats belong to */
  organizationId: Organization

  /** Time period for these stats */
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'all-time'

  /** Start of period (ISO string) */
  periodStart: string

  /** End of period (ISO string) */
  periodEnd: string

  /** Total number of requests */
  totalRequests: number

  /** Total cost across all requests (USD) */
  totalCost: number

  /** Average cost per request (USD) */
  averageCost: number

  /** Average latency across all requests (ms) */
  averageLatency: number

  /** Breakdown by provider */
  providerBreakdown: {
    [provider in Provider]?: {
      /** Number of requests to this provider */
      requests: number

      /** Total cost for this provider (USD) */
      cost: number

      /** Average latency for this provider (ms) */
      averageLatency: number

      /** Token usage */
      tokens: {
        input: number
        output: number
        total: number
      }
    }
  }

  /** Breakdown by cost tier */
  tierBreakdown: {
    [tier in CostTier]?: {
      requests: number
      cost: number
      percentage: number
    }
  }

  /** Total savings compared to non-optimized routing (USD) */
  totalSavings: number

  /** Savings percentage */
  savingsPercentage: number

  /** Budget information */
  budget: {
    /** Daily budget limit (USD) */
    dailyLimit: number

    /** Monthly budget limit (USD) */
    monthlyLimit: number

    /** Current daily spend (USD) */
    dailySpend: number

    /** Current monthly spend (USD) */
    monthlySpend: number

    /** Percentage of daily budget used */
    dailyPercentage: number

    /** Percentage of monthly budget used */
    monthlyPercentage: number

    /** Whether budget alerts are enabled */
    alertsEnabled: boolean
  }

  /** Most expensive requests */
  topExpensiveRequests?: {
    requestId: string
    cost: number
    provider: Provider
    timestamp: string
  }[]

  /** Request distribution by hour (for daily stats) */
  hourlyDistribution?: {
    hour: number
    requests: number
    cost: number
  }[]
}

/**
 * Cost tracking database record
 */
export interface CostTrackingRecord {
  /** Unique record ID */
  id: string

  /** Organization ID */
  organizationId: Organization

  /** User ID (if authenticated) */
  userId?: string

  /** Request ID for correlation */
  requestId: string

  /** Prompt text (truncated for storage) */
  promptText: string

  /** Prompt token count */
  promptTokens: number

  /** Completion token count */
  completionTokens: number

  /** Total tokens */
  totalTokens: number

  /** Model used */
  modelUsed: string

  /** Provider used */
  provider: Provider

  /** Cost tier */
  tier: CostTier

  /** Complexity score that determined routing */
  complexityScore: number

  /** Cost in USD */
  costUsd: number

  /** Processing latency in milliseconds */
  latencyMs: number

  /** Timestamp of request */
  createdAt: string

  /** Whether response was cached */
  cached: boolean

  /** Additional metadata */
  metadata?: {
    [key: string]: any
  }
}

/**
 * Cost optimizer configuration
 */
export interface CostOptimizerConfig {
  /** Whether cost optimizer is enabled */
  enabled: boolean

  /** Default tier when routing is unclear */
  defaultTier: CostTier

  /** Token count threshold for simple vs complex classification */
  complexityThreshold: number

  /** Daily budget limit in USD */
  dailyBudget: number

  /** Monthly budget limit in USD */
  monthlyBudget: number

  /** Whether to enable cost alerts */
  enableAlerts: boolean

  /** Cost alert webhook URL */
  alertWebhook?: string

  /** Target savings percentage */
  savingsTarget: number

  /** Provider configurations */
  providers: ProviderConfig[]

  /** Cache configuration */
  cache: {
    enabled: boolean
    ttl: number
  }
}

/**
 * Cost alert event
 */
export interface CostAlert {
  /** Alert type */
  type: 'daily_budget' | 'monthly_budget' | 'cost_spike' | 'provider_failure'

  /** Alert severity */
  severity: 'info' | 'warning' | 'critical'

  /** Alert message */
  message: string

  /** Organization affected */
  organizationId: Organization

  /** Current stats that triggered alert */
  stats: {
    dailySpend: number
    monthlySpend: number
    dailyLimit: number
    monthlyLimit: number
  }

  /** Timestamp */
  timestamp: string

  /** Recommended action */
  recommendation?: string
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  /** Provider name */
  provider: Provider

  /** Health status */
  status: 'healthy' | 'degraded' | 'unhealthy'

  /** Response time in milliseconds */
  responseTime: number

  /** Success rate (0-1) */
  successRate: number

  /** Error count in last hour */
  errorCount: number

  /** Last successful request */
  lastSuccess?: string

  /** Last error */
  lastError?: {
    message: string
    timestamp: string
  }
}

/**
 * Optimization recommendation (preview without execution)
 */
export interface OptimizationRecommendation {
  /** Recommended provider */
  provider: Provider

  /** Recommended tier */
  tier: CostTier

  /** Recommended model */
  model: string

  /** Estimated cost (USD) */
  estimatedCost: number

  /** Estimated latency (ms) */
  estimatedLatency: number

  /** Estimated savings vs default (USD) */
  estimatedSavings: number

  /** Complexity analysis */
  complexityAnalysis: ComplexityScore

  /** Alternative options */
  alternatives: {
    provider: Provider
    tier: CostTier
    model: string
    cost: number
    latency: number
    tradeoffs: string[]
  }[]
}
