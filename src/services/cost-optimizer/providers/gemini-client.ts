/**
 * Google Gemini Flash Client
 *
 * Integration with Google Gemini API for free-tier LLM completions.
 * Handles the majority (70%) of simple queries with zero cost.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { OptimizationRequest, OptimizationResponse } from '@/types/cost-optimizer'

export class GeminiClient {
  private client: GoogleGenerativeAI
  private model: GenerativeModel
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || ''

    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY is required for Gemini client')
    }

    this.client = new GoogleGenerativeAI(this.apiKey)
    // Use Gemini 1.5 Flash - optimized for speed and free tier
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  /**
   * Generate completion using Gemini Flash
   */
  async complete(
    request: OptimizationRequest,
    complexity: { score: number; tokenCount: number }
  ): Promise<OptimizationResponse> {
    const startTime = Date.now()

    try {
      // Build prompt with context
      const fullPrompt = this.buildPrompt(request)

      // Generate content
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 1000,
        }
      })

      const response = result.response
      const content = response.text()

      // Calculate token usage (Gemini doesn't provide exact counts)
      // Estimate: ~1.3 tokens per word
      const outputTokens = Math.ceil(content.split(/\s+/).length * 1.3)
      const totalTokens = complexity.tokenCount + outputTokens

      const latency = Date.now() - startTime

      // Gemini Flash is free - zero cost!
      const cost = {
        input: 0,
        output: 0,
        total: 0
      }

      // Calculate savings compared to Claude Haiku
      const claudeCost = (complexity.tokenCount / 1_000_000) * 0.00025 +
                        (outputTokens / 1_000_000) * 0.00125
      const savings = claudeCost

      return {
        content,
        model: 'gemini-1.5-flash',
        provider: 'gemini',
        tier: 'free',
        tokensUsed: {
          input: complexity.tokenCount,
          output: outputTokens,
          total: totalTokens
        },
        cost,
        latency,
        savings,
        savingsPercentage: 100, // 100% savings (free!)
        complexityAnalysis: {
          score: complexity.score,
          tokenCount: complexity.tokenCount,
          hasComplexKeywords: false,
          estimatedLatency: latency,
          recommendedTier: 'free',
          recommendedProvider: 'gemini',
          confidence: 0.9
        },
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        cached: false,
        finishReason: response.candidates?.[0]?.finishReason || 'completed'
      }
    } catch (error) {
      console.error('Gemini completion failed:', error)
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build full prompt with context
   */
  private buildPrompt(request: OptimizationRequest): string {
    let prompt = ''

    // Add system message if provided
    if (request.systemMessage) {
      prompt += `${request.systemMessage}\n\n`
    }

    // Add conversation history if provided
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      for (const msg of request.conversationHistory) {
        const role = msg.role === 'user' ? 'Human' : 'Assistant'
        prompt += `${role}: ${msg.content}\n\n`
      }
    }

    // Add current prompt
    prompt += `Human: ${request.prompt}\n\nAssistant:`

    return prompt
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `gemini_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Test connection to Gemini API
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })

      return !!result.response.text()
    } catch (error) {
      console.error('Gemini connection test failed:', error)
      return false
    }
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    name: string
    tier: string
    costPerInputToken: number
    costPerOutputToken: number
  } {
    return {
      name: 'gemini-1.5-flash',
      tier: 'free',
      costPerInputToken: 0,
      costPerOutputToken: 0
    }
  }
}

// Export singleton instance (lazy-loaded to handle missing API key)
let geminiClientInstance: GeminiClient | null = null

export function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiClient()
  }
  return geminiClientInstance
}

export default GeminiClient
