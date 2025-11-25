/**
 * Centralized Organization Type System
 *
 * This file provides a single source of truth for all organization-related types.
 *
 * Type Hierarchy:
 * - OrganizationSlug: String literal union for organization identifiers
 * - OrganizationEntity: Full organization database entity
 * - OrganizationRecord: Supabase table type (legacy compatibility)
 *
 * Migration Guide:
 * - Replace: Organization (from HuggingFaceAuth) → OrganizationSlug
 * - Replace: Organization (from organization.ts) → OrganizationEntity
 * - Replace: Organization (from organizations.ts) → OrganizationRecord
 */

import type { Tables } from '@/lib/supabase'

// ============================================================================
// ORGANIZATION SLUG (Identifier)
// ============================================================================

/**
 * Organization identifier used throughout the application.
 * Use this for routing, API calls, and organization switching.
 */
export type OrganizationSlug = 'arcade' | 'enterprise'

/**
 * Extended organization slug with shared/system organization.
 * Used for monitoring and system-wide operations.
 */
export type OrganizationSlugExtended = OrganizationSlug | 'shared'

/**
 * Type guard to check if a string is a valid organization slug
 */
export function isOrganizationSlug(value: string): value is OrganizationSlug {
  return value === 'arcade' || value === 'enterprise'
}

/**
 * Organization display names for UI
 */
export const ORGANIZATION_NAMES: Record<OrganizationSlug, string> = {
  arcade: 'AI Dev Cockpit',
  enterprise: 'Enterprise',
}

/**
 * Organization themes
 */
export const ORGANIZATION_THEMES: Record<OrganizationSlug, 'dark' | 'light'> = {
  arcade: 'dark',
  enterprise: 'light',
}

// ============================================================================
// ORGANIZATION ENTITY (Database Model)
// ============================================================================

/**
 * Base User type from profiles table
 */
export type OrganizationUser = Tables<'profiles'>

/**
 * Full organization entity with all database fields.
 * Use this for organization management, CRUD operations.
 */
export interface OrganizationEntity {
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
  owner?: OrganizationUser

  // Settings
  settings?: OrganizationSettings

  // Computed fields
  member_count?: number
  current_user_role?: string
}

/**
 * Organization settings configuration
 */
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

/**
 * Organization member with role and permissions
 */
export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'developer' | 'viewer'
  permissions: string[]
  joined_at: string
  last_active?: string

  // User details
  user?: OrganizationUser

  // Status
  status: 'active' | 'suspended' | 'invited'
}

/**
 * Organization invitation for new members
 */
export interface OrganizationInvitation {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'developer' | 'viewer'
  invited_by: string
  invited_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  token: string
}

// ============================================================================
// SUPABASE TYPES (Database Integration)
// ============================================================================

/**
 * Supabase organization table type.
 * Use this when working directly with Supabase queries.
 */
export type OrganizationRecord = Tables<'organizations'>

/**
 * Supabase user_organizations junction table
 */
export type UserOrganizationRecord = Tables<'user_organizations'>

/**
 * Organization with member list (join result)
 */
export interface OrganizationWithMembers extends OrganizationRecord {
  user_organizations: (UserOrganizationRecord & {
    profiles: Tables<'profiles'>
  })[]
  member_count: number
}

// ============================================================================
// API TYPES (Data Transfer Objects)
// ============================================================================

/**
 * Data required to create a new organization
 */
export interface CreateOrganizationData {
  name: string
  slug?: string  // Auto-generated if not provided
  description?: string
  website_url?: string
  logo_url?: string
  settings?: Partial<OrganizationSettings>
}

/**
 * Data for updating an existing organization
 */
export interface UpdateOrganizationData {
  name?: string
  description?: string
  website_url?: string
  logo_url?: string
  settings?: Partial<OrganizationSettings>
}

/**
 * Organization invitation request
 */
export interface OrganizationInviteData {
  organization_id: string
  email: string
  role: 'admin' | 'developer' | 'viewer'
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Authentication tokens for each organization
 */
export interface OrganizationAuthTokens {
  arcade: string
  enterprise: string
}

/**
 * User's organization context
 */
export interface UserOrganizationContext {
  id: string
  name: string
  slug: OrganizationSlug
  role: string
  permissions: string[]
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Organization-specific statistics
 */
export interface OrganizationStats {
  total_models: number
  total_deployments: number
  total_inferences: number
  total_cost: number
  active_members: number
}

/**
 * Stats grouped by organization
 */
export type OrganizationStatsMap = Record<OrganizationSlug, OrganizationStats>

/**
 * Organization update event for real-time subscriptions
 */
export interface OrganizationUpdateEvent {
  organization: OrganizationSlug
  type: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed'
  timestamp: string
  data: any
}

// ============================================================================
// SERVICE-SPECIFIC TYPES
// ============================================================================

/**
 * Organization-specific rate limits
 */
export interface OrganizationLimits {
  organization: OrganizationSlug
  requests_per_minute: number
  requests_per_hour: number
  requests_per_day: number
  max_concurrent: number
}

/**
 * Organization-specific credentials (encrypted)
 */
export interface OrganizationCredentials {
  organization: OrganizationSlug
  huggingface_token: string
  runpod_api_key?: string
  openai_api_key?: string
  anthropic_api_key?: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert organization slug to display name
 */
export function getOrganizationName(slug: OrganizationSlug): string {
  return ORGANIZATION_NAMES[slug]
}

/**
 * Get organization theme
 */
export function getOrganizationTheme(slug: OrganizationSlug): 'dark' | 'light' {
  return ORGANIZATION_THEMES[slug]
}

/**
 * Validate organization slug format
 */
export function validateOrganizationSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50
}
