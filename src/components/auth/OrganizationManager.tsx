'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '../../hooks/useOrganization'
import { useAuth } from '../../hooks/useAuth'

interface OrganizationManagerProps {
  className?: string
}

export default function OrganizationManager({ className = '' }: OrganizationManagerProps) {
  const { user } = useAuth()
  const {
    organizations,
    currentOrganization,
    members,
    loading,
    error,
    switchToOrganization,
    createNewOrganization,
    updateCurrentOrganization,
    inviteMember,
    updateMemberRoleInOrg,
    removeMember,
    leaveCurrentOrganization,
    deleteCurrentOrganization,
    isOwner,
    isAdmin,
    canInviteMembers,
    canManageMembers,
    canEditOrganization,
    canDeleteOrganization
  } = useOrganization()

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings' | 'create'>('overview')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [editingSettings, setEditingSettings] = useState(false)

  // Create organization form state
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    description: '',
    plan: 'free' as 'free' | 'pro' | 'enterprise'
  })

  // Invite member form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer' as 'developer' | 'viewer'
  })

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    website: '',
    allow_public_signup: false,
    require_email_verification: true,
    default_member_role: 'viewer' as 'viewer' | 'developer',
    mfa_required: false,
    session_timeout_hours: 24
  })

  // Initialize settings form when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setSettingsForm({
        name: currentOrganization.name,
        description: currentOrganization.description || '',
        website: currentOrganization.website || '',
        allow_public_signup: currentOrganization.settings.allow_public_signup,
        require_email_verification: currentOrganization.settings.require_email_verification,
        default_member_role: currentOrganization.settings.default_member_role,
        mfa_required: currentOrganization.settings.mfa_required,
        session_timeout_hours: currentOrganization.settings.session_timeout_hours
      })
    }
  }, [currentOrganization])

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()

    const organization = await createNewOrganization(createForm)
    if (organization) {
      setShowCreateForm(false)
      setCreateForm({ name: '', slug: '', description: '', plan: 'free' })
      setActiveTab('overview')
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()

    const invitation = await inviteMember(inviteForm.email, inviteForm.role)
    if (invitation) {
      setShowInviteForm(false)
      setInviteForm({ email: '', role: 'viewer' })
    }
  }

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await updateCurrentOrganization({
      name: settingsForm.name,
      description: settingsForm.description,
      website: settingsForm.website,
      settings: {
        ...currentOrganization!.settings,
        allow_public_signup: settingsForm.allow_public_signup,
        require_email_verification: settingsForm.require_email_verification,
        default_member_role: settingsForm.default_member_role,
        mfa_required: settingsForm.mfa_required,
        session_timeout_hours: settingsForm.session_timeout_hours
      }
    })

    if (success) {
      setEditingSettings(false)
    }
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never'
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'developer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Organization Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to manage organizations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Organization Management
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Manage your organizations and team members.
              </p>
            </div>
            {organizations.length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Organization
              </button>
            )}
          </div>

          {/* Organization Selector */}
          {organizations.length > 1 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Organization
              </label>
              <select
                value={currentOrganization?.id || ''}
                onChange={(e) => switchToOrganization(e.target.value)}
                className="block w-full max-w-xs rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.plan})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        {currentOrganization && (
          <nav className="-mb-px flex space-x-8 px-6">
            {['overview', 'members', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        )}
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-400">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="p-6">
        {/* No organizations state */}
        {organizations.length === 0 && !showCreateForm && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m14 0a2 2 0 002-2V9a2 2 0 00-2-2M9 7h6m-6 4h6m-6 4h6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No organizations</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first organization.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Organization
              </button>
            </div>
          </div>
        )}

        {/* Create Organization Form */}
        {showCreateForm && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Organization
            </h3>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                    yourapp.com/
                  </span>
                  <input
                    type="text"
                    required
                    value={createForm.slug}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="block w-full rounded-none rounded-r-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="acme-corp"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Only lowercase letters, numbers, and hyphens allowed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Brief description of your organization..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan
                </label>
                <select
                  value={createForm.plan}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, plan: e.target.value as any }))}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="free">Free (5 members)</option>
                  <option value="pro">Pro (25 members)</option>
                  <option value="enterprise">Enterprise (100 members)</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Organization
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Organization Content */}
        {currentOrganization && !showCreateForm && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {members.filter(m => m.status === 'active').length}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Members</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          currentOrganization.plan === 'enterprise'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : currentOrganization.plan === 'pro'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {currentOrganization.plan}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Plan</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {currentOrganization.max_members} max members
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {isOwner ? 'Owner' : currentOrganization.current_user_role}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your Role</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Organization Details
                  </h4>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{currentOrganization.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</dt>
                      <dd className="text-sm text-gray-900 dark:text-white font-mono">{currentOrganization.slug}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {new Date(currentOrganization.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {new Date(currentOrganization.updated_at).toLocaleDateString()}
                      </dd>
                    </div>
                    {currentOrganization.description && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{currentOrganization.description}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Team Members ({members.length})
                  </h3>
                  {canInviteMembers && (
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Invite Member
                    </button>
                  )}
                </div>

                {/* Invite Form */}
                {showInviteForm && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Invite New Member
                    </h4>
                    <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        required
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email address"
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <select
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                        className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="developer">Developer</option>
                      </select>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Send Invite
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInviteForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}

                {/* Members List */}
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Seen
                        </th>
                        {canManageMembers && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {member.user?.avatar_url ? (
                                <img
                                  className="h-8 w-8 rounded-full"
                                  src={member.user.avatar_url}
                                  alt={member.user.full_name || member.user.email}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {(member.user?.full_name || member.user?.email || '?')[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {member.user?.full_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {member.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(member.role)}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(member.status)}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatLastSeen(member.last_seen)}
                          </td>
                          {canManageMembers && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                {member.role !== 'admin' && (
                                  <button
                                    onClick={() => updateMemberRoleInOrg(member.id, 'admin')}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    Promote
                                  </button>
                                )}
                                {member.user_id !== user?.id && (
                                  <button
                                    onClick={() => removeMember(member.id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Organization Settings
                  </h3>
                  {canEditOrganization && !editingSettings && (
                    <button
                      onClick={() => setEditingSettings(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Settings
                    </button>
                  )}
                </div>

                {editingSettings ? (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Settings editing form would go here.
                      </p>
                      <button
                        onClick={() => setEditingSettings(false)}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentOrganization.name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{currentOrganization.plan}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">MFA Required</dt>
                        <dd className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            currentOrganization.settings.mfa_required
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {currentOrganization.settings.mfa_required ? 'Yes' : 'No'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Session Timeout</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentOrganization.settings.session_timeout_hours} hours
                        </dd>
                      </div>
                    </dl>

                    {/* Danger Zone */}
                    {(canDeleteOrganization || !isOwner) && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="space-y-3">
                                {!isOwner && (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Leave Organization
                                      </h5>
                                      <p className="text-sm text-red-700 dark:text-red-300">
                                        You will lose access to this organization and all its resources.
                                      </p>
                                    </div>
                                    <button
                                      onClick={leaveCurrentOrganization}
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
                                    >
                                      Leave Organization
                                    </button>
                                  </div>
                                )}
                                {canDeleteOrganization && (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Delete Organization
                                      </h5>
                                      <p className="text-sm text-red-700 dark:text-red-300">
                                        Permanently delete this organization and all its data. This action cannot be undone.
                                      </p>
                                    </div>
                                    <button
                                      onClick={deleteCurrentOrganization}
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      Delete Organization
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}