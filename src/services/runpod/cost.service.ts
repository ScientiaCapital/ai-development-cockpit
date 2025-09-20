/**
 * RunPod Cost Estimation and Tracking Service
 * Provides real-time cost calculations, budget alerts, and cost optimization recommendations
 */

import { EventEmitter } from 'events';
import { EndpointResponse, EndpointMetrics } from './client';
import { DOCKER_TEMPLATES, DockerTemplate } from './templates';

export interface CostConfig {
  currency: 'USD' | 'EUR' | 'GBP';
  updateInterval?: number;
  budgetAlerts?: BudgetAlert[];
}

export interface BudgetAlert {
  id: string;
  name: string;
  threshold: number; // Amount in primary currency
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

export interface GPUPricing {
  gpuType: string;
  hourlyRate: number;
  currency: string;
  region?: string;
  availability: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export interface CostBreakdown {
  compute: number;
  storage: number;
  bandwidth: number;
  other: number;
  total: number;
}

export interface DeploymentCost {
  endpointId: string;
  modelId: string;
  gpuType: string;
  gpuCount: number;

  // Current period costs
  hourlyRate: number;
  dailyEstimate: number;
  weeklyEstimate: number;
  monthlyEstimate: number;

  // Actual spending
  actualSpend: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };

  // Breakdown
  breakdown: CostBreakdown;

  // Optimization
  optimization: {
    recommendations: CostOptimization[];
    potentialSavings: number;
  };

  // Status
  isActive: boolean;
  startTime: string;
  lastUpdated: string;
}

export interface CostOptimization {
  type: 'gpu_type' | 'scaling' | 'scheduling' | 'quantization' | 'region';
  title: string;
  description: string;
  potentialSavings: number;
  savingsPercent: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface CostProjection {
  period: 'day' | 'week' | 'month' | 'year';
  low: number;
  medium: number;
  high: number;
  breakdown: CostBreakdown;
  assumptions: string[];
}

export interface CostSummary {
  totalActiveDeployments: number;
  totalHourlyCost: number;
  totalDailyCost: number;
  totalMonthlyCost: number;
  totalActualSpend: number;
  topCostlyDeployments: Array<{
    endpointId: string;
    modelId: string;
    hourlyCost: number;
    percentage: number;
  }>;
  budgetStatus: Array<{
    alertId: string;
    name: string;
    spent: number;
    threshold: number;
    percentage: number;
    status: 'safe' | 'warning' | 'exceeded';
  }>;
  recommendations: CostOptimization[];
}

export class CostEstimationService extends EventEmitter {
  private config: Required<CostConfig>;
  private deploymentCosts = new Map<string, DeploymentCost>();
  private gpuPricing: GPUPricing[] = [];
  private updateTimer?: NodeJS.Timeout;

  constructor(config: CostConfig = { currency: 'USD' }) {
    super();

    this.config = {
      currency: config.currency,
      updateInterval: config.updateInterval || 60000, // 1 minute
      budgetAlerts: config.budgetAlerts || []
    };

    this.initializeGPUPricing();
    this.startCostTracking();
  }

  /**
   * Add deployment for cost tracking
   */
  addDeployment(
    endpoint: EndpointResponse,
    templateId: string,
    modelId: string
  ): void {
    const template = DOCKER_TEMPLATES[templateId];
    if (!template) {
      console.warn(`Template ${templateId} not found`);
      return;
    }

    const gpuPricing = this.getGPUPricing(endpoint.gpuType);
    const gpuCount = template.optimization.tensorParallelism;
    const hourlyRate = gpuPricing.hourlyRate * gpuCount;

    const cost: DeploymentCost = {
      endpointId: endpoint.id,
      modelId,
      gpuType: endpoint.gpuType,
      gpuCount,

      hourlyRate,
      dailyEstimate: hourlyRate * 24,
      weeklyEstimate: hourlyRate * 24 * 7,
      monthlyEstimate: hourlyRate * 24 * 30,

      actualSpend: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0
      },

      breakdown: this.calculateCostBreakdown(hourlyRate),

      optimization: {
        recommendations: this.generateOptimizations(endpoint, template),
        potentialSavings: 0
      },

      isActive: endpoint.status === 'RUNNING',
      startTime: endpoint.created || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Calculate potential savings
    cost.optimization.potentialSavings = cost.optimization.recommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0
    );

    this.deploymentCosts.set(endpoint.id, cost);
    this.emit('deployment_added', { endpointId: endpoint.id, cost });
  }

  /**
   * Update deployment cost with actual metrics
   */
  updateDeploymentCost(
    endpointId: string,
    endpoint: EndpointResponse,
    metrics?: EndpointMetrics
  ): void {
    const cost = this.deploymentCosts.get(endpointId);
    if (!cost) return;

    // Update status
    cost.isActive = endpoint.status === 'RUNNING';
    cost.lastUpdated = new Date().toISOString();

    // Calculate actual spend based on uptime
    if (metrics) {
      const uptimeHours = metrics.uptime / 3600;
      const currentSpend = uptimeHours * cost.hourlyRate;

      // Update actual spend (this would be more sophisticated in production)
      cost.actualSpend.total = currentSpend;

      // Update daily/weekly/monthly based on start time
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay.getTime() - (startOfDay.getDay() * 24 * 60 * 60 * 1000));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const startTime = new Date(cost.startTime);

      if (startTime >= startOfDay) {
        cost.actualSpend.today = currentSpend;
      }

      if (startTime >= startOfWeek) {
        cost.actualSpend.thisWeek = currentSpend;
      }

      if (startTime >= startOfMonth) {
        cost.actualSpend.thisMonth = currentSpend;
      }
    }

    this.emit('cost_updated', { endpointId, cost });
    this.checkBudgetAlerts();
  }

  /**
   * Remove deployment from cost tracking
   */
  removeDeployment(endpointId: string): void {
    const cost = this.deploymentCosts.get(endpointId);
    if (cost) {
      this.deploymentCosts.delete(endpointId);
      this.emit('deployment_removed', { endpointId, finalCost: cost.actualSpend.total });
    }
  }

  /**
   * Get cost estimate for a deployment configuration
   */
  estimateDeploymentCost(
    templateId: string,
    gpuType?: string,
    gpuCount?: number
  ): DeploymentCost {
    const template = DOCKER_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const actualGpuType = gpuType || template.gpuRequirements.supportedTypes[0];
    const actualGpuCount = gpuCount || template.optimization.tensorParallelism;
    const gpuPricing = this.getGPUPricing(actualGpuType);
    const hourlyRate = gpuPricing.hourlyRate * actualGpuCount;

    return {
      endpointId: 'estimate',
      modelId: 'estimate',
      gpuType: actualGpuType,
      gpuCount: actualGpuCount,

      hourlyRate,
      dailyEstimate: hourlyRate * 24,
      weeklyEstimate: hourlyRate * 24 * 7,
      monthlyEstimate: hourlyRate * 24 * 30,

      actualSpend: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0
      },

      breakdown: this.calculateCostBreakdown(hourlyRate),

      optimization: {
        recommendations: this.generateOptimizations(null, template),
        potentialSavings: 0
      },

      isActive: false,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get cost for specific deployment
   */
  getDeploymentCost(endpointId: string): DeploymentCost | null {
    return this.deploymentCosts.get(endpointId) || null;
  }

  /**
   * Get all deployment costs
   */
  getAllDeploymentCosts(): DeploymentCost[] {
    return Array.from(this.deploymentCosts.values());
  }

  /**
   * Get cost summary
   */
  getCostSummary(): CostSummary {
    const costs = this.getAllDeploymentCosts();
    const activeCosts = costs.filter(c => c.isActive);

    const totalHourlyCost = activeCosts.reduce((sum, c) => sum + c.hourlyRate, 0);
    const totalActualSpend = costs.reduce((sum, c) => sum + c.actualSpend.total, 0);

    const topCostly = activeCosts
      .sort((a, b) => b.hourlyRate - a.hourlyRate)
      .slice(0, 5)
      .map(c => ({
        endpointId: c.endpointId,
        modelId: c.modelId,
        hourlyCost: c.hourlyRate,
        percentage: totalHourlyCost > 0 ? (c.hourlyRate / totalHourlyCost) * 100 : 0
      }));

    const budgetStatus = this.config.budgetAlerts.map(alert => {
      const spent = this.calculateSpentForPeriod(alert.period);
      const percentage = alert.threshold > 0 ? (spent / alert.threshold) * 100 : 0;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        alertId: alert.id,
        name: alert.name,
        spent,
        threshold: alert.threshold,
        percentage,
        status
      };
    });

    const recommendations = this.generateGlobalOptimizations();

    return {
      totalActiveDeployments: activeCosts.length,
      totalHourlyCost,
      totalDailyCost: totalHourlyCost * 24,
      totalMonthlyCost: totalHourlyCost * 24 * 30,
      totalActualSpend,
      topCostlyDeployments: topCostly,
      budgetStatus,
      recommendations
    };
  }

  /**
   * Generate cost projections
   */
  generateProjections(scenarios: {
    conservative: number;
    realistic: number;
    aggressive: number;
  }): Record<CostProjection['period'], CostProjection> {
    const currentHourly = this.getAllDeploymentCosts()
      .filter(c => c.isActive)
      .reduce((sum, c) => sum + c.hourlyRate, 0);

    const periods: CostProjection['period'][] = ['day', 'week', 'month', 'year'];
    const multipliers = { day: 24, week: 24 * 7, month: 24 * 30, year: 24 * 365 };

    const projections: Record<CostProjection['period'], CostProjection> = {} as any;

    for (const period of periods) {
      const multiplier = multipliers[period];
      const baseProjection = currentHourly * multiplier;

      projections[period] = {
        period,
        low: baseProjection * scenarios.conservative,
        medium: baseProjection * scenarios.realistic,
        high: baseProjection * scenarios.aggressive,
        breakdown: this.calculateCostBreakdown(baseProjection * scenarios.realistic),
        assumptions: [
          `Based on current ${this.getAllDeploymentCosts().filter(c => c.isActive).length} active deployments`,
          `Conservative: ${scenarios.conservative}x current usage`,
          `Realistic: ${scenarios.realistic}x current usage`,
          `Aggressive: ${scenarios.aggressive}x current usage`,
          'Prices may vary based on availability and demand'
        ]
      };
    }

    return projections;
  }

  /**
   * Export cost data
   */
  exportCostData(format: 'json' | 'csv' = 'json'): string {
    const costs = this.getAllDeploymentCosts();

    if (format === 'csv') {
      const headers = [
        'Endpoint ID', 'Model ID', 'GPU Type', 'GPU Count', 'Hourly Rate',
        'Daily Estimate', 'Monthly Estimate', 'Actual Spend', 'Status', 'Start Time'
      ];

      const rows = costs.map(c => [
        c.endpointId,
        c.modelId,
        c.gpuType,
        c.gpuCount,
        c.hourlyRate.toFixed(2),
        c.dailyEstimate.toFixed(2),
        c.monthlyEstimate.toFixed(2),
        c.actualSpend.total.toFixed(2),
        c.isActive ? 'Active' : 'Inactive',
        c.startTime
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify({
      summary: this.getCostSummary(),
      deployments: costs,
      generatedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Initialize GPU pricing data
   */
  private initializeGPUPricing(): void {
    // These would be updated from RunPod API in production
    this.gpuPricing = [
      {
        gpuType: 'NVIDIA_RTX_4090',
        hourlyRate: 0.79,
        currency: 'USD',
        availability: 'high',
        lastUpdated: new Date().toISOString()
      },
      {
        gpuType: 'NVIDIA_RTX_A6000',
        hourlyRate: 0.79,
        currency: 'USD',
        availability: 'high',
        lastUpdated: new Date().toISOString()
      },
      {
        gpuType: 'NVIDIA_A40',
        hourlyRate: 0.89,
        currency: 'USD',
        availability: 'medium',
        lastUpdated: new Date().toISOString()
      },
      {
        gpuType: 'NVIDIA_A100',
        hourlyRate: 2.89,
        currency: 'USD',
        availability: 'medium',
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  /**
   * Get GPU pricing
   */
  private getGPUPricing(gpuType: string): GPUPricing {
    return this.gpuPricing.find(p => p.gpuType === gpuType) || {
      gpuType,
      hourlyRate: 1.0,
      currency: 'USD',
      availability: 'low',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate cost breakdown
   */
  private calculateCostBreakdown(totalCost: number): CostBreakdown {
    return {
      compute: totalCost * 0.80, // 80% GPU compute
      storage: totalCost * 0.10, // 10% storage
      bandwidth: totalCost * 0.08, // 8% bandwidth
      other: totalCost * 0.02, // 2% other fees
      total: totalCost
    };
  }

  /**
   * Generate optimization recommendations for a deployment
   */
  private generateOptimizations(
    endpoint: EndpointResponse | null,
    template: DockerTemplate
  ): CostOptimization[] {
    const optimizations: CostOptimization[] = [];

    // GPU type optimization
    if (template.gpuRequirements.supportedTypes.length > 1) {
      const currentGPU = endpoint?.gpuType || template.gpuRequirements.supportedTypes[0];
      const cheaperGPUs = template.gpuRequirements.supportedTypes.filter(gpu => {
        const pricing = this.getGPUPricing(gpu);
        const currentPricing = this.getGPUPricing(currentGPU);
        return pricing.hourlyRate < currentPricing.hourlyRate;
      });

      if (cheaperGPUs.length > 0) {
        const savings = this.getGPUPricing(currentGPU).hourlyRate - this.getGPUPricing(cheaperGPUs[0]).hourlyRate;
        optimizations.push({
          type: 'gpu_type',
          title: 'Use cheaper GPU type',
          description: `Switch from ${currentGPU} to ${cheaperGPUs[0]}`,
          potentialSavings: savings * 24 * 30, // Monthly savings
          savingsPercent: (savings / this.getGPUPricing(currentGPU).hourlyRate) * 100,
          effort: 'low',
          impact: 'medium',
          recommendation: `Consider using ${cheaperGPUs[0]} if performance requirements allow`
        });
      }
    }

    // Quantization optimization
    if (!template.optimization.quantization) {
      optimizations.push({
        type: 'quantization',
        title: 'Enable model quantization',
        description: 'Use 4-bit or 8-bit quantization to reduce memory requirements',
        potentialSavings: 50, // Estimated monthly savings
        savingsPercent: 25,
        effort: 'medium',
        impact: 'high',
        recommendation: 'Use quantized models to reduce GPU memory requirements and costs'
      });
    }

    // Auto-scaling optimization
    if (endpoint && endpoint.workersMin > 0) {
      const monthlySavings = this.getGPUPricing(endpoint.gpuType).hourlyRate * 24 * 30 * 0.3;
      optimizations.push({
        type: 'scaling',
        title: 'Optimize auto-scaling',
        description: 'Reduce minimum workers to 0 for cost savings during low usage',
        potentialSavings: monthlySavings,
        savingsPercent: 30,
        effort: 'low',
        impact: 'high',
        recommendation: 'Set minimum workers to 0 and enable aggressive scaling down'
      });
    }

    return optimizations;
  }

  /**
   * Generate global optimization recommendations
   */
  private generateGlobalOptimizations(): CostOptimization[] {
    const costs = this.getAllDeploymentCosts();
    const activeCosts = costs.filter(c => c.isActive);
    const optimizations: CostOptimization[] = [];

    if (activeCosts.length === 0) return optimizations;

    // Consolidation opportunity
    if (activeCosts.length > 3) {
      optimizations.push({
        type: 'scaling',
        title: 'Consolidate deployments',
        description: `Consider consolidating ${activeCosts.length} deployments`,
        potentialSavings: activeCosts.reduce((sum, c) => sum + c.hourlyRate, 0) * 24 * 30 * 0.2,
        savingsPercent: 20,
        effort: 'high',
        impact: 'high',
        recommendation: 'Evaluate if multiple models can share deployments or use smaller instances'
      });
    }

    // Scheduling optimization
    const totalHourlyCost = activeCosts.reduce((sum, c) => sum + c.hourlyRate, 0);
    if (totalHourlyCost > 10) {
      optimizations.push({
        type: 'scheduling',
        title: 'Implement usage-based scheduling',
        description: 'Schedule deployments based on actual usage patterns',
        potentialSavings: totalHourlyCost * 24 * 30 * 0.4,
        savingsPercent: 40,
        effort: 'medium',
        impact: 'high',
        recommendation: 'Analyze usage patterns and implement automated scheduling'
      });
    }

    return optimizations;
  }

  /**
   * Calculate spent amount for a given period
   */
  private calculateSpentForPeriod(period: BudgetAlert['period']): number {
    const costs = this.getAllDeploymentCosts();

    switch (period) {
      case 'hourly':
        return costs.filter(c => c.isActive).reduce((sum, c) => sum + c.hourlyRate, 0);
      case 'daily':
        return costs.reduce((sum, c) => sum + c.actualSpend.today, 0);
      case 'weekly':
        return costs.reduce((sum, c) => sum + c.actualSpend.thisWeek, 0);
      case 'monthly':
        return costs.reduce((sum, c) => sum + c.actualSpend.thisMonth, 0);
      default:
        return 0;
    }
  }

  /**
   * Check budget alerts
   */
  private checkBudgetAlerts(): void {
    for (const alert of this.config.budgetAlerts) {
      if (!alert.enabled) continue;

      const spent = this.calculateSpentForPeriod(alert.period);
      const percentage = (spent / alert.threshold) * 100;

      if (percentage >= 100) {
        this.emit('budget_exceeded', { alert, spent, percentage });
      } else if (percentage >= 80) {
        this.emit('budget_warning', { alert, spent, percentage });
      }
    }
  }

  /**
   * Start cost tracking
   */
  private startCostTracking(): void {
    this.updateTimer = setInterval(() => {
      this.emit('cost_update', this.getCostSummary());
    }, this.config.updateInterval);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.deploymentCosts.clear();
    this.removeAllListeners();
  }
}

export default CostEstimationService;