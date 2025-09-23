/**
 * Organization management utilities for multi-tenant functionality
 */

import { supabase, Tables } from './supabase'

// Define User type using profiles table structure
type User = Tables<'profiles'>

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  website_url?: string  // For backward compatibility
  logo_url?: string
  plan: 'free' | 'pro' | 'enterprise'
  max_members: number
  created_at: string
  updated_at: string

  // Owner information
  owner_id: string
  owner?: User

  // Settings
  settings?: OrganizationSettings  // Make optional for creation

  // Computed fields
  member_count?: number
  current_user_role?: string
}

export interface OrganizationSettings {
  allow_public_signup: boolean
  require_email_verification: boolean
  default_member_role: 'viewer' | 'developer'
  mfa_required: boolean
  session_timeout_hours: number
  allowed_domains?: string[]

  // API settings
  api_rate_limit: number
  api_quota_per_month: number

  // Billing
  billing_email?: string
  billing_address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'admin' | 'developer' | 'viewer'
  status: 'active' | 'pending' | 'suspended'
  invited_by?: string
  invited_at: string
  joined_at?: string
  last_seen?: string

  // User details
  user?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }

  // Permissions override
  permissions_override?: string[]
}

export interface OrganizationInvitation {
  id: string
  organization_id: string
  email: string
  role: 'developer' | 'viewer'
  invited_by: string
  invited_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  token: string

  // Organization details for display
  organization?: Pick<Organization, 'name' | 'logo_url'>
  inviter?: Pick<User, 'full_name' | 'email'>
}

/**
 * Get current user's organizations
 */
export const getUserOrganizations = async (): Promise<{
  organizations: Organization[]
  error: Error | null
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { organizations: [], error: new Error('User not authenticated') }
    }

    // Mock implementation - replace with actual Supabase queries
    const mockOrganizations: Organization[] = [
      {
        id: '1',
        name: 'SwaggyStacks',
        slug: 'swaggystacks',
        description: 'Developer-focused AI platform',
        plan: 'pro',
        max_members: 10,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        owner_id: user.id,
        member_count: 3,
        current_user_role: 'admin',
        settings: {
          allow_public_signup: false,
          require_email_verification: true,
          default_member_role: 'developer',
          mfa_required: false,
          session_timeout_hours: 24,
          api_rate_limit: 1000,
          api_quota_per_month: 100000
        }
      },
      {
        id: '2',
        name: 'Scientia Capital',
        slug: 'scientia-capital',
        description: 'Enterprise AI analytics',
        plan: 'enterprise',
        max_members: 50,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
        owner_id: 'other-user-id',
        member_count: 12,
        current_user_role: 'developer',
        settings: {
          allow_public_signup: false,
          require_email_verification: true,
          default_member_role: 'viewer',
          mfa_required: true,
          session_timeout_hours: 8,
          allowed_domains: ['scientiacapital.com'],
          api_rate_limit: 5000,
          api_quota_per_month: 1000000
        }
      }
    ]

    return { organizations: mockOrganizations, error: null }
  } catch (error) {
    return { organizations: [], error: error as Error }
  }
}

/**
 * Get organization by ID or slug
 */
export const getOrganization = async (
  identifier: string,
  bySlug = false
): Promise<{
  organization: Organization | null
  error: Error | null
}> => {
  try {
    // Mock implementation
    const { organizations } = await getUserOrganizations()

    const organization = organizations.find(org =>
      bySlug ? org.slug === identifier : org.id === identifier
    )

    return { organization: organization || null, error: null }
  } catch (error) {
    return { organization: null, error: error as Error }
  }
}

/**
 * Create a new organization
 */
export const createOrganization = async (data: {
  name: string
  slug: string
  description?: string
  plan?: 'free' | 'pro' | 'enterprise'
  settings?: Partial<OrganizationSettings>
}): Promise<{
  organization: Organization | null
  error: Error | null
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { organization: null, error: new Error('User not authenticated') }
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return {
        organization: null,
        error: new Error('Slug must contain only lowercase letters, numbers, and hyphens')
      }
    }

    // Check if slug is already taken
    const { organizations } = await getUserOrganizations()
    if (organizations.some(org => org.slug === data.slug)) {
      return {
        organization: null,
        error: new Error('Organization slug is already taken')
      }
    }

    // Create organization (mock implementation)
    const organization: Organization = {
      id: crypto.randomUUID(),
      name: data.name,
      slug: data.slug,
      description: data.description,
      plan: data.plan || 'free',
      max_members: data.plan === 'enterprise' ? 100 : data.plan === 'pro' ? 25 : 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user.id,
      member_count: 1,
      current_user_role: 'admin',
      settings: {
        allow_public_signup: false,
        require_email_verification: true,
        default_member_role: 'viewer',
        mfa_required: false,
        session_timeout_hours: 24,
        api_rate_limit: data.plan === 'enterprise' ? 10000 : data.plan === 'pro' ? 5000 : 1000,
        api_quota_per_month: data.plan === 'enterprise' ? 10000000 : data.plan === 'pro' ? 1000000 : 100000,
        ...data.settings
      }
    }

    console.log('Created organization:', organization)
    return { organization, error: null }
  } catch (error) {
    return { organization: null, error: error as Error }
  }
}

/**
 * Update organization settings
 */
export const updateOrganization = async (
  organizationId: string,
  updates: Partial<Omit<Organization, 'id' | 'created_at' | 'owner_id'>>
): Promise<{
  organization: Organization | null
  error: Error | null
}> => {
  try {
    // Mock implementation
    const { organization } = await getOrganization(organizationId)

    if (!organization) {
      return { organization: null, error: new Error('Organization not found') }
    }

    const updatedOrganization: Organization = {
      ...organization,
      ...updates,
      updated_at: new Date().toISOString()
    }

    console.log('Updated organization:', updatedOrganization)
    return { organization: updatedOrganization, error: null }
  } catch (error) {
    return { organization: null, error: error as Error }
  }
}

/**
 * Get organization members
 */
export const getOrganizationMembers = async (
  organizationId: string
): Promise<{
  members: OrganizationMember[]
  error: Error | null
}> => {
  try {
    // Mock implementation
    const mockMembers: OrganizationMember[] = [
      {
        id: '1',
        organization_id: organizationId,
        user_id: 'user-1',
        role: 'admin',
        status: 'active',
        invited_at: '2024-01-01T00:00:00Z',
        joined_at: '2024-01-01T00:00:00Z',
        last_seen: '2024-01-20T15:30:00Z',
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          full_name: 'John Admin',
          avatar_url: 'https://avatar.example.com/1'
        }
      },
      {
        id: '2',
        organization_id: organizationId,
        user_id: 'user-2',
        role: 'developer',
        status: 'active',
        invited_at: '2024-01-05T00:00:00Z',
        joined_at: '2024-01-05T12:00:00Z',
        last_seen: '2024-01-19T10:15:00Z',
        user: {
          id: 'user-2',
          email: 'dev@example.com',
          full_name: 'Jane Developer',
          avatar_url: 'https://avatar.example.com/2'
        }
      },
      {
        id: '3',
        organization_id: organizationId,
        user_id: 'user-3',
        role: 'viewer',
        status: 'pending',
        invited_at: '2024-01-18T00:00:00Z',
        user: {
          id: 'user-3',
          email: 'viewer@example.com',
          full_name: 'Bob Viewer'
        }
      }
    ]

    return { members: mockMembers, error: null }
  } catch (error) {
    return { members: [], error: error as Error }
  }
}

/**
 * Invite user to organization
 */
export const inviteUserToOrganization = async (
  organizationId: string,
  email: string,
  role: 'developer' | 'viewer'
): Promise<{
  invitation: OrganizationInvitation | null
  error: Error | null
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { invitation: null, error: new Error('User not authenticated') }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { invitation: null, error: new Error('Invalid email address') }
    }

    // Check if user is already a member
    const { members } = await getOrganizationMembers(organizationId)
    if (members.some(member => member.user?.email === email)) {
      return { invitation: null, error: new Error('User is already a member of this organization') }
    }

    // Create invitation (mock implementation)
    const invitation: OrganizationInvitation = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      email,
      role,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
      token: crypto.randomUUID(),
      inviter: {
        full_name: user.user_metadata?.full_name || user.email,
        email: user.email!
      }
    }

    console.log('Created invitation:', invitation)
    return { invitation, error: null }
  } catch (error) {
    return { invitation: null, error: error as Error }
  }
}

/**
 * Update member role
 */
export const updateMemberRole = async (
  organizationId: string,
  memberId: string,
  role: 'admin' | 'developer' | 'viewer'
): Promise<{
  member: OrganizationMember | null
  error: Error | null
}> => {
  try {
    // Mock implementation
    const { members } = await getOrganizationMembers(organizationId)
    const member = members.find(m => m.id === memberId)

    if (!member) {
      return { member: null, error: new Error('Member not found') }
    }

    const updatedMember: OrganizationMember = {
      ...member,
      role
    }

    console.log('Updated member role:', updatedMember)
    return { member: updatedMember, error: null }
  } catch (error) {
    return { member: null, error: error as Error }
  }
}

/**
 * Remove member from organization
 */
export const removeMemberFromOrganization = async (
  organizationId: string,
  memberId: string
): Promise<{
  success: boolean
  error: Error | null
}> => {
  try {
    // Mock implementation
    console.log(`Removed member ${memberId} from organization ${organizationId}`)
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

/**
 * Leave organization
 */
export const leaveOrganization = async (
  organizationId: string
): Promise<{
  success: boolean
  error: Error | null
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: new Error('User not authenticated') }
    }

    // Check if user is the owner
    const { organization } = await getOrganization(organizationId)
    if (organization?.owner_id === user.id) {
      return {
        success: false,
        error: new Error('Organization owner cannot leave. Please transfer ownership first.')
      }
    }

    // Mock implementation
    console.log(`User ${user.id} left organization ${organizationId}`)
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

/**
 * Delete organization (owner only)
 */
export const deleteOrganization = async (
  organizationId: string
): Promise<{
  success: boolean
  error: Error | null
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: new Error('User not authenticated') }
    }

    const { organization } = await getOrganization(organizationId)

    if (!organization) {
      return { success: false, error: new Error('Organization not found') }
    }

    if (organization.owner_id !== user.id) {
      return { success: false, error: new Error('Only the organization owner can delete the organization') }
    }

    // Mock implementation
    console.log(`Deleted organization ${organizationId}`)
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

/**
 * Switch user's current organization context
 */
export const switchOrganization = async (
  organizationId: string
): Promise<{
  success: boolean
  error: Error | null
}> => {
  try {
    // In a real implementation, this would update user metadata or session storage
    localStorage.setItem('current_organization_id', organizationId)

    console.log(`Switched to organization ${organizationId}`)
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

/**
 * Get user's current organization
 */
export const getCurrentOrganization = async (): Promise<{
  organization: Organization | null
  error: Error | null
}> => {
  try {
    const currentOrgId = localStorage.getItem('current_organization_id')

    if (!currentOrgId) {
      // Return first organization as default
      const { organizations } = await getUserOrganizations()
      if (organizations.length > 0) {
        await switchOrganization(organizations[0].id)
        return { organization: organizations[0], error: null }
      }
      return { organization: null, error: null }
    }

    return await getOrganization(currentOrgId)
  } catch (error) {
    return { organization: null, error: error as Error }
  }
}

/**
 * Validate organization slug availability
 */
export const validateOrganizationSlug = async (
  slug: string
): Promise<{
  available: boolean
  error: Error | null
}> => {
  try {
    // Validate format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return {
        available: false,
        error: new Error('Slug must contain only lowercase letters, numbers, and hyphens')
      }
    }

    if (slug.length < 3 || slug.length > 30) {
      return {
        available: false,
        error: new Error('Slug must be between 3 and 30 characters')
      }
    }

    // Check reserved slugs
    const reservedSlugs = ['api', 'www', 'admin', 'support', 'docs', 'blog', 'app']
    if (reservedSlugs.includes(slug)) {
      return {
        available: false,
        error: new Error('This slug is reserved')
      }
    }

    // Check availability (mock)
    const { organizations } = await getUserOrganizations()
    const available = !organizations.some(org => org.slug === slug)

    return { available, error: null }
  } catch (error) {
    return { available: false, error: error as Error }
  }
}