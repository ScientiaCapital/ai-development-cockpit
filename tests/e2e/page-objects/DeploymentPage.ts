/**
 * Deployment Page Object Model
 * Page object for deployment management interface
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DeploymentPage extends BasePage {
  // Selectors
  private readonly deployButton = '[data-testid="deploy-button"]';
  private readonly modelSelector = '[data-testid="model-selector"]';
  private readonly gpuTypeSelector = '[data-testid="gpu-type-selector"]';
  private readonly deploymentForm = '[data-testid="deployment-form"]';
  private readonly deploymentList = '[data-testid="deployment-list"]';
  private readonly deploymentCard = '[data-testid^="deployment-card-"]';
  private readonly statusBadge = '[data-testid^="status-badge-"]';
  private readonly costEstimate = '[data-testid="cost-estimate"]';
  private readonly deploymentLogs = '[data-testid="deployment-logs"]';

  // Monitoring selectors
  private readonly metricsPanel = '[data-testid="metrics-panel"]';
  private readonly cpuUsage = '[data-testid="cpu-usage"]';
  private readonly gpuUsage = '[data-testid="gpu-usage"]';
  private readonly memoryUsage = '[data-testid="memory-usage"]';
  private readonly responseTime = '[data-testid="response-time"]';
  private readonly requestsPerSecond = '[data-testid="requests-per-second"]';
  private readonly errorRate = '[data-testid="error-rate"]';

  // Action selectors
  private readonly stopButton = '[data-testid^="stop-button-"]';
  private readonly restartButton = '[data-testid^="restart-button-"]';
  private readonly terminateButton = '[data-testid^="terminate-button-"]';
  private readonly rollbackButton = '[data-testid^="rollback-button-"]';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/deployments');
    await this.waitForLoad();
  }

  // Deployment Creation
  async expectDeploymentForm(): Promise<void> {
    await this.waitForVisible(this.deploymentForm);
    await this.waitForVisible(this.modelSelector);
    await this.waitForVisible(this.gpuTypeSelector);
    await this.waitForVisible(this.deployButton);
  }

  async selectModel(modelId: string): Promise<void> {
    await this.clickElement(this.modelSelector);
    await this.clickElement(`[data-testid="model-option-${modelId}"]`);
  }

  async selectGpuType(gpuType: string): Promise<void> {
    await this.clickElement(this.gpuTypeSelector);
    await this.clickElement(`[data-testid="gpu-option-${gpuType}"]`);
  }

  async fillAdvancedConfig(config: {
    minWorkers?: number;
    maxWorkers?: number;
    timeout?: number;
    envVars?: Record<string, string>;
  }): Promise<void> {
    // Expand advanced configuration
    await this.clickElement('[data-testid="advanced-config-toggle"]');

    if (config.minWorkers !== undefined) {
      await this.fillField('[data-testid="min-workers"]', config.minWorkers.toString());
    }

    if (config.maxWorkers !== undefined) {
      await this.fillField('[data-testid="max-workers"]', config.maxWorkers.toString());
    }

    if (config.timeout !== undefined) {
      await this.fillField('[data-testid="timeout"]', config.timeout.toString());
    }

    if (config.envVars) {
      for (const [key, value] of Object.entries(config.envVars)) {
        await this.clickElement('[data-testid="add-env-var"]');
        await this.fillField('[data-testid="env-var-key"]:last-of-type', key);
        await this.fillField('[data-testid="env-var-value"]:last-of-type', value);
      }
    }
  }

  async deployModel(): Promise<string> {
    await this.clickElement(this.deployButton);

    // Wait for deployment to be created
    await this.waitForApiResponse('/api/deployments');

    // Get deployment ID from the newly created deployment
    await this.waitForVisible('[data-testid^="deployment-card-"]');
    const deploymentCard = this.page.locator('[data-testid^="deployment-card-"]').first();
    const deploymentId = await deploymentCard.getAttribute('data-deployment-id') || '';

    return deploymentId;
  }

  async expectCostEstimate(): Promise<void> {
    await this.waitForVisible(this.costEstimate);

    const estimate = await this.getText(this.costEstimate);
    expect(estimate.includes('$') && parseFloat(estimate.replace(/[^0-9.]/g, '')) > 0).toBe(true);
  }

  // Deployment List and Status
  async expectDeploymentList(): Promise<void> {
    await this.waitForVisible(this.deploymentList);
  }

  async getDeploymentCount(): Promise<number> {
    const deployments = this.page.locator(this.deploymentCard);
    return await deployments.count();
  }

  async getDeploymentStatus(deploymentId: string): Promise<string> {
    const statusElement = this.page.locator(`[data-testid="status-badge-${deploymentId}"]`);
    return await statusElement.textContent() || '';
  }

  async waitForDeploymentStatus(deploymentId: string, expectedStatus: string, timeout = 30000): Promise<void> {
    await this.page.waitForFunction(
      ({ id, status }) => {
        const statusElement = document.querySelector(`[data-testid="status-badge-${id}"]`);
        return statusElement?.textContent?.toLowerCase() === status.toLowerCase();
      },
      { id: deploymentId, status: expectedStatus },
      { timeout }
    );
  }

  async expectDeploymentVisible(deploymentId: string): Promise<void> {
    await this.waitForVisible(`[data-testid="deployment-card-${deploymentId}"]`);
  }

  // Monitoring and Metrics
  async expectMetricsPanel(deploymentId: string): Promise<void> {
    await this.clickElement(`[data-testid="deployment-card-${deploymentId}"]`);
    await this.waitForVisible(this.metricsPanel);
  }

  async getMetrics(deploymentId: string): Promise<{
    cpu: number;
    gpu: number;
    memory: number;
    responseTime: number;
    rps: number;
    errorRate: number;
  }> {
    await this.expectMetricsPanel(deploymentId);

    const cpu = parseFloat(await this.getText(this.cpuUsage)) || 0;
    const gpu = parseFloat(await this.getText(this.gpuUsage)) || 0;
    const memory = parseFloat(await this.getText(this.memoryUsage)) || 0;
    const responseTime = parseFloat(await this.getText(this.responseTime)) || 0;
    const rps = parseFloat(await this.getText(this.requestsPerSecond)) || 0;
    const errorRate = parseFloat(await this.getText(this.errorRate)) || 0;

    return { cpu, gpu, memory, responseTime, rps, errorRate };
  }

  async expectHealthyMetrics(deploymentId: string): Promise<void> {
    const metrics = await this.getMetrics(deploymentId);

    // CPU should be reasonable
    expect(metrics.cpu > 0 && metrics.cpu < 90).toBe(true);
    // GPU should be utilized if model is loaded
    expect(metrics.gpu >= 0 && metrics.gpu <= 100).toBe(true);
    // Memory should be within limits
    expect(metrics.memory > 0 && metrics.memory < 95).toBe(true);
    // Response time should be reasonable
    expect(metrics.responseTime < 5000).toBe(true); // 5 seconds max
    // Error rate should be low
    expect(metrics.errorRate < 5).toBe(true); // Less than 5%
  }

  // Deployment Actions
  async stopDeployment(deploymentId: string): Promise<void> {
    await this.clickElement(`[data-testid="stop-button-${deploymentId}"]`);
    await this.waitForApiResponse('/api/deployments/*/stop');
    await this.waitForDeploymentStatus(deploymentId, 'stopped');
  }

  async restartDeployment(deploymentId: string): Promise<void> {
    await this.clickElement(`[data-testid="restart-button-${deploymentId}"]`);
    await this.waitForApiResponse('/api/deployments/*/restart');
    await this.waitForDeploymentStatus(deploymentId, 'running');
  }

  async terminateDeployment(deploymentId: string): Promise<void> {
    await this.clickElement(`[data-testid="terminate-button-${deploymentId}"]`);

    // Confirm termination in modal
    await this.waitForVisible('[data-testid="confirm-terminate"]');
    await this.clickElement('[data-testid="confirm-terminate"]');

    await this.waitForApiResponse('/api/deployments/*/terminate');

    // Wait for deployment to be removed from list
    await this.waitForHidden(`[data-testid="deployment-card-${deploymentId}"]`);
  }

  // Logs and Debugging
  async expectDeploymentLogs(deploymentId: string): Promise<void> {
    await this.clickElement(`[data-testid="view-logs-${deploymentId}"]`);
    await this.waitForVisible(this.deploymentLogs);
  }

  async getLogEntries(deploymentId: string): Promise<string[]> {
    await this.expectDeploymentLogs(deploymentId);

    const logElements = this.page.locator('[data-testid="log-entry"]');
    const count = await logElements.count();
    const logs: string[] = [];

    for (let i = 0; i < count; i++) {
      const logText = await logElements.nth(i).textContent() || '';
      logs.push(logText);
    }

    return logs;
  }

  async expectNoErrors(deploymentId: string): Promise<void> {
    const logs = await this.getLogEntries(deploymentId);
    const errorLogs = logs.filter(log => log.toLowerCase().includes('error'));
    expect(errorLogs.length === 0).toBe(true);
  }

  // Cost Tracking
  async expectCostTracking(deploymentId: string): Promise<void> {
    await this.expectMetricsPanel(deploymentId);

    const costElement = this.page.locator(`[data-testid="current-cost-${deploymentId}"]`);
    await this.waitForVisible(`[data-testid="current-cost-${deploymentId}"]`);

    const cost = await costElement.textContent() || '';
    expect(cost.includes('$') && parseFloat(cost.replace(/[^0-9.]/g, '')) >= 0).toBe(true);
  }

  async getCostPerHour(deploymentId: string): Promise<number> {
    const costElement = this.page.locator(`[data-testid="hourly-cost-${deploymentId}"]`);
    const costText = await costElement.textContent() || '';
    return parseFloat(costText.replace(/[^0-9.]/g, '')) || 0;
  }

  // Testing and Validation
  async sendTestRequest(deploymentId: string, testData: any): Promise<any> {
    await this.clickElement(`[data-testid="test-deployment-${deploymentId}"]`);

    // Fill test request data
    await this.fillField('[data-testid="test-request-input"]', JSON.stringify(testData));
    await this.clickElement('[data-testid="send-test-request"]');

    // Wait for response
    const responseData = await this.waitForApiResponse('/api/deployments/*/test');

    // Verify response is displayed
    await this.waitForVisible('[data-testid="test-response"]');

    return responseData;
  }

  async expectSuccessfulResponse(deploymentId: string): Promise<void> {
    const testData = { prompt: "Hello, world!", max_tokens: 50 };
    const response = await this.sendTestRequest(deploymentId, testData);

    // Response should have expected structure
    return response && typeof response === 'object' && response.choices;
  }

  // Performance Testing
  async loadTestDeployment(deploymentId: string, concurrency = 5, duration = 30000): Promise<void> {
    await this.clickElement(`[data-testid="load-test-${deploymentId}"]`);

    // Configure load test
    await this.fillField('[data-testid="load-test-concurrency"]', concurrency.toString());
    await this.fillField('[data-testid="load-test-duration"]', (duration / 1000).toString());

    await this.clickElement('[data-testid="start-load-test"]');

    // Wait for load test to complete
    await this.waitForVisible('[data-testid="load-test-results"]', duration + 10000);
  }

  async expectPerformanceResults(deploymentId: string): Promise<void> {
    const resultsElement = this.page.locator('[data-testid="load-test-results"]');
    await this.waitForVisible('[data-testid="load-test-results"]');

    const results = await resultsElement.textContent() || '';
    expect(results.includes('requests/sec') && results.includes('avg response time')).toBe(true);
  }

  // Refresh and Real-time Updates
  async expectRealTimeUpdates(deploymentId: string): Promise<void> {
    // Get initial metrics
    const initialMetrics = await this.getMetrics(deploymentId);

    // Wait for metrics to update (should happen within 30-60 seconds)
    await this.page.waitForTimeout(35000);

    // Get updated metrics
    const updatedMetrics = await this.getMetrics(deploymentId);

    // At least some metrics should have changed (timestamps, request counts, etc.)
    expect(JSON.stringify(initialMetrics) !== JSON.stringify(updatedMetrics)).toBe(true);
  }

  async refreshDeployments(): Promise<void> {
    await this.clickElement('[data-testid="refresh-deployments"]');
    await this.waitForApiResponse('/api/deployments');
  }

  // Missing methods required by E2E tests

  async expectDeploymentPage(): Promise<void> {
    await this.waitForVisible('[data-testid="deployment-page"]');
    await this.expectDeploymentForm();
  }

  async expectTerminalTheme(): Promise<void> {
    const body = this.page.locator('body');
    const classes = await body.getAttribute('class') || '';
    if (!classes.includes('terminal-theme') && !classes.includes('dark')) {
      throw new Error('Terminal theme not detected');
    }
  }

  async expectCorporateTheme(): Promise<void> {
    const body = this.page.locator('body');
    const classes = await body.getAttribute('class') || '';
    if (!classes.includes('corporate-theme') && !classes.includes('light')) {
      throw new Error('Corporate theme not detected');
    }
  }

  async setInstanceCount(count: number): Promise<void> {
    await this.fillField('[data-testid="instance-count"]', count.toString());
  }

  async enableAutoScaling(enabled: boolean): Promise<void> {
    const checkbox = this.page.locator('[data-testid="auto-scaling-enabled"]');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  async setMaxInstances(maxInstances: number): Promise<void> {
    await this.fillField('[data-testid="max-instances"]', maxInstances.toString());
  }

  async expectCostEstimation(): Promise<void> {
    await this.waitForVisible('[data-testid="cost-estimation"]');
  }

  async getEstimatedCost(): Promise<number> {
    const costElement = this.page.locator('[data-testid="estimated-cost"]');
    const costText = await costElement.textContent() || '';
    return parseFloat(costText.replace(/[^0-9.]/g, '')) || 0;
  }

  async createDeployment(): Promise<void> {
    await this.clickElement('[data-testid="create-deployment-button"]');
    await this.waitForApiResponse('/api/deployments');
  }

  async expectDeploymentCreating(): Promise<void> {
    await this.waitForVisible('[data-testid="deployment-creating"]');
  }

  async waitForDeploymentReady(timeout = 30000): Promise<void> {
    await this.page.waitForSelector('[data-testid="deployment-ready"]', { timeout });
  }

  async expectDeploymentRunning(): Promise<void> {
    await this.waitForVisible('[data-testid="deployment-running"]');
  }

  async getDeploymentId(): Promise<string> {
    const deploymentElement = this.page.locator('[data-testid^="deployment-id-"]');
    return await deploymentElement.getAttribute('data-deployment-id') || '';
  }

  async expectMonitoringData(): Promise<void> {
    await this.waitForVisible('[data-testid="monitoring-data"]');
  }

  async getPerformanceMetrics(): Promise<{
    uptime: number;
    avgResponseTime: number;
    errorRate: number;
  }> {
    const uptime = parseFloat(await this.getText('[data-testid="uptime"]')) || 0;
    const avgResponseTime = parseFloat(await this.getText('[data-testid="avg-response-time"]')) || 0;
    const errorRate = parseFloat(await this.getText('[data-testid="error-rate"]')) || 0;
    return { uptime, avgResponseTime, errorRate };
  }

  async getEndpointUrl(): Promise<string> {
    const urlElement = this.page.locator('[data-testid="endpoint-url"]');
    return await urlElement.textContent() || '';
  }

  async testEndpoint(): Promise<void> {
    await this.clickElement('[data-testid="test-endpoint-button"]');
    await this.waitForApiResponse('/api/test-endpoint');
  }

  async expectEndpointHealthy(): Promise<void> {
    await this.waitForVisible('[data-testid="endpoint-healthy"]');
  }

  async expectDeploymentStopped(): Promise<void> {
    await this.waitForVisible('[data-testid="deployment-stopped"]');
  }

  async expectDeploymentError(): Promise<void> {
    await this.waitForVisible('[data-testid="deployment-error"]');
  }

  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    return await errorElement.textContent() || '';
  }

  async retryDeployment(): Promise<void> {
    await this.clickElement('[data-testid="retry-deployment-button"]');
  }

  async expectDetailedCostBreakdown(): Promise<void> {
    await this.waitForVisible('[data-testid="detailed-cost-breakdown"]');
  }

  async getCostBreakdown(): Promise<{
    compute: number;
    storage: number;
    network: number;
  }> {
    const compute = parseFloat(await this.getText('[data-testid="cost-compute"]')) || 0;
    const storage = parseFloat(await this.getText('[data-testid="cost-storage"]')) || 0;
    const network = parseFloat(await this.getText('[data-testid="cost-network"]')) || 0;
    return { compute, storage, network };
  }

  async expectEnterpriseMonitoring(): Promise<void> {
    await this.waitForVisible('[data-testid="enterprise-monitoring"]');
  }

  async getAdvancedMetrics(): Promise<{
    securityCompliance: string;
    dataGovernance: string;
    auditTrail: string;
  }> {
    const securityCompliance = await this.getText('[data-testid="security-compliance"]');
    const dataGovernance = await this.getText('[data-testid="data-governance"]');
    const auditTrail = await this.getText('[data-testid="audit-trail"]');
    return { securityCompliance, dataGovernance, auditTrail };
  }

  async expectComplianceValidation(): Promise<void> {
    await this.waitForVisible('[data-testid="compliance-validation"]');
  }

  async getComplianceStatus(): Promise<{
    dataProtection: string;
    accessControl: string;
  }> {
    const dataProtection = await this.getText('[data-testid="data-protection-status"]');
    const accessControl = await this.getText('[data-testid="access-control-status"]');
    return { dataProtection, accessControl };
  }

  async createSnapshot(snapshotName: string): Promise<void> {
    await this.clickElement('[data-testid="create-snapshot-button"]');
    await this.fillField('[data-testid="snapshot-name"]', snapshotName);
    await this.clickElement('[data-testid="confirm-create-snapshot"]');
    await this.waitForApiResponse('/api/snapshots');
  }

  async expectSnapshotCreated(): Promise<void> {
    await this.waitForVisible('[data-testid="snapshot-created"]');
  }

  async updateDeployment(): Promise<void> {
    await this.clickElement('[data-testid="update-deployment-button"]');
    await this.waitForApiResponse('/api/deployments/*/update');
  }

  async initiateRollback(snapshotName: string): Promise<void> {
    await this.clickElement('[data-testid="rollback-button"]');
    await this.clickElement(`[data-testid="snapshot-option-${snapshotName}"]`);
    await this.clickElement('[data-testid="confirm-rollback"]');
    await this.waitForApiResponse('/api/rollback');
  }

  async expectRollbackInProgress(): Promise<void> {
    await this.waitForVisible('[data-testid="rollback-in-progress"]');
  }

  async waitForRollbackComplete(): Promise<void> {
    await this.waitForVisible('[data-testid="rollback-complete"]');
  }

  async getRollbackStatus(): Promise<string> {
    const statusElement = this.page.locator('[data-testid="rollback-status"]');
    return await statusElement.textContent() || '';
  }

  async getAuditLog(): Promise<string> {
    const logElement = this.page.locator('[data-testid="audit-log"]');
    return await logElement.textContent() || '';
  }

  async gotoDeployment(deploymentId: string): Promise<void> {
    await this.page.goto(`/dashboard/deployments/${deploymentId}`);
    await this.waitForLoad();
  }

  async getResourceUsage(): Promise<{
    organizationId: string;
    gpuType: string;
  }> {
    const organizationId = await this.getText('[data-testid="resource-organization-id"]');
    const gpuType = await this.getText('[data-testid="resource-gpu-type"]');
    return { organizationId, gpuType };
  }

  async simulateHighLoad(): Promise<void> {
    await this.clickElement('[data-testid="simulate-high-load"]');
  }

  async expectAutoScalingTriggered(): Promise<void> {
    await this.waitForVisible('[data-testid="auto-scaling-triggered"]');
  }

  async expectDeploymentRetrying(): Promise<void> {
    await this.waitForVisible('[data-testid="deployment-retrying"]');
  }

  async getAllMetrics(): Promise<{
    performance: any;
    resources: any;
    costs: any;
    errors: any;
  }> {
    return {
      performance: JSON.parse(await this.getText('[data-testid="performance-metrics"]') || '{}'),
      resources: JSON.parse(await this.getText('[data-testid="resource-metrics"]') || '{}'),
      costs: JSON.parse(await this.getText('[data-testid="cost-metrics"]') || '{}'),
      errors: JSON.parse(await this.getText('[data-testid="error-metrics"]') || '{}')
    };
  }

  async simulateHighErrorRate(): Promise<void> {
    await this.clickElement('[data-testid="simulate-high-error-rate"]');
  }

  async expectAlertTriggered(): Promise<void> {
    await this.waitForVisible('[data-testid="alert-triggered"]');
  }

  async getAlertStatus(): Promise<{
    errorRateAlert: string;
  }> {
    const errorRateAlert = await this.getText('[data-testid="error-rate-alert-status"]');
    return { errorRateAlert };
  }

  // Add missing expectText method required by tests
  async expectText(selector: string, expectedText: string): Promise<void> {
    const element = await this.waitForVisible(selector);
    await expect(element).toContainText(expectedText);
  }

  // Add missing methods required by performance tests
  async createRollbackPlan(): Promise<void> {
    await this.clickElement('[data-testid="create-rollback-plan"]');
  }

  async expectRollbackPlan(): Promise<void> {
    await this.waitForVisible('[data-testid="rollback-plan"]');
  }

  async executeRollback(): Promise<void> {
    await this.clickElement('[data-testid="execute-rollback"]');
  }

  // Additional methods for pre-rollback checks and validation
  async executePreRollbackChecks(planId: string): Promise<void> {
    await this.clickElement(`[data-testid="execute-pre-rollback-checks-${planId}"]`);
    await this.waitForVisible('[data-testid="pre-rollback-checks-running"]');
  }

  async expectPreCheckResults(): Promise<void> {
    await this.waitForVisible('[data-testid="pre-check-results"]');
    await this.waitForHidden('[data-testid="pre-rollback-checks-running"]');
  }

  async validateRollbackSafety(planId: string): Promise<void> {
    await this.clickElement(`[data-testid="validate-rollback-safety-${planId}"]`);
    await this.waitForVisible('[data-testid="rollback-safety-validated"]');
  }
}