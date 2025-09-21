'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MFARecoveryPage() {
  const router = useRouter()
  
  const [recoveryCode, setRecoveryCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recoveryCode.trim()) {
      setError('Please enter a recovery code')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Note: Supabase doesn't have built-in recovery codes
      // This would need custom implementation with backup codes stored securely
      setError('Recovery codes are not yet implemented. Please contact support if you cannot access your authenticator.')
    } catch (error) {
      setError('Invalid recovery code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setRecoveryCode(value)

    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleBackToMFA = () => {
    router.push('/auth/mfa/verify')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Account Recovery
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter one of your backup recovery codes
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Recovery failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="recoveryCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recovery Code
              </label>
              <div className="mt-1">
                <input
                  id="recoveryCode"
                  name="recoveryCode"
                  type="text"
                  maxLength={12}
                  required
                  value={recoveryCode}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white text-center text-lg tracking-wider font-mono"
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Enter one of your backup recovery codes
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !recoveryCode.trim()}
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
                  'Recover Account'
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleBackToMFA}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Back to 2FA
                </button>
              </div>
              <div className="text-sm">
                <Link
                  href="/auth/login"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Can't find your recovery codes?
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    Recovery codes are typically saved when you first set up two-factor authentication. 
                    If you can't find them, please contact support for assistance.
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