import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for AI Development Cockpit
 * E2E testing for dual-domain LLM platform with comprehensive coverage
 * Enhanced with TestCoordinator and E2EFrameworkIntegrator support
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['./tests/reporters/AnalyticsReporter.ts', { outputDir: 'test-results/analytics' }]
  ],

  /* Global setup file for custom matchers and configurations */
  globalSetup: require.resolve('./tests/e2e/global-setup'),

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for each action */
    actionTimeout: 10000,

    /* Global timeout for navigation */
    navigationTimeout: 30000,

    /* TestCoordinator integration settings */
    extraHTTPHeaders: {
      'X-Test-Framework': 'Playwright-TestCoordinator',
      'X-Test-Integration': 'E2EFrameworkIntegrator'
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use prepared auth state from setup
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    },

    /* API testing */
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api',
      }
    },

    /* Real API validation testing */
    {
      name: 'real-api',
      testMatch: /.*real-api.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api',
        extraHTTPHeaders: {
          'X-Test-Mode': 'real-api-validation'
        }
      }
    },

    /* Infrastructure integration testing */
    {
      name: 'infrastructure',
      testMatch: /.*infrastructure.*\.spec\.ts/,
      use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
        extraHTTPHeaders: {
          'X-Test-Mode': 'infrastructure-integration'
        }
      }
    },

    /* Comprehensive validation testing */
    {
      name: 'comprehensive',
      testMatch: /.*comprehensive.*\.spec\.ts/,
      use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
        extraHTTPHeaders: {
          'X-Test-Mode': 'comprehensive-validation'
        }
      }
    }
  ],

  /* Global teardown */
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
  },

  /* Test timeout */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },
});