/**
 * Cost Optimizer Client
 *
 * Service-to-service integration with the ai-cost-optimizer microservice
 * Routes all AI requests through the optimizer for 90% cost savings
 */

export interface CostOptimizerConfig {
  apiUrl: string
  apiKey: string
  timeout?: number
}

export interface OptimizeRequest {
  prompt: string
  complexity: 'simple' | 'medium' | 'complex'
  agentType: string
  organizationId: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface OptimizeResponse {
  content: string
  provider: string
  model: string
  cost: number
  tokens: {
    input: number
    output: number
  }
  duration: number
  cached?: boolean
}

export interface CostStats {
  totalCost: number
  totalRequests: number
  providers: Record<
    string,
    {
      requests: number
      cost: number
      avgDuration: number
    }
  >
}

export class CostOptimizerClient {
  private config: CostOptimizerConfig
  private stats: CostStats

  constructor(config: CostOptimizerConfig) {
    this.config = {
      timeout: 30000, // 30 second default timeout
      ...config
    }

    this.stats = {
      totalCost: 0,
      totalRequests: 0,
      providers: {}
    }

    console.log('💰 Cost Optimizer Client initialized:', {
      url: this.config.apiUrl,
      timeout: this.config.timeout
    })
  }

  /**
   * Optimize a single completion request
   */
  async optimizeCompletion(request: OptimizeRequest): Promise<OptimizeResponse> {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(`${this.config.apiUrl}/api/optimize/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(
          `Cost optimizer API error: ${response.status} ${response.statusText}`
        )
      }

      const data: OptimizeResponse = await response.json()

      // Update stats
      this.updateStats(data)

      console.log(
        `✅ Cost Optimizer: ${data.provider}/${data.model} - $${data.cost.toFixed(4)} (${data.duration}ms)`
      )

      return data
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`)
      }
      console.error('❌ Cost Optimizer error:', error)
      throw error
    }
  }

  /**
   * Get routing recommendation without making the actual call
   */
  async getRecommendation(request: OptimizeRequest): Promise<{
    provider: string
    model: string
    estimatedCost: number
    reasoning: string
  }> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/optimize/recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(request)
        }
      )

      if (!response.ok) {
        throw new Error(
          `Recommendation API error: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    } catch (error) {
      console.error('❌ Recommendation error:', error)
      throw error
    }
  }

  /**
   * Get current usage stats from the optimizer
   */
  async getUsageStats(organizationId: string): Promise<{
    totalCost: number
    requestCount: number
    savings: number
    breakdown: Record<string, any>
  }> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/optimize/stats?organizationId=${organizationId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Stats API error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('❌ Stats error:', error)
      throw error
    }
  }

  /**
   * Update local stats tracking
   */
  private updateStats(response: OptimizeResponse): void {
    this.stats.totalCost += response.cost
    this.stats.totalRequests += 1

    if (!this.stats.providers[response.provider]) {
      this.stats.providers[response.provider] = {
        requests: 0,
        cost: 0,
        avgDuration: 0
      }
    }

    const providerStats = this.stats.providers[response.provider]
    providerStats.requests += 1
    providerStats.cost += response.cost
    providerStats.avgDuration =
      (providerStats.avgDuration * (providerStats.requests - 1) + response.duration) /
      providerStats.requests
  }

  /**
   * Get local client stats
   */
  getStats(): CostStats {
    return { ...this.stats }
  }

  /**
   * Reset local stats
   */
  resetStats(): void {
    this.stats = {
      totalCost: 0,
      totalRequests: 0,
      providers: {}
    }
  }

  /**
   * Health check - verify the cost optimizer service is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('❌ Health check failed:', error)
      return false
    }
  }
}

/**
 * Create a singleton instance for the application
 */
export function createCostOptimizerClient(): CostOptimizerClient {
  const apiUrl = process.env.COST_OPTIMIZER_API_URL
  const apiKey = process.env.COST_OPTIMIZER_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error(
      'Missing environment variables: COST_OPTIMIZER_API_URL and COST_OPTIMIZER_API_KEY are required'
    )
  }

  return new CostOptimizerClient({
    apiUrl,
    apiKey
  })
}
