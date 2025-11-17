import { createClient } from '@/lib/supabase/server'
import { GitHubClient } from '@/lib/github/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get GitHub access token from session
  const githubToken = session.provider_token

  if (!githubToken) {
    return NextResponse.json({ error: 'No GitHub token found' }, { status: 401 })
  }

  try {
    const github = new GitHubClient(githubToken)
    const repos = await github.getUserRepos()

    return NextResponse.json({ repos })
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}
