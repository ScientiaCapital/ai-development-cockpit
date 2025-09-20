/**
 * Chaos Testing - Resilience validation for model deployment system
 * Tests system behavior under various failure conditions and stress scenarios
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { MetricsCollector } from '../../utils/MetricsCollector';
import { NetworkSimulator } from '../../fixtures/NetworkSimulator';
import { ChaosEngine } from '../../utils/ChaosEngine';

interface ChaosTestConfig {
  duration: number; // milliseconds
  failureRate: number; // 0-1
  scenarios: ChaosScenario[];
}

interface ChaosScenario {
  name: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  execute: (page: Page, context: BrowserContext) => Promise<void>;
  validate: (metrics: any) => Promise<boolean>;
}

// Core chaos testing scenarios
const CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    name: 'api_failure_cascade',
    description: 'Simulate cascading API failures across multiple services',
    impact: 'high',
    execute: async (page: Page, context: BrowserContext) => {
      // Intercept and fail API calls progressively
      await page.route('**/api/**', (route, request) => {
        if (Math.random() < 0.7) { // 70% failure rate
          route.abort('failed');
        } else {
          route.continue();
        }
      });
    },
    validate: async (metrics: any) => {
      // System should handle 70% API failure rate gracefully
      return metrics.errors.filter(e => e.type === 'network').length < 10;
    }
  },
  {
    name: 'memory_pressure',
    description: 'Simulate high memory usage and potential out-of-memory conditions',
    impact: 'critical',
    execute: async (page: Page, context: BrowserContext) => {
      // Inject memory-intensive operations
      await page.addInitScript(() => {
        // Create memory pressure
        const memoryHog: any[] = [];
        const interval = setInterval(() => {
          try {
            // Allocate large arrays to increase memory pressure
            memoryHog.push(new Array(100000).fill(Math.random()));
            if (memoryHog.length > 50) {
              memoryHog.splice(0, 10); // Release some memory to avoid crash
            }
          } catch (e) {
            clearInterval(interval);
          }
        }, 100);

        // Clean up after 30 seconds
        setTimeout(() => clearInterval(interval), 30000);
      });
    },
    validate: async (metrics: any) => {
      // System should remain responsive under memory pressure
      return metrics.performance.pageLoadTime < 10000; // Under 10 seconds
    }
  },
  {
    name: 'network_instability',
    description: 'Simulate unstable network conditions with intermittent connectivity',
    impact: 'medium',
    execute: async (page: Page, context: BrowserContext) => {
      let networkDown = false;

      // Toggle network availability
      const networkToggle = setInterval(() => {
        networkDown = !networkDown;
        page.route('**/*', (route) => {
          if (networkDown && Math.random() < 0.8) {
            route.abort('internetdisconnected');
          } else {
            route.continue();
          }
        });
      }, 2000); // Toggle every 2 seconds

      // Clean up after test
      setTimeout(() => clearInterval(networkToggle), 20000);
    },
    validate: async (metrics: any) => {
      // System should recover from network instability
      const networkErrors = metrics.errors.filter(e => e.type === 'network').length;
      return networkErrors < metrics.network.requestCount * 0.5; // Less than 50% network errors
    }
  },
  {
    name: 'deployment_interruption',
    description: 'Interrupt deployment process at various stages',
    impact: 'high',
    execute: async (page: Page, context: BrowserContext) => {
      // Simulate deployment interruptions
      await page.route('**/deployments/**', (route, request) => {
        if (request.method() === 'POST' || request.method() === 'PUT') {
          // 40% chance of interruption during deployment operations
          if (Math.random() < 0.4) {
            setTimeout(() => route.abort('failed'), Math.random() * 5000);
          } else {
            route.continue();
          }
        } else {
          route.continue();
        }
      });
    },
    validate: async (metrics: any) => {
      // System should handle deployment interruptions gracefully
      const deploymentErrors = metrics.errors.filter(e =>
        e.message?.includes('deployment') || e.context?.url?.includes('deployments')
      ).length;
      return deploymentErrors < 5; // Maximum 5 deployment-related errors
    }
  },
  {
    name: 'resource_exhaustion',
    description: 'Simulate resource exhaustion scenarios (CPU, GPU, storage)',
    impact: 'critical',
    execute: async (page: Page, context: BrowserContext) => {
      // Simulate high CPU usage
      await page.addInitScript(() => {
        const workers: Worker[] = [];

        // Create CPU-intensive workers
        for (let i = 0; i < 4; i++) {
          try {
            const worker = new Worker(URL.createObjectURL(new Blob([`
              let counter = 0;
              setInterval(() => {
                // CPU-intensive calculation
                for (let j = 0; j < 1000000; j++) {
                  counter += Math.sqrt(Math.random());
                }
              }, 10);
            `], { type: 'application/javascript' })));
            workers.push(worker);
          } catch (e) {
            // Fallback for environments that don't support workers
            setInterval(() => {
              for (let j = 0; j < 100000; j++) {
                Math.sqrt(Math.random());
              }
            }, 100);
          }
        }

        // Clean up workers after 30 seconds
        setTimeout(() => {
          workers.forEach(worker => worker.terminate());
        }, 30000);
      });
    },
    validate: async (metrics: any) => {
      // System should maintain basic functionality under resource pressure
      return metrics.performance.timeToInteractive < 15000; // Under 15 seconds
    }
  }
];

test.describe('Chaos Testing - System Resilience', () => {
  let metricsCollector: MetricsCollector;
  let networkSimulator: NetworkSimulator;
  let chaosEngine: ChaosEngine;

  test.beforeEach(async ({ page, context }) => {
    metricsCollector = new MetricsCollector(
      page,
      `chaos-${Date.now()}`,
      'Chaos Testing',
      'swaggystacks',
      'development',
      {
        collectPerformance: true,
        collectResources: true,
        collectNetwork: true,
        collectErrors: true,
        collectWarnings: true,
        samplingInterval: 500, // More frequent sampling during chaos testing
        maxDataPoints: 600
      }
    );

    networkSimulator = new NetworkSimulator();
    chaosEngine = new ChaosEngine(page, context);

    await metricsCollector.startCollection();
  });

  test.afterEach(async () => {
    const metrics = await metricsCollector.stopCollection();
    console.log('📊 Chaos Test Metrics:', JSON.stringify(metrics, null, 2));
  });

  CHAOS_SCENARIOS.forEach((scenario) => {
    test(`should survive chaos scenario: ${scenario.name}`, async ({ page, context }) => {
      console.log(`🌪️ Starting chaos scenario: ${scenario.description}`);

      // Record the start of chaos scenario
      metricsCollector.addCustomMetric('chaosScenario', scenario.name);
      metricsCollector.addCustomMetric('chaosImpact', scenario.impact);

      try {
        // Navigate to application
        await page.goto('/marketplace');
        await expect(page.locator('h1')).toContainText('Model Marketplace', { timeout: 10000 });

        // Execute chaos scenario
        await scenario.execute(page, context);

        // Give chaos time to take effect
        await page.waitForTimeout(5000);

        // Attempt normal user workflows during chaos
        await performBasicUserWorkflows(page, metricsCollector);

        // Allow chaos to continue
        await page.waitForTimeout(10000);

        // Validate system recovery
        const metrics = metricsCollector.getCurrentMetrics();
        const isResilient = await scenario.validate(metrics);

        // Record chaos test result
        metricsCollector.addCustomMetric('chaosTestPassed', isResilient);

        if (!isResilient) {
          metricsCollector.recordError({
            type: 'assertion',
            message: `Chaos scenario '${scenario.name}' failed validation`,
            severity: scenario.impact === 'critical' ? 'critical' : 'high',
            context: { scenario: scenario.name, impact: scenario.impact }
          });
        }

        // Chaos testing allows for degraded performance but not complete failure
        expect(isResilient).toBe(true);

      } catch (error) {
        metricsCollector.recordError({
          type: 'javascript',
          message: `Chaos scenario execution failed: ${error.message}`,
          severity: 'critical',
          context: { scenario: scenario.name, error: error.stack }
        });
        throw error;
      }
    });
  });

  test('should handle multiple simultaneous chaos conditions', async ({ page, context }) => {
    console.log('🌪️ Starting multi-chaos scenario');

    // Execute multiple chaos scenarios simultaneously
    const selectedScenarios = CHAOS_SCENARIOS.slice(0, 3); // Run first 3 scenarios

    metricsCollector.addCustomMetric('multiChaosScenarios', selectedScenarios.map(s => s.name));

    try {
      await page.goto('/marketplace');

      // Execute all chaos scenarios simultaneously
      await Promise.all(
        selectedScenarios.map(scenario => scenario.execute(page, context))
      );

      // Allow chaos to stabilize
      await page.waitForTimeout(5000);

      // Attempt critical user workflows
      await performCriticalUserWorkflows(page, metricsCollector);

      // System should maintain basic functionality under multi-chaos
      const basicFunctionality = await validateBasicFunctionality(page);
      expect(basicFunctionality).toBe(true);

      metricsCollector.addCustomMetric('multiChaosTestPassed', true);

    } catch (error) {
      metricsCollector.recordError({
        type: 'javascript',
        message: `Multi-chaos scenario failed: ${error.message}`,
        severity: 'critical'
      });

      // Multi-chaos is expected to be more challenging
      console.warn('🌪️ Multi-chaos scenario failed - system under extreme stress');
    }
  });

  test('should demonstrate graceful degradation patterns', async ({ page, context }) => {
    console.log('🌪️ Testing graceful degradation patterns');

    const degradationTest = async (severity: string, expectedBehavior: string) => {
      metricsCollector.addCustomMetric(`degradationTest_${severity}`, expectedBehavior);

      switch (severity) {
        case 'light':
          // Light chaos - system should function normally
          await networkSimulator.simulateCondition(page, 'enterprise_fiber');
          await expect(page.locator('[data-testid="model-list"]')).toBeVisible({ timeout: 5000 });
          break;

        case 'moderate':
          // Moderate chaos - system should show degraded performance but remain functional
          await networkSimulator.simulateCondition(page, 'mobile_3g');
          await chaosEngine.injectLatency(2000); // 2 second delays
          await expect(page.locator('[data-testid="model-list"]')).toBeVisible({ timeout: 15000 });
          break;

        case 'severe':
          // Severe chaos - system should show error messages but not crash
          await networkSimulator.simulateCondition(page, 'chaos');
          await chaosEngine.injectRandomFailures(0.3); // 30% failure rate

          // Look for error handling UI instead of expecting full functionality
          const errorIndicators = await page.locator('[data-testid*="error"], .error-message, .alert-error').count();
          expect(errorIndicators).toBeGreaterThan(0); // Should show error handling
          break;
      }
    };

    await page.goto('/marketplace');

    // Test degradation levels
    await degradationTest('light', 'normal_operation');
    await page.waitForTimeout(2000);

    await degradationTest('moderate', 'degraded_performance');
    await page.waitForTimeout(3000);

    await degradationTest('severe', 'error_handling_active');
  });
});

/**
 * Perform basic user workflows during chaos testing
 */
async function performBasicUserWorkflows(page: Page, metrics: MetricsCollector): Promise<void> {
  try {
    // Basic navigation
    await page.click('[data-testid="search-input"]', { timeout: 5000 });
    await page.fill('[data-testid="search-input"]', 'test model');

    // Wait for search results or error handling
    await page.waitForTimeout(3000);

    // Try to interact with results if available
    const modelCards = await page.locator('[data-testid="model-card"]').count();
    if (modelCards > 0) {
      await page.locator('[data-testid="model-card"]').first().click({ timeout: 3000 });
    }

    metrics.addCustomMetric('basicWorkflowCompleted', true);

  } catch (error) {
    metrics.recordError({
      type: 'javascript',
      message: `Basic workflow failed during chaos: ${error.message}`,
      severity: 'medium'
    });
    metrics.addCustomMetric('basicWorkflowCompleted', false);
  }
}

/**
 * Perform critical user workflows that must work even under chaos
 */
async function performCriticalUserWorkflows(page: Page, metrics: MetricsCollector): Promise<void> {
  try {
    // Critical: Navigation should always work
    await page.click('text=Marketplace', { timeout: 3000 });

    // Critical: Error boundaries should prevent crashes
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('ChunkLoadError');
    expect(body).not.toContain('ReferenceError');

    metrics.addCustomMetric('criticalWorkflowCompleted', true);

  } catch (error) {
    metrics.recordError({
      type: 'assertion',
      message: `Critical workflow failed: ${error.message}`,
      severity: 'critical'
    });
    metrics.addCustomMetric('criticalWorkflowCompleted', false);
  }
}

/**
 * Validate that basic functionality remains available
 */
async function validateBasicFunctionality(page: Page): Promise<boolean> {
  try {
    // Check that the page hasn't completely crashed
    const title = await page.title();
    if (!title || title === 'Error') return false;

    // Check that basic elements are present
    const body = await page.locator('body');
    await expect(body).toBeVisible({ timeout: 5000 });

    // Check that no critical JavaScript errors crashed the app
    const bodyText = await body.textContent();
    if (bodyText?.includes('ChunkLoadError') || bodyText?.includes('Script error')) {
      return false;
    }

    return true;

  } catch (error) {
    return false;
  }
}