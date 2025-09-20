'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import styles from '@/styles/terminal.module.css'

export interface TerminalOutputLine {
  type: 'command' | 'success' | 'error' | 'warning' | 'info' | 'loading' | 'ascii' | 'progress'
  text: string
  progress?: number
  delay?: number
}

interface TerminalOutputProps {
  lines: TerminalOutputLine[]
  typeSpeed?: number
  showCursor?: boolean
  onComplete?: () => void
}

export default function TerminalOutput({
  lines,
  typeSpeed = 50,
  showCursor = true,
  onComplete
}: TerminalOutputProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  // Classic game sound effects simulation
  const playRetroSound = (type: string) => {
    // In a real implementation, you'd use Web Audio API
    console.log(`🔊 Retro ${type} sound`)
  }

  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      setIsTyping(false)
      onComplete?.()
      return
    }

    const currentLine = lines[currentLineIndex]
    const targetText = currentLine.text

    if (currentCharIndex < targetText.length) {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev]
          if (newLines[currentLineIndex] === undefined) {
            newLines[currentLineIndex] = ''
          }
          newLines[currentLineIndex] = targetText.slice(0, currentCharIndex + 1)
          return newLines
        })
        setCurrentCharIndex(prev => prev + 1)

        // Play retro typing sound
        if (Math.random() > 0.8) playRetroSound('type')
      }, typeSpeed)

      return () => clearTimeout(timer)
    } else {
      // Line complete, move to next
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1)
        setCurrentCharIndex(0)

        // Play line complete sound
        playRetroSound(currentLine.type)
      }, currentLine.delay || 500)

      return () => clearTimeout(timer)
    }
  }, [currentLineIndex, currentCharIndex, lines, typeSpeed])

  const getLineClass = (type: string) => {
    switch (type) {
      case 'success': return styles.outputSuccess
      case 'error': return styles.outputError
      case 'warning': return styles.outputWarning
      case 'info': return styles.outputInfo
      case 'loading': return styles.statusLoading
      case 'ascii': return 'text-cyan-400'
      default: return ''
    }
  }

  const renderProgressBar = (progress: number) => (
    <div className={styles.progressBar}>
      <span className="text-green-400">Progress:</span>
      <div className="flex-1 mx-2">
        <div className="bg-gray-800 border border-green-600 h-4 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">
            {progress}%
          </div>
        </div>
      </div>
      <span className="text-amber-400">[{progress === 100 ? 'COMPLETE' : 'LOADING'}]</span>
    </div>
  )

  const renderAsciiProgress = (progress: number) => {
    const blocks = 20
    const filled = Math.floor((progress / 100) * blocks)
    const empty = blocks - filled

    return (
      <div className="font-mono text-green-400">
        <div className="flex items-center gap-2">
          <span>Loading:</span>
          <span className="text-cyan-400">
            [{'█'.repeat(filled)}{'░'.repeat(empty)}]
          </span>
          <span className="text-amber-400">{progress}%</span>
        </div>

        {/* Retro loading animation */}
        <div className="mt-1 text-xs">
          {progress < 100 ? (
            <span className="animate-pulse">
              ⚡ Initializing AI matrix... {['/', '-', '\\', '|'][Math.floor(Date.now() / 200) % 4]}
            </span>
          ) : (
            <span className="text-green-400">
              ✅ Neural pathways established! System ready.
            </span>
          )}
        </div>
      </div>
    )
  }

  const retroBootSequence = [
    "SWAGGY STACKS OS v2.1.0 BOOTING...",
    "████████████████████████████████████████",
    "",
    "Initializing AI Model Discovery Engine...",
    "Loading HuggingFace API drivers... OK",
    "Connecting to RunPod serverless network... OK",
    "Scanning for available models... FOUND 500,000+",
    "",
    "╔══════════════════════════════════════╗",
    "║   🎮 WELCOME TO THE AI ARCADE 🎮    ║",
    "║                                      ║",
    "║  Deploy models like it's 1985!       ║",
    "║  But with 2025 technology.           ║",
    "╚══════════════════════════════════════╝",
    "",
    "System Status: READY FOR DEPLOYMENT",
    "Credits: UNLIMITED",
    "Power Level: OVER 9000! 🔥",
    "",
    "Type 'help' for available commands...",
  ]

  return (
    <div className={styles.terminalOutput}>
      {/* Boot sequence for initial load */}
      {lines.length === 0 && (
        <div className="space-y-1">
          {retroBootSequence.map((line, index) => (
            <div
              key={index}
              className={`${styles.outputLine} ${
                line.includes('OK') ? styles.outputSuccess :
                line.includes('ERROR') ? styles.outputError :
                line.includes('READY') ? 'text-cyan-400 font-bold' :
                line.includes('█') ? 'text-green-600' :
                line.includes('╔') || line.includes('║') || line.includes('╚') ? 'text-yellow-400' :
                'text-green-400'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Dynamic output lines */}
      {displayedLines.map((line, index) => (
        <div key={index} className={`${styles.outputLine} ${getLineClass(lines[index]?.type)}`}>
          {lines[index]?.type === 'progress' ? (
            renderAsciiProgress(lines[index].progress || 0)
          ) : lines[index]?.type === 'ascii' ? (
            <pre className="text-cyan-400">{line}</pre>
          ) : (
            <>
              {/* Command prompt prefix */}
              {lines[index]?.type === 'command' && (
                <span className="text-amber-400">$ </span>
              )}

              {/* Status badges */}
              {lines[index]?.type === 'success' && (
                <Badge variant="outline" className="mr-2 border-green-500 text-green-400">
                  ✓ SUCCESS
                </Badge>
              )}
              {lines[index]?.type === 'error' && (
                <Badge variant="outline" className="mr-2 border-red-500 text-red-400">
                  ✗ ERROR
                </Badge>
              )}
              {lines[index]?.type === 'warning' && (
                <Badge variant="outline" className="mr-2 border-yellow-500 text-yellow-400">
                  ⚠ WARNING
                </Badge>
              )}

              <span>{line}</span>
            </>
          )}
        </div>
      ))}

      {/* Typing cursor */}
      {isTyping && showCursor && (
        <span className={`${styles.cursor} inline-block`}>█</span>
      )}

      {/* Classic arcade "Game Over" or "Level Complete" messages */}
      {!isTyping && lines.length > 0 && (
        <div className="mt-4 text-center">
          <div className="text-cyan-400 text-lg font-bold animate-pulse">
            ★ LEVEL COMPLETE ★
          </div>
          <div className="text-amber-400 text-sm">
            Ready for next command...
          </div>
        </div>
      )}
    </div>
  )
}