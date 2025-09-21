import { supabase } from './supabase'
import type { Database, Tables } from './supabase'

// Organization types
export type Organization = Tables<'organizations'>
export type UserOrganization = Tables<'user_organizations'>

export interface OrganizationWithMembers extends Organization {
  user_organizations: (UserOrganization & {
    profiles: Tables<'profiles'>
  })[]
  member_count: number
}

export interface CreateOrganizationData {
  name: string
  description?: string
  website_url?: string
  logo_url?: string
  settings?: Record<string, any>
}

export interface UpdateOrganizationData {
  name?: string
  description?: string
  website_url?: string
  logo_url?: string
  settings?: Record<string, any>
}

export interface InviteUserData {
  email: string
  role: 'admin' | 'developer' | 'viewer'
  organizationId: string
}

export interface OrganizationInvite {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'developer' | 'viewer'
  invited_by: string
  expires_at: string
  created_at: string
  organization: Organization
  inviter: Tables<'profiles'>
}

// Organization CRUD operations
export class OrganizationManager {
  /**
   * Create a new organization
   */
  static async createOrganization(data: CreateOrganizationData): Promise<{
    data: Organization | null
    error: any
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description,
          website_url: data.website_url,
          logo_url: data.logo_url,
          settings: data.settings || {},
          owner_id: user.id
        })
        .select()
        .single()

      if (orgError) {
        return { data: null, error: orgError }
      }

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          role: 'owner'
        })

      if (memberError) {
        // Rollback organization creation
        await supabase
          .from('organizations')
          .delete()
          .eq('id', organization.id)
        
        return { data: null, error: memberError }
      }

      return { data: organization, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get user's organizations
   */
  static async getUserOrganizations(userId?: string): Promise<{
    data: (UserOrganization & { organization: Organization })[] | null
    error: any
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        return { data: null, error: new Error('User ID required') }
      }

      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get organization by ID with members
   */
  static async getOrganization(organizationId: string): Promise<{
    data: OrganizationWithMembers | null
    error: any
  }> {
    try {
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select(`
          *,
          user_organizations(
            *,
            profiles(*)
          )
        `)
        .eq('id', organizationId)
        .single()

      if (orgError) {
        return { data: null, error: orgError }
      }

      // Calculate member count
      const member_count = organization.user_organizations?.length || 0

      return {
        data: {
          ...organization,
          member_count
        } as OrganizationWithMembers,
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    organizationId: string,
    updates: UpdateOrganizationData
  ): Promise<{
    data: Organization | null
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Delete organization
   */
  static async deleteOrganization(organizationId: string): Promise<{
    success: boolean
    error: any
  }> {
    try {
      // First delete all user-organization relationships
      const { error: membersError } = await supabase
        .from('user_organizations')
        .delete()
        .eq('organization_id', organizationId)

      if (membersError) {
        return { success: false, error: membersError }
      }

      // Then delete the organization
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId)

      return { success: !orgError, error: orgError }
    } catch (error) {
      return { success: false, error }
    }
  }

  /**
   * Add user to organization
   */
  static async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: 'admin' | 'developer' | 'viewer'
  ): Promise<{
    data: UserOrganization | null
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          role
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Remove user from organization
   */
  static async removeUserFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<{
    success: boolean
    error: any
  }> {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId)

      return { success: !error, error }
    } catch (error) {
      return { success: false, error }
    }
  }

  /**
   * Update user role in organization
   */
  static async updateUserRole(
    userId: string,
    organizationId: string,
    role: 'admin' | 'developer' | 'viewer'
  ): Promise<{
    data: UserOrganization | null
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .update({ role })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get organization members
   */
  static async getOrganizationMembers(organizationId: string): Promise<{
    data: (UserOrganization & { profiles: Tables<'profiles'> })[] | null
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          *,
          profiles(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Check if user can manage organization
   */
  static async canManageOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single()

      if (error || !data) return false

      return data.role === 'owner' || data.role === 'admin'
    } catch (error) {
      return false
    }
  }

  /**
   * Get user's role in organization
   */
  static async getUserRole(
    userId: string,
    organizationId: string
  ): Promise<{
    role: 'owner' | 'admin' | 'developer' | 'viewer' | null
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single()

      return { role: data?.role || null, error }
    } catch (error) {
      return { role: null, error }
    }
  }

  /**
   * Search organizations (for discovery)
   */
  static async searchOrganizations(query: string, limit = 10): Promise<{
    data: Organization[] | null
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
        .limit(limit)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get organization analytics
   */
  static async getOrganizationAnalytics(organizationId: string): Promise<{
    data: {
      memberCount: number
      roleDistribution: Record<string, number>
      recentActivity: any[]
      createdAt: string
    } | null
    error: any
  }> {
    try {
      const { data: members, error: membersError } = await this.getOrganizationMembers(organizationId)
      
      if (membersError || !members) {
        return { data: null, error: membersError }
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('created_at')
        .eq('id', organizationId)
        .single()

      if (orgError) {
        return { data: null, error: orgError }
      }

      // Calculate role distribution
      const roleDistribution = members.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        data: {
          memberCount: members.length,
          roleDistribution,
          recentActivity: [], // TODO: Implement activity tracking
          createdAt: org.created_at
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Utility functions
export const createOrganization = OrganizationManager.createOrganization
export const getUserOrganizations = OrganizationManager.getUserOrganizations
export const getOrganization = OrganizationManager.getOrganization
export const updateOrganization = OrganizationManager.updateOrganization
export const deleteOrganization = OrganizationManager.deleteOrganization
export const addUserToOrganization = OrganizationManager.addUserToOrganization
export const removeUserFromOrganization = OrganizationManager.removeUserFromOrganization
export const updateUserRole = OrganizationManager.updateUserRole
export const getOrganizationMembers = OrganizationManager.getOrganizationMembers
export const canManageOrganization = OrganizationManager.canManageOrganization
export const getUserRole = OrganizationManager.getUserRole
export const searchOrganizations = OrganizationManager.searchOrganizations
export const getOrganizationAnalytics = OrganizationManager.getOrganizationAnalytics