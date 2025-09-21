/**
 * Monitoring Data React Hook
 * Provides real-time monitoring data for dashboard components
 * Supports organization-specific data filtering and automatic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Organization } from '@/services/monitoring/prometheus.service';
import { MonitoringDashboardData, SystemHealth } from '@/services/monitoring/integration.service';

// Hook configuration interface
export interface UseMonitoringConfig {
  organization: Organization;
  refreshInterval?: number; // milliseconds
  enableRealTime?: boolean;
  alertsLimit?: number;
}

// Hook return interface
export interface MonitoringHookReturn {
  // Data
  dashboardData: MonitoringDashboardData | null;
  systemHealth: SystemHealth | null;
  alerts: any[];
  alertSummary: any;

  // State
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  refresh: () => Promise<void>;
  recordInference: (inference: InferenceRecord) => Promise<void>;
  createAlert: (alert: AlertCreate) => Promise<void>;
  resolveAlert: (alertId: string, resolution?: string) => Promise<void>;

  // Real-time controls
  startRealTime: () => void;
  stopRealTime: () => void;
  isRealTimeActive: boolean;
}

// Inference record interface
export interface InferenceRecord {
  modelName: string;
  duration: number;
  cost: number;
  inputTokens?: number;
  outputTokens?: number;
  success?: boolean;
  errorCode?: string;
}

// Alert creation interface
export interface AlertCreate {
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  endpointId?: string;
  modelName?: string;
  metadata?: Record<string, any>;
}

/**
 * Custom hook for monitoring data management
 */
export function useMonitoring(config: UseMonitoringConfig): MonitoringHookReturn {
  const {
    organization,
    refreshInterval = 30000, // 30 seconds default
    enableRealTime = true,
    alertsLimit = 50,
  } = config;

  // State
  const [dashboardData, setDashboardData] = useState<MonitoringDashboardData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertSummary, setAlertSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch dashboard data from API
   */
  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `/api/monitoring/dashboard?organization=${organization}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch dashboard data:', err);
    }
  }, [organization]);

  /**
   * Fetch system health from API
   */
  const fetchSystemHealth = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/health', { signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch system health: ${response.statusText}`);
      }

      const healthData = await response.json();

      // Transform health data to match SystemHealth interface
      const systemHealthData: SystemHealth = {
        overall: healthData.services.monitoring === 'healthy' ? 'healthy' : 'warning',
        services: {
          prometheus: healthData.monitoring?.prometheus || false,
          logging: healthData.monitoring?.logging || false,
          tracing: healthData.monitoring?.tracing || false,
          runpodMonitoring: healthData.services.external === 'healthy',
        },
        metrics: {
          responseTime: 0, // Would need to calculate from performance data
          errorRate: 0,
          throughput: 0,
        },
      };

      setSystemHealth(systemHealthData);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch system health:', err);
    }
  }, []);

  /**
   * Fetch alerts from API
   */
  const fetchAlerts = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `/api/monitoring/alerts?organization=${organization}&status=active&limit=${alertsLimit}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error('Failed to fetch alerts:', err);
    }
  }, [organization, alertsLimit]);

  /**
   * Fetch alert summary from API
   */
  const fetchAlertSummary = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `/api/monitoring/alerts/summary?organization=${organization}`,
        { signal, method: 'HEAD' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch alert summary: ${response.statusText}`);
      }

      const data = await response.json();
      setAlertSummary(data.summary);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error('Failed to fetch alert summary:', err);
    }
  }, [organization]);

  /**
   * Refresh all monitoring data
   */
  const refresh = useCallback(async () => {
    if (loading) return; // Prevent concurrent refreshes

    setLoading(true);

    // Create new abort controller for this refresh
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      await Promise.all([
        fetchDashboardData(signal),
        fetchSystemHealth(signal),
        fetchAlerts(signal),
        fetchAlertSummary(signal),
      ]);

      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error('Failed to refresh monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, fetchDashboardData, fetchSystemHealth, fetchAlerts, fetchAlertSummary]);

  /**
   * Record model inference
   */
  const recordInference = useCallback(async (inference: InferenceRecord) => {
    try {
      const response = await fetch('/api/monitoring/dashboard/inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...inference,
          organization,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to record inference: ${response.statusText}`);
      }

      // Refresh dashboard data to show updated metrics
      await fetchDashboardData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to record inference:', err);
      throw new Error(errorMessage);
    }
  }, [organization, fetchDashboardData]);

  /**
   * Create new alert
   */
  const createAlert = useCallback(async (alert: AlertCreate) => {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...alert,
          organization,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create alert: ${response.statusText}`);
      }

      // Refresh alerts to show new alert
      await fetchAlerts();
      await fetchAlertSummary();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to create alert:', err);
      throw new Error(errorMessage);
    }
  }, [organization, fetchAlerts, fetchAlertSummary]);

  /**
   * Resolve an alert
   */
  const resolveAlert = useCallback(async (alertId: string, resolution?: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolvedBy: 'user', // Could be enhanced to include actual user info
          resolution,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to resolve alert: ${response.statusText}`);
      }

      // Refresh alerts to show updated status
      await fetchAlerts();
      await fetchAlertSummary();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to resolve alert:', err);
      throw new Error(errorMessage);
    }
  }, [fetchAlerts, fetchAlertSummary]);

  /**
   * Start real-time updates
   */
  const startRealTime = useCallback(() => {
    if (isRealTimeActive || !enableRealTime) return;

    setIsRealTimeActive(true);
    intervalRef.current = setInterval(refresh, refreshInterval);
  }, [isRealTimeActive, enableRealTime, refresh, refreshInterval]);

  /**
   * Stop real-time updates
   */
  const stopRealTime = useCallback(() => {
    if (!isRealTimeActive) return;

    setIsRealTimeActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRealTimeActive]);

  // Initial data load
  useEffect(() => {
    refresh();
  }, [organization]); // Only refresh when organization changes

  // Auto-start real-time updates if enabled
  useEffect(() => {
    if (enableRealTime) {
      startRealTime();
    }

    return () => {
      stopRealTime();
    };
  }, [enableRealTime, startRealTime, stopRealTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTime();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopRealTime]);

  return {
    // Data
    dashboardData,
    systemHealth,
    alerts,
    alertSummary,

    // State
    loading,
    error,
    lastUpdated,

    // Actions
    refresh,
    recordInference,
    createAlert,
    resolveAlert,

    // Real-time controls
    startRealTime,
    stopRealTime,
    isRealTimeActive,
  };
}

export default useMonitoring;