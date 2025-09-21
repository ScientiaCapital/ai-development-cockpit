'use client'

import { useEffect } from 'react'

interface ReactScanProviderProps {
  children: React.ReactNode
  enabled?: boolean
}

export function ReactScanProvider({ children, enabled = true }: ReactScanProviderProps) {
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      import('react-scan').then(({ scan }) => {
        scan({
          enabled: process.env.NODE_ENV === 'development',
          showToolbar: true,
          log: false, // Avoid console spam
          animationSpeed: 'fast',
          trackUnnecessaryRenders: true,
          onRender: (fiber, renders) => {
            // Custom render tracking for performance optimization
            if (renders.length > 5) {
              console.warn('🐌 Component re-rendering frequently:', fiber.type?.name || 'Unknown', {
                renders: renders.length,
                component: fiber
              })
            }
          },
          onCommitStart: () => {
            if (performance.mark) {
              performance.mark('react-commit-start')
            }
          },
          onCommitFinish: () => {
            if (performance.mark && performance.measure) {
              performance.mark('react-commit-end')
              performance.measure('react-commit-duration', 'react-commit-start', 'react-commit-end')
            }
          }
        })
      }).catch(error => {
        console.warn('Failed to initialize React Scan:', error)
      })
    }
  }, [enabled])

  return <>{children}</>
}