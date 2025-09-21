import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  OrganizationManager,
  Organization,
  UserOrganization,
  OrganizationWithMembers,
  CreateOrganizationData,
  UpdateOrganizationData
} from '../lib/organizations'
import type { Tables } from '../lib/supabase'
import { Role } from '../lib/rbac'

export interface UseOrganizationsReturn {
  // State
  organizations: (UserOrganization & { organization: Organization })[]
  currentOrganization: Organization | null
  loading: boolean
  error: string | null

  // Actions
  createOrganization: (data: CreateOrganizationData) => Promise<{ success: boolean; organization?: Organization; error?: string }>
  switchOrganization: (organizationId: string) => Promise<{ success: boolean; error?: string }>
  updateOrganization: (organizationId: string, data: UpdateOrganizationData) => Promise<{ success: boolean; error?: string }>
  deleteOrganization: (organizationId: string) => Promise<{ success: boolean; error?: string }>
  refreshOrganizations: () => Promise<void>

  // Utilities
  canManageOrganization: (organizationId: string) => boolean
  getCurrentRole: () => Role | null
  isOwner: boolean
  isAdmin: boolean
}

export function useOrganizations(): UseOrganizationsReturn {
  const { user, refreshUserOrganizations, switchOrganization: authSwitchOrganization } = useAuth()
  const [organizations, setOrganizations] = useState<(UserOrganization & { organization: Organization })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get current organization from user context
  const currentOrganization = user?.currentOrganization?.organization || null
  const currentRole: Role | null = user?.currentOrganization?.role || null

  // Load user organizations
  const loadOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: orgError } = await OrganizationManager.getUserOrganizations(user.id)

      if (orgError) {
        setError(orgError.message || 'Failed to load organizations')
        return
      }

      setOrganizations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load organizations when user changes
  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  // Create new organization
  const createOrganization = useCallback(async (data: CreateOrganizationData) => {
    try {
      setError(null)
      
      const { data: organization, error: createError } = await OrganizationManager.createOrganization(data)

      if (createError || !organization) {
        const errorMessage = createError?.message || 'Failed to create organization'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Refresh organizations list
      await loadOrganizations()
      await refreshUserOrganizations()

      return { success: true, organization }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [loadOrganizations, refreshUserOrganizations])

  // Switch to different organization
  const switchOrganization = useCallback(async (organizationId: string) => {
    try {
      setError(null)

      // Find the organization in user's list
      const targetOrg = organizations.find(org => org.organization.id === organizationId)
      
      if (!targetOrg) {
        const errorMessage = 'Organization not found'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Update user's current organization in auth context
      const { error: switchError } = await authSwitchOrganization(organizationId)

      if (switchError) {
        const errorMessage = switchError.message || 'Failed to switch organization'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [organizations, authSwitchOrganization])

  // Update organization
  const updateOrganization = useCallback(async (organizationId: string, data: UpdateOrganizationData) => {
    try {
      setError(null)

      const { data: updatedOrg, error: updateError } = await OrganizationManager.updateOrganization(organizationId, data)

      if (updateError || !updatedOrg) {
        const errorMessage = updateError?.message || 'Failed to update organization'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Refresh organizations list
      await loadOrganizations()
      await refreshUserOrganizations()

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [loadOrganizations, refreshUserOrganizations])

  // Delete organization
  const deleteOrganization = useCallback(async (organizationId: string) => {
    try {
      setError(null)

      const { success, error: deleteError } = await OrganizationManager.deleteOrganization(organizationId)

      if (!success || deleteError) {
        const errorMessage = deleteError?.message || 'Failed to delete organization'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Refresh organizations list
      await loadOrganizations()
      await refreshUserOrganizations()

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [loadOrganizations, refreshUserOrganizations])

  // Refresh organizations
  const refreshOrganizations = useCallback(async () => {
    await loadOrganizations()
    await refreshUserOrganizations()
  }, [loadOrganizations, refreshUserOrganizations])

  // Check if user can manage specific organization
  const canManageOrganization = useCallback((organizationId: string) => {
    const org = organizations.find(o => o.organization.id === organizationId)
    return org?.role === 'owner' || org?.role === 'admin'
  }, [organizations])

  // Get current user's role in current organization
  const getCurrentRole = useCallback(() => {
    return currentRole
  }, [currentRole])

  // Role checks for current organization
  const isOwner = currentRole === 'owner'
  const isAdmin = currentRole === 'admin' || currentRole === 'owner'

  return {
    // State
    organizations,
    currentOrganization,
    loading,
    error,

    // Actions
    createOrganization,
    switchOrganization,
    updateOrganization,
    deleteOrganization,
    refreshOrganizations,

    // Utilities
    canManageOrganization,
    getCurrentRole,
    isOwner,
    isAdmin
  }
}

// Hook for managing specific organization
export function useOrganization(organizationId: string | null) {
  const [organization, setOrganization] = useState<OrganizationWithMembers | null>(null)
  const [members, setMembers] = useState<(UserOrganization & { profiles: Tables<'profiles'> })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load organization details
  const loadOrganization = useCallback(async () => {
    if (!organizationId) {
      setOrganization(null)
      setMembers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: orgData, error: orgError } = await OrganizationManager.getOrganization(organizationId)

      if (orgError || !orgData) {
        setError(orgError?.message || 'Failed to load organization')
        return
      }

      setOrganization(orgData)
      setMembers(orgData.user_organizations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  // Add member to organization
  const addMember = useCallback(async (userId: string, role: Role) => {
    if (!organizationId) return { success: false, error: 'No organization ID' }

    try {
      const { data, error: addError } = await OrganizationManager.addUserToOrganization(userId, organizationId, role)

      if (addError || !data) {
        const errorMessage = addError?.message || 'Failed to add member'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Refresh organization data
      await loadOrganization()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [organizationId, loadOrganization])

  // Remove member from organization
  const removeMember = useCallback(async (userId: string) => {
    if (!organizationId) return { success: false, error: 'No organization ID' }

    try {
      const { success, error: removeError } = await OrganizationManager.removeUserFromOrganization(userId, organizationId)

      if (!success || removeError) {
        const errorMessage = removeError?.message || 'Failed to remove member'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Refresh organization data
      await loadOrganization()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [organizationId, loadOrganization])

  // Update member role
  const updateMemberRole = useCallback(async (userId: string, role: Role) => {
    if (!organizationId) return { success: false, error: 'No organization ID' }

    try {
      const { data, error: updateError } = await OrganizationManager.updateUserRole(userId, organizationId, role)

      if (updateError || !data) {
        const errorMessage = updateError?.message || 'Failed to update member role'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Refresh organization data
      await loadOrganization()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [organizationId, loadOrganization])

  return {
    organization,
    members,
    loading,
    error,
    addMember,
    removeMember,
    updateMemberRole,
    refresh: loadOrganization
  }
}