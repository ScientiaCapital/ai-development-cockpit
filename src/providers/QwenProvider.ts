/**
 * QwenProvider - Alibaba Qwen2.5-VL Provider
 *
 * Best for: VLM tasks (PDF/image parsing), cheap/free tier
 * Vision: Excellent (long-context PDFs)
 * JSON mode: Yes
 * Cost: Free tier available, very cheap (~$0.15/M input, ~$0.60/M output)
 * Context window: 32,768 tokens
 *
 * Provider: Alibaba Cloud
 * Documentation: https://www.alibabacloud.com/help/en/model-studio/developer-reference/qwen-vl-api
 */

import { IProvider } from './IProvider'
import type {
  ProviderCapabilities,
  CompletionParams,
  VisionParams,
  CompletionResult,
  TokenUsage,
  CostBreakdown,
  ModelInfo
} from './types'

export class QwenProvider implements IProvider {
  readonly name = 'qwen'
  readonly capabilities: ProviderCapabilities = {
    vision: true,
    jsonMode: true,
    streaming: true,
    contextWindow: 32768,
    functionCalling: false
  }

  readonly models: ModelInfo[] = [
    {
      id: 'qwen-vl-plus',
      name: 'Qwen VL Plus',
      provider: 'qwen',
      capabilities: this.capabilities,
      costPerMillionTokens: {
        input: 0.15,   // Very cheap
        output: 0.60
      }
    }
  ]

  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.QWEN_API_KEY || ''
  }

  async generateCompletion(params: CompletionParams): Promise<CompletionResult> {
    const messages = []

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }

    messages.push({ role: 'user', content: params.prompt })

    const payload: any = {
      model: 'qwen-vl-plus',
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens || 2048
    }

    if (params.jsonMode) {
      payload.response_format = { type: 'json_object' }
    }

    const response = await this.callQwenAPI(payload)

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

  async generateWithVision(params: VisionParams): Promise<CompletionResult> {
    const content: any[] = [
      { type: 'text', text: params.prompt }
    ]

    // Add all images to content array
    for (const image of params.images) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${image.mimeType};base64,${image.data}`
        }
      })
    }

    const messages = []

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }

    messages.push({ role: 'user', content })

    const payload: any = {
      model: 'qwen-vl-plus',
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens || 2048
    }

    const response = await this.callQwenAPI(payload)

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
      await this.callQwenAPI({
        model: 'qwen-vl-plus',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
      return true
    } catch (error) {
      console.error('Qwen health check failed:', error)
      return false
    }
  }

  /**
   * Internal method to call Qwen API
   * This is a mock implementation since we don't have the official SDK integrated yet
   * In production, this would use fetch() to call the Qwen API endpoints
   */
  private async callQwenAPI(payload: any): Promise<any> {
    // Mock implementation for testing
    // In production, this would be:
    // const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // })
    // return response.json()

    throw new Error('Qwen API not implemented - use mock in tests')
  }

  /**
   * Map Qwen finish reasons to our standard format
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
