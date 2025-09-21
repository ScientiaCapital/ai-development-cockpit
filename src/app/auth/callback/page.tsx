'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [provider, setProvider] = useState<string>('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for OAuth provider in URL params
        const providerParam = searchParams.get('provider')
        if (providerParam) {
          setProvider(providerParam)
        }

        // Handle OAuth callback with session exchange
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')

          // Provide more specific error messages for common OAuth issues
          if (error.message.includes('Invalid login credentials')) {
            setMessage('Authentication was cancelled or failed. Please try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setMessage('Please check your email and click the confirmation link before signing in.')
          } else {
            setMessage(error.message)
          }
          return
        }

        if (data.session) {
          const { user } = data.session

          // Log successful OAuth authentication
          console.log('OAuth authentication successful:', {
            provider: user.app_metadata?.provider || 'unknown',
            email: user.email,
            userId: user.id
          })

          setStatus('success')
          const authProvider = user.app_metadata?.provider || provider || 'OAuth'
          setMessage(`${authProvider} authentication successful! Redirecting...`)

          // Handle new user profile setup for OAuth users
          if (user.app_metadata?.provider && !user.user_metadata?.profile_complete) {
            // For OAuth users, we might want to redirect to a profile completion page
            // For now, we'll proceed to the main app
          }

          // Redirect to the intended page or dashboard
          const redirectTo = sessionStorage.getItem('auth_redirect_to') || '/marketplace'
          sessionStorage.removeItem('auth_redirect_to')

          setTimeout(() => {
            router.push(redirectTo)
          }, 1500)
        } else {
          // Check for specific OAuth error params
          const errorCode = searchParams.get('error')
          const errorDescription = searchParams.get('error_description')

          if (errorCode) {
            setStatus('error')
            if (errorCode === 'access_denied') {
              setMessage('Authentication was cancelled. You can try again if you wish.')
            } else if (errorDescription) {
              setMessage(decodeURIComponent(errorDescription))
            } else {
              setMessage(`Authentication failed: ${errorCode}`)
            }
          } else {
            setStatus('error')
            setMessage('No session found. Please try again.')
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication.')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const handleRetryLogin = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {status === 'loading' && 'Completing Authentication...'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Error'}
          </h2>

          <div className="mt-8">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Processing your authentication...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full h-12 w-12 bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {message}
                </p>
                <button
                  onClick={handleRetryLogin}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}