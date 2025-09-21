'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { InstallPrompt } from './InstallPrompt'
import { MobileNavigation } from './MobileNavigation'
import { BackgroundSync } from './BackgroundSync'
import { WebVitalsOptimizer } from './WebVitalsOptimizer'

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [theme, setTheme] = useState<'terminal' | 'corporate'>('terminal')
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
    
    // Detect theme from current path
    const detectedTheme = detectThemeFromPath(pathname)
    setTheme(detectedTheme)
    
    // Update manifest link based on theme
    updateManifestLink(detectedTheme)
    
    // Store theme preference
    localStorage.setItem('preferred-theme', detectedTheme)
    
    // Update document classes for theme-specific styling
    document.documentElement.setAttribute('data-theme', detectedTheme)
    
  }, [pathname])

  const detectThemeFromPath = (path: string): 'terminal' | 'corporate' => {
    if (path.includes('/swaggystacks') || 
        path.includes('/chat?theme=terminal') || 
        path.includes('/marketplace?theme=terminal')) {
      return 'terminal'
    } else if (path.includes('/scientia') || 
               path.includes('/chat?theme=corporate') || 
               path.includes('/marketplace?theme=corporate')) {
      return 'corporate'
    }
    
    // Check URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlTheme = params.get('theme')
      if (urlTheme === 'terminal' || urlTheme === 'corporate') {
        return urlTheme
      }
    }
    
    // Default to terminal theme
    return 'terminal'
  }

  const updateManifestLink = (currentTheme: 'terminal' | 'corporate') => {
    if (typeof document === 'undefined') return
    
    // Remove existing manifest link
    const existingLink = document.querySelector('link[rel="manifest"]')
    if (existingLink) {
      existingLink.remove()
    }
    
    // Add new manifest link with theme parameter
    const manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.href = `/api/manifest?theme=${currentTheme}`
    document.head.appendChild(manifestLink)
    
    // Update theme color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (themeColorMeta) {
      themeColorMeta.content = currentTheme === 'terminal' ? '#00ff00' : '#8B5CF6'
    }
    
    // Update Apple-specific meta tags
    const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement
    if (appleStatusMeta) {
      appleStatusMeta.content = currentTheme === 'terminal' ? 'black-translucent' : 'default'
    }
    
    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement
    if (appleTitleMeta) {
      appleTitleMeta.content = currentTheme === 'terminal' ? 'SwaggyStacks' : 'Scientia Capital'
    }
  }

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('🔧 PWA Service Worker registered:', registration.scope)
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, prompt user to refresh
                  if (confirm('New app version available! Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ PWA Service Worker registration failed:', error)
        })
    }
  }, [])

  // Don't render PWA components on server
  if (!isClient) {
    return <>{children}</>
  }

  return (
    <>
      {/* Web Vitals Optimization */}
      <WebVitalsOptimizer theme={theme} reportToAnalytics={true} />
      
      {/* Main content */}
      {children}
      
      {/* PWA Components */}
      <InstallPrompt theme={theme} />
      <MobileNavigation theme={theme} />
      <BackgroundSync 
        theme={theme}
        onMessageQueue={(message) => {
          console.log('Message queued for background sync:', message)
        }}
        onMessageSync={(messageId, response) => {
          console.log('Message synced successfully:', messageId, response)
        }}
      />
    </>
  )
}

// Hook to get current PWA state
export function usePWAState() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [theme, setTheme] = useState<'terminal' | 'corporate'>('terminal')
  
  useEffect(() => {
    // Check if PWA is installed
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )
    
    // Monitor online status
    const handleOnlineChange = () => setIsOnline(navigator.onLine)
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnlineChange)
    window.addEventListener('offline', handleOnlineChange)
    
    // Get current theme
    const storedTheme = localStorage.getItem('preferred-theme') as 'terminal' | 'corporate'
    if (storedTheme) {
      setTheme(storedTheme)
    }
    
    return () => {
      window.removeEventListener('online', handleOnlineChange)
      window.removeEventListener('offline', handleOnlineChange)
    }
  }, [])
  
  return {
    isInstalled,
    isOnline,
    theme,
    setTheme: (newTheme: 'terminal' | 'corporate') => {
      setTheme(newTheme)
      localStorage.setItem('preferred-theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }
}