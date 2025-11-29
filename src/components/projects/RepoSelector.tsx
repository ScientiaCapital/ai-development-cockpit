'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import type { GitHubRepo } from '@/types/projects'

/**
 * Repository selector dropdown for the top bar
 *
 * Features:
 * - Shows "Connect GitHub" if not connected
 * - Lists user's GitHub repos
 * - Allows selecting a repo for the current project
 */
export function RepoSelector() {
  const { user, signInWithGitHub } = useAuth()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Check if user is connected to GitHub
  const isGitHubConnected = user?.app_metadata?.provider === 'github' ||
    user?.identities?.some(id => id.provider === 'github')

  useEffect(() => {
    if (isGitHubConnected && dropdownOpen && repos.length === 0) {
      loadRepos()
    }
  }, [isGitHubConnected, dropdownOpen])

  async function loadRepos() {
    if (!user) return

    try {
      setLoading(true)
      // TODO: Implement GitHub API call to fetch repos
      // For now, show a placeholder
      setRepos([])
    } catch (err) {
      console.error('Failed to load repos:', err)
    } finally {
      setLoading(false)
    }
  }

  // If not connected to GitHub, show connect button
  if (!isGitHubConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => signInWithGitHub()}
        className="gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Connect GitHub
      </Button>
    )
  }

  return (
    <div className="relative">
      {/* Dropdown trigger */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        {selectedRepo ? selectedRepo.full_name : 'Select repo'}
        <svg
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border border-border bg-card shadow-lg">
            {/* Search input */}
            <div className="border-b border-border p-2">
              <input
                type="text"
                placeholder="Search repositories..."
                className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Repo list */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading repositories...
                </div>
              ) : repos.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No repositories found
                </div>
              ) : (
                repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      setSelectedRepo(repo)
                      setDropdownOpen(false)
                    }}
                    className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent"
                  >
                    <img
                      src={repo.owner.avatar_url}
                      alt=""
                      className="h-5 w-5 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {repo.full_name}
                      </p>
                      {repo.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    {repo.private && (
                      <span className="text-xs text-muted-foreground">
                        🔒
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Create new repo option */}
            <div className="border-t border-border p-2">
              <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-primary hover:bg-accent">
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
                Create new repository
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
