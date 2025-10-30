/**
 * Routing Recommendation API
 *
 * POST /api/optimize/recommendation
 * Preview routing decision without executing the request
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

    // Get recommendation (no execution)
    const recommendation = costOptimizer.getRecommendation(optimizationRequest)

    // Return recommendation
    return NextResponse.json(recommendation, {
      status: 200,
      headers: {
        'X-Provider': recommendation.provider,
        'X-Tier': recommendation.tier,
        'X-Estimated-Cost': recommendation.estimatedCost.toString(),
        'X-Estimated-Savings': recommendation.estimatedSavings.toString(),
        'X-Estimated-Latency': recommendation.estimatedLatency.toString(),
        'Cache-Control': 'no-store' // Don't cache recommendations
      }
    })
  } catch (error) {
    console.error('Recommendation API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get recommendation',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
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
