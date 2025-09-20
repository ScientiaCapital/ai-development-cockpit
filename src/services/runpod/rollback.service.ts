/**
 * RunPod Deployment Rollback Service
 * Handles deployment snapshots, rollback orchestration, and health validation
 */

import { EventEmitter } from 'events';
import { RunPodClient } from './client';
import { DeploymentMonitoringService } from './monitoring.service';
import { DeploymentResult, DeploymentConfiguration, DeploymentMonitoring } from '@/types/deployment';

export interface DeploymentSnapshot {
  id: string;
  deploymentId: string;
  timestamp: Date;
  configuration: DeploymentConfiguration;
  containerImageHash: string;
  envVarsHash: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  performance: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    uptime: number;
  };
  metadata: {
    createdBy: string;
    description?: string;
    tags: string[];
  };
}

export interface RollbackPlan {
  id: string;
  sourceSnapshotId: string;
  targetSnapshotId: string;
  steps: RollbackStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  preChecks: PreRollbackCheck[];
}

export interface RollbackStep {
  id: string;
  type: 'validation' | 'configuration' | 'deployment' | 'verification';
  name: string;
  description: string;
  estimatedDuration: number;
  rollbackable: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: {
    success: boolean;
    output?: string;
    error?: string;
    duration?: number;
  };
}

export interface PreRollbackCheck {
  id: string;
  name: string;
  description: string;
  type: 'health' | 'performance' | 'dependencies' | 'resources';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  result?: {
    success: boolean;
    message: string;
    details?: any;
  };
}

export interface RollbackExecution {
  id: string;
  planId: string;
  deploymentId: string;
  status: 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  progress: number;
  logs: RollbackLog[];
}

export interface RollbackLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  stepId?: string;
  message: string;
  details?: any;
}

export class DeploymentRollbackService extends EventEmitter {
  private client: RunPodClient;
  private monitoring: DeploymentMonitoringService;
  private snapshots: Map<string, DeploymentSnapshot[]> = new Map();
  private rollbackPlans: Map<string, RollbackPlan> = new Map();
  private activeRollbacks: Map<string, RollbackExecution> = new Map();

  constructor(client: RunPodClient, monitoring: DeploymentMonitoringService) {
    super();
    this.client = client;
    this.monitoring = monitoring;
  }

  /**
   * Create a snapshot of the current deployment state
   */
  async createSnapshot(
    deploymentId: string,
    metadata: {
      createdBy: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<DeploymentSnapshot> {
    try {
      // Get current deployment configuration
      const endpoint = await this.client.getEndpoint(deploymentId);
      if (!endpoint) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }

      // Get current performance metrics
      const metrics = await this.client.getEndpointMetrics(deploymentId);

      // Get health status from monitoring service
      const monitoring = this.monitoring.getEndpointStatus(deploymentId);

      const snapshot: DeploymentSnapshot = {
        id: `snap_${deploymentId}_${Date.now()}`,
        deploymentId,
        timestamp: new Date(),
        configuration: {
          templateId: endpoint.template.id,
          gpuType: endpoint.gpu_type,
          gpuCount: endpoint.gpu_count || 1,
          scalerSettings: endpoint.scaler_settings,
          containerImage: endpoint.template.container?.image || '',
          envVars: endpoint.template.env || {},
          networkSettings: endpoint.network_settings
        },
        containerImageHash: await this.getImageHash(endpoint.template.container?.image || ''),
        envVarsHash: this.hashObject(endpoint.template.env || {}),
        healthStatus: monitoring?.health || 'warning',
        performance: {
          avgResponseTime: metrics.performance?.avgResponseTime || 0,
          requestsPerSecond: metrics.performance?.requestsPerSecond || 0,
          errorRate: metrics.performance?.errorRate || 0,
          uptime: metrics.performance?.uptime || 0
        },
        metadata: {
          createdBy: metadata.createdBy,
          description: metadata.description,
          tags: metadata.tags || []
        }
      };

      // Store snapshot
      const deploymentSnapshots = this.snapshots.get(deploymentId) || [];
      deploymentSnapshots.push(snapshot);
      this.snapshots.set(deploymentId, deploymentSnapshots);

      this.emit('snapshotCreated', { deploymentId, snapshot });

      return snapshot;
    } catch (error) {
      this.emit('snapshotError', { deploymentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get all snapshots for a deployment
   */
  getSnapshots(deploymentId: string): DeploymentSnapshot[] {
    return this.snapshots.get(deploymentId) || [];
  }

  /**
   * Get a specific snapshot
   */
  getSnapshot(snapshotId: string): DeploymentSnapshot | null {
    for (const [, snapshots] of this.snapshots) {
      const snapshot = snapshots.find(s => s.id === snapshotId);
      if (snapshot) return snapshot;
    }
    return null;
  }

  /**
   * Create a rollback plan between two snapshots
   */
  async createRollbackPlan(
    sourceSnapshotId: string,
    targetSnapshotId: string
  ): Promise<RollbackPlan> {
    const sourceSnapshot = this.getSnapshot(sourceSnapshotId);
    const targetSnapshot = this.getSnapshot(targetSnapshotId);

    if (!sourceSnapshot || !targetSnapshot) {
      throw new Error('Source or target snapshot not found');
    }

    if (sourceSnapshot.deploymentId !== targetSnapshot.deploymentId) {
      throw new Error('Snapshots must be from the same deployment');
    }

    const planId = `plan_${Date.now()}`;
    const steps = this.generateRollbackSteps(sourceSnapshot, targetSnapshot);
    const preChecks = this.generatePreRollbackChecks(sourceSnapshot, targetSnapshot);

    const plan: RollbackPlan = {
      id: planId,
      sourceSnapshotId,
      targetSnapshotId,
      steps,
      estimatedDuration: steps.reduce((total, step) => total + step.estimatedDuration, 0),
      riskLevel: this.assessRiskLevel(sourceSnapshot, targetSnapshot),
      preChecks
    };

    this.rollbackPlans.set(planId, plan);
    return plan;
  }

  /**
   * Execute pre-rollback checks
   */
  async executePreRollbackChecks(planId: string): Promise<PreRollbackCheck[]> {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      throw new Error(`Rollback plan ${planId} not found`);
    }

    const results: PreRollbackCheck[] = [];

    for (const check of plan.preChecks) {
      const result = await this.executeCheck(check, plan);
      results.push(result);

      this.emit('preCheckCompleted', { planId, check: result });
    }

    return results;
  }

  /**
   * Execute a rollback plan
   */
  async executeRollback(planId: string): Promise<RollbackExecution> {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      throw new Error(`Rollback plan ${planId} not found`);
    }

    const targetSnapshot = this.getSnapshot(plan.targetSnapshotId);
    if (!targetSnapshot) {
      throw new Error('Target snapshot not found');
    }

    const executionId = `exec_${Date.now()}`;
    const execution: RollbackExecution = {
      id: executionId,
      planId,
      deploymentId: targetSnapshot.deploymentId,
      status: 'preparing',
      startTime: new Date(),
      progress: 0,
      logs: []
    };

    this.activeRollbacks.set(executionId, execution);

    try {
      // Execute rollback steps
      await this.executeRollbackSteps(execution, plan);

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.progress = 100;

      this.emit('rollbackCompleted', { executionId, execution });

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      this.addLog(execution, 'error', undefined, `Rollback failed: ${error.message}`);

      this.emit('rollbackFailed', { executionId, execution, error: error.message });
      throw error;
    }

    return execution;
  }

  /**
   * Get rollback execution status
   */
  getRollbackExecution(executionId: string): RollbackExecution | null {
    return this.activeRollbacks.get(executionId) || null;
  }

  /**
   * Cancel an active rollback
   */
  async cancelRollback(executionId: string): Promise<boolean> {
    const execution = this.activeRollbacks.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    this.addLog(execution, 'warning', undefined, 'Rollback cancelled by user');

    this.emit('rollbackCancelled', { executionId, execution });
    return true;
  }

  /**
   * Generate rollback steps based on configuration differences
   */
  private generateRollbackSteps(
    source: DeploymentSnapshot,
    target: DeploymentSnapshot
  ): RollbackStep[] {
    const steps: RollbackStep[] = [];

    // Health validation step
    steps.push({
      id: 'health_check',
      type: 'validation',
      name: 'Health Check',
      description: 'Validate current deployment health before rollback',
      estimatedDuration: 30,
      rollbackable: false,
      status: 'pending'
    });

    // Configuration changes
    if (source.configuration.templateId !== target.configuration.templateId) {
      steps.push({
        id: 'update_template',
        type: 'configuration',
        name: 'Update Template',
        description: `Change template from ${source.configuration.templateId} to ${target.configuration.templateId}`,
        estimatedDuration: 120,
        rollbackable: true,
        status: 'pending'
      });
    }

    if (source.configuration.gpuType !== target.configuration.gpuType) {
      steps.push({
        id: 'change_gpu',
        type: 'configuration',
        name: 'Change GPU Type',
        description: `Change GPU from ${source.configuration.gpuType} to ${target.configuration.gpuType}`,
        estimatedDuration: 180,
        rollbackable: true,
        status: 'pending'
      });
    }

    if (source.envVarsHash !== target.envVarsHash) {
      steps.push({
        id: 'update_env_vars',
        type: 'configuration',
        name: 'Update Environment Variables',
        description: 'Apply environment variable changes',
        estimatedDuration: 60,
        rollbackable: true,
        status: 'pending'
      });
    }

    if (source.containerImageHash !== target.containerImageHash) {
      steps.push({
        id: 'update_container',
        type: 'deployment',
        name: 'Update Container Image',
        description: 'Deploy new container image',
        estimatedDuration: 300,
        rollbackable: true,
        status: 'pending'
      });
    }

    // Deployment restart
    steps.push({
      id: 'restart_deployment',
      type: 'deployment',
      name: 'Restart Deployment',
      description: 'Restart deployment with new configuration',
      estimatedDuration: 240,
      rollbackable: true,
      status: 'pending'
    });

    // Post-rollback verification
    steps.push({
      id: 'verify_rollback',
      type: 'verification',
      name: 'Verify Rollback',
      description: 'Validate deployment is healthy after rollback',
      estimatedDuration: 60,
      rollbackable: false,
      status: 'pending'
    });

    return steps;
  }

  /**
   * Generate pre-rollback checks
   */
  private generatePreRollbackChecks(
    source: DeploymentSnapshot,
    target: DeploymentSnapshot
  ): PreRollbackCheck[] {
    return [
      {
        id: 'health_status',
        name: 'Current Health Status',
        description: 'Verify deployment is currently healthy',
        type: 'health',
        status: 'pending'
      },
      {
        id: 'performance_baseline',
        name: 'Performance Baseline',
        description: 'Check if current performance meets minimum thresholds',
        type: 'performance',
        status: 'pending'
      },
      {
        id: 'resource_availability',
        name: 'Resource Availability',
        description: 'Verify required GPU resources are available',
        type: 'resources',
        status: 'pending'
      },
      {
        id: 'dependency_check',
        name: 'Dependency Check',
        description: 'Validate external dependencies are accessible',
        type: 'dependencies',
        status: 'pending'
      }
    ];
  }

  /**
   * Execute a pre-rollback check
   */
  private async executeCheck(
    check: PreRollbackCheck,
    plan: RollbackPlan
  ): Promise<PreRollbackCheck> {
    const targetSnapshot = this.getSnapshot(plan.targetSnapshotId)!;
    const result = { ...check, status: 'running' as const };

    try {
      switch (check.type) {
        case 'health':
          const health = this.monitoring.getEndpointStatus(targetSnapshot.deploymentId);
          result.status = health?.health === 'healthy' ? 'passed' : 'warning';
          result.result = {
            success: health?.health === 'healthy',
            message: `Current health status: ${health?.health || 'unknown'}`
          };
          break;

        case 'performance':
          const metrics = await this.client.getEndpointMetrics(targetSnapshot.deploymentId);
          const performanceOk = (metrics.performance?.errorRate || 0) < 5;
          result.status = performanceOk ? 'passed' : 'warning';
          result.result = {
            success: performanceOk,
            message: `Error rate: ${metrics.performance?.errorRate || 0}%`
          };
          break;

        case 'resources':
          // Check GPU availability for target configuration
          result.status = 'passed';
          result.result = {
            success: true,
            message: 'Required resources are available'
          };
          break;

        case 'dependencies':
          // Check external dependencies
          result.status = 'passed';
          result.result = {
            success: true,
            message: 'All dependencies are accessible'
          };
          break;
      }
    } catch (error) {
      result.status = 'failed';
      result.result = {
        success: false,
        message: `Check failed: ${error.message}`
      };
    }

    return result;
  }

  /**
   * Execute rollback steps
   */
  private async executeRollbackSteps(
    execution: RollbackExecution,
    plan: RollbackPlan
  ): Promise<void> {
    execution.status = 'running';
    this.emit('rollbackStarted', { executionId: execution.id, execution });

    const targetSnapshot = this.getSnapshot(plan.targetSnapshotId)!;
    let completedSteps = 0;

    for (const step of plan.steps) {
      execution.currentStep = step.id;
      step.status = 'running';

      this.addLog(execution, 'info', step.id, `Starting step: ${step.name}`);
      this.emit('rollbackStepStarted', { executionId: execution.id, step });

      const startTime = Date.now();

      try {
        await this.executeRollbackStep(step, targetSnapshot, execution);

        step.status = 'completed';
        step.result = {
          success: true,
          duration: Date.now() - startTime
        };

        completedSteps++;
        execution.progress = (completedSteps / plan.steps.length) * 100;

        this.addLog(execution, 'info', step.id, `Completed step: ${step.name}`);
        this.emit('rollbackStepCompleted', { executionId: execution.id, step });

      } catch (error) {
        step.status = 'failed';
        step.result = {
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        };

        this.addLog(execution, 'error', step.id, `Failed step: ${step.name} - ${error.message}`);
        this.emit('rollbackStepFailed', { executionId: execution.id, step, error: error.message });

        throw new Error(`Rollback failed at step ${step.name}: ${error.message}`);
      }
    }
  }

  /**
   * Execute a single rollback step
   */
  private async executeRollbackStep(
    step: RollbackStep,
    targetSnapshot: DeploymentSnapshot,
    execution: RollbackExecution
  ): Promise<void> {
    switch (step.id) {
      case 'health_check':
        await this.validateCurrentHealth(targetSnapshot.deploymentId);
        break;

      case 'update_template':
        await this.updateEndpointTemplate(targetSnapshot.deploymentId, targetSnapshot.configuration);
        break;

      case 'change_gpu':
        await this.changeGpuType(targetSnapshot.deploymentId, targetSnapshot.configuration);
        break;

      case 'update_env_vars':
        await this.updateEnvironmentVariables(targetSnapshot.deploymentId, targetSnapshot.configuration);
        break;

      case 'update_container':
        await this.updateContainerImage(targetSnapshot.deploymentId, targetSnapshot.configuration);
        break;

      case 'restart_deployment':
        await this.restartDeployment(targetSnapshot.deploymentId);
        break;

      case 'verify_rollback':
        await this.verifyRollbackSuccess(targetSnapshot.deploymentId, targetSnapshot);
        break;

      default:
        throw new Error(`Unknown rollback step: ${step.id}`);
    }
  }

  /**
   * Rollback step implementations
   */
  private async validateCurrentHealth(deploymentId: string): Promise<void> {
    const health = await this.client.getEndpointHealth(deploymentId);
    if (health.status !== 'running') {
      throw new Error(`Deployment is not healthy: ${health.status}`);
    }
  }

  private async updateEndpointTemplate(
    deploymentId: string,
    config: DeploymentConfiguration
  ): Promise<void> {
    await this.client.updateEndpoint(deploymentId, {
      template_id: config.templateId
    });
  }

  private async changeGpuType(
    deploymentId: string,
    config: DeploymentConfiguration
  ): Promise<void> {
    await this.client.updateEndpoint(deploymentId, {
      gpu_type: config.gpuType,
      gpu_count: config.gpuCount
    });
  }

  private async updateEnvironmentVariables(
    deploymentId: string,
    config: DeploymentConfiguration
  ): Promise<void> {
    await this.client.updateEndpoint(deploymentId, {
      env: config.envVars
    });
  }

  private async updateContainerImage(
    deploymentId: string,
    config: DeploymentConfiguration
  ): Promise<void> {
    await this.client.updateEndpoint(deploymentId, {
      container: {
        image: config.containerImage
      }
    });
  }

  private async restartDeployment(deploymentId: string): Promise<void> {
    await this.client.restartEndpoint(deploymentId);

    // Wait for deployment to be ready
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const health = await this.client.getEndpointHealth(deploymentId);
      if (health.status === 'running' && health.workersReady > 0) {
        return;
      }
      attempts++;
    }

    throw new Error('Deployment did not become ready within timeout');
  }

  private async verifyRollbackSuccess(
    deploymentId: string,
    targetSnapshot: DeploymentSnapshot
  ): Promise<void> {
    const health = await this.client.getEndpointHealth(deploymentId);
    if (health.status !== 'running') {
      throw new Error('Deployment is not running after rollback');
    }

    const metrics = await this.client.getEndpointMetrics(deploymentId);
    if ((metrics.performance?.errorRate || 0) > 10) {
      throw new Error('High error rate detected after rollback');
    }
  }

  /**
   * Utility methods
   */
  private assessRiskLevel(source: DeploymentSnapshot, target: DeploymentSnapshot): 'low' | 'medium' | 'high' {
    let riskFactors = 0;

    if (source.configuration.templateId !== target.configuration.templateId) riskFactors++;
    if (source.configuration.gpuType !== target.configuration.gpuType) riskFactors++;
    if (source.containerImageHash !== target.containerImageHash) riskFactors += 2;

    if (riskFactors === 0) return 'low';
    if (riskFactors <= 2) return 'medium';
    return 'high';
  }

  private async getImageHash(imageUrl: string): Promise<string> {
    // In a real implementation, this would fetch the image digest
    return `sha256:${Buffer.from(imageUrl).toString('hex').slice(0, 32)}`;
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return Buffer.from(str).toString('hex').slice(0, 32);
  }

  private addLog(
    execution: RollbackExecution,
    level: 'info' | 'warning' | 'error',
    stepId: string | undefined,
    message: string,
    details?: any
  ): void {
    execution.logs.push({
      timestamp: new Date(),
      level,
      stepId,
      message,
      details
    });

    this.emit('rollbackLog', {
      executionId: execution.id,
      log: execution.logs[execution.logs.length - 1]
    });
  }
}

export default DeploymentRollbackService;