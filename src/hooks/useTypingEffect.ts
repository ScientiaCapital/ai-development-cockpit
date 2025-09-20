'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseTypingEffectOptions {
  speed?: number
  startDelay?: number
  onComplete?: () => void
  loop?: boolean
}

export function useTypingEffect(
  text: string | string[],
  options: UseTypingEffectOptions = {}
) {
  const {
    speed = 50,
    startDelay = 0,
    onComplete,
    loop = false
  } = options

  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const textArray = Array.isArray(text) ? text : [text]
  const currentText = textArray[Math.floor(currentIndex / 100)] || ''

  const startTyping = useCallback(() => {
    setIsTyping(true)
    setIsComplete(false)
    setCurrentIndex(0)
    setDisplayText('')
  }, [])

  const resetTyping = useCallback(() => {
    setIsTyping(false)
    setIsComplete(false)
    setCurrentIndex(0)
    setDisplayText('')
  }, [])

  useEffect(() => {
    if (!isTyping) return

    const timer = setTimeout(() => {
      if (currentIndex < currentText.length) {
        setDisplayText(currentText.slice(0, currentIndex + 1))
        setCurrentIndex(prev => prev + 1)
      } else {
        setIsTyping(false)
        setIsComplete(true)
        onComplete?.()

        if (loop && textArray.length > 1) {
          setTimeout(() => {
            const nextTextIndex = (Math.floor(currentIndex / 100) + 1) % textArray.length
            setCurrentIndex(nextTextIndex * 100)
            setDisplayText('')
            setIsTyping(true)
          }, 2000)
        }
      }
    }, speed)

    return () => clearTimeout(timer)
  }, [currentIndex, currentText, isTyping, speed, onComplete, loop, textArray])

  useEffect(() => {
    const timer = setTimeout(() => {
      startTyping()
    }, startDelay)

    return () => clearTimeout(timer)
  }, [startDelay, startTyping])

  return {
    displayText,
    isTyping,
    isComplete,
    startTyping,
    resetTyping
  }
}

// Command history hook for terminal
export function useCommandHistory() {
  const [history, setHistory] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const addCommand = useCallback((command: string) => {
    if (command.trim()) {
      setHistory(prev => [...prev, command.trim()])
      setCurrentIndex(-1)
    }
  }, [])

  const getPreviousCommand = useCallback(() => {
    if (history.length === 0) return ''

    const newIndex = currentIndex === -1 ? history.length - 1 : Math.max(0, currentIndex - 1)
    setCurrentIndex(newIndex)
    return history[newIndex] || ''
  }, [history, currentIndex])

  const getNextCommand = useCallback(() => {
    if (history.length === 0 || currentIndex === -1) return ''

    const newIndex = Math.min(history.length - 1, currentIndex + 1)
    setCurrentIndex(newIndex)
    return history[newIndex] || ''
  }, [history, currentIndex])

  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
  }, [])

  return {
    history,
    addCommand,
    getPreviousCommand,
    getNextCommand,
    clearHistory
  }
}

// Retro terminal theme hook
export function useTerminalTheme() {
  const [theme, setTheme] = useState<'classic' | 'amber' | 'cyan' | 'matrix'>('classic')
  const [scanlines, setScanlines] = useState(true)
  const [glow, setGlow] = useState(true)

  const themes = {
    classic: {
      primary: '#00ff00',
      secondary: '#008f00',
      accent: '#ffb000',
      background: '#0a0a0a'
    },
    amber: {
      primary: '#ffb000',
      secondary: '#cc8800',
      accent: '#00ff00',
      background: '#1a1100'
    },
    cyan: {
      primary: '#00ffff',
      secondary: '#0088cc',
      accent: '#ff00ff',
      background: '#001122'
    },
    matrix: {
      primary: '#00ff41',
      secondary: '#004411',
      accent: '#ffffff',
      background: '#000000'
    }
  }

  const applyTheme = useCallback((newTheme: typeof theme) => {
    setTheme(newTheme)
    const colors = themes[newTheme]

    const root = document.documentElement
    root.style.setProperty('--terminal-primary', colors.primary)
    root.style.setProperty('--terminal-secondary', colors.secondary)
    root.style.setProperty('--terminal-accent', colors.accent)
    root.style.setProperty('--terminal-bg', colors.background)
  }, [])

  return {
    theme,
    scanlines,
    glow,
    applyTheme,
    setScanlines,
    setGlow,
    themes
  }
}