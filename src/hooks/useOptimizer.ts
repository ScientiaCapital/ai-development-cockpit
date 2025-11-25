/**
 * useOptimizer Hook
 *
 * React hook for easy cost optimizer integration.
 * Handles state management, API calls, and error handling.
 */

'use client'

import { useState, useCallback } from 'react'
import type {
  OptimizationRequest,
  OptimizationResponse,
  OptimizationRecommendation,
  CostStats,
  Organization
} from '@/types/cost-optimizer'

interface UseOptimizerOptions {
  organization: Organization
  onSuccess?: (response: OptimizationResponse) => void
  onError?: (error: Error) => void
}

interface UseOptimizerReturn {
  // State
  loading: boolean
  error: Error | null
  response: OptimizationResponse | null
  recommendation: OptimizationRecommendation | null
  stats: CostStats | null

  // Actions
  optimize: (request: Omit<OptimizationRequest, 'organizationId'>) => Promise<OptimizationResponse | null>
  getRecommendation: (request: Omit<OptimizationRequest, 'organizationId'>) => Promise<OptimizationRecommendation | null>
  fetchStats: (period?: 'hourly' | 'daily' | 'weekly' | 'monthly') => Promise<CostStats | null>
  reset: () => void

  // Computed values
  totalCost: number
  totalSavings: number
  savingsPercentage: number
}

export function useOptimizer({
  organization,
  onSuccess,
  onError
}: UseOptimizerOptions): UseOptimizerReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<OptimizationResponse | null>(null)
  const [recommendation, setRecommendation] = useState<OptimizationRecommendation | null>(null)
  const [stats, setStats] = useState<CostStats | null>(null)

  /**
   * Optimize completion request
   */
  const optimize = useCallback(async (
    request: Omit<OptimizationRequest, 'organizationId'>
  ): Promise<OptimizationResponse | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/optimize/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...request,
          organizationId: organization
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Request failed: ${response.statusText}`)
      }

      const data: OptimizationResponse = await response.json()
      setResponse(data)

      if (onSuccess) {
        onSuccess(data)
      }

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)

      if (onError) {
        onError(error)
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [organization, onSuccess, onError])

  /**
   * Get routing recommendation without execution
   */
  const getRecommendation = useCallback(async (
    request: Omit<OptimizationRequest, 'organizationId'>
  ): Promise<OptimizationRecommendation | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/optimize/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...request,
          organizationId: organization
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Request failed: ${response.statusText}`)
      }

      const data: OptimizationRecommendation = await response.json()
      setRecommendation(data)

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)

      if (onError) {
        onError(error)
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [organization, onError])

  /**
   * Fetch cost statistics
   */
  const fetchStats = useCallback(async (
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<CostStats | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/optimize/stats?organization=${organization}&period=${period}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Request failed: ${response.statusText}`)
      }

      const data: CostStats = await response.json()
      setStats(data)

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)

      if (onError) {
        onError(error)
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [organization, onError])

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setResponse(null)
    setRecommendation(null)
    setStats(null)
  }, [])

  // Computed values
  const totalCost = response?.cost.total || 0
  const totalSavings = response?.savings || 0
  const savingsPercentage = response?.savingsPercentage || 0

  return {
    // State
    loading,
    error,
    response,
    recommendation,
    stats,

    // Actions
    optimize,
    getRecommendation,
    fetchStats,
    reset,

    // Computed values
    totalCost,
    totalSavings,
    savingsPercentage
  }
}

/**
 * Example usage:
 *
 * ```tsx
 * function MyComponent() {
 *   const { optimize, loading, response, totalSavings } = useOptimizer({
 *     organization: 'arcade',
 *     onSuccess: (response) => {
 *       console.log('Optimization complete!', response)
 *     }
 *   })
 *
 *   const handleSubmit = async () => {
 *     await optimize({
 *       prompt: "Explain quantum computing",
 *       maxTokens: 500
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleSubmit} disabled={loading}>
 *         {loading ? 'Optimizing...' : 'Submit'}
 *       </button>
 *       {response && (
 *         <div>
 *           <p>{response.content}</p>
 *           <p>Saved: ${totalSavings.toFixed(6)}</p>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */

export default useOptimizer
