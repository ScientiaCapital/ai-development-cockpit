'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  getUserOrganizations,
  getCurrentOrganization,
  getOrganization,
  getOrganizationMembers,
  createOrganization,
  updateOrganization,
  inviteUserToOrganization,
  updateMemberRole,
  removeMemberFromOrganization,
  leaveOrganization,
  deleteOrganization,
  switchOrganization,
  validateOrganizationSlug,
  type Organization,
  type OrganizationMember,
  type OrganizationInvitation
} from '../lib/organization'

interface UseOrganizationReturn {
  // Current state
  organizations: Organization[]
  currentOrganization: Organization | null
  members: OrganizationMember[]
  loading: boolean
  error: string | null

  // Actions
  loadOrganizations: () => Promise<void>
  loadMembers: (organizationId?: string) => Promise<void>
  switchToOrganization: (organizationId: string) => Promise<boolean>
  createNewOrganization: (data: {
    name: string
    slug: string
    description?: string
    plan?: 'free' | 'pro' | 'enterprise'
  }) => Promise<Organization | null>
  updateCurrentOrganization: (updates: Partial<Organization>) => Promise<boolean>
  inviteMember: (email: string, role: 'developer' | 'viewer') => Promise<OrganizationInvitation | null>
  updateMemberRoleInOrg: (memberId: string, role: 'admin' | 'developer' | 'viewer') => Promise<boolean>
  removeMember: (memberId: string) => Promise<boolean>
  leaveCurrentOrganization: () => Promise<boolean>
  deleteCurrentOrganization: () => Promise<boolean>
  checkSlugAvailability: (slug: string) => Promise<boolean>

  // Computed properties
  isOwner: boolean
  isAdmin: boolean
  canInviteMembers: boolean
  canManageMembers: boolean
  canEditOrganization: boolean
  canDeleteOrganization: boolean
  memberCount: number
  currentUserMembership: OrganizationMember | null
}

export function useOrganization(): UseOrganizationReturn {
  const { user, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user's organizations
  const loadOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([])
      setCurrentOrganization(null)
      return
    }

    try {
      setError(null)
      const { organizations: orgs, error: orgError } = await getUserOrganizations()

      if (orgError) {
        setError(orgError.message)
        return
      }

      setOrganizations(orgs)

      // Load current organization
      const { organization: current, error: currentError } = await getCurrentOrganization()
      if (currentError) {
        console.warn('Failed to load current organization:', currentError.message)
      }
      setCurrentOrganization(current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    }
  }, [user])

  // Load organization members
  const loadMembers = useCallback(async (organizationId?: string) => {
    const orgId = organizationId || currentOrganization?.id
    if (!orgId) return

    try {
      const { members: orgMembers, error: membersError } = await getOrganizationMembers(orgId)

      if (membersError) {
        setError(membersError.message)
        return
      }

      setMembers(orgMembers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
    }
  }, [currentOrganization?.id])

  // Switch to different organization
  const switchToOrganization = useCallback(async (organizationId: string): Promise<boolean> => {
    try {
      setError(null)
      const { success, error: switchError } = await switchOrganization(organizationId)

      if (switchError) {
        setError(switchError.message)
        return false
      }

      if (success) {
        const { organization, error: orgError } = await getOrganization(organizationId)
        if (orgError) {
          setError(orgError.message)
          return false
        }

        setCurrentOrganization(organization)
        // Clear members to force reload
        setMembers([])
        await loadMembers(organizationId)
      }

      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch organization')
      return false
    }
  }, [loadMembers])

  // Create new organization
  const createNewOrganization = useCallback(async (data: {
    name: string
    slug: string
    description?: string
    plan?: 'free' | 'pro' | 'enterprise'
  }): Promise<Organization | null> => {
    try {
      setError(null)
      const { organization, error: createError } = await createOrganization(data)

      if (createError) {
        setError(createError.message)
        return null
      }

      if (organization) {
        await loadOrganizations()
        await switchToOrganization(organization.id)
      }

      return organization
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
      return null
    }
  }, [loadOrganizations, switchToOrganization])

  // Update current organization
  const updateCurrentOrganization = useCallback(async (
    updates: Partial<Organization>
  ): Promise<boolean> => {
    if (!currentOrganization) return false

    try {
      setError(null)
      const { organization, error: updateError } = await updateOrganization(
        currentOrganization.id,
        updates
      )

      if (updateError) {
        setError(updateError.message)
        return false
      }

      if (organization) {
        setCurrentOrganization(organization)
        await loadOrganizations()
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization')
      return false
    }
  }, [currentOrganization, loadOrganizations])

  // Invite member
  const inviteMember = useCallback(async (
    email: string,
    role: 'developer' | 'viewer'
  ): Promise<OrganizationInvitation | null> => {
    if (!currentOrganization) return null

    try {
      setError(null)
      const { invitation, error: inviteError } = await inviteUserToOrganization(
        currentOrganization.id,
        email,
        role
      )

      if (inviteError) {
        setError(inviteError.message)
        return null
      }

      // Reload members to show pending invitation
      await loadMembers()

      return invitation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member')
      return null
    }
  }, [currentOrganization, loadMembers])

  // Update member role
  const updateMemberRoleInOrg = useCallback(async (
    memberId: string,
    role: 'admin' | 'developer' | 'viewer'
  ): Promise<boolean> => {
    if (!currentOrganization) return false

    try {
      setError(null)
      const { member, error: updateError } = await updateMemberRole(
        currentOrganization.id,
        memberId,
        role
      )

      if (updateError) {
        setError(updateError.message)
        return false
      }

      if (member) {
        // Update local state
        setMembers(prev => prev.map(m => m.id === memberId ? member : m))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role')
      return false
    }
  }, [currentOrganization])

  // Remove member
  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!currentOrganization) return false

    try {
      setError(null)
      const { success, error: removeError } = await removeMemberFromOrganization(
        currentOrganization.id,
        memberId
      )

      if (removeError) {
        setError(removeError.message)
        return false
      }

      if (success) {
        // Remove from local state
        setMembers(prev => prev.filter(m => m.id !== memberId))
        // Update organization member count
        setCurrentOrganization(prev => prev ? {
          ...prev,
          member_count: Math.max(0, (prev.member_count || 0) - 1)
        } : null)
      }

      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
      return false
    }
  }, [currentOrganization])

  // Leave organization
  const leaveCurrentOrganization = useCallback(async (): Promise<boolean> => {
    if (!currentOrganization) return false

    try {
      setError(null)
      const { success, error: leaveError } = await leaveOrganization(currentOrganization.id)

      if (leaveError) {
        setError(leaveError.message)
        return false
      }

      if (success) {
        await loadOrganizations()
      }

      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave organization')
      return false
    }
  }, [currentOrganization, loadOrganizations])

  // Delete organization
  const deleteCurrentOrganization = useCallback(async (): Promise<boolean> => {
    if (!currentOrganization) return false

    try {
      setError(null)
      const { success, error: deleteError } = await deleteOrganization(currentOrganization.id)

      if (deleteError) {
        setError(deleteError.message)
        return false
      }

      if (success) {
        await loadOrganizations()
      }

      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization')
      return false
    }
  }, [currentOrganization, loadOrganizations])

  // Check slug availability
  const checkSlugAvailability = useCallback(async (slug: string): Promise<boolean> => {
    try {
      const { available, error: validationError } = await validateOrganizationSlug(slug)

      if (validationError) {
        setError(validationError.message)
        return false
      }

      return available
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate slug')
      return false
    }
  }, [])

  // Computed properties
  const currentUserMembership = useMemo(() => {
    if (!user || !currentOrganization) return null
    return members.find(member => member.user_id === user.id) || null
  }, [user, currentOrganization, members])

  const isOwner = useMemo(() => {
    return currentOrganization?.owner_id === user?.id
  }, [currentOrganization, user])

  const isAdmin = useMemo(() => {
    return isOwner || currentUserMembership?.role === 'admin'
  }, [isOwner, currentUserMembership])

  const canInviteMembers = useMemo(() => {
    return isAdmin
  }, [isAdmin])

  const canManageMembers = useMemo(() => {
    return isAdmin
  }, [isAdmin])

  const canEditOrganization = useMemo(() => {
    return isAdmin
  }, [isAdmin])

  const canDeleteOrganization = useMemo(() => {
    return isOwner
  }, [isOwner])

  const memberCount = useMemo(() => {
    return currentOrganization?.member_count || members.length || 0
  }, [currentOrganization, members])

  // Load organizations on auth state change
  useEffect(() => {
    if (!authLoading) {
      setLoading(true)
      loadOrganizations().finally(() => setLoading(false))
    }
  }, [authLoading, loadOrganizations])

  // Load members when current organization changes
  useEffect(() => {
    if (currentOrganization && !authLoading) {
      loadMembers()
    }
  }, [currentOrganization, authLoading, loadMembers])

  return {
    // Current state
    organizations,
    currentOrganization,
    members,
    loading,
    error,

    // Actions
    loadOrganizations,
    loadMembers,
    switchToOrganization,
    createNewOrganization,
    updateCurrentOrganization,
    inviteMember,
    updateMemberRoleInOrg,
    removeMember,
    leaveCurrentOrganization,
    deleteCurrentOrganization,
    checkSlugAvailability,

    // Computed properties
    isOwner,
    isAdmin,
    canInviteMembers,
    canManageMembers,
    canEditOrganization,
    canDeleteOrganization,
    memberCount,
    currentUserMembership
  }
}

/**
 * Hook for checking organization permissions
 */
export function useOrganizationPermissions() {
  const {
    isOwner,
    isAdmin,
    canInviteMembers,
    canManageMembers,
    canEditOrganization,
    canDeleteOrganization,
    currentUserMembership
  } = useOrganization()

  return {
    isOwner,
    isAdmin,
    canInvite: canInviteMembers,
    canManage: canManageMembers,
    canEdit: canEditOrganization,
    canDelete: canDeleteOrganization,
    role: currentUserMembership?.role || null
  }
}