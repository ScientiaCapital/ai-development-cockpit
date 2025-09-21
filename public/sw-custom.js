// Custom Service Worker for Dual-Domain LLM Platform PWA
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies'
import { BackgroundSync } from 'workbox-background-sync'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// Skip waiting and claim clients immediately
self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Theme detection utility
function getThemeFromUrl(url) {
  if (url.includes('/swaggystacks') || url.includes('swaggystacks.com')) {
    return 'terminal'
  } else if (url.includes('/scientia') || url.includes('scientiacapital.com')) {
    return 'corporate'
  }
  return 'terminal' // default
}

// Custom offline page handler
const offlineHandler = async (options) => {
  const { request } = options
  const theme = getThemeFromUrl(request.url)
  
  try {
    // Try to get the page from cache first
    const cache = await caches.open('pages-cache')
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // If not in cache, try network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Return theme-specific offline page
    return caches.match(`/offline?theme=${theme}`)
  }
}

// Navigation routes with offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  offlineHandler
)

// API caching strategies
registerRoute(
  /^https:\/\/api\.huggingface\.co\/models/,
  new StaleWhileRevalidate({
    cacheName: 'huggingface-models',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      })
    ]
  })
)

// Chat API with background sync
const chatBgSync = new BackgroundSync('chat-queue', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
})

registerRoute(
  /\/api\/inference\/stream/,
  new NetworkOnly({
    plugins: [chatBgSync]
  }),
  'POST'
)

// Model marketplace API
registerRoute(
  /\/api\/models/,
  new NetworkFirst({
    cacheName: 'models-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 30 // 30 minutes
      })
    ]
  })
)

// Static assets with long-term caching
registerRoute(
  /\.(?:js|css|woff|woff2|ttf|otf)$/,
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
)

// Images with efficient caching
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
      })
    ]
  })
)

// Google Fonts optimization
registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets'
  })
)

registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      })
    ]
  })
)

// Background sync for chat messages
self.addEventListener('sync', event => {
  if (event.tag === 'chat-sync') {
    event.waitUntil(syncChatMessages())
  }
})

async function syncChatMessages() {
  try {
    // Get pending chat messages from IndexedDB
    const pendingMessages = await getPendingChatMessages()
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/inference/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message.data)
        })
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingChatMessage(message.id)
          
          // Notify the client about successful sync
          const clients = await self.clients.matchAll()
          clients.forEach(client => {
            client.postMessage({
              type: 'CHAT_SYNC_SUCCESS',
              messageId: message.id,
              response: response
            })
          })
        }
      } catch (error) {
        console.error('Failed to sync chat message:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// IndexedDB helpers for chat message queue
async function getPendingChatMessages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['pending_messages'], 'readonly')
      const store = transaction.objectStore('pending_messages')
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }
    
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('pending_messages')) {
        db.createObjectStore('pending_messages', { keyPath: 'id' })
      }
    }
  })
}

async function removePendingChatMessage(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['pending_messages'], 'readwrite')
      const store = transaction.objectStore('pending_messages')
      const deleteRequest = store.delete(id)
      
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

// Install prompt handling
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' })
  }
})

// Performance optimization: preload critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('critical-resources').then(cache => {
      return cache.addAll([
        '/',
        '/swaggystacks',
        '/scientia',
        '/marketplace',
        '/chat',
        '/offline?theme=terminal',
        '/offline?theme=corporate',
        '/api/manifest?theme=terminal',
        '/api/manifest?theme=corporate'
      ])
    })
  )
})

// Web Vitals optimization: preload critical API data
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  
  // Preload model data for faster LCP
  if (url.pathname === '/' || url.pathname === '/marketplace') {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          // Serve from cache immediately
          fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              caches.open('pages-cache').then(cache => {
                cache.put(event.request, networkResponse)
              })
            }
          }).catch(() => {})
          return response
        }
        
        // Network first for initial load
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            caches.open('pages-cache').then(cache => {
              cache.put(event.request, networkResponse.clone())
            })
          }
          return networkResponse
        }).catch(() => {
          return caches.match('/offline')
        })
      })
    )
  }
})

console.log('🚀 Custom PWA Service Worker loaded with dual-theme support!')