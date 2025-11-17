import { createClient } from '@/lib/supabase/server'
import { GitHubPRService } from '@/services/github/pr.service'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const githubToken = session.provider_token
    if (!githubToken) {
      return NextResponse.json({ error: 'No GitHub token found' }, { status: 401 })
    }

    const body = await request.json()
    const { owner, repo, branchName, baseBranch, title, prBody, files } = body

    // Validation
    if (!owner || !repo || !branchName || !baseBranch || !title || !files) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prService = new GitHubPRService(githubToken)
    const result = await prService.createPullRequest({
      owner,
      repo,
      branchName,
      baseBranch,
      title,
      body: prBody,
      files
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('PR creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PR creation failed'
      },
      { status: 500 }
    )
  }
}
