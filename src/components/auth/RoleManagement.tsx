'use client'

import { useState, useEffect } from 'react'
import { useRBAC } from '../../hooks/useRBAC'
import { useAuth } from '../../hooks/useAuth'
import { 
  getAllRoles, 
  getAssignableRoles, 
  getRoleDefinition,
  PERMISSION_GROUPS,
  PERMISSION_DESCRIPTIONS,
  type Role,
  type Permission 
} from '../../lib/rbac'

interface RoleManagementProps {
  userId?: string
  currentUserRole?: Role
  onRoleChange?: (userId: string, newRole: Role) => Promise<void>
}

export default function RoleManagement({ userId, currentUserRole, onRoleChange }: RoleManagementProps) {
  const { user } = useAuth()
  const { currentRole, canManageUsers, assignableRoles } = useRBAC()
  
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(currentUserRole)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string>('')
  const [showPermissions, setShowPermissions] = useState<Role | null>(null)

  // If no specific user role provided, this is for current user display
  const isCurrentUser = !userId
  const displayRole = selectedRole || currentRole

  const handleRoleChange = async (newRole: Role) => {
    if (!userId || !onRoleChange) {
      setSelectedRole(newRole)
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      await onRoleChange(userId, newRole)
      setSelectedRole(newRole)
    } catch (error) {
      setError('Failed to update user role')
      console.error('Role update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const togglePermissions = (role: Role) => {
    setShowPermissions(showPermissions === role ? null : role)
  }

  // Show read-only view for current user or when user can't manage roles
  const isReadOnly = isCurrentUser || !canManageUsers

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {isCurrentUser ? 'Your Role' : 'User Role Management'}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {isCurrentUser 
            ? 'Your current role and permissions in this organization'
            : 'Manage user roles and permissions'
          }
        </p>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
            <div className="text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {/* Current/Selected Role Display */}
        {displayRole && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Current Role
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getRoleDefinition(displayRole)?.description}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {getRoleDefinition(displayRole)?.displayName}
              </span>
            </div>

            <button
              onClick={() => togglePermissions(displayRole)}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  View Permissions
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showPermissions === displayRole ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Permissions List */}
            {showPermissions === displayRole && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => {
                  const rolePermissions = getRoleDefinition(displayRole)?.permissions || []
                  const groupPermissions = permissions.filter(p => rolePermissions.includes(p))
                  
                  if (groupPermissions.length === 0) return null

                  return (
                    <div key={groupName}>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {groupName}
                      </h5>
                      <ul className="space-y-1">
                        {groupPermissions.map(permission => (
                          <li key={permission} className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-400">
                              {PERMISSION_DESCRIPTIONS[permission]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Role Selection (for non-current user and if user can manage roles) */}
        {!isReadOnly && assignableRoles.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Assign Role
            </h4>
            
            <div className="space-y-3">
              {assignableRoles.map(role => {
                const roleDefinition = getRoleDefinition(role)
                if (!roleDefinition) return null

                const isSelected = selectedRole === role
                
                return (
                  <div key={role} className="relative">
                    <button
                      onClick={() => handleRoleChange(role)}
                      disabled={isUpdating}
                      className={`w-full text-left p-4 border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                              {roleDefinition.displayName}
                            </h5>
                            {isSelected && (
                              <svg className="w-4 h-4 text-blue-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {roleDefinition.description}
                          </p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePermissions(role)
                          }}
                          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </button>

                    {/* Role Permissions Preview */}
                    {showPermissions === role && (
                      <div className="mt-3 ml-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h6 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                          Permissions included:
                        </h6>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => {
                            const rolePermissions = roleDefinition.permissions
                            const groupPermissions = permissions.filter(p => rolePermissions.includes(p))
                            
                            if (groupPermissions.length === 0) return null

                            return (
                              <div key={groupName} className="text-xs">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {groupName}:
                                </span>
                                <span className="ml-1 text-gray-600 dark:text-gray-400">
                                  {groupPermissions.length} permission{groupPermissions.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No permissions message */}
        {!isReadOnly && assignableRoles.length === 0 && (
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No role management access
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You don't have permission to manage user roles in this organization.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}