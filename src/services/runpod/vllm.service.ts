/**
 * RunPod vLLM Service
 * Comprehensive service for interacting with RunPod vLLM deployments
 * Supports both RunPod Native API and OpenAI-compatible endpoints
 */

import {
  VLLMConfig,
  RunPodNativeRequest,
  RunPodNativeResponse,
  RunPodJobStatus,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamChunk,
  InferenceRequest,
  InferenceResponse,
  StreamingInferenceResponse,
  VLLMError,
  InferenceMetrics,
  ModelConfiguration,
  InferenceEvent,
  InferenceEventHandler,
  ConnectionStatus
} from '../../types/vllm'

export class VLLMService {
  private config: VLLMConfig
  private eventHandlers: Map<string, InferenceEventHandler[]> = new Map()
  private activeRequests: Map<string, AbortController> = new Map()
  private usageMetrics: InferenceMetrics[] = []

  constructor(config: VLLMConfig) {
    this.config = {
      baseUrl: 'https://api.runpod.ai/v2',
      timeout: 120000, // 2 minutes default
      retries: 3,
      ...config
    }
  }

  // === Connection and Health Checks ===

  async checkConnection(): Promise<ConnectionStatus> {
    const startTime = Date.now()

    try {
      const response = await this.makeRequest(
        `/${this.config.endpointId}/health`,
        'GET',
        undefined,
        10000 // 10 second timeout for health check
      )

      const latency = Date.now() - startTime

      return {
        connected: true,
        latency,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        connected: false,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // === RunPod Native API Methods ===

  async runInferenceNative(request: RunPodNativeRequest): Promise<RunPodNativeResponse> {
    const requestId = this.generateRequestId()
    const startTime = Date.now()

    try {
      this.emitEvent('start', requestId, { request })

      const response = await this.makeRequest<RunPodNativeResponse>(
        `/${this.config.endpointId}/run`,
        'POST',
        request
      )

      // Check if this is an async job
      if (response.id && !response.output) {
        return await this.pollJobStatus(response.id, requestId, startTime)
      }

      this.emitEvent('complete', requestId, { response })
      this.recordMetrics(requestId, startTime, request, response)

      return response
    } catch (error) {
      this.emitEvent('error', requestId, { error })
      throw this.createVLLMError(error)
    }
  }

  async runStreamingInferenceNative(
    request: RunPodNativeRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const requestId = this.generateRequestId()

    try {
      this.emitEvent('start', requestId, { request })

      // RunPod native streaming implementation
      const streamingRequest = {
        ...request,
        input: {
          ...request.input,
          stream: true
        }
      }

      await this.handleStreamingRequest(
        `/${this.config.endpointId}/run`,
        streamingRequest,
        onChunk,
        requestId
      )
    } catch (error) {
      this.emitEvent('error', requestId, { error })
      throw this.createVLLMError(error)
    }
  }

  private async pollJobStatus(
    jobId: string,
    requestId: string,
    startTime: number,
    maxAttempts: number = 60
  ): Promise<RunPodNativeResponse> {
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      try {
        const status = await this.makeRequest<RunPodJobStatus>(
          `/${this.config.endpointId}/status/${jobId}`,
          'GET'
        )

        if (status.status === 'COMPLETED') {
          const response: RunPodNativeResponse = {
            id: jobId,
            status: status.status,
            output: status.output
          }

          this.emitEvent('complete', requestId, { response })
          return response
        } else if (status.status === 'FAILED') {
          throw new Error(`Job failed: ${status.error || 'Unknown error'}`)
        }

        // Job still running, continue polling
        attempts++
      } catch (error) {
        throw error
      }
    }

    throw new Error(`Job polling timeout after ${maxAttempts} attempts`)
  }

  // === OpenAI-Compatible API Methods ===

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const requestId = this.generateRequestId()
    const startTime = Date.now()

    try {
      this.emitEvent('start', requestId, { request })

      const response = await this.makeRequest<ChatCompletionResponse>(
        `/${this.config.endpointId}/openai/v1/chat/completions`,
        'POST',
        request
      )

      this.emitEvent('complete', requestId, { response })
      this.recordChatMetrics(requestId, startTime, request, response)

      return response
    } catch (error) {
      this.emitEvent('error', requestId, { error })
      throw this.createVLLMError(error)
    }
  }

  async createStreamingChatCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: ChatCompletionStreamChunk) => void
  ): Promise<void> {
    const requestId = this.generateRequestId()

    try {
      this.emitEvent('start', requestId, { request })

      const streamingRequest = {
        ...request,
        stream: true
      }

      await this.handleOpenAIStreamingRequest(
        `/${this.config.endpointId}/openai/v1/chat/completions`,
        streamingRequest,
        onChunk,
        requestId
      )
    } catch (error) {
      this.emitEvent('error', requestId, { error })
      throw this.createVLLMError(error)
    }
  }

  // === Unified High-Level Methods ===

  async generateText(request: InferenceRequest): Promise<InferenceResponse> {
    const startTime = Date.now()

    // Decide which API to use
    const apiType = request.apiType || this.detectOptimalAPI(request)

    if (apiType === 'openai' || request.messages) {
      return await this.generateTextOpenAI(request, startTime)
    } else {
      return await this.generateTextNative(request, startTime)
    }
  }

  async generateStreamingText(
    request: InferenceRequest,
    onChunk: (response: StreamingInferenceResponse) => void
  ): Promise<void> {
    const apiType = request.apiType || this.detectOptimalAPI(request)

    if (apiType === 'openai' || request.messages) {
      return await this.generateStreamingTextOpenAI(request, onChunk)
    } else {
      return await this.generateStreamingTextNative(request, onChunk)
    }
  }

  private async generateTextOpenAI(request: InferenceRequest, startTime: number): Promise<InferenceResponse> {
    const chatRequest: ChatCompletionRequest = {
      model: this.config.modelName || 'deployed-model',
      messages: request.messages || [
        ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
        { role: 'user' as const, content: request.prompt }
      ],
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop
    }

    const response = await this.createChatCompletion(chatRequest)

    return {
      id: response.id,
      text: response.choices[0].message.content,
      finishReason: response.choices[0].finish_reason || 'stop',
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      model: response.model,
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime
    }
  }

  private async generateTextNative(request: InferenceRequest, startTime: number): Promise<InferenceResponse> {
    const nativeRequest: RunPodNativeRequest = {
      input: {
        prompt: request.prompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        top_k: request.topK,
        repetition_penalty: request.repetitionPenalty,
        presence_penalty: request.presencePenalty,
        frequency_penalty: request.frequencyPenalty,
        stop: request.stop
      }
    }

    const response = await this.runInferenceNative(nativeRequest)

    if (!response.output || !response.output[0]) {
      throw new Error('Invalid response format from RunPod Native API')
    }

    const output = response.output[0]

    return {
      id: response.id || this.generateRequestId(),
      text: output.choices[0].text,
      finishReason: output.choices[0].finish_reason,
      usage: {
        promptTokens: output.usage?.prompt_tokens || 0,
        completionTokens: output.usage?.completion_tokens || 0,
        totalTokens: output.usage?.total_tokens || 0
      },
      model: this.config.modelName || 'deployed-model',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime
    }
  }

  private async generateStreamingTextOpenAI(
    request: InferenceRequest,
    onChunk: (response: StreamingInferenceResponse) => void
  ): Promise<void> {
    const chatRequest: ChatCompletionRequest = {
      model: this.config.modelName || 'deployed-model',
      messages: request.messages || [
        ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
        { role: 'user' as const, content: request.prompt }
      ],
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
      stream: true
    }

    await this.createStreamingChatCompletion(chatRequest, (chunk) => {
      const delta = chunk.choices[0]?.delta
      if (delta?.content) {
        onChunk({
          id: chunk.id,
          chunk: delta.content,
          isComplete: chunk.choices[0].finish_reason !== null,
          finishReason: chunk.choices[0].finish_reason || undefined,
          model: chunk.model,
          timestamp: new Date().toISOString()
        })
      }
    })
  }

  private async generateStreamingTextNative(
    request: InferenceRequest,
    onChunk: (response: StreamingInferenceResponse) => void
  ): Promise<void> {
    const nativeRequest: RunPodNativeRequest = {
      input: {
        prompt: request.prompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        top_k: request.topK,
        repetition_penalty: request.repetitionPenalty,
        presence_penalty: request.presencePenalty,
        frequency_penalty: request.frequencyPenalty,
        stop: request.stop,
        stream: true
      }
    }

    await this.runStreamingInferenceNative(nativeRequest, (chunk) => {
      onChunk({
        id: this.generateRequestId(),
        chunk,
        isComplete: false, // Native API doesn't provide completion status in chunks
        model: this.config.modelName || 'deployed-model',
        timestamp: new Date().toISOString()
      })
    })
  }

  // === Utility Methods ===

  private detectOptimalAPI(request: InferenceRequest): 'native' | 'openai' {
    // Use OpenAI API if messages are provided or system prompt is used
    if (request.messages || request.systemPrompt) {
      return 'openai'
    }

    // Use native API for simple prompt-based generation
    return 'native'
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    timeout?: number
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    const requestTimeout = timeout || this.config.timeout || 120000

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= (this.config.retries || 3); attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout)

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (attempt < (this.config.retries || 3)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    throw lastError
  }

  private async handleStreamingRequest(
    endpoint: string,
    body: any,
    onChunk: (chunk: string) => void,
    requestId: string
  ): Promise<void> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        this.emitEvent('chunk', requestId, { chunk })
        onChunk(chunk)
      }
    } finally {
      reader.releaseLock()
    }
  }

  private async handleOpenAIStreamingRequest(
    endpoint: string,
    body: any,
    onChunk: (chunk: ChatCompletionStreamChunk) => void,
    requestId: string
  ): Promise<void> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data) as ChatCompletionStreamChunk
              this.emitEvent('chunk', requestId, { chunk: parsed })
              onChunk(parsed)
            } catch (error) {
              // Skip invalid JSON chunks
              continue
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // === Event Management ===

  addEventListener(event: string, handler: InferenceEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  removeEventListener(event: string, handler: InferenceEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emitEvent(type: InferenceEvent['type'], requestId: string, data: any): void {
    const event: InferenceEvent = {
      type,
      requestId,
      data,
      timestamp: Date.now()
    }

    const handlers = this.eventHandlers.get(type) || []
    handlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error('Error in event handler:', error)
      }
    })
  }

  // === Metrics and Monitoring ===

  private recordMetrics(
    requestId: string,
    startTime: number,
    request: any,
    response: any
  ): void {
    const endTime = Date.now()
    const metrics: InferenceMetrics = {
      requestId,
      endpointId: this.config.endpointId,
      model: this.config.modelName || 'unknown',
      startTime,
      endTime,
      latency: endTime - startTime,
      tokensPerSecond: 0, // Calculate if possible
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: {
        promptCost: 0,
        completionCost: 0,
        totalCost: 0
      },
      success: true
    }

    this.usageMetrics.push(metrics)
  }

  private recordChatMetrics(
    requestId: string,
    startTime: number,
    request: ChatCompletionRequest,
    response: ChatCompletionResponse
  ): void {
    const endTime = Date.now()
    const latency = endTime - startTime
    const tokensPerSecond = response.usage.completion_tokens / (latency / 1000)

    const metrics: InferenceMetrics = {
      requestId,
      endpointId: this.config.endpointId,
      model: response.model,
      startTime,
      endTime,
      latency,
      tokensPerSecond,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      cost: {
        promptCost: 0, // Calculate based on pricing
        completionCost: 0,
        totalCost: 0
      },
      success: true
    }

    this.usageMetrics.push(metrics)
  }

  getUsageMetrics(): InferenceMetrics[] {
    return [...this.usageMetrics]
  }

  clearUsageMetrics(): void {
    this.usageMetrics = []
  }

  // === Utility Functions ===

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createVLLMError(error: unknown): VLLMError {
    if (error instanceof Error) {
      return {
        type: this.categorizeError(error),
        message: error.message,
        details: error,
        retryable: this.isRetryable(error)
      }
    }

    return {
      type: 'server',
      message: 'Unknown error occurred',
      details: error,
      retryable: false
    }
  }

  private categorizeError(error: Error): VLLMError['type'] {
    const message = error.message.toLowerCase()

    if (message.includes('unauthorized') || message.includes('403')) return 'auth'
    if (message.includes('rate limit') || message.includes('429')) return 'rate_limit'
    if (message.includes('quota') || message.includes('billing')) return 'quota'
    if (message.includes('timeout') || message.includes('abort')) return 'timeout'
    if (message.includes('network') || message.includes('fetch')) return 'network'
    if (message.includes('validation') || message.includes('400')) return 'validation'

    return 'server'
  }

  private isRetryable(error: Error): boolean {
    const type = this.categorizeError(error)
    return ['timeout', 'network', 'server'].includes(type)
  }

  // === Cleanup ===

  destroy(): void {
    this.eventHandlers.clear()
    this.activeRequests.forEach(controller => controller.abort())
    this.activeRequests.clear()
    this.usageMetrics = []
  }
}

// Factory function for creating vLLM service instances
export function createVLLMService(config: VLLMConfig): VLLMService {
  return new VLLMService(config)
}

// Default singleton instance
let defaultVLLMService: VLLMService | null = null

export function getDefaultVLLMService(): VLLMService {
  if (!defaultVLLMService) {
    const config: VLLMConfig = {
      endpointId: process.env.RUNPOD_ENDPOINT_ID || '',
      apiKey: process.env.RUNPOD_API_KEY || '',
      modelName: process.env.RUNPOD_VLLM_MODEL_NAME || 'deployed-model'
    }

    if (!config.endpointId || !config.apiKey) {
      throw new Error('RunPod endpoint ID and API key must be configured')
    }

    defaultVLLMService = new VLLMService(config)
  }

  return defaultVLLMService
}

export default VLLMService