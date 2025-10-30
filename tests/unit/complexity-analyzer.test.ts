/**
 * Complexity Analyzer Unit Tests
 *
 * Tests for the complexity analysis and routing logic.
 */

import { ComplexityAnalyzer } from '@/services/cost-optimizer/complexity-analyzer'
import type { ComplexityScore } from '@/types/cost-optimizer'

describe('ComplexityAnalyzer', () => {
  let analyzer: ComplexityAnalyzer

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer()
  })

  afterEach(() => {
    analyzer.destroy()
  })

  describe('Simple Queries (Free Tier)', () => {
    it('should route simple factual queries to Gemini (free tier)', () => {
      const result = analyzer.analyze('What is the capital of France?')

      expect(result.recommendedTier).toBe('free')
      expect(result.recommendedProvider).toBe('gemini')
      expect(result.score).toBeLessThan(30)
    })

    it('should detect simple keywords', () => {
      const result = analyzer.analyze('Tell me what is TypeScript')

      expect(result.hasComplexKeywords).toBe(false)
      expect(result.detectedKeywords).toContain('what is')
      expect(result.recommendedTier).toBe('free')
    })

    it('should handle very short prompts', () => {
      const result = analyzer.analyze('Hello')

      expect(result.tokenCount).toBeLessThan(10)
      expect(result.score).toBeLessThan(20)
      expect(result.recommendedTier).toBe('free')
    })

    it('should route list requests to free tier', () => {
      const result = analyzer.analyze('List the top 5 programming languages')

      expect(result.detectedKeywords).toContain('list')
      expect(result.score).toBeLessThan(30)
      expect(result.recommendedTier).toBe('free')
    })
  })

  describe('Complex Queries (Mid Tier)', () => {
    it('should route complex reasoning to Claude (mid tier)', () => {
      const result = analyzer.analyze(
        'Explain the differences between functional and object-oriented programming, ' +
        'and analyze which approach is better for large-scale applications'
      )

      expect(result.hasComplexKeywords).toBe(true)
      expect(result.detectedKeywords).toContain('explain')
      expect(result.detectedKeywords).toContain('analyze')
      expect(result.score).toBeGreaterThan(30)
      expect(result.recommendedTier).toBe('mid')
      expect(result.recommendedProvider).toBe('claude')
    })

    it('should detect design and architecture keywords', () => {
      const result = analyzer.analyze(
        'Design a scalable architecture for a microservices-based e-commerce platform'
      )

      expect(result.hasComplexKeywords).toBe(true)
      expect(result.detectedKeywords).toContain('design')
      expect(result.score).toBeGreaterThan(40)
      expect(result.recommendedProvider).toBe('claude')
    })

    it('should route problem-solving tasks appropriately', () => {
      const result = analyzer.analyze(
        'Debug this code and optimize it for better performance: [code block here]'
      )

      expect(result.hasComplexKeywords).toBe(true)
      expect(result.score).toBeGreaterThan(30)
    })

    it('should handle medium-length prompts with complexity', () => {
      const longPrompt = 'Analyze and compare '.repeat(10) + 'different approaches'

      const result = analyzer.analyze(longPrompt)

      expect(result.tokenCount).toBeGreaterThan(50)
      expect(result.score).toBeGreaterThan(20)
    })
  })

  describe('Chinese Language Detection (Premium Tier)', () => {
    it('should detect Chinese characters and route to RunPod', () => {
      const result = analyzer.analyze('请解释什么是人工智能')

      expect(result.detectedKeywords).toContainEqual(expect.stringContaining('Chinese'))
      expect(result.recommendedTier).toBe('premium')
      expect(result.recommendedProvider).toBe('runpod')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect mixed Chinese-English content', () => {
      const result = analyzer.analyze('Translate this to Chinese: Hello world')

      expect(result.detectedKeywords).toContain('chinese')
      expect(result.recommendedProvider).toBe('runpod')
    })

    it('should handle Chinese keywords in English', () => {
      const result = analyzer.analyze('Write Chinese translation for this text')

      expect(result.detectedKeywords).toContain('chinese')
      expect(result.recommendedTier).toBe('premium')
    })
  })

  describe('Token Counting', () => {
    it('should accurately count tokens in English text', () => {
      const result = analyzer.analyze('The quick brown fox jumps over the lazy dog')

      // This phrase is typically 10-12 tokens
      expect(result.tokenCount).toBeGreaterThan(8)
      expect(result.tokenCount).toBeLessThan(15)
    })

    it('should handle empty strings', () => {
      const result = analyzer.analyze('')

      expect(result.tokenCount).toBe(0)
      expect(result.score).toBe(0)
    })

    it('should include conversation history in token count', () => {
      const result = analyzer.analyze('What about TypeScript?', {
        conversationHistory: [
          { role: 'user', content: 'Tell me about JavaScript' },
          { role: 'assistant', content: 'JavaScript is a programming language...' }
        ]
      })

      expect(result.tokenCount).toBeGreaterThan(20) // Should include history
    })
  })

  describe('Complexity Scoring', () => {
    it('should assign higher scores to complex keywords', () => {
      const simpleResult = analyzer.analyze('What is AI?')
      const complexResult = analyzer.analyze('Analyze and evaluate the implications of AI')

      expect(complexResult.score).toBeGreaterThan(simpleResult.score)
    })

    it('should consider token count in scoring', () => {
      const shortResult = analyzer.analyze('Hello')
      const longResult = analyzer.analyze('This is a much longer prompt that contains many more words and tokens '.repeat(5))

      expect(longResult.score).toBeGreaterThan(shortResult.score)
    })

    it('should cap complexity score at 100', () => {
      const veryComplexPrompt = 'analyze explain design evaluate investigate examine study explore solve optimize '.repeat(20)

      const result = analyzer.analyze(veryComplexPrompt)

      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should give appropriate scores for mid-range complexity', () => {
      const result = analyzer.analyze(
        'Compare the pros and cons of React vs Vue for a new project'
      )

      expect(result.score).toBeGreaterThan(20)
      expect(result.score).toBeLessThan(80)
    })
  })

  describe('Latency Estimation', () => {
    it('should estimate higher latency for complex queries', () => {
      const simpleResult = analyzer.analyze('Hello')
      const complexResult = analyzer.analyze(
        'Design a comprehensive system architecture for a distributed microservices platform'
      )

      expect(complexResult.estimatedLatency).toBeGreaterThan(simpleResult.estimatedLatency)
    })

    it('should consider provider in latency estimation', () => {
      const result = analyzer.analyze('What is the capital of France?')

      // Gemini is typically faster
      expect(result.estimatedLatency).toBeLessThan(2000)
    })

    it('should account for token count in latency', () => {
      const shortResult = analyzer.analyze('Hi')
      const longResult = analyzer.analyze('Tell me everything about '.repeat(50))

      expect(longResult.estimatedLatency).toBeGreaterThan(shortResult.estimatedLatency)
    })
  })

  describe('Confidence Scoring', () => {
    it('should have high confidence for clear simple queries', () => {
      const result = analyzer.analyze('What is 2+2?')

      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should have high confidence for Chinese language', () => {
      const result = analyzer.analyze('你好世界')

      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should provide confidence values between 0 and 1', () => {
      const result = analyzer.analyze('Some random query')

      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Reasoning Explanations', () => {
    it('should provide reasoning for routing decisions', () => {
      const result = analyzer.analyze('What is AI?')

      expect(result.reasoning).toBeDefined()
      expect(result.reasoning).toContain('routing')
    })

    it('should explain Chinese language routing', () => {
      const result = analyzer.analyze('翻译这个')

      expect(result.reasoning).toContain('Chinese')
      expect(result.reasoning).toContain('RunPod')
    })

    it('should explain tier selection', () => {
      const result = analyzer.analyze('Design a complex system architecture')

      expect(result.reasoning).toContain('tier')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long prompts', () => {
      const veryLongPrompt = 'word '.repeat(1000)

      const result = analyzer.analyze(veryLongPrompt)

      expect(result.tokenCount).toBeGreaterThan(1000)
      expect(result.score).toBeDefined()
      expect(result.recommendedProvider).toBeDefined()
    })

    it('should handle special characters', () => {
      const result = analyzer.analyze('What is @#$%^&*() in programming?')

      expect(result.tokenCount).toBeGreaterThan(0)
      expect(result.recommendedProvider).toBeDefined()
    })

    it('should handle code snippets', () => {
      const result = analyzer.analyze(`
        const foo = () => {
          return 'bar'
        }
        Explain this code
      `)

      expect(result.hasComplexKeywords).toBe(true)
      expect(result.detectedKeywords).toContain('explain')
    })

    it('should handle mixed case keywords', () => {
      const result = analyzer.analyze('EXPLAIN the ARCHITECTURE and DESIGN')

      expect(result.hasComplexKeywords).toBe(true)
      expect(result.score).toBeGreaterThan(30)
    })
  })

  describe('System Message and Context', () => {
    it('should include system message in token count', () => {
      const withoutSystem = analyzer.analyze('Hello')
      const withSystem = analyzer.analyze('Hello', {
        systemMessage: 'You are a helpful assistant that provides detailed explanations'
      })

      expect(withSystem.tokenCount).toBeGreaterThan(withoutSystem.tokenCount)
    })

    it('should handle conversation history', () => {
      const result = analyzer.analyze('Continue', {
        conversationHistory: [
          { role: 'user', content: 'Start explaining quantum physics' },
          { role: 'assistant', content: 'Quantum physics is...' }
        ]
      })

      expect(result.tokenCount).toBeGreaterThan(10)
    })
  })
})
