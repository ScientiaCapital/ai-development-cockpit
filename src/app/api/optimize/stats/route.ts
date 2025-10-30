/**
 * Cost Statistics API
 *
 * GET /api/optimize/stats?organization=<org>&period=<period>
 * Returns cost analytics and statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { costOptimizer } from '@/services/cost-optimizer'
import type { Organization } from '@/types/cost-optimizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const organization = searchParams.get('organization') as Organization
    const period = (searchParams.get('period') || 'daily') as 'hourly' | 'daily' | 'weekly' | 'monthly'

    // Validate organization
    if (!organization || !['swaggystacks', 'scientia-capital'].includes(organization)) {
      return NextResponse.json(
        { error: 'Invalid or missing organization parameter' },
        { status: 400 }
      )
    }

    // Validate period
    if (!['hourly', 'daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be: hourly, daily, weekly, or monthly' },
        { status: 400 }
      )
    }

    // Get statistics
    const stats = await costOptimizer.getStats(organization, period)

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to retrieve statistics' },
        { status: 500 }
      )
    }

    // Return stats
    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        'X-Organization': organization,
        'X-Period': period
      }
    })
  } catch (error) {
    console.error('Stats API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to retrieve statistics',
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  )
}
