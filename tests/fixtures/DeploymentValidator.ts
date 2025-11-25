/**
 * Deployment Validator - Strategy pattern for different validation approaches
 * Provides comprehensive validation for deployment scenarios across organizations
 */

import { DeploymentConfig } from './MockRunPodEnvironment';
import { ModelTemplate } from './model-templates';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 validation score
  details: {
    configurationValid: boolean;
    resourcesAvailable: boolean;
    organizationCompliant: boolean;
    performanceExpected: boolean;
    securityCompliant: boolean;
    costOptimized: boolean;
  };
  metadata?: {
    estimatedDeploymentTime: number; // seconds
    estimatedCost: number; // dollars per hour
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
}

export interface ValidationContext {
  targetEnvironment: 'development' | 'staging' | 'production';
  organizationPolicies: OrganizationPolicy;
  resourceConstraints: ResourceConstraints;
  complianceRequirements: ComplianceRequirement[];
}

export interface OrganizationPolicy {
  allowedGpuTypes: string[];
  maxInstanceCount: number;
  maxCostPerHour: number;
  requiresApproval: boolean;
  securityLevel: 'standard' | 'enhanced' | 'enterprise';
  dataRetention: number; // days
}

export interface ResourceConstraints {
  availableGpus: Record<string, number>; // gpuType -> available count
  networkBandwidth: number; // Mbps
  storageQuota: number; // GB
  computeQuota: number; // hours per month
}

export interface ComplianceRequirement {
  type: 'sox' | 'gdpr' | 'hipaa' | 'iso27001' | 'gaming_certification';
  level: 'basic' | 'standard' | 'strict';
  validationRules: string[];
}

/**
 * Abstract base class for deployment validation strategies
 */
export abstract class DeploymentValidationStrategy {
  abstract validate(config: DeploymentConfig, context: ValidationContext): Promise<ValidationResult>;

  protected calculateValidationScore(details: ValidationResult['details']): number {
    const weights = {
      configurationValid: 20,
      resourcesAvailable: 20,
      organizationCompliant: 15,
      performanceExpected: 15,
      securityCompliant: 15,
      costOptimized: 15
    };

    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      if (details[key as keyof typeof details]) {
        score += weight;
      }
    });

    return score;
  }

  protected validateBasicConfiguration(config: DeploymentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.modelId) {
      errors.push('Model ID is required');
    }

    if (!config.gpuType) {
      errors.push('GPU type is required');
    }

    if (!config.instanceCount || config.instanceCount < 1) {
      errors.push('Instance count must be at least 1');
    }

    if (config.autoScaling) {
      if (!config.minInstances || config.minInstances < 1) {
        errors.push('Minimum instances required for auto-scaling');
      }
      if (!config.maxInstances || config.maxInstances < config.minInstances!) {
        errors.push('Maximum instances must be greater than minimum instances');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  protected estimateDeploymentCost(config: DeploymentConfig): number {
    // GPU pricing per hour (mock pricing for testing)
    const gpuPricing: Record<string, number> = {
      'NVIDIA_RTX_A6000': 0.89,
      'NVIDIA_A40': 1.58,
      'NVIDIA_A100_SXM4_80GB': 2.49,
      'NVIDIA_H100_SXM5_80GB': 4.99
    };

    const baseCost = gpuPricing[config.gpuType] || 1.0;
    let instanceCount = config.instanceCount;

    if (config.autoScaling) {
      // Use average of min and max for cost estimation
      instanceCount = Math.round((config.minInstances! + config.maxInstances!) / 2);
    }

    return baseCost * instanceCount;
  }
}

/**
 * Gaming-focused validation strategy for AI Dev Cockpit
 */
export class GamingValidationStrategy extends DeploymentValidationStrategy {
  async validate(config: DeploymentConfig, context: ValidationContext): Promise<ValidationResult> {
    const basicValidation = this.validateBasicConfiguration(config);
    const errors = [...basicValidation.errors];
    const warnings: string[] = [];

    // Gaming-specific validations
    const details = {
      configurationValid: basicValidation.valid,
      resourcesAvailable: this.validateGamingResources(config, context),
      organizationCompliant: this.validateGamingCompliance(config, context),
      performanceExpected: this.validateGamingPerformance(config),
      securityCompliant: this.validateGamingSecurity(config, context),
      costOptimized: this.validateGamingCosts(config, context)
    };

    // Add gaming-specific warnings
    if (config.envVars?.THEME !== 'terminal') {
      warnings.push('Consider using terminal theme for gaming models');
    }

    if (!config.envVars?.MODEL_PRECISION) {
      warnings.push('MODEL_PRECISION not specified, consider fp16 for gaming models');
    }

    // Performance recommendations
    const recommendations: string[] = [];
    if (config.instanceCount === 1 && !config.autoScaling) {
      recommendations.push('Consider auto-scaling for better availability during peak gaming hours');
    }

    if (config.gpuType === 'NVIDIA_RTX_A6000' && config.instanceCount > 3) {
      recommendations.push('Consider upgrading to NVIDIA_A40 for better cost efficiency at scale');
    }

    const score = this.calculateValidationScore(details);
    const estimatedCost = this.estimateDeploymentCost(config);

    return {
      isValid: score >= 70, // Gaming deployments need 70%+ score
      errors,
      warnings,
      score,
      details,
      metadata: {
        estimatedDeploymentTime: this.estimateGamingDeploymentTime(config),
        estimatedCost,
        riskLevel: this.assessGamingRisk(config, context),
        recommendations
      }
    };
  }

  private validateGamingResources(config: DeploymentConfig, context: ValidationContext): boolean {
    const availableGpus = context.resourceConstraints.availableGpus[config.gpuType] || 0;
    const requiredGpus = config.autoScaling ? config.maxInstances! : config.instanceCount;

    return availableGpus >= requiredGpus;
  }

  private validateGamingCompliance(config: DeploymentConfig, context: ValidationContext): boolean {
    const policy = context.organizationPolicies;

    // Check GPU type is allowed
    if (!policy.allowedGpuTypes.includes(config.gpuType)) {
      return false;
    }

    // Check instance count limits
    const maxInstances = config.autoScaling ? config.maxInstances! : config.instanceCount;
    if (maxInstances > policy.maxInstanceCount) {
      return false;
    }

    return true;
  }

  private validateGamingPerformance(config: DeploymentConfig): boolean {
    // Gaming models need adequate GPU memory and compute
    const gpuRequirements: Record<string, { minMemory: number; recommendedInstances: number }> = {
      'NVIDIA_RTX_A6000': { minMemory: 48, recommendedInstances: 2 },
      'NVIDIA_A40': { minMemory: 48, recommendedInstances: 1 },
      'NVIDIA_A100_SXM4_80GB': { minMemory: 80, recommendedInstances: 1 }
    };

    const requirements = gpuRequirements[config.gpuType];
    if (!requirements) {
      return false; // Unknown GPU type
    }

    // For gaming, prefer multiple smaller instances for better distribution
    return config.instanceCount >= requirements.recommendedInstances;
  }

  private validateGamingSecurity(config: DeploymentConfig, context: ValidationContext): boolean {
    // Gaming deployments typically have standard security requirements
    return context.organizationPolicies.securityLevel === 'standard' ||
           context.organizationPolicies.securityLevel === 'enhanced';
  }

  private validateGamingCosts(config: DeploymentConfig, context: ValidationContext): boolean {
    const estimatedCost = this.estimateDeploymentCost(config);
    return estimatedCost <= context.organizationPolicies.maxCostPerHour;
  }

  private estimateGamingDeploymentTime(config: DeploymentConfig): number {
    // Gaming deployments are typically faster due to simpler requirements
    const baseTime = 10; // seconds
    const instancePenalty = config.instanceCount * 2;
    const autoScalingPenalty = config.autoScaling ? 5 : 0;

    return baseTime + instancePenalty + autoScalingPenalty;
  }

  private assessGamingRisk(config: DeploymentConfig, context: ValidationContext): 'low' | 'medium' | 'high' {
    let riskFactors = 0;

    if (config.instanceCount > 5) riskFactors++;
    if (context.targetEnvironment === 'production') riskFactors++;
    if (!config.autoScaling && config.instanceCount === 1) riskFactors++;

    if (riskFactors >= 2) return 'high';
    if (riskFactors === 1) return 'medium';
    return 'low';
  }
}

/**
 * Enterprise-focused validation strategy for Enterprise
 */
export class EnterpriseValidationStrategy extends DeploymentValidationStrategy {
  async validate(config: DeploymentConfig, context: ValidationContext): Promise<ValidationResult> {
    const basicValidation = this.validateBasicConfiguration(config);
    const errors = [...basicValidation.errors];
    const warnings: string[] = [];

    // Enterprise-specific validations
    const details = {
      configurationValid: basicValidation.valid,
      resourcesAvailable: this.validateEnterpriseResources(config, context),
      organizationCompliant: this.validateEnterpriseCompliance(config, context),
      performanceExpected: this.validateEnterprisePerformance(config),
      securityCompliant: this.validateEnterpriseSecurity(config, context),
      costOptimized: this.validateEnterpriseCosts(config, context)
    };

    // Add enterprise-specific warnings
    if (config.envVars?.THEME !== 'corporate') {
      warnings.push('Enterprise deployments should use corporate theme');
    }

    if (!config.envVars?.COMPLIANCE) {
      warnings.push('Compliance configuration missing for enterprise deployment');
    }

    if (!config.envVars?.AUDIT_LOG) {
      warnings.push('Audit logging should be enabled for enterprise deployments');
    }

    // Enterprise recommendations
    const recommendations: string[] = [];
    if (!config.autoScaling) {
      recommendations.push('Consider auto-scaling for enterprise high availability requirements');
    }

    if (config.gpuType !== 'NVIDIA_A100_SXM4_80GB' && config.gpuType !== 'NVIDIA_H100_SXM5_80GB') {
      recommendations.push('Consider premium GPU types for enterprise workloads');
    }

    if (context.targetEnvironment === 'production' && !config.envVars?.AUDIT_LOG) {
      recommendations.push('Enable comprehensive audit logging for production enterprise deployments');
    }

    const score = this.calculateValidationScore(details);
    const estimatedCost = this.estimateDeploymentCost(config);

    return {
      isValid: score >= 85, // Enterprise deployments need 85%+ score
      errors,
      warnings,
      score,
      details,
      metadata: {
        estimatedDeploymentTime: this.estimateEnterpriseDeploymentTime(config),
        estimatedCost,
        riskLevel: this.assessEnterpriseRisk(config, context),
        recommendations
      }
    };
  }

  private validateEnterpriseResources(config: DeploymentConfig, context: ValidationContext): boolean {
    const availableGpus = context.resourceConstraints.availableGpus[config.gpuType] || 0;
    const requiredGpus = config.autoScaling ? config.maxInstances! : config.instanceCount;

    // Enterprise needs buffer capacity
    return availableGpus >= requiredGpus * 1.2;
  }

  private validateEnterpriseCompliance(config: DeploymentConfig, context: ValidationContext): boolean {
    const policy = context.organizationPolicies;

    // Stricter compliance checks for enterprise
    if (!policy.allowedGpuTypes.includes(config.gpuType)) {
      return false;
    }

    // Enterprise requires approval for large deployments
    const maxInstances = config.autoScaling ? config.maxInstances! : config.instanceCount;
    if (maxInstances > 4 && !policy.requiresApproval) {
      return false;
    }

    // Check compliance requirements
    const hasRequiredCompliance = context.complianceRequirements.some(req =>
      ['sox', 'gdpr', 'iso27001'].includes(req.type)
    );

    return hasRequiredCompliance;
  }

  private validateEnterprisePerformance(config: DeploymentConfig): boolean {
    // Enterprise needs high-performance GPUs and redundancy
    const enterpriseGpus = ['NVIDIA_A100_SXM4_80GB', 'NVIDIA_H100_SXM5_80GB'];

    if (!enterpriseGpus.includes(config.gpuType)) {
      return false;
    }

    // Enterprise requires minimum 2 instances for redundancy
    const minInstances = config.autoScaling ? config.minInstances! : config.instanceCount;
    return minInstances >= 2;
  }

  private validateEnterpriseSecurity(config: DeploymentConfig, context: ValidationContext): boolean {
    // Enterprise requires enhanced or enterprise security level
    const securityLevel = context.organizationPolicies.securityLevel;
    if (securityLevel !== 'enhanced' && securityLevel !== 'enterprise') {
      return false;
    }

    // Check for required security configurations
    const hasAuditLogging = config.envVars?.AUDIT_LOG === 'enabled';
    const hasCompliance = !!config.envVars?.COMPLIANCE;

    return hasAuditLogging && hasCompliance;
  }

  private validateEnterpriseCosts(config: DeploymentConfig, context: ValidationContext): boolean {
    const estimatedCost = this.estimateDeploymentCost(config);
    // Enterprise has higher cost tolerance but still needs to be reasonable
    return estimatedCost <= context.organizationPolicies.maxCostPerHour;
  }

  private estimateEnterpriseDeploymentTime(config: DeploymentConfig): number {
    // Enterprise deployments take longer due to compliance and security checks
    const baseTime = 20; // seconds
    const instancePenalty = config.instanceCount * 3;
    const autoScalingPenalty = config.autoScaling ? 10 : 0;
    const compliancePenalty = 15; // Additional time for compliance checks

    return baseTime + instancePenalty + autoScalingPenalty + compliancePenalty;
  }

  private assessEnterpriseRisk(config: DeploymentConfig, context: ValidationContext): 'low' | 'medium' | 'high' {
    let riskFactors = 0;

    if (config.instanceCount > 8) riskFactors++;
    if (context.targetEnvironment === 'production') riskFactors++;
    if (context.organizationPolicies.securityLevel !== 'enterprise') riskFactors++;
    if (!config.autoScaling) riskFactors++;

    if (riskFactors >= 3) return 'high';
    if (riskFactors >= 2) return 'medium';
    return 'low';
  }
}

/**
 * Factory for creating appropriate validation strategies
 */
export class DeploymentValidator {
  private static strategies: Map<string, DeploymentValidationStrategy> = new Map([
    ['arcade', new GamingValidationStrategy()],
    ['enterprise', new EnterpriseValidationStrategy()]
  ]);

  static async validateDeployment(
    config: DeploymentConfig,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const strategy = this.strategies.get(config.organization);

    if (!strategy) {
      throw new Error(`No validation strategy found for organization: ${config.organization}`);
    }

    return await strategy.validate(config, context);
  }

  static registerStrategy(organization: string, strategy: DeploymentValidationStrategy): void {
    this.strategies.set(organization, strategy);
  }

  /**
   * Validate multiple deployments in batch
   */
  static async validateBatch(
    configs: DeploymentConfig[],
    context: ValidationContext
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const config of configs) {
      const configKey = `${config.organization}:${config.modelId}`;
      try {
        const result = await this.validateDeployment(config, context);
        results.set(configKey, result);
      } catch (error: unknown) {
        results.set(configKey, {
          isValid: false,
          errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          score: 0,
          details: {
            configurationValid: false,
            resourcesAvailable: false,
            organizationCompliant: false,
            performanceExpected: false,
            securityCompliant: false,
            costOptimized: false
          }
        });
      }
    }

    return results;
  }

  /**
   * Get validation recommendations for improving deployment configuration
   */
  static async getOptimizationRecommendations(
    config: DeploymentConfig,
    context: ValidationContext
  ): Promise<string[]> {
    const result = await this.validateDeployment(config, context);
    const recommendations = result.metadata?.recommendations || [];

    // Add general optimization recommendations
    if (result.score < 80) {
      recommendations.push('Consider reviewing configuration to improve validation score');
    }

    if (!result.details.costOptimized) {
      recommendations.push('Review instance count and GPU type for cost optimization');
    }

    if (!result.details.performanceExpected) {
      recommendations.push('Consider upgrading GPU type or adjusting instance configuration');
    }

    return recommendations;
  }
}

/**
 * Helper function to create default validation contexts for testing
 */
export function createValidationContext(
  environment: 'development' | 'staging' | 'production',
  organization: 'arcade' | 'enterprise'
): ValidationContext {
  const basePolicy: OrganizationPolicy = {
    allowedGpuTypes: ['NVIDIA_RTX_A6000', 'NVIDIA_A40', 'NVIDIA_A100_SXM4_80GB'],
    maxInstanceCount: 10,
    maxCostPerHour: 50,
    requiresApproval: environment === 'production',
    securityLevel: organization === 'enterprise' ? 'enterprise' : 'standard',
    dataRetention: organization === 'enterprise' ? 90 : 30
  };

  if (organization === 'enterprise') {
    basePolicy.allowedGpuTypes.push('NVIDIA_H100_SXM5_80GB');
    basePolicy.maxCostPerHour = 100;
    basePolicy.securityLevel = 'enterprise';
  }

  const constraints: ResourceConstraints = {
    availableGpus: {
      'NVIDIA_RTX_A6000': 20,
      'NVIDIA_A40': 15,
      'NVIDIA_A100_SXM4_80GB': 10,
      'NVIDIA_H100_SXM5_80GB': 5
    },
    networkBandwidth: 10000, // 10 Gbps
    storageQuota: 1000, // 1 TB
    computeQuota: 1000 // 1000 hours per month
  };

  const compliance: ComplianceRequirement[] = [];
  if (organization === 'enterprise') {
    compliance.push(
      { type: 'sox', level: 'standard', validationRules: ['audit_logging', 'data_encryption'] },
      { type: 'gdpr', level: 'standard', validationRules: ['data_privacy', 'right_to_deletion'] }
    );
  } else {
    compliance.push(
      { type: 'gaming_certification', level: 'basic', validationRules: ['content_rating', 'user_safety'] }
    );
  }

  return {
    targetEnvironment: environment,
    organizationPolicies: basePolicy,
    resourceConstraints: constraints,
    complianceRequirements: compliance
  };
}