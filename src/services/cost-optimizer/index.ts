/**
 * Cost Optimizer Service
 *
 * Main orchestration service that coordinates:
 * - Complexity analysis
 * - Provider routing
 * - LLM API calls
 * - Cost tracking
 * - Budget monitoring
 */

import type {
  OptimizationRequest,
  OptimizationResponse,
  OptimizationRecommendation,
  CostStats,
  Organization
} from '@/types/cost-optimizer'

import { complexityAnalyzer } from './complexity-analyzer'
import { routingEngine } from './routing-engine'
import { costTracker } from './database/cost-tracker'

// Provider clients
import { getGeminiClient } from './providers/gemini-client'
import { getClaudeClient } from './providers/claude-client'
import { getOpenRouterClient } from './providers/openrouter-client'

export class CostOptimizerService {
  private enabled: boolean

  constructor() {
    this.enabled = process.env.COST_OPTIMIZER_ENABLED !== 'false'
  }

  /**
   * Main optimization entry point
   * Analyzes, routes, and executes LLM request with cost optimization
   */
  async optimize(request: OptimizationRequest): Promise<OptimizationResponse> {
    // Check if cost optimizer is enabled
    if (!this.enabled) {
      return this.fallbackToDefault(request)
    }

    try {
      // Step 1: Check budget before making request
      const budgetCheck = await costTracker.checkBudget(request.organizationId)

      if (budgetCheck.dailyExceeded) {
        throw new Error(
          `Daily budget exceeded (${budgetCheck.dailyPercentage.toFixed(1)}%)`
        )
      }

      if (budgetCheck.monthlyExceeded) {
        throw new Error(
          `Monthly budget exceeded (${budgetCheck.monthlyPercentage.toFixed(1)}%)`
        )
      }

      // Step 2: Analyze complexity
      const complexity = complexityAnalyzer.analyze(request.prompt, {
        conversationHistory: request.conversationHistory,
        systemMessage: request.systemMessage
      })

      console.log(
        `📊 Complexity Analysis: score=${complexity.score}, ` +
        `tier=${complexity.recommendedTier}, provider=${complexity.recommendedProvider}`
      )

      // Step 3: Route to optimal provider
      const routing = routingEngine.route(request)

      console.log(
        `🎯 Routing: provider=${routing.provider}, tier=${routing.tier}, ` +
        `model=${routing.model}`
      )

      // Step 4: Execute request with selected provider
      const response = await this.executeRequest(
        request,
        routing.provider,
        {
          score: complexity.score,
          tokenCount: complexity.tokenCount
        }
      )

      // Step 5: Log to database for analytics
      await costTracker.logRequest(
        request.organizationId,
        response,
        request.userId
      )

      console.log(
        `💰 Cost: $${response.cost.total.toFixed(6)}, ` +
        `Savings: $${response.savings.toFixed(6)} (${response.savingsPercentage.toFixed(1)}%)`
      )

      return response
    } catch (error) {
      console.error('Cost optimization error:', error)

      // Fall back to default provider on error
      return this.fallbackToDefault(request)
    }
  }

  /**
   * Get routing recommendation without executing
   */
  getRecommendation(request: OptimizationRequest): OptimizationRecommendation {
    if (!this.enabled) {
      throw new Error('Cost optimizer is disabled')
    }

    return routingEngine.getRecommendation(request)
  }

  /**
   * Get cost statistics
   */
  async getStats(
    organizationId: Organization,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<CostStats | null> {
    return costTracker.getStats(organizationId, period)
  }

  /**
   * Check budget status
   */
  async checkBudget(organizationId: Organization): Promise<{
    dailyExceeded: boolean
    monthlyExceeded: boolean
    dailyPercentage: number
    monthlyPercentage: number
  }> {
    return costTracker.checkBudget(organizationId)
  }

  /**
   * Execute request with specific provider
   */
  private async executeRequest(
    request: OptimizationRequest,
    provider: string,
    complexity: { score: number; tokenCount: number }
  ): Promise<OptimizationResponse> {
    switch (provider) {
      case 'gemini':
        return getGeminiClient().complete(request, complexity)

      case 'claude':
        return getClaudeClient().complete(request, complexity)

      case 'openrouter':
        return getOpenRouterClient().complete(request, complexity)

      case 'runpod':
        // TODO: Integrate with existing RunPod service
        throw new Error('RunPod integration not yet implemented')

      case 'cerebras':
        throw new Error('Cerebras integration not yet implemented')

      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  /**
   * Fallback to default provider (Claude) when optimization fails
   */
  private async fallbackToDefault(
    request: OptimizationRequest
  ): Promise<OptimizationResponse> {
    console.warn('Using fallback provider (Claude)')

    try {
      return await getClaudeClient().complete(request, {
        score: 50,
        tokenCount: 500 // Estimated
      })
    } catch (error) {
      throw new Error(
        `Fallback provider failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Enable/disable cost optimizer
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    console.log(`Cost optimizer ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if cost optimizer is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// Export singleton instance
export const costOptimizer = new CostOptimizerService()

// Export for testing
export default CostOptimizerService

// Re-export types for convenience
export type {
  OptimizationRequest,
  OptimizationResponse,
  OptimizationRecommendation,
  CostStats,
  Provider,
  CostTier
} from '@/types/cost-optimizer'
