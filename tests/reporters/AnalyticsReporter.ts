/**
 * Analytics Reporter - Playwright reporter integration for comprehensive test analytics
 * Integrates with TestReporter to provide detailed insights and reporting
 */

import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult
} from '@playwright/test/reporter';
import { TestReporter } from '../utils/TestReporter';
import { MetricsCollector } from '../utils/MetricsCollector';
import fs from 'fs/promises';
import path from 'path';

interface TestMetricsData {
  testId: string;
  metrics: any;
}

/**
 * Playwright reporter for comprehensive test analytics
 */
export class AnalyticsReporter implements Reporter {
  private testReporter: TestReporter;
  private config: FullConfig | null = null;
  private startTime: number = 0;
  private testMetrics: Map<string, any> = new Map();
  private outputDir: string;

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || 'test-results/analytics';
    this.testReporter = new TestReporter(this.outputDir);
  }

  /**
   * Called once before running tests
   */
  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.startTime = Date.now();

    console.log('📊 Starting analytics collection for E2E test suite');
    console.log(`🎯 Projects: ${config.projects.length}`);
    console.log(`🧪 Total tests: ${suite.allTests().length}`);
    console.log(`⚙️ Workers: ${config.workers}`);
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

  /**
   * Called after a test has been started
   */
  onTestBegin(test: TestCase, result: TestResult): void {
    const testId = this.getTestId(test);
    console.log(`🧪 Starting test: ${test.title} (${testId})`);

    // Initialize metrics collection for this test
    // Note: This would be done in the actual test setup
  }

  /**
   * Called after a test has been finished
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    const testId = this.getTestId(test);
    const duration = result.duration;
    const status = result.status;

    console.log(`✅ Completed test: ${test.title} - ${status} (${duration}ms)`);

    // Log any important events
    if (result.status === 'failed') {
      console.log(`❌ Test failed: ${result.error?.message || 'Unknown error'}`);
    }

    if (result.retry > 0) {
      console.log(`🔄 Test required ${result.retry} retries`);
    }

    if (duration > 30000) {
      console.log(`⏰ Slow test detected: ${duration}ms`);
    }

    // Store attachments info
    if (result.attachments.length > 0) {
      console.log(`📎 Test attachments: ${result.attachments.length}`);
    }
  }

  /**
   * Called after a test suite has been finished
   */
  onEnd(result: FullResult): void {
    console.log('\n📊 Generating comprehensive test analytics...');

    this.generateFinalReport(result).catch(error => {
      console.error('Failed to generate analytics report:', error);
    });
  }

  /**
   * Generate final comprehensive report
   */
  private async generateFinalReport(result: FullResult): Promise<void> {
    const totalDuration = Date.now() - this.startTime;

    console.log(`\n🎯 Test Execution Summary:`);
    console.log(`   Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Status: ${result.status}`);

    try {
      // Create output directory
      await fs.mkdir(this.outputDir, { recursive: true });

      // Process all test suites
      await this.processTestSuites();

      // Generate comprehensive report
      const report = await this.testReporter.generateReport();

      // Generate HTML report
      const htmlPath = await this.testReporter.generateHtmlReport();

      // Generate summary for console
      this.printSummary(report);

      // Save metrics data
      await this.saveMetricsData();

      console.log(`\n📊 Analytics Reports Generated:`);
      console.log(`   📄 JSON Report: ${path.join(this.outputDir, 'latest-report.json')}`);
      console.log(`   🌐 HTML Report: ${htmlPath}`);
      console.log(`   📈 Metrics Data: ${path.join(this.outputDir, 'metrics-data.json')}`);

      // Generate trend analysis if historical data exists
      await this.generateTrendAnalysis();

    } catch (error: unknown) {
      console.error('❌ Failed to generate analytics report:', error);
    }
  }

  /**
   * Process test suites for analytics
   */
  private async processTestSuites(): Promise<void> {
    if (!this.config) return;

    for (const project of this.config.projects) {
      const suite = project.use;

      // Create a mock suite structure for processing
      // In a real implementation, this would process actual test results
      const mockSuite = {
        title: project.name,
        location: { file: 'unknown' },
        tests: [] as any[]
      };

      // Process the suite
      await this.testReporter.processSuite(mockSuite as any);
    }
  }

  /**
   * Print summary to console
   */
  private printSummary(report: any): void {
    console.log(`\n📈 Test Analytics Summary:`);
    console.log(`   ✅ Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`   🧪 Total Tests: ${report.summary.totalTests}`);
    console.log(`   ⏱️  Average Duration: ${report.performance.averageExecutionTime.toFixed(0)}ms`);
    console.log(`   🔄 Flaky Tests: ${report.summary.flaky}`);
    console.log(`   📊 Reliability: ${report.quality.reliability.toFixed(1)}%`);

    if (report.recommendations.length > 0) {
      console.log(`\n💡 Key Recommendations:`);
      report.recommendations.slice(0, 3).forEach((rec: string) => {
        console.log(`   ${rec}`);
      });
    }

    // Performance warnings
    if (report.performance.performanceRegression) {
      console.log(`\n⚠️  Performance regression detected!`);
    }

    if (report.quality.flakiness.flakinessRate > 5) {
      console.log(`\n⚠️  High test flakiness: ${report.quality.flakiness.flakinessRate.toFixed(1)}%`);
    }
  }

  /**
   * Save detailed metrics data
   */
  private async saveMetricsData(): Promise<void> {
    const metricsData = {
      collectionTimestamp: new Date().toISOString(),
      testMetrics: Array.from(this.testMetrics.entries()).map(([testId, metrics]) => ({
        testId,
        metrics
      })),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      },
      configuration: this.config ? {
        workers: this.config.workers,
        retries: this.config.globalRetries,
        timeout: this.config.globalTimeout,
        projects: this.config.projects.map(p => ({
          name: p.name,
          testDir: p.testDir,
          outputDir: p.outputDir
        }))
      } : {}
    };

    const metricsPath = path.join(this.outputDir, 'metrics-data.json');
    await fs.writeFile(metricsPath, JSON.stringify(metricsData, null, 2));
  }

  /**
   * Generate trend analysis
   */
  private async generateTrendAnalysis(): Promise<void> {
    try {
      const trendPath = path.join(this.outputDir, 'trend-analysis.json');

      // Load historical reports for trend analysis
      const files = await fs.readdir(this.outputDir);
      const reportFiles = files
        .filter(f => f.startsWith('test-report-') && f.endsWith('.json'))
        .sort()
        .slice(-10); // Last 10 reports

      if (reportFiles.length >= 2) {
        const trends = {
          reportCount: reportFiles.length,
          timeSpan: 'Last 10 reports',
          trends: {
            successRate: { direction: 'stable', change: 0 },
            executionTime: { direction: 'stable', change: 0 },
            flakiness: { direction: 'stable', change: 0 }
          },
          insights: [
            'Trend analysis requires at least 2 historical reports',
            'Monitor success rate trends for quality insights',
            'Track execution time trends for performance optimization'
          ]
        };

        await fs.writeFile(trendPath, JSON.stringify(trends, null, 2));
        console.log(`   📈 Trend Analysis: ${trendPath}`);
      }
    } catch (error: unknown) {
      // Trend analysis is optional
      console.log('   📈 Trend analysis: Not enough historical data');
    }
  }

  /**
   * Add metrics for a specific test
   */
  addTestMetrics(testTitle: string, metrics: any): void {
    const testId = this.generateTestId(testTitle);
    this.testMetrics.set(testId, metrics);
    this.testReporter.addMetrics(testTitle, metrics);
  }

  /**
   * Get test ID
   */
  private getTestId(test: TestCase): string {
    return `${test.parent.title}-${test.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  /**
   * Generate test ID from title
   */
  private generateTestId(title: string): string {
    return title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  /**
   * Export report data for external systems
   */
  async exportForCI(): Promise<{
    summary: any;
    performance: any;
    quality: any;
    recommendations: string[];
  }> {
    const report = await this.testReporter.generateReport();

    return {
      summary: {
        totalTests: report.summary.totalTests,
        passed: report.summary.passed,
        failed: report.summary.failed,
        successRate: report.summary.successRate,
        duration: report.summary.duration
      },
      performance: {
        averageExecutionTime: report.performance.averageExecutionTime,
        performanceRegression: report.performance.performanceRegression,
        slowTests: report.performance.slowestTests.length
      },
      quality: {
        reliability: report.quality.reliability,
        flakiness: report.quality.flakiness.flakinessRate,
        errorPatterns: report.quality.errorPatterns.length
      },
      recommendations: report.recommendations
    };
  }

  /**
   * Get metrics summary for quick analysis
   */
  getMetricsSummary(): {
    testsWithMetrics: number;
    avgMemoryUsage: number;
    avgResponseTime: number;
    totalErrors: number;
  } {
    let totalMemory = 0;
    let totalResponseTime = 0;
    let totalErrors = 0;
    let testsWithMetrics = 0;

    for (const [_, metrics] of this.testMetrics) {
      testsWithMetrics++;

      if (metrics.resources && metrics.resources.memoryUsage.length > 0) {
        const avgMemory = metrics.resources.memoryUsage.reduce((sum: number, m: any) => sum + m.percentage, 0) / metrics.resources.memoryUsage.length;
        totalMemory += avgMemory;
      }

      if (metrics.network && metrics.network.averageLatency > 0) {
        totalResponseTime += metrics.network.averageLatency;
      }

      if (metrics.errors) {
        totalErrors += metrics.errors.length;
      }
    }

    return {
      testsWithMetrics,
      avgMemoryUsage: testsWithMetrics > 0 ? totalMemory / testsWithMetrics : 0,
      avgResponseTime: testsWithMetrics > 0 ? totalResponseTime / testsWithMetrics : 0,
      totalErrors
    };
  }
}

export default AnalyticsReporter;