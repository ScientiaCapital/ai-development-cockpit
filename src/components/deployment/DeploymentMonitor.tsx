'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDeployment } from '@/hooks/useDeployment'
import { DeploymentResult, DeploymentStatus } from '@/types/deployment'
import {
  PlayIcon,
  StopIcon,
  TrashIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ServerIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

export interface DeploymentMonitorProps {
  className?: string
  onDeploymentSelect?: (deployment: DeploymentResult) => void
  showActions?: boolean
  refreshInterval?: number
}

interface MetricCard {
  label: string
  value: string | number
  icon: React.ReactNode
  status?: 'healthy' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
}

export function DeploymentMonitor({
  className = '',
  onDeploymentSelect,
  showActions = true,
  refreshInterval = 30000
}: DeploymentMonitorProps) {
  const {
    deployments,
    loading,
    error,
    stats,
    refreshDeployments,
    stopDeployment,
    restartDeployment,
    terminateDeployment
  } = useDeployment({ autoRefresh: true, refreshInterval })

  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentResult | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(refreshDeployments, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshDeployments, refreshInterval])

  const handleDeploymentSelect = useCallback((deployment: DeploymentResult) => {
    setSelectedDeployment(deployment)
    onDeploymentSelect?.(deployment)
  }, [onDeploymentSelect])

  const handleAction = useCallback(async (
    action: 'stop' | 'restart' | 'terminate',
    deploymentId: string
  ) => {
    setActionLoading(prev => ({ ...prev, [deploymentId]: true }))

    try {
      let success = false
      switch (action) {
        case 'stop':
          success = await stopDeployment(deploymentId)
          break
        case 'restart':
          success = await restartDeployment(deploymentId)
          break
        case 'terminate':
          success = await terminateDeployment(deploymentId)
          break
      }

      if (success) {
        await refreshDeployments()
      }
    } catch (err) {
      console.error(`Failed to ${action} deployment:`, err)
    } finally {
      setActionLoading(prev => ({ ...prev, [deploymentId]: false }))
    }
  }, [stopDeployment, restartDeployment, terminateDeployment, refreshDeployments])

  const getStatusColor = (status: DeploymentStatus): string => {
    switch (status) {
      case 'running': return 'text-green-400 border-green-400'
      case 'creating': return 'text-yellow-400 border-yellow-400'
      case 'stopped': return 'text-gray-400 border-gray-400'
      case 'failed': return 'text-red-400 border-red-400'
      case 'terminated': return 'text-gray-500 border-gray-500'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getOverallMetrics = (): MetricCard[] => {
    const totalRunning = deployments.filter(d => d.status === 'running').length
    const totalCost = deployments.reduce((sum, d) => sum + d.cost.hourlyRate, 0)
    const avgUptime = deployments.length > 0
      ? deployments.reduce((sum, d) => sum + d.monitoring.performance.uptime, 0) / deployments.length
      : 0

    return [
      {
        label: 'Active Deployments',
        value: totalRunning,
        icon: <ServerIcon className="w-5 h-5" />,
        status: totalRunning > 0 ? 'healthy' : 'warning'
      },
      {
        label: 'Hourly Cost',
        value: formatCurrency(totalCost),
        icon: <BanknotesIcon className="w-5 h-5" />,
        status: totalCost > 10 ? 'warning' : 'healthy'
      },
      {
        label: 'Avg Uptime',
        value: `${avgUptime.toFixed(1)}%`,
        icon: <ChartBarIcon className="w-5 h-5" />,
        status: avgUptime > 99 ? 'healthy' : avgUptime > 95 ? 'warning' : 'critical'
      },
      {
        label: 'Total Requests',
        value: deployments.reduce((sum, d) => sum + d.monitoring.performance.requestsPerSecond * 3600, 0).toLocaleString(),
        icon: <CpuChipIcon className="w-5 h-5" />
      }
    ]
  }

  if (loading && deployments.length === 0) {
    return (
      <div className={`${className}`}>
        <Card className="bg-gray-900/80 border-green-500/30 p-6">
          <div className="flex items-center justify-center space-x-2">
            <ArrowPathIcon className="w-5 h-5 text-green-400 animate-spin" />
            <span className="text-green-400 font-mono">Loading deployments...</span>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card className="bg-gray-900/80 border-red-500/30 p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-mono">Error: {error}</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {getOverallMetrics().map((metric, index) => (
          <Card key={index} className="bg-gray-900/80 border-green-500/30 p-4">
            <div className="flex items-center space-x-3">
              <div className={`${getHealthColor(metric.status || 'healthy')}`}>
                {metric.icon}
              </div>
              <div>
                <p className="text-gray-400 text-sm font-mono">{metric.label}</p>
                <p className={`text-lg font-mono font-bold ${getHealthColor(metric.status || 'healthy')}`}>
                  {metric.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Deployments List */}
      <Card className="bg-gray-900/80 border-green-500/30">
        <div className="p-4 border-b border-green-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-mono text-green-400">Active Deployments</h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={refreshDeployments}
                disabled={loading}
                className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-500/20 px-3 py-1 text-sm"
              >
                {loading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowPathIcon className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {deployments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-mono">
              No deployments found. Deploy a model to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <div
                  key={deployment.deploymentId}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDeployment?.deploymentId === deployment.deploymentId
                      ? 'border-green-400 bg-green-500/10'
                      : 'border-gray-600 hover:border-green-500/50 bg-gray-800/50'
                  }`}
                  onClick={() => handleDeploymentSelect(deployment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center space-x-3">
                        <Badge className={`font-mono ${getStatusColor(deployment.status)}`}>
                          {deployment.status.toUpperCase()}
                        </Badge>
                        <h4 className="text-white font-mono font-semibold">
                          {deployment.model.id}
                        </h4>
                        <span className="text-gray-400 font-mono text-sm">
                          ID: {deployment.deploymentId.slice(0, 8)}...
                        </span>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-400 font-mono">GPU</p>
                          <p className="text-white font-mono">
                            {deployment.configuration.gpuType} × {deployment.configuration.gpuCount}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-gray-400 font-mono">Workers</p>
                          <p className="text-white font-mono">
                            {deployment.monitoring.workers.ready}/{deployment.monitoring.workers.total}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-gray-400 font-mono">Cost/Hour</p>
                          <p className="text-green-400 font-mono font-semibold">
                            {formatCurrency(deployment.cost.hourlyRate)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-gray-400 font-mono">Uptime</p>
                          <p className="text-white font-mono">
                            {formatUptime(deployment.monitoring.performance.uptime)}
                          </p>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-mono">CPU Usage</span>
                            <span className="text-white font-mono">
                              {deployment.monitoring.resources.cpuUsage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={deployment.monitoring.resources.cpuUsage}
                            className="h-2 bg-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-mono">GPU Usage</span>
                            <span className="text-white font-mono">
                              {deployment.monitoring.resources.gpuUsage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={deployment.monitoring.resources.gpuUsage}
                            className="h-2 bg-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-mono">Memory</span>
                            <span className="text-white font-mono">
                              {deployment.monitoring.resources.memoryUsage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={deployment.monitoring.resources.memoryUsage}
                            className="h-2 bg-gray-700"
                          />
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 font-mono">Avg Response:</span>
                          <span className="text-white font-mono">
                            {deployment.monitoring.performance.avgResponseTime}ms
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <ChartBarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 font-mono">RPS:</span>
                          <span className="text-white font-mono">
                            {deployment.monitoring.performance.requestsPerSecond.toFixed(1)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 font-mono">Error Rate:</span>
                          <span className={`font-mono ${
                            deployment.monitoring.performance.errorRate > 5 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {deployment.monitoring.performance.errorRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                      <div className="flex flex-col space-y-2 ml-4">
                        {deployment.status === 'running' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction('stop', deployment.deploymentId)
                            }}
                            disabled={actionLoading[deployment.deploymentId]}
                            className="bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 px-3 py-1 text-sm"
                          >
                            <StopIcon className="w-4 h-4" />
                          </Button>
                        )}

                        {deployment.status === 'stopped' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction('restart', deployment.deploymentId)
                            }}
                            disabled={actionLoading[deployment.deploymentId]}
                            className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-500/20 px-3 py-1 text-sm"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAction('terminate', deployment.deploymentId)
                          }}
                          disabled={actionLoading[deployment.deploymentId]}
                          className="bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-3 py-1 text-sm"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default DeploymentMonitor