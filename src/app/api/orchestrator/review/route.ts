import { NextRequest, NextResponse } from 'next/server'
import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator'
import { CodebaseReview } from '@/types/events'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { projectPath } = body

    // Validation
    if (!projectPath || typeof projectPath !== 'string') {
      return NextResponse.json(
        { error: 'projectPath is required and must be a string' },
        { status: 400 }
      )
    }

    // Get orchestrator instance
    const orchestrator = AgentOrchestrator.getInstance()

    // Trigger review
    const review: CodebaseReview = await orchestrator.reviewCodebase(projectPath)

    // Return result
    return NextResponse.json(
      {
        success: true,
        data: review
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Review API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to check API health
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/orchestrator/review',
    methods: ['POST'],
    description: 'Trigger codebase review and analysis'
  })
}
