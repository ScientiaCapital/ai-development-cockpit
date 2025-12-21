import { NextRequest, NextResponse } from 'next/server'
import { runFormFiller } from '@/lib/agents/formfiller'
import { runJobHelper } from '@/lib/agents/jobhelper'
import { runDocGen } from '@/lib/agents/docgen'
import { Message } from '@/lib/agents/types'

export async function POST(request: NextRequest) {
  try {
    const { agent, messages } = await request.json() as {
      agent: 'formfiller' | 'jobhelper' | 'docgen'
      messages: Message[]
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured' },
        { status: 500 }
      )
    }

    let response
    switch (agent) {
      case 'formfiller':
        response = await runFormFiller(messages, apiKey)
        break
      case 'jobhelper':
        response = await runJobHelper(messages, apiKey)
        break
      case 'docgen':
        response = await runDocGen(messages, apiKey)
        break
      default:
        return NextResponse.json(
          { error: `Unknown agent: ${agent}` },
          { status: 400 }
        )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Agent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
