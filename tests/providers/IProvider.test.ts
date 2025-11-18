/**
 * IProvider Interface Tests
 *
 * Tests for the provider interface contract and mock implementation.
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.1
 * Created: 2025-11-17
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  IProvider,
  ProviderCapabilities,
  CompletionParams,
  VisionParams,
  CompletionResult,
  TokenUsage,
  CostBreakdown,
  ModelInfo
} from '../../src/providers'

/**
 * Mock Provider Implementation
 *
 * Used for testing the IProvider interface contract.
 * Simulates a provider with all capabilities enabled.
 */
class MockProvider implements IProvider {
  readonly name = 'mock'
  readonly capabilities: ProviderCapabilities = {
    vision: true,
    jsonMode: true,
    streaming: true,
    contextWindow: 200000,
    functionCalling: true
  }

  readonly models: ModelInfo[] = [
    {
      id: 'mock-model-1',
      name: 'Mock Model 1',
      provider: 'mock',
      capabilities: this.capabilities,
      costPerMillionTokens: {
        input: 3.0,
        output: 15.0
      }
    },
    {
      id: 'mock-model-2',
      name: 'Mock Model 2 (Cheap)',
      provider: 'mock',
      capabilities: {
        ...this.capabilities,
        vision: false
      },
      costPerMillionTokens: {
        input: 0.5,
        output: 1.5
      }
    }
  ]

  private callCount = 0

  async generateCompletion(params: CompletionParams): Promise<CompletionResult> {
    this.callCount++

    // Simulate response
    const responseText = params.jsonMode
      ? '{"result": "mock response"}'
      : `Mock response to: ${params.prompt}`

    const tokensUsed: TokenUsage = {
      inputTokens: Math.floor(params.prompt.length / 4), // Rough estimate
      outputTokens: Math.floor(responseText.length / 4),
      totalTokens: 0
    }
    tokensUsed.totalTokens = tokensUsed.inputTokens + tokensUsed.outputTokens

    return {
      text: responseText,
      finishReason: 'stop',
      tokensUsed,
      model: 'mock-model-1',
      provider: this.name,
      metadata: {
        callCount: this.callCount,
        temperature: params.temperature
      }
    }
  }

  async generateWithVision(params: VisionParams): Promise<CompletionResult> {
    if (!this.capabilities.vision) {
      throw new Error('Vision not supported')
    }

    this.callCount++

    const responseText = `Mock vision response. Analyzed ${params.images.length} image(s). ${params.prompt}`

    const tokensUsed: TokenUsage = {
      inputTokens: Math.floor(params.prompt.length / 4) + params.images.length * 500, // Add image tokens
      outputTokens: Math.floor(responseText.length / 4),
      totalTokens: 0
    }
    tokensUsed.totalTokens = tokensUsed.inputTokens + tokensUsed.outputTokens

    return {
      text: responseText,
      finishReason: 'stop',
      tokensUsed,
      model: 'mock-model-1',
      provider: this.name,
      metadata: {
        callCount: this.callCount,
        imageCount: params.images.length
      }
    }
  }

  calculateCost(tokens: TokenUsage, model?: string): CostBreakdown {
    const modelInfo = this.models.find(m => m.id === model) || this.models[0]

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
    // Simulate health check
    return true
  }

  async getRateLimitStatus() {
    return {
      remaining: 950,
      limit: 1000,
      resetAt: new Date(Date.now() + 60000) // 1 minute from now
    }
  }

  // Test helper
  getCallCount(): number {
    return this.callCount
  }

  resetCallCount(): void {
    this.callCount = 0
  }
}

/**
 * Mock Provider without Vision
 *
 * Tests providers that don't support all capabilities.
 */
class MockProviderNoVision implements IProvider {
  readonly name = 'mock-no-vision'
  readonly capabilities: ProviderCapabilities = {
    vision: false,
    jsonMode: true,
    streaming: true,
    contextWindow: 128000,
    functionCalling: true
  }

  readonly models: ModelInfo[] = [
    {
      id: 'mock-cheap-model',
      name: 'Mock Cheap Model',
      provider: 'mock-no-vision',
      capabilities: this.capabilities,
      costPerMillionTokens: {
        input: 0.25,
        output: 1.25
      }
    }
  ]

  async generateCompletion(params: CompletionParams): Promise<CompletionResult> {
    const tokensUsed: TokenUsage = {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150
    }

    return {
      text: 'Mock response without vision',
      finishReason: 'stop',
      tokensUsed,
      model: 'mock-cheap-model',
      provider: this.name
    }
  }

  calculateCost(tokens: TokenUsage): CostBreakdown {
    const inputCost = (tokens.inputTokens / 1_000_000) * 0.25
    const outputCost = (tokens.outputTokens / 1_000_000) * 1.25

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      tokensUsed: tokens
    }
  }

  async healthCheck(): Promise<boolean> {
    return true
  }
}

describe('IProvider Interface', () => {
  let provider: MockProvider
  let noVisionProvider: MockProviderNoVision

  beforeEach(() => {
    provider = new MockProvider()
    noVisionProvider = new MockProviderNoVision()
  })

  describe('Provider Metadata', () => {
    it('should have a name', () => {
      expect(provider.name).toBe('mock')
      expect(noVisionProvider.name).toBe('mock-no-vision')
    })

    it('should have capabilities defined', () => {
      expect(provider.capabilities).toMatchObject({
        vision: true,
        jsonMode: true,
        streaming: true,
        contextWindow: expect.any(Number),
        functionCalling: true
      })
    })

    it('should have models list', () => {
      expect(provider.models).toHaveLength(2)
      expect(provider.models[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        provider: 'mock',
        capabilities: expect.any(Object),
        costPerMillionTokens: {
          input: expect.any(Number),
          output: expect.any(Number)
        }
      })
    })

    it('should have different capabilities per provider', () => {
      expect(provider.capabilities.vision).toBe(true)
      expect(noVisionProvider.capabilities.vision).toBe(false)
      expect(provider.capabilities.contextWindow).toBe(200000)
      expect(noVisionProvider.capabilities.contextWindow).toBe(128000)
    })
  })

  describe('generateCompletion', () => {
    it('should generate text completion', async () => {
      const result = await provider.generateCompletion({
        prompt: 'Hello, world!',
        temperature: 0.7
      })

      expect(result).toMatchObject({
        text: expect.any(String),
        finishReason: 'stop',
        tokensUsed: {
          inputTokens: expect.any(Number),
          outputTokens: expect.any(Number),
          totalTokens: expect.any(Number)
        },
        model: expect.any(String),
        provider: 'mock'
      })
    })

    it('should respect JSON mode parameter', async () => {
      const result = await provider.generateCompletion({
        prompt: 'Generate JSON',
        jsonMode: true
      })

      expect(result.text).toContain('{')
      expect(result.text).toContain('}')
    })

    it('should track token usage correctly', async () => {
      const result = await provider.generateCompletion({
        prompt: 'Test prompt'
      })

      expect(result.tokensUsed.totalTokens).toBe(
        result.tokensUsed.inputTokens + result.tokensUsed.outputTokens
      )
    })

    it('should include metadata in result', async () => {
      const result = await provider.generateCompletion({
        prompt: 'Test',
        temperature: 0.9
      })

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.temperature).toBe(0.9)
    })
  })

  describe('generateWithVision', () => {
    it('should generate vision completion when supported', async () => {
      const result = await provider.generateWithVision?.({
        prompt: 'What is in this image?',
        images: [
          {
            data: 'base64-encoded-image-data',
            mimeType: 'image/jpeg'
          }
        ]
      })

      expect(result).toBeDefined()
      expect(result?.text).toContain('Mock vision response')
      expect(result?.metadata?.imageCount).toBe(1)
    })

    it('should handle multiple images', async () => {
      const result = await provider.generateWithVision?.({
        prompt: 'Compare these images',
        images: [
          { data: 'image1', mimeType: 'image/jpeg' },
          { data: 'image2', mimeType: 'image/png' }
        ]
      })

      expect(result?.metadata?.imageCount).toBe(2)
    })

    it('should be undefined for providers without vision', () => {
      expect(noVisionProvider.generateWithVision).toBeUndefined()
    })

    it('should account for image tokens in usage', async () => {
      const result = await provider.generateWithVision?.({
        prompt: 'Describe',
        images: [{ data: 'img', mimeType: 'image/jpeg' }]
      })

      // Should have higher token usage due to image
      expect(result?.tokensUsed.inputTokens).toBeGreaterThan(0)
    })
  })

  describe('calculateCost', () => {
    it('should calculate cost correctly', () => {
      const tokens: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500
      }

      const cost = provider.calculateCost(tokens)

      expect(cost.inputCost).toBe((1000 / 1_000_000) * 3.0)
      expect(cost.outputCost).toBe((500 / 1_000_000) * 15.0)
      expect(cost.totalCost).toBe(cost.inputCost + cost.outputCost)
      expect(cost.tokensUsed).toEqual(tokens)
    })

    it('should calculate cost for specific model', () => {
      const tokens: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500
      }

      const cost1 = provider.calculateCost(tokens, 'mock-model-1')
      const cost2 = provider.calculateCost(tokens, 'mock-model-2')

      expect(cost1.totalCost).toBeGreaterThan(cost2.totalCost) // Model 2 is cheaper
    })

    it('should handle zero tokens', () => {
      const tokens: TokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      }

      const cost = provider.calculateCost(tokens)

      expect(cost.inputCost).toBe(0)
      expect(cost.outputCost).toBe(0)
      expect(cost.totalCost).toBe(0)
    })

    it('should calculate different costs for different providers', () => {
      const tokens: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500
      }

      const cost1 = provider.calculateCost(tokens)
      const cost2 = noVisionProvider.calculateCost(tokens)

      expect(cost1.totalCost).toBeGreaterThan(cost2.totalCost) // No vision provider is cheaper
    })
  })

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const isHealthy = await provider.healthCheck()
      expect(typeof isHealthy).toBe('boolean')
      expect(isHealthy).toBe(true)
    })

    it('should work for all providers', async () => {
      const healthy1 = await provider.healthCheck()
      const healthy2 = await noVisionProvider.healthCheck()

      expect(healthy1).toBe(true)
      expect(healthy2).toBe(true)
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return rate limit status when supported', async () => {
      const status = await provider.getRateLimitStatus?.()

      expect(status).toBeDefined()
      expect(status).toMatchObject({
        remaining: expect.any(Number),
        limit: expect.any(Number),
        resetAt: expect.any(Date)
      })
    })

    it('should be optional', () => {
      // noVisionProvider doesn't implement getRateLimitStatus
      expect(noVisionProvider.getRateLimitStatus).toBeUndefined()
    })
  })

  describe('Type Safety', () => {
    it('should enforce ProviderCapabilities structure', () => {
      const caps: ProviderCapabilities = {
        vision: true,
        jsonMode: true,
        streaming: true,
        contextWindow: 100000,
        functionCalling: true
      }

      expect(caps).toMatchObject({
        vision: expect.any(Boolean),
        jsonMode: expect.any(Boolean),
        streaming: expect.any(Boolean),
        contextWindow: expect.any(Number),
        functionCalling: expect.any(Boolean)
      })
    })

    it('should enforce CompletionParams structure', () => {
      const params: CompletionParams = {
        prompt: 'Test',
        systemPrompt: 'System',
        temperature: 0.7,
        maxTokens: 1000,
        stopSequences: ['STOP'],
        topP: 0.9,
        topK: 40,
        jsonMode: true,
        metadata: { custom: 'data' }
      }

      expect(params.prompt).toBe('Test')
      expect(params.temperature).toBe(0.7)
    })

    it('should enforce VisionParams extends CompletionParams', () => {
      const params: VisionParams = {
        prompt: 'What is this?',
        temperature: 0.7,
        images: [
          {
            data: 'base64-data',
            mimeType: 'image/jpeg'
          }
        ]
      }

      expect(params.images).toHaveLength(1)
      expect(params.prompt).toBe('What is this?')
    })

    it('should enforce CompletionResult structure', () => {
      const result: CompletionResult = {
        text: 'Response',
        finishReason: 'stop',
        tokensUsed: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150
        },
        model: 'model-id',
        provider: 'provider-name'
      }

      expect(result.text).toBe('Response')
      expect(result.finishReason).toBe('stop')
    })

    it('should enforce finish reason types', () => {
      const validReasons: Array<CompletionResult['finishReason']> = [
        'stop',
        'length',
        'content_filter',
        'tool_use'
      ]

      validReasons.forEach(reason => {
        const result: CompletionResult = {
          text: 'Test',
          finishReason: reason,
          tokensUsed: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          model: 'test',
          provider: 'test'
        }
        expect(result.finishReason).toBe(reason)
      })
    })
  })

  describe('Integration Flow', () => {
    it('should support complete request-cost workflow', async () => {
      // 1. Generate completion
      const result = await provider.generateCompletion({
        prompt: 'Generate a response',
        temperature: 0.7,
        maxTokens: 100
      })

      expect(result.text).toBeDefined()
      expect(result.tokensUsed).toBeDefined()

      // 2. Calculate cost
      const cost = provider.calculateCost(result.tokensUsed, result.model)

      expect(cost.totalCost).toBeGreaterThan(0)
      expect(cost.tokensUsed).toEqual(result.tokensUsed)
    })

    it('should support vision workflow when available', async () => {
      // 1. Check if vision is supported
      if (provider.capabilities.vision && provider.generateWithVision) {
        // 2. Generate vision completion
        const result = await provider.generateWithVision({
          prompt: 'Analyze this image',
          images: [{ data: 'image-data', mimeType: 'image/jpeg' }]
        })

        expect(result.text).toBeDefined()

        // 3. Calculate cost
        const cost = provider.calculateCost(result.tokensUsed)
        expect(cost.totalCost).toBeGreaterThan(0)
      }
    })

    it('should gracefully handle providers without vision', async () => {
      expect(noVisionProvider.capabilities.vision).toBe(false)
      expect(noVisionProvider.generateWithVision).toBeUndefined()

      // Should still work for regular completions
      const result = await noVisionProvider.generateCompletion({
        prompt: 'Regular prompt'
      })
      expect(result.text).toBeDefined()
    })
  })
})
