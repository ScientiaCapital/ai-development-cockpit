'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Download, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface InstallPromptProps {
  theme?: 'terminal' | 'corporate'
}

export function InstallPrompt({ theme = 'terminal' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    
    // Check iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 3 seconds if not dismissed before
      setTimeout(() => {
        if (!isInstalled && !isStandalone) {
          setShowInstallPrompt(true)
        }
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled, isStandalone])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const result = await deferredPrompt.userChoice
        
        if (result.outcome === 'accepted') {
          setIsInstalled(true)
        }
        
        setDeferredPrompt(null)
        setShowInstallPrompt(false)
      } catch (error) {
        console.error('Error installing app:', error)
      }
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone) {
    return null
  }

  // Check if user dismissed recently
  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null
  }

  if (!showInstallPrompt && !isIOS) {
    return null
  }

  const isTerminalTheme = theme === 'terminal'

  return (
    <Card className={`fixed bottom-4 left-4 right-4 md:left-auto md:w-96 p-4 z-50 shadow-lg border-2 ${
      isTerminalTheme 
        ? 'bg-black border-green-500 text-green-400' 
        : 'bg-white border-purple-200 text-gray-900'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isTerminalTheme ? (
            <Monitor className="w-5 h-5 text-green-400" />
          ) : (
            <Smartphone className="w-5 h-5 text-purple-600" />
          )}
          <h3 className={`font-semibold ${
            isTerminalTheme ? 'text-green-400' : 'text-gray-900'
          }`}>
            Install App
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className={`h-auto p-1 ${
            isTerminalTheme 
              ? 'text-green-400 hover:bg-green-900/20' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <p className={`text-sm mb-4 ${
        isTerminalTheme ? 'text-green-300' : 'text-gray-600'
      }`}>
        {isTerminalTheme 
          ? 'Add SwaggyStacks to your home screen for a native terminal experience with offline access.'
          : 'Install Scientia Capital for quick access to enterprise AI analytics and offline functionality.'
        }
      </p>

      {isIOS ? (
        <div className={`text-sm ${
          isTerminalTheme ? 'text-green-300' : 'text-gray-600'
        }`}>
          <p className="mb-2">To install on iOS:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Tap the share button in Safari</li>
            <li>Select "Add to Home Screen"</li>
            <li>Tap "Add" to install</li>
          </ol>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            className={`flex-1 ${
              isTerminalTheme
                ? 'bg-green-600 hover:bg-green-700 text-black border border-green-400'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className={`${
              isTerminalTheme
                ? 'border-green-400 text-green-400 hover:bg-green-900/20'
                : 'border-purple-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Later
          </Button>
        </div>
      )}
    </Card>
  )
}