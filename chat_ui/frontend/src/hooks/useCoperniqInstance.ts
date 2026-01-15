'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'coperniq-instance';
const DEFAULT_INSTANCE = 388;

export interface CoperniqInstance {
  id: number;
  name: string;
  type: 'production' | 'development' | 'demo';
  available: boolean;
}

interface InstancesResponse {
  instances: CoperniqInstance[];
  default: number;
  all: CoperniqInstance[];
}

/**
 * Hook to manage Coperniq instance selection
 *
 * Usage:
 * const { instance, setInstance, instances, loading } = useCoperniqInstance();
 *
 * // In fetch calls, add header:
 * fetch('/api/work-orders', {
 *   headers: { 'x-coperniq-instance': instance.toString() }
 * })
 */
export function useCoperniqInstance() {
  const [instance, setInstanceState] = useState<number>(DEFAULT_INSTANCE);
  const [instances, setInstances] = useState<CoperniqInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Load saved instance from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) {
        setInstanceState(parsed);
      }
    }
  }, []);

  // Fetch available instances
  useEffect(() => {
    async function fetchInstances() {
      try {
        const res = await fetch('/api/instances');
        if (res.ok) {
          const data: InstancesResponse = await res.json();
          setInstances(data.instances);

          // If current instance is not available, switch to default
          const currentAvailable = data.instances.some(i => i.id === instance);
          if (!currentAvailable && data.instances.length > 0) {
            setInstanceState(data.default);
            localStorage.setItem(STORAGE_KEY, data.default.toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch instances:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInstances();
  }, [instance]);

  // Set instance and persist to localStorage
  const setInstance = useCallback((newInstance: number) => {
    setInstanceState(newInstance);
    localStorage.setItem(STORAGE_KEY, newInstance.toString());
  }, []);

  // Get current instance info
  const currentInstance = instances.find(i => i.id === instance) || {
    id: instance,
    name: 'Unknown',
    type: 'production' as const,
    available: false,
  };

  return {
    instance,
    setInstance,
    instances,
    currentInstance,
    loading,
    // Helper for fetch headers
    headers: {
      'x-coperniq-instance': instance.toString(),
    },
  };
}
