'use client'

import { ReactNode } from 'react'
import styles from '@/styles/terminal.module.css'

interface TerminalWindowProps {
  children: ReactNode
  title?: string
  className?: string
}

export default function TerminalWindow({
  children,
  title = "SwaggyStacks Terminal v2.1.0",
  className = ""
}: TerminalWindowProps) {
  return (
    <div className={`${styles.terminalWindow} ${className}`}>
      {/* Terminal Header with classic controls */}
      <div className={styles.terminalHeader}>
        <div className={styles.terminalControls}>
          <div className={`${styles.terminalControl} ${styles.close}`}></div>
          <div className={`${styles.terminalControl} ${styles.minimize}`}></div>
          <div className={`${styles.terminalControl} ${styles.maximize}`}></div>
        </div>
        <div className={styles.terminalTitle}>{title}</div>
        <div className="ml-auto text-green-400 text-xs">
          ░░▒▒▓▓██ CONNECTED ██▓▓▒▒░░
        </div>
      </div>

      {/* Terminal Content */}
      <div className={styles.terminalContent}>
        {children}
      </div>
    </div>
  )
}