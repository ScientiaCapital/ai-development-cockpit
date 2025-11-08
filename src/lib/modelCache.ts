import { ModelMetadata, ModelCache, CacheStats, DiscoveryFilters } from '@/types/models'
import { Organization } from '@/contexts/HuggingFaceAuth'

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheConfig {
  defaultTtl: number
  maxEntries: number
  cleanupInterval: number
  compressionEnabled: boolean
}

class ModelCacheManager {
  private cache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private cleanupTimer?: NodeJS.Timeout
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    lastCleared: new Date().toISOString()
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      compressionEnabled: true,
      ...config
    }

    this.startCleanupTimer()
    console.log('🗄️ Model cache manager initialized', this.config)
  }

  // Generate cache key from search parameters
  private generateCacheKey(
    type: 'discovery' | 'model' | 'stats' | 'availability' | 'preload',
    params: any
  ): string {
    const baseParams = {
      type,
      ...params,
      // Include only first 8 chars of token for security
      token: typeof params.token === 'string' ? params.token.substring(0, 8) : undefined
    }

    // Sort keys for consistent cache keys
    const sortedParams = this.sortObject(baseParams)
    return JSON.stringify(sortedParams)
  }

  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(this.sortObject.bind(this))

    const sorted: any = {}
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObject(obj[key])
    })
    return sorted
  }

  // Check if cache entry is valid
  private isValidEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  // Compress data if enabled
  private compressData(data: any): any {
    if (!this.config.compressionEnabled) return data

    try {
      // Simple compression: remove unnecessary whitespace from JSON
      return JSON.parse(JSON.stringify(data))
    } catch (error) {
      console.warn('⚠️ Data compression failed:', error)
      return data
    }
  }

  // Get item from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    if (!this.isValidEntry(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.stats.hits++

    console.log(`📋 Cache hit for key: ${key.substring(0, 50)}...`)
    return entry.data as T
  }

  // Set item in cache
  set<T>(key: string, data: T, ttl?: number): void {
    const entryTtl = ttl || this.config.defaultTtl

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed()
    }

    const entry: CacheEntry = {
      data: this.compressData(data),
      timestamp: Date.now(),
      ttl: entryTtl,
      accessCount: 1,
      lastAccessed: Date.now()
    }

    this.cache.set(key, entry)
    this.stats.sets++

    console.log(`💾 Cached data for key: ${key.substring(0, 50)}... (TTL: ${entryTtl}ms)`)
  }

  // Cache model discovery results
  cacheDiscoveryResults(
    filters: Partial<DiscoveryFilters>,
    searchQuery: string | undefined,
    page: number,
    pageSize: number,
    token: string,
    results: any
  ): void {
    const key = this.generateCacheKey('discovery', {
      filters,
      searchQuery,
      page,
      pageSize,
      token
    })

    // Cache for longer if it's a popular search
    const isPopularSearch = !searchQuery || searchQuery.length < 3
    const ttl = isPopularSearch ? this.config.defaultTtl * 2 : this.config.defaultTtl

    this.set(key, results, ttl)
  }

  // Get cached discovery results
  getCachedDiscoveryResults(
    filters: Partial<DiscoveryFilters>,
    searchQuery: string | undefined,
    page: number,
    pageSize: number,
    token: string
  ): any | null {
    const key = this.generateCacheKey('discovery', {
      filters,
      searchQuery,
      page,
      pageSize,
      token
    })

    return this.get(key)
  }

  // Cache individual model metadata
  cacheModelMetadata(modelId: string, organization: Organization, metadata: ModelMetadata): void {
    const key = this.generateCacheKey('model', { modelId, organization })
    // Cache individual models for longer
    this.set(key, metadata, this.config.defaultTtl * 3)
  }

  // Get cached model metadata
  getCachedModelMetadata(modelId: string, organization: Organization): ModelMetadata | null {
    const key = this.generateCacheKey('model', { modelId, organization })
    return this.get<ModelMetadata>(key)
  }

  // Cache organization statistics
  cacheOrganizationStats(organization: Organization, stats: any): void {
    const key = this.generateCacheKey('stats', { organization })
    this.set(key, stats, this.config.defaultTtl * 4) // Cache stats longer
  }

  // Get cached organization statistics
  getCachedOrganizationStats(organization: Organization): any | null {
    const key = this.generateCacheKey('stats', { organization })
    return this.get(key)
  }

  // Cache model availability status
  cacheModelAvailability(modelIds: string[], availability: { [key: string]: boolean }): void {
    const key = this.generateCacheKey('availability', { modelIds: modelIds.sort() })
    // Availability changes frequently, shorter TTL
    this.set(key, availability, this.config.defaultTtl / 2)
  }

  // Get cached model availability
  getCachedModelAvailability(modelIds: string[]): { [key: string]: boolean } | null {
    const key = this.generateCacheKey('availability', { modelIds: modelIds.sort() })
    return this.get(key)
  }

  // Evict least recently used entries
  private evictLeastRecentlyUsed(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
      console.log(`🗑️ Evicted LRU cache entry: ${oldestKey.substring(0, 50)}...`)
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const beforeSize = this.cache.size
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries (${beforeSize} → ${this.cache.size})`)
    }
  }

  // Start automatic cleanup timer
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      lastCleared: new Date().toISOString()
    }
    console.log('🗑️ Cache cleared completely')
  }

  // Clear cache for specific organization
  clearOrganization(organization: Organization): void {
    let cleared = 0

    for (const [key, _] of this.cache.entries()) {
      if (key.includes(`"organization":"${organization}"`)) {
        this.cache.delete(key)
        cleared++
      }
    }

    console.log(`🗑️ Cleared ${cleared} cache entries for ${organization}`)
  }

  // Get cache statistics
  getStats(): CacheStats {
    const validEntries = Array.from(this.cache.values()).filter(entry =>
      this.isValidEntry(entry)
    ).length

    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries: this.cache.size - validEntries,
      memoryUsageKB: Math.round(JSON.stringify(Array.from(this.cache.entries())).length / 1024),
      hitRate: Number(hitRate.toFixed(2)),
      lastCleared: this.stats.lastCleared
    }
  }

  // Get detailed cache information for debugging
  getDebugInfo() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 100) + (key.length > 100 ? '...' : ''),
      size: JSON.stringify(entry.data).length,
      accessCount: entry.accessCount,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      valid: this.isValidEntry(entry)
    }))

    return {
      config: this.config,
      stats: { ...this.stats, ...this.getStats() },
      entries: entries.sort((a, b) => b.accessCount - a.accessCount).slice(0, 10) // Top 10
    }
  }

  // Preload popular models for faster access
  async preloadPopularModels(popularModelIds: string[], organization: Organization): Promise<void> {
    console.log(`🔄 Preloading ${popularModelIds.length} popular models for ${organization}`)

    // This would typically fetch from API and cache
    // For now, just mark as preloaded in cache
    const orgString = typeof organization === 'string' ? organization : (organization as any)?.id || String(organization);
    const preloadKey = this.generateCacheKey('preload', { organization: orgString, modelIds: popularModelIds })
    this.set(preloadKey, { preloaded: true, modelIds: popularModelIds }, this.config.defaultTtl * 6)
  }

  // Destroy cache manager
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.clear()
    console.log('🔥 Model cache manager destroyed')
  }
}

// Export singleton instance
export const modelCache = new ModelCacheManager({
  defaultTtl: 5 * 60 * 1000,  // 5 minutes
  maxEntries: 500,             // Reasonable limit for client-side
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  compressionEnabled: true
})

export default modelCache