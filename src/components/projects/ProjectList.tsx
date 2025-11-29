'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ProjectCard } from './ProjectCard'
import { ProjectsService } from '@/services/projects/ProjectsService'
import type { Project } from '@/types/projects'

/**
 * Project list component for sidebar
 *
 * Features:
 * - Fetches projects from Supabase
 * - Shows loading state
 * - Shows empty state with call to action
 * - Highlights active project
 */
export function ProjectList() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract active project ID from pathname
  const activeProjectId = pathname?.match(/\/projects\/([^/]+)/)?.[1]

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setLoading(true)
      setError(null)
      const data = await ProjectsService.listProjects()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={loadProjects}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 text-3xl">📦</div>
        <p className="text-sm text-muted-foreground">
          No projects yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first project to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isActive={project.id === activeProjectId}
        />
      ))}
    </div>
  )
}
