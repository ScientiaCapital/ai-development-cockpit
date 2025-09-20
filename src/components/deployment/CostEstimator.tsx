'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ModelMetadata } from '@/types/models'
import { DOCKER_TEMPLATES } from '@/services/runpod/templates'
import {
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export interface CostEstimatorProps {
  model?: ModelMetadata
  onEstimateChange?: (estimate: CostEstimate) => void
  className?: string
  showOptimizations?: boolean
  currency?: 'USD' | 'EUR' | 'GBP'
}

export interface CostEstimate {
  hourly: number
  daily: number
  weekly: number
  monthly: number
  yearly: number
  breakdown: {
    compute: number
    storage: number
    bandwidth: number
    other: number
  }
  template: string
  gpuType: string
  gpuCount: number
  optimizations: CostOptimization[]
  confidence: 'high' | 'medium' | 'low'
}

export interface CostOptimization {
  type: 'gpu_type' | 'quantization' | 'scaling' | 'region' | 'scheduling'
  title: string
  description: string
  savings: {
    hourly: number
    monthly: number
    percentage: number
  }
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  applicable: boolean
  recommendation: string
}

const GPU_PRICING = {
  'NVIDIA_RTX_4090': { hourly: 0.79, memory: 24, performance: 1.0 },
  'NVIDIA_RTX_A6000': { hourly: 0.79, memory: 48, performance: 1.1 },
  'NVIDIA_A40': { hourly: 0.89, memory: 48, performance: 1.2 },
  'NVIDIA_A100': { hourly: 2.89, memory: 80, performance: 1.8 }
}

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£'
}

export function CostEstimator({
  model,
  onEstimateChange,
  className = '',
  showOptimizations = true,
  currency = 'USD'
}: CostEstimatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedGPU, setSelectedGPU] = useState<string>('')
  const [gpuCount, setGpuCount] = useState<number>(1)
  const [usagePattern, setUsagePattern] = useState<'constant' | 'business' | 'experimental'>('business')
  const [estimationLoading, setEstimationLoading] = useState(false)

  // Calculate cost estimate
  const estimate = useMemo((): CostEstimate => {
    if (!selectedTemplate || !selectedGPU) {
      return {
        hourly: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        breakdown: { compute: 0, storage: 0, bandwidth: 0, other: 0 },
        template: '',
        gpuType: '',
        gpuCount: 0,
        optimizations: [],
        confidence: 'low'
      }
    }

    const template = DOCKER_TEMPLATES[selectedTemplate]
    const gpuPricing = GPU_PRICING[selectedGPU as keyof typeof GPU_PRICING]

    if (!template || !gpuPricing) {
      return {
        hourly: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        breakdown: { compute: 0, storage: 0, bandwidth: 0, other: 0 },
        template: '',
        gpuType: '',
        gpuCount: 0,
        optimizations: [],
        confidence: 'low'
      }
    }

    const baseHourly = gpuPricing.hourly * gpuCount

    // Apply usage pattern multipliers
    const usageMultipliers = {
      constant: 1.0, // 24/7 usage
      business: 0.4, // ~10 hours/day
      experimental: 0.15 // ~3-4 hours/day
    }

    const effectiveHourly = baseHourly * usageMultipliers[usagePattern]
    const daily = effectiveHourly * 24
    const weekly = daily * 7
    const monthly = daily * 30
    const yearly = daily * 365

    // Cost breakdown
    const breakdown = {
      compute: effectiveHourly * 0.80,
      storage: effectiveHourly * 0.10,
      bandwidth: effectiveHourly * 0.08,
      other: effectiveHourly * 0.02
    }

    // Generate optimizations
    const optimizations = generateOptimizations(
      template,
      selectedGPU,
      gpuCount,
      usagePattern,
      baseHourly
    )

    // Confidence based on model size and requirements match
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    if (model) {
      const modelSize = parseFloat(model.size || '7')
      const templateSize = selectedTemplate.includes('7b') ? 7 :
                          selectedTemplate.includes('13b') ? 13 :
                          selectedTemplate.includes('70b') ? 70 : 7

      if (Math.abs(modelSize - templateSize) < 2) {
        confidence = 'high'
      } else if (Math.abs(modelSize - templateSize) > 10) {
        confidence = 'low'
      }
    }

    return {
      hourly: effectiveHourly,
      daily,
      weekly,
      monthly,
      yearly,
      breakdown,
      template: selectedTemplate,
      gpuType: selectedGPU,
      gpuCount,
      optimizations,
      confidence
    }
  }, [selectedTemplate, selectedGPU, gpuCount, usagePattern, model])

  // Auto-select optimal template and GPU for model
  useEffect(() => {
    if (model && !selectedTemplate) {
      const modelSize = parseFloat(model.size || '7')
      let optimalTemplate = 'vllm-7b'

      if (modelSize <= 3) optimalTemplate = 'vllm-quantized-4bit'
      else if (modelSize <= 7) optimalTemplate = 'vllm-7b'
      else if (modelSize <= 13) optimalTemplate = 'vllm-13b'
      else if (modelSize <= 70) optimalTemplate = 'vllm-70b'

      // Prefer SGLang for code models
      if (model.id.toLowerCase().includes('code') && modelSize <= 7) {
        optimalTemplate = 'sglang-7b'
      }

      setSelectedTemplate(optimalTemplate)

      // Auto-select GPU based on template
      const template = DOCKER_TEMPLATES[optimalTemplate]
      if (template && template.gpuRequirements.supportedTypes.length > 0) {
        setSelectedGPU(template.gpuRequirements.supportedTypes[0])
        setGpuCount(template.optimization.tensorParallelism)
      }
    }
  }, [model, selectedTemplate])

  // Notify parent of estimate changes
  useEffect(() => {
    onEstimateChange?.(estimate)
  }, [estimate, onEstimateChange])

  const formatCurrency = (amount: number): string => {
    const symbol = CURRENCY_SYMBOLS[currency]
    return `${symbol}${amount.toFixed(2)}`
  }

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'high': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getOptimizationColor = (effort: string, impact: string): string => {
    if (effort === 'low' && impact === 'high') return 'text-green-400 border-green-500/30'
    if (effort === 'low' && impact === 'medium') return 'text-yellow-400 border-yellow-500/30'
    if (effort === 'medium' && impact === 'high') return 'text-blue-400 border-blue-500/30'
    return 'text-gray-400 border-gray-500/30'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration */}
      <Card className="bg-gray-900/80 border-green-500/30 p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-mono text-green-400">Cost Configuration</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-mono text-gray-300">Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono focus:border-green-500 focus:outline-none"
              >
                <option value="">Select Template</option>
                {Object.entries(DOCKER_TEMPLATES).map(([id, template]) => (
                  <option key={id} value={id}>
                    {template.name} ({template.framework.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* GPU Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-mono text-gray-300">GPU Type</label>
              <select
                value={selectedGPU}
                onChange={(e) => setSelectedGPU(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono focus:border-green-500 focus:outline-none"
              >
                <option value="">Select GPU</option>
                {Object.entries(GPU_PRICING).map(([gpu, info]) => (
                  <option key={gpu} value={gpu}>
                    {gpu.replace('NVIDIA_', '')} - {formatCurrency(info.hourly)}/hr ({info.memory}GB)
                  </option>
                ))}
              </select>
            </div>

            {/* GPU Count */}
            <div className="space-y-3">
              <label className="block text-sm font-mono text-gray-300">GPU Count</label>
              <input
                type="number"
                min="1"
                max="8"
                value={gpuCount}
                onChange={(e) => setGpuCount(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Usage Pattern */}
            <div className="space-y-3">
              <label className="block text-sm font-mono text-gray-300">Usage Pattern</label>
              <select
                value={usagePattern}
                onChange={(e) => setUsagePattern(e.target.value as typeof usagePattern)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono focus:border-green-500 focus:outline-none"
              >
                <option value="experimental">Experimental (3-4 hrs/day)</option>
                <option value="business">Business Hours (10 hrs/day)</option>
                <option value="constant">24/7 Production</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Estimate */}
      <Card className="bg-gray-900/80 border-green-500/30 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BanknotesIcon className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-mono text-green-400">Cost Estimate</h3>
            </div>
            <Badge className={`font-mono ${getConfidenceColor(estimate.confidence)}`}>
              {estimate.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>

          {estimate.hourly > 0 ? (
            <div className="space-y-4">
              {/* Time Period Estimates */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Hourly', value: estimate.hourly },
                  { label: 'Daily', value: estimate.daily },
                  { label: 'Weekly', value: estimate.weekly },
                  { label: 'Monthly', value: estimate.monthly },
                  { label: 'Yearly', value: estimate.yearly }
                ].map((period) => (
                  <div key={period.label} className="text-center">
                    <p className="text-gray-400 text-sm font-mono">{period.label}</p>
                    <p className="text-white text-lg font-mono font-bold">
                      {formatCurrency(period.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-mono text-gray-300">Cost Breakdown (Monthly)</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Compute (GPU)', value: estimate.breakdown.compute * 24 * 30, color: 'bg-green-500' },
                    { label: 'Storage', value: estimate.breakdown.storage * 24 * 30, color: 'bg-blue-500' },
                    { label: 'Bandwidth', value: estimate.breakdown.bandwidth * 24 * 30, color: 'bg-yellow-500' },
                    { label: 'Other', value: estimate.breakdown.other * 24 * 30, color: 'bg-gray-500' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded ${item.color}`}></div>
                        <span className="text-gray-400 font-mono text-sm">{item.label}</span>
                      </div>
                      <span className="text-white font-mono text-sm">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-mono">Monthly Cost Distribution</span>
                  <span className="text-white font-mono">{formatCurrency(estimate.monthly)}</span>
                </div>
                <div className="flex h-4 rounded overflow-hidden">
                  <div
                    className="bg-green-500"
                    style={{ width: '80%' }}
                    title="Compute"
                  ></div>
                  <div
                    className="bg-blue-500"
                    style={{ width: '10%' }}
                    title="Storage"
                  ></div>
                  <div
                    className="bg-yellow-500"
                    style={{ width: '8%' }}
                    title="Bandwidth"
                  ></div>
                  <div
                    className="bg-gray-500"
                    style={{ width: '2%' }}
                    title="Other"
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 font-mono">
              Select a template and GPU to see cost estimates
            </div>
          )}
        </div>
      </Card>

      {/* Optimizations */}
      {showOptimizations && estimate.optimizations.length > 0 && (
        <Card className="bg-gray-900/80 border-green-500/30 p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <LightBulbIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-mono text-yellow-400">Cost Optimizations</h3>
            </div>

            <div className="space-y-3">
              {estimate.optimizations.map((optimization, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getOptimizationColor(optimization.effort, optimization.impact)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-mono font-semibold text-white">
                          {optimization.title}
                        </h4>
                        <Badge className="text-xs font-mono">
                          {optimization.effort.toUpperCase()} EFFORT
                        </Badge>
                        <Badge className="text-xs font-mono">
                          {optimization.impact.toUpperCase()} IMPACT
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm font-mono mb-2">
                        {optimization.description}
                      </p>
                      <p className="text-gray-400 text-xs font-mono">
                        {optimization.recommendation}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-green-400 font-mono font-semibold">
                        -{formatCurrency(optimization.savings.monthly)}/mo
                      </p>
                      <p className="text-green-400 text-sm font-mono">
                        -{optimization.savings.percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-mono text-sm font-semibold">
                  Total Potential Savings:
                </span>
                <span className="text-green-400 font-mono text-sm">
                  {formatCurrency(
                    estimate.optimizations.reduce((sum, opt) => sum + opt.savings.monthly, 0)
                  )}/month
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Additional Information */}
      <Card className="bg-gray-900/80 border-blue-500/30 p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-400 mt-1" />
          <div className="text-sm font-mono text-gray-300 space-y-1">
            <p>• Estimates based on current RunPod pricing and may vary by availability</p>
            <p>• Actual costs depend on usage patterns, scaling, and regional pricing</p>
            <p>• Consider using auto-scaling to optimize costs during low usage periods</p>
            <p>• Quantized models can significantly reduce memory requirements and costs</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Helper function to generate optimizations
function generateOptimizations(
  template: any,
  gpuType: string,
  gpuCount: number,
  usagePattern: string,
  baseHourly: number
): CostOptimization[] {
  const optimizations: CostOptimization[] = []

  // GPU type optimization
  const alternativeGPUs = Object.keys(GPU_PRICING).filter(gpu => gpu !== gpuType)
  for (const altGPU of alternativeGPUs) {
    const altPricing = GPU_PRICING[altGPU as keyof typeof GPU_PRICING]
    const altHourly = altPricing.hourly * gpuCount

    if (altHourly < baseHourly) {
      const savings = baseHourly - altHourly
      optimizations.push({
        type: 'gpu_type',
        title: `Switch to ${altGPU.replace('NVIDIA_', '')}`,
        description: `Use ${altGPU.replace('NVIDIA_', '')} instead of ${gpuType.replace('NVIDIA_', '')}`,
        savings: {
          hourly: savings,
          monthly: savings * 24 * 30,
          percentage: (savings / baseHourly) * 100
        },
        effort: 'low',
        impact: savings > baseHourly * 0.2 ? 'high' : 'medium',
        applicable: true,
        recommendation: `Consider if ${altPricing.memory}GB memory and performance requirements are met`
      })
    }
  }

  // Quantization optimization
  if (!template.optimization.quantization) {
    optimizations.push({
      type: 'quantization',
      title: 'Enable 4-bit Quantization',
      description: 'Use quantized models to reduce memory requirements',
      savings: {
        hourly: baseHourly * 0.3,
        monthly: baseHourly * 0.3 * 24 * 30,
        percentage: 30
      },
      effort: 'medium',
      impact: 'high',
      applicable: true,
      recommendation: 'May slightly reduce model quality but significantly reduces costs'
    })
  }

  // Auto-scaling optimization
  if (usagePattern !== 'constant') {
    optimizations.push({
      type: 'scaling',
      title: 'Aggressive Auto-scaling',
      description: 'Scale down to 0 workers during idle periods',
      savings: {
        hourly: baseHourly * 0.4,
        monthly: baseHourly * 0.4 * 24 * 30,
        percentage: 40
      },
      effort: 'low',
      impact: 'high',
      applicable: true,
      recommendation: 'Set minimum workers to 0 and enable cold start tolerance'
    })
  }

  // Multi-GPU optimization
  if (gpuCount > 1) {
    optimizations.push({
      type: 'scaling',
      title: 'Optimize GPU Count',
      description: 'Consider if fewer GPUs with higher utilization would suffice',
      savings: {
        hourly: baseHourly * 0.25,
        monthly: baseHourly * 0.25 * 24 * 30,
        percentage: 25
      },
      effort: 'medium',
      impact: 'medium',
      applicable: true,
      recommendation: 'Test performance with fewer GPUs before deploying'
    })
  }

  return optimizations.filter(opt => opt.applicable)
}

export default CostEstimator