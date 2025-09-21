import { HuggingFaceRateLimiter } from '../../../src/services/huggingface/rate-limiter';

describe('HuggingFaceRateLimiter', () => {
  let rateLimiter: HuggingFaceRateLimiter;

  beforeEach(() => {
    rateLimiter = new HuggingFaceRateLimiter();
  });

  afterEach(() => {
    // Clear all limiter state
    rateLimiter.clearAll();
  });

  describe('basic scheduling', () => {
    it('should schedule and execute tasks', async () => {
      const mockTask = jest.fn().mockResolvedValue('result');

      const result = await rateLimiter.schedule(
        'swaggystacks',
        mockTask,
        { priority: 5 }
      );

      expect(result).toBe('result');
      expect(mockTask).toHaveBeenCalledTimes(1);
    });

    it('should handle task errors', async () => {
      const mockTask = jest.fn().mockRejectedValue(new Error('Task failed'));

      await expect(
        rateLimiter.schedule('swaggystacks', mockTask, { priority: 5 })
      ).rejects.toThrow('Task failed');
    });
  });

  describe('organization-specific limits', () => {
    it('should use SwaggyStacks configuration', async () => {
      const mockTask = jest.fn().mockResolvedValue('result');
      const startTime = Date.now();

      // Execute multiple tasks quickly
      const promises = Array(3).fill(0).map(() =>
        rateLimiter.schedule('swaggystacks', mockTask, { priority: 5 })
      );

      await Promise.all(promises);
      const endTime = Date.now();

      expect(mockTask).toHaveBeenCalledTimes(3);
      // SwaggyStacks has minTime of 100ms, so should be faster than ScientiaCapital
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should use ScientiaCapital configuration', async () => {
      const mockTask = jest.fn().mockResolvedValue('result');
      const startTime = Date.now();

      // Execute multiple tasks
      const promises = Array(3).fill(0).map(() =>
        rateLimiter.schedule('scientia-capital', mockTask, { priority: 5 })
      );

      await Promise.all(promises);
      const endTime = Date.now();

      expect(mockTask).toHaveBeenCalledTimes(3);
      // ScientiaCapital has minTime of 200ms, so should be slower
      expect(endTime - startTime).toBeGreaterThan(200);
    });

    it('should use default configuration for unknown organizations', async () => {
      const mockTask = jest.fn().mockResolvedValue('result');

      const result = await rateLimiter.schedule(
        'unknown-org',
        mockTask,
        { priority: 5 }
      );

      expect(result).toBe('result');
      expect(mockTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('priority handling', () => {
    it('should handle high priority tasks', async () => {
      const normalTask = jest.fn().mockResolvedValue('normal');
      const highPriorityTask = jest.fn().mockResolvedValue('high');

      // Schedule high priority task
      const highResult = await rateLimiter.schedule(
        'swaggystacks',
        highPriorityTask,
        { priority: 9 }
      );

      // Schedule normal priority task
      const normalResult = await rateLimiter.schedule(
        'swaggystacks',
        normalTask,
        { priority: 5 }
      );

      expect(highResult).toBe('high');
      expect(normalResult).toBe('normal');
      expect(highPriorityTask).toHaveBeenCalledTimes(1);
      expect(normalTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('rate limit updates', () => {
    it('should update rate limits from response headers', () => {
      const rateLimitInfo = {
        limit: 1000,
        remaining: 999,
        reset: Math.floor(Date.now() / 1000) + 3600,
        resetDate: new Date(Date.now() + 3600000),
      };

      // Should not throw
      expect(() => {
        rateLimiter.updateRateLimitFromResponse('swaggystacks', rateLimitInfo);
      }).not.toThrow();
    });

    it('should handle rate limit warnings', () => {
      const rateLimitInfo = {
        limit: 1000,
        remaining: 50, // Low remaining count
        reset: Math.floor(Date.now() / 1000) + 3600,
        resetDate: new Date(Date.now() + 3600000),
      };

      // Should not throw
      expect(() => {
        rateLimiter.updateRateLimitFromResponse('swaggystacks', rateLimitInfo);
      }).not.toThrow();
    });

    it('should handle rate limit exceeded', () => {
      const rateLimitInfo = {
        limit: 1000,
        remaining: 0, // Exceeded
        reset: Math.floor(Date.now() / 1000) + 3600,
        resetDate: new Date(Date.now() + 3600000),
      };

      // Should not throw
      expect(() => {
        rateLimiter.updateRateLimitFromResponse('swaggystacks', rateLimitInfo);
      }).not.toThrow();
    });
  });

  describe('statistics', () => {
    it('should return statistics for all organizations', async () => {
      const mockTask = jest.fn().mockResolvedValue('result');

      // Execute some tasks
      await rateLimiter.schedule('swaggystacks', mockTask, { priority: 5 });
      await rateLimiter.schedule('scientia-capital', mockTask, { priority: 5 });

      const stats = rateLimiter.getStatistics();

      expect(stats).toHaveProperty('swaggystacks');
      expect(stats).toHaveProperty('scientia-capital');
      expect(stats.swaggystacks.executed).toBe(1);
      expect(stats['scientia-capital'].executed).toBe(1);
    });

    it('should return statistics for specific organization', async () => {
      const mockTask = jest.fn().mockResolvedValue('result');

      await rateLimiter.schedule('swaggystacks', mockTask, { priority: 5 });

      const stats = rateLimiter.getStatistics('swaggystacks');

      expect(stats).toHaveProperty('swaggystacks');
      expect(stats).not.toHaveProperty('scientia-capital');
      expect(stats.swaggystacks.executed).toBe(1);
    });
  });

  describe('concurrent limits', () => {
    it('should respect concurrent limits for SwaggyStacks', async () => {
      const mockTask = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('result'), 200))
      );

      const startTime = Date.now();

      // Schedule more tasks than concurrent limit (10 for SwaggyStacks)
      const promises = Array(15).fill(0).map(() =>
        rateLimiter.schedule('swaggystacks', mockTask, { priority: 5 })
      );

      await Promise.all(promises);
      const endTime = Date.now();

      expect(mockTask).toHaveBeenCalledTimes(15);
      // Should take some time due to concurrent limits
      expect(endTime - startTime).toBeGreaterThan(200);
    });

    it('should respect concurrent limits for ScientiaCapital', async () => {
      const mockTask = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('result'), 200))
      );

      const startTime = Date.now();

      // Schedule more tasks than concurrent limit (5 for ScientiaCapital)
      const promises = Array(8).fill(0).map(() =>
        rateLimiter.schedule('scientia-capital', mockTask, { priority: 5 })
      );

      await Promise.all(promises);
      const endTime = Date.now();

      expect(mockTask).toHaveBeenCalledTimes(8);
      // Should take longer than SwaggyStacks due to lower concurrent limit
      expect(endTime - startTime).toBeGreaterThan(400);
    });
  });

  describe('error scenarios', () => {
    it('should handle bottleneck errors gracefully', async () => {
      const mockTask = jest.fn().mockRejectedValue(new Error('Bottleneck error'));

      await expect(
        rateLimiter.schedule('swaggystacks', mockTask, { priority: 5 })
      ).rejects.toThrow('Bottleneck error');
    });

    it('should continue working after errors', async () => {
      const failingTask = jest.fn().mockRejectedValue(new Error('Task failed'));
      const successTask = jest.fn().mockResolvedValue('success');

      // First task fails
      await expect(
        rateLimiter.schedule('swaggystacks', failingTask, { priority: 5 })
      ).rejects.toThrow('Task failed');

      // Second task should still work
      const result = await rateLimiter.schedule('swaggystacks', successTask, { priority: 5 });
      expect(result).toBe('success');
    });
  });
});