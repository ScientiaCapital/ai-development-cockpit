import { HuggingFaceCacheService } from '../../../src/services/huggingface/cache.service';

// Mock Redis
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  flushall: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe('HuggingFaceCacheService', () => {
  let cacheService: HuggingFaceCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();
    cacheService = new HuggingFaceCacheService();
    // Don't actually connect to Redis in tests
  });

  afterEach(async () => {
    if (cacheService) {
      await cacheService.disconnect();
    }
  });

  describe('LRU cache operations', () => {
    it('should store and retrieve data from LRU cache', async () => {
      const testData = { models: ['model1', 'model2'] };

      await cacheService.set('test-key', testData, { ttl: 300 });
      const result = await cacheService.get('test-key');

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should respect TTL in LRU cache', async () => {
      jest.useFakeTimers();

      const testData = { test: 'data' };
      await cacheService.set('test-key', testData, { ttl: 1 }); // 1 second TTL

      // Initially should exist
      let result = await cacheService.get('test-key');
      expect(result).toEqual(testData);

      // Fast forward time past TTL
      jest.advanceTimersByTime(2000);

      // Should be expired
      result = await cacheService.get('test-key');
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should handle LRU eviction', async () => {
      // Fill cache beyond max size (500 items)
      for (let i = 0; i < 510; i++) {
        await cacheService.set(`key-${i}`, { data: i }, { ttl: 300 });
      }

      // First items should be evicted
      const result = await cacheService.get('key-0');
      expect(result).toBeNull();

      // Recent items should still exist
      const recentResult = await cacheService.get('key-509');
      expect(recentResult).toEqual({ data: 509 });
    });
  });

  describe('Redis cache operations', () => {
    it('should store and retrieve data from Redis when redis is true', async () => {
      const testData = { models: ['model1', 'model2'] };
      const compressedData = JSON.stringify(testData); // Simplified compression mock

      mockRedisClient.get.mockResolvedValue(compressedData);
      mockRedisClient.set.mockResolvedValue('OK');

      await cacheService.set('test-key', testData, { ttl: 300, redis: true });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'hf:test-key',
        expect.any(String),
        'EX',
        300
      );

      const result = await cacheService.get('test-key', { redis: true });
      expect(mockRedisClient.get).toHaveBeenCalledWith('hf:test-key');
    });

    it('should handle Redis connection errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      // Should fall back to LRU cache
      const testData = { test: 'data' };
      await cacheService.set('test-key', testData, { ttl: 300 });

      const result = await cacheService.get('test-key', { redis: true });
      expect(result).toEqual(testData);
    });

    it('should handle Redis set errors gracefully', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis set failed'));

      const testData = { test: 'data' };

      // Should not throw, but log error
      await expect(
        cacheService.set('test-key', testData, { ttl: 300, redis: true })
      ).resolves.not.toThrow();
    });
  });

  describe('tag-based invalidation', () => {
    it('should associate tags with cache entries', async () => {
      const testData = { models: ['model1'] };

      await cacheService.set('models:search:1', testData, {
        ttl: 300,
        tags: ['models', 'search']
      });

      // Data should be accessible
      const result = await cacheService.get('models:search:1');
      expect(result).toEqual(testData);
    });

    it('should invalidate cache entries by tags', async () => {
      const testData1 = { models: ['model1'] };
      const testData2 = { deployments: ['dep1'] };

      await cacheService.set('models:1', testData1, {
        ttl: 300,
        tags: ['models', 'swaggystacks']
      });

      await cacheService.set('deployments:1', testData2, {
        ttl: 300,
        tags: ['deployments', 'swaggystacks']
      });

      // Both should exist initially
      expect(await cacheService.get('models:1')).toEqual(testData1);
      expect(await cacheService.get('deployments:1')).toEqual(testData2);

      // Invalidate by tag
      await cacheService.invalidateByTags(['models']);

      // Models should be gone, deployments should remain
      expect(await cacheService.get('models:1')).toBeNull();
      expect(await cacheService.get('deployments:1')).toEqual(testData2);
    });

    it('should invalidate Redis entries by tags', async () => {
      const testData = { models: ['model1'] };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));
      mockRedisClient.del.mockResolvedValue(1);

      await cacheService.set('models:1', testData, {
        ttl: 300,
        redis: true,
        tags: ['models']
      });

      await cacheService.invalidateByTags(['models']);

      // Should attempt to delete from Redis
      expect(mockRedisClient.del).toHaveBeenCalled();
    });
  });

  describe('organization-specific caching', () => {
    it('should handle organization-specific cache keys', async () => {
      const swaggyData = { models: ['gaming-model'] };
      const scientiaData = { models: ['enterprise-model'] };

      await cacheService.set('models:swaggystacks', swaggyData, {
        ttl: 300,
        tags: ['models', 'swaggystacks']
      });

      await cacheService.set('models:scientia', scientiaData, {
        ttl: 300,
        tags: ['models', 'scientia-capital']
      });

      expect(await cacheService.get('models:swaggystacks')).toEqual(swaggyData);
      expect(await cacheService.get('models:scientia')).toEqual(scientiaData);

      // Invalidate only SwaggyStacks
      await cacheService.invalidateByTags(['swaggystacks']);

      expect(await cacheService.get('models:swaggystacks')).toBeNull();
      expect(await cacheService.get('models:scientia')).toEqual(scientiaData);
    });
  });

  describe('compression', () => {
    it('should handle large data objects', async () => {
      // Create large test data
      const largeData = {
        models: Array(1000).fill(0).map((_, i) => ({
          id: `model-${i}`,
          name: `Test Model ${i}`,
          description: 'A'.repeat(100), // Large description
          parameters: Array(50).fill(0).map((_, j) => `param-${j}`)
        }))
      };

      await cacheService.set('large-data', largeData, { ttl: 300, redis: true });
      const result = await cacheService.get('large-data', { redis: true });

      // Data should be preserved (assuming Redis is working)
      expect(Array.isArray(result?.models)).toBe(true);
    });
  });

  describe('cache statistics', () => {
    it('should track cache statistics', async () => {
      // Perform some cache operations
      await cacheService.set('key1', { data: 1 }, { ttl: 300 });
      await cacheService.set('key2', { data: 2 }, { ttl: 300 });

      await cacheService.get('key1'); // hit
      await cacheService.get('key2'); // hit
      await cacheService.get('key3'); // miss

      const stats = cacheService.getStats();

      expect(stats.lru.size).toBe(2);
      expect(stats.lru.hits).toBe(2);
      expect(stats.lru.misses).toBe(1);
      expect(stats.lru.hitRate).toBe(2/3);
    });

    it('should reset statistics', async () => {
      await cacheService.set('key1', { data: 1 }, { ttl: 300 });
      await cacheService.get('key1');

      cacheService.resetStats();

      const stats = cacheService.getStats();
      expect(stats.lru.hits).toBe(0);
      expect(stats.lru.misses).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed data gracefully', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json');

      const result = await cacheService.get('malformed-key', { redis: true });
      expect(result).toBeNull();
    });

    it('should handle undefined/null data', async () => {
      await cacheService.set('null-key', null, { ttl: 300 });
      await cacheService.set('undefined-key', undefined, { ttl: 300 });

      expect(await cacheService.get('null-key')).toBeNull();
      expect(await cacheService.get('undefined-key')).toBeNull();
    });
  });

  describe('cleanup and disconnection', () => {
    it('should clear all caches', async () => {
      await cacheService.set('key1', { data: 1 }, { ttl: 300 });
      await cacheService.set('key2', { data: 2 }, { ttl: 300 });

      await cacheService.clear();

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
    });

    it('should disconnect gracefully', async () => {
      await cacheService.disconnect();
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });
});