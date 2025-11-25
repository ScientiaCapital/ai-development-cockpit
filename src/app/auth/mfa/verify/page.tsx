'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createMFAChallenge, verifyMFAChallenge, getMFAFactors } from '../../../../lib/mfa'

export default function MFAVerifyPage() {
  const router = useRouter()
  
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [challengeId, setChallengeId] = useState<string>('')
  const [factorId, setFactorId] = useState<string>('')

  useEffect(() => {
    const initializeMFAChallenge = async () => {
      try {
        // Get user's MFA factors
        const { data: factors, error: factorsError } = await getMFAFactors()
        
        if (factorsError || !factors || factors.length === 0) {
          router.push('/auth/login')
          return
        }

        // Use the first verified factor
        const verifiedFactor = factors.find(f => f.status === 'verified')
        if (!verifiedFactor) {
          router.push('/auth/login')
          return
        }

        setFactorId(verifiedFactor.id)

        // Create MFA challenge
        const { data: challenge, error: challengeError } = await createMFAChallenge(verifiedFactor.id)
        
        if (challengeError || !challenge) {
          setError('Failed to create verification challenge. Please try again.')
          return
        }

        setChallengeId(challenge.id)
      } catch (error) {
        setError('Failed to initialize MFA verification.')
      }
    }

    initializeMFAChallenge()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const { data, error } = await verifyMFAChallenge(factorId, challengeId, verificationCode)

      if (error) {
        setError(error.message || 'Invalid verification code. Please try again.')
        return
      }

      if (data) {
        // Redirect to the intended page or marketplace
        const redirectTo = sessionStorage.getItem('auth_redirect_to') || '/marketplace'
        sessionStorage.removeItem('auth_redirect_to')
        router.push(redirectTo)
      }
    } catch (error) {
      setError('Invalid verification code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only digits
    setVerificationCode(value)

    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleBackToLogin = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter the verification code from your authenticator app
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Verification failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || verificationCode.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Back to login
                </button>
              </div>
              <div className="text-sm">
                <Link
                  href="/auth/mfa/recovery"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Use recovery code
                </Link>
              </div>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Need help?
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code shown for this account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}