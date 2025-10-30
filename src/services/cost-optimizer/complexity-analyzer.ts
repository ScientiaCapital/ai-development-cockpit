/**
 * Complexity Analyzer Service
 *
 * Analyzes prompt complexity to determine optimal LLM routing.
 * Uses token counting and keyword detection to classify prompts as:
 * - Simple (free tier: Gemini Flash)
 * - Complex (mid tier: Claude Haiku)
 * - Specialized (premium tier: RunPod Chinese LLMs)
 */

import { get_encoding } from 'tiktoken'
import type { ComplexityScore, CostTier, Provider } from '@/types/cost-optimizer'

// Keywords that indicate complex reasoning tasks
const COMPLEX_KEYWORDS = [
  // Analytical keywords
  'explain', 'analyze', 'compare', 'evaluate', 'assess', 'critique',
  'examine', 'investigate', 'study', 'explore', 'review',

  // Design and planning keywords
  'design', 'architect', 'plan', 'strategy', 'approach', 'methodology',
  'framework', 'system', 'structure', 'organize',

  // Problem-solving keywords
  'solve', 'optimize', 'improve', 'enhance', 'refactor', 'debug',
  'troubleshoot', 'fix', 'resolve', 'address',

  // Creative and synthesis keywords
  'create', 'generate', 'develop', 'build', 'construct', 'compose',
  'synthesize', 'integrate', 'combine', 'merge',

  // Advanced reasoning keywords
  'why', 'how', 'what if', 'hypothetical', 'theoretical', 'abstract',
  'conceptual', 'philosophical', 'ethical', 'implications',

  // Code complexity keywords
  'algorithm', 'complexity', 'performance', 'scalability', 'security',
  'architecture', 'pattern', 'best practice', 'trade-off'
]

// Keywords that indicate specialized Chinese LLM requirements
const CHINESE_LLM_KEYWORDS = [
  // Chinese language indicators
  '中文', '汉语', '普通话', '简体', '繁体',

  // Chinese-specific tasks
  '翻译', '解释', '分析', '总结', '写作',

  // Mixed content indicators
  'chinese', 'mandarin', 'translate to chinese', 'chinese characters'
]

// Simple task keywords (short, factual queries)
const SIMPLE_KEYWORDS = [
  'what is', 'define', 'meaning of', 'tell me', 'show me',
  'list', 'who is', 'when', 'where', 'which'
]

export class ComplexityAnalyzer {
  private tokenizer: ReturnType<typeof get_encoding>

  constructor() {
    // Initialize tiktoken with cl100k_base encoding (GPT-4, GPT-3.5-turbo)
    this.tokenizer = get_encoding('cl100k_base')
  }

  /**
   * Analyze prompt complexity and recommend routing
   */
  analyze(prompt: string, context?: {
    conversationHistory?: Array<{ role: string; content: string }>
    systemMessage?: string
  }): ComplexityScore {
    // Count tokens in the prompt
    const tokenCount = this.countTokens(prompt)

    // Include conversation history in token count if provided
    let totalTokens = tokenCount
    if (context?.conversationHistory) {
      totalTokens += this.countTokens(
        context.conversationHistory.map(msg => msg.content).join('\n')
      )
    }
    if (context?.systemMessage) {
      totalTokens += this.countTokens(context.systemMessage)
    }

    // Detect keywords
    const promptLower = prompt.toLowerCase()
    const hasComplexKeywords = this.detectComplexKeywords(promptLower)
    const hasSimpleKeywords = this.detectSimpleKeywords(promptLower)
    const hasChineseKeywords = this.detectChineseKeywords(prompt) // Check original case

    // Calculate base complexity score (0-100)
    let score = this.calculateBaseScore(
      totalTokens,
      hasComplexKeywords,
      hasSimpleKeywords
    )

    // Detect keywords that influenced the score
    const detectedKeywords: string[] = []
    if (hasComplexKeywords.detected) {
      detectedKeywords.push(...hasComplexKeywords.keywords)
    }
    if (hasSimpleKeywords.detected) {
      detectedKeywords.push(...hasSimpleKeywords.keywords)
    }
    if (hasChineseKeywords.detected) {
      detectedKeywords.push(...hasChineseKeywords.keywords)
    }

    // Determine tier and provider
    const { tier, provider, confidence, reasoning } = this.determineRouting(
      score,
      totalTokens,
      hasComplexKeywords.detected,
      hasSimpleKeywords.detected,
      hasChineseKeywords.detected
    )

    // Estimate latency based on provider and complexity
    const estimatedLatency = this.estimateLatency(provider, totalTokens, score)

    return {
      score,
      tokenCount: totalTokens,
      hasComplexKeywords: hasComplexKeywords.detected,
      estimatedLatency,
      recommendedTier: tier,
      recommendedProvider: provider,
      confidence,
      detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : undefined,
      reasoning
    }
  }

  /**
   * Count tokens in text using tiktoken
   */
  private countTokens(text: string): number {
    try {
      const tokens = this.tokenizer.encode(text)
      return tokens.length
    } catch (error) {
      console.warn('Token counting failed, using word-based estimation:', error)
      // Fallback: estimate ~1.3 tokens per word
      return Math.ceil(text.split(/\s+/).length * 1.3)
    }
  }

  /**
   * Detect complex keywords in prompt
   */
  private detectComplexKeywords(promptLower: string): {
    detected: boolean
    keywords: string[]
  } {
    const found: string[] = []

    for (const keyword of COMPLEX_KEYWORDS) {
      if (promptLower.includes(keyword.toLowerCase())) {
        found.push(keyword)
      }
    }

    return {
      detected: found.length > 0,
      keywords: found
    }
  }

  /**
   * Detect simple keywords in prompt
   */
  private detectSimpleKeywords(promptLower: string): {
    detected: boolean
    keywords: string[]
  } {
    const found: string[] = []

    for (const keyword of SIMPLE_KEYWORDS) {
      if (promptLower.includes(keyword.toLowerCase())) {
        found.push(keyword)
      }
    }

    return {
      detected: found.length > 0,
      keywords: found
    }
  }

  /**
   * Detect Chinese language keywords
   */
  private detectChineseKeywords(prompt: string): {
    detected: boolean
    keywords: string[]
  } {
    const found: string[] = []

    // Check for Chinese characters (Unicode range)
    const chineseCharRegex = /[\u4e00-\u9fff]/
    if (chineseCharRegex.test(prompt)) {
      found.push('Chinese characters detected')
    }

    // Check for specific Chinese keywords
    const promptLower = prompt.toLowerCase()
    for (const keyword of CHINESE_LLM_KEYWORDS) {
      if (promptLower.includes(keyword.toLowerCase()) || prompt.includes(keyword)) {
        found.push(keyword)
      }
    }

    return {
      detected: found.length > 0,
      keywords: found
    }
  }

  /**
   * Calculate base complexity score (0-100)
   */
  private calculateBaseScore(
    tokenCount: number,
    hasComplex: { detected: boolean; keywords: string[] },
    hasSimple: { detected: boolean; keywords: string[] }
  ): number {
    let score = 0

    // Token count contribution (0-40 points)
    // <50 tokens = 0-10 points
    // 50-100 tokens = 10-20 points
    // 100-200 tokens = 20-30 points
    // >200 tokens = 30-40 points
    if (tokenCount < 50) {
      score += (tokenCount / 50) * 10
    } else if (tokenCount < 100) {
      score += 10 + ((tokenCount - 50) / 50) * 10
    } else if (tokenCount < 200) {
      score += 20 + ((tokenCount - 100) / 100) * 10
    } else {
      score += Math.min(40, 30 + ((tokenCount - 200) / 200) * 10)
    }

    // Complex keywords boost (0-40 points)
    if (hasComplex.detected) {
      // More keywords = higher score
      const keywordBoost = Math.min(40, hasComplex.keywords.length * 10)
      score += keywordBoost
    }

    // Simple keywords reduce score (-20 points)
    if (hasSimple.detected && !hasComplex.detected) {
      score = Math.max(0, score - 20)
    }

    // Structure complexity (0-20 points)
    // Questions, code blocks, multiple sentences add complexity
    const structureScore = 0 // TODO: Implement in future iteration

    return Math.min(100, Math.round(score))
  }

  /**
   * Determine routing tier and provider based on analysis
   */
  private determineRouting(
    score: number,
    tokenCount: number,
    hasComplexKeywords: boolean,
    hasSimpleKeywords: boolean,
    hasChineseKeywords: boolean
  ): {
    tier: CostTier
    provider: Provider
    confidence: number
    reasoning: string
  } {
    let tier: CostTier
    let provider: Provider
    let confidence: number
    let reasoning: string

    // Special case: Chinese language detected - route to RunPod
    if (hasChineseKeywords) {
      return {
        tier: 'premium',
        provider: 'runpod',
        confidence: 0.95,
        reasoning: 'Chinese language detected - routing to specialized Chinese LLM (RunPod)'
      }
    }

    // Simple queries (score < 30) - Free tier
    if (score < 30 && tokenCount < 100) {
      tier = 'free'
      provider = 'gemini'
      confidence = hasSimpleKeywords ? 0.9 : 0.7
      reasoning = 'Simple query with low token count - routing to Gemini Flash (free tier)'
    }
    // Medium complexity (score 30-60) - Mid tier
    else if (score < 60) {
      tier = 'mid'
      provider = hasComplexKeywords ? 'claude' : 'openrouter'
      confidence = 0.8
      reasoning = hasComplexKeywords
        ? 'Complex reasoning detected - routing to Claude Haiku (mid tier)'
        : 'Moderate complexity - routing to OpenRouter (mid tier)'
    }
    // High complexity (score >= 60) - Mid/Premium tier
    else {
      tier = 'mid'
      provider = 'claude'
      confidence = 0.85
      reasoning = 'High complexity task - routing to Claude Haiku (mid tier for quality)'

      // Very high complexity might benefit from premium
      if (score >= 80 && tokenCount > 500) {
        tier = 'premium'
        provider = 'runpod'
        confidence = 0.75
        reasoning = 'Very high complexity with large context - considering RunPod (premium tier)'
      }
    }

    return { tier, provider, confidence, reasoning }
  }

  /**
   * Estimate latency based on provider and complexity
   */
  private estimateLatency(
    provider: Provider,
    tokenCount: number,
    complexityScore: number
  ): number {
    // Base latencies (milliseconds)
    const baseLatency: Record<Provider, number> = {
      gemini: 800,      // Gemini Flash is fast
      claude: 1200,     // Claude is moderate
      openrouter: 1500, // OpenRouter has routing overhead
      runpod: 2000,     // RunPod cold start considerations
      cerebras: 500     // Cerebras is ultra-fast (experimental)
    }

    let latency = baseLatency[provider] || 1500

    // Add latency based on token count
    // ~1ms per token for generation
    latency += tokenCount * 1

    // Add latency based on complexity
    // Complex reasoning adds overhead
    latency += (complexityScore / 100) * 500

    return Math.round(latency)
  }

  /**
   * Clean up tokenizer resources
   */
  destroy(): void {
    try {
      this.tokenizer.free()
    } catch (error) {
      console.warn('Failed to free tokenizer:', error)
    }
  }
}

// Export singleton instance
export const complexityAnalyzer = new ComplexityAnalyzer()

// Export class for testing
export default ComplexityAnalyzer
