/**
 * Multi-Factor Authentication utilities for TOTP and backup codes
 */

import { supabase } from './supabase'
import { AuthError, Factor } from '@supabase/supabase-js'
import { isError, getErrorMessage } from '../utils/errorGuards'

export interface MFAEnrollment {
  id: string
  type: 'totp'
  friendly_name?: string
  qr_code?: string
  secret?: string
  uri?: string
}

// Using Factor type from @supabase/supabase-js instead of custom MFAFactor

export interface MFAChallenge {
  id: string
  type: 'totp' | 'phone'
  expires_at: number
}

export interface MFAVerification {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: any
}

/**
 * Enroll a new MFA factor (TOTP)
 */
export const enrollMFAFactor = async (options?: {
  factorType?: 'totp'
  friendlyName?: string
}): Promise<{
  data: MFAEnrollment | null
  error: AuthError | null
}> => {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: options?.factorType || 'totp',
      friendlyName: options?.friendlyName || 'Authenticator App'
    })

    return { data, error }
  } catch (error) {
    console.error('MFA enrollment error:', error)
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Verify an MFA enrollment with TOTP code
 */
export const verifyMFAEnrollment = async (
  factorId: string,
  code: string
): Promise<{
  data: MFAVerification | null
  error: AuthError | null
}> => {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: factorId,
      code
    })

    return { data, error }
  } catch (error: unknown) {
    console.error('MFA verification error:', error)
    return {
      data: null,
      error: isError(error) ? error as AuthError : new Error(getErrorMessage(error)) as AuthError
    }
  }
}

/**
 * Create an MFA challenge for login
 */
export const createMFAChallenge = async (
  factorId: string
): Promise<{
  data: MFAChallenge | null
  error: AuthError | null
}> => {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId
    })

    return { data, error }
  } catch (error: unknown) {
    console.error('MFA challenge error:', error)
    return {
      data: null,
      error: isError(error) ? error as AuthError : new Error(getErrorMessage(error)) as AuthError
    }
  }
}

/**
 * Verify an MFA challenge with TOTP code
 */
export const verifyMFAChallenge = async (
  factorId: string,
  challengeId: string,
  code: string
): Promise<{
  data: MFAVerification | null
  error: AuthError | null
}> => {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    })

    return { data, error }
  } catch (error) {
    console.error('MFA challenge verification error:', error)
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Get all MFA factors for the current user
 */
export const getMFAFactors = async (): Promise<{
  data: Factor[] | null
  error: AuthError | null
}> => {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors()

    if (error) {
      return { data: null, error }
    }

    return { data: data.all || [], error: null }
  } catch (error: unknown) {
    console.error('Get MFA factors error:', error)
    return {
      data: null,
      error: isError(error) ? error as AuthError : new Error(getErrorMessage(error)) as AuthError
    }
  }
}

/**
 * Remove an MFA factor
 */
export const removeMFAFactor = async (
  factorId: string
): Promise<{
  data: any | null
  error: AuthError | null
}> => {
  try {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId
    })

    return { data, error }
  } catch (error) {
    console.error('MFA unenroll error:', error)
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Generate backup codes for MFA recovery
 * Note: Supabase doesn't provide backup codes by default
 * This is a placeholder for custom implementation
 */
export const generateBackupCodes = (): string[] => {
  const codes: string[] = []

  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }

  return codes
}

/**
 * Validate TOTP code format
 */
export const validateTOTPCode = (code: string): boolean => {
  // TOTP codes are typically 6 digits
  const codeRegex = /^\d{6}$/
  return codeRegex.test(code.replace(/\s/g, ''))
}

/**
 * Format TOTP code for display (adds spaces)
 */
export const formatTOTPCode = (code: string): string => {
  const cleaned = code.replace(/\s/g, '')
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
  }
  return cleaned
}

/**
 * Parse QR code URI for manual entry
 */
export const parseQRCodeURI = (uri: string): {
  secret?: string
  issuer?: string
  label?: string
} => {
  try {
    const url = new URL(uri)
    const searchParams = url.searchParams

    return {
      secret: searchParams.get('secret') || undefined,
      issuer: searchParams.get('issuer') || undefined,
      label: url.pathname.split('/').pop() || undefined
    }
  } catch (error) {
    console.error('Error parsing QR code URI:', error)
    return {}
  }
}

/**
 * Check if user has MFA enabled
 */
export const hasMFAEnabled = async (): Promise<boolean> => {
  try {
    const { data } = await getMFAFactors()
    return data ? data.some(factor => factor.status === 'verified') : false
  } catch (error) {
    console.error('Error checking MFA status:', error)
    return false
  }
}

/**
 * Get the user's verified MFA factors
 */
export const getVerifiedMFAFactors = async (): Promise<Factor[]> => {
  try {
    const { data } = await getMFAFactors()
    return data ? data.filter(factor => factor.status === 'verified') : []
  } catch (error) {
    console.error('Error getting verified MFA factors:', error)
    return []
  }
}