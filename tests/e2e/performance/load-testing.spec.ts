/**
 * Load Testing E2E Specifications
 * Tests deployment system under concurrent load conditions
 * Validates performance under stress for both SwaggyStacks and ScientiaCapital
 */

import { test, expect } from '@playwright/test';
import { DeploymentPage } from '../page-objects/DeploymentPage';
import { MarketplacePage } from '../page-objects/MarketplacePage';
import { TestApiClient } from '../utils/TestApiClient';

test.describe('Load Testing - Deployment System Performance', () => {
  let apiClient: TestApiClient;

  test.beforeEach(async ({ page }) => {
    apiClient = new TestApiClient(page, { mode: 'mock' });
    await apiClient.setupMockHuggingFaceApi();
    await apiClient.setupMockRunPodApi();
  });

  test.afterEach(async () => {
    await apiClient.cleanup();
  });

  test.describe('Concurrent Deployment Load Tests', () => {
    test('should handle 10 concurrent deployments successfully', async ({ browser }) => {
      const concurrentDeployments = 10;
      const deploymentPromises: Promise<any>[] = [];
      const deploymentResults: any[] = [];

      // Create multiple browser contexts for concurrent testing
      for (let i = 0; i < concurrentDeployments; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        const marketplacePage = new MarketplacePage(page);
        const deploymentPage = new DeploymentPage(page);

        // Setup API mocking for each context
        const contextApiClient = new TestApiClient(page, { mode: 'mock' });
        await contextApiClient.setupMockHuggingFaceApi();
        await contextApiClient.setupMockRunPodApi();

        const deploymentPromise = (async () => {
          const startTime = Date.now();

          try {
            // Navigate to marketplace
            await marketplacePage.goto();

            // Alternate between organizations for load distribution
            const org = i % 2 === 0 ? 'swaggystacks' : 'scientia';
            await marketplacePage.selectOrganization(org);

            // Select model for deployment
            await marketplacePage.searchModels('test-model');
            const modelId = await marketplacePage.selectFirstModel();
            await marketplacePage.deployModel(modelId);

            // Configure deployment
            await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
            await deploymentPage.setInstanceCount(1);

            // Create deployment
            await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
            await deploymentPage.waitForDeploymentReady(30000);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Stop deployment to free resources
            await deploymentPage.stopDeployment(deploymentId);

            return {
              deploymentIndex: i,
              deploymentId,
              organization: org,
              duration,
              success: true
            };
          } catch (error: unknown) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            return {
              deploymentIndex: i,
              deploymentId: null,
              organization: i % 2 === 0 ? 'swaggystacks' : 'scientia',
              duration,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          } finally {
            await contextApiClient.cleanup();
            await context.close();
          }
        })();

        deploymentPromises.push(deploymentPromise);
      }

      // Wait for all deployments to complete
      const results = await Promise.all(deploymentPromises);
      deploymentResults.push(...results);

      // Analyze results
      const successfulDeployments = results.filter(r => r.success);
      const failedDeployments = results.filter(r => !r.success);

      const avgDuration = successfulDeployments.reduce((sum, r) => sum + r.duration, 0) / successfulDeployments.length;
      const maxDuration = Math.max(...successfulDeployments.map(r => r.duration));
      const minDuration = Math.min(...successfulDeployments.map(r => r.duration));

      // Assertions
      expect(successfulDeployments.length).toBeGreaterThan(concurrentDeployments * 0.8); // 80% success rate minimum
      expect(avgDuration).toBeLessThan(45000); // Average under 45 seconds
      expect(maxDuration).toBeLessThan(60000); // Maximum under 60 seconds
      expect(failedDeployments.length).toBeLessThan(concurrentDeployments * 0.2); // Less than 20% failure rate

      console.log(`Load Test Results:
        Successful: ${successfulDeployments.length}/${concurrentDeployments}
        Failed: ${failedDeployments.length}/${concurrentDeployments}
        Average Duration: ${avgDuration}ms
        Min Duration: ${minDuration}ms
        Max Duration: ${maxDuration}ms
      `);
    });

    test('should maintain performance under sustained load', async ({ browser }) => {
      const sustainedDuration = 300000; // 5 minutes
      const deploymentInterval = 10000; // Deploy every 10 seconds
      const maxConcurrentDeployments = 5;

      const startTime = Date.now();
      let deploymentCount = 0;
      let activeDeployments = 0;
      const performanceMetrics: any[] = [];

      while (Date.now() - startTime < sustainedDuration) {
        if (activeDeployments < maxConcurrentDeployments) {
          const context = await browser.newContext();
          const page = await context.newPage();

          const deploymentPage = new DeploymentPage(page);
          const contextApiClient = new TestApiClient(page, { mode: 'mock' });
          await contextApiClient.setupMockRunPodApi();

          activeDeployments++;
          deploymentCount++;

          // Fire and forget deployment
          (async () => {
            try {
              const deploymentStartTime = Date.now();

              await deploymentPage.goto();
              await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
              await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
              await deploymentPage.waitForDeploymentReady(30000);

              const deploymentDuration = Date.now() - deploymentStartTime;

              // Collect performance metrics
              const metrics = await deploymentPage.getPerformanceMetrics();
              performanceMetrics.push({
                deploymentId,
                duration: deploymentDuration,
                timestamp: Date.now(),
                metrics
              });

              // Keep deployment running for 30 seconds then stop
              await new Promise(resolve => setTimeout(resolve, 30000));
              await deploymentPage.stopDeployment(deploymentId);

            } catch (error: unknown) {
              console.error(`Deployment ${deploymentCount} failed:`, error);
            } finally {
              activeDeployments--;
              await contextApiClient.cleanup();
              await context.close();
            }
          })();
        }

        // Wait before next deployment
        await new Promise(resolve => setTimeout(resolve, deploymentInterval));
      }

      // Wait for remaining deployments to complete
      while (activeDeployments > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Analyze sustained performance
      const avgResponseTime = performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length;
      const responseTimeStdDev = Math.sqrt(
        performanceMetrics.reduce((sum, m) => sum + Math.pow(m.duration - avgResponseTime, 2), 0) / performanceMetrics.length
      );

      // Performance should remain stable
      expect(avgResponseTime).toBeLessThan(40000); // Average under 40 seconds
      expect(responseTimeStdDev).toBeLessThan(15000); // Low variability
      expect(performanceMetrics.length).toBeGreaterThan(15); // Sufficient data points

      console.log(`Sustained Load Results:
        Total Deployments: ${deploymentCount}
        Completed Deployments: ${performanceMetrics.length}
        Average Response Time: ${avgResponseTime}ms
        Response Time Std Dev: ${responseTimeStdDev}ms
      `);
    });
  });

  test.describe('Organization-Specific Load Tests', () => {
    test('should handle SwaggyStacks terminal theme under load', async ({ browser }) => {
      const concurrentUsers = 8;
      const userPromises: Promise<any>[] = [];

      for (let i = 0; i < concurrentUsers; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        const marketplacePage = new MarketplacePage(page);
        const deploymentPage = new DeploymentPage(page);

        const userPromise = (async () => {
          const startTime = Date.now();

          try {
            await marketplacePage.goto();
            await marketplacePage.selectOrganization('swaggystacks');
            await marketplacePage.expectSwaggyStacksTheme();

            // Simulate user browsing and deployment
            await marketplacePage.searchModels('gaming');
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Random delay

            const modelId = await marketplacePage.selectFirstModel();
            await marketplacePage.deployModel(modelId);

            await deploymentPage.expectTerminalTheme();
            await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');

            await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
            await deploymentPage.waitForDeploymentReady(25000);

            // Verify theme consistency under load
            await deploymentPage.expectTerminalTheme();

            await deploymentPage.stopDeployment(deploymentId);

            return {
              userId: i,
              duration: Date.now() - startTime,
              success: true
            };
          } catch (error: unknown) {
            return {
              userId: i,
              duration: Date.now() - startTime,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          } finally {
            await context.close();
          }
        })();

        userPromises.push(userPromise);
      }

      const results = await Promise.all(userPromises);
      const successfulUsers = results.filter(r => r.success);

      expect(successfulUsers.length).toBe(concurrentUsers); // All users should succeed
      expect(results.every(r => r.duration < 50000)).toBe(true); // All under 50 seconds
    });

    test('should handle ScientiaCapital enterprise load', async ({ browser }) => {
      const enterpriseUsers = 6; // Fewer but higher resource usage
      const userPromises: Promise<any>[] = [];

      for (let i = 0; i < enterpriseUsers; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        const marketplacePage = new MarketplacePage(page);
        const deploymentPage = new DeploymentPage(page);

        const userPromise = (async () => {
          const startTime = Date.now();

          try {
            await marketplacePage.goto();
            await marketplacePage.selectOrganization('scientia');
            await marketplacePage.expectScientiaCapitalTheme();

            // Enterprise workflow with larger deployments
            await marketplacePage.searchModels('financial');
            const modelId = await marketplacePage.selectFirstModel();
            await marketplacePage.deployModel(modelId);

            await deploymentPage.expectCorporateTheme();
            await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB'); // Enterprise GPU
            await deploymentPage.setInstanceCount(4); // Higher instance count
            await deploymentPage.enableAutoScaling(true);

            await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
            await deploymentPage.waitForDeploymentReady(45000); // Longer timeout for enterprise

            // Verify enterprise features work under load
            await deploymentPage.expectEnterpriseMonitoring();
            await deploymentPage.expectComplianceValidation();

            await deploymentPage.stopDeployment(deploymentId);

            return {
              userId: i,
              duration: Date.now() - startTime,
              success: true
            };
          } catch (error: unknown) {
            return {
              userId: i,
              duration: Date.now() - startTime,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          } finally {
            await context.close();
          }
        })();

        userPromises.push(userPromise);
      }

      const results = await Promise.all(userPromises);
      const successfulUsers = results.filter(r => r.success);

      expect(successfulUsers.length).toBe(enterpriseUsers); // All enterprise users should succeed
      expect(results.every(r => r.duration < 70000)).toBe(true); // All under 70 seconds (longer for enterprise)
    });
  });

  test.describe('Resource Limitation Tests', () => {
    test('should gracefully handle resource exhaustion', async ({ browser }) => {
      const overloadAttempts = 20; // More than system can handle
      const contexts: any[] = [];

      try {
        // Create more concurrent deployments than the system should handle
        for (let i = 0; i < overloadAttempts; i++) {
          const context = await browser.newContext();
          contexts.push(context);

          const page = await context.newPage();
          const deploymentPage = new DeploymentPage(page);

          // Rapid fire deployment attempts
          (async () => {
            try {
              await deploymentPage.goto();
              await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
              await deploymentPage.createDeployment();
            } catch (error: unknown) {
              // Expected to fail under overload
              console.log(`Expected overload failure for deployment ${i}:`, error instanceof Error ? error.message : 'Unknown error');
            }
          })();
        }

        // Wait a bit for the system to process
        await new Promise(resolve => setTimeout(resolve, 10000));

        // System should either gracefully queue or reject requests
        // Should not crash or become unresponsive
        const healthCheckContext = await browser.newContext();
        const healthCheckPage = await healthCheckContext.newPage();
        const healthDeploymentPage = new DeploymentPage(healthCheckPage);

        // System should still be responsive for health check
        await healthDeploymentPage.goto();
        await expect(healthCheckPage.locator('body')).toBeVisible();

        await healthCheckContext.close();

      } finally {
        // Cleanup all contexts
        for (const context of contexts) {
          await context.close();
        }
      }
    });

    test('should maintain performance during memory pressure', async ({ browser }) => {
      const memoryIntensiveDeployments = 5;
      const deploymentPromises: Promise<any>[] = [];

      for (let i = 0; i < memoryIntensiveDeployments; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        const deploymentPage = new DeploymentPage(page);

        const deploymentPromise = (async () => {
          try {
            await deploymentPage.goto();

            // Create large memory footprint
            await page.evaluate(() => {
              // Simulate memory-intensive operations
              const largeArray = new Array(1000000).fill('memory-test-data');
              (window as any).memoryTestData = largeArray;
            });

            await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
            await deploymentPage.createDeployment();
            const deploymentId = await deploymentPage.getDeploymentId();
            await deploymentPage.waitForDeploymentReady(35000);

            // Verify deployment works despite memory pressure
            const metrics = await deploymentPage.getPerformanceMetrics();
            expect(metrics.uptime).toBeGreaterThanOrEqual(0);

            await deploymentPage.stopDeployment(deploymentId);

            return { success: true, deploymentId };
          } catch (error: unknown) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          } finally {
            await context.close();
          }
        })();

        deploymentPromises.push(deploymentPromise);
      }

      const results = await Promise.all(deploymentPromises);
      const successfulDeployments = results.filter(r => r.success);

      // Should handle memory pressure gracefully
      expect(successfulDeployments.length).toBeGreaterThan(memoryIntensiveDeployments * 0.6); // 60% success under pressure
    });
  });
});