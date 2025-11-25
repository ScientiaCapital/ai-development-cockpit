/**
 * Test Reporter - Comprehensive test analytics and reporting system
 * Provides detailed insights into test execution, performance trends, and quality metrics
 */

import { TestResult, TestCase, Suite } from '@playwright/test/reporter';
import { MetricsCollector, TestMetrics } from './MetricsCollector';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface TestReport {
  summary: TestSummary;
  suites: TestSuiteReport[];
  performance: PerformanceReport;
  quality: QualityReport;
  trends: TrendsReport;
  recommendations: string[];
  metadata: ReportMetadata;
}

export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number; // milliseconds
  successRate: number; // percentage
  coverage: CoverageReport;
}

export interface TestSuiteReport {
  name: string;
  file: string;
  duration: number;
  tests: TestCaseReport[];
  performance: SuitePerformanceMetrics;
  reliability: ReliabilityMetrics;
}

export interface TestCaseReport {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedout';
  duration: number;
  retries: number;
  error?: string;
  screenshots: string[];
  traces: string[];
  metrics?: TestMetrics;
  annotations: TestAnnotation[];
}

export interface TestAnnotation {
  type: 'info' | 'warning' | 'error' | 'performance' | 'security';
  message: string;
  timestamp: number;
}

export interface PerformanceReport {
  averageExecutionTime: number;
  slowestTests: TestCaseReport[];
  fastestTests: TestCaseReport[];
  performanceRegression: boolean;
  resourceUsage: ResourceUsageReport;
  webVitals: WebVitalsReport;
}

export interface QualityReport {
  reliability: number; // percentage
  maintainability: number; // percentage
  testStability: number; // percentage
  errorPatterns: ErrorPattern[];
  flakiness: FlakinessReport;
  coverage: CoverageReport;
}

export interface TrendsReport {
  executionTimetrend: number[]; // last 10 runs
  successRateTrend: number[]; // last 10 runs
  flakinessMetrics: FlakinessMetrics;
  performanceTrends: PerformanceTrends;
}

export interface CoverageReport {
  routes: RouteCoverage[];
  features: FeatureCoverage[];
  userJourneys: UserJourneyCoverage[];
  organizationCoverage: OrganizationCoverage;
}

export interface RouteCoverage {
  route: string;
  tested: boolean;
  testCount: number;
  lastTested: Date;
}

export interface FeatureCoverage {
  feature: string;
  coverage: number; // percentage
  scenarios: string[];
}

export interface UserJourneyCoverage {
  journey: string;
  steps: JourneyStep[];
  completion: number; // percentage
}

export interface JourneyStep {
  name: string;
  tested: boolean;
  success: boolean;
}

export interface OrganizationCoverage {
  arcade: number; // percentage
  enterprise: number; // percentage
}

export interface SuitePerformanceMetrics {
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  stability: number; // variance metric
}

export interface ReliabilityMetrics {
  successRate: number;
  flakyTests: string[];
  consistentFailures: string[];
  intermittentIssues: string[];
}

export interface ResourceUsageReport {
  memoryUsage: MemoryUsageStats;
  cpuUsage: CpuUsageStats;
  networkUsage: NetworkUsageStats;
}

export interface MemoryUsageStats {
  average: number;
  peak: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface CpuUsageStats {
  average: number;
  peak: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface NetworkUsageStats {
  totalRequests: number;
  failedRequests: number;
  averageLatency: number;
  slowRequests: number;
}

export interface WebVitalsReport {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb: number; // Time to First Byte
}

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
  recommendations: string[];
}

export interface FlakinessReport {
  flakyTestCount: number;
  flakinessRate: number; // percentage
  mostFlakyTests: string[];
  flakinessPatterns: string[];
}

export interface FlakinessMetrics {
  trend: 'improving' | 'stable' | 'worsening';
  changePercent: number;
  confidence: number;
}

export interface PerformanceTrends {
  executionTime: TrendMetric;
  resourceUsage: TrendMetric;
  errorRate: TrendMetric;
}

export interface TrendMetric {
  current: number;
  previous: number;
  change: number; // percentage
  trend: 'improving' | 'stable' | 'worsening';
}

export interface ReportMetadata {
  generatedAt: Date;
  environment: string;
  gitCommit: string;
  gitBranch: string;
  reportVersion: string;
  configuration: TestConfiguration;
}

export interface TestConfiguration {
  browsers: string[];
  organizations: string[];
  parallel: boolean;
  retries: number;
  timeout: number;
}

/**
 * Comprehensive test analytics and reporting system
 */
export class TestReporter {
  private reportDir: string;
  private historicalData: TestReport[] = [];
  private currentReport: Partial<TestReport> = {};

  constructor(reportDir: string = 'test-results/analytics') {
    this.reportDir = reportDir;
    this.initializeReport();
  }

  /**
   * Initialize a new test report
   */
  private initializeReport(): void {
    this.currentReport = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        duration: 0,
        successRate: 0,
        coverage: {
          routes: [],
          features: [],
          userJourneys: [],
          organizationCoverage: { arcade: 0, enterprise: 0 }
        }
      },
      suites: [],
      performance: {
        averageExecutionTime: 0,
        slowestTests: [],
        fastestTests: [],
        performanceRegression: false,
        resourceUsage: {
          memoryUsage: { average: 0, peak: 0, trend: 'stable' },
          cpuUsage: { average: 0, peak: 0, trend: 'stable' },
          networkUsage: { totalRequests: 0, failedRequests: 0, averageLatency: 0, slowRequests: 0 }
        },
        webVitals: { fcp: 0, lcp: 0, cls: 0, fid: 0, ttfb: 0 }
      },
      quality: {
        reliability: 0,
        maintainability: 0,
        testStability: 0,
        errorPatterns: [],
        flakiness: { flakyTestCount: 0, flakinessRate: 0, mostFlakyTests: [], flakinessPatterns: [] },
        coverage: {
          routes: [],
          features: [],
          userJourneys: [],
          organizationCoverage: { arcade: 0, enterprise: 0 }
        }
      },
      trends: {
        executionTimetrend: [],
        successRateTrend: [],
        flakinessMetrics: { trend: 'stable', changePercent: 0, confidence: 0 },
        performanceTrends: {
          executionTime: { current: 0, previous: 0, change: 0, trend: 'stable' },
          resourceUsage: { current: 0, previous: 0, change: 0, trend: 'stable' },
          errorRate: { current: 0, previous: 0, change: 0, trend: 'stable' }
        }
      },
      recommendations: [],
      metadata: {
        generatedAt: new Date(),
        environment: process.env.NODE_ENV || 'development',
        gitCommit: process.env.GITHUB_SHA || 'unknown',
        gitBranch: process.env.GITHUB_REF_NAME || 'unknown',
        reportVersion: '1.0.0',
        configuration: {
          browsers: ['chromium', 'firefox', 'webkit'],
          organizations: ['arcade', 'enterprise'],
          parallel: true,
          retries: 2,
          timeout: 30000
        }
      }
    };
  }

  /**
   * Process test suite results
   */
  async processSuite(suite: Suite): Promise<void> {
    const suiteReport: TestSuiteReport = {
      name: suite.title,
      file: suite.location?.file || 'unknown',
      duration: 0,
      tests: [],
      performance: {
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        stability: 0
      },
      reliability: {
        successRate: 0,
        flakyTests: [],
        consistentFailures: [],
        intermittentIssues: []
      }
    };

    // Process all tests in the suite
    for (const test of suite.tests) {
      const testReport = await this.processTestCase(test);
      suiteReport.tests.push(testReport);
      suiteReport.duration += testReport.duration;

      // Update suite metrics
      suiteReport.performance.maxDuration = Math.max(
        suiteReport.performance.maxDuration,
        testReport.duration
      );
      suiteReport.performance.minDuration = Math.min(
        suiteReport.performance.minDuration,
        testReport.duration
      );
    }

    // Calculate suite metrics
    if (suiteReport.tests.length > 0) {
      suiteReport.performance.avgDuration = suiteReport.duration / suiteReport.tests.length;

      const passedTests = suiteReport.tests.filter(t => t.status === 'passed').length;
      suiteReport.reliability.successRate = (passedTests / suiteReport.tests.length) * 100;

      // Calculate stability (variance)
      const durations = suiteReport.tests.map(t => t.duration);
      const variance = this.calculateVariance(durations);
      suiteReport.performance.stability = Math.max(0, 100 - (variance / 1000)); // Normalize variance
    }

    this.currentReport.suites?.push(suiteReport);
  }

  /**
   * Process individual test case
   */
  private async processTestCase(test: TestCase): Promise<TestCaseReport> {
    const lastResult = test.results[test.results.length - 1];

    const testReport: TestCaseReport = {
      title: test.title,
      status: lastResult.status as any,
      duration: lastResult.duration,
      retries: test.results.length - 1,
      error: lastResult.error?.message,
      screenshots: lastResult.attachments
        .filter(a => a.name === 'screenshot')
        .map(a => a.path || ''),
      traces: lastResult.attachments
        .filter(a => a.name === 'trace')
        .map(a => a.path || ''),
      annotations: []
    };

    // Add performance annotations
    if (lastResult.duration > 30000) {
      testReport.annotations.push({
        type: 'performance',
        message: `Slow test execution: ${lastResult.duration}ms`,
        timestamp: Date.now()
      });
    }

    // Add retry annotations
    if (testReport.retries > 0) {
      testReport.annotations.push({
        type: 'warning',
        message: `Test required ${testReport.retries} retries`,
        timestamp: Date.now()
      });
    }

    return testReport;
  }

  /**
   * Add metrics from MetricsCollector
   */
  addMetrics(testTitle: string, metrics: TestMetrics): void {
    // Find the test in current report and add metrics
    for (const suite of this.currentReport.suites || []) {
      const test = suite.tests.find(t => t.title === testTitle);
      if (test) {
        test.metrics = metrics;

        // Update performance report with metrics data
        this.updatePerformanceReport(metrics);
        break;
      }
    }
  }

  /**
   * Update performance report with metrics
   */
  private updatePerformanceReport(metrics: TestMetrics): void {
    if (!this.currentReport.performance) return;

    const perf = this.currentReport.performance;

    // Update web vitals
    if (metrics.performance) {
      perf.webVitals.fcp = Math.max(perf.webVitals.fcp, metrics.performance.firstContentfulPaint);
      perf.webVitals.lcp = Math.max(perf.webVitals.lcp, metrics.performance.largestContentfulPaint);
      perf.webVitals.cls = Math.max(perf.webVitals.cls, metrics.performance.cumulativeLayoutShift);
    }

    // Update resource usage
    if (metrics.resources && metrics.resources.memoryUsage.length > 0) {
      const avgMemory = metrics.resources.memoryUsage.reduce((sum, m) => sum + m.percentage, 0) / metrics.resources.memoryUsage.length;
      const peakMemory = Math.max(...metrics.resources.memoryUsage.map(m => m.percentage));

      perf.resourceUsage.memoryUsage.average = Math.max(perf.resourceUsage.memoryUsage.average, avgMemory);
      perf.resourceUsage.memoryUsage.peak = Math.max(perf.resourceUsage.memoryUsage.peak, peakMemory);
    }

    // Update network usage
    if (metrics.network) {
      perf.resourceUsage.networkUsage.totalRequests += metrics.network.requestCount;
      perf.resourceUsage.networkUsage.failedRequests += metrics.network.failedRequests;
      perf.resourceUsage.networkUsage.slowRequests += metrics.network.slowRequests;

      if (metrics.network.averageLatency > 0) {
        perf.resourceUsage.networkUsage.averageLatency =
          (perf.resourceUsage.networkUsage.averageLatency + metrics.network.averageLatency) / 2;
      }
    }
  }

  /**
   * Analyze test results and generate insights
   */
  async analyzeResults(): Promise<void> {
    this.calculateSummary();
    this.analyzePerformance();
    this.analyzeQuality();
    await this.analyzeTrends();
    this.generateRecommendations();
  }

  /**
   * Calculate overall test summary
   */
  private calculateSummary(): void {
    if (!this.currentReport.summary || !this.currentReport.suites) return;

    const summary = this.currentReport.summary;
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let totalDuration = 0;

    for (const suite of this.currentReport.suites) {
      for (const test of suite.tests) {
        totalTests++;
        totalDuration += test.duration;

        switch (test.status) {
          case 'passed':
            passed++;
            break;
          case 'failed':
          case 'timedout':
            failed++;
            break;
          case 'skipped':
            skipped++;
            break;
        }

        // Check for flakiness
        if (test.retries > 0 && test.status === 'passed') {
          summary.flaky++;
        }
      }
    }

    summary.totalTests = totalTests;
    summary.passed = passed;
    summary.failed = failed;
    summary.skipped = skipped;
    summary.duration = totalDuration;
    summary.successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformance(): void {
    if (!this.currentReport.performance || !this.currentReport.suites) return;

    const perf = this.currentReport.performance;
    const allTests: TestCaseReport[] = [];

    // Collect all tests
    for (const suite of this.currentReport.suites) {
      allTests.push(...suite.tests);
    }

    if (allTests.length === 0) return;

    // Calculate average execution time
    const totalDuration = allTests.reduce((sum, test) => sum + test.duration, 0);
    perf.averageExecutionTime = totalDuration / allTests.length;

    // Find slowest and fastest tests
    const sortedByDuration = [...allTests].sort((a, b) => b.duration - a.duration);
    perf.slowestTests = sortedByDuration.slice(0, 5);
    perf.fastestTests = sortedByDuration.slice(-5).reverse();

    // Check for performance regression
    if (this.historicalData.length > 0) {
      const lastReport = this.historicalData[this.historicalData.length - 1];
      const regressionThreshold = 1.2; // 20% slower is considered regression

      perf.performanceRegression = perf.averageExecutionTime > lastReport.performance.averageExecutionTime * regressionThreshold;
    }
  }

  /**
   * Analyze quality metrics
   */
  private analyzeQuality(): void {
    if (!this.currentReport.quality || !this.currentReport.suites) return;

    const quality = this.currentReport.quality;
    const allTests: TestCaseReport[] = [];

    for (const suite of this.currentReport.suites) {
      allTests.push(...suite.tests);
    }

    if (allTests.length === 0) return;

    // Calculate reliability
    const passedTests = allTests.filter(t => t.status === 'passed').length;
    quality.reliability = (passedTests / allTests.length) * 100;

    // Analyze flakiness
    const flakyTests = allTests.filter(t => t.retries > 0);
    quality.flakiness.flakyTestCount = flakyTests.length;
    quality.flakiness.flakinessRate = (flakyTests.length / allTests.length) * 100;
    quality.flakiness.mostFlakyTests = flakyTests
      .sort((a, b) => b.retries - a.retries)
      .slice(0, 5)
      .map(t => t.title);

    // Analyze error patterns
    const errors = allTests
      .filter(t => t.error)
      .map(t => t.error!);

    quality.errorPatterns = this.analyzeErrorPatterns(errors);

    // Calculate test stability
    const durations = allTests.map(t => t.duration);
    const variance = this.calculateVariance(durations);
    quality.testStability = Math.max(0, 100 - (variance / 10000)); // Normalize
  }

  /**
   * Analyze error patterns
   */
  private analyzeErrorPatterns(errors: string[]): ErrorPattern[] {
    const patterns = new Map<string, { count: number; examples: string[] }>();

    for (const error of errors) {
      // Simple pattern matching - could be enhanced with regex patterns
      const pattern = this.extractErrorPattern(error);

      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, examples: [] });
      }

      const data = patterns.get(pattern)!;
      data.count++;
      if (data.examples.length < 3) {
        data.examples.push(error);
      }
    }

    return Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      impact: this.determineErrorImpact(data.count, errors.length),
      examples: data.examples,
      recommendations: this.generateErrorRecommendations(pattern)
    }));
  }

  /**
   * Extract error pattern from error message
   */
  private extractErrorPattern(error: string): string {
    // Simple pattern extraction - could be enhanced
    if (error.includes('timeout')) return 'Timeout errors';
    if (error.includes('network') || error.includes('fetch')) return 'Network errors';
    if (error.includes('element') || error.includes('selector')) return 'Element selection errors';
    if (error.includes('navigation')) return 'Navigation errors';
    return 'Other errors';
  }

  /**
   * Determine error impact level
   */
  private determineErrorImpact(count: number, total: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (count / total) * 100;
    if (percentage > 50) return 'critical';
    if (percentage > 25) return 'high';
    if (percentage > 10) return 'medium';
    return 'low';
  }

  /**
   * Generate error-specific recommendations
   */
  private generateErrorRecommendations(pattern: string): string[] {
    const recommendations: Record<string, string[]> = {
      'Timeout errors': [
        'Increase test timeouts for slow operations',
        'Optimize page load performance',
        'Add explicit waits for dynamic content'
      ],
      'Network errors': [
        'Add network retry logic',
        'Mock external API calls in tests',
        'Validate network conditions in CI'
      ],
      'Element selection errors': [
        'Use more stable selectors (data-testid)',
        'Add explicit waits for element visibility',
        'Review page structure changes'
      ],
      'Navigation errors': [
        'Validate route configurations',
        'Add navigation guards in tests',
        'Check for redirect issues'
      ]
    };

    return recommendations[pattern] || ['Review error details and test implementation'];
  }

  /**
   * Analyze trends compared to historical data
   */
  private async analyzeTrends(): Promise<void> {
    await this.loadHistoricalData();

    if (!this.currentReport.trends || this.historicalData.length === 0) return;

    const trends = this.currentReport.trends;
    const recentReports = this.historicalData.slice(-10); // Last 10 reports

    // Execution time trend
    trends.executionTimetrend = recentReports.map(r => r.performance.averageExecutionTime);

    // Success rate trend
    trends.successRateTrend = recentReports.map(r => r.summary.successRate);

    // Calculate trend directions
    if (recentReports.length >= 2) {
      const current = recentReports[recentReports.length - 1];
      const previous = recentReports[recentReports.length - 2];

      trends.performanceTrends.executionTime = this.calculateTrendMetric(
        current.performance.averageExecutionTime,
        previous.performance.averageExecutionTime
      );

      trends.performanceTrends.errorRate = this.calculateTrendMetric(
        100 - current.summary.successRate,
        100 - previous.summary.successRate
      );
    }
  }

  /**
   * Calculate trend metric
   */
  private calculateTrendMetric(current: number, previous: number): TrendMetric {
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      trend: Math.abs(change) < 5 ? 'stable' : (change > 0 ? 'worsening' : 'improving')
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(): void {
    if (!this.currentReport.recommendations) return;

    const recommendations: string[] = [];

    // Performance recommendations
    if (this.currentReport.performance?.performanceRegression) {
      recommendations.push('⚡ Performance regression detected - investigate slow tests and optimize');
    }

    // Reliability recommendations
    if (this.currentReport.quality?.reliability && this.currentReport.quality.reliability < 95) {
      recommendations.push('🔧 Test reliability below 95% - review failed tests and improve stability');
    }

    // Flakiness recommendations
    if (this.currentReport.quality?.flakiness.flakinessRate && this.currentReport.quality.flakiness.flakinessRate > 5) {
      recommendations.push('🎯 High test flakiness detected - review retry patterns and timing issues');
    }

    // Coverage recommendations
    recommendations.push('📊 Consider expanding test coverage for both AI Dev Cockpit and Enterprise organizations');

    // Error pattern recommendations
    for (const pattern of this.currentReport.quality?.errorPatterns || []) {
      if (pattern.impact === 'high' || pattern.impact === 'critical') {
        recommendations.push(`🚨 Address ${pattern.pattern.toLowerCase()} (${pattern.frequency} occurrences)`);
      }
    }

    this.currentReport.recommendations = recommendations;
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(): Promise<TestReport> {
    await this.analyzeResults();

    const report = this.currentReport as TestReport;

    // Save report
    await this.saveReport(report);

    return report;
  }

  /**
   * Save report to file system
   */
  private async saveReport(report: TestReport): Promise<void> {
    try {
      await fs.mkdir(this.reportDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(this.reportDir, `test-report-${timestamp}.json`);

      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

      // Also save as latest report
      const latestPath = path.join(this.reportDir, 'latest-report.json');
      await fs.writeFile(latestPath, JSON.stringify(report, null, 2));

      console.log(`📊 Test report saved: ${reportPath}`);
    } catch (error: unknown) {
      console.error('Failed to save test report:', error);
    }
  }

  /**
   * Load historical data for trend analysis
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const files = await fs.readdir(this.reportDir);
      const reportFiles = files
        .filter(f => f.startsWith('test-report-') && f.endsWith('.json'))
        .sort()
        .slice(-10); // Last 10 reports

      this.historicalData = [];

      for (const file of reportFiles) {
        try {
          const content = await fs.readFile(path.join(this.reportDir, file), 'utf8');
          const report = JSON.parse(content) as TestReport;
          this.historicalData.push(report);
        } catch (error: unknown) {
          console.warn(`Failed to load historical report ${file}:`, error);
        }
      }
    } catch (error: unknown) {
      // Directory doesn't exist or no historical data
      this.historicalData = [];
    }
  }

  /**
   * Generate HTML report
   */
  async generateHtmlReport(): Promise<string> {
    const report = await this.generateReport();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Test Report - ${report.metadata.generatedAt.toISOString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; }
        .recommendation { margin: 10px 0; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .test-suite { background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .test-case { margin: 10px 0; padding: 10px; border-left: 3px solid #ddd; }
        .test-case.passed { border-left-color: #28a745; }
        .test-case.failed { border-left-color: #dc3545; }
        .test-case.skipped { border-left-color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 E2E Test Report</h1>
            <p>Generated: ${report.metadata.generatedAt.toLocaleString()}</p>
            <p>Environment: ${report.metadata.environment} | Branch: ${report.metadata.gitBranch}</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>📊 Test Summary</h2>
                <div class="summary">
                    <div class="metric">
                        <div class="metric-value ${report.summary.successRate >= 95 ? 'success' : report.summary.successRate >= 80 ? 'warning' : 'danger'}">
                            ${report.summary.successRate.toFixed(1)}%
                        </div>
                        <div class="metric-label">Success Rate</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.summary.totalTests}</div>
                        <div class="metric-label">Total Tests</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.summary.passed}</div>
                        <div class="metric-label">Passed</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.summary.failed}</div>
                        <div class="metric-label">Failed</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${(report.summary.duration / 1000 / 60).toFixed(1)}m</div>
                        <div class="metric-label">Duration</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.summary.flaky}</div>
                        <div class="metric-label">Flaky Tests</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>⚡ Performance Metrics</h2>
                <div class="summary">
                    <div class="metric">
                        <div class="metric-value">${report.performance.averageExecutionTime.toFixed(0)}ms</div>
                        <div class="metric-label">Avg Execution Time</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.performance.webVitals.lcp.toFixed(0)}ms</div>
                        <div class="metric-label">Largest Contentful Paint</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.performance.webVitals.cls.toFixed(3)}</div>
                        <div class="metric-label">Cumulative Layout Shift</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.performance.resourceUsage.memoryUsage.peak.toFixed(1)}%</div>
                        <div class="metric-label">Peak Memory Usage</div>
                    </div>
                </div>
            </div>

            ${report.recommendations.length > 0 ? `
            <div class="section">
                <h2>💡 Recommendations</h2>
                <div class="recommendations">
                    ${report.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2>📋 Test Suites</h2>
                <div class="test-grid">
                    ${report.suites.map(suite => `
                        <div class="test-suite">
                            <h3>${suite.name}</h3>
                            <p><strong>Duration:</strong> ${(suite.duration / 1000).toFixed(1)}s</p>
                            <p><strong>Success Rate:</strong> ${suite.reliability.successRate.toFixed(1)}%</p>
                            <div class="tests">
                                ${suite.tests.map(test => `
                                    <div class="test-case ${test.status}">
                                        <strong>${test.title}</strong>
                                        <div>Status: ${test.status} | Duration: ${test.duration}ms${test.retries > 0 ? ` | Retries: ${test.retries}` : ''}</div>
                                        ${test.error ? `<div style="color: #dc3545; font-size: 0.9em;">${test.error}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportDir, 'latest-report.html');
    await fs.writeFile(htmlPath, html);

    return htmlPath;
  }

  /**
   * Calculate variance for stability metrics
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}