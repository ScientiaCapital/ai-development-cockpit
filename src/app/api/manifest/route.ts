import { NextRequest, NextResponse } from 'next/server'

interface PWAManifest {
  name: string
  short_name: string
  description: string
  start_url: string
  display: string
  background_color: string
  theme_color: string
  orientation: string
  icons: Array<{
    src: string
    sizes: string
    type: string
    purpose: string
  }>
  screenshots?: Array<{
    src: string
    sizes: string
    type: string
    form_factor: string
  }>
  categories: string[]
  lang: string
  scope: string
  shortcuts: Array<{
    name: string
    short_name: string
    description: string
    url: string
    icons: Array<{
      src: string
      sizes: string
    }>
  }>
}

const arcadeManifest: PWAManifest = {
  name: 'AI Dev Cockpit - Developer AI Terminal',
  short_name: 'AI Dev Cockpit',
  description: 'Terminal-style AI development platform with 500K+ models and 97% cost savings',
  start_url: '/arcade',
  display: 'standalone',
  background_color: '#000000',
  theme_color: '#00ff00',
  orientation: 'portrait-primary',
  icons: [
    {
      src: '/icons/arcade/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/icons/arcade/icon-256x256.png',
      sizes: '256x256',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/icons/arcade/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/icons/arcade/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable any'
    }
  ],
  screenshots: [
    {
      src: '/screenshots/arcade/mobile.png',
      sizes: '390x844',
      type: 'image/png',
      form_factor: 'narrow'
    },
    {
      src: '/screenshots/arcade/desktop.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide'
    }
  ],
  categories: ['developer tools', 'ai', 'productivity', 'terminal'],
  lang: 'en',
  scope: '/',
  shortcuts: [
    {
      name: 'Terminal Chat',
      short_name: 'Chat',
      description: 'Open AI chat terminal',
      url: '/chat?theme=terminal',
      icons: [
        {
          src: '/icons/arcade/icon-192x192.png',
          sizes: '192x192'
        }
      ]
    },
    {
      name: 'Model Browser',
      short_name: 'Models',
      description: 'Browse 500K+ AI models',
      url: '/marketplace?theme=terminal',
      icons: [
        {
          src: '/icons/arcade/icon-192x192.png',
          sizes: '192x192'
        }
      ]
    },
    {
      name: 'Cost Calculator',
      short_name: 'Costs',
      description: 'Calculate deployment costs',
      url: '/arcade#cost-calculator',
      icons: [
        {
          src: '/icons/arcade/icon-192x192.png',
          sizes: '192x192'
        }
      ]
    }
  ]
}

const enterpriseManifest: PWAManifest = {
  name: 'Enterprise - Enterprise AI Platform',
  short_name: 'Enterprise',
  description: 'Enterprise AI platform for C-suite decision making and ROI optimization',
  start_url: '/enterprise',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#8B5CF6',
  orientation: 'portrait-primary',
  icons: [
    {
      src: '/icons/enterprise/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/icons/enterprise/icon-256x256.png',
      sizes: '256x256',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/icons/enterprise/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/icons/enterprise/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable any'
    }
  ],
  screenshots: [
    {
      src: '/screenshots/enterprise/mobile.png',
      sizes: '390x844',
      type: 'image/png',
      form_factor: 'narrow'
    },
    {
      src: '/screenshots/enterprise/desktop.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide'
    }
  ],
  categories: ['business', 'ai', 'analytics', 'enterprise'],
  lang: 'en',
  scope: '/',
  shortcuts: [
    {
      name: 'AI Dashboard',
      short_name: 'Dashboard',
      description: 'View ROI analytics dashboard',
      url: '/enterprise#dashboard',
      icons: [
        {
          src: '/icons/enterprise/icon-192x192.png',
          sizes: '192x192'
        }
      ]
    },
    {
      name: 'Model Analytics',
      short_name: 'Analytics',
      description: 'Enterprise model performance',
      url: '/marketplace?theme=corporate',
      icons: [
        {
          src: '/icons/enterprise/icon-192x192.png',
          sizes: '192x192'
        }
      ]
    },
    {
      name: 'ROI Calculator',
      short_name: 'ROI',
      description: 'Calculate AI investment returns',
      url: '/enterprise#roi-calculator',
      icons: [
        {
          src: '/icons/enterprise/icon-192x192.png',
          sizes: '192x192'
        }
      ]
    }
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const theme = searchParams.get('theme')
  const referer = request.headers.get('referer') || ''
  
  // Determine theme from URL or referer
  let manifest: PWAManifest
  
  if (theme === 'terminal' || referer.includes('/arcade')) {
    manifest = arcadeManifest
  } else if (theme === 'corporate' || referer.includes('/enterprise')) {
    manifest = enterpriseManifest
  } else {
    // Default to AI Dev Cockpit for developers
    manifest = arcadeManifest
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}