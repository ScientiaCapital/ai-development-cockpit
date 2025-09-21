'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface LazySectionProps {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
  minHeight?: string
  triggerOnce?: boolean
}

/**
 * Intersection Observer-based lazy loading component for below-the-fold content
 * Optimizes initial page load by deferring non-critical content rendering
 */
export function LazySection({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  minHeight = '200px',
  triggerOnce = true
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Skip if already triggered and triggerOnce is true
    if (hasTriggered && triggerOnce) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setHasTriggered(true)
          
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  const shouldRender = isVisible || hasTriggered

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ minHeight: shouldRender ? 'auto' : minHeight }}
    >
      {shouldRender ? children : (fallback || <LazyFallback minHeight={minHeight} />)}
    </div>
  )
}

/**
 * Default fallback component with skeleton loading
 */
function LazyFallback({ minHeight }: { minHeight: string }) {
  return (
    <div 
      className="flex items-center justify-center animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg"
      style={{ minHeight }}
    >
      <div className="text-center space-y-3">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto animate-spin"></div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    </div>
  )
}

/**
 * Lazy loading wrapper for heavy components
 */
export function LazyComponent({
  children,
  loading = false,
  error = null,
  threshold = 0.1,
  rootMargin = '100px'
}: {
  children: ReactNode
  loading?: boolean
  error?: Error | null
  threshold?: number
  rootMargin?: string
}) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Failed to load component: {error.message}
        </p>
      </div>
    )
  }

  if (loading) {
    return <LazyFallback minHeight="200px" />
  }

  return (
    <LazySection threshold={threshold} rootMargin={rootMargin}>
      {children}
    </LazySection>
  )
}

/**
 * Hook for manual intersection observer usage
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [hasIntersected, options])

  return { ref, isIntersecting, hasIntersected }
}