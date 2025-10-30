/**
 * OpenRouter Client
 *
 * Integration with OpenRouter API for multi-model fallback.
 * Provides access to 40+ models through a single API.
 */

import axios, { AxiosInstance } from 'axios'
import type { OptimizationRequest, OptimizationResponse } from '@/types/cost-optimizer'

interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenRouterClient {
  private client: AxiosInstance
  private apiKey: string
  private defaultModel: string = 'anthropic/claude-3-haiku'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || ''

    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for OpenRouter client')
    }

    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        'X-Title': 'AI Development Cockpit',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    })
  }

  /**
   * Generate completion using OpenRouter
   */
  async complete(
    request: OptimizationRequest,
    complexity: { score: number; tokenCount: number }
  ): Promise<OptimizationResponse> {
    const startTime = Date.now()

    try {
      // Build messages array
      const messages = this.buildMessages(request)

      // Call OpenRouter API (OpenAI-compatible format)
      const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
        model: this.defaultModel,
        messages,
        max_tokens: request.maxTokens ?? 1000,
        temperature: request.temperature ?? 0.7,
      })

      const data = response.data
      const content = data.choices[0]?.message?.content || ''

      const latency = Date.now() - startTime

      // Calculate costs (OpenRouter provides usage info)
      const inputTokens = data.usage.prompt_tokens
      const outputTokens = data.usage.completion_tokens
      const totalTokens = data.usage.total_tokens

      // OpenRouter average pricing (varies by model)
      const cost = {
        input: (inputTokens / 1_000_000) * 0.0002,   // $0.20 per 1M tokens
        output: (outputTokens / 1_000_000) * 0.0006, // $0.60 per 1M tokens
        total: 0
      }
      cost.total = cost.input + cost.output

      // Calculate savings compared to direct Claude API
      const claudeCost = (inputTokens / 1_000_000) * 0.00025 +
                        (outputTokens / 1_000_000) * 0.00125
      const savings = Math.max(0, claudeCost - cost.total)

      return {
        content,
        model: data.model,
        provider: 'openrouter',
        tier: 'mid',
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens
        },
        cost,
        latency,
        savings,
        savingsPercentage: savings > 0 ? (savings / claudeCost) * 100 : 0,
        complexityAnalysis: {
          score: complexity.score,
          tokenCount: complexity.tokenCount,
          hasComplexKeywords: true,
          estimatedLatency: latency,
          recommendedTier: 'mid',
          recommendedProvider: 'openrouter',
          confidence: 0.8
        },
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        cached: false,
        finishReason: data.choices[0]?.finish_reason || 'completed'
      }
    } catch (error) {
      console.error('OpenRouter completion failed:', error)

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.error?.message || error.message

        throw new Error(`OpenRouter API error (${status}): ${message}`)
      }

      throw new Error(`OpenRouter error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build messages array from request
   */
  private buildMessages(request: OptimizationRequest): Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []

    // Add system message if provided
    if (request.systemMessage) {
      messages.push({
        role: 'system',
        content: request.systemMessage
      })
    }

    // Add conversation history if provided
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      for (const msg of request.conversationHistory) {
        messages.push({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })
      }
    }

    // Add current user prompt
    messages.push({
      role: 'user',
      content: request.prompt
    })

    return messages
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `openrouter_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Test connection to OpenRouter API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })

      return !!response.data.choices[0]?.message?.content
    } catch (error) {
      console.error('OpenRouter connection test failed:', error)
      return false
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(): Promise<Array<{
    id: string
    name: string
    pricing: { prompt: number; completion: number }
  }>> {
    try {
      const response = await this.client.get('/models')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error)
      return []
    }
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    name: string
    tier: string
    costPerInputToken: number
    costPerOutputToken: number
  } {
    return {
      name: this.defaultModel,
      tier: 'mid',
      costPerInputToken: 0.0002,
      costPerOutputToken: 0.0006
    }
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model
  }
}

// Export singleton instance (lazy-loaded to handle missing API key)
let openRouterClientInstance: OpenRouterClient | null = null

export function getOpenRouterClient(): OpenRouterClient {
  if (!openRouterClientInstance) {
    openRouterClientInstance = new OpenRouterClient()
  }
  return openRouterClientInstance
}

export default OpenRouterClient
