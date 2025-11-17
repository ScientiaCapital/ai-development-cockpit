'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RepositoryBrowser } from '@/components/github/RepositoryBrowser'

interface CodebaseReview {
  summary: string
  architecture: any
  existingAgents: string[]
  patterns: {
    hasAgents: boolean
    hasComponents: boolean
    hasServices: boolean
    hasTests: boolean
  }
}

export default function DashboardPage() {
  const [projectPath, setProjectPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<CodebaseReview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReview = async () => {
    if (!projectPath.trim()) {
      setError('Please enter a project path')
      return
    }

    setLoading(true)
    setError(null)
    setReview(null)

    try {
      const response = await fetch('/api/orchestrator/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Review failed')
      }

      setReview(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">AI Development Cockpit</h1>
      <p className="text-muted-foreground mb-8">
        Agent Orchestration System - MVP Dashboard
      </p>

      {/* Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Codebase Review</CardTitle>
          <CardDescription>
            Enter the absolute path to a project directory to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="/Users/username/projects/my-app"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReview()}
              disabled={loading}
            />
            <Button onClick={handleReview} disabled={loading}>
              {loading ? 'Reviewing...' : 'Review'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Repository Browser */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>
            Connect your GitHub account to analyze repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepositoryBrowser
            onSelectRepo={(repo) => {
              console.log('Selected repo:', repo)
              setProjectPath(`github:${repo.fullName}`)
            }}
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-950 border-red-800">
          <AlertDescription className="text-red-200 font-mono text-sm break-words">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Review Results */}
      {review && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Review Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{review.summary}</p>
            </CardContent>
          </Card>

          {/* Existing Agents Card */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Agents</CardTitle>
              <CardDescription>
                {review.existingAgents.length} agent(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {review.existingAgents.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {review.existingAgents.map((agent, idx) => (
                    <li key={idx} className="text-sm">{agent}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No agents found</p>
              )}
            </CardContent>
          </Card>

          {/* Patterns Card */}
          <Card>
            <CardHeader>
              <CardTitle>Codebase Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <PatternBadge
                  label="Agents"
                  value={review.patterns.hasAgents}
                />
                <PatternBadge
                  label="Components"
                  value={review.patterns.hasComponents}
                />
                <PatternBadge
                  label="Services"
                  value={review.patterns.hasServices}
                />
                <PatternBadge
                  label="Tests"
                  value={review.patterns.hasTests}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function PatternBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          value ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
