/**
 * Deployment Test Pipeline - Orchestrates comprehensive end-to-end test workflows
 * Manages the complete testing lifecycle from validation through deployment to monitoring
 */

import { Page, Browser } from '@playwright/test';
import { MockRunPodEnvironment, DeploymentConfig, DeploymentMetrics } from './MockRunPodEnvironment';
import { DeploymentValidator, ValidationContext, ValidationResult, createValidationContext } from './DeploymentValidator';
import { DeploymentScenario } from './deployment-scenarios';
import { ModelTemplate, getModelTemplate } from './model-templates';

export interface PipelineConfig {
  browser: Browser;
  environment: 'development' | 'staging' | 'production';
  organization: 'swaggystacks' | 'scientia';
  parallelDeployments: number;
  timeoutMs: number;
  retryAttempts: number;
  enableChaosTestingipt?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableRollbackTesting?: boolean;
}

export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  results?: any;
  errors?: string[];
  warnings?: string[];
}

export interface PipelineExecution {
  id: string;
  scenario: DeploymentScenario;
  config: PipelineConfig;
  stages: PipelineStage[];
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  metrics: PipelineMetrics;
  summary: ExecutionSummary;
}

export interface PipelineMetrics {
  validationTime: number;
  deploymentTime: number;
  monitoringTime: number;
  rollbackTime?: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  maxLatency: number;
  resourceUtilization: {
    cpu: number[];
    gpu: number[];
    memory: number[];
  };
  costIncurred: number;
}

export interface ExecutionSummary {
  overallSuccess: boolean;
  validationPassed: boolean;
  deploymentSuccessful: boolean;
  performanceWithinSLA: boolean;
  rollbackTested?: boolean;
  rollbackSuccessful?: boolean;
  criticalIssues: string[];
  recommendations: string[];
  scorecard: {
    validation: number; // 0-100
    deployment: number; // 0-100
    performance: number; // 0-100
    reliability: number; // 0-100
    overall: number; // 0-100
  };
}

export interface ChaosEvent {
  type: 'network_latency' | 'gpu_failure' | 'memory_pressure' | 'disk_full' | 'api_timeout';
  severity: 'low' | 'medium' | 'high';
  duration: number; // milliseconds
  description: string;
  injectionTime: number; // milliseconds from start
}

/**
 * Comprehensive deployment testing pipeline
 */
export class DeploymentTestPipeline {
  private mockEnvironment: MockRunPodEnvironment;
  private validationContext: ValidationContext;
  private currentExecution: PipelineExecution | null = null;
  private pages: Page[] = [];

  constructor(
    private config: PipelineConfig,
    mockEnvironment?: MockRunPodEnvironment
  ) {
    this.mockEnvironment = mockEnvironment || new MockRunPodEnvironment();
    this.validationContext = createValidationContext(config.environment, config.organization);
  }

  /**
   * Execute a complete deployment test pipeline for a scenario
   */
  async execute(scenario: DeploymentScenario): Promise<PipelineExecution> {
    const executionId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentExecution = {
      id: executionId,
      scenario,
      config: this.config,
      stages: this.initializeStages(),
      startTime: new Date(),
      status: 'running',
      metrics: this.initializeMetrics(),
      summary: this.initializeSummary()
    };

    try {
      await this.executeStage('pre-validation', () => this.preValidationStage());
      await this.executeStage('configuration-validation', () => this.configurationValidationStage());
      await this.executeStage('resource-preparation', () => this.resourcePreparationStage());
      await this.executeStage('deployment-execution', () => this.deploymentExecutionStage());
      await this.executeStage('health-verification', () => this.healthVerificationStage());
      await this.executeStage('performance-testing', () => this.performanceTestingStage());

      if (this.config.enableRollbackTesting) {
        await this.executeStage('rollback-testing', () => this.rollbackTestingStage());
      }

      if (this.config.enableChaosTestingipt) {
        await this.executeStage('chaos-testing', () => this.chaosTestingStage());
      }

      await this.executeStage('cleanup', () => this.cleanupStage());
      await this.executeStage('summary-generation', () => this.summaryGenerationStage());

      this.currentExecution.status = 'completed';
    } catch (error: unknown) {
      this.currentExecution.status = 'failed';
      this.addExecutionError(`Pipeline execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.currentExecution.endTime = new Date();
      this.currentExecution.totalDuration =
        this.currentExecution.endTime.getTime() - this.currentExecution.startTime.getTime();

      await this.cleanup();
    }

    return this.currentExecution;
  }

  /**
   * Execute multiple scenarios in parallel
   */
  async executeBatch(scenarios: DeploymentScenario[]): Promise<PipelineExecution[]> {
    const maxConcurrent = Math.min(scenarios.length, this.config.parallelDeployments);
    const results: PipelineExecution[] = [];

    for (let i = 0; i < scenarios.length; i += maxConcurrent) {
      const batch = scenarios.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(scenario => this.execute(scenario));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Scenario ${batch[index].name} failed:`, result.reason);
        }
      });
    }

    return results;
  }

  private async executeStage(stageName: string, stageFunction: () => Promise<void>): Promise<void> {
    const stage = this.currentExecution!.stages.find(s => s.name === stageName);
    if (!stage) return;

    stage.status = 'running';
    stage.startTime = new Date();

    try {
      await stageFunction();
      stage.status = 'completed';
    } catch (error: unknown) {
      stage.status = 'failed';
      stage.errors = [error instanceof Error ? error.message : 'Unknown error'];
      throw error;
    } finally {
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - stage.startTime!.getTime();
    }
  }

  private async preValidationStage(): Promise<void> {
    // Setup browser pages for parallel testing
    const browserPromises = Array.from({ length: this.config.parallelDeployments }, () =>
      this.config.browser.newPage()
    );
    this.pages = await Promise.all(browserPromises);

    // Configure mock environment for the scenario
    await this.mockEnvironment.setScenario('stable'); // Start with stable scenario

    // Navigate pages to appropriate organization landing page
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
    const orgPath = this.config.organization === 'swaggystacks' ? '/swaggystacks' : '/scientia';

    await Promise.all(this.pages.map(page => page.goto(`${baseUrl}${orgPath}`)));
  }

  private async configurationValidationStage(): Promise<void> {
    const scenario = this.currentExecution!.scenario;
    const validationResults: ValidationResult[] = [];

    for (const config of scenario.configs) {
      const result = await DeploymentValidator.validateDeployment(config, this.validationContext);
      validationResults.push(result);

      if (!result.isValid) {
        throw new Error(`Configuration validation failed: ${result.errors.join(', ')}`);
      }
    }

    this.currentExecution!.summary.validationPassed = validationResults.every(r => r.isValid);
    this.currentExecution!.summary.scorecard.validation =
      validationResults.reduce((sum, r) => sum + r.score, 0) / validationResults.length;
  }

  private async resourcePreparationStage(): Promise<void> {
    // Simulate resource allocation and preparation
    const scenario = this.currentExecution!.scenario;

    for (const config of scenario.configs) {
      const modelTemplate = getModelTemplate(config.modelId, config.organization);

      if (!modelTemplate) {
        throw new Error(`Model template not found: ${config.modelId}`);
      }

      // Simulate resource allocation time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
  }

  private async deploymentExecutionStage(): Promise<void> {
    const scenario = this.currentExecution!.scenario;
    const deploymentStartTime = Date.now();

    // Execute deployments in parallel using available pages
    const deploymentPromises = scenario.configs.map(async (config, index) => {
      const page = this.pages[index % this.pages.length];
      return await this.executeDeployment(page, config);
    });

    const deploymentResults = await Promise.all(deploymentPromises);

    this.currentExecution!.metrics.deploymentTime = Date.now() - deploymentStartTime;
    this.currentExecution!.summary.deploymentSuccessful = deploymentResults.every(r => r.success);
    this.currentExecution!.summary.scorecard.deployment =
      deploymentResults.filter(r => r.success).length / deploymentResults.length * 100;
  }

  private async executeDeployment(page: Page, config: DeploymentConfig): Promise<{ success: boolean; metrics?: any }> {
    try {
      // Navigate to marketplace
      await page.click('[data-testid="marketplace-link"]', { timeout: 5000 });
      await page.waitForSelector('[data-testid="marketplace-page"]', { timeout: 10000 });

      // Search for model
      await page.fill('[data-testid="model-search"]', config.modelId);
      await page.click('[data-testid="search-button"]');

      // Wait for search results
      await page.waitForSelector('[data-testid="model-card"]', { timeout: 10000 });

      // Click on the first model result
      await page.click('[data-testid="model-card"]:first-child');

      // Configure deployment
      await page.selectOption('[data-testid="gpu-type-select"]', config.gpuType);
      await page.fill('[data-testid="instance-count-input"]', config.instanceCount.toString());

      if (config.autoScaling) {
        await page.check('[data-testid="enable-autoscaling"]');
        if (config.minInstances) {
          await page.fill('[data-testid="min-instances-input"]', config.minInstances.toString());
        }
        if (config.maxInstances) {
          await page.fill('[data-testid="max-instances-input"]', config.maxInstances.toString());
        }
      }

      // Add environment variables
      if (config.envVars) {
        for (const [key, value] of Object.entries(config.envVars)) {
          await page.click('[data-testid="add-env-var"]');
          await page.fill('[data-testid="env-var-key"]:last-child', key);
          await page.fill('[data-testid="env-var-value"]:last-child', value);
        }
      }

      // Deploy
      await page.click('[data-testid="deploy-button"]');

      // Wait for deployment to start
      await page.waitForSelector('[data-testid="deployment-status"]', { timeout: 15000 });

      // Monitor deployment progress
      const deploymentSuccess = await this.monitorDeploymentProgress(page, config);

      return { success: deploymentSuccess };
    } catch (error: unknown) {
      console.error(`Deployment failed for ${config.modelId}:`, error instanceof Error ? error.message : 'Unknown error');
      return { success: false };
    }
  }

  private async monitorDeploymentProgress(page: Page, config: DeploymentConfig): Promise<boolean> {
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusElement = await page.locator('[data-testid="deployment-status"]');
        const statusText = await statusElement.textContent();

        if (statusText?.includes('Running') || statusText?.includes('Deployed')) {
          return true;
        }

        if (statusText?.includes('Failed') || statusText?.includes('Error')) {
          return false;
        }

        await page.waitForTimeout(checkInterval);
      } catch (error: unknown) {
        // Continue monitoring even if status check fails
        await page.waitForTimeout(checkInterval);
      }
    }

    return false; // Timeout
  }

  private async healthVerificationStage(): Promise<void> {
    // Verify all deployments are healthy and responding
    const scenario = this.currentExecution!.scenario;
    const healthChecks: Promise<boolean>[] = [];

    for (let i = 0; i < scenario.configs.length; i++) {
      const page = this.pages[i % this.pages.length];
      healthChecks.push(this.performHealthCheck(page));
    }

    const healthResults = await Promise.all(healthChecks);
    const allHealthy = healthResults.every(healthy => healthy);

    if (!allHealthy) {
      throw new Error('Health verification failed for one or more deployments');
    }
  }

  private async performHealthCheck(page: Page): Promise<boolean> {
    try {
      // Check if deployment monitor shows healthy status
      await page.waitForSelector('[data-testid="deployment-monitor"]', { timeout: 10000 });
      const healthStatus = await page.locator('[data-testid="health-status"]').textContent();
      return healthStatus?.includes('Healthy') || healthStatus?.includes('Running') || false;
    } catch (error: unknown) {
      return false;
    }
  }

  private async performanceTestingStage(): Promise<void> {
    if (!this.config.enablePerformanceMonitoring) {
      this.getStage('performance-testing')!.status = 'skipped';
      return;
    }

    const performanceStartTime = Date.now();
    const scenario = this.currentExecution!.scenario;

    // Simulate load testing
    await this.simulateLoadTesting(scenario);

    this.currentExecution!.metrics.monitoringTime = Date.now() - performanceStartTime;

    // Check if performance is within SLA
    const avgLatency = this.currentExecution!.metrics.averageLatency;
    const maxAllowedLatency = scenario.expectedBehavior.deploymentTime.max * 1000; // Convert to ms

    this.currentExecution!.summary.performanceWithinSLA = avgLatency <= maxAllowedLatency;
    this.currentExecution!.summary.scorecard.performance =
      this.currentExecution!.summary.performanceWithinSLA ? 100 : 60;
  }

  private async simulateLoadTesting(scenario: DeploymentScenario): Promise<void> {
    const requestCount = 100;
    const concurrentRequests = 10;
    const latencies: number[] = [];

    for (let i = 0; i < requestCount; i += concurrentRequests) {
      const batch = Math.min(concurrentRequests, requestCount - i);
      const batchPromises = Array.from({ length: batch }, () => this.simulateRequest());

      const batchResults = await Promise.all(batchPromises);
      latencies.push(...batchResults.map(r => r.latency));
    }

    this.currentExecution!.metrics.totalRequests = requestCount;
    this.currentExecution!.metrics.successfulRequests = latencies.length;
    this.currentExecution!.metrics.averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    this.currentExecution!.metrics.maxLatency = Math.max(...latencies);
  }

  private async simulateRequest(): Promise<{ latency: number; success: boolean }> {
    const startTime = Date.now();

    // Simulate API request latency
    const baseLatency = 100 + Math.random() * 300; // 100-400ms
    await new Promise(resolve => setTimeout(resolve, baseLatency));

    const latency = Date.now() - startTime;
    const success = Math.random() > 0.05; // 95% success rate

    return { latency, success };
  }

  private async rollbackTestingStage(): Promise<void> {
    if (!this.config.enableRollbackTesting) {
      this.getStage('rollback-testing')!.status = 'skipped';
      return;
    }

    const rollbackStartTime = Date.now();

    // Test rollback functionality on first deployment
    const page = this.pages[0];

    try {
      await page.click('[data-testid="rollback-button"]', { timeout: 5000 });
      await page.waitForSelector('[data-testid="rollback-confirm"]', { timeout: 5000 });
      await page.click('[data-testid="rollback-confirm"]');

      // Monitor rollback progress
      const rollbackSuccess = await this.monitorRollbackProgress(page);

      this.currentExecution!.summary.rollbackTested = true;
      this.currentExecution!.summary.rollbackSuccessful = rollbackSuccess;
      this.currentExecution!.metrics.rollbackTime = Date.now() - rollbackStartTime;

      // Rollback must complete within 30 seconds (SLA requirement)
      if (this.currentExecution!.metrics.rollbackTime > 30000) {
        throw new Error('Rollback exceeded 30-second SLA requirement');
      }

    } catch (error: unknown) {
      this.currentExecution!.summary.rollbackTested = true;
      this.currentExecution!.summary.rollbackSuccessful = false;
      throw new Error(`Rollback testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async monitorRollbackProgress(page: Page): Promise<boolean> {
    const maxWaitTime = 35000; // 35 seconds (5 second buffer beyond SLA)
    const checkInterval = 1000; // 1 second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusElement = await page.locator('[data-testid="rollback-status"]');
        const statusText = await statusElement.textContent();

        if (statusText?.includes('Completed') || statusText?.includes('Success')) {
          return true;
        }

        if (statusText?.includes('Failed') || statusText?.includes('Error')) {
          return false;
        }

        await page.waitForTimeout(checkInterval);
      } catch (error: unknown) {
        await page.waitForTimeout(checkInterval);
      }
    }

    return false; // Timeout
  }

  private async chaosTestingStage(): Promise<void> {
    if (!this.config.enableChaosTestingipt) {
      this.getStage('chaos-testing')!.status = 'skipped';
      return;
    }

    const chaosEvents: ChaosEvent[] = [
      {
        type: 'network_latency',
        severity: 'medium',
        duration: 5000,
        description: 'Simulate network latency spike',
        injectionTime: 2000
      },
      {
        type: 'memory_pressure',
        severity: 'low',
        duration: 3000,
        description: 'Simulate memory pressure',
        injectionTime: 8000
      }
    ];

    for (const event of chaosEvents) {
      await this.injectChaosEvent(event);
    }
  }

  private async injectChaosEvent(event: ChaosEvent): Promise<void> {
    // Wait for injection time
    await new Promise(resolve => setTimeout(resolve, event.injectionTime));

    // Simulate chaos event impact
    switch (event.type) {
      case 'network_latency':
        await this.mockEnvironment.setScenario('stressed');
        break;
      case 'memory_pressure':
        // Simulate resource constraints
        break;
      case 'gpu_failure':
        await this.mockEnvironment.setScenario('degraded');
        break;
    }

    // Let the event run for its duration
    await new Promise(resolve => setTimeout(resolve, event.duration));

    // Recovery
    await this.mockEnvironment.setScenario('stable');
  }

  private async cleanupStage(): Promise<void> {
    // Cleanup deployments
    for (const page of this.pages) {
      try {
        await page.click('[data-testid="cleanup-button"]', { timeout: 5000 });
      } catch (error: unknown) {
        // Continue cleanup even if some fail
      }
    }
  }

  private async summaryGenerationStage(): Promise<void> {
    const execution = this.currentExecution!;

    // Calculate overall score
    const scores = execution.summary.scorecard;
    scores.reliability = execution.summary.rollbackSuccessful ? 100 : 50;
    scores.overall = (scores.validation + scores.deployment + scores.performance + scores.reliability) / 4;

    // Determine overall success
    execution.summary.overallSuccess =
      execution.summary.validationPassed &&
      execution.summary.deploymentSuccessful &&
      execution.summary.performanceWithinSLA &&
      (execution.summary.rollbackTested ? execution.summary.rollbackSuccessful : true);

    // Generate recommendations
    if (!execution.summary.performanceWithinSLA) {
      execution.summary.recommendations.push('Consider upgrading GPU types for better performance');
    }

    if (execution.summary.rollbackTested && !execution.summary.rollbackSuccessful) {
      execution.summary.criticalIssues.push('Rollback functionality failed - investigate immediately');
    }

    if (scores.overall < 80) {
      execution.summary.recommendations.push('Review deployment configuration and infrastructure requirements');
    }
  }

  private async cleanup(): Promise<void> {
    // Close all pages
    await Promise.all(this.pages.map(page => page.close().catch(() => {})));
    this.pages = [];
  }

  private initializeStages(): PipelineStage[] {
    return [
      { name: 'pre-validation', status: 'pending' },
      { name: 'configuration-validation', status: 'pending' },
      { name: 'resource-preparation', status: 'pending' },
      { name: 'deployment-execution', status: 'pending' },
      { name: 'health-verification', status: 'pending' },
      { name: 'performance-testing', status: 'pending' },
      { name: 'rollback-testing', status: 'pending' },
      { name: 'chaos-testing', status: 'pending' },
      { name: 'cleanup', status: 'pending' },
      { name: 'summary-generation', status: 'pending' }
    ];
  }

  private initializeMetrics(): PipelineMetrics {
    return {
      validationTime: 0,
      deploymentTime: 0,
      monitoringTime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      maxLatency: 0,
      resourceUtilization: {
        cpu: [],
        gpu: [],
        memory: []
      },
      costIncurred: 0
    };
  }

  private initializeSummary(): ExecutionSummary {
    return {
      overallSuccess: false,
      validationPassed: false,
      deploymentSuccessful: false,
      performanceWithinSLA: false,
      criticalIssues: [],
      recommendations: [],
      scorecard: {
        validation: 0,
        deployment: 0,
        performance: 0,
        reliability: 0,
        overall: 0
      }
    };
  }

  private getStage(name: string): PipelineStage | undefined {
    return this.currentExecution?.stages.find(s => s.name === name);
  }

  private addExecutionError(error: string): void {
    if (this.currentExecution) {
      this.currentExecution.summary.criticalIssues.push(error);
    }
  }

  /**
   * Get current execution status
   */
  getCurrentExecution(): PipelineExecution | null {
    return this.currentExecution;
  }

  /**
   * Generate execution report
   */
  generateReport(execution: PipelineExecution): string {
    const report = [
      `# Deployment Test Pipeline Report`,
      `**Execution ID:** ${execution.id}`,
      `**Scenario:** ${execution.scenario.name}`,
      `**Organization:** ${execution.scenario.organization}`,
      `**Duration:** ${execution.totalDuration}ms`,
      `**Status:** ${execution.status}`,
      ``,
      `## Summary`,
      `- Overall Success: ${execution.summary.overallSuccess ? '✅' : '❌'}`,
      `- Validation Passed: ${execution.summary.validationPassed ? '✅' : '❌'}`,
      `- Deployment Successful: ${execution.summary.deploymentSuccessful ? '✅' : '❌'}`,
      `- Performance Within SLA: ${execution.summary.performanceWithinSLA ? '✅' : '❌'}`,
      execution.summary.rollbackTested ? `- Rollback Successful: ${execution.summary.rollbackSuccessful ? '✅' : '❌'}` : '',
      ``,
      `## Scorecard`,
      `- Validation: ${execution.summary.scorecard.validation}/100`,
      `- Deployment: ${execution.summary.scorecard.deployment}/100`,
      `- Performance: ${execution.summary.scorecard.performance}/100`,
      `- Reliability: ${execution.summary.scorecard.reliability}/100`,
      `- **Overall: ${execution.summary.scorecard.overall}/100**`,
      ``,
      `## Metrics`,
      `- Total Requests: ${execution.metrics.totalRequests}`,
      `- Successful Requests: ${execution.metrics.successfulRequests}`,
      `- Average Latency: ${execution.metrics.averageLatency}ms`,
      `- Max Latency: ${execution.metrics.maxLatency}ms`,
      `- Deployment Time: ${execution.metrics.deploymentTime}ms`,
      execution.metrics.rollbackTime ? `- Rollback Time: ${execution.metrics.rollbackTime}ms` : '',
      ``,
      execution.summary.criticalIssues.length > 0 ? `## Critical Issues\n${execution.summary.criticalIssues.map(issue => `- ❗ ${issue}`).join('\n')}\n` : '',
      execution.summary.recommendations.length > 0 ? `## Recommendations\n${execution.summary.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}\n` : '',
      `## Stage Details`,
      execution.stages.map(stage =>
        `- **${stage.name}**: ${stage.status} (${stage.duration || 0}ms)`
      ).join('\n')
    ].filter(line => line !== '').join('\n');

    return report;
  }
}