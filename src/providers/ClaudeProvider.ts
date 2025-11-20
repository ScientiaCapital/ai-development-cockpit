/**
 * ClaudeProvider
 *
 * Anthropic Claude 4.5 Sonnet provider implementation for the multi-model
 * orchestration system.
 *
 * Features:
 * - Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
 * - Vision support (images and PDFs)
 * - JSON mode via system prompts
 * - 200K context window
 * - Function calling support
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.2
 * Created: 2025-11-17
 */

import Anthropic from '@anthropic-ai/sdk'
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

/**
 * Claude Provider Implementation
 *
 * Provides access to Anthropic's Claude 4.5 Sonnet model with full
 * vision and JSON mode support.
 *
 * @example
 * ```typescript
 * const provider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY)
 *
 * const result = await provider.generateCompletion({
 *   prompt: "Explain quantum computing",
 *   systemPrompt: "You are a helpful assistant",
 *   temperature: 0.7,
 *   maxTokens: 1000
 * })
 *
 * console.log(result.text)
 * ```
 */
export class ClaudeProvider implements IProvider {
  readonly name = 'anthropic'

  readonly capabilities: ProviderCapabilities = {
    vision: true,
    jsonMode: true,
    streaming: true,
    contextWindow: 200000,
    functionCalling: true
  }

  readonly models: ModelInfo[] = [
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      provider: 'anthropic',
      capabilities: {
        vision: true,
        jsonMode: true,
        streaming: true,
        contextWindow: 200000,
        functionCalling: true
      },
      costPerMillionTokens: {
        input: 3.0, // $3 per 1M input tokens
        output: 15.0 // $15 per 1M output tokens
      }
    }
  ]

  private client: Anthropic

  /**
   * Create a new Claude provider instance
   *
   * @param apiKey - Anthropic API key (optional, defaults to ANTHROPIC_API_KEY env var)
   */
  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    })
  }

  /**
   * Generate text completion
   *
   * @param params - Completion parameters
   * @returns Promise resolving to completion result
   *
   * @example
   * ```typescript
   * const result = await provider.generateCompletion({
   *   prompt: "Write a haiku about TypeScript",
   *   temperature: 0.9,
   *   maxTokens: 100
   * })
   * ```
   */
  async generateCompletion(params: CompletionParams): Promise<CompletionResult> {
    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'user',
        content: params.prompt
      }
    ]

    // Build system prompt (include JSON mode instruction if needed)
    let systemPrompt = params.systemPrompt || ''
    if (params.jsonMode) {
      systemPrompt += '\n\nYou must respond with valid JSON only. No other text.'
    }

    // Call Anthropic API
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature ?? 1.0,
      system: systemPrompt,
      messages
    })

    // Extract text from response (handle multiple text blocks)
    const text = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    return {
      text,
      finishReason: this.mapStopReason(response.stop_reason),
      tokensUsed: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model,
      provider: this.name,
      metadata: params.metadata
    }
  }

  /**
   * Generate completion with vision (images/PDFs)
   *
   * @param params - Vision completion parameters
   * @returns Promise resolving to completion result
   *
   * @example
   * ```typescript
   * const result = await provider.generateWithVision({
   *   prompt: "What's in this image?",
   *   images: [{
   *     data: base64ImageData,
   *     mimeType: 'image/jpeg'
   *   }]
   * })
   * ```
   */
  async generateWithVision(params: VisionParams): Promise<CompletionResult> {
    // Build content blocks with text and images
    const contentBlocks: Array<any> = [
      { type: 'text', text: params.prompt },
      ...params.images.map((img) => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mimeType,
          data: img.data
        }
      }))
    ]

    // Build system prompt
    let systemPrompt = params.systemPrompt || ''
    if (params.jsonMode) {
      systemPrompt += '\n\nYou must respond with valid JSON only. No other text.'
    }

    // Call Anthropic API
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature ?? 1.0,
      system: systemPrompt,
      messages: [{ role: 'user', content: contentBlocks }]
    })

    // Extract text from response
    const text = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    return {
      text,
      finishReason: this.mapStopReason(response.stop_reason),
      tokensUsed: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model,
      provider: this.name,
      metadata: params.metadata
    }
  }

  /**
   * Calculate cost for given token usage
   *
   * @param tokens - Token usage statistics
   * @param model - Specific model ID (optional, uses default if not provided)
   * @returns Cost breakdown including input, output, and total costs
   *
   * @example
   * ```typescript
   * const cost = provider.calculateCost({
   *   inputTokens: 1000,
   *   outputTokens: 500,
   *   totalTokens: 1500
   * })
   * console.log(`Total cost: $${cost.totalCost}`)
   * ```
   */
  calculateCost(tokens: TokenUsage, model?: string): CostBreakdown {
    const modelInfo = model
      ? this.models.find((m) => m.id === model)
      : this.models[0]

    if (!modelInfo) {
      throw new Error(`Model not found: ${model}`)
    }

    const inputCost =
      (tokens.inputTokens / 1_000_000) * modelInfo.costPerMillionTokens.input
    const outputCost =
      (tokens.outputTokens / 1_000_000) * modelInfo.costPerMillionTokens.output

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      tokensUsed: tokens
    }
  }

  /**
   * Health check - verify provider is accessible
   *
   * @returns Promise resolving to true if healthy, false otherwise
   *
   * @example
   * ```typescript
   * const isHealthy = await provider.healthCheck()
   * if (!isHealthy) {
   *   console.error('Claude provider is unavailable')
   * }
   * ```
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test message
      await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
      return true
    } catch (error) {
      console.error('Claude health check failed:', error)
      return false
    }
  }

  /**
   * Map Anthropic stop reason to standard finish reason
   *
   * @param reason - Anthropic stop reason
   * @returns Standard finish reason
   */
  private mapStopReason(
    reason: string | null
  ): 'stop' | 'length' | 'content_filter' | 'tool_use' {
    switch (reason) {
      case 'end_turn':
        return 'stop'
      case 'max_tokens':
        return 'length'
      case 'stop_sequence':
        return 'stop'
      case 'tool_use':
        return 'tool_use'
      default:
        return 'stop'
    }
  }
}
