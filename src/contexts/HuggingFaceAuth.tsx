'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Organization = 'swaggystacks' | 'scientiacapital'

export interface AuthTokens {
  swaggystacks: string
  scientiacapital: string
}

export interface HuggingFaceAuthState {
  currentOrganization: Organization
  tokens: AuthTokens
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface HuggingFaceAuthContextType extends HuggingFaceAuthState {
  switchOrganization: (org: Organization) => void
  getCurrentToken: () => string
  validateToken: (org: Organization) => Promise<boolean>
  refreshTokens: () => Promise<void>
  clearError: () => void
}

const HuggingFaceAuthContext = createContext<HuggingFaceAuthContextType | undefined>(undefined)

interface HuggingFaceAuthProviderProps {
  children: ReactNode
}

export function HuggingFaceAuthProvider({ children }: HuggingFaceAuthProviderProps) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization>('swaggystacks')
  const [tokens, setTokens] = useState<AuthTokens>({
    swaggystacks: '',
    scientiacapital: ''
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize tokens from environment on mount
  useEffect(() => {
    const initializeTokens = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get tokens from environment
        const swaggyToken = process.env.NEXT_PUBLIC_SWAGGYSTACKS_HF_TOKEN ||
                           (typeof window !== 'undefined' ? localStorage.getItem('swaggystacks_token') : null)
        const scientiaToken = process.env.NEXT_PUBLIC_SCIENTIACAPITAL_HF_TOKEN ||
                             (typeof window !== 'undefined' ? localStorage.getItem('scientiacapital_token') : null)

        if (!swaggyToken || !scientiaToken) {
          throw new Error('HuggingFace tokens not found. Please check environment configuration.')
        }

        const newTokens: AuthTokens = {
          swaggystacks: swaggyToken,
          scientiacapital: scientiaToken
        }

        setTokens(newTokens)

        // Validate current organization token
        const isValid = await validateTokenInternal(currentOrganization, newTokens[currentOrganization])
        setIsAuthenticated(isValid)

        if (!isValid) {
          throw new Error(`Invalid token for ${currentOrganization} organization`)
        }

        console.log(`🎮 HuggingFace Auth initialized for ${currentOrganization.toUpperCase()}`)
      } catch (err) {
        console.error('❌ HuggingFace Auth initialization failed:', err)
        setError(err instanceof Error ? err.message : 'Authentication initialization failed')
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTokens()
  }, [currentOrganization])

  // Internal token validation function
  const validateTokenInternal = async (org: Organization, token: string): Promise<boolean> => {
    try {
      // Simple validation - check if token exists and has correct format
      if (!token || !token.startsWith('hf_')) {
        return false
      }

      // For now, return true if token format is correct
      // In production, we would make an API call to HuggingFace to validate
      return true
    } catch (error) {
      console.error(`Token validation failed for ${org}:`, error)
      return false
    }
  }

  const switchOrganization = async (org: Organization) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log(`🔄 Switching from ${currentOrganization} to ${org}`)

      // Validate token for the target organization
      const isValid = await validateTokenInternal(org, tokens[org])

      if (!isValid) {
        throw new Error(`Invalid token for ${org} organization`)
      }

      setCurrentOrganization(org)
      setIsAuthenticated(true)

      // Store preference in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred_organization', org)
      }

      console.log(`✅ Successfully switched to ${org.toUpperCase()}`)
    } catch (err) {
      console.error('❌ Organization switch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to switch organization')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentToken = (): string => {
    return tokens[currentOrganization] || ''
  }

  const validateToken = async (org: Organization): Promise<boolean> => {
    return await validateTokenInternal(org, tokens[org])
  }

  const refreshTokens = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate both tokens
      const swaggyValid = await validateTokenInternal('swaggystacks', tokens.swaggystacks)
      const scientiaValid = await validateTokenInternal('scientiacapital', tokens.scientiacapital)

      if (!swaggyValid || !scientiaValid) {
        throw new Error('One or more tokens are invalid')
      }

      console.log('🔄 Tokens refreshed successfully')
    } catch (err) {
      console.error('❌ Token refresh failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh tokens')
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const contextValue: HuggingFaceAuthContextType = {
    currentOrganization,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    switchOrganization,
    getCurrentToken,
    validateToken,
    refreshTokens,
    clearError
  }

  return (
    <HuggingFaceAuthContext.Provider value={contextValue}>
      {children}
    </HuggingFaceAuthContext.Provider>
  )
}

export function useHuggingFaceAuth(): HuggingFaceAuthContextType {
  const context = useContext(HuggingFaceAuthContext)
  if (context === undefined) {
    throw new Error('useHuggingFaceAuth must be used within a HuggingFaceAuthProvider')
  }
  return context
}

// Authentication status component for debugging
export function AuthStatus() {
  const auth = useHuggingFaceAuth()

  if (auth.isLoading) {
    return <div className="text-amber-400">🔄 Authenticating...</div>
  }

  if (auth.error) {
    return <div className="text-red-400">❌ Auth Error: {auth.error}</div>
  }

  if (auth.isAuthenticated) {
    return (
      <div className="text-green-400">
        ✅ Authenticated as {auth.currentOrganization.toUpperCase()}
      </div>
    )
  }

  return <div className="text-red-400">❌ Not authenticated</div>
}