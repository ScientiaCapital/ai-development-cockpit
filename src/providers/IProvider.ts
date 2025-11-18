/**
 * IProvider Interface
 *
 * Standard interface for all LLM providers to enable multi-model orchestration.
 * Providers implement this interface to participate in intelligent model routing.
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.1
 * Created: 2025-11-17
 */

import {
  ProviderCapabilities,
  CompletionParams,
  VisionParams,
  CompletionResult,
  TokenUsage,
  CostBreakdown,
  ModelInfo
} from './types'

/**
 * Provider Interface
 *
 * All LLM providers must implement this interface to participate in the
 * multi-model orchestration system.
 *
 * Example implementations:
 * - ClaudeProvider (Anthropic Claude models)
 * - QwenProvider (Alibaba Qwen models)
 * - DeepSeekProvider (DeepSeek models)
 * - GeminiProvider (Google Gemini models)
 */
export interface IProvider {
  /**
   * Provider name (e.g., "anthropic", "qwen", "deepseek", "gemini")
   *
   * Used for logging, routing decisions, and provider selection.
   */
  readonly name: string

  /**
   * Provider capabilities
   *
   * Defines what features this provider supports.
   */
  readonly capabilities: ProviderCapabilities

  /**
   * Available models for this provider
   *
   * List of models with their capabilities and pricing.
   */
  readonly models: ModelInfo[]

  /**
   * Generate text completion
   *
   * Standard text completion without vision capabilities.
   *
   * @param params - Completion parameters
   * @returns Promise resolving to completion result
   * @throws Error if provider is unavailable or request fails
   *
   * @example
   * ```typescript
   * const result = await provider.generateCompletion({
   *   prompt: "Explain quantum computing",
   *   systemPrompt: "You are a helpful assistant",
   *   temperature: 0.7,
   *   maxTokens: 1000
   * })
   * console.log(result.text)
   * ```
   */
  generateCompletion(params: CompletionParams): Promise<CompletionResult>

  /**
   * Generate completion with vision (images/PDFs)
   *
   * Only available if capabilities.vision === true
   *
   * @param params - Vision completion parameters
   * @returns Promise resolving to completion result
   * @throws Error if vision not supported or request fails
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
   * console.log(result.text)
   * ```
   */
  generateWithVision?(params: VisionParams): Promise<CompletionResult>

  /**
   * Calculate cost for given token usage
   *
   * Calculates the cost in USD based on token usage and model pricing.
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
  calculateCost(tokens: TokenUsage, model?: string): CostBreakdown

  /**
   * Health check - verify provider is accessible
   *
   * Tests if the provider API is reachable and responsive.
   *
   * @returns Promise resolving to true if healthy, false otherwise
   *
   * @example
   * ```typescript
   * const isHealthy = await provider.healthCheck()
   * if (!isHealthy) {
   *   console.error('Provider is unavailable')
   * }
   * ```
   */
  healthCheck(): Promise<boolean>

  /**
   * Get current rate limit status
   *
   * Optional method to check rate limit status.
   * Not all providers expose this information.
   *
   * @returns Promise resolving to rate limit status
   *
   * @example
   * ```typescript
   * const status = await provider.getRateLimitStatus?.()
   * if (status && status.remaining < 10) {
   *   console.warn('Approaching rate limit')
   * }
   * ```
   */
  getRateLimitStatus?(): Promise<{
    remaining: number
    limit: number
    resetAt: Date
  }>
}
