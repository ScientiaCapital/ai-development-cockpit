'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useHuggingFaceAuth } from '@/contexts/HuggingFaceAuth'
import {
  DeploymentRequest,
  DeploymentResult,
  DeploymentStatus,
  DeploymentAction,
  DeploymentUpdate,
  DeploymentFilter,
  DeploymentStats,
  DeploymentLog
} from '@/types/deployment'
import { ModelMetadata } from '@/types/models'
import RunPodDeploymentService from '@/services/runpod/deployment.service'
import { generateRunPodConfig, selectOptimalTemplate, estimateDeploymentCost } from '@/services/runpod/templates'

export interface UseDeploymentOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  realTimeUpdates?: boolean
}

export interface UseDeploymentReturn {
  // State
  deployments: DeploymentResult[]
  loading: boolean
  error: string | null
  stats: DeploymentStats | null

  // Current deployment
  currentDeployment: DeploymentResult | null
  deploymentLogs: DeploymentLog[]

  // Actions
  deployModel: (request: DeploymentRequest) => Promise<DeploymentResult | null>
  stopDeployment: (deploymentId: string) => Promise<boolean>
  restartDeployment: (deploymentId: string) => Promise<boolean>
  scaleDeployment: (deploymentId: string, replicas: number) => Promise<boolean>
  terminateDeployment: (deploymentId: string) => Promise<boolean>

  // Data management
  refreshDeployments: () => Promise<void>
  getDeployment: (deploymentId: string) => Promise<DeploymentResult | null>
  getDeploymentLogs: (deploymentId: string) => Promise<DeploymentLog[]>

  // Utilities
  estimateCost: (model: ModelMetadata) => { hourly: number; monthly: number; template: string }
  selectTemplate: (model: ModelMetadata) => string
  validateDeployment: (request: DeploymentRequest) => { valid: boolean; errors: string[] }
}

export function useDeployment(options: UseDeploymentOptions = {}): UseDeploymentReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    realTimeUpdates = false
  } = options

  const { currentOrganization, isAuthenticated } = useHuggingFaceAuth()

  // State
  const [deployments, setDeployments] = useState<DeploymentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DeploymentStats | null>(null)
  const [currentDeployment, setCurrentDeployment] = useState<DeploymentResult | null>(null)
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([])

  // Refs
  const refreshTimerRef = useRef<NodeJS.Timeout>()
  const deploymentServiceRef = useRef<RunPodDeploymentService>()
  const wsRef = useRef<WebSocket>()

  // Initialize deployment service
  useEffect(() => {
    if (isAuthenticated) {
      try {
        deploymentServiceRef.current = new RunPodDeploymentService()
      } catch (err) {
        console.error('Failed to initialize RunPod service:', err)
        setError('RunPod service initialization failed. Check API key configuration.')
      }
    }
  }, [isAuthenticated])

  // Auto-refresh deployments
  useEffect(() => {
    if (autoRefresh && isAuthenticated && deploymentServiceRef.current) {
      refreshDeployments()

      refreshTimerRef.current = setInterval(() => {
        refreshDeployments()
      }, refreshInterval)
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, isAuthenticated, currentOrganization])

  // Real-time updates via WebSocket (if enabled)
  useEffect(() => {
    if (realTimeUpdates && isAuthenticated) {
      // Note: This would require a WebSocket endpoint on the backend
      // For now, we'll use polling, but this shows the structure
      console.log('Real-time updates would be initialized here')
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [realTimeUpdates, isAuthenticated])

  // Deploy a model
  const deployModel = useCallback(async (request: DeploymentRequest): Promise<DeploymentResult | null> => {
    if (!deploymentServiceRef.current) {
      setError('Deployment service not initialized')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🚀 Starting model deployment:', request.modelId)

      // Validate request
      const validation = validateDeployment(request)
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Select optimal template if not provided
      const templateId = request.templateId || selectTemplate({
        id: request.modelId,
        modelType: 'text-generation',
        size: '7B' // This would be extracted from model metadata
      } as ModelMetadata)

      // Generate RunPod configuration
      const runpodConfig = generateRunPodConfig({
        templateId,
        modelId: request.modelId,
        scaling: request.scaling
      })

      // Deploy to RunPod
      const deployResult = await deploymentServiceRef.current.deployModel({
        modelId: request.modelId,
        containerImage: runpodConfig.image,
        minWorkers: request.scaling?.minReplicas || 0,
        maxWorkers: request.scaling?.maxReplicas || 3,
        timeout: 300,
        envVars: runpodConfig.env
      })

      // Create comprehensive deployment result
      const deployment: DeploymentResult = {
        deploymentId: `dep_${Date.now()}`,
        endpointId: deployResult.endpointId,
        endpointUrl: deployResult.endpointUrl,
        status: deployResult.status as DeploymentStatus,
        model: {
          id: request.modelId,
          organization: request.organization,
          // Other model fields would be populated from model metadata
        } as ModelMetadata,
        configuration: {
          templateId,
          containerImage: runpodConfig.image,
          gpuType: 'NVIDIA A40', // Would be determined by template
          gpuCount: 1,
          memoryGB: 48,
          scaling: request.scaling || { minReplicas: 0, maxReplicas: 3, autoScale: true },
          envVars: runpodConfig.env,
          ports: runpodConfig.ports,
          healthCheck: {
            path: '/health',
            interval: 30,
            timeout: 10,
            retries: 3,
            initialDelay: 60
          }
        },
        cost: {
          hourlyRate: deployResult.estimatedCostPerHour,
          dailyEstimate: deployResult.estimatedCostPerHour * 24,
          monthlyEstimate: deployResult.estimatedCostPerHour * 24 * 30,
          actualSpend: 0,
          currency: 'USD',
          breakdown: {
            compute: deployResult.estimatedCostPerHour * 0.8,
            storage: deployResult.estimatedCostPerHour * 0.1,
            bandwidth: deployResult.estimatedCostPerHour * 0.1,
            other: 0
          }
        },
        monitoring: {
          status: deployResult.status as DeploymentStatus,
          health: 'unknown',
          workers: { total: 0, ready: 0, busy: 0, idle: 0, failed: 0 },
          performance: {
            requestsPerSecond: 0,
            avgResponseTime: 0,
            p95ResponseTime: 0,
            errorRate: 0,
            uptime: 0
          },
          resources: {
            cpuUsage: 0,
            memoryUsage: 0,
            gpuUsage: 0,
            diskUsage: 0
          },
          lastActivity: new Date().toISOString(),
          lastHealthCheck: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        estimatedReadyTime: 300 // 5 minutes
      }

      // Add to deployments list
      setDeployments(prev => [deployment, ...prev])
      setCurrentDeployment(deployment)

      console.log('✅ Deployment created successfully:', deployment.deploymentId)
      return deployment

    } catch (err) {
      console.error('❌ Deployment failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Deployment failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [currentOrganization])

  // Stop deployment
  const stopDeployment = useCallback(async (deploymentId: string): Promise<boolean> => {
    if (!deploymentServiceRef.current) return false

    try {
      const deployment = deployments.find(d => d.deploymentId === deploymentId)
      if (!deployment) return false

      const success = await deploymentServiceRef.current.stopEndpoint(deployment.endpointId)

      if (success) {
        setDeployments(prev => prev.map(d =>
          d.deploymentId === deploymentId
            ? { ...d, status: 'stopped', monitoring: { ...d.monitoring, status: 'stopped' } }
            : d
        ))
      }

      return success
    } catch (err) {
      console.error('Failed to stop deployment:', err)
      return false
    }
  }, [deployments])

  // Restart deployment
  const restartDeployment = useCallback(async (deploymentId: string): Promise<boolean> => {
    // This would restart a stopped deployment
    console.log('Restarting deployment:', deploymentId)
    return true
  }, [])

  // Scale deployment
  const scaleDeployment = useCallback(async (deploymentId: string, replicas: number): Promise<boolean> => {
    console.log('Scaling deployment:', deploymentId, 'to', replicas, 'replicas')
    return true
  }, [])

  // Terminate deployment
  const terminateDeployment = useCallback(async (deploymentId: string): Promise<boolean> => {
    const success = await stopDeployment(deploymentId)
    if (success) {
      setDeployments(prev => prev.filter(d => d.deploymentId !== deploymentId))
      if (currentDeployment?.deploymentId === deploymentId) {
        setCurrentDeployment(null)
      }
    }
    return success
  }, [stopDeployment, currentDeployment])

  // Refresh deployments list
  const refreshDeployments = useCallback(async () => {
    if (!deploymentServiceRef.current) return

    try {
      const endpoints = await deploymentServiceRef.current.listActiveEndpoints()

      // Convert endpoints to deployment format
      const updatedDeployments = endpoints.map(endpoint => {
        const existing = deployments.find(d => d.endpointId === endpoint.id)

        return existing ? {
          ...existing,
          monitoring: {
            ...existing.monitoring,
            status: endpoint.status as DeploymentStatus,
            workers: {
              ...existing.monitoring.workers,
              total: endpoint.workers
            }
          },
          cost: {
            ...existing.cost,
            actualSpend: endpoint.cost
          }
        } : existing
      }).filter(Boolean) as DeploymentResult[]

      setDeployments(updatedDeployments)

    } catch (err) {
      console.error('Failed to refresh deployments:', err)
    }
  }, [deployments])

  // Get specific deployment
  const getDeployment = useCallback(async (deploymentId: string): Promise<DeploymentResult | null> => {
    const deployment = deployments.find(d => d.deploymentId === deploymentId)
    if (deployment) {
      setCurrentDeployment(deployment)
      return deployment
    }
    return null
  }, [deployments])

  // Get deployment logs
  const getDeploymentLogs = useCallback(async (deploymentId: string): Promise<DeploymentLog[]> => {
    // This would fetch logs from the RunPod API or logging service
    const mockLogs: DeploymentLog[] = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Deployment started',
        source: 'system',
        deploymentId
      }
    ]

    setDeploymentLogs(mockLogs)
    return mockLogs
  }, [])

  // Estimate deployment cost
  const estimateCost = useCallback((model: ModelMetadata) => {
    const template = selectTemplate(model)
    const cost = estimateDeploymentCost(template)

    return {
      hourly: cost.hourly,
      monthly: cost.monthly,
      template
    }
  }, [])

  // Select optimal template
  const selectTemplate = useCallback((model: ModelMetadata): string => {
    const size = parseFloat(model.size || '7') // Extract number from size like "7B"
    return selectOptimalTemplate(model.id, size, model.modelType)
  }, [])

  // Validate deployment request
  const validateDeployment = useCallback((request: DeploymentRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!request.modelId) {
      errors.push('Model ID is required')
    }

    if (!request.organization) {
      errors.push('Organization is required')
    }

    if (request.scaling) {
      if (request.scaling.minReplicas < 0) {
        errors.push('Minimum replicas cannot be negative')
      }
      if (request.scaling.maxReplicas < request.scaling.minReplicas) {
        errors.push('Maximum replicas must be greater than or equal to minimum replicas')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }, [])

  return {
    // State
    deployments,
    loading,
    error,
    stats,
    currentDeployment,
    deploymentLogs,

    // Actions
    deployModel,
    stopDeployment,
    restartDeployment,
    scaleDeployment,
    terminateDeployment,

    // Data management
    refreshDeployments,
    getDeployment,
    getDeploymentLogs,

    // Utilities
    estimateCost,
    selectTemplate,
    validateDeployment
  }
}

export default useDeployment