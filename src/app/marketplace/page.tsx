'use client'

import { useState } from 'react'
import ModelMarketplace from '@/components/terminal/ModelMarketplace'
import { Button } from '@/components/ui/button'
import { useInference } from '@/hooks/useInference'
import { useOrganization } from '@/hooks/useOrganization'
import styles from '@/styles/terminal.module.css'

export default function MarketplacePage() {
  const { currentOrganization } = useOrganization()
  const [currentTheme] = useState<'arcade' | 'enterprise'>('arcade')

  const {
    state: inferenceState,
    models: availableModels,
    setModel,
    generateText,
    estimateCost,
    scaleEndpoint
  } = useInference({
    autoScale: true,
    enableMetrics: true,
    preferredCostTier: 'medium'
  })

  const handleModelDeploy = async (modelId: string) => {
    console.log(`Deploying model ${modelId}`)

    try {
      // Find the model in our available models
      const targetModel = availableModels.find(m => m.id === modelId || m.name.includes(modelId))

      if (targetModel) {
        // Set the model for testing
        setModel(targetModel)

        // Scale endpoint for deployment
        await scaleEndpoint('standard')

        console.log(`Model ${targetModel.displayName} deployed successfully`)

        // Redirect to chat interface for testing
        window.location.href = '/chat'
      } else {
        console.warn(`Model ${modelId} not found in available models`)
      }
    } catch (error) {
      console.error('Failed to deploy model:', error)
    }
  }

  const handleModelTest = async (modelId: string) => {
    console.log(`Testing model ${modelId}`)

    try {
      const targetModel = availableModels.find(m => m.id === modelId || m.name.includes(modelId))

      if (targetModel) {
        setModel(targetModel)

        // Test with a simple prompt
        const testPrompt = 'Write a simple Python function to calculate fibonacci numbers.'

        const cost = estimateCost(testPrompt, 100, targetModel)
        console.log(`Estimated cost for test: $${cost.toFixed(4)}`)

        const response = await generateText({
          prompt: testPrompt,
          maxTokens: 100,
          temperature: 0.7
        })

        if (response) {
          console.log(`Test successful:`, response.text.substring(0, 100) + '...')
          alert(`Model test successful! Cost: $${cost.toFixed(4)}\n\nResponse preview: ${response.text.substring(0, 150)}...`)
        }
      }
    } catch (error) {
      console.error('Model test failed:', error)
      alert('Model test failed. Please check console for details.')
    }
  }

  const asciiHeader = `
╔═══════════════════════════════════════════════════════════════════════════════════╗
║  🤖🚀  AI DEV COCKPIT - MODEL MARKETPLACE  🚀🤖                                   ║
║                                                                                   ║
║   █████╗ ██╗    ██████╗ ███████╗██╗   ██╗     ██████╗ ██████╗  ██████╗██╗  ██╗   ║
║  ██╔══██╗██║    ██╔══██╗██╔════╝██║   ██║    ██╔════╝██╔═══██╗██╔════╝██║ ██╔╝   ║
║  ███████║██║    ██║  ██║█████╗  ██║   ██║    ██║     ██║   ██║██║     █████╔╝    ║
║  ██╔══██║██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝    ██║     ██║   ██║██║     ██╔═██╗    ║
║  ██║  ██║██║    ██████╔╝███████╗ ╚████╔╝     ╚██████╗╚██████╔╝╚██████╗██║  ██╗   ║
║  ╚═╝  ╚═╝╚═╝    ╚═════╝ ╚══════╝  ╚═══╝       ╚═════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝   ║
║                                                                                   ║
║  Build software with AI agents • Any language • 89% cost savings 💰              ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
`

  return (
    <div className={`${styles.terminal} min-h-screen`}>
      <div className="container mx-auto p-6">
        {/* ASCII Header */}
        <pre className={`${styles.asciiArt} text-center mb-8 text-green-400`}>
          {asciiHeader}
        </pre>

        {/* Status Bar */}
        <div className="flex justify-center mb-8">
          <div className={`${styles.terminalWindow} p-4`}>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-bold">SYSTEM STATUS:</span>
              <span className="font-bold uppercase text-green-400">
                ● ONLINE
              </span>
              <span className="text-amber-400">
                Multi-provider routing active (Claude + DeepSeek + Qwen)
              </span>
            </div>
          </div>
        </div>

        {/* Main Marketplace */}
        <ModelMarketplace
          defaultTheme={currentTheme}
          onDeploy={handleModelDeploy}
          onTest={handleModelTest}
          availableModels={availableModels}
          inferenceState={inferenceState}
        />

        {/* Footer Status */}
        <div className={`${styles.terminalWindow} mt-8 p-4`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-green-400">STATUS: ONLINE</span>
              <span className="text-cyan-400">MODELS: 500,000+</span>
              <span className="text-amber-400">COST SAVINGS: 89%</span>
            </div>
            <div className="text-gray-400 text-sm">
              Powered by RunPod Serverless • HuggingFace • AI Dev Cockpit
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
