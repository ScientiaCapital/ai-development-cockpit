/**
 * ClaudeProvider Tests
 *
 * Comprehensive test suite for Anthropic Claude 4.5 Sonnet provider implementation.
 *
 * Part of Phase 3: Multi-Model Provider System - Task 3.2
 * Created: 2025-11-17
 */

import Anthropic from '@anthropic-ai/sdk'
import { ClaudeProvider } from '../../src/providers/ClaudeProvider'
import type {
  CompletionParams,
  VisionParams,
  TokenUsage
} from '../../src/providers/types'

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk')

const MockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>
const mockCreate = jest.fn()

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock the Anthropic constructor and messages.create method
    MockAnthropic.mockImplementation(
      () =>
        ({
          messages: {
            create: mockCreate
          }
        }) as any
    )

    provider = new ClaudeProvider('test-api-key')
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with provided API key', () => {
      expect(MockAnthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      })
    })

    it('should initialize with environment variable if no API key provided', () => {
      const originalEnv = process.env.ANTHROPIC_API_KEY
      process.env.ANTHROPIC_API_KEY = 'env-api-key'

      new ClaudeProvider()

      expect(MockAnthropic).toHaveBeenCalledWith({
        apiKey: 'env-api-key'
      })

      process.env.ANTHROPIC_API_KEY = originalEnv
    })
  })

  describe('Provider Metadata', () => {
    it('should have correct provider name', () => {
      expect(provider.name).toBe('anthropic')
    })

    it('should have correct capabilities', () => {
      expect(provider.capabilities).toEqual({
        vision: true,
        jsonMode: true,
        streaming: true,
        contextWindow: 200000,
        functionCalling: true
      })
    })

    it('should expose Claude Sonnet 4.5 model', () => {
      expect(provider.models).toHaveLength(1)
      expect(provider.models[0]).toEqual({
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        capabilities: provider.capabilities,
        costPerMillionTokens: {
          input: 3.0,
          output: 15.0
        }
      })
    })
  })

  describe('generateCompletion', () => {
    it('should generate basic text completion', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Hello, world!' }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 5
        },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const params: CompletionParams = {
        prompt: 'Say hello'
      }

      const result = await provider.generateCompletion(params)

      expect(result).toEqual({
        text: 'Hello, world!',
        finishReason: 'stop',
        tokensUsed: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15
        },
        model: 'claude-sonnet-4-5-20250929',
        provider: 'anthropic',
        metadata: undefined
      })

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        temperature: 1.0,
        system: '',
        messages: [{ role: 'user', content: 'Say hello' }]
      })
    })

    it('should handle JSON mode by adding instruction to system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: '{"result": "success"}' }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 15,
          output_tokens: 8
        },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const params: CompletionParams = {
        prompt: 'Return JSON',
        systemPrompt: 'You are a helpful assistant',
        jsonMode: true
      }

      const result = await provider.generateCompletion(params)

      expect(result.text).toBe('{"result": "success"}')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining(
            'You must respond with valid JSON only'
          )
        })
      )
    })

    it('should respect temperature parameter', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const params: CompletionParams = {
        prompt: 'Test',
        temperature: 0.5
      }

      await provider.generateCompletion(params)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5
        })
      )
    })

    it('should respect maxTokens parameter', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const params: CompletionParams = {
        prompt: 'Test',
        maxTokens: 1000
      }

      await provider.generateCompletion(params)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000
        })
      )
    })

    it('should map max_tokens stop reason to length', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response...' }],
        stop_reason: 'max_tokens',
        usage: { input_tokens: 10, output_tokens: 1000 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const result = await provider.generateCompletion({ prompt: 'Test' })

      expect(result.finishReason).toBe('length')
    })

    it('should handle multiple text content blocks', async () => {
      const mockResponse = {
        content: [
          { type: 'text', text: 'Part 1' },
          { type: 'text', text: 'Part 2' }
        ],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 10 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const result = await provider.generateCompletion({ prompt: 'Test' })

      expect(result.text).toBe('Part 1\nPart 2')
    })
  })

  describe('generateWithVision', () => {
    it('should handle single image with prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'I see a cat in the image' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 20 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const params: VisionParams = {
        prompt: "What's in this image?",
        images: [
          {
            data: 'base64-encoded-image-data',
            mimeType: 'image/jpeg'
          }
        ]
      }

      const result = await provider.generateWithVision(params)

      expect(result.text).toBe('I see a cat in the image')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: "What's in this image?" },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: 'base64-encoded-image-data'
                  }
                }
              ]
            }
          ]
        })
      )
    })

    it('should handle multiple images', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'I see two images' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 200, output_tokens: 10 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const params: VisionParams = {
        prompt: 'Compare these images',
        images: [
          { data: 'image1-data', mimeType: 'image/jpeg' },
          { data: 'image2-data', mimeType: 'image/png' }
        ]
      }

      const result = await provider.generateWithVision(params)

      expect(result.text).toBe('I see two images')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Compare these images' },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: 'image1-data'
                  }
                },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: 'image2-data'
                  }
                }
              ]
            }
          ]
        })
      )
    })

    it('should support PDF analysis', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'This PDF contains 3 pages' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 500, output_tokens: 15 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const params: VisionParams = {
        prompt: 'Analyze this PDF',
        images: [
          {
            data: 'base64-pdf-data',
            mimeType: 'application/pdf'
          }
        ]
      }

      await provider.generateWithVision(params)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: 'base64-pdf-data'
                  }
                })
              ])
            }
          ]
        })
      )
    })
  })

  describe('calculateCost', () => {
    it('should calculate cost accurately for input and output tokens', () => {
      const tokens: TokenUsage = {
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        totalTokens: 1_500_000
      }

      const cost = provider.calculateCost(tokens)

      expect(cost).toEqual({
        inputCost: 3.0, // 1M tokens * $3/M
        outputCost: 7.5, // 0.5M tokens * $15/M
        totalCost: 10.5,
        tokensUsed: tokens
      })
    })

    it('should calculate cost for fractional million tokens', () => {
      const tokens: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500
      }

      const cost = provider.calculateCost(tokens)

      expect(cost.inputCost).toBeCloseTo(0.003, 6) // 0.001M * $3
      expect(cost.outputCost).toBeCloseTo(0.0075, 6) // 0.0005M * $15
      expect(cost.totalCost).toBeCloseTo(0.0105, 6)
    })

    it('should handle zero tokens', () => {
      const tokens: TokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      }

      const cost = provider.calculateCost(tokens)

      expect(cost).toEqual({
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        tokensUsed: tokens
      })
    })

    it('should use specific model pricing when model ID provided', () => {
      const tokens: TokenUsage = {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        totalTokens: 2_000_000
      }

      const cost = provider.calculateCost(
        tokens,
        'claude-sonnet-4-5-20250929'
      )

      expect(cost.totalCost).toBe(18.0) // (1M * $3) + (1M * $15)
    })

    it('should throw error for unknown model', () => {
      const tokens: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000
      }

      expect(() => {
        provider.calculateCost(tokens, 'unknown-model')
      }).toThrow('Model not found: unknown-model')
    })
  })

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'test' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 1 },
        model: 'claude-sonnet-4-5-20250929'
      })

      const isHealthy = await provider.healthCheck()

      expect(isHealthy).toBe(true)
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    })

    it('should return false when API is unavailable', async () => {
      mockCreate.mockRejectedValue(new Error('API unavailable'))

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation()

      const isHealthy = await provider.healthCheck()

      expect(isHealthy).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should propagate API errors', async () => {
      const apiError = new Error('Rate limit exceeded')
      mockCreate.mockRejectedValue(apiError)

      await expect(
        provider.generateCompletion({ prompt: 'Test' })
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle malformed API responses gracefully', async () => {
      const mockResponse = {
        content: [], // Empty content
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 0 },
        model: 'claude-sonnet-4-5-20250929'
      }

      mockCreate.mockResolvedValue(mockResponse)

      const result = await provider.generateCompletion({ prompt: 'Test' })

      expect(result.text).toBe('')
    })
  })
})
