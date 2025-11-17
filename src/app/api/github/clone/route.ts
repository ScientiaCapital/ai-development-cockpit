import { GitHubCloneService } from '@/services/github/clone.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repoUrl, repoFullName } = body

    if (!repoUrl || !repoFullName) {
      return NextResponse.json(
        { error: 'repoUrl and repoFullName are required' },
        { status: 400 }
      )
    }

    const cloneService = new GitHubCloneService()
    const destination = await cloneService.getClonePath(repoFullName)
    const clonePath = await cloneService.cloneRepository({
      url: repoUrl,
      destination
    })

    return NextResponse.json({
      success: true,
      clonePath
    })
  } catch (error) {
    console.error('Clone API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Clone failed'
      },
      { status: 500 }
    )
  }
}
