/**
 * OAuth utility functions for social authentication
 */

import { AuthError } from '@supabase/supabase-js'

export type OAuthProvider = 'github' | 'google'

export interface OAuthConfig {
  redirectTo?: string
  scopes?: string
  queryParams?: Record<string, string>
}

/**
 * Provider-specific configurations for OAuth
 */
export const OAUTH_PROVIDERS: Record<OAuthProvider, {
  name: string
  displayName: string
  icon: string
  defaultScopes: string[]
  requiredScopes: string[]
}> = {
  github: {
    name: 'github',
    displayName: 'GitHub',
    icon: '🐙', // Could be replaced with actual icon component
    defaultScopes: ['user:email', 'read:user'],
    requiredScopes: ['user:email']
  },
  google: {
    name: 'google',
    displayName: 'Google',
    icon: '🔍', // Could be replaced with actual icon component
    defaultScopes: ['openid', 'email', 'profile'],
    requiredScopes: ['email', 'profile']
  }
}

/**
 * Get OAuth redirect URL for the current environment
 */
export const getOAuthRedirectUrl = (): string => {
  if (typeof window === 'undefined') {
    return '/auth/callback'
  }

  const baseUrl = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : 'http://localhost:3001'

  return `${baseUrl}/auth/callback`
}

/**
 * Build OAuth configuration with provider-specific settings
 */
export const buildOAuthConfig = (
  provider: OAuthProvider,
  customConfig?: OAuthConfig
): {
  redirectTo: string
  queryParams?: Record<string, string>
} => {
  const providerConfig = OAUTH_PROVIDERS[provider]
  const redirectTo = customConfig?.redirectTo || getOAuthRedirectUrl()

  const config: {
    redirectTo: string
    queryParams?: Record<string, string>
  } = {
    redirectTo
  }

  // Add provider-specific query parameters
  if (provider === 'github') {
    config.queryParams = {
      scope: customConfig?.scopes || providerConfig.defaultScopes.join(' '),
      ...customConfig?.queryParams
    }
  } else if (provider === 'google') {
    config.queryParams = {
      scope: customConfig?.scopes || providerConfig.defaultScopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...customConfig?.queryParams
    }
  }

  return config
}

/**
 * Parse OAuth error messages and provide user-friendly descriptions
 */
export const parseOAuthError = (error: AuthError | Error | string): {
  title: string
  message: string
  isRetryable: boolean
} => {
  const errorMessage = typeof error === 'string'
    ? error
    : error.message || 'Unknown error'

  // Common OAuth error patterns
  if (errorMessage.includes('access_denied')) {
    return {
      title: 'Authentication Cancelled',
      message: 'You cancelled the authentication process. You can try again if you wish.',
      isRetryable: true
    }
  }

  if (errorMessage.includes('invalid_request')) {
    return {
      title: 'Invalid Request',
      message: 'There was a problem with the authentication request. Please try again.',
      isRetryable: true
    }
  }

  if (errorMessage.includes('unauthorized_client')) {
    return {
      title: 'Configuration Error',
      message: 'The application is not properly configured for this authentication method.',
      isRetryable: false
    }
  }

  if (errorMessage.includes('invalid_scope')) {
    return {
      title: 'Permission Error',
      message: 'The requested permissions are not available. Please contact support.',
      isRetryable: false
    }
  }

  if (errorMessage.includes('server_error')) {
    return {
      title: 'Server Error',
      message: 'The authentication server encountered an error. Please try again later.',
      isRetryable: true
    }
  }

  if (errorMessage.includes('temporarily_unavailable')) {
    return {
      title: 'Service Unavailable',
      message: 'The authentication service is temporarily unavailable. Please try again later.',
      isRetryable: true
    }
  }

  if (errorMessage.includes('Email not confirmed')) {
    return {
      title: 'Email Not Confirmed',
      message: 'Please check your email and click the confirmation link before signing in.',
      isRetryable: true
    }
  }

  // Default error
  return {
    title: 'Authentication Error',
    message: errorMessage.length > 100
      ? 'An error occurred during authentication. Please try again.'
      : errorMessage,
    isRetryable: true
  }
}

/**
 * Extract user profile information from OAuth providers
 */
export const extractOAuthProfile = (user: any): {
  firstName?: string
  lastName?: string
  fullName?: string
  avatarUrl?: string
  provider: string
} => {
  const provider = user.app_metadata?.provider || 'unknown'
  const userMetadata = user.user_metadata || {}

  // GitHub profile extraction
  if (provider === 'github') {
    const fullName = userMetadata.full_name || userMetadata.name || ''
    const [firstName, ...lastNameParts] = fullName.split(' ')

    return {
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      fullName: fullName || '',
      avatarUrl: userMetadata.avatar_url,
      provider: 'GitHub'
    }
  }

  // Google profile extraction
  if (provider === 'google') {
    return {
      firstName: userMetadata.given_name || '',
      lastName: userMetadata.family_name || '',
      fullName: userMetadata.full_name || userMetadata.name || '',
      avatarUrl: userMetadata.picture || userMetadata.avatar_url,
      provider: 'Google'
    }
  }

  // Fallback for other providers
  const fullName = userMetadata.full_name || userMetadata.name || ''
  const [firstName, ...lastNameParts] = fullName.split(' ')

  return {
    firstName: firstName || '',
    lastName: lastNameParts.join(' ') || '',
    fullName: fullName || '',
    avatarUrl: userMetadata.avatar_url || userMetadata.picture,
    provider: provider
  }
}

/**
 * Validate OAuth provider configuration
 */
export const validateOAuthProvider = (provider: string): provider is OAuthProvider => {
  return provider in OAUTH_PROVIDERS
}

/**
 * Get display information for OAuth provider
 */
export const getProviderDisplayInfo = (provider: OAuthProvider) => {
  return OAUTH_PROVIDERS[provider]
}

/**
 * Build OAuth state parameter for additional security
 */
export const buildOAuthState = (additionalData?: Record<string, any>): string => {
  const state = {
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2),
    ...additionalData
  }

  return btoa(JSON.stringify(state))
}

/**
 * Parse OAuth state parameter
 */
export const parseOAuthState = (stateParam: string): any => {
  try {
    return JSON.parse(atob(stateParam))
  } catch (error) {
    console.warn('Failed to parse OAuth state parameter:', error)
    return null
  }
}

/**
 * Check if OAuth state is valid (not too old)
 */
export const isValidOAuthState = (state: any, maxAgeMs: number = 10 * 60 * 1000): boolean => {
  if (!state || typeof state.timestamp !== 'number') {
    return false
  }

  const age = Date.now() - state.timestamp
  return age <= maxAgeMs
}