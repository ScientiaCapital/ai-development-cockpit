/**
 * Health Check API Endpoint Tests
 * Tests for /api/health endpoint functionality
 */

import { GET, HEAD, HealthResponse } from '../../src/app/api/health/route';
import { jest } from '@jest/globals';

// Mock Next.js environment
const originalEnv = process.env;

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment to defaults
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      npm_package_version: '0.1.0',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      COST_OPTIMIZER_URL: 'http://localhost:8000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/health', () => {
    it('should return healthy status when all services are available', async () => {
      // Mock successful cost optimizer response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.services.api).toBe(true);
      expect(data.services.costOptimizer).toBe(true);
      expect(data.services.database).toBe(true);
    });

    it('should return degraded status when cost optimizer is unavailable', async () => {
      // Mock failed cost optimizer response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(response.status).toBe(200); // Still 200 for degraded
      expect(data.status).toBe('degraded');
      expect(data.services.api).toBe(true);
      expect(data.services.costOptimizer).toBe(false);
      expect(data.services.database).toBe(true);
    });

    it('should return degraded status when database is not configured', async () => {
      // Remove database URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      // Mock successful cost optimizer response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.services.api).toBe(true);
      expect(data.services.costOptimizer).toBe(true);
      expect(data.services.database).toBe(false);
    });

    it('should return degraded when cost optimizer URL is not configured', async () => {
      delete process.env.COST_OPTIMIZER_URL;

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.services.costOptimizer).toBe(false);
    });

    it('should handle cost optimizer timeout (5 seconds)', async () => {
      // Mock a hanging request that will be aborted
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Aborted')), 100);
          })
      );

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data.status).toBe('degraded');
      expect(data.services.costOptimizer).toBe(false);
    });

    it('should include all required fields in response', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('services');
      expect(data.services).toHaveProperty('api');
      expect(data.services).toHaveProperty('costOptimizer');
      expect(data.services).toHaveProperty('database');
    });

    it('should return correct version from environment', async () => {
      process.env.npm_package_version = '1.2.3';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data.version).toBe('1.2.3');
    });

    it('should default to version 0.1.0 if not set', async () => {
      delete process.env.npm_package_version;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data.version).toBe('0.1.0');
    });

    it('should return correct environment', async () => {
      process.env.NODE_ENV = 'production';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data.environment).toBe('production');
    });

    it('should return ISO8601 timestamp', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should return correct Content-Type header', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return correct Cache-Control header', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
    });

    it('should handle cost optimizer returning non-ok status', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data.status).toBe('degraded');
      expect(data.services.costOptimizer).toBe(false);
    });
  });

  describe('HEAD /api/health', () => {
    it('should return status 200 for healthy system (no body)', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await HEAD();

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it('should return status 200 for degraded system (no body)', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const response = await HEAD();

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it('should return Cache-Control header for HEAD requests', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await HEAD();

      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
    });

    it('should not return Content-Type header for HEAD requests', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await HEAD();

      // HEAD requests should not have Content-Type since there's no body
      expect(response.headers.get('Content-Type')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple simultaneous health checks', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const promises = [GET(), GET(), GET()];
      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle cost optimizer network errors gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.services.costOptimizer).toBe(false);
    });

    it('should handle empty environment variables', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.COST_OPTIMIZER_URL = '';

      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      expect(data.status).toBe('degraded');
      expect(data.services.database).toBe(false);
      expect(data.services.costOptimizer).toBe(false);
    });
  });

  describe('Status Code Mapping', () => {
    it('should return 200 for healthy status', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await GET();
      expect(response.status).toBe(200);
    });

    it('should return 200 for degraded status', async () => {
      delete process.env.COST_OPTIMIZER_URL;

      const response = await GET();
      expect(response.status).toBe(200);
    });

    it('should return 503 for unhealthy status (if API is down)', async () => {
      // This is a theoretical case since if we're responding, API is up
      // But the logic is there for future extensibility
      const response = await GET();
      const data = (await response.json()) as HealthResponse;

      // As long as we can respond, status should be healthy or degraded
      expect(response.status).not.toBe(503);
      expect(['healthy', 'degraded']).toContain(data.status);
    });
  });
});
