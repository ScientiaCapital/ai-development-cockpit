import { HuggingFaceCircuitBreaker } from '../../../src/services/huggingface/circuit-breaker';

describe('HuggingFaceCircuitBreaker', () => {
  let circuitBreaker: HuggingFaceCircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new HuggingFaceCircuitBreaker();
  });

  afterEach(() => {
    // Clear all breakers
    circuitBreaker.clearAll();
  });

  describe('circuit breaker creation', () => {
    it('should create a circuit breaker with default config', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = circuitBreaker.createBreaker('test-breaker', mockAction);

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('test-breaker');
    });

    it('should create a circuit breaker with custom config', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = circuitBreaker.createBreaker('custom-breaker', mockAction, {
        threshold: 3,
        timeout: 30000,
        resetTimeout: 10000,
        name: 'custom-breaker',
      });

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('custom-breaker');
    });

    it('should reuse existing circuit breakers', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker1 = circuitBreaker.createBreaker('same-name', mockAction);
      const breaker2 = circuitBreaker.createBreaker('same-name', mockAction);

      expect(breaker1).toBe(breaker2);
    });
  });

  describe('circuit breaker execution', () => {
    it('should execute action successfully', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      circuitBreaker.createBreaker('test-breaker', mockAction);

      const result = await circuitBreaker.execute('test-breaker', 'arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockAction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should throw error for non-existent breaker', async () => {
      await expect(
        circuitBreaker.execute('non-existent', 'arg')
      ).rejects.toThrow('Circuit breaker \'non-existent\' not found');
    });

    it('should handle action failures', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Action failed'));

      circuitBreaker.createBreaker('failing-breaker', mockAction);

      await expect(
        circuitBreaker.execute('failing-breaker')
      ).rejects.toThrow('Action failed');
    });
  });

  describe('circuit breaker states', () => {
    it('should open circuit after threshold failures', async () => {
      let callCount = 0;
      const mockAction = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error(`Failure ${callCount}`));
      });

      const breaker = circuitBreaker.createBreaker('threshold-breaker', mockAction, {
        threshold: 3,
        timeout: 1000,
        resetTimeout: 5000,
      });

      // Make failures to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('threshold-breaker');
        } catch (error: unknown) {
          // Expected failures
        }
      }

      // Circuit should be open now
      expect(breaker.opened).toBe(true);

      // Next call should fail fast without calling action
      await expect(
        circuitBreaker.execute('threshold-breaker')
      ).rejects.toThrow();

      // Action should not be called again (still 3 times)
      expect(mockAction).toHaveBeenCalledTimes(3);
    });

    it('should move to half-open state after reset timeout', async () => {
      jest.useFakeTimers();

      const mockAction = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockRejectedValueOnce(new Error('Failure 3'))
        .mockResolvedValueOnce('success');

      const breaker = circuitBreaker.createBreaker('reset-breaker', mockAction, {
        threshold: 3,
        timeout: 1000,
        resetTimeout: 5000,
      });

      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('reset-breaker');
        } catch (error: unknown) {
          // Expected failures
        }
      }

      expect(breaker.opened).toBe(true);

      // Fast forward past reset timeout
      jest.advanceTimersByTime(6000);

      // Circuit should allow one test call (half-open state)
      const result = await circuitBreaker.execute('reset-breaker');
      expect(result).toBe('success');
      expect(breaker.opened).toBe(false); // Should be closed again

      jest.useRealTimers();
    });

    it('should provide circuit breaker statistics', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = circuitBreaker.createBreaker('stats-breaker', mockAction);

      const stats = circuitBreaker.getStats('stats-breaker');

      expect(stats).toEqual({
        name: 'stats-breaker',
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        timeouts: 0,
        rejectCount: 0,
        nextAttempt: null,
      });
    });

    it('should return stats for all breakers', async () => {
      const mockAction1 = jest.fn().mockResolvedValue('success1');
      const mockAction2 = jest.fn().mockResolvedValue('success2');

      circuitBreaker.createBreaker('breaker1', mockAction1);
      circuitBreaker.createBreaker('breaker2', mockAction2);

      await circuitBreaker.execute('breaker1');
      await circuitBreaker.execute('breaker2');

      const allStats = circuitBreaker.getAllStats();

      expect(allStats).toHaveProperty('breaker1');
      expect(allStats).toHaveProperty('breaker2');
      expect(allStats.breaker1.successes).toBe(1);
      expect(allStats.breaker2.successes).toBe(1);
    });
  });

  describe('organization-specific configurations', () => {
    it('should use AI Dev Cockpit configuration', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = circuitBreaker.createBreaker(
        'arcade-breaker',
        mockAction,
        undefined,
        'arcade'
      );

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('arcade-breaker');
    });

    it('should use ScientiaCapital configuration', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = circuitBreaker.createBreaker(
        'scientia-breaker',
        mockAction,
        undefined,
        'scientia-capital'
      );

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('scientia-breaker');
    });

    it('should use default configuration for unknown organization', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = circuitBreaker.createBreaker(
        'unknown-org-breaker',
        mockAction,
        undefined,
        'unknown-org'
      );

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('unknown-org-breaker');
    });
  });

  describe('fallback mechanisms', () => {
    it('should execute fallback when circuit is open', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Always fails'));
      const fallback = jest.fn().mockResolvedValue('fallback-result');

      const breaker = circuitBreaker.createBreaker('fallback-breaker', mockAction, {
        threshold: 2,
        timeout: 1000,
        resetTimeout: 5000,
        fallback,
      });

      // Trigger failures to open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute('fallback-breaker');
        } catch (error: unknown) {
          // Expected failures
        }
      }

      expect(breaker.opened).toBe(true);

      // Next call should use fallback
      const result = await circuitBreaker.execute('fallback-breaker');
      expect(result).toBe('fallback-result');
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('health checks', () => {
    it('should perform health checks', async () => {
      const mockHealthCheck = jest.fn().mockResolvedValue(true);

      circuitBreaker.setHealthCheck('api-health', mockHealthCheck);

      const result = await circuitBreaker.healthCheck('api-health');
      expect(result).toBe(true);
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it('should handle health check failures', async () => {
      const mockHealthCheck = jest.fn().mockRejectedValue(new Error('Health check failed'));

      circuitBreaker.setHealthCheck('failing-health', mockHealthCheck);

      const result = await circuitBreaker.healthCheck('failing-health');
      expect(result).toBe(false);
    });

    it('should return overall health status', async () => {
      const healthyCheck = jest.fn().mockResolvedValue(true);
      const unhealthyCheck = jest.fn().mockResolvedValue(false);

      circuitBreaker.setHealthCheck('healthy', healthyCheck);
      circuitBreaker.setHealthCheck('unhealthy', unhealthyCheck);

      const overallHealth = await circuitBreaker.getOverallHealth();

      expect(overallHealth.healthy).toBe(false); // One check failed
      expect(overallHealth.checks).toHaveProperty('healthy');
      expect(overallHealth.checks).toHaveProperty('unhealthy');
      expect(overallHealth.checks.healthy).toBe(true);
      expect(overallHealth.checks.unhealthy).toBe(false);
    });
  });

  describe('timeout handling', () => {
    it('should handle action timeouts', async () => {
      const slowAction = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('too-slow'), 2000))
      );

      const breaker = circuitBreaker.createBreaker('timeout-breaker', slowAction, {
        timeout: 500, // Short timeout
        threshold: 3,
      });

      await expect(
        circuitBreaker.execute('timeout-breaker')
      ).rejects.toThrow(); // Should timeout

      const stats = circuitBreaker.getStats('timeout-breaker');
      expect(stats.timeouts).toBe(1);
    });
  });

  describe('error scenarios', () => {
    it('should handle breaker creation errors gracefully', () => {
      // Try to create breaker with invalid config
      const mockAction = jest.fn();

      expect(() => {
        circuitBreaker.createBreaker('error-breaker', mockAction, {
          threshold: -1, // Invalid threshold
        } as any);
      }).not.toThrow(); // Opossum handles invalid configs gracefully
    });

    it('should handle execution with undefined arguments', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      circuitBreaker.createBreaker('undefined-args-breaker', mockAction);

      const result = await circuitBreaker.execute('undefined-args-breaker', undefined, null);
      expect(result).toBe('success');
      expect(mockAction).toHaveBeenCalledWith(undefined, null);
    });
  });

  describe('cleanup', () => {
    it('should clear all circuit breakers', () => {
      const mockAction = jest.fn();

      circuitBreaker.createBreaker('breaker1', mockAction);
      circuitBreaker.createBreaker('breaker2', mockAction);

      let allStats = circuitBreaker.getAllStats();
      expect(Object.keys(allStats)).toHaveLength(2);

      circuitBreaker.clearAll();

      allStats = circuitBreaker.getAllStats();
      expect(Object.keys(allStats)).toHaveLength(0);
    });
  });
});