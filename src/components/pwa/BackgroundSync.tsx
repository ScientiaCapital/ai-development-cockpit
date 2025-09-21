'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface QueuedMessage {
  id: string
  timestamp: number
  data: any
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
}

interface BackgroundSyncProps {
  theme?: 'terminal' | 'corporate'
  onMessageQueue?: (message: any) => void
  onMessageSync?: (messageId: string, response: any) => void
}

export function BackgroundSync({ 
  theme = 'terminal', 
  onMessageQueue, 
  onMessageSync 
}: BackgroundSyncProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([])
  const [isRegistered, setIsRegistered] = useState(false)

  const isTerminalTheme = theme === 'terminal'

  // Initialize service worker and IndexedDB
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      initializeBackgroundSync()
    }
    
    // Monitor online status
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine)
      if (navigator.onLine) {
        attemptSync()
      }
    }

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
    }
  }, [])

  const initializeBackgroundSync = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Listen for sync events from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
      
      // Check if background sync is supported
      if ('sync' in registration && registration.sync) {
        setIsRegistered(true)
        await loadQueuedMessages()
      }
    } catch (error) {
      console.error('Failed to initialize background sync:', error)
    }
  }

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data.type === 'CHAT_SYNC_SUCCESS') {
      const { messageId, response } = event.data
      markMessageAsSynced(messageId)
      onMessageSync?.(messageId, response)
      
      toast.success(
        isTerminalTheme 
          ? 'Message synced to terminal' 
          : 'Message synced successfully',
        {
          description: 'Your message was sent when connection restored'
        }
      )
    }
  }

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ChatDB', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('pending_messages')) {
          db.createObjectStore('pending_messages', { keyPath: 'id' })
        }
      }
    })
  }

  const loadQueuedMessages = async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['pending_messages'], 'readonly')
      const store = transaction.objectStore('pending_messages')
      const request = store.getAll()
      
      request.onsuccess = () => {
        setQueuedMessages(request.result || [])
      }
    } catch (error) {
      console.error('Failed to load queued messages:', error)
    }
  }

  const queueMessage = async (messageData: any) => {
    const queuedMessage: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      data: messageData,
      status: 'pending',
      retryCount: 0
    }

    try {
      // Store in IndexedDB
      const db = await openDB()
      const transaction = db.transaction(['pending_messages'], 'readwrite')
      const store = transaction.objectStore('pending_messages')
      await store.add(queuedMessage)
      
      // Update local state
      setQueuedMessages(prev => [...prev, queuedMessage])
      
      // Notify parent component
      onMessageQueue?.(queuedMessage)
      
      // Try to sync immediately if online
      if (isOnline) {
        attemptSync()
      } else {
        toast.info(
          isTerminalTheme 
            ? 'Message queued for terminal sync' 
            : 'Message queued for sync',
          {
            description: 'Will send when connection restored'
          }
        )
      }
      
      return queuedMessage.id
    } catch (error) {
      console.error('Failed to queue message:', error)
      throw error
    }
  }

  const attemptSync = async () => {
    if (!isRegistered) return

    try {
      const registration = await navigator.serviceWorker.ready
      if ('sync' in registration && registration.sync) {
        await registration.sync.register('chat-sync')
      }
    } catch (error) {
      console.error('Failed to register sync:', error)
    }
  }

  const markMessageAsSynced = async (messageId: string) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['pending_messages'], 'readwrite')
      const store = transaction.objectStore('pending_messages')
      await store.delete(messageId)
      
      setQueuedMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Failed to remove synced message:', error)
    }
  }

  const retryFailedMessages = () => {
    if (isOnline) {
      attemptSync()
      toast.info('Retrying failed messages...')
    }
  }

  const clearQueue = async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['pending_messages'], 'readwrite')
      const store = transaction.objectStore('pending_messages')
      await store.clear()
      
      setQueuedMessages([])
      toast.success('Message queue cleared')
    } catch (error) {
      console.error('Failed to clear queue:', error)
    }
  }

  // Public API for components to use
  const backgroundSyncAPI = {
    queueMessage,
    isOnline,
    queuedCount: queuedMessages.length,
    pendingMessages: queuedMessages
  }

  // Store API in window for chat components to access
  useEffect(() => {
    window.backgroundSync = backgroundSyncAPI
  }, [backgroundSyncAPI])

  // Don't render if no queued messages and online
  if (queuedMessages.length === 0 && isOnline) {
    return null
  }

  return (
    <Card className={`fixed bottom-20 right-4 p-3 shadow-lg z-40 w-80 ${
      isTerminalTheme 
        ? 'bg-black border-green-500 border-2 text-green-400' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className={`w-4 h-4 ${isTerminalTheme ? 'text-green-400' : 'text-green-600'}`} />
          ) : (
            <WifiOff className={`w-4 h-4 ${isTerminalTheme ? 'text-red-400' : 'text-red-600'}`} />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {queuedMessages.length > 0 && (
          <div className={`text-xs px-2 py-1 rounded-full ${
            isTerminalTheme 
              ? 'bg-yellow-900/30 border border-yellow-500 text-yellow-400' 
              : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            {queuedMessages.length} queued
          </div>
        )}
      </div>

      {queuedMessages.length > 0 && (
        <div className="space-y-2">
          <div className="max-h-32 overflow-y-auto space-y-1">
            {queuedMessages.slice(0, 3).map((message) => (
              <div
                key={message.id}
                className={`flex items-center gap-2 p-2 rounded text-xs ${
                  isTerminalTheme 
                    ? 'bg-gray-900 border border-green-700' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {message.status === 'pending' && (
                  <Clock className="w-3 h-3 text-yellow-500" />
                )}
                {message.status === 'syncing' && (
                  <Send className="w-3 h-3 text-blue-500 animate-pulse" />
                )}
                {message.status === 'synced' && (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                )}
                {message.status === 'failed' && (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                )}
                
                <span className="flex-1 truncate">
                  Message at {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            
            {queuedMessages.length > 3 && (
              <div className={`text-xs text-center py-1 ${
                isTerminalTheme ? 'text-green-600' : 'text-gray-500'
              }`}>
                +{queuedMessages.length - 3} more messages
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isOnline && (
              <Button
                size="sm"
                onClick={retryFailedMessages}
                disabled={!isOnline}
                className={`flex-1 text-xs ${
                  isTerminalTheme
                    ? 'bg-green-600 hover:bg-green-700 text-black'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Send className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={clearQueue}
              className={`text-xs ${
                isTerminalTheme
                  ? 'border-green-400 text-green-400 hover:bg-green-900/20'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// Global type declaration is handled in src/types/global.d.ts