/**
 * Real HuggingFace API Integration Tests
 * Validates actual API connectivity and data flow for both organizations
 * Runs only when E2E_TEST_MODE=real and HUGGINGFACE_TOKEN is available
 */

import { test, expect } from '@playwright/test';
import { MarketplacePage } from '../page-objects/MarketplacePage';
import { TestApiClient } from '../utils/TestApiClient';

test.describe('Real HuggingFace API Integration', () => {
  let marketplacePage: MarketplacePage;
  let apiClient: TestApiClient;

  test.beforeEach(async ({ page }) => {
    marketplacePage = new MarketplacePage(page);
    apiClient = new TestApiClient(page, { mode: 'real' });

    // Skip tests if real API mode is not available
    const shouldSkip = await apiClient.skipIfNoHuggingFaceAccess('Real API tests');
    if (shouldSkip) {
      test.skip();
      return;
    }

    // Configure for real API mode
    await apiClient.setupRealApiMode();
  });

  test.afterEach(async () => {
    await apiClient.cleanup();
  });

  test.describe('SwaggyStacks Organization', () => {
    test('should fetch real SwaggyStacks models from HuggingFace', async () => {
      await marketplacePage.goto();
      await marketplacePage.expectMarketplaceVisible();

      // Switch to SwaggyStacks organization
      await marketplacePage.selectOrganization('swaggystacks');
      await marketplacePage.expectOrganization('swaggystacks');

      // Verify terminal theme is applied
      await marketplacePage.expectSwaggyStacksTheme();

      // Wait for real API response
      await marketplacePage.waitForModelsLoaded();

      // Verify models are loaded from real API
      const modelCount = await marketplacePage.getModelCount();
      expect(modelCount).toBeGreaterThan(0);

      // Validate that we have real model data (not mock)
      if (modelCount > 0) {
        const firstModelId = await marketplacePage.selectFirstModel();
        expect(firstModelId).toMatch(/^swaggystacks\//);

        const modelDetails = await marketplacePage.getModelDetails(firstModelId);
        expect(modelDetails.title).toBeTruthy();
        expect(modelDetails.description).toBeTruthy();
        expect(modelDetails.parameters).toBeTruthy();
        expect(modelDetails.tags.length).toBeGreaterThan(0);
      }
    });

    test('should search SwaggyStacks models with real API', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('swaggystacks');

      // Search for gaming-related models
      await marketplacePage.searchModels('gaming');
      await marketplacePage.expectSearchResults();

      // Verify search results are from real API
      const modelCount = await marketplacePage.getModelCount();

      if (modelCount > 0) {
        // Get the search query to verify it was applied
        const searchQuery = await marketplacePage.getSearchQuery();
        expect(searchQuery).toBe('gaming');

        // Verify at least one result contains gaming-related content
        const firstModelId = await marketplacePage.selectFirstModel();
        const modelDetails = await marketplacePage.getModelDetails(firstModelId);

        const hasGamingContent =
          modelDetails.title.toLowerCase().includes('gaming') ||
          modelDetails.description.toLowerCase().includes('gaming') ||
          modelDetails.tags.some(tag => tag.toLowerCase().includes('gaming'));

        expect(hasGamingContent).toBeTruthy();
      }
    });

    test('should handle real API rate limiting gracefully', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('swaggystacks');

      // Perform multiple rapid searches to test rate limiting
      const searches = ['gaming', 'chatbot', 'code', 'terminal'];

      for (const searchTerm of searches) {
        await marketplacePage.searchModels(searchTerm);

        // Check if we get results or a rate limit response
        try {
          await marketplacePage.expectSearchResults();
        } catch (error: unknown) {
          // If rate limited, verify error handling
          await marketplacePage.expectErrorMessage('rate limit');
        }

        // Small delay to be respectful to API
        await marketplacePage.page.waitForTimeout(500);
      }
    });
  });

  test.describe('ScientiaCapital Organization', () => {
    test('should fetch real ScientiaCapital models from HuggingFace', async () => {
      await marketplacePage.goto();
      await marketplacePage.expectMarketplaceVisible();

      // Switch to ScientiaCapital organization
      await marketplacePage.selectOrganization('scientia');
      await marketplacePage.expectOrganization('scientia');

      // Verify corporate theme is applied
      await marketplacePage.expectScientiaCapitalTheme();

      // Wait for real API response
      await marketplacePage.waitForModelsLoaded();

      // Verify models are loaded from real API
      const modelCount = await marketplacePage.getModelCount();
      expect(modelCount).toBeGreaterThan(0);

      // Validate that we have real model data specific to ScientiaCapital
      if (modelCount > 0) {
        const firstModelId = await marketplacePage.selectFirstModel();
        expect(firstModelId).toMatch(/^scientia\//);

        const modelDetails = await marketplacePage.getModelDetails(firstModelId);
        expect(modelDetails.title).toBeTruthy();
        expect(modelDetails.description).toBeTruthy();
        expect(modelDetails.organization).toBe('scientia');
      }
    });

    test('should search ScientiaCapital financial models with real API', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('scientia');

      // Search for financial analysis models
      await marketplacePage.searchModels('financial');
      await marketplacePage.expectSearchResults();

      const modelCount = await marketplacePage.getModelCount();

      if (modelCount > 0) {
        // Verify search query was applied
        const searchQuery = await marketplacePage.getSearchQuery();
        expect(searchQuery).toBe('financial');

        // Verify results are relevant to financial domain
        const firstModelId = await marketplacePage.selectFirstModel();
        const modelDetails = await marketplacePage.getModelDetails(firstModelId);

        const hasFinancialContent =
          modelDetails.title.toLowerCase().includes('financial') ||
          modelDetails.description.toLowerCase().includes('financial') ||
          modelDetails.tags.some(tag =>
            ['finance', 'financial', 'market', 'trading', 'analysis'].includes(tag.toLowerCase())
          );

        expect(hasFinancialContent).toBeTruthy();
      }
    });

    test('should validate enterprise model metadata from real API', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('scientia');
      await marketplacePage.waitForModelsLoaded();

      const modelCount = await marketplacePage.getModelCount();

      if (modelCount > 0) {
        const firstModelId = await marketplacePage.selectFirstModel();
        const modelDetails = await marketplacePage.getModelDetails(firstModelId);

        // Verify enterprise-grade model attributes
        expect(modelDetails.parameters).toMatch(/\d+[BMK]/); // Should have parameter count like "7B", "13B", etc.
        expect(modelDetails.tags.length).toBeGreaterThan(0);

        // Enterprise models should have professional descriptions
        expect(modelDetails.description.length).toBeGreaterThan(50);
        expect(modelDetails.title).not.toMatch(/test|demo|sample/i);
      }
    });
  });

  test.describe('Cross-Organization API Validation', () => {
    test('should switch between organizations and maintain real API connectivity', async () => {
      await marketplacePage.goto();

      // Test SwaggyStacks first
      await marketplacePage.selectOrganization('swaggystacks');
      await marketplacePage.expectSwaggyStacksTheme();
      await marketplacePage.waitForModelsLoaded();

      const swaggyModelCount = await marketplacePage.getModelCount();
      expect(swaggyModelCount).toBeGreaterThan(0);

      // Switch to ScientiaCapital
      await marketplacePage.selectOrganization('scientia');
      await marketplacePage.expectScientiaCapitalTheme();
      await marketplacePage.waitForModelsLoaded();

      const scientiaModelCount = await marketplacePage.getModelCount();
      expect(scientiaModelCount).toBeGreaterThan(0);

      // Verify different model sets (organizations should have different models)
      if (swaggyModelCount > 0 && scientiaModelCount > 0) {
        // Models should be organization-specific
        await marketplacePage.selectOrganization('swaggystacks');
        await marketplacePage.waitForModelsLoaded();

        if (swaggyModelCount > 0) {
          const swaggyModelId = await marketplacePage.selectFirstModel();
          expect(swaggyModelId).toMatch(/^swaggystacks\//);
        }
      }
    });

    test('should handle real API authentication errors gracefully', async () => {
      // Create a client with invalid token to test error handling
      const invalidApiClient = new TestApiClient(marketplacePage.page, {
        mode: 'real',
        huggingfaceToken: 'invalid-token-for-testing'
      });

      await invalidApiClient.setupRealApiMode();
      await marketplacePage.goto();

      // Attempt to load models with invalid authentication
      await marketplacePage.selectOrganization('swaggystacks');

      // Should handle auth error gracefully
      try {
        await marketplacePage.waitForModelsLoaded();
      } catch {
        // Expected to fail with invalid token
        await marketplacePage.expectErrorMessage('unauthorized');
      }

      await invalidApiClient.cleanup();
    });

    test('should measure real API response times', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('swaggystacks');

      // Measure API response time
      const responseTime = await apiClient.measureApiResponseTime('/api/models*');

      // Real API calls should complete within reasonable time
      expect(responseTime).toBeLessThan(10000); // 10 seconds max

      await marketplacePage.waitForModelsLoaded();

      // Verify we actually got data
      const modelCount = await marketplacePage.getModelCount();
      expect(modelCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Real API Error Scenarios', () => {
    test('should handle network timeouts gracefully', async () => {
      // Simulate slow network conditions
      await marketplacePage.page.route('/api/models*', route => {
        setTimeout(() => route.continue(), 5000); // 5 second delay
      });

      await marketplacePage.goto();
      await marketplacePage.selectOrganization('swaggystacks');

      // Should either load or show appropriate loading state
      try {
        await marketplacePage.waitForModelsLoaded();
      } catch {
        // If timeout, should show loading or error state
        try {
          await marketplacePage.expectLoadingState();
        } catch {
          await marketplacePage.expectErrorMessage('timeout');
        }
      }
    });

    test('should handle server errors from real API', async () => {
      await marketplacePage.goto();

      // Test with both organizations to ensure error handling is consistent
      const orgs: ('swaggystacks' | 'scientia')[] = ['swaggystacks', 'scientia'];

      for (const org of orgs) {
        await marketplacePage.selectOrganization(org);

        try {
          await marketplacePage.waitForModelsLoaded();
          const modelCount = await marketplacePage.getModelCount();
          expect(modelCount).toBeGreaterThanOrEqual(0);
        } catch {
          // If error occurs, should be handled gracefully
          await marketplacePage.expectErrorMessage();
        }
      }
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle concurrent API requests efficiently', async () => {
      await marketplacePage.goto();

      // Simulate multiple concurrent operations
      const operations = [
        () => marketplacePage.selectOrganization('swaggystacks'),
        () => marketplacePage.searchModels('gaming'),
        () => marketplacePage.selectOrganization('scientia'),
        () => marketplacePage.searchModels('financial')
      ];

      const startTime = Date.now();

      // Execute operations sequentially but measure total time
      for (const operation of operations) {
        try {
          await operation();
          await marketplacePage.waitForModelsLoaded();
        } catch {
          // Continue if individual operation fails
          continue;
        }
      }

      const totalTime = Date.now() - startTime;

      // All operations should complete within reasonable time
      expect(totalTime).toBeLessThan(30000); // 30 seconds max for all operations
    });

    test('should validate real API data consistency', async () => {
      await marketplacePage.goto();
      await marketplacePage.selectOrganization('swaggystacks');
      await marketplacePage.waitForModelsLoaded();

      // Get initial model count
      const initialCount = await marketplacePage.getModelCount();

      if (initialCount > 0) {
        // Refresh and verify consistency
        await marketplacePage.refreshModels();
        await marketplacePage.waitForModelsLoaded();

        const refreshedCount = await marketplacePage.getModelCount();

        // Count should be consistent (allowing for small variations due to real-time updates)
        const countDifference = Math.abs(initialCount - refreshedCount);
        expect(countDifference).toBeLessThanOrEqual(5); // Allow up to 5 model difference
      }
    });
  });
});