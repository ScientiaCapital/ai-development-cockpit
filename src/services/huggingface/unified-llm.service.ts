/**
 * Unified Chinese LLM Service
 * Discovers Chinese models from HuggingFace Hub and deploys them on RunPod serverless vLLM
 * Supports automatic model deployment and inference management
 */

import { HuggingFaceApiClient } from './api-client';
import { HuggingFaceRateLimiter } from './rate-limiter';
import { HuggingFaceCacheService } from './cache.service';
import { HuggingFaceWebhookService } from './webhook.service';
import { HuggingFaceCircuitBreaker } from './circuit-breaker';
import { HuggingFaceCredentialsService } from './credentials.service';
import { VLLMService } from '../runpod/vllm.service';
import type { VLLMConfig } from '../../types/vllm';

// Types for HuggingFace model discovery
export interface HFModelInfo {
  id: string;
  author: string;
  modelName: string;
  description?: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  language?: string[];
  size?: string;
  lastModified: string;
  gated?: boolean;
  private?: boolean;
}

// Enhanced types for RunPod deployment
export interface RunPodModelConfig {
  hfModelId: string;          // HuggingFace model ID
  hfModelInfo: HFModelInfo;   // Original HF model metadata
  runpodEndpointId?: string;  // RunPod endpoint after deployment
  deploymentStatus: 'pending' | 'deploying' | 'ready' | 'failed' | 'stopped';
  vllmConfig: {
    maxModelLen: number;
    gpuMemoryUtilization: number;
    maxNumBatchedTokens: number;
    maxNumSeqs: number;
    quantization?: 'awq' | 'gptq' | 'fp16' | 'fp8';
    tensorParallelSize?: number;
  };
  instanceConfig: {
    gpuTypeId: string;        // e.g., "NVIDIA RTX A5000"
    gpuCount: number;
    containerDiskInGb: number;
    minWorkers: number;
    maxWorkers: number;
    idleTimeout: number;
    flashAttention?: boolean;
  };
  pricing?: {
    setupTime: number;      // seconds for cold start
    idleTime: number;       // seconds before shutdown
    pricePerSecond: number; // USD per second when active
  };
  lastHealthCheck?: Date;
  errorMessage?: string;
}

export interface ChineseModelSearchParams {
  organization: string;
  query?: string;
  minDownloads?: number;
  minLikes?: number;
  maxSize?: string;           // e.g., "7B", "13B", "70B"
  tags?: string[];           // e.g., ["chinese", "instruct", "chat"]
  pipelineTag?: string;      // e.g., "text-generation", "conversational"
  libraryName?: string;      // e.g., "transformers", "vllm"
  includeGated?: boolean;
  includePrivate?: boolean;
  limit?: number;
  offset?: number;
}

export interface ModelDeploymentRequest {
  organization: string;
  hfModelId: string;
  instanceConfig?: {
    gpuTypeId?: string;
    gpuCount?: number;
    containerDiskInGb?: number;
    minWorkers?: number;
    maxWorkers?: number;
  };
  vllmConfig?: {
    maxModelLen?: number;
    quantization?: 'awq' | 'gptq' | 'fp16' | 'fp8';
    flashAttention?: boolean;
  };
  autoStart?: boolean;
}

export interface InferenceRequest {
  organization: string;
  modelId: string;            // HF model ID or RunPod endpoint ID
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
}

export interface InferenceResult {
  success: boolean;
  response?: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      message: {
        role: string;
        content: string;
      };
      finishReason: string;
    }>;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
  metrics?: {
    latency: number;
    tokensPerSecond: number;
    costEstimate: number;
    coldStart: boolean;
  };
}

export class UnifiedChineseLLMService {
  private apiClient: HuggingFaceApiClient;
  private rateLimiter: HuggingFaceRateLimiter;
  private cacheService: HuggingFaceCacheService;
  private webhookService: HuggingFaceWebhookService;
  private circuitBreaker: HuggingFaceCircuitBreaker;
  private credentialsService: HuggingFaceCredentialsService;
  private vllmService: VLLMService | null = null;

  // Model registry
  private deployedModels: Map<string, RunPodModelConfig> = new Map();

  // RunPod API configuration
  private runpodApiKey: string;
  private runpodBaseUrl: string = 'https://api.runpod.ai/v2';

  // Popular Chinese LLM models for quick discovery
  private popularChineseModels = [
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
    'microsoft/DialoGPT-medium-chinese',
    'uer/gpt2-chinese-cluecorpussmall'
  ];

  constructor() {
    this.apiClient = new HuggingFaceApiClient(process.env.HUGGINGFACE_API_KEY!);
    this.rateLimiter = new HuggingFaceRateLimiter();
    this.cacheService = new HuggingFaceCacheService();
    this.webhookService = new HuggingFaceWebhookService();
    this.circuitBreaker = new HuggingFaceCircuitBreaker();
    this.credentialsService = new HuggingFaceCredentialsService();

    // Initialize RunPod configuration
    this.runpodApiKey = process.env.RUNPOD_API_KEY || '';
    if (!this.runpodApiKey) {
      console.warn('RUNPOD_API_KEY not configured - RunPod deployment will not work');
    }

    this.initializeCircuitBreakers();
    this.setupWebhookHandlers();
    this.loadDeployedModels();
  }

  private initializeCircuitBreakers(): void {
    // Circuit breaker for HuggingFace API
    this.circuitBreaker.createBreaker(
      'huggingface-api',
      async () => this.apiClient.request({ url: '/models?limit=1', method: 'GET' }),
      {
        threshold: 5,
        timeout: 30000,
        resetTimeout: 60000,
        name: 'huggingface-api'
      }
    );

    // Circuit breaker for RunPod API
    this.circuitBreaker.createBreaker(
      'runpod-api',
      async () => this.checkRunPodHealth(),
      {
        threshold: 3,
        timeout: 20000,
        resetTimeout: 45000,
        name: 'runpod-api'
      }
    );
  }

  private setupWebhookHandlers(): void {
    // Handle model updates from HuggingFace
    this.webhookService.onModelUpdate(async (event) => {
      const modelId = event.data?.model_id;
      if (modelId && this.deployedModels.has(modelId)) {
        // Invalidate cache for this model
        await this.cacheService.invalidateByTags(['models', modelId]);

        // Refresh model metadata
        await this.refreshModelInfo(modelId);
      }
    });

    // Handle deployment status updates
    this.webhookService.registerHandler({
      eventType: 'deployment.completed',
      handler: async (event) => {
        const { modelId, endpointId, status } = event.data;
        if (this.deployedModels.has(modelId)) {
          const config = this.deployedModels.get(modelId)!;
          config.runpodEndpointId = endpointId;
          config.deploymentStatus = status === 'success' ? 'ready' : 'failed';
          this.deployedModels.set(modelId, config);
        }
      },
      priority: 8
    });
  }

  // === Model Discovery from HuggingFace ===

  async searchChineseModels(params: ChineseModelSearchParams): Promise<{
    success: boolean;
    models: HFModelInfo[];
    total: number;
    fromCache: boolean;
    error?: string;
  }> {
    const cacheKey = `chinese-models:${JSON.stringify(params)}`;

    try {
      // Check cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      // Build HuggingFace search query
      const searchQuery = this.buildHFSearchQuery(params);

      // Execute search with rate limiting and circuit breaker
      const response = await this.rateLimiter.schedule(
        params.organization,
        async () => {
          return await this.circuitBreaker.execute('huggingface-api', async () => {
            return await this.apiClient.request({
              url: `/models?${searchQuery}`,
              method: 'GET',
              retry: { maxRetries: 2, retryDelay: 1000 }
            });
          });
        },
        { priority: 5 }
      );

      // Process and filter results
      const models = this.processHFModels(response.data);
      const filteredModels = this.filterChineseModels(models, params);

      const result = {
        success: true,
        models: filteredModels,
        total: filteredModels.length,
        fromCache: false
      };

      // Cache results
      await this.cacheService.set(cacheKey, result, {
        ttl: 600, // 10 minutes
        tags: ['models', 'chinese', params.organization],
        redis: true
      });

      return result;

    } catch (error) {
      return {
        success: false,
        models: [],
        total: 0,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPopularChineseModels(organization: string): Promise<{
    success: boolean;
    models: HFModelInfo[];
    error?: string;
  }> {
    try {
      const modelPromises = this.popularChineseModels.map(async (modelId) => {
        try {
          const response = await this.rateLimiter.schedule(
            organization,
            async () => {
              return await this.apiClient.request({
                url: `/models/${modelId}`,
                method: 'GET'
              });
            },
            { priority: 6 }
          );
          return this.processHFModel(response.data);
        } catch (error) {
          console.warn(`Failed to fetch ${modelId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(modelPromises);
      const models = results.filter((model): model is HFModelInfo => model !== null);

      return {
        success: true,
        models
      };

    } catch (error) {
      return {
        success: false,
        models: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // === RunPod Deployment ===

  async deployModelToRunPod(request: ModelDeploymentRequest): Promise<{
    success: boolean;
    deploymentId?: string;
    endpointId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      // First, get model info from HuggingFace
      const modelInfo = await this.getModelInfo(request.hfModelId, request.organization);
      if (!modelInfo.success || !modelInfo.model) {
        return {
          success: false,
          error: 'Model not found on HuggingFace'
        };
      }

      // Create RunPod deployment configuration
      const deploymentConfig = this.createRunPodConfig(modelInfo.model, request);

      // Submit deployment to RunPod
      const deploymentResponse = await this.submitRunPodDeployment(deploymentConfig, request.organization);

      if (deploymentResponse.success) {
        // Store in registry
        const modelConfig: RunPodModelConfig = {
          hfModelId: request.hfModelId,
          hfModelInfo: modelInfo.model,
          runpodEndpointId: deploymentResponse.endpointId,
          deploymentStatus: 'deploying',
          vllmConfig: deploymentConfig.vllmConfig,
          instanceConfig: deploymentConfig.instanceConfig,
          pricing: deploymentResponse.pricing
        };

        this.deployedModels.set(request.hfModelId, modelConfig);

        // Cache deployment info
        await this.cacheService.set(
          `deployment:${request.hfModelId}`,
          modelConfig,
          {
            ttl: 3600, // 1 hour
            tags: ['deployments', request.organization, request.hfModelId]
          }
        );

        return {
          success: true,
          deploymentId: deploymentResponse.deploymentId,
          endpointId: deploymentResponse.endpointId,
          status: 'deploying'
        };
      }

      return {
        success: false,
        error: deploymentResponse.error || 'Deployment failed'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // === Model Inference ===

  async runInference(request: InferenceRequest): Promise<InferenceResult> {
    const startTime = Date.now();

    try {
      // Check if model is deployed
      const modelConfig = this.deployedModels.get(request.modelId);
      if (!modelConfig || !modelConfig.runpodEndpointId) {
        return {
          success: false,
          error: `Model ${request.modelId} is not deployed or ready`
        };
      }

      // Ensure model is ready
      if (modelConfig.deploymentStatus !== 'ready') {
        // Try to wake up the model
        await this.wakeUpModel(modelConfig.runpodEndpointId);
      }

      // Prepare vLLM inference request
      const vllmRequest = {
        model: request.modelId,
        messages: request.messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 0.9,
        stop: request.stop,
        stream: request.stream || false
      };

      // Execute inference with rate limiting and circuit breaker
      const response = await this.rateLimiter.schedule(
        request.organization,
        async () => {
          return await this.circuitBreaker.execute('runpod-api', async () => {
            return await this.executeRunPodInference(modelConfig.runpodEndpointId!, vllmRequest);
          });
        },
        { priority: 8 }
      );

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Calculate metrics
      const metrics = this.calculateInferenceMetrics(response, latency, modelConfig);

      return {
        success: true,
        response,
        metrics
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Inference failed'
      };
    }
  }

  // === Utility Methods ===

  private buildHFSearchQuery(params: ChineseModelSearchParams): string {
    const queryParams = new URLSearchParams();

    // Basic search query
    if (params.query) {
      queryParams.append('search', params.query);
    }

    // Add Chinese language tags if not specified
    const tags = params.tags || [];
    if (!tags.some(tag => ['chinese', 'zh', 'multilingual'].includes(tag.toLowerCase()))) {
      tags.push('chinese');
    }

    if (tags.length > 0) {
      queryParams.append('filter', `tags:${tags.join(',')}`);
    }

    if (params.pipelineTag) {
      queryParams.append('pipeline_tag', params.pipelineTag);
    }

    if (params.libraryName) {
      queryParams.append('library', params.libraryName);
    }

    queryParams.append('limit', (params.limit || 50).toString());
    queryParams.append('sort', 'downloads');
    queryParams.append('direction', '-1');

    return queryParams.toString();
  }

  private processHFModels(rawModels: any[]): HFModelInfo[] {
    return rawModels.map(model => this.processHFModel(model));
  }

  private processHFModel(model: any): HFModelInfo {
    return {
      id: model.id || model.modelId,
      author: model.author || model.id?.split('/')[0] || 'unknown',
      modelName: model.id?.split('/')[1] || model.id,
      description: model.description || model.cardData?.title,
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      tags: model.tags || [],
      pipeline_tag: model.pipeline_tag,
      library_name: model.library_name,
      language: model.language,
      size: this.extractModelSize(model),
      lastModified: model.lastModified || model.updatedAt,
      gated: model.gated || false,
      private: model.private || false
    };
  }

  private extractModelSize(model: any): string {
    const id = model.id?.toLowerCase() || '';
    const tags = model.tags || [];

    // Common size patterns
    const sizePatterns = [
      /(\d+\.?\d*)\s*b(?:illion)?/i,
      /(\d+\.?\d*)\s*m(?:illion)?/i,
      /(\d+\.?\d*)\s*k(?:thousand)?/i
    ];

    // Check model ID first
    for (const pattern of sizePatterns) {
      const match = id.match(pattern);
      if (match) {
        return match[0].toUpperCase();
      }
    }

    // Check tags
    for (const tag of tags) {
      for (const pattern of sizePatterns) {
        const match = tag.match(pattern);
        if (match) {
          return match[0].toUpperCase();
        }
      }
    }

    return 'unknown';
  }

  private filterChineseModels(models: HFModelInfo[], params: ChineseModelSearchParams): HFModelInfo[] {
    return models.filter(model => {
      // Downloads filter
      if (params.minDownloads && model.downloads < params.minDownloads) {
        return false;
      }

      // Likes filter
      if (params.minLikes && model.likes < params.minLikes) {
        return false;
      }

      // Size filter
      if (params.maxSize && !this.isSizeWithinLimit(model.size, params.maxSize)) {
        return false;
      }

      // Gated filter
      if (!params.includeGated && model.gated) {
        return false;
      }

      // Private filter
      if (!params.includePrivate && model.private) {
        return false;
      }

      // Check if it's actually a Chinese/multilingual model
      const chineseIndicators = [
        'chinese', 'zh', 'cn', 'qwen', 'baichuan', 'chatglm',
        'deepseek', 'internlm', 'yi', 'multilingual'
      ];

      const modelText = `${model.id} ${model.description || ''} ${model.tags.join(' ')}`.toLowerCase();
      return chineseIndicators.some(indicator => modelText.includes(indicator));
    });
  }

  private isSizeWithinLimit(modelSize: string, maxSize: string): boolean {
    const parseSize = (size: string): number => {
      const match = size.match(/(\d+\.?\d*)\s*([BMK]?)/i);
      if (!match) return 0;

      const [, num, unit] = match;
      const value = parseFloat(num);

      switch (unit.toUpperCase()) {
        case 'K': return value * 1000;
        case 'M': return value * 1000000;
        case 'B': return value * 1000000000;
        default: return value;
      }
    };

    return parseSize(modelSize) <= parseSize(maxSize);
  }

  private createRunPodConfig(model: HFModelInfo, request: ModelDeploymentRequest): any {
    // Determine optimal configuration based on model size
    const modelSizeNum = this.extractModelSizeNumber(model.size);

    let defaultConfig = {
      instanceConfig: {
        gpuTypeId: "NVIDIA RTX A5000",
        gpuCount: 1,
        containerDiskInGb: 50,
        minWorkers: 0,
        maxWorkers: 1,
        idleTimeout: 300 // 5 minutes
      },
      vllmConfig: {
        maxModelLen: 4096,
        gpuMemoryUtilization: 0.8,
        maxNumBatchedTokens: 2048,
        maxNumSeqs: 8
      }
    };

    // Adjust based on model size
    if (modelSizeNum >= 30) { // 30B+ models
      defaultConfig.instanceConfig.gpuTypeId = "NVIDIA A100 80GB";
      defaultConfig.instanceConfig.gpuCount = 2;
      defaultConfig.instanceConfig.containerDiskInGb = 100;
      defaultConfig.vllmConfig.maxModelLen = 8192;
      defaultConfig.vllmConfig.maxNumBatchedTokens = 4096;
    } else if (modelSizeNum >= 13) { // 13B-30B models
      defaultConfig.instanceConfig.gpuTypeId = "NVIDIA A100 40GB";
      defaultConfig.instanceConfig.containerDiskInGb = 75;
      defaultConfig.vllmConfig.maxModelLen = 8192;
    } else if (modelSizeNum >= 7) { // 7B-13B models
      defaultConfig.instanceConfig.gpuTypeId = "NVIDIA RTX A6000";
      defaultConfig.instanceConfig.containerDiskInGb = 60;
    }

    // Override with user-specified config
    return {
      hfModelId: request.hfModelId,
      instanceConfig: { ...defaultConfig.instanceConfig, ...request.instanceConfig },
      vllmConfig: { ...defaultConfig.vllmConfig, ...request.vllmConfig },
      templateId: "vllm-runpod-serverless", // Use RunPod's vLLM serverless template
      environment: {
        HUGGING_FACE_HUB_TOKEN: process.env.HUGGINGFACE_API_KEY,
        MODEL_NAME: request.hfModelId,
        MAX_MODEL_LEN: defaultConfig.vllmConfig.maxModelLen.toString(),
        GPU_MEMORY_UTILIZATION: defaultConfig.vllmConfig.gpuMemoryUtilization.toString()
      }
    };
  }

  private extractModelSizeNumber(size: string): number {
    const match = size.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private async submitRunPodDeployment(config: any, organization: string): Promise<{
    success: boolean;
    deploymentId?: string;
    endpointId?: string;
    pricing?: any;
    error?: string;
  }> {
    try {
      if (!this.runpodApiKey) {
        throw new Error('RunPod API key not configured');
      }

      // Create RunPod serverless endpoint using their API
      const endpointPayload = {
        name: `chinese-llm-${config.hfModelId.replace('/', '-').toLowerCase()}`,
        template_id: config.templateId || 'vllm-runpod-serverless',
        gpu_count: config.instanceConfig.gpuCount,
        gpu_type_id: config.instanceConfig.gpuTypeId,
        container_disk_in_gb: config.instanceConfig.containerDiskInGb,
        docker_start_policy: 'ON_DEMAND',
        min_provisioned_workers: config.instanceConfig.minWorkers,
        max_workers: config.instanceConfig.maxWorkers,
        idle_timeout: config.instanceConfig.idleTimeout,
        locations: config.locations || 'US,EU',
        env: {
          ...config.environment,
          MODEL_NAME: config.hfModelId,
          HF_TOKEN: process.env.HUGGINGFACE_API_KEY || '',
          QUANTIZATION: config.vllmConfig.quantization || 'none',
          MAX_MODEL_LEN: config.vllmConfig.maxModelLen?.toString() || '4096',
          GPU_MEMORY_UTILIZATION: config.vllmConfig.gpuMemoryUtilization?.toString() || '0.8',
          MAX_NUM_BATCHED_TOKENS: config.vllmConfig.maxNumBatchedTokens?.toString() || '2048',
          MAX_NUM_SEQS: config.vllmConfig.maxNumSeqs?.toString() || '8'
        }
      };

      // Make API call to RunPod to create serverless endpoint
      const response = await this.makeRunPodApiCall(
        '/endpoints',
        'POST',
        endpointPayload
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const endpointId = response.id;

      // Calculate estimated pricing based on GPU type and configuration
      const pricing = this.calculateRunPodPricing(config);

      return {
        success: true,
        deploymentId: response.id,
        endpointId: endpointId,
        pricing
      };

    } catch (error) {
      console.error('RunPod deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      };
    }
  }

  private async executeRunPodInference(endpointId: string, request: any): Promise<any> {
    try {
      if (!this.runpodApiKey) {
        throw new Error('RunPod API key not configured');
      }

      // Create vLLM service instance for this endpoint if not exists
      if (!this.vllmService) {
        const vllmConfig: VLLMConfig = {
          endpointId: endpointId,
          apiKey: this.runpodApiKey,
          modelName: request.model,
          baseUrl: this.runpodBaseUrl,
          timeout: 120000,
          retries: 3
        };
        this.vllmService = new VLLMService(vllmConfig);
      }

      // Convert request to vLLM format and execute
      const vllmRequest = {
        prompt: request.messages ?
          this.convertMessagesToPrompt(request.messages) :
          request.prompt,
        messages: request.messages,
        maxTokens: request.max_tokens || 1024,
        temperature: request.temperature || 0.7,
        topP: request.top_p || 0.9,
        stop: request.stop,
        stream: request.stream || false
      };

      // Use the appropriate API based on request format
      if (request.messages) {
        // Use OpenAI-compatible chat completion
        const chatRequest = {
          model: request.model,
          messages: request.messages,
          max_tokens: request.max_tokens,
          temperature: request.temperature,
          top_p: request.top_p,
          stop: request.stop
        };

        const response = await this.vllmService.createChatCompletion(chatRequest);
        return response;
      } else {
        // Use native vLLM inference
        const nativeRequest = {
          input: {
            prompt: vllmRequest.prompt,
            max_tokens: vllmRequest.maxTokens,
            temperature: vllmRequest.temperature,
            top_p: vllmRequest.topP,
            stop: vllmRequest.stop
          }
        };

        const response = await this.vllmService.runInferenceNative(nativeRequest);

        // Convert native response to OpenAI format
        return this.convertNativeResponseToOpenAI(response, request.model);
      }

    } catch (error) {
      console.error('RunPod inference failed:', error);
      throw new Error(`RunPod inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateInferenceMetrics(response: any, latency: number, modelConfig: RunPodModelConfig): any {
    const tokensPerSecond = response.usage?.completionTokens ?
      response.usage.completionTokens / (latency / 1000) : 0;

    const costEstimate = modelConfig.pricing ?
      (latency / 1000) * modelConfig.pricing.pricePerSecond : 0;

    return {
      latency,
      tokensPerSecond,
      costEstimate,
      coldStart: latency > 10000 // Consider >10s as cold start
    };
  }

  // === RunPod API Helper Methods ===

  private async makeRunPodApiCall(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    const url = `${this.runpodBaseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.runpodApiKey}`,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RunPod API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('RunPod API call failed:', error);
      throw error;
    }
  }

  private calculateRunPodPricing(config: any): any {
    // Approximate pricing based on GPU type and configuration
    const gpuPricing = {
      'NVIDIA RTX A5000': 0.0003,
      'NVIDIA RTX A6000': 0.0004,
      'NVIDIA A100 40GB': 0.0008,
      'NVIDIA A100 80GB': 0.0012,
      'NVIDIA H100': 0.0015
    };

    const basePrice = gpuPricing[config.instanceConfig.gpuTypeId as keyof typeof gpuPricing] || 0.0005;
    const pricePerSecond = basePrice * config.instanceConfig.gpuCount;

    return {
      setupTime: 30, // seconds for cold start
      idleTime: config.instanceConfig.idleTimeout || 300,
      pricePerSecond,
      estimatedHourlyCost: pricePerSecond * 3600,
      currency: 'USD'
    };
  }

  private convertMessagesToPrompt(messages: any[]): string {
    return messages.map(msg => {
      if (msg.role === 'system') return `<|system|>\n${msg.content}\n`;
      if (msg.role === 'user') return `<|user|>\n${msg.content}\n`;
      if (msg.role === 'assistant') return `<|assistant|>\n${msg.content}\n`;
      return msg.content;
    }).join('') + '<|assistant|>\n';
  }

  private convertNativeResponseToOpenAI(nativeResponse: any, modelName: string): any {
    // Convert RunPod native response to OpenAI format
    const output = nativeResponse.output?.[0] || nativeResponse.output || {};

    return {
      id: nativeResponse.id || `chat_${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: output.choices?.[0]?.text || output.text || 'No response generated'
          },
          finish_reason: output.choices?.[0]?.finish_reason || 'stop'
        }
      ],
      usage: {
        prompt_tokens: output.usage?.prompt_tokens || 0,
        completion_tokens: output.usage?.completion_tokens || 0,
        total_tokens: output.usage?.total_tokens || 0
      }
    };
  }

  // Additional helper methods...

  async getModelInfo(modelId: string, organization: string): Promise<{
    success: boolean;
    model?: HFModelInfo;
    error?: string;
  }> {
    try {
      const response = await this.rateLimiter.schedule(
        organization,
        async () => {
          return await this.apiClient.request({
            url: `/models/${modelId}`,
            method: 'GET'
          });
        },
        { priority: 6 }
      );

      return {
        success: true,
        model: this.processHFModel(response.data)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Model not found'
      };
    }
  }

  private async refreshModelInfo(modelId: string): Promise<void> {
    try {
      // Get fresh model info from HuggingFace
      const response = await this.apiClient.request({
        url: `/models/${modelId}`,
        method: 'GET'
      });

      if (response.success && response.data) {
        const updatedModel = this.processHFModel(response.data);

        // Update deployed model info if it exists
        if (this.deployedModels.has(modelId)) {
          const config = this.deployedModels.get(modelId)!;
          config.hfModelInfo = updatedModel;
          config.lastHealthCheck = new Date();
          this.deployedModels.set(modelId, config);

          // Update cache
          await this.cacheService.set(
            `deployment:${modelId}`,
            config,
            {
              ttl: 3600,
              tags: ['deployments', modelId]
            }
          );
        }
      }
    } catch (error) {
      console.error(`Failed to refresh model info for ${modelId}:`, error);
    }
  }

  private async checkRunPodHealth(): Promise<void> {
    try {
      if (!this.runpodApiKey) {
        throw new Error('RunPod API key not configured');
      }

      // Check if we can access RunPod API
      const response = await this.makeRunPodApiCall('/user', 'GET');

      if (!response || response.error) {
        throw new Error('RunPod API health check failed');
      }

      // If we have deployed models, check their status
      for (const [modelId, config] of this.deployedModels.entries()) {
        if (config.runpodEndpointId) {
          try {
            await this.checkEndpointStatus(config.runpodEndpointId);
          } catch (error) {
            console.warn(`Health check failed for model ${modelId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('RunPod health check failed:', error);
      throw error;
    }
  }

  private async wakeUpModel(endpointId: string): Promise<void> {
    try {
      if (!this.runpodApiKey) {
        throw new Error('RunPod API key not configured');
      }

      // For serverless endpoints, we wake them up by making a simple request
      console.log(`Waking up RunPod endpoint: ${endpointId}`);

      // Make a simple health check request to wake up the endpoint
      const wakeUpRequest = {
        input: {
          prompt: "Hello",
          max_tokens: 1,
          temperature: 0.1
        }
      };

      // This will trigger the serverless function to start
      await this.makeRunPodApiCall(`/${endpointId}/run`, 'POST', wakeUpRequest);

      console.log(`RunPod endpoint ${endpointId} wake-up request sent`);
    } catch (error) {
      console.warn(`Failed to wake up endpoint ${endpointId}:`, error);
      // Don't throw error as this is a best-effort operation
    }
  }

  private async checkEndpointStatus(endpointId: string): Promise<any> {
    try {
      const response = await this.makeRunPodApiCall(`/endpoints/${endpointId}`, 'GET');
      return response;
    } catch (error) {
      console.error(`Failed to check endpoint status ${endpointId}:`, error);
      throw error;
    }
  }

  private async loadDeployedModels(): Promise<void> {
    try {
      // Try to load deployed models from cache
      const cacheKeys = await this.cacheService.getByTags(['deployments']);

      for (const key of cacheKeys || []) {
        try {
          const cached = await this.cacheService.get(key);
          if (cached && cached.hfModelId && cached.runpodEndpointId) {
            this.deployedModels.set(cached.hfModelId, cached);
            console.log(`Loaded deployed model from cache: ${cached.hfModelId}`);
          }
        } catch (error) {
          console.warn(`Failed to load cached deployment ${key}:`, error);
        }
      }

      // If no cached models, check if we have any RunPod endpoints
      if (this.deployedModels.size === 0 && this.runpodApiKey) {
        try {
          const endpoints = await this.makeRunPodApiCall('/endpoints', 'GET');

          if (endpoints && Array.isArray(endpoints)) {
            for (const endpoint of endpoints) {
              // Check if this is a Chinese LLM endpoint based on name
              if (endpoint.name?.includes('chinese-llm') && endpoint.id) {
                console.log(`Found existing Chinese LLM endpoint: ${endpoint.name} (${endpoint.id})`);

                // We'd need to reconstruct the model info from the endpoint
                // For now, just log that we found it
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load existing RunPod endpoints:', error);
        }
      }

      console.log(`Loaded ${this.deployedModels.size} deployed models`);
    } catch (error) {
      console.error('Failed to load deployed models:', error);
    }
  }

  // === Public API ===

  getDeployedModels(): Map<string, RunPodModelConfig> {
    return new Map(this.deployedModels);
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const hfHealth = await this.circuitBreaker.healthCheck('huggingface-api');
    const runpodHealth = await this.circuitBreaker.healthCheck('runpod-api');
    const cacheStats = this.cacheService.getStats();

    return {
      healthy: hfHealth && runpodHealth,
      details: {
        huggingface: hfHealth,
        runpod: runpodHealth,
        cache: cacheStats,
        deployedModels: this.deployedModels.size,
        lastChecked: new Date().toISOString()
      }
    };
  }

  async disconnect(): Promise<void> {
    await this.cacheService.disconnect();
  }
}

// Export singleton instance
export default new UnifiedChineseLLMService();