'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProjectsService } from '@/services/projects/ProjectsService'
import type { Project, ProjectBuild } from '@/types/projects'

/**
 * Project detail page
 *
 * Shows:
 * - Project info (name, description, status)
 * - Original user request
 * - Build history
 * - Actions (rebuild, delete)
 */
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [builds, setBuilds] = useState<ProjectBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProject()
  }, [projectId])

  async function loadProject() {
    try {
      setLoading(true)
      setError(null)

      const [projectData, buildsData] = await Promise.all([
        ProjectsService.getProject(projectId),
        ProjectsService.getProjectBuilds(projectId),
      ])

      if (!projectData) {
        setError('Project not found')
        return
      }

      setProject(projectData)
      setBuilds(buildsData)
    } catch (err) {
      console.error('Failed to load project:', err)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      await ProjectsService.deleteProject(projectId)
      router.push('/')
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('Failed to delete project')
    }
  }

  async function handleRebuild() {
    if (!project) return

    try {
      await ProjectsService.createBuild(project.id)
      // Redirect to chat with rebuild context
      router.push(`/chat?project=${project.id}&rebuild=true`)
    } catch (err) {
      console.error('Failed to start rebuild:', err)
      alert('Failed to start rebuild')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-destructive">{error || 'Project not found'}</p>
        <Link href="/" className="mt-4 text-primary hover:underline">
          Go back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          </div>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRebuild}>
            Rebuild
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Status and Info */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1 font-medium capitalize text-foreground">
            {project.status}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="mt-1 font-medium text-foreground">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="mt-1 font-medium text-foreground">
            ${project.total_cost_usd.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Original Request */}
      {project.user_request && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Original Request
          </h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">{project.user_request}</p>
          </div>
        </div>
      )}

      {/* GitHub Repo */}
      {project.github_repo_url && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            GitHub Repository
          </h2>
          <a
            href={project.github_repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {project.github_repo_full_name || project.github_repo_url}
          </a>
        </div>
      )}

      {/* Build History */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Build History
        </h2>
        {builds.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">No builds yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {builds.map((build) => (
              <div
                key={build.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg ${
                      build.status === 'success'
                        ? 'text-green-500'
                        : build.status === 'failed'
                        ? 'text-destructive'
                        : build.status === 'running'
                        ? 'text-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {build.status === 'success' && '✅'}
                    {build.status === 'failed' && '❌'}
                    {build.status === 'running' && '⏳'}
                    {build.status === 'pending' && '⏸️'}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      Build #{build.build_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(build.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {build.duration_ms && (
                    <p>{(build.duration_ms / 1000).toFixed(1)}s</p>
                  )}
                  <p>${build.cost_usd.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
