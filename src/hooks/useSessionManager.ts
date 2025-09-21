'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { useAuth } from './useAuth'
import {
  getCurrentSession,
  refreshSession,
  signOutCurrentSession,
  signOutAllSessions,
  isSessionValid,
  shouldRefreshSession,
  getTimeUntilExpiry,
  getSessionTimeoutWarning,
  logSessionActivity,
  getStoredSessionActivities,
  getSessionSecurityScore,
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
      const { sessionInfo: info } = await getCurrentSession()
      setSessionInfo(info)

      // Load activities
      const storedActivities = getStoredSessionActivities()
      setActivities(storedActivities)
    } catch (error) {
      console.error('Failed to load session info:', error)
    }
  }, [session])

  // Refresh current session
  const refreshCurrentSession = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      const { session: newSession, error } = await refreshSession()
      if (error) {
        console.error('Failed to refresh session:', error)
      } else if (newSession) {
        await loadSessionInfo()
      }
    } catch (error) {
      console.error('Session refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, loadSessionInfo])

  // Sign out current session
  const signOutCurrent = useCallback(async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    try {
      const { error } = await signOutCurrentSession()
      if (error) {
        console.error('Failed to sign out:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [isSigningOut])

  // Sign out all sessions
  const signOutAll = useCallback(async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    try {
      const { error } = await signOutAllSessions()
      if (error) {
        console.error('Failed to sign out all sessions:', error)
      }
    } catch (error) {
      console.error('Sign out all error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [isSigningOut])

  // Extend session by refreshing
  const extendSession = useCallback(async () => {
    await refreshCurrentSession()
    setWarningDismissed(true)
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
    if (!sessionInfo) return

    try {
      await logSessionActivity(sessionInfo.id, type, details)

      // Reload activities
      const storedActivities = getStoredSessionActivities()
      setActivities(storedActivities)
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }, [sessionInfo])

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