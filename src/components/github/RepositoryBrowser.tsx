'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  language: string | null
  stars: number
  updatedAt: string
}

export function RepositoryBrowser({ onSelectRepo }: { onSelectRepo: (repo: Repository) => void }) {
  const [repos, setRepos] = useState<Repository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRepositories()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRepos(filtered)
    } else {
      setFilteredRepos(repos)
    }
  }, [searchQuery, repos])

  const loadRepositories = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/github/repos')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load repositories')
      }

      setRepos(data.repos)
      setFilteredRepos(data.repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Repositories</CardTitle>
        <CardDescription>
          Select a repository to analyze
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        {loading && <p className="text-sm text-muted-foreground">Loading repositories...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
              onClick={() => onSelectRepo(repo)}
            >
              <div className="flex-1">
                <p className="font-medium">{repo.fullName}</p>
                {repo.description && (
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                )}
                <div className="flex gap-2 mt-1">
                  {repo.language && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {repo.language}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ⭐ {repo.stars}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Select
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
