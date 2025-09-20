/**
 * RunPod Deployment Monitoring Service
 * Provides real-time monitoring, metrics collection, and alerting for deployments
 */

import { EventEmitter } from 'events';
import RunPodClient, { EndpointResponse, EndpointMetrics, DeploymentEvent } from './client';

export interface MonitoringConfig {
  pollInterval?: number;
  metricsRetention?: number; // hours
  alertThresholds?: AlertThresholds;
  enableAlerting?: boolean;
}

export interface AlertThresholds {
  errorRatePercent: number;
  responseTimeMs: number;
  gpuUtilizationPercent: number;
  memoryUsagePercent: number;
  uptimeThresholdPercent: number;
}

export interface DeploymentMonitoring {
  endpointId: string;
  endpoint: EndpointResponse;
  metrics: EndpointMetrics;
  history: MetricsHistory[];
  alerts: Alert[];
  healthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastUpdated: string;
}

export interface MetricsHistory {
  timestamp: string;
  metrics: EndpointMetrics;
}

export interface Alert {
  id: string;
  type: 'error_rate' | 'response_time' | 'gpu_utilization' | 'memory' | 'uptime' | 'endpoint_down';
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  triggeredAt: string;
  resolved?: boolean;
  resolvedAt?: string;
}

export interface MonitoringStats {
  totalEndpoints: number;
  healthyEndpoints: number;
  warningEndpoints: number;
  criticalEndpoints: number;
  totalAlerts: number;
  activeAlerts: number;
  avgResponseTime: number;
  totalRequests: number;
  totalCost: number;
  uptime: number;
}

export class DeploymentMonitoringService extends EventEmitter {
  private config: Required<MonitoringConfig>;
  private client: RunPodClient;
  private deployments = new Map<string, DeploymentMonitoring>();
  private monitoringTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(client: RunPodClient, config: MonitoringConfig = {}) {
    super();

    this.client = client;
    this.config = {
      pollInterval: config.pollInterval || 30000, // 30 seconds
      metricsRetention: config.metricsRetention || 24, // 24 hours
      enableAlerting: config.enableAlerting ?? true,
      alertThresholds: {
        errorRatePercent: 5,
        responseTimeMs: 5000,
        gpuUtilizationPercent: 95,
        memoryUsagePercent: 90,
        uptimeThresholdPercent: 99,
        ...config.alertThresholds
      }
    };

    this.setupClientListeners();
    this.startMonitoring();
    this.startCleanupScheduler();
  }

  /**
   * Add endpoint to monitoring
   */
  async addEndpoint(endpointId: string): Promise<void> {
    try {
      const endpoint = await this.client.getEndpoint(endpointId);
      const metrics = await this.client.getEndpointMetrics(endpointId);

      const monitoring: DeploymentMonitoring = {
        endpointId,
        endpoint,
        metrics,
        history: [{
          timestamp: new Date().toISOString(),
          metrics
        }],
        alerts: [],
        healthStatus: this.calculateHealthStatus(metrics),
        lastUpdated: new Date().toISOString()
      };

      this.deployments.set(endpointId, monitoring);
      this.client.startPolling(endpointId);

      this.emit('endpoint_added', endpointId);

    } catch (error) {
      console.error(`Failed to add endpoint ${endpointId} to monitoring:`, error);
      throw error;
    }
  }

  /**
   * Remove endpoint from monitoring
   */
  removeEndpoint(endpointId: string): void {
    this.deployments.delete(endpointId);
    this.client.stopPolling(endpointId);
    this.emit('endpoint_removed', endpointId);
  }

  /**
   * Get monitoring data for specific endpoint
   */
  getEndpointMonitoring(endpointId: string): DeploymentMonitoring | null {
    return this.deployments.get(endpointId) || null;
  }

  /**
   * Get all monitored endpoints
   */
  getAllMonitoring(): DeploymentMonitoring[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get monitoring statistics
   */
  getStats(): MonitoringStats {
    const deployments = this.getAllMonitoring();

    const healthyCounts = deployments.reduce((acc, dep) => {
      switch (dep.healthStatus) {
        case 'healthy': acc.healthy++; break;
        case 'warning': acc.warning++; break;
        case 'critical': acc.critical++; break;
      }
      return acc;
    }, { healthy: 0, warning: 0, critical: 0 });

    const totalRequests = deployments.reduce((sum, dep) => sum + dep.metrics.requestCount, 0);
    const totalResponseTime = deployments.reduce((sum, dep) => sum + dep.metrics.avgLatency, 0);
    const totalAlerts = deployments.reduce((sum, dep) => sum + dep.alerts.length, 0);
    const activeAlerts = deployments.reduce((sum, dep) => sum + dep.alerts.filter(a => !a.resolved).length, 0);

    // Calculate cost (this would integrate with billing service in production)
    const totalCost = deployments.reduce((sum, dep) => {
      // Estimate cost based on GPU type and uptime
      const hourlyRate = this.getGPUHourlyRate(dep.endpoint.gpuType);
      const uptimeHours = dep.metrics.uptime / 3600;
      return sum + (hourlyRate * uptimeHours);
    }, 0);

    return {
      totalEndpoints: deployments.length,
      healthyEndpoints: healthyCounts.healthy,
      warningEndpoints: healthyCounts.warning,
      criticalEndpoints: healthyCounts.critical,
      totalAlerts,
      activeAlerts,
      avgResponseTime: deployments.length > 0 ? totalResponseTime / deployments.length : 0,
      totalRequests,
      totalCost,
      uptime: deployments.length > 0 ? deployments.reduce((sum, dep) => sum + dep.metrics.uptime, 0) / deployments.length : 0
    };
  }

  /**
   * Get alerts for specific endpoint
   */
  getEndpointAlerts(endpointId: string, activeOnly = false): Alert[] {
    const monitoring = this.deployments.get(endpointId);
    if (!monitoring) return [];

    return activeOnly
      ? monitoring.alerts.filter(alert => !alert.resolved)
      : monitoring.alerts;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    const allAlerts: Alert[] = [];
    for (const monitoring of this.deployments.values()) {
      allAlerts.push(...monitoring.alerts.filter(alert => !alert.resolved));
    }
    return allAlerts.sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt));
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    for (const monitoring of this.deployments.values()) {
      const alert = monitoring.alerts.find(a => a.id === alertId);
      if (alert && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        this.emit('alert_resolved', { endpointId: monitoring.endpointId, alert });
        return true;
      }
    }
    return false;
  }

  /**
   * Get historical metrics for endpoint
   */
  getMetricsHistory(endpointId: string, hours = 24): MetricsHistory[] {
    const monitoring = this.deployments.get(endpointId);
    if (!monitoring) return [];

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return monitoring.history.filter(
      h => new Date(h.timestamp) > cutoffTime
    );
  }

  /**
   * Export monitoring data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = this.getAllMonitoring();

    if (format === 'csv') {
      const headers = [
        'Endpoint ID', 'Status', 'Health', 'Requests', 'Avg Latency',
        'Error Rate', 'GPU Utilization', 'Memory Usage', 'Uptime', 'Last Updated'
      ];

      const rows = data.map(d => [
        d.endpointId,
        d.endpoint.status,
        d.healthStatus,
        d.metrics.requestCount,
        d.metrics.avgLatency,
        d.metrics.errorRate,
        d.metrics.gpuUtilization,
        d.metrics.memoryUsage,
        d.metrics.uptime,
        d.lastUpdated
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Setup client event listeners
   */
  private setupClientListeners(): void {
    this.client.on('endpoint_update', (event: DeploymentEvent) => {
      if (event.type === 'metrics_update') {
        this.handleMetricsUpdate(event.endpointId, event.data);
      }
    });

    this.client.on('endpoint_error', (event: DeploymentEvent) => {
      this.handleEndpointError(event.endpointId, event.data);
    });
  }

  /**
   * Handle metrics update
   */
  private handleMetricsUpdate(endpointId: string, data: any): void {
    const monitoring = this.deployments.get(endpointId);
    if (!monitoring) return;

    const { endpoint, metrics } = data;

    // Update monitoring data
    monitoring.endpoint = endpoint;
    monitoring.metrics = metrics;
    monitoring.lastUpdated = new Date().toISOString();

    // Add to history
    monitoring.history.push({
      timestamp: new Date().toISOString(),
      metrics
    });

    // Update health status
    const previousHealth = monitoring.healthStatus;
    monitoring.healthStatus = this.calculateHealthStatus(metrics);

    // Check for alerts
    if (this.config.enableAlerting) {
      this.checkAlerts(endpointId, monitoring);
    }

    // Emit events
    this.emit('metrics_updated', { endpointId, monitoring });

    if (previousHealth !== monitoring.healthStatus) {
      this.emit('health_changed', {
        endpointId,
        previousHealth,
        currentHealth: monitoring.healthStatus
      });
    }
  }

  /**
   * Handle endpoint error
   */
  private handleEndpointError(endpointId: string, data: any): void {
    const monitoring = this.deployments.get(endpointId);
    if (!monitoring) return;

    monitoring.healthStatus = 'critical';
    monitoring.lastUpdated = new Date().toISOString();

    if (this.config.enableAlerting) {
      this.createAlert(endpointId, monitoring, {
        type: 'endpoint_down',
        severity: 'critical',
        message: `Endpoint error: ${data.error}`,
        threshold: 0,
        currentValue: 1
      });
    }

    this.emit('endpoint_error', { endpointId, error: data.error });
  }

  /**
   * Calculate health status based on metrics
   */
  private calculateHealthStatus(metrics: EndpointMetrics): 'healthy' | 'warning' | 'critical' | 'unknown' {
    const thresholds = this.config.alertThresholds;

    // Critical conditions
    if (
      metrics.errorRate > thresholds.errorRatePercent ||
      metrics.avgLatency > thresholds.responseTimeMs * 2 ||
      metrics.gpuUtilization > thresholds.gpuUtilizationPercent ||
      metrics.memoryUsage > thresholds.memoryUsagePercent
    ) {
      return 'critical';
    }

    // Warning conditions
    if (
      metrics.errorRate > thresholds.errorRatePercent * 0.5 ||
      metrics.avgLatency > thresholds.responseTimeMs ||
      metrics.gpuUtilization > thresholds.gpuUtilizationPercent * 0.8 ||
      metrics.memoryUsage > thresholds.memoryUsagePercent * 0.8
    ) {
      return 'warning';
    }

    // Healthy
    return 'healthy';
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(endpointId: string, monitoring: DeploymentMonitoring): void {
    const metrics = monitoring.metrics;
    const thresholds = this.config.alertThresholds;

    // Error rate alert
    if (metrics.errorRate > thresholds.errorRatePercent) {
      this.createAlert(endpointId, monitoring, {
        type: 'error_rate',
        severity: metrics.errorRate > thresholds.errorRatePercent * 2 ? 'critical' : 'warning',
        message: `High error rate: ${metrics.errorRate.toFixed(2)}%`,
        threshold: thresholds.errorRatePercent,
        currentValue: metrics.errorRate
      });
    }

    // Response time alert
    if (metrics.avgLatency > thresholds.responseTimeMs) {
      this.createAlert(endpointId, monitoring, {
        type: 'response_time',
        severity: metrics.avgLatency > thresholds.responseTimeMs * 2 ? 'critical' : 'warning',
        message: `High response time: ${metrics.avgLatency}ms`,
        threshold: thresholds.responseTimeMs,
        currentValue: metrics.avgLatency
      });
    }

    // GPU utilization alert
    if (metrics.gpuUtilization > thresholds.gpuUtilizationPercent) {
      this.createAlert(endpointId, monitoring, {
        type: 'gpu_utilization',
        severity: 'warning',
        message: `High GPU utilization: ${metrics.gpuUtilization.toFixed(1)}%`,
        threshold: thresholds.gpuUtilizationPercent,
        currentValue: metrics.gpuUtilization
      });
    }

    // Memory alert
    if (metrics.memoryUsage > thresholds.memoryUsagePercent) {
      this.createAlert(endpointId, monitoring, {
        type: 'memory',
        severity: metrics.memoryUsage > thresholds.memoryUsagePercent * 1.1 ? 'critical' : 'warning',
        message: `High memory usage: ${(metrics.memoryUsage / 1024).toFixed(1)}GB`,
        threshold: thresholds.memoryUsagePercent,
        currentValue: metrics.memoryUsage
      });
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    endpointId: string,
    monitoring: DeploymentMonitoring,
    alertData: Omit<Alert, 'id' | 'triggeredAt'>
  ): void {
    const alertId = `${endpointId}-${alertData.type}-${Date.now()}`;

    // Check if similar alert already exists and is active
    const existingAlert = monitoring.alerts.find(
      alert => alert.type === alertData.type && !alert.resolved
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.currentValue = alertData.currentValue;
      existingAlert.message = alertData.message;
      return;
    }

    const alert: Alert = {
      id: alertId,
      triggeredAt: new Date().toISOString(),
      ...alertData
    };

    monitoring.alerts.push(alert);
    this.emit('alert_created', { endpointId, alert });
  }

  /**
   * Get GPU hourly rate for cost calculation
   */
  private getGPUHourlyRate(gpuType: string): number {
    const rates: Record<string, number> = {
      'NVIDIA_RTX_4090': 0.79,
      'NVIDIA_RTX_A6000': 0.79,
      'NVIDIA_A40': 0.89,
      'NVIDIA_A100': 2.89,
    };

    return rates[gpuType] || 1.0;
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    // Initial load of existing endpoints
    this.loadExistingEndpoints();

    // Set up periodic monitoring
    this.monitoringTimer = setInterval(() => {
      this.performMonitoringCheck();
    }, this.config.pollInterval);
  }

  /**
   * Load existing endpoints into monitoring
   */
  private async loadExistingEndpoints(): Promise<void> {
    try {
      const endpoints = await this.client.listEndpoints();

      for (const endpoint of endpoints) {
        if (endpoint.status === 'RUNNING') {
          await this.addEndpoint(endpoint.id);
        }
      }
    } catch (error) {
      console.error('Failed to load existing endpoints:', error);
    }
  }

  /**
   * Perform periodic monitoring check
   */
  private async performMonitoringCheck(): Promise<void> {
    for (const [endpointId, monitoring] of this.deployments) {
      try {
        // Check if endpoint still exists
        const endpoint = await this.client.getEndpoint(endpointId);

        if (endpoint.status === 'TERMINATED') {
          this.removeEndpoint(endpointId);
        }
      } catch (error) {
        console.error(`Monitoring check failed for ${endpointId}:`, error);
      }
    }
  }

  /**
   * Start cleanup scheduler
   */
  private startCleanupScheduler(): void {
    // Clean up old metrics every hour
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Clean up old metrics data
   */
  private cleanupOldMetrics(): void {
    const retentionMs = this.config.metricsRetention * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - retentionMs);

    for (const monitoring of this.deployments.values()) {
      monitoring.history = monitoring.history.filter(
        h => new Date(h.timestamp) > cutoffTime
      );

      // Also clean up resolved alerts older than retention period
      monitoring.alerts = monitoring.alerts.filter(
        alert => !alert.resolved || !alert.resolvedAt || new Date(alert.resolvedAt) > cutoffTime
      );
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.deployments.clear();
    this.removeAllListeners();
  }
}

export default DeploymentMonitoringService;