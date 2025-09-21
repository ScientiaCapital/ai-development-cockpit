import { TestApiClient, ApiTestResult } from '../e2e/utils/TestApiClient';

export interface RealApiConfig {
  huggingface: {
    enabled: boolean;
    organizations: string[];
    authToken?: string;
    baseUrl: string;
    timeout: number;
  };
  runpod: {
    enabled: boolean;
    endpoints: string[];
    authToken?: string;
    baseUrl: string;
    timeout: number;
  };
  verification: {
    validateSchema: boolean;
    validateAuth: boolean;
    validatePerformance: boolean;
    checkRateLimit: boolean;
    enableRetries: boolean;
    maxRetries: number;
  };
}

export interface ApiEndpointInfo {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expectedStatus: number;
  requiresAuth: boolean;
  expectedSchema?: any;
  timeout?: number;
}

export interface ApiValidationResult {
  endpoint: string;
  method: string;
  success: boolean;
  responseTime: number;
  statusCode: number;
  error?: string;
  validationDetails: {
    authValidation: boolean;
    schemaValidation: boolean;
    performanceValidation: boolean;
    rateLimitValidation: boolean;
  };
  retryAttempts: number;
  timestamp: string;
}

export interface BatchValidationResult {
  summary: {
    totalEndpoints: number;
    successfulValidations: number;
    failedValidations: number;
    averageResponseTime: number;
    totalDuration: number;
  };
  results: ApiValidationResult[];
  recommendations: string[];
}

/**
 * Real API Validator for live endpoint testing and validation
 * Supports HuggingFace and RunPod APIs with comprehensive validation
 */
export class RealApiValidator {
  private config: RealApiConfig;
  private apiClient: TestApiClient;

  constructor(config: RealApiConfig) {
    this.config = config;
    this.apiClient = new TestApiClient();
  }

  /**
   * Initialize the validator with authentication and configuration
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing Real API Validator...');

    await this.apiClient.initialize();

    // Validate configuration
    await this.validateConfiguration();

    console.log('✅ Real API Validator initialized successfully');
  }

  /**
   * Validate a single API endpoint
   */
  async validateEndpoint(endpointInfo: ApiEndpointInfo): Promise<ApiValidationResult> {
    console.log(`🌐 Validating API endpoint: ${endpointInfo.method} ${endpointInfo.url}`);

    const startTime = Date.now();
    let retryAttempts = 0;

    const result: ApiValidationResult = {
      endpoint: endpointInfo.url,
      method: endpointInfo.method,
      success: false,
      responseTime: 0,
      statusCode: 0,
      validationDetails: {
        authValidation: false,
        schemaValidation: false,
        performanceValidation: false,
        rateLimitValidation: false
      },
      retryAttempts: 0,
      timestamp: new Date().toISOString()
    };

    try {
      // Attempt API call with retries
      const response = await this.makeApiCallWithRetries(endpointInfo, retryAttempts);

      result.responseTime = Date.now() - startTime;
      result.statusCode = response.status;
      result.retryAttempts = retryAttempts;

      // Validate response status
      if (response.status === endpointInfo.expectedStatus) {
        result.success = true;
        console.log(`✅ Endpoint validation passed: ${endpointInfo.url}`);
      } else {
        result.error = `Expected status ${endpointInfo.expectedStatus}, got ${response.status}`;
        console.warn(`⚠️ Status validation failed: ${endpointInfo.url}`);
      }

      // Perform detailed validations
      await this.performDetailedValidations(endpointInfo, response, result);

    } catch (error) {
      result.responseTime = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : String(error);
      result.retryAttempts = retryAttempts;

      console.error(`❌ Endpoint validation failed: ${endpointInfo.url}`, error);
    }

    return result;
  }

  /**
   * Validate HuggingFace organization endpoints
   */
  async validateHuggingFaceEndpoints(): Promise<BatchValidationResult> {
    if (!this.config.huggingface.enabled) {
      console.log('⏭️ HuggingFace validation disabled in configuration');
      return this.createEmptyBatchResult();
    }

    console.log('🤗 Validating HuggingFace API endpoints...');

    const endpoints: ApiEndpointInfo[] = [];

    // Add organization endpoints
    for (const org of this.config.huggingface.organizations) {
      endpoints.push(
        {
          url: `${this.config.huggingface.baseUrl}/api/models/${org}`,
          method: 'GET',
          expectedStatus: 200,
          requiresAuth: true,
          timeout: this.config.huggingface.timeout
        },
        {
          url: `${this.config.huggingface.baseUrl}/api/datasets/${org}`,
          method: 'GET',
          expectedStatus: 200,
          requiresAuth: true,
          timeout: this.config.huggingface.timeout
        }
      );
    }

    // Add general API endpoints
    endpoints.push(
      {
        url: `${this.config.huggingface.baseUrl}/api/whoami`,
        method: 'GET',
        expectedStatus: 200,
        requiresAuth: true,
        timeout: this.config.huggingface.timeout
      },
      {
        url: `${this.config.huggingface.baseUrl}/api/models`,
        method: 'GET',
        expectedStatus: 200,
        requiresAuth: false,
        timeout: this.config.huggingface.timeout
      }
    );

    return await this.validateEndpointBatch(endpoints, 'HuggingFace');
  }

  /**
   * Validate RunPod API endpoints
   */
  async validateRunPodEndpoints(): Promise<BatchValidationResult> {
    if (!this.config.runpod.enabled) {
      console.log('⏭️ RunPod validation disabled in configuration');
      return this.createEmptyBatchResult();
    }

    console.log('🏃‍♂️ Validating RunPod API endpoints...');

    const endpoints: ApiEndpointInfo[] = [];

    // Add configured endpoints
    for (const endpoint of this.config.runpod.endpoints) {
      endpoints.push({
        url: endpoint,
        method: 'GET',
        expectedStatus: 200,
        requiresAuth: true,
        timeout: this.config.runpod.timeout
      });
    }

    // Add standard RunPod API endpoints
    endpoints.push(
      {
        url: `${this.config.runpod.baseUrl}/graphql`,
        method: 'POST',
        expectedStatus: 200,
        requiresAuth: true,
        timeout: this.config.runpod.timeout
      },
      {
        url: `${this.config.runpod.baseUrl}/health`,
        method: 'GET',
        expectedStatus: 200,
        requiresAuth: false,
        timeout: this.config.runpod.timeout
      }
    );

    return await this.validateEndpointBatch(endpoints, 'RunPod');
  }

  /**
   * Validate custom API endpoints
   */
  async validateCustomEndpoints(endpoints: ApiEndpointInfo[]): Promise<BatchValidationResult> {
    console.log(`🔧 Validating ${endpoints.length} custom API endpoints...`);

    return await this.validateEndpointBatch(endpoints, 'Custom');
  }

  /**
   * Run comprehensive API validation for all configured services
   */
  async runComprehensiveValidation(): Promise<{
    huggingface: BatchValidationResult;
    runpod: BatchValidationResult;
    overall: BatchValidationResult;
  }> {
    console.log('🚀 Running comprehensive API validation...');

    const startTime = Date.now();

    // Run validations in parallel
    const [huggingfaceResults, runpodResults] = await Promise.all([
      this.validateHuggingFaceEndpoints(),
      this.validateRunPodEndpoints()
    ]);

    // Combine results for overall summary
    const allResults: ApiValidationResult[] = [
      ...huggingfaceResults.results,
      ...runpodResults.results
    ];

    const overall = this.createBatchResultFromResults(allResults, Date.now() - startTime);

    console.log(`🎉 Comprehensive API validation completed in ${overall.summary.totalDuration}ms`);

    return {
      huggingface: huggingfaceResults,
      runpod: runpodResults,
      overall
    };
  }

  /**
   * Test API authentication
   */
  async testAuthentication(service: 'huggingface' | 'runpod'): Promise<ApiValidationResult> {
    console.log(`🔐 Testing authentication for ${service}...`);

    const config = service === 'huggingface' ? this.config.huggingface : this.config.runpod;

    if (!config.authToken) {
      throw new Error(`No auth token configured for ${service}`);
    }

    const authEndpoint: ApiEndpointInfo = {
      url: service === 'huggingface'
        ? `${config.baseUrl}/api/whoami`
        : `${config.baseUrl}/graphql`,
      method: service === 'huggingface' ? 'GET' : 'POST',
      expectedStatus: 200,
      requiresAuth: true,
      timeout: config.timeout
    };

    const result = await this.validateEndpoint(authEndpoint);

    if (result.success) {
      console.log(`✅ Authentication test passed for ${service}`);
    } else {
      console.error(`❌ Authentication test failed for ${service}:`, result.error);
    }

    return result;
  }

  /**
   * Perform load testing on API endpoints
   */
  async performLoadTest(
    endpointInfo: ApiEndpointInfo,
    options: { concurrentRequests: number; duration: number }
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    requestsPerSecond: number;
  }> {
    console.log(`⚡ Performing load test on ${endpointInfo.url}...`);

    const results: number[] = [];
    const errors: string[] = [];
    const startTime = Date.now();

    const makeRequest = async (): Promise<void> => {
      const requestStart = Date.now();
      try {
        const response = await this.makeApiCall(endpointInfo);
        const responseTime = Date.now() - requestStart;
        results.push(responseTime);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    };

    // Create concurrent requests
    const promises: Promise<void>[] = [];
    for (let i = 0; i < options.concurrentRequests; i++) {
      promises.push(makeRequest());
    }

    // Wait for all requests to complete or timeout
    await Promise.allSettled(promises);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const loadTestResult = {
      totalRequests: options.concurrentRequests,
      successfulRequests: results.length,
      failedRequests: errors.length,
      averageResponseTime: results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0,
      maxResponseTime: results.length > 0 ? Math.max(...results) : 0,
      minResponseTime: results.length > 0 ? Math.min(...results) : 0,
      requestsPerSecond: (results.length / totalDuration) * 1000
    };

    console.log(`📊 Load test completed:`, loadTestResult);
    return loadTestResult;
  }

  // Private helper methods

  private async validateConfiguration(): Promise<void> {
    if (this.config.huggingface.enabled && !this.config.huggingface.authToken) {
      console.warn('⚠️ HuggingFace enabled but no auth token provided');
    }

    if (this.config.runpod.enabled && !this.config.runpod.authToken) {
      console.warn('⚠️ RunPod enabled but no auth token provided');
    }

    if (this.config.huggingface.organizations.length === 0 && this.config.huggingface.enabled) {
      console.warn('⚠️ HuggingFace enabled but no organizations configured');
    }

    if (this.config.runpod.endpoints.length === 0 && this.config.runpod.enabled) {
      console.warn('⚠️ RunPod enabled but no endpoints configured');
    }
  }

  private async makeApiCallWithRetries(endpointInfo: ApiEndpointInfo, retryCount: number): Promise<any> {
    const maxRetries = this.config.verification.enableRetries ? this.config.verification.maxRetries : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeApiCall(endpointInfo);
      } catch (error) {
        retryCount = attempt;

        if (attempt === maxRetries) {
          throw error;
        }

        console.log(`🔄 Retrying API call (attempt ${attempt + 1}/${maxRetries + 1}): ${endpointInfo.url}`);

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async makeApiCall(endpointInfo: ApiEndpointInfo): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Development-Cockpit-Test-Suite/1.0.0'
    };

    // Add authentication headers
    if (endpointInfo.requiresAuth) {
      if (endpointInfo.url.includes('huggingface') && this.config.huggingface.authToken) {
        headers['Authorization'] = `Bearer ${this.config.huggingface.authToken}`;
      } else if (endpointInfo.url.includes('runpod') && this.config.runpod.authToken) {
        headers['Authorization'] = `Bearer ${this.config.runpod.authToken}`;
      }
    }

    const options: RequestInit = {
      method: endpointInfo.method,
      headers,
      signal: AbortSignal.timeout(endpointInfo.timeout || 30000)
    };

    // Add body for POST requests
    if (endpointInfo.method === 'POST') {
      if (endpointInfo.url.includes('graphql')) {
        options.body = JSON.stringify({
          query: '{ user { id username } }'
        });
      }
    }

    const response = await fetch(endpointInfo.url, options);
    return response;
  }

  private async performDetailedValidations(
    endpointInfo: ApiEndpointInfo,
    response: any,
    result: ApiValidationResult
  ): Promise<void> {
    // Authentication validation
    if (this.config.verification.validateAuth && endpointInfo.requiresAuth) {
      result.validationDetails.authValidation = response.status !== 401 && response.status !== 403;
    } else {
      result.validationDetails.authValidation = true;
    }

    // Performance validation
    if (this.config.verification.validatePerformance) {
      const maxAcceptableTime = endpointInfo.timeout || 5000;
      result.validationDetails.performanceValidation = result.responseTime < maxAcceptableTime;
    } else {
      result.validationDetails.performanceValidation = true;
    }

    // Rate limit validation
    if (this.config.verification.checkRateLimit) {
      result.validationDetails.rateLimitValidation = response.status !== 429;
    } else {
      result.validationDetails.rateLimitValidation = true;
    }

    // Schema validation (simplified)
    if (this.config.verification.validateSchema && endpointInfo.expectedSchema) {
      try {
        const responseData = await response.json();
        result.validationDetails.schemaValidation = this.validateResponseSchema(responseData, endpointInfo.expectedSchema);
      } catch (error) {
        result.validationDetails.schemaValidation = false;
      }
    } else {
      result.validationDetails.schemaValidation = true;
    }
  }

  private validateResponseSchema(responseData: any, expectedSchema: any): boolean {
    // Simple schema validation - in production, use a proper JSON schema validator
    try {
      if (typeof expectedSchema === 'object' && expectedSchema !== null) {
        for (const key in expectedSchema) {
          if (!(key in responseData)) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private async validateEndpointBatch(endpoints: ApiEndpointInfo[], serviceName: string): Promise<BatchValidationResult> {
    const startTime = Date.now();
    const results: ApiValidationResult[] = [];

    console.log(`🔄 Validating ${endpoints.length} ${serviceName} endpoints...`);

    // Validate endpoints with controlled concurrency
    const chunkSize = 3; // Limit concurrent requests
    for (let i = 0; i < endpoints.length; i += chunkSize) {
      const chunk = endpoints.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(endpoint => this.validateEndpoint(endpoint))
      );
      results.push(...chunkResults);
    }

    const totalDuration = Date.now() - startTime;
    const batchResult = this.createBatchResultFromResults(results, totalDuration);

    console.log(`✅ ${serviceName} validation completed: ${batchResult.summary.successfulValidations}/${batchResult.summary.totalEndpoints} endpoints passed`);

    return batchResult;
  }

  private createBatchResultFromResults(results: ApiValidationResult[], duration: number): BatchValidationResult {
    const successfulValidations = results.filter(r => r.success).length;
    const failedValidations = results.length - successfulValidations;
    const averageResponseTime = results.length > 0 ?
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length : 0;

    const recommendations = this.generateRecommendations(results);

    return {
      summary: {
        totalEndpoints: results.length,
        successfulValidations,
        failedValidations,
        averageResponseTime,
        totalDuration: duration
      },
      results,
      recommendations
    };
  }

  private createEmptyBatchResult(): BatchValidationResult {
    return {
      summary: {
        totalEndpoints: 0,
        successfulValidations: 0,
        failedValidations: 0,
        averageResponseTime: 0,
        totalDuration: 0
      },
      results: [],
      recommendations: []
    };
  }

  private generateRecommendations(results: ApiValidationResult[]): string[] {
    const recommendations: string[] = [];

    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      recommendations.push(`${failedResults.length} endpoints failed validation - investigate error responses`);
    }

    const slowResults = results.filter(r => r.responseTime > 5000);
    if (slowResults.length > 0) {
      recommendations.push(`${slowResults.length} endpoints have slow response times (>5s) - consider performance optimization`);
    }

    const authFailures = results.filter(r => !r.validationDetails.authValidation);
    if (authFailures.length > 0) {
      recommendations.push(`${authFailures.length} endpoints failed authentication - verify API tokens and permissions`);
    }

    const rateLimitHits = results.filter(r => !r.validationDetails.rateLimitValidation);
    if (rateLimitHits.length > 0) {
      recommendations.push(`${rateLimitHits.length} endpoints hit rate limits - implement request throttling`);
    }

    return recommendations;
  }
}

// Default configuration for real API validation
export const DEFAULT_REAL_API_CONFIG: RealApiConfig = {
  huggingface: {
    enabled: false, // Disabled by default for safety
    organizations: ['SwaggyStacks', 'ScientiaCapital'],
    baseUrl: 'https://huggingface.co',
    timeout: 10000
  },
  runpod: {
    enabled: false, // Disabled by default for safety
    endpoints: [],
    baseUrl: 'https://api.runpod.ai',
    timeout: 15000
  },
  verification: {
    validateSchema: true,
    validateAuth: true,
    validatePerformance: true,
    checkRateLimit: true,
    enableRetries: true,
    maxRetries: 2
  }
};