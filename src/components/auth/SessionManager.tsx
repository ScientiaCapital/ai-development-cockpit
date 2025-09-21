'use client'

import { useState } from 'react'
import { useSessionManager } from '../../hooks/useSessionManager'
import { useAuth } from '../../hooks/useAuth'

interface SessionManagerProps {
  className?: string
}

export default function SessionManager({ className = '' }: SessionManagerProps) {
  const { user } = useAuth()
  const {
    sessionInfo,
    activities,
    isValid,
    timeUntilExpiry,
    securityScore,
    isRefreshing,
    isSigningOut,
    refreshCurrentSession,
    signOutCurrent,
    signOutAll,
    getSecurityAnalysis
  } = useSessionManager()

  const [showActivities, setShowActivities] = useState(false)
  const [showSecurityDetails, setShowSecurityDetails] = useState(false)

  if (!user || !sessionInfo) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Session Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No active session found.
          </p>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getSecurityScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSecurityScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/50'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/50'
    return 'bg-red-100 dark:bg-red-900/50'
  }

  const securityAnalysis = getSecurityAnalysis()

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Session Management
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Monitor and manage your active authentication sessions.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Session Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Session
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isValid
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {isValid ? 'Active' : 'Expired'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Remaining</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">
                  {formatTime(timeUntilExpiry)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {new Date(sessionInfo.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Activity</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {sessionInfo.last_activity
                    ? new Date(sessionInfo.last_activity).toLocaleString()
                    : 'Unknown'
                  }
                </span>
              </div>
            </div>

            {/* Device Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Device</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize">
                  {sessionInfo.device_info?.device_type || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OS</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {sessionInfo.device_info?.operating_system || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Browser</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {sessionInfo.device_info?.browser || 'Unknown'}
                  {sessionInfo.device_info?.browser_version && ` ${sessionInfo.device_info.browser_version}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {sessionInfo.location_info?.timezone || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Score */}
        <div className={`p-4 rounded-lg ${getSecurityScoreBg(securityScore)}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Session Security Score
            </h4>
            <span className={`text-lg font-bold ${getSecurityScoreColor(securityScore)}`}>
              {securityScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                securityScore >= 80
                  ? 'bg-green-600'
                  : securityScore >= 60
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${securityScore}%` }}
            ></div>
          </div>
          <button
            onClick={() => setShowSecurityDetails(!showSecurityDetails)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showSecurityDetails ? 'Hide' : 'Show'} security details
          </button>

          {showSecurityDetails && (
            <div className="mt-3 space-y-2">
              {securityAnalysis.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{factor.factor}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">{factor.score}/10</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {factor.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Session Actions
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={refreshCurrentSession}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Session
                </>
              )}
            </button>

            <button
              onClick={() => setShowActivities(!showActivities)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {showActivities ? 'Hide' : 'Show'} Activity Log
            </button>

            <button
              onClick={signOutCurrent}
              disabled={isSigningOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isSigningOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing Out...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </>
              )}
            </button>

            <button
              onClick={signOutAll}
              disabled={isSigningOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Sign Out All Devices
            </button>
          </div>
        </div>

        {/* Activity Log */}
        {showActivities && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recent Activity ({activities.length} events)
            </h4>
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
              {activities.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activities.slice(-10).reverse().map((activity) => (
                    <div key={activity.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            activity.activity_type === 'login'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : activity.activity_type === 'logout'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : activity.activity_type === 'refresh'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {activity.activity_type}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {activity.activity_type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {activity.details && (
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {JSON.stringify(activity.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No activity recorded yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}