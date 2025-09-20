#!/usr/bin/env tsx

/**
 * Comprehensive E2E Test Suite Runner
 *
 * This script orchestrates the execution of our complete E2E testing infrastructure
 * to validate that all components work together seamlessly.
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestSuiteConfig {
  name: string;
  testPattern: string;
  timeout: number;
  retries: number;
  workers: number;
  critical: boolean;
}

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  success: boolean;
}

class ComprehensiveE2ERunner {
  private readonly testSuites: TestSuiteConfig[] = [
    {
      name: 'Marketplace Core',
      testPattern: 'tests/e2e/marketplace/core-functionality.spec.ts',
      timeout: 30000,
      retries: 2,
      workers: 1,
      critical: true
    },
    {
      name: 'Model Discovery',
      testPattern: 'tests/e2e/marketplace/model-discovery.spec.ts',
      timeout: 45000,
      retries: 1,
      workers: 2,
      critical: true
    },
    {
      name: 'Performance Testing',
      testPattern: 'tests/e2e/performance/',
      timeout: 60000,
      retries: 1,
      workers: 1,
      critical: true
    },
    {
      name: 'Chaos Testing',
      testPattern: 'tests/e2e/chaos/',
      timeout: 90000,
      retries: 0,
      workers: 1,
      critical: false
    },
    {
      name: 'Pipeline Integration',
      testPattern: 'tests/e2e/pipeline/',
      timeout: 120000,
      retries: 1,
      workers: 1,
      critical: true
    },
    {
      name: 'Comprehensive Validation',
      testPattern: 'tests/e2e/validation/',
      timeout: 180000,
      retries: 0,
      workers: 1,
      critical: true
    }
  ];

  private readonly outputDir = join(process.cwd(), 'test-results', 'comprehensive');
  private readonly reportPath = join(this.outputDir, 'comprehensive-report.json');
  private results: TestResult[] = [];

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Run the complete E2E test suite
   */
  async runComprehensiveTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive E2E Test Suite');
    console.log('=' + '='.repeat(50));

    const startTime = Date.now();

    try {
      // Pre-flight checks
      await this.preFlightChecks();

      // Run test suites in order
      for (const suite of this.testSuites) {
        console.log(`\n📋 Running ${suite.name}...`);
        const result = await this.runTestSuite(suite);
        this.results.push(result);

        // Stop on critical failures
        if (!result.success && suite.critical) {
          console.error(`❌ Critical test suite '${suite.name}' failed - aborting`);
          break;
        }
      }

      // Generate comprehensive report
      const totalDuration = Date.now() - startTime;
      await this.generateComprehensiveReport(totalDuration);

      // Print summary
      this.printSummary();

      // Validate overall success
      this.validateOverallSuccess();

    } catch (error) {
      console.error('💥 Comprehensive test execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Pre-flight checks to ensure environment is ready
   */
  private async preFlightChecks(): Promise<void> {
    console.log('🔍 Running pre-flight checks...');

    // Check if development server is running
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      console.log('  ✅ Development server is running');
    } catch (error) {
      console.log('  ⚠️ Development server not detected - tests may use mock data');
    }

    // Check Playwright installation
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      console.log('  ✅ Playwright is installed');
    } catch (error) {
      throw new Error('Playwright is not installed. Run: npx playwright install');
    }

    // Check browsers
    try {
      execSync('npx playwright install --with-deps chromium', { stdio: 'pipe' });
      console.log('  ✅ Chromium browser is available');
    } catch (error) {
      console.log('  ⚠️ Browser installation may be incomplete');
    }

    // Validate test infrastructure files exist
    const requiredFiles = [
      'tests/utils/MetricsCollector.ts',
      'tests/utils/ChaosEngine.ts',
      'tests/utils/TestReporter.ts',
      'tests/utils/DashboardIntegration.ts',
      'playwright.config.ts'
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required test infrastructure file missing: ${file}`);
      }
    }
    console.log('  ✅ Test infrastructure files validated');

    console.log('✅ Pre-flight checks completed');
  }

  /**
   * Run a single test suite
   */
  private async runTestSuite(suite: TestSuiteConfig): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Build Playwright command
      const cmd = [
        'npx', 'playwright', 'test',
        suite.testPattern,
        '--reporter=json',
        `--timeout=${suite.timeout}`,
        `--retries=${suite.retries}`,
        `--workers=${suite.workers}`,
        `--output-dir=${join(this.outputDir, suite.name.toLowerCase().replace(/\s+/g, '-'))}`
      ];

      console.log(`  🎯 Command: ${cmd.join(' ')}`);

      // Execute test suite
      const result = execSync(cmd.join(' '), {
        stdio: 'pipe',
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      // Parse Playwright JSON output
      const output = JSON.parse(result);
      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        suite: suite.name,
        passed: output.stats?.expected || 0,
        failed: output.stats?.unexpected || 0,
        skipped: output.stats?.skipped || 0,
        duration,
        success: (output.stats?.unexpected || 0) === 0
      };

      if (testResult.success) {
        console.log(`  ✅ ${suite.name} completed successfully (${testResult.passed} passed, ${duration}ms)`);
      } else {
        console.log(`  ❌ ${suite.name} failed (${testResult.failed} failed, ${testResult.passed} passed, ${duration}ms)`);
      }

      return testResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`  💥 ${suite.name} execution error:`, error);

      return {
        suite: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration,
        success: false
      };
    }
  }

  /**
   * Generate comprehensive test report
   */
  private async generateComprehensiveReport(totalDuration: number): Promise<void> {
    console.log('\n📊 Generating comprehensive report...');

    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDuration,
        totalTests,
        totalPassed,
        totalFailed,
        totalSkipped,
        successRate,
        overallSuccess: totalFailed === 0
      },
      suites: this.results,
      infrastructure: {
        metricsCollection: true,
        chaosEngineering: true,
        testReporting: true,
        dashboardIntegration: true,
        cicdReadiness: true
      },
      recommendations: this.generateRecommendations(),
      healthCheck: {
        status: this.getHealthStatus(),
        readyForProduction: totalFailed === 0 && successRate >= 95
      }
    };

    writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    console.log(`  📄 Report saved to: ${this.reportPath}`);
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedSuites = this.results.filter(r => !r.success);

    if (failedSuites.length === 0) {
      recommendations.push('🎉 All test suites passed! E2E infrastructure is fully operational');
      recommendations.push('✅ Ready for production deployment');
      recommendations.push('🔄 Consider adding more edge case testing scenarios');
    } else {
      recommendations.push('⚠️ Some test suites failed - review and fix before production');

      failedSuites.forEach(suite => {
        recommendations.push(`🔧 Address failures in ${suite.suite} test suite`);
      });

      if (failedSuites.some(s => this.testSuites.find(ts => ts.name === s.suite)?.critical)) {
        recommendations.push('🚨 Critical test suites failed - deployment not recommended');
      }
    }

    // Performance recommendations
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    if (avgDuration > 30000) {
      recommendations.push('⏱️ Consider optimizing test execution time');
    }

    return recommendations;
  }

  /**
   * Get overall health status
   */
  private getHealthStatus(): 'excellent' | 'good' | 'fair' | 'poor' {
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = successCount / totalCount;

    if (successRate === 1) return 'excellent';
    if (successRate >= 0.8) return 'good';
    if (successRate >= 0.6) return 'fair';
    return 'poor';
  }

  /**
   * Print comprehensive summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE E2E TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    console.log(`Total Tests:     ${totalTests}`);
    console.log(`Passed:          ${totalPassed}`);
    console.log(`Failed:          ${totalFailed}`);
    console.log(`Success Rate:    ${successRate.toFixed(1)}%`);
    console.log(`Health Status:   ${this.getHealthStatus().toUpperCase()}`);
    console.log('');

    console.log('Test Suite Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = (result.duration / 1000).toFixed(1);
      console.log(`  ${result.suite.padEnd(20)} ${status} (${result.passed}/${result.passed + result.failed}, ${duration}s)`);
    });

    console.log('='.repeat(60));
  }

  /**
   * Validate overall success and exit appropriately
   */
  private validateOverallSuccess(): void {
    const criticalFailures = this.results.filter(r =>
      !r.success && this.testSuites.find(s => s.name === r.suite)?.critical
    );

    if (criticalFailures.length > 0) {
      console.error('💥 Critical test failures detected - exiting with error code');
      process.exit(1);
    }

    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    if (totalFailed > 0) {
      console.log('⚠️ Some tests failed but no critical failures - review recommended');
      process.exit(0); // Non-critical failures don't fail the build
    }

    console.log('🎉 All tests passed successfully!');
    process.exit(0);
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new ComprehensiveE2ERunner();
  runner.runComprehensiveTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ComprehensiveE2ERunner };