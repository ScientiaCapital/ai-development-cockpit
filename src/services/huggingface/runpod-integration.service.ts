/**
 * RunPod Chinese LLM Integration Service
 * Bridges HuggingFace API patterns with RunPod vLLM Chinese model instances
 * Supports Qwen, DeepSeek, and other Chinese LLMs deployed on RunPod
 */

import { VLLMService } from '../runpod/vllm.service';
import { HuggingFaceRateLimiter } from './rate-limiter';
import { HuggingFaceCacheService } from './cache.service';
import { HuggingFaceWebhookService } from './webhook.service';
import { HuggingFaceCircuitBreaker } from './circuit-breaker';
import { HuggingFaceCredentialsService } from './credentials.service';

import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  InferenceRequest,
  VLLMConfig,
  ModelConfiguration,
  InferenceMetrics,
} from '@/types/vllm';

// Extended types for our RunPod integration
export interface RunPodModelInfo {
  id: string;
  name: string;
  description: string;
  organization: string;
  modelType: 'qwen' | 'deepseek' | 'glm' | 'baichuan' | 'other';
  language: 'chinese' | 'multilingual';
  parameters: string; // e.g., "7B", "14B", "72B"
  capabilities: string[];
  runpodEndpoint: string;
  isActive: boolean;
  maxTokens: number;
  contextLength: number;
  pricing?: {
    inputTokens: number;  // per 1M tokens
    outputTokens: number; // per 1M tokens
  };
  metadata: {
    architecture: string;
    trainingData: string;
    license: string;
    paperUrl?: string;
    lastUpdated: string;
  };
}

export interface RunPodSearchParams {
  organization: string;
  query?: string;
  modelType?: 'qwen' | 'deepseek' | 'glm' | 'baichuan';
  language?: 'chinese' | 'multilingual';
  minParameters?: string; // e.g., "7B"
  maxParameters?: string; // e.g., "72B"
  capabilities?: string[];
  limit?: number;
  offset?: number;
}

export interface RunPodSearchResult {
  success: boolean;
  models: RunPodModelInfo[];
  total: number;
  fromCache: boolean;
  organization: string;
  searchParams: RunPodSearchParams;
  error?: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
  };
}

export interface RunPodDeploymentRequest {
  organization: string;
  modelId: string;
  modelType: 'qwen' | 'deepseek' | 'glm' | 'baichuan';
  instanceType: 'A40' | 'A100' | 'H100' | 'RTX4090';
  gpuCount: number;
  maxWorkers: number;
  containerDiskSize: number;
  environmentVariables?: Record<string, string>;
  name?: string;
  template?: string;
  networkVolumeId?: string;
}

export interface RunPodInferenceRequest {
  organization: string;
  modelId: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  tools?: any[];
  toolChoice?: string;
}

export interface RunPodInferenceResult {
  success: boolean;
  choices?: Array<{
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
    index: number;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  id: string;
  created: number;
  object: string;
  error?: string;
  metrics?: {
    latency: number;
    tokensPerSecond: number;
    costEstimate: number;
  };
}

export class RunPodIntegrationService {
  private rateLimiter: HuggingFaceRateLimiter;
  private cacheService: HuggingFaceCacheService;
  private webhookService: HuggingFaceWebhookService;
  private circuitBreaker: HuggingFaceCircuitBreaker;
  private credentialsService: HuggingFaceCredentialsService;
  private vllmServices: Map<string, VLLMService> = new Map();

  // Chinese LLM model configurations
  private chineseModels: RunPodModelInfo[] = [
    {
      id: 'qwen/qwen2.5-7b-instruct',
      name: 'Qwen2.5 7B Instruct',
      description: 'Advanced Chinese language model with instruction following capabilities',
      organization: 'qwen',
      modelType: 'qwen',
      language: 'multilingual',
      parameters: '7B',
      capabilities: ['chat', 'instruction-following', 'reasoning', 'code'],
      runpodEndpoint: process.env.RUNPOD_QWEN_7B_ENDPOINT || '',
      isActive: true,
      maxTokens: 4096,
      contextLength: 32768,
      pricing: {
        inputTokens: 0.5,   // $0.50 per 1M input tokens
        outputTokens: 1.0   // $1.00 per 1M output tokens
      },
      metadata: {
        architecture: 'Transformer',
        trainingData: 'Chinese and multilingual web text, books, and code',
        license: 'Apache 2.0',
        paperUrl: 'https://arxiv.org/abs/2309.16609',
        lastUpdated: '2024-09-19'
      }
    },
    {
      id: 'deepseek/deepseek-coder-v2-instruct',
      name: 'DeepSeek Coder V2 Instruct',
      description: 'Code-specialized Chinese LLM with excellent programming capabilities',
      organization: 'deepseek',
      modelType: 'deepseek',
      language: 'multilingual',
      parameters: '6.7B',
      capabilities: ['code-generation', 'debugging', 'explanation', 'refactoring'],
      runpodEndpoint: process.env.RUNPOD_DEEPSEEK_CODER_ENDPOINT || '',
      isActive: true,
      maxTokens: 4096,
      contextLength: 16384,
      pricing: {
        inputTokens: 0.4,
        outputTokens: 0.8
      },
      metadata: {
        architecture: 'Transformer',
        trainingData: 'Code repositories, documentation, and programming tutorials',
        license: 'MIT',
        paperUrl: 'https://arxiv.org/abs/2401.14196',
        lastUpdated: '2024-08-15'
      }
    },
    {
      id: 'qwen/qwen2.5-72b-instruct',
      name: 'Qwen2.5 72B Instruct',
      description: 'Large-scale Chinese language model with superior reasoning capabilities',
      organization: 'qwen',
      modelType: 'qwen',
      language: 'multilingual',
      parameters: '72B',
      capabilities: ['advanced-reasoning', 'complex-qa', 'creative-writing', 'analysis'],
      runpodEndpoint: process.env.RUNPOD_QWEN_72B_ENDPOINT || '',
      isActive: true,
      maxTokens: 8192,
      contextLength: 32768,
      pricing: {
        inputTokens: 2.0,
        outputTokens: 4.0
      },
      metadata: {
        architecture: 'Transformer',
        trainingData: 'High-quality Chinese and multilingual datasets',
        license: 'Apache 2.0',
        paperUrl: 'https://arxiv.org/abs/2309.16609',
        lastUpdated: '2024-09-19'
      }
    }
  ];

  constructor() {
    this.rateLimiter = new HuggingFaceRateLimiter();
    this.cacheService = new HuggingFaceCacheService();
    this.webhookService = new HuggingFaceWebhookService();
    this.circuitBreaker = new HuggingFaceCircuitBreaker();
    this.credentialsService = new HuggingFaceCredentialsService();

    this.initializeVLLMServices();
    this.setupWebhookHandlers();
  }

  private initializeVLLMServices(): void {
    // Initialize vLLM services for each Chinese model
    for (const model of this.chineseModels) {
      if (model.runpodEndpoint && model.isActive) {
        const config: VLLMConfig = {
          apiKey: process.env.RUNPOD_API_KEY!,
          endpointId: this.extractEndpointId(model.runpodEndpoint),
          baseUrl: 'https://api.runpod.ai/v2',
          timeout: 120000,
          retries: 3,
          modelName: model.id
        };

        const vllmService = new VLLMService(config);
        this.vllmServices.set(model.id, vllmService);

        // Create circuit breaker for each model
        this.circuitBreaker.createBreaker(
          `vllm-${model.id}`,
          async () => vllmService.checkConnection(),
          {
            timeout: 30000,
            errorThresholdPercentage: 50,
            resetTimeout: 60000,
            rollingCountTimeout: 60000,
            rollingCountBuckets: 10,
            capacity: 100,
            bucketSpan: 6000,
            enabled: true
          }
        );
      }
    }
  }

  private extractEndpointId(endpoint: string): string {
    // Extract endpoint ID from RunPod URL
    const match = endpoint.match(/\/([a-zA-Z0-9-]+)$/);
    return match ? match[1] : endpoint;
  }

  private setupWebhookHandlers(): void {
    // Handle model deployment events
    this.webhookService.onDeploymentStatus(async (event) => {
      const { organization, data } = event;

      if (data.platform === 'runpod') {
        await this.cacheService.invalidateByTags(['deployments', organization]);

        // Update model availability based on deployment status
        if (data.status === 'ready') {
          await this.updateModelStatus(data.modelId, true);
        } else if (data.status === 'failed') {
          await this.updateModelStatus(data.modelId, false);
        }
      }
    });

    // Handle cost optimization events
    this.webhookService.registerHandler({
      eventType: 'quota.warning',
      handler: async (event) => {
        const { organization, data } = event;

        // Adjust rate limiting for cost optimization
        if (data.usagePercent > 80) {
          this.rateLimiter.updateRateLimitFromResponse(organization, {
            limit: 1000,
            remaining: Math.floor(1000 * (1 - data.usagePercent / 100)),
            reset: Date.now() + 3600000
          });
        }
      },
      priority: 'high'
    });
  }

  // === Model Discovery and Search ===

  async searchModels(params: RunPodSearchParams): Promise<RunPodSearchResult> {
    const cacheKey = `runpod:search:${JSON.stringify(params)}`;

    try {
      // Check cache first
      const cached = await this.cacheService.get<RunPodSearchResult>(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      // Get credentials
      const credentials = await this.credentialsService.getCredentials(params.organization);
      if (!credentials) {
        return {
          success: false,
          models: [],
          total: 0,
          fromCache: false,
          organization: params.organization,
          searchParams: params,
          error: 'No credentials found for organization'
        };
      }

      // Filter Chinese models based on search criteria
      let filteredModels = this.chineseModels.filter(model => {
        // Organization filter (if specific organization requested)
        if (params.organization !== 'all' && model.organization !== params.organization) {
          return false;
        }

        // Query filter (search in name and description)
        if (params.query) {
          const query = params.query.toLowerCase();
          const searchText = `${model.name} ${model.description}`.toLowerCase();
          if (!searchText.includes(query)) {
            return false;
          }
        }

        // Model type filter
        if (params.modelType && model.modelType !== params.modelType) {
          return false;
        }

        // Language filter
        if (params.language && model.language !== params.language && model.language !== 'multilingual') {
          return false;
        }

        // Capabilities filter
        if (params.capabilities?.length) {
          const hasCapability = params.capabilities.some(cap =>
            model.capabilities.includes(cap)
          );
          if (!hasCapability) {
            return false;
          }
        }

        return true;
      });

      // Parameter size filtering
      if (params.minParameters || params.maxParameters) {
        filteredModels = filteredModels.filter(model => {
          const modelSize = this.parseParameterSize(model.parameters);
          const minSize = params.minParameters ? this.parseParameterSize(params.minParameters) : 0;
          const maxSize = params.maxParameters ? this.parseParameterSize(params.maxParameters) : Infinity;

          return modelSize >= minSize && modelSize <= maxSize;
        });
      }

      // Check model availability via circuit breakers
      const availableModels: RunPodModelInfo[] = [];
      for (const model of filteredModels) {
        try {
          const isHealthy = this.circuitBreaker.isHealthy(`vllm-${model.id}`);
          if (isHealthy) {
            availableModels.push({ ...model, isActive: true });
          } else {
            availableModels.push({ ...model, isActive: false });
          }
        } catch (error) {
          // If health check fails, mark as inactive but still include
          availableModels.push({ ...model, isActive: false });
        }
      }

      // Apply pagination
      const offset = params.offset || 0;
      const limit = params.limit || 20;
      const paginatedModels = availableModels.slice(offset, offset + limit);

      const result: RunPodSearchResult = {
        success: true,
        models: paginatedModels,
        total: availableModels.length,
        fromCache: false,
        organization: params.organization,
        searchParams: params
      };

      // Cache the result
      await this.cacheService.set(cacheKey, result, {
        ttl: 300, // 5 minutes
        tags: ['models', params.organization]
      });

      return result;

    } catch (error) {
      return {
        success: false,
        models: [],
        total: 0,
        fromCache: false,
        organization: params.organization,
        searchParams: params,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // === Model Inference ===

  async runInference(request: RunPodInferenceRequest): Promise<RunPodInferenceResult> {
    const startTime = Date.now();

    try {
      // Get vLLM service for the model
      const vllmService = this.vllmServices.get(request.modelId);
      if (!vllmService) {
        return {
          success: false,
          model: request.modelId,
          id: this.generateRequestId(),
          created: Math.floor(Date.now() / 1000),
          object: 'chat.completion',
          error: `Model ${request.modelId} not available or not configured`
        };
      }

      // Convert to vLLM chat completion format
      const chatRequest: ChatCompletionRequest = {
        model: request.modelId,
        messages: request.messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 0.9,
        frequency_penalty: request.frequencyPenalty || 0,
        presence_penalty: request.presencePenalty || 0,
        stop: request.stop,
        stream: request.stream || false,
        // tools: request.tools as any, // Tools not supported in base ChatCompletionRequest
        // tool_choice: request.toolChoice // Tool choice not supported in base ChatCompletionRequest
      };

      // Execute with rate limiting and circuit breaker
      const response = await this.rateLimiter.schedule(
        request.organization,
        async () => {
          const response = await this.circuitBreaker.execute(
            `vllm-${request.modelId}`,
            () => vllmService.createChatCompletion(chatRequest)
          ) as ChatCompletionResponse;
          return response;
        },
        { priority: 'high' }
      );

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Calculate metrics
      const metrics = this.calculateInferenceMetrics(response, latency, request.modelId);

      return {
        success: true,
        choices: (response as any).choices,
        usage: (response as any).usage,
        model: (response as any).model,
        id: (response as any).id,
        created: (response as any).created,
        object: (response as any).object,
        metrics
      };

    } catch (error) {
      return {
        success: false,
        model: request.modelId,
        id: this.generateRequestId(),
        created: Math.floor(Date.now() / 1000),
        object: 'chat.completion',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // === Utility Methods ===

  private parseParameterSize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*([BMK]?)/i);
    if (!match) return 0;

    const [, num, unit] = match;
    const value = parseFloat(num);

    switch (unit.toUpperCase()) {
      case 'K': return value * 1000;
      case 'M': return value * 1000000;
      case 'B': return value * 1000000000;
      default: return value;
    }
  }

  private calculateInferenceMetrics(
    response: ChatCompletionResponse,
    latency: number,
    modelId: string
  ): { latency: number; tokensPerSecond: number; costEstimate: number } {
    const model = this.chineseModels.find(m => m.id === modelId);
    const usage = response.usage;

    if (!usage || !model?.pricing) {
      return { latency, tokensPerSecond: 0, costEstimate: 0 };
    }

    const tokensPerSecond = usage.completion_tokens / (latency / 1000);
    const costEstimate =
      (usage.prompt_tokens / 1000000) * model.pricing.inputTokens +
      (usage.completion_tokens / 1000000) * model.pricing.outputTokens;

    return { latency, tokensPerSecond, costEstimate };
  }

  private async updateModelStatus(modelId: string, isActive: boolean): Promise<void> {
    const modelIndex = this.chineseModels.findIndex(m => m.id === modelId);
    if (modelIndex >= 0) {
      this.chineseModels[modelIndex].isActive = isActive;

      // Invalidate related caches
      await this.cacheService.invalidateByTags(['models']);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // === Health and Statistics ===

  async getModelHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const model of this.chineseModels) {
      if (model.isActive && this.vllmServices.has(model.id)) {
        try {
          health[model.id] = this.circuitBreaker.isHealthy(`vllm-${model.id}`);
        } catch {
          health[model.id] = false;
        }
      } else {
        health[model.id] = false;
      }
    }

    return health;
  }

  async getInferenceMetrics(): Promise<InferenceMetrics[]> {
    const metrics: InferenceMetrics[] = [];

    for (const [modelId, vllmService] of this.vllmServices) {
      try {
        const modelMetrics = await vllmService.getUsageMetrics();
        metrics.push(...modelMetrics);
      } catch (error) {
        // Log error but continue
        console.warn(`Failed to get metrics for ${modelId}:`, error);
      }
    }

    return metrics;
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const modelHealth = await this.getModelHealth();
    const circuitBreakerStats = this.circuitBreaker.getAllStats();
    const cacheStats = this.cacheService.getStats();
    const rateLimiterStats = this.rateLimiter.getStatistics();

    const healthyModels = Object.values(modelHealth).filter(Boolean).length;
    const totalModels = Object.keys(modelHealth).length;
    const healthyBreakers = this.circuitBreaker.getHealthyBreakers().length;
    const totalBreakers = this.circuitBreaker.listBreakers().length;

    return {
      healthy: healthyModels > 0 && healthyBreakers > 0,
      details: {
        models: {
          healthy: healthyModels,
          total: totalModels,
          status: modelHealth
        },
        circuitBreakers: {
          healthy: healthyBreakers,
          total: totalBreakers,
          stats: circuitBreakerStats
        },
        cache: cacheStats,
        rateLimiter: rateLimiterStats,
        lastChecked: new Date().toISOString()
      }
    };
  }

  async disconnect(): Promise<void> {
    await this.cacheService.disconnect();
    this.vllmServices.clear();
  }
}

// Export singleton instance
export default new RunPodIntegrationService();