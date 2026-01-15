/**
 * Coperniq Instances API
 *
 * Returns list of available Coperniq instances
 * based on which API keys are configured.
 */

import { NextResponse } from 'next/server';
import { COPERNIQ_INSTANCES, DEFAULT_INSTANCE, type CoperniqInstanceId } from '@/lib/coperniq';

export async function GET() {
  // Check which instances have API keys configured
  const instances = Object.values(COPERNIQ_INSTANCES).map(instance => {
    const envKey = `COPERNIQ_API_KEY_${instance.id}`;
    const hasKey = !!(process.env[envKey] || (instance.id === DEFAULT_INSTANCE && process.env.COPERNIQ_API_KEY));

    return {
      id: instance.id,
      name: instance.name,
      type: instance.type,
      available: hasKey,
    };
  });

  // Filter to only available instances
  const available = instances.filter(i => i.available);

  return NextResponse.json({
    instances: available,
    default: DEFAULT_INSTANCE,
    all: instances, // Include all for UI to show disabled options
  });
}
