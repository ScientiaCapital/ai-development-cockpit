'use client'

import { useAuth } from '../../../hooks/useAuth'

export default function AuthTestPage() {
  const { user, loading, initialized, signOut } = useAuth()

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Authentication Test Page
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Status
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Initialized:</span> {initialized ? 'Yes' : 'No'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Authenticated:</span> {user ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {user ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  User Information
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">ID:</span> {user.id}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  {user.profile && (
                    <p className="text-sm">
                      <span className="font-medium">Full Name:</span> {user.profile.full_name || 'Not provided'}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Email Confirmed:</span> {user.email_confirmed_at ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Not Authenticated
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  You are not currently signed in.
                </p>
              </div>
            )}

            {user?.organizations && user.organizations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Organizations
                </h2>
                <div className="space-y-2">
                  {user.organizations.map((org, index) => (
                    <div key={org.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <p className="text-sm">
                        <span className="font-medium">Name:</span> {org.organization.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Role:</span> {org.role}
                      </p>
                      {user.currentOrganization?.id === org.id && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Current Organization
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex space-x-4">
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sign Out
                  </button>
                ) : (
                  <>
                    <a
                      href="/auth/login"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Sign In
                    </a>
                    <a
                      href="/auth/signup"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Sign Up
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}