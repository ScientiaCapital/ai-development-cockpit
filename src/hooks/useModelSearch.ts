'use client'

import { useState, useCallback, useMemo } from 'react'
import { useModels } from './useModels'
import { DiscoveryFilters, ModelMetadata } from '@/types/models'
import { Organization } from '@/contexts/HuggingFaceAuth'

export interface SearchState {
  query: string
  filters: Partial<DiscoveryFilters>
  sortBy: 'downloads' | 'likes' | 'updated' | 'name' | 'popularity' | 'cost'
  sortOrder: 'asc' | 'desc'
}

export interface UseModelSearchOptions {
  initialQuery?: string
  initialFilters?: Partial<DiscoveryFilters>
  pageSize?: number
  enableRealTimeSearch?: boolean
}

export interface UseModelSearchReturn {
  searchState: SearchState
  models: ModelMetadata[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  hasNextPage: boolean
  hasMore: boolean
  searchTime?: number
  cacheHit?: boolean

  setQuery: (query: string) => void
  setFilters: (filters: Partial<DiscoveryFilters>) => void
  setSortBy: (sortBy: SearchState['sortBy']) => void
  setSortOrder: (order: SearchState['sortOrder']) => void
  addFilter: (key: keyof DiscoveryFilters, value: any) => void
  removeFilter: (key: keyof DiscoveryFilters) => void
  clearFilters: () => void
  executeSearch: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>

  filterByOrganization: (org: Organization) => void
  filterByModelType: (type: string) => void
  filterByPricing: (tier: 'free' | 'pro' | 'enterprise') => void
  filterByPerformance: (speed: 'fast' | 'medium' | 'slow') => void
  toggleTrending: () => void
  toggleGpuRequired: () => void

  getPopularTags: () => string[]
  getSuggestedFilters: () => Partial<DiscoveryFilters>
  clearCache: () => void
  exportResults: () => void
}

export function useModelSearch(options: UseModelSearchOptions = {}): UseModelSearchReturn {
  const {
    initialQuery = '',
    initialFilters = {},
    pageSize = 20,
    enableRealTimeSearch = true
  } = options

  const {
    models,
    loading,
    error,
    totalCount,
    currentPage,
    hasNextPage,
    searchTime,
    cacheHit,
    search,
    loadMore,
    refresh,
    clearCache
  } = useModels({
    pageSize,
    autoFetch: false,
    cacheEnabled: true
  })

  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery,
    filters: initialFilters,
    sortBy: 'downloads',
    sortOrder: 'desc'
  })

  const setQuery = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }))

    if (enableRealTimeSearch && query.length > 2) {
      search(query, searchState.filters)
    }
  }, [enableRealTimeSearch, search, searchState.filters])

  const setFilters = useCallback((filters: Partial<DiscoveryFilters>) => {
    setSearchState(prev => ({ ...prev, filters }))

    if (enableRealTimeSearch) {
      search(searchState.query, filters)
    }
  }, [enableRealTimeSearch, search, searchState.query])

  const setSortBy = useCallback((sortBy: SearchState['sortBy']) => {
    setSearchState(prev => ({ ...prev, sortBy }))
  }, [])

  const setSortOrder = useCallback((sortOrder: SearchState['sortOrder']) => {
    setSearchState(prev => ({ ...prev, sortOrder }))
  }, [])

  const addFilter = useCallback((key: keyof DiscoveryFilters, value: any) => {
    setSearchState(prev => {
      const newFilters = { ...prev.filters }

      if (Array.isArray(newFilters[key])) {
        const currentArray = newFilters[key] as any[]
        if (!currentArray.includes(value)) {
          newFilters[key] = [...currentArray, value] as any
        }
      } else {
        newFilters[key] = value as any
      }

      const updatedState = { ...prev, filters: newFilters }

      if (enableRealTimeSearch) {
        search(prev.query, newFilters)
      }

      return updatedState
    })
  }, [enableRealTimeSearch, search])

  const removeFilter = useCallback((key: keyof DiscoveryFilters) => {
    setSearchState(prev => {
      const newFilters = { ...prev.filters }
      delete newFilters[key]

      const updatedState = { ...prev, filters: newFilters }

      if (enableRealTimeSearch) {
        search(prev.query, newFilters)
      }

      return updatedState
    })
  }, [enableRealTimeSearch, search])

  const clearFilters = useCallback(() => {
    setSearchState(prev => {
      const updatedState = { ...prev, filters: {} }

      if (enableRealTimeSearch) {
        search(prev.query, {})
      }

      return updatedState
    })
  }, [enableRealTimeSearch, search])

  const executeSearch = useCallback(async () => {
    await search(searchState.query, searchState.filters)
  }, [search, searchState.query, searchState.filters])

  const filterByOrganization = useCallback((org: Organization) => {
    addFilter('organizations', org)
  }, [addFilter])

  const filterByModelType = useCallback((type: string) => {
    addFilter('modelTypes', type)
  }, [addFilter])

  const filterByPricing = useCallback((tier: 'free' | 'pro' | 'enterprise') => {
    addFilter('pricingTier', tier)
  }, [addFilter])

  const filterByPerformance = useCallback((speed: 'fast' | 'medium' | 'slow') => {
    addFilter('inferenceSpeed', speed)
  }, [addFilter])

  const toggleTrending = useCallback(() => {
    setSearchState(prev => {
      const newTrending = !prev.filters.trending
      const newFilters = { ...prev.filters, trending: newTrending }

      if (enableRealTimeSearch) {
        search(prev.query, newFilters)
      }

      return { ...prev, filters: newFilters }
    })
  }, [enableRealTimeSearch, search])

  const toggleGpuRequired = useCallback(() => {
    setSearchState(prev => {
      const newGpuRequired = !prev.filters.gpuRequired
      const newFilters = { ...prev.filters, gpuRequired: newGpuRequired }

      if (enableRealTimeSearch) {
        search(prev.query, newFilters)
      }

      return { ...prev, filters: newFilters }
    })
  }, [enableRealTimeSearch, search])

  const getPopularTags = useCallback((): string[] => {
    const tagCounts = new Map<string, number>()

    models.forEach(model => {
      model.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag)
  }, [models])

  const getSuggestedFilters = useCallback((): Partial<DiscoveryFilters> => {
    if (models.length === 0) return {}

    const avgDownloads = models.reduce((sum, model) => sum + model.downloads, 0) / models.length
    const avgCost = models.reduce((sum, model) => sum + model.pricing.costPerHour, 0) / models.length
    const popularTags = getPopularTags().slice(0, 5)

    return {
      minDownloads: Math.floor(avgDownloads * 0.5),
      maxCostPerHour: avgCost * 1.5,
      tags: popularTags,
      trending: true
    }
  }, [models, getPopularTags])

  const exportResults = useCallback(() => {
    const data = {
      searchQuery: searchState.query,
      filters: searchState.filters,
      totalResults: totalCount,
      searchTime,
      cacheHit,
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        organization: model.organization,
        downloads: model.downloads,
        likes: model.likes,
        pricing: model.pricing,
        tags: model.tags
      }))
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `model-search-results-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('📄 Search results exported')
  }, [searchState, totalCount, searchTime, cacheHit, models])

  const sortedModels = useMemo(() => {
    if (!models.length) return models

    const sorted = [...models].sort((a, b) => {
      let aValue: any, bValue: any

      switch (searchState.sortBy) {
        case 'downloads':
          aValue = a.downloads
          bValue = b.downloads
          break
        case 'likes':
          aValue = a.likes
          bValue = b.likes
          break
        case 'updated':
          aValue = new Date(a.lastUpdated).getTime()
          bValue = new Date(b.lastUpdated).getTime()
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'popularity':
          aValue = a.popularity.totalDownloads
          bValue = b.popularity.totalDownloads
          break
        case 'cost':
          aValue = a.pricing.costPerHour
          bValue = b.pricing.costPerHour
          break
        default:
          return 0
      }

      if (searchState.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return sorted
  }, [models, searchState.sortBy, searchState.sortOrder])

  return {
    searchState,
    models: sortedModels,
    loading,
    error,
    totalCount,
    currentPage,
    hasNextPage,
    searchTime,
    cacheHit,

    setQuery,
    setFilters,
    setSortBy,
    setSortOrder,
    addFilter,
    removeFilter,
    clearFilters,
    executeSearch,
    loadMore,
    refresh,

    filterByOrganization,
    filterByModelType,
    filterByPricing,
    filterByPerformance,
    toggleTrending,
    toggleGpuRequired,

    getPopularTags,
    getSuggestedFilters,
    clearCache,
    exportResults
  }
}

// For backward compatibility with ModelCard component
export interface ModelData {
  id: string
  name: string
  author: string
  organization: string
  modelType: string
  description: string
  tags: string[]
  downloads: number
  likes: number
  status: 'active' | 'deploying' | 'inactive'
  estimatedCost?: string
  deploymentUrl?: string
  createdAt: string
  updatedAt: string
}

export function useModelOperations() {
  const [isDeploying, setIsDeploying] = useState(false)

  const deployModel = useCallback(async (modelId: string) => {
    setIsDeploying(true)
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log(`✅ Model ${modelId} deployed successfully`)
      return { success: true, deploymentUrl: `https://deployed.example.com/${modelId}` }
    } catch (error) {
      console.error('Deployment failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsDeploying(false)
    }
  }, [])

  return {
    deployModel,
    isDeploying
  }
}

export default useModelSearch