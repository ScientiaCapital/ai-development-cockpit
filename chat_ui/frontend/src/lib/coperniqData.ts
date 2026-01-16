/**
 * Coperniq Unified Data Layer
 *
 * Fetches all Coperniq data from a single endpoint to avoid rate limiting.
 * The /api/coperniq/all endpoint makes staggered requests to Coperniq,
 * preventing the 429 errors that occur when 5+ requests hit simultaneously.
 *
 * Usage:
 *   import { getCoperniqData, refreshCoperniqData } from '@/lib/coperniqData';
 *
 *   // Get cached data (fetches if stale/empty)
 *   const data = await getCoperniqData();
 *
 *   // Force refresh
 *   const freshData = await refreshCoperniqData();
 */

import type { WorkOrder } from '@/types';
import type { Customer, Project, ServiceRequest, Invoice } from './api';

// Cache TTL: 30 seconds (shorter than server-side to stay fresh)
const CACHE_TTL_MS = 30 * 1000;

// Last fetch timestamp
let lastFetchTime = 0;
let fetchPromise: Promise<CoperniqDataCache> | null = null;

export interface CoperniqDataCache {
  customers: Customer[];
  projects: Project[];
  requests: ServiceRequest[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  source: 'coperniq' | 'partial' | 'error' | 'demo';
  timestamp: string;
  errors?: string[];
}

// In-memory cache
let dataCache: CoperniqDataCache | null = null;

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  if (!dataCache) return false;
  const now = Date.now();
  return (now - lastFetchTime) < CACHE_TTL_MS;
}

/**
 * Fetch all data from unified endpoint
 */
async function fetchAllData(): Promise<CoperniqDataCache> {
  console.log('[CoperniqData] Fetching unified data...');
  const startTime = performance.now();

  try {
    const response = await fetch('/api/coperniq/all');
    const data = await response.json();

    const cache: CoperniqDataCache = {
      customers: data.customers || [],
      projects: data.projects || [],
      requests: data.requests || [],
      workOrders: data.workOrders || [],
      invoices: data.invoices || [],
      source: data.source || 'coperniq',
      timestamp: data.timestamp || new Date().toISOString(),
      errors: data.errors,
    };

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`[CoperniqData] Fetched in ${elapsed}ms: customers=${cache.customers.length}, projects=${cache.projects.length}, requests=${cache.requests.length}, workOrders=${cache.workOrders.length}, invoices=${cache.invoices.length}, source=${cache.source}`);

    return cache;
  } catch (error) {
    console.error('[CoperniqData] Fetch failed:', error);
    // Return empty cache on error
    return {
      customers: [],
      projects: [],
      requests: [],
      workOrders: [],
      invoices: [],
      source: 'error',
      timestamp: new Date().toISOString(),
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Get Coperniq data (from cache if valid, or fetch fresh)
 */
export async function getCoperniqData(): Promise<CoperniqDataCache> {
  // Return cached data if still valid
  if (isCacheValid() && dataCache) {
    return dataCache;
  }

  // If already fetching, wait for that promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = fetchAllData().then(data => {
    dataCache = data;
    lastFetchTime = Date.now();
    fetchPromise = null;
    return data;
  }).catch(err => {
    fetchPromise = null;
    throw err;
  });

  return fetchPromise;
}

/**
 * Force refresh of Coperniq data
 */
export async function refreshCoperniqData(): Promise<CoperniqDataCache> {
  // Clear cache to force fresh fetch
  dataCache = null;
  lastFetchTime = 0;
  fetchPromise = null;
  return getCoperniqData();
}

/**
 * Get cached data synchronously (may be stale or null)
 */
export function getCachedData(): CoperniqDataCache | null {
  return dataCache;
}

/**
 * Clear the cache (call when instance changes)
 */
export function clearCache(): void {
  dataCache = null;
  lastFetchTime = 0;
  fetchPromise = null;
}

// ============================================================================
// Convenience functions for individual data types
// These match the signatures in api.ts for easy migration
// ============================================================================

export async function getWorkOrdersFromCache(): Promise<{ work_orders: WorkOrder[]; source: string }> {
  const data = await getCoperniqData();
  return {
    work_orders: data.workOrders,
    source: data.source,
  };
}

export async function getCustomersFromCache(search?: string): Promise<{ customers: Customer[]; total: number; source: string }> {
  const data = await getCoperniqData();
  let customers = data.customers;

  // Filter by search if provided
  if (search) {
    const query = search.toLowerCase();
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query) ||
      c.companyName?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query)
    );
  }

  return {
    customers,
    total: customers.length,
    source: data.source,
  };
}

export async function getProjectsFromCache(stage?: string): Promise<{ projects: Project[]; total: number; source: string }> {
  const data = await getCoperniqData();
  let projects = data.projects;

  // Filter by stage if provided
  if (stage && stage !== 'all') {
    projects = projects.filter(p => p.stage === stage);
  }

  return {
    projects,
    total: projects.length,
    source: data.source,
  };
}

export async function getRequestsFromCache(priority?: string): Promise<{ requests: ServiceRequest[]; total: number; source: string }> {
  const data = await getCoperniqData();
  let requests = data.requests;

  // Filter by priority if provided
  if (priority && priority !== 'all') {
    requests = requests.filter(r => r.priority === priority);
  }

  return {
    requests,
    total: requests.length,
    source: data.source,
  };
}

export async function getInvoicesFromCache(status?: string): Promise<{ invoices: Invoice[]; total: number; source: string }> {
  const data = await getCoperniqData();
  let invoices = data.invoices;

  // Filter by status if provided
  if (status && status !== 'all') {
    invoices = invoices.filter(i => i.status === status);
  }

  return {
    invoices,
    total: invoices.length,
    source: data.source,
  };
}
