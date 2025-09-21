/**
 * Session management utilities for authentication and security
 */

import { supabase } from './supabase'
import { Session, User } from '@supabase/supabase-js'

export interface SessionInfo {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  expires_at: string
  refresh_token?: string
  access_token?: string
  token_type: string

  // Extended session metadata
  device_info?: DeviceInfo
  location_info?: LocationInfo
  is_current?: boolean
  last_activity?: string
  user_agent?: string
  ip_address?: string
}

export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  operating_system: string
  browser: string
  browser_version: string
  device_name?: string
}

export interface LocationInfo {
  country?: string
  region?: string
  city?: string
  timezone?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface SessionActivity {
  id: string
  session_id: string
  activity_type: 'login' | 'logout' | 'refresh' | 'api_call' | 'page_view'
  timestamp: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

/**
 * Get current session with extended information
 */
export const getCurrentSession = async (): Promise<{
  session: Session | null
  sessionInfo: SessionInfo | null
  error: Error | null
}> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return { session: null, sessionInfo: null, error }
    }

    if (!session) {
      return { session: null, sessionInfo: null, error: null }
    }

    // Create extended session info
    const sessionInfo: SessionInfo = {
      id: session.access_token.substring(0, 8), // Use part of token as session ID
      user_id: session.user.id,
      created_at: session.user.created_at,
      updated_at: new Date().toISOString(),
      expires_at: new Date(session.expires_at! * 1000).toISOString(),
      refresh_token: session.refresh_token,
      access_token: session.access_token,
      token_type: session.token_type || 'bearer',
      device_info: getDeviceInfo(),
      location_info: await getLocationInfo(),
      is_current: true,
      last_activity: new Date().toISOString(),
      user_agent: navigator.userAgent,
      ip_address: await getClientIP()
    }

    return { session, sessionInfo, error: null }
  } catch (error) {
    return { session: null, sessionInfo: null, error: error as Error }
  }
}

/**
 * Refresh current session
 */
export const refreshSession = async (): Promise<{
  session: Session | null
  error: Error | null
}> => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()

    if (error) {
      return { session: null, error }
    }

    // Log session refresh activity
    if (session) {
      await logSessionActivity(session.access_token.substring(0, 8), 'refresh', {
        timestamp: new Date().toISOString(),
        new_expires_at: new Date(session.expires_at! * 1000).toISOString()
      })
    }

    return { session, error: null }
  } catch (error) {
    return { session: null, error: error as Error }
  }
}

/**
 * Sign out from current session
 */
export const signOutCurrentSession = async (): Promise<{ error: Error | null }> => {
  try {
    const { session } = await getCurrentSession()

    if (session) {
      // Log logout activity
      await logSessionActivity(session.access_token.substring(0, 8), 'logout', {
        timestamp: new Date().toISOString(),
        reason: 'user_logout'
      })
    }

    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Sign out from all sessions
 */
export const signOutAllSessions = async (): Promise<{ error: Error | null }> => {
  try {
    // Note: Supabase doesn't provide a direct way to sign out all sessions
    // This would typically require a backend implementation

    const { session } = await getCurrentSession()

    if (session) {
      // Log logout activity
      await logSessionActivity(session.access_token.substring(0, 8), 'logout', {
        timestamp: new Date().toISOString(),
        reason: 'all_sessions_logout'
      })
    }

    // For now, just sign out current session
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Check if session is valid and not expired
 */
export const isSessionValid = (session: Session | null): boolean => {
  if (!session) return false

  const now = Date.now() / 1000
  return session.expires_at ? session.expires_at > now : false
}

/**
 * Get time until session expires
 */
export const getTimeUntilExpiry = (session: Session | null): number => {
  if (!session || !session.expires_at) return 0

  const now = Date.now() / 1000
  return Math.max(0, session.expires_at - now)
}

/**
 * Check if session needs refresh (expires in less than 5 minutes)
 */
export const shouldRefreshSession = (session: Session | null): boolean => {
  if (!session) return false

  const timeUntilExpiry = getTimeUntilExpiry(session)
  return timeUntilExpiry < 5 * 60 // 5 minutes
}

/**
 * Get device information from user agent
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent
  const platform = navigator.platform

  // Detect device type
  let device_type: DeviceInfo['device_type'] = 'unknown'
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    device_type = /iPad|tablet/i.test(userAgent) ? 'tablet' : 'mobile'
  } else {
    device_type = 'desktop'
  }

  // Detect operating system
  let operating_system = 'Unknown'
  if (platform.includes('Win')) operating_system = 'Windows'
  else if (platform.includes('Mac')) operating_system = 'macOS'
  else if (platform.includes('Linux')) operating_system = 'Linux'
  else if (/Android/i.test(userAgent)) operating_system = 'Android'
  else if (/iPhone|iPad|iPod/i.test(userAgent)) operating_system = 'iOS'

  // Detect browser
  let browser = 'Unknown'
  let browser_version = ''

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome'
    const match = userAgent.match(/Chrome\/([0-9.]+)/)
    browser_version = match ? match[1] : ''
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
    const match = userAgent.match(/Firefox\/([0-9.]+)/)
    browser_version = match ? match[1] : ''
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
    const match = userAgent.match(/Version\/([0-9.]+)/)
    browser_version = match ? match[1] : ''
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge'
    const match = userAgent.match(/Edg\/([0-9.]+)/)
    browser_version = match ? match[1] : ''
  }

  return {
    device_type,
    operating_system,
    browser,
    browser_version
  }
}

/**
 * Get location information (using IP geolocation)
 */
export const getLocationInfo = async (): Promise<LocationInfo | undefined> => {
  try {
    // In a real app, you'd use a geolocation service
    // For now, return mock data based on timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    return {
      timezone,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    }
  } catch (error) {
    console.error('Failed to get location info:', error)
    return undefined
  }
}

/**
 * Get client IP address
 */
export const getClientIP = async (): Promise<string | undefined> => {
  try {
    // In a real app, you'd get this from your backend or a service
    // For now, return undefined as we can't get real IP from client-side
    return undefined
  } catch (error) {
    console.error('Failed to get client IP:', error)
    return undefined
  }
}

/**
 * Log session activity
 */
export const logSessionActivity = async (
  sessionId: string,
  activityType: SessionActivity['activity_type'],
  details?: Record<string, any>
): Promise<void> => {
  try {
    // In a real app, you'd send this to your backend
    const activity: Omit<SessionActivity, 'id'> = {
      session_id: sessionId,
      activity_type: activityType,
      timestamp: new Date().toISOString(),
      details,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent
    }

    console.log('Session activity logged:', activity)

    // Store in localStorage for demo purposes
    const activities = getStoredSessionActivities()
    activities.push({ ...activity, id: crypto.randomUUID() })

    // Keep only last 100 activities
    const recentActivities = activities.slice(-100)
    localStorage.setItem('session_activities', JSON.stringify(recentActivities))
  } catch (error) {
    console.error('Failed to log session activity:', error)
  }
}

/**
 * Get stored session activities
 */
export const getStoredSessionActivities = (): SessionActivity[] => {
  try {
    const stored = localStorage.getItem('session_activities')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to get stored session activities:', error)
    return []
  }
}

/**
 * Clear stored session activities
 */
export const clearStoredSessionActivities = (): void => {
  try {
    localStorage.removeItem('session_activities')
  } catch (error) {
    console.error('Failed to clear stored session activities:', error)
  }
}

/**
 * Get session security score based on various factors
 */
export const getSessionSecurityScore = (sessionInfo: SessionInfo): {
  score: number
  factors: Array<{ factor: string; score: number; description: string }>
} => {
  const factors: Array<{ factor: string; score: number; description: string }> = []
  let totalScore = 0

  // Device type factor
  if (sessionInfo.device_info?.device_type === 'desktop') {
    factors.push({ factor: 'Device Type', score: 10, description: 'Desktop device (more secure)' })
    totalScore += 10
  } else if (sessionInfo.device_info?.device_type === 'mobile') {
    factors.push({ factor: 'Device Type', score: 7, description: 'Mobile device (moderately secure)' })
    totalScore += 7
  } else {
    factors.push({ factor: 'Device Type', score: 5, description: 'Unknown device type' })
    totalScore += 5
  }

  // Browser factor
  const modernBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
  if (sessionInfo.device_info?.browser && modernBrowsers.includes(sessionInfo.device_info.browser)) {
    factors.push({ factor: 'Browser', score: 10, description: 'Modern, secure browser' })
    totalScore += 10
  } else {
    factors.push({ factor: 'Browser', score: 5, description: 'Unknown or outdated browser' })
    totalScore += 5
  }

  // Session age factor
  const sessionAge = Date.now() - new Date(sessionInfo.created_at).getTime()
  const hoursOld = sessionAge / (1000 * 60 * 60)

  if (hoursOld < 1) {
    factors.push({ factor: 'Session Age', score: 10, description: 'Very recent session' })
    totalScore += 10
  } else if (hoursOld < 24) {
    factors.push({ factor: 'Session Age', score: 8, description: 'Recent session (< 24 hours)' })
    totalScore += 8
  } else {
    factors.push({ factor: 'Session Age', score: 5, description: 'Older session (> 24 hours)' })
    totalScore += 5
  }

  // Activity factor
  if (sessionInfo.last_activity) {
    const activityAge = Date.now() - new Date(sessionInfo.last_activity).getTime()
    const minutesInactive = activityAge / (1000 * 60)

    if (minutesInactive < 5) {
      factors.push({ factor: 'Recent Activity', score: 10, description: 'Very recent activity' })
      totalScore += 10
    } else if (minutesInactive < 30) {
      factors.push({ factor: 'Recent Activity', score: 8, description: 'Recent activity (< 30 min)' })
      totalScore += 8
    } else {
      factors.push({ factor: 'Recent Activity', score: 5, description: 'No recent activity' })
      totalScore += 5
    }
  }

  return {
    score: Math.round((totalScore / (factors.length * 10)) * 100),
    factors
  }
}

/**
 * Session timeout warning utility
 */
export const getSessionTimeoutWarning = (session: Session | null): {
  shouldWarn: boolean
  timeLeft: number
  message: string
} => {
  if (!session) {
    return {
      shouldWarn: false,
      timeLeft: 0,
      message: ''
    }
  }

  const timeLeft = getTimeUntilExpiry(session)
  const minutes = Math.floor(timeLeft / 60)
  const seconds = Math.floor(timeLeft % 60)

  if (timeLeft <= 0) {
    return {
      shouldWarn: true,
      timeLeft: 0,
      message: 'Your session has expired. Please sign in again.'
    }
  }

  if (timeLeft < 5 * 60) { // Less than 5 minutes
    return {
      shouldWarn: true,
      timeLeft,
      message: `Your session will expire in ${minutes}:${seconds.toString().padStart(2, '0')}. Click to extend.`
    }
  }

  return {
    shouldWarn: false,
    timeLeft,
    message: ''
  }
}