/**
 * Health Check API Endpoint
 * Provides basic connectivity status for monitoring and observability
 *
 * Supports both GET and HEAD requests
 * Returns 200 for healthy/degraded, 503 for unhealthy
 */

import { NextResponse } from 'next/server';

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    api: boolean;
    costOptimizer: boolean;
    database: boolean;
  };
}

/**
 * GET /api/health - Returns full health status
 */
export async function GET() {
  const health = await checkHealth();
  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * HEAD /api/health - Returns only status code (no body)
 */
export async function HEAD() {
  const health = await checkHealth();
  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return new NextResponse(null, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Checks health of all services
 */
async function checkHealth(): Promise<HealthResponse> {
  const services = {
    api: true, // Always true if we're responding
    costOptimizer: await checkCostOptimizer(),
    database: checkDatabase(),
  };

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (services.api && services.costOptimizer && services.database) {
    status = 'healthy';
  } else if (services.api) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services,
  };
}

/**
 * Checks if Cost Optimizer service is available
 * Pings the /health endpoint with 5s timeout
 */
async function checkCostOptimizer(): Promise<boolean> {
  const costOptimizerUrl = process.env.COST_OPTIMIZER_URL;

  if (!costOptimizerUrl) {
    return false; // Service not configured
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${costOptimizerUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Timeout, network error, or service unavailable
    return false;
  }
}

/**
 * Checks if database is configured
 * Simple check for environment variables
 */
function checkDatabase(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!supabaseUrl;
}