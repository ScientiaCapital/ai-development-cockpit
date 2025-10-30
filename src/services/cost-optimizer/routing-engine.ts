/**
 * Routing Engine
 *
 * Determines optimal LLM provider routing based on:
 * - Complexity analysis
 * - Provider availability and health
 * - Cost constraints and budgets
 * - Performance requirements
 */

import type {
  OptimizationRequest,
  Provider,
  CostTier,
  ProviderConfig,
  ComplexityScore,
  OptimizationRecommendation
} from '@/types/cost-optimizer'
import { complexityAnalyzer } from './complexity-analyzer'

/**
 * Provider configuration with costs and capabilities
 */
const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    name: 'gemini',
    tier: 'free',
    displayName: 'Google Gemini Flash',
    costPerInputToken: 0,        // Free tier
    costPerOutputToken: 0,       // Free tier
    maxTokens: 32000,
    enabled: true,
    averageLatency: 800,
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', recommended: true },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', recommended: false }
    ]
  },
  {
    name: 'claude',
    tier: 'mid',
    displayName: 'Anthropic Claude',
    costPerInputToken: 0.00025,  // $0.25 per 1M tokens
    costPerOutputToken: 0.00125, // $1.25 per 1M tokens
    maxTokens: 200000,
    enabled: true,
    averageLatency: 1200,
    models: [
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', recommended: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', recommended: false }
    ]
  },
  {
    name: 'openrouter',
    tier: 'mid',
    displayName: 'OpenRouter',
    costPerInputToken: 0.0002,   // Average across models
    costPerOutputToken: 0.0006,  // Average across models
    maxTokens: 128000,
    enabled: true,
    averageLatency: 1500,
    models: [
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (OpenRouter)', recommended: true },
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', recommended: true }
    ]
  },
  {
    name: 'runpod',
    tier: 'premium',
    displayName: 'RunPod Chinese LLMs',
    costPerInputToken: 0.00015,  // $0.15 per 1M tokens
    costPerOutputToken: 0.00015, // $0.15 per 1M tokens
    maxTokens: 32000,
    enabled: true,
    averageLatency: 2000,
    models: [
      { id: 'qwen2.5-7b-instruct', name: 'Qwen 2.5 7B Instruct', recommended: true },
      { id: 'deepseek-coder-v2-6.7b', name: 'DeepSeek Coder V2', recommended: true },
      { id: 'chatglm3-6b', name: 'ChatGLM3 6B', recommended: false }
    ]
  },
  {
    name: 'cerebras',
    tier: 'mid',
    displayName: 'Cerebras (Experimental)',
    costPerInputToken: 0.0001,
    costPerOutputToken: 0.0001,
    maxTokens: 8000,
    enabled: false, // Experimental - disabled by default
    averageLatency: 500,
    models: [
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B (Cerebras)', recommended: false }
    ]
  }
]

export class RoutingEngine {
  private providerConfigs: Map<Provider, ProviderConfig>
  private providerHealth: Map<Provider, boolean>

  constructor() {
    // Initialize provider configurations
    this.providerConfigs = new Map(
      PROVIDER_CONFIGS.map(config => [config.name, config])
    )

    // Initialize all providers as healthy
    this.providerHealth = new Map(
      PROVIDER_CONFIGS.map(config => [config.name, config.enabled])
    )
  }

  /**
   * Get routing recommendation without executing
   */
  getRecommendation(request: OptimizationRequest): OptimizationRecommendation {
    // Analyze complexity
    const complexityAnalysis = complexityAnalyzer.analyze(
      request.prompt,
      {
        conversationHistory: request.conversationHistory,
        systemMessage: request.systemMessage
      }
    )

    // Check for forced routing
    if (request.forceProvider) {
      return this.createForcedRecommendation(
        request.forceProvider,
        complexityAnalysis
      )
    }

    if (request.forceTier) {
      return this.createTierRecommendation(
        request.forceTier,
        complexityAnalysis
      )
    }

    // Get optimal provider based on complexity
    const provider = complexityAnalysis.recommendedProvider
    const tier = complexityAnalysis.recommendedTier
    const config = this.providerConfigs.get(provider)!

    // Calculate estimated cost
    const estimatedTokens = {
      input: complexityAnalysis.tokenCount,
      output: request.maxTokens || 1000
    }

    const estimatedCost = this.calculateCost(
      provider,
      estimatedTokens.input,
      estimatedTokens.output
    )

    // Get alternative options
    const alternatives = this.getAlternatives(
      complexityAnalysis,
      provider
    )

    return {
      provider,
      tier,
      model: config.models.find(m => m.recommended)?.id || config.models[0].id,
      estimatedCost,
      estimatedLatency: complexityAnalysis.estimatedLatency,
      estimatedSavings: this.calculateSavings(estimatedCost, complexityAnalysis),
      complexityAnalysis,
      alternatives
    }
  }

  /**
   * Route request to optimal provider
   */
  route(request: OptimizationRequest): {
    provider: Provider
    tier: CostTier
    model: string
    complexity: ComplexityScore
    config: ProviderConfig
  } {
    const recommendation = this.getRecommendation(request)

    // Get provider configuration
    const config = this.providerConfigs.get(recommendation.provider)!

    // Check if provider is healthy and available
    if (!this.isProviderAvailable(recommendation.provider)) {
      // Fall back to next best provider
      const fallback = this.getFallbackProvider(recommendation.tier)
      const fallbackConfig = this.providerConfigs.get(fallback)!

      console.warn(
        `Provider ${recommendation.provider} unavailable, falling back to ${fallback}`
      )

      return {
        provider: fallback,
        tier: fallbackConfig.tier,
        model: fallbackConfig.models.find(m => m.recommended)?.id || fallbackConfig.models[0].id,
        complexity: recommendation.complexityAnalysis,
        config: fallbackConfig
      }
    }

    return {
      provider: recommendation.provider,
      tier: recommendation.tier,
      model: recommendation.model,
      complexity: recommendation.complexityAnalysis,
      config
    }
  }

  /**
   * Calculate cost for a provider
   */
  calculateCost(
    provider: Provider,
    inputTokens: number,
    outputTokens: number
  ): number {
    const config = this.providerConfigs.get(provider)

    if (!config) {
      console.warn(`Unknown provider: ${provider}`)
      return 0
    }

    const inputCost = (inputTokens / 1_000_000) * config.costPerInputToken
    const outputCost = (outputTokens / 1_000_000) * config.costPerOutputToken

    return inputCost + outputCost
  }

  /**
   * Calculate savings compared to default provider (Claude)
   */
  private calculateSavings(
    actualCost: number,
    complexity: ComplexityScore
  ): number {
    // Default comparison: Claude Haiku pricing
    const defaultConfig = this.providerConfigs.get('claude')!
    const defaultCost = this.calculateCost(
      'claude',
      complexity.tokenCount,
      1000 // Estimated output tokens
    )

    return Math.max(0, defaultCost - actualCost)
  }

  /**
   * Get alternative provider options
   */
  private getAlternatives(
    complexity: ComplexityScore,
    selectedProvider: Provider
  ): OptimizationRecommendation['alternatives'] {
    const alternatives: OptimizationRecommendation['alternatives'] = []

    // Get all available providers except the selected one
    const availableProviders = Array.from(this.providerConfigs.entries())
      .filter(([name, config]) =>
        name !== selectedProvider &&
        config.enabled &&
        this.isProviderAvailable(name)
      )

    for (const [name, config] of availableProviders) {
      const cost = this.calculateCost(name, complexity.tokenCount, 1000)
      const latency = config.averageLatency + (complexity.tokenCount * 0.5)

      const tradeoffs: string[] = []

      // Analyze tradeoffs
      if (config.tier === 'free') {
        tradeoffs.push('Free tier - no cost')
        tradeoffs.push('May have rate limits')
      } else if (config.tier === 'premium') {
        tradeoffs.push('Higher cost but specialized')
      }

      if (config.averageLatency > 1500) {
        tradeoffs.push('Higher latency')
      }

      if (config.maxTokens < 50000) {
        tradeoffs.push('Limited context window')
      }

      alternatives.push({
        provider: name,
        tier: config.tier,
        model: config.models.find(m => m.recommended)?.id || config.models[0].id,
        cost,
        latency,
        tradeoffs
      })
    }

    // Sort by cost (cheapest first)
    return alternatives.sort((a, b) => a.cost - b.cost)
  }

  /**
   * Create forced provider recommendation
   */
  private createForcedRecommendation(
    provider: Provider,
    complexity: ComplexityScore
  ): OptimizationRecommendation {
    const config = this.providerConfigs.get(provider)!
    const cost = this.calculateCost(provider, complexity.tokenCount, 1000)

    return {
      provider,
      tier: config.tier,
      model: config.models.find(m => m.recommended)?.id || config.models[0].id,
      estimatedCost: cost,
      estimatedLatency: config.averageLatency + (complexity.tokenCount * 0.5),
      estimatedSavings: this.calculateSavings(cost, complexity),
      complexityAnalysis: {
        ...complexity,
        reasoning: `Forced routing to ${config.displayName}`
      },
      alternatives: []
    }
  }

  /**
   * Create tier-based recommendation
   */
  private createTierRecommendation(
    tier: CostTier,
    complexity: ComplexityScore
  ): OptimizationRecommendation {
    // Find best provider for this tier
    const tierProviders = Array.from(this.providerConfigs.entries())
      .filter(([_, config]) => config.tier === tier && config.enabled)
      .sort((a, b) => a[1].costPerInputToken - b[1].costPerInputToken)

    if (tierProviders.length === 0) {
      throw new Error(`No available providers for tier: ${tier}`)
    }

    const [provider, config] = tierProviders[0]
    const cost = this.calculateCost(provider, complexity.tokenCount, 1000)

    return {
      provider,
      tier,
      model: config.models.find(m => m.recommended)?.id || config.models[0].id,
      estimatedCost: cost,
      estimatedLatency: config.averageLatency + (complexity.tokenCount * 0.5),
      estimatedSavings: this.calculateSavings(cost, complexity),
      complexityAnalysis: {
        ...complexity,
        reasoning: `Forced routing to ${tier} tier`
      },
      alternatives: []
    }
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(provider: Provider): boolean {
    const config = this.providerConfigs.get(provider)
    if (!config || !config.enabled) return false

    const health = this.providerHealth.get(provider)
    return health ?? false
  }

  /**
   * Get fallback provider for a tier
   */
  private getFallbackProvider(tier: CostTier): Provider {
    // Fallback chain based on tier
    const fallbackChain: Record<CostTier, Provider[]> = {
      free: ['gemini', 'openrouter', 'claude'],
      mid: ['claude', 'openrouter', 'gemini'],
      premium: ['runpod', 'claude', 'openrouter']
    }

    const chain = fallbackChain[tier] || fallbackChain.mid

    // Find first available provider in chain
    for (const provider of chain) {
      if (this.isProviderAvailable(provider)) {
        return provider
      }
    }

    // Ultimate fallback: Gemini (free tier)
    return 'gemini'
  }

  /**
   * Update provider health status
   */
  updateProviderHealth(provider: Provider, isHealthy: boolean): void {
    this.providerHealth.set(provider, isHealthy)
    console.log(`Provider ${provider} health updated: ${isHealthy ? 'healthy' : 'unhealthy'}`)
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider: Provider): ProviderConfig | undefined {
    return this.providerConfigs.get(provider)
  }

  /**
   * Get all provider configurations
   */
  getAllProviderConfigs(): ProviderConfig[] {
    return Array.from(this.providerConfigs.values())
  }

  /**
   * Enable/disable provider
   */
  setProviderEnabled(provider: Provider, enabled: boolean): void {
    const config = this.providerConfigs.get(provider)
    if (config) {
      config.enabled = enabled
      this.providerHealth.set(provider, enabled)
      console.log(`Provider ${provider} ${enabled ? 'enabled' : 'disabled'}`)
    }
  }
}

// Export singleton instance
export const routingEngine = new RoutingEngine()

// Export class for testing
export default RoutingEngine
