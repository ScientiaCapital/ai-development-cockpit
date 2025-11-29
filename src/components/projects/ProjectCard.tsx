'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types/projects'

interface ProjectCardProps {
  project: Project
  isActive?: boolean
}

/**
 * Project card component for sidebar list
 *
 * Shows:
 * - Project name
 * - GitHub repo (if connected)
 * - Status indicator
 * - Last updated
 */
export function ProjectCard({ project, isActive }: ProjectCardProps) {
  const statusConfig = getStatusConfig(project.status)

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "block rounded-md px-3 py-2 transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Status indicator */}
        <span
          className={cn(
            "mt-1.5 h-2 w-2 rounded-full flex-shrink-0",
            statusConfig.dotColor
          )}
        />

        <div className="flex-1 min-w-0">
          {/* Project name */}
          <h3 className="truncate text-sm font-medium text-foreground">
            {project.name}
          </h3>

          {/* GitHub repo or status */}
          {project.github_repo_full_name ? (
            <p className="truncate text-xs text-muted-foreground">
              {project.github_repo_full_name}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {statusConfig.label}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

function getStatusConfig(status: ProjectStatus) {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        dotColor: 'bg-muted-foreground',
      }
    case 'building':
      return {
        label: 'Building...',
        dotColor: 'bg-yellow-500 animate-pulse',
      }
    case 'ready':
      return {
        label: 'Ready',
        dotColor: 'bg-green-500',
      }
    case 'deployed':
      return {
        label: 'Deployed',
        dotColor: 'bg-blue-500',
      }
    case 'failed':
      return {
        label: 'Failed',
        dotColor: 'bg-destructive',
      }
    default:
      return {
        label: 'Unknown',
        dotColor: 'bg-muted-foreground',
      }
  }
}
