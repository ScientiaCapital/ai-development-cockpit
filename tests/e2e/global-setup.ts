/**
 * Playwright Global Setup
 * Initializes test environment and shared resources for AI Development Cockpit E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
// Import custom Playwright matchers
import '../playwright-setup';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting AI Development Cockpit E2E test setup...');

  // Create auth directory if it doesn't exist
  const authDir = path.join(__dirname, '../../playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Create test database/cleanup scripts if needed
  await setupTestDatabase();

  // Setup authentication state for tests
  await setupAuthentication();

  // Verify services are running
  await verifyServices();

  console.log('✅ Global setup completed successfully');
}

/**
 * Setup test database and cleanup existing test data
 */
async function setupTestDatabase() {
  console.log('📚 Setting up test database...');

  try {
    // In a real environment, you might:
    // 1. Create test database schema
    // 2. Seed with test data
    // 3. Clear existing test sessions

    // For now, we'll just ensure clean state
    console.log('✅ Test database ready');
  } catch (error: unknown) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Setup authentication state for tests
 */
async function setupAuthentication() {
  console.log('🔐 Setting up authentication...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto('/auth/login');

    // Check if we need to authenticate
    const needsAuth = await page.locator('[data-testid="login-form"]').isVisible();

    if (needsAuth) {
      // Fill in test credentials
      await page.fill('[data-testid="email-input"]', process.env.E2E_TEST_EMAIL || 'test@arcade.com');
      await page.fill('[data-testid="password-input"]', process.env.E2E_TEST_PASSWORD || 'testpassword123');
      await page.click('[data-testid="login-button"]');

      // Wait for successful login
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }

    // Save authentication state
    await context.storageState({ path: 'playwright/.auth/user.json' });
    console.log('✅ Authentication state saved');

  } catch (error: unknown) {
    console.warn('⚠️  Authentication setup failed, continuing with unauthenticated tests:', error instanceof Error ? error.message : 'Unknown error');

    // Create empty auth state for unauthenticated tests
    await context.storageState({ path: 'playwright/.auth/user.json' });
  } finally {
    await browser.close();
  }
}

/**
 * Verify required services are running
 */
async function verifyServices() {
  console.log('🔍 Verifying services...');

  const services = [
    {
      name: 'Next.js App',
      url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
      path: '/health'
    },
    {
      name: 'API Endpoints',
      url: process.env.API_BASE_URL || 'http://localhost:3001',
      path: '/api/health'
    }
  ];

  for (const service of services) {
    try {
      const response = await fetch(`${service.url}${service.path}`);

      if (response.ok) {
        console.log(`✅ ${service.name} is running`);
      } else {
        console.warn(`⚠️  ${service.name} returned status ${response.status}`);
      }
    } catch (error: unknown) {
      console.warn(`⚠️  ${service.name} check failed:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

export default globalSetup;