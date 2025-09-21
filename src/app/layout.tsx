import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { HuggingFaceAuthProvider } from '@/contexts/HuggingFaceAuth'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { PWAProvider } from '@/components/pwa/PWAProvider'
import { ReactScanProvider } from '@/components/performance/ReactScanProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dual-Domain LLM Platform',
  description: 'Democratizing access to 500,000+ AI models through mobile-first PWA with dual-theme experience',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8B5CF6' },
    { media: '(prefers-color-scheme: dark)', color: '#00ff00' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LLM Platform',
    startupImage: [
      {
        url: '/splash/apple-splash-2048-2732.jpg',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splash/apple-splash-1668-2224.jpg', 
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splash/apple-splash-1536-2048.jpg',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)'
      }
    ]
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: 'Dual-Domain LLM Platform',
    title: 'Access 500,000+ AI Models - 97% Cost Savings',
    description: 'Mobile-first PWA for developers and enterprises with terminal and corporate themes',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dual-Domain LLM Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dual-Domain LLM Platform',
    description: 'Mobile-first PWA for AI model access with 97% cost savings',
    images: ['/twitter-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LLM Platform" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ReactScanProvider enabled={process.env.NODE_ENV === 'development'}>
          <ThemeProvider>
            <AuthProvider>
              <HuggingFaceAuthProvider>
                <PWAProvider>
                  {children}
                </PWAProvider>
              </HuggingFaceAuthProvider>
            </AuthProvider>
          </ThemeProvider>
        </ReactScanProvider>
      </body>
    </html>
  )
}