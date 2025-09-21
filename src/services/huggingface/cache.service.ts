import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

export interface CacheConfig {
  enableMemoryCache: boolean;
  enableRedisCache: boolean;
  memoryMaxSize: number;
  memoryTtl: number;
  redisTtl: number;
  redisKeyPrefix: string;
  enableCompression: boolean;
  enablePurging: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  organization?: string;
  version?: string;
  tags?: string[];
}

export interface CacheStats {
  memoryCache: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    maxSize: number;
  };
  redisCache: {
    connected: boolean;
    hits: number;
    misses: number;
    hitRate: number;
    keys?: number;
  };
  totalHits: number;
  totalMisses: number;
  totalHitRate: number;
}

export interface CacheOptions {
  ttl?: number;
  organization?: string;
  tags?: string[];
  version?: string;
  useMemoryOnly?: boolean;
  useRedisOnly?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  enableMemoryCache: true,
  enableRedisCache: true,
  memoryMaxSize: 1000, // Maximum number of items in memory cache
  memoryTtl: 5 * 60 * 1000, // 5 minutes in milliseconds
  redisTtl: 30 * 60, // 30 minutes in seconds
  redisKeyPrefix: 'hf_api_cache:',
  enableCompression: true,
  enablePurging: true,
};

export class HuggingFaceCacheService {
  private config: CacheConfig;
  private memoryCache?: LRUCache<string, CacheEntry>;
  private redisCache?: Redis;
  private stats: CacheStats;
  private enableLogging: boolean;
  private compressionEnabled: boolean;

  constructor(
    config: Partial<CacheConfig> = {},
    redisConfig?: Parameters<typeof Redis>[0],
    enableLogging = process.env.NODE_ENV === 'development'
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.enableLogging = enableLogging;
    this.compressionEnabled = this.config.enableCompression && typeof window === 'undefined';

    this.stats = {
      memoryCache: {
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        maxSize: this.config.memoryMaxSize,
      },
      redisCache: {
        connected: false,
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      totalHits: 0,
      totalMisses: 0,
      totalHitRate: 0,
    };

    this.initializeMemoryCache();
    this.initializeRedisCache(redisConfig);
  }

  private initializeMemoryCache(): void {
    if (!this.config.enableMemoryCache) return;

    this.memoryCache = new LRUCache<string, CacheEntry>({
      max: this.config.memoryMaxSize,
      ttl: this.config.memoryTtl,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      dispose: (value, key) => {
        this.log('MEMORY_CACHE_EVICTED', { key, timestamp: value.timestamp });
      },
    });

    this.log('MEMORY_CACHE_INITIALIZED', {
      maxSize: this.config.memoryMaxSize,
      ttl: this.config.memoryTtl,
    });
  }

  private async initializeRedisCache(redisConfig?: Parameters<typeof Redis>[0]): Promise<void> {
    if (!this.config.enableRedisCache) return;

    try {
      // Default Redis configuration
      const defaultRedisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: this.config.redisKeyPrefix,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      this.redisCache = new Redis({
        ...defaultRedisConfig,
        ...redisConfig,
      });

      // Set up Redis event handlers
      this.redisCache.on('connect', () => {
        this.stats.redisCache.connected = true;
        this.log('REDIS_CONNECTED', {});
      });

      this.redisCache.on('error', (error) => {
        this.stats.redisCache.connected = false;
        this.log('REDIS_ERROR', { error: error.message });
      });

      this.redisCache.on('close', () => {
        this.stats.redisCache.connected = false;
        this.log('REDIS_DISCONNECTED', {});
      });

      // Attempt to connect
      await this.redisCache.connect();

      this.log('REDIS_CACHE_INITIALIZED', {
        host: this.redisCache.options.host,
        port: this.redisCache.options.port,
        db: this.redisCache.options.db,
      });
    } catch (error) {
      this.log('REDIS_CACHE_INIT_FAILED', { error: (error as Error).message });
      this.redisCache = undefined;
    }
  }

  private generateCacheKey(key: string, organization?: string): string {
    const parts = [key];
    if (organization) {
      parts.unshift(organization);
    }
    return parts.join(':');
  }

  private async compress(data: any): Promise<string> {
    if (!this.compressionEnabled) {
      return JSON.stringify(data);
    }

    try {
      const zlib = await import('zlib');
      const jsonString = JSON.stringify(data);
      const compressed = zlib.gzipSync(jsonString);
      return compressed.toString('base64');
    } catch (error) {
      this.log('COMPRESSION_FAILED', { error: (error as Error).message });
      return JSON.stringify(data);
    }
  }

  private async decompress(compressedData: string): Promise<any> {
    if (!this.compressionEnabled) {
      return JSON.parse(compressedData);
    }

    try {
      const zlib = await import('zlib');
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      // Fallback to regular JSON parsing
      try {
        return JSON.parse(compressedData);
      } catch {
        this.log('DECOMPRESSION_FAILED', { error: (error as Error).message });
        return null;
      }
    }
  }

  private createCacheEntry<T>(data: T, options: CacheOptions = {}): CacheEntry<T> {
    return {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.memoryTtl,
      organization: options.organization,
      version: options.version,
      tags: options.tags,
    };
  }

  private log(level: string, data: any): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] HF_CACHE_${level}:`, JSON.stringify(data, null, 2));
  }

  public async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key, options.organization);

    // Try memory cache first (fastest)
    if (this.config.enableMemoryCache && !options.useRedisOnly && this.memoryCache) {
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry) {
        this.stats.memoryCache.hits++;
        this.stats.totalHits++;
        this.updateHitRates();

        this.log('MEMORY_CACHE_HIT', { key: cacheKey });
        return memoryEntry.data;
      } else {
        this.stats.memoryCache.misses++;
        this.stats.totalMisses++;
      }
    }

    // Try Redis cache
    if (this.config.enableRedisCache && !options.useMemoryOnly && this.redisCache) {
      try {
        const redisData = await this.redisCache.get(cacheKey);
        if (redisData) {
          const decompressedData = await this.decompress(redisData);
          if (decompressedData) {
            const entry: CacheEntry<T> = decompressedData;

            this.stats.redisCache.hits++;
            this.stats.totalHits++;
            this.updateHitRates();

            // Populate memory cache for faster future access
            if (this.memoryCache && !options.useRedisOnly) {
              this.memoryCache.set(cacheKey, entry);
            }

            this.log('REDIS_CACHE_HIT', { key: cacheKey });
            return entry.data;
          }
        }
      } catch (error) {
        this.log('REDIS_GET_ERROR', { key: cacheKey, error: (error as Error).message });
      }

      this.stats.redisCache.misses++;
      this.stats.totalMisses++;
    }

    this.updateHitRates();
    this.log('CACHE_MISS', { key: cacheKey });
    return null;
  }

  public async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateCacheKey(key, options.organization);
    const entry = this.createCacheEntry(data, options);

    // Set in memory cache
    if (this.config.enableMemoryCache && !options.useRedisOnly && this.memoryCache) {
      this.memoryCache.set(cacheKey, entry, { ttl: options.ttl || this.config.memoryTtl });
      this.stats.memoryCache.size = this.memoryCache.size;
      this.log('MEMORY_CACHE_SET', { key: cacheKey, ttl: options.ttl || this.config.memoryTtl });
    }

    // Set in Redis cache
    if (this.config.enableRedisCache && !options.useMemoryOnly && this.redisCache) {
      try {
        const compressedData = await this.compress(entry);
        const ttl = Math.floor((options.ttl || this.config.redisTtl * 1000) / 1000);

        if (ttl > 0) {
          await this.redisCache.setex(cacheKey, ttl, compressedData);
        } else {
          await this.redisCache.set(cacheKey, compressedData);
        }

        // Add tags for selective invalidation
        if (options.tags && options.tags.length > 0) {
          const tagKey = `${this.config.redisKeyPrefix}tags:${options.tags.join(':')}`;
          await this.redisCache.sadd(tagKey, cacheKey);
          await this.redisCache.expire(tagKey, ttl > 0 ? ttl : this.config.redisTtl);
        }

        this.log('REDIS_CACHE_SET', { key: cacheKey, ttl, tags: options.tags });
      } catch (error) {
        this.log('REDIS_SET_ERROR', { key: cacheKey, error: (error as Error).message });
      }
    }
  }

  public async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateCacheKey(key, options.organization);

    // Delete from memory cache
    if (this.memoryCache) {
      this.memoryCache.delete(cacheKey);
      this.stats.memoryCache.size = this.memoryCache.size;
    }

    // Delete from Redis cache
    if (this.redisCache) {
      try {
        await this.redisCache.del(cacheKey);
        this.log('CACHE_DELETED', { key: cacheKey });
      } catch (error) {
        this.log('REDIS_DELETE_ERROR', { key: cacheKey, error: (error as Error).message });
      }
    }
  }

  public async clear(organization?: string): Promise<void> {
    // Clear memory cache
    if (this.memoryCache) {
      if (organization) {
        // Clear specific organization entries
        const keysToDelete: string[] = [];
        for (const [key] of this.memoryCache.entries()) {
          if (key.startsWith(`${organization}:`)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache!.delete(key));
      } else {
        this.memoryCache.clear();
      }
      this.stats.memoryCache.size = this.memoryCache.size;
    }

    // Clear Redis cache
    if (this.redisCache) {
      try {
        if (organization) {
          const pattern = `${this.config.redisKeyPrefix}${organization}:*`;
          const keys = await this.redisCache.keys(pattern);
          if (keys.length > 0) {
            await this.redisCache.del(...keys);
          }
        } else {
          const pattern = `${this.config.redisKeyPrefix}*`;
          const keys = await this.redisCache.keys(pattern);
          if (keys.length > 0) {
            await this.redisCache.del(...keys);
          }
        }
        this.log('CACHE_CLEARED', { organization });
      } catch (error) {
        this.log('REDIS_CLEAR_ERROR', { organization, error: (error as Error).message });
      }
    }
  }

  public async invalidateByTags(tags: string[]): Promise<void> {
    if (!this.redisCache || tags.length === 0) return;

    try {
      const tagKey = `${this.config.redisKeyPrefix}tags:${tags.join(':')}`;
      const keys = await this.redisCache.smembers(tagKey);

      if (keys.length > 0) {
        // Delete tagged keys
        await this.redisCache.del(...keys);

        // Delete from memory cache too
        if (this.memoryCache) {
          keys.forEach(key => {
            const memoryKey = key.replace(this.config.redisKeyPrefix, '');
            this.memoryCache!.delete(memoryKey);
          });
          this.stats.memoryCache.size = this.memoryCache.size;
        }

        // Delete the tag set itself
        await this.redisCache.del(tagKey);

        this.log('CACHE_INVALIDATED_BY_TAGS', { tags, keysDeleted: keys.length });
      }
    } catch (error) {
      this.log('REDIS_TAG_INVALIDATION_ERROR', { tags, error: (error as Error).message });
    }
  }

  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key, options.organization);

    // Check memory cache first
    if (this.memoryCache && this.memoryCache.has(cacheKey)) {
      return true;
    }

    // Check Redis cache
    if (this.redisCache) {
      try {
        const exists = await this.redisCache.exists(cacheKey);
        return exists === 1;
      } catch (error) {
        this.log('REDIS_EXISTS_ERROR', { key: cacheKey, error: (error as Error).message });
      }
    }

    return false;
  }

  public async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    const cacheKey = this.generateCacheKey(key, options.organization);

    // Check Redis TTL (memory cache TTL is handled internally by LRU)
    if (this.redisCache) {
      try {
        const ttl = await this.redisCache.ttl(cacheKey);
        return ttl * 1000; // Convert to milliseconds
      } catch (error) {
        this.log('REDIS_TTL_ERROR', { key: cacheKey, error: (error as Error).message });
      }
    }

    return -1;
  }

  private updateHitRates(): void {
    // Memory cache hit rate
    const memoryTotal = this.stats.memoryCache.hits + this.stats.memoryCache.misses;
    this.stats.memoryCache.hitRate = memoryTotal > 0 ? this.stats.memoryCache.hits / memoryTotal : 0;

    // Redis cache hit rate
    const redisTotal = this.stats.redisCache.hits + this.stats.redisCache.misses;
    this.stats.redisCache.hitRate = redisTotal > 0 ? this.stats.redisCache.hits / redisTotal : 0;

    // Total hit rate
    const totalRequests = this.stats.totalHits + this.stats.totalMisses;
    this.stats.totalHitRate = totalRequests > 0 ? this.stats.totalHits / totalRequests : 0;
  }

  public getStats(): CacheStats {
    this.updateHitRates();
    return { ...this.stats };
  }

  public async getDetailedStats(): Promise<CacheStats & { redisMemoryUsage?: number }> {
    const stats = this.getStats();

    if (this.redisCache) {
      try {
        const info = await this.redisCache.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          (stats as any).redisMemoryUsage = parseInt(memoryMatch[1]);
        }

        const keyCount = await this.redisCache.dbsize();
        stats.redisCache.keys = keyCount;
      } catch (error) {
        this.log('REDIS_STATS_ERROR', { error: (error as Error).message });
      }
    }

    return stats;
  }

  public resetStats(): void {
    this.stats = {
      memoryCache: {
        size: this.memoryCache?.size || 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        maxSize: this.config.memoryMaxSize,
      },
      redisCache: {
        connected: this.stats.redisCache.connected,
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      totalHits: 0,
      totalMisses: 0,
      totalHitRate: 0,
    };

    this.log('STATS_RESET', {});
  }

  public isRedisConnected(): boolean {
    return this.stats.redisCache.connected;
  }

  public async disconnect(): Promise<void> {
    if (this.redisCache) {
      await this.redisCache.disconnect();
      this.log('REDIS_DISCONNECTED', {});
    }
  }

  public updateConfig(newConfig: Partial<CacheConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Reinitialize memory cache if settings changed
    if (
      newConfig.memoryMaxSize !== undefined ||
      newConfig.memoryTtl !== undefined ||
      newConfig.enableMemoryCache !== undefined
    ) {
      this.initializeMemoryCache();
    }

    this.log('CONFIG_UPDATED', { oldConfig, newConfig: this.config });
  }
}

// Export a default instance
export default new HuggingFaceCacheService();