/**
 * DeepSeekProvider - DeepSeek-V3 Provider
 *
 * Best for: Code generation, very low cost, fast
 * Vision: No (text-only)
 * JSON mode: Yes
 * Cost: $0.14/M input, $0.28/M output (95% cheaper than Claude!)
 * Context window: 64,000 tokens
 *
 * Provider: DeepSeek
 * Documentation: https://platform.deepseek.com/api-docs/
 */

import { IProvider } from './IProvider'
import type {
  ProviderCapabilities,
  CompletionParams,
  CompletionResult,
  TokenUsage,
  CostBreakdown,
  ModelInfo
} from './types'

export class DeepSeekProvider implements IProvider {
  readonly name = 'deepseek'
  readonly capabilities: ProviderCapabilities = {
    vision: false,  // Text-only
    jsonMode: true,
    streaming: true,
    contextWindow: 64000,
    functionCalling: true
  }

  readonly models: ModelInfo[] = [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'deepseek',
      capabilities: this.capabilities,
      costPerMillionTokens: {
        input: 0.14,   // 95% cheaper than Claude!
        output: 0.28
      }
    }
  ]

  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || ''
  }

  async generateCompletion(params: CompletionParams): Promise<CompletionResult> {
    const messages = []

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }

    messages.push({ role: 'user', content: params.prompt })

    const payload: any = {
      model: 'deepseek-chat',
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens || 2048
    }

    if (params.jsonMode) {
      payload.response_format = { type: 'json_object' }
    }

    const response = await this.callDeepSeekAPI(payload)

    return {
      text: response.choices[0].message.content,
      finishReason: this.mapFinishReason(response.choices[0].finish_reason),
      tokensUsed: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      model: response.model,
      provider: this.name,
      metadata: params.metadata
    }
  }

  calculateCost(tokens: TokenUsage, model?: string): CostBreakdown {
    const modelInfo = model
      ? this.models.find(m => m.id === model)
      : this.models[0]

    if (!modelInfo) {
      throw new Error(`Model not found: ${model}`)
    }

    const inputCost = (tokens.inputTokens / 1_000_000) * modelInfo.costPerMillionTokens.input
    const outputCost = (tokens.outputTokens / 1_000_000) * modelInfo.costPerMillionTokens.output

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      tokensUsed: tokens
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.callDeepSeekAPI({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
      return true
    } catch (error) {
      console.error('DeepSeek health check failed:', error)
      return false
    }
  }

  /**
   * Internal method to call DeepSeek API
   * This is a mock implementation since we don't have the official SDK integrated yet
   * In production, this would use fetch() to call the DeepSeek API endpoints
   */
  private async callDeepSeekAPI(payload: any): Promise<any> {
    // Mock implementation for testing
    // In production, this would be:
    // const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // })
    // return response.json()

    throw new Error('DeepSeek API not implemented - use mock in tests')
  }

  /**
   * Map DeepSeek finish reasons to our standard format
   */
  private mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' | 'tool_use' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'content_filter'
      default:
        return 'stop'
    }
  }
}
