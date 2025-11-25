/**
 * TypeScript interfaces for RunPod vLLM API integration
 * Supports both RunPod Native API and OpenAI-compatible endpoints
 */

export interface VLLMConfig {
  endpointId: string
  apiKey: string
  modelName?: string
  baseUrl?: string
  timeout?: number
  retries?: number
}

// === RunPod Native API Types ===

export interface RunPodNativeRequest {
  input: {
    prompt: string
    max_tokens?: number
    temperature?: number
    top_p?: number
    top_k?: number
    repetition_penalty?: number
    presence_penalty?: number
    frequency_penalty?: number
    stop?: string | string[]
    stream?: boolean
    [key: string]: any
  }
}

export interface RunPodNativeResponse {
  id?: string
  status?: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  output?: Array<{
    choices: Array<{
      text: string
      index: number
      finish_reason: string
    }>
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
  }>
  error?: string
}

export interface RunPodJobStatus {
  id: string
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  output?: any
  error?: string
  executionTime?: number
  retries?: number
}

// === OpenAI-Compatible API Types ===

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  stream?: boolean
  user?: string
}

export interface ChatCompletionChoice {
  index: number
  message: {
    role: 'assistant'
    content: string
  }
  finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | null
}

export interface ChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: ChatCompletionChoice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ChatCompletionStreamChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: 'assistant'
      content?: string
    }
    finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | null
  }>
}

// === Unified Inference Types ===

export interface InferenceRequest {
  prompt: string
  messages?: ChatMessage[]
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
  repetitionPenalty?: number
  presencePenalty?: number
  frequencyPenalty?: number
  stop?: string | string[]
  stream?: boolean
  apiType?: 'native' | 'openai'
}

export interface InferenceResponse {
  id: string
  text: string
  finishReason: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  timestamp: string
  latency: number
}

export interface StreamingInferenceResponse {
  id: string
  chunk: string
  isComplete: boolean
  finishReason?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  timestamp: string
}

// === Error Types ===

export interface VLLMError {
  type: 'auth' | 'rate_limit' | 'quota' | 'timeout' | 'server' | 'network' | 'validation'
  message: string
  code?: string | number
  details?: any
  retryable: boolean
}

// === Usage and Metrics Types ===

export interface InferenceMetrics {
  requestId: string
  endpointId: string
  model: string
  startTime: number
  endTime: number
  latency: number
  tokensPerSecond: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: {
    promptCost: number
    completionCost: number
    totalCost: number
  }
  success: boolean
  error?: VLLMError
}

export interface UsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalTokens: number
  totalCost: number
  averageLatency: number
  averageTokensPerSecond: number
  costBreakdown: {
    promptCosts: number
    completionCosts: number
  }
  timeRange: {
    start: string
    end: string
  }
}

// === Configuration Types ===

export interface ModelConfiguration {
  endpointId: string
  modelName: string
  displayName: string
  description: string
  maxTokens: number
  contextLength: number
  pricing: {
    promptTokenPrice: number
    completionTokenPrice: number
    currency: 'USD'
  }
  capabilities: {
    streaming: boolean
    functionCalling: boolean
    codeGeneration: boolean
    multiModal: boolean
  }
  organization: 'arcade' | 'enterprise'
  status: 'active' | 'inactive' | 'deploying' | 'error'
}

export interface InferenceSettings {
  defaultMaxTokens: number
  defaultTemperature: number
  defaultTopP: number
  streamingEnabled: boolean
  retryAttempts: number
  timeoutMs: number
  apiType: 'native' | 'openai' | 'auto'
  enableUsageTracking: boolean
  enableCaching: boolean
}

// === Event Types ===

export interface InferenceEvent {
  type: 'start' | 'chunk' | 'complete' | 'error'
  requestId: string
  data: any
  timestamp: number
}

export type InferenceEventHandler = (event: InferenceEvent) => void

// === Utility Types ===

export interface APIEndpoint {
  native: string
  openai: string
  status: string
}

export interface ConnectionStatus {
  connected: boolean
  latency?: number
  lastChecked: string
  error?: string
}