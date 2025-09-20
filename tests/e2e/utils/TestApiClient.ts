/**
 * Hybrid API Testing Framework
 * Supports both mock API testing (existing) and real API integration testing
 * with environment-based configuration switching for HuggingFace and RunPod APIs
 */

import { Page } from '@playwright/test';

export type TestMode = 'mock' | 'real';

export interface TestApiConfig {
  mode: TestMode;
  huggingfaceToken?: string;
  runpodApiKey?: string;
  baseUrl: string;
}

export interface HuggingFaceModel {
  id: string;
  title: string;
  description: string;
  parameters: string;
  tags: string[];
  organization: string;
  downloads?: number;
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RunPodEndpoint {
  id: string;
  name: string;
  status: 'INITIALIZING' | 'RUNNING' | 'STOPPED' | 'FAILED';
  gpuType: string;
  modelId: string;
  cost: {
    hourlyRate: number;
    currentCost: number;
  };
  monitoring: {
    performance: {
      uptime: number;
      avgResponseTime: number;
      requestsPerSecond: number;
      errorRate: number;
    };
    resources: {
      cpuUsage: number;
      gpuUsage: number;
      memoryUsage: number;
    };
    workers: {
      ready: number;
      total: number;
    };
  };
}

export class TestApiClient {
  private mode: TestMode;
  private config: TestApiConfig;
  private page: Page;

  constructor(page: Page, config?: Partial<TestApiConfig>) {
    this.page = page;
    this.mode = this.determineTestMode(config?.mode);
    this.config = {
      mode: this.mode,
      huggingfaceToken: process.env.HUGGINGFACE_TOKEN || config?.huggingfaceToken,
      runpodApiKey: process.env.RUNPOD_API_KEY || config?.runpodApiKey,
      baseUrl: config?.baseUrl || 'http://localhost:3001'
    };

    this.validateConfiguration();
  }

  private determineTestMode(explicitMode?: TestMode): TestMode {
    // Priority: explicit parameter > environment variable > default to mock
    if (explicitMode) return explicitMode;

    const envMode = process.env.E2E_TEST_MODE;
    if (envMode === 'real' || envMode === 'mock') {
      return envMode as TestMode;
    }

    // Default to mock for safety and speed
    return 'mock';
  }

  private validateConfiguration(): void {
    if (this.mode === 'real') {
      if (!this.config.huggingfaceToken) {
        console.warn('Real API mode requested but HUGGINGFACE_TOKEN not available. Some tests may be skipped.');
      }
      if (!this.config.runpodApiKey) {
        console.warn('Real API mode requested but RUNPOD_API_KEY not available. Some tests may be skipped.');
      }
    }
  }

  // Configuration methods
  getMode(): TestMode {
    return this.mode;
  }

  isRealApiMode(): boolean {
    return this.mode === 'real';
  }

  isMockMode(): boolean {
    return this.mode === 'mock';
  }

  hasHuggingFaceToken(): boolean {
    return !!this.config.huggingfaceToken;
  }

  hasRunPodToken(): boolean {
    return !!this.config.runpodApiKey;
  }

  // Mock API setup methods
  async setupMockHuggingFaceApi(): Promise<void> {
    if (this.mode !== 'mock') return;

    // Mock model discovery API
    await this.page.route('**/api/models*', route => {
      const url = new URL(route.request().url());
      const searchParams = url.searchParams;

      const org = searchParams.get('org') || 'swaggystacks';
      const search = searchParams.get('search') || '';
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      const mockModels = this.generateMockModels(org, search, page, limit);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockModels)
      });
    });

    // Mock model details API
    await this.page.route('**/api/models/*', route => {
      const modelId = route.request().url().split('/').pop();
      const modelDetails = this.generateMockModelDetails(modelId || '');

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(modelDetails)
      });
    });
  }

  async setupMockRunPodApi(): Promise<void> {
    if (this.mode !== 'mock') return;

    // Mock deployment creation
    await this.page.route('**/api/deployments', route => {
      if (route.request().method() === 'POST') {
        const deployment = this.generateMockDeployment();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(deployment)
        });
      } else {
        // GET - list deployments
        const deployments = [this.generateMockDeployment()];
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(deployments)
        });
      }
    });

    // Mock deployment operations
    await this.page.route('**/api/deployments/*/stop', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await this.page.route('**/api/deployments/*/restart', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await this.page.route('**/api/deployments/*/terminate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  }

  // Real API configuration methods
  async setupRealApiMode(): Promise<void> {
    if (this.mode !== 'real') return;

    // Set headers to indicate real API mode
    await this.page.setExtraHTTPHeaders({
      'E2E-TEST-MODE': 'real',
      ...(this.config.huggingfaceToken && {
        'Authorization': `Bearer ${this.config.huggingfaceToken}`
      })
    });

    // Configure API endpoints to use real services
    await this.page.addInitScript((config) => {
      window.E2E_CONFIG = {
        mode: 'real',
        apiEndpoints: {
          huggingface: 'https://huggingface.co/api',
          runpod: 'https://api.runpod.ai/graphql'
        },
        tokens: {
          huggingface: config.huggingfaceToken,
          runpod: config.runpodApiKey
        }
      };
    }, this.config);
  }

  // Mock data generators
  private generateMockModels(org: string, search: string, page: number, limit: number): {
    models: HuggingFaceModel[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const orgModels = {
      swaggystacks: [
        {
          id: 'swaggystacks/gaming-chatbot',
          title: 'Gaming Chatbot Pro',
          description: 'Advanced gaming-focused conversational AI for immersive experiences',
          parameters: '1.5B',
          tags: ['gaming', 'chatbot', 'entertainment', 'conversational'],
          organization: 'swaggystacks',
          downloads: 15420,
          likes: 234
        },
        {
          id: 'swaggystacks/code-assistant',
          title: 'Developer Code Assistant',
          description: 'AI-powered coding assistant optimized for modern development workflows',
          parameters: '7B',
          tags: ['coding', 'development', 'assistant', 'programming'],
          organization: 'swaggystacks',
          downloads: 8932,
          likes: 187
        },
        {
          id: 'swaggystacks/terminal-gpt',
          title: 'Terminal GPT',
          description: 'Command-line optimized language model for terminal enthusiasts',
          parameters: '3B',
          tags: ['terminal', 'cli', 'developer-tools', 'bash'],
          organization: 'swaggystacks',
          downloads: 5643,
          likes: 145
        }
      ],
      scientia: [
        {
          id: 'scientia/financial-analyzer',
          title: 'Financial Analyzer Pro',
          description: 'Enterprise-grade financial data analysis and risk assessment model',
          parameters: '13B',
          tags: ['finance', 'analysis', 'enterprise', 'risk-assessment'],
          organization: 'scientia',
          downloads: 3245,
          likes: 89
        },
        {
          id: 'scientia/market-intelligence',
          title: 'Market Intelligence Suite',
          description: 'Comprehensive market analysis and forecasting for strategic decisions',
          parameters: '30B',
          tags: ['market', 'intelligence', 'forecasting', 'analytics'],
          organization: 'scientia',
          downloads: 1876,
          likes: 67
        },
        {
          id: 'scientia/compliance-monitor',
          title: 'Compliance Monitor AI',
          description: 'Automated compliance monitoring and regulatory analysis system',
          parameters: '70B',
          tags: ['compliance', 'regulatory', 'monitoring', 'governance'],
          organization: 'scientia',
          downloads: 945,
          likes: 34
        }
      ]
    };

    let models = orgModels[org as keyof typeof orgModels] || orgModels.swaggystacks;

    // Apply search filter
    if (search) {
      models = models.filter(model =>
        model.title.toLowerCase().includes(search.toLowerCase()) ||
        model.description.toLowerCase().includes(search.toLowerCase()) ||
        model.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedModels = models.slice(startIndex, endIndex);

    return {
      models: paginatedModels,
      total: models.length,
      page,
      totalPages: Math.ceil(models.length / limit)
    };
  }

  private generateMockModelDetails(modelId: string): HuggingFaceModel {
    return {
      id: modelId,
      title: `Model ${modelId.split('/').pop()}`,
      description: `Detailed description for ${modelId}`,
      parameters: '7B',
      tags: ['test', 'mock', 'model'],
      organization: modelId.includes('scientia') ? 'scientia' : 'swaggystacks',
      downloads: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 500),
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    };
  }

  private generateMockDeployment(): RunPodEndpoint {
    const deploymentId = `test-deployment-${Date.now()}`;

    return {
      id: deploymentId,
      name: `Deployment ${deploymentId}`,
      status: 'RUNNING',
      gpuType: 'NVIDIA_A6000',
      modelId: 'microsoft/DialoGPT-medium',
      cost: {
        hourlyRate: 0.89,
        currentCost: 2.67
      },
      monitoring: {
        performance: {
          uptime: 99.9,
          avgResponseTime: 150,
          requestsPerSecond: 12.5,
          errorRate: 0.1
        },
        resources: {
          cpuUsage: 45.2,
          gpuUsage: 78.5,
          memoryUsage: 62.3
        },
        workers: {
          ready: 2,
          total: 2
        }
      }
    };
  }

  // Error simulation methods
  async simulateApiError(endpoint: string, errorType: 'timeout' | 'server_error' | 'rate_limit' | 'auth_error'): Promise<void> {
    await this.page.route(endpoint, route => {
      switch (errorType) {
        case 'timeout':
          // Don't respond to simulate timeout
          return;
        case 'server_error':
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal Server Error' })
          });
          break;
        case 'rate_limit':
          route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Rate limit exceeded' })
          });
          break;
        case 'auth_error':
          route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unauthorized' })
          });
          break;
      }
    });
  }

  // Utility methods
  async skipIfNoRealApiAccess(testName: string): Promise<boolean> {
    if (this.mode === 'real' && !this.hasHuggingFaceToken() && !this.hasRunPodToken()) {
      console.log(`Skipping test "${testName}" - Real API mode requested but no API tokens available`);
      return true;
    }
    return false;
  }

  async skipIfNoHuggingFaceAccess(testName: string): Promise<boolean> {
    if (this.mode === 'real' && !this.hasHuggingFaceToken()) {
      console.log(`Skipping test "${testName}" - Real API mode requested but HUGGINGFACE_TOKEN not available`);
      return true;
    }
    return false;
  }

  async skipIfNoRunPodAccess(testName: string): Promise<boolean> {
    if (this.mode === 'real' && !this.hasRunPodToken()) {
      console.log(`Skipping test "${testName}" - Real API mode requested but RUNPOD_API_KEY not available`);
      return true;
    }
    return false;
  }

  // Performance monitoring
  async measureApiResponseTime(endpoint: string): Promise<number> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      this.page.route(endpoint, route => {
        const responseTime = Date.now() - startTime;
        route.continue();
        resolve(responseTime);
      });
    });
  }

  // Cleanup methods
  async cleanup(): Promise<void> {
    // Remove all route handlers
    await this.page.unrouteAll();

    // Clear any test-specific headers
    if (this.mode === 'real') {
      await this.page.setExtraHTTPHeaders({});
    }
  }
}

// Factory function for easy instantiation
export function createTestApiClient(page: Page, mode?: TestMode): TestApiClient {
  return new TestApiClient(page, { mode });
}

// Type guards for test condition checking
export function isRealApiTest(): boolean {
  return process.env.E2E_TEST_MODE === 'real';
}

export function hasRequiredTokens(): boolean {
  return !!(process.env.HUGGINGFACE_TOKEN && process.env.RUNPOD_API_KEY);
}

export function canRunRealApiTests(): boolean {
  return isRealApiTest() && hasRequiredTokens();
}