/**
 * Deployment Validation E2E Tests
 * Comprehensive testing of the deployment lifecycle including creation, monitoring, and management
 */

import { test, expect } from '@playwright/test';
import { DeploymentPage } from '../page-objects/DeploymentPage';

test.describe('Deployment Validation', () => {
  let deploymentPage: DeploymentPage;
  let testDeploymentId: string;

  test.beforeEach(async ({ page }) => {
    deploymentPage = new DeploymentPage(page);
    await deploymentPage.goto();
  });

  test.afterEach(async () => {
    // Cleanup: terminate test deployment if it exists
    if (testDeploymentId) {
      try {
        await deploymentPage.terminateDeployment(testDeploymentId);
      } catch (error: unknown) {
        console.log('Cleanup: Deployment may have already been terminated');
      }
    }
  });

  test.describe('Deployment Creation', () => {
    test('should display deployment form correctly', async () => {
      await deploymentPage.expectDeploymentForm();
    });

    test('should show cost estimate when model and GPU are selected', async () => {
      await deploymentPage.selectModel('microsoft/DialoGPT-medium');
      await deploymentPage.selectGpuType('NVIDIA_A6000');

      await deploymentPage.expectCostEstimate();
    });

    test('should create deployment with basic configuration', async ({ page }) => {
      // Fill basic deployment configuration
      await deploymentPage.selectModel('microsoft/DialoGPT-medium');
      await deploymentPage.selectGpuType('NVIDIA_A6000');

      // Mock the deployment API for testing
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            deploymentId: 'test-deployment-001',
            status: 'creating',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: { gpuType: 'NVIDIA_A6000' },
            cost: { hourlyRate: 0.89 },
            monitoring: {
              performance: { uptime: 0, avgResponseTime: 0, requestsPerSecond: 0, errorRate: 0 },
              resources: { cpuUsage: 0, gpuUsage: 0, memoryUsage: 0 },
              workers: { ready: 0, total: 1 }
            }
          })
        });
      });

      testDeploymentId = await deploymentPage.deployModel();
      expect(testDeploymentId).toBeTruthy();

      await deploymentPage.expectDeploymentVisible(testDeploymentId);
    });

    test('should create deployment with advanced configuration', async ({ page }) => {
      await deploymentPage.selectModel('microsoft/DialoGPT-medium');
      await deploymentPage.selectGpuType('NVIDIA_A6000');

      await deploymentPage.fillAdvancedConfig({
        minWorkers: 1,
        maxWorkers: 3,
        timeout: 600,
        envVars: {
          'MODEL_PRECISION': 'fp16',
          'MAX_BATCH_SIZE': '8'
        }
      });

      // Mock deployment API
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            deploymentId: 'test-deployment-002',
            status: 'creating',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: {
              gpuType: 'NVIDIA_A6000',
              minWorkers: 1,
              maxWorkers: 3,
              timeout: 600,
              envVars: { 'MODEL_PRECISION': 'fp16', 'MAX_BATCH_SIZE': '8' }
            },
            cost: { hourlyRate: 0.89 },
            monitoring: {
              performance: { uptime: 0, avgResponseTime: 0, requestsPerSecond: 0, errorRate: 0 },
              resources: { cpuUsage: 0, gpuUsage: 0, memoryUsage: 0 },
              workers: { ready: 0, total: 1 }
            }
          })
        });
      });

      testDeploymentId = await deploymentPage.deployModel();
      expect(testDeploymentId).toBeTruthy();
    });

    test('should handle deployment creation errors gracefully', async ({ page }) => {
      await deploymentPage.selectModel('invalid-model');
      await deploymentPage.selectGpuType('NVIDIA_A6000');

      // Mock API error
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid model specified'
          })
        });
      });

      await deploymentPage.clickElement('[data-testid="deploy-button"]');
      await deploymentPage.expectError('Invalid model specified');
    });
  });

  test.describe('Deployment Status and Monitoring', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test deployment for monitoring tests
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            deploymentId: 'test-deployment-monitoring',
            status: 'running',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: { gpuType: 'NVIDIA_A6000' },
            cost: { hourlyRate: 0.89 },
            monitoring: {
              performance: { uptime: 99.9, avgResponseTime: 150, requestsPerSecond: 12.5, errorRate: 0.1 },
              resources: { cpuUsage: 45.2, gpuUsage: 78.5, memoryUsage: 62.3 },
              workers: { ready: 2, total: 2 }
            }
          })
        });
      });

      testDeploymentId = 'test-deployment-monitoring';
    });

    test('should display deployment list', async () => {
      await deploymentPage.expectDeploymentList();
    });

    test('should show deployment status correctly', async () => {
      await deploymentPage.expectDeploymentVisible(testDeploymentId);

      const status = await deploymentPage.getDeploymentStatus(testDeploymentId);
      expect(['creating', 'running', 'stopped', 'failed']).toContain(status.toLowerCase());
    });

    test('should display metrics panel', async () => {
      await deploymentPage.expectMetricsPanel(testDeploymentId);
    });

    test('should show healthy metrics for running deployment', async () => {
      await deploymentPage.expectHealthyMetrics(testDeploymentId);
    });

    test('should track costs accurately', async () => {
      await deploymentPage.expectCostTracking(testDeploymentId);

      const costPerHour = await deploymentPage.getCostPerHour(testDeploymentId);
      expect(costPerHour).toBeGreaterThan(0);
      expect(costPerHour).toBeLessThan(10); // Reasonable upper bound
    });

    test('should display deployment logs', async () => {
      await deploymentPage.expectDeploymentLogs(testDeploymentId);

      const logs = await deploymentPage.getLogEntries(testDeploymentId);
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should not show errors in logs for healthy deployment', async () => {
      await deploymentPage.expectNoErrors(testDeploymentId);
    });
  });

  test.describe('Deployment Actions', () => {
    test.beforeEach(async ({ page }) => {
      // Mock running deployment
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            deploymentId: 'test-deployment-actions',
            status: 'running',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: { gpuType: 'NVIDIA_A6000' },
            cost: { hourlyRate: 0.89 },
            monitoring: {
              performance: { uptime: 99.9, avgResponseTime: 150, requestsPerSecond: 12.5, errorRate: 0.1 },
              resources: { cpuUsage: 45.2, gpuUsage: 78.5, memoryUsage: 62.3 },
              workers: { ready: 2, total: 2 }
            }
          }])
        });
      });

      testDeploymentId = 'test-deployment-actions';
    });

    test('should stop deployment successfully', async ({ page }) => {
      await page.route('**/api/deployments/*/stop', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await deploymentPage.stopDeployment(testDeploymentId);
    });

    test('should restart deployment successfully', async ({ page }) => {
      // First mock as stopped
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            deploymentId: testDeploymentId,
            status: 'stopped',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: { gpuType: 'NVIDIA_A6000' },
            cost: { hourlyRate: 0 },
            monitoring: {
              performance: { uptime: 0, avgResponseTime: 0, requestsPerSecond: 0, errorRate: 0 },
              resources: { cpuUsage: 0, gpuUsage: 0, memoryUsage: 0 },
              workers: { ready: 0, total: 0 }
            }
          }])
        });
      });

      await page.route('**/api/deployments/*/restart', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await deploymentPage.restartDeployment(testDeploymentId);
    });

    test('should terminate deployment with confirmation', async ({ page }) => {
      await page.route('**/api/deployments/*/terminate', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await deploymentPage.terminateDeployment(testDeploymentId);
    });
  });

  test.describe('Deployment Testing and Validation', () => {
    test.beforeEach(async ({ page }) => {
      // Mock running deployment for testing
      testDeploymentId = 'test-deployment-testing';

      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            deploymentId: testDeploymentId,
            status: 'running',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: { gpuType: 'NVIDIA_A6000' },
            cost: { hourlyRate: 0.89 },
            monitoring: {
              performance: { uptime: 99.9, avgResponseTime: 150, requestsPerSecond: 12.5, errorRate: 0.1 },
              resources: { cpuUsage: 45.2, gpuUsage: 78.5, memoryUsage: 62.3 },
              workers: { ready: 2, total: 2 }
            }
          }])
        });
      });
    });

    test('should send test request and receive response', async ({ page }) => {
      await page.route('**/api/deployments/*/test', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [
              {
                text: "Hello! How can I help you today?",
                finish_reason: "stop"
              }
            ],
            usage: {
              prompt_tokens: 4,
              completion_tokens: 8,
              total_tokens: 12
            }
          })
        });
      });

      await deploymentPage.expectSuccessfulResponse(testDeploymentId);
    });

    test('should handle load testing', async ({ page }) => {
      await page.route('**/api/deployments/*/load-test', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            requests_per_second: 8.5,
            avg_response_time: 180,
            total_requests: 255,
            successful_requests: 253,
            failed_requests: 2,
            error_rate: 0.78
          })
        });
      });

      await deploymentPage.loadTestDeployment(testDeploymentId, 5, 30000);
      await deploymentPage.expectPerformanceResults(testDeploymentId);
    });
  });

  test.describe('Real-time Updates and Monitoring', () => {
    test.beforeEach(async ({ page }) => {
      testDeploymentId = 'test-deployment-realtime';

      // Mock real-time updates
      let requestCount = 0;
      await page.route('**/api/deployments', route => {
        requestCount++;
        const baseMetrics = {
          deploymentId: testDeploymentId,
          status: 'running',
          model: { id: 'microsoft/DialoGPT-medium' },
          configuration: { gpuType: 'NVIDIA_A6000' },
          cost: { hourlyRate: 0.89 }
        };

        // Simulate changing metrics
        const metrics = {
          performance: {
            uptime: 99.9,
            avgResponseTime: 150 + (requestCount * 2),
            requestsPerSecond: 12.5 + (requestCount * 0.1),
            errorRate: Math.max(0, 0.1 - (requestCount * 0.01))
          },
          resources: {
            cpuUsage: Math.min(90, 45.2 + (requestCount * 1.5)),
            gpuUsage: Math.min(100, 78.5 + (requestCount * 0.8)),
            memoryUsage: Math.min(95, 62.3 + (requestCount * 1.2))
          },
          workers: { ready: 2, total: 2 }
        };

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            ...baseMetrics,
            monitoring: metrics
          }])
        });
      });
    });

    test('should update metrics in real-time', async () => {
      await deploymentPage.expectRealTimeUpdates(testDeploymentId);
    });

    test('should refresh deployment list manually', async () => {
      await deploymentPage.refreshDeployments();
      await deploymentPage.expectDeploymentList();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        });
      });

      await deploymentPage.goto();
      await deploymentPage.expectError('Internal server error');
    });

    test('should handle empty deployment list', async ({ page }) => {
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await deploymentPage.goto();
      await deploymentPage.expectDeploymentList();

      const count = await deploymentPage.getDeploymentCount();
      expect(count).toBe(0);
    });

    test('should handle deployment in failed state', async ({ page }) => {
      testDeploymentId = 'test-deployment-failed';

      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            deploymentId: testDeploymentId,
            status: 'failed',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: { gpuType: 'NVIDIA_A6000' },
            cost: { hourlyRate: 0 },
            monitoring: {
              performance: { uptime: 0, avgResponseTime: 0, requestsPerSecond: 0, errorRate: 100 },
              resources: { cpuUsage: 0, gpuUsage: 0, memoryUsage: 0 },
              workers: { ready: 0, total: 1 }
            },
            error: 'Model failed to load'
          }])
        });
      });

      await deploymentPage.goto();
      await deploymentPage.expectDeploymentVisible(testDeploymentId);

      const status = await deploymentPage.getDeploymentStatus(testDeploymentId);
      expect(status.toLowerCase()).toBe('failed');
    });
  });
});