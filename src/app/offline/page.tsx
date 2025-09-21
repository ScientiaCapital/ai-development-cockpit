'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw, Terminal, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [theme, setTheme] = useState<'terminal' | 'corporate'>('terminal')

  useEffect(() => {
    // Detect theme from URL or localStorage
    const params = new URLSearchParams(window.location.search)
    const urlTheme = params.get('theme')
    const storedTheme = localStorage.getItem('preferred-theme')
    const detectedTheme = urlTheme || storedTheme || 'terminal'
    setTheme(detectedTheme as 'terminal' | 'corporate')

    // Monitor online status
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine)
    }

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  const isTerminalTheme = theme === 'terminal'

  if (isOnline) {
    // If online, redirect to appropriate theme page
    useEffect(() => {
      const redirectUrl = isTerminalTheme ? '/swaggystacks' : '/scientia'
      window.location.href = redirectUrl
    }, [isTerminalTheme])
    
    return null
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isTerminalTheme 
        ? 'bg-black text-green-400' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <Card className={`max-w-md w-full p-8 text-center ${
        isTerminalTheme 
          ? 'bg-gray-900 border-green-500 border-2' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Theme-specific header */}
        <div className="mb-6">
          {isTerminalTheme ? (
            <div className="flex flex-col items-center">
              <Terminal className="w-16 h-16 text-green-400 mb-4" />
              <h1 className="text-2xl font-bold text-green-400 mb-2">
                SwaggyStacks
              </h1>
              <div className="text-green-300 text-sm font-mono">
                OFFLINE MODE ACTIVATED
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <TrendingUp className="w-16 h-16 text-purple-600 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Scientia Capital
              </h1>
              <div className="text-gray-600 text-sm">
                Offline Mode
              </div>
            </div>
          )}
        </div>

        {/* Connection status */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isTerminalTheme 
              ? 'bg-red-900/30 border border-red-500' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <WifiOff className={`w-4 h-4 ${
              isTerminalTheme ? 'text-red-400' : 'text-red-600'
            }`} />
            <span className={`text-sm font-medium ${
              isTerminalTheme ? 'text-red-400' : 'text-red-600'
            }`}>
              No Internet Connection
            </span>
          </div>
        </div>

        {/* Theme-specific offline content */}
        <div className="mb-6">
          {isTerminalTheme ? (
            <div className="space-y-3">
              <p className="text-green-300 text-sm">
                Terminal interface is temporarily offline.
              </p>
              <div className="bg-black border border-green-500 p-3 rounded text-left font-mono text-xs">
                <div className="text-green-400">$ status --check</div>
                <div className="text-yellow-400">WARNING: Network unreachable</div>
                <div className="text-green-400">$ cache --list</div>
                <div className="text-green-300">• Previous chat sessions</div>
                <div className="text-green-300">• Model configurations</div>
                <div className="text-green-300">• Cost calculations</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                Your enterprise dashboard is temporarily offline.
              </p>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded text-left text-xs">
                <div className="text-gray-700 font-semibold mb-2">Available Offline:</div>
                <div className="space-y-1 text-gray-600">
                  <div>• Cached analytics reports</div>
                  <div>• ROI calculation tools</div>
                  <div>• Previous model performance data</div>
                  <div>• Cost optimization history</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Retry button */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className={`w-full ${
              isTerminalTheme
                ? 'bg-green-600 hover:bg-green-700 text-black border border-green-400'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <p className={`text-xs ${
            isTerminalTheme ? 'text-green-600' : 'text-gray-500'
          }`}>
            Some features may be available offline from your device cache.
          </p>
        </div>

        {/* Network status indicator */}
        <div className="mt-6 pt-4 border-t border-opacity-20 border-current">
          <div className={`inline-flex items-center gap-2 text-xs ${
            isTerminalTheme ? 'text-green-600' : 'text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOnline 
                ? (isTerminalTheme ? 'bg-green-400' : 'bg-green-500')
                : (isTerminalTheme ? 'bg-red-400' : 'bg-red-500')
            }`} />
            {isOnline ? 'Connected' : 'Offline'}
          </div>
        </div>
      </Card>
    </div>
  )
}