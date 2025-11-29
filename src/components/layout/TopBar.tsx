'use client'

import React from 'react'
import Link from 'next/link'
import { ThemeSwitcher } from './ThemeSwitcher'
import { UserMenu } from './UserMenu'
import { RepoSelector } from '@/components/projects/RepoSelector'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

/**
 * Top navigation bar (Claude Code style)
 *
 * Contains:
 * - Sidebar toggle button
 * - Logo and product name
 * - Repository selector dropdown
 * - Theme switcher (arcade/enterprise)
 * - User menu
 */
export function TopBar({ onToggleSidebar, sidebarCollapsed }: TopBarProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      {/* Left section: Toggle + Logo */}
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarCollapsed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h10M4 18h16"
              />
            )}
          </svg>
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <span className="font-semibold text-foreground">AI Dev Cockpit</span>
        </Link>
      </div>

      {/* Center section: Repo Selector */}
      <div className="flex-1 px-4">
        <RepoSelector />
      </div>

      {/* Right section: Theme + User */}
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}
