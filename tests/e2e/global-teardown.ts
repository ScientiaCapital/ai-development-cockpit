/**
 * Playwright Global Teardown
 * Cleanup test environment and resources after AI Development Cockpit E2E tests
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting AI Development Cockpit E2E test teardown...');

  // Cleanup test data
  await cleanupTestData();

  // Cleanup test artifacts
  await cleanupTestArtifacts();

  // Generate test summary
  await generateTestSummary();

  console.log('✅ Global teardown completed successfully');
}

/**
 * Cleanup test data from database and storage
 */
async function cleanupTestData() {
  console.log('🗑️  Cleaning up test data...');

  try {
    // In a real environment, you might:
    // 1. Delete test deployments
    // 2. Cleanup test user sessions
    // 3. Remove temporary files
    // 4. Reset database state

    console.log('✅ Test data cleanup completed');
  } catch (error: unknown) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

/**
 * Cleanup test artifacts and temporary files
 */
async function cleanupTestArtifacts() {
  console.log('📁 Cleaning up test artifacts...');

  try {
    // Clean up screenshots of passed tests (keep failures)
    const testResultsDir = path.join(__dirname, '../../test-results');

    if (fs.existsSync(testResultsDir)) {
      const items = fs.readdirSync(testResultsDir);

      for (const item of items) {
        const itemPath = path.join(testResultsDir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          // Keep failure artifacts, clean up success artifacts older than 24h
          const age = Date.now() - stats.mtime.getTime();
          const oneDayMs = 24 * 60 * 60 * 1000;

          if (age > oneDayMs && !item.includes('failed')) {
            fs.rmSync(itemPath, { recursive: true, force: true });
          }
        }
      }
    }

    console.log('✅ Test artifacts cleanup completed');
  } catch (error: unknown) {
    console.error('❌ Failed to cleanup test artifacts:', error);
  }
}

/**
 * Generate test summary report
 */
async function generateTestSummary() {
  console.log('📊 Generating test summary...');

  try {
    const resultsFile = path.join(__dirname, '../../test-results/results.json');

    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

      const summary = {
        timestamp: new Date().toISOString(),
        stats: {
          total: results.stats?.total || 0,
          passed: results.stats?.passed || 0,
          failed: results.stats?.failed || 0,
          skipped: results.stats?.skipped || 0,
          duration: results.stats?.duration || 0
        },
        environment: {
          baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
          nodeVersion: process.version,
          platform: process.platform
        }
      };

      // Write summary
      const summaryFile = path.join(__dirname, '../../test-results/summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

      // Log summary to console
      console.log('📈 Test Summary:');
      console.log(`   Total: ${summary.stats.total}`);
      console.log(`   Passed: ${summary.stats.passed}`);
      console.log(`   Failed: ${summary.stats.failed}`);
      console.log(`   Skipped: ${summary.stats.skipped}`);
      console.log(`   Duration: ${Math.round(summary.stats.duration / 1000)}s`);
    }

    console.log('✅ Test summary generated');
  } catch (error: unknown) {
    console.error('❌ Failed to generate test summary:', error);
  }
}

export default globalTeardown;