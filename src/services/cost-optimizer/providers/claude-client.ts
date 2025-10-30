/**
 * Anthropic Claude Client
 *
 * Integration with Anthropic Claude API for mid-tier LLM completions.
 * Handles complex reasoning tasks (25% of queries).
 */

import Anthropic from '@anthropic-ai/sdk'
import type { OptimizationRequest, OptimizationResponse } from '@/types/cost-optimizer'

export class ClaudeClient {
  private client: Anthropic
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for Claude client')
    }

    this.client = new Anthropic({
      apiKey: this.apiKey
    })
  }

  /**
   * Generate completion using Claude Haiku (cost-optimized)
   */
  async complete(
    request: OptimizationRequest,
    complexity: { score: number; tokenCount: number }
  ): Promise<OptimizationResponse> {
    const startTime = Date.now()

    try {
      // Build messages array
      const messages = this.buildMessages(request)

      // Call Claude API
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307', // Cost-optimized model
        max_tokens: request.maxTokens ?? 1000,
        temperature: request.temperature ?? 0.7,
        system: request.systemMessage,
        messages
      })

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : ''

      const latency = Date.now() - startTime

      // Calculate actual costs based on usage
      const inputTokens = response.usage.input_tokens
      const outputTokens = response.usage.output_tokens
      const totalTokens = inputTokens + outputTokens

      const cost = {
        input: (inputTokens / 1_000_000) * 0.00025,  // $0.25 per 1M tokens
        output: (outputTokens / 1_000_000) * 0.00125, // $1.25 per 1M tokens
        total: 0
      }
      cost.total = cost.input + cost.output

      // Calculate savings compared to Claude Sonnet (premium)
      const sonnetCost = (inputTokens / 1_000_000) * 0.003 +
                        (outputTokens / 1_000_000) * 0.015
      const savings = Math.max(0, sonnetCost - cost.total)

      return {
        content,
        model: 'claude-3-haiku-20240307',
        provider: 'claude',
        tier: 'mid',
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens
        },
        cost,
        latency,
        savings,
        savingsPercentage: savings > 0 ? (savings / sonnetCost) * 100 : 0,
        complexityAnalysis: {
          score: complexity.score,
          tokenCount: complexity.tokenCount,
          hasComplexKeywords: true,
          estimatedLatency: latency,
          recommendedTier: 'mid',
          recommendedProvider: 'claude',
          confidence: 0.85
        },
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        cached: false,
        finishReason: response.stop_reason || 'completed'
      }
    } catch (error) {
      console.error('Claude completion failed:', error)
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build messages array from request
   */
  private buildMessages(request: OptimizationRequest): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history if provided
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      for (const msg of request.conversationHistory) {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })
        }
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
    return `claude_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Test connection to Claude API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })

      return !!response.content[0]
    } catch (error) {
      console.error('Claude connection test failed:', error)
      return false
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
      name: 'claude-3-haiku-20240307',
      tier: 'mid',
      costPerInputToken: 0.00025,
      costPerOutputToken: 0.00125
    }
  }
}

// Export singleton instance (lazy-loaded to handle missing API key)
let claudeClientInstance: ClaudeClient | null = null

export function getClaudeClient(): ClaudeClient {
  if (!claudeClientInstance) {
    claudeClientInstance = new ClaudeClient()
  }
  return claudeClientInstance
}

export default ClaudeClient
