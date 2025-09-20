/**
 * Chaos Engine - Systematic failure injection for resilience testing
 * Provides controlled chaos scenarios to validate system robustness
 */

import { Page, BrowserContext } from '@playwright/test';

export interface ChaosConfig {
  enabled: boolean;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  duration: number; // milliseconds
  scenarios: ChaosScenarioType[];
}

export type ChaosScenarioType =
  | 'network_failures'
  | 'slow_responses'
  | 'random_errors'
  | 'memory_pressure'
  | 'cpu_throttling'
  | 'storage_errors'
  | 'auth_failures'
  | 'api_timeouts'
  | 'deployment_interruptions'
  | 'resource_exhaustion';

export interface ChaosMetrics {
  scenariosExecuted: ChaosScenarioType[];
  failuresInjected: number;
  systemRecoveries: number;
  degradationEvents: number;
  criticalFailures: number;
  recoveryTime: number; // milliseconds
}

export interface ChaosInjectionResult {
  scenario: ChaosScenarioType;
  success: boolean;
  impact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  recoveryTime?: number;
  errors: string[];
}

/**
 * Chaos Engine for systematic resilience testing
 */
export class ChaosEngine {
  private page: Page;
  private context: BrowserContext;
  private config: ChaosConfig;
  private isActive: boolean = false;
  private metrics: ChaosMetrics;
  private activeInterventions: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    page: Page,
    context: BrowserContext,
    config: Partial<ChaosConfig> = {}
  ) {
    this.page = page;
    this.context = context;
    this.config = {
      enabled: true,
      intensity: 'medium',
      duration: 30000, // 30 seconds
      scenarios: ['network_failures', 'slow_responses', 'random_errors'],
      ...config
    };

    this.metrics = {
      scenariosExecuted: [],
      failuresInjected: 0,
      systemRecoveries: 0,
      degradationEvents: 0,
      criticalFailures: 0,
      recoveryTime: 0
    };
  }

  /**
   * Start chaos engineering scenarios
   */
  async startChaos(): Promise<void> {
    if (!this.config.enabled || this.isActive) return;

    this.isActive = true;
    console.log(`🌪️ Starting chaos engine with ${this.config.intensity} intensity`);

    // Execute configured chaos scenarios
    for (const scenario of this.config.scenarios) {
      await this.executeScenario(scenario);
    }

    // Auto-stop after duration
    setTimeout(() => {
      this.stopChaos();
    }, this.config.duration);
  }

  /**
   * Stop all chaos scenarios
   */
  async stopChaos(): Promise<ChaosMetrics> {
    if (!this.isActive) return this.metrics;

    this.isActive = false;
    console.log('🌪️ Stopping chaos engine');

    // Clear all active interventions
    for (const [id, timeout] of this.activeInterventions) {
      clearTimeout(timeout);
    }
    this.activeInterventions.clear();

    // Reset all route handlers
    await this.page.unroute('**/*');

    return this.metrics;
  }

  /**
   * Execute a specific chaos scenario
   */
  async executeScenario(scenario: ChaosScenarioType): Promise<ChaosInjectionResult> {
    const startTime = Date.now();
    const result: ChaosInjectionResult = {
      scenario,
      success: false,
      impact: 'none',
      duration: 0,
      errors: []
    };

    try {
      switch (scenario) {
        case 'network_failures':
          await this.injectNetworkFailures();
          break;
        case 'slow_responses':
          await this.injectSlowResponses();
          break;
        case 'random_errors':
          await this.injectRandomErrors();
          break;
        case 'memory_pressure':
          await this.injectMemoryPressure();
          break;
        case 'cpu_throttling':
          await this.injectCpuThrottling();
          break;
        case 'storage_errors':
          await this.injectStorageErrors();
          break;
        case 'auth_failures':
          await this.injectAuthFailures();
          break;
        case 'api_timeouts':
          await this.injectApiTimeouts();
          break;
        case 'deployment_interruptions':
          await this.injectDeploymentInterruptions();
          break;
        case 'resource_exhaustion':
          await this.injectResourceExhaustion();
          break;
        default:
          throw new Error(`Unknown chaos scenario: ${scenario}`);
      }

      result.success = true;
      result.impact = this.calculateImpact(scenario);
      this.metrics.scenariosExecuted.push(scenario);
      this.metrics.failuresInjected++;

    } catch (error) {
      result.errors.push(error.message);
      console.error(`Failed to execute chaos scenario ${scenario}:`, error);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Inject network failures
   */
  async injectNetworkFailures(): Promise<void> {
    const failureRate = this.getFailureRate();

    await this.page.route('**/*', (route, request) => {
      if (Math.random() < failureRate) {
        const failures = ['failed', 'aborted', 'timedout', 'internetdisconnected'];
        const failure = failures[Math.floor(Math.random() * failures.length)];
        route.abort(failure as any);
      } else {
        route.continue();
      }
    });

    console.log(`🌪️ Injected network failures (${(failureRate * 100).toFixed(1)}% failure rate)`);
  }

  /**
   * Inject slow responses
   */
  async injectSlowResponses(): Promise<void> {
    const delayRange = this.getDelayRange();

    await this.page.route('**/*', async (route, request) => {
      const delay = Math.random() * (delayRange.max - delayRange.min) + delayRange.min;

      setTimeout(() => {
        route.continue();
      }, delay);
    });

    console.log(`🌪️ Injected slow responses (${delayRange.min}-${delayRange.max}ms delays)`);
  }

  /**
   * Inject random HTTP errors
   */
  async injectRandomErrors(): Promise<void> {
    const errorRate = this.getFailureRate() * 0.5; // Lower error rate than failures

    await this.page.route('**/*', async (route, request) => {
      if (Math.random() < errorRate) {
        const errorCodes = [400, 401, 403, 404, 429, 500, 502, 503, 504];
        const statusCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];

        route.fulfill({
          status: statusCode,
          body: JSON.stringify({
            error: `Chaos-induced error ${statusCode}`,
            message: `Chaos engineering has injected a ${statusCode} error`,
            timestamp: Date.now()
          }),
          headers: { 'content-type': 'application/json' }
        });
      } else {
        route.continue();
      }
    });

    console.log(`🌪️ Injected random HTTP errors (${(errorRate * 100).toFixed(1)}% error rate)`);
  }

  /**
   * Inject memory pressure
   */
  async injectMemoryPressure(): Promise<void> {
    await this.page.addInitScript(() => {
      // Create memory pressure
      const memoryHogs: any[] = [];
      const pressureLevel = window.chaosConfig?.memoryPressure || 'medium';

      const allocateMemory = () => {
        const size = pressureLevel === 'high' ? 1000000 : 500000;
        try {
          memoryHogs.push(new Array(size).fill(Math.random()));

          // Prevent complete memory exhaustion
          if (memoryHogs.length > 100) {
            memoryHogs.splice(0, 20);
          }
        } catch (e) {
          // Memory allocation failed - system is under pressure
          console.warn('Memory allocation failed - high memory pressure detected');
        }
      };

      const interval = setInterval(allocateMemory, 1000);
      window.chaosCleanup = window.chaosCleanup || [];
      window.chaosCleanup.push(() => clearInterval(interval));
    });

    console.log('🌪️ Injected memory pressure');
  }

  /**
   * Inject CPU throttling
   */
  async injectCpuThrottling(): Promise<void> {
    await this.page.addInitScript(() => {
      // CPU-intensive operations
      const cpuWorkers: Worker[] = [];

      try {
        // Create CPU-bound workers
        for (let i = 0; i < 2; i++) {
          const worker = new Worker(URL.createObjectURL(new Blob([`
            let counter = 0;
            const heavyComputation = () => {
              for (let j = 0; j < 1000000; j++) {
                counter += Math.sqrt(Math.random() * Math.PI);
              }
              setTimeout(heavyComputation, 10);
            };
            heavyComputation();
          `], { type: 'application/javascript' })));

          cpuWorkers.push(worker);
        }
      } catch (e) {
        // Fallback for environments without Worker support
        const heavyComputation = () => {
          for (let j = 0; j < 100000; j++) {
            Math.sqrt(Math.random() * Math.PI);
          }
          setTimeout(heavyComputation, 50);
        };
        heavyComputation();
      }

      window.chaosCleanup = window.chaosCleanup || [];
      window.chaosCleanup.push(() => {
        cpuWorkers.forEach(worker => worker.terminate());
      });
    });

    console.log('🌪️ Injected CPU throttling');
  }

  /**
   * Inject storage errors
   */
  async injectStorageErrors(): Promise<void> {
    await this.page.addInitScript(() => {
      // Mock localStorage failures
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;

      localStorage.setItem = function(key: string, value: string) {
        if (Math.random() < 0.3) { // 30% failure rate
          throw new Error('Chaos: Storage quota exceeded');
        }
        return originalSetItem.call(this, key, value);
      };

      localStorage.getItem = function(key: string) {
        if (Math.random() < 0.2) { // 20% failure rate
          throw new Error('Chaos: Storage access denied');
        }
        return originalGetItem.call(this, key);
      };

      window.chaosCleanup = window.chaosCleanup || [];
      window.chaosCleanup.push(() => {
        localStorage.setItem = originalSetItem;
        localStorage.getItem = originalGetItem;
      });
    });

    console.log('🌪️ Injected storage errors');
  }

  /**
   * Inject authentication failures
   */
  async injectAuthFailures(): Promise<void> {
    await this.page.route('**/auth/**', (route, request) => {
      if (Math.random() < 0.4) { // 40% auth failure rate
        route.fulfill({
          status: 401,
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Chaos-induced authentication failure',
            code: 'CHAOS_AUTH_FAILURE'
          }),
          headers: { 'content-type': 'application/json' }
        });
      } else {
        route.continue();
      }
    });

    console.log('🌪️ Injected authentication failures');
  }

  /**
   * Inject API timeouts
   */
  async injectApiTimeouts(): Promise<void> {
    await this.page.route('**/api/**', async (route, request) => {
      if (Math.random() < 0.25) { // 25% timeout rate
        // Never respond to simulate timeout
        // The request will eventually timeout on the client side
        console.log(`🌪️ Simulating timeout for ${request.url()}`);
        return; // Don't call route.continue() or route.fulfill()
      } else {
        route.continue();
      }
    });

    console.log('🌪️ Injected API timeouts');
  }

  /**
   * Inject deployment interruptions
   */
  async injectDeploymentInterruptions(): Promise<void> {
    await this.page.route('**/deployments/**', (route, request) => {
      if (request.method() === 'POST' || request.method() === 'PUT') {
        if (Math.random() < 0.3) { // 30% interruption rate
          // Simulate deployment interruption
          setTimeout(() => {
            route.abort('failed');
          }, Math.random() * 3000 + 1000); // 1-4 second delay before failure
        } else {
          route.continue();
        }
      } else {
        route.continue();
      }
    });

    console.log('🌪️ Injected deployment interruptions');
  }

  /**
   * Inject resource exhaustion
   */
  async injectResourceExhaustion(): Promise<void> {
    await this.page.addInitScript(() => {
      // Simulate various resource exhaustion scenarios
      const resourceHogs: any[] = [];

      // Connection pool exhaustion
      const exhaustConnections = () => {
        for (let i = 0; i < 50; i++) {
          fetch('/api/health', { keepalive: true }).catch(() => {});
        }
      };

      // File descriptor exhaustion (simulated)
      const exhaustDescriptors = () => {
        for (let i = 0; i < 100; i++) {
          const worker = new Worker(URL.createObjectURL(new Blob([''], { type: 'application/javascript' })));
          resourceHogs.push(worker);
        }
      };

      try {
        exhaustConnections();
        exhaustDescriptors();
      } catch (e) {
        console.warn('Resource exhaustion simulation limited by browser security');
      }

      window.chaosCleanup = window.chaosCleanup || [];
      window.chaosCleanup.push(() => {
        resourceHogs.forEach(resource => {
          if (resource && resource.terminate) {
            resource.terminate();
          }
        });
      });
    });

    console.log('🌪️ Injected resource exhaustion');
  }

  /**
   * Inject specific latency delays
   */
  async injectLatency(delayMs: number): Promise<void> {
    await this.page.route('**/*', async (route) => {
      setTimeout(() => route.continue(), delayMs);
    });

    console.log(`🌪️ Injected ${delayMs}ms latency`);
  }

  /**
   * Inject random failures with specified rate
   */
  async injectRandomFailures(failureRate: number): Promise<void> {
    await this.page.route('**/*', (route) => {
      if (Math.random() < failureRate) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    console.log(`🌪️ Injected random failures (${(failureRate * 100).toFixed(1)}% rate)`);
  }

  /**
   * Get current chaos metrics
   */
  getMetrics(): ChaosMetrics {
    return { ...this.metrics };
  }

  private getFailureRate(): number {
    switch (this.config.intensity) {
      case 'low': return 0.1;      // 10%
      case 'medium': return 0.3;   // 30%
      case 'high': return 0.5;     // 50%
      case 'extreme': return 0.7;  // 70%
      default: return 0.3;
    }
  }

  private getDelayRange(): { min: number; max: number } {
    switch (this.config.intensity) {
      case 'low': return { min: 100, max: 500 };       // 100-500ms
      case 'medium': return { min: 500, max: 2000 };   // 500ms-2s
      case 'high': return { min: 1000, max: 5000 };    // 1-5s
      case 'extreme': return { min: 2000, max: 10000 }; // 2-10s
      default: return { min: 500, max: 2000 };
    }
  }

  private calculateImpact(scenario: ChaosScenarioType): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    const impactMap: Record<ChaosScenarioType, 'none' | 'low' | 'medium' | 'high' | 'critical'> = {
      'network_failures': 'high',
      'slow_responses': 'medium',
      'random_errors': 'medium',
      'memory_pressure': 'high',
      'cpu_throttling': 'medium',
      'storage_errors': 'low',
      'auth_failures': 'high',
      'api_timeouts': 'high',
      'deployment_interruptions': 'critical',
      'resource_exhaustion': 'critical'
    };

    return impactMap[scenario] || 'medium';
  }
}

// Global declarations for chaos cleanup
declare global {
  interface Window {
    chaosConfig?: {
      memoryPressure?: 'low' | 'medium' | 'high';
    };
    chaosCleanup?: Array<() => void>;
  }
}