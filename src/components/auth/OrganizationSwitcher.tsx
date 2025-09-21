'use client'

import { useState } from 'react'
import { useOrganizations } from '../../hooks/useOrganizations'
import { ChevronDown, Building2, Plus, Check, Settings } from 'lucide-react'

interface OrganizationSwitcherProps {
  showCreateButton?: boolean
  onCreateOrganization?: () => void
  onManageOrganization?: (organizationId: string) => void
  className?: string
}

export function OrganizationSwitcher({
  showCreateButton = true,
  onCreateOrganization,
  onManageOrganization,
  className = ''
}: OrganizationSwitcherProps) {
  const {
    organizations,
    currentOrganization,
    switchOrganization,
    loading,
    error
  } = useOrganizations()

  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  const handleSwitchOrganization = async (organizationId: string) => {
    if (switching || currentOrganization?.id === organizationId) return

    setSwitching(organizationId)
    try {
      const { success, error } = await switchOrganization(organizationId)
      
      if (success) {
        setIsOpen(false)
      } else {
        console.error('Failed to switch organization:', error)
      }
    } finally {
      setSwitching(null)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-600 dark:text-red-400 text-sm ${className}`}>
        Error loading organizations
      </div>
    )
  }

  const currentOrgName = currentOrganization?.name || 'No Organization'

  return (
    <div className={`relative ${className}`}>
      {/* Current Organization Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-medium">
            {currentOrgName.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentOrgName}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {/* Organizations List */}
            <div className="space-y-1">
              {organizations.map((userOrg) => {
                const org = userOrg.organization
                const isActive = currentOrganization?.id === org.id
                const isSwitching = switching === org.id

                return (
                  <div key={org.id} className="group">
                    <button
                      onClick={() => handleSwitchOrganization(org.id)}
                      disabled={isSwitching || isActive}
                      className={`
                        w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors
                        ${isActive 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }
                        ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium text-white
                        ${isActive ? 'bg-blue-600' : 'bg-gray-500'}
                      `}>
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center space-x-1">
                          <span className="truncate font-medium">{org.name}</span>
                          {isActive && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {userOrg.role}
                        </div>
                      </div>

                      {/* Manage Button */}
                      {onManageOrganization && userOrg.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onManageOrganization(org.id)
                            setIsOpen(false)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Create Organization Button */}
            {showCreateButton && onCreateOrganization && (
              <>
                {organizations.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
                )}
                <button
                  onClick={() => {
                    onCreateOrganization()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span>Create Organization</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

// Compact version for mobile/small spaces
export function OrganizationSwitcherCompact({
  className = ''
}: {
  className?: string
}) {
  const { currentOrganization } = useOrganizations()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentOrganization) {
    return (
      <div className={`w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md ${className}`} />
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {currentOrganization.name.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 min-w-48">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current Organization</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{currentOrganization.name}</div>
            {currentOrganization.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentOrganization.description}
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}