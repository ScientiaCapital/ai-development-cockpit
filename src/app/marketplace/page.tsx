'use client'

import { useState } from 'react'
import ModelMarketplace from '@/components/terminal/ModelMarketplace'
import { Button } from '@/components/ui/button'
import styles from '@/styles/terminal.module.css'

export default function MarketplacePage() {
  const [currentOrganization, setCurrentOrganization] = useState<'swaggystacks' | 'scientiacapital'>('swaggystacks')

  const handleOrganizationSwitch = () => {
    setCurrentOrganization(prev => prev === 'swaggystacks' ? 'scientiacapital' : 'swaggystacks')
  }

  const handleModelDeploy = (modelId: string) => {
    console.log(`🚀 Deploying model ${modelId} for ${currentOrganization}`)
    // TODO: Integrate with RunPod API
  }

  const asciiHeader = currentOrganization === 'swaggystacks' ? `
╔═══════════════════════════════════════════════════════════════════════════════════╗
║  🎮🕹️  SWAGGY STACKS MODEL ARCADE  🕹️🎮                                           ║
║                                                                                   ║
║  ████████   █       █   ████████    ███████    ███████   █       █                ║
║  █          █       █   █       █   █          █         █       █                ║
║  █████      █   █   █   ████████    █   ███    █   ███   █   █   █                ║
║      █      █   █   █   █       █   █     █    █     █   █   █   █                ║
║  █████       ███ ███    █       █   ███████    ███████    ███ ███                 ║
║                                                                                   ║
║  Deploy AI models like it's 1985... but with 2025 technology! 🚀                 ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
` : `
╔═══════════════════════════════════════════════════════════════════════════════════╗
║  🏢💼  SCIENTIA CAPITAL EXECUTIVE COMMAND CENTER  💼🏢                            ║
║                                                                                   ║
║  ████████   █████   █  █████  █     █ █████ █  ████████                          ║
║  █       █ █        █ █       █     █   █   █  █       █                         ║
║  ████████ █         █ █████   ███ ███   █   █  ████████                          ║
║  █       █ █        █ █       █  █  █   █   █  █       █                         ║
║  █       █  █████   █ █████   █     █   █   █  █       █                         ║
║                                                                                   ║
║  Enterprise AI Infrastructure for Fortune 500 Decision Makers 📊                 ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
`

  return (
    <div className={`${styles.terminal} min-h-screen`}>
      <div className="container mx-auto p-6">
        {/* ASCII Header */}
        <pre className={`${styles.asciiArt} text-center mb-8 ${currentOrganization === 'swaggystacks' ? 'text-green-400' : 'text-amber-400'}`}>
          {asciiHeader}
        </pre>

        {/* Organization Switcher */}
        <div className="flex justify-center mb-8">
          <div className={`${styles.terminalWindow} p-4`}>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-bold">ACTIVE ORGANIZATION:</span>
              <span className={`font-bold uppercase ${currentOrganization === 'swaggystacks' ? 'text-green-400' : 'text-amber-400'}`}>
                {currentOrganization === 'swaggystacks' ? '🎮 SWAGGY STACKS' : '🏢 SCIENTIA CAPITAL'}
              </span>
              <Button
                onClick={handleOrganizationSwitch}
                className={`${styles.terminalButton} ${styles.primary}`}
              >
                SWITCH ORGANIZATION
              </Button>
            </div>
          </div>
        </div>

        {/* Main Marketplace */}
        <ModelMarketplace
          organization={currentOrganization}
          onDeploy={handleModelDeploy}
        />

        {/* Footer Status */}
        <div className={`${styles.terminalWindow} mt-8 p-4`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-green-400">STATUS: ONLINE</span>
              <span className="text-cyan-400">MODELS: 500,000+</span>
              <span className="text-amber-400">DEPLOYMENT COST: 97% SAVINGS</span>
            </div>
            <div className="text-gray-400 text-sm">
              Powered by RunPod Serverless • HuggingFace • {currentOrganization.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}