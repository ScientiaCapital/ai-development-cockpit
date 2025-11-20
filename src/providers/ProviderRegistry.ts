/**
 * Provider Registry
 *
 * Manages all registered AI providers and provides lookup capabilities.
 * Central registry for all available providers in the system.
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.4
 * Created: 2025-11-17
 */

import { IProvider } from './IProvider'
import { ProviderCapabilities } from './types'

/**
 * Provider Registry
 *
 * Manages registered AI providers and provides lookup capabilities.
 * Central registry for all available providers in the system.
 */
export class ProviderRegistry {
  private providers: Map<string, IProvider> = new Map()

  /**
   * Register a provider
   *
   * Adds a provider to the registry. If a provider with the same name
   * already exists, it will be overwritten.
   *
   * @param provider - The provider to register
   */
  register(provider: IProvider): void {
    this.providers.set(provider.name, provider)
  }

  /**
   * Get provider by name
   *
   * @param name - The provider name to lookup
   * @returns The provider if found, undefined otherwise
   */
  getProvider(name: string): IProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * Get all registered providers
   *
   * @returns Array of all registered providers
   */
  getAllProviders(): IProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get providers with specific capability
   *
   * Filters providers based on whether they support a given capability.
   *
   * @param capability - The capability to filter by (vision, jsonMode, etc.)
   * @returns Array of providers that support the capability
   */
  getProvidersWithCapability(capability: keyof ProviderCapabilities): IProvider[] {
    return this.getAllProviders().filter(
      provider => provider.capabilities[capability] === true
    )
  }

  /**
   * Get cheapest provider for given token usage
   *
   * Calculates the cost for each provider and returns the cheapest one.
   * Useful for optimizing costs when multiple providers can handle a task.
   *
   * @param tokens - Expected token usage (input and output)
   * @returns The cheapest provider, or undefined if no providers registered
   */
  getCheapestProvider(tokens: { input: number; output: number }): IProvider | undefined {
    const providers = this.getAllProviders()
    if (providers.length === 0) return undefined

    return providers.reduce((cheapest, current) => {
      const cheapestCost = cheapest.calculateCost({
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        totalTokens: tokens.input + tokens.output
      }).totalCost

      const currentCost = current.calculateCost({
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        totalTokens: tokens.input + tokens.output
      }).totalCost

      return currentCost < cheapestCost ? current : cheapest
    })
  }
}
