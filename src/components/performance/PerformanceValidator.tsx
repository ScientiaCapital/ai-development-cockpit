'use client'

import { useEffect, useState, useCallback } from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  threshold: { good: number; poor: number }
  unit: string
  description: string
}

interface PerformanceReport {
  timestamp: number
  metrics: PerformanceMetric[]
  overallScore: number
  recommendations: string[]
}

/**
 * Performance validation component that measures Core Web Vitals
 * and provides real-time performance insights
 */
export function PerformanceValidator() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [isCollecting, setIsCollecting] = useState(false)
  const [report, setReport] = useState<PerformanceReport | null>(null)

  // Define Core Web Vitals thresholds
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    INP: { good: 200, poor: 500 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 }
  }

  const descriptions = {
    CLS: 'Cumulative Layout Shift - measures visual stability',
    FCP: 'First Contentful Paint - time to first content render',
    INP: 'Interaction to Next Paint - responsiveness to user input',
    LCP: 'Largest Contentful Paint - loading performance',
    TTFB: 'Time to First Byte - server response time'
  }

  // Rate a metric based on its value and thresholds
  const rateMetric = useCallback((name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = thresholds[name as keyof typeof thresholds]
    if (!threshold) return 'good'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }, [])

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    setIsCollecting(true)
    setMetrics([])

    const collectedMetrics: PerformanceMetric[] = []
    let metricsReceived = 0
    const expectedMetrics = 5

    const addMetric = (name: string, value: number, unit: string) => {
      const metric: PerformanceMetric = {
        name,
        value: Math.round(value * 100) / 100,
        rating: rateMetric(name, value),
        threshold: thresholds[name as keyof typeof thresholds] || { good: 0, poor: 0 },
        unit,
        description: descriptions[name as keyof typeof descriptions] || ''
      }
      
      collectedMetrics.push(metric)
      metricsReceived++

      if (metricsReceived >= expectedMetrics) {
        setMetrics([...collectedMetrics])
        generateReport(collectedMetrics)
        setIsCollecting(false)
      }
    }

    // Collect Core Web Vitals
    onCLS((metric) => addMetric('CLS', metric.value, ''))
    onFCP((metric) => addMetric('FCP', metric.value, 'ms'))
    onINP((metric) => addMetric('INP', metric.value, 'ms'))
    onLCP((metric) => addMetric('LCP', metric.value, 'ms'))
    onTTFB((metric) => addMetric('TTFB', metric.value, 'ms'))

    // Timeout after 10 seconds
    setTimeout(() => {
      if (metricsReceived < expectedMetrics) {
        setMetrics([...collectedMetrics])
        generateReport(collectedMetrics)
        setIsCollecting(false)
      }
    }, 10000)
  }, [rateMetric])

  // Generate performance report with recommendations
  const generateReport = useCallback((metrics: PerformanceMetric[]) => {
    const goodCount = metrics.filter(m => m.rating === 'good').length
    const overallScore = Math.round((goodCount / metrics.length) * 100)
    
    const recommendations: string[] = []
    
    metrics.forEach(metric => {
      switch (metric.name) {
        case 'LCP':
          if (metric.rating !== 'good') {
            recommendations.push('Optimize images and use lazy loading for better LCP')
            recommendations.push('Implement code splitting to reduce initial bundle size')
            recommendations.push('Use CDN for static assets')
          }
          break
        case 'FCP':
          if (metric.rating !== 'good') {
            recommendations.push('Minimize render-blocking resources')
            recommendations.push('Optimize CSS delivery and remove unused code')
          }
          break
        case 'CLS':
          if (metric.rating !== 'good') {
            recommendations.push('Specify image dimensions to prevent layout shifts')
            recommendations.push('Avoid inserting content above existing content')
          }
          break
        case 'INP':
          if (metric.rating !== 'good') {
            recommendations.push('Optimize JavaScript execution and reduce main thread blocking')
            recommendations.push('Use React.memo and useMemo for expensive components')
          }
          break
        case 'TTFB':
          if (metric.rating !== 'good') {
            recommendations.push('Optimize server response time')
            recommendations.push('Use caching strategies for API responses')
          }
          break
      }
    })

    // Add general recommendations based on score
    if (overallScore < 80) {
      recommendations.push('Consider implementing Service Worker for better caching')
      recommendations.push('Enable compression and optimize bundle size')
    }

    const newReport: PerformanceReport = {
      timestamp: Date.now(),
      metrics,
      overallScore,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    }

    setReport(newReport)
  }, [])

  // Auto-collect metrics on component mount
  useEffect(() => {
    collectMetrics()
  }, [collectMetrics])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200'
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Validation</h2>
        <Button 
          onClick={collectMetrics} 
          disabled={isCollecting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isCollecting ? 'Collecting...' : 'Refresh Metrics'}
        </Button>
      </div>

      {/* Overall Score */}
      {report && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Performance Score</h3>
            <div className={`text-4xl font-bold ${getScoreColor(report.overallScore)}`}>
              {report.overallScore}/100
            </div>
            <p className="text-gray-600 mt-2">
              {report.overallScore >= 90 ? 'Excellent!' : 
               report.overallScore >= 70 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </Card>
      )}

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{metric.name}</h4>
              <Badge className={getRatingColor(metric.rating)}>
                {metric.rating.replace('-', ' ')}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              {metric.value}{metric.unit}
            </div>
            <p className="text-sm text-gray-600 mb-2">{metric.description}</p>
            <div className="text-xs text-gray-500">
              Good: ≤{metric.threshold.good}{metric.unit} | 
              Poor: &gt;{metric.threshold.poor}{metric.unit}
            </div>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {isCollecting && (
        <Card className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Collecting performance metrics...</p>
        </Card>
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
          <ul className="space-y-2">
            {report.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Technical Details */}
      {report && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Measured at:</strong> {new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Connection:</strong> {(navigator as any).connection?.effectiveType || 'Unknown'}</p>
          </div>
        </Card>
      )}
    </div>
  )
}