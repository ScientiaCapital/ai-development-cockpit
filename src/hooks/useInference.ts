'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { VLLMService } from '../services/runpod/vllm.service'
import { useOrganization } from './useOrganization'
import {
  InferenceRequest,
  InferenceResponse,
  StreamingInferenceResponse,
  ChatMessage,
  VLLMConfig,
  ModelConfiguration,
  InferenceMetrics,
  VLLMError
} from '../types/vllm'

interface ModelOption {
  id: string
  name: string
  displayName: string
  organization: 'arcade' | 'enterprise'
  costPerToken: number
  description: string
  capabilities: string[]
  contextLength: number
  maxTokens: number
  recommended: 'simple' | 'complex' | 'enterprise'
}

interface UseInferenceOptions {
  autoScale?: boolean
  preferredCostTier?: 'low' | 'medium' | 'high'
  enableMetrics?: boolean
  streamingEnabled?: boolean
}

interface InferenceState {
  isLoading: boolean
  isStreaming: boolean
  error: VLLMError | null
  currentModel: ModelOption | null
  metrics: InferenceMetrics[]
  totalCost: number
  requestCount: number
}

interface UseInferenceReturn {
  // State
  state: InferenceState

  // Model management
  models: ModelOption[]
  setModel: (model: ModelOption) => void
  getRecommendedModel: (taskComplexity: 'simple' | 'complex' | 'enterprise') => ModelOption

  // Inference operations
  generateText: (request: Omit<InferenceRequest, 'apiType'>) => Promise<InferenceResponse | null>
  generateStreamingText: (
    request: Omit<InferenceRequest, 'apiType' | 'stream'>,
    onChunk: (chunk: StreamingInferenceResponse) => void
  ) => Promise<void>

  // Utility functions
  estimateCost: (prompt: string, maxTokens: number, model?: ModelOption) => number
  clearMetrics: () => void
  scaleEndpoint: (targetCapacity: 'minimal' | 'standard' | 'high') => Promise<boolean>

  // Chat helpers
  formatMessagesForModel: (messages: ChatMessage[], systemPrompt?: string) => ChatMessage[]
}

// Model configurations optimized for different use cases
const COCKPIT_STACKS_MODELS: ModelOption[] = [
  {
    id: 'meta-llama/Llama-3.2-3B-Instruct',
    name: 'llama-3.2-3b-swaggy',
    displayName: 'Llama 3.2 3B (Dev Mode)',
    organization: 'arcade',
    costPerToken: 0.0001,
    description: 'Fast coding assistant for rapid development',
    capabilities: ['code', 'debugging', 'quick-tasks'],
    contextLength: 4096,
    maxTokens: 2048,
    recommended: 'simple'
  },
  {
    id: 'microsoft/DialoGPT-medium',
    name: 'dialogpt-medium-swaggy',
    displayName: 'DialoGPT Medium (Terminal Chat)',
    organization: 'arcade',
    costPerToken: 0.0002,
    description: 'Terminal-style conversational AI for developers',
    capabilities: ['chat', 'multi-turn', 'context-aware'],
    contextLength: 8192,
    maxTokens: 4096,
    recommended: 'complex'
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'mistral-7b-swaggy',
    displayName: 'Mistral 7B (Full Stack)',
    organization: 'arcade',
    costPerToken: 0.0003,
    description: 'Advanced reasoning and complex code generation',
    capabilities: ['code', 'reasoning', 'architecture', 'debugging'],
    contextLength: 16384,
    maxTokens: 8192,
    recommended: 'enterprise'
  }
]

const SCIENTIA_CAPITAL_MODELS: ModelOption[] = [
  {
    id: 'meta-llama/Llama-3.2-3B-Instruct',
    name: 'llama-3.2-3b-scientia',
    displayName: 'Llama 3.2 3B (Analytics)',
    organization: 'enterprise',
    costPerToken: 0.0001,
    description: 'Quick financial data analysis and reporting',
    capabilities: ['analysis', 'data-processing', 'simple-queries'],
    contextLength: 4096,
    maxTokens: 2048,
    recommended: 'simple'
  },
  {
    id: 'microsoft/DialoGPT-medium',
    name: 'dialogpt-medium-scientia',
    displayName: 'DialoGPT Medium (Client Consultation)',
    organization: 'enterprise',
    costPerToken: 0.0002,
    description: 'Professional client interaction and advisory',
    capabilities: ['consultation', 'explanation', 'professional-communication'],
    contextLength: 8192,
    maxTokens: 4096,
    recommended: 'complex'
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'mistral-7b-scientia',
    displayName: 'Mistral 7B (Strategic Analysis)',
    organization: 'enterprise',
    costPerToken: 0.0003,
    description: 'Deep financial analysis and strategic planning',
    capabilities: ['strategic-analysis', 'complex-reasoning', 'market-analysis'],
    contextLength: 16384,
    maxTokens: 8192,
    recommended: 'enterprise'
  }
]

export function useInference(options: UseInferenceOptions = {}): UseInferenceReturn {
  const { currentOrganization } = useOrganization()
  const {
    autoScale = true,
    preferredCostTier = 'medium',
    enableMetrics = true,
    streamingEnabled = true
  } = options

  // State management
  const [state, setState] = useState<InferenceState>({
    isLoading: false,
    isStreaming: false,
    error: null,
    currentModel: null,
    metrics: [],
    totalCost: 0,
    requestCount: 0
  })

  // Service instances
  const vllmServices = useRef<Map<string, VLLMService>>(new Map())
  const metricsBuffer = useRef<InferenceMetrics[]>([])

  // Get models based on current organization
  const models = currentOrganization?.slug === 'arcade'
    ? COCKPIT_STACKS_MODELS
    : SCIENTIA_CAPITAL_MODELS

  // Initialize default model based on organization and cost preference
  useEffect(() => {
    if (!state.currentModel && models.length > 0) {
      let defaultModel: ModelOption

      switch (preferredCostTier) {
        case 'low':
          defaultModel = models.find(m => m.recommended === 'simple') || models[0]
          break
        case 'high':
          defaultModel = models.find(m => m.recommended === 'enterprise') || models[models.length - 1]
          break
        default:
          defaultModel = models.find(m => m.recommended === 'complex') || models[1] || models[0]
      }

      setState(prev => ({ ...prev, currentModel: defaultModel }))
    }
  }, [models, preferredCostTier, state.currentModel])

  // Initialize vLLM service for a model
  const getVLLMService = useCallback((model: ModelOption): VLLMService => {
    const serviceKey = `${model.organization}-${model.name}`

    if (!vllmServices.current.has(serviceKey)) {
      const config: VLLMConfig = {
        endpointId: process.env.NEXT_PUBLIC_RUNPOD_ENDPOINT_ID || '',
        apiKey: process.env.RUNPOD_API_KEY || '',
        modelName: model.name,
        timeout: parseInt(process.env.VLLM_TIMEOUT || '120000'),
        retries: parseInt(process.env.VLLM_RETRIES || '3')
      }

      // Use organization-specific tokens if available
      if (model.organization === 'arcade') {
        config.apiKey = process.env.COCKPITSTACKS_HF_TOKEN || config.apiKey
      } else if (model.organization === 'enterprise') {
        config.apiKey = process.env.ENTERPRISE_HF_TOKEN || config.apiKey
      }

      vllmServices.current.set(serviceKey, new VLLMService(config))
    }

    return vllmServices.current.get(serviceKey)!
  }, [])

  // Set current model
  const setModel = useCallback((model: ModelOption) => {
    setState(prev => ({ ...prev, currentModel: model, error: null }))
  }, [])

  // Get recommended model based on task complexity
  const getRecommendedModel = useCallback((taskComplexity: 'simple' | 'complex' | 'enterprise'): ModelOption => {
    const recommendedModel = models.find(m => m.recommended === taskComplexity)
    return recommendedModel || models[0]
  }, [models])

  // Estimate cost for a request
  const estimateCost = useCallback((prompt: string, maxTokens: number, model?: ModelOption): number => {
    const targetModel = model || state.currentModel
    if (!targetModel) return 0

    // Rough token estimation (4 characters per token average)
    const promptTokens = Math.ceil(prompt.length / 4)
    const totalTokens = promptTokens + maxTokens

    return totalTokens * targetModel.costPerToken
  }, [state.currentModel])

  // Scale RunPod endpoint capacity
  const scaleEndpoint = useCallback(async (targetCapacity: 'minimal' | 'standard' | 'high'): Promise<boolean> => {
    if (!autoScale) return true

    try {
      // In a real implementation, this would call RunPod's scaling API
      console.log(`Scaling endpoint to ${targetCapacity} capacity`)

      // Simulate scaling delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      return true
    } catch (error) {
      console.error('Failed to scale endpoint:', error)
      return false
    }
  }, [autoScale])

  // Format messages for model input
  const formatMessagesForModel = useCallback((messages: ChatMessage[], systemPrompt?: string): ChatMessage[] => {
    const formattedMessages: ChatMessage[] = []

    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt })
    }

    return [...formattedMessages, ...messages]
  }, [])

  // Add metrics tracking
  const addMetric = useCallback((metric: InferenceMetrics) => {
    if (!enableMetrics) return

    setState(prev => ({
      ...prev,
      metrics: [...prev.metrics.slice(-99), metric], // Keep last 100 metrics
      totalCost: prev.totalCost + metric.cost.totalCost,
      requestCount: prev.requestCount + 1
    }))
  }, [enableMetrics])

  // Generate text (non-streaming)
  const generateText = useCallback(async (request: Omit<InferenceRequest, 'apiType'>): Promise<InferenceResponse | null> => {
    if (!state.currentModel) {
      setState(prev => ({
        ...prev,
        error: {
          type: 'validation',
          message: 'No model selected',
          retryable: false
        }
      }))
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const service = getVLLMService(state.currentModel)
      const startTime = Date.now()

      // Auto-scale if needed
      if (autoScale) {
        const complexity = request.maxTokens && request.maxTokens > 4096 ? 'high' : 'standard'
        await scaleEndpoint(complexity)
      }

      const fullRequest: InferenceRequest = {
        ...request,
        apiType: 'openai', // Default to OpenAI-compatible for better chat support
        stream: false
      }

      const response = await service.generateText(fullRequest)

      // Track metrics
      if (enableMetrics) {
        const metric: InferenceMetrics = {
          requestId: response.id,
          endpointId: process.env.NEXT_PUBLIC_RUNPOD_ENDPOINT_ID || '',
          model: state.currentModel.displayName,
          startTime,
          endTime: Date.now(),
          latency: response.latency,
          tokensPerSecond: response.usage.totalTokens / (response.latency / 1000),
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          cost: {
            promptCost: response.usage.promptTokens * state.currentModel.costPerToken,
            completionCost: response.usage.completionTokens * state.currentModel.costPerToken,
            totalCost: response.usage.totalTokens * state.currentModel.costPerToken
          },
          success: true
        }
        addMetric(metric)
      }

      setState(prev => ({ ...prev, isLoading: false }))
      return response

    } catch (error) {
      const vllmError: VLLMError = {
        type: 'server',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      }

      setState(prev => ({ ...prev, isLoading: false, error: vllmError }))
      return null
    }
  }, [state.currentModel, getVLLMService, autoScale, scaleEndpoint, enableMetrics, addMetric])

  // Generate streaming text
  const generateStreamingText = useCallback(async (
    request: Omit<InferenceRequest, 'apiType' | 'stream'>,
    onChunk: (chunk: StreamingInferenceResponse) => void
  ): Promise<void> => {
    if (!state.currentModel) {
      setState(prev => ({
        ...prev,
        error: {
          type: 'validation',
          message: 'No model selected',
          retryable: false
        }
      }))
      return
    }

    setState(prev => ({ ...prev, isStreaming: true, error: null }))

    try {
      const service = getVLLMService(state.currentModel)

      // Auto-scale if needed
      if (autoScale) {
        const complexity = request.maxTokens && request.maxTokens > 4096 ? 'high' : 'standard'
        await scaleEndpoint(complexity)
      }

      const fullRequest: InferenceRequest = {
        ...request,
        apiType: 'openai',
        stream: true
      }

      await service.generateStreamingText(fullRequest, onChunk)

      setState(prev => ({ ...prev, isStreaming: false }))

    } catch (error) {
      const vllmError: VLLMError = {
        type: 'server',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      }

      setState(prev => ({ ...prev, isStreaming: false, error: vllmError }))
    }
  }, [state.currentModel, getVLLMService, autoScale, scaleEndpoint])

  // Clear metrics
  const clearMetrics = useCallback(() => {
    setState(prev => ({
      ...prev,
      metrics: [],
      totalCost: 0,
      requestCount: 0
    }))
  }, [])

  return {
    state,
    models,
    setModel,
    getRecommendedModel,
    generateText,
    generateStreamingText,
    estimateCost,
    clearMetrics,
    scaleEndpoint,
    formatMessagesForModel
  }
}