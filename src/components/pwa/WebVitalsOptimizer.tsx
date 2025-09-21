'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

interface WebVitalsData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  entries: PerformanceEntry[]
}

interface WebVitalsOptimizerProps {
  theme?: 'terminal' | 'corporate'
  reportToAnalytics?: boolean
}

export function WebVitalsOptimizer({ 
  theme = 'terminal', 
  reportToAnalytics = true 
}: WebVitalsOptimizerProps) {
  
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initializeWebVitals()
    
    // Performance optimizations
    optimizeResourceLoading()
    optimizeImageLoading()
    optimizeRenderBlocking()
    
    // Theme-specific optimizations
    if (theme === 'terminal') {
      optimizeTerminalPerformance()
    } else {
      optimizeCorporatePerformance()
    }
    
  }, [theme, reportToAnalytics])

  const initializeWebVitals = () => {
    const sendToAnalytics = (metric: WebVitalsData) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Web Vitals:', {
          name: metric.name,
          value: Math.round(metric.value),
          rating: metric.rating,
          theme
        })
      }

      // Send to analytics service if enabled
      if (reportToAnalytics && typeof window !== 'undefined') {
        // You can integrate with Google Analytics, Vercel Analytics, etc.
        if (window.gtag) {
          window.gtag('event', metric.name, {
            custom_parameter_1: Math.round(metric.value),
            custom_parameter_2: metric.rating,
            custom_parameter_3: theme
          })
        }
        
        // Store in localStorage for debugging
        const vitals = JSON.parse(localStorage.getItem('web-vitals') || '[]')
        vitals.push({
          ...metric,
          timestamp: Date.now(),
          theme,
          url: window.location.pathname
        })
        
        // Keep only last 50 measurements
        if (vitals.length > 50) {
          vitals.splice(0, vitals.length - 50)
        }
        
        localStorage.setItem('web-vitals', JSON.stringify(vitals))
      }

      // Show performance alerts for poor metrics
      if (metric.rating === 'poor') {
        showPerformanceAlert(metric)
      }
    }

    // Measure Core Web Vitals
    onCLS(sendToAnalytics)  // Cumulative Layout Shift
    onINP(sendToAnalytics)  // Interaction to Next Paint  
    onFCP(sendToAnalytics)  // First Contentful Paint
    onLCP(sendToAnalytics)  // Largest Contentful Paint
    onTTFB(sendToAnalytics) // Time to First Byte
  }

  const showPerformanceAlert = (metric: WebVitalsData) => {
    const isTerminalTheme = theme === 'terminal'
    
    // Only show in development or if user has opted in
    if (process.env.NODE_ENV === 'development' || 
        localStorage.getItem('show-performance-alerts') === 'true') {
      
      const alertStyle = isTerminalTheme
        ? 'background: black; color: #ff4444; border: 1px solid #ff4444; padding: 8px; font-family: monospace;'
        : 'background: #fee; color: #d32f2f; border: 1px solid #d32f2f; padding: 8px;'
      
      console.warn(
        `%c⚠️ Poor ${metric.name}: ${Math.round(metric.value)}ms (Target: <${getTargetValue(metric.name)}ms)`,
        alertStyle
      )
    }
  }

  const getTargetValue = (metricName: string): number => {
    switch (metricName) {
      case 'LCP': return 2500  // 2.5s
      case 'FID': return 100   // 100ms
      case 'CLS': return 0.1   // 0.1
      case 'FCP': return 1800  // 1.8s
      case 'TTFB': return 800  // 800ms
      default: return 0
    }
  }

  const optimizeResourceLoading = () => {
    // Preload critical resources
    const criticalResources = [
      '/api/manifest?theme=' + theme,
      theme === 'terminal' ? '/swaggystacks' : '/scientia'
    ]

    criticalResources.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = href.includes('/api/') ? 'fetch' : 'document'
      document.head.appendChild(link)
    })

    // Prefetch likely next pages
    const prefetchPages = theme === 'terminal' 
      ? ['/chat?theme=terminal', '/marketplace?theme=terminal']
      : ['/chat?theme=corporate', '/marketplace?theme=corporate']

    prefetchPages.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    })
  }

  const optimizeImageLoading = () => {
    // Implement lazy loading for images not in viewport
    const images = document.querySelectorAll('img[data-src]')
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || ''
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      })

      images.forEach(img => imageObserver.observe(img))
    }

    // Add native lazy loading to new images
    const newImages = document.querySelectorAll('img:not([loading])')
    newImages.forEach(img => {
      img.setAttribute('loading', 'lazy')
    })
  }

  const optimizeRenderBlocking = () => {
    // Remove render-blocking resources
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([media])')
    stylesheets.forEach(link => {
      link.setAttribute('media', 'print')
      link.setAttribute('onload', "this.media='all'")
    })

    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])')
    scripts.forEach(script => {
      if (!script.src.includes('vital')) { // Don't defer critical scripts
        script.setAttribute('defer', '')
      }
    })
  }

  const optimizeTerminalPerformance = () => {
    // Terminal-specific optimizations
    document.documentElement.style.setProperty('--terminal-font-display', 'swap')
    
    // Optimize terminal animations
    const style = document.createElement('style')
    style.textContent = `
      .terminal-animation {
        will-change: transform;
        transform: translateZ(0);
      }
      
      .terminal-text {
        font-display: swap;
        text-rendering: optimizeSpeed;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .terminal-animation {
          animation: none !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  const optimizeCorporatePerformance = () => {
    // Corporate theme optimizations
    document.documentElement.style.setProperty('--corporate-font-display', 'swap')
    
    // Optimize chart and graph rendering
    const style = document.createElement('style')
    style.textContent = `
      .chart-container {
        contain: layout style paint;
        will-change: contents;
      }
      
      .data-table {
        contain: layout;
        overflow: auto;
      }
      
      .corporate-animation {
        will-change: transform, opacity;
        transform: translateZ(0);
      }
    `
    document.head.appendChild(style)
  }

  // Component doesn't render anything visible
  return null
}

// Hook to access Web Vitals data
export function useWebVitals() {
  const getWebVitalsData = () => {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('web-vitals') || '[]')
  }

  const clearWebVitalsData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('web-vitals')
    }
  }

  const getLatestMetrics = () => {
    const data = getWebVitalsData()
    const latest: Record<string, any> = {}
    
    data.forEach((metric: any) => {
      if (!latest[metric.name] || metric.timestamp > latest[metric.name].timestamp) {
        latest[metric.name] = metric
      }
    })
    
    return latest
  }

  return {
    data: getWebVitalsData(),
    latest: getLatestMetrics(),
    clear: clearWebVitalsData
  }
}

// Performance monitoring utility
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  
  mark(name: string) {
    this.marks.set(name, performance.now())
    performance.mark(name)
  }
  
  measure(name: string, startMark?: string, endMark?: string) {
    if (startMark && this.marks.has(startMark)) {
      const duration = endMark 
        ? performance.now() - (this.marks.get(endMark) || 0)
        : performance.now() - (this.marks.get(startMark) || 0)
      
      performance.measure(name, startMark, endMark)
      
      console.log(`📊 ${name}: ${Math.round(duration)}ms`)
      return duration
    }
    
    return 0
  }
  
  getMarks() {
    return Array.from(this.marks.entries())
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Global type declaration
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}