'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TerminalWindow,
  TerminalPrompt,
  TerminalOutput,
  ASCIILogo,
  type TerminalOutputLine
} from '@/components/terminal'
import { useTypingEffect, useCommandHistory, useTerminalTheme } from '@/hooks/useTypingEffect'
import styles from '@/styles/terminal.module.css'

export default function SwaggyStacksPage() {
  const [activeCommand, setActiveCommand] = useState('')
  const [terminalLines, setTerminalLines] = useState<TerminalOutputLine[]>([])
  const [showModelBrowser, setShowModelBrowser] = useState(false)
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [isDeploying, setIsDeploying] = useState(false)

  const { addCommand, history } = useCommandHistory()
  const { applyTheme } = useTerminalTheme()

  // Initialize with classic green terminal theme
  useEffect(() => {
    applyTheme('classic')
  }, [applyTheme])

  const handleCommand = (command: string) => {
    addCommand(command)
    setActiveCommand(command)

    // Parse retro terminal commands
    const cmd = command.toLowerCase().trim()

    if (cmd === 'help' || cmd === 'h') {
      showHelp()
    } else if (cmd === 'models' || cmd === 'list') {
      showModels()
    } else if (cmd.startsWith('deploy ')) {
      const model = cmd.replace('deploy ', '')
      deployModel(model)
    } else if (cmd === 'clear') {
      setTerminalLines([])
    } else if (cmd === 'retro' || cmd === 'arcade') {
      showRetroMode()
    } else if (cmd === 'stats') {
      showStats()
    } else {
      setTerminalLines(prev => [...prev,
        { type: 'command', text: `$ ${command}` },
        { type: 'error', text: `Command not found: ${command}. Type 'help' for available commands.` }
      ])
    }
  }

  const showHelp = () => {
    const helpLines: TerminalOutputLine[] = [
      { type: 'command', text: '$ help' },
      { type: 'info', text: '╔══════════ SWAGGY STACKS ARCADE COMMANDS ══════════╗' },
      { type: 'info', text: '║                                                   ║' },
      { type: 'success', text: '║  🎮 GAME COMMANDS:                               ║' },
      { type: 'info', text: '║    help          - Show this help screen          ║' },
      { type: 'info', text: '║    models        - Browse AI model arcade         ║' },
      { type: 'info', text: '║    deploy <name> - Deploy model to RunPod         ║' },
      { type: 'info', text: '║    stats         - Show deployment statistics     ║' },
      { type: 'info', text: '║    clear         - Clear terminal screen          ║' },
      { type: 'info', text: '║    retro         - Enable retro arcade mode       ║' },
      { type: 'info', text: '║                                                   ║' },
      { type: 'warning', text: '║  🕹️  POWER-UPS:                                 ║' },
      { type: 'info', text: '║    Theme: Classic Terminal Green                  ║' },
      { type: 'info', text: '║    Cost Multiplier: 0.03x (97% savings!)         ║' },
      { type: 'info', text: '║    Model Database: 500,000+ unlocked             ║' },
      { type: 'info', text: '║                                                   ║' },
      { type: 'info', text: '╚═══════════════════════════════════════════════════╝' },
      { type: 'success', text: '' },
      { type: 'success', text: 'Ready to play! Type a command to continue...' }
    ]
    setTerminalLines(prev => [...prev, ...helpLines])
  }

  const showModels = () => {
    setShowModelBrowser(true)
    const modelLines: TerminalOutputLine[] = [
      { type: 'command', text: '$ models' },
      { type: 'loading', text: 'Scanning HuggingFace model database...', delay: 1000 },
      { type: 'ascii', text: `
    ┌──────────────────────────────────────────────────────┐
    │                 🎮 MODEL ARCADE 🎮                  │
    ├──────────────────────────────────────────────────────┤
    │ MODEL_ID               SIZE    COST/HR    STATUS     │
    ├──────────────────────────────────────────────────────┤
    │ meta-llama/Llama-3.2   7B      $0.10      READY ✅  │
    │ microsoft/DialoGPT     117M     $0.05      READY ✅  │
    │ openai/gpt-4          ~1.7T     $30.00     LOCKED 🔒 │
    │ anthropic/claude       ~500B    $15.00     LOCKED 🔒 │
    │ google/gemini          ~540B    $7.00      LOCKED 🔒 │
    ├──────────────────────────────────────────────────────┤
    │ 🎯 TARGET: Deploy open-source models for 97% savings │
    │ 💰 CREDITS: UNLIMITED                                │
    │ 🏆 HIGH SCORE: 500,000+ models discovered            │
    └──────────────────────────────────────────────────────┘`, delay: 2000 },
      { type: 'success', text: 'Use: deploy <model-name> to activate deployment sequence!' }
    ]
    setTerminalLines(prev => [...prev, ...modelLines])
  }

  const deployModel = (modelName: string) => {
    setIsDeploying(true)
    setDeploymentProgress(0)

    const deployLines: TerminalOutputLine[] = [
      { type: 'command', text: `$ deploy ${modelName}` },
      { type: 'info', text: '🎮 DEPLOYMENT SEQUENCE INITIATED 🎮' },
      { type: 'loading', text: 'Inserting quarter... 💰' },
      { type: 'success', text: 'Player Ready!' },
      { type: 'progress', text: 'Level 1: Connecting to RunPod...', progress: 25 },
    ]

    setTerminalLines(prev => [...prev, ...deployLines])

    // Simulate retro game-style deployment
    const progressSteps = [
      { progress: 25, text: 'Level 1: RunPod connection established! 🔗' },
      { progress: 50, text: 'Level 2: Docker container spawning... 🐳' },
      { progress: 75, text: 'Level 3: Model weights loading... ⚡' },
      { progress: 100, text: 'GAME OVER - YOU WIN! 🏆 Model deployed successfully!' }
    ]

    progressSteps.forEach((step, index) => {
      setTimeout(() => {
        setDeploymentProgress(step.progress)
        setTerminalLines(prev => [...prev, {
          type: step.progress === 100 ? 'success' : 'info',
          text: step.text
        }])

        if (step.progress === 100) {
          setIsDeploying(false)
          setTerminalLines(prev => [...prev, {
            type: 'success',
            text: `🎊 Endpoint ready: https://api.runpod.ai/v2/${modelName.toLowerCase()}/runsync`
          }])
        }
      }, (index + 1) * 1500)
    })
  }

  const showStats = () => {
    const statsLines: TerminalOutputLine[] = [
      { type: 'command', text: '$ stats' },
      { type: 'ascii', text: `
    ╔═══════════════════════════════════════════════════════╗
    ║                 🎮 PLAYER STATISTICS 🎮              ║
    ╠═══════════════════════════════════════════════════════╣
    ║  Models Deployed: 1,337                              ║
    ║  Total Savings: $42,069 (vs OpenAI/Anthropic)       ║
    ║  Current Streak: 🔥 420 successful deployments       ║
    ║  Favorite Model: meta-llama/Llama-3.2-7B             ║
    ║  Power Level: OVER 9000! ⚡                           ║
    ║                                                       ║
    ║  🏆 ACHIEVEMENTS UNLOCKED:                            ║
    ║  ✅ First Deployment (Deploy your first model)       ║
    ║  ✅ Cost Saver (Save $1000+ vs traditional APIs)     ║
    ║  ✅ Speed Demon (Sub-3min deployment time)           ║
    ║  ✅ Model Master (Deploy 100+ different models)      ║
    ║  🔒 Arcade Legend (Deploy 10,000+ models) - LOCKED   ║
    ╚═══════════════════════════════════════════════════════╝` },
      { type: 'success', text: 'Keep playing to unlock more achievements! 🎯' }
    ]
    setTerminalLines(prev => [...prev, ...statsLines])
  }

  const showRetroMode = () => {
    setTerminalLines(prev => [...prev,
      { type: 'command', text: '$ retro' },
      { type: 'success', text: '🕹️ RETRO ARCADE MODE ACTIVATED! 🕹️' },
      { type: 'info', text: 'Welcome to 1985... but with 2025 AI technology!' }
    ])
  }

  return (
    <div className={`${styles.terminal} min-h-screen relative overflow-hidden`}>
      {/* Retro scanlines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-green-500 to-transparent opacity-20 animate-pulse" />
      </div>

      {/* Terminal Header */}
      <div className="sticky top-0 z-50 bg-black border-b border-green-600 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-green-400 font-bold text-lg font-mono">
              █▓▒░ SWAGGY STACKS ARCADE ░▒▓█
            </div>
            <Badge variant="outline" className="border-green-500 text-green-400">
              PLAYER 1
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-amber-400 text-sm font-mono">
              CREDITS: ∞ | LEVEL: PRO | STATUS: ONLINE ●
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-green-500 text-green-400 hover:bg-green-500/20"
              onClick={() => window.location.href = '/scientia'}
            >
              SWITCH TO ENTERPRISE MODE
            </Button>
          </div>
        </div>
      </div>

      {/* Main Terminal Interface */}
      <div className="container mx-auto p-4 pt-20 pb-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ASCII Logo Section */}
          <div className="lg:col-span-1">
            <Card className="bg-black border-green-600 h-fit">
              <CardContent className="p-4">
                <ASCIILogo animated={true} size="small" glow={true} />
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="bg-black border-amber-600 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 font-mono text-sm">
                  🏆 QUICK STATS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-400">Models Available:</span>
                  <span className="text-white">500,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Cost Savings:</span>
                  <span className="text-white">97%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Avg Deploy Time:</span>
                  <span className="text-white">2.3 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Success Rate:</span>
                  <span className="text-white">99.9%</span>
                </div>
                <hr className="border-amber-800 my-2" />
                <div className="text-center text-amber-400">
                  ⚡ POWER LEVEL: MAXIMUM ⚡
                </div>
              </CardContent>
            </Card>

            {/* Theme Selector */}
            <Card className="bg-black border-cyan-600 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-400 font-mono text-sm">
                  🎨 ARCADE THEMES
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {['classic', 'amber', 'cyan', 'matrix'].map((theme) => (
                  <Button
                    key={theme}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start font-mono text-xs border-gray-600 hover:bg-green-500/20"
                    onClick={() => applyTheme(theme as any)}
                  >
                    {theme === 'classic' && '🟢'}
                    {theme === 'amber' && '🟡'}
                    {theme === 'cyan' && '🔵'}
                    {theme === 'matrix' && '🟢'}
                    {theme.toUpperCase()}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Terminal Window */}
          <div className="lg:col-span-2">
            <TerminalWindow title="SwaggyStacks AI Arcade Terminal v2.1.0">
              <TerminalOutput lines={terminalLines} />
              <TerminalPrompt
                user="swaggy"
                directory="~/ai-arcade"
                onCommand={handleCommand}
                placeholder="Type 'help' to start your AI adventure..."
              />
            </TerminalWindow>

            {/* Deployment Progress */}
            {isDeploying && (
              <Card className="mt-4 bg-black border-yellow-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-yellow-400 font-mono text-sm flex items-center gap-2">
                    🚀 DEPLOYMENT IN PROGRESS
                    <span className="animate-spin">⚡</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={deploymentProgress} className="mb-2" />
                  <div className="text-center text-green-400 font-mono text-sm">
                    {deploymentProgress}% Complete - {
                      deploymentProgress < 25 ? 'Connecting...' :
                      deploymentProgress < 50 ? 'Building...' :
                      deploymentProgress < 75 ? 'Loading...' :
                      deploymentProgress < 100 ? 'Finalizing...' :
                      'GAME OVER - YOU WIN! 🏆'
                    }
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Retro Footer/Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-green-600 p-2 z-40">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-4">
            <span className="text-green-400">
              ░▒▓█ SWAGGY STACKS v2.1.0 █▓▒░
            </span>
            <Badge variant="outline" className="border-green-500 text-green-400">
              {terminalLines.length} COMMANDS EXECUTED
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-amber-400">
              🎮 MADE BY DEVS, FOR DEVS
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:bg-green-500/20 text-xs"
                onClick={() => window.open('https://github.com/swaggystacks', '_blank')}
              >
                GITHUB
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:bg-green-500/20 text-xs"
                onClick={() => window.open('https://discord.gg/swaggystacks', '_blank')}
              >
                DISCORD
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:bg-green-500/20 text-xs"
                onClick={() => handleCommand('help')}
              >
                API DOCS
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Easter Egg: Konami Code Detection */}
      <div className="hidden">
        {/* This would be activated by the Konami code sequence */}
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🎊</div>
            <div className="text-green-400 text-2xl font-mono mb-4">
              KONAMI CODE ACTIVATED!
            </div>
            <div className="text-amber-400 font-mono">
              UNLIMITED DEPLOYMENTS UNLOCKED!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}