'use client'

import { useState, useEffect } from 'react'
import { useOrganizations, useOrganization } from '../../hooks/useOrganizations'
import { CreateOrganizationData, UpdateOrganizationData } from '../../lib/organizations'
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Settings,
  X,
  Save,
  Globe,
  Mail,
  Crown,
  Shield,
  Code,
  Eye
} from 'lucide-react'

interface OrganizationManagerProps {
  isOpen: boolean
  onClose: () => void
  selectedOrganizationId?: string | null
}

export function OrganizationManager({ 
  isOpen, 
  onClose, 
  selectedOrganizationId = null 
}: OrganizationManagerProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'members'>('list')
  const [editingOrganization, setEditingOrganization] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCreateSuccess = () => {
    setActiveTab('list')
  }

  const handleEditOrganization = (organizationId: string) => {
    setEditingOrganization(organizationId)
    setActiveTab('edit')
  }

  const handleManageMembers = (organizationId: string) => {
    setEditingOrganization(organizationId)
    setActiveTab('members')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Organization Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Organizations
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Create New
          </button>
          {editingOrganization && (
            <>
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'edit'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Edit Organization
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Members
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'list' && (
            <OrganizationList
              onEdit={handleEditOrganization}
              onManageMembers={handleManageMembers}
            />
          )}
          {activeTab === 'create' && (
            <CreateOrganizationForm onSuccess={handleCreateSuccess} />
          )}
          {activeTab === 'edit' && editingOrganization && (
            <EditOrganizationForm
              organizationId={editingOrganization}
              onSuccess={() => setActiveTab('list')}
            />
          )}
          {activeTab === 'members' && editingOrganization && (
            <OrganizationMembers organizationId={editingOrganization} />
          )}
        </div>
      </div>
    </div>
  )
}

function OrganizationList({ 
  onEdit, 
  onManageMembers 
}: { 
  onEdit: (id: string) => void
  onManageMembers: (id: string) => void 
}) {
  const { organizations, deleteOrganization, isOwner, canManageOrganization } = useOrganizations()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (organizationId: string, organizationName: string) => {
    if (!confirm(`Are you sure you want to delete "${organizationName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(organizationId)
    try {
      const { success, error } = await deleteOrganization(organizationId)
      if (!success) {
        alert(`Failed to delete organization: ${error}`)
      }
    } finally {
      setDeleting(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />
      case 'developer': return <Code className="w-4 h-4 text-green-500" />
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-4">
      {organizations.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No organizations found</p>
          <p className="text-sm">Create your first organization to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {organizations.map((userOrg) => {
            const org = userOrg.organization
            const canManage = canManageOrganization(org.id)
            const isDeleting = deleting === org.id

            return (
              <div
                key={org.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                        {org.name}
                      </h3>
                      {org.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {org.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(userOrg.role)}
                          <span className="capitalize">{userOrg.role}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Members</span>
                        </div>
                        {/* Website URL not available in organization type */}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onManageMembers(org.id)}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Manage Members"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(org.id)}
                        className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Edit Organization"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {userOrg.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          disabled={isDeleting}
                          className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                          title="Delete Organization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreateOrganizationForm({ onSuccess }: { onSuccess: () => void }) {
  const { createOrganization } = useOrganizations()
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { success, error } = await createOrganization({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined
      })

      if (success) {
        onSuccess()
        setFormData({ name: '', description: '' })
      } else {
        setError(error || 'Failed to create organization')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Organization Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter organization name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Brief description of your organization"
        />
      </div>


      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Building2 className="w-4 h-4" />
          <span>{loading ? 'Creating...' : 'Create Organization'}</span>
        </button>
      </div>
    </form>
  )
}

function EditOrganizationForm({ 
  organizationId, 
  onSuccess 
}: { 
  organizationId: string
  onSuccess: () => void 
}) {
  const { updateOrganization } = useOrganizations()
  const { organization, loading: orgLoading } = useOrganization(organizationId)
  
  const [formData, setFormData] = useState<UpdateOrganizationData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || ''
      })
    }
  }, [organization])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { success, error } = await updateOrganization(organizationId, {
        ...formData,
        name: formData.name?.trim(),
        description: formData.description?.trim() || undefined
      })

      if (success) {
        onSuccess()
      } else {
        setError(error || 'Failed to update organization')
      }
    } finally {
      setLoading(false)
    }
  }

  if (orgLoading) {
    return <div className="text-center py-8">Loading organization...</div>
  }

  if (!organization) {
    return <div className="text-center py-8 text-red-600">Organization not found</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Organization Name *
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>


      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading || !formData.name?.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  )
}

function OrganizationMembers({ organizationId }: { organizationId: string }) {
  const { members, loading, addMember, removeMember, updateMemberRole } = useOrganization(organizationId)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('viewer')
  const [inviting, setInviting] = useState(false)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />
      case 'developer': return <Code className="w-4 h-4 text-green-500" />
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    try {
      // TODO: Implement user invitation system
      // For now, this is a placeholder
      console.log('Invite user:', { email: inviteEmail, role: inviteRole })
      alert('User invitation system not yet implemented')
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading members...</div>
  }

  return (
    <div className="space-y-6">
      {/* Invite New Member */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Invite New Member
        </h3>
        <form onSubmit={handleInvite} className="flex space-x-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'developer' | 'viewer')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="viewer">Viewer</option>
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      </div>

      {/* Current Members */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Current Members ({members.length})
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {member.profiles.full_name?.charAt(0) || member.profiles.email?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {member.profiles.full_name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.profiles.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                  {getRoleIcon(member.role)}
                  <span className="text-sm capitalize">{member.role}</span>
                </div>
                
                {member.role !== 'admin' && (
                  <button
                    onClick={() => removeMember(member.user_id)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}