'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RepositoryBrowser } from '@/components/github/RepositoryBrowser'
import { useAuth } from '@/hooks/useAuth'

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
  const { user, signInWithGitHub, signOut } = useAuth()
  const [projectPath, setProjectPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<CodebaseReview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      const { error } = await signInWithGitHub()
      if (error) {
        setError(`GitHub authentication failed: ${error.message}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during GitHub sign-in')
    } finally {
      setIsSigningIn(false)
    }
  }

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
            {user
              ? 'Select a repository to analyze'
              : 'Connect your GitHub account to analyze repositories'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Signed in as: <span className="font-medium">{user.email}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
              <RepositoryBrowser
                onSelectRepo={(repo) => {
                  console.log('Selected repo:', repo)
                  setProjectPath(`github:${repo.fullName}`)
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Sign in with GitHub to access your repositories
              </p>
              <Button
                onClick={handleGitHubSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2"
              >
                {isSigningIn ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting to GitHub...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    Sign in with GitHub
                  </>
                )}
              </Button>
            </div>
          )}
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
