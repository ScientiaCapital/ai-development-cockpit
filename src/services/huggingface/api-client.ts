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

// ===== NEW: Enhanced TypeScript Interfaces =====

export interface ModelSearchResult {
  id: string;
  author: string;
  sha: string;
  created_at: string;
  last_modified: string;
  private: boolean;
  gated: boolean;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  mask_token?: string;
  widget_data?: any[];
  model_index?: any;
  config?: any;
  transformers_info?: {
    auto_model: string;
    custom_class?: string;
    pipeline_tag?: string;
    processor?: string;
  };
  cardData?: {
    language?: string[];
    license?: string;
    tags?: string[];
    datasets?: string[];
    metrics?: string[];
    model_name?: string;
    base_model?: string;
  };
}

export interface ModelInfo extends ModelSearchResult {
  modelId: string;
  siblings: ModelFile[];
  spaces?: string[];
  safetensors?: {
    parameters?: Record<string, number>;
    total?: number;
  };
  description?: string;
  citation?: string;
  widgetData?: any[];
  inference?: boolean;
  securityStatus?: {
    scansDone: boolean;
    hasUnsafeFile: boolean;
    clamAVInfectedFiles: string[];
    pickleImportScanDone: boolean;
    pickleImportScanResults: any[];
  };
}

export interface ModelFile {
  path: string;
  type: 'file' | 'directory';
  oid: string;
  size?: number;
  lastCommit?: {
    oid: string;
    title: string;
    date: string;
  };
  security?: {
    safe: boolean;
    avScan?: {
      virusFound: boolean;
      virusNames?: string[];
    };
    pickleImportScan?: {
      highestSafetyLevel: string;
      imports: Array<{
        module: string;
        name: string;
        safety: string;
      }>;
    };
  };
}

export interface ModelStats {
  views: {
    downloads: number;
    downloads_7d: number;
    downloads_30d: number;
    likes: number;
  };
}

export interface BatchSearchResult {
  id: string;
  success: boolean;
  data?: ModelSearchResult[];
  error?: {
    code: string;
    message: string;
  };
}

export interface BatchModelResult {
  id: string;
  success: boolean;
  data?: ModelInfo;
  error?: {
    code: string;
    message: string;
  };
}

export interface EnhancedModelInfo extends ModelInfo {
  isPopular: boolean;
  chineseCapabilities: string[];
  recommendedUseCase: string;
  deploymentComplexity?: 'low' | 'medium' | 'high';
  estimatedMemoryRequirement?: string;
  supportedFrameworks?: string[];
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  pongTimeout?: number;
}

export interface WebSocketMessage {
  id: string;
  type: 'model_update' | 'new_model' | 'model_deleted' | 'stats_update';
  timestamp: string;
  data: any;
}

export interface WebSocketSubscription {
  id: string;
  topics: string[];
  filters?: {
    authors?: string[];
    tags?: string[];
    languages?: string[];
  };
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
        const metadata = response.config.metadata;
        const duration = metadata?.startTime ? performance.now() - metadata.startTime : 0;
        const requestId = metadata?.requestId;

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
        const metadata = error.config?.metadata;
        const duration = metadata?.startTime
          ? performance.now() - metadata.startTime
          : 0;
        const requestId = metadata?.requestId;

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

  // ===== NEW: Model Discovery Methods =====
  
  /**
   * Search for models with advanced filtering
   */
  public async searchModels(searchParams: {
    query?: string;
    author?: string;
    filter?: string;
    sort?: 'downloads' | 'modified' | 'created' | 'trending';
    direction?: 'asc' | 'desc';
    limit?: number;
    full?: boolean;
    config?: boolean;
  } = {}): Promise<HuggingFaceApiResponse<ModelSearchResult[]>> {
    const params = new URLSearchParams();
    
    if (searchParams.query) params.append('search', searchParams.query);
    if (searchParams.author) params.append('author', searchParams.author);
    if (searchParams.filter) params.append('filter', searchParams.filter);
    if (searchParams.sort) params.append('sort', searchParams.sort);
    if (searchParams.direction) params.append('direction', searchParams.direction);
    if (searchParams.limit) params.append('limit', searchParams.limit.toString());
    if (searchParams.full) params.append('full', 'true');
    if (searchParams.config) params.append('config', 'true');

    return this.get<ModelSearchResult[]>(`/models?${params.toString()}`);
  }

  /**
   * Get detailed model information
   */
  public async getModel(modelId: string, options: {
    revision?: string;
    securityStatus?: boolean;
    files_metadata?: boolean;
  } = {}): Promise<HuggingFaceApiResponse<ModelInfo>> {
    const params = new URLSearchParams();
    if (options.revision) params.append('revision', options.revision);
    if (options.securityStatus) params.append('securityStatus', 'true');
    if (options.files_metadata) params.append('files_metadata', 'true');

    const url = `/models/${encodeURIComponent(modelId)}${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<ModelInfo>(url);
  }

  /**
   * Get model files listing
   */
  public async getModelFiles(modelId: string, options: {
    revision?: string;
    recursive?: boolean;
  } = {}): Promise<HuggingFaceApiResponse<ModelFile[]>> {
    const params = new URLSearchParams();
    if (options.revision) params.append('revision', options.revision);
    if (options.recursive) params.append('recursive', 'true');

    const url = `/models/${encodeURIComponent(modelId)}/tree/main${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<ModelFile[]>(url);
  }

  /**
   * Get model download count and stats
   */
  public async getModelStats(modelId: string): Promise<HuggingFaceApiResponse<ModelStats>> {
    return this.get<ModelStats>(`/models/${encodeURIComponent(modelId)}/usage`);
  }

  // ===== NEW: Batch Operations =====

  /**
   * Batch search multiple model queries
   */
  public async batchSearchModels(
    queries: Array<{
      id: string;
      query?: string;
      author?: string;
      filter?: string;
      limit?: number;
    }>
  ): Promise<HuggingFaceApiResponse<BatchSearchResult[]>> {
    const batchRequests = queries.map(q => ({
      id: q.id,
      method: 'GET',
      url: `/models?${new URLSearchParams(
        Object.entries(q).filter(([key, value]) => key !== 'id' && value !== undefined) as [string, string][]
      ).toString()}`
    }));

    return this.post<BatchSearchResult[]>('/batch', { requests: batchRequests });
  }

  /**
   * Batch get model details
   */
  public async batchGetModels(
    modelIds: string[],
    options: {
      revision?: string;
      securityStatus?: boolean;
      files_metadata?: boolean;
    } = {}
  ): Promise<HuggingFaceApiResponse<BatchModelResult[]>> {
    const batchRequests = modelIds.map(modelId => {
      const params = new URLSearchParams();
      if (options.revision) params.append('revision', options.revision);
      if (options.securityStatus) params.append('securityStatus', 'true');
      if (options.files_metadata) params.append('files_metadata', 'true');

      return {
        id: modelId,
        method: 'GET',
        url: `/models/${encodeURIComponent(modelId)}${params.toString() ? `?${params.toString()}` : ''}`
      };
    });

    return this.post<BatchModelResult[]>('/batch', { requests: batchRequests });
  }

  // ===== NEW: Chinese Model Specific Methods =====

  /**
   * Search specifically for Chinese language models
   */
  public async searchChineseModels(options: {
    query?: string;
    author?: string;
    minDownloads?: number;
    limit?: number;
    includeInstruct?: boolean;
    includeChat?: boolean;
  } = {}): Promise<HuggingFaceApiResponse<ModelSearchResult[]>> {
    let filter = 'language:zh';
    
    if (options.includeInstruct) {
      filter += ',instruct';
    }
    
    if (options.includeChat) {
      filter += ',conversational';
    }

    const searchParams = {
      query: options.query,
      author: options.author,
      filter,
      sort: 'downloads' as const,
      direction: 'desc' as const,
      limit: options.limit || 50,
      full: true,
    };

    const response = await this.searchModels(searchParams);
    
    // Additional filtering for minimum downloads
    if (options.minDownloads && response.data) {
      response.data = response.data.filter(model => 
        model.downloads >= (options.minDownloads || 0)
      );
    }

    return response;
  }

  /**
   * Get popular Chinese models with enhanced metadata
   */
  public async getPopularChineseModels(limit = 20): Promise<HuggingFaceApiResponse<EnhancedModelInfo[]>> {
    const popularModels = [
      'Qwen/Qwen2.5-7B-Instruct',
      'Qwen/Qwen2.5-14B-Instruct',
      'Qwen/Qwen2.5-72B-Instruct',
      'deepseek-ai/deepseek-coder-6.7b-instruct',
      'deepseek-ai/deepseek-llm-7b-chat',
      'THUDM/chatglm3-6b',
      'baichuan-inc/Baichuan2-7B-Chat',
      'baichuan-inc/Baichuan2-13B-Chat',
      'internlm/internlm2-7b',
      'internlm/internlm2-20b',
      '01-ai/Yi-6B-Chat',
      '01-ai/Yi-34B-Chat',
      'THUDM/glm-4-9b-chat',
    ].slice(0, limit);

    const batchResult = await this.batchGetModels(popularModels, {
      securityStatus: true,
      files_metadata: true,
    });

    if (!batchResult.success || !batchResult.data) {
      return { success: false, data: [] };
    }

    const enhancedModels: EnhancedModelInfo[] = batchResult.data
      .filter(result => result.success)
      .map(result => ({
        ...result.data as ModelInfo,
        isPopular: true,
        chineseCapabilities: this.analyzeChineseCapabilities(result.data as ModelInfo),
        recommendedUseCase: this.getRecommendedUseCase(result.data as ModelInfo),
      }));

    return {
      success: true,
      data: enhancedModels,
      rateLimit: batchResult.rateLimit,
      requestId: batchResult.requestId,
    };
  }

  private analyzeChineseCapabilities(model: ModelInfo): string[] {
    const capabilities: string[] = [];
    const tags = model.tags || [];
    const modelName = model.id.toLowerCase();

    if (tags.includes('conversational') || modelName.includes('chat')) {
      capabilities.push('chat');
    }
    if (tags.includes('text-generation') || modelName.includes('instruct')) {
      capabilities.push('instruction-following');
    }
    if (modelName.includes('coder') || modelName.includes('code')) {
      capabilities.push('code-generation');
    }
    if (tags.includes('translation')) {
      capabilities.push('translation');
    }
    if (tags.includes('summarization')) {
      capabilities.push('summarization');
    }

    return capabilities;
  }

  private getRecommendedUseCase(model: ModelInfo): string {
    const modelName = model.id.toLowerCase();
    const tags = model.tags || [];

    if (modelName.includes('coder') || modelName.includes('code')) {
      return 'Code generation and programming assistance';
    }
    if (modelName.includes('chat') || tags.includes('conversational')) {
      return 'Conversational AI and customer support';
    }
    if (modelName.includes('instruct')) {
      return 'Task-specific instructions and automation';
    }
    if (tags.includes('translation')) {
      return 'Language translation and localization';
    }

    return 'General-purpose text generation';
  }

  // ===== NEW: WebSocket Support for Real-time Updates =====

  private wsConnections: Map<string, WebSocket> = new Map();
  private wsSubscriptions: Map<string, WebSocketSubscription> = new Map();
  private wsReconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Subscribe to real-time model updates via WebSocket
   */
  public subscribeToModelUpdates(
    subscription: WebSocketSubscription,
    onMessage: (message: WebSocketMessage) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const wsConfig: WebSocketConfig = {
        url: `wss://huggingface.co/api/models/subscribe`,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        pingInterval: 30000,
        pongTimeout: 5000,
      };

      try {
        const ws = new WebSocket(wsConfig.url);
        const connectionId = this.generateRequestId();

        ws.onopen = () => {
          this.log('WEBSOCKET_CONNECTED', { connectionId, subscription });

          // Send subscription message
          ws.send(JSON.stringify({
            type: 'subscribe',
            id: subscription.id,
            topics: subscription.topics,
            filters: subscription.filters,
            auth: this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined,
          }));

          this.wsConnections.set(connectionId, ws);
          this.wsSubscriptions.set(connectionId, subscription);

          // Set up ping interval
          if (wsConfig.pingInterval) {
            const pingTimer = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN && typeof ws.ping === 'function') {
                ws.ping();
              }
            }, wsConfig.pingInterval);

            // Store timer for cleanup
            this.wsReconnectTimers.set(`${connectionId}_ping`, pingTimer);
          }

          resolve(connectionId);
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.log('WEBSOCKET_MESSAGE', { connectionId, type: message.type });
            onMessage(message);
          } catch (error) {
            this.log('WEBSOCKET_PARSE_ERROR', { connectionId, error });
          }
        };

        ws.onerror = (error) => {
          this.log('WEBSOCKET_ERROR', { connectionId, error });
          if (onError) onError(error);
        };

        ws.onclose = (event) => {
          this.log('WEBSOCKET_CLOSED', { connectionId, code: event.code, reason: event.reason });

          // Clean up
          this.wsConnections.delete(connectionId);
          this.clearConnectionTimers(connectionId);

          if (onClose) onClose(event);

          // Auto-reconnect if not a clean close
          if (event.code !== 1000 && wsConfig.maxReconnectAttempts) {
            this.scheduleReconnect(connectionId, subscription, onMessage, wsConfig, onError, onClose);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleReconnect(
    connectionId: string,
    subscription: WebSocketSubscription,
    onMessage: (message: WebSocketMessage) => void,
    wsConfig: WebSocketConfig,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void,
    attempt = 1
  ): void {
    if (attempt > (wsConfig.maxReconnectAttempts || 10)) {
      this.log('WEBSOCKET_MAX_RECONNECTS', { connectionId, attempt });
      return;
    }

    const delay = Math.min(
      (wsConfig.reconnectInterval || 5000) * Math.pow(2, attempt - 1),
      30000
    );

    this.log('WEBSOCKET_RECONNECT_SCHEDULED', { connectionId, attempt, delay });

    const timer = setTimeout(async () => {
      try {
        await this.subscribeToModelUpdates(subscription, onMessage, onError, onClose);
        this.log('WEBSOCKET_RECONNECTED', { connectionId, attempt });
      } catch (error) {
        this.log('WEBSOCKET_RECONNECT_FAILED', { connectionId, attempt, error });
        this.scheduleReconnect(connectionId, subscription, onMessage, wsConfig, onError, onClose, attempt + 1);
      }
    }, delay);

    this.wsReconnectTimers.set(`${connectionId}_reconnect`, timer);
  }

  private clearConnectionTimers(connectionId: string): void {
    const pingTimer = this.wsReconnectTimers.get(`${connectionId}_ping`);
    const reconnectTimer = this.wsReconnectTimers.get(`${connectionId}_reconnect`);

    if (pingTimer) {
      clearInterval(pingTimer);
      this.wsReconnectTimers.delete(`${connectionId}_ping`);
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      this.wsReconnectTimers.delete(`${connectionId}_reconnect`);
    }
  }

  /**
   * Unsubscribe from WebSocket updates
   */
  public unsubscribeFromModelUpdates(connectionId: string): void {
    const ws = this.wsConnections.get(connectionId);
    const subscription = this.wsSubscriptions.get(connectionId);

    if (ws && subscription) {
      // Send unsubscribe message
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'unsubscribe',
          id: subscription.id,
        }));
      }

      // Close connection
      ws.close(1000, 'Client unsubscribe');
    }

    // Clean up
    this.wsConnections.delete(connectionId);
    this.wsSubscriptions.delete(connectionId);
    this.clearConnectionTimers(connectionId);

    this.log('WEBSOCKET_UNSUBSCRIBED', { connectionId });
  }

  /**
   * Get active WebSocket connections
   */
  public getActiveWebSocketConnections(): Array<{
    connectionId: string;
    subscription: WebSocketSubscription;
    readyState: number;
  }> {
    const connections: Array<{
      connectionId: string;
      subscription: WebSocketSubscription;
      readyState: number;
    }> = [];

    for (const [connectionId, ws] of this.wsConnections) {
      const subscription = this.wsSubscriptions.get(connectionId);
      if (subscription) {
        connections.push({
          connectionId,
          subscription,
          readyState: ws.readyState,
        });
      }
    }

    return connections;
  }

  /**
   * Close all WebSocket connections
   */
  public closeAllWebSocketConnections(): void {
    for (const [connectionId] of this.wsConnections) {
      this.unsubscribeFromModelUpdates(connectionId);
    }

    this.log('ALL_WEBSOCKETS_CLOSED', { count: this.wsConnections.size });
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