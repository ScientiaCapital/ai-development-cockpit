'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

/**
 * User menu component for authenticated users
 *
 * Features:
 * - User avatar (from GitHub) or initials
 * - Dropdown with profile, settings, sign out
 * - Sign in button for unauthenticated users
 */
export function UserMenu() {
  const { user, loading, signOut, signInWithGitHub } = useAuth()
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    )
  }

  if (!user) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => signInWithGitHub()}
        className="gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Sign in with GitHub
      </Button>
    )
  }

  // Get user avatar or generate initials
  const avatarUrl = user.user_metadata?.avatar_url
  const displayName = user.user_metadata?.full_name || user.email || 'User'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
  }

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-colors hover:bg-accent"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {initials}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-card shadow-lg">
            {/* User Info */}
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                Settings
              </Link>
              <Link
                href="/settings/profile"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                Profile
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-border py-1">
              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
