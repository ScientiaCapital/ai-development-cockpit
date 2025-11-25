/**
 * Enhanced RunPod API Client
 * Provides comprehensive deployment management with error handling, retries, and monitoring
 */

import { EventEmitter } from 'events';

export interface RunPodConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface EndpointConfig {
  name: string;
  image: string;
  gpuType: string;
  gpuCount?: number;
  minWorkers?: number;
  maxWorkers?: number;
  idleTimeout?: number;
  containerDiskSizeGB?: number;
  volumePath?: string;
  env?: Record<string, string>;
  ports?: Array<{
    containerPort: number;
    type: 'http' | 'tcp';
    name?: string;
  }>;
  startupScript?: string;
}

export interface EndpointResponse {
  id: string;
  name: string;
  status: 'INITIALIZING' | 'RUNNING' | 'FAILED' | 'TERMINATED';
  url?: string;
  created: string;
  locations?: {
    id: string;
    name: string;
  }[];
  workersMin: number;
  workersMax: number;
  workersRunning: number;
  workersIdle: number;
  workersBusy: number;
  gpuType: string;
  gpuCount?: number;
  containerDiskSizeGB: number;
  lastActivity?: string;
  template?: {
    id: string;
    container?: {
      image: string;
    };
    env?: Record<string, string>;
  };
  scalerSettings?: {
    min: number;
    max: number;
  };
  networkSettings?: {
    ports?: number[];
    allowedPorts?: number[];
  };
}

export interface EndpointMetrics {
  requestCount: number;
  avgLatency: number;
  errorRate: number;
  activeConnections: number;
  gpuUtilization: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number;
  lastUpdated: string;
  performance?: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    uptime: number;
  };
}

export interface DeploymentEvent {
  type: 'status_change' | 'metrics_update' | 'error' | 'worker_change';
  endpointId: string;
  data: any;
  timestamp: string;
}

export class RunPodAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'RunPodAPIError';
  }
}

export class RunPodClient extends EventEmitter {
  private config: Required<RunPodConfig>;
  private activePolling = new Map<string, NodeJS.Timeout>();
  private rateLimitRemaining = 100;
  private rateLimitResetTime = 0;

  constructor(config: RunPodConfig) {
    super();

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.runpod.ai/v2',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000
    };

    if (!this.config.apiKey) {
      throw new Error('RunPod API key is required');
    }
  }

  /**
   * Create a new serverless endpoint
   */
  async createEndpoint(config: EndpointConfig): Promise<EndpointResponse> {
    const payload = {
      name: config.name,
      image: config.image,
      gpu_type: config.gpuType,
      gpu_count: config.gpuCount || 1,
      workers_min: config.minWorkers || 0,
      workers_max: config.maxWorkers || 3,
      idle_timeout: config.idleTimeout || 300,
      container_disk_size_gb: config.containerDiskSizeGB || 50,
      env: config.env || {},
      ports: config.ports?.map(port => ({
        container_port: port.containerPort,
        type: port.type,
        name: port.name || `port-${port.containerPort}`
      })) || [{ container_port: 8000, type: 'http', name: 'main' }],
      startup_script: config.startupScript
    };

    const response = await this.makeRequest('POST', '/endpoints', payload);

    // Start monitoring the new endpoint
    this.startPolling(response.id);

    return this.normalizeEndpointResponse(response);
  }

  /**
   * Get endpoint details
   */
  async getEndpoint(endpointId: string): Promise<EndpointResponse> {
    const response = await this.makeRequest('GET', `/endpoints/${endpointId}`);
    return this.normalizeEndpointResponse(response);
  }

  /**
   * List all endpoints
   */
  async listEndpoints(): Promise<EndpointResponse[]> {
    const response = await this.makeRequest('GET', '/endpoints');
    return response.endpoints?.map(this.normalizeEndpointResponse) || [];
  }

  /**
   * Update endpoint configuration
   */
  async updateEndpoint(endpointId: string, updates: Partial<EndpointConfig>): Promise<EndpointResponse> {
    const payload = {
      ...(updates.minWorkers !== undefined && { workers_min: updates.minWorkers }),
      ...(updates.maxWorkers !== undefined && { workers_max: updates.maxWorkers }),
      ...(updates.idleTimeout !== undefined && { idle_timeout: updates.idleTimeout }),
      ...(updates.env && { env: updates.env })
    };

    const response = await this.makeRequest('PATCH', `/endpoints/${endpointId}`, payload);
    return this.normalizeEndpointResponse(response);
  }

  /**
   * Delete endpoint
   */
  async deleteEndpoint(endpointId: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', `/endpoints/${endpointId}`);
      this.stopPolling(endpointId);
      return true;
    } catch (error) {
      console.error(`Failed to delete endpoint ${endpointId}:`, error);
      return false;
    }
  }

  /**
   * Get endpoint metrics
   */
  async getEndpointMetrics(endpointId: string): Promise<EndpointMetrics> {
    try {
      const response = await this.makeRequest('GET', `/endpoints/${endpointId}/metrics`);

      return {
        requestCount: response.requests_count || 0,
        avgLatency: response.avg_latency_ms || 0,
        errorRate: response.error_rate || 0,
        activeConnections: response.active_connections || 0,
        gpuUtilization: response.gpu_utilization || 0,
        memoryUsage: response.memory_usage_mb || 0,
        diskUsage: response.disk_usage_mb || 0,
        uptime: response.uptime_seconds || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      // If metrics endpoint doesn't exist, return default values
      console.warn(`Metrics not available for endpoint ${endpointId}`);
      return {
        requestCount: 0,
        avgLatency: 0,
        errorRate: 0,
        activeConnections: 0,
        gpuUtilization: 0,
        memoryUsage: 0,
        diskUsage: 0,
        uptime: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Send request to endpoint
   */
  async sendRequest(endpointId: string, data: any): Promise<any> {
    const endpoint = await this.getEndpoint(endpointId);

    if (!endpoint.url) {
      throw new RunPodAPIError('Endpoint URL not available');
    }

    if (endpoint.status !== 'RUNNING') {
      throw new RunPodAPIError(`Endpoint not ready. Status: ${endpoint.status}`);
    }

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new RunPodAPIError(
        `Request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  }

  /**
   * Start real-time monitoring for an endpoint
   */
  startPolling(endpointId: string, interval = 30000): void {
    if (this.activePolling.has(endpointId)) {
      return; // Already polling
    }

    const poll = async () => {
      try {
        const [endpoint, metrics] = await Promise.all([
          this.getEndpoint(endpointId),
          this.getEndpointMetrics(endpointId)
        ]);

        this.emit('endpoint_update', {
          type: 'metrics_update',
          endpointId,
          data: { endpoint, metrics },
          timestamp: new Date().toISOString()
        } as DeploymentEvent);

      } catch (error) {
        this.emit('endpoint_error', {
          type: 'error',
          endpointId,
          data: { error: error instanceof Error ? error.message : String(error) },
          timestamp: new Date().toISOString()
        } as DeploymentEvent);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const timer = setInterval(poll, interval);
    this.activePolling.set(endpointId, timer);
  }

  /**
   * Stop monitoring an endpoint
   */
  stopPolling(endpointId: string): void {
    const timer = this.activePolling.get(endpointId);
    if (timer) {
      clearInterval(timer);
      this.activePolling.delete(endpointId);
    }
  }

  /**
   * Restart an endpoint
   */
  async restartEndpoint(endpointId: string): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/endpoints/${endpointId}/restart`);
      return true;
    } catch (error) {
      console.error(`Failed to restart endpoint ${endpointId}:`, error);
      return false;
    }
  }

  /**
   * Get endpoint health status
   */
  async getEndpointHealth(endpointId: string): Promise<{
    status: 'running' | 'creating' | 'failed' | 'stopped';
    workersReady: number;
    workersIdle: number;
    lastActivity: Date;
  }> {
    try {
      const endpoint = await this.getEndpoint(endpointId);

      return {
        status: this.normalizeStatus(endpoint.status),
        workersReady: endpoint.workersRunning || 0,
        workersIdle: endpoint.workersIdle || 0,
        lastActivity: new Date(endpoint.lastActivity || Date.now())
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'failed',
        workersReady: 0,
        workersIdle: 0,
        lastActivity: new Date()
      };
    }
  }

  /**
   * Scale endpoint workers
   */
  async scaleEndpoint(endpointId: string, minWorkers: number, maxWorkers: number): Promise<boolean> {
    try {
      await this.updateEndpoint(endpointId, {
        minWorkers,
        maxWorkers
      });
      return true;
    } catch (error) {
      console.error(`Failed to scale endpoint ${endpointId}:`, error);
      return false;
    }
  }

  /**
   * Terminate endpoint (permanent deletion)
   */
  async terminateEndpoint(endpointId: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', `/endpoints/${endpointId}?force=true`);
      this.stopPolling(endpointId);
      return true;
    } catch (error) {
      console.error(`Failed to terminate endpoint ${endpointId}:`, error);
      return false;
    }
  }

  /**
   * Stop endpoint (temporary shutdown)
   */
  async stopEndpoint(endpointId: string): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/endpoints/${endpointId}/stop`);
      return true;
    } catch (error) {
      console.error(`Failed to stop endpoint ${endpointId}:`, error);
      return false;
    }
  }

  /**
   * Resume a stopped endpoint
   */
  async resumeEndpoint(endpointId: string): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/endpoints/${endpointId}/resume`);
      return true;
    } catch (error) {
      console.error(`Failed to resume endpoint ${endpointId}:`, error);
      return false;
    }
  }

  /**
   * Get endpoint logs
   */
  async getEndpointLogs(endpointId: string, lines = 100): Promise<string[]> {
    try {
      const response = await this.makeRequest('GET', `/endpoints/${endpointId}/logs?lines=${lines}`);
      return response.logs || [];
    } catch (error) {
      console.error(`Failed to get logs for endpoint ${endpointId}:`, error);
      return [];
    }
  }

  /**
   * Stop all monitoring
   */
  stopAllPolling(): void {
    for (const [endpointId] of this.activePolling) {
      this.stopPolling(endpointId);
    }
  }

  /**
   * Get available GPU types and pricing
   */
  async getGPUTypes(): Promise<Array<{
    id: string;
    name: string;
    memoryGB: number;
    pricePerhour: number;
    available: boolean;
  }>> {
    try {
      const response = await this.makeRequest('GET', '/gpus');
      return response.gpus || [];
    } catch (error) {
      // Return default GPU types if API doesn't support this endpoint
      return [
        { id: 'NVIDIA_RTX_4090', name: 'RTX 4090', memoryGB: 24, pricePerhour: 0.79, available: true },
        { id: 'NVIDIA_RTX_A6000', name: 'RTX A6000', memoryGB: 48, pricePerhour: 0.79, available: true },
        { id: 'NVIDIA_A40', name: 'A40', memoryGB: 48, pricePerhour: 0.89, available: true },
        { id: 'NVIDIA_A100', name: 'A100', memoryGB: 80, pricePerhour: 2.89, available: true }
      ];
    }
  }

  /**
   * Test endpoint health
   */
  async testEndpointHealth(endpointId: string): Promise<{
    healthy: boolean;
    responseTime: number;
    status: string;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const endpoint = await this.getEndpoint(endpointId);

      if (!endpoint.url) {
        return {
          healthy: false,
          responseTime: Date.now() - startTime,
          status: 'No URL',
          error: 'Endpoint URL not available'
        };
      }

      // Try to hit health endpoint
      const response = await fetch(`${endpoint.url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      return {
        healthy: response.ok,
        responseTime: Date.now() - startTime,
        status: endpoint.status,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };

    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        status: 'Error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    method: string,
    path: string,
    body?: any,
    attempt = 1
  ): Promise<any> {
    // Check rate limit
    if (this.rateLimitRemaining <= 0 && Date.now() < this.rateLimitResetTime) {
      const waitTime = this.rateLimitResetTime - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const url = `${this.config.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Development-Cockpit/1.0'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      // Update rate limit info
      this.updateRateLimit(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if we should retry
        if (this.shouldRetry(response.status, attempt)) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(method, path, body, attempt + 1);
        }

        throw new RunPodAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response.json();

    } catch (error) {
      if (error instanceof RunPodAPIError) {
        throw error;
      }

      // Network error - retry if appropriate
      if (attempt < this.config.retries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(method, path, body, attempt + 1);
      }

      throw new RunPodAPIError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }

    if (reset) {
      this.rateLimitResetTime = parseInt(reset, 10) * 1000;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(statusCode: number, attempt: number): boolean {
    if (attempt >= this.config.retries) {
      return false;
    }

    // Retry on server errors and rate limits
    return statusCode >= 500 || statusCode === 429;
  }

  /**
   * Normalize endpoint response format
   */
  private normalizeEndpointResponse(response: any): EndpointResponse {
    return {
      id: response.id,
      name: response.name,
      status: response.status,
      url: response.url,
      created: response.created || new Date().toISOString(),
      locations: response.locations,
      workersMin: response.workers_min || response.workersMin || 0,
      workersMax: response.workers_max || response.workersMax || 3,
      workersRunning: response.workers_running || response.workersRunning || 0,
      workersIdle: response.workers_idle || response.workersIdle || 0,
      workersBusy: response.workers_busy || response.workersBusy || 0,
      gpuType: response.gpu_type || response.gpuType || 'NVIDIA_A40',
      containerDiskSizeGB: response.container_disk_size_gb || response.containerDiskSizeGB || 50,
      lastActivity: response.last_activity || response.lastActivity
    };
  }

  /**
   * Normalize status values to standard format
   */
  private normalizeStatus(status: string): 'running' | 'creating' | 'failed' | 'stopped' {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus === 'running' || lowerStatus === 'ready') {
      return 'running';
    } else if (lowerStatus === 'initializing' || lowerStatus === 'creating') {
      return 'creating';
    } else if (lowerStatus === 'failed' || lowerStatus === 'error') {
      return 'failed';
    } else if (lowerStatus === 'stopped' || lowerStatus === 'terminated') {
      return 'stopped';
    }

    return 'failed'; // Default to failed for unknown statuses
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAllPolling();
    this.removeAllListeners();
  }
}

export default RunPodClient;