/**
 * DeepSeekProvider Tests
 *
 * Comprehensive test suite for DeepSeek-V3 provider
 * Tests all IProvider interface methods and capabilities
 *
 * Provider Features:
 * - Vision: NO (text-only)
 * - JSON Mode: YES
 * - Context Window: 64,000 tokens
 * - Cost: $0.14/M input, $0.28/M output (95% cheaper than Claude!)
 */

import { DeepSeekProvider } from '../../src/providers/DeepSeekProvider'
import { CompletionParams, TokenUsage } from '../../src/providers/types'

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider

  beforeEach(() => {
    provider = new DeepSeekProvider('test-api-key')
  })

  describe('Constructor and Initialization', () => {
    test('should create instance with explicit API key', () => {
      const provider = new DeepSeekProvider('explicit-key')
      expect(provider).toBeInstanceOf(DeepSeekProvider)
      expect(provider.name).toBe('deepseek')
    })

    test('should use environment variable if no API key provided', () => {
      process.env.DEEPSEEK_API_KEY = 'env-key'
      const provider = new DeepSeekProvider()
      expect(provider).toBeInstanceOf(DeepSeekProvider)
      delete process.env.DEEPSEEK_API_KEY
    })

    test('should handle missing API key gracefully', () => {
      delete process.env.DEEPSEEK_API_KEY
      const provider = new DeepSeekProvider()
      expect(provider).toBeInstanceOf(DeepSeekProvider)
    })
  })

  describe('Provider Metadata', () => {
    test('should have correct provider name', () => {
      expect(provider.name).toBe('deepseek')
    })

    test('should NOT have vision capability', () => {
      expect(provider.capabilities.vision).toBe(false)
    })

    test('should declare JSON mode capability', () => {
      expect(provider.capabilities.jsonMode).toBe(true)
    })

    test('should declare streaming capability', () => {
      expect(provider.capabilities.streaming).toBe(true)
    })

    test('should have correct context window size', () => {
      expect(provider.capabilities.contextWindow).toBe(64000)
    })

    test('should support function calling', () => {
      expect(provider.capabilities.functionCalling).toBe(true)
    })

    test('should expose model information', () => {
      expect(provider.models).toHaveLength(1)
      expect(provider.models[0].id).toBe('deepseek-chat')
      expect(provider.models[0].name).toBe('DeepSeek Chat')
      expect(provider.models[0].provider).toBe('deepseek')
    })

    test('should have ultra-competitive pricing', () => {
      const model = provider.models[0]
      expect(model.costPerMillionTokens.input).toBe(0.14)
      expect(model.costPerMillionTokens.output).toBe(0.28)
    })
  })

  describe('generateCompletion', () => {
    beforeEach(() => {
      // Mock the private callDeepSeekAPI method
      jest.spyOn(provider as any, 'callDeepSeekAPI').mockResolvedValue({
        choices: [{
          message: { content: 'This is a response from DeepSeek' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 75,
          total_tokens: 225
        },
        model: 'deepseek-chat'
      })
    })

    test('should generate basic completion', async () => {
      const params: CompletionParams = {
        prompt: 'Write a Python function to sort a list',
        systemPrompt: 'You are an expert programmer'
      }

      const result = await provider.generateCompletion(params)

      expect(result.text).toBe('This is a response from DeepSeek')
      expect(result.provider).toBe('deepseek')
      expect(result.model).toBe('deepseek-chat')
      expect(result.finishReason).toBe('stop')
    })

    test('should handle JSON mode', async () => {
      const params: CompletionParams = {
        prompt: 'Return JSON with function signature',
        jsonMode: true
      }

      const result = await provider.generateCompletion(params)

      expect(result.text).toBeDefined()
      expect((provider as any).callDeepSeekAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' }
        })
      )
    })

    test('should respect temperature parameter', async () => {
      const params: CompletionParams = {
        prompt: 'Generate creative code',
        temperature: 0.8
      }

      await provider.generateCompletion(params)

      expect((provider as any).callDeepSeekAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8
        })
      )
    })

    test('should use default temperature if not specified', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt'
      }

      await provider.generateCompletion(params)

      expect((provider as any).callDeepSeekAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7
        })
      )
    })

    test('should respect maxTokens parameter', async () => {
      const params: CompletionParams = {
        prompt: 'Write a long code example',
        maxTokens: 8000
      }

      await provider.generateCompletion(params)

      expect((provider as any).callDeepSeekAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 8000
        })
      )
    })

    test('should return correct token usage', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt'
      }

      const result = await provider.generateCompletion(params)

      expect(result.tokensUsed).toEqual({
        inputTokens: 150,
        outputTokens: 75,
        totalTokens: 225
      })
    })

    test('should preserve metadata', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt',
        metadata: { task: 'code-generation', userId: 'dev-789' }
      }

      const result = await provider.generateCompletion(params)

      expect(result.metadata).toEqual({
        task: 'code-generation',
        userId: 'dev-789'
      })
    })

    test('should handle length finish reason', async () => {
      jest.spyOn(provider as any, 'callDeepSeekAPI').mockResolvedValue({
        choices: [{
          message: { content: 'Very long code that got truncated...' },
          finish_reason: 'length'
        }],
        usage: { prompt_tokens: 200, completion_tokens: 8000, total_tokens: 8200 },
        model: 'deepseek-chat'
      })

      const params: CompletionParams = {
        prompt: 'Write complete implementation'
      }

      const result = await provider.generateCompletion(params)

      expect(result.finishReason).toBe('length')
    })
  })

  describe('calculateCost', () => {
    test('should calculate cost accurately with ultra-low rates', () => {
      const tokens: TokenUsage = {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        totalTokens: 2_000_000
      }

      const cost = provider.calculateCost(tokens)

      expect(cost.inputCost).toBeCloseTo(0.14, 6)  // $0.14/M * 1M tokens
      expect(cost.outputCost).toBeCloseTo(0.28, 6) // $0.28/M * 1M tokens
      expect(cost.totalCost).toBeCloseTo(0.42, 6)  // 95% cheaper than Claude!
      expect(cost.tokensUsed).toEqual(tokens)
    })

    test('should calculate cost for small token amounts', () => {
      const tokens: TokenUsage = {
        inputTokens: 150,
        outputTokens: 75,
        totalTokens: 225
      }

      const cost = provider.calculateCost(tokens)

      expect(cost.inputCost).toBeCloseTo(0.000021, 6)  // $0.14/M * 150 tokens
      expect(cost.outputCost).toBeCloseTo(0.000021, 6)  // $0.28/M * 75 tokens
      expect(cost.totalCost).toBeCloseTo(0.000042, 6)
    })

    test('should handle zero tokens', () => {
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

    test('should calculate cost for specific model', () => {
      const tokens: TokenUsage = {
        inputTokens: 10_000_000,
        outputTokens: 5_000_000,
        totalTokens: 15_000_000
      }

      const cost = provider.calculateCost(tokens, 'deepseek-chat')

      expect(cost.inputCost).toBeCloseTo(1.40, 6)   // $0.14/M * 10M
      expect(cost.outputCost).toBeCloseTo(1.40, 6)  // $0.28/M * 5M
      expect(cost.totalCost).toBeCloseTo(2.80, 6)   // Still incredibly cheap!
    })

    test('should throw error for invalid model', () => {
      const tokens: TokenUsage = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150
      }

      expect(() => {
        provider.calculateCost(tokens, 'invalid-model')
      }).toThrow('Model not found: invalid-model')
    })

    test('should demonstrate massive cost savings vs Claude', () => {
      // Same tokens in Claude would cost:
      // Input: (1M / 1M) * $3.00 = $3.00
      // Output: (1M / 1M) * $15.00 = $15.00
      // Total: $18.00

      const tokens: TokenUsage = {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        totalTokens: 2_000_000
      }

      const deepseekCost = provider.calculateCost(tokens)
      const claudeCost = 18.00  // For comparison

      expect(deepseekCost.totalCost).toBeCloseTo(0.42, 6)
      expect(deepseekCost.totalCost / claudeCost).toBeCloseTo(0.0233, 4)  // ~2.3% of Claude cost
    })
  })

  describe('healthCheck', () => {
    test('should return true when API is healthy', async () => {
      jest.spyOn(provider as any, 'callDeepSeekAPI').mockResolvedValue({
        choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        model: 'deepseek-chat'
      })

      const isHealthy = await provider.healthCheck()

      expect(isHealthy).toBe(true)
      expect((provider as any).callDeepSeekAPI).toHaveBeenCalledWith({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    })

    test('should return false when API fails', async () => {
      jest.spyOn(provider as any, 'callDeepSeekAPI').mockRejectedValue(
        new Error('API unavailable')
      )

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const isHealthy = await provider.healthCheck()

      expect(isHealthy).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'DeepSeek health check failed:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      jest.spyOn(provider as any, 'callDeepSeekAPI').mockRejectedValue(
        new Error('API rate limit exceeded')
      )

      const params: CompletionParams = {
        prompt: 'Test prompt'
      }

      await expect(provider.generateCompletion(params)).rejects.toThrow(
        'API rate limit exceeded'
      )
    })

    test('should handle network errors', async () => {
      jest.spyOn(provider as any, 'callDeepSeekAPI').mockRejectedValue(
        new Error('Network timeout')
      )

      const params: CompletionParams = {
        prompt: 'Test prompt'
      }

      await expect(provider.generateCompletion(params)).rejects.toThrow(
        'Network timeout'
      )
    })
  })
})
