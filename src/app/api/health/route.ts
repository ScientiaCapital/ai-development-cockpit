/**
 * Enhanced Health Check API Endpoint
 * Provides comprehensive system status information for E2E tests, monitoring, and observability
 */

import { NextResponse } from 'next/server';
import { prometheusService } from '@/services/monitoring/prometheus.service';
import { loggingService } from '@/services/monitoring/logging.service';
import { tracingService } from '@/services/monitoring/tracing.service';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'healthy',
        database: await checkDatabase(),
        external: await checkExternalServices(),
        monitoring: await checkMonitoringServices()
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      monitoring: {
        prometheus: prometheusService.isReady(),
        tracing: tracingService.isReady(),
        logging: true
      }
    };

    return NextResponse.json(health, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log health check failure
    loggingService.error('Health check failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage
      },
      { status: 503 }
    );
  }
}

async function checkDatabase(): Promise<string> {
  try {
    // In a real environment, you would check database connectivity
    // For now, we'll just check if database environment variables are set
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      return 'healthy';
    }
    return 'warning';
  } catch (error) {
    return 'unhealthy';
  }
}

async function checkExternalServices(): Promise<string> {
  try {
    // Check if external service API keys are configured
    const services = {
      huggingface: !!process.env.HUGGINGFACE_API_KEY,
      runpod: !!process.env.RUNPOD_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    if (healthyServices === totalServices) {
      return 'healthy';
    } else if (healthyServices > 0) {
      return 'warning';
    } else {
      return 'unhealthy';
    }
  } catch (error) {
    return 'unhealthy';
  }
}

async function checkMonitoringServices(): Promise<string> {
  try {
    const services = {
      prometheus: prometheusService.isReady(),
      tracing: tracingService.isReady(),
      logging: true, // Logging is always available once initialized
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    if (healthyServices === totalServices) {
      loggingService.debug('All monitoring services healthy');
      return 'healthy';
    } else if (healthyServices > 0) {
      loggingService.warn('Some monitoring services degraded', { services });
      return 'warning';
    } else {
      loggingService.error('All monitoring services unhealthy', { 
        error: 'All monitoring services unhealthy',
        services 
      });
      return 'unhealthy';
    }
  } catch (error) {
    loggingService.error('Failed to check monitoring services', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 'unhealthy';
  }
}