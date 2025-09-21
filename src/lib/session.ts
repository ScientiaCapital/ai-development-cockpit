import { supabase } from './supabase'
import { Session, User } from '@supabase/supabase-js'

// Session storage keys
const SESSION_STORAGE_KEY = 'supabase-session'
const SESSION_EXPIRY_WARNING_KEY = 'session-expiry-warning'
const AUTO_REFRESH_INTERVAL_KEY = 'auto-refresh-interval'

// Session configuration
export const SESSION_CONFIG = {
  // Time before expiry to show warning (in milliseconds)
  EXPIRY_WARNING_TIME: 5 * 60 * 1000, // 5 minutes
  
  // Auto-refresh interval (in milliseconds)
  AUTO_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
  
  // Grace period after expiry for silent refresh
  GRACE_PERIOD: 2 * 60 * 1000, // 2 minutes
  
  // Maximum retry attempts for refresh
  MAX_REFRESH_RETRIES: 3,
  
  // Backoff multiplier for retries
  RETRY_BACKOFF_MULTIPLIER: 1.5
}

export interface DeviceInfo {
  device_type?: string
  operating_system?: string
  browser?: string
  browser_version?: string
}

export interface LocationInfo {
  timezone?: string
  city?: string
  country?: string
}

export interface SessionInfo {
  session: Session | null
  user: User | null
  expiresAt: number | null
  isExpired: boolean
  isNearExpiry: boolean
  refreshCount: number
  lastRefresh: number | null
  id?: string
  created_at?: string | number | Date
  last_activity?: string | number | Date
  device_info?: DeviceInfo
  location_info?: LocationInfo
}

export interface SessionMetrics {
  totalRefreshes: number
  failedRefreshes: number
  lastRefreshAttempt: number | null
  sessionDuration: number
  averageRefreshInterval: number
}

export interface SecurityFactor {
  factor: string
  score: number
  description: string
}

export interface SecurityAnalysis {
  score: number
  factors: SecurityFactor[]
}

export interface SessionActivity {
  id: string
  session_id: string
  activity_type: 'login' | 'logout' | 'refresh' | 'access' | 'warning' | 'error'
  timestamp: string | number | Date
  details?: Record<string, any>
}

export class SessionManager {
  private static instance: SessionManager
  private refreshTimer: NodeJS.Timeout | null = null
  private warningTimer: NodeJS.Timeout | null = null
  private currentSession: Session | null = null
  private refreshCount = 0
  private failedRefreshCount = 0
  private sessionStartTime: number | null = null
  private refreshAttempts: number[] = []
  private listeners: Set<(sessionInfo: SessionInfo) => void> = new Set()

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Initialize session management with automatic refresh
   */
  async initialize(): Promise<SessionInfo> {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Failed to get initial session:', error)
        return this.createSessionInfo(null)
      }

      this.currentSession = session
      
      if (session) {
        this.sessionStartTime = Date.now()
        this.setupAutoRefresh(session)
        this.setupExpiryWarning(session)
      }

      return this.createSessionInfo(session)
    } catch (error) {
      console.error('Session initialization error:', error)
      return this.createSessionInfo(null)
    }
  }

  /**
   * Manually refresh the current session
   */
  async refreshSession(retryCount = 0): Promise<{ success: boolean; session: Session | null; error?: any }> {
    try {
      console.log(`Attempting session refresh (attempt ${retryCount + 1}/${SESSION_CONFIG.MAX_REFRESH_RETRIES})`)
      
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        this.failedRefreshCount++
        
        if (retryCount < SESSION_CONFIG.MAX_REFRESH_RETRIES - 1) {
          // Exponential backoff retry
          const delay = 1000 * Math.pow(SESSION_CONFIG.RETRY_BACKOFF_MULTIPLIER, retryCount)
          console.log(`Session refresh failed, retrying in ${delay}ms...`)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.refreshSession(retryCount + 1)
        }
        
        console.error('Session refresh failed after all retries:', error)
        this.handleSessionExpiry()
        return { success: false, session: null, error }
      }

      // Successful refresh
      this.currentSession = session
      this.refreshCount++
      this.refreshAttempts.push(Date.now())
      
      // Keep only last 10 refresh attempts for metrics
      if (this.refreshAttempts.length > 10) {
        this.refreshAttempts = this.refreshAttempts.slice(-10)
      }

      if (session) {
        this.setupAutoRefresh(session)
        this.setupExpiryWarning(session)
      }

      // Notify listeners
      this.notifyListeners(this.createSessionInfo(session))

      console.log('Session refreshed successfully')
      return { success: true, session }
    } catch (error) {
      this.failedRefreshCount++
      console.error('Session refresh error:', error)
      
      if (retryCount < SESSION_CONFIG.MAX_REFRESH_RETRIES - 1) {
        const delay = 1000 * Math.pow(SESSION_CONFIG.RETRY_BACKOFF_MULTIPLIER, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.refreshSession(retryCount + 1)
      }
      
      this.handleSessionExpiry()
      return { success: false, session: null, error }
    }
  }

  /**
   * Setup automatic session refresh
   */
  private setupAutoRefresh(session: Session): void {
    this.clearTimers()

    const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (1 * 60 * 60 * 1000) // Default 1 hour
    const now = Date.now()
    const timeUntilRefresh = Math.max(
      expiresAt - now - SESSION_CONFIG.EXPIRY_WARNING_TIME,
      SESSION_CONFIG.AUTO_REFRESH_INTERVAL
    )

    this.refreshTimer = setTimeout(() => {
      this.refreshSession()
    }, timeUntilRefresh)

    console.log(`Auto-refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`)
  }

  /**
   * Setup expiry warning notification
   */
  private setupExpiryWarning(session: Session): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
    }

    const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (1 * 60 * 60 * 1000)
    const now = Date.now()
    const timeUntilWarning = Math.max(expiresAt - now - SESSION_CONFIG.EXPIRY_WARNING_TIME, 0)

    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        this.notifyListeners(this.createSessionInfo(session))
        console.warn('Session will expire soon!')
      }, timeUntilWarning)
    }
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(): void {
    console.warn('Session has expired')
    this.currentSession = null
    this.clearTimers()
    this.notifyListeners(this.createSessionInfo(null))
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
      this.warningTimer = null
    }
  }

  /**
   * Get current session information
   */
  getSessionInfo(): SessionInfo {
    return this.createSessionInfo(this.currentSession)
  }

  /**
   * Create session info object
   */
  private createSessionInfo(session: Session | null): SessionInfo {
    const now = Date.now()
    const expiresAt = session?.expires_at ? session.expires_at * 1000 : null
    
    return {
      session,
      user: session?.user || null,
      expiresAt,
      isExpired: expiresAt ? now > expiresAt : false,
      isNearExpiry: expiresAt ? (expiresAt - now) < SESSION_CONFIG.EXPIRY_WARNING_TIME : false,
      refreshCount: this.refreshCount,
      lastRefresh: this.refreshAttempts.length > 0 ? this.refreshAttempts[this.refreshAttempts.length - 1] : null
    }
  }

  /**
   * Get session metrics for monitoring
   */
  getSessionMetrics(): SessionMetrics {
    const now = Date.now()
    const sessionDuration = this.sessionStartTime ? now - this.sessionStartTime : 0
    
    let averageRefreshInterval = 0
    if (this.refreshAttempts.length > 1) {
      const intervals = []
      for (let i = 1; i < this.refreshAttempts.length; i++) {
        intervals.push(this.refreshAttempts[i] - this.refreshAttempts[i - 1])
      }
      averageRefreshInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    }

    return {
      totalRefreshes: this.refreshCount,
      failedRefreshes: this.failedRefreshCount,
      lastRefreshAttempt: this.refreshAttempts.length > 0 ? this.refreshAttempts[this.refreshAttempts.length - 1] : null,
      sessionDuration,
      averageRefreshInterval
    }
  }

  /**
   * Add session state listener
   */
  addListener(callback: (sessionInfo: SessionInfo) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of session state changes
   */
  private notifyListeners(sessionInfo: SessionInfo): void {
    this.listeners.forEach(callback => {
      try {
        callback(sessionInfo)
      } catch (error) {
        console.error('Error in session listener:', error)
      }
    })
  }

  /**
   * Persist session to storage (for cross-tab sync)
   */
  persistSession(session: Session | null): void {
    try {
      if (typeof window !== 'undefined') {
        if (session) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            session,
            timestamp: Date.now()
          }))
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to persist session:', error)
    }
  }

  /**
   * Load session from storage
   */
  loadPersistedSession(): Session | null {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY)
        if (stored) {
          const { session, timestamp } = JSON.parse(stored)
          
          // Check if stored session is still valid
          const expiresAt = session.expires_at ? session.expires_at * 1000 : timestamp + (1 * 60 * 60 * 1000)
          if (Date.now() < expiresAt) {
            return session
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persisted session:', error)
    }
    return null
  }

  /**
   * Cleanup all timers and listeners
   */
  cleanup(): void {
    this.clearTimers()
    this.listeners.clear()
    this.currentSession = null
    this.refreshCount = 0
    this.failedRefreshCount = 0
    this.sessionStartTime = null
    this.refreshAttempts = []
  }

  /**
   * Force session expiry (for testing or manual logout)
   */
  forceExpiry(): void {
    this.handleSessionExpiry()
  }

  /**
   * Check if session is healthy
   */
  isSessionHealthy(): boolean {
    const sessionInfo = this.getSessionInfo()
    return !sessionInfo.isExpired && this.failedRefreshCount < SESSION_CONFIG.MAX_REFRESH_RETRIES
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Utility functions
export const getSessionInfo = () => sessionManager.getSessionInfo()
export const refreshSession = () => sessionManager.refreshSession()
export const getSessionMetrics = () => sessionManager.getSessionMetrics()
export const addSessionListener = (callback: (sessionInfo: SessionInfo) => void) => 
  sessionManager.addListener(callback)

// Session validation functions
export const isSessionValid = (session: Session | null): boolean => {
  if (!session) return false
  const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (1 * 60 * 60 * 1000)
  return Date.now() < expiresAt
}

export const shouldRefreshSession = (session: Session | null): boolean => {
  if (!session) return false
  const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (1 * 60 * 60 * 1000)
  const timeUntilExpiry = expiresAt - Date.now()
  return timeUntilExpiry < SESSION_CONFIG.EXPIRY_WARNING_TIME
}

export const getTimeUntilExpiry = (session: Session | null): number => {
  if (!session) return 0
  const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (1 * 60 * 60 * 1000)
  const timeUntilExpiry = Math.max(0, expiresAt - Date.now())
  return Math.floor(timeUntilExpiry / 1000) // Return seconds
}

export const getSessionTimeoutWarning = (session: Session | null): { shouldWarn: boolean; timeLeft: number; message: string } => {
  if (!session) {
    return { shouldWarn: false, timeLeft: 0, message: '' }
  }
  
  const timeUntilExpiry = getTimeUntilExpiry(session)
  const shouldWarn = timeUntilExpiry < (SESSION_CONFIG.EXPIRY_WARNING_TIME / 1000)
  
  return {
    shouldWarn,
    timeLeft: timeUntilExpiry,
    message: shouldWarn ? `Your session will expire in ${Math.ceil(timeUntilExpiry / 60)} minutes.` : ''
  }
}

// Session activity management
export const logSessionActivity = async (
  sessionId: string,
  activityType: SessionActivity['activity_type'],
  details?: Record<string, any>
): Promise<void> => {
  try {
    const activity: SessionActivity = {
      id: Math.random().toString(36).substr(2, 9),
      session_id: sessionId,
      activity_type: activityType,
      timestamp: new Date().toISOString(),
      details
    }
    
    // Store in local storage for now (could be extended to use Supabase)
    const stored = getStoredSessionActivities()
    stored.push(activity)
    
    // Keep only last 50 activities
    const activities = stored.slice(-50)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('session-activities', JSON.stringify(activities))
    }
  } catch (error) {
    console.error('Failed to log session activity:', error)
  }
}

export const getStoredSessionActivities = (): SessionActivity[] => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('session-activities')
      return stored ? JSON.parse(stored) : []
    }
  } catch (error) {
    console.error('Failed to get stored session activities:', error)
  }
  return []
}

// Session security scoring
export const getSessionSecurityScore = (sessionInfo: SessionInfo): SecurityAnalysis => {
  const factors: SecurityFactor[] = []
  let totalScore = 0
  
  // Factor 1: Session age (newer is better)
  if (sessionInfo.created_at) {
    const sessionAge = Date.now() - new Date(sessionInfo.created_at).getTime()
    const ageHours = sessionAge / (1000 * 60 * 60)
    const ageScore = Math.max(0, Math.min(10, 10 - (ageHours / 24) * 2)) // Decrease score over 24 hours
    factors.push({
      factor: 'Session Age',
      score: Math.round(ageScore),
      description: `Session is ${Math.round(ageHours)} hours old`
    })
    totalScore += ageScore
  }
  
  // Factor 2: Recent activity (more recent is better)
  if (sessionInfo.last_activity) {
    const lastActivity = Date.now() - new Date(sessionInfo.last_activity).getTime()
    const activityMinutes = lastActivity / (1000 * 60)
    const activityScore = Math.max(0, Math.min(10, 10 - (activityMinutes / 60) * 3)) // Decrease over 1 hour
    factors.push({
      factor: 'Recent Activity',
      score: Math.round(activityScore),
      description: `Last activity ${Math.round(activityMinutes)} minutes ago`
    })
    totalScore += activityScore
  }
  
  // Factor 3: Device information availability
  if (sessionInfo.device_info) {
    const deviceScore = 8 // Good score for having device info
    factors.push({
      factor: 'Device Verification',
      score: deviceScore,
      description: 'Device information available'
    })
    totalScore += deviceScore
  } else {
    factors.push({
      factor: 'Device Verification',
      score: 3,
      description: 'No device information'
    })
    totalScore += 3
  }
  
  // Factor 4: Location information
  if (sessionInfo.location_info?.timezone) {
    const locationScore = 7 // Good score for location info
    factors.push({
      factor: 'Location Verification',
      score: locationScore,
      description: 'Location information available'
    })
    totalScore += locationScore
  } else {
    factors.push({
      factor: 'Location Verification',
      score: 4,
      description: 'No location information'
    })
    totalScore += 4
  }
  
  // Factor 5: Session validity
  const validityScore = sessionInfo.isExpired ? 0 : 10
  factors.push({
    factor: 'Session Validity',
    score: validityScore,
    description: sessionInfo.isExpired ? 'Session expired' : 'Session valid'
  })
  totalScore += validityScore
  
  // Calculate final score (0-100)
  const finalScore = Math.round((totalScore / (factors.length * 10)) * 100)
  
  return {
    score: finalScore,
    factors
  }
}

// Session management functions
export const getCurrentSession = async (): Promise<{ sessionInfo: SessionInfo | null; error?: any }> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { sessionInfo: null, error }
    }
    
    if (!session) {
      return { sessionInfo: null }
    }
    
    // Create enhanced session info with additional properties
    const sessionInfo: SessionInfo = {
      session,
      user: session.user,
      expiresAt: session.expires_at ? session.expires_at * 1000 : null,
      isExpired: session.expires_at ? Date.now() > (session.expires_at * 1000) : false,
      isNearExpiry: session.expires_at ? (session.expires_at * 1000 - Date.now()) < SESSION_CONFIG.EXPIRY_WARNING_TIME : false,
      refreshCount: 0,
      lastRefresh: null,
      id: session.access_token.substring(0, 10), // Use part of access token as ID
      created_at: new Date().toISOString(), // Default to now if not available
      last_activity: new Date().toISOString(), // Default to now
      device_info: {
        device_type: typeof window !== 'undefined' ? 
          (window.navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop') : 'unknown',
        operating_system: typeof window !== 'undefined' ? window.navigator.platform : 'unknown',
        browser: typeof window !== 'undefined' ? 
          (window.navigator.userAgent.includes('Chrome') ? 'Chrome' : 
           window.navigator.userAgent.includes('Firefox') ? 'Firefox' : 
           window.navigator.userAgent.includes('Safari') ? 'Safari' : 'unknown') : 'unknown'
      },
      location_info: {
        timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown'
      }
    }
    
    return { sessionInfo }
  } catch (error) {
    return { sessionInfo: null, error }
  }
}

export const signOutCurrentSession = async (): Promise<{ error?: any }> => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return { error }
  }
}

export const signOutAllSessions = async (): Promise<{ error?: any }> => {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    return { error }
  } catch (error) {
    return { error }
  }
}