'use client'

import { useState, useEffect } from 'react'
import styles from '@/styles/terminal.module.css'

interface TerminalPromptProps {
  user?: string
  directory?: string
  onCommand?: (command: string) => void
  placeholder?: string
  showCursor?: boolean
}

export default function TerminalPrompt({
  user = "swaggy",
  directory = "~/ai-stacks",
  onCommand,
  placeholder = "Type 'help' for available commands...",
  showCursor = true
}: TerminalPromptProps) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && onCommand) {
      onCommand(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Add retro gaming sound effect on keypress (optional)
    if (e.key === 'Enter') {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 100)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.terminalPrompt}>
      {/* Retro-style prompt prefix */}
      <span className={styles.promptPrefix}>
        ┌──[<span className="text-amber-400">{user}</span>@<span className="text-green-400">swaggy-terminal</span>]
        <br />
        └─$
      </span>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className={styles.promptInput}
        placeholder={placeholder}
        autoFocus
      />

      {/* Animated cursor */}
      {showCursor && <span className={styles.cursor}>█</span>}
    </form>
  )
}