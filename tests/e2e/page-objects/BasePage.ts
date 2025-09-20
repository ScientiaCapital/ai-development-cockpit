/**
 * Base Page Object Model
 * Common functionality and patterns for all page objects
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string, timeout = 5000): Promise<Locator> {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible({ timeout });
    return element;
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string, timeout = 5000): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toBeHidden({ timeout });
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string): Promise<void> {
    const field = await this.waitForVisible(selector);
    await field.clear();
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }

  /**
   * Click element with wait
   */
  async clickElement(selector: string): Promise<void> {
    const element = await this.waitForVisible(selector);
    await element.click();
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string): Promise<void> {
    const select = await this.waitForVisible(selector);
    await select.selectOption(value);
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    const fileInput = await this.waitForVisible(selector);
    await fileInput.setInputFiles(filePath);
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout = 10000): Promise<any> {
    const response = await this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string'
          ? url.includes(urlPattern)
          : urlPattern.test(url);
      },
      { timeout }
    );

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Check loading state
   */
  async expectLoading(selector: string): Promise<void> {
    await this.waitForVisible(selector);
  }

  /**
   * Check error state
   */
  async expectError(message?: string): Promise<void> {
    const errorElement = await this.waitForVisible('[data-testid*="error"]');

    if (message) {
      await expect(errorElement).toContainText(message);
    }
  }

  /**
   * Check success state
   */
  async expectSuccess(message?: string): Promise<void> {
    const successElement = await this.waitForVisible('[data-testid*="success"]');

    if (message) {
      await expect(successElement).toContainText(message);
    }
  }

  /**
   * Verify page URL
   */
  async expectUrl(pattern: string | RegExp): Promise<void> {
    if (typeof pattern === 'string') {
      expect(this.page.url()).toContain(pattern);
    } else {
      expect(this.page.url()).toMatch(pattern);
    }
  }

  /**
   * Verify page title
   */
  async expectTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Hover over element
   */
  async hover(selector: string): Promise<void> {
    const element = await this.waitForVisible(selector);
    await element.hover();
  }

  /**
   * Check if element exists
   */
  async hasElement(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Get element text
   */
  async getText(selector: string): Promise<string> {
    const element = await this.waitForVisible(selector);
    return await element.textContent() || '';
  }

  /**
   * Get element attribute
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = await this.waitForVisible(selector);
    return await element.getAttribute(attribute);
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(urlPattern?: string | RegExp): Promise<void> {
    if (urlPattern) {
      await this.page.waitForURL(urlPattern);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string | RegExp, response: any): Promise<void> {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Clear all mocks
   */
  async clearMocks(): Promise<void> {
    await this.page.unrouteAll();
  }
}