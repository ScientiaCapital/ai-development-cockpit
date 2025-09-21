#!/usr/bin/env node

/**
 * Deployment Monitoring Integration Script
 * 
 * This script integrates deployment pipeline with Prometheus/Grafana monitoring
 * and provides health checks, metric collection, and alert management.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  prometheus: {
    pushGateway: process.env.PROMETHEUS_PUSH_GATEWAY || 'http://localhost:9091',
    metricsEndpoint: process.env.PROMETHEUS_METRICS_ENDPOINT || 'http://localhost:9090',
    jobName: 'dual-domain-llm-platform',
    timeout: 10000
  },
  grafana: {
    url: process.env.GRAFANA_URL || 'http://localhost:3000',
    apiKey: process.env.GRAFANA_API_KEY || '',
    timeout: 5000
  },
  deployment: {
    environment: process.env.DEPLOYMENT_ENVIRONMENT || 'staging',
    deploymentId: process.env.DEPLOYMENT_ID || 'manual',
    commitSha: process.env.GITHUB_SHA || 'unknown',
    urls: {
      swaggystacks: process.env.SWAGGYSTACKS_URL || 'http://localhost:3001/swaggystacks',
      scientia: process.env.SCIENTIA_URL || 'http://localhost:3001/scientia',
      marketplace: process.env.MARKETPLACE_URL || 'http://localhost:3001/marketplace'
    }
  },
  healthCheck: {
    timeout: 30000,
    retries: 5,
    retryDelay: 2000
  }
};

// Logging utility
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  debug: (msg) => process.env.DEBUG && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`)
};

// HTTP request utility
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: options.timeout || 5000,
      headers: {
        'User-Agent': 'deployment-monitoring/1.0',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            data: parsedData 
          });
        } catch (err) {
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            data 
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// Prometheus metrics utilities
class PrometheusMetrics {
  constructor() {
    this.metrics = [];
  }

  addMetric(name, value, labels = {}, help = '') {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    this.metrics.push({
      name,
      value,
      labels: labelStr,
      help,
      timestamp: Date.now()
    });
  }

  formatForPrometheus() {
    const metricGroups = {};
    
    this.metrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = {
          help: metric.help,
          type: 'gauge',
          metrics: []
        };
      }
      metricGroups[metric.name].metrics.push(metric);
    });

    let output = '';
    Object.entries(metricGroups).forEach(([name, group]) => {
      if (group.help) {
        output += `# HELP ${name} ${group.help}\n`;
      }
      output += `# TYPE ${name} ${group.type}\n`;
      
      group.metrics.forEach(metric => {
        const labels = metric.labels ? `{${metric.labels}}` : '';
        output += `${name}${labels} ${metric.value} ${metric.timestamp}\n`;
      });
    });

    return output;
  }

  async pushToGateway() {
    const metricsData = this.formatForPrometheus();
    const url = `${CONFIG.prometheus.pushGateway}/metrics/job/${CONFIG.prometheus.jobName}`;
    
    try {
      const response = await makeRequest(url, {
        method: 'POST',
        body: metricsData,
        headers: {
          'Content-Type': 'text/plain'
        },
        timeout: CONFIG.prometheus.timeout
      });

      if (response.statusCode === 200) {
        logger.info('Metrics successfully pushed to Prometheus Push Gateway');
        return true;
      } else {
        logger.error(`Failed to push metrics: HTTP ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error pushing metrics to Prometheus: ${error.message}`);
      return false;
    }
  }
}

// Health check utilities
class HealthChecker {
  constructor() {
    this.results = {};
  }

  async checkUrl(name, url, expectedStatusCode = 200) {
    logger.info(`Checking health of ${name}: ${url}`);
    
    for (let attempt = 1; attempt <= CONFIG.healthCheck.retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await makeRequest(url, {
          timeout: CONFIG.healthCheck.timeout
        });
        const responseTime = Date.now() - startTime;

        const isHealthy = response.statusCode === expectedStatusCode;
        
        this.results[name] = {
          url,
          healthy: isHealthy,
          statusCode: response.statusCode,
          responseTime,
          attempt,
          timestamp: new Date().toISOString(),
          error: isHealthy ? null : `Unexpected status code: ${response.statusCode}`
        };

        if (isHealthy) {
          logger.info(`✅ ${name} is healthy (${responseTime}ms)`);
          return this.results[name];
        } else {
          logger.warn(`⚠️ ${name} returned status ${response.statusCode} (attempt ${attempt}/${CONFIG.healthCheck.retries})`);
        }
      } catch (error) {
        logger.warn(`❌ ${name} health check failed (attempt ${attempt}/${CONFIG.healthCheck.retries}): ${error.message}`);
        
        this.results[name] = {
          url,
          healthy: false,
          statusCode: 0,
          responseTime: 0,
          attempt,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }

      if (attempt < CONFIG.healthCheck.retries) {
        logger.info(`Retrying ${name} in ${CONFIG.healthCheck.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.healthCheck.retryDelay));
      }
    }

    logger.error(`❌ ${name} failed all health check attempts`);
    return this.results[name];
  }

  async checkAllEndpoints() {
    logger.info('Starting comprehensive health check...');
    
    const checks = Object.entries(CONFIG.deployment.urls).map(([name, url]) =>
      this.checkUrl(name, url)
    );

    await Promise.all(checks);
    
    const healthyCount = Object.values(this.results).filter(r => r.healthy).length;
    const totalCount = Object.keys(this.results).length;
    
    logger.info(`Health check summary: ${healthyCount}/${totalCount} endpoints healthy`);
    
    return {
      healthy: healthyCount === totalCount,
      results: this.results,
      summary: {
        total: totalCount,
        healthy: healthyCount,
        unhealthy: totalCount - healthyCount
      }
    };
  }

  getMetrics() {
    const metrics = new PrometheusMetrics();
    
    Object.entries(this.results).forEach(([name, result]) => {
      metrics.addMetric(
        'deployment_health_check',
        result.healthy ? 1 : 0,
        {
          endpoint: name,
          environment: CONFIG.deployment.environment,
          deployment_id: CONFIG.deployment.deploymentId
        },
        'Health check status for deployment endpoints'
      );

      if (result.responseTime > 0) {
        metrics.addMetric(
          'deployment_response_time_ms',
          result.responseTime,
          {
            endpoint: name,
            environment: CONFIG.deployment.environment,
            deployment_id: CONFIG.deployment.deploymentId
          },
          'Response time for deployment endpoints in milliseconds'
        );
      }
    });

    return metrics;
  }
}

// Grafana integration
class GrafanaIntegration {
  constructor() {
    this.dashboards = [];
  }

  async createDeploymentAnnotation(title, text, tags = []) {
    if (!CONFIG.grafana.apiKey) {
      logger.warn('Grafana API key not configured - skipping annotation');
      return false;
    }

    const annotation = {
      time: Date.now(),
      timeEnd: Date.now() + 300000, // 5 minutes
      title,
      text,
      tags: ['deployment', CONFIG.deployment.environment, ...tags]
    };

    try {
      const response = await makeRequest(`${CONFIG.grafana.url}/api/annotations`, {
        method: 'POST',
        body: annotation,
        headers: {
          'Authorization': `Bearer ${CONFIG.grafana.apiKey}`
        },
        timeout: CONFIG.grafana.timeout
      });

      if (response.statusCode === 200) {
        logger.info('Deployment annotation created in Grafana');
        return true;
      } else {
        logger.error(`Failed to create Grafana annotation: HTTP ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error creating Grafana annotation: ${error.message}`);
      return false;
    }
  }

  async updateDashboard(dashboardId, updates) {
    if (!CONFIG.grafana.apiKey) {
      logger.warn('Grafana API key not configured - skipping dashboard update');
      return false;
    }

    try {
      // In a real implementation, this would update dashboard variables or annotations
      logger.info(`Dashboard update would be applied to ${dashboardId}`);
      return true;
    } catch (error) {
      logger.error(`Error updating Grafana dashboard: ${error.message}`);
      return false;
    }
  }
}

// Alert manager
class AlertManager {
  constructor() {
    this.alerts = [];
  }

  createAlert(severity, title, description, labels = {}) {
    const alert = {
      severity,
      title,
      description,
      labels: {
        environment: CONFIG.deployment.environment,
        deployment_id: CONFIG.deployment.deploymentId,
        ...labels
      },
      timestamp: new Date().toISOString()
    };

    this.alerts.push(alert);
    
    const severityIcon = {
      'critical': '🚨',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    logger.info(`${severityIcon[severity]} ALERT [${severity.toUpperCase()}]: ${title}`);
    logger.info(`Description: ${description}`);
    
    return alert;
  }

  async sendAlerts() {
    if (this.alerts.length === 0) {
      logger.info('No alerts to send');
      return true;
    }

    // In a real implementation, this would:
    // - Send to Slack/Teams
    // - Create PagerDuty incidents
    // - Send email notifications
    // - Update monitoring dashboards

    logger.info(`Would send ${this.alerts.length} alerts to notification channels`);
    
    this.alerts.forEach(alert => {
      logger.info(`Alert: ${alert.title} [${alert.severity}]`);
    });

    return true;
  }
}

// Main deployment monitoring class
class DeploymentMonitor {
  constructor() {
    this.healthChecker = new HealthChecker();
    this.grafana = new GrafanaIntegration();
    this.alertManager = new AlertManager();
    this.startTime = Date.now();
  }

  async run(command) {
    logger.info(`Starting deployment monitoring - Command: ${command}`);
    logger.info(`Environment: ${CONFIG.deployment.environment}`);
    logger.info(`Deployment ID: ${CONFIG.deployment.deploymentId}`);
    
    try {
      switch (command) {
        case 'pre-deployment':
          return await this.preDeploymentChecks();
        case 'health-check':
          return await this.runHealthChecks();
        case 'post-deployment':
          return await this.postDeploymentValidation();
        case 'rollback-monitor':
          return await this.rollbackMonitoring();
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      logger.error(`Deployment monitoring failed: ${error.message}`);
      this.alertManager.createAlert('critical', 'Deployment Monitoring Failed', error.message);
      await this.alertManager.sendAlerts();
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    logger.info('🔍 Running pre-deployment monitoring setup...');
    
    // Create deployment start annotation
    await this.grafana.createDeploymentAnnotation(
      `Deployment Started: ${CONFIG.deployment.deploymentId}`,
      `Environment: ${CONFIG.deployment.environment}\nCommit: ${CONFIG.deployment.commitSha}`,
      ['deployment-start']
    );

    // Collect baseline metrics
    const metrics = new PrometheusMetrics();
    metrics.addMetric(
      'deployment_status',
      1,
      {
        deployment_id: CONFIG.deployment.deploymentId,
        environment: CONFIG.deployment.environment,
        phase: 'pre-deployment'
      },
      'Deployment status indicator'
    );

    await metrics.pushToGateway();
    
    logger.info('✅ Pre-deployment monitoring setup completed');
    return true;
  }

  async runHealthChecks() {
    logger.info('🏥 Running comprehensive health checks...');
    
    const healthResults = await this.healthChecker.checkAllEndpoints();
    
    // Push health metrics to Prometheus
    const metrics = this.healthChecker.getMetrics();
    await metrics.pushToGateway();
    
    // Create alerts for unhealthy endpoints
    if (!healthResults.healthy) {
      Object.entries(healthResults.results).forEach(([name, result]) => {
        if (!result.healthy) {
          this.alertManager.createAlert(
            'critical',
            `Endpoint Health Check Failed: ${name}`,
            `URL: ${result.url}\nError: ${result.error}\nStatus Code: ${result.statusCode}`,
            { endpoint: name }
          );
        }
      });
    }

    // Write health check results to file
    const healthReport = {
      timestamp: new Date().toISOString(),
      deployment_id: CONFIG.deployment.deploymentId,
      environment: CONFIG.deployment.environment,
      ...healthResults
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'health-check-results.json'),
      JSON.stringify(healthReport, null, 2)
    );

    logger.info(`Health check completed: ${healthResults.summary.healthy}/${healthResults.summary.total} endpoints healthy`);
    
    if (!healthResults.healthy) {
      await this.alertManager.sendAlerts();
      process.exit(1);
    }

    return healthResults;
  }

  async postDeploymentValidation() {
    logger.info('✅ Running post-deployment validation...');
    
    // Run health checks
    const healthResults = await this.runHealthChecks();
    
    // Create deployment success annotation
    await this.grafana.createDeploymentAnnotation(
      `Deployment Completed: ${CONFIG.deployment.deploymentId}`,
      `Environment: ${CONFIG.deployment.environment}\nStatus: Success\nDuration: ${Date.now() - this.startTime}ms`,
      ['deployment-success']
    );

    // Collect deployment metrics
    const metrics = new PrometheusMetrics();
    metrics.addMetric(
      'deployment_status',
      2,
      {
        deployment_id: CONFIG.deployment.deploymentId,
        environment: CONFIG.deployment.environment,
        phase: 'post-deployment'
      },
      'Deployment status indicator'
    );

    metrics.addMetric(
      'deployment_duration_ms',
      Date.now() - this.startTime,
      {
        deployment_id: CONFIG.deployment.deploymentId,
        environment: CONFIG.deployment.environment
      },
      'Deployment duration in milliseconds'
    );

    await metrics.pushToGateway();
    
    logger.info('✅ Post-deployment validation completed successfully');
    return true;
  }

  async rollbackMonitoring() {
    logger.info('🔄 Monitoring rollback operation...');
    
    // Create rollback annotation
    await this.grafana.createDeploymentAnnotation(
      `Rollback Initiated: ${CONFIG.deployment.deploymentId}`,
      `Environment: ${CONFIG.deployment.environment}\nReason: Deployment validation failed`,
      ['rollback']
    );

    // Alert about rollback
    this.alertManager.createAlert(
      'warning',
      'Deployment Rollback Initiated',
      `Deployment ${CONFIG.deployment.deploymentId} is being rolled back due to validation failures`,
      { action: 'rollback' }
    );

    await this.alertManager.sendAlerts();
    
    // Monitor rollback health
    await this.runHealthChecks();
    
    logger.info('🔄 Rollback monitoring completed');
    return true;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (!command) {
    console.log(`
Usage: node deployment-monitoring.js <command>

Commands:
  pre-deployment    - Setup monitoring for deployment start
  health-check      - Run comprehensive health checks
  post-deployment   - Validate deployment completion
  rollback-monitor  - Monitor rollback operations

Environment Variables:
  PROMETHEUS_PUSH_GATEWAY      - Prometheus Push Gateway URL
  PROMETHEUS_METRICS_ENDPOINT  - Prometheus metrics endpoint
  GRAFANA_URL                  - Grafana instance URL
  GRAFANA_API_KEY             - Grafana API key for annotations
  DEPLOYMENT_ENVIRONMENT       - Deployment environment (staging/production)
  DEPLOYMENT_ID               - Unique deployment identifier
  GITHUB_SHA                  - Commit SHA being deployed
  SWAGGYSTACKS_URL           - SwaggyStacks endpoint URL
  SCIENTIA_URL               - ScientiaCapital endpoint URL
  MARKETPLACE_URL            - Marketplace endpoint URL
  DEBUG                      - Enable debug logging
`);
    process.exit(1);
  }

  const monitor = new DeploymentMonitor();
  monitor.run(command).then(() => {
    logger.info('Deployment monitoring completed successfully');
    process.exit(0);
  }).catch((error) => {
    logger.error(`Deployment monitoring failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  DeploymentMonitor,
  HealthChecker,
  PrometheusMetrics,
  GrafanaIntegration,
  AlertManager
};