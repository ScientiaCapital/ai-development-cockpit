/**
 * HuggingFace Model Discovery Service
 * Real-time model search, metadata retrieval, and requirements parsing
 */

import { listModels, modelInfo } from '@huggingface/hub';

interface ModelSearchParams {
  search?: string;
  task?: string;
  library?: string;
  language?: string;
  author?: string;
  tags?: string[];
  sort?: 'downloads' | 'likes' | 'updated' | 'created';
  limit?: number;
  offset?: number;
}

interface ModelInfo {
  id: string;
  name: string;
  author: string;
  description: string;
  task: string;
  library: string;
  tags: string[];
  downloads: number;
  likes: number;
  lastModified: string;
  modelSize: number; // in GB
  parameterCount: string; // e.g., "7B", "13B"
  license: string;
  requirements: {
    minGpuMemory: number; // GB
    recommendedGpuMemory: number; // GB
    supportedFrameworks: string[];
    quantization: string[];
  };
  cost: {
    estimatedHourly: number;
    estimatedMonthly: number;
    savingsVsOpenAI: number;
  };
  deployment: {
    supported: boolean;
    framework: 'vllm' | 'sglang' | 'transformers';
    templateId: string;
  };
}

interface ModelSearchResult {
  models: ModelInfo[];
  total: number;
  hasMore: boolean;
}

export class HuggingFaceDiscoveryService {
  private cache: Map<string, ModelInfo> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly accessToken: string | undefined;

  constructor() {
    this.accessToken = process.env.HUGGINGFACE_TOKEN;
  }

  /**
   * Search for models with filters and pagination
   */
  async searchModels(params: ModelSearchParams = {}): Promise<ModelSearchResult> {
    try {
      const {
        search = '',
        task = 'text-generation',
        library,
        sort = 'downloads',
        limit = 20,
        offset = 0
      } = params;

      // Build search filter
      const filter = {
        task: task === 'all' ? undefined : task,
        library: library === 'all' ? undefined : library,
        sort,
        limit,
        offset
      };

      // Search models via HuggingFace API
      const modelIterator = listModels({
        search,
        filter,
        accessToken: this.accessToken
      });

      const models: ModelInfo[] = [];
      let count = 0;

      for await (const model of modelIterator) {
        if (count >= offset + limit) break;
        if (count >= offset) {
          const modelInfo = await this.getModelInfo(model.name);
          if (modelInfo && this.isDeployableModel(modelInfo)) {
            models.push(modelInfo);
          }
        }
        count++;
      }

      return {
        models,
        total: count,
        hasMore: count === limit
      };

    } catch (error) {
      console.error('Model search failed:', error);
      // Fallback to curated list if API fails
      return this.getFallbackModels();
    }
  }

  /**
   * Get detailed information about a specific model
   */
  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    // Check cache first
    const cached = this.getFromCache(modelId);
    if (cached) return cached;

    try {
      // Fetch model info from HuggingFace
      const model = await modelInfo({
        repo: modelId,
        accessToken: this.accessToken
      });
      const modelCard = await this.fetchModelCard(modelId);

      // Parse model information
      const modelInfo: ModelInfo = {
        id: model.name,
        name: this.formatModelName(model.name),
        author: model.name.split('/')[0] || 'Unknown',
        description: model.description || 'No description available',
        task: this.normalizeTask(model.pipeline_tag || 'text-generation'),
        library: this.detectLibrary(model.tags || []),
        tags: model.tags || [],
        downloads: model.downloads || 0,
        likes: model.likes || 0,
        lastModified: model.lastModified || new Date().toISOString(),
        modelSize: this.estimateModelSize(model.name, modelCard),
        parameterCount: this.extractParameterCount(model.name, modelCard),
        license: model.cardData?.license || 'Unknown',
        requirements: this.calculateRequirements(model.name, modelCard),
        cost: this.calculateCost(model.name, modelCard),
        deployment: this.getDeploymentInfo(model.name, modelCard)
      };

      // Cache the result
      this.setCache(modelId, modelInfo);
      return modelInfo;

    } catch (error) {
      console.error(`Failed to get model info for ${modelId}:`, error);
      return null;
    }
  }

  /**
   * Get model recommendations based on task and constraints
   */
  async getRecommendations(
    task: string,
    maxCost?: number,
    maxGpuMemory?: number
  ): Promise<ModelInfo[]> {
    const searchResult = await this.searchModels({
      task,
      sort: 'downloads',
      limit: 50
    });

    let models = searchResult.models;

    // Apply filters
    if (maxCost) {
      models = models.filter(m => m.cost.estimatedHourly <= maxCost);
    }

    if (maxGpuMemory) {
      models = models.filter(m => m.requirements.minGpuMemory <= maxGpuMemory);
    }

    // Sort by best value (downloads / cost ratio)
    models.sort((a, b) => {
      const valueA = a.downloads / (a.cost.estimatedHourly + 0.1);
      const valueB = b.downloads / (b.cost.estimatedHourly + 0.1);
      return valueB - valueA;
    });

    return models.slice(0, 10);
  }

  /**
   * Check if model is currently deployable
   */
  private isDeployableModel(model: ModelInfo): boolean {
    // Filter criteria for deployable models
    return (
      model.task === 'text-generation' &&
      model.requirements.minGpuMemory <= 80 && // Max GPU memory available
      model.deployment.supported &&
      !model.tags.includes('gated') // Skip gated models for now
    );
  }

  /**
   * Format model name for display
   */
  private formatModelName(fullName: string): string {
    const parts = fullName.split('/');
    return parts.length > 1 ? parts[1] : fullName;
  }

  /**
   * Normalize task names
   */
  private normalizeTask(task: string): string {
    const taskMapping = {
      'text-generation': 'text-generation',
      'conversational': 'text-generation',
      'text2text-generation': 'text-generation',
      'question-answering': 'question-answering',
      'summarization': 'summarization',
      'translation': 'translation',
      'fill-mask': 'fill-mask'
    };

    return taskMapping[task] || task;
  }

  /**
   * Detect preferred framework from model tags
   */
  private detectLibrary(tags: string[]): string {
    if (tags.includes('pytorch')) return 'pytorch';
    if (tags.includes('transformers')) return 'transformers';
    if (tags.includes('gguf')) return 'llama.cpp';
    return 'transformers';
  }

  /**
   * Extract parameter count from model name or card
   */
  private extractParameterCount(modelName: string, modelCard?: any): string {
    const name = modelName.toLowerCase();

    if (name.includes('7b')) return '7B';
    if (name.includes('13b')) return '13B';
    if (name.includes('30b')) return '30B';
    if (name.includes('70b')) return '70B';
    if (name.includes('3b')) return '3B';
    if (name.includes('1b')) return '1B';

    // Try to extract from model card
    if (modelCard?.content) {
      const paramMatch = modelCard.content.match(/(\d+\.?\d*)\s*[Bb](?:illion)?/);
      if (paramMatch) {
        return `${paramMatch[1]}B`;
      }
    }

    return 'Unknown';
  }

  /**
   * Estimate model size in GB
   */
  private estimateModelSize(modelName: string, modelCard?: any): number {
    const paramCount = this.extractParameterCount(modelName, modelCard);

    // Rough estimation: parameters * 2 bytes (FP16) + overhead
    const sizeMap = {
      '1B': 2.5,
      '3B': 7,
      '7B': 15,
      '13B': 27,
      '30B': 65,
      '70B': 145
    };

    return sizeMap[paramCount] || 15;
  }

  /**
   * Calculate GPU memory requirements
   */
  private calculateRequirements(modelName: string, modelCard?: any) {
    const modelSize = this.estimateModelSize(modelName, modelCard);

    return {
      minGpuMemory: Math.ceil(modelSize * 1.2), // Model + overhead
      recommendedGpuMemory: Math.ceil(modelSize * 1.5), // Model + KV cache
      supportedFrameworks: ['vllm', 'transformers', 'sglang'],
      quantization: ['fp16', '4bit', '8bit']
    };
  }

  /**
   * Calculate cost estimates
   */
  private calculateCost(modelName: string, modelCard?: any) {
    const requirements = this.calculateRequirements(modelName, modelCard);

    // GPU pricing based on memory requirements
    let hourlyRate = 0.79; // RTX A6000 base rate
    if (requirements.recommendedGpuMemory > 24) {
      hourlyRate = 0.89; // A40
    }
    if (requirements.recommendedGpuMemory > 48) {
      hourlyRate = 2.89; // A100
    }

    const monthlyRate = hourlyRate * 24 * 30;

    // Calculate savings vs OpenAI GPT-4 ($30/1M tokens)
    // Assume 1M tokens = ~750k words = ~$30 OpenAI
    // Our cost for same usage (assuming 100 req/hour avg)
    const ourMonthlyCost = monthlyRate;
    const openaiMonthlyCost = 750; // Conservative estimate
    const savingsPercent = Math.min(97, Math.max(0,
      ((openaiMonthlyCost - ourMonthlyCost) / openaiMonthlyCost) * 100
    ));

    return {
      estimatedHourly: hourlyRate,
      estimatedMonthly: monthlyRate,
      savingsVsOpenAI: Math.round(savingsPercent)
    };
  }

  /**
   * Get deployment configuration
   */
  private getDeploymentInfo(modelName: string, modelCard?: any) {
    const paramCount = this.extractParameterCount(modelName, modelCard);

    // Choose optimal framework
    let framework: 'vllm' | 'sglang' | 'transformers' = 'vllm';

    if (modelName.toLowerCase().includes('code') ||
        modelName.toLowerCase().includes('instruct')) {
      framework = 'sglang'; // Better for structured generation
    }

    const templateMap = {
      '1B': 'vllm-7b',
      '3B': 'vllm-7b',
      '7B': framework === 'sglang' ? 'sglang-7b' : 'vllm-7b',
      '13B': 'vllm-13b',
      '30B': 'vllm-13b',
      '70B': 'vllm-13b'
    };

    return {
      supported: true,
      framework,
      templateId: templateMap[paramCount] || 'vllm-7b'
    };
  }

  /**
   * Fetch model card content (simplified for now)
   */
  private async fetchModelCard(modelId: string): Promise<any> {
    // For now, return null as model cards are not critical for basic functionality
    // Could implement direct HTTP fetch to HuggingFace if needed later
    return null;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): ModelInfo | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  private setCache(key: string, value: ModelInfo): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * Fallback models if API is unavailable
   */
  private getFallbackModels(): ModelSearchResult {
    const fallbackModels: ModelInfo[] = [
      {
        id: 'meta-llama/Llama-2-7b-chat-hf',
        name: 'Llama-2-7b-chat-hf',
        author: 'meta-llama',
        description: 'Llama 2 is a collection of pretrained and fine-tuned generative text models',
        task: 'text-generation',
        library: 'transformers',
        tags: ['pytorch', 'llama', 'text-generation'],
        downloads: 5000000,
        likes: 15000,
        lastModified: new Date().toISOString(),
        modelSize: 15,
        parameterCount: '7B',
        license: 'llama2',
        requirements: {
          minGpuMemory: 18,
          recommendedGpuMemory: 24,
          supportedFrameworks: ['vllm', 'transformers'],
          quantization: ['fp16', '4bit', '8bit']
        },
        cost: {
          estimatedHourly: 0.79,
          estimatedMonthly: 569,
          savingsVsOpenAI: 92
        },
        deployment: {
          supported: true,
          framework: 'vllm',
          templateId: 'vllm-7b'
        }
      }
    ];

    return {
      models: fallbackModels,
      total: fallbackModels.length,
      hasMore: false
    };
  }
}

export default HuggingFaceDiscoveryService;