'use client'

import { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  type Permission,
  type UserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isEqualOrHigherRole
} from '../../lib/rbac'

interface RBACGuardProps {
  children: ReactNode
  fallback?: ReactNode

  // Permission-based access
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean // If true, requires all permissions; if false, requires any

  // Role-based access
  role?: UserRole
  roles?: UserRole[]
  minimumRole?: UserRole

  // Organization-specific access
  organizationId?: string

  // Additional conditions
  condition?: boolean

  // Styling
  className?: string
}

export default function RBACGuard({
  children,
  fallback = null,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  minimumRole,
  organizationId,
  condition = true,
  className
}: RBACGuardProps) {
  const { user, loading } = useAuth()

  // Show loading state while authentication is initializing
  if (loading) {
    return (
      <div className={`animate-pulse ${className || ''}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    )
  }

  // If user is not authenticated, show fallback
  if (!user) {
    return <>{fallback}</>
  }

  // Get user's current role
  const currentUserRole = user.currentOrganization?.role
  if (!currentUserRole) {
    return <>{fallback}</>
  }

  // Check organization-specific access
  if (organizationId && user.currentOrganization?.organization.id !== organizationId) {
    return <>{fallback}</>
  }

  // Check additional condition
  if (!condition) {
    return <>{fallback}</>
  }

  // Check specific role match
  if (role && currentUserRole !== role) {
    return <>{fallback}</>
  }

  // Check role list match
  if (roles && !roles.includes(currentUserRole)) {
    return <>{fallback}</>
  }

  // Check minimum role requirement
  if (minimumRole && !isEqualOrHigherRole(currentUserRole, minimumRole)) {
    return <>{fallback}</>
  }

  // Check single permission
  if (permission && !hasPermission(currentUserRole, permission)) {
    return <>{fallback}</>
  }

  // Check multiple permissions
  if (permissions) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(currentUserRole, permissions)
      : hasAnyPermission(currentUserRole, permissions)

    if (!hasRequiredPermissions) {
      return <>{fallback}</>
    }
  }

  // All checks passed, render children
  return <div className={className}>{children}</div>
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard role="admin" fallback={fallback}>
      {children}
    </RBACGuard>
  )
}

export function DeveloperOrAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard roles={['developer', 'admin']} fallback={fallback}>
      {children}
    </RBACGuard>
  )
}

export function ViewerOrAbove({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard minimumRole="viewer" fallback={fallback}>
      {children}
    </RBACGuard>
  )
}

// Permission-based guards
export function CanManageUsers({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard permission="user:write" fallback={fallback}>
      {children}
    </RBACGuard>
  )
}

export function CanDeployModels({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard permission="model:deploy" fallback={fallback}>
      {children}
    </RBACGuard>
  )
}

export function CanManageBilling({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard permission="billing:manage" fallback={fallback}>
      {children}
    </RBACGuard>
  )
}

export function CanManageOrganization({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard permission="org:manage" fallback={fallback}>
      {children}
    </RBACGuard>
  )
}