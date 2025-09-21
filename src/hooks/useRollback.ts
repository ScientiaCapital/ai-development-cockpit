/**
 * React Hook for Deployment Rollback Management
 * Provides comprehensive rollback functionality with snapshot management and execution monitoring
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { RunPodClient } from '@/services/runpod/client';
import { DeploymentMonitoringService } from '@/services/runpod/monitoring.service';
import { getErrorMessage } from '@/utils/errorGuards';
import {
  DeploymentRollbackService,
  DeploymentSnapshot,
  RollbackPlan,
  RollbackExecution,
  PreRollbackCheck
} from '@/services/runpod/rollback.service';

export interface UseRollbackConfig {
  clientConfig: {
    apiKey: string;
    baseUrl?: string;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface RollbackState {
  snapshots: Map<string, DeploymentSnapshot[]>;
  plans: Map<string, RollbackPlan>;
  executions: Map<string, RollbackExecution>;
  preChecks: Map<string, PreRollbackCheck[]>;
  loading: {
    snapshots: boolean;
    creating: boolean;
    planning: boolean;
    executing: boolean;
    checking: boolean;
  };
  error: string | null;
}

export interface UseRollbackReturn {
  // State
  state: RollbackState;

  // Snapshot Management
  createSnapshot: (deploymentId: string, metadata: {
    createdBy: string;
    description?: string;
    tags?: string[];
  }) => Promise<DeploymentSnapshot | null>;
  getSnapshots: (deploymentId: string) => DeploymentSnapshot[];
  deleteSnapshot: (snapshotId: string) => Promise<boolean>;

  // Rollback Planning
  createRollbackPlan: (sourceSnapshotId: string, targetSnapshotId: string) => Promise<RollbackPlan | null>;
  getRollbackPlan: (planId: string) => RollbackPlan | null;

  // Pre-Rollback Checks
  executePreChecks: (planId: string) => Promise<PreRollbackCheck[]>;
  getPreChecks: (planId: string) => PreRollbackCheck[];

  // Rollback Execution
  executeRollback: (planId: string) => Promise<RollbackExecution | null>;
  cancelRollback: (executionId: string) => Promise<boolean>;
  getRollbackExecution: (executionId: string) => RollbackExecution | null;

  // Utilities
  refresh: () => Promise<void>;
  cleanup: () => void;
}

export function useRollback(config: UseRollbackConfig): UseRollbackReturn {
  const [state, setState] = useState<RollbackState>({
    snapshots: new Map(),
    plans: new Map(),
    executions: new Map(),
    preChecks: new Map(),
    loading: {
      snapshots: false,
      creating: false,
      planning: false,
      executing: false,
      checking: false
    },
    error: null
  });

  // Service instances
  const clientRef = useRef<RunPodClient | null>(null);
  const monitoringRef = useRef<DeploymentMonitoringService | null>(null);
  const rollbackRef = useRef<DeploymentRollbackService | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  useEffect(() => {
    try {
      clientRef.current = new RunPodClient(config.clientConfig);
      monitoringRef.current = new DeploymentMonitoringService(clientRef.current);
      rollbackRef.current = new DeploymentRollbackService(clientRef.current, monitoringRef.current);

      // Set up event listeners
      const rollbackService = rollbackRef.current;

      const handleSnapshotCreated = ({ deploymentId, snapshot }: any) => {
        setState(prev => {
          const newSnapshots = new Map(prev.snapshots);
          const deploymentSnapshots = newSnapshots.get(deploymentId) || [];
          deploymentSnapshots.push(snapshot);
          newSnapshots.set(deploymentId, deploymentSnapshots);

          return {
            ...prev,
            snapshots: newSnapshots,
            loading: { ...prev.loading, creating: false }
          };
        });
      };

      const handleRollbackStarted = ({ execution }: any) => {
        setState(prev => ({
          ...prev,
          executions: new Map(prev.executions).set(execution.id, execution),
          loading: { ...prev.loading, executing: true }
        }));
      };

      const handleRollbackCompleted = ({ execution }: any) => {
        setState(prev => ({
          ...prev,
          executions: new Map(prev.executions).set(execution.id, execution),
          loading: { ...prev.loading, executing: false }
        }));
      };

      const handleRollbackFailed = ({ execution, error }: any) => {
        setState(prev => ({
          ...prev,
          executions: new Map(prev.executions).set(execution.id, execution),
          loading: { ...prev.loading, executing: false },
          error: `Rollback failed: ${error}`
        }));
      };

      const handlePreCheckCompleted = ({ planId, check }: any) => {
        setState(prev => {
          const newChecks = new Map(prev.preChecks);
          const planChecks = newChecks.get(planId) || [];
          const existingIndex = planChecks.findIndex(c => c.id === check.id);

          if (existingIndex >= 0) {
            planChecks[existingIndex] = check;
          } else {
            planChecks.push(check);
          }

          newChecks.set(planId, planChecks);

          return {
            ...prev,
            preChecks: newChecks
          };
        });
      };

      rollbackService.on('snapshotCreated', handleSnapshotCreated);
      rollbackService.on('rollbackStarted', handleRollbackStarted);
      rollbackService.on('rollbackCompleted', handleRollbackCompleted);
      rollbackService.on('rollbackFailed', handleRollbackFailed);
      rollbackService.on('preCheckCompleted', handlePreCheckCompleted);

      return () => {
        rollbackService.off('snapshotCreated', handleSnapshotCreated);
        rollbackService.off('rollbackStarted', handleRollbackStarted);
        rollbackService.off('rollbackCompleted', handleRollbackCompleted);
        rollbackService.off('rollbackFailed', handleRollbackFailed);
        rollbackService.off('preCheckCompleted', handlePreCheckCompleted);
      };

    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        error: `Failed to initialize rollback service: ${getErrorMessage(error)}`
      }));
    }
  }, [config.clientConfig]);

  // Auto-refresh functionality
  useEffect(() => {
    if (config.autoRefresh && config.refreshInterval) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, config.refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [config.autoRefresh, config.refreshInterval]);

  // Create snapshot
  const createSnapshot = useCallback(async (
    deploymentId: string,
    metadata: {
      createdBy: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<DeploymentSnapshot | null> => {
    if (!rollbackRef.current) return null;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, creating: true },
      error: null
    }));

    try {
      const snapshot = await rollbackRef.current.createSnapshot(deploymentId, metadata);
      return snapshot;
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, creating: false },
        error: `Failed to create snapshot: ${getErrorMessage(error)}`
      }));
      return null;
    }
  }, []);

  // Get snapshots for deployment
  const getSnapshots = useCallback((deploymentId: string): DeploymentSnapshot[] => {
    return state.snapshots.get(deploymentId) || [];
  }, [state.snapshots]);

  // Delete snapshot (removes from local state)
  const deleteSnapshot = useCallback(async (snapshotId: string): Promise<boolean> => {
    setState(prev => {
      const newSnapshots = new Map(prev.snapshots);

      for (const [deploymentId, snapshots] of newSnapshots) {
        const filteredSnapshots = snapshots.filter(s => s.id !== snapshotId);
        if (filteredSnapshots.length !== snapshots.length) {
          newSnapshots.set(deploymentId, filteredSnapshots);
          break;
        }
      }

      return {
        ...prev,
        snapshots: newSnapshots
      };
    });

    return true;
  }, []);

  // Create rollback plan
  const createRollbackPlan = useCallback(async (
    sourceSnapshotId: string,
    targetSnapshotId: string
  ): Promise<RollbackPlan | null> => {
    if (!rollbackRef.current) return null;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, planning: true },
      error: null
    }));

    try {
      const plan = await rollbackRef.current.createRollbackPlan(sourceSnapshotId, targetSnapshotId);

      setState(prev => ({
        ...prev,
        plans: new Map(prev.plans).set(plan.id, plan),
        loading: { ...prev.loading, planning: false }
      }));

      return plan;
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, planning: false },
        error: `Failed to create rollback plan: ${getErrorMessage(error)}`
      }));
      return null;
    }
  }, []);

  // Get rollback plan
  const getRollbackPlan = useCallback((planId: string): RollbackPlan | null => {
    return state.plans.get(planId) || null;
  }, [state.plans]);

  // Execute pre-rollback checks
  const executePreChecks = useCallback(async (planId: string): Promise<PreRollbackCheck[]> => {
    if (!rollbackRef.current) return [];

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, checking: true },
      error: null
    }));

    try {
      const checks = await rollbackRef.current.executePreRollbackChecks(planId);

      setState(prev => ({
        ...prev,
        preChecks: new Map(prev.preChecks).set(planId, checks),
        loading: { ...prev.loading, checking: false }
      }));

      return checks;
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, checking: false },
        error: `Failed to execute pre-checks: ${getErrorMessage(error)}`
      }));
      return [];
    }
  }, []);

  // Get pre-checks for plan
  const getPreChecks = useCallback((planId: string): PreRollbackCheck[] => {
    return state.preChecks.get(planId) || [];
  }, [state.preChecks]);

  // Execute rollback
  const executeRollback = useCallback(async (planId: string): Promise<RollbackExecution | null> => {
    if (!rollbackRef.current) return null;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, executing: true },
      error: null
    }));

    try {
      const execution = await rollbackRef.current.executeRollback(planId);
      return execution;
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, executing: false },
        error: `Failed to execute rollback: ${getErrorMessage(error)}`
      }));
      return null;
    }
  }, []);

  // Cancel rollback
  const cancelRollback = useCallback(async (executionId: string): Promise<boolean> => {
    if (!rollbackRef.current) return false;

    try {
      const success = await rollbackRef.current.cancelRollback(executionId);

      if (success) {
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, executing: false }
        }));
      }

      return success;
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        error: `Failed to cancel rollback: ${getErrorMessage(error)}`
      }));
      return false;
    }
  }, []);

  // Get rollback execution
  const getRollbackExecution = useCallback((executionId: string): RollbackExecution | null => {
    return state.executions.get(executionId) || null;
  }, [state.executions]);

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, snapshots: true },
      error: null
    }));

    try {
      // In a real implementation, you might refresh snapshots from storage
      // For now, just clear the loading state
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, snapshots: false }
      }));
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, snapshots: false },
        error: `Failed to refresh: ${getErrorMessage(error)}`
      }));
    }
  }, []);

  // Cleanup resources
  const cleanup = useCallback((): void => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.destroy();
      clientRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    state,
    createSnapshot,
    getSnapshots,
    deleteSnapshot,
    createRollbackPlan,
    getRollbackPlan,
    executePreChecks,
    getPreChecks,
    executeRollback,
    cancelRollback,
    getRollbackExecution,
    refresh,
    cleanup
  };
}

export default useRollback;