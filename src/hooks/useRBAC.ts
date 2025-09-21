import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  canManageRole,
  getAssignableRoles,
  getRolePermissions,
  getRoleDefinition,
  type Role,
  type Permission 
} from '../lib/rbac'

/**
 * Hook for Role-Based Access Control functionality
 */
export function useRBAC() {
  const { user } = useAuth()
  
  // Get current user's role
  const currentRole = useMemo(() => {
    return user?.currentOrganization?.role as Role | undefined
  }, [user?.currentOrganization?.role])

  // Check if user has a specific permission
  const checkPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      return hasPermission(currentRole, permission)
    }
  }, [currentRole])

  // Check if user has any of the specified permissions
  const checkAnyPermission = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      return hasAnyPermission(currentRole, permissions)
    }
  }, [currentRole])

  // Check if user has all of the specified permissions
  const checkAllPermissions = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      return hasAllPermissions(currentRole, permissions)
    }
  }, [currentRole])

  // Check if current user can manage another role
  const checkCanManageRole = useMemo(() => {
    return (targetRole: Role): boolean => {
      if (!currentRole) return false
      return canManageRole(currentRole, targetRole)
    }
  }, [currentRole])

  // Get roles that current user can assign
  const assignableRoles = useMemo(() => {
    if (!currentRole) return []
    return getAssignableRoles(currentRole)
  }, [currentRole])

  // Get current user's permissions
  const permissions = useMemo(() => {
    if (!currentRole) return []
    return getRolePermissions(currentRole)
  }, [currentRole])

  // Get current role definition
  const roleDefinition = useMemo(() => {
    if (!currentRole) return undefined
    return getRoleDefinition(currentRole)
  }, [currentRole])

  // Check if user is organization owner
  const isOwner = useMemo(() => {
    return currentRole === 'owner'
  }, [currentRole])

  // Check if user is admin or higher
  const isAdmin = useMemo(() => {
    return currentRole === 'owner' || currentRole === 'admin'
  }, [currentRole])

  // Check if user is developer or higher
  const isDeveloper = useMemo(() => {
    return currentRole === 'owner' || currentRole === 'admin' || currentRole === 'developer'
  }, [currentRole])

  return {
    // Current role info
    currentRole,
    roleDefinition,
    permissions,
    
    // Permission checking functions
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    
    // Role management functions
    canManageRole: checkCanManageRole,
    assignableRoles,
    
    // Quick role checks
    isOwner,
    isAdmin,
    isDeveloper,
    isViewer: currentRole === 'viewer',
    
    // Organization access
    canManageOrg: checkPermission('org:manage'),
    canViewOrg: checkPermission('org:view'),
    canInviteUsers: checkPermission('org:invite_users'),
    canRemoveUsers: checkPermission('org:remove_users'),
    
    // Model access
    canCreateModels: checkPermission('models:create'),
    canDeployModels: checkPermission('models:deploy'),
    canManageModels: checkPermission('models:manage'),
    canViewModels: checkPermission('models:view'),
    canDeleteModels: checkPermission('models:delete'),
    
    // Billing access
    canManageBilling: checkPermission('billing:manage'),
    canViewBilling: checkPermission('billing:view'),
    
    // Settings access
    canManageSettings: checkPermission('settings:manage'),
    canViewSettings: checkPermission('settings:view'),
    
    // User management
    canManageUsers: checkPermission('users:manage'),
    canViewUsers: checkPermission('users:view'),
    canInviteNewUsers: checkPermission('users:invite'),
    
    // API access
    canManageAPI: checkPermission('api:manage'),
    canViewAPI: checkPermission('api:view'),
    canCreateAPIKeys: checkPermission('api:create_keys')
  }
}

/**
 * Hook for checking if user has permission to access a route
 */
export function useRoutePermission(requiredPermissions: Permission | Permission[], requireAll = false) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBAC()
  
  return useMemo(() => {
    if (Array.isArray(requiredPermissions)) {
      return requireAll 
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions)
    } else {
      return hasPermission(requiredPermissions)
    }
  }, [requiredPermissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions])
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleGuard() {
  const rbac = useRBAC()
  
  return {
    // Render helpers
    ifOwner: (component: React.ReactNode) => rbac.isOwner ? component : null,
    ifAdmin: (component: React.ReactNode) => rbac.isAdmin ? component : null,
    ifDeveloper: (component: React.ReactNode) => rbac.isDeveloper ? component : null,
    ifViewer: (component: React.ReactNode) => rbac.isViewer ? component : null,
    
    // Permission-based rendering
    ifPermission: (permission: Permission, component: React.ReactNode) => 
      rbac.hasPermission(permission) ? component : null,
    
    ifAnyPermission: (permissions: Permission[], component: React.ReactNode) =>
      rbac.hasAnyPermission(permissions) ? component : null,
    
    ifAllPermissions: (permissions: Permission[], component: React.ReactNode) =>
      rbac.hasAllPermissions(permissions) ? component : null,
    
    // Access the full RBAC hook
    ...rbac
  }
}