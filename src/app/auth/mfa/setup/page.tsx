'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { useAuth } from '../../../../hooks/useAuth'
import { enrollMFAFactor, verifyMFAEnrollment, parseQRCodeURI } from '../../../../lib/mfa'

export default function MFASetupPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [step, setStep] = useState<'enroll' | 'verify' | 'complete'>('enroll')
  const [qrCodeURL, setQrCodeURL] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [factorId, setFactorId] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    handleEnrollment()
  }, [user, router])

  const handleEnrollment = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await enrollMFAFactor({
        friendlyName: 'Authenticator App'
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data?.id && data?.uri) {
        setFactorId(data.id)
        
        // Generate QR code
        const qrDataURL = await QRCode.toDataURL(data.uri)
        setQrCodeURL(qrDataURL)
        
        // Parse secret for manual entry
        const parsed = parseQRCodeURI(data.uri)
        setSecret(parsed.secret || '')
        
        setStep('verify')
      }
    } catch (error) {
      setError('Failed to set up MFA. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await verifyMFAEnrollment(factorId, verificationCode)

      if (error) {
        setError(error.message)
        return
      }

      if (data) {
        setStep('complete')
      }
    } catch (error) {
      setError('Invalid verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/auth/settings')
  }

  if (step === 'enroll' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Setting up Two-Factor Authentication
            </h2>
            <div className="mt-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Preparing your authenticator setup...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Scan QR Code
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Use your authenticator app to scan the QR code below
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            )}

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                {qrCodeURL && (
                  <img 
                    src={qrCodeURL} 
                    alt="MFA QR Code" 
                    className="w-48 h-48"
                  />
                )}
              </div>
            </div>

            {/* Manual Entry Option */}
            <div className="text-center">
              <details className="text-sm text-gray-600 dark:text-gray-400">
                <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                  Can't scan? Enter manually
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="font-mono text-xs break-all">
                    {secret}
                  </p>
                  <p className="mt-1 text-xs">
                    Copy this secret into your authenticator app
                  </p>
                </div>
              </details>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white text-center text-lg tracking-widest font-mono"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Verify and Enable'
                  )}
                </button>
              </div>
            </form>

            <div className="text-center">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Cancel setup
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-600 dark:text-green-400">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="h-12 w-12"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Two-Factor Authentication Enabled!
            </h2>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your account is now protected with two-factor authentication.
            </p>

            <div className="mt-8 space-y-4">
              <button
                onClick={handleComplete}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Settings
              </button>

              <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Important
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>
                        Make sure to save your authenticator app backup or recovery codes. 
                        You'll need them to access your account if you lose your device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}