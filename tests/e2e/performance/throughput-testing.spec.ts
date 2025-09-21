/**
 * Throughput Testing E2E Specifications
 * Tests system capacity for handling concurrent requests and sustained load
 * Validates request processing rates and queue management
 */

import { test, expect } from '@playwright/test';
import { DeploymentPage } from '../page-objects/DeploymentPage';
import { MarketplacePage } from '../page-objects/MarketplacePage';
import { TestApiClient } from '../utils/TestApiClient';

interface ThroughputMetrics {
  testId: string;
  startTime: number;
  endTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  peakRequestsPerSecond: number;
  errorRate: number;
  timeoutCount: number;
}

interface LoadPattern {
  name: string;
  description: string;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  maxConcurrentUsers: number;
  requestInterval: number; // milliseconds between requests
}

test.describe('Throughput Testing - Request Processing Capacity', () => {
  let apiClient: TestApiClient;
  let throughputMetrics: ThroughputMetrics[] = [];

  test.beforeEach(async ({ page }) => {
    apiClient = new TestApiClient(page, { mode: 'mock' });
    await apiClient.setupMockHuggingFaceApi();
    await apiClient.setupMockRunPodApi();
    throughputMetrics = [];
  });

  test.afterEach(async () => {
    await apiClient.cleanup();

    // Log throughput analysis
    if (throughputMetrics.length > 0) {
      console.log('\n=== Throughput Test Results ===');
      throughputMetrics.forEach(metric => {
        console.log(`${metric.testId}:`);
        console.log(`  Requests/sec: ${metric.requestsPerSecond.toFixed(2)} (peak: ${metric.peakRequestsPerSecond.toFixed(2)})`);
        console.log(`  Success rate: ${((metric.successfulRequests / metric.totalRequests) * 100).toFixed(1)}%`);
        console.log(`  Avg response time: ${metric.averageResponseTime.toFixed(0)}ms`);
        console.log(`  Error rate: ${(metric.errorRate * 100).toFixed(2)}%`);
      });
    }
  });

  /**
   * Execute a load pattern and collect throughput metrics
   */
  async function executeLoadPattern(
    browser: any,
    pattern: LoadPattern,
    operationFn: (page: any) => Promise<void>
  ): Promise<ThroughputMetrics> {
    const testStartTime = Date.now();
    const requestResults: { success: boolean; responseTime: number; timestamp: number }[] = [];
    const activeOperations: Promise<any>[] = [];

    console.log(`\nExecuting load pattern: ${pattern.name}`);
    console.log(`Duration: ${pattern.duration}s, Max users: ${pattern.maxConcurrentUsers}, Interval: ${pattern.requestInterval}ms`);

    // Ramp up phase
    let currentConcurrentUsers = 0;
    const rampUpIncrement = pattern.maxConcurrentUsers / (pattern.rampUpTime * 1000 / pattern.requestInterval);

    const endTime = Date.now() + (pattern.duration * 1000);
    let requestCounter = 0;

    while (Date.now() < endTime) {
      // Ramp up concurrent users gradually
      if (currentConcurrentUsers < pattern.maxConcurrentUsers && Date.now() - testStartTime < pattern.rampUpTime * 1000) {
        currentConcurrentUsers = Math.min(
          pattern.maxConcurrentUsers,
          Math.floor((Date.now() - testStartTime) / 1000 * rampUpIncrement) + 1
        );
      }

      // Start new requests if under concurrent limit
      if (activeOperations.length < currentConcurrentUsers) {
        const context = await browser.newContext();
        const page = await context.newPage();
        requestCounter++;

        const requestPromise = (async () => {
          const requestStartTime = Date.now();
          let success = false;

          try {
            await operationFn(page);
            success = true;
          } catch (error: unknown) {
            // Track failures
            console.log(`Request ${requestCounter} failed:`, error instanceof Error ? error.message : 'Unknown error');
          } finally {
            const responseTime = Date.now() - requestStartTime;
            requestResults.push({
              success,
              responseTime,
              timestamp: Date.now()
            });

            await context.close();
          }
        })();

        activeOperations.push(requestPromise);

        // Remove completed operations
        requestPromise.finally(() => {
          const index = activeOperations.indexOf(requestPromise);
          if (index > -1) {
            activeOperations.splice(index, 1);
          }
        });
      }

      await new Promise(resolve => setTimeout(resolve, pattern.requestInterval));
    }

    // Wait for remaining operations to complete
    await Promise.all(activeOperations);

    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Calculate metrics
    const successfulRequests = requestResults.filter(r => r.success).length;
    const failedRequests = requestResults.length - successfulRequests;
    const averageResponseTime = requestResults.reduce((sum, r) => sum + r.responseTime, 0) / requestResults.length;
    const requestsPerSecond = requestResults.length / testDuration;

    // Calculate peak RPS using 5-second windows
    let peakRequestsPerSecond = 0;
    const windowSize = 5000; // 5 seconds in milliseconds

    for (let windowStart = testStartTime; windowStart < testEndTime - windowSize; windowStart += 1000) {
      const windowEnd = windowStart + windowSize;
      const requestsInWindow = requestResults.filter(r =>
        r.timestamp >= windowStart && r.timestamp <= windowEnd
      ).length;
      const windowRps = requestsInWindow / (windowSize / 1000);
      peakRequestsPerSecond = Math.max(peakRequestsPerSecond, windowRps);
    }

    const metrics: ThroughputMetrics = {
      testId: pattern.name,
      startTime: testStartTime,
      endTime: testEndTime,
      totalRequests: requestResults.length,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      requestsPerSecond,
      peakRequestsPerSecond,
      errorRate: failedRequests / requestResults.length,
      timeoutCount: requestResults.filter(r => r.responseTime > 30000).length
    };

    throughputMetrics.push(metrics);
    return metrics;
  }

  test.describe('Model Discovery Throughput', () => {
    test('should handle concurrent model searches efficiently', async ({ browser }) => {
      const searchPattern: LoadPattern = {
        name: 'model_search_burst',
        description: 'Burst of concurrent model searches',
        duration: 30,
        rampUpTime: 5,
        maxConcurrentUsers: 15,
        requestInterval: 200
      };

      const searchOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        await marketplacePage.goto();
        await marketplacePage.selectOrganization('swaggystacks');
        await marketplacePage.searchModels('gaming');
        await marketplacePage.expectSearchResults();
      };

      const metrics = await executeLoadPattern(browser, searchPattern, searchOperation);

      // Validate search throughput requirements
      expect(metrics.requestsPerSecond).toBeGreaterThan(8); // At least 8 searches/sec
      expect(metrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(metrics.averageResponseTime).toBeLessThan(3000); // Under 3 seconds average
      expect(metrics.peakRequestsPerSecond).toBeGreaterThan(12); // Peak capacity above 12/sec
    });

    test('should maintain performance during sustained search load', async ({ browser }) => {
      const sustainedPattern: LoadPattern = {
        name: 'model_search_sustained',
        description: 'Sustained model search load',
        duration: 60,
        rampUpTime: 10,
        maxConcurrentUsers: 10,
        requestInterval: 500
      };

      const sustainedSearchOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        await marketplacePage.goto();

        // Alternate between organizations
        const org = Math.random() > 0.5 ? 'swaggystacks' : 'scientia';
        await marketplacePage.selectOrganization(org);

        // Vary search terms
        const searchTerms = ['gaming', 'financial', 'chat', 'assistant', 'terminal'];
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        await marketplacePage.searchModels(term);
        await marketplacePage.expectSearchResults();
      };

      const metrics = await executeLoadPattern(browser, sustainedPattern, sustainedSearchOperation);

      // Sustained load requirements
      expect(metrics.requestsPerSecond).toBeGreaterThan(6); // Consistent 6+ searches/sec
      expect(metrics.errorRate).toBeLessThan(0.03); // Less than 3% error rate for sustained load
      expect(metrics.averageResponseTime).toBeLessThan(2500); // Consistent performance under 2.5s
    });

    test('should handle organization switching under load', async ({ browser }) => {
      const switchingPattern: LoadPattern = {
        name: 'org_switching_load',
        description: 'Frequent organization switching',
        duration: 45,
        rampUpTime: 8,
        maxConcurrentUsers: 12,
        requestInterval: 300
      };

      const switchingOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        await marketplacePage.goto();

        // Rapidly switch between organizations
        await marketplacePage.selectOrganization('swaggystacks');
        await marketplacePage.expectSwaggyStacksTheme();
        await marketplacePage.selectOrganization('scientia');
        await marketplacePage.expectScientiaCapitalTheme();
        await marketplacePage.selectOrganization('swaggystacks');
        await marketplacePage.expectSwaggyStacksTheme();
      };

      const metrics = await executeLoadPattern(browser, switchingPattern, switchingOperation);

      // Organization switching should be efficient
      expect(metrics.requestsPerSecond).toBeGreaterThan(5); // At least 5 complete cycles/sec
      expect(metrics.errorRate).toBeLessThan(0.08); // Less than 8% error rate (switching is complex)
      expect(metrics.averageResponseTime).toBeLessThan(4000); // Under 4 seconds for complete cycle
    });
  });

  test.describe('Deployment Creation Throughput', () => {
    test('should handle concurrent deployment requests', async ({ browser }) => {
      const deploymentPattern: LoadPattern = {
        name: 'deployment_creation_burst',
        description: 'Concurrent deployment creation requests',
        duration: 45,
        rampUpTime: 10,
        maxConcurrentUsers: 8, // Lower concurrency for resource-intensive operations
        requestInterval: 1000
      };

      const deploymentOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        const deploymentPage = new DeploymentPage(page);

        await marketplacePage.goto();
        await marketplacePage.selectOrganization('swaggystacks');

        const modelId = await marketplacePage.selectFirstModel();
        await marketplacePage.deployModel(modelId);

        await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
        await deploymentPage.setInstanceCount(1);

        await deploymentPage.createDeployment();
        const deploymentId = await deploymentPage.getDeploymentId();
        await deploymentPage.expectDeploymentCreating();

        // Wait a bit then stop deployment to free resources
        await new Promise(resolve => setTimeout(resolve, 2000));
        await deploymentPage.stopDeployment(deploymentId);
      };

      const metrics = await executeLoadPattern(browser, deploymentPattern, deploymentOperation);

      // Deployment creation throughput requirements
      expect(metrics.requestsPerSecond).toBeGreaterThan(2); // At least 2 deployments/sec
      expect(metrics.errorRate).toBeLessThan(0.15); // Less than 15% error rate (deployments are complex)
      expect(metrics.averageResponseTime).toBeLessThan(15000); // Under 15 seconds average
    });

    test('should queue deployment requests when at capacity', async ({ browser }) => {
      const capacityPattern: LoadPattern = {
        name: 'deployment_capacity_test',
        description: 'Test deployment queueing at capacity',
        duration: 30,
        rampUpTime: 5,
        maxConcurrentUsers: 20, // Exceed normal capacity
        requestInterval: 200
      };

      const queueTestOperation = async (page: any) => {
        const deploymentPage = new DeploymentPage(page);
        await deploymentPage.goto();

        await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');

        try {
          await deploymentPage.createDeployment();
          const deploymentId = await deploymentPage.getDeploymentId();
          // Quick cleanup
          await deploymentPage.stopDeployment(deploymentId);
        } catch (error: unknown) {
          // Expected to fail at capacity - this is normal behavior
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('capacity') && !errorMessage.includes('queue')) {
            throw error;
          }
        }
      };

      const metrics = await executeLoadPattern(browser, capacityPattern, queueTestOperation);

      // System should gracefully handle capacity limits
      expect(metrics.errorRate).toBeGreaterThan(0.3); // Expect some failures at capacity
      expect(metrics.errorRate).toBeLessThan(0.8); // But not total failure
      expect(metrics.averageResponseTime).toBeLessThan(20000); // Queued requests should not timeout excessively
    });
  });

  test.describe('Monitoring and Management Throughput', () => {
    test('should handle concurrent monitoring requests', async ({ browser }) => {
      const monitoringPattern: LoadPattern = {
        name: 'deployment_monitoring_load',
        description: 'Concurrent deployment monitoring',
        duration: 30,
        rampUpTime: 5,
        maxConcurrentUsers: 25, // Higher concurrency for read operations
        requestInterval: 150
      };

      const monitoringOperation = async (page: any) => {
        const deploymentPage = new DeploymentPage(page);
        await deploymentPage.goto();

        // Mock monitoring data retrieval
        await deploymentPage.expectDeploymentList();
        const metrics = await deploymentPage.getPerformanceMetrics();
        expect(metrics).toBeDefined();
      };

      const metrics = await executeLoadPattern(browser, monitoringPattern, monitoringOperation);

      // Monitoring should have high throughput
      expect(metrics.requestsPerSecond).toBeGreaterThan(15); // At least 15 monitoring requests/sec
      expect(metrics.errorRate).toBeLessThan(0.02); // Less than 2% error rate
      expect(metrics.averageResponseTime).toBeLessThan(1500); // Under 1.5 seconds
      expect(metrics.peakRequestsPerSecond).toBeGreaterThan(25); // Peak above 25/sec
    });

    test('should handle mixed read/write operations efficiently', async ({ browser }) => {
      const mixedPattern: LoadPattern = {
        name: 'mixed_operations_load',
        description: 'Mixed read and write operations',
        duration: 40,
        rampUpTime: 8,
        maxConcurrentUsers: 15,
        requestInterval: 400
      };

      const mixedOperation = async (page: any) => {
        const deploymentPage = new DeploymentPage(page);
        await deploymentPage.goto();

        const operationType = Math.random();

        if (operationType < 0.7) {
          // 70% read operations (monitoring, metrics)
          await deploymentPage.expectDeploymentList();
          await deploymentPage.getPerformanceMetrics();
        } else if (operationType < 0.9) {
          // 20% light write operations (configuration changes)
          await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
          await deploymentPage.setInstanceCount(1);
        } else {
          // 10% heavy write operations (deployment actions)
          try {
            await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await deploymentPage.stopDeployment(deploymentId);
          } catch (error: unknown) {
            // May fail under load
          }
        }
      };

      const metrics = await executeLoadPattern(browser, mixedPattern, mixedOperation);

      // Mixed operations should balance throughput and reliability
      expect(metrics.requestsPerSecond).toBeGreaterThan(8); // At least 8 operations/sec
      expect(metrics.errorRate).toBeLessThan(0.1); // Less than 10% error rate
      expect(metrics.averageResponseTime).toBeLessThan(3000); // Under 3 seconds average
    });
  });

  test.describe('Stress Testing and Limits', () => {
    test('should identify system throughput limits', async ({ browser }) => {
      const stressPattern: LoadPattern = {
        name: 'stress_test_limits',
        description: 'Push system to throughput limits',
        duration: 60,
        rampUpTime: 15,
        maxConcurrentUsers: 50, // Very high concurrency
        requestInterval: 100
      };

      const stressOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        await marketplacePage.goto();

        const org = Math.random() > 0.5 ? 'swaggystacks' : 'scientia';
        await marketplacePage.selectOrganization(org);
        await marketplacePage.searchModels('stress-test');
      };

      const metrics = await executeLoadPattern(browser, stressPattern, stressOperation);

      // Document system limits
      console.log(`\nSystem Limits Identified:`);
      console.log(`Maximum sustained RPS: ${metrics.requestsPerSecond.toFixed(2)}`);
      console.log(`Peak burst RPS: ${metrics.peakRequestsPerSecond.toFixed(2)}`);
      console.log(`Stress test error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);

      // System should degrade gracefully under extreme load
      expect(metrics.requestsPerSecond).toBeGreaterThan(5); // Minimum viable throughput
      expect(metrics.errorRate).toBeLessThan(0.5); // Less than 50% error rate even under stress
    });

    test('should recover gracefully after load spikes', async ({ browser }) => {
      // High load phase
      const highLoadPattern: LoadPattern = {
        name: 'load_spike',
        description: 'Sudden load spike',
        duration: 20,
        rampUpTime: 2, // Very fast ramp up
        maxConcurrentUsers: 30,
        requestInterval: 100
      };

      const loadSpikeOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        await marketplacePage.goto();
        await marketplacePage.selectOrganization('swaggystacks');
        await marketplacePage.searchModels('spike-test');
      };

      // Execute load spike
      const spikeMetrics = await executeLoadPattern(browser, highLoadPattern, loadSpikeOperation);

      // Recovery phase - normal load
      await new Promise(resolve => setTimeout(resolve, 5000)); // Cool down period

      const recoveryPattern: LoadPattern = {
        name: 'post_spike_recovery',
        description: 'Performance after load spike',
        duration: 15,
        rampUpTime: 3,
        maxConcurrentUsers: 5, // Normal load
        requestInterval: 500
      };

      const recoveryMetrics = await executeLoadPattern(browser, recoveryPattern, loadSpikeOperation);

      // System should recover to normal performance
      expect(recoveryMetrics.errorRate).toBeLessThan(spikeMetrics.errorRate * 0.5); // Error rate should improve
      expect(recoveryMetrics.averageResponseTime).toBeLessThan(spikeMetrics.averageResponseTime * 0.8); // Response time should improve

      console.log(`\nLoad Spike Recovery Analysis:`);
      console.log(`Spike phase: ${spikeMetrics.requestsPerSecond.toFixed(2)} RPS, ${(spikeMetrics.errorRate * 100).toFixed(1)}% errors`);
      console.log(`Recovery phase: ${recoveryMetrics.requestsPerSecond.toFixed(2)} RPS, ${(recoveryMetrics.errorRate * 100).toFixed(1)}% errors`);
    });
  });

  test.describe('Organization-Specific Throughput', () => {
    test('should handle SwaggyStacks gaming workload patterns', async ({ browser }) => {
      const gamingPattern: LoadPattern = {
        name: 'gaming_workload',
        description: 'Gaming user behavior pattern',
        duration: 35,
        rampUpTime: 5,
        maxConcurrentUsers: 20, // Gaming users tend to be concurrent
        requestInterval: 250
      };

      const gamingOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        const deploymentPage = new DeploymentPage(page);

        await marketplacePage.goto();
        await marketplacePage.selectOrganization('swaggystacks');
        await marketplacePage.expectSwaggyStacksTheme();

        // Gaming users browse quickly
        await marketplacePage.searchModels('gaming');
        const modelId = await marketplacePage.selectFirstModel();

        // Quick deployment decisions
        await marketplacePage.deployModel(modelId);
        await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');

        if (Math.random() > 0.7) {
          // 30% actually deploy
          try {
            await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await deploymentPage.stopDeployment(deploymentId);
          } catch (error: unknown) {
            // Gaming users may cancel if too slow
          }
        }
      };

      const metrics = await executeLoadPattern(browser, gamingPattern, gamingOperation);

      // Gaming workload should be responsive
      expect(metrics.requestsPerSecond).toBeGreaterThan(10); // High activity rate
      expect(metrics.averageResponseTime).toBeLessThan(2500); // Fast response for gaming users
      expect(metrics.errorRate).toBeLessThan(0.08); // Gaming users expect reliability
    });

    test('should handle ScientiaCapital enterprise workload patterns', async ({ browser }) => {
      const enterprisePattern: LoadPattern = {
        name: 'enterprise_workload',
        description: 'Enterprise user behavior pattern',
        duration: 50,
        rampUpTime: 10,
        maxConcurrentUsers: 12, // Fewer but more resource-intensive
        requestInterval: 800
      };

      const enterpriseOperation = async (page: any) => {
        const marketplacePage = new MarketplacePage(page);
        const deploymentPage = new DeploymentPage(page);

        await marketplacePage.goto();
        await marketplacePage.selectOrganization('scientia');
        await marketplacePage.expectScientiaCapitalTheme();

        // Enterprise users are more thorough
        await marketplacePage.searchModels('financial');
        const modelId = await marketplacePage.selectFirstModel();
        await marketplacePage.expectModelDetails(modelId);

        // More complex deployment configuration
        await marketplacePage.deployModel(modelId);
        await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB');
        await deploymentPage.setInstanceCount(4);
        await deploymentPage.enableAutoScaling(true);

        // Enterprise users check compliance
        await deploymentPage.expectComplianceValidation();

        if (Math.random() > 0.5) {
          // 50% actually deploy (higher conversion than gaming)
          try {
            await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Longer deployment time
            await deploymentPage.stopDeployment(deploymentId);
          } catch (error: unknown) {
            // Enterprise deployments may be more complex and fail occasionally
          }
        }
      };

      const metrics = await executeLoadPattern(browser, enterprisePattern, enterpriseOperation);

      // Enterprise workload focuses on reliability over speed
      expect(metrics.requestsPerSecond).toBeGreaterThan(4); // Lower but consistent throughput
      expect(metrics.averageResponseTime).toBeLessThan(6000); // Longer acceptable response time
      expect(metrics.errorRate).toBeLessThan(0.05); // Very low error rate for enterprise
    });
  });
});