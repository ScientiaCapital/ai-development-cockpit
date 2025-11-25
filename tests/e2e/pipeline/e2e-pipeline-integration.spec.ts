/**
 * End-to-End Pipeline Integration Tests
 * Validates complete flow: Model Discovery → Deployment Configuration → RunPod Infrastructure → Production Endpoints
 * Tests the entire deployment pipeline across both AI Dev Cockpit and ScientiaCapital organizations
 */

import { test, expect } from '@playwright/test';
import { MarketplacePage } from '../page-objects/MarketplacePage';
import { DeploymentPage } from '../page-objects/DeploymentPage';
import { TestApiClient } from '../utils/TestApiClient';

test.describe('Complete E2E Pipeline Integration', () => {
  let marketplacePage: MarketplacePage;
  let deploymentPage: DeploymentPage;
  let apiClient: TestApiClient;

  test.beforeEach(async ({ page }) => {
    marketplacePage = new MarketplacePage(page);
    deploymentPage = new DeploymentPage(page);
    apiClient = new TestApiClient(page, { mode: 'mock' }); // Start with mock for reliability

    // Setup mock APIs for consistent testing
    await apiClient.setupMockHuggingFaceApi();
    await apiClient.setupMockRunPodApi();
  });

  test.afterEach(async () => {
    await apiClient.cleanup();
  });

  test.describe('AI Dev Cockpit Developer Workflow', () => {
    test('should complete full deployment pipeline for gaming model', async () => {
      // Step 1: Model Discovery
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');
      await marketplacePage.expectAI Dev CockpitTheme();

      // Search for gaming model
      await marketplacePage.searchModels('gaming');
      await marketplacePage.expectSearchResults();

      const modelCount = await marketplacePage.getModelCount();
      expect(modelCount).toBeGreaterThan(0);

      // Select the gaming chatbot model
      const selectedModelId = await marketplacePage.selectFirstModel();
      expect(selectedModelId).toContain('gaming-chatbot');

      // Step 2: Deploy Model
      await marketplacePage.deployModel(selectedModelId);

      // Should navigate to deployment configuration
      await deploymentPage.expectDeploymentPage();
      await deploymentPage.expectTerminalTheme(); // Should maintain AI Dev Cockpit theme

      // Step 3: Configure Deployment
      await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
      await deploymentPage.setInstanceCount(2);
      await deploymentPage.enableAutoScaling(true);

      // Verify cost estimation appears
      await deploymentPage.expectCostEstimation();
      const estimatedCost = await deploymentPage.getEstimatedCost();
      expect(estimatedCost).toBeGreaterThan(0);

      // Step 4: Create Deployment
      await deploymentPage.createDeployment();
      await deploymentPage.expectDeploymentCreating();

      // Wait for deployment to be ready
      await deploymentPage.waitForDeploymentReady(30000);
      await deploymentPage.expectDeploymentRunning();

      // Step 5: Validate Deployment
      const deploymentId = await deploymentPage.getDeploymentId();
      expect(deploymentId).toBeTruthy();

      // Verify monitoring data is available
      await deploymentPage.expectMonitoringData();
      const performance = await deploymentPage.getPerformanceMetrics();
      expect(performance.uptime).toBeGreaterThanOrEqual(0);
      expect(performance.avgResponseTime).toBeGreaterThan(0);

      // Step 6: Test Model Endpoint
      const endpointUrl = await deploymentPage.getEndpointUrl();
      expect(endpointUrl).toMatch(/^https?:\/\//);

      // Verify endpoint is accessible
      await deploymentPage.testEndpoint();
      await deploymentPage.expectEndpointHealthy();

      // Step 7: Cleanup
      await deploymentPage.stopDeployment(deploymentId);
      await deploymentPage.expectDeploymentStopped();
    });

    test('should handle deployment failures gracefully in gaming environment', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      // Select a model for deployment
      await marketplacePage.searchModels('terminal-gpt');
      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      await deploymentPage.expectDeploymentPage();

      // Configure deployment with invalid settings to trigger failure
      await deploymentPage.selectGpuType('INVALID_GPU_TYPE');
      await deploymentPage.setInstanceCount(100); // Unrealistic count

      await deploymentPage.createDeployment();

      // Should handle failure gracefully
      await deploymentPage.expectDeploymentError();
      const errorMessage = await deploymentPage.getErrorMessage();
      expect(errorMessage).toContain('deployment failed');

      // Should allow retry
      await deploymentPage.retryDeployment();
      await deploymentPage.expectDeploymentForm();
    });

    test('should validate terminal theme consistency throughout pipeline', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      // Verify terminal theme in marketplace
      await marketplacePage.expectAI Dev CockpitTheme();

      // Navigate to deployment
      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      // Verify terminal theme is maintained in deployment
      await deploymentPage.expectTerminalTheme();

      // Create deployment and verify theme in monitoring
      await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      // Terminal theme should persist in monitoring dashboard
      await deploymentPage.expectTerminalTheme();
    });
  });

  test.describe('ScientiaCapital Enterprise Workflow', () => {
    test('should complete enterprise deployment pipeline for financial model', async () => {
      // Step 1: Model Discovery with Corporate Theme
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');
      await marketplacePage.expectScientiaCapitalTheme();

      // Search for financial analysis model
      await marketplacePage.searchModels('financial');
      await marketplacePage.expectSearchResults();

      const modelCount = await marketplacePage.getModelCount();
      expect(modelCount).toBeGreaterThan(0);

      // Select enterprise financial model
      const selectedModelId = await marketplacePage.selectFirstModel();
      expect(selectedModelId).toContain('financial-analyzer');

      // Step 2: Enterprise Deployment Configuration
      await marketplacePage.deployModel(selectedModelId);
      await deploymentPage.expectDeploymentPage();
      await deploymentPage.expectCorporateTheme(); // Should maintain ScientiaCapital theme

      // Configure for enterprise use
      await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB'); // High-end GPU for enterprise
      await deploymentPage.setInstanceCount(4); // Enterprise scale
      await deploymentPage.enableAutoScaling(true);
      await deploymentPage.setMaxInstances(10);

      // Step 3: Cost Analysis and Approval
      await deploymentPage.expectCostEstimation();
      const estimatedCost = await deploymentPage.getEstimatedCost();
      expect(estimatedCost).toBeGreaterThan(5); // Enterprise models cost more

      // Verify cost breakdown is detailed for enterprise
      await deploymentPage.expectDetailedCostBreakdown();
      const costBreakdown = await deploymentPage.getCostBreakdown();
      expect(costBreakdown.compute).toBeDefined();
      expect(costBreakdown.storage).toBeDefined();
      expect(costBreakdown.network).toBeDefined();

      // Step 4: Create Enterprise Deployment
      await deploymentPage.createDeployment();
      await deploymentPage.expectDeploymentCreating();

      // Enterprise deployments may take longer
      await deploymentPage.waitForDeploymentReady(60000);
      await deploymentPage.expectDeploymentRunning();

      // Step 5: Enterprise Monitoring Validation
      await deploymentPage.expectEnterpriseMonitoring();
      const metrics = await deploymentPage.getAdvancedMetrics();
      expect(metrics.securityCompliance).toBeDefined();
      expect(metrics.dataGovernance).toBeDefined();
      expect(metrics.auditTrail).toBeDefined();

      // Step 6: Compliance and Security Checks
      await deploymentPage.expectComplianceValidation();
      const complianceStatus = await deploymentPage.getComplianceStatus();
      expect(complianceStatus.dataProtection).toBe('compliant');
      expect(complianceStatus.accessControl).toBe('compliant');

      // Step 7: Performance Validation
      const performance = await deploymentPage.getPerformanceMetrics();
      expect(performance.uptime).toBeGreaterThan(99.0); // Enterprise SLA requirement
      expect(performance.avgResponseTime).toBeLessThan(500); // Performance requirement

      // Step 8: Controlled Shutdown
      const deploymentId = await deploymentPage.getDeploymentId();
      await deploymentPage.stopDeployment(deploymentId);
      await deploymentPage.expectDeploymentStopped();
    });

    test('should validate enterprise-grade rollback capabilities', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');

      // Deploy compliance monitor model
      await marketplacePage.searchModels('compliance');
      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      await deploymentPage.expectDeploymentPage();
      await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      // Create snapshot for rollback testing
      await deploymentPage.createSnapshot('pre-update-snapshot');
      await deploymentPage.expectSnapshotCreated();

      // Simulate deployment update that fails
      await deploymentPage.updateDeployment();
      await deploymentPage.expectDeploymentError();

      // Execute rollback
      await deploymentPage.initiateRollback('pre-update-snapshot');
      await deploymentPage.expectRollbackInProgress();
      await deploymentPage.waitForRollbackComplete();

      // Verify rollback success
      await deploymentPage.expectDeploymentRunning();
      const rollbackStatus = await deploymentPage.getRollbackStatus();
      expect(rollbackStatus).toBe('successful');

      // Verify audit trail is maintained
      const auditLog = await deploymentPage.getAuditLog();
      expect(auditLog).toContain('rollback completed');
      expect(auditLog).toContain('pre-update-snapshot');
    });

    test('should maintain corporate theme throughout enterprise pipeline', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');

      // Verify corporate theme in marketplace
      await marketplacePage.expectScientiaCapitalTheme();

      // Navigate through deployment pipeline
      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      // Verify corporate theme in deployment
      await deploymentPage.expectCorporateTheme();

      // Create deployment and verify theme in monitoring
      await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      // Corporate theme should persist throughout
      await deploymentPage.expectCorporateTheme();
    });
  });

  test.describe('Cross-Organization Pipeline Validation', () => {
    test('should handle organization switching during active deployments', async () => {
      // Start with AI Dev Cockpit deployment
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      const arcadeModelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(arcadeModelId);
      await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      const swaggyDeploymentId = await deploymentPage.getDeploymentId();

      // Switch to ScientiaCapital and create another deployment
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');

      const scientiaModelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(scientiaModelId);
      await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      const scientiaDeploymentId = await deploymentPage.getDeploymentId();

      // Verify both deployments are independent
      expect(swaggyDeploymentId).not.toBe(scientiaDeploymentId);

      // Switch back to AI Dev Cockpit and verify deployment is still running
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');
      await deploymentPage.gotoDeployment(swaggyDeploymentId);
      await deploymentPage.expectDeploymentRunning();

      // Cleanup both deployments
      await deploymentPage.stopDeployment(swaggyDeploymentId);
      await marketplacePage.selectOrganization('enterprise');
      await deploymentPage.gotoDeployment(scientiaDeploymentId);
      await deploymentPage.stopDeployment(scientiaDeploymentId);
    });

    test('should validate resource isolation between organizations', async () => {
      // Deploy model in AI Dev Cockpit
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      const arcadeModelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(arcadeModelId);
      await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      const swaggyResources = await deploymentPage.getResourceUsage();

      // Deploy model in ScientiaCapital
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');

      const scientiaModelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(scientiaModelId);
      await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      const scientiaResources = await deploymentPage.getResourceUsage();

      // Verify resource isolation
      expect(swaggyResources.organizationId).toBe('arcade');
      expect(scientiaResources.organizationId).toBe('enterprise');
      expect(swaggyResources.gpuType).not.toBe(scientiaResources.gpuType);

      // Cleanup
      const scientiaDeploymentId = await deploymentPage.getDeploymentId();
      await deploymentPage.stopDeployment(scientiaDeploymentId);
      await marketplacePage.selectOrganization('arcade');
      const swaggyDeploymentId = await deploymentPage.getDeploymentId();
      await deploymentPage.stopDeployment(swaggyDeploymentId);
    });
  });

  test.describe('Performance and Reliability Pipeline Tests', () => {
    test('should handle high-load deployment scenarios', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      // Select high-performance model
      await marketplacePage.searchModels('code-assistant');
      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);

      // Configure for high load
      await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
      await deploymentPage.setInstanceCount(8); // High instance count
      await deploymentPage.enableAutoScaling(true);
      await deploymentPage.setMaxInstances(20);

      // Create deployment and monitor performance under load
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      // Simulate load testing
      await deploymentPage.simulateHighLoad();
      await deploymentPage.expectAutoScalingTriggered();

      // Verify system handles load gracefully
      const metrics = await deploymentPage.getPerformanceMetrics();
      expect(metrics.errorRate).toBeLessThan(1.0); // Less than 1% error rate
      expect(metrics.avgResponseTime).toBeLessThan(2000); // Under 2 seconds

      const deploymentId = await deploymentPage.getDeploymentId();
      await deploymentPage.stopDeployment(deploymentId);
    });

    test('should validate deployment pipeline resilience', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('enterprise');

      // Test deployment resilience with network interruptions
      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);
      await deploymentPage.selectGpuType('NVIDIA_A100_SXM4_80GB');

      // Simulate network issues during deployment
      await apiClient.simulateApiError('/api/deployments', 'timeout');
      await deploymentPage.createDeployment();

      // Should handle timeout gracefully
      await deploymentPage.expectDeploymentRetrying();

      // Clear error simulation and allow success
      await apiClient.cleanup();
      await apiClient.setupMockRunPodApi();

      // Deployment should eventually succeed
      await deploymentPage.waitForDeploymentReady(60000);
      await deploymentPage.expectDeploymentRunning();

      const deploymentId = await deploymentPage.getDeploymentId();
      await deploymentPage.stopDeployment(deploymentId);
    });

    test('should validate complete monitoring and alerting pipeline', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('arcade');

      const modelId = await marketplacePage.selectFirstModel();
      await marketplacePage.deployModel(modelId);
      await deploymentPage.selectGpuType('NVIDIA_RTX_A6000');
      await deploymentPage.createDeployment();
      await deploymentPage.waitForDeploymentReady();

      // Verify monitoring metrics are collected
      await deploymentPage.expectMonitoringData();
      const metrics = await deploymentPage.getAllMetrics();

      // Validate metric completeness
      expect(metrics.performance).toBeDefined();
      expect(metrics.resources).toBeDefined();
      expect(metrics.costs).toBeDefined();
      expect(metrics.errors).toBeDefined();

      // Test alerting by simulating threshold breach
      await deploymentPage.simulateHighErrorRate();
      await deploymentPage.expectAlertTriggered();

      const alertStatus = await deploymentPage.getAlertStatus();
      expect(alertStatus.errorRateAlert).toBe('active');

      const deploymentId = await deploymentPage.getDeploymentId();
      await deploymentPage.stopDeployment(deploymentId);
    });
  });

  test.describe('Real API Integration Pipeline', () => {
    test('should run complete pipeline with real APIs when available', async () => {
      // Switch to real API mode if tokens are available
      const realApiClient = new TestApiClient(marketplacePage.page, { mode: 'real' });

      if (await realApiClient.skipIfNoRealApiAccess('Real API pipeline test')) {
        test.skip();
        return;
      }

      await realApiClient.setupRealApiMode();

      try {
        // Run abbreviated real API pipeline test
        await marketplacePage.goto();
        await marketplacePage.selectOrganization('arcade');
        await marketplacePage.waitForModelsLoaded();

        const modelCount = await marketplacePage.getModelCount();
        if (modelCount > 0) {
          const modelId = await marketplacePage.selectFirstModel();
          expect(modelId).toMatch(/^arcade\//);

          // Note: Don't actually deploy with real API in tests
          // Just validate the deployment configuration flow
          await marketplacePage.deployModel(modelId);
          await deploymentPage.expectDeploymentPage();
          await deploymentPage.expectDeploymentForm();
        }
      } finally {
        await realApiClient.cleanup();
      }
    });
  });
});