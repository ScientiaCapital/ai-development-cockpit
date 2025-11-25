/**
 * Landing Pages E2E Tests
 * Tests for both AI Dev Cockpit and ScientiaCapital landing pages
 */

import { test, expect } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';

test.describe('Landing Pages', () => {
  test.describe('AI Dev Cockpit Landing Page', () => {
    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
      landingPage = new LandingPage(page, 'arcade');
      await landingPage.goto();
    });

    test('should display hero section correctly', async () => {
      await landingPage.expectHeroVisible();

      const title = await landingPage.getHeroTitle();
      expect(title).toContain('AI Dev Cockpit');

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
      await landingPage.expectUrl('/enterprise');
    });
  });

  test.describe('ScientiaCapital Landing Page', () => {
    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
      landingPage = new LandingPage(page, 'enterprise');
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

    test('should allow navigation to AI Dev Cockpit', async () => {
      await landingPage.navigateToOtherDomain();
      await landingPage.expectUrl('/arcade');
    });
  });

  test.describe('Cross-Domain Functionality', () => {
    test('should maintain state when switching domains', async ({ page }) => {
      // Start on AI Dev Cockpit
      const arcadePage = new LandingPage(page, 'arcade');
      await arcadePage.goto();
      await arcadePage.expectHeroVisible();

      // Navigate to ScientiaCapital
      await arcadePage.navigateToOtherDomain();

      const enterprisePage = new LandingPage(page, 'enterprise');
      await enterprisePage.expectHeroVisible();
      await enterprisePage.expectUrl('/enterprise');

      // Navigate back to AI Dev Cockpit
      await enterprisePage.navigateToOtherDomain();
      await arcadePage.expectUrl('/arcade');
    });

    test('should have different themes for each domain', async ({ page }) => {
      // Check AI Dev Cockpit theme
      const arcadePage = new LandingPage(page, 'arcade');
      await arcadePage.goto();
      await arcadePage.expectDarkTheme();

      // Check ScientiaCapital theme
      const enterprisePage = new LandingPage(page, 'enterprise');
      await enterprisePage.goto();
      await enterprisePage.expectCorporateTheme();
    });
  });
});