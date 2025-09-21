/**
 * Dashboard Integration - Real-time monitoring and metrics streaming
 * Provides integration with monitoring dashboards and alerting systems
 */

import { TestMetrics } from './MetricsCollector';
import { TestReport } from './TestReporter';

export interface DashboardConfig {
  enabled: boolean;
  endpoints: DashboardEndpoint[];
  realTimeUpdates: boolean;
  alerting: AlertConfig;
  retention: RetentionConfig;
}

export interface DashboardEndpoint {
  name: string;
  type: 'prometheus' | 'grafana' | 'datadog' | 'newrelic' | 'custom';
  url: string;
  apiKey?: string;
  headers?: Record<string, string>;
  enabled: boolean;
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: AlertThresholds;
  channels: AlertChannel[];
}

export interface AlertThresholds {
  successRate: number; // percentage
  executionTime: number; // milliseconds
  flakinessRate: number; // percentage
  errorRate: number; // percentage
}

export interface AlertChannel {
  type: 'slack' | 'email' | 'webhook' | 'pagerduty';
  url: string;
  config: Record<string, any>;
}

export interface RetentionConfig {
  metrics: number; // days
  reports: number; // days
  traces: number; // days
}

export interface DashboardMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
}

export interface AlertPayload {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  metadata: Record<string, any>;
}

/**
 * Dashboard integration for real-time monitoring
 */
export class DashboardIntegration {
  private config: DashboardConfig;
  private metricsBuffer: DashboardMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      enabled: true,
      endpoints: [],
      realTimeUpdates: true,
      alerting: {
        enabled: true,
        thresholds: {
          successRate: 95, // Alert if below 95%
          executionTime: 60000, // Alert if above 60 seconds
          flakinessRate: 5, // Alert if above 5%
          errorRate: 5 // Alert if above 5%
        },
        channels: []
      },
      retention: {
        metrics: 30, // 30 days
        reports: 90, // 90 days
        traces: 7 // 7 days
      },
      ...config
    };

    if (this.config.enabled && this.config.realTimeUpdates) {
      this.startMetricsStreaming();
    }
  }

  /**
   * Start real-time metrics streaming
   */
  private startMetricsStreaming(): void {
    this.flushInterval = setInterval(async () => {
      await this.flushMetrics();
    }, 10000); // Flush every 10 seconds

    console.log('📊 Started real-time metrics streaming');
  }

  /**
   * Stop metrics streaming
   */
  async stopMetricsStreaming(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush remaining metrics
    await this.flushMetrics();

    console.log('📊 Stopped metrics streaming');
  }

  /**
   * Send test metrics to dashboard
   */
  async sendTestMetrics(testMetrics: TestMetrics): Promise<void> {
    if (!this.config.enabled) return;

    const metrics = this.convertToPrometeusMetrics(testMetrics);
    this.metricsBuffer.push(...metrics);

    // Check for alerts
    await this.checkAlerts(testMetrics);

    console.log(`📊 Buffered ${metrics.length} metrics for test: ${testMetrics.testName}`);
  }

  /**
   * Send test report to dashboard
   */
  async sendTestReport(report: TestReport): Promise<void> {
    if (!this.config.enabled) return;

    const reportMetrics = this.convertReportToMetrics(report);
    this.metricsBuffer.push(...reportMetrics);

    // Check report-level alerts
    await this.checkReportAlerts(report);

    console.log(`📊 Sent test report metrics to dashboard`);
  }

  /**
   * Convert test metrics to Prometheus format
   */
  private convertToPrometeusMetrics(testMetrics: TestMetrics): DashboardMetric[] {
    const timestamp = Date.now();
    const baseLabels = {
      test_id: testMetrics.testId,
      test_name: testMetrics.testName,
      organization: testMetrics.organization,
      environment: testMetrics.environment
    };

    const metrics: DashboardMetric[] = [];

    // Performance metrics
    if (testMetrics.performance) {
      metrics.push(
        {
          name: 'e2e_test_page_load_time_ms',
          value: testMetrics.performance.pageLoadTime,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        },
        {
          name: 'e2e_test_time_to_interactive_ms',
          value: testMetrics.performance.timeToInteractive,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        },
        {
          name: 'e2e_test_first_contentful_paint_ms',
          value: testMetrics.performance.firstContentfulPaint,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        },
        {
          name: 'e2e_test_largest_contentful_paint_ms',
          value: testMetrics.performance.largestContentfulPaint,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        },
        {
          name: 'e2e_test_cumulative_layout_shift',
          value: testMetrics.performance.cumulativeLayoutShift,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        }
      );

      // API response times
      testMetrics.performance.apiResponseTimes.forEach(api => {
        metrics.push({
          name: 'e2e_test_api_response_time_ms',
          value: api.responseTime,
          timestamp,
          tags: {
            ...baseLabels,
            endpoint: api.endpoint,
            method: api.method,
            status_code: api.statusCode.toString()
          },
          type: 'histogram'
        });
      });
    }

    // Resource metrics
    if (testMetrics.resources && testMetrics.resources.memoryUsage.length > 0) {
      const avgMemory = testMetrics.resources.memoryUsage.reduce((sum, m) => sum + m.percentage, 0) / testMetrics.resources.memoryUsage.length;
      const peakMemory = Math.max(...testMetrics.resources.memoryUsage.map(m => m.percentage));

      metrics.push(
        {
          name: 'e2e_test_memory_usage_avg_percent',
          value: avgMemory,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        },
        {
          name: 'e2e_test_memory_usage_peak_percent',
          value: peakMemory,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        }
      );
    }

    // Network metrics
    if (testMetrics.network) {
      metrics.push(
        {
          name: 'e2e_test_network_requests_total',
          value: testMetrics.network.requestCount,
          timestamp,
          tags: baseLabels,
          type: 'counter'
        },
        {
          name: 'e2e_test_network_latency_avg_ms',
          value: testMetrics.network.averageLatency,
          timestamp,
          tags: baseLabels,
          type: 'gauge'
        },
        {
          name: 'e2e_test_network_requests_failed',
          value: testMetrics.network.failedRequests,
          timestamp,
          tags: baseLabels,
          type: 'counter'
        },
        {
          name: 'e2e_test_network_requests_slow',
          value: testMetrics.network.slowRequests,
          timestamp,
          tags: baseLabels,
          type: 'counter'
        }
      );
    }

    // Error metrics
    metrics.push(
      {
        name: 'e2e_test_errors_total',
        value: testMetrics.errors.length,
        timestamp,
        tags: baseLabels,
        type: 'counter'
      },
      {
        name: 'e2e_test_warnings_total',
        value: testMetrics.warnings.length,
        timestamp,
        tags: baseLabels,
        type: 'counter'
      }
    );

    // Test duration
    if (testMetrics.duration) {
      metrics.push({
        name: 'e2e_test_duration_ms',
        value: testMetrics.duration,
        timestamp,
        tags: baseLabels,
        type: 'histogram'
      });
    }

    return metrics;
  }

  /**
   * Convert test report to metrics
   */
  private convertReportToMetrics(report: TestReport): DashboardMetric[] {
    const timestamp = Date.now();
    const baseLabels = {
      environment: report.metadata.environment,
      git_branch: report.metadata.gitBranch,
      git_commit: report.metadata.gitCommit.substring(0, 8)
    };

    return [
      {
        name: 'e2e_test_suite_success_rate_percent',
        value: report.summary.successRate,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_total_tests',
        value: report.summary.totalTests,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_passed_tests',
        value: report.summary.passed,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_failed_tests',
        value: report.summary.failed,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_flaky_tests',
        value: report.summary.flaky,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_duration_ms',
        value: report.summary.duration,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_reliability_percent',
        value: report.quality.reliability,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_flakiness_rate_percent',
        value: report.quality.flakiness.flakinessRate,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      },
      {
        name: 'e2e_test_suite_avg_execution_time_ms',
        value: report.performance.averageExecutionTime,
        timestamp,
        tags: baseLabels,
        type: 'gauge'
      }
    ];
  }

  /**
   * Flush buffered metrics to all endpoints
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    console.log(`📊 Flushing ${metrics.length} metrics to ${this.config.endpoints.length} endpoints`);

    for (const endpoint of this.config.endpoints) {
      if (!endpoint.enabled) continue;

      try {
        await this.sendToEndpoint(endpoint, metrics);
      } catch (error: unknown) {
        console.error(`Failed to send metrics to ${endpoint.name}:`, error);
      }
    }
  }

  /**
   * Send metrics to specific endpoint
   */
  private async sendToEndpoint(endpoint: DashboardEndpoint, metrics: DashboardMetric[]): Promise<void> {
    switch (endpoint.type) {
      case 'prometheus':
        await this.sendToPrometheus(endpoint, metrics);
        break;
      case 'grafana':
        await this.sendToGrafana(endpoint, metrics);
        break;
      case 'datadog':
        await this.sendToDatadog(endpoint, metrics);
        break;
      case 'custom':
        await this.sendToCustomEndpoint(endpoint, metrics);
        break;
      default:
        console.warn(`Unsupported endpoint type: ${endpoint.type}`);
    }
  }

  /**
   * Send metrics to Prometheus push gateway
   */
  private async sendToPrometheus(endpoint: DashboardEndpoint, metrics: DashboardMetric[]): Promise<void> {
    const prometheusFormat = this.formatForPrometheus(metrics);

    const response = await fetch(`${endpoint.url}/metrics/job/e2e-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        ...endpoint.headers
      },
      body: prometheusFormat
    });

    if (!response.ok) {
      throw new Error(`Prometheus push failed: ${response.statusText}`);
    }

    console.log(`📊 Sent ${metrics.length} metrics to Prometheus`);
  }

  /**
   * Send metrics to Grafana
   */
  private async sendToGrafana(endpoint: DashboardEndpoint, metrics: DashboardMetric[]): Promise<void> {
    const grafanaMetrics = metrics.map(metric => ({
      name: metric.name,
      value: metric.value,
      time: metric.timestamp,
      tags: metric.tags
    }));

    const response = await fetch(`${endpoint.url}/api/v1/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${endpoint.apiKey}`,
        ...endpoint.headers
      },
      body: JSON.stringify({ metrics: grafanaMetrics })
    });

    if (!response.ok) {
      throw new Error(`Grafana push failed: ${response.statusText}`);
    }

    console.log(`📊 Sent ${metrics.length} metrics to Grafana`);
  }

  /**
   * Send metrics to Datadog
   */
  private async sendToDatadog(endpoint: DashboardEndpoint, metrics: DashboardMetric[]): Promise<void> {
    const datadogMetrics = metrics.map(metric => ({
      metric: metric.name,
      points: [[Math.floor(metric.timestamp / 1000), metric.value]],
      tags: Object.entries(metric.tags).map(([key, value]) => `${key}:${value}`),
      type: metric.type === 'counter' ? 'count' : 'gauge'
    }));

    const response = await fetch(`${endpoint.url}/api/v1/series`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': endpoint.apiKey!,
        ...endpoint.headers
      },
      body: JSON.stringify({ series: datadogMetrics })
    });

    if (!response.ok) {
      throw new Error(`Datadog push failed: ${response.statusText}`);
    }

    console.log(`📊 Sent ${metrics.length} metrics to Datadog`);
  }

  /**
   * Send metrics to custom endpoint
   */
  private async sendToCustomEndpoint(endpoint: DashboardEndpoint, metrics: DashboardMetric[]): Promise<void> {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...endpoint.headers
      },
      body: JSON.stringify({
        timestamp: Date.now(),
        source: 'e2e-tests',
        metrics: metrics
      })
    });

    if (!response.ok) {
      throw new Error(`Custom endpoint push failed: ${response.statusText}`);
    }

    console.log(`📊 Sent ${metrics.length} metrics to custom endpoint`);
  }

  /**
   * Format metrics for Prometheus
   */
  private formatForPrometheus(metrics: DashboardMetric[]): string {
    const lines: string[] = [];

    for (const metric of metrics) {
      const labels = Object.entries(metric.tags)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');

      const metricLine = labels ?
        `${metric.name}{${labels}} ${metric.value} ${metric.timestamp}` :
        `${metric.name} ${metric.value} ${metric.timestamp}`;

      lines.push(metricLine);
    }

    return lines.join('\n');
  }

  /**
   * Check for alerts based on test metrics
   */
  private async checkAlerts(testMetrics: TestMetrics): Promise<void> {
    if (!this.config.alerting.enabled) return;

    const alerts: AlertPayload[] = [];

    // Check execution time
    if (testMetrics.duration && testMetrics.duration > this.config.alerting.thresholds.executionTime) {
      alerts.push({
        severity: 'medium',
        title: 'Slow Test Execution',
        description: `Test "${testMetrics.testName}" took ${testMetrics.duration}ms (threshold: ${this.config.alerting.thresholds.executionTime}ms)`,
        timestamp: Date.now(),
        metadata: {
          testId: testMetrics.testId,
          duration: testMetrics.duration,
          threshold: this.config.alerting.thresholds.executionTime
        }
      });
    }

    // Check error rate
    const errorRate = testMetrics.errors.length;
    if (errorRate > this.config.alerting.thresholds.errorRate) {
      alerts.push({
        severity: 'high',
        title: 'High Error Rate',
        description: `Test "${testMetrics.testName}" has ${errorRate} errors (threshold: ${this.config.alerting.thresholds.errorRate})`,
        timestamp: Date.now(),
        metadata: {
          testId: testMetrics.testId,
          errorCount: errorRate,
          threshold: this.config.alerting.thresholds.errorRate
        }
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Check for report-level alerts
   */
  private async checkReportAlerts(report: TestReport): Promise<void> {
    if (!this.config.alerting.enabled) return;

    const alerts: AlertPayload[] = [];

    // Check success rate
    if (report.summary.successRate < this.config.alerting.thresholds.successRate) {
      alerts.push({
        severity: 'critical',
        title: 'Test Suite Success Rate Below Threshold',
        description: `Test suite success rate is ${report.summary.successRate.toFixed(1)}% (threshold: ${this.config.alerting.thresholds.successRate}%)`,
        timestamp: Date.now(),
        metadata: {
          successRate: report.summary.successRate,
          threshold: this.config.alerting.thresholds.successRate,
          totalTests: report.summary.totalTests,
          failedTests: report.summary.failed
        }
      });
    }

    // Check flakiness rate
    if (report.quality.flakiness.flakinessRate > this.config.alerting.thresholds.flakinessRate) {
      alerts.push({
        severity: 'medium',
        title: 'High Test Flakiness',
        description: `Test flakiness rate is ${report.quality.flakiness.flakinessRate.toFixed(1)}% (threshold: ${this.config.alerting.thresholds.flakinessRate}%)`,
        timestamp: Date.now(),
        metadata: {
          flakinessRate: report.quality.flakiness.flakinessRate,
          threshold: this.config.alerting.thresholds.flakinessRate,
          flakyTests: report.quality.flakiness.mostFlakyTests
        }
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Send alert to configured channels
   */
  private async sendAlert(alert: AlertPayload): Promise<void> {
    console.log(`🚨 Alert: ${alert.title} (${alert.severity})`);

    for (const channel of this.config.alerting.channels) {
      try {
        await this.sendToAlertChannel(channel, alert);
      } catch (error: unknown) {
        console.error(`Failed to send alert to ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendToAlertChannel(channel: AlertChannel, alert: AlertPayload): Promise<void> {
    switch (channel.type) {
      case 'slack':
        await this.sendSlackAlert(channel, alert);
        break;
      case 'webhook':
        await this.sendWebhookAlert(channel, alert);
        break;
      default:
        console.warn(`Unsupported alert channel: ${channel.type}`);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(channel: AlertChannel, alert: AlertPayload): Promise<void> {
    const color = {
      'low': '#36a64f',
      'medium': '#ff9500',
      'high': '#ff4500',
      'critical': '#ff0000'
    }[alert.severity];

    const slackPayload = {
      attachments: [{
        color,
        title: alert.title,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date(alert.timestamp).toISOString(),
            short: true
          }
        ],
        footer: 'E2E Test Monitoring',
        ts: Math.floor(alert.timestamp / 1000)
      }]
    };

    const response = await fetch(channel.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    if (!response.ok) {
      throw new Error(`Slack alert failed: ${response.statusText}`);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(channel: AlertChannel, alert: AlertPayload): Promise<void> {
    const response = await fetch(channel.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...channel.config.headers
      },
      body: JSON.stringify(alert)
    });

    if (!response.ok) {
      throw new Error(`Webhook alert failed: ${response.statusText}`);
    }
  }

  /**
   * Create Grafana dashboard JSON
   */
  createGrafanaDashboard(): any {
    return {
      dashboard: {
        id: null,
        title: "E2E Test Monitoring",
        tags: ["e2e", "testing", "ai-development-cockpit"],
        timezone: "browser",
        panels: [
          {
            id: 1,
            title: "Test Success Rate",
            type: "stat",
            targets: [{
              expr: "e2e_test_suite_success_rate_percent",
              refId: "A"
            }],
            fieldConfig: {
              defaults: {
                unit: "percent",
                min: 0,
                max: 100,
                thresholds: {
                  steps: [
                    { color: "red", value: 0 },
                    { color: "yellow", value: 95 },
                    { color: "green", value: 98 }
                  ]
                }
              }
            }
          },
          {
            id: 2,
            title: "Test Execution Time",
            type: "timeseries",
            targets: [{
              expr: "e2e_test_duration_ms",
              refId: "A"
            }]
          },
          {
            id: 3,
            title: "Error Rate",
            type: "stat",
            targets: [{
              expr: "rate(e2e_test_errors_total[5m])",
              refId: "A"
            }]
          },
          {
            id: 4,
            title: "Memory Usage",
            type: "timeseries",
            targets: [{
              expr: "e2e_test_memory_usage_avg_percent",
              refId: "A"
            }]
          }
        ],
        time: {
          from: "now-1h",
          to: "now"
        },
        refresh: "10s"
      }
    };
  }
}