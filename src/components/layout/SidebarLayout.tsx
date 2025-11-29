'use client'

import React, { ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

interface SidebarLayoutProps {
  children: ReactNode
}

/**
 * Main application layout with collapsible sidebar (Claude Code style)
 *
 * Layout structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ TopBar (logo, repo selector, theme toggle, user menu)       │
 * ├──────────────────┬──────────────────────────────────────────┤
 * │                  │                                          │
 * │    Sidebar       │              Main Content                │
 * │   (projects)     │                                          │
 * │                  │                                          │
 * ├──────────────────┴──────────────────────────────────────────┤
 * │ User section                                                │
 * └─────────────────────────────────────────────────────────────┘
 */
export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <TopBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-0" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
