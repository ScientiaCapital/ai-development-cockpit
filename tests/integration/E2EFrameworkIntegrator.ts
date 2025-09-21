import { test, expect, Page, BrowserContext, TestInfo } from '@playwright/test';
import { TestCoordinator, TestCoordinatorConfig, E2ETestConfig, UnifiedTestResults, DEFAULT_TEST_COORDINATOR_CONFIG } from '../utils/TestCoordinator';
import { MarketplacePage } from '../e2e/page-objects/MarketplacePage';
import { DeploymentPage } from '../e2e/page-objects/DeploymentPage';
import { LandingPage } from '../e2e/page-objects/LandingPage';
import { TestApiClient } from '../e2e/utils/TestApiClient';

export interface E2EIntegrationConfig {
  coordinator: TestCoordinatorConfig;
  enablePageObjectIntegration: boolean;
  enableRealTimeMetrics: boolean;
  enableCrossTestCommunication: boolean;
  enableTestDataSharing: boolean;
  parallelExecution: boolean;
}

export interface TestContext {
  sessionId: string;
  coordinator: TestCoordinator;
  apiClient: TestApiClient;
  testData: Map<string, any>;
  metrics: Map<string, any>;
  sharedState: Map<string, any>;
}

export interface E2ETestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots?: string[];
  metrics?: any;
  pageObjects?: string[];
}

/**
 * Integrates Playwright E2E testing framework with TestCoordinator and infrastructure components
 * Provides seamless communication between E2E tests and backend testing systems
 */
export class E2EFrameworkIntegrator {
  private config: E2EIntegrationConfig;
  private activeContexts: Map<string, TestContext> = new Map();
  private globalCoordinator: TestCoordinator | null = null;

  constructor(config: E2EIntegrationConfig) {
    this.config = config;
  }

  /**
   * Initialize the integrator with global test coordinator
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing E2E Framework Integrator...');

    this.globalCoordinator = new TestCoordinator(this.config.coordinator);
    const sessionId = await this.globalCoordinator.initializeSession('E2E-Framework-Integration');

    console.log(`✅ E2E Framework Integrator initialized with session: ${sessionId}`);
  }

  /**
   * Create test context for Playwright test
   */
  async createTestContext(testInfo: TestInfo): Promise<TestContext> {
    const sessionId = `e2e-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}`;

    if (!this.globalCoordinator) {
      throw new Error('E2E Framework Integrator not initialized');
    }

    const coordinator = new TestCoordinator(this.config.coordinator);
    await coordinator.initializeSession(`E2E-${testInfo.title}`, 'e2e-testing');

    const context: TestContext = {
      sessionId,
      coordinator,
      apiClient: new TestApiClient(),
      testData: new Map(),
      metrics: new Map(),
      sharedState: new Map()
    };

    this.activeContexts.set(sessionId, context);

    console.log(`🆔 Created test context: ${sessionId} for test: ${testInfo.title}`);
    return context;
  }

  /**
   * Setup Playwright page with integrated page objects and monitoring
   */
  async setupIntegratedPage(
    page: Page,
    context: TestContext,
    pageType: 'marketplace' | 'deployment' | 'landing'
  ): Promise<MarketplacePage | DeploymentPage | LandingPage> {
    console.log(`🎭 Setting up integrated page: ${pageType}`);

    // Add metrics collection to page
    if (this.config.enableRealTimeMetrics) {
      await this.attachMetricsCollection(page, context);
    }

    // Add error monitoring
    await this.attachErrorMonitoring(page, context);

    // Create appropriate page object
    let pageObject: MarketplacePage | DeploymentPage | LandingPage;

    switch (pageType) {
      case 'marketplace':
        pageObject = new MarketplacePage(page);
        break;
      case 'deployment':
        pageObject = new DeploymentPage(page);
        break;
      case 'landing':
        pageObject = new LandingPage(page);
        break;
      default:
        throw new Error(`Unknown page type: ${pageType}`);
    }

    // Store page object reference in context
    context.testData.set('currentPageObject', pageObject);
    context.testData.set('currentPageType', pageType);

    console.log(`✅ Integrated page setup complete: ${pageType}`);
    return pageObject;
  }

  /**
   * Execute E2E test with full integration
   */
  async executeIntegratedTest(
    testName: string,
    testFunction: (context: TestContext, page: Page) => Promise<void>,
    page: Page,
    testInfo: TestInfo
  ): Promise<E2ETestResult> {
    const startTime = Date.now();
    const context = await this.createTestContext(testInfo);

    console.log(`🚀 Executing integrated E2E test: ${testName}`);

    const result: E2ETestResult = {
      testName,
      status: 'failed',
      duration: 0,
      screenshots: [],
      pageObjects: []
    };

    try {
      // Pre-test setup
      await this.preTestSetup(context, page);

      // Execute the test function
      await testFunction(context, page);

      // Post-test validation
      await this.postTestValidation(context, page);

      result.status = 'passed';
      console.log(`✅ Test passed: ${testName}`);

    } catch (error: unknown) {
      result.status = 'failed';
      result.error = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : String(error);

      // Capture failure screenshot
      const screenshot = await this.captureFailureScreenshot(page, testName);
      if (screenshot) {
        result.screenshots?.push(screenshot);
      }

      console.error(`❌ Test failed: ${testName}`, error);

    } finally {
      // Cleanup
      result.duration = Date.now() - startTime;
      result.metrics = await this.collectTestMetrics(context);
      result.pageObjects = this.getUsedPageObjects(context);

      await this.cleanupTestContext(context);
    }

    return result;
  }

  /**
   * Coordinate with infrastructure testing
   */
  async coordinateWithInfrastructure(
    context: TestContext,
    operation: 'deployment' | 'monitoring' | 'rollback'
  ): Promise<any> {
    console.log(`🏗️ Coordinating with infrastructure: ${operation}`);

    try {
      switch (operation) {
        case 'deployment':
          return await this.coordinateDeploymentTest(context);
        case 'monitoring':
          return await this.coordinateMonitoringTest(context);
        case 'rollback':
          return await this.coordinateRollbackTest(context);
        default:
          throw new Error(`Unknown infrastructure operation: ${operation}`);
      }

    } catch (error: unknown) {
      console.error(`❌ Infrastructure coordination failed: ${operation}`, error);
      throw error;
    }
  }

  /**
   * Validate API integration during E2E tests
   */
  async validateApiIntegration(
    context: TestContext,
    endpoints: string[],
    options: { mockMode?: boolean; validateAuth?: boolean } = {}
  ): Promise<any[]> {
    console.log('🔗 Validating API integration during E2E test...');

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const result = await context.apiClient.validateEndpoint(endpoint, {
          mockMode: options.mockMode || false,
          checkAuth: options.validateAuth || false
        });

        results.push(result);
        console.log(`✅ API validation passed: ${endpoint}`);

      } catch (error: unknown) {
        console.error(`❌ API validation failed: ${endpoint}`, error);
        results.push({
          endpoint,
          success: false,
          error: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Share data between tests
   */
  async shareTestData(fromContext: TestContext, toContext: TestContext, dataKey: string): Promise<void> {
    if (!this.config.enableTestDataSharing) {
      console.log('⏭️ Test data sharing disabled in configuration');
      return;
    }

    const data = fromContext.testData.get(dataKey);
    if (data) {
      toContext.sharedState.set(dataKey, data);
      console.log(`📤 Shared test data: ${dataKey}`);
    } else {
      console.warn(`⚠️ No data found for key: ${dataKey}`);
    }
  }

  /**
   * Execute parallel E2E tests with coordination
   */
  async executeParallelTests(
    testConfigs: Array<{
      name: string;
      testFunction: (context: TestContext, page: Page) => Promise<void>;
      page: Page;
      testInfo: TestInfo;
    }>
  ): Promise<E2ETestResult[]> {
    if (!this.config.parallelExecution) {
      console.log('⏭️ Parallel execution disabled, running sequentially...');
      const results = [];
      for (const config of testConfigs) {
        const result = await this.executeIntegratedTest(
          config.name,
          config.testFunction,
          config.page,
          config.testInfo
        );
        results.push(result);
      }
      return results;
    }

    console.log(`🔄 Executing ${testConfigs.length} E2E tests in parallel...`);

    const promises = testConfigs.map(config =>
      this.executeIntegratedTest(
        config.name,
        config.testFunction,
        config.page,
        config.testInfo
      )
    );

    const results = await Promise.all(promises);
    console.log(`✅ Parallel E2E tests completed: ${results.length} tests`);

    return results;
  }

  /**
   * Generate comprehensive E2E test report
   */
  async generateE2EReport(results: E2ETestResult[]): Promise<string> {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;

    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    const report = `
# E2E Framework Integration Report

## Summary
- **Total Tests**: ${totalTests}
- **Passed**: ${passedTests}
- **Failed**: ${failedTests}
- **Skipped**: ${skippedTests}
- **Success Rate**: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
- **Total Duration**: ${totalDuration}ms
- **Average Duration**: ${Math.round(averageDuration)}ms

## Test Results

${results.map(result => `
### ${result.testName}
- **Status**: ${result.status}
- **Duration**: ${result.duration}ms
${result.error ? `- **Error**: ${result.error}` : ''}
${result.pageObjects?.length ? `- **Page Objects**: ${result.pageObjects.join(', ')}` : ''}
${result.screenshots?.length ? `- **Screenshots**: ${result.screenshots.length} captured` : ''}
`).join('\n')}

## Integration Metrics
- **Page Object Integration**: ${this.config.enablePageObjectIntegration ? 'Enabled' : 'Disabled'}
- **Real-time Metrics**: ${this.config.enableRealTimeMetrics ? 'Enabled' : 'Disabled'}
- **Cross-test Communication**: ${this.config.enableCrossTestCommunication ? 'Enabled' : 'Disabled'}
- **Parallel Execution**: ${this.config.parallelExecution ? 'Enabled' : 'Disabled'}

---
Generated by E2EFrameworkIntegrator v1.0.0
    `.trim();

    return report;
  }

  // Private helper methods

  private async attachMetricsCollection(page: Page, context: TestContext): Promise<void> {
    await page.addInitScript(() => {
      (window as any).e2eMetrics = {
        startTime: Date.now(),
        interactions: [],
        errors: [],
        performanceMarks: []
      };

      // Track user interactions
      document.addEventListener('click', (event) => {
        (window as any).e2eMetrics.interactions.push({
          type: 'click',
          target: (event.target as Element)?.tagName,
          timestamp: Date.now()
        });
      });

      // Track JavaScript errors
      window.addEventListener('error', (event) => {
        (window as any).e2eMetrics.errors.push({
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          timestamp: Date.now()
        });
      });
    });
  }

  private async attachErrorMonitoring(page: Page, context: TestContext): Promise<void> {
    page.on('pageerror', (error) => {
      console.error(`🚫 Page error detected:`, error);
      context.metrics.set('pageErrors', [
        ...(context.metrics.get('pageErrors') || []),
        { message: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() }
      ]);
    });

    page.on('requestfailed', (request) => {
      console.warn(`⚠️ Request failed: ${request.url()}`);
      context.metrics.set('failedRequests', [
        ...(context.metrics.get('failedRequests') || []),
        { url: request.url(), timestamp: Date.now() }
      ]);
    });
  }

  private async preTestSetup(context: TestContext, page: Page): Promise<void> {
    console.log('🔧 Executing pre-test setup...');

    // Initialize page metrics
    context.metrics.set('testStartTime', Date.now());

    // Setup API client for the test
    await context.apiClient.initialize();
  }

  private async postTestValidation(context: TestContext, page: Page): Promise<void> {
    console.log('✅ Executing post-test validation...');

    // Collect final metrics
    const endTime = Date.now();
    const startTime = context.metrics.get('testStartTime') || endTime;
    context.metrics.set('testDuration', endTime - startTime);

    // Validate no console errors
    const pageErrors = context.metrics.get('pageErrors') || [];
    if (pageErrors.length > 0) {
      console.warn(`⚠️ ${pageErrors.length} page errors detected during test`);
    }
  }

  private async captureFailureScreenshot(page: Page, testName: string): Promise<string | null> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `failure-${testName}-${timestamp}.png`;
      const screenshotPath = `test-results/screenshots/${filename}`;

      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Failure screenshot captured: ${screenshotPath}`);

      return screenshotPath;
    } catch (error: unknown) {
      console.error('❌ Failed to capture screenshot:', error);
      return null;
    }
  }

  private async collectTestMetrics(context: TestContext): Promise<any> {
    return {
      duration: context.metrics.get('testDuration') || 0,
      pageErrors: context.metrics.get('pageErrors') || [],
      failedRequests: context.metrics.get('failedRequests') || [],
      customMetrics: Object.fromEntries(context.metrics)
    };
  }

  private getUsedPageObjects(context: TestContext): string[] {
    const pageObjects = [];
    const currentPageType = context.testData.get('currentPageType');

    if (currentPageType) {
      pageObjects.push(currentPageType);
    }

    return pageObjects;
  }

  private async coordinateDeploymentTest(context: TestContext): Promise<any> {
    console.log('🚀 Coordinating deployment test...');

    // This would integrate with TestCoordinator for deployment validation
    return await context.coordinator.executeInfrastructureTests({
      testSuite: 'deployment-validation',
      environment: 'e2e-testing'
    });
  }

  private async coordinateMonitoringTest(context: TestContext): Promise<any> {
    console.log('📊 Coordinating monitoring test...');

    return await context.coordinator.collectTestMetrics();
  }

  private async coordinateRollbackTest(context: TestContext): Promise<any> {
    console.log('🔄 Coordinating rollback test...');

    // This would integrate with chaos testing for rollback validation
    return await context.coordinator.executeChaosTests({
      scenarios: ['rollback-validation'],
      intensity: 'low'
    });
  }

  private async cleanupTestContext(context: TestContext): Promise<void> {
    console.log(`🧹 Cleaning up test context: ${context.sessionId}`);

    try {
      await context.coordinator.cleanupSession();
      this.activeContexts.delete(context.sessionId);
      console.log('✅ Test context cleanup completed');
    } catch (error: unknown) {
      console.error('❌ Test context cleanup failed:', error);
    }
  }

  /**
   * Cleanup integrator
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up E2E Framework Integrator...');

    for (const [sessionId, context] of this.activeContexts) {
      await this.cleanupTestContext(context);
    }

    if (this.globalCoordinator) {
      await this.globalCoordinator.cleanupSession();
      this.globalCoordinator = null;
    }

    console.log('✅ E2E Framework Integrator cleanup completed');
  }
}

// Default configuration for E2E integration
export const DEFAULT_E2E_INTEGRATION_CONFIG: E2EIntegrationConfig = {
  coordinator: DEFAULT_TEST_COORDINATOR_CONFIG,
  enablePageObjectIntegration: true,
  enableRealTimeMetrics: true,
  enableCrossTestCommunication: true,
  enableTestDataSharing: true,
  parallelExecution: true
};

// Utility function to create integrator for Playwright tests
export function createE2EIntegrator(config?: Partial<E2EIntegrationConfig>): E2EFrameworkIntegrator {
  const mergedConfig = { ...DEFAULT_E2E_INTEGRATION_CONFIG, ...config };
  return new E2EFrameworkIntegrator(mergedConfig);
}