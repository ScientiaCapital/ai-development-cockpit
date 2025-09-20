/**
 * RunPod Deployment Service
 * Handles serverless endpoint creation, management, and monitoring
 */

import runpodSdk, { run, status, health } from 'runpod-sdk';

interface DeploymentConfig {
  modelId: string;
  containerImage?: string;
  gpuType?: string;
  gpuCount?: number;
  minWorkers?: number;
  maxWorkers?: number;
  timeout?: number;
  envVars?: Record<string, string>;
}

interface DeploymentResult {
  endpointId: string;
  endpointUrl: string;
  status: 'creating' | 'running' | 'failed';
  estimatedCostPerHour: number;
  deploymentTime: number;
}

interface ModelTemplate {
  containerImage: string;
  ports: number[];
  envVars: Record<string, string>;
  gpuRequirements: {
    memory: number; // GB
    type: string[];
  };
}

export class RunPodDeploymentService {
  private apiKey: string;
  private baseUrl: string = 'https://api.runpod.ai/v2';

  // Pre-configured templates for different model types
  private static MODEL_TEMPLATES: Record<string, ModelTemplate> = {
    'vllm-7b': {
      containerImage: 'runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04',
      ports: [8000],
      envVars: {
        'MODEL_NAME': '',
        'VLLM_GPU_MEMORY_UTILIZATION': '0.9',
        'VLLM_TENSOR_PARALLEL_SIZE': '1'
      },
      gpuRequirements: {
        memory: 16,
        type: ['RTX A6000', 'RTX 4090', 'A40']
      }
    },
    'vllm-13b': {
      containerImage: 'runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04',
      ports: [8000],
      envVars: {
        'MODEL_NAME': '',
        'VLLM_GPU_MEMORY_UTILIZATION': '0.9',
        'VLLM_TENSOR_PARALLEL_SIZE': '2'
      },
      gpuRequirements: {
        memory: 32,
        type: ['A40', 'A100']
      }
    },
    'sglang-7b': {
      containerImage: 'lmsysorg/sglang:latest',
      ports: [30000],
      envVars: {
        'MODEL_PATH': '',
        'TP_SIZE': '1',
        'MEM_FRACTION_STATIC': '0.9'
      },
      gpuRequirements: {
        memory: 16,
        type: ['RTX A6000', 'RTX 4090', 'A40']
      }
    }
  };

  constructor() {
    this.apiKey = process.env.RUNPOD_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('RUNPOD_API_KEY environment variable is required');
    }
  }

  /**
   * Deploy a model to RunPod serverless
   */
  async deployModel(config: DeploymentConfig): Promise<DeploymentResult> {
    const startTime = Date.now();

    try {
      // Select appropriate template based on model
      const template = this.selectTemplate(config.modelId);

      // Create serverless endpoint via direct API call
      const endpointPayload = {
        name: `llm-${config.modelId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`,
        template_id: template.containerImage,
        gpu_ids: this.selectGPU(template.gpuRequirements),
        container: {
          image: config.containerImage || template.containerImage,
          ports: template.ports,
          env: {
            ...template.envVars,
            MODEL_NAME: config.modelId,
            MODEL_PATH: config.modelId,
            ...config.envVars
          }
        },
        scalerSettings: {
          min_workers: config.minWorkers || 0,
          max_workers: config.maxWorkers || 3,
          idle_timeout: config.timeout || 300
        },
        networkSettings: {
          ports: template.ports.map(port => ({
            containerPort: port,
            type: 'http'
          }))
        }
      };

      const response = await fetch(`${this.baseUrl}/endpoints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(endpointPayload)
      });

      if (!response.ok) {
        throw new Error(`RunPod API error: ${response.status} ${response.statusText}`);
      }

      const endpoint = await response.json();

      const deploymentTime = Date.now() - startTime;

      return {
        endpointId: endpoint.id,
        endpointUrl: `https://${endpoint.id}-8000.proxy.runpod.net`,
        status: 'creating',
        estimatedCostPerHour: this.calculateCost(template.gpuRequirements),
        deploymentTime
      };

    } catch (error) {
      console.error('RunPod deployment failed:', error);
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * Check deployment status and health
   */
  async checkEndpointHealth(endpointId: string): Promise<{
    status: 'running' | 'creating' | 'failed' | 'stopped';
    workersReady: number;
    workersIdle: number;
    lastActivity: Date;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/endpoints/${endpointId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`RunPod API error: ${response.status} ${response.statusText}`);
      }

      const endpoint = await response.json();

      return {
        status: endpoint.status,
        workersReady: endpoint.workers?.ready || 0,
        workersIdle: endpoint.workers?.idle || 0,
        lastActivity: new Date(endpoint.last_activity || Date.now())
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
   * Stop and remove endpoint to save costs
   */
  async stopEndpoint(endpointId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/endpoints/${endpointId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`RunPod API error: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to stop endpoint:', error);
      return false;
    }
  }

  /**
   * List all active endpoints
   */
  async listActiveEndpoints(): Promise<Array<{
    id: string;
    name: string;
    status: string;
    workers: number;
    cost: number;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/endpoints`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`RunPod API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endpoints = data.endpoints || [];

      return endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        status: endpoint.status,
        workers: (endpoint.workers?.ready || 0) + (endpoint.workers?.busy || 0),
        cost: this.calculateRuntimeCost(endpoint)
      }));
    } catch (error) {
      console.error('Failed to list endpoints:', error);
      return [];
    }
  }

  /**
   * Select appropriate template based on model ID
   */
  private selectTemplate(modelId: string): ModelTemplate {
    // Extract model info from HuggingFace ID
    const modelInfo = this.parseModelId(modelId);

    if (modelInfo.size <= 7) {
      return modelInfo.framework === 'sglang'
        ? RunPodDeploymentService.MODEL_TEMPLATES['sglang-7b']
        : RunPodDeploymentService.MODEL_TEMPLATES['vllm-7b'];
    } else if (modelInfo.size <= 13) {
      return RunPodDeploymentService.MODEL_TEMPLATES['vllm-13b'];
    } else {
      // For larger models, use distributed inference
      return RunPodDeploymentService.MODEL_TEMPLATES['vllm-13b'];
    }
  }

  /**
   * Parse model information from HuggingFace model ID
   */
  private parseModelId(modelId: string): {
    size: number;
    framework: 'vllm' | 'sglang';
    type: string;
  } {
    const lowerModelId = modelId.toLowerCase();

    // Extract size
    let size = 7; // default
    if (lowerModelId.includes('7b')) size = 7;
    else if (lowerModelId.includes('13b')) size = 13;
    else if (lowerModelId.includes('30b')) size = 30;
    else if (lowerModelId.includes('70b')) size = 70;

    // Framework preference (SGLang for structured generation)
    const framework = lowerModelId.includes('code') || lowerModelId.includes('instruct')
      ? 'sglang' : 'vllm';

    return {
      size,
      framework,
      type: 'text-generation'
    };
  }

  /**
   * Select appropriate GPU based on requirements
   */
  private selectGPU(requirements: { memory: number; type: string[] }): string {
    // Simple GPU selection logic - can be enhanced with availability checks
    if (requirements.memory <= 16) {
      return 'NVIDIA RTX A6000'; // 48GB, cost-effective for smaller models
    } else if (requirements.memory <= 32) {
      return 'NVIDIA A40'; // 48GB, good balance
    } else {
      return 'NVIDIA A100'; // 80GB, for largest models
    }
  }

  /**
   * Calculate estimated cost per hour based on GPU requirements
   */
  private calculateCost(requirements: { memory: number; type: string[] }): number {
    // RunPod pricing (approximate, varies by availability)
    const gpuPricing = {
      'NVIDIA RTX A6000': 0.79,
      'NVIDIA A40': 0.89,
      'NVIDIA A100': 2.89
    };

    const selectedGPU = this.selectGPU(requirements);
    return gpuPricing[selectedGPU] || 1.0;
  }

  /**
   * Calculate runtime cost for an endpoint
   */
  private calculateRuntimeCost(endpoint: any): number {
    const hoursRunning = (Date.now() - new Date(endpoint.created_at).getTime()) / (1000 * 60 * 60);
    const costPerHour = this.calculateCost({ memory: 24, type: ['A40'] }); // average
    return hoursRunning * costPerHour * (endpoint.workers?.ready || 1);
  }
}

export default RunPodDeploymentService;