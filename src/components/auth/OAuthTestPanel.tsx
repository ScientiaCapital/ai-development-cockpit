'use client'

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { parseOAuthError, extractOAuthProfile, getProviderDisplayInfo } from '../../lib/oauth'

export default function OAuthTestPanel() {
  const { user, signInWithGitHub, signInWithGoogle, signOut } = useAuth()
  const [isTestingGitHub, setIsTestingGitHub] = useState(false)
  const [isTestingGoogle, setIsTestingGoogle] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const handleGitHubTest = async () => {
    setIsTestingGitHub(true)
    setLastError(null)

    try {
      const { error } = await signInWithGitHub()
      if (error) {
        const parsedError = parseOAuthError(error)
        setLastError(`GitHub OAuth Error: ${parsedError.message}`)
      }
    } catch (error) {
      setLastError(`GitHub OAuth Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTestingGitHub(false)
    }
  }

  const handleGoogleTest = async () => {
    setIsTestingGoogle(true)
    setLastError(null)

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        const parsedError = parseOAuthError(error)
        setLastError(`Google OAuth Error: ${parsedError.message}`)
      }
    } catch (error) {
      setLastError(`Google OAuth Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTestingGoogle(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setLastError(null)
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        OAuth Integration Test Panel
      </h2>

      {/* Current User Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Authentication Status
        </h3>
        {user ? (
          <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Authenticated as: <strong>{user.email}</strong>
            </p>
            {user.app_metadata?.provider && (
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Provider: <strong>{getProviderDisplayInfo(user.app_metadata.provider as any)?.displayName || user.app_metadata.provider}</strong>
              </p>
            )}
            {user.user_metadata && (
              <div className="mt-2">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Profile Data:
                </p>
                <pre className="text-xs bg-green-100 dark:bg-green-800 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(extractOAuthProfile(user), null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Not authenticated
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {lastError && (
        <div className="mb-6">
          <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Last Error
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              {lastError}
            </p>
          </div>
        </div>
      )}

      {/* OAuth Test Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          OAuth Provider Tests
        </h3>

        {!user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GitHub Test */}
            <button
              onClick={handleGitHubTest}
              disabled={isTestingGitHub}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingGitHub ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing GitHub...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  Test GitHub OAuth
                </>
              )}
            </button>

            {/* Google Test */}
            <button
              onClick={handleGoogleTest}
              disabled={isTestingGoogle}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingGoogle ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing Google...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Test Google OAuth
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Configuration Notes */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Configuration Notes
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p>• OAuth providers must be configured in your Supabase dashboard</p>
          <p>• Callback URL should be: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{window.location.origin}/auth/callback</code></p>
          <p>• Check browser console for detailed OAuth error logs</p>
          <p>• See <code>docs/supabase-oauth-setup.md</code> for setup instructions</p>
        </div>
      </div>
    </div>
  )
}