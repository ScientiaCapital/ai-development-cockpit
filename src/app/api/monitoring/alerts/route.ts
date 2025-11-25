/**
 * Monitoring Alerts API Endpoint
 * Manages alerts, notifications, and alert configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringIntegration } from '@/services/monitoring/integration.service';
import { Organization } from '@/services/monitoring/prometheus.service';
import { loggingService } from '@/services/monitoring/logging.service';
import { tracingService } from '@/services/monitoring/tracing.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/alerts?organization=<org>&status=<status>
 * Returns alerts for specified organization and status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const organization = (searchParams.get('organization') || 'shared') as Organization;
  const status = searchParams.get('status') || 'active';
  const limit = parseInt(searchParams.get('limit') || '50');

  return tracingService.traceOperation(
    'get_alerts',
    async () => {
      try {
        // Validate parameters
        if (!['arcade', 'enterprise', 'shared'].includes(organization)) {
          return NextResponse.json(
            { error: 'Invalid organization parameter' },
            { status: 400 }
          );
        }

        if (!['active', 'resolved', 'all'].includes(status)) {
          return NextResponse.json(
            { error: 'Invalid status parameter. Must be: active, resolved, or all' },
            { status: 400 }
          );
        }

        // Get alerts from RunPod monitoring
        const runpodMonitoring = monitoringIntegration.getRunPodMonitoring();
        let alerts = runpodMonitoring.getActiveAlerts();

        // Filter by status
        if (status === 'resolved') {
          alerts = alerts.filter(alert => alert.resolved);
        } else if (status === 'active') {
          alerts = alerts.filter(alert => !alert.resolved);
        }

        // Filter by organization (if endpoint has organization context)
        const filteredAlerts = alerts.filter(alert => {
          // Logic to determine if alert belongs to organization
          // This would depend on how alerts are structured
          return true; // For now, return all alerts
        }).slice(0, limit);

        loggingService.info('Alerts retrieved', {
          organization,
          status,
          count: filteredAlerts.length,
          ip: getClientIP(request),
        });

        return NextResponse.json({
          alerts: filteredAlerts,
          total: filteredAlerts.length,
          organization,
          status,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        loggingService.error('Failed to retrieve alerts', {
          organization,
          error: errorMessage,
          ip: getClientIP(request),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
          { error: 'Failed to retrieve alerts' },
          { status: 500 }
        );
      }
    },
    {
      organization,
      operationId: `get_alerts_${organization}_${Date.now()}`,
    }
  );
}

/**
 * POST /api/monitoring/alerts
 * Create a new alert or trigger an alert
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return tracingService.traceOperation(
    'create_alert',
    async () => {
      try {
        const body = await request.json();
        const {
          alertType,
          severity,
          message,
          organization,
          endpointId,
          modelName,
          metadata
        } = body;

        // Validate required fields
        if (!alertType || !severity || !message) {
          return NextResponse.json(
            { error: 'Missing required fields: alertType, severity, message' },
            { status: 400 }
          );
        }

        // Validate severity
        if (!['critical', 'warning', 'info'].includes(severity)) {
          return NextResponse.json(
            { error: 'Invalid severity. Must be: critical, warning, or info' },
            { status: 400 }
          );
        }

        // Handle the alert through monitoring integration
        monitoringIntegration.handleAlert(alertType, severity, message, {
          organization: organization as Organization,
          endpointId,
          modelName,
          metadata,
        });

        loggingService.info('Alert created successfully', {
          alertType,
          severity,
          organization,
          endpointId,
          ip: getClientIP(request),
        });

        return NextResponse.json(
          {
            success: true,
            message: 'Alert created successfully',
            alertId: `alert_${Date.now()}`,
          },
          { status: 201 }
        );

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        loggingService.error('Failed to create alert', {
          error: errorMessage,
          ip: getClientIP(request),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
          { error: 'Failed to create alert' },
          { status: 500 }
        );
      }
    },
    {
      operationId: `create_alert_${Date.now()}`,
    }
  );
}

/**
 * PUT /api/monitoring/alerts/:id/resolve
 * Resolve a specific alert
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  return tracingService.traceOperation(
    'resolve_alert',
    async () => {
      try {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const alertId = pathParts[pathParts.length - 2]; // Get ID from path

        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }

        const body = await request.json();
        const { resolvedBy, resolution } = body;

        // Resolve alert in RunPod monitoring
        const runpodMonitoring = monitoringIntegration.getRunPodMonitoring();
        const resolved = runpodMonitoring.resolveAlert(alertId);

        loggingService.info('Alert resolved', {
          alertId,
          resolvedBy,
          resolution,
          ip: getClientIP(request),
        });

        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully',
          alertId,
          resolvedAt: new Date().toISOString(),
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        loggingService.error('Failed to resolve alert', {
          error: errorMessage,
          ip: getClientIP(request),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
          { error: 'Failed to resolve alert' },
          { status: 500 }
        );
      }
    },
    {
      operationId: `resolve_alert_${Date.now()}`,
    }
  );
}

/**
 * GET /api/monitoring/alerts/summary
 * Get alert summary statistics
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const organization = (searchParams.get('organization') || 'shared') as Organization;

  return tracingService.traceOperation(
    'get_alert_summary',
    async () => {
      try {
        const runpodMonitoring = monitoringIntegration.getRunPodMonitoring();
        const alerts = runpodMonitoring.getActiveAlerts();

        const summary = {
          total: alerts.length,
          active: alerts.filter(a => !a.resolved).length,
          resolved: alerts.filter(a => a.resolved).length,
          critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
          warning: alerts.filter(a => a.severity === 'warning' && !a.resolved).length,
          // Note: 'info' severity not supported in Alert interface, only 'warning' and 'critical'
        };

        return NextResponse.json({
          organization,
          summary,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        loggingService.error('Failed to get alert summary', {
          organization,
          error: errorMessage,
          ip: getClientIP(request),
        });

        return NextResponse.json(
          { error: 'Failed to get alert summary' },
          { status: 500 }
        );
      }
    },
    {
      organization,
      operationId: `alert_summary_${organization}_${Date.now()}`,
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