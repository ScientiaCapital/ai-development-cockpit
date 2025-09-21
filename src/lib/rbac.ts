/**
 * Role-Based Access Control (RBAC) utilities and permissions system
 */

export type Role = 'owner' | 'admin' | 'developer' | 'viewer'

export type Permission = 
  // Organization permissions
  | 'org:manage'
  | 'org:view'
  | 'org:invite_users'
  | 'org:remove_users'
  
  // Model permissions
  | 'models:create'
  | 'models:deploy'
  | 'models:manage'
  | 'models:view'
  | 'models:delete'
  
  // Billing permissions
  | 'billing:manage'
  | 'billing:view'
  
  // Settings permissions
  | 'settings:manage'
  | 'settings:view'
  
  // User permissions
  | 'users:manage'
  | 'users:view'
  | 'users:invite'
  
  // API permissions
  | 'api:manage'
  | 'api:view'
  | 'api:create_keys'

export interface RoleDefinition {
  name: Role
  displayName: string
  description: string
  permissions: Permission[]
  hierarchy: number // Higher number = more permissions
}

/**
 * Role definitions with permissions and hierarchy
 */
export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  owner: {
    name: 'owner',
    displayName: 'Owner',
    description: 'Full access to all organization features and settings',
    hierarchy: 100,
    permissions: [
      'org:manage',
      'org:view',
      'org:invite_users',
      'org:remove_users',
      'models:create',
      'models:deploy',
      'models:manage',
      'models:view',
      'models:delete',
      'billing:manage',
      'billing:view',
      'settings:manage',
      'settings:view',
      'users:manage',
      'users:view',
      'users:invite',
      'api:manage',
      'api:view',
      'api:create_keys'
    ]
  },
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Manage organization, users, and models',
    hierarchy: 80,
    permissions: [
      'org:view',
      'org:invite_users',
      'org:remove_users',
      'models:create',
      'models:deploy',
      'models:manage',
      'models:view',
      'models:delete',
      'billing:view',
      'settings:view',
      'users:manage',
      'users:view',
      'users:invite',
      'api:manage',
      'api:view',
      'api:create_keys'
    ]
  },
  developer: {
    name: 'developer',
    displayName: 'Developer',
    description: 'Deploy and manage models, view organization details',
    hierarchy: 60,
    permissions: [
      'org:view',
      'models:create',
      'models:deploy',
      'models:manage',
      'models:view',
      'billing:view',
      'settings:view',
      'users:view',
      'api:view',
      'api:create_keys'
    ]
  },
  viewer: {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to organization and models',
    hierarchy: 20,
    permissions: [
      'org:view',
      'models:view',
      'billing:view',
      'settings:view',
      'users:view',
      'api:view'
    ]
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  
  const roleDefinition = ROLE_DEFINITIONS[role]
  return roleDefinition?.permissions.includes(permission) || false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_DEFINITIONS[role]?.permissions || []
}

/**
 * Check if role A can manage role B (higher hierarchy can manage lower)
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  const managerHierarchy = ROLE_DEFINITIONS[managerRole]?.hierarchy || 0
  const targetHierarchy = ROLE_DEFINITIONS[targetRole]?.hierarchy || 0
  
  return managerHierarchy > targetHierarchy
}

/**
 * Get roles that can be assigned by a specific role
 */
export function getAssignableRoles(role: Role): Role[] {
  const roleHierarchy = ROLE_DEFINITIONS[role]?.hierarchy || 0
  
  return Object.values(ROLE_DEFINITIONS)
    .filter(def => def.hierarchy < roleHierarchy)
    .map(def => def.name)
    .sort((a, b) => ROLE_DEFINITIONS[b].hierarchy - ROLE_DEFINITIONS[a].hierarchy)
}

/**
 * Get role definition by name
 */
export function getRoleDefinition(role: Role): RoleDefinition | undefined {
  return ROLE_DEFINITIONS[role]
}

/**
 * Get all role definitions sorted by hierarchy (highest first)
 */
export function getAllRoles(): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS)
    .sort((a, b) => b.hierarchy - a.hierarchy)
}

/**
 * Validate if a role exists
 */
export function isValidRole(role: string): role is Role {
  return role in ROLE_DEFINITIONS
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: Role[]): Role | undefined {
  if (roles.length === 0) return undefined
  
  return roles.reduce((highest, current) => {
    const currentHierarchy = ROLE_DEFINITIONS[current]?.hierarchy || 0
    const highestHierarchy = ROLE_DEFINITIONS[highest]?.hierarchy || 0
    
    return currentHierarchy > highestHierarchy ? current : highest
  })
}

/**
 * Permission groups for UI organization
 */
export const PERMISSION_GROUPS = {
  'Organization': [
    'org:manage',
    'org:view',
    'org:invite_users',
    'org:remove_users'
  ] as Permission[],
  'Models': [
    'models:create',
    'models:deploy',
    'models:manage',
    'models:view',
    'models:delete'
  ] as Permission[],
  'Users': [
    'users:manage',
    'users:view',
    'users:invite'
  ] as Permission[],
  'Billing': [
    'billing:manage',
    'billing:view'
  ] as Permission[],
  'Settings': [
    'settings:manage',
    'settings:view'
  ] as Permission[],
  'API': [
    'api:manage',
    'api:view',
    'api:create_keys'
  ] as Permission[]
}

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'org:manage': 'Manage organization settings and configuration',
  'org:view': 'View organization details and information',
  'org:invite_users': 'Invite new users to the organization',
  'org:remove_users': 'Remove users from the organization',
  'models:create': 'Create and upload new models',
  'models:deploy': 'Deploy models to production endpoints',
  'models:manage': 'Manage existing model configurations',
  'models:view': 'View model details and status',
  'models:delete': 'Delete models and their deployments',
  'billing:manage': 'Manage billing settings and payment methods',
  'billing:view': 'View billing information and usage',
  'settings:manage': 'Manage organization settings',
  'settings:view': 'View organization settings',
  'users:manage': 'Manage user roles and permissions',
  'users:view': 'View user information and activity',
  'users:invite': 'Send invitations to new users',
  'api:manage': 'Manage API keys and configurations',
  'api:view': 'View API usage and documentation',
  'api:create_keys': 'Create new API keys'
}