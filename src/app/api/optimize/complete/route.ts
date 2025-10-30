/**
 * Cost-Optimized Completion API
 *
 * POST /api/optimize/complete
 * Main endpoint for cost-optimized LLM completions
 */

import { NextRequest, NextResponse } from 'next/server'
import { costOptimizer } from '@/services/cost-optimizer'
import type { OptimizationRequest, Organization } from '@/types/cost-optimizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as Partial<OptimizationRequest>

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Missing required field: organizationId' },
        { status: 400 }
      )
    }

    // Build optimization request
    const optimizationRequest: OptimizationRequest = {
      prompt: body.prompt,
      organizationId: body.organizationId as Organization,
      userId: body.userId,
      maxTokens: body.maxTokens || 1000,
      temperature: body.temperature || 0.7,
      forceProvider: body.forceProvider,
      forceTier: body.forceTier,
      systemMessage: body.systemMessage,
      conversationHistory: body.conversationHistory,
      stream: body.stream || false,
      metadata: body.metadata
    }

    // Execute optimized completion
    const response = await costOptimizer.optimize(optimizationRequest)

    // Return response with cost information
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Provider': response.provider,
        'X-Tier': response.tier,
        'X-Cost': response.cost.total.toString(),
        'X-Savings': response.savings.toString(),
        'X-Latency': response.latency.toString()
      }
    })
  } catch (error) {
    console.error('Optimization API error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('budget exceeded') ? 429 : 500

    return NextResponse.json(
      {
        error: 'Optimization failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  )
}
