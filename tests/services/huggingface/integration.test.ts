import { HuggingFaceIntegrationService } from '../../../src/services/huggingface/integration.service';
import { DeploymentStatus } from '../../../src/types/deployment';

// Mock all the services
jest.mock('../../../src/services/huggingface/api-client');
jest.mock('../../../src/services/huggingface/rate-limiter');
jest.mock('../../../src/services/huggingface/cache.service');
jest.mock('../../../src/services/huggingface/webhook.service');
jest.mock('../../../src/services/huggingface/circuit-breaker');
jest.mock('../../../src/services/huggingface/credentials.service');

import { HuggingFaceApiClient } from '../../../src/services/huggingface/api-client';
import { HuggingFaceRateLimiter } from '../../../src/services/huggingface/rate-limiter';
import { HuggingFaceCacheService } from '../../../src/services/huggingface/cache.service';
import { HuggingFaceWebhookService } from '../../../src/services/huggingface/webhook.service';
import { HuggingFaceCircuitBreaker } from '../../../src/services/huggingface/circuit-breaker';
import { HuggingFaceCredentialsService } from '../../../src/services/huggingface/credentials.service';

describe('HuggingFaceIntegrationService', () => {
  let integrationService: HuggingFaceIntegrationService;
  let mockApiClient: jest.Mocked<HuggingFaceApiClient>;
  let mockRateLimiter: jest.Mocked<HuggingFaceRateLimiter>;
  let mockCacheService: jest.Mocked<HuggingFaceCacheService>;
  let mockWebhookService: jest.Mocked<HuggingFaceWebhookService>;
  let mockCircuitBreaker: jest.Mocked<HuggingFaceCircuitBreaker>;
  let mockCredentialsService: jest.Mocked<HuggingFaceCredentialsService>;

  beforeEach(() => {
    // Create mock instances
    mockApiClient = {
      request: jest.fn(),
    } as any;

    mockRateLimiter = {
      schedule: jest.fn(),
      updateRateLimitFromResponse: jest.fn(),
      getStatistics: jest.fn(),
      clearAll: jest.fn(),
    } as any;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      invalidateByTags: jest.fn(),
      getStats: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    mockWebhookService = {
      registerHandler: jest.fn(),
      onModelUpdate: jest.fn(),
      onDeploymentStatus: jest.fn(),
      getStats: jest.fn(),
      processWebhook: jest.fn(),
    } as any;

    mockCircuitBreaker = {
      createBreaker: jest.fn(),
      execute: jest.fn(),
      getStats: jest.fn(),
      getAllStats: jest.fn(),
      healthCheck: jest.fn(),
      getOverallHealth: jest.fn(),
    } as any;

    mockCredentialsService = {
      getCredentials: jest.fn(),
      validateCredentials: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

    // Mock constructors to return our mocks
    (HuggingFaceApiClient as jest.MockedClass<typeof HuggingFaceApiClient>).mockImplementation(() => mockApiClient);
    (HuggingFaceRateLimiter as jest.MockedClass<typeof HuggingFaceRateLimiter>).mockImplementation(() => mockRateLimiter);
    (HuggingFaceCacheService as jest.MockedClass<typeof HuggingFaceCacheService>).mockImplementation(() => mockCacheService);
    (HuggingFaceWebhookService as jest.MockedClass<typeof HuggingFaceWebhookService>).mockImplementation(() => mockWebhookService);
    (HuggingFaceCircuitBreaker as jest.MockedClass<typeof HuggingFaceCircuitBreaker>).mockImplementation(() => mockCircuitBreaker);
    (HuggingFaceCredentialsService as jest.MockedClass<typeof HuggingFaceCredentialsService>).mockImplementation(() => mockCredentialsService);

    integrationService = new HuggingFaceIntegrationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize all services', () => {
      expect(HuggingFaceApiClient).toHaveBeenCalled();
      expect(HuggingFaceRateLimiter).toHaveBeenCalled();
      expect(HuggingFaceCacheService).toHaveBeenCalled();
      expect(HuggingFaceWebhookService).toHaveBeenCalled();
      expect(HuggingFaceCircuitBreaker).toHaveBeenCalled();
      expect(HuggingFaceCredentialsService).toHaveBeenCalled();
    });

    it('should register webhook handlers', () => {
      expect(mockWebhookService.onModelUpdate).toHaveBeenCalled();
      expect(mockWebhookService.onDeploymentStatus).toHaveBeenCalled();
    });

    it('should create circuit breakers', () => {
      expect(mockCircuitBreaker.createBreaker).toHaveBeenCalledWith(
        'models-api',
        expect.any(Function),
        expect.any(Object),
        undefined
      );
      expect(mockCircuitBreaker.createBreaker).toHaveBeenCalledWith(
        'deployments-api',
        expect.any(Function),
        expect.any(Object),
        undefined
      );
    });
  });

  describe('model search', () => {
    it('should search models with caching', async () => {
      const mockModels = [
        { id: 'model1', name: 'Test Model 1' },
        { id: 'model2', name: 'Test Model 2' },
      ];

      // Mock cache miss
      mockCacheService.get.mockResolvedValue(null);

      // Mock API response
      mockRateLimiter.schedule.mockResolvedValue({
        data: mockModels,
        status: 200,
        headers: new Headers(),
        rateLimitInfo: {
          limit: 1000,
          remaining: 999,
          reset: Date.now() + 3600,
          resetDate: new Date(Date.now() + 3600000),
        },
      });

      const result = await integrationService.searchModels({
        organization: 'swaggystacks',
        query: 'test',
        limit: 10,
      });

      expect(result.models).toEqual(mockModels);
      expect(result.pagination).toBeDefined();

      // Verify caching
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('models:search'),
        expect.objectContaining({
          models: mockModels,
          total: 2,
          query: 'test',
        }),
        expect.objectContaining({
          ttl: 300,
          tags: ['models', 'swaggystacks'],
        })
      );
    });

    it('should return cached results', async () => {
      const cachedData = {
        models: [{ id: 'cached-model', name: 'Cached Model' }],
        total: 1,
        query: 'test',
        timestamp: Date.now(),
      };

      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await integrationService.searchModels({
        organization: 'swaggystacks',
        query: 'test',
        limit: 10,
      });

      expect(result.models).toBeDefined();
      expect(result.models).toEqual(cachedData.models);
      expect(result.fromCache).toBe(true);
      expect(mockRateLimiter.schedule).not.toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRateLimiter.schedule.mockRejectedValue(new Error('API Error'));

      const result = await integrationService.searchModels({
        organization: 'swaggystacks',
        query: 'test',
        limit: 10,
      });

      expect(result.models).toEqual([]);
      expect(result.pagination).toBeDefined();
    });

    it('should use credentials from credentials service', async () => {
      mockCredentialsService.getCredentials.mockResolvedValue({
        organization: 'swaggystacks',
        apiKey: 'hf_test_key',
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        version: 1,
      });

      mockCacheService.get.mockResolvedValue(null);
      mockRateLimiter.schedule.mockResolvedValue({
        data: [],
        status: 200,
        headers: new Headers(),
      });

      await integrationService.searchModels({
        organization: 'swaggystacks',
        query: 'test',
      });

      expect(mockCredentialsService.getCredentials).toHaveBeenCalledWith('swaggystacks');
    });
  });

  describe('model deployment', () => {
    it('should deploy model successfully', async () => {
      const deploymentRequest = {
        organization: 'swaggystacks',
        modelId: 'test-model',
        instanceType: 'cpu-medium',
        minReplicas: 1,
        maxReplicas: 3,
        name: 'test-deployment',
      };

      const mockDeploymentResponse: DeploymentStatus = 'deploying';

      mockRateLimiter.schedule.mockResolvedValue({
        data: {
          id: 'deployment-123',
          status: 'deploying',
          modelId: 'test-model',
          endpoint: null,
          createdAt: new Date().toISOString(),
        },
        status: 201,
        headers: new Headers(),
      });

      const result = await integrationService.deployModel(deploymentRequest);

      expect(result).toBe('deploying');
      expect(mockRateLimiter.schedule).toHaveBeenCalledWith(
        'swaggystacks',
        expect.any(Function),
        { priority: 'low' }
      );
    });

    it('should handle deployment errors', async () => {
      const deploymentRequest = {
        organization: 'swaggystacks',
        modelId: 'test-model',
        instanceType: 'cpu-medium',
        minReplicas: 1,
        maxReplicas: 3,
        name: 'test-deployment',
      };

      mockRateLimiter.schedule.mockRejectedValue(new Error('Deployment failed'));

      await expect(integrationService.deployModel(deploymentRequest))
        .rejects
        .toThrow('Deployment failed');
    });

    it('should invalidate cache after deployment', async () => {
      const deploymentRequest = {
        organization: 'swaggystacks',
        modelId: 'test-model',
        instanceType: 'cpu-medium',
        minReplicas: 1,
        maxReplicas: 3,
        name: 'test-deployment',
      };

      mockRateLimiter.schedule.mockResolvedValue({
        data: { id: 'deployment-123' },
        status: 201,
        headers: new Headers(),
      });

      await integrationService.deployModel(deploymentRequest);

      expect(mockCacheService.invalidateByTags).toHaveBeenCalledWith([
        'deployments',
        'swaggystacks',
      ]);
    });
  });

  describe('webhook processing', () => {
    it('should process webhooks', async () => {
      const webhookPayload = JSON.stringify({
        type: 'model.updated',
        organization: 'swaggystacks',
        data: { model: 'test-model' },
      });

      mockWebhookService.processWebhook.mockResolvedValue({
        success: true,
        message: 'Processed 1 events',
        eventsProcessed: 1,
      });

      const result = await integrationService.processWebhook(
        webhookPayload,
        'test-signature'
      );

      expect(result.models).toBeDefined();
      expect(result.eventsProcessed).toBe(1);
      expect(mockWebhookService.processWebhook).toHaveBeenCalledWith(
        webhookPayload,
        'test-signature',
        {}
      );
    });

    it('should handle webhook errors', async () => {
      mockWebhookService.processWebhook.mockResolvedValue({
        success: false,
        message: 'Invalid signature',
        eventsProcessed: 0,
      });

      const result = await integrationService.processWebhook(
        'invalid-payload',
        'invalid-signature'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });
  });

  describe('health check', () => {
    it('should perform comprehensive health check', async () => {
      // Mock all health checks to pass
      mockCredentialsService.healthCheck.mockResolvedValue({
        totalCredentials: 2,
        validCredentials: 2,
        invalidCredentials: 0,
        results: [],
      });

      mockCircuitBreaker.getOverallHealth.mockResolvedValue({
        healthy: true,
        checks: {
          'models-api': true,
          'deployments-api': true,
        },
      });

      mockCacheService.getStats.mockReturnValue({
        memoryCache: { size: 100, maxSize: 500, hits: 90, misses: 10, hitRate: 0.9 },
        redisCache: { connected: true, hits: 50, misses: 5, hitRate: 0.91 },
        totalHits: 140,
        totalMisses: 15,
        totalHitRate: 0.903
      });

      mockRateLimiter.getStatistics.mockReturnValue(new Map([
        ['swaggystacks', {
          organization: 'swaggystacks',
          pending: 0,
          running: 0,
          done: 100,
          failed: 1,
          queued: 2,
          isBlocked: false,
          lastUpdate: new Date(),
        }],
      ]));

      const result = await integrationService.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.details).toHaveProperty('credentials');
      expect(result.details).toHaveProperty('circuitBreakers');
      expect(result.details).toHaveProperty('cache');
      expect(result.details).toHaveProperty('rateLimiter');
      expect(result.details.credentials.validCredentials).toBe(2);
    });

    it('should detect unhealthy services', async () => {
      mockCredentialsService.healthCheck.mockResolvedValue({
        totalCredentials: 2,
        validCredentials: 1,
        invalidCredentials: 1,
        results: [],
      });

      mockCircuitBreaker.getOverallHealth.mockResolvedValue({
        healthy: false,
        checks: {
          'models-api': false,
          'deployments-api': true,
        },
      });

      const result = await integrationService.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.details.credentials.invalidCredentials).toBe(1);
      expect(result.details.circuitBreakers.healthy).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should return comprehensive statistics', () => {
      mockCacheService.getStats.mockReturnValue({
        memoryCache: { size: 50, maxSize: 500, hits: 80, misses: 20, hitRate: 0.8 },
        redisCache: { connected: true, hits: 40, misses: 10, hitRate: 0.8 },
        totalHits: 120,
        totalMisses: 30,
        totalHitRate: 0.8
      });

      mockRateLimiter.getStatistics.mockReturnValue(new Map([
        ['swaggystacks', {
          organization: 'swaggystacks',
          pending: 0,
          running: 0,
          done: 50,
          failed: 0,
          queued: 1,
          isBlocked: false,
          lastUpdate: new Date(),
        }],
        ['scientia-capital', {
          organization: 'scientia-capital',
          pending: 0,
          running: 0,
          done: 30,
          failed: 1,
          queued: 0,
          isBlocked: false,
          lastUpdate: new Date(),
        }],
      ]));

      mockCircuitBreaker.getAllStats.mockReturnValue([
        {
          name: 'models-api',
          state: 'CLOSED',
          totalRequests: 100,
          successfulRequests: 95,
          failedRequests: 5,
          errorRate: 0.05,
          averageResponseTime: 150,
          lastSuccessTime: new Date(),
        },
        {
          name: 'deployments-api',
          state: 'CLOSED',
          totalRequests: 50,
          successfulRequests: 45,
          failedRequests: 5,
          errorRate: 0.1,
          averageResponseTime: 200,
          lastSuccessTime: new Date(),
        },
      ]);

      mockWebhookService.getStats.mockReturnValue({
        totalEvents: 25,
        eventsByType: {
          'model.created': 5,
          'model.updated': 10,
          'model.deleted': 2,
          'deployment.started': 3,
          'deployment.completed': 2,
          'deployment.failed': 1,
          'quota.warning': 1,
          'quota.exceeded': 0,
          'rate_limit.exceeded': 1,
          'error.occurred': 0,
        },
        eventsByOrganization: { 'swaggystacks': 15, 'scientia': 10 },
        successfulDeliveries: 24,
        failedDeliveries: 1,
        averageProcessingTime: 50,
      });

      const stats = integrationService.getStatistics();

      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('rateLimiter');
      expect(stats).toHaveProperty('circuitBreakers');
      expect(stats).toHaveProperty('webhooks');
      expect(stats.webhooks.totalEvents).toBe(25);
      expect(stats.rateLimiter.organizations).toHaveLength(2);
    });
  });

  describe('cleanup', () => {
    it('should disconnect all services gracefully', async () => {
      await integrationService.disconnect();

      expect(mockCacheService.disconnect).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle missing credentials gracefully', async () => {
      mockCredentialsService.getCredentials.mockResolvedValue(null);

      const result = await integrationService.searchModels({
        organization: 'nonexistent',
        query: 'test',
      });

      expect(result.models).toEqual([]);
      expect(result.pagination).toBeDefined();
    });
  });
});