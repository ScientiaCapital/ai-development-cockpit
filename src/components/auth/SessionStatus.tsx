'use client'

import { useState } from 'react'
import { useSession, useSessionMetrics } from '../../hooks/useSession'
import { AlertTriangle, RefreshCw, Clock, Activity, CheckCircle, XCircle } from 'lucide-react'

interface SessionStatusProps {
  showMetrics?: boolean
  className?: string
}

export function SessionStatus({ showMetrics = false, className = '' }: SessionStatusProps) {
  const {
    sessionInfo,
    refreshSession,
    isLoading,
    isHealthy,
    timeUntilExpiry,
    showingExpiryWarning,
    dismissWarning
  } = useSession({
    autoRefresh: true,
    showExpiryWarnings: true
  })

  const [showDetails, setShowDetails] = useState(false)

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return '<1m'
    }
  }

  const getStatusColor = () => {
    if (sessionInfo.isExpired) return 'text-red-400'
    if (sessionInfo.isNearExpiry) return 'text-yellow-400'
    if (isHealthy) return 'text-green-400'
    return 'text-gray-400'
  }

  const getStatusIcon = () => {
    if (sessionInfo.isExpired) return <XCircle className="w-4 h-4" />
    if (sessionInfo.isNearExpiry) return <AlertTriangle className="w-4 h-4" />
    if (isHealthy) return <CheckCircle className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (sessionInfo.isExpired) return 'Session Expired'
    if (sessionInfo.isNearExpiry && timeUntilExpiry) {
      return `Expires in ${formatTimeLeft(timeUntilExpiry)}`
    }
    if (isHealthy) return 'Session Active'
    return 'Session Issues'
  }

  if (!sessionInfo.session) {
    return null
  }

  return (
    <div className={`session-status ${className}`}>
      {/* Main Status Display */}
      <div className="flex items-center space-x-2 text-sm">
        <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => refreshSession()}
          disabled={isLoading}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Refresh Session"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Details Toggle */}
        {showMetrics && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>

      {/* Expiry Warning */}
      {showingExpiryWarning && (
        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your session will expire soon. 
                {timeUntilExpiry && ` Time remaining: ${formatTimeLeft(timeUntilExpiry)}`}
              </p>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => refreshSession()}
                  disabled={isLoading}
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Refreshing...' : 'Extend Session'}
                </button>
                <button
                  onClick={dismissWarning}
                  className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      {showDetails && showMetrics && <SessionMetricsDisplay />}
    </div>
  )
}

function SessionMetricsDisplay() {
  const {
    totalRefreshes,
    failedRefreshes,
    sessionDurationFormatted,
    averageRefreshIntervalFormatted,
    lastRefreshAttempt,
    isHealthy,
    sessionInfo
  } = useSessionMetrics()

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Session Metrics</h4>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Duration:</span>
          <span className="ml-1 font-mono">{sessionDurationFormatted}</span>
        </div>
        
        <div>
          <span className="text-gray-500 dark:text-gray-400">Health:</span>
          <span className={`ml-1 font-medium ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isHealthy ? 'Good' : 'Poor'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-500 dark:text-gray-400">Refreshes:</span>
          <span className="ml-1 font-mono">{totalRefreshes}</span>
        </div>
        
        <div>
          <span className="text-gray-500 dark:text-gray-400">Failed:</span>
          <span className={`ml-1 font-mono ${failedRefreshes > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
            {failedRefreshes}
          </span>
        </div>
        
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Last Refresh:</span>
          <span className="ml-1 font-mono">{formatTimestamp(lastRefreshAttempt)}</span>
        </div>
        
        {averageRefreshIntervalFormatted && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Avg Interval:</span>
            <span className="ml-1 font-mono">{averageRefreshIntervalFormatted}</span>
          </div>
        )}
      </div>
      
      {sessionInfo.expiresAt && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs">
            <span className="text-gray-500 dark:text-gray-400">Expires:</span>
            <span className="ml-1 font-mono">
              {new Date(sessionInfo.expiresAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for header/navbar
export function SessionStatusCompact({ className = '' }: { className?: string }) {
  const { sessionInfo, isHealthy, timeUntilExpiry } = useSession()

  if (!sessionInfo.session) return null

  const getStatusDot = () => {
    if (sessionInfo.isExpired) return 'bg-red-500'
    if (sessionInfo.isNearExpiry) return 'bg-yellow-500'
    if (isHealthy) return 'bg-green-500'
    return 'bg-gray-500'
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusDot()}`} />
      {sessionInfo.isNearExpiry && timeUntilExpiry && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3 inline mr-1" />
          {Math.floor(timeUntilExpiry / 60000)}m
        </span>
      )}
    </div>
  )
}