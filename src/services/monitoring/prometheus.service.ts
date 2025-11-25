/**
 * Prometheus Metrics Service
 * Comprehensive metrics collection and exposition for production monitoring
 * Integrates with existing RunPod monitoring service and provides organization-specific metrics
 */

import client from 'prom-client';
import { DeploymentMonitoring } from '../runpod/monitoring.service';

// Organization types for metric labeling
export type Organization = 'arcade' | 'enterprise' | 'shared';

// Custom metric interfaces
export interface ApiMetrics {
  httpRequestDuration: client.Histogram<string>;
  httpRequestTotal: client.Counter<string>;
  httpRequestsInFlight: client.Gauge<string>;
}

export interface BusinessMetrics {
  modelInferences: client.Counter<string>;
  inferenceLatency: client.Histogram<string>;
  activeUsers: client.Gauge<string>;
  costPerInference: client.Histogram<string>;
  organizationActivity: client.Counter<string>;
}

export interface SystemMetrics {
  deploymentHealth: client.Gauge<string>;
  resourceUtilization: client.Gauge<string>;
  alertsActive: client.Gauge<string>;
  uptime: client.Gauge<string>;
}

/**
 * Core Prometheus metrics collection service
 * Provides organization-specific metrics and integrates with existing monitoring
 */
export class PrometheusService {
  private static instance: PrometheusService;
  private registry: client.Registry;
  private apiMetrics!: ApiMetrics;
  private businessMetrics!: BusinessMetrics;
  private systemMetrics!: SystemMetrics;
  private isInitialized = false;

  private constructor() {
    this.registry = new client.Registry();
    this.initializeMetrics();
  }

  public static getInstance(): PrometheusService {
    if (!PrometheusService.instance) {
      PrometheusService.instance = new PrometheusService();
    }
    return PrometheusService.instance;
  }

  /**
   * Initialize all metric types with proper labels and configurations
   */
  private initializeMetrics(): void {
    // Set default labels for all metrics
    this.registry.setDefaultLabels({
      service: 'dual-domain-llm-platform',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    });

    this.initializeApiMetrics();
    this.initializeBusinessMetrics();
    this.initializeSystemMetrics();
    this.collectDefaultMetrics();

    this.isInitialized = true;
  }

  /**
   * Initialize API-related metrics for request tracking
   */
  private initializeApiMetrics(): void {
    this.apiMetrics = {
      httpRequestDuration: new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code', 'organization'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
        registers: [this.registry],
      }),

      httpRequestTotal: new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code', 'organization'],
        registers: [this.registry],
      }),

      httpRequestsInFlight: new client.Gauge({
        name: 'http_requests_in_flight',
        help: 'Number of HTTP requests currently being processed',
        labelNames: ['method', 'route', 'organization'],
        registers: [this.registry],
      }),
    };
  }

  /**
   * Initialize business-related metrics for KPI tracking
   */
  private initializeBusinessMetrics(): void {
    this.businessMetrics = {
      modelInferences: new client.Counter({
        name: 'model_inferences_total',
        help: 'Total number of model inferences performed',
        labelNames: ['model_name', 'organization', 'status'],
        registers: [this.registry],
      }),

      inferenceLatency: new client.Histogram({
        name: 'model_inference_duration_seconds',
        help: 'Duration of model inference requests in seconds',
        labelNames: ['model_name', 'organization'],
        buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
        registers: [this.registry],
      }),

      activeUsers: new client.Gauge({
        name: 'active_users_current',
        help: 'Number of currently active users',
        labelNames: ['organization', 'time_window'],
        registers: [this.registry],
      }),

      costPerInference: new client.Histogram({
        name: 'inference_cost_usd',
        help: 'Cost per inference in USD',
        labelNames: ['model_name', 'organization', 'provider'],
        buckets: [0.001, 0.01, 0.1, 1, 10],
        registers: [this.registry],
      }),

      organizationActivity: new client.Counter({
        name: 'organization_activity_total',
        help: 'Total organization activity events',
        labelNames: ['organization', 'activity_type'],
        registers: [this.registry],
      }),
    };
  }

  /**
   * Initialize system-related metrics for infrastructure monitoring
   */
  private initializeSystemMetrics(): void {
    this.systemMetrics = {
      deploymentHealth: new client.Gauge({
        name: 'deployment_health_status',
        help: 'Health status of deployments (1=healthy, 0=unhealthy)',
        labelNames: ['endpoint_id', 'model_name', 'organization'],
        registers: [this.registry],
      }),

      resourceUtilization: new client.Gauge({
        name: 'resource_utilization_percent',
        help: 'Resource utilization percentage',
        labelNames: ['resource_type', 'endpoint_id', 'organization'],
        registers: [this.registry],
      }),

      alertsActive: new client.Gauge({
        name: 'alerts_active_count',
        help: 'Number of active alerts',
        labelNames: ['severity', 'alert_type', 'organization'],
        registers: [this.registry],
      }),

      uptime: new client.Gauge({
        name: 'service_uptime_seconds',
        help: 'Service uptime in seconds',
        labelNames: ['service_name', 'organization'],
        registers: [this.registry],
      }),
    };
  }

  /**
   * Collect default Node.js metrics with organization-specific prefixes
   */
  private collectDefaultMetrics(): void {
    client.collectDefaultMetrics({
      register: this.registry,
      prefix: 'nodejs_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });
  }

  /**
   * Record HTTP request metrics
   */
  public recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    organization: Organization = 'shared'
  ): void {
    const labels = {
      method: method.toUpperCase(),
      route,
      status_code: statusCode.toString(),
      organization,
    };

    this.apiMetrics.httpRequestDuration.observe(labels, duration / 1000);
    this.apiMetrics.httpRequestTotal.inc(labels);
  }

  /**
   * Record model inference metrics
   */
  public recordModelInference(
    modelName: string,
    duration: number,
    cost: number,
    organization: Organization,
    status: 'success' | 'error' = 'success'
  ): void {
    const labels = { model_name: modelName, organization };

    this.businessMetrics.modelInferences.inc({ ...labels, status });
    this.businessMetrics.inferenceLatency.observe(labels, duration / 1000);
    this.businessMetrics.costPerInference.observe({
      ...labels,
      provider: 'runpod'
    }, cost);
  }

  /**
   * Update deployment health metrics from existing monitoring service
   */
  public updateDeploymentMetrics(monitoring: DeploymentMonitoring[]): void {
    monitoring.forEach((deployment) => {
      const organization = this.getOrganizationFromEndpoint(deployment.endpointId);

      // Update health status
      const healthValue = deployment.healthStatus === 'healthy' ? 1 : 0;
      this.systemMetrics.deploymentHealth.set({
        endpoint_id: deployment.endpointId,
        model_name: deployment.endpoint?.name || 'unknown',
        organization,
      }, healthValue);

      // Update resource utilization
      if (deployment.metrics) {
        const resources = [
          { type: 'cpu', value: 0 }, // CPU usage not available in EndpointMetrics
          { type: 'memory', value: deployment.metrics.memoryUsage || 0 },
          { type: 'gpu', value: deployment.metrics.gpuUtilization || 0 },
        ];

        resources.forEach(({ type, value }) => {
          this.systemMetrics.resourceUtilization.set({
            resource_type: type,
            endpoint_id: deployment.endpointId,
            organization,
          }, value);
        });
      }

      // Update active alerts
      const alertCounts = this.categorizeAlerts(deployment.alerts || []);
      Object.entries(alertCounts).forEach(([severity, count]) => {
        this.systemMetrics.alertsActive.set({
          severity,
          alert_type: 'deployment',
          organization,
        }, count);
      });
    });
  }

  /**
   * Update active user metrics
   */
  public updateActiveUsers(organization: Organization, count: number, timeWindow: string = '5m'): void {
    this.systemMetrics.uptime.set({
      organization,
      time_window: timeWindow,
    }, count);
  }

  /**
   * Record organization activity
   */
  public recordOrganizationActivity(organization: Organization, activityType: string): void {
    this.businessMetrics.organizationActivity.inc({
      organization,
      activity_type: activityType,
    });
  }

  /**
   * Increment in-flight requests
   */
  public incrementInFlightRequests(method: string, route: string, organization: Organization = 'shared'): void {
    this.apiMetrics.httpRequestsInFlight.inc({ method, route, organization });
  }

  /**
   * Decrement in-flight requests
   */
  public decrementInFlightRequests(method: string, route: string, organization: Organization = 'shared'): void {
    this.apiMetrics.httpRequestsInFlight.dec({ method, route, organization });
  }

  /**
   * Get metrics in Prometheus format for exposition
   */
  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics for specific organization
   */
  public async getOrganizationMetrics(organization: Organization): Promise<string> {
    const allMetrics = await this.registry.metrics();

    // Filter metrics by organization label
    const lines = allMetrics.split('\n');
    const filteredLines = lines.filter(line => {
      // Skip comment and help lines
      if (line.startsWith('#') || line.trim() === '') return true;

      // Include lines that contain the organization label or no organization label
      return line.includes(`organization="${organization}"`) ||
             !line.includes('organization=');
    });

    return filteredLines.join('\n');
  }

  /**
   * Get registry instance for advanced usage
   */
  public getRegistry(): client.Registry {
    return this.registry;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  public reset(): void {
    this.registry.clear();
    this.initializeMetrics();
  }

  /**
   * Get initialization status
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Determine organization from endpoint ID or other context
   */
  private getOrganizationFromEndpoint(endpointId: string): Organization {
    // Logic to determine organization based on endpoint ID or other context
    if (endpointId.includes('arcade') || endpointId.includes('dev')) {
      return 'arcade';
    }
    if (endpointId.includes('enterprise') || endpointId.includes('corp')) {
      return 'enterprise';
    }
    return 'shared';
  }

  /**
   * Categorize alerts by severity
   */
  private categorizeAlerts(alerts: any[]): Record<string, number> {
    const counts = { critical: 0, warning: 0, info: 0 };

    alerts.forEach(alert => {
      if (!alert.resolved) {
        const severity = alert.severity || 'info';
        if (severity in counts) {
          counts[severity as keyof typeof counts]++;
        }
      }
    });

    return counts;
  }
}

// Export singleton instance
export const prometheusService = PrometheusService.getInstance();
export default prometheusService;