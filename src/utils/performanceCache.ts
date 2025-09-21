/**
 * Performance-optimized caching utilities
 * Implements intelligent caching strategies for API responses and expensive computations
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  hits: number
  size: number // Approximate size in bytes
}

interface CacheOptions {
  ttl?: number // Default TTL in milliseconds
  maxSize?: number // Maximum cache size in bytes
  maxEntries?: number // Maximum number of entries
  enableCompression?: boolean
}

/**
 * High-performance LRU cache with intelligent eviction
 */
export class PerformanceCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder = new Map<string, number>() // For LRU tracking
  private totalSize = 0
  private accessCounter = 0
  
  private readonly defaultTTL: number
  private readonly maxSize: number
  private readonly maxEntries: number
  private readonly enableCompression: boolean

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // 5 minutes default
    this.maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
    this.maxEntries = options.maxEntries || 1000
    this.enableCompression = options.enableCompression || false
  }

  /**
   * Get item from cache with intelligent retrieval
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    // Update access tracking
    entry.hits++
    this.accessOrder.set(key, ++this.accessCounter)
    
    return entry.data
  }

  /**
   * Set item in cache with intelligent eviction
   */
  set(key: string, data: T, ttl?: number): void {
    const entryTTL = ttl || this.defaultTTL
    const dataSize = this.estimateSize(data)
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key)
    }

    // Check if we need to evict entries
    this.evictIfNeeded(dataSize)

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: entryTTL,
      hits: 0,
      size: dataSize
    }

    this.cache.set(key, entry)
    this.accessOrder.set(key, ++this.accessCounter)
    this.totalSize += dataSize
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.totalSize -= entry.size
      this.cache.delete(key)
      this.accessOrder.delete(key)
      return true
    }
    return false
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.totalSize = 0
    this.accessCounter = 0
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let expiredCount = 0
    let totalHits = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++
      }
      totalHits += entry.hits
    }

    return {
      size: this.cache.size,
      totalSize: this.totalSize,
      maxSize: this.maxSize,
      maxEntries: this.maxEntries,
      expiredCount,
      totalHits,
      hitRate: totalHits / Math.max(this.accessCounter, 1)
    }
  }

  /**
   * Estimate the size of data in bytes
   */
  private estimateSize(data: T): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      // Fallback estimation
      return JSON.stringify(data).length * 2 // Rough UTF-16 estimation
    }
  }

  /**
   * Intelligent eviction based on LRU and size constraints
   */
  private evictIfNeeded(newEntrySize: number): void {
    // Evict expired entries first
    this.evictExpired()

    // Check size constraints
    while (
      this.totalSize + newEntrySize > this.maxSize || 
      this.cache.size >= this.maxEntries
    ) {
      this.evictLRU()
    }
  }

  /**
   * Evict expired entries
   */
  private evictExpired(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.delete(key))
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return

    let oldestKey = ''
    let oldestAccess = Infinity

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }
}

/**
 * API Response Cache with request deduplication
 */
export class APICache {
  private cache = new PerformanceCache<any>()
  private pendingRequests = new Map<string, Promise<any>>()

  constructor(options: CacheOptions = {}) {
    this.cache = new PerformanceCache(options)
  }

  /**
   * Cached fetch with request deduplication
   */
  async fetch<T>(
    url: string, 
    options: RequestInit = {},
    cacheTTL?: number
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, options)
    
    // Try cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Check for pending request
    const pending = this.pendingRequests.get(cacheKey)
    if (pending) {
      return pending
    }

    // Make new request
    const request = this.makeRequest<T>(url, options)
    this.pendingRequests.set(cacheKey, request)

    try {
      const result = await request
      this.cache.set(cacheKey, result, cacheTTL)
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Make HTTP request
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Generate cache key from URL and options
   */
  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string | RegExp): void {
    // This would require exposing cache keys - simplified implementation
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.cache.getStats(),
      pendingRequests: this.pendingRequests.size
    }
  }
}

/**
 * Model data cache specifically optimized for HuggingFace API
 */
export class ModelCache extends APICache {
  constructor() {
    super({
      ttl: 10 * 60 * 1000, // 10 minutes for model data
      maxSize: 50 * 1024 * 1024, // 50MB for model metadata
      maxEntries: 5000
    })
  }

  /**
   * Fetch model with intelligent caching
   */
  async fetchModel(modelId: string) {
    return this.fetch(`/api/models/${encodeURIComponent(modelId)}`, {}, 15 * 60 * 1000) // 15 min cache
  }

  /**
   * Search models with shorter cache TTL
   */
  async searchModels(query: string, filters: any = {}) {
    const params = new URLSearchParams({
      q: query,
      ...filters
    })
    return this.fetch(`/api/models/search?${params}`, {}, 5 * 60 * 1000) // 5 min cache
  }
}

/**
 * Inference cache for chat responses (shorter TTL)
 */
export class InferenceCache extends APICache {
  constructor() {
    super({
      ttl: 2 * 60 * 1000, // 2 minutes for inference responses
      maxSize: 20 * 1024 * 1024, // 20MB for chat responses
      maxEntries: 1000
    })
  }
}

// Global cache instances
export const modelCache = new ModelCache()
export const inferenceCache = new InferenceCache()

// General purpose cache
export const generalCache = new PerformanceCache({
  ttl: 5 * 60 * 1000, // 5 minutes default
  maxSize: 30 * 1024 * 1024, // 30MB
  maxEntries: 2000
})