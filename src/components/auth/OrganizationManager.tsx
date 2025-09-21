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
        <div className=\"flex items-center justify-center h-32\">
          <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className=\"text-center\">
          <h2 className=\"text-xl font-bold text-gray-900 dark:text-white mb-2\">
            Organization Management
          </h2>
          <p className=\"text-gray-600 dark:text-gray-400\">
            Please sign in to manage organizations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      <div className=\"border-b border-gray-200 dark:border-gray-700\">
        <div className=\"p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <h2 className=\"text-xl font-bold text-gray-900 dark:text-white\">
                Organization Management
              </h2>
              <p className=\"mt-1 text-gray-600 dark:text-gray-400\">
                Manage your organizations and team members.
              </p>
            </div>
            {organizations.length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className=\"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"
              >
                <svg className=\"h-4 w-4 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4v16m8-8H4\" />
                </svg>
                New Organization
              </button>
            )}
          </div>

          {/* Organization Selector */}
          {organizations.length > 1 && (
            <div className=\"mt-4\">
              <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2\">
                Current Organization
              </label>
              <select
                value={currentOrganization?.id || ''}
                onChange={(e) => switchToOrganization(e.target.value)}
                className=\"block w-full max-w-xs rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"
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
          <nav className=\"-mb-px flex space-x-8 px-6\">
            {['overview', 'members', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${\n                  activeTab === tab\n                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'\n                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'\n                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        )}
      </div>

      {error && (
        <div className=\"p-6 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-400\">
          <p className=\"text-red-700 dark:text-red-300\">{error}</p>
        </div>
      )}

      <div className=\"p-6\">
        {/* No organizations state */}
        {organizations.length === 0 && !showCreateForm && (
          <div className=\"text-center py-12\">
            <svg className=\"mx-auto h-12 w-12 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m14 0a2 2 0 002-2V9a2 2 0 00-2-2M9 7h6m-6 4h6m-6 4h6\" />
            </svg>
            <h3 className=\"mt-2 text-sm font-medium text-gray-900 dark:text-white\">No organizations</h3>
            <p className=\"mt-1 text-sm text-gray-500 dark:text-gray-400\">
              Get started by creating your first organization.
            </p>
            <div className=\"mt-6\">
              <button
                onClick={() => setShowCreateForm(true)}
                className=\"inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"
              >
                <svg className=\"-ml-1 mr-2 h-5 w-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4v16m8-8H4\" />
                </svg>
                Create Organization
              </button>
            </div>
          </div>
        )}

        {/* Create Organization Form */}
        {showCreateForm && (
          <div className=\"max-w-2xl\">
            <h3 className=\"text-lg font-medium text-gray-900 dark:text-white mb-4\">
              Create New Organization
            </h3>
            <form onSubmit={handleCreateOrganization} className=\"space-y-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">
                  Organization Name
                </label>
                <input
                  type=\"text\"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className=\"block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"
                  placeholder=\"Acme Corporation\"
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">
                  URL Slug
                </label>
                <div className=\"flex\">
                  <span className=\"inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm\">
                    yourapp.com/
                  </span>
                  <input
                    type=\"text\"
                    required
                    value={createForm.slug}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className=\"block w-full rounded-none rounded-r-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"
                    placeholder=\"acme-corp\"
                  />
                </div>
                <p className=\"mt-1 text-xs text-gray-500 dark:text-gray-400\">
                  Only lowercase letters, numbers, and hyphens allowed.
                </p>
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">
                  Description (Optional)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className=\"block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"
                  placeholder=\"Brief description of your organization...\"
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">
                  Plan
                </label>
                <select
                  value={createForm.plan}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, plan: e.target.value as any }))}
                  className=\"block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"
                >
                  <option value=\"free\">Free (5 members)</option>
                  <option value=\"pro\">Pro (25 members)</option>
                  <option value=\"enterprise\">Enterprise (100 members)</option>
                </select>
              </div>

              <div className=\"flex space-x-3\">
                <button
                  type=\"submit\"
                  className=\"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"
                >
                  Create Organization
                </button>
                <button
                  type=\"button\"
                  onClick={() => setShowCreateForm(false)}
                  className=\"inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"
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
              <div className=\"space-y-6\">
                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
                  <div className=\"bg-gray-50 dark:bg-gray-700 rounded-lg p-4\">
                    <div className=\"flex items-center\">
                      <div className=\"flex-shrink-0\">
                        <svg className=\"h-8 w-8 text-blue-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" />
                        </svg>
                      </div>
                      <div className=\"ml-4\">
                        <h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">
                          {members.filter(m => m.status === 'active').length}
                        </h3>
                        <p className=\"text-sm text-gray-500 dark:text-gray-400\">Active Members</p>
                      </div>
                    </div>
                  </div>

                  <div className=\"bg-gray-50 dark:bg-gray-700 rounded-lg p-4\">
                    <div className=\"flex items-center\">
                      <div className=\"flex-shrink-0\">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${\n                          currentOrganization.plan === 'enterprise'\n                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'\n                            : currentOrganization.plan === 'pro'\n                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'\n                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'\n                        }`}>\n                          {currentOrganization.plan}\n                        </span>\n                      </div>\n                      <div className=\"ml-4\">
                        <h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">Plan</h3>\n                        <p className=\"text-sm text-gray-500 dark:text-gray-400\">\n                          {currentOrganization.max_members} max members\n                        </p>\n                      </div>\n                    </div>\n                  </div>\n\n                  <div className=\"bg-gray-50 dark:bg-gray-700 rounded-lg p-4\">
                    <div className=\"flex items-center\">
                      <div className=\"flex-shrink-0\">
                        <svg className=\"h-8 w-8 text-green-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z\" />
                        </svg>\n                      </div>\n                      <div className=\"ml-4\">\n                        <h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">\n                          {isOwner ? 'Owner' : currentOrganization.current_user_role}\n                        </h3>\n                        <p className=\"text-sm text-gray-500 dark:text-gray-400\">Your Role</p>\n                      </div>\n                    </div>\n                  </div>\n                </div>\n\n                <div>\n                  <h4 className=\"text-sm font-medium text-gray-900 dark:text-white mb-2\">\n                    Organization Details\n                  </h4>\n                  <dl className=\"grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2\">\n                    <div>\n                      <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Name</dt>\n                      <dd className=\"text-sm text-gray-900 dark:text-white\">{currentOrganization.name}</dd>\n                    </div>\n                    <div>\n                      <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Slug</dt>\n                      <dd className=\"text-sm text-gray-900 dark:text-white font-mono\">{currentOrganization.slug}</dd>\n                    </div>\n                    <div>\n                      <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Created</dt>\n                      <dd className=\"text-sm text-gray-900 dark:text-white\">\n                        {new Date(currentOrganization.created_at).toLocaleDateString()}\n                      </dd>\n                    </div>\n                    <div>\n                      <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Last Updated</dt>\n                      <dd className=\"text-sm text-gray-900 dark:text-white\">\n                        {new Date(currentOrganization.updated_at).toLocaleDateString()}\n                      </dd>\n                    </div>\n                    {currentOrganization.description && (\n                      <div className=\"sm:col-span-2\">\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Description</dt>\n                        <dd className=\"text-sm text-gray-900 dark:text-white\">{currentOrganization.description}</dd>\n                      </div>\n                    )}\n                  </dl>\n                </div>\n              </div>\n            )}\n\n            {/* Members Tab */}\n            {activeTab === 'members' && (\n              <div className=\"space-y-6\">\n                <div className=\"flex items-center justify-between\">\n                  <h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">\n                    Team Members ({members.length})\n                  </h3>\n                  {canInviteMembers && (\n                    <button\n                      onClick={() => setShowInviteForm(true)}\n                      className=\"inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"\n                    >\n                      <svg className=\"h-4 w-4 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4v16m8-8H4\" />\n                      </svg>\n                      Invite Member\n                    </button>\n                  )}\n                </div>\n\n                {/* Invite Form */}\n                {showInviteForm && (\n                  <div className=\"bg-gray-50 dark:bg-gray-700 rounded-lg p-4\">\n                    <h4 className=\"text-sm font-medium text-gray-900 dark:text-white mb-3\">\n                      Invite New Member\n                    </h4>\n                    <form onSubmit={handleInviteMember} className=\"flex flex-col sm:flex-row gap-3\">\n                      <input\n                        type=\"email\"\n                        required\n                        value={inviteForm.email}\n                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}\n                        placeholder=\"Email address\"\n                        className=\"flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"\n                      />\n                      <select\n                        value={inviteForm.role}\n                        onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}\n                        className=\"rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"\n                      >\n                        <option value=\"viewer\">Viewer</option>\n                        <option value=\"developer\">Developer</option>\n                      </select>\n                      <button\n                        type=\"submit\"\n                        className=\"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"\n                      >\n                        Send Invite\n                      </button>\n                      <button\n                        type=\"button\"\n                        onClick={() => setShowInviteForm(false)}\n                        className=\"inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"\n                      >\n                        Cancel\n                      </button>\n                    </form>\n                  </div>\n                )}\n\n                {/* Members List */}\n                <div className=\"overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg\">\n                  <table className=\"min-w-full divide-y divide-gray-300 dark:divide-gray-600\">\n                    <thead className=\"bg-gray-50 dark:bg-gray-700\">\n                      <tr>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                          Member\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                          Role\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                          Status\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                          Last Seen\n                        </th>\n                        {canManageMembers && (\n                          <th className=\"px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                            Actions\n                          </th>\n                        )}\n                      </tr>\n                    </thead>\n                    <tbody className=\"bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700\">\n                      {members.map((member) => (\n                        <tr key={member.id}>\n                          <td className=\"px-6 py-4 whitespace-nowrap\">\n                            <div className=\"flex items-center\">\n                              {member.user?.avatar_url ? (\n                                <img\n                                  className=\"h-8 w-8 rounded-full\"\n                                  src={member.user.avatar_url}\n                                  alt={member.user.full_name || member.user.email}\n                                />\n                              ) : (\n                                <div className=\"h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center\">\n                                  <span className=\"text-sm font-medium text-gray-700 dark:text-gray-300\">\n                                    {(member.user?.full_name || member.user?.email || '?')[0].toUpperCase()}\n                                  </span>\n                                </div>\n                              )}\n                              <div className=\"ml-3\">\n                                <div className=\"text-sm font-medium text-gray-900 dark:text-white\">\n                                  {member.user?.full_name || 'Unknown'}\n                                </div>\n                                <div className=\"text-sm text-gray-500 dark:text-gray-400\">\n                                  {member.user?.email}\n                                </div>\n                              </div>\n                            </div>\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap\">\n                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(member.role)}`}>\n                              {member.role}\n                            </span>\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap\">\n                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(member.status)}`}>\n                              {member.status}\n                            </span>\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400\">\n                            {formatLastSeen(member.last_seen)}\n                          </td>\n                          {canManageMembers && (\n                            <td className=\"px-6 py-4 whitespace-nowrap text-right text-sm font-medium\">\n                              <div className=\"flex items-center justify-end space-x-2\">\n                                {member.role !== 'admin' && (\n                                  <button\n                                    onClick={() => updateMemberRoleInOrg(member.id, 'admin')}\n                                    className=\"text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300\"\n                                  >\n                                    Promote\n                                  </button>\n                                )}\n                                {member.user_id !== user?.id && (\n                                  <button\n                                    onClick={() => removeMember(member.id)}\n                                    className=\"text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300\"\n                                  >\n                                    Remove\n                                  </button>\n                                )}\n                              </div>\n                            </td>\n                          )}\n                        </tr>\n                      ))}\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n            )}\n\n            {/* Settings Tab */}\n            {activeTab === 'settings' && (\n              <div className=\"space-y-6\">\n                <div className=\"flex items-center justify-between\">\n                  <h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">\n                    Organization Settings\n                  </h3>\n                  {canEditOrganization && !editingSettings && (\n                    <button\n                      onClick={() => setEditingSettings(true)}\n                      className=\"inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"\n                    >\n                      <svg className=\"h-4 w-4 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z\" />\n                      </svg>\n                      Edit Settings\n                    </button>\n                  )}\n                </div>\n\n                {editingSettings ? (\n                  <form onSubmit={handleUpdateSettings} className=\"space-y-6\">\n                    <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n                      <div>\n                        <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                          Organization Name\n                        </label>\n                        <input\n                          type=\"text\"\n                          required\n                          value={settingsForm.name}\n                          onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}\n                          className=\"block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"\n                        />\n                      </div>\n\n                      <div>\n                        <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                          Website\n                        </label>\n                        <input\n                          type=\"url\"\n                          value={settingsForm.website}\n                          onChange={(e) => setSettingsForm(prev => ({ ...prev, website: e.target.value }))}\n                          className=\"block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"\n                          placeholder=\"https://example.com\"\n                        />\n                      </div>\n                    </div>\n\n                    <div>\n                      <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Description\n                      </label>\n                      <textarea\n                        value={settingsForm.description}\n                        onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}\n                        rows={3}\n                        className=\"block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"\n                      />\n                    </div>\n\n                    <div className=\"space-y-4\">\n                      <h4 className=\"text-sm font-medium text-gray-900 dark:text-white\">Security Settings</h4>\n\n                      <div className=\"flex items-center\">\n                        <input\n                          type=\"checkbox\"\n                          id=\"require_email_verification\"\n                          checked={settingsForm.require_email_verification}\n                          onChange={(e) => setSettingsForm(prev => ({ ...prev, require_email_verification: e.target.checked }))}\n                          className=\"h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded\"\n                        />\n                        <label htmlFor=\"require_email_verification\" className=\"ml-2 block text-sm text-gray-900 dark:text-white\">\n                          Require email verification for new members\n                        </label>\n                      </div>\n\n                      <div className=\"flex items-center\">\n                        <input\n                          type=\"checkbox\"\n                          id=\"mfa_required\"\n                          checked={settingsForm.mfa_required}\n                          onChange={(e) => setSettingsForm(prev => ({ ...prev, mfa_required: e.target.checked }))}\n                          className=\"h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded\"\n                        />\n                        <label htmlFor=\"mfa_required\" className=\"ml-2 block text-sm text-gray-900 dark:text-white\">\n                          Require multi-factor authentication\n                        </label>\n                      </div>\n\n                      <div>\n                        <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                          Default Role for New Members\n                        </label>\n                        <select\n                          value={settingsForm.default_member_role}\n                          onChange={(e) => setSettingsForm(prev => ({ ...prev, default_member_role: e.target.value as any }))}\n                          className=\"block w-full max-w-xs rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"\n                        >\n                          <option value=\"viewer\">Viewer</option>\n                          <option value=\"developer\">Developer</option>\n                        </select>\n                      </div>\n\n                      <div>\n                        <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                          Session Timeout (hours)\n                        </label>\n                        <select\n                          value={settingsForm.session_timeout_hours}\n                          onChange={(e) => setSettingsForm(prev => ({ ...prev, session_timeout_hours: parseInt(e.target.value) }))}\n                          className=\"block w-full max-w-xs rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500\"\n                        >\n                          <option value={1}>1 hour</option>\n                          <option value={8}>8 hours</option>\n                          <option value={24}>24 hours</option>\n                          <option value={168}>1 week</option>\n                        </select>\n                      </div>\n                    </div>\n\n                    <div className=\"flex space-x-3\">\n                      <button\n                        type=\"submit\"\n                        className=\"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"\n                      >\n                        Save Changes\n                      </button>\n                      <button\n                        type=\"button\"\n                        onClick={() => setEditingSettings(false)}\n                        className=\"inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"\n                      >\n                        Cancel\n                      </button>\n                    </div>\n                  </form>\n                ) : (\n                  <div className=\"space-y-6\">\n                    <dl className=\"grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2\">\n                      <div>\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Name</dt>\n                        <dd className=\"mt-1 text-sm text-gray-900 dark:text-white\">{currentOrganization.name}</dd>\n                      </div>\n                      <div>\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Website</dt>\n                        <dd className=\"mt-1 text-sm text-gray-900 dark:text-white\">\n                          {currentOrganization.website ? (\n                            <a href={currentOrganization.website} target=\"_blank\" rel=\"noopener noreferrer\" className=\"text-blue-600 dark:text-blue-400 hover:underline\">\n                              {currentOrganization.website}\n                            </a>\n                          ) : (\n                            'Not set'\n                          )}\n                        </dd>\n                      </div>\n                      <div className=\"sm:col-span-2\">\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Description</dt>\n                        <dd className=\"mt-1 text-sm text-gray-900 dark:text-white\">\n                          {currentOrganization.description || 'No description provided'}\n                        </dd>\n                      </div>\n                      <div>\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Email Verification Required</dt>\n                        <dd className=\"mt-1\">\n                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${\n                            currentOrganization.settings.require_email_verification\n                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'\n                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'\n                          }`}>\n                            {currentOrganization.settings.require_email_verification ? 'Yes' : 'No'}\n                          </span>\n                        </dd>\n                      </div>\n                      <div>\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">MFA Required</dt>\n                        <dd className=\"mt-1\">\n                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${\n                            currentOrganization.settings.mfa_required\n                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'\n                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'\n                          }`}>\n                            {currentOrganization.settings.mfa_required ? 'Yes' : 'No'}\n                          </span>\n                        </dd>\n                      </div>\n                      <div>\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Default Member Role</dt>\n                        <dd className=\"mt-1 text-sm text-gray-900 dark:text-white capitalize\">\n                          {currentOrganization.settings.default_member_role}\n                        </dd>\n                      </div>\n                      <div>\n                        <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">Session Timeout</dt>\n                        <dd className=\"mt-1 text-sm text-gray-900 dark:text-white\">\n                          {currentOrganization.settings.session_timeout_hours} hours\n                        </dd>\n                      </div>\n                    </dl>\n\n                    {/* Danger Zone */}\n                    {(canDeleteOrganization || !isOwner) && (\n                      <div className=\"border-t border-gray-200 dark:border-gray-700 pt-6\">\n                        <h4 className=\"text-sm font-medium text-red-600 dark:text-red-400 mb-4\">Danger Zone</h4>\n                        <div className=\"bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4\">\n                          <div className=\"flex\">\n                            <div className=\"flex-shrink-0\">\n                              <svg className=\"h-5 w-5 text-red-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z\" />\n                              </svg>\n                            </div>\n                            <div className=\"ml-3 flex-1\">\n                              <div className=\"space-y-3\">\n                                {!isOwner && (\n                                  <div className=\"flex items-center justify-between\">\n                                    <div>\n                                      <h5 className=\"text-sm font-medium text-red-800 dark:text-red-200\">\n                                        Leave Organization\n                                      </h5>\n                                      <p className=\"text-sm text-red-700 dark:text-red-300\">\n                                        You will lose access to this organization and all its resources.\n                                      </p>\n                                    </div>\n                                    <button\n                                      onClick={leaveCurrentOrganization}\n                                      className=\"inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700\"\n                                    >\n                                      Leave Organization\n                                    </button>\n                                  </div>\n                                )}\n                                {canDeleteOrganization && (\n                                  <div className=\"flex items-center justify-between\">\n                                    <div>\n                                      <h5 className=\"text-sm font-medium text-red-800 dark:text-red-200\">\n                                        Delete Organization\n                                      </h5>\n                                      <p className=\"text-sm text-red-700 dark:text-red-300\">\n                                        Permanently delete this organization and all its data. This action cannot be undone.\n                                      </p>\n                                    </div>\n                                    <button\n                                      onClick={deleteCurrentOrganization}\n                                      className=\"inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500\"\n                                    >\n                                      Delete Organization\n                                    </button>\n                                  </div>\n                                )}\n                              </div>\n                            </div>\n                          </div>\n                        </div>\n                      </div>\n                    )}\n                  </div>\n                )}\n              </div>\n            )}\n          </>\n        )}\n      </div>\n    </div>\n  )\n}