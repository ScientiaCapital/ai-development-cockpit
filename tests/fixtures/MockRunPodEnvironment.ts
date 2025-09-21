/**
 * MockRunPodEnvironment - Simulates RunPod infrastructure for testing
 * Provides realistic deployment scenarios without actual cloud resources
 */

import { Page } from '@playwright/test';

export interface DeploymentConfig {
  modelId: string;
  gpuType: string;
  instanceCount: number;
  autoScaling?: boolean;
  maxInstances?: number;
  minInstances?: number;
  envVars?: Record<string, string>;
  templateId?: string;
  organization?: 'swaggystacks' | 'scientia';
}

export interface MockDeployment {
  deploymentId: string;
  status: 'creating' | 'running' | 'stopped' | 'failed' | 'stopping';
  config: DeploymentConfig;
  createdAt: number;
  readyAt?: number;
  stoppedAt?: number;
  errorMessage?: string;
  metrics: DeploymentMetrics;
  cost: CostMetrics;
  endpoints: EndpointInfo[];
}

export interface DeploymentMetrics {
  performance: {
    uptime: number; // percentage
    avgResponseTime: number; // milliseconds
    requestsPerSecond: number;
    errorRate: number; // percentage
  };
  resources: {
    cpuUsage: number; // percentage
    gpuUsage: number; // percentage
    memoryUsage: number; // percentage
    gpuMemory?: number; // percentage
  };
  workers: {
    ready: number;
    total: number;
    pending?: number;
  };
}

export interface CostMetrics {
  hourlyRate: number; // dollars per hour
  totalCost: number; // accumulated cost
  estimatedMonthlyCost: number;
  costBreakdown?: {
    compute: number;
    storage: number;
    network: number;
  };
}

export interface EndpointInfo {
  url: string;
  type: 'inference' | 'health' | 'metrics';
  status: 'active' | 'inactive';
}

export interface InfrastructureScenario {
  name: string;
  description: string;
  deploymentLatency: { min: number; max: number }; // milliseconds
  failureRate: number; // 0-1
  performanceVariability: number; // 0-1, affects metric consistency
  resourceLimits: {
    maxConcurrentDeployments: number;
    gpuTypes: string[];
    maxInstancesPerDeployment: number;
  };
  costMultiplier: number; // affects pricing for scenario
  networkConditions: 'stable' | 'unstable' | 'degraded';
}

export class MockRunPodEnvironment {
  private deployments: Map<string, MockDeployment> = new Map();
  private deploymentCounter = 0;
  private currentScenario: InfrastructureScenario;
  private page: Page;
  private isActive = false;

  // Predefined scenarios for different testing needs
  private scenarios: Record<string, InfrastructureScenario> = {
    stable: {
      name: 'Stable Infrastructure',
      description: 'Optimal conditions with fast deployments and reliable performance',
      deploymentLatency: { min: 5000, max: 15000 },
      failureRate: 0.02,
      performanceVariability: 0.1,
      resourceLimits: {
        maxConcurrentDeployments: 50,
        gpuTypes: ['NVIDIA_RTX_A6000', 'NVIDIA_A100_SXM4_80GB', 'NVIDIA_A40'],
        maxInstancesPerDeployment: 10
      },
      costMultiplier: 1.0,
      networkConditions: 'stable'
    },

    stressed: {
      name: 'High Load Infrastructure',
      description: 'System under heavy load with slower deployments',
      deploymentLatency: { min: 15000, max: 45000 },
      failureRate: 0.1,
      performanceVariability: 0.3,
      resourceLimits: {
        maxConcurrentDeployments: 20,
        gpuTypes: ['NVIDIA_RTX_A6000', 'NVIDIA_A40'],
        maxInstancesPerDeployment: 5
      },
      costMultiplier: 1.2,
      networkConditions: 'unstable'
    },

    degraded: {
      name: 'Degraded Infrastructure',
      description: 'Infrastructure issues with high failure rates and poor performance',
      deploymentLatency: { min: 30000, max: 120000 },
      failureRate: 0.25,
      performanceVariability: 0.5,
      resourceLimits: {
        maxConcurrentDeployments: 10,
        gpuTypes: ['NVIDIA_RTX_A6000'],
        maxInstancesPerDeployment: 2
      },
      costMultiplier: 0.8, // Lower cost due to issues
      networkConditions: 'degraded'
    },

    enterprise: {
      name: 'Enterprise Infrastructure',
      description: 'High-performance setup optimized for enterprise workloads',
      deploymentLatency: { min: 8000, max: 25000 },
      failureRate: 0.01,
      performanceVariability: 0.05,
      resourceLimits: {
        maxConcurrentDeployments: 100,
        gpuTypes: ['NVIDIA_A100_SXM4_80GB', 'NVIDIA_H100_SXM5_80GB'],
        maxInstancesPerDeployment: 20
      },
      costMultiplier: 1.5,
      networkConditions: 'stable'
    },

    development: {
      name: 'Development Infrastructure',
      description: 'Budget-friendly setup for development and testing',
      deploymentLatency: { min: 10000, max: 30000 },
      failureRate: 0.05,
      performanceVariability: 0.2,
      resourceLimits: {
        maxConcurrentDeployments: 15,
        gpuTypes: ['NVIDIA_RTX_A6000', 'NVIDIA_A40'],
        maxInstancesPerDeployment: 3
      },
      costMultiplier: 0.7,
      networkConditions: 'stable'
    }
  };

  constructor(page: Page, scenarioName: keyof typeof MockRunPodEnvironment.prototype.scenarios = 'stable') {
    this.page = page;
    this.currentScenario = this.scenarios[scenarioName];
    if (!this.currentScenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }
  }

  /**
   * Initialize the mock environment and set up API route interceptions
   */
  async initialize(): Promise<void> {
    if (this.isActive) {
      throw new Error('MockRunPodEnvironment is already initialized');
    }

    console.log(`Initializing MockRunPodEnvironment with scenario: ${this.currentScenario.name}`);

    // Set up API route mocking
    await this.setupApiRoutes();
    this.isActive = true;

    // Start background processes
    this.startMetricsUpdater();
    this.startCostCalculator();
  }

  /**
   * Clean up the mock environment
   */
  async cleanup(): Promise<void> {
    if (!this.isActive) return;

    this.deployments.clear();
    this.isActive = false;
    console.log('MockRunPodEnvironment cleaned up');
  }

  /**
   * Switch to a different infrastructure scenario
   */
  async switchScenario(scenarioName: keyof typeof MockRunPodEnvironment.prototype.scenarios): Promise<void> {
    const newScenario = this.scenarios[scenarioName];
    if (!newScenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    console.log(`Switching from "${this.currentScenario.name}" to "${newScenario.name}"`);
    this.currentScenario = newScenario;

    // Update existing deployments to reflect new scenario
    for (const deployment of this.deployments.values()) {
      this.updateDeploymentForScenario(deployment);
    }
  }

  /**
   * Create a new mock deployment
   */
  async createDeployment(config: DeploymentConfig): Promise<string> {
    if (!this.isActive) {
      throw new Error('MockRunPodEnvironment not initialized');
    }

    const deploymentId = `mock-deployment-${++this.deploymentCounter}`;

    // Validate against scenario limits
    const activeDeployments = Array.from(this.deployments.values())
      .filter(d => d.status === 'running' || d.status === 'creating').length;

    if (activeDeployments >= this.currentScenario.resourceLimits.maxConcurrentDeployments) {
      throw new Error(`Maximum concurrent deployments reached (${this.currentScenario.resourceLimits.maxConcurrentDeployments})`);
    }

    if (!this.currentScenario.resourceLimits.gpuTypes.includes(config.gpuType)) {
      throw new Error(`GPU type ${config.gpuType} not available in current scenario`);
    }

    if (config.instanceCount > this.currentScenario.resourceLimits.maxInstancesPerDeployment) {
      throw new Error(`Instance count ${config.instanceCount} exceeds limit of ${this.currentScenario.resourceLimits.maxInstancesPerDeployment}`);
    }

    // Simulate deployment failure based on scenario failure rate
    if (Math.random() < this.currentScenario.failureRate) {
      const failedDeployment: MockDeployment = {
        deploymentId,
        status: 'failed',
        config,
        createdAt: Date.now(),
        errorMessage: 'Deployment failed due to infrastructure issues',
        metrics: this.generateInitialMetrics(),
        cost: this.calculateCost(config, 0),
        endpoints: []
      };

      this.deployments.set(deploymentId, failedDeployment);
      return deploymentId;
    }

    // Create successful deployment
    const deployment: MockDeployment = {
      deploymentId,
      status: 'creating',
      config,
      createdAt: Date.now(),
      metrics: this.generateInitialMetrics(),
      cost: this.calculateCost(config, 0),
      endpoints: []
    };

    this.deployments.set(deploymentId, deployment);

    // Simulate deployment process
    this.simulateDeploymentLifecycle(deploymentId);

    return deploymentId;
  }

  /**
   * Get deployment status and information
   */
  getDeployment(deploymentId: string): MockDeployment | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get all deployments
   */
  getAllDeployments(): MockDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Stop a deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (deployment.status === 'stopped' || deployment.status === 'failed') {
      return; // Already stopped
    }

    deployment.status = 'stopping';

    // Simulate stop time
    setTimeout(() => {
      deployment.status = 'stopped';
      deployment.stoppedAt = Date.now();
      deployment.metrics.workers.ready = 0;
      deployment.endpoints = deployment.endpoints.map(ep => ({ ...ep, status: 'inactive' as const }));
    }, 2000 + Math.random() * 3000);
  }

  /**
   * Simulate infrastructure scenarios for testing
   */
  async simulateInfrastructureEvent(event: 'outage' | 'maintenance' | 'capacity_limit' | 'network_issue'): Promise<void> {
    console.log(`Simulating infrastructure event: ${event}`);

    switch (event) {
      case 'outage':
        // Stop random deployments
        const runningDeployments = Array.from(this.deployments.values())
          .filter(d => d.status === 'running');

        const affectedCount = Math.ceil(runningDeployments.length * 0.3); // 30% affected
        for (let i = 0; i < affectedCount; i++) {
          const deployment = runningDeployments[Math.floor(Math.random() * runningDeployments.length)];
          deployment.status = 'failed';
          deployment.errorMessage = 'Infrastructure outage';
        }
        break;

      case 'maintenance':
        // Increase deployment latency temporarily
        const originalLatency = this.currentScenario.deploymentLatency;
        this.currentScenario.deploymentLatency = {
          min: originalLatency.min * 2,
          max: originalLatency.max * 2
        };

        setTimeout(() => {
          this.currentScenario.deploymentLatency = originalLatency;
        }, 30000); // 30 seconds of maintenance
        break;

      case 'capacity_limit':
        // Reduce concurrent deployment limit
        this.currentScenario.resourceLimits.maxConcurrentDeployments =
          Math.max(1, Math.floor(this.currentScenario.resourceLimits.maxConcurrentDeployments * 0.5));
        break;

      case 'network_issue':
        // Increase performance variability
        this.currentScenario.performanceVariability = Math.min(1.0, this.currentScenario.performanceVariability * 2);
        break;
    }
  }

  /**
   * Set up API route interceptions for Playwright
   */
  private async setupApiRoutes(): Promise<void> {
    // Mock deployment creation endpoint
    await this.page.route('**/api/deployments', async route => {
      const method = route.request().method();

      if (method === 'POST') {
        // Handle deployment creation
        const requestData = route.request().postDataJSON();

        try {
          const deploymentId = await this.createDeployment(requestData as DeploymentConfig);
          const deployment = this.getDeployment(deploymentId);

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(deployment)
          });
        } catch (error: unknown) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Deployment creation failed'
            })
          });
        }
      } else if (method === 'GET') {
        // Handle deployment listing
        const deployments = this.getAllDeployments();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(deployments)
        });
      }
    });

    // Mock individual deployment endpoints
    await this.page.route('**/api/deployments/*', async route => {
      const url = new URL(route.request().url());
      const pathParts = url.pathname.split('/');
      const deploymentId = pathParts[pathParts.length - 1];

      if (route.request().method() === 'GET') {
        const deployment = this.getDeployment(deploymentId);
        if (deployment) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(deployment)
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Deployment not found' })
          });
        }
      }
    });

    // Mock deployment action endpoints
    await this.page.route('**/api/deployments/*/stop', async route => {
      const pathParts = route.request().url().split('/');
      const deploymentId = pathParts[pathParts.length - 2];

      try {
        await this.stopDeployment(deploymentId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } catch (error: unknown) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Stop deployment failed'
          })
        });
      }
    });
  }

  /**
   * Simulate the deployment lifecycle
   */
  private async simulateDeploymentLifecycle(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return;

    // Calculate deployment time based on scenario
    const deploymentTime = this.currentScenario.deploymentLatency.min +
      Math.random() * (this.currentScenario.deploymentLatency.max - this.currentScenario.deploymentLatency.min);

    setTimeout(() => {
      if (deployment.status === 'creating') {
        deployment.status = 'running';
        deployment.readyAt = Date.now();
        deployment.endpoints = this.generateEndpoints(deployment.config);
        deployment.metrics.workers.ready = deployment.config.instanceCount;
      }
    }, deploymentTime);
  }

  /**
   * Generate initial metrics for a deployment
   */
  private generateInitialMetrics(): DeploymentMetrics {
    return {
      performance: {
        uptime: 0,
        avgResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0
      },
      resources: {
        cpuUsage: 0,
        gpuUsage: 0,
        memoryUsage: 0,
        gpuMemory: 0
      },
      workers: {
        ready: 0,
        total: 0
      }
    };
  }

  /**
   * Calculate cost metrics for a deployment
   */
  private calculateCost(config: DeploymentConfig, uptimeHours: number): CostMetrics {
    const baseRates: Record<string, number> = {
      'NVIDIA_RTX_A6000': 0.89,
      'NVIDIA_A100_SXM4_80GB': 2.49,
      'NVIDIA_A40': 0.79,
      'NVIDIA_H100_SXM5_80GB': 4.99
    };

    const baseRate = baseRates[config.gpuType] || 1.0;
    const instanceMultiplier = config.instanceCount;
    const scenarioMultiplier = this.currentScenario.costMultiplier;

    const hourlyRate = baseRate * instanceMultiplier * scenarioMultiplier;

    return {
      hourlyRate,
      totalCost: hourlyRate * uptimeHours,
      estimatedMonthlyCost: hourlyRate * 24 * 30,
      costBreakdown: {
        compute: hourlyRate * 0.8,
        storage: hourlyRate * 0.1,
        network: hourlyRate * 0.1
      }
    };
  }

  /**
   * Generate endpoint information for a deployment
   */
  private generateEndpoints(config: DeploymentConfig): EndpointInfo[] {
    const baseUrl = `https://mock-runpod-${Math.random().toString(36).substr(2, 9)}.runpod.cloud`;

    return [
      {
        url: `${baseUrl}/inference`,
        type: 'inference',
        status: 'active'
      },
      {
        url: `${baseUrl}/health`,
        type: 'health',
        status: 'active'
      },
      {
        url: `${baseUrl}/metrics`,
        type: 'metrics',
        status: 'active'
      }
    ];
  }

  /**
   * Update deployment metrics for scenario characteristics
   */
  private updateDeploymentForScenario(deployment: MockDeployment): void {
    if (deployment.status === 'running') {
      const variability = this.currentScenario.performanceVariability;

      // Add scenario-based performance characteristics
      deployment.metrics.performance.avgResponseTime *= (1 + variability * (Math.random() - 0.5));
      deployment.metrics.performance.errorRate = Math.min(
        deployment.metrics.performance.errorRate + (variability * Math.random() * 0.1),
        0.2
      );

      // Update cost calculation
      const uptimeHours = deployment.readyAt ? (Date.now() - deployment.readyAt) / (1000 * 60 * 60) : 0;
      deployment.cost = this.calculateCost(deployment.config, uptimeHours);
    }
  }

  /**
   * Start background metrics updater
   */
  private startMetricsUpdater(): void {
    const updateInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(updateInterval);
        return;
      }

      for (const deployment of this.deployments.values()) {
        if (deployment.status === 'running') {
          this.updateDeploymentMetrics(deployment);
        }
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Start background cost calculator
   */
  private startCostCalculator(): void {
    const costInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(costInterval);
        return;
      }

      for (const deployment of this.deployments.values()) {
        if (deployment.status === 'running' && deployment.readyAt) {
          const uptimeHours = (Date.now() - deployment.readyAt) / (1000 * 60 * 60);
          deployment.cost = this.calculateCost(deployment.config, uptimeHours);
        }
      }
    }, 60000); // Update every minute
  }

  /**
   * Update deployment metrics with realistic variations
   */
  private updateDeploymentMetrics(deployment: MockDeployment): void {
    const variability = this.currentScenario.performanceVariability;
    const basePerformance = {
      uptime: 99.5,
      avgResponseTime: 150,
      requestsPerSecond: 12,
      errorRate: 0.01
    };

    const baseResources = {
      cpuUsage: 45,
      gpuUsage: 75,
      memoryUsage: 60,
      gpuMemory: 80
    };

    // Apply variability and scenario characteristics
    deployment.metrics.performance = {
      uptime: Math.max(0, basePerformance.uptime - (variability * Math.random() * 5)),
      avgResponseTime: basePerformance.avgResponseTime * (1 + variability * (Math.random() - 0.5) * 0.5),
      requestsPerSecond: basePerformance.requestsPerSecond * (1 + variability * (Math.random() - 0.5) * 0.3),
      errorRate: Math.min(basePerformance.errorRate + (variability * Math.random() * 0.05), 0.1)
    };

    deployment.metrics.resources = {
      cpuUsage: Math.max(0, Math.min(100, baseResources.cpuUsage + (variability * (Math.random() - 0.5) * 20))),
      gpuUsage: Math.max(0, Math.min(100, baseResources.gpuUsage + (variability * (Math.random() - 0.5) * 15))),
      memoryUsage: Math.max(0, Math.min(100, baseResources.memoryUsage + (variability * (Math.random() - 0.5) * 25))),
      gpuMemory: Math.max(0, Math.min(100, baseResources.gpuMemory + (variability * (Math.random() - 0.5) * 10)))
    };
  }

  /**
   * Get current scenario information
   */
  getCurrentScenario(): InfrastructureScenario {
    return { ...this.currentScenario };
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios(): Record<string, InfrastructureScenario> {
    return { ...this.scenarios };
  }
}