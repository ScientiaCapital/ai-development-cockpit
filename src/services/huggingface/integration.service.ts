import { HuggingFaceApiClient, ApiClientConfig, HuggingFaceApiResponse } from './api-client';
import { HuggingFaceRateLimiter, RequestPriority } from './rate-limiter';
import { HuggingFaceCacheService, CacheOptions } from './cache.service';
import { HuggingFaceWebhookService, WebhookEvent, WebhookEventType } from './webhook.service';
import { HuggingFaceCircuitBreaker, CircuitBreakerConfig } from './circuit-breaker';
import { HuggingFaceCredentialsService } from './credentials.service';

export interface IntegrationConfig {
  enableRateLimiting: boolean;
  enableCaching: boolean;
  enableCircuitBreaker: boolean;
  enableWebhooks: boolean;
  enableCredentialManagement: boolean;
  defaultOrganization: string;
  enableMetrics: boolean;
  enableHealthChecks: boolean;
}

export interface IntegrationModelSearchParams {
  query?: string;
  organization?: string;
  task?: string;
  library?: string;
  language?: string;
  tags?: string[];
  sort?: 'downloads' | 'likes' | 'lastModified' | 'trending';
  limit?: number;
  offset?: number;
}

export interface ModelInfo {
  id: string;
  modelId: string;
  organization: string;
  title: string;
  description: string;
  downloads: number;
  likes: number;
  tags: string[];
  library: string;
  task: string;
  createdAt: string;
  lastModified: string;
  siblings?: { rfilename: string }[];
  config?: any;
  private: boolean;
  gated: boolean;
}

export interface DeploymentRequest {
  modelId: string;
  organization: string;
  instanceType?: string;
  minReplicas?: number;
  maxReplicas?: number;
  envVars?: Record<string, string>;
}

export interface DeploymentStatus {
  deploymentId: string;
  modelId: string;
  status: 'pending' | 'building' | 'running' | 'failed' | 'stopped';
  endpoint?: string;
  createdAt: string;
  logs?: string[];
  error?: string;
}

export interface IntegrationStats {
  requests: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    rateLimited: number;
  };
  organizations: {
    [org: string]: {
      requests: number;
      cacheHitRate: number;
      errorRate: number;
    };
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  health: {
    apiHealthy: boolean;
    cacheHealthy: boolean;
    rateLimiterHealthy: boolean;
    circuitBreakerHealthy: boolean;
  };
}

// Default configuration
const DEFAULT_CONFIG: IntegrationConfig = {
  enableRateLimiting: true,
  enableCaching: true,
  enableCircuitBreaker: true,
  enableWebhooks: true,
  enableCredentialManagement: true,
  defaultOrganization: 'swaggystacks',
  enableMetrics: true,
  enableHealthChecks: true,
};

export class HuggingFaceIntegrationService {
  private config: IntegrationConfig;
  private apiClient: HuggingFaceApiClient;
  private rateLimiter: HuggingFaceRateLimiter;
  private cache: HuggingFaceCacheService;
  private webhooks: HuggingFaceWebhookService;
  private circuitBreaker: HuggingFaceCircuitBreaker;
  private credentials: HuggingFaceCredentialsService;
  private enableLogging: boolean;
  private stats: IntegrationStats;
  private responseTimes: number[] = [];

  constructor(
    config: Partial<IntegrationConfig> = {},
    enableLogging = process.env.NODE_ENV === 'development'
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.enableLogging = enableLogging;

    // Initialize stats
    this.stats = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        cached: 0,
        rateLimited: 0,
      },
      organizations: {},
      performance: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      health: {
        apiHealthy: true,
        cacheHealthy: true,
        rateLimiterHealthy: true,
        circuitBreakerHealthy: true,
      },
    };

    // Initialize services
    this.apiClient = new HuggingFaceApiClient();
    this.rateLimiter = new HuggingFaceRateLimiter();
    this.cache = new HuggingFaceCacheService();
    this.webhooks = new HuggingFaceWebhookService();
    this.circuitBreaker = new HuggingFaceCircuitBreaker();
    this.credentials = new HuggingFaceCredentialsService();

    this.setupIntegrations();
    this.setupWebhookHandlers();
    this.setupCircuitBreakers();

    this.log('INTEGRATION_SERVICE_INITIALIZED', {
      config: this.config,
    });
  }

  private setupIntegrations(): void {
    // Set up webhook handlers for cache invalidation
    this.webhooks.on('cache.invalidate', (data: any) => {
      if (data.tags) {
        this.cache.invalidateByTags(data.tags);
      }
      if (data.organization) {
        this.cache.clear(data.organization);
      }
    });

    // Set up rate limit updates from webhooks
    this.webhooks.on('rate_limit.update', (data: any) => {
      if (data.organization && data.rateLimitInfo) {
        this.rateLimiter.updateRateLimitFromResponse(data.organization, data.rateLimitInfo);
      }
    });

    this.log('INTEGRATIONS_SETUP_COMPLETE', {});
  }

  private setupWebhookHandlers(): void {
    // Model update handler
    this.webhooks.onModelUpdate(async (event: WebhookEvent) => {
      const { organization } = event;

      // Invalidate model cache
      await this.cache.invalidateByTags(['models', `org:${organization}`]);

      this.log('MODEL_UPDATE_PROCESSED', {
        organization,
        eventId: event.id,
      });
    });

    // Rate limit handler
    this.webhooks.onRateLimit(async (event: WebhookEvent) => {
      const { organization, data } = event;

      // Update rate limiter
      if (data.rateLimitInfo) {
        this.rateLimiter.updateRateLimitFromResponse(organization, data.rateLimitInfo);
      }

      this.log('RATE_LIMIT_UPDATE_PROCESSED', {
        organization,
        eventId: event.id,
      });
    });

    this.log('WEBHOOK_HANDLERS_SETUP_COMPLETE', {});
  }

  private setupCircuitBreakers(): void {
    // Model search circuit breaker with proper wrapper
    this.circuitBreaker.createBreaker(
      'model-search',
      async (...args: unknown[]) => {
        const params = args[0] as IntegrationModelSearchParams;
        return this.searchModelsInternal(params);
      },
      {
        timeout: 15000,
        errorThresholdPercentage: 60,
        resetTimeout: 30000,
      },
      {
        useCachedData: true,
        cacheMaxAge: 300000, // 5 minutes
        defaultResponse: { models: [], pagination: { total: 0, limit: 0, offset: 0 } },
      }
    );

    // Model info circuit breaker with proper wrapper
    this.circuitBreaker.createBreaker(
      'model-info',
      async (...args: unknown[]) => {
        const [modelId, organization] = args as [string, string];
        return this.getModelInfoInternal(modelId, organization);
      },
      {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 20000,
      },
      {
        useCachedData: true,
        cacheMaxAge: 600000, // 10 minutes
        defaultResponse: null,
      }
    );

    // Deployment circuit breaker with proper wrapper
    this.circuitBreaker.createBreaker(
      'deployment',
      async (...args: unknown[]) => {
        const request = args[0] as DeploymentRequest;
        return this.deployModelInternal(request);
      },
      {
        timeout: 30000,
        errorThresholdPercentage: 40,
        resetTimeout: 60000,
      },
      {
        useCachedData: false,
        defaultResponse: null,
      }
    );

    this.log('CIRCUIT_BREAKERS_SETUP_COMPLETE', {});
  }

  private async getApiKey(organization: string): Promise<string> {
    if (!this.config.enableCredentialManagement) {
      return process.env.HUGGINGFACE_API_KEY || '';
    }

    const apiKey = await this.credentials.getApiKey(organization);
    if (!apiKey) {
      throw new Error(`No API key found for organization: ${organization}`);
    }

    return apiKey;
  }

  private async executeWithServices<T>(
    operation: string,
    organization: string,
    action: () => Promise<T>,
    options: {
      priority?: RequestPriority['priority'];
      cacheKey?: string;
      cacheOptions?: CacheOptions;
      skipCache?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const org = organization || this.config.defaultOrganization;

    try {
      // Initialize org stats if not exists
      if (!this.stats.organizations[org]) {
        this.stats.organizations[org] = {
          requests: 0,
          cacheHitRate: 0,
          errorRate: 0,
        };
      }

      this.stats.requests.total++;
      this.stats.organizations[org].requests++;

      // Check cache first
      if (!options.skipCache && options.cacheKey && this.config.enableCaching) {
        const cachedResult = await this.cache.get<T>(options.cacheKey, {
          organization: org,
          ...options.cacheOptions,
        });

        if (cachedResult) {
          this.stats.requests.cached++;
          this.updateResponseTime(Date.now() - startTime);

          this.log('CACHE_HIT', {
            operation,
            organization: org,
            cacheKey: options.cacheKey,
          });

          return cachedResult;
        }
      }

      // Execute with rate limiting
      const result = await this.rateLimiter.schedule(
        org,
        action,
        { priority: options.priority || 'normal' }
      );

      // Cache the result
      if (options.cacheKey && this.config.enableCaching && result) {
        await this.cache.set(options.cacheKey, result, {
          organization: org,
          tags: [operation, `org:${org}`],
          ...options.cacheOptions,
        });
      }

      this.stats.requests.successful++;
      this.updateResponseTime(Date.now() - startTime);

      this.log('OPERATION_SUCCESS', {
        operation,
        organization: org,
        responseTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.stats.requests.failed++;
      this.updateResponseTime(Date.now() - startTime);

      this.log('OPERATION_ERROR', {
        operation,
        organization: org,
        error: (error as Error).message,
        responseTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  private updateResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Update performance stats
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    this.stats.performance.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    this.stats.performance.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.stats.performance.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  // Internal API methods (used by circuit breakers)
  private async searchModelsInternal(params: IntegrationModelSearchParams): Promise<{ models: ModelInfo[]; pagination: any }> {
    const org = params.organization || this.config.defaultOrganization;
    const apiKey = await this.getApiKey(org);

    this.apiClient.setApiKey(apiKey);
    this.apiClient.setOrganization(org);

    const queryParams = new URLSearchParams();
    if (params.query) queryParams.set('search', params.query);
    if (params.task) queryParams.set('filter', `task:${params.task}`);
    if (params.library) queryParams.set('filter', `library:${params.library}`);
    if (params.sort) queryParams.set('sort', params.sort);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset) queryParams.set('offset', params.offset.toString());

    const response = await this.apiClient.get<any>(`/models?${queryParams.toString()}`);

    return {
      models: response.data.map((model: any) => this.transformModelData(model)),
      pagination: {
        total: response.data.length,
        limit: params.limit || 20,
        offset: params.offset || 0,
      },
    };
  }

  private async getModelInfoInternal(modelId: string, organization: string): Promise<ModelInfo | null> {
    const org = organization || this.config.defaultOrganization;
    const apiKey = await this.getApiKey(org);

    this.apiClient.setApiKey(apiKey);
    this.apiClient.setOrganization(org);

    const response = await this.apiClient.get<any>(`/models/${modelId}`);
    return this.transformModelData(response.data);
  }

  private async deployModelInternal(request: DeploymentRequest): Promise<DeploymentStatus> {
    const org = request.organization || this.config.defaultOrganization;
    const apiKey = await this.getApiKey(org);

    this.apiClient.setApiKey(apiKey);
    this.apiClient.setOrganization(org);

    const response = await this.apiClient.post<any>('/deployments', {
      model: request.modelId,
      instance_type: request.instanceType || 'cpu-small',
      min_replicas: request.minReplicas || 1,
      max_replicas: request.maxReplicas || 1,
      env: request.envVars || {},
    });

    return {
      deploymentId: response.data.id,
      modelId: request.modelId,
      status: response.data.status,
      endpoint: response.data.endpoint,
      createdAt: response.data.created_at,
    };
  }

  private transformModelData(model: any): ModelInfo {
    return {
      id: model.id,
      modelId: model.id,
      organization: model.id.split('/')[0],
      title: model.id.split('/')[1] || model.id,
      description: model.description || '',
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      tags: model.tags || [],
      library: model.library || 'unknown',
      task: model.pipeline_tag || 'unknown',
      createdAt: model.created_at || new Date().toISOString(),
      lastModified: model.last_modified || new Date().toISOString(),
      siblings: model.siblings || [],
      config: model.config,
      private: model.private || false,
      gated: model.gated || false,
    };
  }

  // Public API methods
  public async searchModels(params: IntegrationModelSearchParams): Promise<{ models: ModelInfo[]; pagination: any }> {
    const cacheKey = `models:search:${JSON.stringify(params)}`;

    return this.executeWithServices(
      'search-models',
      params.organization || this.config.defaultOrganization,
      () => this.circuitBreaker.execute('model-search', params),
      {
        priority: 'normal',
        cacheKey,
        cacheOptions: { ttl: 300000, tags: ['models', 'search'] },
      }
    );
  }

  public async getModelInfo(modelId: string, organization?: string): Promise<ModelInfo | null> {
    const org = organization || this.config.defaultOrganization;
    const cacheKey = `model:info:${modelId}`;

    return this.executeWithServices(
      'get-model-info',
      org,
      () => this.circuitBreaker.execute('model-info', modelId, org),
      {
        priority: 'normal',
        cacheKey,
        cacheOptions: { ttl: 600000, tags: ['models', 'info'] },
      }
    );
  }

  public async deployModel(request: DeploymentRequest): Promise<DeploymentStatus> {
    return this.executeWithServices(
      'deploy-model',
      request.organization || this.config.defaultOrganization,
      () => this.circuitBreaker.execute('deployment', request),
      {
        priority: 'high',
        skipCache: true,
      }
    );
  }

  public async getDeploymentStatus(deploymentId: string, organization?: string): Promise<DeploymentStatus | null> {
    const org = organization || this.config.defaultOrganization;
    const cacheKey = `deployment:status:${deploymentId}`;

    return this.executeWithServices(
      'get-deployment-status',
      org,
      async () => {
        const apiKey = await this.getApiKey(org);
        this.apiClient.setApiKey(apiKey);
        this.apiClient.setOrganization(org);

        const response = await this.apiClient.get<any>(`/deployments/${deploymentId}`);

        return {
          deploymentId: response.data.id,
          modelId: response.data.model,
          status: response.data.status,
          endpoint: response.data.endpoint,
          createdAt: response.data.created_at,
          logs: response.data.logs,
          error: response.data.error,
        };
      },
      {
        priority: 'normal',
        cacheKey,
        cacheOptions: { ttl: 30000, tags: ['deployments', 'status'] }, // Short cache for deployment status
      }
    );
  }

  public getStats(): IntegrationStats {
    // Update health status
    this.stats.health = {
      apiHealthy: this.circuitBreaker.isHealthy('model-search') &&
                  this.circuitBreaker.isHealthy('model-info'),
      cacheHealthy: this.cache.isRedisConnected(),
      rateLimiterHealthy: !this.rateLimiter.isBlocked(this.config.defaultOrganization),
      circuitBreakerHealthy: this.circuitBreaker.getHealthyBreakers().length > 0,
    };

    return { ...this.stats };
  }

  public async healthCheck(): Promise<{
    totalCredentials: number;
    validCredentials: number;
    invalidCredentials: number;
    results: any[];
  }> {
    try {
      const credentialsHealth = await this.credentials.healthCheck();
      return credentialsHealth;
    } catch (error) {
      this.log('HEALTH_CHECK_ERROR', { error: (error as Error).message });
      return {
        totalCredentials: 0,
        validCredentials: 0,
        invalidCredentials: 0,
        results: []
      };
    }
  }

  public async getOverallHealth(): Promise<{ healthy: boolean; checks: Record<string, boolean> }> {
    const checks = {
      api: false,
      cache: false,
      rateLimiter: false,
      circuitBreaker: false,
      credentials: false,
    };

    try {
      // API health check
      checks.api = this.circuitBreaker.isHealthy('model-search');

      // Cache health check
      checks.cache = this.cache.isRedisConnected();

      // Rate limiter health check
      checks.rateLimiter = !this.rateLimiter.isBlocked(this.config.defaultOrganization);

      // Circuit breaker health check
      checks.circuitBreaker = this.circuitBreaker.getHealthyBreakers().length > 0;

      // Credentials health check
      const validation = await this.credentials.validateCredentials(this.config.defaultOrganization);
      checks.credentials = validation.valid;

    } catch (error) {
      this.log('HEALTH_CHECK_ERROR', { error: (error as Error).message });
    }

    const healthy = Object.values(checks).every(check => check);

    return {
      healthy,
      checks,
    };
  }

  public getStatistics(): {
    cache: any;
    rateLimiter: { organizations: Array<{ org: string; stats: any }> };
    circuitBreakers: any;
    webhooks: any;
  } {
    const cacheStats = this.cache.getStats();
    const rateLimiterStats = this.rateLimiter.getStatistics();
    const circuitBreakerStats = this.circuitBreaker.getAllStats();
    const webhookStats = this.webhooks.getStats();

    return {
      cache: cacheStats,
      rateLimiter: {
        organizations: Object.entries(rateLimiterStats).map(([org, stats]) => ({ org, stats }))
      },
      circuitBreakers: circuitBreakerStats,
      webhooks: webhookStats
    };
  }

  public async processWebhook(payload: string, signature: string, options: any = {}): Promise<{
    success: boolean;
    message: string;
    eventsProcessed: number;
  }> {
    try {
      const result = await this.webhooks.processWebhook(payload, signature, options);
      return result;
    } catch (error) {
      this.log('WEBHOOK_PROCESSING_ERROR', { error: (error as Error).message });
      return {
        success: false,
        message: (error as Error).message,
        eventsProcessed: 0
      };
    }
  }

  public async disconnect(): Promise<void> {
    await this.shutdown();
  }

  private log(level: string, data: any): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] HF_INTEGRATION_${level}:`, JSON.stringify(data, null, 2));
  }

  public async shutdown(): Promise<void> {
    await Promise.all([
      this.rateLimiter.stop(),
      this.cache.disconnect(),
      this.circuitBreaker.shutdown(),
      this.credentials.shutdown(),
    ]);

    this.log('INTEGRATION_SERVICE_SHUTDOWN', {});
  }
}

// Export a default instance
export default new HuggingFaceIntegrationService();