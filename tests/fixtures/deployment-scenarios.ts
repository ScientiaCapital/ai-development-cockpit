/**
 * Deployment Scenarios - Predefined configurations for testing different deployment patterns
 * Supports small scale, medium enterprise, and large scale deployment testing
 */

import { DeploymentConfig } from './MockRunPodEnvironment';

export interface DeploymentScenario {
  name: string;
  description: string;
  organization: 'arcade' | 'enterprise';
  configs: DeploymentConfig[];
  expectedBehavior: {
    deploymentTime: { min: number; max: number }; // seconds
    successRate: number; // 0-1
    costRange: { min: number; max: number }; // dollars per hour
    resourceUtilization: {
      cpu: { min: number; max: number }; // percentage
      gpu: { min: number; max: number }; // percentage
      memory: { min: number; max: number }; // percentage
    };
  };
  testPurpose: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * AI Dev Cockpit Gaming-focused deployment scenarios
 */
export const arcadeScenarios: DeploymentScenario[] = [
  {
    name: 'Gaming Chatbot - Single Instance',
    description: 'Basic gaming chatbot deployment for terminal enthusiasts',
    organization: 'arcade',
    configs: [
      {
        modelId: 'arcade/terminal-gaming-chat',
        gpuType: 'NVIDIA_RTX_A6000',
        instanceCount: 1,
        organization: 'arcade',
        envVars: {
          'MODEL_PRECISION': 'fp16',
          'MAX_BATCH_SIZE': '4',
          'THEME': 'terminal'
        }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 5, max: 15 },
      successRate: 0.95,
      costRange: { min: 0.89, max: 0.89 },
      resourceUtilization: {
        cpu: { min: 30, max: 60 },
        gpu: { min: 60, max: 85 },
        memory: { min: 40, max: 70 }
      }
    },
    testPurpose: ['basic functionality', 'single user load', 'terminal theme consistency'],
    complexity: 'simple'
  },

  {
    name: 'Gaming Chatbot - Auto-scaling',
    description: 'Gaming chatbot with auto-scaling for peak hours',
    organization: 'arcade',
    configs: [
      {
        modelId: 'arcade/terminal-gaming-chat',
        gpuType: 'NVIDIA_RTX_A6000',
        instanceCount: 2,
        autoScaling: true,
        minInstances: 1,
        maxInstances: 5,
        organization: 'arcade',
        envVars: {
          'MODEL_PRECISION': 'fp16',
          'MAX_BATCH_SIZE': '8',
          'AUTO_SCALE_THRESHOLD': '70',
          'THEME': 'terminal'
        }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 8, max: 20 },
      successRate: 0.92,
      costRange: { min: 1.78, max: 4.45 },
      resourceUtilization: {
        cpu: { min: 25, max: 75 },
        gpu: { min: 50, max: 90 },
        memory: { min: 35, max: 80 }
      }
    },
    testPurpose: ['auto-scaling behavior', 'load balancing', 'cost optimization'],
    complexity: 'medium'
  },

  {
    name: 'Multi-Model Gaming Suite',
    description: 'Multiple gaming models for different game types',
    organization: 'arcade',
    configs: [
      {
        modelId: 'arcade/rpg-assistant',
        gpuType: 'NVIDIA_RTX_A6000',
        instanceCount: 2,
        organization: 'arcade',
        envVars: { 'GAME_TYPE': 'rpg', 'THEME': 'terminal' }
      },
      {
        modelId: 'arcade/fps-coach',
        gpuType: 'NVIDIA_A40',
        instanceCount: 1,
        organization: 'arcade',
        envVars: { 'GAME_TYPE': 'fps', 'THEME': 'terminal' }
      },
      {
        modelId: 'arcade/strategy-advisor',
        gpuType: 'NVIDIA_RTX_A6000',
        instanceCount: 3,
        autoScaling: true,
        maxInstances: 6,
        organization: 'arcade',
        envVars: { 'GAME_TYPE': 'strategy', 'THEME': 'terminal' }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 15, max: 35 },
      successRate: 0.88,
      costRange: { min: 4.46, max: 8.92 },
      resourceUtilization: {
        cpu: { min: 40, max: 85 },
        gpu: { min: 65, max: 95 },
        memory: { min: 50, max: 90 }
      }
    },
    testPurpose: ['multi-model coordination', 'resource sharing', 'theme consistency across models'],
    complexity: 'complex'
  },

  {
    name: 'Code Assistant for Gamers',
    description: 'Development assistant specialized for game development',
    organization: 'arcade',
    configs: [
      {
        modelId: 'arcade/game-dev-assistant',
        gpuType: 'NVIDIA_A40',
        instanceCount: 2,
        autoScaling: true,
        maxInstances: 4,
        organization: 'arcade',
        envVars: {
          'SPECIALIZATION': 'game_development',
          'LANGUAGES': 'cpp,csharp,python',
          'THEME': 'terminal',
          'CODE_STYLE': 'gaming'
        }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 10, max: 25 },
      successRate: 0.93,
      costRange: { min: 1.58, max: 3.16 },
      resourceUtilization: {
        cpu: { min: 35, max: 70 },
        gpu: { min: 70, max: 88 },
        memory: { min: 45, max: 75 }
      }
    },
    testPurpose: ['code generation performance', 'developer workflow', 'technical accuracy'],
    complexity: 'medium'
  }
];

/**
 * Enterprise Enterprise-focused deployment scenarios
 */
export const enterpriseScenarios: DeploymentScenario[] = [
  {
    name: 'Financial Analysis - Single Model',
    description: 'Basic financial analysis model for market research',
    organization: 'enterprise',
    configs: [
      {
        modelId: 'enterprise/financial-analyzer-pro',
        gpuType: 'NVIDIA_A100_SXM4_80GB',
        instanceCount: 2,
        organization: 'enterprise',
        envVars: {
          'ANALYSIS_TYPE': 'market_research',
          'PRECISION': 'high',
          'COMPLIANCE': 'sox_compliant',
          'THEME': 'corporate'
        }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 12, max: 30 },
      successRate: 0.97,
      costRange: { min: 4.98, max: 4.98 },
      resourceUtilization: {
        cpu: { min: 40, max: 75 },
        gpu: { min: 70, max: 90 },
        memory: { min: 55, max: 85 }
      }
    },
    testPurpose: ['enterprise compliance', 'financial accuracy', 'corporate theme'],
    complexity: 'simple'
  },

  {
    name: 'Risk Assessment Suite',
    description: 'Comprehensive risk assessment for enterprise clients',
    organization: 'enterprise',
    configs: [
      {
        modelId: 'enterprise/risk-analyzer',
        gpuType: 'NVIDIA_A100_SXM4_80GB',
        instanceCount: 4,
        autoScaling: true,
        minInstances: 2,
        maxInstances: 8,
        organization: 'enterprise',
        envVars: {
          'RISK_MODELS': 'var,stress_test,scenario',
          'COMPLIANCE': 'basel_iii',
          'AUDIT_LOG': 'enabled',
          'THEME': 'corporate'
        }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 20, max: 45 },
      successRate: 0.95,
      costRange: { min: 9.96, max: 19.92 },
      resourceUtilization: {
        cpu: { min: 50, max: 85 },
        gpu: { min: 75, max: 95 },
        memory: { min: 60, max: 90 }
      }
    },
    testPurpose: ['compliance validation', 'audit trail', 'high availability'],
    complexity: 'medium'
  },

  {
    name: 'Enterprise AI Analytics Platform',
    description: 'Full-scale AI analytics platform for C-suite insights',
    organization: 'enterprise',
    configs: [
      {
        modelId: 'enterprise/market-intelligence',
        gpuType: 'NVIDIA_A100_SXM4_80GB',
        instanceCount: 6,
        autoScaling: true,
        maxInstances: 12,
        organization: 'enterprise',
        envVars: {
          'MODULE': 'market_intelligence',
          'DATA_SOURCES': 'bloomberg,reuters,internal',
          'THEME': 'corporate'
        }
      },
      {
        modelId: 'enterprise/portfolio-optimizer',
        gpuType: 'NVIDIA_H100_SXM5_80GB',
        instanceCount: 4,
        autoScaling: true,
        maxInstances: 8,
        organization: 'enterprise',
        envVars: {
          'MODULE': 'portfolio_optimization',
          'ALGORITHMS': 'markowitz,black_litterman,risk_parity',
          'THEME': 'corporate'
        }
      },
      {
        modelId: 'enterprise/regulatory-compliance',
        gpuType: 'NVIDIA_A100_SXM4_80GB',
        instanceCount: 2,
        organization: 'enterprise',
        envVars: {
          'MODULE': 'compliance',
          'REGULATIONS': 'mifid,dodd_frank,basel_iii',
          'AUDIT_LEVEL': 'comprehensive',
          'THEME': 'corporate'
        }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 30, max: 60 },
      successRate: 0.92,
      costRange: { min: 34.90, max: 69.80 },
      resourceUtilization: {
        cpu: { min: 60, max: 90 },
        gpu: { min: 80, max: 98 },
        memory: { min: 70, max: 95 }
      }
    },
    testPurpose: ['enterprise scale', 'multi-model coordination', 'regulatory compliance', 'executive dashboards'],
    complexity: 'complex'
  },

  {
    name: 'Real-time Trading Analytics',
    description: 'High-frequency trading support with real-time analytics',
    organization: 'enterprise',
    configs: [
      {
        modelId: 'enterprise/realtime-trader',
        gpuType: 'NVIDIA_H100_SXM5_80GB',
        instanceCount: 8,
        autoScaling: true,
        minInstances: 4,
        maxInstances: 16,
        organization: 'enterprise',
        envVars: {
          'LATENCY_MODE': 'ultra_low',
          'TRADING_HOURS': '24_7',
          'RISK_LIMITS': 'dynamic',
          'COMPLIANCE': 'real_time',
          'THEME': 'corporate'
        }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 25, max: 50 },
      successRate: 0.94,
      costRange: { min: 39.92, max: 79.84 },
      resourceUtilization: {
        cpu: { min: 70, max: 95 },
        gpu: { min: 85, max: 98 },
        memory: { min: 75, max: 95 }
      }
    },
    testPurpose: ['ultra-low latency', 'real-time processing', 'high throughput', 'regulatory compliance'],
    complexity: 'complex'
  }
];

/**
 * Cross-organizational scenarios for testing organization switching and resource isolation
 */
export const crossOrganizationalScenarios: DeploymentScenario[] = [
  {
    name: 'Mixed Workload - Gaming + Finance',
    description: 'Simultaneous deployments across both organizations',
    organization: 'arcade', // Primary, but includes both
    configs: [
      {
        modelId: 'arcade/terminal-chat',
        gpuType: 'NVIDIA_RTX_A6000',
        instanceCount: 2,
        organization: 'arcade',
        envVars: { 'THEME': 'terminal' }
      },
      {
        modelId: 'scientia/quick-analysis',
        gpuType: 'NVIDIA_A100_SXM4_80GB',
        instanceCount: 1,
        organization: 'enterprise',
        envVars: { 'THEME': 'corporate' }
      }
    ],
    expectedBehavior: {
      deploymentTime: { min: 10, max: 30 },
      successRate: 0.91,
      costRange: { min: 4.27, max: 4.27 },
      resourceUtilization: {
        cpu: { min: 35, max: 80 },
        gpu: { min: 65, max: 92 },
        memory: { min: 50, max: 85 }
      }
    },
    testPurpose: ['resource isolation', 'theme consistency', 'organization switching'],
    complexity: 'medium'
  }
];

/**
 * Test data configurations for different testing phases
 */
export const testConfigurations = {
  development: {
    maxConcurrentDeployments: 3,
    timeoutMultiplier: 2.0,
    scenarios: [...arcadeScenarios.slice(0, 2), ...enterpriseScenarios.slice(0, 2)]
  },

  staging: {
    maxConcurrentDeployments: 8,
    timeoutMultiplier: 1.5,
    scenarios: [...arcadeScenarios, ...enterpriseScenarios.slice(0, 3)]
  },

  production: {
    maxConcurrentDeployments: 20,
    timeoutMultiplier: 1.0,
    scenarios: [...arcadeScenarios, ...enterpriseScenarios, ...crossOrganizationalScenarios]
  },

  performance: {
    maxConcurrentDeployments: 50,
    timeoutMultiplier: 0.8,
    scenarios: [
      arcadeScenarios[2], // Multi-model gaming
      enterpriseScenarios[2], // Enterprise platform
      enterpriseScenarios[3], // Real-time trading
      crossOrganizationalScenarios[0] // Mixed workload
    ]
  }
};

/**
 * Helper function to get scenarios by complexity
 */
export function getScenariosByComplexity(complexity: 'simple' | 'medium' | 'complex'): DeploymentScenario[] {
  const allScenarios = [...arcadeScenarios, ...enterpriseScenarios, ...crossOrganizationalScenarios];
  return allScenarios.filter(scenario => scenario.complexity === complexity);
}

/**
 * Helper function to get scenarios by organization
 */
export function getScenariosByOrganization(organization: 'arcade' | 'enterprise'): DeploymentScenario[] {
  const allScenarios = [...arcadeScenarios, ...enterpriseScenarios];
  return allScenarios.filter(scenario => scenario.organization === organization);
}

/**
 * Helper function to get scenarios by test purpose
 */
export function getScenariosByPurpose(purpose: string): DeploymentScenario[] {
  const allScenarios = [...arcadeScenarios, ...enterpriseScenarios, ...crossOrganizationalScenarios];
  return allScenarios.filter(scenario => scenario.testPurpose.some(p => p.includes(purpose)));
}

/**
 * Get a random scenario for chaos testing
 */
export function getRandomScenario(): DeploymentScenario {
  const allScenarios = [...arcadeScenarios, ...enterpriseScenarios, ...crossOrganizationalScenarios];
  return allScenarios[Math.floor(Math.random() * allScenarios.length)];
}