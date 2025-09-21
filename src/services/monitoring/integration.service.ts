/**
 * Monitoring Integration Service
 * Connects new monitoring infrastructure with existing RunPod monitoring service
 * Provides unified monitoring data aggregation and cross-system metrics correlation
 */

import { prometheusService, Organization } from './prometheus.service';
import { loggingService } from './logging.service';
import { tracingService } from './tracing.service';
import DeploymentMonitoringService, { DeploymentMonitoring } from '../runpod/monitoring.service';
import { RunPodClient } from '../runpod/client';

export interface MonitoringDashboardData {
  organization: Organization;
  summary: {
    totalEndpoints: number;
    healthyEndpoints: number;
    activeAlerts: number;
    totalCost: number;
    avgResponseTime: number;
    uptime: number;
  };
  deployments: DeploymentMonitoring[];
  recentAlerts: any[];
  performanceMetrics: {
    cpuUtilization: number;
    memoryUtilization: number;
    gpuUtilization: number;
    requestsPerSecond: number;
  };
  businessMetrics?: {
    totalInferences: number;
    costPerInference: number;
    activeUsers: number;
    revenueToday: number;
  };
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    prometheus: boolean;
    logging: boolean;
    tracing: boolean;
    runpodMonitoring: boolean;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

/**
 * Integration service for unified monitoring across all systems
 */
export class MonitoringIntegrationService {
  private static instance: MonitoringIntegrationService;
  private runpodMonitoring: DeploymentMonitoringService;
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {
    const runpodClient = new RunPodClient({
      apiKey: process.env.RUNPOD_API_KEY || '',
      timeout: 30000,
      retries: 3
    });
    this.runpodMonitoring = new DeploymentMonitoringService(runpodClient, {
      pollInterval: 30000, // 30 seconds
      metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
      enableAlerting: true,
      alertThresholds: {
        errorRatePercent: 5,
        responseTimeMs: 2000,
        gpuUtilizationPercent: 90,
        memoryUsagePercent: 85,
        uptimeThresholdPercent: 99.5,
      },
    });
  }

  public static getInstance(): MonitoringIntegrationService {
    if (!MonitoringIntegrationService.instance) {
      MonitoringIntegrationService.instance = new MonitoringIntegrationService();
    }
    return MonitoringIntegrationService.instance;
  }

  /**
   * Start integrated monitoring with cross-system data synchronization
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      loggingService.warn('Monitoring integration already running');
      return;
    }

    try {
      // Start tracing service
      tracingService.start();

      // RunPod monitoring starts automatically in constructor

      // Start periodic data synchronization
      this.startPeriodicSync();

      this.isRunning = true;

      loggingService.info('Monitoring integration started successfully', {
        prometheusReady: prometheusService.isReady(),
        tracingReady: tracingService.isReady(),
        runpodMonitoringActive: true,
      });

    } catch (error) {
      loggingService.error('Failed to start monitoring integration', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Stop integrated monitoring and cleanup resources
   */
  public async stop(): Promise<void> {
    try {
      this.isRunning = false;

      // Stop periodic sync
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Stop services
      await tracingService.shutdown();
      this.runpodMonitoring.destroy();

      loggingService.info('Monitoring integration stopped successfully');

    } catch (error) {
      loggingService.error('Failed to stop monitoring integration', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get unified dashboard data for specific organization
   */
  public async getDashboardData(organization: Organization): Promise<MonitoringDashboardData> {
    return tracingService.traceOperation(
      'get_dashboard_data',
      async () => {
        try {
          const deployments = this.runpodMonitoring.getAllMonitoring();
          const stats = this.runpodMonitoring.getStats();
          const alerts = this.runpodMonitoring.getActiveAlerts();

          // Filter data by organization
          const orgDeployments = deployments.filter(d =>
            this.getOrganizationFromEndpoint(d.endpointId) === organization
          );

          const dashboardData: MonitoringDashboardData = {
            organization,
            summary: {
              totalEndpoints: orgDeployments.length,
              healthyEndpoints: orgDeployments.filter(d => d.healthStatus === 'healthy').length,
              activeAlerts: alerts.filter(a => !a.resolved).length,
              totalCost: stats.totalCost,
              avgResponseTime: stats.avgResponseTime,
              uptime: stats.uptime,
            },
            deployments: orgDeployments,
            recentAlerts: alerts.slice(-10), // Last 10 alerts
            performanceMetrics: this.calculatePerformanceMetrics(orgDeployments),
            businessMetrics: await this.getBusinessMetrics(organization),
          };

          // Record dashboard access
          prometheusService.recordOrganizationActivity(organization, 'dashboard_access');

          loggingService.info('Dashboard data generated', {
            organization,
            endpointsCount: orgDeployments.length,
            alertsCount: alerts.length,
          });

          return dashboardData;

        } catch (error) {
          loggingService.error('Failed to generate dashboard data', {
            organization,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },
      { organization, operationId: `dashboard_${organization}_${Date.now()}` }
    );
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): SystemHealth {
    const services = {
      prometheus: prometheusService.isReady(),
      logging: true,
      tracing: tracingService.isReady(),
      runpodMonitoring: this.isRunning,
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    let overall: SystemHealth['overall'];
    if (healthyServices === totalServices) {
      overall = 'healthy';
    } else if (healthyServices >= totalServices * 0.8) {
      overall = 'warning';
    } else {
      overall = 'critical';
    }

    const stats = this.runpodMonitoring.getStats();

    return {
      overall,
      services,
      metrics: {
        responseTime: stats.avgResponseTime,
        errorRate: (1 - stats.uptime) * 100, // Rough error rate calculation
        throughput: stats.totalRequests / (stats.uptime || 1),
      },
    };
  }

  /**
   * Update Prometheus metrics with RunPod monitoring data
   */
  public syncMetricsToPrometheus(): void {
    try {
      const deployments = this.runpodMonitoring.getAllMonitoring();

      // Update deployment metrics in Prometheus
      prometheusService.updateDeploymentMetrics(deployments);

      // Record successful sync
      loggingService.debug('Metrics synchronized to Prometheus', {
        deploymentsCount: deployments.length,
      });

    } catch (error) {
      loggingService.error('Failed to sync metrics to Prometheus', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Record model inference with full monitoring context
   */
  public recordModelInference(
    modelName: string,
    organization: Organization,
    duration: number,
    cost: number,
    inputTokens?: number,
    outputTokens?: number,
    success: boolean = true,
    errorCode?: string
  ): Promise<void> {
    return tracingService.traceOperation(
      'record_model_inference',
      async () => {
        // Record in Prometheus
        prometheusService.recordModelInference(modelName, duration, cost, organization, success ? 'success' : 'error');

        // Log detailed inference data
        loggingService.modelInference({
          modelName,
          organization,
          inputTokens,
          outputTokens,
          cost,
          latency: duration,
          success,
          errorCode,
          provider: 'runpod',
        });

        // Record business activity
        prometheusService.recordOrganizationActivity(organization, 'model_inference');
      },
      {
        organization,
        modelName,
        operationId: `inference_${modelName}_${Date.now()}`,
      }
    );
  }

  /**
   * Handle monitoring alerts with cross-system correlation
   */
  public handleAlert(
    alertType: string,
    severity: 'critical' | 'warning' | 'info',
    message: string,
    context: {
      organization?: Organization;
      endpointId?: string;
      modelName?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    // Log security events if applicable
    if (alertType.includes('security') || alertType.includes('auth')) {
      const securitySeverity: 'low' | 'medium' | 'high' | 'critical' =
        severity === 'info' ? 'low' :
        severity === 'warning' ? 'medium' : 'critical';

      loggingService.security(message, {
        eventType: 'suspicious_activity',
        severity: securitySeverity,
        organization: context.organization,
        endpointId: context.endpointId,
        metadata: context.metadata,
      });
    } else {
      loggingService.warn(message, {
        alertType,
        severity,
        ...context,
      });
    }

    // Record in Prometheus
    if (context.organization) {
      prometheusService.recordOrganizationActivity(context.organization, `alert_${alertType}`);
    }
  }

  /**
   * Start periodic synchronization between monitoring systems
   */
  private startPeriodicSync(): void {
    this.updateInterval = setInterval(() => {
      this.syncMetricsToPrometheus();
    }, 30000); // Sync every 30 seconds

    loggingService.info('Periodic monitoring sync started', {
      interval: '30s',
    });
  }

  /**
   * Calculate performance metrics from deployment data
   */
  private calculatePerformanceMetrics(deployments: DeploymentMonitoring[]): MonitoringDashboardData['performanceMetrics'] {
    if (deployments.length === 0) {
      return {
        cpuUtilization: 0,
        memoryUtilization: 0,
        gpuUtilization: 0,
        requestsPerSecond: 0,
      };
    }

    const totals = deployments.reduce(
      (acc, deployment) => {
        const metrics = deployment.metrics;
        if (metrics) {
          acc.cpu += 0; // CPU usage not available in EndpointMetrics
          acc.memory += metrics.memoryUsage || 0;
          acc.gpu += metrics.gpuUtilization || 0;
          acc.requests += 0; // Requests per second not available in EndpointMetrics
        }
        return acc;
      },
      { cpu: 0, memory: 0, gpu: 0, requests: 0 }
    );

    return {
      cpuUtilization: totals.cpu / deployments.length,
      memoryUtilization: totals.memory / deployments.length,
      gpuUtilization: totals.gpu / deployments.length,
      requestsPerSecond: totals.requests,
    };
  }

  /**
   * Get business metrics for organization
   */
  private async getBusinessMetrics(organization: Organization): Promise<MonitoringDashboardData['businessMetrics']> {
    // This would typically query a business metrics database
    // For now, return mock data based on organization type
    const baseMetrics = {
      totalInferences: Math.floor(Math.random() * 10000),
      costPerInference: 0.01 + Math.random() * 0.05,
      activeUsers: Math.floor(Math.random() * 100),
      revenueToday: Math.random() * 1000,
    };

    // Organization-specific adjustments
    if (organization === 'scientia_capital') {
      baseMetrics.totalInferences *= 2; // Enterprise usage
      baseMetrics.activeUsers *= 3;
      baseMetrics.revenueToday *= 5;
    }

    return baseMetrics;
  }

  /**
   * Determine organization from endpoint ID
   */
  private getOrganizationFromEndpoint(endpointId: string): Organization {
    if (endpointId.includes('swaggystacks') || endpointId.includes('dev')) {
      return 'swaggystacks';
    }
    if (endpointId.includes('scientia') || endpointId.includes('corp')) {
      return 'scientia_capital';
    }
    return 'shared';
  }

  /**
   * Check if integration is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get RunPod monitoring service instance
   */
  public getRunPodMonitoring(): DeploymentMonitoringService {
    return this.runpodMonitoring;
  }
}

// Export singleton instance
export const monitoringIntegration = MonitoringIntegrationService.getInstance();
export default monitoringIntegration;