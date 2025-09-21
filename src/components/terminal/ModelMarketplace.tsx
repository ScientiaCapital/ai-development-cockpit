'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import ModelCard, { ModelCardSkeleton } from './ModelCard'
import { useModelSearch } from '@/hooks/useModelSearch'
import { useModels } from '@/hooks/useModels'
import { useHuggingFaceAuth } from '@/contexts/HuggingFaceAuth'
import { useTerminalTheme } from '@/hooks/useTypingEffect'
import { DiscoveryFilters } from '@/types/models'
import styles from '@/styles/terminal.module.css'

interface ModelMarketplaceProps {
  defaultTheme?: 'swaggystacks' | 'scientiacapital'
  showThemeSwitcher?: boolean
}

export default function ModelMarketplace({
  defaultTheme = 'swaggystacks',
  showThemeSwitcher = true
}: ModelMarketplaceProps) {
  const [currentTheme, setCurrentTheme] = useState<'swaggystacks' | 'scientiacapital'>(defaultTheme)
  const [showFilters, setShowFilters] = useState(false)

  const { currentOrganization, isAuthenticated, switchOrganization } = useHuggingFaceAuth()

  const {
    searchState,
    models,
    loading,
    error,
    totalCount,
    hasNextPage,
    searchTime,
    cacheHit,
    setQuery,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    executeSearch,
    loadMore,
    refresh,
    filterByOrganization,
    filterByModelType,
    getPopularTags,
    exportResults
  } = useModelSearch({
    pageSize: 12,
    enableRealTimeSearch: true
  })

  const { applyTheme } = useTerminalTheme()

  // Sync theme with current organization
  useEffect(() => {
    if (currentOrganization !== currentTheme) {
      setCurrentTheme(currentOrganization)
    }
  }, [currentOrganization])

  // Apply terminal theme based on current theme
  useEffect(() => {
    if (currentTheme === 'swaggystacks') {
      applyTheme('classic') // Green terminal theme
    } else {
      applyTheme('cyan') // Blue terminal theme for enterprise
    }
  }, [currentTheme, applyTheme])

  // Trigger search when authenticated or organization changes
  useEffect(() => {
    if (isAuthenticated) {
      executeSearch()
    }
  }, [isAuthenticated, currentOrganization])

  const handleSearch = async (query: string) => {
    setQuery(query)
    await executeSearch()
  }

  const handleFilterUpdate = (newFilters: Partial<DiscoveryFilters>) => {
    setFilters(newFilters)
  }

  const handleThemeSwitch = async (theme: 'swaggystacks' | 'scientiacapital') => {
    setCurrentTheme(theme)
    await switchOrganization(theme)
  }

  const getThemeClasses = () => {
    if (currentTheme === 'swaggystacks') {
      return {
        primary: 'text-green-400',
        accent: 'text-amber-400',
        border: 'border-green-600',
        button: 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black',
        badge: 'border-green-600 text-green-400'
      }
    } else {
      return {
        primary: 'text-blue-400',
        accent: 'text-amber-400',
        border: 'border-blue-600',
        button: 'border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black',
        badge: 'border-blue-600 text-blue-400'
      }
    }
  }

  const themeClasses = getThemeClasses()

  const marketplaceBanner = currentTheme === 'swaggystacks' ? `
╔════════════════════════════════════════════════════════════╗
║  🎮 SWAGGY STACKS MODEL ARCADE 🎮                         ║
║                                                            ║
║  Level Up Your AI Game • Insert Models to Continue        ║
║  High Score: 500,000+ Models Available                    ║
╚════════════════════════════════════════════════════════════╝
  ` : `
╔════════════════════════════════════════════════════════════╗
║  🏢 SCIENTIA CAPITAL MODEL EXCHANGE 🏢                    ║
║                                                            ║
║  Enterprise AI Solutions • Fortune 500 Grade Models       ║
║  Portfolio: 500,000+ Certified Models                     ║
╚════════════════════════════════════════════════════════════╝
  `

  return (
    <div className={`${styles.terminalContainer} min-h-screen bg-terminal-bg text-terminal-primary`}>
      {/* Header */}
      <div className={`${styles.terminalHeader} p-4 border-b-2 ${themeClasses.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className={`text-2xl font-bold ${themeClasses.primary} font-mono`}>
              {currentTheme === 'swaggystacks' ? 'MODEL ARCADE' : 'MODEL EXCHANGE'}
            </h1>
            <Badge variant="outline" className={`${themeClasses.badge} animate-pulse`}>
              {totalCount} MODELS LOADED
            </Badge>
          </div>
          
          {showThemeSwitcher && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`${currentTheme === 'swaggystacks' ? themeClasses.button : 'border-gray-600 text-gray-400'} font-mono text-xs`}
                onClick={() => handleThemeSwitch('swaggystacks')}
              >
                🎮 ARCADE MODE
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${currentTheme === 'scientiacapital' ? themeClasses.button : 'border-gray-600 text-gray-400'} font-mono text-xs`}
                onClick={() => handleThemeSwitch('scientiacapital')}
              >
                🏢 ENTERPRISE MODE
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Banner */}
      <div className="p-4">
        <pre className={`text-xs ${themeClasses.primary} text-center leading-tight`}>
          {marketplaceBanner}
        </pre>
      </div>

      {/* Search and Filters */}
      <div className="px-4 mb-6">
        <Card className={`${styles.terminalCard} bg-gray-900/80 ${themeClasses.border} p-4`}>
          {/* Search Bar */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <div className="flex items-center">
                <span className={`${themeClasses.primary} font-mono mr-2`}>SEARCH&gt;</span>
                <input
                  type="text"
                  value={searchState.query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                  placeholder={currentTheme === 'swaggystacks' ? 'Enter cheat code...' : 'Enter search query...'}
                  className="flex-1 bg-transparent border-none outline-none text-terminal-primary font-mono placeholder-gray-500"
                />
              </div>
              <div className="h-px bg-gray-600 mt-1" />
            </div>
            <Button
              variant="outline"
              onClick={executeSearch}
              className={`${themeClasses.button} font-mono text-xs`}
              disabled={loading}
            >
              {loading ? 'SCANNING...' : 'EXECUTE'}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFilter('organizations')}
                className={`${!searchState.filters.organizations?.length ? themeClasses.button : 'border-gray-600 text-gray-400'} font-mono text-xs`}
              >
                ALL ORGS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => filterByOrganization('swaggystacks')}
                className={`${searchState.filters.organizations?.includes('swaggystacks') ? themeClasses.button : 'border-gray-600 text-gray-400'} font-mono text-xs`}
              >
                🎮 SWAGGY
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => filterByOrganization('scientiacapital')}
                className={`${searchState.filters.organizations?.includes('scientiacapital') ? themeClasses.button : 'border-gray-600 text-gray-400'} font-mono text-xs`}
              >
                🏢 SCIENTIA
              </Button>

              <div className="h-4 w-px bg-gray-600" />

              {['popularity', 'downloads', 'updated'].map((sort) => (
                <Button
                  key={sort}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (searchState.sortBy === sort) {
                      searchState.sortOrder === 'desc' ? setSortOrder('asc') : setSortOrder('desc')
                    } else {
                      setSortBy(sort as any)
                    }
                  }}
                  className={`${searchState.sortBy === sort ? themeClasses.button : 'border-gray-600 text-gray-400'} font-mono text-xs`}
                >
                  {sort.toUpperCase()} {searchState.sortBy === sort && (searchState.sortOrder === 'desc' ? '↓' : '↑')}
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`${themeClasses.button} font-mono text-xs`}
              >
                {showFilters ? 'HIDE FILTERS' : 'ADVANCED'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-400 font-mono text-xs"
              >
                CLEAR
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Model Type Filter */}
                <div>
                  <label className={`block text-xs font-mono ${themeClasses.primary} mb-2`}>
                    MODEL TYPE:
                  </label>
                  <select
                    value={searchState.filters.modelTypes?.[0] || 'all'}
                    onChange={(e) => e.target.value === 'all' ? removeFilter('modelTypes') : filterByModelType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-terminal-primary"
                  >
                    <option value="all">ALL TYPES</option>
                    <option value="text-generation">TEXT GENERATION</option>
                    <option value="text-classification">TEXT CLASSIFICATION</option>
                    <option value="question-answering">QUESTION ANSWERING</option>
                    <option value="summarization">SUMMARIZATION</option>
                    <option value="translation">TRANSLATION</option>
                    <option value="conversational">CONVERSATIONAL</option>
                  </select>
                </div>

                {/* Downloads Filter */}
                <div>
                  <label className={`block text-xs font-mono ${themeClasses.primary} mb-2`}>
                    MIN DOWNLOADS:
                  </label>
                  <input
                    type="number"
                    value={searchState.filters.minDownloads || 0}
                    onChange={(e) => addFilter('minDownloads', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-terminal-primary"
                    placeholder="0"
                  />
                </div>

                {/* Cost Filter */}
                <div>
                  <label className={`block text-xs font-mono ${themeClasses.primary} mb-2`}>
                    MAX COST/HOUR: ${searchState.filters.maxCostPerHour || 1000}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={searchState.filters.maxCostPerHour || 1000}
                    onChange={(e) => addFilter('maxCostPerHour', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Tags Filter */}
              <div className="mt-4">
                <label className={`block text-xs font-mono ${themeClasses.primary} mb-2`}>
                  FILTER BY TAGS:
                </label>
                <div className="flex flex-wrap gap-2">
                  {getPopularTags().map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`cursor-pointer text-xs ${
                        searchState.filters.tags?.includes(tag)
                          ? themeClasses.badge
                          : 'border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                      onClick={() => {
                        if (searchState.filters.tags?.includes(tag)) {
                          const newTags = searchState.filters.tags.filter(t => t !== tag)
                          addFilter('tags', newTags)
                        } else {
                          addFilter('tags', tag)
                        }
                      }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Results Stats */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between text-sm font-mono">
          <div className={themeClasses.primary}>
            {loading ? (
              'SCANNING MODEL DATABASE...'
            ) : (
              <>
                FOUND {totalCount} MODELS
                {searchTime && ` • ${searchTime}ms`}
                {cacheHit && ' • CACHED'}
              </>
            )}
          </div>
          <div className="text-gray-400">
            {currentTheme === 'swaggystacks' ? 'PRESS START TO DEPLOY' : 'SELECT MODEL TO PROCEED'}
          </div>
        </div>
        {/* Authentication Status */}
        {!isAuthenticated && (
          <div className="mt-2 p-2 border border-red-500 rounded bg-red-500/10">
            <div className="text-red-400 font-mono text-xs">
              ⚠️ AUTHENTICATION REQUIRED - Please authenticate to access models
            </div>
          </div>
        )}
        {error && (
          <div className="mt-2 p-2 border border-red-500 rounded bg-red-500/10">
            <div className="text-red-400 font-mono text-xs">
              ❌ ERROR: {error}
            </div>
          </div>
        )}
      </div>

      {/* Model Grid */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ModelCardSkeleton key={index} theme={currentTheme} />
            ))}
          </div>
        ) : models.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  theme={currentTheme}
                  onDeploy={(modelId) => console.log(`Deployed ${modelId}`)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  className={`${themeClasses.button} font-mono px-8`}
                  disabled={loading}
                >
                  {loading ? 'LOADING...' : 'LOAD MORE MODELS'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className={`text-6xl ${themeClasses.primary} mb-4`}>
              {currentTheme === 'swaggystacks' ? '🎮' : '🏢'}
            </div>
            <div className={`text-xl font-bold ${themeClasses.primary} font-mono mb-2`}>
              NO MODELS FOUND
            </div>
            <div className="text-gray-400 font-mono text-sm">
              {currentTheme === 'swaggystacks' 
                ? 'Try a different search code or check your filters' 
                : 'Modify search parameters or contact enterprise support'
              }
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className={`${themeClasses.button} font-mono mt-4`}
            >
              RESET FILTERS
            </Button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-700 p-4 text-center">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div>
            <div className={`text-lg font-bold ${themeClasses.accent}`}>500K+</div>
            <div className="text-xs text-gray-400 font-mono">MODELS</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${themeClasses.accent}`}>97%</div>
            <div className="text-xs text-gray-400 font-mono">COST SAVINGS</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${themeClasses.accent}`}>99.9%</div>
            <div className="text-xs text-gray-400 font-mono">UPTIME</div>
          </div>
        </div>
        
        <div className={`mt-4 text-xs ${themeClasses.primary} font-mono`}>
          {currentTheme === 'swaggystacks' 
            ? '★ THANKS FOR PLAYING THE AI ARCADE ★' 
            : '★ POWERING ENTERPRISE AI TRANSFORMATION ★'
          }
        </div>
      </div>
    </div>
  )
}