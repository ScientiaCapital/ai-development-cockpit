'use client'

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useRBAC } from '../../hooks/useRBAC'
import {
  type Role,
  type Permission,
  ROLES,
  getRoleDisplayName,
  getRoleColor,
  isHigherRole
} from '../../lib/rbac'

interface RoleManagerProps {
  userId?: string
  organizationId?: string
  onRoleChange?: (userId: string, newRole: Role) => void
  className?: string
}

interface UserWithRole {
  id: string
  email: string
  name?: string
  role: Role
  lastActive?: string
  status: 'active' | 'inactive' | 'pending'
}

export default function RoleManager({
  userId,
  organizationId,
  onRoleChange,
  className = ''
}: RoleManagerProps) {
  const { user } = useAuth()
  const { currentRole, canManageUsers, canViewUsers } = useRBAC()
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showRoleDetails, setShowRoleDetails] = useState<Role | null>(null)

  // Mock users data - in real app, this would come from API
  const [users] = useState<UserWithRole[]>([
    {
      id: '1',
      email: 'admin@example.com',
      name: 'System Administrator',
      role: 'admin',
      lastActive: '2024-01-15T10:30:00Z',
      status: 'active'
    },
    {
      id: '2',
      email: 'dev@example.com',
      name: 'Lead Developer',
      role: 'developer',
      lastActive: '2024-01-15T09:15:00Z',
      status: 'active'
    },
    {
      id: '3',
      email: 'viewer@example.com',
      name: 'Data Analyst',
      role: 'viewer',
      lastActive: '2024-01-14T16:45:00Z',
      status: 'active'
    },
    {
      id: '4',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'viewer',
      lastActive: undefined,
      status: 'pending'
    }
  ])

  if (!canViewUsers) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900 mx-auto flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636 5.636 18.364" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view user roles.
          </p>
        </div>
      </div>
    )
  }

  const handleRoleChange = async (targetUser: UserWithRole, newRole: Role) => {
    if (!canManageUsers) {
      alert('You do not have permission to change user roles.')
      return
    }

    // Prevent users from elevating their own role or others above their own
    if (currentRole && !isHigherRole(currentRole, newRole)) {
      alert('You cannot assign a role higher than or equal to your own.')
      return
    }

    setIsUpdating(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      onRoleChange?.(targetUser.id, newRole)

      // Update local state
      setSelectedUser(null)

      console.log(`Role updated: ${targetUser.email} -> ${newRole}`)
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update user role. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723a1 1 0 01-.992 0l-1.254-.145a1 1 0 11.992-1.736L2.016 6l-.23-.132a1 1 0 011.364-.372l1.732 1.001z" clipRule="evenodd" />
          </svg>
        )
      case 'developer':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      case 'viewer':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getStatusBadge = (status: UserWithRole['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
            Active
          </span>
        )
      case 'inactive':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-full">
            Inactive
          </span>
        )
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
            Pending
          </span>
        )
    }
  }

  const getRoleBadgeColor = (role: Role) => {
    const color = getRoleColor(role)
    switch (color) {
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'gray':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Role Management
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage user roles and permissions within the organization.
        </p>
      </div>

      <div className="p-6">
        {/* Current User Info */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Your Current Role
          </h3>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getRoleBadgeColor(currentRole!)}`}>
              {getRoleIcon(currentRole!)}
              <span className="text-sm font-medium">{getRoleDisplayName(currentRole!)}</span>
            </div>
            <button
              onClick={() => setShowRoleDetails(currentRole!)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View permissions
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organization Members
          </h3>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Active
                  </th>
                  {canManageUsers && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {userItem.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {userItem.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                        {getRoleIcon(userItem.role)}
                        <span className="text-sm font-medium">{getRoleDisplayName(userItem.role)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(userItem.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {userItem.lastActive
                        ? new Date(userItem.lastActive).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    {canManageUsers && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedUser(userItem)}
                          disabled={userItem.id === user?.id}
                          className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {userItem.id === user?.id ? 'You' : 'Edit Role'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Change Role: {selectedUser.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a new role for {selectedUser.email}
            </p>

            <div className="space-y-3 mb-6">
              {Object.values(ROLES).map((roleInfo) => {
                const canAssign = !currentRole || isHigherRole(currentRole, roleInfo.name)

                return (
                  <div
                    key={roleInfo.name}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      canAssign
                        ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                    } ${
                      selectedUser.role === roleInfo.name
                        ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                    onClick={() => canAssign && handleRoleChange(selectedUser, roleInfo.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center space-x-2 px-2 py-1 rounded ${getRoleBadgeColor(roleInfo.name)}`}>
                          {getRoleIcon(roleInfo.name)}
                          <span className="text-sm font-medium">{roleInfo.description.split(' ')[0]}</span>
                        </div>
                        {!canAssign && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">(Cannot assign)</span>
                        )}
                      </div>
                      {selectedUser.role === roleInfo.name && (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {roleInfo.description}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {showRoleDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {getRoleDisplayName(showRoleDetails)} Role Details
              </h3>
              <button
                onClick={() => setShowRoleDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ROLES[showRoleDetails].description}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Permissions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES[showRoleDetails].permissions.map((permission) => (
                    <div
                      key={permission}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                    >
                      {permission}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRoleDetails(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}