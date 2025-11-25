/**
 * Marketplace Discovery E2E Tests
 * Comprehensive testing of marketplace model discovery functionality
 * including search, filtering, organization switching, and dual-theme validation
 */

import { test, expect } from '@playwright/test';
import { MarketplacePage } from '../page-objects/MarketplacePage';

test.describe('Marketplace Model Discovery', () => {
  let marketplacePage: MarketplacePage;

  test.beforeEach(async ({ page }) => {
    marketplacePage = new MarketplacePage(page);
    await marketplacePage.goto();
  });

  test.describe('Basic Marketplace Functionality', () => {
    test('should display marketplace correctly', async () => {
      await marketplacePage.expectMarketplaceVisible();
      await marketplacePage.expectModelGrid();
    });

    test('should load models and display them', async ({ page }) => {
      // Mock HuggingFace API response
      await page.route('**/api/models*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'microsoft/DialoGPT-medium',
                title: 'DialoGPT Medium',
                description: 'A conversational AI model for dialogue generation',
                parameters: '355M',
                tags: ['conversational', 'dialogue', 'chatbot'],
                organization: 'arcade'
              },
              {
                id: 'gpt2-large',
                title: 'GPT-2 Large',
                description: 'Large-scale language model for text generation',
                parameters: '774M',
                tags: ['language-model', 'text-generation'],
                organization: 'arcade'
              },
              {
                id: 'bert-base-uncased',
                title: 'BERT Base',
                description: 'Bidirectional transformer for language understanding',
                parameters: '110M',
                tags: ['bert', 'understanding', 'nlp'],
                organization: 'arcade'
              }
            ],
            total: 3,
            page: 1,
            totalPages: 1
          })
        });
      });

      await marketplacePage.expectModelsVisible();

      const modelCount = await marketplacePage.getModelCount();
      expect(modelCount).toBe(3);
    });

    test('should load quickly', async () => {
      await marketplacePage.expectFastLoad();
    });

    test('should be accessible', async () => {
      await marketplacePage.expectAccessibility();
    });

    test('should render consistently across browsers', async () => {
      await marketplacePage.expectConsistentRendering();
    });

    test('should support responsive design', async () => {
      await marketplacePage.expectResponsiveDesign();
    });
  });

  test.describe('Model Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Mock search API responses
      await page.route('**/api/models*search=dialog*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'microsoft/DialoGPT-medium',
                title: 'DialoGPT Medium',
                description: 'A conversational AI model for dialogue generation',
                parameters: '355M',
                tags: ['conversational', 'dialogue', 'chatbot'],
                organization: 'arcade'
              }
            ],
            total: 1,
            page: 1,
            totalPages: 1
          })
        });
      });

      await page.route('**/api/models*search=gpt*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'microsoft/DialoGPT-medium',
                title: 'DialoGPT Medium',
                description: 'A conversational AI model for dialogue generation',
                parameters: '355M',
                tags: ['conversational', 'dialogue', 'chatbot'],
                organization: 'arcade'
              },
              {
                id: 'gpt2-large',
                title: 'GPT-2 Large',
                description: 'Large-scale language model for text generation',
                parameters: '774M',
                tags: ['language-model', 'text-generation'],
                organization: 'arcade'
              }
            ],
            total: 2,
            page: 1,
            totalPages: 1
          })
        });
      });
    });

    test('should search models by keyword', async () => {
      await marketplacePage.searchModels('dialog');
      await marketplacePage.expectSearchResults(1);

      const query = await marketplacePage.getSearchQuery();
      expect(query).toBe('dialog');
    });

    test('should return multiple results for broader search', async () => {
      await marketplacePage.searchModels('gpt');
      await marketplacePage.expectSearchResults(2);
    });

    test('should handle empty search results', async ({ page }) => {
      await page.route('**/api/models*search=nonexistent*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [],
            total: 0,
            page: 1,
            totalPages: 0
          })
        });
      });

      await marketplacePage.searchModels('nonexistent');
      await marketplacePage.expectEmptyState();
    });

    test('should clear search and restore all models', async ({ page }) => {
      // Mock full model list after clearing search
      await page.route('**/api/models', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'microsoft/DialoGPT-medium',
                title: 'DialoGPT Medium',
                description: 'A conversational AI model for dialogue generation',
                parameters: '355M',
                tags: ['conversational', 'dialogue', 'chatbot'],
                organization: 'arcade'
              },
              {
                id: 'gpt2-large',
                title: 'GPT-2 Large',
                description: 'Large-scale language model for text generation',
                parameters: '774M',
                tags: ['language-model', 'text-generation'],
                organization: 'arcade'
              },
              {
                id: 'bert-base-uncased',
                title: 'BERT Base',
                description: 'Bidirectional transformer for language understanding',
                parameters: '110M',
                tags: ['bert', 'understanding', 'nlp'],
                organization: 'arcade'
              }
            ],
            total: 3,
            page: 1,
            totalPages: 1
          })
        });
      });

      await marketplacePage.searchModels('dialog');
      await marketplacePage.expectSearchResults(1);

      await marketplacePage.clearSearch();
      await marketplacePage.expectSearchResults(3);
    });

    test('should handle search API errors gracefully', async ({ page }) => {
      await page.route('**/api/models*search=error*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Search service temporarily unavailable'
          })
        });
      });

      await marketplacePage.searchModels('error');
      await marketplacePage.expectErrorMessage('Search service temporarily unavailable');
    });
  });

  test.describe('Organization Switching', () => {
    test.beforeEach(async ({ page }) => {
      // Mock AI Dev Cockpit models
      await page.route('**/api/models*org=arcade*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'arcade/gaming-chatbot',
                title: 'Gaming Chatbot Pro',
                description: 'Advanced gaming-focused conversational AI',
                parameters: '1.5B',
                tags: ['gaming', 'chatbot', 'entertainment'],
                organization: 'arcade'
              },
              {
                id: 'arcade/code-assistant',
                title: 'Code Assistant',
                description: 'AI-powered coding assistant for developers',
                parameters: '7B',
                tags: ['coding', 'development', 'assistant'],
                organization: 'arcade'
              }
            ],
            total: 2,
            page: 1,
            totalPages: 1
          })
        });
      });

      // Mock ScientiaCapital models
      await page.route('**/api/models*org=scientia*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'scientia/financial-analyzer',
                title: 'Financial Analyzer Pro',
                description: 'Enterprise-grade financial data analysis model',
                parameters: '13B',
                tags: ['finance', 'analysis', 'enterprise'],
                organization: 'enterprise'
              },
              {
                id: 'scientia/risk-assessment',
                title: 'Risk Assessment AI',
                description: 'Advanced risk evaluation and compliance model',
                parameters: '30B',
                tags: ['risk', 'compliance', 'enterprise'],
                organization: 'enterprise'
              },
              {
                id: 'scientia/market-intelligence',
                title: 'Market Intelligence',
                description: 'Comprehensive market analysis and forecasting',
                parameters: '70B',
                tags: ['market', 'intelligence', 'forecasting'],
                organization: 'enterprise'
              }
            ],
            total: 3,
            page: 1,
            totalPages: 1
          })
        });
      });
    });

    test('should switch to AI Dev Cockpit organization', async () => {
      await marketplacePage.selectOrganization('arcade');
      await marketplacePage.expectOrganization('arcade');
      await marketplacePage.expectSearchResults(2);
    });

    test('should switch to ScientiaCapital organization', async () => {
      await marketplacePage.selectOrganization('enterprise');
      await marketplacePage.expectOrganization('enterprise');
      await marketplacePage.expectSearchResults(3);
    });

    test('should maintain search state during organization switch', async ({ page }) => {
      // Mock search results for both organizations
      await page.route('**/api/models*org=arcade*search=assistant*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [{
              id: 'arcade/code-assistant',
              title: 'Code Assistant',
              description: 'AI-powered coding assistant for developers',
              parameters: '7B',
              tags: ['coding', 'development', 'assistant'],
              organization: 'arcade'
            }],
            total: 1,
            page: 1,
            totalPages: 1
          })
        });
      });

      await page.route('**/api/models*org=scientia*search=assistant*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [],
            total: 0,
            page: 1,
            totalPages: 0
          })
        });
      });

      // Search first
      await marketplacePage.searchModels('assistant');
      const initialQuery = await marketplacePage.getSearchQuery();
      expect(initialQuery).toBe('assistant');

      // Switch organization
      await marketplacePage.selectOrganization('arcade');
      await marketplacePage.expectSearchResults(1);

      // Verify search query is maintained
      const maintainedQuery = await marketplacePage.getSearchQuery();
      expect(maintainedQuery).toBe('assistant');

      // Switch to scientia (should show empty results for same search)
      await marketplacePage.selectOrganization('enterprise');
      await marketplacePage.expectEmptyState();
    });

    test('should display correct models for each organization', async () => {
      // Check AI Dev Cockpit models
      await marketplacePage.selectOrganization('arcade');
      await marketplacePage.expectSearchResults(2);

      const firstModelId = await marketplacePage.selectFirstModel();
      expect(firstModelId).toContain('arcade');

      // Navigate back to marketplace
      await marketplacePage.goto();

      // Check ScientiaCapital models
      await marketplacePage.selectOrganization('enterprise');
      await marketplacePage.expectSearchResults(3);

      const scientiaModelId = await marketplacePage.selectFirstModel();
      expect(scientiaModelId).toContain('enterprise');
    });
  });

  test.describe('Dual Theme Support', () => {
    test('should apply AI Dev Cockpit terminal theme', async ({ page }) => {
      // Mock page with AI Dev Cockpit theme
      await page.addInitScript(() => {
        document.body.className = 'terminal-theme dark';
      });

      await page.route('**/api/models*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [],
            total: 0,
            organization: 'arcade'
          })
        });
      });

      await marketplacePage.selectOrganization('arcade');
      await marketplacePage.expectAI Dev CockpitTheme();
    });

    test('should apply ScientiaCapital corporate theme', async ({ page }) => {
      // Mock page with ScientiaCapital theme
      await page.addInitScript(() => {
        document.body.className = 'corporate-theme light';
      });

      await page.route('**/api/models*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [],
            total: 0,
            organization: 'enterprise'
          })
        });
      });

      await marketplacePage.selectOrganization('enterprise');
      await marketplacePage.expectScientiaCapitalTheme();
    });

    test('should validate dual theme support automatically', async ({ page }) => {
      // This test would validate theme switching based on organization
      await page.addInitScript(() => {
        // Mock theme switching logic
        window.switchTheme = (org) => {
          if (org === 'arcade') {
            document.body.className = 'terminal-theme dark';
          } else if (org === 'enterprise') {
            document.body.className = 'corporate-theme light';
          }
        };
      });

      await marketplacePage.expectDualThemeSupport();
    });
  });

  test.describe('Model Interaction', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/models*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'test-model-001',
                title: 'Test Model Alpha',
                description: 'A comprehensive test model for validation',
                parameters: '7B',
                tags: ['test', 'validation', 'alpha'],
                organization: 'arcade'
              }
            ],
            total: 1,
            page: 1,
            totalPages: 1
          })
        });
      });
    });

    test('should select and view model details', async () => {
      await marketplacePage.expectModelsVisible();

      const modelId = await marketplacePage.selectFirstModel();
      expect(modelId).toBe('test-model-001');

      const details = await marketplacePage.getModelDetails(modelId);
      expect(details.title).toBe('Test Model Alpha');
      expect(details.description).toContain('comprehensive test model');
      expect(details.parameters).toBe('7B');
      expect(details.tags).toContain('test');
    });

    test('should deploy model from marketplace', async ({ page }) => {
      await page.route('**/deploy*', route => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div data-testid="deployment-form">Deploy Form</div>'
        });
      });

      await marketplacePage.expectModelsVisible();
      const modelId = await marketplacePage.selectFirstModel();

      await marketplacePage.deployModel(modelId);
      // Should navigate to deployment page
      expect(page.url()).toMatch(/.*\/deploy.*/);
    });

    test('should favorite and unfavorite models', async ({ page }) => {
      await page.route('**/api/models/*/favorite', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, favorited: true })
        });
      });

      await marketplacePage.expectModelsVisible();
      const modelId = await marketplacePage.selectFirstModel();

      await marketplacePage.favoriteModel(modelId);
      await marketplacePage.expectModelFavorited(modelId);
    });
  });

  test.describe('Filtering and Sorting', () => {
    test.beforeEach(async ({ page }) => {
      // Mock filtered results
      await page.route('**/api/models*category=language-model*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'gpt2-large',
                title: 'GPT-2 Large',
                description: 'Large-scale language model',
                parameters: '774M',
                tags: ['language-model'],
                organization: 'arcade'
              }
            ],
            total: 1,
            page: 1,
            totalPages: 1
          })
        });
      });

      await page.route('**/api/models*sort=popularity*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [
              {
                id: 'popular-model',
                title: 'Most Popular Model',
                description: 'The most downloaded model',
                parameters: '1B',
                tags: ['popular'],
                organization: 'arcade'
              }
            ],
            total: 1,
            page: 1,
            totalPages: 1
          })
        });
      });
    });

    test('should filter models by category', async () => {
      await marketplacePage.filterByCategory('language-model');
      await marketplacePage.expectSearchResults(1);
    });

    test('should sort models by popularity', async () => {
      await marketplacePage.sortModels('popularity');
      await marketplacePage.expectSearchResults(1);

      const modelId = await marketplacePage.selectFirstModel();
      expect(modelId).toBe('popular-model');
    });

    test('should filter by parameter count', async ({ page }) => {
      await page.route('**/api/models*minParams=1000*maxParams=2000*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [{
              id: 'medium-model',
              title: 'Medium Size Model',
              description: 'A model in the specified parameter range',
              parameters: '1.5B',
              tags: ['medium'],
              organization: 'arcade'
            }],
            total: 1,
            page: 1,
            totalPages: 1
          })
        });
      });

      await marketplacePage.filterByParameters('1000', '2000');
      await marketplacePage.expectSearchResults(1);
    });
  });

  test.describe('Pagination', () => {
    test.beforeEach(async ({ page }) => {
      // Mock paginated results
      await page.route('**/api/models*page=1*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: Array.from({ length: 10 }, (_, i) => ({
              id: `model-page1-${i}`,
              title: `Model ${i + 1}`,
              description: `Description for model ${i + 1}`,
              parameters: '1B',
              tags: ['page1'],
              organization: 'arcade'
            })),
            total: 25,
            page: 1,
            totalPages: 3
          })
        });
      });

      await page.route('**/api/models*page=2*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: Array.from({ length: 10 }, (_, i) => ({
              id: `model-page2-${i}`,
              title: `Model ${i + 11}`,
              description: `Description for model ${i + 11}`,
              parameters: '1B',
              tags: ['page2'],
              organization: 'arcade'
            })),
            total: 25,
            page: 2,
            totalPages: 3
          })
        });
      });
    });

    test('should navigate to next page', async () => {
      await marketplacePage.expectPaginationVisible();

      const initialPage = await marketplacePage.getCurrentPage();
      expect(initialPage).toBe(1);

      await marketplacePage.goToNextPage();

      const newPage = await marketplacePage.getCurrentPage();
      expect(newPage).toBe(2);
    });

    test('should navigate to previous page', async () => {
      // Start on page 2
      await marketplacePage.goToNextPage();

      const secondPage = await marketplacePage.getCurrentPage();
      expect(secondPage).toBe(2);

      await marketplacePage.goToPrevPage();

      const backToFirst = await marketplacePage.getCurrentPage();
      expect(backToFirst).toBe(1);
    });
  });

  test.describe('Real-time Updates and Performance', () => {
    test('should handle real-time updates', async () => {
      await marketplacePage.expectRealTimeUpdates();
    });

    test('should refresh models manually', async ({ page }) => {
      await page.route('**/api/models*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [{
              id: 'refreshed-model',
              title: 'Newly Added Model',
              description: 'A model added after refresh',
              parameters: '3B',
              tags: ['new'],
              organization: 'arcade'
            }],
            total: 1,
            page: 1,
            totalPages: 1
          })
        });
      });

      await marketplacePage.refreshModels();
      await marketplacePage.expectSearchResults(1);

      const modelId = await marketplacePage.selectFirstModel();
      expect(modelId).toBe('refreshed-model');
    });

    test('should handle concurrent operations', async () => {
      // Test multiple operations happening simultaneously
      const searchPromise = marketplacePage.searchModels('test');
      const orgSwitchPromise = marketplacePage.selectOrganization('arcade');

      await Promise.all([searchPromise, orgSwitchPromise]);

      // Should handle gracefully without conflicts
      await marketplacePage.expectModelGrid();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle API failures gracefully', async ({ page }) => {
      await page.route('**/api/models*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'HuggingFace API temporarily unavailable'
          })
        });
      });

      await marketplacePage.goto();
      await marketplacePage.expectErrorMessage('HuggingFace API temporarily unavailable');
    });

    test('should handle network timeouts', async ({ page }) => {
      await page.route('**/api/models*', route => {
        // Simulate timeout by not responding
        // route.abort('failed');
      });

      await marketplacePage.goto();
      // Should show loading state or timeout message
      await marketplacePage.expectLoadingState();
    });

    test('should handle empty marketplace gracefully', async ({ page }) => {
      await page.route('**/api/models*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            models: [],
            total: 0,
            page: 1,
            totalPages: 0
          })
        });
      });

      await marketplacePage.goto();
      await marketplacePage.expectEmptyState();
    });

    test('should validate data integrity', async () => {
      await marketplacePage.expectModelsVisible();

      const modelCount = await marketplacePage.getModelCount();
      if (modelCount > 0) {
        const modelId = await marketplacePage.selectFirstModel();
        const details = await marketplacePage.getModelDetails(modelId);

        // Validate all required fields are present
        expect(details.title).toBeTruthy();
        expect(details.description).toBeTruthy();
        expect(details.parameters).toBeTruthy();
        expect(Array.isArray(details.tags)).toBe(true);
      }
    });
  });
});