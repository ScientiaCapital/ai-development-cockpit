'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useHuggingFaceAuth } from '@/contexts/HuggingFaceAuth'
import { modelDiscoveryService, DiscoveryResults, DiscoveryFilters } from '@/services/modelDiscovery'
import { modelCache } from '@/lib/modelCache'
import { ModelMetadata } from '@/types/models'

export interface UseModelsOptions {
  filters?: Partial<DiscoveryFilters>
  searchQuery?: string
  pageSize?: number
  autoFetch?: boolean
  cacheEnabled?: boolean
}

export interface UseModelsReturn {
  models: ModelMetadata[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  hasNextPage: boolean
  searchTime?: number
  cacheHit?: boolean
  organizationStats: DiscoveryResults['organizationStats']

  // Actions
  search: (query?: string, filters?: Partial<DiscoveryFilters>) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  clearCache: () => void
  goToPage: (page: number) => Promise<void>

  // Cache management
  getCacheStats: () => any
  preloadPopularModels: (modelIds: string[]) => Promise<void>
  checkModelAvailability: (modelIds: string[]) => Promise<{ [key: string]: boolean }>
}

export function useModels(options: UseModelsOptions = {}): UseModelsReturn {
  const {
    filters = {},
    searchQuery: initialQuery = '',
    pageSize = 20,
    autoFetch = true,
    cacheEnabled = true
  } = options

  const { currentOrganization, isAuthenticated, getCurrentToken } = useHuggingFaceAuth()

  // State
  const [models, setModels] = useState<ModelMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [currentFilters, setCurrentFilters] = useState<Partial<DiscoveryFilters>>(filters)
  const [searchTime, setSearchTime] = useState<number>()
  const [cacheHit, setCacheHit] = useState<boolean>()
  const [organizationStats, setOrganizationStats] = useState<DiscoveryResults['organizationStats']>({
    arcade: { totalModels: 0, averageRating: 0, totalDownloads: 0, featuredModels: [] },
    enterprise: { totalModels: 0, averageRating: 0, totalDownloads: 0, featuredModels: [] }
  })

  // Refs for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  // Abort any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const performSearch = useCallback(async (
    query: string = '',
    searchFilters: Partial<DiscoveryFilters> = {},
    page: number = 1,
    append: boolean = false
  ) => {
    if (!isAuthenticated) {
      setError('Authentication required')
      setLoading(false)
      return
    }

    try {
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      if (!append) {
        setLoading(true)
        setError(null)
      }

      const startTime = Date.now()
      const token = getCurrentToken()

      // Merge organization filter with current organization
      const mergedFilters: Partial<DiscoveryFilters> = {
        ...currentFilters,
        ...searchFilters,
        organizations: searchFilters.organizations || [currentOrganization]
      }

      console.log(`🔍 Searching models: "${query}" (page ${page})`, mergedFilters)

      const results = await modelDiscoveryService.discoverModels(
        token,
        mergedFilters,
        query || undefined,
        page,
        pageSize
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      // Check if this request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (append && page > 1) {
        setModels(prev => [...prev, ...results.models])
      } else {
        setModels(results.models)
      }

      setTotalCount(results.totalCount)
      setCurrentPage(page)
      setHasNextPage(results.hasNextPage)
      setSearchTime(duration)
      setCacheHit(results.cacheHit)
      setOrganizationStats(results.organizationStats)
      setSearchQuery(query)
      setCurrentFilters(mergedFilters)

      console.log(`✅ Search completed: ${results.models.length} models in ${duration}ms (cache: ${results.cacheHit ? 'hit' : 'miss'})`)

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🔄 Search request aborted')
        return
      }

      console.error('❌ Model search failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)

      if (!append) {
        setModels([])
        setTotalCount(0)
        setHasNextPage(false)
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, getCurrentToken, currentOrganization, currentFilters, pageSize])

  // Debounced search function
  const search = useCallback(async (
    query?: string,
    searchFilters?: Partial<DiscoveryFilters>
  ) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query || '', searchFilters || {}, 1, false)
    }, 300) // 300ms debounce
  }, [performSearch])

  // Load more results (pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasNextPage) return

    const nextPage = currentPage + 1
    await performSearch(searchQuery, currentFilters, nextPage, true)
  }, [loading, hasNextPage, currentPage, searchQuery, currentFilters, performSearch])

  // Go to specific page
  const goToPage = useCallback(async (page: number) => {
    if (loading || page < 1) return
    await performSearch(searchQuery, currentFilters, page, false)
  }, [loading, searchQuery, currentFilters, performSearch])

  // Refresh current search
  const refresh = useCallback(async () => {
    await performSearch(searchQuery, currentFilters, 1, false)
  }, [searchQuery, currentFilters, performSearch])

  // Cache management
  const clearCache = useCallback(() => {
    if (cacheEnabled) {
      modelDiscoveryService.clearCache()
      modelCache.clear()
      console.log('🗑️ Model cache cleared')
    }
  }, [cacheEnabled])

  const getCacheStats = useCallback(() => {
    if (!cacheEnabled) return null

    return {
      discovery: modelDiscoveryService.getCacheStats(),
      cache: modelCache.getStats(),
      debug: modelCache.getDebugInfo()
    }
  }, [cacheEnabled])

  const preloadPopularModels = useCallback(async (modelIds: string[]) => {
    if (!isAuthenticated || !cacheEnabled) return

    try {
      const token = getCurrentToken()
      await modelCache.preloadPopularModels(modelIds, currentOrganization)
      console.log(`🔄 Preloaded ${modelIds.length} popular models`)
    } catch (err) {
      console.error('❌ Failed to preload models:', err)
    }
  }, [isAuthenticated, cacheEnabled, getCurrentToken, currentOrganization])

  const checkModelAvailability = useCallback(async (modelIds: string[]) => {
    if (!isAuthenticated) return {}

    try {
      const token = getCurrentToken()

      // Check cache first
      if (cacheEnabled) {
        const cached = modelCache.getCachedModelAvailability(modelIds)
        if (cached) {
          console.log('📋 Using cached availability data')
          return cached
        }
      }

      const availability = await modelDiscoveryService.checkModelAvailability(modelIds, token)

      // Cache the results
      if (cacheEnabled) {
        modelCache.cacheModelAvailability(modelIds, availability)
      }

      return availability
    } catch (err) {
      console.error('❌ Failed to check model availability:', err)
      return {}
    }
  }, [isAuthenticated, cacheEnabled, getCurrentToken])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && isAuthenticated) {
      console.log('🔄 Auto-fetching models for', currentOrganization)
      performSearch(searchQuery, currentFilters, 1, false)
    }
  }, [autoFetch, isAuthenticated, currentOrganization]) // Note: intentionally not including all deps to avoid infinite loops

  // Clear organization cache when switching organizations
  useEffect(() => {
    if (cacheEnabled && isAuthenticated) {
      modelCache.clearOrganization(currentOrganization)
    }
  }, [currentOrganization, cacheEnabled, isAuthenticated])

  return {
    // State
    models,
    loading,
    error,
    totalCount,
    currentPage,
    hasNextPage,
    searchTime,
    cacheHit,
    organizationStats,

    // Actions
    search,
    loadMore,
    refresh,
    clearCache,
    goToPage,

    // Cache management
    getCacheStats,
    preloadPopularModels,
    checkModelAvailability
  }
}

export default useModels