'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'

export default function Unauthorized() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/marketplace')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600 dark:text-red-400">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You don't have permission to access this resource.
          </p>

          {user && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Current User:</strong> {user.email}
              </p>
              {user.currentOrganization && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Organization:</strong> {user.currentOrganization.organization.name}
                </p>
              )}
              {user.currentOrganization?.role && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Role:</strong> {user.currentOrganization.role}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={handleGoBack}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Marketplace
            </button>

            {user && (
              <button
                onClick={handleSignOut}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            )}
          </div>

          <div className="mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If you believe this is an error, please contact your organization administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}