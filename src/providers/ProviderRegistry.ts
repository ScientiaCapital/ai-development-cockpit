/**
 * Provider Registry Interface
 *
 * Interface for managing multiple LLM providers.
 * Implementation will be created in Task 3.4.
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.1
 * Created: 2025-11-17
 */

import { IProvider } from './IProvider'
import { ProviderCapabilities } from './types'

/**
 * Provider Registry
 *
 * Central registry for managing multiple LLM providers.
 * Enables provider discovery, registration, and capability-based lookup.
 *
 * Implementation will be created in Task 3.4.
 */
export interface IProviderRegistry {
  /**
   * Register a provider
   *
   * Adds a provider to the registry, making it available for routing.
   *
   * @param provider - Provider instance to register
   * @throws Error if provider with same name already registered
   *
   * @example
   * ```typescript
   * const claudeProvider = new ClaudeProvider(apiKey)
   * registry.register(claudeProvider)
   * ```
   */
  register(provider: IProvider): void

  /**
   * Get provider by name
   *
   * Retrieves a specific provider by its name.
   *
   * @param name - Provider name (e.g., "anthropic", "qwen")
   * @returns Provider instance or undefined if not found
   *
   * @example
   * ```typescript
   * const provider = registry.getProvider('anthropic')
   * if (provider) {
   *   const result = await provider.generateCompletion({ ... })
   * }
   * ```
   */
  getProvider(name: string): IProvider | undefined

  /**
   * Get all registered providers
   *
   * Returns all providers in the registry.
   *
   * @returns Array of all registered providers
   *
   * @example
   * ```typescript
   * const allProviders = registry.getAllProviders()
   * console.log(`Registered providers: ${allProviders.length}`)
   * ```
   */
  getAllProviders(): IProvider[]

  /**
   * Get providers with specific capability
   *
   * Filters providers by a specific capability (e.g., vision, jsonMode).
   *
   * @param capability - Capability name to filter by
   * @returns Array of providers supporting the capability
   *
   * @example
   * ```typescript
   * const visionProviders = registry.getProvidersWithCapability('vision')
   * console.log(`Providers with vision: ${visionProviders.length}`)
   * ```
   */
  getProvidersWithCapability(
    capability: keyof ProviderCapabilities
  ): IProvider[]
}
