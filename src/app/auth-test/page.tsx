'use client'

import { useState, useEffect } from 'react'
import { useHuggingFaceAuth } from '@/contexts/HuggingFaceAuth'
import { huggingFaceApi, ModelInfo } from '@/lib/huggingface-api'
import OrganizationSwitcher from '@/components/auth/OrganizationSwitcher'
import ModelCard from '@/components/terminal/ModelCard'
import { AuthStatus } from '@/contexts/HuggingFaceAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import styles from '@/styles/terminal.module.css'

export default function AuthTestPage() {
  const {
    currentOrganization,
    isAuthenticated,
    isLoading,
    error,
    getCurrentToken,
    switchOrganization
  } = useHuggingFaceAuth()

  const [models, setModels] = useState<ModelInfo[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const fetchModels = async () => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, skipping model fetch')
      return
    }

    try {
      setLoadingModels(true)
      setApiError(null)

      const token = getCurrentToken()
      console.log(`🔍 Fetching models for ${currentOrganization} with token: ${token.substring(0, 8)}...`)

      const response = await huggingFaceApi.searchModels({
        organization: currentOrganization,
        limit: 10
      }, token)

      if (response.success) {
        setModels(response.data)
        console.log(`✅ Successfully loaded ${response.data.length} models`)
      } else {
        throw new Error(response.error || 'Failed to fetch models')
      }
    } catch (err) {
      console.error('❌ Model fetch error:', err)
      setApiError(err instanceof Error ? err.message : 'Unknown error occurred')
      setModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  // Auto-fetch models when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchModels()
    }
  }, [isAuthenticated, currentOrganization, isLoading])

  const handleDeploy = async (modelId: string) => {
    console.log(`🚀 Deploying model ${modelId} for ${currentOrganization}`)
    // TODO: Integrate with RunPod deployment
    alert(`Deployment initiated for ${modelId}`)
  }

  const orgInfo = {
    swaggystacks: {
      emoji: '🎮',
      name: 'SwaggyStacks',
      theme: 'Gaming Arcade',
      color: 'text-green-400'
    },
    scientiacapital: {
      emoji: '🏢',
      name: 'ScientiaCapital',
      theme: 'Enterprise Suite',
      color: 'text-amber-400'
    }
  }[currentOrganization]

  return (
    <div className={`${styles.terminal} min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className={`${styles.terminalWindow} p-6`}>
          <div className="text-center mb-6">
            <pre className="text-green-400 text-sm">
{`
╔══════════════════════════════════════════════════════════════╗
║                  🔐 AUTHENTICATION TEST SUITE 🔐             ║
║                                                              ║
║  Testing HuggingFace Multi-Organization Authentication       ║
║  SwaggyStacks + ScientiaCapital Integration Validation      ║
╚══════════════════════════════════════════════════════════════╝
`}
            </pre>
          </div>

          {/* Authentication Status */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-cyan-400">🔍 Authentication Status</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>Current Organization:</span>
                  <span className={orgInfo.color}>
                    {orgInfo.emoji} {orgInfo.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Theme:</span>
                  <span className="text-gray-400">{orgInfo.theme}</span>
                </div>
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <AuthStatus />
                </div>
                <div className="flex justify-between">
                  <span>Token Available:</span>
                  <span className={getCurrentToken() ? 'text-green-400' : 'text-red-400'}>
                    {getCurrentToken() ? `${getCurrentToken().substring(0, 8)}...` : 'NO TOKEN'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-cyan-400">🔧 API Integration Status</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>Models Loaded:</span>
                  <span className="text-amber-400">{models.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>API Status:</span>
                  <span className={apiError ? 'text-red-400' : 'text-green-400'}>
                    {apiError ? 'ERROR' : 'CONNECTED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span className={loadingModels ? 'text-yellow-400' : 'text-gray-400'}>
                    {loadingModels ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              {/* Manual Refresh */}
              <Button
                onClick={fetchModels}
                disabled={!isAuthenticated || loadingModels}
                className={`${styles.terminalButton} w-full text-xs`}
              >
                {loadingModels ? 'LOADING MODELS...' : 'REFRESH MODELS'}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {(error || apiError) && (
            <div className="mt-4 p-4 border border-red-500 rounded bg-red-500/10">
              <div className="text-red-400 font-mono text-sm">
                <strong>⚠️ ERROR:</strong> {error || apiError}
              </div>
            </div>
          )}
        </div>

        {/* Organization Switcher */}
        <OrganizationSwitcher showStatus={true} showTokenStatus={true} />

        {/* Models Display */}
        <div className={`${styles.terminalWindow} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-cyan-400">
              📦 Models from {orgInfo.emoji} {orgInfo.name}
            </h3>
            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
              {models.length} LOADED
            </Badge>
          </div>

          {loadingModels ? (
            <div className="text-center py-8">
              <div className="text-yellow-400 font-mono animate-pulse">
                ⚡ LOADING MODELS FROM {orgInfo.name.toUpperCase()}...
              </div>
            </div>
          ) : models.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.slice(0, 6).map((model) => (
                <div key={model.id} className="border border-gray-700 rounded p-4 bg-gray-900/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`font-bold ${orgInfo.color} text-sm`}>
                        {model.name}
                      </div>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        {model.modelType}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-400 font-mono">
                      ID: {model.id}
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">↓ {model.downloads.toLocaleString()}</span>
                      <span className="text-amber-400">♥ {model.likes}</span>
                      <span className="text-cyan-400">${model.pricing?.costPerHour.toFixed(3)}/hr</span>
                    </div>

                    <Button
                      onClick={() => handleDeploy(model.id)}
                      className={`${styles.terminalButton} w-full text-xs mt-2`}
                      size="sm"
                    >
                      🚀 DEPLOY
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 font-mono text-sm">
                {isAuthenticated
                  ? 'No models available or API error occurred'
                  : 'Please authenticate to load models'
                }
              </div>
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className={`${styles.terminalWindow} p-6`}>
          <h3 className="text-lg font-bold text-cyan-400 mb-4">🧪 Test Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              onClick={() => switchOrganization('swaggystacks')}
              disabled={currentOrganization === 'swaggystacks' || isLoading}
              className={`${styles.terminalButton} text-xs`}
            >
              🎮 SWITCH TO SWAGGY
            </Button>

            <Button
              onClick={() => switchOrganization('scientiacapital')}
              disabled={currentOrganization === 'scientiacapital' || isLoading}
              className={`${styles.terminalButton} text-xs`}
            >
              🏢 SWITCH TO SCIENTIA
            </Button>

            <Button
              onClick={() => {
                console.log('🔄 Testing token validation...')
                fetchModels()
              }}
              disabled={!isAuthenticated || loadingModels}
              className={`${styles.terminalButton} text-xs`}
            >
              ✅ VALIDATE API
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        <details className={`${styles.terminalWindow} p-6`}>
          <summary className="text-cyan-400 font-bold cursor-pointer">🐛 Debug Information</summary>
          <pre className="mt-4 text-xs text-gray-400 bg-gray-900 p-4 rounded overflow-auto">
            {JSON.stringify({
              currentOrganization,
              isAuthenticated,
              isLoading,
              error,
              modelCount: models.length,
              tokenExists: !!getCurrentToken(),
              env: {
                swaggyToken: !!process.env.NEXT_PUBLIC_SWAGGYSTACKS_HF_TOKEN,
                scientiaToken: !!process.env.NEXT_PUBLIC_SCIENTIACAPITAL_HF_TOKEN
              }
            }, null, 2)}
          </pre>
        </details>

      </div>
    </div>
  )
}