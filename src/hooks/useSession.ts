import { useState, useEffect, useCallback, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { sessionManager, SessionInfo, SessionMetrics, SESSION_CONFIG } from '../lib/session'

export interface UseSessionOptions {
  // Enable automatic session refresh
  autoRefresh?: boolean
  
  // Show expiry warnings
  showExpiryWarnings?: boolean
  
  // Custom warning callback
  onExpiryWarning?: (timeLeft: number) => void
  
  // Custom expiry callback
  onSessionExpired?: () => void
  
  // Custom refresh callback
  onSessionRefreshed?: (session: Session) => void
  
  // Enable cross-tab synchronization
  enableCrossTabSync?: boolean
}

export interface UseSessionReturn {
  // Session state
  sessionInfo: SessionInfo
  metrics: SessionMetrics
  isLoading: boolean
  
  // Session actions
  refreshSession: () => Promise<{ success: boolean; session: Session | null; error?: any }>
  forceExpiry: () => void
  
  // Session health
  isHealthy: boolean
  timeUntilExpiry: number | null
  timeUntilWarning: number | null
  
  // Warning state
  showingExpiryWarning: boolean
  dismissWarning: () => void
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    autoRefresh = true,
    showExpiryWarnings = true,
    onExpiryWarning,
    onSessionExpired,
    onSessionRefreshed,
    enableCrossTabSync = true
  } = options

  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(() => sessionManager.getSessionInfo())
  const [metrics, setMetrics] = useState<SessionMetrics>(() => sessionManager.getSessionMetrics())
  const [isLoading, setIsLoading] = useState(false)
  const [showingExpiryWarning, setShowingExpiryWarning] = useState(false)
  
  const warningDismissedRef = useRef(false)
  const lastWarningTimeRef = useRef<number | null>(null)

  // Calculate time until expiry and warning
  const timeUntilExpiry = sessionInfo.expiresAt ? Math.max(0, sessionInfo.expiresAt - Date.now()) : null
  const timeUntilWarning = sessionInfo.expiresAt 
    ? Math.max(0, sessionInfo.expiresAt - Date.now() - SESSION_CONFIG.EXPIRY_WARNING_TIME)
    : null

  // Session health check
  const isHealthy = sessionManager.isSessionHealthy()

  // Manual session refresh
  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await sessionManager.refreshSession()
      
      if (result.success && result.session && onSessionRefreshed) {
        onSessionRefreshed(result.session)
      }
      
      // Update metrics after refresh
      setMetrics(sessionManager.getSessionMetrics())
      
      return result
    } finally {
      setIsLoading(false)
    }
  }, [onSessionRefreshed])

  // Force session expiry
  const forceExpiry = useCallback(() => {
    sessionManager.forceExpiry()
  }, [])

  // Dismiss expiry warning
  const dismissWarning = useCallback(() => {
    setShowingExpiryWarning(false)
    warningDismissedRef.current = true
    lastWarningTimeRef.current = Date.now()
  }, [])

  // Handle session state changes
  useEffect(() => {
    const unsubscribe = sessionManager.addListener((newSessionInfo) => {
      setSessionInfo(newSessionInfo)
      setMetrics(sessionManager.getSessionMetrics())

      // Handle session expiry
      if (newSessionInfo.isExpired && onSessionExpired) {
        onSessionExpired()
      }

      // Handle expiry warnings
      if (showExpiryWarnings && newSessionInfo.isNearExpiry && !newSessionInfo.isExpired) {
        const now = Date.now()
        const timeLeft = newSessionInfo.expiresAt ? newSessionInfo.expiresAt - now : 0
        
        // Only show warning if it hasn't been dismissed recently (within 5 minutes)
        const timeSinceLastDismissal = lastWarningTimeRef.current ? now - lastWarningTimeRef.current : Infinity
        const shouldShowWarning = !warningDismissedRef.current || timeSinceLastDismissal > 5 * 60 * 1000
        
        if (shouldShowWarning) {
          setShowingExpiryWarning(true)
          warningDismissedRef.current = false
          
          if (onExpiryWarning) {
            onExpiryWarning(timeLeft)
          }
        }
      } else {
        setShowingExpiryWarning(false)
        warningDismissedRef.current = false
      }
    })

    // Initialize session manager if not already done
    sessionManager.initialize().then(setSessionInfo)

    return unsubscribe
  }, [showExpiryWarnings, onExpiryWarning, onSessionExpired])

  // Handle cross-tab synchronization
  useEffect(() => {
    if (!enableCrossTabSync || typeof window === 'undefined') return

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'supabase-session') {
        // Session changed in another tab
        sessionManager.initialize().then(setSessionInfo)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, check session health
        const currentInfo = sessionManager.getSessionInfo()
        if (currentInfo.session && currentInfo.isNearExpiry) {
          refreshSession()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enableCrossTabSync, refreshSession])

  // Auto-refresh on focus (if session is near expiry)
  useEffect(() => {
    if (!autoRefresh) return

    const handleFocus = () => {
      const currentInfo = sessionManager.getSessionInfo()
      if (currentInfo.session && currentInfo.isNearExpiry && !currentInfo.isExpired) {
        refreshSession()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [autoRefresh, refreshSession])

  return {
    // Session state
    sessionInfo,
    metrics,
    isLoading,

    // Session actions
    refreshSession,
    forceExpiry,

    // Session health
    isHealthy,
    timeUntilExpiry,
    timeUntilWarning,

    // Warning state
    showingExpiryWarning,
    dismissWarning
  }
}

// Specialized hooks for common use cases

/**
 * Hook for monitoring session expiry with automatic warnings
 */
export function useSessionMonitor(onExpired?: () => void) {
  return useSession({
    autoRefresh: true,
    showExpiryWarnings: true,
    onSessionExpired: onExpired
  })
}

/**
 * Hook for session refresh control (manual refresh only)
 */
export function useSessionRefresh() {
  const { refreshSession, isLoading, sessionInfo } = useSession({
    autoRefresh: false,
    showExpiryWarnings: false
  })

  return {
    refreshSession,
    isRefreshing: isLoading,
    canRefresh: !!sessionInfo.session && !sessionInfo.isExpired
  }
}

/**
 * Hook for session metrics and debugging
 */
export function useSessionMetrics() {
  const { metrics, sessionInfo, isHealthy } = useSession({
    autoRefresh: false,
    showExpiryWarnings: false
  })

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return {
    ...metrics,
    sessionInfo,
    isHealthy,
    formatDuration,
    sessionDurationFormatted: formatDuration(metrics.sessionDuration),
    averageRefreshIntervalFormatted: formatDuration(metrics.averageRefreshInterval)
  }
}