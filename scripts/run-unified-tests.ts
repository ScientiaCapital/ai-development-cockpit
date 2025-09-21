#!/usr/bin/env tsx

import { TestCoordinator, DEFAULT_TEST_COORDINATOR_CONFIG, TestCoordinatorConfig } from '../tests/utils/TestCoordinator';
import { E2EFrameworkIntegrator, DEFAULT_E2E_INTEGRATION_CONFIG } from '../tests/integration/E2EFrameworkIntegrator';
import { RealApiValidator, DEFAULT_REAL_API_CONFIG } from '../tests/api/RealApiValidator';
import { TestOrchestratorConfig } from '../tests/utils/TestOrchestrator';
import { ChaosConfig } from '../tests/utils/ChaosEngine';

interface UnifiedTestConfig {
  environment: 'development' | 'staging' | 'production';
  enableRealApiTests: boolean;
  enableInfrastructureTests: boolean;
  enableChaosTests: boolean;
  enableE2ETests: boolean;
  enableLoadTests: boolean;
  generateReport: boolean;
  outputDir: string;
}

/**
 * Unified test orchestration script
 * Runs comprehensive test suite using TestCoordinator and all integrated components
 */
class UnifiedTestRunner {
  private config: UnifiedTestConfig;
  private coordinator: TestCoordinator;
  private e2eIntegrator: E2EFrameworkIntegrator;
  private apiValidator: RealApiValidator;

  constructor(config: UnifiedTestConfig) {
    this.config = config;

    // Configure TestCoordinator based on unified config
    const coordinatorConfig: TestCoordinatorConfig = {
      ...DEFAULT_TEST_COORDINATOR_CONFIG,
      enableRealApiTests: config.enableRealApiTests,
      enablePerformanceTests: config.enableInfrastructureTests,
      enableChaosTests: config.enableChaosTests,
      enableE2ETests: config.enableE2ETests
    };

    this.coordinator = new TestCoordinator(coordinatorConfig);
    this.e2eIntegrator = new E2EFrameworkIntegrator(DEFAULT_E2E_INTEGRATION_CONFIG);

    // Configure RealApiValidator based on environment
    const apiConfig = {
      ...DEFAULT_REAL_API_CONFIG,
      huggingface: {
        ...DEFAULT_REAL_API_CONFIG.huggingface,
        enabled: config.enableRealApiTests && config.environment !== 'production',
        authToken: process.env.HUGGINGFACE_API_TOKEN
      },
      runpod: {
        ...DEFAULT_REAL_API_CONFIG.runpod,
        enabled: config.enableRealApiTests && config.environment !== 'production',
        authToken: process.env.RUNPOD_API_TOKEN,
        endpoints: process.env.RUNPOD_ENDPOINTS?.split(',') || []
      }
    };

    this.apiValidator = new RealApiValidator(apiConfig);
  }

  /**
   * Run the complete unified test suite
   */
  async runUnifiedTests(): Promise<void> {
    console.log('🚀 Starting Unified Test Suite...');
    console.log(`📍 Environment: ${this.config.environment}`);
    console.log(`🔗 Real API Tests: ${this.config.enableRealApiTests ? 'Enabled' : 'Disabled'}`);
    console.log(`🏗️ Infrastructure Tests: ${this.config.enableInfrastructureTests ? 'Enabled' : 'Disabled'}`);
    console.log(`🌪️ Chaos Tests: ${this.config.enableChaosTests ? 'Enabled' : 'Disabled'}`);
    console.log(`🎭 E2E Tests: ${this.config.enableE2ETests ? 'Enabled' : 'Disabled'}`);
    console.log('');

    const startTime = Date.now();

    try {
      // Initialize all components
      await this.initializeComponents();

      // Run comprehensive test suite
      const results = await this.runComprehensiveTests();

      // Generate reports if enabled
      if (this.config.generateReport) {
        await this.generateUnifiedReport(results);
      }

      // Display summary
      this.displayTestSummary(results, Date.now() - startTime);

      // Cleanup
      await this.cleanup();

      console.log('🎉 Unified Test Suite completed successfully!');
      process.exit(0);

    } catch (error) {
      console.error('❌ Unified Test Suite failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Initialize all test components
   */
  private async initializeComponents(): Promise<void> {
    console.log('🔧 Initializing test components...');

    const sessionId = await this.coordinator.initializeSession('Unified-Test-Suite', this.config.environment);
    console.log(`✅ TestCoordinator initialized: ${sessionId}`);

    if (this.config.enableE2ETests) {
      await this.e2eIntegrator.initialize();
      console.log('✅ E2EFrameworkIntegrator initialized');
    }

    if (this.config.enableRealApiTests) {
      await this.apiValidator.initialize();
      console.log('✅ RealApiValidator initialized');
    }

    console.log('');
  }

  /**
   * Run comprehensive test suite
   */
  private async runComprehensiveTests(): Promise<any> {
    console.log('🧪 Running comprehensive test suite...');

    // Configure test scenarios
    const e2eConfig = {
      scenarios: [
        'marketplace-discovery',
        'dual-theme-validation',
        'model-deployment',
        'monitoring-dashboard',
        'rollback-procedure'
      ],
      baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
      environment: this.config.environment,
      parallel: true
    };

    const apiConfig = {
      endpoints: [
        '/api/health',
        '/api/models',
        '/api/deployment/status',
        '/api/monitoring/metrics'
      ],
      authentication: {
        huggingface: this.config.enableRealApiTests,
        runpod: this.config.enableRealApiTests
      },
      validateResponses: true,
      checkPerformance: true
    };

    const orchestratorConfig: TestOrchestratorConfig = {
      testSuite: 'unified-comprehensive',
      environment: this.config.environment
    };

    let chaosConfig: ChaosConfig | undefined;
    if (this.config.enableChaosTests) {
      chaosConfig = {
        scenarios: ['network-partition', 'api-latency', 'rollback-validation'],
        intensity: this.config.environment === 'production' ? 'low' : 'medium'
      };
    }

    // Execute hybrid test suite
    const results = await this.coordinator.executeHybridTests(
      e2eConfig,
      apiConfig,
      orchestratorConfig,
      chaosConfig
    );

    return results;
  }

  /**
   * Generate unified test report
   */
  private async generateUnifiedReport(results: any): Promise<void> {
    console.log('📊 Generating unified test report...');

    try {
      // Create output directory
      const fs = await import('fs');
      const path = await import('path');

      const outputDir = path.resolve(this.config.outputDir);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate main report
      const report = await this.coordinator.generateTestReport(results);
      const reportPath = path.join(outputDir, 'unified-test-report.md');
      fs.writeFileSync(reportPath, report);

      // Generate JSON results
      const jsonPath = path.join(outputDir, 'unified-test-results.json');
      fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

      // Generate summary metrics
      const metricsPath = path.join(outputDir, 'test-metrics.json');
      fs.writeFileSync(metricsPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        summary: results.summary,
        grade: results.grade,
        recommendations: results.recommendations
      }, null, 2));

      console.log(`✅ Reports generated in: ${outputDir}`);
      console.log(`   - ${reportPath}`);
      console.log(`   - ${jsonPath}`);
      console.log(`   - ${metricsPath}`);

    } catch (error) {
      console.error('❌ Report generation failed:', error);
    }
  }

  /**
   * Display test summary
   */
  private displayTestSummary(results: any, duration: number): void {
    console.log('');
    console.log('📋 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`🕐 Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📊 Total Tests: ${results.summary.totalTests}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⏭️ Skipped: ${results.summary.skipped}`);
    console.log(`🎯 Overall Grade: ${results.grade?.overall || 'N/A'}`);
    console.log('');

    if (results.recommendations && results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS');
      console.log('─'.repeat(30));
      results.recommendations.forEach((rec: string, index: number) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log('');
    }
  }

  /**
   * Cleanup all components
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test components...');

    try {
      await this.coordinator.cleanupSession();
      if (this.config.enableE2ETests) {
        await this.e2eIntegrator.cleanup();
      }
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(): UnifiedTestConfig {
  const args = process.argv.slice(2);

  const config: UnifiedTestConfig = {
    environment: 'development',
    enableRealApiTests: false,
    enableInfrastructureTests: true,
    enableChaosTests: true,
    enableE2ETests: true,
    enableLoadTests: false,
    generateReport: true,
    outputDir: './test-results/unified'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--env':
      case '--environment':
        config.environment = args[++i] as 'development' | 'staging' | 'production';
        break;
      case '--real-api':
        config.enableRealApiTests = true;
        break;
      case '--no-infrastructure':
        config.enableInfrastructureTests = false;
        break;
      case '--no-chaos':
        config.enableChaosTests = false;
        break;
      case '--no-e2e':
        config.enableE2ETests = false;
        break;
      case '--load-tests':
        config.enableLoadTests = true;
        break;
      case '--no-report':
        config.generateReport = false;
        break;
      case '--output':
      case '-o':
        config.outputDir = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: tsx scripts/run-unified-tests.ts [options]

Options:
  --env, --environment <env>    Test environment (development|staging|production)
  --real-api                   Enable real API testing (disabled by default)
  --no-infrastructure          Disable infrastructure tests
  --no-chaos                   Disable chaos tests
  --no-e2e                     Disable E2E tests
  --load-tests                 Enable load testing
  --no-report                  Disable report generation
  --output, -o <dir>           Output directory for reports
  --help, -h                   Show this help message

Examples:
  # Run basic test suite
  tsx scripts/run-unified-tests.ts

  # Run with real API tests in staging
  tsx scripts/run-unified-tests.ts --env staging --real-api

  # Run minimal tests with custom output
  tsx scripts/run-unified-tests.ts --no-chaos --no-e2e -o ./custom-results
        `);
        process.exit(0);
    }
  }

  return config;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const config = parseArguments();
    const runner = new UnifiedTestRunner(config);
    await runner.runUnifiedTests();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { UnifiedTestRunner, UnifiedTestConfig };