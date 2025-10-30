/**
 * Savings Indicator Component
 *
 * Visual indicator showing cost savings in real-time.
 * Can be used inline or as a floating badge.
 */

'use client'

import React from 'react'

interface SavingsIndicatorProps {
  savings: number
  savingsPercentage: number
  totalCost: number
  provider?: string
  tier?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'badge' | 'detailed'
  animated?: boolean
}

export function SavingsIndicator({
  savings,
  savingsPercentage,
  totalCost,
  provider,
  tier,
  size = 'md',
  variant = 'inline',
  animated = true
}: SavingsIndicatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-lg px-4 py-3'
      default:
        return 'text-sm px-3 py-2'
    }
  }

  const getTierColor = () => {
    switch (tier) {
      case 'free':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'mid':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'premium':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }

  const getProviderIcon = () => {
    const icons: Record<string, string> = {
      gemini: '🆓',
      claude: '🧠',
      openrouter: '🔀',
      runpod: '🚀',
      cerebras: '⚡'
    }
    return provider ? icons[provider] || '📡' : '💎'
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center rounded-full ${getSizeClasses()} ${getTierColor()} border ${animated ? 'animate-pulse' : ''}`}>
        <span className="mr-1">{getProviderIcon()}</span>
        <span className="font-semibold">
          {formatCurrency(savings)} saved
        </span>
        {savingsPercentage > 0 && (
          <span className="ml-1 opacity-75">
            ({savingsPercentage.toFixed(0)}%)
          </span>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getProviderIcon()}</span>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cost Optimization
              </div>
              {provider && (
                <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                  via {provider}
                </div>
              )}
            </div>
          </div>
          {tier && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor()}`}>
              {tier} tier
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Actual Cost
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalCost)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Savings
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(savings)}
            </div>
          </div>
        </div>

        {savingsPercentage > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Optimization Efficiency</span>
              <span className="font-medium">{savingsPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, savingsPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default inline variant
  return (
    <div className="inline-flex items-center space-x-2">
      <span className="text-gray-600 dark:text-gray-400 text-sm">
        Cost: {formatCurrency(totalCost)}
      </span>
      {savings > 0 && (
        <>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <span className="text-green-600 dark:text-green-400 font-medium text-sm">
            {getProviderIcon()} Saved {formatCurrency(savings)}
          </span>
        </>
      )}
      {provider && (
        <>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <span className={`${getSizeClasses()} ${getTierColor()} rounded-full font-medium capitalize`}>
            {provider}
          </span>
        </>
      )}
    </div>
  )
}

/**
 * Compact version for tight spaces
 */
export function SavingsBadge({
  savings,
  size = 'sm'
}: {
  savings: number
  size?: 'sm' | 'md' | 'lg'
}) {
  if (savings === 0) return null

  const formatCurrency = (amount: number) => {
    if (amount < 0.01) {
      return `$${(amount * 1000).toFixed(2)}m` // Show in thousandths
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-medium ${sizeClasses[size]}`}>
      💎 {formatCurrency(savings)}
    </span>
  )
}

/**
 * Animated savings counter
 */
export function SavingsCounter({
  savings,
  duration = 1000
}: {
  savings: number
  duration?: number
}) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      setDisplayValue(savings * progress)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [savings, duration])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  return (
    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
      {formatCurrency(displayValue)}
    </div>
  )
}

export default SavingsIndicator
