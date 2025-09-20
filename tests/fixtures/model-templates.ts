/**
 * Model Configuration Templates - Standardized model configurations for testing
 * Provides consistent model definitions across different test scenarios
 */

export interface ModelTemplate {
  id: string;
  name: string;
  organization: 'swaggystacks' | 'scientia';
  description: string;
  category: string;
  tags: string[];
  defaultConfig: {
    gpuType: string;
    instanceCount: number;
    envVars: Record<string, string>;
    autoScaling?: {
      enabled: boolean;
      minInstances: number;
      maxInstances: number;
      scaleUpThreshold: number;
      scaleDownThreshold: number;
    };
  };
  performance: {
    expectedLatency: number; // milliseconds
    expectedThroughput: number; // requests per second
    memoryRequirement: number; // GB
    gpuMemoryRequirement: number; // GB
  };
  pricing: {
    tier: 'budget' | 'standard' | 'premium' | 'enterprise';
    costMultiplier: number; // multiplier on base GPU cost
  };
  testingProperties: {
    complexity: 'simple' | 'medium' | 'complex';
    reliability: 'high' | 'medium' | 'low';
    scalability: 'linear' | 'sublinear' | 'superlinear';
    resourceIntensive: boolean;
  };
}

/**
 * SwaggyStacks Gaming Models
 */
export const swaggyStacksModels: ModelTemplate[] = [
  {
    id: 'swaggystacks/terminal-gaming-chat',
    name: 'Terminal Gaming Chat',
    organization: 'swaggystacks',
    description: 'A specialized chatbot for terminal-based gaming communities with retro aesthetics',
    category: 'conversational',
    tags: ['gaming', 'chat', 'terminal', 'retro', 'community'],
    defaultConfig: {
      gpuType: 'NVIDIA_RTX_A6000',
      instanceCount: 1,
      envVars: {
        'MODEL_PRECISION': 'fp16',
        'MAX_BATCH_SIZE': '4',
        'THEME': 'terminal',
        'RESPONSE_STYLE': 'gaming',
        'MAX_TOKENS': '2048'
      }
    },
    performance: {
      expectedLatency: 150,
      expectedThroughput: 8,
      memoryRequirement: 4,
      gpuMemoryRequirement: 12
    },
    pricing: {
      tier: 'standard',
      costMultiplier: 1.0
    },
    testingProperties: {
      complexity: 'simple',
      reliability: 'high',
      scalability: 'linear',
      resourceIntensive: false
    }
  },

  {
    id: 'swaggystacks/rpg-assistant',
    name: 'RPG Game Master Assistant',
    organization: 'swaggystacks',
    description: 'AI assistant for RPG game masters with world-building and story generation capabilities',
    category: 'creative',
    tags: ['rpg', 'storytelling', 'world-building', 'dm-assistant', 'creative'],
    defaultConfig: {
      gpuType: 'NVIDIA_RTX_A6000',
      instanceCount: 2,
      envVars: {
        'MODEL_PRECISION': 'fp16',
        'MAX_BATCH_SIZE': '6',
        'THEME': 'terminal',
        'CREATIVITY_LEVEL': 'high',
        'WORLD_KNOWLEDGE': 'fantasy',
        'MAX_TOKENS': '4096'
      },
      autoScaling: {
        enabled: true,
        minInstances: 1,
        maxInstances: 4,
        scaleUpThreshold: 75,
        scaleDownThreshold: 25
      }
    },
    performance: {
      expectedLatency: 300,
      expectedThroughput: 5,
      memoryRequirement: 8,
      gpuMemoryRequirement: 16
    },
    pricing: {
      tier: 'standard',
      costMultiplier: 1.2
    },
    testingProperties: {
      complexity: 'medium',
      reliability: 'medium',
      scalability: 'sublinear',
      resourceIntensive: true
    }
  },

  {
    id: 'swaggystacks/fps-coach',
    name: 'FPS Performance Coach',
    organization: 'swaggystacks',
    description: 'AI coach for first-person shooter games with aim training and strategy advice',
    category: 'coaching',
    tags: ['fps', 'coaching', 'strategy', 'aim-training', 'competitive'],
    defaultConfig: {
      gpuType: 'NVIDIA_A40',
      instanceCount: 1,
      envVars: {
        'MODEL_PRECISION': 'fp16',
        'MAX_BATCH_SIZE': '2',
        'THEME': 'terminal',
        'GAME_FOCUS': 'fps',
        'ANALYSIS_MODE': 'real_time',
        'MAX_TOKENS': '1024'
      }
    },
    performance: {
      expectedLatency: 100,
      expectedThroughput: 12,
      memoryRequirement: 3,
      gpuMemoryRequirement: 8
    },
    pricing: {
      tier: 'budget',
      costMultiplier: 0.8
    },
    testingProperties: {
      complexity: 'simple',
      reliability: 'high',
      scalability: 'linear',
      resourceIntensive: false
    }
  },

  {
    id: 'swaggystacks/strategy-advisor',
    name: 'Strategy Game Advisor',
    organization: 'swaggystacks',
    description: 'Advanced AI for real-time strategy and turn-based strategy games',
    category: 'strategy',
    tags: ['strategy', 'rts', 'turn-based', 'tactical', 'analysis'],
    defaultConfig: {
      gpuType: 'NVIDIA_RTX_A6000',
      instanceCount: 3,
      envVars: {
        'MODEL_PRECISION': 'fp32',
        'MAX_BATCH_SIZE': '8',
        'THEME': 'terminal',
        'STRATEGY_DEPTH': 'deep',
        'GAME_ANALYSIS': 'comprehensive',
        'MAX_TOKENS': '3072'
      },
      autoScaling: {
        enabled: true,
        minInstances: 2,
        maxInstances: 6,
        scaleUpThreshold: 70,
        scaleDownThreshold: 30
      }
    },
    performance: {
      expectedLatency: 400,
      expectedThroughput: 4,
      memoryRequirement: 12,
      gpuMemoryRequirement: 20
    },
    pricing: {
      tier: 'premium',
      costMultiplier: 1.5
    },
    testingProperties: {
      complexity: 'complex',
      reliability: 'medium',
      scalability: 'sublinear',
      resourceIntensive: true
    }
  },

  {
    id: 'swaggystacks/game-dev-assistant',
    name: 'Game Development Assistant',
    organization: 'swaggystacks',
    description: 'Code generation and development assistance specialized for game development',
    category: 'development',
    tags: ['coding', 'game-dev', 'unity', 'unreal', 'programming'],
    defaultConfig: {
      gpuType: 'NVIDIA_A40',
      instanceCount: 2,
      envVars: {
        'MODEL_PRECISION': 'fp16',
        'MAX_BATCH_SIZE': '4',
        'THEME': 'terminal',
        'SPECIALIZATION': 'game_development',
        'LANGUAGES': 'cpp,csharp,python,javascript',
        'CODE_STYLE': 'gaming',
        'MAX_TOKENS': '8192'
      },
      autoScaling: {
        enabled: true,
        minInstances: 1,
        maxInstances: 4,
        scaleUpThreshold: 80,
        scaleDownThreshold: 20
      }
    },
    performance: {
      expectedLatency: 250,
      expectedThroughput: 6,
      memoryRequirement: 10,
      gpuMemoryRequirement: 16
    },
    pricing: {
      tier: 'standard',
      costMultiplier: 1.1
    },
    testingProperties: {
      complexity: 'medium',
      reliability: 'high',
      scalability: 'linear',
      resourceIntensive: true
    }
  }
];

/**
 * ScientiaCapital Enterprise Finance Models
 */
export const scientiaCapitalModels: ModelTemplate[] = [
  {
    id: 'scientia/financial-analyzer-pro',
    name: 'Financial Analyzer Pro',
    organization: 'scientia',
    description: 'Professional-grade financial analysis with regulatory compliance',
    category: 'financial-analysis',
    tags: ['finance', 'analysis', 'compliance', 'sox', 'professional'],
    defaultConfig: {
      gpuType: 'NVIDIA_A100_SXM4_80GB',
      instanceCount: 2,
      envVars: {
        'MODEL_PRECISION': 'fp32',
        'MAX_BATCH_SIZE': '8',
        'THEME': 'corporate',
        'ANALYSIS_TYPE': 'comprehensive',
        'COMPLIANCE': 'sox_compliant',
        'AUDIT_LOG': 'enabled',
        'MAX_TOKENS': '4096'
      }
    },
    performance: {
      expectedLatency: 200,
      expectedThroughput: 10,
      memoryRequirement: 16,
      gpuMemoryRequirement: 40
    },
    pricing: {
      tier: 'enterprise',
      costMultiplier: 2.0
    },
    testingProperties: {
      complexity: 'simple',
      reliability: 'high',
      scalability: 'linear',
      resourceIntensive: true
    }
  },

  {
    id: 'scientia/risk-analyzer',
    name: 'Enterprise Risk Analyzer',
    organization: 'scientia',
    description: 'Comprehensive risk assessment and stress testing for enterprise portfolios',
    category: 'risk-management',
    tags: ['risk', 'var', 'stress-testing', 'basel-iii', 'enterprise'],
    defaultConfig: {
      gpuType: 'NVIDIA_A100_SXM4_80GB',
      instanceCount: 4,
      envVars: {
        'MODEL_PRECISION': 'fp64',
        'MAX_BATCH_SIZE': '12',
        'THEME': 'corporate',
        'RISK_MODELS': 'var,stress_test,scenario',
        'COMPLIANCE': 'basel_iii',
        'MONTE_CARLO_ITERATIONS': '100000',
        'AUDIT_LOG': 'comprehensive',
        'MAX_TOKENS': '6144'
      },
      autoScaling: {
        enabled: true,
        minInstances: 2,
        maxInstances: 8,
        scaleUpThreshold: 65,
        scaleDownThreshold: 35
      }
    },
    performance: {
      expectedLatency: 500,
      expectedThroughput: 6,
      memoryRequirement: 32,
      gpuMemoryRequirement: 60
    },
    pricing: {
      tier: 'enterprise',
      costMultiplier: 2.5
    },
    testingProperties: {
      complexity: 'medium',
      reliability: 'high',
      scalability: 'sublinear',
      resourceIntensive: true
    }
  },

  {
    id: 'scientia/market-intelligence',
    name: 'Market Intelligence Platform',
    organization: 'scientia',
    description: 'Real-time market analysis and intelligence gathering for C-suite decision making',
    category: 'market-analysis',
    tags: ['market', 'intelligence', 'real-time', 'bloomberg', 'c-suite'],
    defaultConfig: {
      gpuType: 'NVIDIA_A100_SXM4_80GB',
      instanceCount: 6,
      envVars: {
        'MODEL_PRECISION': 'fp32',
        'MAX_BATCH_SIZE': '16',
        'THEME': 'corporate',
        'DATA_SOURCES': 'bloomberg,reuters,internal',
        'UPDATE_FREQUENCY': 'real_time',
        'ANALYSIS_DEPTH': 'comprehensive',
        'EXECUTIVE_SUMMARY': 'enabled',
        'MAX_TOKENS': '8192'
      },
      autoScaling: {
        enabled: true,
        minInstances: 4,
        maxInstances: 12,
        scaleUpThreshold: 60,
        scaleDownThreshold: 40
      }
    },
    performance: {
      expectedLatency: 300,
      expectedThroughput: 8,
      memoryRequirement: 48,
      gpuMemoryRequirement: 72
    },
    pricing: {
      tier: 'enterprise',
      costMultiplier: 3.0
    },
    testingProperties: {
      complexity: 'complex',
      reliability: 'high',
      scalability: 'linear',
      resourceIntensive: true
    }
  },

  {
    id: 'scientia/portfolio-optimizer',
    name: 'Portfolio Optimization Engine',
    organization: 'scientia',
    description: 'Advanced portfolio optimization using modern portfolio theory and machine learning',
    category: 'portfolio-management',
    tags: ['portfolio', 'optimization', 'markowitz', 'black-litterman', 'machine-learning'],
    defaultConfig: {
      gpuType: 'NVIDIA_H100_SXM5_80GB',
      instanceCount: 4,
      envVars: {
        'MODEL_PRECISION': 'fp64',
        'MAX_BATCH_SIZE': '20',
        'THEME': 'corporate',
        'ALGORITHMS': 'markowitz,black_litterman,risk_parity',
        'OPTIMIZATION_METHOD': 'gradient_descent',
        'REBALANCING_FREQUENCY': 'daily',
        'RISK_TOLERANCE': 'adaptive',
        'MAX_TOKENS': '12288'
      },
      autoScaling: {
        enabled: true,
        minInstances: 2,
        maxInstances: 8,
        scaleUpThreshold: 70,
        scaleDownThreshold: 30
      }
    },
    performance: {
      expectedLatency: 800,
      expectedThroughput: 3,
      memoryRequirement: 64,
      gpuMemoryRequirement: 80
    },
    pricing: {
      tier: 'enterprise',
      costMultiplier: 4.0
    },
    testingProperties: {
      complexity: 'complex',
      reliability: 'high',
      scalability: 'sublinear',
      resourceIntensive: true
    }
  },

  {
    id: 'scientia/regulatory-compliance',
    name: 'Regulatory Compliance Monitor',
    organization: 'scientia',
    description: 'Automated compliance monitoring and reporting for financial regulations',
    category: 'compliance',
    tags: ['compliance', 'regulation', 'mifid', 'dodd-frank', 'monitoring'],
    defaultConfig: {
      gpuType: 'NVIDIA_A100_SXM4_80GB',
      instanceCount: 2,
      envVars: {
        'MODEL_PRECISION': 'fp32',
        'MAX_BATCH_SIZE': '6',
        'THEME': 'corporate',
        'REGULATIONS': 'mifid,dodd_frank,basel_iii',
        'MONITORING_MODE': 'continuous',
        'ALERT_THRESHOLD': 'strict',
        'AUDIT_LEVEL': 'comprehensive',
        'REPORTING': 'automated',
        'MAX_TOKENS': '4096'
      }
    },
    performance: {
      expectedLatency: 150,
      expectedThroughput: 12,
      memoryRequirement: 20,
      gpuMemoryRequirement: 32
    },
    pricing: {
      tier: 'enterprise',
      costMultiplier: 2.2
    },
    testingProperties: {
      complexity: 'medium',
      reliability: 'high',
      scalability: 'linear',
      resourceIntensive: false
    }
  },

  {
    id: 'scientia/realtime-trader',
    name: 'Real-time Trading Engine',
    organization: 'scientia',
    description: 'Ultra-low latency trading system with real-time market analysis',
    category: 'trading',
    tags: ['trading', 'real-time', 'low-latency', 'hft', 'algorithmic'],
    defaultConfig: {
      gpuType: 'NVIDIA_H100_SXM5_80GB',
      instanceCount: 8,
      envVars: {
        'MODEL_PRECISION': 'fp32',
        'MAX_BATCH_SIZE': '32',
        'THEME': 'corporate',
        'LATENCY_MODE': 'ultra_low',
        'TRADING_HOURS': '24_7',
        'RISK_LIMITS': 'dynamic',
        'EXECUTION_SPEED': 'microsecond',
        'MARKET_DATA': 'level_2',
        'MAX_TOKENS': '2048'
      },
      autoScaling: {
        enabled: true,
        minInstances: 4,
        maxInstances: 16,
        scaleUpThreshold: 50,
        scaleDownThreshold: 25
      }
    },
    performance: {
      expectedLatency: 50,
      expectedThroughput: 1000,
      memoryRequirement: 128,
      gpuMemoryRequirement: 80
    },
    pricing: {
      tier: 'enterprise',
      costMultiplier: 5.0
    },
    testingProperties: {
      complexity: 'complex',
      reliability: 'medium',
      scalability: 'superlinear',
      resourceIntensive: true
    }
  }
];

/**
 * Combined model catalog
 */
export const allModels = [...swaggyStacksModels, ...scientiaCapitalModels];

/**
 * Helper functions for model selection
 */
export function getModelsByOrganization(organization: 'swaggystacks' | 'scientia'): ModelTemplate[] {
  return allModels.filter(model => model.organization === organization);
}

export function getModelsByCategory(category: string): ModelTemplate[] {
  return allModels.filter(model => model.category === category);
}

export function getModelsByComplexity(complexity: 'simple' | 'medium' | 'complex'): ModelTemplate[] {
  return allModels.filter(model => model.testingProperties.complexity === complexity);
}

export function getModelsByPricingTier(tier: 'budget' | 'standard' | 'premium' | 'enterprise'): ModelTemplate[] {
  return allModels.filter(model => model.pricing.tier === tier);
}

export function getModelsByTag(tag: string): ModelTemplate[] {
  return allModels.filter(model => model.tags.includes(tag));
}

export function getRandomModel(filters?: {
  organization?: 'swaggystacks' | 'scientia';
  complexity?: 'simple' | 'medium' | 'complex';
  tier?: 'budget' | 'standard' | 'premium' | 'enterprise';
}): ModelTemplate {
  let filteredModels = allModels;

  if (filters?.organization) {
    filteredModels = filteredModels.filter(m => m.organization === filters.organization);
  }
  if (filters?.complexity) {
    filteredModels = filteredModels.filter(m => m.testingProperties.complexity === filters.complexity);
  }
  if (filters?.tier) {
    filteredModels = filteredModels.filter(m => m.pricing.tier === filters.tier);
  }

  if (filteredModels.length === 0) {
    throw new Error('No models match the specified filters');
  }

  return filteredModels[Math.floor(Math.random() * filteredModels.length)];
}

/**
 * Get estimated deployment cost for a model configuration
 */
export function getEstimatedCost(modelId: string, instanceCount: number, gpuType: string): number {
  const model = allModels.find(m => m.id === modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }

  const baseRates: Record<string, number> = {
    'NVIDIA_RTX_A6000': 0.89,
    'NVIDIA_A100_SXM4_80GB': 2.49,
    'NVIDIA_A40': 0.79,
    'NVIDIA_H100_SXM5_80GB': 4.99
  };

  const baseRate = baseRates[gpuType] || 1.0;
  return baseRate * instanceCount * model.pricing.costMultiplier;
}

/**
 * Validate if a model supports specific features
 */
export function validateModelCapabilities(modelId: string, requirements: {
  autoScaling?: boolean;
  highThroughput?: boolean;
  lowLatency?: boolean;
  compliance?: boolean;
}): { supported: boolean; issues: string[] } {
  const model = allModels.find(m => m.id === modelId);
  if (!model) {
    return { supported: false, issues: ['Model not found'] };
  }

  const issues: string[] = [];

  if (requirements.autoScaling && !model.defaultConfig.autoScaling) {
    issues.push('Auto-scaling not supported by this model');
  }

  if (requirements.highThroughput && model.performance.expectedThroughput < 10) {
    issues.push('Model may not meet high throughput requirements');
  }

  if (requirements.lowLatency && model.performance.expectedLatency > 200) {
    issues.push('Model may not meet low latency requirements');
  }

  if (requirements.compliance && !model.tags.includes('compliance') && model.organization !== 'scientia') {
    issues.push('Model may not meet compliance requirements');
  }

  return { supported: issues.length === 0, issues };
}