'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ModelData } from '@/hooks/useModelSearch'
import { useModelOperations } from '@/hooks/useModelSearch'
import styles from '@/styles/terminal.module.css'

interface ModelCardProps {
  model: ModelData
  theme: 'swaggystacks' | 'scientiacapital'
  onDeploy?: (modelId: string) => void
  onTest?: (modelId: string) => void
  isDeploying?: boolean
  isTestable?: boolean
}

// Memoized badge component to prevent re-renders
const ModelBadge = memo(function ModelBadge({ 
  label, 
  variant = 'secondary',
  theme
}: { 
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  theme: string
}) {
  return (
    <Badge 
      variant={variant}
      className={theme === 'swaggystacks' ? styles.terminalBadge : ''}
    >
      {label}
    </Badge>
  )
})

// Memoized model stats component
const ModelStats = memo(function ModelStats({ 
  downloads, 
  likes, 
  theme 
}: { 
  downloads?: number
  likes?: number
  theme: string
}) {
  const formatNumber = useCallback((num?: number) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }, [])

  const statsClass = theme === 'swaggystacks' 
    ? 'text-green-400 text-sm' 
    : 'text-gray-600 text-sm'

  return (
    <div className="flex justify-between items-center">
      <span className={statsClass}>
        📥 {formatNumber(downloads)}
      </span>
      <span className={statsClass}>
        ❤️ {formatNumber(likes)}
      </span>
    </div>
  )
})

// Memoized action buttons component
const ActionButtons = memo(function ActionButtons({
  modelId,
  isDeploying,
  isTestable,
  onDeploy,
  onTest,
  theme
}: {
  modelId: string
  isDeploying: boolean
  isTestable: boolean
  onDeploy?: (modelId: string) => void
  onTest?: (modelId: string) => void
  theme: string
}) {
  const handleDeploy = useCallback(() => {
    onDeploy?.(modelId)
  }, [modelId, onDeploy])

  const handleTest = useCallback(() => {
    onTest?.(modelId)
  }, [modelId, onTest])

  const buttonClass = theme === 'swaggystacks' 
    ? styles.terminalButton 
    : 'bg-blue-600 hover:bg-blue-700'

  return (
    <div className="flex space-x-2">
      <Button
        onClick={handleDeploy}
        disabled={isDeploying}
        className={`flex-1 ${buttonClass}`}
        size="sm"
      >
        {isDeploying ? 'Deploying...' : 'Deploy'}
      </Button>
      {isTestable && (
        <Button
          onClick={handleTest}
          variant="outline"
          size="sm"
          className={theme === 'swaggystacks' ? styles.terminalButtonOutline : ''}
        >
          Test
        </Button>
      )}
    </div>
  )
})

export default memo(function OptimizedModelCard({
  model,
  theme,
  onDeploy,
  onTest,
  isDeploying: externalDeploying,
  isTestable = false
}: ModelCardProps) {
  const { deployModel, isDeploying: hookDeploying } = useModelOperations()
  const [expanded, setExpanded] = useState(false)

  // Memoize deploying state
  const isDeploying = useMemo(() => 
    externalDeploying ?? hookDeploying, 
    [externalDeploying, hookDeploying]
  )

  // Memoize card classes
  const cardClasses = useMemo(() => {
    const base = 'p-4 transition-all duration-200 hover:scale-105'
    return theme === 'swaggystacks'
      ? `${styles.terminalCard} ${base} bg-gray-800/50 border-green-400/20 hover:border-green-400/50`
      : `${base} bg-white hover:shadow-lg border border-gray-200`
  }, [theme])

  // Memoize title class
  const titleClass = useMemo(() => 
    theme === 'swaggystacks' 
      ? 'text-green-400 font-mono text-lg font-semibold mb-2 truncate' 
      : 'text-gray-900 text-lg font-semibold mb-2 truncate',
    [theme]
  )

  // Memoize description class
  const descriptionClass = useMemo(() => 
    theme === 'swaggystacks' 
      ? 'text-gray-300 text-sm mb-3 font-mono' 
      : 'text-gray-700 text-sm mb-3',
    [theme]
  )

  // Memoize tags
  const displayTags = useMemo(() => {
    if (!model.tags) return []
    return model.tags.slice(0, 3) // Only show first 3 tags for performance
  }, [model.tags])

  // Memoize expand handler
  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  // Memoize truncated description
  const description = useMemo(() => {
    if (!model.description) return 'No description available'
    if (expanded) return model.description
    return model.description.length > 100 
      ? `${model.description.substring(0, 100)}...` 
      : model.description
  }, [model.description, expanded])

  return (
    <Card className={cardClasses}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <h3 
          className={titleClass}
          title={model.name} // Tooltip for full name
        >
          {theme === 'swaggystacks' && '>'} {model.name}
        </h3>

        {/* Description */}
        <div className={descriptionClass}>
          <p>{description}</p>
          {model.description && model.description.length > 100 && (
            <button 
              onClick={toggleExpanded}
              className="text-blue-500 hover:underline text-xs mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {displayTags.map((tag) => (
              <ModelBadge 
                key={tag} 
                label={tag} 
                theme={theme}
              />
            ))}
            {model.tags && model.tags.length > 3 && (
              <ModelBadge 
                label={`+${model.tags.length - 3}`} 
                variant="outline"
                theme={theme}
              />
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 flex-1">
          <ModelStats 
            downloads={model.downloads}
            likes={model.likes}
            theme={theme}
          />
        </div>

        {/* Actions */}
        <ActionButtons
          modelId={model.id}
          isDeploying={isDeploying}
          isTestable={isTestable}
          onDeploy={onDeploy}
          onTest={onTest}
          theme={theme}
        />
      </div>
    </Card>
  )
})

// Memoized skeleton component for loading states
export const OptimizedModelCardSkeleton = memo(function OptimizedModelCardSkeleton({
  theme = 'swaggystacks'
}: {
  theme?: 'swaggystacks' | 'scientiacapital'
}) {
  const cardClass = theme === 'swaggystacks'
    ? `${styles.terminalCard} bg-gray-800/30`
    : 'bg-gray-100'

  return (
    <Card className={`p-4 ${cardClass}`}>
      <div className="animate-pulse">
        <div className={`h-5 ${theme === 'swaggystacks' ? 'bg-green-400/20' : 'bg-gray-300'} rounded mb-3`}></div>
        <div className={`h-4 ${theme === 'swaggystacks' ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-2`}></div>
        <div className={`h-4 ${theme === 'swaggystacks' ? 'bg-gray-600' : 'bg-gray-200'} rounded w-3/4 mb-4`}></div>
        <div className="flex space-x-2 mb-4">
          <div className={`h-6 w-16 ${theme === 'swaggystacks' ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
          <div className={`h-6 w-16 ${theme === 'swaggystacks' ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
        </div>
        <div className={`h-8 ${theme === 'swaggystacks' ? 'bg-green-400/20' : 'bg-gray-300'} rounded`}></div>
      </div>
    </Card>
  )
})