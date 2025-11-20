/**
 * QwenProvider Tests
 *
 * Comprehensive test suite for Alibaba Qwen2.5-VL provider
 * Tests all IProvider interface methods and capabilities
 *
 * Provider Features:
 * - Vision: YES (excellent for PDFs/images)
 * - JSON Mode: YES
 * - Context Window: 32,768 tokens
 * - Cost: ~$0.15/M input, ~$0.60/M output
 */

import { QwenProvider } from '../../src/providers/QwenProvider'
import { CompletionParams, VisionParams, TokenUsage } from '../../src/providers/types'

describe('QwenProvider', () => {
  let provider: QwenProvider

  beforeEach(() => {
    provider = new QwenProvider('test-api-key')
  })

  describe('Constructor and Initialization', () => {
    test('should create instance with explicit API key', () => {
      const provider = new QwenProvider('explicit-key')
      expect(provider).toBeInstanceOf(QwenProvider)
      expect(provider.name).toBe('qwen')
    })

    test('should use environment variable if no API key provided', () => {
      process.env.QWEN_API_KEY = 'env-key'
      const provider = new QwenProvider()
      expect(provider).toBeInstanceOf(QwenProvider)
      delete process.env.QWEN_API_KEY
    })

    test('should handle missing API key gracefully', () => {
      delete process.env.QWEN_API_KEY
      const provider = new QwenProvider()
      expect(provider).toBeInstanceOf(QwenProvider)
    })
  })

  describe('Provider Metadata', () => {
    test('should have correct provider name', () => {
      expect(provider.name).toBe('qwen')
    })

    test('should declare vision capability', () => {
      expect(provider.capabilities.vision).toBe(true)
    })

    test('should declare JSON mode capability', () => {
      expect(provider.capabilities.jsonMode).toBe(true)
    })

    test('should declare streaming capability', () => {
      expect(provider.capabilities.streaming).toBe(true)
    })

    test('should have correct context window size', () => {
      expect(provider.capabilities.contextWindow).toBe(32768)
    })

    test('should NOT support function calling', () => {
      expect(provider.capabilities.functionCalling).toBe(false)
    })

    test('should expose model information', () => {
      expect(provider.models).toHaveLength(1)
      expect(provider.models[0].id).toBe('qwen-vl-plus')
      expect(provider.models[0].name).toBe('Qwen VL Plus')
      expect(provider.models[0].provider).toBe('qwen')
    })

    test('should have correct pricing information', () => {
      const model = provider.models[0]
      expect(model.costPerMillionTokens.input).toBe(0.15)
      expect(model.costPerMillionTokens.output).toBe(0.60)
    })
  })

  describe('generateCompletion', () => {
    beforeEach(() => {
      // Mock the private callQwenAPI method
      jest.spyOn(provider as any, 'callQwenAPI').mockResolvedValue({
        choices: [{
          message: { content: 'This is a test response from Qwen' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'qwen-vl-plus'
      })
    })

    test('should generate basic completion', async () => {
      const params: CompletionParams = {
        prompt: 'What is the capital of France?',
        systemPrompt: 'You are a helpful assistant'
      }

      const result = await provider.generateCompletion(params)

      expect(result.text).toBe('This is a test response from Qwen')
      expect(result.provider).toBe('qwen')
      expect(result.model).toBe('qwen-vl-plus')
      expect(result.finishReason).toBe('stop')
    })

    test('should handle JSON mode', async () => {
      const params: CompletionParams = {
        prompt: 'Return JSON with name and age',
        jsonMode: true
      }

      const result = await provider.generateCompletion(params)

      expect(result.text).toBeDefined()
      expect((provider as any).callQwenAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' }
        })
      )
    })

    test('should respect temperature parameter', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt',
        temperature: 0.9
      }

      await provider.generateCompletion(params)

      expect((provider as any).callQwenAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9
        })
      )
    })

    test('should use default temperature if not specified', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt'
      }

      await provider.generateCompletion(params)

      expect((provider as any).callQwenAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7
        })
      )
    })

    test('should respect maxTokens parameter', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt',
        maxTokens: 1000
      }

      await provider.generateCompletion(params)

      expect((provider as any).callQwenAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000
        })
      )
    })

    test('should return correct token usage', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt'
      }

      const result = await provider.generateCompletion(params)

      expect(result.tokensUsed).toEqual({
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150
      })
    })

    test('should preserve metadata', async () => {
      const params: CompletionParams = {
        prompt: 'Test prompt',
        metadata: { requestId: 'test-123', userId: 'user-456' }
      }

      const result = await provider.generateCompletion(params)

      expect(result.metadata).toEqual({
        requestId: 'test-123',
        userId: 'user-456'
      })
    })

    test('should handle length finish reason', async () => {
      jest.spyOn(provider as any, 'callQwenAPI').mockResolvedValue({
        choices: [{
          message: { content: 'Truncated response...' },
          finish_reason: 'length'
        }],
        usage: { prompt_tokens: 100, completion_tokens: 2048, total_tokens: 2148 },
        model: 'qwen-vl-plus'
      })

      const params: CompletionParams = {
        prompt: 'Write a very long story'
      }

      const result = await provider.generateCompletion(params)

      expect(result.finishReason).toBe('length')
    })
  })

  describe('generateWithVision', () => {
    beforeEach(() => {
      jest.spyOn(provider as any, 'callQwenAPI').mockResolvedValue({
        choices: [{
          message: { content: 'I see a cat in the image' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 100,
          total_tokens: 600
        },
        model: 'qwen-vl-plus'
      })
    })

    test('should generate completion with vision input', async () => {
      const params: VisionParams = {
        prompt: 'What do you see in this image?',
        images: [{
          data: 'base64-encoded-image-data',
          mimeType: 'image/png'
        }]
      }

      const result = await provider.generateWithVision(params)

      expect(result.text).toBe('I see a cat in the image')
      expect(result.provider).toBe('qwen')
    })

    test('should handle multiple images', async () => {
      const params: VisionParams = {
        prompt: 'Compare these images',
        images: [
          { data: 'image1-data', mimeType: 'image/png' },
          { data: 'image2-data', mimeType: 'image/jpeg' }
        ]
      }

      await provider.generateWithVision(params)

      expect((provider as any).callQwenAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text' }),
                expect.objectContaining({
                  type: 'image_url',
                  image_url: expect.objectContaining({
                    url: 'data:image/png;base64,image1-data'
                  })
                }),
                expect.objectContaining({
                  type: 'image_url',
                  image_url: expect.objectContaining({
                    url: 'data:image/jpeg;base64,image2-data'
                  })
                })
              ])
            })
          ])
        })
      )
    })

    test('should respect temperature in vision mode', async () => {
      const params: VisionParams = {
        prompt: 'Analyze this image',
        images: [{ data: 'image-data', mimeType: 'image/png' }],
        temperature: 0.3
      }

      await provider.generateWithVision(params)

      expect((provider as any).callQwenAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3
        })
      )
    })

    test('should respect maxTokens in vision mode', async () => {
      const params: VisionParams = {
        prompt: 'Describe this image in detail',
        images: [{ data: 'image-data', mimeType: 'image/png' }],
        maxTokens: 4000
      }

      await provider.generateWithVision(params)

      expect((provider as any).callQwenAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4000
        })
      )
    })
  })

  describe('calculateCost', () => {
    test('should calculate cost accurately', () => {
      const tokens: TokenUsage = {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        totalTokens: 2_000_000
      }

      const cost = provider.calculateCost(tokens)

      expect(cost.inputCost).toBe(0.15)  // $0.15/M * 1M tokens
      expect(cost.outputCost).toBe(0.60) // $0.60/M * 1M tokens
      expect(cost.totalCost).toBe(0.75)
      expect(cost.tokensUsed).toEqual(tokens)
    })

    test('should calculate cost for small token amounts', () => {
      const tokens: TokenUsage = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150
      }

      const cost = provider.calculateCost(tokens)

      expect(cost.inputCost).toBeCloseTo(0.000015, 6)  // $0.15/M * 100 tokens
      expect(cost.outputCost).toBeCloseTo(0.00003, 6)  // $0.60/M * 50 tokens
      expect(cost.totalCost).toBeCloseTo(0.000045, 6)
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
        inputTokens: 500_000,
        outputTokens: 250_000,
        totalTokens: 750_000
      }

      const cost = provider.calculateCost(tokens, 'qwen-vl-plus')

      expect(cost.inputCost).toBeCloseTo(0.075, 6)   // $0.15/M * 0.5M
      expect(cost.outputCost).toBeCloseTo(0.15, 6)   // $0.60/M * 0.25M
      expect(cost.totalCost).toBeCloseTo(0.225, 6)
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
  })

  describe('healthCheck', () => {
    test('should return true when API is healthy', async () => {
      jest.spyOn(provider as any, 'callQwenAPI').mockResolvedValue({
        choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        model: 'qwen-vl-plus'
      })

      const isHealthy = await provider.healthCheck()

      expect(isHealthy).toBe(true)
      expect((provider as any).callQwenAPI).toHaveBeenCalledWith({
        model: 'qwen-vl-plus',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    })

    test('should return false when API fails', async () => {
      jest.spyOn(provider as any, 'callQwenAPI').mockRejectedValue(
        new Error('API unavailable')
      )

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const isHealthy = await provider.healthCheck()

      expect(isHealthy).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Qwen health check failed:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      jest.spyOn(provider as any, 'callQwenAPI').mockRejectedValue(
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
      jest.spyOn(provider as any, 'callQwenAPI').mockRejectedValue(
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
