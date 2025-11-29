'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuickActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  variant?: 'primary' | 'secondary'
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
  variant = 'secondary',
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-4 rounded-lg border p-4 transition-colors",
        variant === 'primary'
          ? "border-primary bg-primary/5 hover:bg-primary/10"
          : "border-border bg-card hover:bg-accent/50"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          variant === 'primary'
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

/**
 * Quick actions grid for the dashboard
 *
 * Shows entry points for common actions:
 * - New Project
 * - Continue Last
 * - Import from GitHub
 * - Browse Templates
 */
export function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <QuickActionCard
        icon={
          <svg
            className="h-5 w-5"
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
        }
        title="New Project"
        description="Start building something new with AI"
        href="/projects/new"
        variant="primary"
      />

      <QuickActionCard
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        title="Continue Last"
        description="Pick up where you left off"
        href="/projects"
      />

      <QuickActionCard
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        }
        title="Import from GitHub"
        description="Connect an existing repository"
        href="/projects/import"
      />

      <QuickActionCard
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        }
        title="Browse Templates"
        description="Start from a pre-built template"
        href="/templates"
      />
    </div>
  )
}
