/**
 * Latency Monitoring E2E Tests
 * Measures and validates response times across the deployment pipeline
 * Monitors performance degradation and ensures SLA compliance
 */

import { test, expect } from '@playwright/test';
import { DeploymentPage } from '../page-objects/DeploymentPage';
import { MarketplacePage } from '../page-objects/MarketplacePage';
import { TestApiClient } from '../utils/TestApiClient';

interface LatencyMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  organization?: string;
  metadata?: any;
}

test.describe('Latency Monitoring - Response Time Validation', () => {
  let apiClient: TestApiClient;
  let latencyMetrics: LatencyMetrics[] = [];

  test.beforeEach(async ({ page }) => {
    apiClient = new TestApiClient(page, { mode: 'mock' });
    await apiClient.setupMockHuggingFaceApi();
    await apiClient.setupMockRunPodApi();
    latencyMetrics = [];
  });

  test.afterEach(async () => {
    await apiClient.cleanup();

    // Log latency metrics for analysis
    if (latencyMetrics.length > 0) {
      console.log('\n=== Latency Metrics ===');
      latencyMetrics.forEach(metric => {
        console.log(`${metric.operation}: ${metric.duration}ms (${metric.success ? 'SUCCESS' : 'FAILED'})`);
      });

      const avgLatency = latencyMetrics
        .filter(m => m.success)
        .reduce((sum, m) => sum + m.duration, 0) / latencyMetrics.filter(m => m.success).length;
      console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
    }
  });

  /**
   * Helper function to measure operation latency
   */
  async function measureLatency<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let success = true;

    try {
      result = await fn();
    } catch (error: unknown) {
      success = false;
      throw error;
    } finally {
      const endTime = Date.now();
      latencyMetrics.push({
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        success,
        metadata
      });
    }

    return result!;
  }

  test.describe('Page Load Latency', () => {
    test('should load marketplace page within performance thresholds', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);

      // Measure initial page load
      const loadTime = await measureLatency('marketplace_page_load', async () => {
        await marketplacePage.goto();
        await marketplacePage.expectPageLoaded();
        return true;
      });

      expect(loadTime).toBe(true);

      // Validate load time is under threshold
      const loadLatency = latencyMetrics.find(m => m.operation === 'marketplace_page_load');
      expect(loadLatency?.duration).toBeLessThan(3000); // Under 3 seconds
    });

    test('should load deployment page quickly', async ({ page }) => {
      const deploymentPage = new DeploymentPage(page);

      const loadTime = await measureLatency('deployment_page_load', async () => {
        await deploymentPage.goto();
        await deploymentPage.expectDeploymentForm();
        return true;
      });

      expect(loadTime).toBe(true);

      const loadLatency = latencyMetrics.find(m => m.operation === 'deployment_page_load');
      expect(loadLatency?.duration).toBeLessThan(2500); // Under 2.5 seconds
    });

    test('should switch between organizations quickly', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      await marketplacePage.goto();

      // Measure AI Dev Cockpit switch
      await measureLatency('switch_to_arcade', async () => {
        await marketplacePage.selectOrganization('arcade');
        await marketplacePage.expectAI Dev CockpitTheme();
      });

      // Measure ScientiaCapital switch
      await measureLatency('switch_to_scientia', async () => {
        await marketplacePage.selectOrganization('enterprise');
        await marketplacePage.expectScientiaCapitalTheme();
      });

      // Both switches should be fast
      const arcadeSwitch = latencyMetrics.find(m => m.operation === 'switch_to_arcade');
      const scientiaSwitch = latencyMetrics.find(m => m.operation === 'switch_to_scientia');

      expect(arcadeSwitch?.duration).toBeLessThan(1500); // Under 1.5 seconds
      expect(scientiaSwitch?.duration).toBeLessThan(1500); // Under 1.5 seconds
    });
  });

  test.describe('Model Discovery Latency', () => {
    test('should search models within acceptable time', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      // Measure search latency
      await measureLatency('model_search', async () => {
        await marketplacePage.searchModels('gaming');
        await marketplacePage.expectSearchResults();
      });

      // Measure model selection latency
      await measureLatency('model_selection', async () => {
        const modelId = await marketplacePage.selectFirstModel();
        expect(modelId).toBeTruthy();
        return modelId;
      });

      const searchLatency = latencyMetrics.find(m => m.operation === 'model_search');
      const selectionLatency = latencyMetrics.find(m => m.operation === 'model_selection');

      expect(searchLatency?.duration).toBeLessThan(2000); // Under 2 seconds
      expect(selectionLatency?.duration).toBeLessThan(800); // Under 800ms
    });

    test('should load model details quickly', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');

      await marketplacePage.searchModels('financial');
      const modelId = await marketplacePage.selectFirstModel();

      // Measure model details loading
      await measureLatency('model_details_load', async () => {
        await marketplacePage.expectModelDetails(modelId);
      });

      const detailsLatency = latencyMetrics.find(m => m.operation === 'model_details_load');
      expect(detailsLatency?.duration).toBeLessThan(1200); // Under 1.2 seconds
    });

    test('should handle rapid successive searches efficiently', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      const searchTerms = ['gaming', 'chat', 'assistant', 'terminal', 'code'];
      const searchLatencies: number[] = [];

      for (const term of searchTerms) {
        await measureLatency(`rapid_search_${term}`, async () => {
          await marketplacePage.searchModels(term);
          await marketplacePage.expectSearchResults();
        }, { searchTerm: term });

        const latency = latencyMetrics[latencyMetrics.length - 1];
        searchLatencies.push(latency.duration);
      }

      // Search performance should not degrade significantly
      const avgLatency = searchLatencies.reduce((sum, lat) => sum + lat, 0) / searchLatencies.length;
      const maxLatency = Math.max(...searchLatencies);

      expect(avgLatency).toBeLessThan(1800); // Average under 1.8 seconds
      expect(maxLatency).toBeLessThan(2500); // No single search over 2.5 seconds

      // Performance should be consistent (max shouldn't be more than 2x average)
      expect(maxLatency).toBeLessThan(avgLatency * 2);
    });
  });

  test.describe('Deployment Operation Latency', () => {
    test('should create deployment within SLA timeframes', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      const deploymentPage = new DeploymentPage(page);

      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      // Measure deployment configuration
      await measureLatency('deployment_configuration', async () => {
        await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
        await deploymentPage.setInstanceCount(1);
        await deploymentPage.expectCostEstimation();
      });

      // Measure deployment creation initiation
      let deploymentId: string = '';
      await measureLatency('deployment_creation_request', async () => {
        await deploymentPage.createDeployment();
        await deploymentPage.expectDeploymentCreating();
        deploymentId = await deploymentPage.getDeploymentId();
      });

      // Measure time to deployment ready
      await measureLatency('deployment_ready_wait', async () => {
        await deploymentPage.waitForDeploymentReady(30000);
        await deploymentPage.expectDeploymentRunning();
      });

      const configLatency = latencyMetrics.find(m => m.operation === 'deployment_configuration');
      const creationLatency = latencyMetrics.find(m => m.operation === 'deployment_creation_request');
      const readyLatency = latencyMetrics.find(m => m.operation === 'deployment_ready_wait');

      expect(configLatency?.duration).toBeLessThan(3000); // Under 3 seconds
      expect(creationLatency?.duration).toBeLessThan(5000); // Under 5 seconds
      expect(readyLatency?.duration).toBeLessThan(25000); // Under 25 seconds

      // Cleanup
      await deploymentPage.stopDeployment(deploymentId);
    });

    test('should monitor deployment metrics quickly', async ({ page }) => {
      const deploymentPage = new DeploymentPage(page);
      await deploymentPage.goto();

      // Mock existing deployment
      const testDeploymentId = 'test-deployment-latency';

      // Measure metrics loading
      await measureLatency('metrics_load', async () => {
        await deploymentPage.expectMetricsPanel(testDeploymentId);
      });

      // Measure performance metrics retrieval
      await measureLatency('performance_metrics_fetch', async () => {
        const metrics = await deploymentPage.getPerformanceMetrics();
        expect(metrics).toBeDefined();
        return metrics;
      });

      // Measure cost tracking data
      await measureLatency('cost_tracking_fetch', async () => {
        await deploymentPage.expectCostTracking(testDeploymentId);
      });

      const metricsLatency = latencyMetrics.find(m => m.operation === 'metrics_load');
      const performanceLatency = latencyMetrics.find(m => m.operation === 'performance_metrics_fetch');
      const costLatency = latencyMetrics.find(m => m.operation === 'cost_tracking_fetch');

      expect(metricsLatency?.duration).toBeLessThan(1500); // Under 1.5 seconds
      expect(performanceLatency?.duration).toBeLessThan(1000); // Under 1 second
      expect(costLatency?.duration).toBeLessThan(800); // Under 800ms
    });

    test('should handle deployment actions with low latency', async ({ page }) => {
      const deploymentPage = new DeploymentPage(page);
      await deploymentPage.goto();

      const testDeploymentId = 'test-deployment-actions';

      // Measure stop deployment
      await measureLatency('deployment_stop', async () => {
        await deploymentPage.stopDeployment(testDeploymentId);
      });

      // Measure restart deployment
      await measureLatency('deployment_restart', async () => {
        await deploymentPage.restartDeployment(testDeploymentId);
      });

      const stopLatency = latencyMetrics.find(m => m.operation === 'deployment_stop');
      const restartLatency = latencyMetrics.find(m => m.operation === 'deployment_restart');

      expect(stopLatency?.duration).toBeLessThan(3000); // Under 3 seconds
      expect(restartLatency?.duration).toBeLessThan(4000); // Under 4 seconds
    });
  });

  test.describe('Rollback Operation Latency', () => {
    test('should execute rollback within 30-second SLA', async ({ page }) => {
      const deploymentPage = new DeploymentPage(page);
      await deploymentPage.goto();

      const testDeploymentId = 'test-deployment-rollback';

      // Measure snapshot creation
      await measureLatency('snapshot_creation', async () => {
        await deploymentPage.createSnapshot('pre-test-snapshot');
        await deploymentPage.expectSnapshotCreated();
      });

      // Measure rollback plan creation
      await measureLatency('rollback_plan_creation', async () => {
        await deploymentPage.createRollbackPlan();
        await deploymentPage.expectRollbackPlan();
      });

      // Measure rollback execution (critical SLA)
      await measureLatency('rollback_execution', async () => {
        await deploymentPage.executeRollback();
        await deploymentPage.waitForRollbackComplete();
      });

      const snapshotLatency = latencyMetrics.find(m => m.operation === 'snapshot_creation');
      const planLatency = latencyMetrics.find(m => m.operation === 'rollback_plan_creation');
      const executionLatency = latencyMetrics.find(m => m.operation === 'rollback_execution');

      expect(snapshotLatency?.duration).toBeLessThan(5000); // Under 5 seconds
      expect(planLatency?.duration).toBeLessThan(3000); // Under 3 seconds
      expect(executionLatency?.duration).toBeLessThan(30000); // CRITICAL: Under 30 seconds SLA
    });

    test('should validate rollback safety checks quickly', async ({ page }) => {
      const deploymentPage = new DeploymentPage(page);
      await deploymentPage.goto();

      // Measure pre-rollback checks
      await measureLatency('pre_rollback_checks', async () => {
        await deploymentPage.executePreRollbackChecks('plan_001');
        await deploymentPage.expectPreCheckResults();
      });

      // Measure rollback safety validation
      await measureLatency('rollback_safety_validation', async () => {
        await deploymentPage.validateRollbackSafety('plan_001');
      });

      const checksLatency = latencyMetrics.find(m => m.operation === 'pre_rollback_checks');
      const safetyLatency = latencyMetrics.find(m => m.operation === 'rollback_safety_validation');

      expect(checksLatency?.duration).toBeLessThan(8000); // Under 8 seconds
      expect(safetyLatency?.duration).toBeLessThan(2000); // Under 2 seconds
    });
  });

  test.describe('Organization-Specific Latency Requirements', () => {
    test('should meet AI Dev Cockpit gaming performance requirements', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      const deploymentPage = new DeploymentPage(page);

      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      // Gaming users expect responsive interfaces
      await measureLatency('gaming_model_search', async () => {
        await marketplacePage.searchModels('gaming');
        await marketplacePage.expectSearchResults();
      });

      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      await measureLatency('gaming_deployment_config', async () => {
        await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
        await deploymentPage.expectTerminalTheme();
      });

      const searchLatency = latencyMetrics.find(m => m.operation === 'gaming_model_search');
      const configLatency = latencyMetrics.find(m => m.operation === 'gaming_deployment_config');

      // Gaming users expect snappy responses
      expect(searchLatency?.duration).toBeLessThan(1500); // Under 1.5 seconds
      expect(configLatency?.duration).toBeLessThan(1000); // Under 1 second
    });

    test('should meet ScientiaCapital enterprise SLA requirements', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      const deploymentPage = new DeploymentPage(page);

      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');

      // Enterprise users expect reliable, consistent performance
      await measureLatency('enterprise_model_search', async () => {
        await marketplacePage.searchModels('financial');
        await marketplacePage.expectSearchResults();
      });

      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      await measureLatency('enterprise_deployment_config', async () => {
        await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB');
        await deploymentPage.setInstanceCount(4);
        await deploymentPage.expectCorporateTheme();
      });

      await measureLatency('enterprise_compliance_check', async () => {
        await deploymentPage.expectComplianceValidation();
      });

      const searchLatency = latencyMetrics.find(m => m.operation === 'enterprise_model_search');
      const configLatency = latencyMetrics.find(m => m.operation === 'enterprise_deployment_config');
      const complianceLatency = latencyMetrics.find(m => m.operation === 'enterprise_compliance_check');

      // Enterprise SLA requirements
      expect(searchLatency?.duration).toBeLessThan(2000); // Under 2 seconds
      expect(configLatency?.duration).toBeLessThan(3000); // Under 3 seconds (more complex config)
      expect(complianceLatency?.duration).toBeLessThan(1500); // Under 1.5 seconds
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('should detect performance regressions across operations', async ({ page }) => {
      const marketplacePage = new MarketplacePage(page);
      const deploymentPage = new DeploymentPage(page);

      // Baseline performance measurements
      const baselineOperations = [
        { name: 'page_load', fn: () => marketplacePage.goto() },
        { name: 'org_switch', fn: () => marketplacePage.selectOrganization('arcade') },
        { name: 'model_search', fn: () => marketplacePage.searchModels('test') },
        { name: 'deployment_nav', fn: () => deploymentPage.goto() }
      ];

      // Run operations multiple times to establish baseline
      const runs = 3;
      const baselineMetrics: { [key: string]: number[] } = {};

      for (let run = 0; run < runs; run++) {
        for (const operation of baselineOperations) {
          await measureLatency(`${operation.name}_baseline_${run}`, operation.fn);
        }
      }

      // Calculate baseline averages
      for (const operation of baselineOperations) {
        const operationMetrics = latencyMetrics
          .filter(m => m.operation.startsWith(`${operation.name}_baseline`))
          .map(m => m.duration);

        baselineMetrics[operation.name] = operationMetrics;
      }

      // Validate no significant performance degradation between runs
      for (const [operationName, durations] of Object.entries(baselineMetrics)) {
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);

        // Performance should be consistent (variation less than 50%)
        const variation = (maxDuration - minDuration) / avgDuration;
        expect(variation).toBeLessThan(0.5); // Less than 50% variation

        console.log(`${operationName}: avg=${avgDuration.toFixed(2)}ms, variation=${(variation * 100).toFixed(1)}%`);
      }
    });
  });
});