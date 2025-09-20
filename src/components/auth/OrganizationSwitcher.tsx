'use client'

import { useState } from 'react'
import { useHuggingFaceAuth, Organization } from '@/contexts/HuggingFaceAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import styles from '@/styles/terminal.module.css'

interface OrganizationSwitcherProps {
  className?: string
  showStatus?: boolean
  showTokenStatus?: boolean
}

export default function OrganizationSwitcher({
  className = '',
  showStatus = true,
  showTokenStatus = false
}: OrganizationSwitcherProps) {
  const {
    currentOrganization,
    isAuthenticated,
    isLoading,
    error,
    switchOrganization,
    tokens,
    clearError
  } = useHuggingFaceAuth()

  const [isSwitching, setIsSwitching] = useState(false)

  const handleSwitch = async () => {
    if (isLoading || isSwitching) return

    const targetOrg: Organization = currentOrganization === 'swaggystacks' ? 'scientiacapital' : 'swaggystacks'

    try {
      setIsSwitching(true)
      clearError()
      await switchOrganization(targetOrg)
    } catch (err) {
      console.error('Failed to switch organization:', err)
    } finally {
      setIsSwitching(false)
    }
  }

  const getOrganizationInfo = (org: Organization) => {
    const info = {
      swaggystacks: {
        name: 'SwaggyStacks',
        emoji: '🎮',
        theme: 'gaming',
        description: 'Developer-focused AI models',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500'
      },
      scientiacapital: {
        name: 'ScientiaCapital',
        emoji: '🏢',
        theme: 'enterprise',
        description: 'Enterprise-grade AI solutions',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500'
      }
    }
    return info[org]
  }

  const currentInfo = getOrganizationInfo(currentOrganization)
  const targetInfo = getOrganizationInfo(
    currentOrganization === 'swaggystacks' ? 'scientiacapital' : 'swaggystacks'
  )

  return (
    <div className={`${styles.terminalWindow} ${className}`}>
      <div className="p-4 space-y-4">
        {/* Current Organization Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${currentInfo.color}`}>
              {currentInfo.emoji}
            </div>
            <div>
              <div className={`font-bold text-lg ${currentInfo.color}`}>
                {currentInfo.name}
              </div>
              <div className="text-sm text-gray-400">
                {currentInfo.description}
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          {showStatus && (
            <div className="flex items-center gap-2">
              {isLoading || isSwitching ? (
                <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                  <span className="animate-pulse">⚡ SWITCHING</span>
                </Badge>
              ) : isAuthenticated ? (
                <Badge variant="outline" className={`${currentInfo.borderColor} ${currentInfo.color}`}>
                  ✓ AUTHENTICATED
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-500 text-red-400">
                  ✗ ERROR
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className={`${styles.outputError} p-3 rounded border border-red-500`}>
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span className="text-sm">{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={clearError}
                className="ml-auto text-xs"
              >
                CLEAR
              </Button>
            </div>
          </div>
        )}

        {/* Token Status (Debug Mode) */}
        {showTokenStatus && (
          <div className="space-y-2 text-xs">
            <div className="text-gray-400">Token Status:</div>
            {Object.entries(tokens).map(([org, token]) => (
              <div key={org} className="flex justify-between">
                <span className={getOrganizationInfo(org as Organization).color}>
                  {getOrganizationInfo(org as Organization).emoji} {getOrganizationInfo(org as Organization).name}:
                </span>
                <span className={token ? 'text-green-400' : 'text-red-400'}>
                  {token ? `${token.substring(0, 8)}...` : 'NOT SET'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Switch Button */}
        <div className="pt-2 border-t border-gray-700">
          <Button
            onClick={handleSwitch}
            disabled={isLoading || isSwitching || !isAuthenticated}
            className={`${styles.terminalButton} w-full`}
          >
            {isSwitching ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚡</span>
                SWITCHING TO {targetInfo.name.toUpperCase()}...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>🔄</span>
                SWITCH TO {targetInfo.emoji} {targetInfo.name.toUpperCase()}
              </span>
            )}
          </Button>
        </div>

        {/* Organization Comparison */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className={`p-3 rounded ${currentInfo.bgColor} ${currentInfo.borderColor} border`}>
            <div className={`font-bold ${currentInfo.color} mb-1`}>
              {currentInfo.emoji} {currentInfo.name}
            </div>
            <div className="text-gray-400">
              {currentInfo.theme === 'gaming' ? 'Retro gaming aesthetic' : 'Professional corporate'}
            </div>
            <div className="text-gray-400">
              {currentInfo.theme === 'gaming' ? 'Developer tools' : 'Enterprise solutions'}
            </div>
          </div>

          <div className={`p-3 rounded ${targetInfo.bgColor} ${targetInfo.borderColor} border opacity-60`}>
            <div className={`font-bold ${targetInfo.color} mb-1`}>
              {targetInfo.emoji} {targetInfo.name}
            </div>
            <div className="text-gray-400">
              {targetInfo.theme === 'gaming' ? 'Retro gaming aesthetic' : 'Professional corporate'}
            </div>
            <div className="text-gray-400">
              {targetInfo.theme === 'gaming' ? 'Developer tools' : 'Enterprise solutions'}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
          <span>API Status: {isAuthenticated ? 'Connected' : 'Disconnected'}</span>
          <span>Active: {currentInfo.name}</span>
          <span>Mode: {currentInfo.theme}</span>
        </div>
      </div>
    </div>
  )
}

// Compact version for headers/navbars
export function OrganizationSwitcherCompact({ className = '' }: { className?: string }) {
  const { currentOrganization, switchOrganization, isLoading } = useHuggingFaceAuth()
  const [isSwitching, setIsSwitching] = useState(false)

  const handleQuickSwitch = async () => {
    if (isLoading || isSwitching) return

    const targetOrg: Organization = currentOrganization === 'swaggystacks' ? 'scientiacapital' : 'swaggystacks'

    try {
      setIsSwitching(true)
      await switchOrganization(targetOrg)
    } finally {
      setIsSwitching(false)
    }
  }

  const currentInfo = {
    swaggystacks: { emoji: '🎮', name: 'SWAGGY', color: 'text-green-400' },
    scientiacapital: { emoji: '🏢', name: 'SCIENTIA', color: 'text-amber-400' }
  }[currentOrganization]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${currentInfo.color} font-bold text-sm`}>
        {currentInfo.emoji} {currentInfo.name}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleQuickSwitch}
        disabled={isLoading || isSwitching}
        className={`${styles.terminalButton} text-xs px-2 py-1`}
      >
        {isSwitching ? '⚡' : '🔄'}
      </Button>
    </div>
  )
}