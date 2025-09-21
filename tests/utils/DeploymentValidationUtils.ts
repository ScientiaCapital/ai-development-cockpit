/**
 * Deployment Validation Utilities - Comprehensive validation helpers for E2E testing
 * Provides utilities for validating deployment states, health checks, and compliance
 */

import { Page, expect } from '@playwright/test';
import { DeploymentConfig } from '../fixtures/MockRunPodEnvironment';
import { ValidationResult } from '../fixtures/DeploymentValidator';
import '../playwright-setup'; // Import custom matchers
import { getErrorMessage } from './error-handling';

export interface DeploymentState {
  id: string;
  modelId: string;
  status: 'pending' | 'deploying' | 'running' | 'failed' | 'stopped' | 'rolling_back';
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  instances: {
    total: number;
    running: number;
    failed: number;
  };
  metrics: {
    cpu: number; // percentage
    gpu: number; // percentage
    memory: number; // percentage
    requests: number; // requests per minute
    latency: number; // milliseconds
  };
  timestamps: {
    created: string;
    deployed?: string;
    lastHealthCheck: string;
  };
  organization: 'swaggystacks' | 'scientia';
  theme: 'terminal' | 'corporate';
}

export interface HealthCheckResult {
  passed: boolean;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    duration: number; // milliseconds
  }[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warnings: number;
  };
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ComplianceCheckResult {
  compliant: boolean;
  violations: {
    rule: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }[];
  requirements: {
    name: string;
    status: 'met' | 'not_met' | 'partially_met';
    details: string;
  }[];
  score: number; // 0-100
}

/**
 * Main deployment validation utility class
 */
export class DeploymentValidationUtils {
  private page: Page;
  private organization: 'swaggystacks' | 'scientia';
  private validationTimeout: number = 30000; // 30 seconds

  constructor(page: Page, organization: 'swaggystacks' | 'scientia') {
    this.page = page;
    this.organization = organization;
  }

  /**
   * Validate deployment UI state against expected configuration
   */
  async validateDeploymentUI(config: DeploymentConfig): Promise<void> {
    // Verify deployment configuration is displayed correctly
    await expect(this.page.locator('[data-testid="model-id"]')).toContainText(config.modelId);
    await expect(this.page.locator('[data-testid="gpu-type"]')).toContainText(config.gpuType);
    await expect(this.page.locator('[data-testid="instance-count"]')).toContainText(config.instanceCount.toString());

    // Verify organization-specific UI elements
    if (this.organization === 'swaggystacks') {
      await expect(this.page.locator('[data-testid="theme-indicator"]')).toContainText('terminal');
      await expect(this.page.locator('body')).toHaveClass(/.*terminal-theme.*/);
    } else {
      await expect(this.page.locator('[data-testid="theme-indicator"]')).toContainText('corporate');
      await expect(this.page.locator('body')).toHaveClass(/.*corporate-theme.*/);
    }

    // Verify environment variables are set correctly
    if (config.envVars) {
      for (const [key, value] of Object.entries(config.envVars)) {
        await expect(this.page.locator(`[data-testid="env-var-${key}"]`)).toContainText(value);
      }
    }

    // Verify auto-scaling configuration if enabled
    if (config.autoScaling) {
      await expect(this.page.locator('[data-testid="autoscaling-enabled"]')).toBeVisible();
      if (config.minInstances) {
        await expect(this.page.locator('[data-testid="min-instances"]')).toContainText(config.minInstances.toString());
      }
      if (config.maxInstances) {
        await expect(this.page.locator('[data-testid="max-instances"]')).toContainText(config.maxInstances.toString());
      }
    }
  }

  /**
   * Get current deployment state from UI
   */
  async getDeploymentState(): Promise<DeploymentState> {
    // Wait for deployment state to be available
    await this.page.waitForSelector('[data-testid="deployment-state"]', { timeout: this.validationTimeout });

    // Extract deployment information from UI
    const deploymentId = await this.page.locator('[data-testid="deployment-id"]').textContent() || '';
    const modelId = await this.page.locator('[data-testid="model-id"]').textContent() || '';
    const status = await this.extractDeploymentStatus();
    const health = await this.extractHealthStatus();
    const instances = await this.extractInstanceInfo();
    const metrics = await this.extractMetrics();
    const timestamps = await this.extractTimestamps();

    return {
      id: deploymentId,
      modelId,
      status,
      health,
      instances,
      metrics,
      timestamps,
      organization: this.organization,
      theme: this.organization === 'swaggystacks' ? 'terminal' : 'corporate'
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = [];

    // Check 1: Deployment status
    const statusCheck = await this.checkDeploymentStatus();
    checks.push(statusCheck);

    // Check 2: Instance health
    const instanceCheck = await this.checkInstanceHealth();
    checks.push(instanceCheck);

    // Check 3: API responsiveness
    const apiCheck = await this.checkApiResponsiveness();
    checks.push(apiCheck);

    // Check 4: Resource utilization
    const resourceCheck = await this.checkResourceUtilization();
    checks.push(resourceCheck);

    // Check 5: Organization-specific checks
    const orgCheck = await this.checkOrganizationCompliance();
    checks.push(orgCheck);

    // Calculate summary
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warning').length;

    // Determine overall health
    let overallHealth: HealthCheckResult['overallHealth'] = 'healthy';
    if (failedChecks > 0) {
      overallHealth = 'unhealthy';
    } else if (warnings > 1) {
      overallHealth = 'degraded';
    }

    return {
      passed: failedChecks === 0,
      checks,
      summary: {
        totalChecks: checks.length,
        passedChecks,
        failedChecks,
        warnings
      },
      overallHealth
    };
  }

  /**
   * Validate compliance with organization requirements
   */
  async validateCompliance(): Promise<ComplianceCheckResult> {
    const violations: ComplianceCheckResult['violations'] = [];
    const requirements: ComplianceCheckResult['requirements'] = [];

    if (this.organization === 'swaggystacks') {
      // Gaming-specific compliance checks
      const themeCompliance = await this.checkThemeCompliance('terminal');
      if (!themeCompliance.met) {
        violations.push({
          rule: 'gaming_theme_requirement',
          severity: 'medium',
          description: 'Gaming deployments must use terminal theme',
          recommendation: 'Update deployment configuration to use terminal theme'
        });
      }
      requirements.push(themeCompliance);

      // Gaming content rating compliance
      const contentRating = await this.checkContentRating();
      requirements.push(contentRating);

    } else {
      // Enterprise-specific compliance checks
      const themeCompliance = await this.checkThemeCompliance('corporate');
      if (!themeCompliance.met) {
        violations.push({
          rule: 'enterprise_theme_requirement',
          severity: 'high',
          description: 'Enterprise deployments must use corporate theme',
          recommendation: 'Update deployment configuration to use corporate theme'
        });
      }
      requirements.push(themeCompliance);

      // Audit logging compliance
      const auditCompliance = await this.checkAuditLogging();
      if (!auditCompliance.met) {
        violations.push({
          rule: 'audit_logging_requirement',
          severity: 'critical',
          description: 'Enterprise deployments must have audit logging enabled',
          recommendation: 'Enable audit logging in environment variables'
        });
      }
      requirements.push(auditCompliance);

      // Data retention compliance
      const dataRetention = await this.checkDataRetention();
      requirements.push(dataRetention);
    }

    // Calculate compliance score
    const metRequirements = requirements.filter(r => r.status === 'met').length;
    const score = Math.round((metRequirements / requirements.length) * 100);

    return {
      compliant: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      violations,
      requirements,
      score
    };
  }

  /**
   * Wait for deployment to reach specific status
   */
  async waitForDeploymentStatus(
    targetStatus: DeploymentState['status'],
    timeout: number = 60000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const currentStatus = await this.extractDeploymentStatus();
        if (currentStatus === targetStatus) {
          return true;
        }

        // Check for failure states
        if (currentStatus === 'failed') {
          throw new Error(`Deployment failed, cannot reach target status: ${targetStatus}`);
        }

        // Wait before checking again
        await this.page.waitForTimeout(2000);
      } catch (error: unknown) {
        // Continue waiting unless it's a critical error
        if (getErrorMessage(error).includes('failed')) {
          throw error;
        }
        await this.page.waitForTimeout(2000);
      }
    }

    return false; // Timeout reached
  }

  /**
   * Validate rollback functionality
   */
  async validateRollback(): Promise<{ success: boolean; duration: number; errors: string[] }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Initiate rollback
      await this.page.click('[data-testid="rollback-button"]', { timeout: 5000 });
      await this.page.waitForSelector('[data-testid="rollback-confirm"]', { timeout: 5000 });
      await this.page.click('[data-testid="rollback-confirm"]');

      // Monitor rollback progress
      const rollbackSuccess = await this.waitForDeploymentStatus('stopped', 30000);

      if (!rollbackSuccess) {
        errors.push('Rollback did not complete within 30 seconds');
      }

      // Verify rollback status
      const rollbackStatus = await this.page.locator('[data-testid="rollback-status"]').textContent();
      if (!rollbackStatus?.includes('Completed') && !rollbackStatus?.includes('Success')) {
        errors.push(`Unexpected rollback status: ${rollbackStatus}`);
      }

      const duration = Date.now() - startTime;

      // Critical SLA requirement: rollback must complete within 30 seconds
      if (duration > 30000) {
        errors.push(`Rollback exceeded 30-second SLA requirement (took ${duration}ms)`);
      }

      return {
        success: errors.length === 0,
        duration,
        errors
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Rollback validation failed: ${errorMessage}`);
      return {
        success: false,
        duration: Date.now() - startTime,
        errors
      };
    }
  }

  /**
   * Validate cost estimation accuracy
   */
  async validateCostEstimation(expectedCost: number, tolerance: number = 0.1): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="cost-estimate"]', { timeout: 10000 });
      const costText = await this.page.locator('[data-testid="cost-estimate"]').textContent();

      if (!costText) return false;

      // Extract numeric value from cost display
      const costMatch = costText.match(/\$?([\d.]+)/);
      if (!costMatch) return false;

      const displayedCost = parseFloat(costMatch[1]);
      const difference = Math.abs(displayedCost - expectedCost);
      const percentageDifference = difference / expectedCost;

      return percentageDifference <= tolerance;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Monitor deployment metrics over time
   */
  async monitorMetrics(duration: number = 60000): Promise<DeploymentState['metrics'][]> {
    const metrics: DeploymentState['metrics'][] = [];
    const startTime = Date.now();
    const interval = 5000; // 5 seconds

    while (Date.now() - startTime < duration) {
      try {
        const currentMetrics = await this.extractMetrics();
        metrics.push({
          ...currentMetrics,
          timestamp: Date.now()
        } as any);

        await this.page.waitForTimeout(interval);
      } catch (error: unknown) {
        // Continue monitoring even if extraction fails
        await this.page.waitForTimeout(interval);
      }
    }

    return metrics;
  }

  // Private helper methods

  private async extractDeploymentStatus(): Promise<DeploymentState['status']> {
    try {
      const statusElement = await this.page.locator('[data-testid="deployment-status"]');
      const statusText = await statusElement.textContent();

      if (!statusText) return 'unknown' as any;

      const lowerStatus = statusText.toLowerCase();
      if (lowerStatus.includes('running') || lowerStatus.includes('deployed')) return 'running';
      if (lowerStatus.includes('deploying') || lowerStatus.includes('starting')) return 'deploying';
      if (lowerStatus.includes('failed') || lowerStatus.includes('error')) return 'failed';
      if (lowerStatus.includes('stopped') || lowerStatus.includes('terminated')) return 'stopped';
      if (lowerStatus.includes('rolling back') || lowerStatus.includes('rollback')) return 'rolling_back';

      return 'pending';
    } catch (error: unknown) {
      return 'unknown' as any;
    }
  }

  private async extractHealthStatus(): Promise<DeploymentState['health']> {
    try {
      const healthElement = await this.page.locator('[data-testid="health-status"]');
      const healthText = await healthElement.textContent();

      if (!healthText) return 'unknown';

      const lowerHealth = healthText.toLowerCase();
      if (lowerHealth.includes('healthy') || lowerHealth.includes('good')) return 'healthy';
      if (lowerHealth.includes('degraded') || lowerHealth.includes('warning')) return 'degraded';
      if (lowerHealth.includes('unhealthy') || lowerHealth.includes('critical')) return 'unhealthy';

      return 'unknown';
    } catch (error: unknown) {
      return 'unknown';
    }
  }

  private async extractInstanceInfo(): Promise<DeploymentState['instances']> {
    try {
      const totalText = await this.page.locator('[data-testid="total-instances"]').textContent();
      const runningText = await this.page.locator('[data-testid="running-instances"]').textContent();
      const failedText = await this.page.locator('[data-testid="failed-instances"]').textContent();

      return {
        total: parseInt(totalText || '0'),
        running: parseInt(runningText || '0'),
        failed: parseInt(failedText || '0')
      };
    } catch (error: unknown) {
      return { total: 0, running: 0, failed: 0 };
    }
  }

  private async extractMetrics(): Promise<DeploymentState['metrics']> {
    try {
      const cpuText = await this.page.locator('[data-testid="cpu-usage"]').textContent();
      const gpuText = await this.page.locator('[data-testid="gpu-usage"]').textContent();
      const memoryText = await this.page.locator('[data-testid="memory-usage"]').textContent();
      const requestsText = await this.page.locator('[data-testid="requests-per-minute"]').textContent();
      const latencyText = await this.page.locator('[data-testid="average-latency"]').textContent();

      return {
        cpu: parseFloat(cpuText?.replace('%', '') || '0'),
        gpu: parseFloat(gpuText?.replace('%', '') || '0'),
        memory: parseFloat(memoryText?.replace('%', '') || '0'),
        requests: parseFloat(requestsText || '0'),
        latency: parseFloat(latencyText?.replace('ms', '') || '0')
      };
    } catch (error: unknown) {
      return { cpu: 0, gpu: 0, memory: 0, requests: 0, latency: 0 };
    }
  }

  private async extractTimestamps(): Promise<DeploymentState['timestamps']> {
    try {
      const createdText = await this.page.locator('[data-testid="created-timestamp"]').textContent();
      const deployedText = await this.page.locator('[data-testid="deployed-timestamp"]').textContent();
      const lastHealthText = await this.page.locator('[data-testid="last-health-check"]').textContent();

      return {
        created: createdText || new Date().toISOString(),
        deployed: deployedText || undefined,
        lastHealthCheck: lastHealthText || new Date().toISOString()
      };
    } catch (error: unknown) {
      const now = new Date().toISOString();
      return {
        created: now,
        lastHealthCheck: now
      };
    }
  }

  // Health check methods

  private async checkDeploymentStatus(): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();
    try {
      const status = await this.extractDeploymentStatus();
      const duration = Date.now() - startTime;

      if (status === 'running') {
        return {
          name: 'Deployment Status',
          status: 'pass',
          message: 'Deployment is running successfully',
          duration
        };
      } else if (status === 'deploying') {
        return {
          name: 'Deployment Status',
          status: 'warning',
          message: 'Deployment is still in progress',
          duration
        };
      } else {
        return {
          name: 'Deployment Status',
          status: 'fail',
          message: `Deployment status is ${status}`,
          duration
        };
      }
    } catch (error: unknown) {
      return {
        name: 'Deployment Status',
        status: 'fail',
        message: `Failed to check deployment status: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkInstanceHealth(): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();
    try {
      const instances = await this.extractInstanceInfo();
      const duration = Date.now() - startTime;

      if (instances.failed > 0) {
        return {
          name: 'Instance Health',
          status: 'fail',
          message: `${instances.failed} of ${instances.total} instances have failed`,
          duration
        };
      } else if (instances.running < instances.total) {
        return {
          name: 'Instance Health',
          status: 'warning',
          message: `${instances.running} of ${instances.total} instances are running`,
          duration
        };
      } else {
        return {
          name: 'Instance Health',
          status: 'pass',
          message: `All ${instances.total} instances are running`,
          duration
        };
      }
    } catch (error: unknown) {
      return {
        name: 'Instance Health',
        status: 'fail',
        message: `Failed to check instance health: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkApiResponsiveness(): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();
    try {
      // Simulate API health check by clicking health check button
      await this.page.click('[data-testid="health-check-button"]', { timeout: 5000 });
      await this.page.waitForSelector('[data-testid="health-check-result"]', { timeout: 10000 });

      const resultText = await this.page.locator('[data-testid="health-check-result"]').textContent();
      const duration = Date.now() - startTime;

      if (resultText?.includes('OK') || resultText?.includes('Healthy')) {
        return {
          name: 'API Responsiveness',
          status: 'pass',
          message: 'API is responding normally',
          duration
        };
      } else {
        return {
          name: 'API Responsiveness',
          status: 'fail',
          message: `API health check failed: ${resultText}`,
          duration
        };
      }
    } catch (error: unknown) {
      return {
        name: 'API Responsiveness',
        status: 'fail',
        message: `API health check failed: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkResourceUtilization(): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();
    try {
      const metrics = await this.extractMetrics();
      const duration = Date.now() - startTime;

      // Check for resource utilization issues
      if (metrics.cpu > 90 || metrics.gpu > 90 || metrics.memory > 90) {
        return {
          name: 'Resource Utilization',
          status: 'warning',
          message: `High resource utilization: CPU=${metrics.cpu}%, GPU=${metrics.gpu}%, Memory=${metrics.memory}%`,
          duration
        };
      } else if (metrics.cpu < 5 && metrics.gpu < 5) {
        return {
          name: 'Resource Utilization',
          status: 'warning',
          message: 'Unusually low resource utilization may indicate idle deployment',
          duration
        };
      } else {
        return {
          name: 'Resource Utilization',
          status: 'pass',
          message: `Resource utilization is normal: CPU=${metrics.cpu}%, GPU=${metrics.gpu}%, Memory=${metrics.memory}%`,
          duration
        };
      }
    } catch (error: unknown) {
      return {
        name: 'Resource Utilization',
        status: 'fail',
        message: `Failed to check resource utilization: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkOrganizationCompliance(): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();
    try {
      const expectedTheme = this.organization === 'swaggystacks' ? 'terminal' : 'corporate';
      const themeElement = await this.page.locator('[data-testid="theme-indicator"]');
      const currentTheme = await themeElement.textContent();
      const duration = Date.now() - startTime;

      if (currentTheme?.includes(expectedTheme)) {
        return {
          name: 'Organization Compliance',
          status: 'pass',
          message: `Correct theme applied for ${this.organization}`,
          duration
        };
      } else {
        return {
          name: 'Organization Compliance',
          status: 'fail',
          message: `Incorrect theme: expected ${expectedTheme}, got ${currentTheme}`,
          duration
        };
      }
    } catch (error: unknown) {
      return {
        name: 'Organization Compliance',
        status: 'fail',
        message: `Failed to check organization compliance: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      };
    }
  }

  // Compliance check methods

  private async checkThemeCompliance(expectedTheme: string): Promise<{ name: string; status: 'met' | 'not_met' | 'partially_met'; met: boolean; details: string }> {
    try {
      const themeElement = await this.page.locator('[data-testid="theme-indicator"]');
      const currentTheme = await themeElement.textContent();

      const met = currentTheme?.includes(expectedTheme) || false;

      return {
        name: 'Theme Compliance',
        status: met ? 'met' : 'not_met',
        met,
        details: `Expected: ${expectedTheme}, Current: ${currentTheme}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        name: 'Theme Compliance',
        status: 'not_met',
        met: false,
        details: `Failed to check theme compliance: ${errorMessage}`
      };
    }
  }

  private async checkContentRating(): Promise<{ name: string; status: 'met' | 'not_met' | 'partially_met'; met: boolean; details: string }> {
    try {
      // For gaming deployments, check content rating compliance
      const ratingElement = await this.page.locator('[data-testid="content-rating"]');
      const rating = await ratingElement.textContent();

      const appropriateRatings = ['E', 'E10+', 'T', 'M'];
      const met = appropriateRatings.some(r => rating?.includes(r)) || false;

      return {
        name: 'Content Rating',
        status: met ? 'met' : 'partially_met',
        met,
        details: `Content rating: ${rating}`
      };
    } catch (error: unknown) {
      return {
        name: 'Content Rating',
        status: 'partially_met',
        met: true, // Assume compliant if not specified
        details: 'Content rating not specified (acceptable for development)'
      };
    }
  }

  private async checkAuditLogging(): Promise<{ name: string; status: 'met' | 'not_met' | 'partially_met'; met: boolean; details: string }> {
    try {
      const auditElement = await this.page.locator('[data-testid="audit-logging"]');
      const auditStatus = await auditElement.textContent();

      const met = auditStatus?.toLowerCase().includes('enabled') || false;

      return {
        name: 'Audit Logging',
        status: met ? 'met' : 'not_met',
        met,
        details: `Audit logging status: ${auditStatus}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        name: 'Audit Logging',
        status: 'not_met',
        met: false,
        details: `Failed to check audit logging: ${errorMessage}`
      };
    }
  }

  private async checkDataRetention(): Promise<{ name: string; status: 'met' | 'not_met' | 'partially_met'; met: boolean; details: string }> {
    try {
      const retentionElement = await this.page.locator('[data-testid="data-retention"]');
      const retentionText = await retentionElement.textContent();

      // Extract retention period in days
      const match = retentionText?.match(/(\d+)\s*days?/);
      const retentionDays = match ? parseInt(match[1]) : 0;

      // Enterprise requires at least 90 days retention
      const met = retentionDays >= 90;

      return {
        name: 'Data Retention',
        status: met ? 'met' : 'not_met',
        met,
        details: `Data retention period: ${retentionDays} days (minimum: 90 days)`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        name: 'Data Retention',
        status: 'not_met',
        met: false,
        details: `Failed to check data retention: ${errorMessage}`
      };
    }
  }
}

/**
 * Utility functions for common validation patterns
 */
export const ValidationUtils = {
  /**
   * Assert deployment meets SLA requirements
   */
  async assertSLACompliance(
    validationUtils: DeploymentValidationUtils,
    maxDeploymentTime: number = 60000,
    maxRollbackTime: number = 30000
  ): Promise<void> {
    const startTime = Date.now();

    // Wait for deployment to complete
    const deploymentSuccess = await validationUtils.waitForDeploymentStatus('running', maxDeploymentTime);
    const deploymentTime = Date.now() - startTime;

    expect(deploymentSuccess).toBe(true);
    expect(deploymentTime).toBeLessThan(maxDeploymentTime);

    // Test rollback SLA
    const rollbackResult = await validationUtils.validateRollback();
    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.duration).toBeLessThan(maxRollbackTime);
  },

  /**
   * Assert deployment health is acceptable
   */
  async assertHealthCompliance(validationUtils: DeploymentValidationUtils): Promise<void> {
    const healthResult = await validationUtils.performHealthCheck();

    expect(healthResult.passed).toBe(true);
    expect(healthResult.overallHealth).not.toBe('unhealthy');
    expect(healthResult.summary.failedChecks).toBe(0);
  },

  /**
   * Assert organization-specific compliance
   */
  async assertOrganizationCompliance(
    validationUtils: DeploymentValidationUtils,
    organization: 'swaggystacks' | 'scientia'
  ): Promise<void> {
    const complianceResult = await validationUtils.validateCompliance();

    expect(complianceResult.compliant).toBe(true);
    expect(complianceResult.score).toBeGreaterThan(80);

    // Organization-specific assertions
    if (organization === 'scientia') {
      // Enterprise should have no critical violations
      const criticalViolations = complianceResult.violations.filter(v => v.severity === 'critical');
      expect(criticalViolations.length).toBe(0);
    }
  },

  /**
   * Generate validation report
   */
  generateValidationReport(
    deploymentState: DeploymentState,
    healthResult: HealthCheckResult,
    complianceResult: ComplianceCheckResult
  ): string {
    return [
      `# Deployment Validation Report`,
      `**Deployment ID:** ${deploymentState.id}`,
      `**Model:** ${deploymentState.modelId}`,
      `**Organization:** ${deploymentState.organization}`,
      `**Status:** ${deploymentState.status}`,
      `**Health:** ${deploymentState.health}`,
      ``,
      `## Health Check Results`,
      `- Overall Health: ${healthResult.overallHealth}`,
      `- Checks Passed: ${healthResult.summary.passedChecks}/${healthResult.summary.totalChecks}`,
      `- Warnings: ${healthResult.summary.warnings}`,
      `- Failed Checks: ${healthResult.summary.failedChecks}`,
      ``,
      healthResult.checks.map(check =>
        `- **${check.name}**: ${check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'} ${check.message} (${check.duration}ms)`
      ).join('\n'),
      ``,
      `## Compliance Results`,
      `- Overall Compliance: ${complianceResult.compliant ? '✅' : '❌'}`,
      `- Compliance Score: ${complianceResult.score}/100`,
      ``,
      complianceResult.violations.length > 0 ? [
        `### Violations`,
        complianceResult.violations.map(v =>
          `- **${v.severity.toUpperCase()}**: ${v.description} (${v.recommendation})`
        ).join('\n')
      ].join('\n') : '',
      ``,
      `### Requirements`,
      complianceResult.requirements.map(req =>
        `- **${req.name}**: ${req.status === 'met' ? '✅' : '❌'} ${req.details}`
      ).join('\n'),
      ``,
      `## Resource Metrics`,
      `- CPU Usage: ${deploymentState.metrics.cpu}%`,
      `- GPU Usage: ${deploymentState.metrics.gpu}%`,
      `- Memory Usage: ${deploymentState.metrics.memory}%`,
      `- Requests/min: ${deploymentState.metrics.requests}`,
      `- Avg Latency: ${deploymentState.metrics.latency}ms`,
      ``,
      `## Instance Information`,
      `- Total Instances: ${deploymentState.instances.total}`,
      `- Running Instances: ${deploymentState.instances.running}`,
      `- Failed Instances: ${deploymentState.instances.failed}`
    ].filter(line => line !== '').join('\n');
  }
};