/**
 * Playwright Custom Matchers and Extensions
 * Provides additional assertion methods for Playwright tests
 */

import { expect, type Page, type Locator } from '@playwright/test';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T> {
      /**
       * Checks if element has the specified CSS class
       * @param className - Class name or regex pattern to match
       */
      toHaveClass(className: string | RegExp): Promise<R>;

      /**
       * Checks if element contains specified text content
       * @param text - Text content or regex pattern to match
       */
      toContainText(text: string | RegExp): Promise<R>;

      /**
       * Checks if element is visible on page
       */
      toBeVisible(): Promise<R>;

      /**
       * Checks if element has specified attribute with value
       * @param name - Attribute name
       * @param value - Expected attribute value (optional)
       */
      toHaveAttribute(name: string, value?: string | RegExp): Promise<R>;
    }
  }
}

// Extend Playwright's expect with custom matchers
expect.extend({
  async toHaveClass(
    received: Page | Locator,
    expected: string | RegExp
  ) {
    try {
      // Handle both Page and Locator types
      const element = 'locator' in received ? received : received.locator('body');

      if (typeof expected === 'string') {
        await expect(element).toHaveClass(new RegExp(expected));
      } else {
        await expect(element).toHaveClass(expected);
      }

      return {
        pass: true,
        message: () => `Expected element to have class: ${expected}`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : String(error);
      return {
        pass: false,
        message: () => `Expected element to have class: ${expected}, but it was not found. Error: ${errorMessage}`,
      };
    }
  },

  async toContainText(
    received: Page | Locator,
    expected: string | RegExp
  ) {
    try {
      const element = 'locator' in received ? received : received.locator('body');

      if (typeof expected === 'string') {
        await expect(element).toContainText(expected);
      } else {
        await expect(element).toContainText(expected);
      }

      return {
        pass: true,
        message: () => `Expected element to contain text: ${expected}`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : String(error);
      return {
        pass: false,
        message: () => `Expected element to contain text: ${expected}, but it was not found. Error: ${errorMessage}`,
      };
    }
  },

  async toBeVisible(
    received: Page | Locator
  ) {
    try {
      const element = 'locator' in received ? received : received.locator('body');
      await expect(element).toBeVisible();

      return {
        pass: true,
        message: () => 'Expected element to be visible',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : String(error);
      return {
        pass: false,
        message: () => `Expected element to be visible, but it was not. Error: ${errorMessage}`,
      };
    }
  },

  async toHaveAttribute(
    received: Page | Locator,
    name: string,
    value?: string | RegExp
  ) {
    try {
      const element = 'locator' in received ? received : received.locator('body');

      if (value !== undefined) {
        await expect(element).toHaveAttribute(name, value);
      } else {
        await expect(element).toHaveAttribute(name);
      }

      return {
        pass: true,
        message: () => `Expected element to have attribute: ${name}${value ? ` with value: ${value}` : ''}`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : String(error);
      return {
        pass: false,
        message: () => `Expected element to have attribute: ${name}${value ? ` with value: ${value}` : ''}, but it was not found. Error: ${errorMessage}`,
      };
    }
  },
});

export {};