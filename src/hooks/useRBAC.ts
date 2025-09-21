'use client'

import { useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  type Permission,
  type UserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isEqualOrHigherRole,
  getFeatureAccess,
  getNavigationItems,
  getRoleInfo,
  getRoleDisplayName,
  getRoleColor
} from '../lib/rbac'

/**
 * Custom hook for Role-Based Access Control
 */
export function useRBAC() {
  const { user, loading } = useAuth()

  // Get current user role
  const currentRole = user?.currentOrganization?.role as UserRole | undefined

  // Memoized permission checking functions
  const permissions = useMemo(() => {
    if (!currentRole) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        isEqualOrHigherRole: () => false,
        canAccessResource: () => false
      }
    }

    return {
      hasPermission: (permission: Permission) => hasPermission(currentRole, permission),
      hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(currentRole, permissions),
      hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(currentRole, permissions),
      isEqualOrHigherRole: (role: UserRole) => isEqualOrHigherRole(currentRole, role),
      canAccessResource: (
        resourceType: 'org' | 'user' | 'model' | 'api' | 'billing' | 'analytics' | 'system',
        action: 'read' | 'write' | 'delete' | 'manage' | 'invite' | 'deploy' | 'export'
      ) => {
        const permission = `${resourceType}:${action}` as Permission
        return hasPermission(currentRole, permission)
      }
    }
  }, [currentRole])

  // Memoized feature access
  const features = useMemo(() => {
    if (!currentRole) {
      return {
        canViewDashboard: false,
        canEditDashboard: false,
        canViewModels: false,
        canCreateModels: false,
        canDeployModels: false,
        canDeleteModels: false,
        canViewAPIs: false,
        canCreateAPIs: false,
        canManageAPIs: false,
        canDeleteAPIs: false,
        canViewUsers: false,
        canInviteUsers: false,
        canEditUsers: false,
        canRemoveUsers: false,
        canViewOrganization: false,
        canEditOrganization: false,
        canManageOrganization: false,
        canDeleteOrganization: false,
        canViewBilling: false,
        canManageBilling: false,
        canViewAnalytics: false,
        canExportAnalytics: false,
        canViewSystem: false,
        canManageSystem: false
      }
    }

    return getFeatureAccess(currentRole)
  }, [currentRole])

  // Memoized navigation items
  const navigationItems = useMemo(() => {
    if (!currentRole) return []
    return getNavigationItems(currentRole)
  }, [currentRole])

  // Memoized role information
  const roleInfo = useMemo(() => {
    if (!currentRole) return null
    return {
      ...getRoleInfo(currentRole),
      displayName: getRoleDisplayName(currentRole),
      color: getRoleColor(currentRole)
    }
  }, [currentRole])

  // Quick role checks
  const is = useMemo(() => ({
    admin: currentRole === 'admin',
    developer: currentRole === 'developer',
    viewer: currentRole === 'viewer',
    authenticated: !!user && !!currentRole,
    loading
  }), [currentRole, user, loading])

  // Quick permission shortcuts
  const can = useMemo(() => ({
    // Organization permissions
    readOrganization: permissions.hasPermission('org:read'),
    writeOrganization: permissions.hasPermission('org:write'),
    manageOrganization: permissions.hasPermission('org:manage'),
    deleteOrganization: permissions.hasPermission('org:delete'),

    // User permissions
    readUsers: permissions.hasPermission('user:read'),
    writeUsers: permissions.hasPermission('user:write'),
    inviteUsers: permissions.hasPermission('user:invite'),
    deleteUsers: permissions.hasPermission('user:delete'),

    // Model permissions
    readModels: permissions.hasPermission('model:read'),
    writeModels: permissions.hasPermission('model:write'),
    deployModels: permissions.hasPermission('model:deploy'),
    deleteModels: permissions.hasPermission('model:delete'),

    // API permissions
    readAPIs: permissions.hasPermission('api:read'),
    writeAPIs: permissions.hasPermission('api:write'),
    manageAPIs: permissions.hasPermission('api:manage'),
    deleteAPIs: permissions.hasPermission('api:delete'),

    // Billing permissions
    readBilling: permissions.hasPermission('billing:read'),
    writeBilling: permissions.hasPermission('billing:write'),
    manageBilling: permissions.hasPermission('billing:manage'),

    // Analytics permissions
    readAnalytics: permissions.hasPermission('analytics:read'),
    exportAnalytics: permissions.hasPermission('analytics:export'),

    // System permissions
    readSystem: permissions.hasPermission('system:read'),
    writeSystem: permissions.hasPermission('system:write'),
    manageSystem: permissions.hasPermission('system:manage')
  }), [permissions])

  return {
    // Current state
    currentRole,
    user,
    loading,

    // Role information
    roleInfo,

    // Quick checks
    is,
    can,

    // Feature access
    features,

    // Navigation
    navigationItems,

    // Permission functions
    ...permissions,

    // Utility functions
    requirePermission: (permission: Permission) => permissions.hasPermission(permission),
    requireAnyPermission: (permissions: Permission[]) => permissions.hasAnyPermission(permissions),
    requireAllPermissions: (permissions: Permission[]) => permissions.hasAllPermissions(permissions),
    requireMinimumRole: (role: UserRole) => permissions.isEqualOrHigherRole(role)
  }
}

/**
 * Hook for checking specific permissions
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useRBAC()
  return hasPermission(permission)
}

/**
 * Hook for checking multiple permissions
 */
export function usePermissions(permissions: Permission[], requireAll = false): boolean {
  const { hasAnyPermission, hasAllPermissions } = useRBAC()

  return requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)
}

/**
 * Hook for checking minimum role requirement
 */
export function useMinimumRole(role: UserRole): boolean {
  const { isEqualOrHigherRole } = useRBAC()
  return isEqualOrHigherRole(role)
}

/**
 * Hook for role-specific checks
 */
export function useRole(role: UserRole): boolean {
  const { currentRole } = useRBAC()
  return currentRole === role
}

/**
 * Hook for checking if user is in any of the specified roles
 */
export function useRoles(roles: UserRole[]): boolean {
  const { currentRole } = useRBAC()
  return currentRole ? roles.includes(currentRole) : false
}