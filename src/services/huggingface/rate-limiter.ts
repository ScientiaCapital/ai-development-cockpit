import Bottleneck from 'bottleneck';
import { RateLimitInfo } from './api-client';

export interface RateLimitConfig {
  maxConcurrent: number;
  minTime: number;
  reservoir?: number;
  reservoirRefreshAmount?: number;
  reservoirRefreshInterval?: number;
  highWater?: number;
  strategy?: Bottleneck.Strategy;
}

export interface OrganizationLimits {
  [organization: string]: RateLimitConfig;
}

export interface RequestPriority {
  priority: 'low' | 'normal' | 'high';
  weight?: number;
}

export interface RateLimitStats {
  organization: string;
  pending: number;
  running: number;
  done: number;
  failed: number;
  queued: number;
  isBlocked: boolean;
  reservoir?: number;
  lastUpdate: Date;
}

// Default rate limit configurations
const DEFAULT_CONFIGS: OrganizationLimits = {
  // AI Dev Cockpit - Gaming/Developer focused (more aggressive)
  arcade: {
    maxConcurrent: 10,
    minTime: 100, // 10 requests per second
    reservoir: 1000, // Burst capacity
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 1000, // Refill 100 tokens every second
    highWater: 50, // Queue warning threshold
    strategy: Bottleneck.strategy.OVERFLOW,
  },

  // Enterprise - Enterprise focused (more conservative)
  scientia: {
    maxConcurrent: 5,
    minTime: 200, // 5 requests per second
    reservoir: 500, // Lower burst capacity
    reservoirRefreshAmount: 50,
    reservoirRefreshInterval: 1000,
    highWater: 25,
    strategy: Bottleneck.strategy.BLOCK,
  },

  // Default fallback configuration
  default: {
    maxConcurrent: 3,
    minTime: 300, // 3.33 requests per second
    reservoir: 100,
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 1000,
    highWater: 15,
    strategy: Bottleneck.strategy.LEAK,
  },
};

// Priority weights for request scheduling
const PRIORITY_WEIGHTS = {
  high: 1,
  normal: 5,
  low: 9,
};

export class HuggingFaceRateLimiter {
  private limiters: Map<string, Bottleneck> = new Map();
  private configs: OrganizationLimits;
  private stats: Map<string, RateLimitStats> = new Map();
  private globalLimiter?: Bottleneck;
  private enableLogging: boolean;

  constructor(
    configs: Partial<OrganizationLimits> = {},
    enableGlobalLimit = true,
    enableLogging = process.env.NODE_ENV === 'development'
  ) {
    // Filter out undefined values from configs
    const filteredConfigs: OrganizationLimits = {};
    Object.entries(configs).forEach(([key, value]) => {
      if (value) {
        filteredConfigs[key] = value;
      }
    });
    this.configs = { ...DEFAULT_CONFIGS, ...filteredConfigs };
    this.enableLogging = enableLogging;

    // Create global rate limiter to prevent overwhelming the API
    if (enableGlobalLimit) {
      this.globalLimiter = new Bottleneck({
        maxConcurrent: 20,
        minTime: 50, // 20 requests per second globally
        reservoir: 2000,
        reservoirRefreshAmount: 200,
        reservoirRefreshInterval: 1000,
      });

      this.setupGlobalLimiterEvents();
    }

    // Initialize limiters for predefined organizations
    Object.keys(this.configs).forEach(org => {
      this.createLimiterForOrganization(org);
    });
  }

  private createLimiterForOrganization(organization: string): Bottleneck {
    const config = this.configs[organization] || this.configs.default;

    const limiter = new Bottleneck({
      ...config,
      id: `hf-${organization}`,
    });

    this.setupLimiterEvents(limiter, organization);
    this.limiters.set(organization, limiter);

    // Initialize stats
    this.stats.set(organization, {
      organization,
      pending: 0,
      running: 0,
      done: 0,
      failed: 0,
      queued: 0,
      isBlocked: false,
      reservoir: config.reservoir,
      lastUpdate: new Date(),
    });

    this.log('LIMITER_CREATED', { organization, config });
    return limiter;
  }

  private setupLimiterEvents(limiter: Bottleneck, organization: string): void {
    limiter.on('message', (message) => {
      this.log('LIMITER_MESSAGE', { organization, message });
    });

    limiter.on('error', (error) => {
      this.log('LIMITER_ERROR', { organization, error: error.message });
    });

    limiter.on('empty', () => {
      this.updateStats(organization, { queued: 0 });
      this.log('LIMITER_EMPTY', { organization });
    });

    limiter.on('idle', () => {
      this.updateStats(organization, { pending: 0, running: 0 });
      this.log('LIMITER_IDLE', { organization });
    });

    limiter.on('depleted', (empty) => {
      this.updateStats(organization, { isBlocked: empty });
      if (empty) {
        this.log('LIMITER_DEPLETED', { organization });
      }
    });

    // Update stats on various events
    limiter.on('queued', () => {
      const counts = limiter.counts();
      this.updateStats(organization, {
        queued: counts.QUEUED,
        pending: counts.QUEUED + counts.RUNNING + counts.EXECUTING,
      });
    });

    limiter.on('received', () => {
      const counts = limiter.counts();
      this.updateStats(organization, {
        running: counts.RUNNING + counts.EXECUTING,
        pending: counts.QUEUED + counts.RUNNING + counts.EXECUTING,
      });
    });

    limiter.on('done', () => {
      const stats = this.stats.get(organization);
      if (stats) {
        const counts = limiter.counts();
        this.updateStats(organization, {
          done: stats.done + 1,
          running: counts.RUNNING + counts.EXECUTING,
          pending: counts.QUEUED + counts.RUNNING + counts.EXECUTING,
        });
      }
    });

    limiter.on('failed', () => {
      const stats = this.stats.get(organization);
      if (stats) {
        const counts = limiter.counts();
        this.updateStats(organization, {
          failed: stats.failed + 1,
          running: counts.RUNNING + counts.EXECUTING,
          pending: counts.QUEUED + counts.RUNNING + counts.EXECUTING,
        });
      }
    });
  }

  private setupGlobalLimiterEvents(): void {
    if (!this.globalLimiter) return;

    this.globalLimiter.on('error', (error) => {
      this.log('GLOBAL_LIMITER_ERROR', { error: error.message });
    });

    this.globalLimiter.on('depleted', (empty) => {
      if (empty) {
        this.log('GLOBAL_LIMITER_DEPLETED', {});
      }
    });
  }

  private getLimiterForOrganization(organization: string): Bottleneck {
    let limiter = this.limiters.get(organization);
    if (!limiter) {
      limiter = this.createLimiterForOrganization(organization);
    }
    return limiter;
  }

  private updateStats(organization: string, updates: Partial<RateLimitStats>): void {
    const stats = this.stats.get(organization);
    if (stats) {
      Object.assign(stats, updates, { lastUpdate: new Date() });
    }
  }

  private log(level: string, data: any): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] HF_RATE_LIMITER_${level}:`, JSON.stringify(data, null, 2));
  }

  public async schedule<T>(
    organization: string,
    task: () => Promise<T>,
    options: RequestPriority = { priority: 'normal' }
  ): Promise<T> {
    const limiter = this.getLimiterForOrganization(organization);
    const weight = options.weight || PRIORITY_WEIGHTS[options.priority];

    // Create the bottleneck job
    const job = limiter.schedule({ weight }, async () => {
      // If global limiter is enabled, also schedule through it
      if (this.globalLimiter) {
        return this.globalLimiter.schedule(task);
      }
      return task();
    });

    return job;
  }

  public async scheduleWithRetry<T>(
    organization: string,
    task: () => Promise<T>,
    options: RequestPriority & { maxRetries?: number } = { priority: 'normal', maxRetries: 3 }
  ): Promise<T> {
    let lastError: Error | null = null;
    const maxRetries = options.maxRetries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.schedule(organization, task, options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));

        this.log('RETRY_ATTEMPT', {
          organization,
          attempt: attempt + 1,
          maxRetries,
          error: lastError.message,
          delay,
        });
      }
    }

    throw lastError;
  }

  public updateRateLimitFromResponse(organization: string, rateLimitInfo: RateLimitInfo): void {
    const limiter = this.getLimiterForOrganization(organization);
    const stats = this.stats.get(organization);

    if (rateLimitInfo.remaining !== undefined && rateLimitInfo.limit !== undefined) {
      // Update reservoir based on API response
      const newReservoir = Math.max(0, rateLimitInfo.remaining);

      limiter.updateSettings({
        reservoir: newReservoir,
      });

      if (stats) {
        this.updateStats(organization, { reservoir: newReservoir });
      }

      this.log('RATE_LIMIT_UPDATED', {
        organization,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        reset: rateLimitInfo.reset,
        newReservoir,
      });
    }

    // Handle retry-after from rate limiting
    if (rateLimitInfo.retryAfter) {
      const retryAfterMs = rateLimitInfo.retryAfter;

      // Temporarily reduce reservoir to 0 and set it to refresh after the retry period
      limiter.updateSettings({
        reservoir: 0,
        reservoirRefreshAmount: stats?.reservoir || 100,
        reservoirRefreshInterval: retryAfterMs,
      });

      this.log('RATE_LIMIT_RETRY_AFTER', {
        organization,
        retryAfterMs,
      });
    }
  }

  public getStats(organization?: string): RateLimitStats | Map<string, RateLimitStats> {
    if (organization) {
      return this.stats.get(organization) || {
        organization,
        pending: 0,
        running: 0,
        done: 0,
        failed: 0,
        queued: 0,
        isBlocked: false,
        lastUpdate: new Date(),
      };
    }
    return new Map(this.stats);
  }

  public getGlobalStats(): { pending: number; running: number; queued: number } | null {
    if (!this.globalLimiter) return null;

    const counts = this.globalLimiter.counts();
    return {
      pending: counts.QUEUED + counts.RUNNING + counts.EXECUTING,
      running: counts.RUNNING + counts.EXECUTING,
      queued: counts.QUEUED,
    };
  }

  public async waitForCapacity(organization: string, timeout = 30000): Promise<boolean> {
    const limiter = this.getLimiterForOrganization(organization);

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeout);

      const checkCapacity = async () => {
        try {
          const reservoir = await limiter.currentReservoir();
          if ((reservoir !== null && reservoir > 0) || limiter.queued() === 0) {
            clearTimeout(timer);
            resolve(true);
            return;
          }
          setTimeout(checkCapacity, 100);
        } catch (error) {
          clearTimeout(timer);
          resolve(false);
        }
      };

      checkCapacity();
    });
  }

  public updateConfiguration(organization: string, config: Partial<RateLimitConfig>): void {
    const limiter = this.getLimiterForOrganization(organization);
    const currentConfig = this.configs[organization] || this.configs.default;

    const newConfig = { ...currentConfig, ...config };
    this.configs[organization] = newConfig;

    limiter.updateSettings(newConfig);

    this.log('CONFIG_UPDATED', { organization, newConfig });
  }

  public async stop(): Promise<void> {
    const stopPromises: Promise<any>[] = [];

    // Stop all organization limiters
    for (const [organization, limiter] of this.limiters) {
      stopPromises.push(limiter.stop());
      this.log('LIMITER_STOPPING', { organization });
    }

    // Stop global limiter
    if (this.globalLimiter) {
      stopPromises.push(this.globalLimiter.stop());
      this.log('GLOBAL_LIMITER_STOPPING', {});
    }

    await Promise.all(stopPromises);
    this.log('ALL_LIMITERS_STOPPED', {});
  }

  public resetStats(): void {
    this.stats.clear();
    this.log('STATS_RESET', {});
  }

  public isBlocked(organization: string): boolean {
    const stats = this.stats.get(organization);
    return stats?.isBlocked || false;
  }

  public getQueueSize(organization: string): number {
    const limiter = this.limiters.get(organization);
    return limiter?.queued() || 0;
  }

  public getRunningCount(organization: string): number {
    const limiter = this.limiters.get(organization);
    if (!limiter) return 0;

    const counts = limiter.counts();
    return counts.RUNNING + counts.EXECUTING;
  }

  public getStatistics(): Map<string, RateLimitStats> {
    return new Map(this.stats);
  }

  public clearAll(): void {
    this.limiters.clear();
    this.stats.clear();
    this.globalLimiter = undefined;
    this.log('ALL_LIMITERS_CLEARED', {});
  }
}

// Export a default instance with standard configurations
export default new HuggingFaceRateLimiter();