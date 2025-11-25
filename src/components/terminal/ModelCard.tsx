'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ModelData } from '@/hooks/useModelSearch'
import { useModelOperations } from '@/hooks/useModelSearch'
import styles from '@/styles/terminal.module.css'

interface ModelCardProps {
  model: ModelData
  theme: 'arcade' | 'enterprise'
  onDeploy?: (modelId: string) => void
  onTest?: (modelId: string) => void
  isDeploying?: boolean
  isTestable?: boolean
}

export default function ModelCard({
  model,
  theme,
  onDeploy,
  onTest,
  isDeploying: externalDeploying,
  isTestable = false
}: ModelCardProps) {
  const { deployModel, isDeploying: hookDeploying } = useModelOperations()
  const [expanded, setExpanded] = useState(false)

  // Use external deploying state if provided, otherwise use hook state
  const isDeploying = externalDeploying ?? hookDeploying

  const handleDeploy = async () => {
    const result = await deployModel(model.id)
    if (result.success && onDeploy) {
      onDeploy(model.id)
    }
  }

  const handleTest = () => {
    if (onTest) {
      onTest(model.id)
    }
  }

  const getOrganizationIcon = () => {
    return theme === 'arcade' ? '🎮' : '🏢'
  }

  const getStatusIndicator = () => {
    switch (model.status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      case 'deploying':
        return <div className="w-2 h-2 bg-amber-400 rounded-full animate-spin" />
      case 'inactive':
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const getThemeClasses = () => {
    if (theme === 'arcade') {
      return {
        card: 'bg-gray-900/80 border-green-600 hover:border-green-400',
        header: 'text-green-400',
        accent: 'text-amber-400',
        tag: 'border-green-600 text-green-400',
        button: 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black'
      }
    } else {
      return {
        card: 'bg-gray-900/80 border-blue-600 hover:border-blue-400',
        header: 'text-blue-400',
        accent: 'text-amber-400',
        tag: 'border-blue-600 text-blue-400',
        button: 'border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black'
      }
    }
  }

  const themeClasses = getThemeClasses()

  return (
    <Card className={`${styles.terminalCard} ${themeClasses.card} p-4 transition-all duration-300 hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getOrganizationIcon()}</span>
          <div>
            <h3 className={`font-bold text-lg ${themeClasses.header} font-mono`}>
              {model.name}
            </h3>
            <p className="text-sm text-gray-400">
              by {model.author}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIndicator()}
          <Badge 
            variant="outline" 
            className={`${themeClasses.tag} text-xs`}
          >
            {model.organization.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Model Type & Stats */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300">
          {model.modelType}
        </Badge>
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span className="flex items-center space-x-1">
            <span>📥</span>
            <span>{model.downloads.toLocaleString()}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>❤️</span>
            <span>{model.likes.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-3 line-clamp-2 leading-relaxed">
        {model.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {model.tags.slice(0, expanded ? undefined : 3).map((tag, index) => (
          <Badge 
            key={index}
            variant="outline"
            className="text-xs px-2 py-1 border-gray-600 text-gray-400 hover:border-gray-400"
          >
            #{tag}
          </Badge>
        ))}
        {model.tags.length > 3 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            +{model.tags.length - 3} more
          </button>
        )}
      </div>

      {/* Cost & Deployment Info */}
      {model.estimatedCost && (
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-800/50 rounded border border-gray-700">
          <span className="text-xs text-gray-400">Estimated Cost:</span>
          <span className={`text-sm font-bold ${themeClasses.accent}`}>
            ${model.estimatedCost}/hour
          </span>
        </div>
      )}

      {/* Deployment URL if active */}
      {model.deploymentUrl && (
        <div className="mb-4 p-2 bg-gray-800/50 rounded border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Deployment URL:</div>
          <code className="text-xs text-green-400 break-all">
            {model.deploymentUrl}
          </code>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 ${themeClasses.button} font-mono text-xs transition-all`}
          onClick={handleDeploy}
          disabled={isDeploying || model.status === 'deploying'}
        >
          {isDeploying ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              <span>DEPLOYING...</span>
            </div>
          ) : model.status === 'deploying' ? (
            'DEPLOYING...'
          ) : model.deploymentUrl ? (
            '⚡ REDEPLOY'
          ) : (
            '🚀 DEPLOY'
          )}
        </Button>

        {/* Test Button (only show if testable) */}
        {isTestable && onTest && (
          <Button
            variant="outline"
            size="sm"
            className={`${themeClasses.button} font-mono text-xs px-3`}
            onClick={handleTest}
            disabled={isDeploying}
          >
            🧪 TEST
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className={`px-3 ${themeClasses.button} font-mono text-xs`}
          onClick={() => window.open(`https://huggingface.co/${model.organization}/${model.id}`, '_blank')}
        >
          📋
        </Button>
      </div>

      {/* Terminal-style metadata footer */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="text-gray-500">
            Created: <span className="text-gray-400">{new Date(model.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="text-gray-500">
            Updated: <span className="text-gray-400">{new Date(model.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* ASCII Art Border for arcade theme */}
      {theme === 'arcade' && (
        <div className="mt-2 text-center text-xs text-green-600 opacity-50 font-mono">
          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
        </div>
      )}

      {/* Corporate Border for enterprise theme */}
      {theme === 'enterprise' && (
        <div className="mt-2 text-center text-xs text-blue-600 opacity-50 font-mono">
          ═══════════════════════════════
        </div>
      )}
    </Card>
  )
}

// Loading skeleton component
export function ModelCardSkeleton({ theme }: { theme: 'arcade' | 'enterprise' }) {
  const borderColor = theme === 'arcade' ? 'border-green-600' : 'border-blue-600'
  
  return (
    <Card className={`${styles.terminalCard} bg-gray-900/80 ${borderColor} p-4 animate-pulse`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-700 rounded" />
          <div>
            <div className="w-32 h-5 bg-gray-700 rounded mb-2" />
            <div className="w-20 h-3 bg-gray-700 rounded" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-700 rounded-full" />
          <div className="w-16 h-5 bg-gray-700 rounded" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="w-20 h-5 bg-gray-700 rounded" />
        <div className="flex items-center space-x-4">
          <div className="w-12 h-4 bg-gray-700 rounded" />
          <div className="w-12 h-4 bg-gray-700 rounded" />
        </div>
      </div>

      <div className="w-full h-12 bg-gray-700 rounded mb-3" />

      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-16 h-5 bg-gray-700 rounded" />
        ))}
      </div>

      <div className="flex space-x-2">
        <div className="flex-1 h-8 bg-gray-700 rounded" />
        <div className="w-10 h-8 bg-gray-700 rounded" />
      </div>
    </Card>
  )
}