import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { performance } from 'perf_hooks';

// Types for API responses
export interface HuggingFaceApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  rateLimit?: RateLimitInfo;
  requestId?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  retryable: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryConfig: RetryConfig;
  organization?: string;
  apiKey?: string;
  userAgent: string;
  enableLogging: boolean;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipRetry?: boolean;
  priority?: 'low' | 'normal' | 'high';
  context?: string;
}

// Default configuration
const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: 'https://huggingface.co/api',
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },
  userAgent: 'dual-domain-llm-platform/1.0',
  enableLogging: process.env.NODE_ENV === 'development',
};

export class HuggingFaceApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private requestCount = 0;
  private errorCount = 0;
  private lastRateLimitInfo?: RateLimitInfo;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.requestCount++;

        // Add authentication header if available
        if (!config.skipAuth && this.config.apiKey) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        // Add organization header if specified
        if (this.config.organization) {
          config.headers = config.headers || {};
          config.headers['X-Organization'] = this.config.organization;
        }

        // Add request ID for tracking
        const requestId = this.generateRequestId();
        config.headers = config.headers || {};
        config.headers['X-Request-ID'] = requestId;
        config.metadata = { requestId, startTime: performance.now() };

        this.log('REQUEST', {
          method: config.method?.toUpperCase(),
          url: config.url,
          requestId,
          organization: this.config.organization,
        });

        return config;
      },
      (error) => {
        this.errorCount++;
        this.log('REQUEST_ERROR', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = performance.now() - response.config.metadata?.startTime;
        const requestId = response.config.metadata?.requestId;

        // Extract rate limit information
        this.lastRateLimitInfo = this.extractRateLimitInfo(response);

        this.log('RESPONSE', {
          status: response.status,
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          rateLimit: this.lastRateLimitInfo,
        });

        return response;
      },
      async (error: AxiosError) => {
        this.errorCount++;
        const duration = error.config?.metadata?.startTime
          ? performance.now() - error.config.metadata.startTime
          : 0;
        const requestId = error.config?.metadata?.requestId;

        // Extract rate limit info even from error responses
        if (error.response) {
          this.lastRateLimitInfo = this.extractRateLimitInfo(error.response);
        }

        this.log('RESPONSE_ERROR', {
          status: error.response?.status,
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          error: error.message,
          rateLimit: this.lastRateLimitInfo,
        });

        // Handle specific error types
        if (error.response?.status === 429) {
          const retryAfter = this.extractRetryAfter(error.response);
          if (retryAfter) {
            this.lastRateLimitInfo = {
              ...this.lastRateLimitInfo,
              retryAfter
            } as RateLimitInfo;
          }
        }

        return Promise.reject(this.createApiError(error));
      }
    );
  }

  private extractRateLimitInfo(response: AxiosResponse): RateLimitInfo | undefined {
    const headers = response.headers;

    if (headers['x-ratelimit-limit'] || headers['x-ratelimit-remaining']) {
      return {
        limit: parseInt(headers['x-ratelimit-limit']) || 0,
        remaining: parseInt(headers['x-ratelimit-remaining']) || 0,
        reset: parseInt(headers['x-ratelimit-reset']) || 0,
      };
    }

    return undefined;
  }

  private extractRetryAfter(response: AxiosResponse): number | undefined {
    const retryAfter = response.headers['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter);
      return isNaN(seconds) ? undefined : seconds * 1000; // Convert to milliseconds
    }
    return undefined;
  }

  private createApiError(error: AxiosError): ApiError {
    const statusCode = error.response?.status || 0;
    const responseData = error.response?.data as any;

    // Determine if error is retryable
    const retryable = this.isRetryableError(error);

    return {
      code: this.getErrorCode(error),
      message: responseData?.message || error.message || 'Unknown error',
      statusCode,
      details: responseData,
      retryable,
    };
  }

  private isRetryableError(error: AxiosError): boolean {
    // Network errors are retryable
    if (!error.response) {
      return true;
    }

    const status = error.response.status;

    // Server errors (5xx) are retryable
    if (status >= 500) {
      return true;
    }

    // Rate limiting is retryable
    if (status === 429) {
      return true;
    }

    // Timeout errors are retryable
    if (error.code === 'ECONNABORTED') {
      return true;
    }

    return false;
  }

  private getErrorCode(error: AxiosError): string {
    const status = error.response?.status;
    const responseData = error.response?.data as any;

    if (responseData?.code) {
      return responseData.code;
    }

    if (status) {
      switch (status) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'UNAUTHORIZED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 429: return 'RATE_LIMITED';
        case 500: return 'INTERNAL_ERROR';
        case 502: return 'BAD_GATEWAY';
        case 503: return 'SERVICE_UNAVAILABLE';
        case 504: return 'GATEWAY_TIMEOUT';
        default: return `HTTP_${status}`;
      }
    }

    if (error.code) {
      return error.code;
    }

    return 'UNKNOWN_ERROR';
  }

  private calculateDelay(attempt: number): number {
    const { baseDelay, maxDelay, backoffMultiplier, jitter } = this.config.retryConfig;

    let delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    delay = Math.min(delay, maxDelay);

    if (jitter) {
      // Add ±25% jitter
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(delay, 0);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(level: string, data: any): void {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] HF_API_${level}:`, JSON.stringify(data, null, 2));
  }

  public async request<T = any>(
    config: RequestOptions
  ): Promise<HuggingFaceApiResponse<T>> {
    const { skipRetry = false, ...axiosConfig } = config;
    let lastError: ApiError | null = null;

    // If retries are disabled, make single request
    if (skipRetry) {
      try {
        const response = await this.client.request(axiosConfig);
        return this.createSuccessResponse(response);
      } catch (error) {
        throw this.createApiError(error as AxiosError);
      }
    }

    // Retry logic
    const maxAttempts = this.config.retryConfig.maxRetries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.client.request(axiosConfig);
        return this.createSuccessResponse(response);
      } catch (error) {
        const apiError = this.createApiError(error as AxiosError);
        lastError = apiError;

        // Don't retry on last attempt
        if (attempt === maxAttempts - 1) {
          break;
        }

        // Don't retry non-retryable errors
        if (!apiError.retryable) {
          break;
        }

        // Handle rate limiting specially
        if (apiError.statusCode === 429) {
          const retryAfter = this.lastRateLimitInfo?.retryAfter;
          if (retryAfter) {
            this.log('RATE_LIMITED', {
              retryAfter,
              attempt: attempt + 1,
              maxAttempts
            });
            await this.sleep(retryAfter);
            continue;
          }
        }

        // Calculate delay for other retryable errors
        const delay = this.calculateDelay(attempt);
        this.log('RETRYING', {
          attempt: attempt + 1,
          maxAttempts,
          delay,
          error: apiError.message
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private createSuccessResponse<T>(response: AxiosResponse<T>): HuggingFaceApiResponse<T> {
    return {
      data: response.data,
      success: true,
      rateLimit: this.lastRateLimitInfo,
      requestId: response.config.metadata?.requestId,
    };
  }

  // Convenience methods
  public async get<T = any>(url: string, config?: RequestOptions): Promise<HuggingFaceApiResponse<T>> {
    return this.request<T>({ ...config, method: 'get', url });
  }

  public async post<T = any>(url: string, data?: any, config?: RequestOptions): Promise<HuggingFaceApiResponse<T>> {
    return this.request<T>({ ...config, method: 'post', url, data });
  }

  public async put<T = any>(url: string, data?: any, config?: RequestOptions): Promise<HuggingFaceApiResponse<T>> {
    return this.request<T>({ ...config, method: 'put', url, data });
  }

  public async delete<T = any>(url: string, config?: RequestOptions): Promise<HuggingFaceApiResponse<T>> {
    return this.request<T>({ ...config, method: 'delete', url });
  }

  // Configuration methods
  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  public setOrganization(organization: string): void {
    this.config.organization = organization;
  }

  public getRateLimitInfo(): RateLimitInfo | undefined {
    return this.lastRateLimitInfo;
  }

  public getStats(): { requests: number; errors: number; errorRate: number } {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
    };
  }

  public resetStats(): void {
    this.requestCount = 0;
    this.errorCount = 0;
  }
}

// Export a default instance
export default new HuggingFaceApiClient();