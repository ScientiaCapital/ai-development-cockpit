/**
 * Rollback Validation E2E Tests
 * Testing deployment rollback functionality including snapshots, plans, and execution
 */

import { test, expect } from '@playwright/test';
import { DeploymentPage } from '../page-objects/DeploymentPage';

test.describe('Rollback Validation', () => {
  let deploymentPage: DeploymentPage;
  let testDeploymentId: string;

  test.beforeEach(async ({ page }) => {
    deploymentPage = new DeploymentPage(page);
    testDeploymentId = 'test-deployment-rollback';

    // Mock a running deployment for rollback tests
    await page.route('**/api/deployments', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          deploymentId: testDeploymentId,
          status: 'running',
          model: { id: 'microsoft/DialoGPT-medium' },
          configuration: {
            gpuType: 'NVIDIA_A6000',
            templateId: 'template-v1.2',
            envVars: { MODEL_PRECISION: 'fp16' }
          },
          cost: { hourlyRate: 0.89 },
          monitoring: {
            performance: { uptime: 99.9, avgResponseTime: 150, requestsPerSecond: 12.5, errorRate: 0.1 },
            resources: { cpuUsage: 45.2, gpuUsage: 78.5, memoryUsage: 62.3 },
            workers: { ready: 2, total: 2 }
          }
        }])
      });
    });

    await deploymentPage.goto();
  });

  test.describe('Snapshot Management', () => {
    test('should create deployment snapshot', async ({ page }) => {
      await page.route('**/api/deployments/*/snapshots', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            snapshotId: 'snap_001',
            deploymentId: testDeploymentId,
            timestamp: new Date().toISOString(),
            configuration: {
              templateId: 'template-v1.2',
              gpuType: 'NVIDIA_A6000',
              envVars: { MODEL_PRECISION: 'fp16' }
            },
            healthStatus: 'healthy',
            metadata: {
              createdBy: 'test-user',
              description: 'Pre-update snapshot'
            }
          })
        });
      });

      // Open rollback panel
      await deploymentPage.clickElement(`[data-testid="rollback-button-${testDeploymentId}"]`);
      await deploymentPage.waitForVisible('[data-testid="rollback-panel"]');

      // Create snapshot
      await deploymentPage.fillField('[data-testid="snapshot-description"]', 'Pre-update snapshot');
      await deploymentPage.clickElement('[data-testid="create-snapshot"]');

      await deploymentPage.expectSuccess('Snapshot created successfully');
    });

    test('should list existing snapshots', async ({ page }) => {
      await page.route('**/api/deployments/*/snapshots', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              snapshotId: 'snap_001',
              timestamp: '2024-01-15T10:00:00Z',
              healthStatus: 'healthy',
              metadata: { description: 'Initial deployment' }
            },
            {
              snapshotId: 'snap_002',
              timestamp: '2024-01-15T12:00:00Z',
              healthStatus: 'healthy',
              metadata: { description: 'After optimization' }
            }
          ])
        });
      });

      await deploymentPage.clickElement(`[data-testid="rollback-button-${testDeploymentId}"]`);
      await deploymentPage.waitForVisible('[data-testid="snapshot-list"]');

      const snapshots = deploymentPage.page.locator('[data-testid^="snapshot-item-"]');
      const count = await snapshots.count();
      expect(count).toBe(2);
    });

    test('should delete snapshot', async ({ page }) => {
      await page.route('**/api/deployments/*/snapshots/snap_001', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await deploymentPage.clickElement(`[data-testid="rollback-button-${testDeploymentId}"]`);
      await deploymentPage.clickElement('[data-testid="delete-snapshot-snap_001"]');

      // Confirm deletion
      await deploymentPage.waitForVisible('[data-testid="confirm-delete-snapshot"]');
      await deploymentPage.clickElement('[data-testid="confirm-delete-snapshot"]');

      await deploymentPage.expectSuccess('Snapshot deleted successfully');
    });
  });

  test.describe('Rollback Planning', () => {
    test('should create rollback plan', async ({ page }) => {
      await page.route('**/api/rollback/plans', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            planId: 'plan_001',
            sourceSnapshotId: 'snap_002',
            targetSnapshotId: 'snap_001',
            estimatedDuration: 300,
            riskLevel: 'medium',
            steps: [
              {
                id: 'health_check',
                name: 'Health Check',
                description: 'Validate current deployment health',
                estimatedDuration: 30,
                type: 'validation'
              },
              {
                id: 'update_env_vars',
                name: 'Update Environment Variables',
                description: 'Apply environment variable changes',
                estimatedDuration: 60,
                type: 'configuration'
              },
              {
                id: 'restart_deployment',
                name: 'Restart Deployment',
                description: 'Restart deployment with new configuration',
                estimatedDuration: 180,
                type: 'deployment'
              },
              {
                id: 'verify_rollback',
                name: 'Verify Rollback',
                description: 'Validate deployment after rollback',
                estimatedDuration: 30,
                type: 'verification'
              }
            ]
          })
        });
      });

      await deploymentPage.clickElement(`[data-testid="rollback-button-${testDeploymentId}"]`);

      // Select source and target snapshots
      await deploymentPage.clickElement('[data-testid="snapshot-item-snap_002"]');
      await deploymentPage.clickElement('[data-testid="snapshot-item-snap_001"]');

      await deploymentPage.clickElement('[data-testid="create-rollback-plan"]');

      await deploymentPage.waitForVisible('[data-testid="rollback-plan"]');
      await deploymentPage.expectText('[data-testid="plan-id"]', 'plan_001');
      await deploymentPage.expectText('[data-testid="risk-level"]', 'medium');
    });

    test('should display rollback steps', async ({ page }) => {
      await page.route('**/api/rollback/plans/plan_001', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            planId: 'plan_001',
            steps: [
              {
                id: 'health_check',
                name: 'Health Check',
                description: 'Validate current deployment health',
                estimatedDuration: 30,
                type: 'validation',
                status: 'pending'
              },
              {
                id: 'update_env_vars',
                name: 'Update Environment Variables',
                description: 'Apply environment variable changes',
                estimatedDuration: 60,
                type: 'configuration',
                status: 'pending'
              }
            ]
          })
        });
      });

      await deploymentPage.clickElement('[data-testid="view-plan-plan_001"]');
      await deploymentPage.waitForVisible('[data-testid="rollback-steps"]');

      const steps = deploymentPage.page.locator('[data-testid^="rollback-step-"]');
      const count = await steps.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should calculate risk level correctly', async ({ page }) => {
      // Test high-risk rollback (major changes)
      await page.route('**/api/rollback/plans', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            planId: 'plan_high_risk',
            riskLevel: 'high',
            steps: [
              { id: 'change_gpu', name: 'Change GPU Type', type: 'configuration' },
              { id: 'update_container', name: 'Update Container Image', type: 'deployment' },
              { id: 'update_template', name: 'Update Template', type: 'configuration' }
            ]
          })
        });
      });

      await deploymentPage.clickElement(`[data-testid="rollback-button-${testDeploymentId}"]`);
      await deploymentPage.clickElement('[data-testid="snapshot-item-snap_003"]'); // Major change snapshot
      await deploymentPage.clickElement('[data-testid="snapshot-item-snap_001"]');
      await deploymentPage.clickElement('[data-testid="create-rollback-plan"]');

      await deploymentPage.expectText('[data-testid="risk-level"]', 'high');
      await deploymentPage.waitForVisible('[data-testid="risk-warning"]');
    });
  });

  test.describe('Pre-Rollback Checks', () => {
    test('should execute pre-rollback checks', async ({ page }) => {
      await page.route('**/api/rollback/plans/plan_001/pre-checks', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'health_status',
              name: 'Current Health Status',
              type: 'health',
              status: 'passed',
              result: { success: true, message: 'Deployment is healthy' }
            },
            {
              id: 'performance_baseline',
              name: 'Performance Baseline',
              type: 'performance',
              status: 'passed',
              result: { success: true, message: 'Performance within acceptable range' }
            },
            {
              id: 'resource_availability',
              name: 'Resource Availability',
              type: 'resources',
              status: 'warning',
              result: { success: false, message: 'High CPU usage detected' }
            }
          ])
        });
      });

      await deploymentPage.clickElement('[data-testid="execute-pre-checks-plan_001"]');
      await deploymentPage.waitForVisible('[data-testid="pre-check-results"]');

      // Check that all checks are displayed
      const checks = deploymentPage.page.locator('[data-testid^="pre-check-"]');
      const count = await checks.count();
      expect(count).toBe(3);

      // Verify warning is shown for failed check
      await deploymentPage.waitForVisible('[data-testid="pre-check-warning"]');
    });

    test('should prevent rollback if critical checks fail', async ({ page }) => {
      await page.route('**/api/rollback/plans/plan_001/pre-checks', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'health_status',
              name: 'Current Health Status',
              type: 'health',
              status: 'failed',
              result: { success: false, message: 'Deployment is unhealthy' }
            }
          ])
        });
      });

      await deploymentPage.clickElement('[data-testid="execute-pre-checks-plan_001"]');
      await deploymentPage.waitForVisible('[data-testid="pre-check-results"]');

      // Execute button should be disabled
      const executeButton = deploymentPage.page.locator('[data-testid="execute-rollback"]');
      expect(await executeButton.isDisabled()).toBe(true);
    });
  });

  test.describe('Rollback Execution', () => {
    test('should execute rollback successfully', async ({ page }) => {
      let stepIndex = 0;
      const steps = ['health_check', 'update_env_vars', 'restart_deployment', 'verify_rollback'];

      await page.route('**/api/rollback/execute/plan_001', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            executionId: 'exec_001',
            planId: 'plan_001',
            status: 'running',
            progress: 0,
            currentStep: steps[0]
          })
        });
      });

      // Mock step-by-step progress updates
      await page.route('**/api/rollback/executions/exec_001', route => {
        const progress = Math.min(100, (stepIndex / steps.length) * 100);
        const status = stepIndex >= steps.length ? 'completed' : 'running';

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            executionId: 'exec_001',
            status,
            progress,
            currentStep: steps[stepIndex] || null,
            logs: [
              { timestamp: new Date().toISOString(), level: 'info', message: `Executing step: ${steps[stepIndex] || 'completed'}` }
            ]
          })
        });

        stepIndex++;
      });

      await deploymentPage.clickElement('[data-testid="execute-rollback-plan_001"]');
      await deploymentPage.waitForVisible('[data-testid="rollback-execution"]');

      // Wait for rollback to complete
      await deploymentPage.waitForVisible('[data-testid="rollback-completed"]', 60000);
      await deploymentPage.expectText('[data-testid="execution-status"]', 'completed');
    });

    test('should show rollback progress', async ({ page }) => {
      await page.route('**/api/rollback/execute/plan_001', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            executionId: 'exec_002',
            status: 'running',
            progress: 25,
            currentStep: 'update_env_vars'
          })
        });
      });

      await deploymentPage.clickElement('[data-testid="execute-rollback-plan_001"]');
      await deploymentPage.waitForVisible('[data-testid="rollback-progress"]');

      const progressText = await deploymentPage.getText('[data-testid="progress-percentage"]');
      expect(progressText).toContain('25%');

      const currentStep = await deploymentPage.getText('[data-testid="current-step"]');
      expect(currentStep).toContain('update_env_vars');
    });

    test('should allow rollback cancellation', async ({ page }) => {
      await page.route('**/api/rollback/execute/plan_001', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            executionId: 'exec_003',
            status: 'running',
            progress: 15
          })
        });
      });

      await page.route('**/api/rollback/executions/exec_003/cancel', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await deploymentPage.clickElement('[data-testid="execute-rollback-plan_001"]');
      await deploymentPage.waitForVisible('[data-testid="cancel-rollback"]');

      await deploymentPage.clickElement('[data-testid="cancel-rollback"]');
      await deploymentPage.waitForVisible('[data-testid="confirm-cancel"]');
      await deploymentPage.clickElement('[data-testid="confirm-cancel"]');

      await deploymentPage.expectText('[data-testid="execution-status"]', 'cancelled');
    });

    test('should handle rollback failures gracefully', async ({ page }) => {
      await page.route('**/api/rollback/execute/plan_001', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            executionId: 'exec_004',
            status: 'running',
            progress: 50
          })
        });
      });

      // Mock failure after progress
      await page.route('**/api/rollback/executions/exec_004', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            executionId: 'exec_004',
            status: 'failed',
            progress: 50,
            error: 'Deployment restart failed',
            logs: [
              { timestamp: new Date().toISOString(), level: 'error', message: 'Deployment restart failed: Connection timeout' }
            ]
          })
        });
      });

      await deploymentPage.clickElement('[data-testid="execute-rollback-plan_001"]');
      await deploymentPage.waitForVisible('[data-testid="rollback-failed"]');

      await deploymentPage.expectError('Deployment restart failed');
    });

    test('should display rollback logs', async ({ page }) => {
      await page.route('**/api/rollback/executions/exec_001/logs', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { timestamp: '2024-01-15T10:00:00Z', level: 'info', message: 'Starting rollback execution' },
            { timestamp: '2024-01-15T10:00:30Z', level: 'info', message: 'Health check passed' },
            { timestamp: '2024-01-15T10:01:00Z', level: 'info', message: 'Updating environment variables' },
            { timestamp: '2024-01-15T10:02:00Z', level: 'info', message: 'Rollback completed successfully' }
          ])
        });
      });

      await deploymentPage.clickElement('[data-testid="view-rollback-logs-exec_001"]');
      await deploymentPage.waitForVisible('[data-testid="rollback-logs"]');

      const logEntries = deploymentPage.page.locator('[data-testid^="log-entry-"]');
      const count = await logEntries.count();
      expect(count).toBe(4);
    });
  });

  test.describe('Integration with Deployment Monitoring', () => {
    test('should update deployment status after rollback', async ({ page }) => {
      // Mock successful rollback completion
      await page.route('**/api/rollback/executions/exec_001', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            executionId: 'exec_001',
            status: 'completed',
            progress: 100
          })
        });
      });

      // Mock updated deployment state after rollback
      await page.route('**/api/deployments', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            deploymentId: testDeploymentId,
            status: 'running',
            model: { id: 'microsoft/DialoGPT-medium' },
            configuration: {
              gpuType: 'NVIDIA_A6000',
              templateId: 'template-v1.1', // Rolled back version
              envVars: {} // Original env vars
            },
            cost: { hourlyRate: 0.79 }, // Different cost
            monitoring: {
              performance: { uptime: 100, avgResponseTime: 120, requestsPerSecond: 15, errorRate: 0 },
              resources: { cpuUsage: 35, gpuUsage: 65, memoryUsage: 55 },
              workers: { ready: 2, total: 2 }
            },
            lastRollback: {
              timestamp: new Date().toISOString(),
              snapshotId: 'snap_001'
            }
          }])
        });
      });

      // Complete rollback and verify deployment updates
      await deploymentPage.waitForVisible('[data-testid="rollback-completed"]');
      await deploymentPage.clickElement('[data-testid="view-deployment"]');

      // Verify deployment shows rollback indicators
      await deploymentPage.waitForVisible('[data-testid="rollback-indicator"]');
      await deploymentPage.expectText('[data-testid="template-version"]', 'template-v1.1');
    });
  });
});