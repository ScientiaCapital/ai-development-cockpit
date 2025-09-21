'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  enrollMFAFactor,
  verifyMFAEnrollment,
  getMFAFactors,
  removeMFAFactor,
  generateBackupCodes,
  validateTOTPCode,
  formatTOTPCode,
  parseQRCodeURI,
  type MFAFactor,
  type MFAEnrollment
} from '../../lib/mfa'

interface MFASetupProps {
  onComplete?: () => void
  className?: string
}

export default function MFASetup({ onComplete, className = '' }: MFASetupProps) {
  const { user } = useAuth()
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollment, setEnrollment] = useState<MFAEnrollment | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load existing MFA factors
  useEffect(() => {
    loadMFAFactors()
  }, [])

  const loadMFAFactors = async () => {
    try {
      const { data, error } = await getMFAFactors()
      if (error) {
        setError(`Failed to load MFA factors: ${error.message}`)
      } else {
        setFactors(data || [])
      }
    } catch (error) {
      setError('Failed to load MFA factors')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollMFA = async () => {
    setEnrolling(true)
    setError(null)

    try {
      const { data, error } = await enrollMFAFactor({
        factorType: 'totp',
        friendlyName: `${user?.email}'s Authenticator`
      })

      if (error) {
        setError(`Failed to enroll MFA: ${error.message}`)
      } else if (data) {
        setEnrollment(data)
        // Generate backup codes for recovery
        setBackupCodes(generateBackupCodes())
      }
    } catch (error) {
      setError('Failed to enroll MFA')
    } finally {
      setEnrolling(false)
    }
  }

  const handleVerifyEnrollment = async () => {
    if (!enrollment || !validateTOTPCode(verificationCode)) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setVerifying(true)
    setError(null)

    try {
      const { data, error } = await verifyMFAEnrollment(
        enrollment.id,
        verificationCode.replace(/\s/g, '')
      )

      if (error) {
        setError(`Failed to verify code: ${error.message}`)
      } else if (data) {
        setSuccess('Two-factor authentication has been successfully enabled!')
        setShowBackupCodes(true)
        setEnrollment(null)
        setVerificationCode('')
        await loadMFAFactors()

        // Auto-complete after a short delay
        setTimeout(() => {
          onComplete?.()
        }, 2000)
      }
    } catch (error) {
      setError('Failed to verify enrollment')
    } finally {
      setVerifying(false)
    }
  }

  const handleRemoveFactor = async (factorId: string) => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return
    }

    try {
      const { error } = await removeMFAFactor(factorId)
      if (error) {
        setError(`Failed to remove MFA: ${error.message}`)
      } else {
        setSuccess('Two-factor authentication has been disabled')
        await loadMFAFactors()
      }
    } catch (error) {
      setError('Failed to remove MFA factor')
    }
  }

  const getQRCodeSecret = (): string => {
    if (!enrollment?.uri) return ''
    const parsed = parseQRCodeURI(enrollment.uri)
    return parsed.secret || ''
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Two-Factor Authentication
      </h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/50 p-4 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* Existing Factors */}
      {factors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Active Authenticators
          </h3>
          <div className="space-y-3">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {factor.friendly_name || 'Authenticator App'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status: <span className="font-medium">{factor.status}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Added: {new Date(factor.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFactor(factor.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup Codes Display */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-md">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
            ⚠️ Save Your Recovery Codes
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {backupCodes.map((code, index) => (
              <code
                key={index}
                className="block p-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded font-mono text-sm"
              >
                {code}
              </code>
            ))}
          </div>
          <button
            onClick={() => setShowBackupCodes(false)}
            className="text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
          >
            I've saved these codes
          </button>
        </div>
      )}

      {/* Enrollment Process */}
      {!enrollment && factors.length === 0 && (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add an extra layer of security to your account with two-factor authentication using an authenticator app.
          </p>
          <button
            onClick={handleEnrollMFA}
            disabled={enrolling}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrolling ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting up...
              </>
            ) : (
              'Enable Two-Factor Authentication'
            )}
          </button>
        </div>
      )}

      {/* QR Code and Manual Setup */}
      {enrollment && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Step 1: Scan QR Code
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
            </p>

            {enrollment.qr_code && (
              <div className="mb-4">
                <img
                  src={enrollment.qr_code}
                  alt="QR Code for Two-Factor Authentication"
                  className="border border-gray-200 dark:border-gray-700 rounded"
                />
              </div>
            )}

            <details className="mb-4">
              <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                Can't scan the QR code? Enter manually
              </summary>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Secret key:
                </p>
                <code className="block p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded font-mono text-sm break-all">
                  {getQRCodeSecret()}
                </code>
              </div>
            </details>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Step 2: Enter Verification Code
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={formatTOTPCode(verificationCode)}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\s/g, ''))}
                placeholder="123 456"
                maxLength={7}
                className="block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center font-mono"
              />
              <button
                onClick={handleVerifyEnrollment}
                disabled={verifying || !validateTOTPCode(verificationCode)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Information */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          🔒 Security Information
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p>• Two-factor authentication adds an extra layer of security to your account</p>
          <p>• You'll need your phone or authenticator app to sign in</p>
          <p>• Keep your recovery codes in a safe place</p>
          <p>• Supported apps: Google Authenticator, Authy, 1Password, Microsoft Authenticator</p>
        </div>
      </div>
    </div>
  )
}