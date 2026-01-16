/**
 * Simple in-memory cache for Coperniq API responses
 * Helps prevent rate limiting (429 errors) by caching responses
 *
 * Note: In Vercel serverless, each function instance has its own cache.
 * This helps reduce repeated calls within the same instance lifecycle.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache storage - survives within a single serverless instance
const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 60 seconds (helps with rate limiting while keeping data fresh)
const DEFAULT_TTL_MS = 60 * 1000;

/**
 * Get cached data if available and not expired
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  console.log(`[Cache] HIT: ${key} (expires in ${Math.round((entry.expiresAt - Date.now()) / 1000)}s)`);
  return entry.data;
}

/**
 * Store data in cache with optional TTL
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  });
  console.log(`[Cache] SET: ${key} (TTL: ${ttlMs / 1000}s)`);
}

/**
 * Generate cache key for Coperniq API calls
 */
export function getCacheKey(endpoint: string, instanceId: string | number, params?: Record<string, string>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `coperniq:${instanceId}:${endpoint}${paramStr}`;
}

/**
 * Clear all cache entries (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
  console.log('[Cache] CLEARED');
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
