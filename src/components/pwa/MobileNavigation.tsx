'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Terminal, 
  TrendingUp, 
  MessageSquare, 
  Search, 
  User, 
  Menu,
  X,
  Home,
  BarChart3,
  Calculator,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface MobileNavigationProps {
  theme?: 'terminal' | 'corporate'
}

export function MobileNavigation({ theme = 'terminal' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Check if running as installed PWA
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )

    // Close menu when route changes
    setIsOpen(false)
  }, [pathname])

  const isTerminalTheme = theme === 'terminal'

  const terminalNavItems = [
    { 
      icon: Terminal, 
      label: 'Terminal', 
      href: '/swaggystacks',
      description: 'Main terminal interface'
    },
    { 
      icon: MessageSquare, 
      label: 'Chat', 
      href: '/chat?theme=terminal',
      description: 'AI chat terminal'
    },
    { 
      icon: Search, 
      label: 'Models', 
      href: '/marketplace?theme=terminal',
      description: 'Browse 500K+ models'
    },
    { 
      icon: Calculator, 
      label: 'Costs', 
      href: '/swaggystacks#cost-calculator',
      description: 'Calculate savings'
    }
  ]

  const corporateNavItems = [
    { 
      icon: TrendingUp, 
      label: 'Dashboard', 
      href: '/scientia',
      description: 'Enterprise dashboard'
    },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      href: '/marketplace?theme=corporate',
      description: 'Model performance'
    },
    { 
      icon: MessageSquare, 
      label: 'AI Chat', 
      href: '/chat?theme=corporate',
      description: 'Enterprise AI assistant'
    },
    { 
      icon: Calculator, 
      label: 'ROI', 
      href: '/scientia#roi-calculator',
      description: 'Investment returns'
    }
  ]

  const navItems = isTerminalTheme ? terminalNavItems : corporateNavItems

  // Bottom navigation for mobile PWA
  if (isStandalone || window.innerWidth <= 768) {
    return (
      <>
        {/* Floating Action Button for menu */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed top-4 right-4 z-50 w-12 h-12 rounded-full shadow-lg ${
            isTerminalTheme
              ? 'bg-green-600 hover:bg-green-700 text-black border-2 border-green-400'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
            <Card className={`absolute top-16 right-4 left-4 p-4 ${
              isTerminalTheme 
                ? 'bg-black border-green-500 border-2' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href.split('?')[0] || 
                    (item.href.includes('#') && pathname === item.href.split('#')[0])
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? isTerminalTheme
                            ? 'bg-green-900/30 border border-green-400 text-green-400'
                            : 'bg-purple-50 border border-purple-200 text-purple-700'
                          : isTerminalTheme
                            ? 'text-green-300 hover:bg-green-900/20'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className={`text-xs ${
                          isTerminalTheme ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Theme switch button */}
              <div className="mt-4 pt-4 border-t border-opacity-20 border-current">
                <Link
                  href={isTerminalTheme ? '/scientia' : '/swaggystacks'}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isTerminalTheme
                      ? 'text-green-300 hover:bg-green-900/20'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isTerminalTheme ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <Terminal className="w-5 h-5" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">
                      Switch to {isTerminalTheme ? 'Corporate' : 'Terminal'}
                    </div>
                    <div className={`text-xs ${
                      isTerminalTheme ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {isTerminalTheme ? 'Scientia Capital' : 'SwaggyStacks'}
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Bottom Navigation Bar for PWA */}
        <div className={`fixed bottom-0 left-0 right-0 z-30 ${
          isTerminalTheme 
            ? 'bg-black border-t-2 border-green-500' 
            : 'bg-white border-t border-gray-200'
        }`}>
          <div className="flex items-center justify-around px-2 py-1">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href.split('?')[0] || 
                (item.href.includes('#') && pathname === item.href.split('#')[0])
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-0 ${
                    isActive
                      ? isTerminalTheme
                        ? 'text-green-400 bg-green-900/30'
                        : 'text-purple-600 bg-purple-50'
                      : isTerminalTheme
                        ? 'text-green-600 hover:text-green-400'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium truncate">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Spacer for bottom navigation */}
        <div className="h-16" />
      </>
    )
  }

  return null
}

// Hook to detect if app is running as PWA
export function usePWAInstalled() {
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  }, [])

  return isInstalled
}