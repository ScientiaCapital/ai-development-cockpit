'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DeploymentResult } from '@/types/deployment'
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CodeBracketIcon,
  ServerIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'

export interface RollbackControlProps {
  deployment: DeploymentResult
  onRollback?: (snapshot: DeploymentSnapshot) => Promise<boolean>
  onCreateSnapshot?: (deployment: DeploymentResult) => Promise<DeploymentSnapshot>
  className?: string
}

export interface DeploymentSnapshot {
  id: string
  deploymentId: string
  name: string
  description: string
  createdAt: string
  metadata: {
    modelId: string
    templateId: string
    gpuType: string
    gpuCount: number
    configuration: any
    version: string
    commit?: string
  }
  status: 'active' | 'archived' | 'deleted'
  size: number // bytes
  isAutomatic: boolean
  healthCheck: {
    passed: boolean
    tests: HealthTest[]
    score: number
  }
}

export interface HealthTest {
  name: string
  status: 'passed' | 'failed' | 'warning'
  message: string
  duration: number
  timestamp: string
}

export interface RollbackPlan {
  targetSnapshot: DeploymentSnapshot
  estimatedDowntime: number // seconds
  riskLevel: 'low' | 'medium' | 'high'
  checks: PreRollbackCheck[]
  steps: RollbackStep[]
  fallbackPlan: string
}

export interface PreRollbackCheck {
  name: string
  description: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  required: boolean
  message?: string
}

export interface RollbackStep {
  id: string
  name: string
  description: string
  estimatedDuration: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  canSkip: boolean
}

export function RollbackControl({
  deployment,
  onRollback,
  onCreateSnapshot,
  className = ''
}: RollbackControlProps) {
  const [snapshots, setSnapshots] = useState<DeploymentSnapshot[]>([])
  const [selectedSnapshot, setSelectedSnapshot] = useState<DeploymentSnapshot | null>(null)
  const [rollbackPlan, setRollbackPlan] = useState<RollbackPlan | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [rollbackProgress, setRollbackProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock snapshots for demonstration
  useEffect(() => {
    const mockSnapshots: DeploymentSnapshot[] = [
      {
        id: 'snap_1',
        deploymentId: deployment.deploymentId,
        name: 'Pre-deployment Baseline',
        description: 'Automatic snapshot before latest deployment',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: {
          modelId: deployment.model.id,
          templateId: 'vllm-7b',
          gpuType: deployment.configuration.gpuType,
          gpuCount: deployment.configuration.gpuCount,
          configuration: deployment.configuration,
          version: '1.0.0',
          commit: 'abc123'
        },
        status: 'active',
        size: 1024 * 1024 * 500, // 500MB
        isAutomatic: true,
        healthCheck: {
          passed: true,
          tests: [
            { name: 'Model Load', status: 'passed', message: 'Model loaded successfully', duration: 45, timestamp: new Date().toISOString() },
            { name: 'API Response', status: 'passed', message: 'API responding correctly', duration: 12, timestamp: new Date().toISOString() },
            { name: 'Memory Usage', status: 'passed', message: 'Memory usage within limits', duration: 5, timestamp: new Date().toISOString() }
          ],
          score: 95
        }
      },
      {
        id: 'snap_2',
        deploymentId: deployment.deploymentId,
        name: 'Stable Configuration v1.1',
        description: 'Manual snapshot after performance optimization',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          modelId: deployment.model.id,
          templateId: 'vllm-7b',
          gpuType: deployment.configuration.gpuType,
          gpuCount: deployment.configuration.gpuCount,
          configuration: deployment.configuration,
          version: '1.1.0',
          commit: 'def456'
        },
        status: 'active',
        size: 1024 * 1024 * 480, // 480MB
        isAutomatic: false,
        healthCheck: {
          passed: true,
          tests: [
            { name: 'Model Load', status: 'passed', message: 'Model loaded successfully', duration: 42, timestamp: new Date().toISOString() },
            { name: 'API Response', status: 'passed', message: 'API responding correctly', duration: 10, timestamp: new Date().toISOString() },
            { name: 'Performance', status: 'passed', message: 'Optimized performance confirmed', duration: 8, timestamp: new Date().toISOString() }
          ],
          score: 98
        }
      },
      {
        id: 'snap_3',
        deploymentId: deployment.deploymentId,
        name: 'Emergency Rollback Point',
        description: 'Created before experimental changes',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          modelId: deployment.model.id,
          templateId: 'vllm-7b',
          gpuType: deployment.configuration.gpuType,
          gpuCount: deployment.configuration.gpuCount,
          configuration: deployment.configuration,
          version: '1.0.5',
          commit: 'ghi789'
        },
        status: 'active',
        size: 1024 * 1024 * 520, // 520MB
        isAutomatic: false,
        healthCheck: {
          passed: true,
          tests: [
            { name: 'Model Load', status: 'passed', message: 'Model loaded successfully', duration: 48, timestamp: new Date().toISOString() },
            { name: 'API Response', status: 'warning', message: 'Some latency detected', duration: 15, timestamp: new Date().toISOString() },
            { name: 'Stability', status: 'passed', message: 'Stable over 7 days', duration: 3, timestamp: new Date().toISOString() }
          ],
          score: 88
        }
      }
    ]

    setSnapshots(mockSnapshots)
  }, [deployment])

  const handleCreateSnapshot = useCallback(async () => {
    if (!onCreateSnapshot) return

    setLoading(true)
    setError(null)

    try {
      const snapshot = await onCreateSnapshot(deployment)
      setSnapshots(prev => [snapshot, ...prev])
    } catch (err) {
      setError('Failed to create snapshot')
      console.error('Snapshot creation failed:', err)
    } finally {
      setLoading(false)
    }
  }, [deployment, onCreateSnapshot])

  const handleSnapshotSelect = useCallback((snapshot: DeploymentSnapshot) => {
    setSelectedSnapshot(snapshot)

    // Generate rollback plan
    const plan: RollbackPlan = {
      targetSnapshot: snapshot,
      estimatedDowntime: 120, // 2 minutes
      riskLevel: snapshot.healthCheck.score > 90 ? 'low' : snapshot.healthCheck.score > 80 ? 'medium' : 'high',
      checks: [
        {
          name: 'Health Check Validation',
          description: 'Verify target snapshot passed all health checks',
          status: snapshot.healthCheck.passed ? 'passed' : 'failed',
          required: true,
          message: snapshot.healthCheck.passed ? 'All health checks passed' : 'Some health checks failed'
        },
        {
          name: 'Resource Availability',
          description: 'Ensure required GPU resources are available',
          status: 'passed',
          required: true,
          message: 'Required resources available'
        },
        {
          name: 'Traffic Validation',
          description: 'Check current traffic levels for safe rollback',
          status: 'passed',
          required: false,
          message: 'Low traffic detected - safe to proceed'
        }
      ],
      steps: [
        {
          id: 'step_1',
          name: 'Traffic Drain',
          description: 'Gradually drain traffic from current deployment',
          estimatedDuration: 30,
          status: 'pending',
          progress: 0,
          canSkip: false
        },
        {
          id: 'step_2',
          name: 'Snapshot Restore',
          description: 'Restore configuration from selected snapshot',
          estimatedDuration: 60,
          status: 'pending',
          progress: 0,
          canSkip: false
        },
        {
          id: 'step_3',
          name: 'Health Verification',
          description: 'Verify deployment health after rollback',
          estimatedDuration: 20,
          status: 'pending',
          progress: 0,
          canSkip: false
        },
        {
          id: 'step_4',
          name: 'Traffic Restoration',
          description: 'Gradually restore traffic to rolled-back deployment',
          estimatedDuration: 10,
          status: 'pending',
          progress: 0,
          canSkip: false
        }
      ],
      fallbackPlan: 'If rollback fails, maintain current deployment and alert operations team'
    }

    setRollbackPlan(plan)
  }, [])

  const handleRollback = useCallback(async () => {
    if (!selectedSnapshot || !onRollback || !rollbackPlan) return

    setIsRollingBack(true)
    setRollbackProgress(0)
    setError(null)

    try {
      // Simulate rollback progress
      for (let i = 0; i < rollbackPlan.steps.length; i++) {
        const step = rollbackPlan.steps[i]
        step.status = 'running'
        setRollbackPlan({ ...rollbackPlan })

        // Simulate step execution
        for (let progress = 0; progress <= 100; progress += 10) {
          step.progress = progress
          setRollbackProgress((i * 100 + progress) / rollbackPlan.steps.length)
          setRollbackPlan({ ...rollbackPlan })
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        step.status = 'completed'
        setRollbackPlan({ ...rollbackPlan })
      }

      const success = await onRollback(selectedSnapshot)

      if (success) {
        setRollbackProgress(100)
      } else {
        throw new Error('Rollback operation failed')
      }
    } catch (err) {
      setError('Rollback failed')
      console.error('Rollback failed:', err)
    } finally {
      setIsRollingBack(false)
    }
  }, [selectedSnapshot, onRollback, rollbackPlan])

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getHealthColor = (score: number): string => {
    if (score >= 95) return 'text-green-400'
    if (score >= 85) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'text-green-400 border-green-500/30'
      case 'medium': return 'text-yellow-400 border-yellow-500/30'
      case 'high': return 'text-red-400 border-red-500/30'
      default: return 'text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-gray-900/80 border-green-500/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ArrowUturnLeftIcon className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-xl font-mono text-green-400">Rollback Control</h2>
              <p className="text-gray-400 font-mono text-sm">
                Manage deployment snapshots and rollback operations
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreateSnapshot}
            disabled={loading}
            className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-500/20"
          >
            <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
            Create Snapshot
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-900/20 border-red-500/30 p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-mono">{error}</span>
          </div>
        </Card>
      )}

      {/* Snapshots List */}
      <Card className="bg-gray-900/80 border-green-500/30">
        <div className="p-4 border-b border-green-500/20">
          <h3 className="text-lg font-mono text-green-400">Available Snapshots</h3>
        </div>

        <div className="p-4">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-mono">
              No snapshots available. Create a snapshot to enable rollback functionality.
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedSnapshot?.id === snapshot.id
                      ? 'border-green-400 bg-green-500/10'
                      : 'border-gray-600 hover:border-green-500/50 bg-gray-800/50'
                  }`}
                  onClick={() => handleSnapshotSelect(snapshot)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-white font-mono font-semibold">
                          {snapshot.name}
                        </h4>
                        <Badge className={snapshot.isAutomatic ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}>
                          {snapshot.isAutomatic ? 'AUTO' : 'MANUAL'}
                        </Badge>
                        <Badge className={`${getHealthColor(snapshot.healthCheck.score)}`}>
                          {snapshot.healthCheck.score}% HEALTH
                        </Badge>
                      </div>

                      <p className="text-gray-400 font-mono text-sm">
                        {snapshot.description}
                      </p>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400 font-mono">Version:</span>
                          <span className="text-white font-mono ml-2">{snapshot.metadata.version}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-mono">Size:</span>
                          <span className="text-white font-mono ml-2">{formatFileSize(snapshot.size)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-mono">Created:</span>
                          <span className="text-white font-mono ml-2">
                            {new Date(snapshot.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-mono">GPU:</span>
                          <span className="text-white font-mono ml-2">
                            {snapshot.metadata.gpuType} × {snapshot.metadata.gpuCount}
                          </span>
                        </div>
                      </div>

                      {/* Health Tests */}
                      <div className="flex flex-wrap gap-2">
                        {snapshot.healthCheck.tests.map((test, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 text-xs"
                          >
                            {test.status === 'passed' ? (
                              <CheckCircleIcon className="w-3 h-3 text-green-400" />
                            ) : test.status === 'warning' ? (
                              <ExclamationTriangleIcon className="w-3 h-3 text-yellow-400" />
                            ) : (
                              <ExclamationTriangleIcon className="w-3 h-3 text-red-400" />
                            )}
                            <span className="text-gray-400 font-mono">{test.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedSnapshot?.id === snapshot.id && (
                      <div className="ml-4">
                        <CheckCircleIcon className="w-6 h-6 text-green-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Rollback Plan */}
      {rollbackPlan && (
        <Card className="bg-gray-900/80 border-green-500/30">
          <div className="p-4 border-b border-green-500/20">
            <h3 className="text-lg font-mono text-green-400">Rollback Plan</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Plan Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-gray-400 font-mono text-sm">Target</p>
                <p className="text-white font-mono">{rollbackPlan.targetSnapshot.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-mono text-sm">Estimated Downtime</p>
                <p className="text-white font-mono">{formatDuration(rollbackPlan.estimatedDowntime)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-mono text-sm">Risk Level</p>
                <Badge className={getRiskColor(rollbackPlan.riskLevel)}>
                  {rollbackPlan.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Pre-rollback Checks */}
            <div className="space-y-3">
              <h4 className="text-white font-mono">Pre-rollback Checks</h4>
              <div className="space-y-2">
                {rollbackPlan.checks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-600"
                  >
                    <div className="flex items-center space-x-3">
                      {check.status === 'passed' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      ) : check.status === 'failed' ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                      ) : (
                        <ClockIcon className="w-5 h-5 text-yellow-400" />
                      )}
                      <div>
                        <p className="text-white font-mono text-sm">{check.name}</p>
                        <p className="text-gray-400 font-mono text-xs">{check.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={check.required ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}>
                        {check.required ? 'REQUIRED' : 'OPTIONAL'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rollback Steps */}
            <div className="space-y-3">
              <h4 className="text-white font-mono">Rollback Steps</h4>
              <div className="space-y-2">
                {rollbackPlan.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="p-3 bg-gray-800/50 rounded border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-green-400 font-mono text-sm">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="text-white font-mono text-sm">{step.name}</p>
                          <p className="text-gray-400 font-mono text-xs">{step.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 font-mono text-xs">
                          ETA: {formatDuration(step.estimatedDuration)}
                        </p>
                        <Badge className={
                          step.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          step.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                          step.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {step.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {step.status === 'running' && (
                      <Progress value={step.progress} className="h-2 bg-gray-700" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fallback Plan */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="flex items-start space-x-2">
                <ShieldCheckIcon className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="text-yellow-400 font-mono text-sm font-semibold">Fallback Plan</p>
                  <p className="text-gray-300 font-mono text-sm">{rollbackPlan.fallbackPlan}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-600">
              <div className="flex items-center space-x-4">
                {isRollingBack && (
                  <div className="flex items-center space-x-2">
                    <ArrowUturnLeftIcon className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span className="text-blue-400 font-mono">Rolling back...</span>
                    <span className="text-white font-mono">{rollbackProgress.toFixed(0)}%</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setSelectedSnapshot(null)}
                  disabled={isRollingBack}
                  className="bg-gray-600/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleRollback}
                  disabled={
                    isRollingBack ||
                    !rollbackPlan.checks.filter(c => c.required).every(c => c.status === 'passed')
                  }
                  className="bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                  Execute Rollback
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default RollbackControl