/**
 * Model Router
 *
 * Intelligently routes AI requests to the optimal provider based on:
 * - Task type (vision, code, orchestration, etc.)
 * - Complexity level (simple, medium, complex)
 * - Cost constraints (prefer cheap vs quality)
 * - Provider capabilities (vision, JSON mode, etc.)
 *
 * Achieves 90%+ cost savings by routing most tasks to cheaper providers.
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.4
 * Created: 2025-11-17
 */

import { IProvider } from './IProvider'
import { ProviderRegistry } from './ProviderRegistry'
import { TaskType, TaskComplexity, RouterContext } from './types'

/**
 * Model Router
 *
 * Intelligently routes AI requests to the optimal provider based on:
 * - Task type (vision, code, orchestration, etc.)
 * - Complexity level (simple, medium, complex)
 * - Cost constraints (prefer cheap vs quality)
 * - Provider capabilities (vision, JSON mode, etc.)
 *
 * Achieves 90%+ cost savings by routing most tasks to cheaper providers.
 */
export class ModelRouter {
  constructor(private registry: ProviderRegistry) {}

  /**
   * Select optimal provider for given context
   *
   * Routes the request to the best provider based on task type,
   * complexity, and cost preferences.
   *
   * @param context - Routing context with task type, complexity, preferences
   * @returns The optimal provider for the given context
   * @throws Error if no suitable provider is available
   */
  selectProvider(context: RouterContext): IProvider {
    // Vision tasks
    if (context.task === 'vision' || context.requireVision) {
      return this.selectVisionProvider(context)
    }

    // Complex orchestration - use best model
    if (context.task === 'orchestration') {
      return this.selectOrchestrationProvider(context)
    }

    // Code generation - optimize for cost vs quality
    if (context.task === 'code-generation') {
      return this.selectCodeGenerationProvider(context)
    }

    // Test generation - cheap and good at code
    if (context.task === 'test-generation') {
      return this.selectTestGenerationProvider(context)
    }

    // JSON generation
    if (context.task === 'json-generation' || context.requireJSON) {
      return this.selectJSONProvider(context)
    }

    // Simple completion - use cheapest
    if (context.task === 'simple-completion') {
      return this.selectSimpleCompletionProvider(context)
    }

    // Default fallback
    return this.selectDefaultProvider(context)
  }

  /**
   * Select provider for vision tasks (images/PDFs)
   *
   * Prefers cost-effective Qwen for vision tasks unless high quality is required.
   *
   * @param context - Routing context
   * @returns Vision-capable provider
   * @throws Error if no vision-capable providers available
   */
  private selectVisionProvider(context: RouterContext): IProvider {
    const visionProviders = this.registry.getProvidersWithCapability('vision')

    if (visionProviders.length === 0) {
      throw new Error('No providers with vision capability available')
    }

    // Prefer cost-effective Qwen for vision
    if (context.preferCost !== false) {
      const qwen = this.registry.getProvider('qwen')
      if (qwen && qwen.capabilities.vision) {
        return qwen
      }
    }

    // Otherwise use first available vision provider (likely Claude)
    return visionProviders[0]
  }

  /**
   * Select provider for orchestration (complex reasoning)
   *
   * Always uses Claude for orchestration as it has the best reasoning capabilities.
   *
   * @param context - Routing context
   * @returns Claude provider
   * @throws Error if no providers available
   */
  private selectOrchestrationProvider(context: RouterContext): IProvider {
    // Always use Claude for orchestration - best reasoning
    const claude = this.registry.getProvider('anthropic')
    if (claude) return claude

    // Fallback to any available provider
    const providers = this.registry.getAllProviders()
    if (providers.length === 0) {
      throw new Error('No providers available')
    }
    return providers[0]
  }

  /**
   * Select provider for code generation
   *
   * Routes based on complexity:
   * - Complex tasks → Claude (best quality)
   * - Simple/Medium → DeepSeek (95% cheaper, still good)
   *
   * @param context - Routing context
   * @returns Code generation provider
   * @throws Error if no suitable providers available
   */
  private selectCodeGenerationProvider(context: RouterContext): IProvider {
    // High complexity → use Claude
    if (context.complexity === 'complex') {
      const claude = this.registry.getProvider('anthropic')
      if (claude) return claude
    }

    // Simple/Medium complexity → use DeepSeek (95% cheaper)
    const deepseek = this.registry.getProvider('deepseek')
    if (deepseek) return deepseek

    // Fallback to Claude
    const claude = this.registry.getProvider('anthropic')
    if (claude) return claude

    throw new Error('No suitable provider for code generation')
  }

  /**
   * Select provider for test generation
   *
   * Always uses DeepSeek - it's great at code and very cheap.
   *
   * @param context - Routing context
   * @returns DeepSeek provider
   * @throws Error if DeepSeek not available
   */
  private selectTestGenerationProvider(context: RouterContext): IProvider {
    // DeepSeek is great for tests and very cheap
    const deepseek = this.registry.getProvider('deepseek')
    if (deepseek) return deepseek

    // Fallback to cheapest available
    return this.selectCheapestProvider()
  }

  /**
   * Select provider for JSON generation
   *
   * Selects from providers with JSON mode capability.
   * Prefers cheapest when cost is a priority.
   *
   * @param context - Routing context
   * @returns JSON-capable provider
   * @throws Error if no JSON-capable providers available
   */
  private selectJSONProvider(context: RouterContext): IProvider {
    const jsonProviders = this.registry.getProvidersWithCapability('jsonMode')

    if (jsonProviders.length === 0) {
      throw new Error('No providers with JSON mode available')
    }

    // Prefer cheapest JSON provider
    if (context.preferCost !== false) {
      return this.selectCheapestProviderFromList(jsonProviders)
    }

    return jsonProviders[0]
  }

  /**
   * Select provider for simple completions
   *
   * Always uses the cheapest available provider.
   *
   * @param context - Routing context
   * @returns Cheapest provider
   */
  private selectSimpleCompletionProvider(context: RouterContext): IProvider {
    // Always use cheapest for simple tasks
    return this.selectCheapestProvider()
  }

  /**
   * Select default provider
   *
   * Default selection logic when no specific task type matches.
   * Prefers Claude for quality unless cost is prioritized.
   *
   * @param context - Routing context
   * @returns Default provider
   * @throws Error if no providers available
   */
  private selectDefaultProvider(context: RouterContext): IProvider {
    if (context.preferCost) {
      return this.selectCheapestProvider()
    }

    // Default to Claude for quality
    const claude = this.registry.getProvider('anthropic')
    if (claude) return claude

    // Fallback to any provider
    const providers = this.registry.getAllProviders()
    if (providers.length === 0) {
      throw new Error('No providers available')
    }
    return providers[0]
  }

  /**
   * Select cheapest provider overall
   *
   * Compares all providers and returns the one with lowest cost
   * for a typical workload (1000 input + 1000 output tokens).
   *
   * @returns Cheapest provider
   * @throws Error if no providers available
   */
  private selectCheapestProvider(): IProvider {
    const cheapest = this.registry.getCheapestProvider({
      input: 1000,
      output: 1000
    })

    if (!cheapest) {
      throw new Error('No providers available')
    }

    return cheapest
  }

  /**
   * Select cheapest from a specific list
   *
   * @param providers - List of providers to choose from
   * @returns Cheapest provider from the list
   * @throws Error if provider list is empty
   */
  private selectCheapestProviderFromList(providers: IProvider[]): IProvider {
    if (providers.length === 0) {
      throw new Error('Provider list is empty')
    }

    return providers.reduce((cheapest, current) => {
      const cheapestCost = cheapest.calculateCost({
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000
      }).totalCost

      const currentCost = current.calculateCost({
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000
      }).totalCost

      return currentCost < cheapestCost ? current : cheapest
    })
  }

  /**
   * Get provider statistics
   *
   * Returns statistics about registered providers and their capabilities.
   * Useful for monitoring and debugging routing decisions.
   *
   * @returns Provider statistics
   */
  getProviderStats(): {
    totalProviders: number
    byCapability: Record<string, number>
  } {
    const providers = this.registry.getAllProviders()

    return {
      totalProviders: providers.length,
      byCapability: {
        vision: this.registry.getProvidersWithCapability('vision').length,
        jsonMode: this.registry.getProvidersWithCapability('jsonMode').length,
        streaming: this.registry.getProvidersWithCapability('streaming').length,
        functionCalling: this.registry.getProvidersWithCapability('functionCalling').length
      }
    }
  }
}
