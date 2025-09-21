import { useAuth as useAuthContext } from '../contexts/AuthContext'
import type { AuthContextType } from '../contexts/AuthContext'

/**
 * Simplified auth hook for easier imports
 * Re-exports the main auth context hook
 */
export const useAuth = (): AuthContextType => {
  return useAuthContext()
}

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { user, loading, initialized } = useAuth()
  return initialized && !loading && !!user
}

/**
 * Hook to get current user's role in current organization
 */
export const useCurrentRole = (): string | null => {
  const { user } = useAuth()
  return user?.currentOrganization?.role || null
}

/**
 * Hook to check if user has specific permission
 */
export const useHasPermission = (permission: 'admin' | 'developer' | 'viewer'): boolean => {
  const currentRole = useCurrentRole()

  if (!currentRole) return false

  // Admin has all permissions
  if (currentRole === 'admin') return true

  // Developer has developer and viewer permissions
  if (currentRole === 'developer' && (permission === 'developer' || permission === 'viewer')) {
    return true
  }

  // Viewer only has viewer permissions
  if (currentRole === 'viewer' && permission === 'viewer') {
    return true
  }

  return false
}

/**
 * Hook to get current organization info
 */
export const useCurrentOrganization = () => {
  const { user } = useAuth()
  return user?.currentOrganization || null
}

/**
 * Hook to get all user organizations
 */
export const useUserOrganizations = () => {
  const { user } = useAuth()
  return user?.organizations || []
}

export default useAuth