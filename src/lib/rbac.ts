/**
 * Role-Based Access Control (RBAC) utilities
 */

export type UserRole = 'admin' | 'developer' | 'viewer'

export type Permission =
  // Organization permissions
  | 'org:read' | 'org:write' | 'org:delete' | 'org:manage'
  // User permissions
  | 'user:read' | 'user:write' | 'user:delete' | 'user:invite'
  // Model permissions
  | 'model:read' | 'model:write' | 'model:delete' | 'model:deploy'
  // API permissions
  | 'api:read' | 'api:write' | 'api:delete' | 'api:manage'
  // Billing permissions
  | 'billing:read' | 'billing:write' | 'billing:manage'
  // Analytics permissions
  | 'analytics:read' | 'analytics:export'
  // System permissions
  | 'system:read' | 'system:write' | 'system:manage'

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  description: string
  limitations?: string[]
}

/**
 * Complete role definitions with permissions
 */
export const ROLES: Record<UserRole, RolePermissions> = {
  admin: {
    role: 'admin',
    description: 'Full access to all organization features and settings',
    permissions: [
      // Organization permissions
      'org:read', 'org:write', 'org:delete', 'org:manage',
      // User permissions
      'user:read', 'user:write', 'user:delete', 'user:invite',
      // Model permissions
      'model:read', 'model:write', 'model:delete', 'model:deploy',
      // API permissions
      'api:read', 'api:write', 'api:delete', 'api:manage',
      // Billing permissions
      'billing:read', 'billing:write', 'billing:manage',
      // Analytics permissions
      'analytics:read', 'analytics:export',
      // System permissions
      'system:read', 'system:write', 'system:manage'
    ]
  },

  developer: {
    role: 'developer',
    description: 'Development and deployment access with limited administrative functions',
    permissions: [
      // Organization permissions (read only)
      'org:read',
      // User permissions (limited)
      'user:read',
      // Model permissions (full development access)
      'model:read', 'model:write', 'model:delete', 'model:deploy',
      // API permissions (full development access)
      'api:read', 'api:write', 'api:delete', 'api:manage',
      // Billing permissions (read only)
      'billing:read',
      // Analytics permissions
      'analytics:read', 'analytics:export',
      // System permissions (read only)
      'system:read'
    ],
    limitations: [
      'Cannot modify organization settings',
      'Cannot invite or remove users',
      'Cannot access billing management',
      'Cannot modify system configuration'
    ]
  },

  viewer: {
    role: 'viewer',
    description: 'Read-only access to organization data and analytics',
    permissions: [
      // Organization permissions (read only)
      'org:read',
      // User permissions (read only)
      'user:read',
      // Model permissions (read only)
      'model:read',
      // API permissions (read only)
      'api:read',
      // Billing permissions (read only)
      'billing:read',
      // Analytics permissions (read only)
      'analytics:read',
      // System permissions (read only)
      'system:read'
    ],
    limitations: [
      'Read-only access to all features',
      'Cannot modify any data or settings',
      'Cannot deploy models or create APIs',
      'Cannot export data or analytics'
    ]
  }
}

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLES[role].permissions.includes(permission)
}

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLES[role].permissions
}

/**
 * Get role description and limitations
 */
export const getRoleInfo = (role: UserRole): RolePermissions => {
  return ROLES[role]
}

/**
 * Check if one role has higher privileges than another
 */
export const isHigherRole = (role: UserRole, compareRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    developer: 2,
    admin: 3
  }

  return roleHierarchy[role] > roleHierarchy[compareRole]
}

/**
 * Check if one role has equal or higher privileges than another
 */
export const isEqualOrHigherRole = (role: UserRole, compareRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    developer: 2,
    admin: 3
  }

  return roleHierarchy[role] >= roleHierarchy[compareRole]
}

/**
 * Get the minimum role required for a permission
 */
export const getMinimumRoleForPermission = (permission: Permission): UserRole => {
  if (hasPermission('viewer', permission)) return 'viewer'
  if (hasPermission('developer', permission)) return 'developer'
  return 'admin'
}

/**
 * Get permissions that a role lacks compared to a higher role
 */
export const getMissingPermissions = (currentRole: UserRole, targetRole: UserRole): Permission[] => {
  const currentPermissions = getRolePermissions(currentRole)
  const targetPermissions = getRolePermissions(targetRole)

  return targetPermissions.filter(permission => !currentPermissions.includes(permission))
}

/**
 * Check if user can perform action on resource
 */
export const canAccessResource = (
  userRole: UserRole,
  resourceType: 'org' | 'user' | 'model' | 'api' | 'billing' | 'analytics' | 'system',
  action: 'read' | 'write' | 'delete' | 'manage' | 'invite' | 'deploy' | 'export'
): boolean => {
  const permission = `${resourceType}:${action}` as Permission
  return hasPermission(userRole, permission)
}

/**
 * Middleware function to check permissions
 */
export const requirePermission = (permission: Permission) => {
  return (userRole: UserRole): boolean => {
    return hasPermission(userRole, permission)
  }
}

/**
 * Middleware function to require any of multiple permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (userRole: UserRole): boolean => {
    return hasAnyPermission(userRole, permissions)
  }
}

/**
 * Middleware function to require all permissions
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (userRole: UserRole): boolean => {
    return hasAllPermissions(userRole, permissions)
  }
}

/**
 * Feature flags based on roles
 */
export const getFeatureAccess = (role: UserRole) => {
  return {
    // Dashboard features
    canViewDashboard: hasPermission(role, 'org:read'),
    canEditDashboard: hasPermission(role, 'org:write'),

    // Model management
    canViewModels: hasPermission(role, 'model:read'),
    canCreateModels: hasPermission(role, 'model:write'),
    canDeployModels: hasPermission(role, 'model:deploy'),
    canDeleteModels: hasPermission(role, 'model:delete'),

    // API management
    canViewAPIs: hasPermission(role, 'api:read'),
    canCreateAPIs: hasPermission(role, 'api:write'),
    canManageAPIs: hasPermission(role, 'api:manage'),
    canDeleteAPIs: hasPermission(role, 'api:delete'),

    // User management
    canViewUsers: hasPermission(role, 'user:read'),
    canInviteUsers: hasPermission(role, 'user:invite'),
    canEditUsers: hasPermission(role, 'user:write'),
    canRemoveUsers: hasPermission(role, 'user:delete'),

    // Organization management
    canViewOrganization: hasPermission(role, 'org:read'),
    canEditOrganization: hasPermission(role, 'org:write'),
    canManageOrganization: hasPermission(role, 'org:manage'),
    canDeleteOrganization: hasPermission(role, 'org:delete'),

    // Billing
    canViewBilling: hasPermission(role, 'billing:read'),
    canManageBilling: hasPermission(role, 'billing:manage'),

    // Analytics
    canViewAnalytics: hasPermission(role, 'analytics:read'),
    canExportAnalytics: hasPermission(role, 'analytics:export'),

    // System
    canViewSystem: hasPermission(role, 'system:read'),
    canManageSystem: hasPermission(role, 'system:manage')
  }
}

/**
 * Navigation items based on role permissions
 */
export const getNavigationItems = (role: UserRole) => {
  const features = getFeatureAccess(role)

  const navigationItems = []

  // Always show dashboard
  if (features.canViewDashboard) {
    navigationItems.push({
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'dashboard',
      requiredPermission: 'org:read' as Permission
    })
  }

  // Model marketplace
  if (features.canViewModels) {
    navigationItems.push({
      name: 'Models',
      href: '/marketplace',
      icon: 'models',
      requiredPermission: 'model:read' as Permission
    })
  }

  // API management
  if (features.canViewAPIs) {
    navigationItems.push({
      name: 'APIs',
      href: '/apis',
      icon: 'api',
      requiredPermission: 'api:read' as Permission
    })
  }

  // Analytics
  if (features.canViewAnalytics) {
    navigationItems.push({
      name: 'Analytics',
      href: '/analytics',
      icon: 'analytics',
      requiredPermission: 'analytics:read' as Permission
    })
  }

  // User management (admin/developer only)
  if (features.canViewUsers) {
    navigationItems.push({
      name: 'Users',
      href: '/users',
      icon: 'users',
      requiredPermission: 'user:read' as Permission
    })
  }

  // Organization settings (admin only)
  if (features.canViewOrganization) {
    navigationItems.push({
      name: 'Settings',
      href: '/settings',
      icon: 'settings',
      requiredPermission: 'org:read' as Permission
    })
  }

  // Billing (admin only)
  if (features.canViewBilling) {
    navigationItems.push({
      name: 'Billing',
      href: '/billing',
      icon: 'billing',
      requiredPermission: 'billing:read' as Permission
    })
  }

  return navigationItems
}

/**
 * Validate role string
 */
export const isValidRole = (role: string): role is UserRole => {
  return ['admin', 'developer', 'viewer'].includes(role)
}

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames: Record<UserRole, string> = {
    admin: 'Administrator',
    developer: 'Developer',
    viewer: 'Viewer'
  }

  return displayNames[role]
}

/**
 * Get role color for UI
 */
export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    admin: 'red',
    developer: 'blue',
    viewer: 'gray'
  }

  return colors[role]
}