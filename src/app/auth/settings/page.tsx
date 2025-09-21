'use client'

import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import MFASetup from '../../../components/auth/MFASetup'

export default function AuthSettings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'security' | 'profile' | 'organizations'>('security')

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access your security settings.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account security, profile, and organization settings.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organizations'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Organizations
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Account Security Overview */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Account Security
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Account Information
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Provider:</strong> {user.app_metadata?.provider || 'Email'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Security Actions
                    </h3>
                    <div className="space-y-3">
                      <button className="block w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded">
                        Change Password
                      </button>
                      <button className="block w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded">
                        View Login History
                      </button>
                      <button className="block w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded">
                        Download Account Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MFA Setup */}
              <MFASetup />

              {/* Session Management */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Active Sessions
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Manage your active login sessions across devices.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Current Session
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This device • Active now
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                      Current
                    </span>
                  </div>
                </div>
                <button className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline">
                  Sign out all other sessions
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Profile Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Update your personal information and preferences.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user.user_metadata?.full_name || ''}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Contact support to change your email address.
                  </p>
                </div>

                <div>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'organizations' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Organizations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Manage your organization memberships and permissions.
              </p>

              {user.organizations && user.organizations.length > 0 ? (
                <div className="space-y-4">
                  {user.organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {org.organization.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Role: {org.role} • Joined {new Date(org.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.currentOrganization?.id === org.organization.id && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                            Current
                          </span>
                        )}
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          Switch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You're not a member of any organizations yet.
                  </p>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    Create Organization
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}