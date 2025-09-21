import { lazy, ComponentType, Suspense, useEffect, useRef, useState } from 'react'

interface LazyComponentProps {
  fallback?: React.ComponentType
  children?: React.ReactNode
}

/**
 * Enhanced lazy loading utility with optimized error boundaries and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallbackComponent?: React.ComponentType<LazyComponentProps>
) {
  const LazyComponent = lazy(importFunc)
  
  const WrappedComponent = (props: Parameters<T>[0]) => {
    const Fallback = fallbackComponent || DefaultLazyFallback
    
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
  
  // Preserve display name for debugging
  WrappedComponent.displayName = `Lazy(${LazyComponent.displayName || LazyComponent.name || 'Component'})`
  
  return WrappedComponent
}

/**
 * Default loading fallback with theme awareness
 */
function DefaultLazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Route-specific fallbacks for better UX
 */
export const ChatPageFallback = () => (
  <div className="flex flex-col h-screen max-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-purple-500/20 rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-purple-500/10 rounded w-24 mx-auto"></div>
        </div>
        <p className="text-purple-300">Initializing Chat Interface...</p>
      </div>
    </div>
  </div>
)

export const MarketplaceFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 p-6">
    <div className="max-w-6xl mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-purple-500/20 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-purple-500/10 rounded-lg p-6 space-y-4">
              <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
              <div className="h-3 bg-purple-500/10 rounded w-1/2"></div>
              <div className="h-3 bg-purple-500/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-purple-300 mt-8">Loading Model Marketplace...</p>
    </div>
  </div>
)

export const AuthPageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
    <div className="bg-purple-500/10 rounded-lg p-8 w-full max-w-md">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-purple-500/20 rounded w-3/4 mx-auto"></div>
        <div className="space-y-3">
          <div className="h-4 bg-purple-500/10 rounded"></div>
          <div className="h-10 bg-purple-500/10 rounded"></div>
          <div className="h-4 bg-purple-500/10 rounded"></div>
          <div className="h-10 bg-purple-500/10 rounded"></div>
          <div className="h-10 bg-purple-500/20 rounded"></div>
        </div>
      </div>
      <p className="text-center text-purple-300 mt-6">Loading Authentication...</p>
    </div>
  </div>
)

/**
 * Preload components for critical routes
 */
export const preloadComponent = (importFunc: () => Promise<any>) => {
  // Preload after user interaction or on route prefetch
  if (typeof window !== 'undefined') {
    const timeoutId = setTimeout(() => {
      importFunc().catch(() => {
        // Ignore preload errors
      })
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }
}

/**
 * Intersection Observer based lazy loading for below-the-fold components
 */
export function createIntersectionLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  return (props: Parameters<T>[0]) => {
    const [shouldLoad, setShouldLoad] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        },
        options
      )
      
      if (ref.current) {
        observer.observe(ref.current)
      }
      
      return () => observer.disconnect()
    }, [])
    
    if (!shouldLoad) {
      return (
        <div ref={ref} className="min-h-[200px] flex items-center justify-center">
          <DefaultLazyFallback />
        </div>
      )
    }
    
    const LazyComponent = lazy(importFunc)
    return (
      <Suspense fallback={<DefaultLazyFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}