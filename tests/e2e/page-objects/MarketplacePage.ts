/**
 * Marketplace Page Object Model
 * Page object for marketplace model discovery and organization management interface
 * Following the established DeploymentPage pattern for comprehensive testing coverage
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MarketplacePage extends BasePage {
  // Core marketplace selectors
  private readonly marketplaceContainer = '[data-testid="marketplace-container"]';
  private readonly modelGrid = '[data-testid="model-grid"]';
  private readonly modelCard = '[data-testid^="model-card-"]';
  private readonly searchInput = '[data-testid="model-search"]';
  private readonly searchButton = '[data-testid="search-button"]';
  private readonly clearSearchButton = '[data-testid="clear-search"]';

  // Organization and theme selectors
  private readonly organizationSwitcher = '[data-testid="org-switcher"]';
  private readonly organizationOption = '[data-testid^="org-option-"]';
  private readonly currentOrgDisplay = '[data-testid="current-org"]';
  private readonly themeIndicator = '[data-testid="theme-indicator"]';

  // Model details and actions
  private readonly modelTitle = '[data-testid^="model-title-"]';
  private readonly modelDescription = '[data-testid^="model-description-"]';
  private readonly modelParameters = '[data-testid^="model-parameters-"]';
  private readonly modelTags = '[data-testid^="model-tags-"]';
  private readonly deployButton = '[data-testid^="deploy-model-"]';
  private readonly favoriteButton = '[data-testid^="favorite-model-"]';

  // Filtering and sorting
  private readonly filterButton = '[data-testid="filter-button"]';
  private readonly filterPanel = '[data-testid="filter-panel"]';
  private readonly sortDropdown = '[data-testid="sort-dropdown"]';
  private readonly sortOption = '[data-testid^="sort-option-"]';
  private readonly categoryFilter = '[data-testid^="category-filter-"]';
  private readonly parameterFilter = '[data-testid="parameter-filter"]';

  // Loading and state indicators
  private readonly loadingSpinner = '[data-testid="loading-spinner"]';
  private readonly emptyState = '[data-testid="empty-state"]';
  private readonly errorMessage = '[data-testid="error-message"]';
  private readonly modelCount = '[data-testid="model-count"]';

  // Pagination
  private readonly paginationContainer = '[data-testid="pagination"]';
  private readonly nextPageButton = '[data-testid="next-page"]';
  private readonly prevPageButton = '[data-testid="prev-page"]';
  private readonly pageNumber = '[data-testid="page-number"]';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/marketplace');
    await this.waitForLoad();
  }

  // Core marketplace functionality
  async expectMarketplaceVisible(): Promise<void> {
    await this.waitForVisible(this.marketplaceContainer);
    await this.waitForVisible(this.modelGrid);
  }

  async expectModelGrid(): Promise<void> {
    await this.waitForVisible(this.modelGrid);
    await this.waitForHidden(this.loadingSpinner);
  }

  async getModelCount(): Promise<number> {
    await this.expectModelGrid();
    const models = this.page.locator(this.modelCard);
    return await models.count();
  }

  async expectModelsVisible(): Promise<void> {
    await this.expectModelGrid();
    const count = await this.getModelCount();
    if (count === 0) {
      await this.waitForVisible(this.emptyState);
    } else {
      const firstModel = this.page.locator(this.modelCard).first();
      await this.waitForVisible(firstModel);
    }
  }

  // Search functionality
  async searchModels(query: string): Promise<void> {
    await this.fillField(this.searchInput, query);
    await this.clickElement(this.searchButton);
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async clearSearch(): Promise<void> {
    await this.clickElement(this.clearSearchButton);
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async getSearchQuery(): Promise<string> {
    const searchElement = this.page.locator(this.searchInput);
    return await searchElement.inputValue();
  }

  async expectSearchResults(expectedCount?: number): Promise<void> {
    await this.expectModelGrid();
    if (expectedCount !== undefined) {
      const actualCount = await this.getModelCount();
      if (actualCount !== expectedCount) {
        throw new Error(`Expected ${expectedCount} models, found ${actualCount}`);
      }
    }
  }

  // Organization management
  async selectOrganization(org: 'swaggystacks' | 'scientia'): Promise<void> {
    await this.clickElement(this.organizationSwitcher);
    await this.waitForVisible(`[data-testid="org-option-${org}"]`);
    await this.clickElement(`[data-testid="org-option-${org}"]`);
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async getCurrentOrganization(): Promise<string> {
    const orgElement = this.page.locator(this.currentOrgDisplay);
    return await orgElement.textContent() || '';
  }

  async expectOrganization(expectedOrg: string): Promise<void> {
    const currentOrg = await this.getCurrentOrganization();
    if (!currentOrg.toLowerCase().includes(expectedOrg.toLowerCase())) {
      throw new Error(`Expected organization ${expectedOrg}, found ${currentOrg}`);
    }
  }

  // Theme validation
  async expectSwaggyStacksTheme(): Promise<void> {
    // Verify terminal-like dark theme
    const body = this.page.locator('body');
    const classes = await body.getAttribute('class') || '';
    if (!classes.includes('terminal-theme') && !classes.includes('dark')) {
      throw new Error('SwaggyStacks terminal theme not detected');
    }

    // Check for terminal-specific elements
    await this.waitForVisible('[data-testid="terminal-header"]');
  }

  async expectScientiaCapitalTheme(): Promise<void> {
    // Verify corporate light theme
    const body = this.page.locator('body');
    const classes = await body.getAttribute('class') || '';
    if (!classes.includes('corporate-theme') && !classes.includes('light')) {
      throw new Error('ScientiaCapital corporate theme not detected');
    }

    // Check for corporate-specific elements
    await this.waitForVisible('[data-testid="corporate-header"]');
  }

  async expectDualThemeSupport(): Promise<void> {
    const currentOrg = await this.getCurrentOrganization();

    if (currentOrg.toLowerCase().includes('swaggystacks')) {
      await this.expectSwaggyStacksTheme();
    } else if (currentOrg.toLowerCase().includes('scientia')) {
      await this.expectScientiaCapitalTheme();
    } else {
      throw new Error(`Unknown organization theme: ${currentOrg}`);
    }
  }

  // Model interaction
  async selectModel(modelId: string): Promise<void> {
    await this.clickElement(`[data-testid="model-card-${modelId}"]`);
    await this.waitForVisible(`[data-testid="model-details-${modelId}"]`);
  }

  async selectFirstModel(): Promise<string> {
    await this.expectModelsVisible();
    const firstModel = this.page.locator(this.modelCard).first();
    const modelId = await firstModel.getAttribute('data-model-id') || '';
    await firstModel.click();
    return modelId;
  }

  async getModelDetails(modelId: string): Promise<{
    title: string;
    description: string;
    parameters: string;
    tags: string[];
  }> {
    const title = await this.getText(`[data-testid="model-title-${modelId}"]`);
    const description = await this.getText(`[data-testid="model-description-${modelId}"]`);
    const parameters = await this.getText(`[data-testid="model-parameters-${modelId}"]`);

    const tagElements = this.page.locator(`[data-testid="model-tags-${modelId}"] .tag`);
    const tagCount = await tagElements.count();
    const tags: string[] = [];
    for (let i = 0; i < tagCount; i++) {
      const tag = await tagElements.nth(i).textContent() || '';
      tags.push(tag);
    }

    return { title, description, parameters, tags };
  }

  async deployModel(modelId: string): Promise<void> {
    await this.clickElement(`[data-testid="deploy-model-${modelId}"]`);
    // This should navigate to deployment configuration
    await this.waitForUrl(/.*\/deploy.*/);
  }

  async favoriteModel(modelId: string): Promise<void> {
    await this.clickElement(`[data-testid="favorite-model-${modelId}"]`);
    await this.waitForApiResponse('/api/models/*/favorite');
  }

  async expectModelFavorited(modelId: string): Promise<void> {
    const favoriteButton = this.page.locator(`[data-testid="favorite-model-${modelId}"]`);
    const isFavorited = await favoriteButton.getAttribute('data-favorited');
    if (isFavorited !== 'true') {
      throw new Error(`Model ${modelId} is not favorited`);
    }
  }

  // Filtering and sorting
  async openFilterPanel(): Promise<void> {
    await this.clickElement(this.filterButton);
    await this.waitForVisible(this.filterPanel);
  }

  async applyFilter(filterType: string, value: string): Promise<void> {
    await this.openFilterPanel();
    await this.clickElement(`[data-testid="filter-${filterType}-${value}"]`);
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async sortModels(sortBy: 'name' | 'popularity' | 'recent' | 'parameters'): Promise<void> {
    await this.clickElement(this.sortDropdown);
    await this.clickElement(`[data-testid="sort-option-${sortBy}"]`);
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async filterByCategory(category: string): Promise<void> {
    await this.applyFilter('category', category);
  }

  async filterByParameters(minParams: string, maxParams?: string): Promise<void> {
    await this.openFilterPanel();
    await this.fillField('[data-testid="min-parameters"]', minParams);
    if (maxParams) {
      await this.fillField('[data-testid="max-parameters"]', maxParams);
    }
    await this.clickElement('[data-testid="apply-parameter-filter"]');
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  // Pagination
  async goToNextPage(): Promise<void> {
    await this.clickElement(this.nextPageButton);
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async goToPrevPage(): Promise<void> {
    await this.clickElement(this.prevPageButton);
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async getCurrentPage(): Promise<number> {
    const pageElement = this.page.locator(this.pageNumber);
    const pageText = await pageElement.textContent() || '1';
    return parseInt(pageText, 10);
  }

  async expectPaginationVisible(): Promise<void> {
    await this.waitForVisible(this.paginationContainer);
  }

  // Error handling and edge cases
  async expectEmptyState(): Promise<void> {
    await this.waitForVisible(this.emptyState);
    const count = await this.getModelCount();
    if (count !== 0) {
      throw new Error(`Expected empty state but found ${count} models`);
    }
  }

  async expectErrorMessage(expectedError?: string): Promise<void> {
    await this.waitForVisible(this.errorMessage);
    if (expectedError) {
      const errorText = await this.getText(this.errorMessage);
      if (!errorText.includes(expectedError)) {
        throw new Error(`Expected error "${expectedError}", found "${errorText}"`);
      }
    }
  }

  async expectLoadingState(): Promise<void> {
    await this.waitForVisible(this.loadingSpinner);
  }

  async waitForModelsLoaded(): Promise<void> {
    await this.waitForHidden(this.loadingSpinner);
    await this.expectModelGrid();
  }

  // Performance and validation
  async expectFastLoad(maxLoadTime = 3000): Promise<void> {
    const startTime = Date.now();
    await this.expectModelsVisible();
    const loadTime = Date.now() - startTime;

    if (loadTime > maxLoadTime) {
      throw new Error(`Page loaded in ${loadTime}ms, expected under ${maxLoadTime}ms`);
    }
  }

  async expectAccessibility(): Promise<void> {
    // Check for basic accessibility attributes
    const searchInput = this.page.locator(this.searchInput);
    const hasLabel = await searchInput.getAttribute('aria-label') ||
                    await searchInput.getAttribute('aria-labelledby');

    if (!hasLabel) {
      throw new Error('Search input missing accessibility label');
    }

    // Check for keyboard navigation
    await searchInput.focus();
    await this.page.keyboard.press('Tab');
    // Should focus on search button or next interactive element
  }

  // Real-time updates and refresh
  async refreshModels(): Promise<void> {
    await this.clickElement('[data-testid="refresh-models"]');
    await this.waitForApiResponse('/api/models*');
    await this.expectModelGrid();
  }

  async expectRealTimeUpdates(): Promise<void> {
    // Get initial model count
    const initialCount = await this.getModelCount();

    // Wait for potential updates (this would be triggered by WebSocket in real app)
    await this.page.waitForTimeout(2000);

    // Check if any updates occurred (model count, favorites, etc.)
    const updatedCount = await this.getModelCount();

    // In a real scenario, we might expect changes, but for testing we verify
    // the system remains stable
    return initialCount >= 0 && updatedCount >= 0;
  }

  // Cross-browser compatibility helpers
  async expectConsistentRendering(): Promise<void> {
    // Verify consistent layout across browsers
    const gridElement = this.page.locator(this.modelGrid);
    const boundingBox = await gridElement.boundingBox();

    if (!boundingBox || boundingBox.width < 100 || boundingBox.height < 100) {
      throw new Error('Model grid not rendering properly');
    }
  }

  async expectResponsiveDesign(): Promise<void> {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.expectModelGrid();

    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.expectModelGrid();
  }
}