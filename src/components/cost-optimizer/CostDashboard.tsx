/**
 * Cost Dashboard Component
 *
 * Real-time cost tracking and analytics dashboard.
 * Displays spending, savings, and provider distribution.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Organization } from '@/contexts/HuggingFaceAuth'
import type { CostStats } from '@/types/cost-optimizer'

interface CostDashboardProps {
  organization: Organization
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
  autoRefresh?: boolean
  refreshInterval?: number
}

export function CostDashboard({
  organization,
  period = 'daily',
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute
}: CostDashboardProps) {
  const [stats, setStats] = useState<CostStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()

    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [organization, period, autoRefresh, refreshInterval])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/optimize/stats?organization=${organization}&period=${period}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
      console.error('Error fetching cost stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error Loading Stats</h3>
        <p className="text-red-600 dark:text-red-500 text-sm">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cost Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {period} View
            </span>
            {autoRefresh && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Live
              </span>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Requests"
            value={formatNumber(stats.totalRequests)}
            icon="📊"
          />
          <MetricCard
            title="Total Cost"
            value={formatCurrency(stats.totalCost)}
            icon="💰"
            trend={stats.totalCost > 0 ? 'neutral' : 'positive'}
          />
          <MetricCard
            title="Savings"
            value={formatCurrency(stats.totalSavings)}
            subtitle={`${stats.savingsPercentage.toFixed(1)}% saved`}
            icon="💎"
            trend="positive"
          />
          <MetricCard
            title="Avg Latency"
            value={`${Math.round(stats.averageLatency)}ms`}
            icon="⚡"
          />
        </div>
      </div>

      {/* Budget Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Budget Status
        </h3>
        <div className="space-y-4">
          <BudgetBar
            label="Daily Budget"
            current={stats.budget.dailySpend}
            limit={stats.budget.dailyLimit}
            percentage={stats.budget.dailyPercentage}
          />
          <BudgetBar
            label="Monthly Budget"
            current={stats.budget.monthlySpend}
            limit={stats.budget.monthlyLimit}
            percentage={stats.budget.monthlyPercentage}
          />
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Provider Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.providerBreakdown).map(([provider, data]) => (
            <ProviderRow
              key={provider}
              provider={provider}
              requests={data.requests}
              cost={data.cost}
              latency={data.averageLatency}
              totalRequests={stats.totalRequests}
            />
          ))}
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cost Tier Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.tierBreakdown).map(([tier, data]) => (
            <TierCard
              key={tier}
              tier={tier}
              requests={data.requests}
              cost={data.cost}
              percentage={data.percentage}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend
}: {
  title: string
  value: string
  subtitle?: string
  icon: string
  trend?: 'positive' | 'negative' | 'neutral'
}) {
  const trendColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${trend ? trendColors[trend] : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  )
}

// Budget Bar Component
function BudgetBar({
  label,
  current,
  limit,
  percentage
}: {
  label: string
  current: number
  limit: number
  percentage: number
}) {
  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        <span className="text-gray-600 dark:text-gray-400">
          {formatCurrency(current)} / {formatCurrency(limit)}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${getColor(percentage)} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {percentage.toFixed(1)}% used
      </div>
    </div>
  )
}

// Provider Row Component
function ProviderRow({
  provider,
  requests,
  cost,
  latency,
  totalRequests
}: {
  provider: string
  requests: number
  cost: number
  latency: number
  totalRequests: number
}) {
  const percentage = (requests / totalRequests) * 100

  const providerIcons: Record<string, string> = {
    gemini: '🆓',
    claude: '🧠',
    openrouter: '🔀',
    runpod: '🚀',
    cerebras: '⚡'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{providerIcons[provider] || '📡'}</span>
        <div>
          <div className="font-medium text-gray-900 dark:text-white capitalize">
            {provider}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {requests} requests ({percentage.toFixed(1)}%)
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-gray-900 dark:text-white">
          {formatCurrency(cost)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(latency)}ms avg
        </div>
      </div>
    </div>
  )
}

// Tier Card Component
function TierCard({
  tier,
  requests,
  cost,
  percentage
}: {
  tier: string
  requests: number
  cost: number
  percentage: number
}) {
  const tierConfig: Record<string, { icon: string; label: string; color: string }> = {
    free: { icon: '🆓', label: 'Free Tier', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
    mid: { icon: '⚡', label: 'Mid Tier', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' },
    premium: { icon: '💎', label: 'Premium', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' }
  }

  const config = tierConfig[tier] || tierConfig.mid

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-2xl">{config.icon}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Requests</span>
          <span className="font-medium text-gray-900 dark:text-white">{requests}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Cost</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Share</span>
          <span className="font-medium text-gray-900 dark:text-white">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

export default CostDashboard
