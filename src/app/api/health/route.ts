/**
 * Health Check API Endpoint
 * Provides system status information for E2E tests and monitoring
 */

import { NextResponse } from 'next/server';

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
        external: await checkExternalServices()
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    return NextResponse.json(health, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
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