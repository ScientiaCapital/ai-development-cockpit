'use client'

import { useState, useEffect } from 'react'
import {
  createMFAChallenge,
  verifyMFAChallenge,
  validateTOTPCode,
  formatTOTPCode,
  type MFAChallenge
} from '../../lib/mfa'
import type { Factor } from '@supabase/supabase-js'

interface MFAVerificationProps {
  factors: Factor[]
  onSuccess: (data: any) => void
  onError: (error: string) => void
  onCancel?: () => void
  className?: string
}

export default function MFAVerification({
  factors,
  onSuccess,
  onError,
  onCancel,
  className = ''
}: MFAVerificationProps) {
  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null)
  const [challenge, setChallenge] = useState<MFAChallenge | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // Auto-select the first verified factor
  useEffect(() => {
    const verifiedFactors = factors.filter(f => f.status === 'verified')
    if (verifiedFactors.length > 0) {
      setSelectedFactor(verifiedFactors[0])
    }
  }, [factors])

  // Auto-create challenge when factor is selected
  useEffect(() => {
    if (selectedFactor && !challenge) {
      createChallenge()
    }
  }, [selectedFactor])

  const createChallenge = async () => {
    if (!selectedFactor) return

    setCreating(true)
    try {
      const { data, error } = await createMFAChallenge(selectedFactor.id)
      if (error) {
        onError(`Failed to create verification challenge: ${error.message}`)
      } else if (data) {
        setChallenge(data)
      }
    } catch (error) {
      onError('Failed to create verification challenge')
    } finally {
      setCreating(false)
    }
  }

  const handleVerify = async () => {
    if (!selectedFactor || !challenge || !validateTOTPCode(verificationCode)) {
      onError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await verifyMFAChallenge(
        selectedFactor.id,
        challenge.id,
        verificationCode.replace(/\s/g, '')
      )

      if (error) {
        onError(`Verification failed: ${error.message}`)
      } else if (data) {
        onSuccess(data)
      }
    } catch (error) {
      onError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validateTOTPCode(verificationCode)) {
      handleVerify()
    }
  }

  const verifiedFactors = factors.filter(f => f.status === 'verified')

  if (verifiedFactors.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900 mx-auto flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No MFA Methods Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No verified two-factor authentication methods found for your account.
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="rounded-full h-12 w-12 bg-blue-100 dark:bg-blue-900 mx-auto flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Two-Factor Authentication Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter the verification code from your authenticator app to continue.
        </p>
      </div>

      {/* Factor Selection (if multiple factors) */}
      {verifiedFactors.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose Authentication Method
          </label>
          <select
            value={selectedFactor?.id || ''}
            onChange={(e) => {
              const factor = verifiedFactors.find(f => f.id === e.target.value)
              setSelectedFactor(factor || null)
              setChallenge(null)
              setVerificationCode('')
            }}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {verifiedFactors.map((factor) => (
              <option key={factor.id} value={factor.id}>
                {factor.friendly_name || 'Authenticator App'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Challenge Creation Loading */}
      {creating && (
        <div className="text-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Preparing verification challenge...
          </p>
        </div>
      )}

      {/* Verification Code Input */}
      {selectedFactor && challenge && !creating && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Code
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Enter the 6-digit code from your {selectedFactor.friendly_name || 'authenticator app'}.
          </p>
          <div className="flex justify-center mb-4">
            <input
              type="text"
              value={formatTOTPCode(verificationCode)}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\s/g, ''))}
              onKeyPress={handleKeyPress}
              placeholder="123 456"
              maxLength={7}
              autoFocus
              className="block w-40 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center font-mono text-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 justify-center">
            <button
              onClick={handleVerify}
              disabled={loading || !validateTOTPCode(verificationCode)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Having trouble?
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>• Make sure your device's time is synchronized</p>
          <p>• Check that you're using the correct authenticator app</p>
          <p>• Try generating a new code if the current one expired</p>
          <p>• Contact support if you've lost access to your authenticator</p>
        </div>
      </div>
    </div>
  )
}