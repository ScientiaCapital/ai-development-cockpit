/**
 * vLLM/SGLang Docker Templates and Configurations
 * Pre-configured templates for different model types and optimizations
 */

export interface DockerTemplate {
  id: string;
  name: string;
  description: string;
  containerImage: string;
  framework: 'vllm' | 'sglang' | 'transformers';
  ports: number[];
  envVars: Record<string, string>;
  startupScript: string;
  healthCheck: {
    path: string;
    interval: number;
    retries: number;
  };
  gpuRequirements: {
    minMemory: number; // GB
    recommendedMemory: number; // GB
    supportedTypes: string[];
  };
  optimization: {
    tensorParallelism: number;
    dataParallelism: number;
    memoryUtilization: number;
    quantization?: string;
  };
}

export const DOCKER_TEMPLATES: Record<string, DockerTemplate> = {
  'vllm-7b': {
    id: 'vllm-7b',
    name: 'vLLM 7B Models',
    description: 'Optimized vLLM container for 7B parameter models',
    containerImage: 'vllm/vllm-openai:latest',
    framework: 'vllm',
    ports: [8000],
    envVars: {
      'MODEL': '',
      'TENSOR_PARALLEL_SIZE': '1',
      'GPU_MEMORY_UTILIZATION': '0.9',
      'MAX_MODEL_LEN': '4096',
      'DTYPE': 'auto',
      'QUANTIZATION': 'None',
      'MAX_PARALLEL_REQUESTS': '128',
      'DISABLE_LOG_STATS': 'false'
    },
    startupScript: `#!/bin/bash
set -e

echo "Starting vLLM server for model: $MODEL"

# Verify GPU availability
nvidia-smi

# Start vLLM server
python -m vllm.entrypoints.openai.api_server \\
  --model $MODEL \\
  --tensor-parallel-size $TENSOR_PARALLEL_SIZE \\
  --gpu-memory-utilization $GPU_MEMORY_UTILIZATION \\
  --max-model-len $MAX_MODEL_LEN \\
  --dtype $DTYPE \\
  --max-parallel-loading-workers 2 \\
  --disable-log-stats $DISABLE_LOG_STATS \\
  --host 0.0.0.0 \\
  --port 8000
`,
    healthCheck: {
      path: '/v1/models',
      interval: 30,
      retries: 3
    },
    gpuRequirements: {
      minMemory: 16,
      recommendedMemory: 24,
      supportedTypes: ['RTX A6000', 'RTX 4090', 'A40', 'A100']
    },
    optimization: {
      tensorParallelism: 1,
      dataParallelism: 1,
      memoryUtilization: 0.9
    }
  },

  'vllm-13b': {
    id: 'vllm-13b',
    name: 'vLLM 13B Models',
    description: 'Optimized vLLM container for 13B parameter models',
    containerImage: 'vllm/vllm-openai:latest',
    framework: 'vllm',
    ports: [8000],
    envVars: {
      'MODEL': '',
      'TENSOR_PARALLEL_SIZE': '2',
      'GPU_MEMORY_UTILIZATION': '0.9',
      'MAX_MODEL_LEN': '4096',
      'DTYPE': 'auto',
      'QUANTIZATION': 'None',
      'MAX_PARALLEL_REQUESTS': '64',
      'DISABLE_LOG_STATS': 'false'
    },
    startupScript: `#!/bin/bash
set -e

echo "Starting vLLM server for model: $MODEL"

# Verify GPU availability
nvidia-smi

# Start vLLM server with tensor parallelism
python -m vllm.entrypoints.openai.api_server \\
  --model $MODEL \\
  --tensor-parallel-size $TENSOR_PARALLEL_SIZE \\
  --gpu-memory-utilization $GPU_MEMORY_UTILIZATION \\
  --max-model-len $MAX_MODEL_LEN \\
  --dtype $DTYPE \\
  --max-parallel-loading-workers 4 \\
  --disable-log-stats $DISABLE_LOG_STATS \\
  --host 0.0.0.0 \\
  --port 8000
`,
    healthCheck: {
      path: '/v1/models',
      interval: 30,
      retries: 3
    },
    gpuRequirements: {
      minMemory: 32,
      recommendedMemory: 48,
      supportedTypes: ['A40', 'A100']
    },
    optimization: {
      tensorParallelism: 2,
      dataParallelism: 1,
      memoryUtilization: 0.9
    }
  },

  'sglang-7b': {
    id: 'sglang-7b',
    name: 'SGLang 7B Models',
    description: 'SGLang container optimized for structured generation',
    containerImage: 'lmsysorg/sglang:latest',
    framework: 'sglang',
    ports: [30000],
    envVars: {
      'MODEL_PATH': '',
      'TP_SIZE': '1',
      'MEM_FRACTION_STATIC': '0.9',
      'MAX_RUNNING_REQUESTS': '128',
      'CONTEXT_LENGTH': '4096',
      'TRUST_REMOTE_CODE': 'true'
    },
    startupScript: `#!/bin/bash
set -e

echo "Starting SGLang server for model: $MODEL_PATH"

# Verify GPU availability
nvidia-smi

# Start SGLang server
python -m sglang.launch_server \\
  --model-path $MODEL_PATH \\
  --tp-size $TP_SIZE \\
  --mem-fraction-static $MEM_FRACTION_STATIC \\
  --max-running-requests $MAX_RUNNING_REQUESTS \\
  --context-length $CONTEXT_LENGTH \\
  --trust-remote-code \\
  --host 0.0.0.0 \\
  --port 30000
`,
    healthCheck: {
      path: '/health',
      interval: 30,
      retries: 3
    },
    gpuRequirements: {
      minMemory: 16,
      recommendedMemory: 24,
      supportedTypes: ['RTX A6000', 'RTX 4090', 'A40', 'A100']
    },
    optimization: {
      tensorParallelism: 1,
      dataParallelism: 1,
      memoryUtilization: 0.9
    }
  },

  'vllm-70b': {
    id: 'vllm-70b',
    name: 'vLLM 70B Models',
    description: 'Multi-GPU vLLM setup for 70B parameter models',
    containerImage: 'vllm/vllm-openai:latest',
    framework: 'vllm',
    ports: [8000],
    envVars: {
      'MODEL': '',
      'TENSOR_PARALLEL_SIZE': '4',
      'GPU_MEMORY_UTILIZATION': '0.95',
      'MAX_MODEL_LEN': '4096',
      'DTYPE': 'auto',
      'QUANTIZATION': 'None',
      'MAX_PARALLEL_REQUESTS': '32',
      'DISABLE_LOG_STATS': 'false'
    },
    startupScript: `#!/bin/bash
set -e

echo "Starting vLLM server for large model: $MODEL"

# Verify GPU availability (expect 4+ GPUs)
nvidia-smi

# Start vLLM server with tensor parallelism
python -m vllm.entrypoints.openai.api_server \\
  --model $MODEL \\
  --tensor-parallel-size $TENSOR_PARALLEL_SIZE \\
  --gpu-memory-utilization $GPU_MEMORY_UTILIZATION \\
  --max-model-len $MAX_MODEL_LEN \\
  --dtype $DTYPE \\
  --max-parallel-loading-workers 8 \\
  --disable-log-stats $DISABLE_LOG_STATS \\
  --host 0.0.0.0 \\
  --port 8000
`,
    healthCheck: {
      path: '/v1/models',
      interval: 60,
      retries: 5
    },
    gpuRequirements: {
      minMemory: 160, // 4x A100
      recommendedMemory: 320, // 4x A100 80GB
      supportedTypes: ['A100']
    },
    optimization: {
      tensorParallelism: 4,
      dataParallelism: 1,
      memoryUtilization: 0.95
    }
  },

  'vllm-quantized-4bit': {
    id: 'vllm-quantized-4bit',
    name: 'vLLM 4-bit Quantized',
    description: 'Memory-efficient 4-bit quantized models',
    containerImage: 'vllm/vllm-openai:latest',
    framework: 'vllm',
    ports: [8000],
    envVars: {
      'MODEL': '',
      'TENSOR_PARALLEL_SIZE': '1',
      'GPU_MEMORY_UTILIZATION': '0.9',
      'MAX_MODEL_LEN': '4096',
      'DTYPE': 'auto',
      'QUANTIZATION': 'awq',
      'MAX_PARALLEL_REQUESTS': '256',
      'DISABLE_LOG_STATS': 'false'
    },
    startupScript: `#!/bin/bash
set -e

echo "Starting vLLM server with 4-bit quantization: $MODEL"

# Verify GPU availability
nvidia-smi

# Start vLLM server with quantization
python -m vllm.entrypoints.openai.api_server \\
  --model $MODEL \\
  --tensor-parallel-size $TENSOR_PARALLEL_SIZE \\
  --gpu-memory-utilization $GPU_MEMORY_UTILIZATION \\
  --max-model-len $MAX_MODEL_LEN \\
  --dtype $DTYPE \\
  --quantization $QUANTIZATION \\
  --max-parallel-loading-workers 2 \\
  --disable-log-stats $DISABLE_LOG_STATS \\
  --host 0.0.0.0 \\
  --port 8000
`,
    healthCheck: {
      path: '/v1/models',
      interval: 30,
      retries: 3
    },
    gpuRequirements: {
      minMemory: 8,
      recommendedMemory: 16,
      supportedTypes: ['RTX 4090', 'RTX A6000', 'A40', 'A100']
    },
    optimization: {
      tensorParallelism: 1,
      dataParallelism: 1,
      memoryUtilization: 0.9,
      quantization: 'awq'
    }
  }
};

export interface DeploymentConfig {
  templateId: string;
  modelId: string;
  customConfig?: Partial<DockerTemplate>;
  scaling?: {
    minReplicas: number;
    maxReplicas: number;
    autoScale: boolean;
  };
}

/**
 * Generate RunPod deployment configuration from template
 */
export function generateRunPodConfig(config: DeploymentConfig) {
  const template = DOCKER_TEMPLATES[config.templateId];
  if (!template) {
    throw new Error(`Template not found: ${config.templateId}`);
  }

  // Merge custom config
  const finalTemplate = {
    ...template,
    ...config.customConfig
  };

  // Set model-specific environment variables
  const envVars = {
    ...finalTemplate.envVars,
    [template.framework === 'sglang' ? 'MODEL_PATH' : 'MODEL']: config.modelId
  };

  return {
    name: `${config.modelId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`,
    image: finalTemplate.containerImage,
    ports: finalTemplate.ports,
    env: envVars,
    startupScript: finalTemplate.startupScript,
    healthCheck: finalTemplate.healthCheck,
    resources: {
      gpu: {
        type: finalTemplate.gpuRequirements.supportedTypes[0],
        memory: finalTemplate.gpuRequirements.recommendedMemory,
        count: finalTemplate.optimization.tensorParallelism
      }
    },
    scaling: config.scaling || {
      minReplicas: 0,
      maxReplicas: 3,
      autoScale: true
    }
  };
}

/**
 * Select optimal template based on model characteristics
 */
export function selectOptimalTemplate(
  modelId: string,
  modelSize: number,
  task: string = 'text-generation'
): string {
  // For structured generation tasks, prefer SGLang
  if (task.includes('code') || task.includes('instruct') || modelId.includes('code')) {
    if (modelSize <= 7) return 'sglang-7b';
  }

  // For regular text generation, use vLLM
  if (modelSize <= 3) return 'vllm-quantized-4bit';
  if (modelSize <= 7) return 'vllm-7b';
  if (modelSize <= 13) return 'vllm-13b';
  if (modelSize <= 70) return 'vllm-70b';

  // Default to 7B template
  return 'vllm-7b';
}

/**
 * Estimate deployment cost based on template
 */
export function estimateDeploymentCost(templateId: string): {
  hourly: number;
  monthly: number;
  gpuHours: number;
} {
  const template = DOCKER_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // RunPod pricing estimates (varies by availability)
  const gpuPricing = {
    'RTX 4090': 0.79,
    'RTX A6000': 0.79,
    'A40': 0.89,
    'A100': 2.89
  };

  const gpuType = template.gpuRequirements.supportedTypes[0];
  const gpuCount = template.optimization.tensorParallelism;
  const hourlyRate = (gpuPricing[gpuType] || 1.0) * gpuCount;

  return {
    hourly: hourlyRate,
    monthly: hourlyRate * 24 * 30,
    gpuHours: gpuCount
  };
}

export default {
  DOCKER_TEMPLATES,
  generateRunPodConfig,
  selectOptimalTemplate,
  estimateDeploymentCost
};