'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { useAuth } from './useAuth'
import {
  getCurrentSession,
  signOutCurrentSession,
  signOutAllSessions,
  isSessionValid,
  shouldRefreshSession,
  getTimeUntilExpiry,
  getSessionTimeoutWarning,
  logSessionActivity,
  getStoredSessionActivities,
  getSessionSecurityScore,
  sessionManager,
  type SessionInfo,
  type SessionActivity
} from '../lib/session'

interface UseSessionManagerReturn {
  // Session state
  sessionInfo: SessionInfo | null
  activities: SessionActivity[]
  isValid: boolean
  timeUntilExpiry: number
  securityScore: number

  // Warning state
  showTimeoutWarning: boolean
  timeoutMessage: string
  timeLeft: number

  // Loading states
  isRefreshing: boolean
  isSigningOut: boolean

  // Actions
  refreshCurrentSession: () => Promise<void>
  signOutCurrent: () => Promise<void>
  signOutAll: () => Promise<void>
  extendSession: () => Promise<void>
  dismissWarning: () => void

  // Utilities
  getSecurityAnalysis: () => ReturnType<typeof getSessionSecurityScore>
  logActivity: (type: SessionActivity['activity_type'], details?: Record<string, any>) => Promise<void>
}

export function useSessionManager(): UseSessionManagerReturn {
  const { session, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [activities, setActivities] = useState<SessionActivity[]>([])
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [warningDismissed, setWarningDismissed] = useState(false)

  // Refs for intervals
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const warningIntervalRef = useRef<NodeJS.Timeout>()

  // Load session information
  const loadSessionInfo = useCallback(async () => {
    if (!session) {
      setSessionInfo(null)
      setActivities([])
      return
    }

    try {
      const { sessionInfo: currentSessionInfo, error } = await getCurrentSession()

      if (error) {
        console.error('Failed to get session info:', error)
        return
      }

      setSessionInfo(currentSessionInfo)

      // Reload activities
      const storedActivities = getStoredSessionActivities()
      setActivities(storedActivities)
    } catch (error) {
      console.error('Failed to load session info:', error)
    }
  }, [session])

  // Get security analysis
  const getSecurityAnalysis = useCallback(() => {
    if (!sessionInfo) {
      return {
        score: 0,
        factors: []
      }
    }

    return getSessionSecurityScore(sessionInfo)
  }, [sessionInfo])

  // Refresh current session
  const refreshCurrentSession = useCallback(async () => {
    if (!session) return

    setIsRefreshing(true)
    try {
      const { success, session: newSession, error } = await sessionManager.refreshSession()

      if (success && newSession) {
        // Session info will be updated through the loadSessionInfo effect
        await loadSessionInfo()

        // Log activity if we have sessionInfo
        if (sessionInfo?.id) {
          await logSessionActivity(sessionInfo.id, 'refresh', {
            timestamp: new Date().toISOString(),
            success: true
          })
        }
      } else {
        console.error('Failed to refresh session:', error)
        // Log failed refresh attempt
        if (sessionInfo?.id) {
          await logSessionActivity(sessionInfo.id, 'error', {
            type: 'refresh_failed',
            error: error?.message || 'Unknown error',
            timestamp: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      // Log error
      if (sessionInfo?.id) {
        await logSessionActivity(sessionInfo.id, 'error', {
          type: 'refresh_exception',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [session, sessionInfo, loadSessionInfo])

  // Sign out current session
  const signOutCurrent = useCallback(async () => {
    if (!session) return

    setIsSigningOut(true)
    try {
      // Log logout activity before signing out
      if (sessionInfo?.id) {
        await logSessionActivity(sessionInfo.id, 'logout', {
          timestamp: new Date().toISOString(),
          type: 'current_session'
        })
      }

      const { error } = await signOutCurrentSession()

      if (error) {
        console.error('Failed to sign out current session:', error)
      } else {
        // Clear local state
        setSessionInfo(null)
        setActivities([])
        setShowTimeoutWarning(false)
        setWarningDismissed(false)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [session, sessionInfo])

  // Sign out all sessions
  const signOutAll = useCallback(async () => {
    if (!session) return

    setIsSigningOut(true)
    try {
      // Log logout activity before signing out
      if (sessionInfo?.id) {
        await logSessionActivity(sessionInfo.id, 'logout', {
          timestamp: new Date().toISOString(),
          type: 'all_sessions'
        })
      }

      const { error } = await signOutAllSessions()

      if (error) {
        console.error('Failed to sign out all sessions:', error)
      } else {
        // Clear local state
        setSessionInfo(null)
        setActivities([])
        setShowTimeoutWarning(false)
        setWarningDismissed(false)
      }
    } catch (error) {
      console.error('Sign out all error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [session, sessionInfo])

  // Extend session (refresh and reset warning)
  const extendSession = useCallback(async () => {
    await refreshCurrentSession()
    setWarningDismissed(false)
    setShowTimeoutWarning(false)
  }, [refreshCurrentSession])

  // Dismiss timeout warning
  const dismissWarning = useCallback(() => {
    setWarningDismissed(true)
    setShowTimeoutWarning(false)
  }, [])

  // Log activity
  const logActivity = useCallback(async (
    type: SessionActivity['activity_type'],
    details?: Record<string, any>
  ) => {
    if (!sessionInfo?.id) {
      console.warn('Cannot log activity: session ID is undefined')
      return
    }

    try {
      await logSessionActivity(sessionInfo.id, type, details)

      // Reload activities to include the new one
      const storedActivities = getStoredSessionActivities()
      setActivities(storedActivities)
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }, [sessionInfo])

  // Set up automatic session refresh
  useEffect(() => {
    if (!session || loading) return

    const checkAndRefreshSession = () => {
      if (shouldRefreshSession(session)) {
        refreshCurrentSession()
      }
    }

    // Check every minute
    refreshIntervalRef.current = setInterval(checkAndRefreshSession, 60 * 1000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [session, loading, refreshCurrentSession])

  // Set up timeout warning
  useEffect(() => {
    if (!session || loading) return

    const checkTimeout = () => {
      const warning = getSessionTimeoutWarning(session)

      if (warning.shouldWarn && !warningDismissed) {
        setShowTimeoutWarning(true)
      } else if (!warning.shouldWarn) {
        setShowTimeoutWarning(false)
        setWarningDismissed(false)
      }
    }

    // Check every 30 seconds
    warningIntervalRef.current = setInterval(checkTimeout, 30 * 1000)

    // Initial check
    checkTimeout()

    return () => {
      if (warningIntervalRef.current) {
        clearInterval(warningIntervalRef.current)
      }
    }
  }, [session, loading, warningDismissed])

  // Load session info when session changes
  useEffect(() => {
    loadSessionInfo()
  }, [loadSessionInfo])

  // Computed values
  const isValid = isSessionValid(session)
  const timeUntilExpiry = getTimeUntilExpiry(session)
  const securityScore = sessionInfo ? getSessionSecurityScore(sessionInfo).score : 0

  // Timeout warning details
  const timeoutWarning = getSessionTimeoutWarning(session)

  return {
    // Session state
    sessionInfo,
    activities,
    isValid,
    timeUntilExpiry,
    securityScore,

    // Warning state
    showTimeoutWarning,
    timeoutMessage: timeoutWarning.message,
    timeLeft: timeoutWarning.timeLeft,

    // Loading states
    isRefreshing,
    isSigningOut,

    // Actions
    refreshCurrentSession,
    signOutCurrent,
    signOutAll,
    extendSession,
    dismissWarning,

    // Utilities
    getSecurityAnalysis,
    logActivity
  }
}