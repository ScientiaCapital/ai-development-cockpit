/**
 * Landing Pages E2E Tests
 * Tests for both SwaggyStacks and ScientiaCapital landing pages
 */

import { test, expect } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';

test.describe('Landing Pages', () => {
  test.describe('SwaggyStacks Landing Page', () => {
    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
      landingPage = new LandingPage(page, 'swaggystacks');
      await landingPage.goto();
    });

    test('should display hero section correctly', async () => {
      await landingPage.expectHeroVisible();

      const title = await landingPage.getHeroTitle();
      expect(title).toContain('SwaggyStacks');

      const description = await landingPage.getHeroDescription();
      expect(description.length).toBeGreaterThan(10);
    });

    test('should have working navigation', async () => {
      await landingPage.expectNavigationVisible();
    });

    test('should display terminal demo', async () => {
      await landingPage.expectTerminalDemo();
      await landingPage.expectTerminalAnimation();
    });

    test('should have dark/terminal theme', async () => {
      await landingPage.expectDarkTheme();
      await landingPage.expectConsistentStyling();
    });

    test('should display coding features', async () => {
      await landingPage.expectCodingFeatures();

      const featureCount = await landingPage.getFeatureCount();
      expect(featureCount).toBeGreaterThan(2);
    });

    test('should have working CTA button', async () => {
      await landingPage.clickCTA();
      // Should navigate to marketplace or auth
      await landingPage.expectUrl(/\/(marketplace|auth|dashboard)/);
    });

    test('should load quickly', async () => {
      await landingPage.expectFastLoad();
    });

    test('should be accessible', async () => {
      await landingPage.expectAccessibility();
    });

    test('should allow navigation to ScientiaCapital', async () => {
      await landingPage.navigateToOtherDomain();
      await landingPage.expectUrl('/scientia');
    });
  });

  test.describe('ScientiaCapital Landing Page', () => {
    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
      landingPage = new LandingPage(page, 'scientia');
      await landingPage.goto();
    });

    test('should display hero section correctly', async () => {
      await landingPage.expectHeroVisible();

      const title = await landingPage.getHeroTitle();
      expect(title).toContain('Scientia');

      const description = await landingPage.getHeroDescription();
      expect(description.length).toBeGreaterThan(10);
    });

    test('should have working navigation', async () => {
      await landingPage.expectNavigationVisible();
    });

    test('should display ROI calculator', async () => {
      await landingPage.expectRoiCalculator();
    });

    test('should have corporate theme', async () => {
      await landingPage.expectCorporateTheme();
      await landingPage.expectConsistentStyling();
    });

    test('should display enterprise features', async () => {
      await landingPage.expectEnterpriseFeatures();

      const featureCount = await landingPage.getFeatureCount();
      expect(featureCount).toBeGreaterThan(2);
    });

    test('should have working ROI calculator', async () => {
      await landingPage.fillRoiInput('team-size', '10');
      await landingPage.fillRoiInput('hours-saved', '2');
      await landingPage.fillRoiInput('hourly-rate', '100');

      await landingPage.calculateRoi();

      const result = await landingPage.getRoiResult();
      expect(result).toContain('$');
    });

    test('should have working executive CTA', async () => {
      await landingPage.clickExecutiveCTA();
      // Should navigate to enterprise contact or auth
      await landingPage.expectUrl(/\/(contact|auth|dashboard)/);
    });

    test('should load quickly', async () => {
      await landingPage.expectFastLoad();
    });

    test('should be accessible', async () => {
      await landingPage.expectAccessibility();
    });

    test('should allow navigation to SwaggyStacks', async () => {
      await landingPage.navigateToOtherDomain();
      await landingPage.expectUrl('/swaggystacks');
    });
  });

  test.describe('Cross-Domain Functionality', () => {
    test('should maintain state when switching domains', async ({ page }) => {
      // Start on SwaggyStacks
      const swaggyPage = new LandingPage(page, 'swaggystacks');
      await swaggyPage.goto();
      await swaggyPage.expectHeroVisible();

      // Navigate to ScientiaCapital
      await swaggyPage.navigateToOtherDomain();

      const scientiaPage = new LandingPage(page, 'scientia');
      await scientiaPage.expectHeroVisible();
      await scientiaPage.expectUrl('/scientia');

      // Navigate back to SwaggyStacks
      await scientiaPage.navigateToOtherDomain();
      await swaggyPage.expectUrl('/swaggystacks');
    });

    test('should have different themes for each domain', async ({ page }) => {
      // Check SwaggyStacks theme
      const swaggyPage = new LandingPage(page, 'swaggystacks');
      await swaggyPage.goto();
      await swaggyPage.expectDarkTheme();

      // Check ScientiaCapital theme
      const scientiaPage = new LandingPage(page, 'scientia');
      await scientiaPage.goto();
      await scientiaPage.expectCorporateTheme();
    });
  });
});