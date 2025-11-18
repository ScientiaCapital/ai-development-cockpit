/**
 * ProviderRegistry Tests
 *
 * Tests for the provider registry system that manages all available AI providers.
 * Following TDD: These tests will FAIL initially until implementation is complete.
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.4
 * Created: 2025-11-17
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { ProviderRegistry } from '../../src/providers/ProviderRegistry'
import { IProvider } from '../../src/providers/IProvider'
import { MockProvider } from './mocks/MockProvider'
import {
  ProviderCapabilities,
  CompletionParams,
  CompletionResult,
  VisionParams,
  TokenUsage,
  CostBreakdown
} from '../../src/providers/types'

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry
  let mockProviderA: IProvider
  let mockProviderB: IProvider
  let mockProviderC: IProvider

  beforeEach(() => {
    registry = new ProviderRegistry()

    // Mock Provider A - Cheap, no vision
    mockProviderA = {
      name: 'provider-a',
      capabilities: {
        vision: false,
        jsonMode: true,
        streaming: true,
        contextWindow: 4096,
        functionCalling: false
      },
      async complete(params: CompletionParams): Promise<CompletionResult> {
        return {
          text: 'Response from A',
          finishReason: 'stop',
          tokensUsed: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          model: 'model-a',
          provider: 'provider-a'
        }
      },
      async completeWithVision(params: VisionParams): Promise<CompletionResult> {
        throw new Error('Vision not supported')
      },
      calculateCost(usage: TokenUsage): CostBreakdown {
        // Very cheap: $0.10 per million tokens
        return {
          inputCost: (usage.inputTokens / 1000000) * 0.10,
          outputCost: (usage.outputTokens / 1000000) * 0.10,
          totalCost: (usage.totalTokens / 1000000) * 0.10,
          tokensUsed: usage
        }
      },
      isHealthy(): boolean {
        return true
      }
    }

    // Mock Provider B - Mid-range, has vision
    mockProviderB = {
      name: 'provider-b',
      capabilities: {
        vision: true,
        jsonMode: true,
        streaming: true,
        contextWindow: 8192,
        functionCalling: true
      },
      async complete(params: CompletionParams): Promise<CompletionResult> {
        return {
          text: 'Response from B',
          finishReason: 'stop',
          tokensUsed: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          model: 'model-b',
          provider: 'provider-b'
        }
      },
      async completeWithVision(params: VisionParams): Promise<CompletionResult> {
        return {
          text: 'Vision response from B',
          finishReason: 'stop',
          tokensUsed: { inputTokens: 15, outputTokens: 25, totalTokens: 40 },
          model: 'model-b',
          provider: 'provider-b'
        }
      },
      calculateCost(usage: TokenUsage): CostBreakdown {
        // Mid-range: $1.00 per million tokens
        return {
          inputCost: (usage.inputTokens / 1000000) * 1.00,
          outputCost: (usage.outputTokens / 1000000) * 1.00,
          totalCost: (usage.totalTokens / 1000000) * 1.00,
          tokensUsed: usage
        }
      },
      isHealthy(): boolean {
        return true
      }
    }

    // Mock Provider C - Expensive, premium features
    mockProviderC = {
      name: 'provider-c',
      capabilities: {
        vision: true,
        jsonMode: true,
        streaming: true,
        contextWindow: 200000,
        functionCalling: true
      },
      async complete(params: CompletionParams): Promise<CompletionResult> {
        return {
          text: 'Response from C',
          finishReason: 'stop',
          tokensUsed: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          model: 'model-c',
          provider: 'provider-c'
        }
      },
      async completeWithVision(params: VisionParams): Promise<CompletionResult> {
        return {
          text: 'Vision response from C',
          finishReason: 'stop',
          tokensUsed: { inputTokens: 15, outputTokens: 25, totalTokens: 40 },
          model: 'model-c',
          provider: 'provider-c'
        }
      },
      calculateCost(usage: TokenUsage): CostBreakdown {
        // Expensive: $10.00 per million tokens
        return {
          inputCost: (usage.inputTokens / 1000000) * 10.00,
          outputCost: (usage.outputTokens / 1000000) * 10.00,
          totalCost: (usage.totalTokens / 1000000) * 10.00,
          tokensUsed: usage
        }
      },
      isHealthy(): boolean {
        return true
      }
    }
  })

  describe('register', () => {
    it('should register a provider successfully', () => {
      registry.register(mockProviderA)
      const provider = registry.getProvider('provider-a')
      expect(provider).toBe(mockProviderA)
    })

    it('should allow registering multiple providers', () => {
      registry.register(mockProviderA)
      registry.register(mockProviderB)
      registry.register(mockProviderC)

      expect(registry.getProvider('provider-a')).toBe(mockProviderA)
      expect(registry.getProvider('provider-b')).toBe(mockProviderB)
      expect(registry.getProvider('provider-c')).toBe(mockProviderC)
    })

    it('should overwrite existing provider with same name', () => {
      registry.register(mockProviderA)

      const updatedProvider = { ...mockProviderA, name: 'provider-a' }
      registry.register(updatedProvider)

      expect(registry.getProvider('provider-a')).toBe(updatedProvider)
    })
  })

  describe('getProvider', () => {
    it('should return provider by name', () => {
      registry.register(mockProviderA)
      registry.register(mockProviderB)

      expect(registry.getProvider('provider-a')).toBe(mockProviderA)
      expect(registry.getProvider('provider-b')).toBe(mockProviderB)
    })

    it('should return undefined for non-existent provider', () => {
      expect(registry.getProvider('non-existent')).toBeUndefined()
    })
  })

  describe('getAllProviders', () => {
    it('should return empty array when no providers registered', () => {
      expect(registry.getAllProviders()).toEqual([])
    })

    it('should return all registered providers', () => {
      registry.register(mockProviderA)
      registry.register(mockProviderB)
      registry.register(mockProviderC)

      const providers = registry.getAllProviders()
      expect(providers).toHaveLength(3)
      expect(providers).toContain(mockProviderA)
      expect(providers).toContain(mockProviderB)
      expect(providers).toContain(mockProviderC)
    })
  })

  describe('getProvidersWithCapability', () => {
    beforeEach(() => {
      registry.register(mockProviderA)
      registry.register(mockProviderB)
      registry.register(mockProviderC)
    })

    it('should return providers with vision capability', () => {
      const visionProviders = registry.getProvidersWithCapability('vision')
      expect(visionProviders).toHaveLength(2)
      expect(visionProviders).toContain(mockProviderB)
      expect(visionProviders).toContain(mockProviderC)
      expect(visionProviders).not.toContain(mockProviderA)
    })

    it('should return providers with JSON mode capability', () => {
      const jsonProviders = registry.getProvidersWithCapability('jsonMode')
      expect(jsonProviders).toHaveLength(3)
      expect(jsonProviders).toContain(mockProviderA)
      expect(jsonProviders).toContain(mockProviderB)
      expect(jsonProviders).toContain(mockProviderC)
    })

    it('should return providers with function calling capability', () => {
      const functionProviders = registry.getProvidersWithCapability('functionCalling')
      expect(functionProviders).toHaveLength(2)
      expect(functionProviders).toContain(mockProviderB)
      expect(functionProviders).toContain(mockProviderC)
      expect(functionProviders).not.toContain(mockProviderA)
    })

    it('should return empty array if no providers have capability', () => {
      const emptyRegistry = new ProviderRegistry()
      expect(emptyRegistry.getProvidersWithCapability('vision')).toEqual([])
    })
  })

  describe('getCheapestProvider', () => {
    beforeEach(() => {
      registry.register(mockProviderA)
      registry.register(mockProviderB)
      registry.register(mockProviderC)
    })

    it('should return cheapest provider for given token usage', () => {
      const cheapest = registry.getCheapestProvider({
        input: 1000,
        output: 1000
      })

      expect(cheapest).toBe(mockProviderA) // $0.10 per million tokens
    })

    it('should correctly compare costs across providers', () => {
      const cheapest = registry.getCheapestProvider({
        input: 5000,
        output: 5000
      })

      // Provider A: 10,000 tokens * $0.10/1M = $0.001
      // Provider B: 10,000 tokens * $1.00/1M = $0.01
      // Provider C: 10,000 tokens * $10.00/1M = $0.10
      expect(cheapest).toBe(mockProviderA)
    })

    it('should return undefined when no providers registered', () => {
      const emptyRegistry = new ProviderRegistry()
      expect(emptyRegistry.getCheapestProvider({ input: 1000, output: 1000 })).toBeUndefined()
    })

    it('should handle single provider', () => {
      const singleRegistry = new ProviderRegistry()
      singleRegistry.register(mockProviderB)

      const cheapest = singleRegistry.getCheapestProvider({
        input: 1000,
        output: 1000
      })

      expect(cheapest).toBe(mockProviderB)
    })
  })
})
