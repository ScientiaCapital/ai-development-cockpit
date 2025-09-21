'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMFAFactors, removeMFAFactor, hasMFAEnabled } from '../../lib/mfa'
import type { MFAFactor } from '../../lib/mfa'

export default function MFASetup() {
  const router = useRouter()
  
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [removingFactor, setRemovingFactor] = useState<string | null>(null)

  useEffect(() => {
    loadMFAFactors()
  }, [])

  const loadMFAFactors = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getMFAFactors()
      
      if (error) {
        setError(error.message)
        return
      }

      setFactors(data || [])
    } catch (error) {
      setError('Failed to load MFA settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupMFA = () => {
    router.push('/auth/mfa/setup')
  }

  const handleRemoveFactor = async (factorId: string) => {
    if (!confirm('Are you sure you want to remove this authenticator? This will disable two-factor authentication for your account.')) {
      return
    }

    setRemovingFactor(factorId)
    try {
      const { error } = await removeMFAFactor(factorId)
      
      if (error) {
        setError(error.message)
        return
      }

      // Reload factors
      await loadMFAFactors()
    } catch (error) {
      setError('Failed to remove authenticator')
    } finally {
      setRemovingFactor(null)
    }
  }

  const verifiedFactors = factors.filter(f => f.status === 'verified')
  const hasActiveMFA = verifiedFactors.length > 0

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Add an extra layer of security to your account with two-factor authentication.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
            <div className="text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {/* MFA Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-3 h-3 rounded-full ${hasActiveMFA ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {hasActiveMFA ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasActiveMFA 
                  ? 'Your account is protected with 2FA' 
                  : 'Secure your account with an authenticator app'
                }
              </p>
            </div>
          </div>
          
          {!hasActiveMFA && (
            <button
              onClick={handleSetupMFA}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Set up 2FA
            </button>
          )}
        </div>

        {/* Active Factors */}
        {verifiedFactors.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Active Authenticators
            </h4>
            
            {verifiedFactors.map((factor) => (
              <div 
                key={factor.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {factor.friendly_name || 'Authenticator App'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Added {new Date(factor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveFactor(factor.id)}
                  disabled={removingFactor === factor.id}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {removingFactor === factor.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                About Two-Factor Authentication
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Two-factor authentication adds an extra layer of security to your account by requiring 
                  a code from your authenticator app in addition to your password when signing in.
                </p>
                <div className="mt-3">
                  <p className="font-medium">Recommended authenticator apps:</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>Google Authenticator</li>
                    <li>Authy</li>
                    <li>Microsoft Authenticator</li>
                    <li>1Password</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Codes Section */}
        {hasActiveMFA && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Backup Recovery Codes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate backup codes to access your account if you lose your authenticator
                </p>
              </div>
              <Link
                href="/auth/mfa/backup-codes"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Manage Backup Codes
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}