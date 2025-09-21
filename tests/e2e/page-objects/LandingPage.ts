/**
 * Landing Page Object Model
 * Page object for both SwaggyStacks and ScientiaCapital landing pages
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  // Selectors
  private readonly heroSection = '[data-testid="hero-section"]';
  private readonly heroTitle = '[data-testid="hero-title"]';
  private readonly heroDescription = '[data-testid="hero-description"]';
  private readonly ctaButton = '[data-testid="cta-button"]';
  private readonly featuresSection = '[data-testid="features-section"]';
  private readonly authLinks = '[data-testid="auth-links"]';
  private readonly themeToggle = '[data-testid="theme-toggle"]';
  private readonly navigationMenu = '[data-testid="navigation"]';

  // SwaggyStacks specific
  private readonly terminalDemo = '[data-testid="terminal-demo"]';
  private readonly codingFeatures = '[data-testid="coding-features"]';
  private readonly developerCta = '[data-testid="developer-cta"]';

  // ScientiaCapital specific
  private readonly roiCalculator = '[data-testid="roi-calculator"]';
  private readonly enterpriseFeatures = '[data-testid="enterprise-features"]';
  private readonly executiveCta = '[data-testid="executive-cta"]';

  constructor(page: Page, private domain: 'swaggystacks' | 'scientia') {
    super(page);
  }

  async goto(): Promise<void> {
    const path = this.domain === 'swaggystacks' ? '/swaggystacks' : '/scientia';
    await this.page.goto(path);
    await this.waitForLoad();
  }

  // Hero Section
  async getHeroTitle(): Promise<string> {
    return await this.getText(this.heroTitle);
  }

  async getHeroDescription(): Promise<string> {
    return await this.getText(this.heroDescription);
  }

  async clickCTA(): Promise<void> {
    await this.clickElement(this.ctaButton);
  }

  async expectHeroVisible(): Promise<void> {
    await this.waitForVisible(this.heroSection);
    await this.waitForVisible(this.heroTitle);
    await this.waitForVisible(this.heroDescription);
    await this.waitForVisible(this.ctaButton);
  }

  // Navigation
  async clickAuthLink(type: 'login' | 'signup'): Promise<void> {
    const selector = `[data-testid="${type}-link"]`;
    await this.clickElement(selector);
  }

  async expectNavigationVisible(): Promise<void> {
    await this.waitForVisible(this.navigationMenu);
  }

  // Features Section
  async expectFeaturesVisible(): Promise<void> {
    await this.waitForVisible(this.featuresSection);
  }

  async getFeatureCount(): Promise<number> {
    const features = this.page.locator('[data-testid^="feature-"]');
    return await features.count();
  }

  async getFeatureText(index: number): Promise<string> {
    const feature = this.page.locator(`[data-testid="feature-${index}"]`);
    return await feature.textContent() || '';
  }

  // SwaggyStacks Specific Methods
  async expectTerminalDemo(): Promise<void> {
    if (this.domain === 'swaggystacks') {
      await this.waitForVisible(this.terminalDemo);
    }
  }

  async expectCodingFeatures(): Promise<void> {
    if (this.domain === 'swaggystacks') {
      await this.waitForVisible(this.codingFeatures);
    }
  }

  async clickDeveloperCTA(): Promise<void> {
    if (this.domain === 'swaggystacks') {
      await this.clickElement(this.developerCta);
    }
  }

  async expectDarkTheme(): Promise<void> {
    if (this.domain === 'swaggystacks') {
      const body = this.page.locator('body');
      const classes = await body.getAttribute('class') || '';
      expect(classes.includes('dark') || classes.includes('terminal')).toBe(true);
    }
  }

  // ScientiaCapital Specific Methods
  async expectRoiCalculator(): Promise<void> {
    if (this.domain === 'scientia') {
      await this.waitForVisible(this.roiCalculator);
    }
  }

  async expectEnterpriseFeatures(): Promise<void> {
    if (this.domain === 'scientia') {
      await this.waitForVisible(this.enterpriseFeatures);
    }
  }

  async clickExecutiveCTA(): Promise<void> {
    if (this.domain === 'scientia') {
      await this.clickElement(this.executiveCta);
    }
  }

  async expectCorporateTheme(): Promise<void> {
    if (this.domain === 'scientia') {
      const body = this.page.locator('body');
      const classes = await body.getAttribute('class') || '';
      expect(classes.includes('corporate') || classes.includes('professional')).toBe(true);
    }
  }

  // ROI Calculator (ScientiaCapital)
  async fillRoiInput(field: 'team-size' | 'hours-saved' | 'hourly-rate', value: string): Promise<void> {
    if (this.domain === 'scientia') {
      const selector = `[data-testid="roi-${field}"]`;
      await this.fillField(selector, value);
    }
  }

  async calculateRoi(): Promise<void> {
    if (this.domain === 'scientia') {
      await this.clickElement('[data-testid="calculate-roi"]');
    }
  }

  async getRoiResult(): Promise<string> {
    if (this.domain === 'scientia') {
      return await this.getText('[data-testid="roi-result"]');
    }
    return '';
  }

  // Terminal Demo (SwaggyStacks)
  async expectTerminalAnimation(): Promise<void> {
    if (this.domain === 'swaggystacks') {
      const terminalText = this.page.locator('[data-testid="terminal-text"]');
      await this.waitForVisible('[data-testid="terminal-text"]');

      // Wait for typing animation to complete
      await this.page.waitForTimeout(3000);

      const text = await terminalText.textContent();
      expect(text && text.length > 0).toBe(true);
    }
  }

  async clickTerminalCommand(command: string): Promise<void> {
    if (this.domain === 'swaggystacks') {
      const selector = `[data-testid="terminal-command-${command}"]`;
      await this.clickElement(selector);
    }
  }

  // Theme and Styling
  async expectConsistentStyling(): Promise<void> {
    // Check that all major components have consistent styling
    const components = [
      this.heroSection,
      this.featuresSection,
      this.ctaButton,
      this.navigationMenu
    ];

    for (const component of components) {
      await this.waitForVisible(component);

      // Verify component has proper styling classes
      const element = this.page.locator(component);
      const classes = await element.getAttribute('class') || '';

      if (this.domain === 'swaggystacks') {
        // Should have terminal/dark theme classes
        expect(classes.includes('terminal') || classes.includes('dark')).toBe(true);
      } else {
        // Should have corporate/professional theme classes
        expect(classes.includes('corporate') || classes.includes('professional')).toBe(true);
      }
    }
  }

  // Performance and Accessibility
  async expectFastLoad(): Promise<void> {
    const startTime = Date.now();
    await this.waitForLoad();
    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime < 3000).toBe(true);
  }

  async expectAccessibility(): Promise<void> {
    // Check for basic accessibility features
    await this.waitForVisible('[role="main"]');
    await this.waitForVisible('[role="navigation"]');

    // Check for proper heading structure
    const h1 = this.page.locator('h1');
    expect(await h1.count() >= 1).toBe(true);
  }

  // Cross-domain functionality
  async navigateToOtherDomain(): Promise<void> {
    const targetPath = this.domain === 'swaggystacks' ? '/scientia' : '/swaggystacks';
    await this.page.goto(targetPath);
    await this.waitForLoad();
  }
}