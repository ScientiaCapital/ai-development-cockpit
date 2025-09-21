import CircuitBreaker from 'opossum';
import { EventEmitter } from 'events';

export interface CircuitBreakerConfig {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  capacity: number;
  bucketSpan: number;
  enabled: boolean;
}

export interface CircuitBreakerStats {
  name: string;
  state: 'OPEN' | 'HALF_OPEN' | 'CLOSED';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  averageResponseTime: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  timeUntilRetry?: number;
  isHealthy: boolean;
}

export interface FallbackOptions {
  useCachedData: boolean;
  cacheMaxAge: number;
  defaultResponse: any;
  enableLogging: boolean;
}

export interface HealthCheckConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'HEAD';
  timeout: number;
  interval: number;
  headers?: Record<string, string>;
  expectedStatus?: number;
}

// Default configurations
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  timeout: 10000, // 10 seconds
  errorThresholdPercentage: 50, // Open when 50% of requests fail
  resetTimeout: 30000, // 30 seconds before attempting to close
  rollingCountTimeout: 10000, // 10 second rolling window
  rollingCountBuckets: 10, // 10 buckets in rolling window
  capacity: 10, // Max concurrent requests when HALF_OPEN
  bucketSpan: 1000, // 1 second per bucket
  enabled: true,
};

const DEFAULT_FALLBACK_OPTIONS: FallbackOptions = {
  useCachedData: true,
  cacheMaxAge: 300000, // 5 minutes
  defaultResponse: null,
  enableLogging: true,
};

const DEFAULT_HEALTH_CHECK: HealthCheckConfig = {
  endpoint: '/health',
  method: 'GET',
  timeout: 5000,
  interval: 30000, // 30 seconds
  expectedStatus: 200,
};

export class HuggingFaceCircuitBreaker extends EventEmitter {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private configs: Map<string, CircuitBreakerConfig> = new Map();
  private fallbackOptions: Map<string, FallbackOptions> = new Map();
  private stats: Map<string, CircuitBreakerStats> = new Map();
  private healthChecks: Map<string, HealthCheckConfig> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private enableLogging: boolean;
  private cachedResponses: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(enableLogging = process.env.NODE_ENV === 'development') {
    super();
    this.enableLogging = enableLogging;

    this.log('CIRCUIT_BREAKER_SERVICE_INITIALIZED', {});
  }

  private log(level: string, data: any): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] HF_CIRCUIT_BREAKER_${level}:`, JSON.stringify(data, null, 2));
  }

  public createBreaker<T>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    config: Partial<CircuitBreakerConfig> = {},
    fallbackOptions: Partial<FallbackOptions> = {},
    healthCheck?: Partial<HealthCheckConfig>
  ): CircuitBreaker<T> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const fullFallbackOptions = { ...DEFAULT_FALLBACK_OPTIONS, ...fallbackOptions };

    // Create the circuit breaker
    const breaker = new CircuitBreaker<T>(action, {
      timeout: fullConfig.timeout,
      errorThresholdPercentage: fullConfig.errorThresholdPercentage,
      resetTimeout: fullConfig.resetTimeout,
      rollingCountTimeout: fullConfig.rollingCountTimeout,
      rollingCountBuckets: fullConfig.rollingCountBuckets,
      capacity: fullConfig.capacity,
      bucketSpan: fullConfig.bucketSpan,
      enabled: fullConfig.enabled,
      name,
    });

    // Set up fallback function
    breaker.fallback((error: Error, ...args: any[]) =>
      this.handleFallback(name, error, fullFallbackOptions, ...args)
    );

    // Set up event listeners
    this.setupBreakerEvents(breaker, name);

    // Store configurations
    this.breakers.set(name, breaker);
    this.configs.set(name, fullConfig);
    this.fallbackOptions.set(name, fullFallbackOptions);

    // Initialize stats
    this.initializeStats(name);

    // Set up health check if provided
    if (healthCheck) {
      this.setupHealthCheck(name, { ...DEFAULT_HEALTH_CHECK, ...healthCheck });
    }

    this.log('CIRCUIT_BREAKER_CREATED', {
      name,
      config: fullConfig,
      fallbackOptions: fullFallbackOptions,
    });

    return breaker;
  }

  private setupBreakerEvents(breaker: CircuitBreaker, name: string): void {
    // State change events
    breaker.on('open', () => {
      this.updateStats(name, { state: 'OPEN', lastFailureTime: new Date() });
      this.log('CIRCUIT_BREAKER_OPENED', { name });
      this.emit('breaker.opened', { name });
    });

    breaker.on('halfOpen', () => {
      this.updateStats(name, { state: 'HALF_OPEN' });
      this.log('CIRCUIT_BREAKER_HALF_OPEN', { name });
      this.emit('breaker.halfOpen', { name });
    });

    breaker.on('close', () => {
      this.updateStats(name, { state: 'CLOSED', lastSuccessTime: new Date() });
      this.log('CIRCUIT_BREAKER_CLOSED', { name });
      this.emit('breaker.closed', { name });
    });

    // Request events
    breaker.on('success', (result, latency) => {
      this.updateRequestStats(name, true, latency);
      this.log('CIRCUIT_BREAKER_SUCCESS', { name, latency });
    });

    breaker.on('failure', (error) => {
      this.updateRequestStats(name, false);
      this.log('CIRCUIT_BREAKER_FAILURE', { name, error: error.message });
    });

    breaker.on('timeout', (error) => {
      this.updateRequestStats(name, false);
      this.log('CIRCUIT_BREAKER_TIMEOUT', { name, error: error.message });
    });

    breaker.on('reject', (error) => {
      this.log('CIRCUIT_BREAKER_REJECTED', { name, error: error.message });
    });

    breaker.on('fallback', (data) => {
      this.log('CIRCUIT_BREAKER_FALLBACK', { name, data: typeof data });
      this.emit('breaker.fallback', { name, data });
    });

    // Health check events
    breaker.on('healthCheckFailed', (error) => {
      this.log('HEALTH_CHECK_FAILED', { name, error: error.message });
      this.emit('healthCheck.failed', { name, error });
    });
  }

  private async handleFallback<T>(
    name: string,
    error: Error,
    options: FallbackOptions,
    ...args: any[]
  ): Promise<T> {
    if (options.enableLogging) {
      this.log('FALLBACK_TRIGGERED', {
        name,
        error: error.message,
        options,
      });
    }

    // Try to use cached data first
    if (options.useCachedData) {
      const cachedResponse = this.getCachedResponse(name, options.cacheMaxAge);
      if (cachedResponse) {
        this.log('FALLBACK_CACHE_HIT', { name });
        return cachedResponse;
      }
    }

    // Use default response if no cached data available
    if (options.defaultResponse !== null) {
      this.log('FALLBACK_DEFAULT_RESPONSE', { name });
      return options.defaultResponse;
    }

    // Re-throw the error if no fallback options work
    throw error;
  }

  private getCachedResponse(name: string, maxAge: number): any | null {
    const cached = this.cachedResponses.get(name);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cachedResponses.delete(name);
      return null;
    }

    return cached.data;
  }

  private cacheResponse(name: string, data: any): void {
    this.cachedResponses.set(name, {
      data,
      timestamp: Date.now(),
    });
  }

  private initializeStats(name: string): void {
    this.stats.set(name, {
      name,
      state: 'CLOSED',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      isHealthy: true,
    });
  }

  private updateStats(name: string, updates: Partial<CircuitBreakerStats>): void {
    const stats = this.stats.get(name);
    if (stats) {
      Object.assign(stats, updates);

      // Calculate time until retry for OPEN state
      if (stats.state === 'OPEN' && stats.lastFailureTime) {
        const config = this.configs.get(name);
        if (config) {
          const timeElapsed = Date.now() - stats.lastFailureTime.getTime();
          stats.timeUntilRetry = Math.max(0, config.resetTimeout - timeElapsed);
        }
      }

      // Update health status
      stats.isHealthy = stats.state === 'CLOSED' ||
        (stats.state === 'HALF_OPEN' && stats.errorRate < 25);
    }
  }

  private updateRequestStats(name: string, success: boolean, latency?: number): void {
    const stats = this.stats.get(name);
    if (stats) {
      stats.totalRequests++;

      if (success) {
        stats.successfulRequests++;
        if (latency !== undefined) {
          // Update average response time using exponential moving average
          const alpha = 0.1; // Smoothing factor
          stats.averageResponseTime = stats.averageResponseTime === 0
            ? latency
            : alpha * latency + (1 - alpha) * stats.averageResponseTime;
        }
      } else {
        stats.failedRequests++;
      }

      // Calculate error rate
      stats.errorRate = stats.totalRequests > 0
        ? (stats.failedRequests / stats.totalRequests) * 100
        : 0;

      this.updateStats(name, stats);
    }
  }

  private setupHealthCheck(name: string, config: HealthCheckConfig): void {
    this.healthChecks.set(name, config);

    const performHealthCheck = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(config.endpoint, {
          method: config.method,
          headers: config.headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const isHealthy = config.expectedStatus
          ? response.status === config.expectedStatus
          : response.ok;

        if (isHealthy) {
          this.emit('healthCheck.success', { name });

          // If circuit is open and health check succeeds, try to transition to half-open
          const breaker = this.breakers.get(name);
          if (breaker && breaker.opened) {
            this.log('HEALTH_CHECK_SUCCESS_CIRCUIT_OPEN', { name });
          }
        } else {
          throw new Error(`Health check failed with status ${response.status}`);
        }
      } catch (error) {
        this.emit('healthCheck.failed', { name, error });
        this.log('HEALTH_CHECK_FAILED', {
          name,
          endpoint: config.endpoint,
          error: (error as Error).message,
        });
      }
    };

    // Perform initial health check
    performHealthCheck();

    // Set up recurring health check
    const interval = setInterval(performHealthCheck, config.interval);
    this.healthCheckIntervals.set(name, interval);

    this.log('HEALTH_CHECK_SETUP', {
      name,
      endpoint: config.endpoint,
      interval: config.interval,
    });
  }

  public async execute<T>(
    breakerName: string,
    ...args: any[]
  ): Promise<T> {
    const breaker = this.breakers.get(breakerName);
    if (!breaker) {
      throw new Error(`Circuit breaker '${breakerName}' not found`);
    }

    try {
      const result = await breaker.fire(...args);

      // Cache successful responses
      this.cacheResponse(breakerName, result);

      return result;
    } catch (error) {
      // Error is already handled by fallback mechanism
      throw error;
    }
  }

  public getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  public getStats(name?: string): CircuitBreakerStats | Map<string, CircuitBreakerStats> {
    if (name) {
      return this.stats.get(name) || {
        name,
        state: 'CLOSED',
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
        isHealthy: false,
      };
    }
    return new Map(this.stats);
  }

  public getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.stats.values());
  }

  public getHealthyBreakers(): string[] {
    return Array.from(this.stats.entries())
      .filter(([_, stats]) => stats.isHealthy)
      .map(([name]) => name);
  }

  public getUnhealthyBreakers(): string[] {
    return Array.from(this.stats.entries())
      .filter(([_, stats]) => !stats.isHealthy)
      .map(([name]) => name);
  }

  public forceOpen(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.open();
      this.log('CIRCUIT_BREAKER_FORCE_OPENED', { name });
      return true;
    }
    return false;
  }

  public forceClose(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.close();
      this.log('CIRCUIT_BREAKER_FORCE_CLOSED', { name });
      return true;
    }
    return false;
  }

  public updateConfig(name: string, config: Partial<CircuitBreakerConfig>): boolean {
    const breaker = this.breakers.get(name);
    const currentConfig = this.configs.get(name);

    if (breaker && currentConfig) {
      const newConfig = { ...currentConfig, ...config };

      // Note: Opossum doesn't support runtime config updates for all properties
      // This would require recreating the breaker in a production implementation
      this.configs.set(name, newConfig);

      this.log('CIRCUIT_BREAKER_CONFIG_UPDATED', { name, newConfig });
      return true;
    }
    return false;
  }

  public clearCache(name?: string): void {
    if (name) {
      this.cachedResponses.delete(name);
      this.log('CACHE_CLEARED', { name });
    } else {
      this.cachedResponses.clear();
      this.log('ALL_CACHES_CLEARED', {});
    }
  }

  public resetStats(name?: string): void {
    if (name) {
      const breaker = this.breakers.get(name);
      if (breaker) {
        breaker.stats.reset();
        this.initializeStats(name);
        this.log('STATS_RESET', { name });
      }
    } else {
      for (const [breakerName, breaker] of this.breakers) {
        breaker.stats.reset();
        this.initializeStats(breakerName);
      }
      this.log('ALL_STATS_RESET', {});
    }
  }

  public async shutdown(): Promise<void> {
    // Clear health check intervals
    for (const [name, interval] of this.healthCheckIntervals) {
      clearInterval(interval);
      this.log('HEALTH_CHECK_STOPPED', { name });
    }
    this.healthCheckIntervals.clear();

    // Shutdown all circuit breakers
    for (const [name, breaker] of this.breakers) {
      breaker.shutdown();
      this.log('CIRCUIT_BREAKER_SHUTDOWN', { name });
    }

    this.log('CIRCUIT_BREAKER_SERVICE_SHUTDOWN', {});
  }

  public isHealthy(name: string): boolean {
    const stats = this.stats.get(name);
    return stats ? stats.isHealthy : false;
  }

  public isOpen(name: string): boolean {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.opened : false;
  }

  public isClosed(name: string): boolean {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.closed : false;
  }

  public isHalfOpen(name: string): boolean {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.halfOpen : false;
  }

  public listBreakers(): string[] {
    return Array.from(this.breakers.keys());
  }

  public removeBreaker(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      // Clean up health check
      const interval = this.healthCheckIntervals.get(name);
      if (interval) {
        clearInterval(interval);
        this.healthCheckIntervals.delete(name);
      }

      // Shutdown and remove breaker
      breaker.shutdown();
      this.breakers.delete(name);
      this.configs.delete(name);
      this.fallbackOptions.delete(name);
      this.stats.delete(name);
      this.healthChecks.delete(name);
      this.cachedResponses.delete(name);

      this.log('CIRCUIT_BREAKER_REMOVED', { name });
      return true;
    }
    return false;
  }
}

// Export a default instance
export default new HuggingFaceCircuitBreaker();