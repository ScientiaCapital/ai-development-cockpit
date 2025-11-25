/**
 * Test Orchestrator - Central coordinator for comprehensive E2E testing
 * Orchestrates deployment testing across the entire pipeline with validation utilities
 */

import { Browser, Page } from '@playwright/test';
import { DeploymentTestPipeline, PipelineConfig, PipelineExecution } from '../fixtures/DeploymentTestPipeline';
import { DeploymentValidationUtils, ValidationUtils } from './DeploymentValidationUtils';
import { DeploymentValidator } from '../fixtures/DeploymentValidator';
import { NetworkSimulator } from '../fixtures/NetworkSimulator';
import { TestOrchestratorConfig } from './TestCoordinator';
import { MockRunPodEnvironment } from '../fixtures/MockRunPodEnvironment';
import { createTestEnvironment, TestSuiteFactory } from '../fixtures/index';
import { arcadeScenarios, enterpriseScenarios, DeploymentScenario } from '../fixtures/deployment-scenarios';
import { TestResults } from './TestCoordinator';

export interface OrchestrationConfig {
  browser: Browser;
  parallelSessions: number;
  organizations: ('arcade' | 'enterprise')[];
  environments: ('development' | 'staging' | 'production')[];
  testSuites: TestSuiteType[];
  enableChaosMode: boolean;
  enableNetworkSimulation: boolean;
  enableComplianceValidation: boolean;
  maxExecutionTime: number; // milliseconds
  reportingLevel: 'minimal' | 'standard' | 'detailed';
}

export type TestSuiteType = 'smoke' | 'integration' | 'performance' | 'chaos' | 'compliance' | 'full';

export interface OrchestrationResult {
  executionId: string;
  config: OrchestrationConfig;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  results: {
    organizationResults: Map<string, OrganizationTestResult>;
    overallMetrics: OverallMetrics;
    summary: ExecutionSummary;
  };
  reports: {
    executive: string;
    technical: string;
    compliance: string;
  };
}

export interface OrganizationTestResult {
  organization: 'arcade' | 'enterprise';
  scenarios: Map<string, PipelineExecution>;
  validationResults: Map<string, any>;
  complianceResults: any;
  metrics: {
    totalScenarios: number;
    successfulScenarios: number;
    averageScore: number;
    averageDeploymentTime: number;
    averageRollbackTime: number;
    slaCompliance: number; // percentage
  };
  status: 'passed' | 'failed' | 'partial';
}

export interface OverallMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  successRate: number;
  averagePerformanceScore: number;
  slaCompliance: number;
  criticalIssues: string[];
  recommendations: string[];
  resourceEfficiency: {
    cpu: number;
    gpu: number;
    memory: number;
  };
  costOptimization: {
    estimatedMonthlyCost: number;
    savingsOpportunities: string[];
  };
}

export interface ExecutionSummary {
  overallSuccess: boolean;
  readyForProduction: boolean;
  criticalBlockers: string[];
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  complianceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  reliabilityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  nextSteps: string[];
}

/**
 * Main test orchestrator class
 */
export class TestOrchestrator {
  private config: OrchestrationConfig;
  private pages: Map<string, Page[]> = new Map();
  private validationUtils: Map<string, DeploymentValidationUtils[]> = new Map();
  private currentExecution: OrchestrationResult | null = null;

  constructor(config: OrchestrationConfig) {
    this.config = config;
  }

  /**
   * Execute comprehensive testing across all configured organizations and environments
   */
  async execute(): Promise<OrchestrationResult> {
    const executionId = `orchestration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    this.currentExecution = {
      executionId,
      config: this.config,
      startTime,
      endTime: new Date(),
      totalDuration: 0,
      status: 'completed',
      results: {
        organizationResults: new Map(),
        overallMetrics: this.initializeOverallMetrics(),
        summary: this.initializeExecutionSummary()
      },
      reports: {
        executive: '',
        technical: '',
        compliance: ''
      }
    };

    try {
      console.log(`🚀 Starting orchestrated testing execution: ${executionId}`);

      // Initialize browser sessions
      await this.initializeBrowserSessions();

      // Execute tests for each organization
      for (const organization of this.config.organizations) {
        console.log(`📋 Testing organization: ${organization}`);
        const orgResult = await this.executeOrganizationTests(organization);
        this.currentExecution.results.organizationResults.set(organization, orgResult);
      }

      // Calculate overall metrics and summary
      await this.calculateOverallResults();

      // Generate reports
      await this.generateReports();

      this.currentExecution.status = 'completed';
      console.log(`✅ Orchestration completed successfully`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown orchestration error';
      console.error(`❌ Orchestration failed:`, errorMessage);
      this.currentExecution.status = 'failed';
      this.currentExecution.results.summary.criticalBlockers.push(`Orchestration failed: ${errorMessage}`);
    } finally {
      this.currentExecution.endTime = new Date();
      this.currentExecution.totalDuration =
        this.currentExecution.endTime.getTime() - this.currentExecution.startTime.getTime();

      await this.cleanup();
    }

    return this.currentExecution;
  }

  /**
   * Execute smoke tests only (quick validation)
   */
  async executeSmokeTests(organization: 'arcade' | 'enterprise'): Promise<OrganizationTestResult> {
    const scenarios = this.getScenariosByComplexity(organization, 'simple').slice(0, 2); // Only simple scenarios
    const testEnvironment = createTestEnvironment(organization, 'development');

    return await this.executeScenarioSet(
      organization,
      scenarios,
      testEnvironment,
      { enableChaos: false, enablePerformanceMonitoring: false }
    );
  }

  /**
   * Execute performance tests (load, stress, endurance)
   */
  async executePerformanceTests(organization: 'arcade' | 'enterprise'): Promise<OrganizationTestResult> {
    const scenarios = this.getScenariosByComplexity(organization, 'complex'); // Complex scenarios for performance testing
    const testEnvironment = createTestEnvironment(organization, 'production');

    return await this.executeScenarioSet(
      organization,
      scenarios,
      testEnvironment,
      { enableChaos: false, enablePerformanceMonitoring: true }
    );
  }

  /**
   * Execute chaos engineering tests
   */
  async executeChaosTests(organization: 'arcade' | 'enterprise'): Promise<OrganizationTestResult> {
    const scenarios = this.getScenariosByComplexity(organization, 'medium'); // Medium complexity for chaos testing
    const testEnvironment = createTestEnvironment(organization, 'staging');

    // Configure chaos network conditions
    testEnvironment.networkSimulator.setNetworkCondition('chaos_network');

    return await this.executeScenarioSet(
      organization,
      scenarios,
      testEnvironment,
      { enableChaos: true, enablePerformanceMonitoring: true }
    );
  }

  private async initializeBrowserSessions(): Promise<void> {
    for (const organization of this.config.organizations) {
      const pages: Page[] = [];
      const validationUtilsList: DeploymentValidationUtils[] = [];

      for (let i = 0; i < this.config.parallelSessions; i++) {
        const page = await this.config.browser.newPage();
        const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
        const orgPath = organization === 'arcade' ? '/arcade' : '/enterprise';

        await page.goto(`${baseUrl}${orgPath}`);
        pages.push(page);

        const validationUtils = new DeploymentValidationUtils(page, organization);
        validationUtilsList.push(validationUtils);
      }

      this.pages.set(organization, pages);
      this.validationUtils.set(organization, validationUtilsList);
    }
  }

  private async executeOrganizationTests(organization: 'arcade' | 'enterprise'): Promise<OrganizationTestResult> {
    const result: OrganizationTestResult = {
      organization,
      scenarios: new Map(),
      validationResults: new Map(),
      complianceResults: null,
      metrics: {
        totalScenarios: 0,
        successfulScenarios: 0,
        averageScore: 0,
        averageDeploymentTime: 0,
        averageRollbackTime: 0,
        slaCompliance: 0
      },
      status: 'passed'
    };

    try {
      // Execute test suites based on configuration
      for (const suiteType of this.config.testSuites) {
        console.log(`  📊 Executing ${suiteType} tests for ${organization}`);

        switch (suiteType) {
          case 'smoke':
            await this.executeSmokeTestSuite(organization, result);
            break;
          case 'integration':
            await this.executeIntegrationTestSuite(organization, result);
            break;
          case 'performance':
            await this.executePerformanceTestSuite(organization, result);
            break;
          case 'chaos':
            await this.executeChaosTestSuite(organization, result);
            break;
          case 'compliance':
            await this.executeComplianceTestSuite(organization, result);
            break;
          case 'full':
            await this.executeFullTestSuite(organization, result);
            break;
        }
      }

      // Calculate organization metrics
      this.calculateOrganizationMetrics(result);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown organization testing error';
      console.error(`❌ Organization testing failed for ${organization}:`, errorMessage);
      result.status = 'failed';
    }

    return result;
  }

  private async executeScenarioSet(
    organization: 'arcade' | 'enterprise',
    scenarios: DeploymentScenario[],
    testEnvironment: any,
    options: { enableChaos: boolean; enablePerformanceMonitoring: boolean }
  ): Promise<OrganizationTestResult> {
    const result: OrganizationTestResult = {
      organization,
      scenarios: new Map(),
      validationResults: new Map(),
      complianceResults: null,
      metrics: {
        totalScenarios: scenarios.length,
        successfulScenarios: 0,
        averageScore: 0,
        averageDeploymentTime: 0,
        averageRollbackTime: 0,
        slaCompliance: 0
      },
      status: 'passed'
    };

    const pages = this.pages.get(organization) || [];
    const validationUtilsList = this.validationUtils.get(organization) || [];

    // Create pipeline configuration
    const pipelineConfig: PipelineConfig = {
      browser: this.config.browser,
      environment: 'staging',
      organization,
      parallelDeployments: Math.min(this.config.parallelSessions, scenarios.length),
      timeoutMs: this.config.maxExecutionTime / scenarios.length,
      retryAttempts: 2,
      enableChaosTestingipt: options.enableChaos,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring,
      enableRollbackTesting: true
    };

    const pipeline = new DeploymentTestPipeline(pipelineConfig, testEnvironment.mockEnvironment);

    // Execute scenarios
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const page = pages[i % pages.length];
      const validationUtils = validationUtilsList[i % validationUtilsList.length];

      console.log(`    🎯 Executing scenario: ${scenario.name}`);

      try {
        // Execute pipeline for scenario
        const pipelineExecution = await pipeline.execute(scenario);
        result.scenarios.set(scenario.name, pipelineExecution);

        // Perform additional validation
        await this.performAdditionalValidation(scenario, page, validationUtils, result);

        if (pipelineExecution.summary.overallSuccess) {
          result.metrics.successfulScenarios++;
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown scenario error';
        console.error(`    ❌ Scenario failed: ${scenario.name}`, errorMessage);
        result.status = 'partial';
      }
    }

    this.calculateOrganizationMetrics(result);
    return result;
  }

  private async performAdditionalValidation(
    scenario: DeploymentScenario,
    page: Page,
    validationUtils: DeploymentValidationUtils,
    result: OrganizationTestResult
  ): Promise<void> {
    try {
      // SLA compliance validation
      await ValidationUtils.assertSLACompliance(validationUtils);

      // Health compliance validation
      await ValidationUtils.assertHealthCompliance(validationUtils);

      // Organization-specific compliance
      await ValidationUtils.assertOrganizationCompliance(validationUtils, result.organization);

      // Cost estimation validation
      for (const config of scenario.configs) {
        const expectedCost = scenario.expectedBehavior.costRange.min;
        const costValid = await validationUtils.validateCostEstimation(expectedCost);

        if (!costValid) {
          console.warn(`    ⚠️ Cost estimation validation failed for ${config.modelId}`);
        }
      }

      result.validationResults.set(scenario.name, { status: 'passed' });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown validation error';
      console.error(`    ❌ Additional validation failed for ${scenario.name}:`, errorMessage);
      result.validationResults.set(scenario.name, { status: 'failed', error: errorMessage });
    }
  }

  private async executeSmokeTestSuite(organization: 'arcade' | 'enterprise', result: OrganizationTestResult): Promise<void> {
    const scenarios = this.getScenariosByComplexity(organization, 'simple').slice(0, 1);
    const testEnvironment = createTestEnvironment(organization, 'development');

    const suiteResult = await this.executeScenarioSet(organization, scenarios, testEnvironment, {
      enableChaos: false,
      enablePerformanceMonitoring: false
    });

    // Merge results
    this.mergeOrganizationResults(result, suiteResult);
  }

  private async executeIntegrationTestSuite(organization: 'arcade' | 'enterprise', result: OrganizationTestResult): Promise<void> {
    const scenarios = this.getScenariosByComplexity(organization, 'medium');
    const testEnvironment = createTestEnvironment(organization, 'staging');

    const suiteResult = await this.executeScenarioSet(organization, scenarios, testEnvironment, {
      enableChaos: false,
      enablePerformanceMonitoring: true
    });

    this.mergeOrganizationResults(result, suiteResult);
  }

  private async executePerformanceTestSuite(organization: 'arcade' | 'enterprise', result: OrganizationTestResult): Promise<void> {
    const scenarios = this.getScenariosByComplexity(organization, 'complex');
    const testEnvironment = createTestEnvironment(organization, 'production');

    const suiteResult = await this.executeScenarioSet(organization, scenarios, testEnvironment, {
      enableChaos: false,
      enablePerformanceMonitoring: true
    });

    this.mergeOrganizationResults(result, suiteResult);
  }

  private async executeChaosTestSuite(organization: 'arcade' | 'enterprise', result: OrganizationTestResult): Promise<void> {
    const scenarios = this.getScenariosByComplexity(organization, 'medium').slice(0, 2);
    const testEnvironment = createTestEnvironment(organization, 'staging');

    // Configure chaos conditions
    testEnvironment.networkSimulator.setNetworkCondition('chaos_network');
    testEnvironment.mockEnvironment.setScenario('degraded');

    const suiteResult = await this.executeScenarioSet(organization, scenarios, testEnvironment, {
      enableChaos: true,
      enablePerformanceMonitoring: true
    });

    this.mergeOrganizationResults(result, suiteResult);
  }

  private async executeComplianceTestSuite(organization: 'arcade' | 'enterprise', result: OrganizationTestResult): Promise<void> {
    // Focus on compliance validation rather than deployment testing
    const validationUtilsList = this.validationUtils.get(organization) || [];

    if (validationUtilsList.length > 0) {
      const validationUtils = validationUtilsList[0];
      const complianceResult = await validationUtils.validateCompliance();
      result.complianceResults = complianceResult;
    }
  }

  private async executeFullTestSuite(organization: 'arcade' | 'enterprise', result: OrganizationTestResult): Promise<void> {
    // Execute all test types in sequence
    await this.executeSmokeTestSuite(organization, result);
    await this.executeIntegrationTestSuite(organization, result);
    await this.executePerformanceTestSuite(organization, result);
    await this.executeChaosTestSuite(organization, result);
    await this.executeComplianceTestSuite(organization, result);
  }

  private calculateOrganizationMetrics(result: OrganizationTestResult): void {
    const executions = Array.from(result.scenarios.values());

    if (executions.length === 0) return;

    result.metrics.totalScenarios = executions.length;
    result.metrics.successfulScenarios = executions.filter(e => e.summary.overallSuccess).length;
    result.metrics.averageScore = executions.reduce((sum, e) => sum + e.summary.scorecard.overall, 0) / executions.length;
    result.metrics.averageDeploymentTime = executions.reduce((sum, e) => sum + e.metrics.deploymentTime, 0) / executions.length;

    const rollbackTimes = executions.filter(e => e.metrics.rollbackTime).map(e => e.metrics.rollbackTime!);
    result.metrics.averageRollbackTime = rollbackTimes.length > 0 ? rollbackTimes.reduce((sum, t) => sum + t, 0) / rollbackTimes.length : 0;

    // SLA compliance: deployment < 60s, rollback < 30s
    const slaCompliantExecutions = executions.filter(e =>
      e.metrics.deploymentTime < 60000 &&
      (!e.metrics.rollbackTime || e.metrics.rollbackTime < 30000)
    );
    result.metrics.slaCompliance = (slaCompliantExecutions.length / executions.length) * 100;

    // Determine overall status
    if (result.metrics.successfulScenarios === result.metrics.totalScenarios) {
      result.status = 'passed';
    } else if (result.metrics.successfulScenarios > 0) {
      result.status = 'partial';
    } else {
      result.status = 'failed';
    }
  }

  private async calculateOverallResults(): Promise<void> {
    const orgResults = Array.from(this.currentExecution!.results.organizationResults.values());
    const allExecutions = orgResults.flatMap(org => Array.from(org.scenarios.values()));

    const metrics = this.currentExecution!.results.overallMetrics;
    metrics.totalExecutions = allExecutions.length;
    metrics.successfulExecutions = allExecutions.filter(e => e.summary.overallSuccess).length;
    metrics.successRate = metrics.totalExecutions > 0 ? (metrics.successfulExecutions / metrics.totalExecutions) * 100 : 0;
    metrics.averagePerformanceScore = allExecutions.length > 0 ?
      allExecutions.reduce((sum, e) => sum + e.summary.scorecard.overall, 0) / allExecutions.length : 0;

    // Calculate SLA compliance
    const slaCompliantExecutions = allExecutions.filter(e =>
      e.metrics.deploymentTime < 60000 &&
      (!e.metrics.rollbackTime || e.metrics.rollbackTime < 30000)
    );
    metrics.slaCompliance = allExecutions.length > 0 ? (slaCompliantExecutions.length / allExecutions.length) * 100 : 0;

    // Collect critical issues and recommendations
    allExecutions.forEach(execution => {
      metrics.criticalIssues.push(...execution.summary.criticalIssues);
      metrics.recommendations.push(...execution.summary.recommendations);
    });

    // Remove duplicates
    metrics.criticalIssues = [...new Set(metrics.criticalIssues)];
    metrics.recommendations = [...new Set(metrics.recommendations)];

    // Calculate summary grades and status
    this.calculateExecutionSummary();
  }

  private calculateExecutionSummary(): void {
    const summary = this.currentExecution!.results.summary;
    const metrics = this.currentExecution!.results.overallMetrics;

    // Performance grade
    if (metrics.averagePerformanceScore >= 90) summary.performanceGrade = 'A';
    else if (metrics.averagePerformanceScore >= 80) summary.performanceGrade = 'B';
    else if (metrics.averagePerformanceScore >= 70) summary.performanceGrade = 'C';
    else if (metrics.averagePerformanceScore >= 60) summary.performanceGrade = 'D';
    else summary.performanceGrade = 'F';

    // Compliance grade (based on organization results)
    const orgResults = Array.from(this.currentExecution!.results.organizationResults.values());
    const complianceScores = orgResults
      .filter(org => org.complianceResults)
      .map(org => org.complianceResults.score);

    const avgComplianceScore = complianceScores.length > 0 ?
      complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length : 0;

    if (avgComplianceScore >= 90) summary.complianceGrade = 'A';
    else if (avgComplianceScore >= 80) summary.complianceGrade = 'B';
    else if (avgComplianceScore >= 70) summary.complianceGrade = 'C';
    else if (avgComplianceScore >= 60) summary.complianceGrade = 'D';
    else summary.complianceGrade = 'F';

    // Reliability grade (based on SLA compliance)
    if (metrics.slaCompliance >= 95) summary.reliabilityGrade = 'A';
    else if (metrics.slaCompliance >= 90) summary.reliabilityGrade = 'B';
    else if (metrics.slaCompliance >= 80) summary.reliabilityGrade = 'C';
    else if (metrics.slaCompliance >= 70) summary.reliabilityGrade = 'D';
    else summary.reliabilityGrade = 'F';

    // Overall success determination
    summary.overallSuccess =
      metrics.successRate >= 90 &&
      summary.performanceGrade !== 'F' &&
      summary.complianceGrade !== 'F' &&
      summary.reliabilityGrade !== 'F' &&
      metrics.criticalIssues.length === 0;

    // Production readiness
    summary.readyForProduction =
      summary.overallSuccess &&
      metrics.slaCompliance >= 95 &&
      summary.performanceGrade !== 'D' && summary.performanceGrade !== 'F' &&
      summary.complianceGrade !== 'D' && summary.complianceGrade !== 'F';

    // Critical blockers
    summary.criticalBlockers = metrics.criticalIssues.filter(issue =>
      issue.toLowerCase().includes('critical') ||
      issue.toLowerCase().includes('blocker') ||
      issue.toLowerCase().includes('sla')
    );

    // Next steps recommendations
    if (!summary.readyForProduction) {
      if (summary.performanceGrade === 'D' || summary.performanceGrade === 'F') {
        summary.nextSteps.push('Address performance issues before production deployment');
      }
      if (summary.complianceGrade === 'D' || summary.complianceGrade === 'F') {
        summary.nextSteps.push('Resolve compliance violations before production deployment');
      }
      if (metrics.slaCompliance < 95) {
        summary.nextSteps.push('Improve SLA compliance to meet production requirements');
      }
    } else {
      summary.nextSteps.push('System is ready for production deployment');
      summary.nextSteps.push('Consider implementing monitoring and alerting for production');
    }
  }

  private async generateReports(): Promise<void> {
    const execution = this.currentExecution!;

    // Executive Report
    execution.reports.executive = this.generateExecutiveReport();

    // Technical Report
    execution.reports.technical = this.generateTechnicalReport();

    // Compliance Report
    execution.reports.compliance = this.generateComplianceReport();
  }

  private generateExecutiveReport(): string {
    const execution = this.currentExecution!;
    const metrics = execution.results.overallMetrics;
    const summary = execution.results.summary;

    return [
      `# Executive Summary - Dual-Domain Marketplace Testing`,
      `**Execution ID:** ${execution.executionId}`,
      `**Date:** ${execution.startTime.toISOString().split('T')[0]}`,
      `**Duration:** ${Math.round(execution.totalDuration / 60000)} minutes`,
      ``,
      `## Overall Results`,
      `- **Success Rate:** ${metrics.successRate.toFixed(1)}%`,
      `- **Production Ready:** ${summary.readyForProduction ? '✅ YES' : '❌ NO'}`,
      `- **Performance Grade:** ${summary.performanceGrade}`,
      `- **Compliance Grade:** ${summary.complianceGrade}`,
      `- **Reliability Grade:** ${summary.reliabilityGrade}`,
      ``,
      `## Key Metrics`,
      `- Total Test Executions: ${metrics.totalExecutions}`,
      `- Successful Executions: ${metrics.successfulExecutions}`,
      `- SLA Compliance: ${metrics.slaCompliance.toFixed(1)}%`,
      `- Average Performance Score: ${metrics.averagePerformanceScore.toFixed(1)}/100`,
      ``,
      summary.criticalBlockers.length > 0 ? [
        `## Critical Issues Requiring Immediate Attention`,
        summary.criticalBlockers.map(issue => `- 🚨 ${issue}`).join('\n'),
        ``
      ].join('\n') : '',
      `## Recommendations`,
      summary.nextSteps.map(step => `- ${step}`).join('\n'),
      ``,
      `## Organization Performance`,
      Array.from(execution.results.organizationResults.entries()).map(([org, result]) =>
        `- **${org}**: ${result.status} (${result.metrics.successfulScenarios}/${result.metrics.totalScenarios} scenarios passed)`
      ).join('\n')
    ].filter(line => line !== '').join('\n');
  }

  private generateTechnicalReport(): string {
    const execution = this.currentExecution!;
    const metrics = execution.results.overallMetrics;

    return [
      `# Technical Report - Dual-Domain Marketplace Testing`,
      `**Execution ID:** ${execution.executionId}`,
      `**Configuration:** ${execution.config.testSuites.join(', ')} test suites`,
      `**Organizations:** ${execution.config.organizations.join(', ')}`,
      `**Parallel Sessions:** ${execution.config.parallelSessions}`,
      ``,
      `## Detailed Results by Organization`,
      Array.from(execution.results.organizationResults.entries()).map(([org, result]) => [
        `### ${org.toUpperCase()}`,
        `- Status: ${result.status}`,
        `- Scenarios: ${result.metrics.totalScenarios}`,
        `- Success Rate: ${((result.metrics.successfulScenarios / result.metrics.totalScenarios) * 100).toFixed(1)}%`,
        `- Average Score: ${result.metrics.averageScore.toFixed(1)}/100`,
        `- Average Deployment Time: ${result.metrics.averageDeploymentTime.toFixed(0)}ms`,
        `- Average Rollback Time: ${result.metrics.averageRollbackTime.toFixed(0)}ms`,
        `- SLA Compliance: ${result.metrics.slaCompliance.toFixed(1)}%`,
        ``,
        `#### Scenario Results`,
        Array.from(result.scenarios.entries()).map(([name, exec]) =>
          `- **${name}**: ${exec.summary.overallSuccess ? '✅' : '❌'} (Score: ${exec.summary.scorecard.overall}/100)`
        ).join('\n'),
        ``
      ].join('\n')).join('\n'),
      `## Performance Analysis`,
      `- Resource Efficiency: CPU ${metrics.resourceEfficiency.cpu}%, GPU ${metrics.resourceEfficiency.gpu}%, Memory ${metrics.resourceEfficiency.memory}%`,
      `- Estimated Monthly Cost: $${metrics.costOptimization.estimatedMonthlyCost}`,
      ``,
      `## Recommendations`,
      metrics.recommendations.slice(0, 10).map(rec => `- ${rec}`).join('\n')
    ].filter(line => line !== '').join('\n');
  }

  private generateComplianceReport(): string {
    const execution = this.currentExecution!;
    const orgResults = Array.from(execution.results.organizationResults.values());

    return [
      `# Compliance Report - Dual-Domain Marketplace Testing`,
      `**Execution ID:** ${execution.executionId}`,
      `**Overall Compliance Grade:** ${execution.results.summary.complianceGrade}`,
      ``,
      orgResults.map(result => {
        if (!result.complianceResults) return '';

        return [
          `## ${result.organization.toUpperCase()} Compliance`,
          `- **Overall Compliant:** ${result.complianceResults.compliant ? '✅' : '❌'}`,
          `- **Compliance Score:** ${result.complianceResults.score}/100`,
          ``,
          result.complianceResults.violations.length > 0 ? [
            `### Violations`,
            result.complianceResults.violations.map((v: any) =>
              `- **${v.severity.toUpperCase()}**: ${v.description}`
            ).join('\n'),
            ``
          ].join('\n') : '',
          `### Requirements Status`,
          result.complianceResults.requirements.map((req: any) =>
            `- **${req.name}**: ${req.status === 'met' ? '✅' : '❌'} ${req.details}`
          ).join('\n'),
          ``
        ].join('\n');
      }).join('\n')
    ].filter(line => line !== '').join('\n');
  }

  private getScenariosByComplexity(
    organization: 'arcade' | 'enterprise',
    complexity: 'simple' | 'medium' | 'complex'
  ): DeploymentScenario[] {
    const scenarios = organization === 'arcade' ? arcadeScenarios : enterpriseScenarios;
    return scenarios.filter(s => s.complexity === complexity);
  }

  private mergeOrganizationResults(target: OrganizationTestResult, source: OrganizationTestResult): void {
    // Merge scenarios
    source.scenarios.forEach((value, key) => {
      target.scenarios.set(key, value);
    });

    // Merge validation results
    source.validationResults.forEach((value, key) => {
      target.validationResults.set(key, value);
    });

    // Update metrics
    target.metrics.totalScenarios += source.metrics.totalScenarios;
    target.metrics.successfulScenarios += source.metrics.successfulScenarios;

    // Recalculate aggregated metrics
    this.calculateOrganizationMetrics(target);
  }

  private async cleanup(): Promise<void> {
    // Close all pages
    for (const pages of this.pages.values()) {
      await Promise.all(pages.map(page => page.close().catch(() => {})));
    }
    this.pages.clear();
    this.validationUtils.clear();
  }

  private initializeOverallMetrics(): OverallMetrics {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      successRate: 0,
      averagePerformanceScore: 0,
      slaCompliance: 0,
      criticalIssues: [],
      recommendations: [],
      resourceEfficiency: { cpu: 0, gpu: 0, memory: 0 },
      costOptimization: { estimatedMonthlyCost: 0, savingsOpportunities: [] }
    };
  }

  private initializeExecutionSummary(): ExecutionSummary {
    return {
      overallSuccess: false,
      readyForProduction: false,
      criticalBlockers: [],
      performanceGrade: 'F',
      complianceGrade: 'F',
      reliabilityGrade: 'F',
      nextSteps: []
    };
  }

  /**
   * Get current execution status
   */
  /**
   * Run comprehensive tests with simplified interface for TestCoordinator
   */
  async runComprehensiveTests(config: TestOrchestratorConfig): Promise<TestResults> {
    // Update internal config from the provided config
    this.config = {
      browser: config.browser,
      parallelSessions: config.parallelSessions || 3,
      organizations: config.organizations || ['arcade', 'enterprise'],
      environments: config.environments || ['development'],
      testSuites: (config.testSuites || ['smoke']) as TestSuiteType[],
      enableChaosMode: config.enableChaosMode || false,
      enableNetworkSimulation: config.enableNetworkSimulation || true,
      enableComplianceValidation: config.enableComplianceValidation || true,
      maxExecutionTime: config.maxExecutionTime || 600000,
      reportingLevel: config.reportingLevel || 'standard'
    };

    try {
      // Execute comprehensive testing
      const orchestrationResult = await this.execute();
      
      // Convert OrchestrationResult to TestResults format expected by TestCoordinator
      const testResults: TestResults = {
        grade: this.mapGradeToSimpleGrade(orchestrationResult.results.summary.performanceGrade),
        score: orchestrationResult.results.overallMetrics.averagePerformanceScore,
        breakdown: {
          performance: orchestrationResult.results.summary.performanceGrade,
          compliance: orchestrationResult.results.summary.complianceGrade,
          reliability: orchestrationResult.results.summary.reliabilityGrade,
          successRate: orchestrationResult.results.overallMetrics.successRate,
          slaCompliance: orchestrationResult.results.overallMetrics.slaCompliance,
          organizationResults: Object.fromEntries(orchestrationResult.results.organizationResults.entries())
        },
        recommendations: [
          ...orchestrationResult.results.summary.nextSteps,
          ...orchestrationResult.results.overallMetrics.recommendations.slice(0, 5) // Limit recommendations
        ]
      };

      return testResults;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error during comprehensive testing';
      console.error('❌ Comprehensive testing failed:', errorMessage);
      
      // Return failed test results
      return {
        grade: 'F',
        score: 0,
        breakdown: {
          error: errorMessage,
          performance: 'F',
          compliance: 'F',
          reliability: 'F'
        },
        recommendations: [
          'Fix critical issues before retrying comprehensive tests',
          `Address error: ${errorMessage}`
        ]
      };
    }
  }

  /**
   * Map orchestration grade to simple grade format
   */
  private mapGradeToSimpleGrade(grade: 'A' | 'B' | 'C' | 'D' | 'F'): 'A' | 'B' | 'C' | 'D' | 'F' {
    return grade;
  }

  getCurrentExecution(): OrchestrationResult | null {
    return this.currentExecution;
  }

  /**
   * Cancel ongoing execution
   */
  async cancel(): Promise<void> {
    if (this.currentExecution && this.currentExecution.status === 'completed') {
      return; // Already completed
    }

    if (this.currentExecution) {
      this.currentExecution.status = 'cancelled';
      this.currentExecution.results.summary.criticalBlockers.push('Execution was cancelled by user');
    }

    await this.cleanup();
  }
}

/**
 * Factory function to create orchestrator with common configurations
 */
export function createTestOrchestrator(
  browser: Browser,
  scope: 'smoke' | 'full' | 'performance' | 'production-ready' = 'smoke'
): TestOrchestrator {
  const baseConfig: OrchestrationConfig = {
    browser,
    parallelSessions: 3,
    organizations: ['arcade', 'enterprise'],
    environments: ['development'],
    testSuites: ['smoke'],
    enableChaosMode: false,
    enableNetworkSimulation: true,
    enableComplianceValidation: true,
    maxExecutionTime: 600000, // 10 minutes
    reportingLevel: 'standard'
  };

  switch (scope) {
    case 'smoke':
      return new TestOrchestrator(baseConfig);

    case 'full':
      return new TestOrchestrator({
        ...baseConfig,
        testSuites: ['smoke', 'integration', 'compliance'],
        environments: ['development', 'staging'],
        maxExecutionTime: 1800000, // 30 minutes
        reportingLevel: 'detailed'
      });

    case 'performance':
      return new TestOrchestrator({
        ...baseConfig,
        testSuites: ['performance', 'chaos'],
        environments: ['staging', 'production'],
        parallelSessions: 5,
        enableChaosMode: true,
        maxExecutionTime: 2400000, // 40 minutes
        reportingLevel: 'detailed'
      });

    case 'production-ready':
      return new TestOrchestrator({
        ...baseConfig,
        testSuites: ['full'],
        environments: ['development', 'staging', 'production'],
        parallelSessions: 8,
        enableChaosMode: true,
        maxExecutionTime: 3600000, // 60 minutes
        reportingLevel: 'detailed'
      });

    default:
      return new TestOrchestrator(baseConfig);
  }
}