/**
 * Playwright Authentication Setup
 * Pre-authenticates users for tests requiring authentication
 */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication for E2E tests...');

  // Navigate to the login page
  await page.goto('/auth/login');

  // Check if already authenticated by looking for dashboard redirect
  try {
    await page.waitForURL('**/dashboard', { timeout: 2000 });
    console.log('✅ Already authenticated, saving current state');
    await page.context().storageState({ path: authFile });
    return;
  } catch {
    // Not authenticated, proceed with login
  }

  // Look for login form
  const loginForm = page.locator('[data-testid="login-form"]');

  if (await loginForm.isVisible()) {
    console.log('📝 Filling login form...');

    // Fill login credentials
    await page.fill('[data-testid="email-input"]', process.env.E2E_TEST_EMAIL || 'test@swaggystacks.com');
    await page.fill('[data-testid="password-input"]', process.env.E2E_TEST_PASSWORD || 'testpassword123');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Wait for successful login - either dashboard or profile completion
    await Promise.race([
      page.waitForURL('**/dashboard'),
      page.waitForURL('**/profile/complete'),
      page.waitForURL('**/swaggystacks'),
      page.waitForURL('**/scientia')
    ]);

    console.log('✅ Login successful');
  } else {
    console.log('⚠️  Login form not found, checking for other auth methods...');

    // Check for social login buttons or other auth methods
    const githubLogin = page.locator('[data-testid="github-login"]');
    const googleLogin = page.locator('[data-testid="google-login"]');

    if (await githubLogin.isVisible()) {
      console.log('🐙 GitHub login available but requires interactive flow');
    } else if (await googleLogin.isVisible()) {
      console.log('🟣 Google login available but requires interactive flow');
    } else {
      console.log('🏠 No login form found, treating as public access');
    }
  }

  // Verify we can access authenticated content
  try {
    await page.goto('/dashboard');

    // Check if dashboard loads without redirect to login
    await page.waitForLoadState('networkidle');

    const dashboardContent = page.locator('[data-testid="dashboard-content"]');
    if (await dashboardContent.isVisible({ timeout: 3000 })) {
      console.log('✅ Dashboard access confirmed');
    } else {
      console.log('⚠️  Dashboard content not found, saving unauthenticated state');
    }
  } catch (error: unknown) {
    console.log('⚠️  Dashboard access failed, saving current state anyway');
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
  console.log('💾 Authentication state saved');
});