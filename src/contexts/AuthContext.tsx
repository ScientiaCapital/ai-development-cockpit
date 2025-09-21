'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database, Tables } from '../lib/supabase'

// Types for our auth context
export interface AuthUser extends User {
  profile?: Tables<'profiles'>
  organizations?: UserOrganization[]
  currentOrganization?: UserOrganization | null
}

export interface UserOrganization {
  id: string
  organization: Tables<'organizations'>
  role: 'admin' | 'developer' | 'viewer'
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

export interface AuthContextType extends AuthState {
  // Authentication methods
  signUp: (email: string, password: string, options?: { data?: any }) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>

  // Password management
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>

  // Social authentication
  signInWithGitHub: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>

  // Organization management
  switchOrganization: (organizationId: string) => Promise<{ error: Error | null }>
  refreshUserOrganizations: () => Promise<void>

  // Profile management
  updateProfile: (updates: Partial<Tables<'profiles'>>) => Promise<{ error: Error | null }>

  // Utility methods
  refreshSession: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Initialize auth state on component mount
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error getting session:', sessionError)
          return
        }

        if (mounted) {
          setSession(initialSession)
          if (initialSession?.user) {
            await loadUserData(initialSession.user)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)

        if (mounted) {
          setSession(session)

          if (session?.user) {
            await loadUserData(session.user)
          } else {
            setUser(null)
          }

          setLoading(false)
          setInitialized(true)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Load user profile and organization data
  async function loadUserData(authUser: User): Promise<void> {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError)
      }

      // Load user organizations
      const { data: userOrgs, error: orgsError } = await supabase
        .from('user_organizations')
        .select(`
          id,
          role,
          created_at,
          updated_at,
          organization:organizations(*)
        `)
        .eq('user_id', authUser.id)

      if (orgsError && orgsError.code !== 'PGRST116') {
        console.error('Error loading organizations:', orgsError)
      }

      // Create enhanced user object
      const enhancedUser: AuthUser = {
        ...authUser,
        profile: profile || undefined,
        organizations: userOrgs || [],
        currentOrganization: userOrgs?.[0] || null
      }

      setUser(enhancedUser)
    } catch (error) {
      console.error('Error loading user data:', error)
      // Still set the basic user if profile loading fails
      setUser(authUser as AuthUser)
    }
  }

  // Authentication methods
  const signUp = async (email: string, password: string, options?: { data?: any }) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setUser(null)
        setSession(null)
      }
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Password management
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  // Social authentication
  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            scope: 'user:email read:user'
          }
        }
      })
      return { error }
    } catch (error) {
      console.error('GitHub OAuth error:', error)
      return { error: error as any }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      return { error }
    } catch (error) {
      console.error('Google OAuth error:', error)
      return { error: error as any }
    }
  }

  // Organization management
  const switchOrganization = async (organizationId: string) => {
    if (!user?.organizations) {
      return { error: new Error('No organizations available') }
    }

    const targetOrg = user.organizations.find(org => org.organization.id === organizationId)
    if (!targetOrg) {
      return { error: new Error('Organization not found') }
    }

    setUser({
      ...user,
      currentOrganization: targetOrg
    })

    return { error: null }
  }

  const refreshUserOrganizations = async () => {
    if (!user) return
    await loadUserData(user)
  }

  // Profile management
  const updateProfile = async (updates: Partial<Tables<'profiles'>>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (!error) {
        // Refresh user data to get updated profile
        await loadUserData(user)
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Utility methods
  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.refreshSession()
    if (session) {
      setSession(session)
    }
  }

  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  const value: AuthContextType = {
    // State
    user,
    session,
    loading,
    initialized,

    // Authentication methods
    signUp,
    signIn,
    signOut,

    // Password management
    resetPassword,
    updatePassword,

    // Social authentication
    signInWithGitHub,
    signInWithGoogle,

    // Organization management
    switchOrganization,
    refreshUserOrganizations,

    // Profile management
    updateProfile,

    // Utility methods
    refreshSession,
    getAccessToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook for checking authentication status
export function useRequireAuth() {
  const { user, loading, initialized } = useAuth()

  useEffect(() => {
    if (initialized && !loading && !user) {
      // Redirect to login page
      window.location.href = '/auth/login'
    }
  }, [user, loading, initialized])

  return { user, loading, initialized }
}

// Helper hook for checking specific roles
export function useRequireRole(requiredRole: 'admin' | 'developer' | 'viewer') {
  const { user, loading, initialized } = useAuth()

  const hasRole = user?.currentOrganization?.role === requiredRole ||
    (requiredRole === 'viewer' && user?.currentOrganization?.role === 'developer') ||
    (requiredRole === 'viewer' && user?.currentOrganization?.role === 'admin') ||
    (requiredRole === 'developer' && user?.currentOrganization?.role === 'admin')

  useEffect(() => {
    if (initialized && !loading && (!user || !hasRole)) {
      // Redirect to unauthorized page or login
      window.location.href = '/auth/unauthorized'
    }
  }, [user, loading, initialized, hasRole])

  return { user, hasRole, loading, initialized }
}