/**
 * Prometheus Metrics API Endpoint
 * Exposes metrics in Prometheus format for scraping
 * Supports organization-specific metrics filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { prometheusService, Organization } from '@/services/monitoring/prometheus.service';
import { loggingService } from '@/services/monitoring/logging.service';
import { tracingService } from '@/services/monitoring/tracing.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics
 * Returns Prometheus metrics in standard exposition format
 * Supports query parameters for organization filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const organization = searchParams.get('organization') as Organization;
  const format = searchParams.get('format') || 'prometheus';

  // Start tracing for metrics collection
  return tracingService.traceOperation(
    'metrics_exposition',
    async () => {
      try {
        // Validate organization parameter
        if (organization && !['arcade', 'enterprise', 'shared'].includes(organization)) {
          loggingService.warn('Invalid organization parameter in metrics request', {
            organization,
            ip: getClientIP(request),
            userAgent: request.headers.get('user-agent') || undefined,
          });

          return NextResponse.json(
            { error: 'Invalid organization parameter' },
            { status: 400 }
          );
        }

        // Get metrics based on organization filter
        let metricsData: string;
        if (organization) {
          metricsData = await prometheusService.getOrganizationMetrics(organization);

          loggingService.info('Organization-specific metrics requested', {
            organization,
            ip: getClientIP(request),
          });
        } else {
          metricsData = await prometheusService.getMetrics();

          loggingService.debug('All metrics requested', {
            ip: getClientIP(request),
          });
        }

        // Add custom headers for Prometheus compatibility
        const headers = new Headers({
          'Content-Type': format === 'json' ? 'application/json' : 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        });

        // Return JSON format if requested
        if (format === 'json') {
          const metrics = parsePrometheusMetrics(metricsData);
          return NextResponse.json(metrics, { headers });
        }

        // Record metrics request
        const duration = Date.now() - startTime;
        prometheusService.recordHttpRequest(
          'GET',
          '/api/metrics',
          200,
          duration,
          organization || 'shared'
        );

        loggingService.http('Metrics exposed successfully', {
          method: 'GET',
          url: '/api/metrics',
          statusCode: 200,
          duration,
          organization: organization || 'shared',
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        });

        return new NextResponse(metricsData, { headers });

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Record error metrics
        prometheusService.recordHttpRequest(
          'GET',
          '/api/metrics',
          500,
          duration,
          organization || 'shared'
        );

        loggingService.error('Failed to expose metrics', {
          error: errorMessage,
          organization: organization || 'shared',
          duration,
          ip: getClientIP(request),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
          { error: 'Failed to generate metrics' },
          { status: 500 }
        );
      }
    },
    {
      organization: organization || 'shared',
      operationId: `metrics_${Date.now()}`,
    }
  );
}

/**
 * POST /api/metrics/custom
 * Accept custom metrics from clients (for PWA metrics, user interactions, etc.)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  return tracingService.traceOperation(
    'custom_metrics_ingestion',
    async () => {
      try {
        const body = await request.json();
        const { organization, metrics, type } = body;

        // Validate request body
        if (!metrics || !Array.isArray(metrics)) {
          return NextResponse.json(
            { error: 'Invalid metrics data' },
            { status: 400 }
          );
        }

        // Process custom metrics based on type
        switch (type) {
          case 'web_vitals':
            await processWebVitalsMetrics(metrics, organization);
            break;
          case 'user_interaction':
            await processUserInteractionMetrics(metrics, organization);
            break;
          case 'performance':
            await processPerformanceMetrics(metrics, organization);
            break;
          default:
            await processGenericMetrics(metrics, organization);
        }

        const duration = Date.now() - startTime;

        // Record successful ingestion
        prometheusService.recordHttpRequest(
          'POST',
          '/api/metrics/custom',
          200,
          duration,
          organization || 'shared'
        );

        loggingService.info('Custom metrics ingested successfully', {
          organization: organization || 'shared',
          metricsCount: metrics.length,
          type,
          duration,
          ip: getClientIP(request),
        });

        return NextResponse.json(
          {
            success: true,
            processed: metrics.length,
            message: 'Metrics ingested successfully'
          },
          { status: 200 }
        );

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        prometheusService.recordHttpRequest(
          'POST',
          '/api/metrics/custom',
          500,
          duration,
          'shared'
        );

        loggingService.error('Failed to ingest custom metrics', {
          error: errorMessage,
          duration,
          ip: getClientIP(request),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
          { error: 'Failed to process metrics' },
          { status: 500 }
        );
      }
    },
    {
      organization: 'shared',
      operationId: `custom_metrics_${Date.now()}`,
    }
  );
}

/**
 * GET /api/metrics/health
 * Health check endpoint for monitoring system
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const isReady = prometheusService.isReady() &&
                  tracingService.isReady();

  if (isReady) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
  } else {
    return new NextResponse(null, { status: 503 });
  }
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

/**
 * Parse Prometheus metrics into JSON format
 */
function parsePrometheusMetrics(metricsText: string): any {
  const lines = metricsText.split('\n');
  const metrics: any = {};

  let currentMetric = '';

  for (const line of lines) {
    if (line.startsWith('#')) {
      // Skip comments and help lines
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    // Parse metric line: metric_name{labels} value timestamp
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*(?:\{[^}]*\})?) ([+-]?[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?)( [0-9]+)?$/);

    if (match) {
      const [, nameWithLabels, value, timestamp] = match;
      const [name, labelsStr] = nameWithLabels.includes('{')
        ? nameWithLabels.split('{')
        : [nameWithLabels, ''];

      if (!metrics[name]) {
        metrics[name] = [];
      }

      const labels: any = {};
      if (labelsStr) {
        const labelStr = labelsStr.replace('}', '');
        const labelPairs = labelStr.split(',');

        for (const pair of labelPairs) {
          const [key, val] = pair.split('=');
          if (key && val) {
            labels[key.trim()] = val.trim().replace(/"/g, '');
          }
        }
      }

      metrics[name].push({
        labels,
        value: parseFloat(value),
        timestamp: timestamp ? parseInt(timestamp.trim()) : Date.now(),
      });
    }
  }

  return metrics;
}

/**
 * Process Web Vitals metrics from PWA
 */
async function processWebVitalsMetrics(metrics: any[], organization: Organization): Promise<void> {
  for (const metric of metrics) {
    const { name, value, rating, delta } = metric;

    // Record Web Vitals as custom business metrics
    prometheusService.recordOrganizationActivity(organization, `web_vital_${name}`);

    loggingService.business(`Web Vital recorded: ${name}`, {
      eventType: 'feature_usage',
      organization,
      metadata: {
        metric: name,
        value,
        rating,
        delta,
      },
    });
  }
}

/**
 * Process user interaction metrics
 */
async function processUserInteractionMetrics(metrics: any[], organization: Organization): Promise<void> {
  for (const metric of metrics) {
    const { event, element, duration } = metric;

    prometheusService.recordOrganizationActivity(organization, `interaction_${event}`);

    loggingService.business(`User interaction: ${event}`, {
      eventType: 'feature_usage',
      organization,
      metadata: {
        event,
        element,
        duration,
      },
    });
  }
}

/**
 * Process performance metrics
 */
async function processPerformanceMetrics(metrics: any[], organization: Organization): Promise<void> {
  for (const metric of metrics) {
    const { operation, duration, success } = metric;

    if (success) {
      prometheusService.recordOrganizationActivity(organization, `performance_${operation}`);
    }

    loggingService.performance({
      operation,
      organization,
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      success,
    });
  }
}

/**
 * Process generic custom metrics
 */
async function processGenericMetrics(metrics: any[], organization: Organization): Promise<void> {
  for (const metric of metrics) {
    const { name, value, labels } = metric;

    prometheusService.recordOrganizationActivity(organization, `custom_${name}`);

    loggingService.info(`Custom metric: ${name}`, {
      organization,
      value,
      labels,
    });
  }
}