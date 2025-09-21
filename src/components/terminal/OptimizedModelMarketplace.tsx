'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import ModelCard, { ModelCardSkeleton } from './ModelCard'
import { useModelSearch, mapModelMetadataToModelData } from '@/hooks/useModelSearch'
import { useModels } from '@/hooks/useModels'
import { useHuggingFaceAuth } from '@/contexts/HuggingFaceAuth'
import { useTerminalTheme } from '@/hooks/useTypingEffect'
import { DiscoveryFilters } from '@/types/models'
import styles from '@/styles/terminal.module.css'

interface ModelMarketplaceProps {
  defaultTheme?: 'swaggystacks' | 'scientiacapital'
  showThemeSwitcher?: boolean
  onDeploy?: (modelId: string) => void
  onTest?: (modelId: string) => void
  availableModels?: any[]
  inferenceState?: any
}

// Memoized filter component to prevent unnecessary re-renders
const FilterControls = memo(function FilterControls({
  filters,
  onFiltersChange,
  theme
}: {
  filters: Partial<DiscoveryFilters>
  onFiltersChange: (filters: Partial<DiscoveryFilters>) => void
  theme: 'swaggystacks' | 'scientiacapital'
}) {
  const handleFilterChange = useCallback((key: keyof DiscoveryFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }, [filters, onFiltersChange])

  return (
    <div className={`mb-6 space-y-4 ${theme === 'swaggystacks' ? styles.terminalCard : 'bg-white'} p-4 rounded-lg`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Task Type</label>
          <select
            value={filters.task || ''}
            onChange={(e) => handleFilterChange('task', e.target.value || undefined)}
            className={`w-full p-2 rounded ${theme === 'swaggystacks' ? 'bg-gray-800 text-green-400' : 'bg-gray-100'}`}
          >
            <option value="">All Tasks</option>
            <option value="text-generation">Text Generation</option>
            <option value="text-classification">Text Classification</option>
            <option value="question-answering">Question Answering</option>
            <option value="summarization">Summarization</option>
            <option value="translation">Translation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Model Size</label>
          <select
            value={filters.modelSize || ''}
            onChange={(e) => handleFilterChange('modelSize', e.target.value || undefined)}
            className={`w-full p-2 rounded ${theme === 'swaggystacks' ? 'bg-gray-800 text-green-400' : 'bg-gray-100'}`}
          >
            <option value="">All Sizes</option>
            <option value="small">Small (&lt; 1B params)</option>
            <option value="medium">Medium (1B - 10B params)</option>
            <option value="large">Large (&gt; 10B params)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sort By</label>
          <select
            value={filters.sortBy || 'downloads'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
            className={`w-full p-2 rounded ${theme === 'swaggystacks' ? 'bg-gray-800 text-green-400' : 'bg-gray-100'}`}
          >
            <option value="downloads">Most Downloaded</option>
            <option value="trending">Trending</option>
            <option value="recent">Recently Updated</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>
    </div>
  )
})

// Memoized model grid to prevent unnecessary re-renders
const ModelGrid = memo(function ModelGrid({
  models,
  isLoading,
  onDeploy,
  onTest,
  theme
}: {
  models: any[]
  isLoading: boolean
  onDeploy?: (modelId: string) => void
  onTest?: (modelId: string) => void
  theme: 'swaggystacks' | 'scientiacapital'
}) {
  // Memoize skeleton array to prevent recreation
  const skeletons = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons.map((i) => (
          <ModelCardSkeleton key={i} theme={theme} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={mapModelMetadataToModelData(model)}
          onDeploy={onDeploy}
          onTest={onTest}
          theme={theme}
        />
      ))}
    </div>
  )
})

export default memo(function OptimizedModelMarketplace({
  defaultTheme = 'swaggystacks',
  showThemeSwitcher = true,
  onDeploy,
  onTest,
  availableModels = [],
  inferenceState
}: ModelMarketplaceProps) {
  const [currentTheme, setCurrentTheme] = useState<'swaggystacks' | 'scientiacapital'>(defaultTheme)
  const [filters, setFilters] = useState<Partial<DiscoveryFilters>>({
    sortBy: 'downloads',
    limit: 24
  })

  // Memoize stable callback functions
  const handleDeploy = useCallback((modelId: string) => {
    onDeploy?.(modelId)
  }, [onDeploy])

  const handleTest = useCallback((modelId: string) => {
    onTest?.(modelId)
  }, [onTest])

  const handleFiltersChange = useCallback((newFilters: Partial<DiscoveryFilters>) => {
    setFilters(newFilters)
  }, [])

  // Use the model search hook with proper options interface
  const { 
    models, 
    loading: isLoading, 
    error,
    hasMore,
    loadMore 
  } = useModelSearch({
    initialFilters: filters,
    pageSize: filters.limit || 24,
    enableRealTimeSearch: true
  })

  // Memoize filtered and processed models
  const processedModels = useMemo(() => {
    if (availableModels.length > 0) {
      return availableModels
    }
    return models || []
  }, [models, availableModels])

  // Memoize theme classes
  const themeClasses = useMemo(() => ({
    container: currentTheme === 'swaggystacks' 
      ? `${styles.terminalContainer} bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800` 
      : 'bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen',
    header: currentTheme === 'swaggystacks' 
      ? `${styles.terminalHeader} text-green-400` 
      : 'text-gray-800',
    title: currentTheme === 'swaggystacks' 
      ? `${styles.terminalTitle} text-green-400` 
      : 'text-4xl font-bold text-gray-900'
  }), [currentTheme])

  // Memoize load more handler
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore()
    }
  }, [hasMore, isLoading, loadMore])

  return (
    <div className={themeClasses.container}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`${themeClasses.header} mb-8`}>
          <h1 className={themeClasses.title}>
            {currentTheme === 'swaggystacks' ? '🚀 MODEL MARKETPLACE 🚀' : 'Model Marketplace'}
          </h1>
          <p className={currentTheme === 'swaggystacks' ? styles.terminalSubtitle : 'text-gray-600 mt-2'}>
            {currentTheme === 'swaggystacks' 
              ? '> Discover and deploy 500,000+ AI models with terminal-grade performance'
              : 'Explore our curated collection of enterprise-ready AI models'
            }
          </p>
        </div>

        {/* Theme Switcher */}
        {showThemeSwitcher && (
          <div className="mb-6 flex justify-end">
            <div className="flex space-x-2">
              <Button
                variant={currentTheme === 'swaggystacks' ? 'default' : 'outline'}
                onClick={() => setCurrentTheme('swaggystacks')}
                className={currentTheme === 'swaggystacks' ? styles.terminalButton : ''}
              >
                🎮 Developer
              </Button>
              <Button
                variant={currentTheme === 'scientiacapital' ? 'default' : 'outline'}
                onClick={() => setCurrentTheme('scientiacapital')}
                className={currentTheme === 'scientiacapital' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                🏢 Enterprise
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <FilterControls 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          theme={currentTheme}
        />

        {/* Error State */}
        {error && (
          <div className={`p-4 rounded-lg mb-6 ${
            currentTheme === 'swaggystacks' 
              ? 'bg-red-900/20 border border-red-500 text-red-400' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p>Error loading models: {error}</p>
          </div>
        )}

        {/* Model Grid */}
        <ModelGrid 
          models={processedModels}
          isLoading={isLoading}
          onDeploy={handleDeploy}
          onTest={handleTest}
          theme={currentTheme}
        />

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="text-center mt-8">
            <Button 
              onClick={handleLoadMore}
              className={currentTheme === 'swaggystacks' ? styles.terminalButton : 'bg-blue-600 hover:bg-blue-700'}
            >
              Load More Models
            </Button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && processedModels.length > 0 && (
          <div className="text-center mt-8">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <span className={currentTheme === 'swaggystacks' ? 'text-green-400' : 'text-gray-600'}>
                Loading more models...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})