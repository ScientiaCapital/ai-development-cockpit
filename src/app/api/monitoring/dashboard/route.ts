/**
 * Monitoring Dashboard API Endpoint
 * Provides organization-specific monitoring data for dashboard visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringIntegration } from '@/services/monitoring/integration.service';
import { Organization } from '@/services/monitoring/prometheus.service';
import { loggingService } from '@/services/monitoring/logging.service';
import { tracingService } from '@/services/monitoring/tracing.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/dashboard?organization=<org>
 * Returns comprehensive dashboard data for specified organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const organization = (searchParams.get('organization') || 'shared') as Organization;

  return tracingService.traceOperation(
    'get_dashboard_data',
    async () => {
      try {
        // Validate organization parameter
        if (!['arcade', 'enterprise', 'shared'].includes(organization)) {
          return NextResponse.json(
            { error: 'Invalid organization parameter' },
            { status: 400 }
          );
        }

        // Check if monitoring integration is active
        if (!monitoringIntegration.isActive()) {
          loggingService.warn('Monitoring integration not active', { organization });
          return NextResponse.json(
            { error: 'Monitoring service not available' },
            { status: 503 }
          );
        }

        // Get dashboard data
        const dashboardData = await monitoringIntegration.getDashboardData(organization);

        const duration = Date.now() - startTime;

        loggingService.info('Dashboard data retrieved successfully', {
          organization,
          duration,
          endpointsCount: dashboardData.summary.totalEndpoints,
          alertsCount: dashboardData.summary.activeAlerts,
          ip: getClientIP(request),
        });

        return NextResponse.json(dashboardData, {
          headers: {
            'Cache-Control': 'no-cache, max-age=30', // Cache for 30 seconds
            'X-Organization': organization,
            'X-Response-Time': duration.toString(),
          },
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        loggingService.error('Failed to retrieve dashboard data', {
          organization,
          error: errorMessage,
          duration,
          ip: getClientIP(request),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
          { error: 'Failed to retrieve dashboard data' },
          { status: 500 }
        );
      }
    },
    {
      organization,
      operationId: `dashboard_${organization}_${Date.now()}`,
    }
  );
}

/**
 * POST /api/monitoring/dashboard/inference
 * Record model inference for monitoring
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return tracingService.traceOperation(
    'record_inference',
    async () => {
      try {
        const body = await request.json();
        const {
          modelName,
          organization,
          duration,
          cost,
          inputTokens,
          outputTokens,
          success = true,
          errorCode
        } = body;

        // Validate required fields
        if (!modelName || !organization || duration === undefined || cost === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: modelName, organization, duration, cost' },
            { status: 400 }
          );
        }

        // Validate organization
        if (!['arcade', 'enterprise', 'shared'].includes(organization)) {
          return NextResponse.json(
            { error: 'Invalid organization' },
            { status: 400 }
          );
        }

        // Record inference
        monitoringIntegration.recordModelInference(
          modelName,
          organization,
          duration,
          cost,
          inputTokens,
          outputTokens,
          success,
          errorCode
        );

        loggingService.info('Model inference recorded', {
          modelName,
          organization,
          duration,
          cost,
          success,
          ip: getClientIP(request),
        });

        return NextResponse.json(
          { success: true, message: 'Inference recorded successfully' },
          { status: 200 }
        );

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        loggingService.error('Failed to record inference', {
          error: errorMessage,
          ip: getClientIP(request),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
          { error: 'Failed to record inference' },
          { status: 500 }
        );
      }
    },
    {
      operationId: `record_inference_${Date.now()}`,
    }
  );
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}