'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeStyle = 'arcade' | 'enterprise'

/**
 * Theme switcher component for arcade/enterprise themes
 *
 * Arcade theme: Terminal green aesthetic, dark background
 * Enterprise theme: Professional blue, light/dark modes
 *
 * Persists choice to:
 * 1. localStorage (immediate)
 * 2. Supabase profiles.theme_preference (cross-device sync)
 */
export function ThemeSwitcher() {
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>('arcade')
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme-style') as ThemeStyle
    if (stored && (stored === 'arcade' || stored === 'enterprise')) {
      setThemeStyle(stored)
      applyTheme(stored)
    } else {
      applyTheme('arcade')
    }
  }, [])

  const applyTheme = (theme: ThemeStyle) => {
    // Remove both theme classes first
    document.documentElement.classList.remove('theme-arcade', 'theme-enterprise')
    // Add the selected theme
    document.documentElement.classList.add(`theme-${theme}`)

    // For arcade theme, also ensure dark mode
    if (theme === 'arcade') {
      document.documentElement.classList.add('dark')
    }
  }

  const toggleTheme = () => {
    const newTheme: ThemeStyle = themeStyle === 'arcade' ? 'enterprise' : 'arcade'
    setThemeStyle(newTheme)
    localStorage.setItem('theme-style', newTheme)
    applyTheme(newTheme)

    // TODO: Sync to Supabase profiles.theme_preference
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-8 w-8 transition-colors",
        themeStyle === 'arcade' && "text-[#00ff00] hover:text-[#00ff00]/80",
        themeStyle === 'enterprise' && "text-primary hover:text-primary/80"
      )}
      aria-label={`Switch to ${themeStyle === 'arcade' ? 'enterprise' : 'arcade'} theme`}
    >
      {themeStyle === 'arcade' ? (
        // Terminal icon for arcade theme
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ) : (
        // Briefcase icon for enterprise theme
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )}
    </Button>
  )
}
