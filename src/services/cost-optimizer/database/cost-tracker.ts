/**
 * Cost Tracking Service
 *
 * Logs all LLM requests to Supabase for analytics and cost monitoring.
 * Provides budget checking and real-time cost statistics.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  CostTrackingRecord,
  CostStats,
  Organization,
  Provider,
  CostTier,
  OptimizationResponse
} from '@/types/cost-optimizer'

export class CostTracker {
  private supabase: SupabaseClient

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured - cost tracking disabled')
      // Create a dummy client that won't be used
      this.supabase = createClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
      return
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Log a request to the database
   */
  async logRequest(
    organizationId: Organization,
    response: OptimizationResponse,
    userId?: string
  ): Promise<void> {
    try {
      const record: Omit<CostTrackingRecord, 'id' | 'createdAt'> = {
        organizationId,
        userId,
        requestId: response.requestId,
        promptText: this.truncateText(response.complexityAnalysis.reasoning || '', 500),
        promptTokens: response.tokensUsed.input,
        completionTokens: response.tokensUsed.output,
        totalTokens: response.tokensUsed.total,
        modelUsed: response.model,
        provider: response.provider,
        tier: response.tier,
        complexityScore: response.complexityAnalysis.score,
        costUsd: response.cost.total,
        latencyMs: response.latency,
        cached: response.cached,
        metadata: {
          finishReason: response.finishReason,
          savingsUsd: response.savings,
          savingsPercentage: response.savingsPercentage
        }
      }

      const { error } = await this.supabase
        .from('cost_optimizer_requests')
        .insert({
          organization_id: record.organizationId,
          user_id: record.userId,
          request_id: record.requestId,
          prompt_text: record.promptText,
          prompt_tokens: record.promptTokens,
          completion_tokens: record.completionTokens,
          model_used: record.modelUsed,
          provider: record.provider,
          tier: record.tier,
          complexity_score: record.complexityScore,
          cost_usd: record.costUsd,
          latency_ms: record.latencyMs,
          cached: record.cached,
          savings_usd: response.savings,
          metadata: record.metadata
        })

      if (error) {
        console.error('Failed to log request to database:', error)
      }
    } catch (error) {
      console.error('Cost tracking error:', error)
      // Don't throw - cost tracking failures shouldn't break the request
    }
  }

  /**
   * Get cost statistics for an organization
   */
  async getStats(
    organizationId: Organization,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<CostStats | null> {
    try {
      const now = new Date()
      const periodStart = this.getPeriodStart(period, now)

      // Query requests in the period
      const { data: requests, error } = await this.supabase
        .from('cost_optimizer_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', now.toISOString())

      if (error) {
        console.error('Failed to fetch cost stats:', error)
        return null
      }

      if (!requests || requests.length === 0) {
        return this.getEmptyStats(organizationId, period, periodStart, now)
      }

      // Calculate statistics
      const totalRequests = requests.length
      const totalCost = requests.reduce((sum, r) => sum + Number(r.cost_usd), 0)
      const averageCost = totalCost / totalRequests
      const averageLatency = requests.reduce((sum, r) => sum + r.latency_ms, 0) / totalRequests
      const totalSavings = requests.reduce((sum, r) => sum + Number(r.savings_usd || 0), 0)

      // Provider breakdown
      const providerBreakdown = this.calculateProviderBreakdown(requests)

      // Tier breakdown
      const tierBreakdown = this.calculateTierBreakdown(requests, totalRequests)

      // Budget information (get from config or defaults)
      const budget = await this.getBudgetInfo(organizationId, totalCost)

      return {
        organizationId,
        period,
        periodStart: periodStart.toISOString(),
        periodEnd: now.toISOString(),
        totalRequests,
        totalCost,
        averageCost,
        averageLatency,
        providerBreakdown,
        tierBreakdown,
        totalSavings,
        savingsPercentage: totalCost > 0 ? (totalSavings / (totalCost + totalSavings)) * 100 : 0,
        budget
      }
    } catch (error) {
      console.error('Error fetching cost stats:', error)
      return null
    }
  }

  /**
   * Check if budget limit is exceeded
   */
  async checkBudget(organizationId: Organization): Promise<{
    dailyExceeded: boolean
    monthlyExceeded: boolean
    dailyPercentage: number
    monthlyPercentage: number
  }> {
    try {
      const dailyStats = await this.getStats(organizationId, 'daily')
      const monthlyStats = await this.getStats(organizationId, 'monthly')

      if (!dailyStats || !monthlyStats) {
        return {
          dailyExceeded: false,
          monthlyExceeded: false,
          dailyPercentage: 0,
          monthlyPercentage: 0
        }
      }

      return {
        dailyExceeded: dailyStats.budget.dailyPercentage >= 100,
        monthlyExceeded: monthlyStats.budget.monthlyPercentage >= 100,
        dailyPercentage: dailyStats.budget.dailyPercentage,
        monthlyPercentage: monthlyStats.budget.monthlyPercentage
      }
    } catch (error) {
      console.error('Budget check error:', error)
      return {
        dailyExceeded: false,
        monthlyExceeded: false,
        dailyPercentage: 0,
        monthlyPercentage: 0
      }
    }
  }

  /**
   * Calculate provider breakdown
   */
  private calculateProviderBreakdown(requests: any[]): CostStats['providerBreakdown'] {
    const breakdown: CostStats['providerBreakdown'] = {}

    for (const request of requests) {
      const provider = request.provider as Provider

      if (!breakdown[provider]) {
        breakdown[provider] = {
          requests: 0,
          cost: 0,
          averageLatency: 0,
          tokens: { input: 0, output: 0, total: 0 }
        }
      }

      breakdown[provider]!.requests++
      breakdown[provider]!.cost += Number(request.cost_usd)
      breakdown[provider]!.averageLatency += request.latency_ms
      breakdown[provider]!.tokens.input += request.prompt_tokens
      breakdown[provider]!.tokens.output += request.completion_tokens
      breakdown[provider]!.tokens.total += request.prompt_tokens + request.completion_tokens
    }

    // Calculate averages
    for (const provider in breakdown) {
      breakdown[provider as Provider]!.averageLatency /= breakdown[provider as Provider]!.requests
    }

    return breakdown
  }

  /**
   * Calculate tier breakdown
   */
  private calculateTierBreakdown(
    requests: any[],
    totalRequests: number
  ): CostStats['tierBreakdown'] {
    const breakdown: CostStats['tierBreakdown'] = {}

    for (const request of requests) {
      const tier = request.tier as CostTier

      if (!breakdown[tier]) {
        breakdown[tier] = { requests: 0, cost: 0, percentage: 0 }
      }

      breakdown[tier]!.requests++
      breakdown[tier]!.cost += Number(request.cost_usd)
    }

    // Calculate percentages
    for (const tier in breakdown) {
      breakdown[tier as CostTier]!.percentage = (breakdown[tier as CostTier]!.requests / totalRequests) * 100
    }

    return breakdown
  }

  /**
   * Get budget information
   */
  private async getBudgetInfo(
    organizationId: Organization,
    currentSpend: number
  ): Promise<CostStats['budget']> {
    // Default budgets (can be customized per organization)
    const budgets = {
      swaggystacks: { daily: 2.0, monthly: 50.0 },
      'scientia-capital': { daily: 10.0, monthly: 200.0 }
    }

    const orgBudget = budgets[organizationId] || budgets.swaggystacks

    // Get daily and monthly spend
    const dailyStats = await this.getStats(organizationId, 'daily')
    const monthlyStats = await this.getStats(organizationId, 'monthly')

    const dailySpend = dailyStats?.totalCost || 0
    const monthlySpend = monthlyStats?.totalCost || 0

    return {
      dailyLimit: orgBudget.daily,
      monthlyLimit: orgBudget.monthly,
      dailySpend,
      monthlySpend,
      dailyPercentage: (dailySpend / orgBudget.daily) * 100,
      monthlyPercentage: (monthlySpend / orgBudget.monthly) * 100,
      alertsEnabled: true
    }
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(
    organizationId: Organization,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): CostStats {
    return {
      organizationId,
      period: period as 'hourly' | 'daily' | 'weekly' | 'monthly',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalRequests: 0,
      totalCost: 0,
      averageCost: 0,
      averageLatency: 0,
      providerBreakdown: {},
      tierBreakdown: {},
      totalSavings: 0,
      savingsPercentage: 0,
      budget: {
        dailyLimit: 5.0,
        monthlyLimit: 50.0,
        dailySpend: 0,
        monthlySpend: 0,
        dailyPercentage: 0,
        monthlyPercentage: 0,
        alertsEnabled: true
      }
    }
  }

  /**
   * Get period start date
   */
  private getPeriodStart(period: string, now: Date): Date {
    const start = new Date(now)

    switch (period) {
      case 'hourly':
        start.setMinutes(0, 0, 0)
        break
      case 'daily':
        start.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
    }

    return start
  }

  /**
   * Truncate text to max length
   */
  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text
  }
}

// Export singleton instance
export const costTracker = new CostTracker()

export default CostTracker
