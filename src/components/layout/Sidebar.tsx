'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ProjectList } from '@/components/projects/ProjectList'

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

/**
 * Sidebar component with project list (Claude Code style)
 *
 * Features:
 * - Collapsible sidebar
 * - Project list with status indicators
 * - New project button
 * - Active/draft filter
 */
export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  if (collapsed) {
    return null
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-0 opacity-0" : "w-64 opacity-100"
      )}
    >
      {/* Projects Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Projects</span>
          <select className="rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
            <option>Active</option>
            <option>All</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        <ProjectList />
      </div>

      {/* New Project Button */}
      <div className="border-t border-border p-3">
        <Link href="/projects/new" className="block">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Project
          </Button>
        </Link>
      </div>
    </aside>
  )
}
