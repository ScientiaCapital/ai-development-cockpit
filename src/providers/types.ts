/**
 * Provider System Types
 *
 * Type definitions for the multi-model provider system enabling intelligent
 * routing between different LLM providers (Claude 4.5, Qwen, DeepSeek, Gemini).
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.1
 * Created: 2025-11-17
 */

/**
 * Provider capabilities configuration
 *
 * Defines what features a provider supports to enable intelligent routing.
 */
export interface ProviderCapabilities {
  /** Can process images and PDFs */
  vision: boolean

  /** Supports structured JSON output */
  jsonMode: boolean

  /** Supports streaming responses */
  streaming: boolean

  /** Maximum context window size in tokens */
  contextWindow: number

  /** Supports function/tool calling */
  functionCalling: boolean
}

/**
 * Token usage statistics
 *
 * Tracks token consumption for cost calculation and monitoring.
 */
export interface TokenUsage {
  /** Number of input tokens consumed */
  inputTokens: number

  /** Number of output tokens generated */
  outputTokens: number

  /** Total tokens (input + output) */
  totalTokens: number
}

/**
 * Cost breakdown by token type
 *
 * Detailed cost information for a completion request.
 */
export interface CostBreakdown {
  /** Cost of input tokens in USD */
  inputCost: number

  /** Cost of output tokens in USD */
  outputCost: number

  /** Total cost in USD */
  totalCost: number

  /** Token usage that generated this cost */
  tokensUsed: TokenUsage
}

/**
 * Standard completion parameters
 *
 * Base parameters for text completion requests.
 */
export interface CompletionParams {
  /** The prompt/user message */
  prompt: string

  /** System prompt (optional) */
  systemPrompt?: string

  /** Sampling temperature (0.0 - 2.0) */
  temperature?: number

  /** Maximum tokens to generate */
  maxTokens?: number

  /** Stop sequences */
  stopSequences?: string[]

  /** Top-p sampling (0.0 - 1.0) */
  topP?: number

  /** Top-k sampling */
  topK?: number

  /** Enable JSON mode for structured output */
  jsonMode?: boolean

  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>
}

/**
 * Vision-specific parameters
 *
 * Parameters for completion requests that include images or PDFs.
 */
export interface VisionParams extends CompletionParams {
  /** Array of images or PDFs to process */
  images: Array<{
    /** Base64-encoded data or URL */
    data: string

    /** MIME type (image/jpeg, image/png, application/pdf) */
    mimeType: string
  }>
}

/**
 * Completion result
 *
 * Standard result format from all providers.
 */
export interface CompletionResult {
  /** Generated text response */
  text: string

  /** Reason the completion finished */
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_use'

  /** Token usage for this completion */
  tokensUsed: TokenUsage

  /** Model ID used for this completion */
  model: string

  /** Provider name */
  provider: string

  /** Additional metadata from provider */
  metadata?: Record<string, unknown>
}

/**
 * Provider model information
 *
 * Details about a specific model offered by a provider.
 */
export interface ModelInfo {
  /** Model ID (e.g., "claude-sonnet-4-5-20250929") */
  id: string

  /** Human-readable model name */
  name: string

  /** Provider offering this model */
  provider: string

  /** Capabilities of this model */
  capabilities: ProviderCapabilities

  /** Pricing per million tokens */
  costPerMillionTokens: {
    input: number
    output: number
  }
}

/**
 * Task types for intelligent model routing
 *
 * Categorizes requests to enable optimal model selection.
 */
export type TaskType =
  | 'vision'              // Image/PDF processing
  | 'orchestration'       // Complex reasoning, planning
  | 'code-generation'     // Code generation
  | 'test-generation'     // Test generation
  | 'simple-completion'   // Simple text completion
  | 'json-generation'     // Structured JSON output

/**
 * Task complexity levels
 *
 * Used to route to appropriate model tiers.
 */
export type TaskComplexity = 'simple' | 'medium' | 'complex'

/**
 * Router context for provider selection
 *
 * Information used by the model router to select the optimal provider/model.
 */
export interface RouterContext {
  /** Type of task being performed */
  task: TaskType

  /** Complexity level of the task */
  complexity: TaskComplexity

  /** Prefer cheaper models when possible */
  preferCost?: boolean

  /** Requires vision capability */
  requireVision?: boolean

  /** Requires JSON mode */
  requireJSON?: boolean

  /** Maximum acceptable latency in milliseconds */
  maxLatency?: number

  /** Additional routing hints */
  metadata?: Record<string, unknown>
}
