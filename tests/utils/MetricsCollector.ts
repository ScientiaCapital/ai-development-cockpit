/**
 * Metrics Collector - Comprehensive monitoring and metrics collection for E2E testing
 * Provides real-time performance monitoring, resource tracking, and test analytics
 */

import { Page } from '@playwright/test';
import { performance } from 'perf_hooks';

export interface TestMetrics {
  testId: string;
  testName: string;
  organization: 'swaggystacks' | 'scientia';
  environment: 'development' | 'staging' | 'production';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  performance: PerformanceMetrics;
  resources: ResourceMetrics;
  network: NetworkMetrics;
  errors: ErrorMetric[];
  warnings: WarningMetric[];
  customMetrics: Record<string, any>;
}

export interface PerformanceMetrics {
  pageLoadTime: number; // milliseconds
  timeToInteractive: number; // milliseconds
  firstContentfulPaint: number; // milliseconds
  largestContentfulPaint: number; // milliseconds
  cumulativeLayoutShift: number; // score
  apiResponseTimes: ApiResponseTime[];
  renderTimes: RenderTime[];
  javascriptExecutionTime: number; // milliseconds
  totalBlockingTime: number; // milliseconds
}

export interface ResourceMetrics {
  memoryUsage: MemoryUsage[];
  cpuUsage: CpuUsage[];
  networkBandwidth: NetworkBandwidth[];
  diskUsage: DiskUsage[];
  browserResources: BrowserResourceMetrics;
  requestCounts: RequestCounts;
}

export interface NetworkMetrics {
  requestCount: number;
  totalDataTransferred: number; // bytes
  averageLatency: number; // milliseconds
  maxLatency: number; // milliseconds
  failedRequests: number;
  slowRequests: number; // requests > 1 second
  apiEndpoints: Map<string, EndpointMetrics>;
  connectionTypes: ConnectionTypeMetrics;
}

export interface MemoryUsage {
  timestamp: number;
  used: number; // MB
  total: number; // MB
  percentage: number;
}

export interface CpuUsage {
  timestamp: number;
  percentage: number;
  processes: ProcessUsage[];
}

export interface NetworkBandwidth {
  timestamp: number;
  download: number; // Mbps
  upload: number; // Mbps
  latency: number; // milliseconds
}

export interface DiskUsage {
  timestamp: number;
  read: number; // MB/s
  write: number; // MB/s
  iops: number; // operations per second
}

export interface BrowserResourceMetrics {
  domNodes: number;
  jsHeapSizeUsed: number; // bytes
  jsHeapSizeTotal: number; // bytes
  jsHeapSizeLimit: number; // bytes
  eventListeners: number;
  documents: number;
  frames: number;
}

export interface RequestCounts {
  total: number;
  successful: number;
  failed: number;
  cached: number;
  api: number;
  static: number;
  websocket: number;
}

export interface ApiResponseTime {
  endpoint: string;
  method: string;
  responseTime: number; // milliseconds
  statusCode: number;
  timestamp: number;
}

export interface RenderTime {
  component: string;
  renderTime: number; // milliseconds
  timestamp: number;
}

export interface ProcessUsage {
  name: string;
  cpu: number; // percentage
  memory: number; // MB
}

export interface EndpointMetrics {
  url: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  errorRate: number; // percentage
}

export interface ConnectionTypeMetrics {
  http1: number;
  http2: number;
  http3: number;
  websocket: number;
}

export interface ErrorMetric {
  type: 'javascript' | 'network' | 'console' | 'assertion' | 'timeout';
  message: string;
  stack?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface WarningMetric {
  type: 'performance' | 'accessibility' | 'best_practice' | 'seo';
  message: string;
  timestamp: number;
  impact: 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface MetricsCollectionConfig {
  collectPerformance: boolean;
  collectResources: boolean;
  collectNetwork: boolean;
  collectErrors: boolean;
  collectWarnings: boolean;
  samplingInterval: number; // milliseconds
  maxDataPoints: number;
  enableRealTimeReporting: boolean;
  customMetrics: string[];
}

/**
 * Comprehensive metrics collection system
 */
export class MetricsCollector {
  private page: Page;
  private config: MetricsCollectionConfig;
  private metrics: TestMetrics;
  private isCollecting: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private requestTimings = new WeakMap<any, number>();
  private performanceObserver: PerformanceObserver | null = null;

  constructor(
    page: Page,
    testId: string,
    testName: string,
    organization: 'swaggystacks' | 'scientia',
    environment: 'development' | 'staging' | 'production' = 'development',
    config: Partial<MetricsCollectionConfig> = {}
  ) {
    this.page = page;
    this.config = {
      collectPerformance: true,
      collectResources: true,
      collectNetwork: true,
      collectErrors: true,
      collectWarnings: true,
      samplingInterval: 1000, // 1 second
      maxDataPoints: 300, // 5 minutes at 1 second intervals
      enableRealTimeReporting: false,
      customMetrics: [],
      ...config
    };

    this.metrics = {
      testId,
      testName,
      organization,
      environment,
      startTime: performance.now(),
      status: 'running',
      performance: this.initializePerformanceMetrics(),
      resources: this.initializeResourceMetrics(),
      network: this.initializeNetworkMetrics(),
      errors: [],
      warnings: [],
      customMetrics: {}
    };
  }

  /**
   * Start collecting metrics
   */
  async startCollection(): Promise<void> {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.metrics.startTime = performance.now();
    this.metrics.status = 'running';

    // Set up error listeners
    if (this.config.collectErrors) {
      await this.setupErrorListeners();
    }

    // Set up network monitoring
    if (this.config.collectNetwork) {
      await this.setupNetworkMonitoring();
    }

    // Set up performance monitoring
    if (this.config.collectPerformance) {
      await this.setupPerformanceMonitoring();
    }

    // Start periodic collection
    this.collectionInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.samplingInterval);

    console.log(`📊 Started metrics collection for test: ${this.metrics.testName}`);
  }

  /**
   * Stop collecting metrics
   */
  async stopCollection(): Promise<TestMetrics> {
    if (!this.isCollecting) return this.metrics;

    this.isCollecting = false;
    this.metrics.endTime = performance.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.status = 'completed';

    // Clear intervals
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    // Final metrics collection
    await this.collectFinalMetrics();

    console.log(`📊 Stopped metrics collection for test: ${this.metrics.testName} (Duration: ${this.metrics.duration?.toFixed(0)}ms)`);

    return this.metrics;
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics(): TestMetrics {
    return { ...this.metrics };
  }

  /**
   * Add custom metric
   */
  addCustomMetric(key: string, value: any, timestamp?: number): void {
    this.metrics.customMetrics[key] = {
      value,
      timestamp: timestamp || performance.now()
    };
  }

  /**
   * Record error
   */
  recordError(error: Omit<ErrorMetric, 'timestamp'>): void {
    this.metrics.errors.push({
      ...error,
      timestamp: performance.now()
    });
  }

  /**
   * Record warning
   */
  recordWarning(warning: Omit<WarningMetric, 'timestamp'>): void {
    this.metrics.warnings.push({
      ...warning,
      timestamp: performance.now()
    });
  }

  private async setupErrorListeners(): Promise<void> {
    // JavaScript errors
    this.page.on('pageerror', (error) => {
      this.recordError({
        type: 'javascript',
        message: error.message,
        stack: error.stack,
        severity: 'high'
      });
    });

    // Console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.recordError({
          type: 'console',
          message: msg.text(),
          severity: 'medium'
        });
      }
    });

    // Request failures
    this.page.on('requestfailed', (request) => {
      this.recordError({
        type: 'network',
        message: `Request failed: ${request.url()}`,
        severity: 'medium',
        context: {
          url: request.url(),
          method: request.method(),
          failure: request.failure()?.errorText
        }
      });
    });
  }

  private async setupNetworkMonitoring(): Promise<void> {
    // Monitor all requests
    this.page.on('request', (request) => {
      const timestamp = performance.now();
      this.requestTimings.set(request, timestamp);
    });

    this.page.on('response', async (response) => {
      const request = response.request();
      const startTime = this.requestTimings.get(request) || performance.now();
      const responseTime = performance.now() - startTime;

      // Record API response time
      if (this.isApiRequest(request.url())) {
        this.metrics.performance.apiResponseTimes.push({
          endpoint: request.url(),
          method: request.method(),
          responseTime,
          statusCode: response.status(),
          timestamp: performance.now()
        });
      }

      // Update network metrics
      this.updateNetworkMetrics(request.url(), request.method(), responseTime, response.status());

      // Check for slow requests
      if (responseTime > 1000) {
        this.metrics.network.slowRequests++;
        this.recordWarning({
          type: 'performance',
          message: `Slow request detected: ${request.url()} (${responseTime.toFixed(0)}ms)`,
          impact: 'medium',
          recommendation: 'Consider optimizing this API endpoint or implementing caching'
        });
      }
    });
  }

  private async setupPerformanceMonitoring(): Promise<void> {
    // Collect web vitals and performance metrics
    await this.page.addInitScript(() => {
      // Performance metrics collection script
      window.metricsCollector = {
        performanceEntries: [],
        vitals: {},

        collectVitals: () => {
          try {
            // Collect Web Vitals
            const paint = performance.getEntriesByType('paint' as any);
            const navigation = performance.getEntriesByType('navigation' as any)[0] as PerformanceNavigationTiming;

            return {
              firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
              largestContentfulPaint: 0, // Will be updated by LCP observer
              timeToInteractive: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
              pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0
            };
          } catch (error) {
            console.error('Error collecting vitals:', error);
            return {};
          }
        },

        getResourceMetrics: () => {
          try {
            const resources = performance.getEntriesByType('resource');
            return {
              totalResources: resources.length,
              totalSize: resources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0),
              averageResponseTime: resources.length > 0 ?
                resources.reduce((sum, r) => sum + r.duration, 0) / resources.length : 0
            };
          } catch (error) {
            console.error('Error collecting resource metrics:', error);
            return {};
          }
        },

        getMemoryInfo: () => {
          try {
            if ('memory' in performance) {
              const memory = (performance as any).memory;
              return {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
              };
            }
            return {};
          } catch (error) {
            console.error('Error collecting memory info:', error);
            return {};
          }
        }
      };

      // Set up Largest Contentful Paint observer
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            window.metricsCollector.vitals.largestContentfulPaint = lastEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Set up Cumulative Layout Shift observer
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            let clsValue = 0;
            entries.forEach((entry) => {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            });
            window.metricsCollector.vitals.cumulativeLayoutShift = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
          console.error('Error setting up performance observers:', error);
        }
      }
    });
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect performance metrics
      if (this.config.collectPerformance) {
        await this.collectPerformanceMetrics();
      }

      // Collect resource metrics
      if (this.config.collectResources) {
        await this.collectResourceMetrics();
      }

      // Trim data points if exceeding max
      this.trimDataPoints();

    } catch (error) {
      this.recordError({
        type: 'javascript',
        message: `Metrics collection error: ${error.message}`,
        severity: 'low'
      });
    }
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      const vitals = await this.page.evaluate(() => {
        return window.metricsCollector?.collectVitals() || {};
      });

      const resourceMetrics = await this.page.evaluate(() => {
        return window.metricsCollector?.getResourceMetrics() || {};
      });

      // Update performance metrics
      if (vitals.firstContentfulPaint) {
        this.metrics.performance.firstContentfulPaint = vitals.firstContentfulPaint;
      }
      if (vitals.largestContentfulPaint) {
        this.metrics.performance.largestContentfulPaint = vitals.largestContentfulPaint;
      }
      if (vitals.timeToInteractive) {
        this.metrics.performance.timeToInteractive = vitals.timeToInteractive;
      }
      if (vitals.pageLoadTime) {
        this.metrics.performance.pageLoadTime = vitals.pageLoadTime;
      }

    } catch (error) {
      // Silently handle errors to avoid breaking test execution
    }
  }

  private async collectResourceMetrics(): Promise<void> {
    try {
      const memoryInfo = await this.page.evaluate(() => {
        return window.metricsCollector?.getMemoryInfo() || {};
      });

      if (memoryInfo.used !== undefined) {
        const timestamp = performance.now();
        this.metrics.resources.memoryUsage.push({
          timestamp,
          used: Math.round(memoryInfo.used / 1024 / 1024), // Convert to MB
          total: Math.round(memoryInfo.total / 1024 / 1024),
          percentage: memoryInfo.total > 0 ? (memoryInfo.used / memoryInfo.total) * 100 : 0
        });

        // Update browser resource metrics
        this.metrics.resources.browserResources.jsHeapSizeUsed = memoryInfo.used;
        this.metrics.resources.browserResources.jsHeapSizeTotal = memoryInfo.total;
        this.metrics.resources.browserResources.jsHeapSizeLimit = memoryInfo.limit || 0;
      }

      // Simulate CPU usage (in real implementation, this would come from system monitoring)
      const timestamp = performance.now();
      this.metrics.resources.cpuUsage.push({
        timestamp,
        percentage: 10 + Math.random() * 20, // Mock data: 10-30% CPU usage
        processes: [
          { name: 'chrome', cpu: 5 + Math.random() * 15, memory: 100 + Math.random() * 200 },
          { name: 'playwright', cpu: 2 + Math.random() * 8, memory: 50 + Math.random() * 100 }
        ]
      });

    } catch (error) {
      // Silently handle errors
    }
  }

  private async collectFinalMetrics(): Promise<void> {
    // Final performance snapshot
    await this.collectPerformanceMetrics();

    // Calculate network metrics aggregates
    this.calculateNetworkAggregates();

    // Calculate performance aggregates
    this.calculatePerformanceAggregates();

    // Check for performance warnings
    this.checkPerformanceWarnings();
  }

  private calculateNetworkAggregates(): void {
    const responses = this.metrics.performance.apiResponseTimes;

    if (responses.length > 0) {
      this.metrics.network.requestCount = responses.length;
      this.metrics.network.averageLatency = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
      this.metrics.network.maxLatency = Math.max(...responses.map(r => r.responseTime));
      this.metrics.network.failedRequests = responses.filter(r => r.statusCode >= 400).length;
    }
  }

  private calculatePerformanceAggregates(): void {
    const renderTimes = this.metrics.performance.renderTimes;

    if (renderTimes.length > 0) {
      // Calculate average render time
      const avgRenderTime = renderTimes.reduce((sum, r) => sum + r.renderTime, 0) / renderTimes.length;
      this.addCustomMetric('averageRenderTime', avgRenderTime);
    }

    // Calculate memory efficiency
    const memoryUsage = this.metrics.resources.memoryUsage;
    if (memoryUsage.length > 0) {
      const avgMemoryUsage = memoryUsage.reduce((sum, m) => sum + m.percentage, 0) / memoryUsage.length;
      this.addCustomMetric('averageMemoryUsage', avgMemoryUsage);
    }
  }

  private checkPerformanceWarnings(): void {
    // Check for high memory usage
    const memoryUsage = this.metrics.resources.memoryUsage;
    if (memoryUsage.length > 0) {
      const maxMemoryUsage = Math.max(...memoryUsage.map(m => m.percentage));
      if (maxMemoryUsage > 80) {
        this.recordWarning({
          type: 'performance',
          message: `High memory usage detected: ${maxMemoryUsage.toFixed(1)}%`,
          impact: 'high',
          recommendation: 'Consider optimizing memory usage or increasing available memory'
        });
      }
    }

    // Check for slow page load
    if (this.metrics.performance.pageLoadTime > 3000) {
      this.recordWarning({
        type: 'performance',
        message: `Slow page load time: ${this.metrics.performance.pageLoadTime.toFixed(0)}ms`,
        impact: 'medium',
        recommendation: 'Optimize page load performance by reducing bundle size or improving caching'
      });
    }

    // Check for high error rate
    const errorRate = this.metrics.errors.length / Math.max(this.metrics.network.requestCount, 1);
    if (errorRate > 0.05) { // 5% error rate
      this.recordWarning({
        type: 'performance',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        impact: 'high',
        recommendation: 'Investigate and fix errors to improve system reliability'
      });
    }
  }

  private updateNetworkMetrics(url: string, method: string, responseTime: number, statusCode: number): void {
    const endpoint = this.normalizeEndpoint(url);

    if (!this.metrics.network.apiEndpoints.has(endpoint)) {
      this.metrics.network.apiEndpoints.set(endpoint, {
        url: endpoint,
        method,
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        errorRate: 0
      });
    }

    const endpointMetrics = this.metrics.network.apiEndpoints.get(endpoint)!;
    endpointMetrics.totalRequests++;

    if (statusCode < 400) {
      endpointMetrics.successfulRequests++;
    }

    // Update response time statistics
    endpointMetrics.maxResponseTime = Math.max(endpointMetrics.maxResponseTime, responseTime);
    endpointMetrics.minResponseTime = Math.min(endpointMetrics.minResponseTime, responseTime);
    endpointMetrics.averageResponseTime =
      (endpointMetrics.averageResponseTime * (endpointMetrics.totalRequests - 1) + responseTime) / endpointMetrics.totalRequests;

    // Update error rate
    endpointMetrics.errorRate =
      ((endpointMetrics.totalRequests - endpointMetrics.successfulRequests) / endpointMetrics.totalRequests) * 100;
  }

  private normalizeEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query parameters and fragments for grouping
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  private isApiRequest(url: string): boolean {
    return url.includes('/api/') ||
           url.includes('/models/') ||
           url.includes('/deployments/') ||
           url.includes('huggingface.co') ||
           url.includes('runpod.io');
  }

  private trimDataPoints(): void {
    const maxDataPoints = this.config.maxDataPoints;

    // Trim memory usage data
    if (this.metrics.resources.memoryUsage.length > maxDataPoints) {
      this.metrics.resources.memoryUsage = this.metrics.resources.memoryUsage.slice(-maxDataPoints);
    }

    // Trim CPU usage data
    if (this.metrics.resources.cpuUsage.length > maxDataPoints) {
      this.metrics.resources.cpuUsage = this.metrics.resources.cpuUsage.slice(-maxDataPoints);
    }

    // Trim API response times (keep recent ones)
    if (this.metrics.performance.apiResponseTimes.length > maxDataPoints) {
      this.metrics.performance.apiResponseTimes = this.metrics.performance.apiResponseTimes.slice(-maxDataPoints);
    }
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: 0,
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      apiResponseTimes: [],
      renderTimes: [],
      javascriptExecutionTime: 0,
      totalBlockingTime: 0
    };
  }

  private initializeResourceMetrics(): ResourceMetrics {
    return {
      memoryUsage: [],
      cpuUsage: [],
      networkBandwidth: [],
      diskUsage: [],
      browserResources: {
        domNodes: 0,
        jsHeapSizeUsed: 0,
        jsHeapSizeTotal: 0,
        jsHeapSizeLimit: 0,
        eventListeners: 0,
        documents: 0,
        frames: 0
      },
      requestCounts: {
        total: 0,
        successful: 0,
        failed: 0,
        cached: 0,
        api: 0,
        static: 0,
        websocket: 0
      }
    };
  }

  private initializeNetworkMetrics(): NetworkMetrics {
    return {
      requestCount: 0,
      totalDataTransferred: 0,
      averageLatency: 0,
      maxLatency: 0,
      failedRequests: 0,
      slowRequests: 0,
      apiEndpoints: new Map(),
      connectionTypes: {
        http1: 0,
        http2: 0,
        http3: 0,
        websocket: 0
      }
    };
  }

  /**
   * Export metrics for analysis or reporting
   */
  exportMetrics(): string {
    return JSON.stringify({
      ...this.metrics,
      apiEndpoints: Array.from(this.metrics.network.apiEndpoints.entries())
    }, null, 2);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const duration = this.metrics.duration || 0;
    const errorCount = this.metrics.errors.length;
    const warningCount = this.metrics.warnings.length;

    return [
      `# Performance Report - ${this.metrics.testName}`,
      `**Test ID:** ${this.metrics.testId}`,
      `**Organization:** ${this.metrics.organization}`,
      `**Environment:** ${this.metrics.environment}`,
      `**Duration:** ${duration.toFixed(0)}ms`,
      `**Status:** ${this.metrics.status}`,
      ``,
      `## Performance Metrics`,
      `- Page Load Time: ${this.metrics.performance.pageLoadTime.toFixed(0)}ms`,
      `- Time to Interactive: ${this.metrics.performance.timeToInteractive.toFixed(0)}ms`,
      `- First Contentful Paint: ${this.metrics.performance.firstContentfulPaint.toFixed(0)}ms`,
      `- Largest Contentful Paint: ${this.metrics.performance.largestContentfulPaint.toFixed(0)}ms`,
      `- Cumulative Layout Shift: ${this.metrics.performance.cumulativeLayoutShift.toFixed(3)}`,
      ``,
      `## Network Metrics`,
      `- Total Requests: ${this.metrics.network.requestCount}`,
      `- Average Latency: ${this.metrics.network.averageLatency.toFixed(0)}ms`,
      `- Max Latency: ${this.metrics.network.maxLatency.toFixed(0)}ms`,
      `- Failed Requests: ${this.metrics.network.failedRequests}`,
      `- Slow Requests: ${this.metrics.network.slowRequests}`,
      ``,
      `## Resource Usage`,
      this.metrics.resources.memoryUsage.length > 0 ? [
        `- Average Memory Usage: ${this.metrics.customMetrics.averageMemoryUsage?.value?.toFixed(1) || 'N/A'}%`,
        `- Peak Memory Usage: ${Math.max(...this.metrics.resources.memoryUsage.map(m => m.percentage)).toFixed(1)}%`
      ].join('\n') : '',
      ``,
      errorCount > 0 ? [
        `## Errors (${errorCount})`,
        this.metrics.errors.slice(0, 5).map(error =>
          `- **${error.type}**: ${error.message}`
        ).join('\n'),
        errorCount > 5 ? `- ... and ${errorCount - 5} more errors` : '',
        ``
      ].join('\n') : '',
      warningCount > 0 ? [
        `## Warnings (${warningCount})`,
        this.metrics.warnings.slice(0, 5).map(warning =>
          `- **${warning.type}**: ${warning.message}`
        ).join('\n'),
        warningCount > 5 ? `- ... and ${warningCount - 5} more warnings` : '',
        ``
      ].join('\n') : '',
      `## API Endpoints`,
      Array.from(this.metrics.network.apiEndpoints.entries()).slice(0, 10).map(([endpoint, metrics]) =>
        `- **${endpoint}**: ${metrics.totalRequests} requests, ${metrics.averageResponseTime.toFixed(0)}ms avg, ${metrics.errorRate.toFixed(1)}% error rate`
      ).join('\n')
    ].filter(line => line !== '').join('\n');
  }
}

// Type declarations for browser-injected metrics collector
declare global {
  interface Window {
    metricsCollector?: {
      performanceEntries: any[];
      vitals: any;
      collectVitals: () => any;
      getResourceMetrics: () => any;
      getMemoryInfo: () => any;
    };
  }
}