import { Organization } from '@/contexts/HuggingFaceAuth'

export interface ModelMetadata {
  id: string
  name: string
  organization: Organization
  description: string
  modelType: string
  size: string
  downloads: number
  likes: number
  trending: boolean
  lastUpdated: string
  tags: string[]
  libraryName?: string
  pipelineTag?: string
  author: string
  language: string[]
  license: string
  pricing: ModelPricing
  performance: ModelPerformance
  deployment: ModelDeployment
  popularity: ModelPopularity
  status?: ModelStatus
  createdAt: string
  updatedAt: string
}

export interface ModelPricing {
  tier: 'free' | 'pro' | 'enterprise'
  costPerHour: number
  costPerToken: number
  estimatedMonthlyCost: number
}

export interface ModelPerformance {
  inferenceSpeed: 'fast' | 'medium' | 'slow'
  memoryUsage: 'low' | 'medium' | 'high'
  accuracy: number
  benchmarkScore?: number
}

export interface ModelDeployment {
  supported: boolean
  estimatedSetupTime: number // seconds
  minMemoryMB: number
  gpuRequired: boolean
  instanceTypes: string[]
  status?: 'available' | 'deploying' | 'deployed' | 'error'
  endpoint?: string
}

export interface ModelPopularity {
  rank: number
  weeklyDownloads: number
  monthlyDownloads: number
  totalDownloads: number
  communityRating: number
}

export interface ModelStatus {
  available: boolean
  lastChecked: string
  healthCheck?: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTime?: number
    errorRate?: number
  }
}

export interface DiscoveryFilters {
  organizations: Organization[]
  modelTypes: string[]
  tags: string[]
  minDownloads: number
  maxCostPerHour: number
  minAccuracy: number
  gpuRequired?: boolean
  deploymentSupported?: boolean
  trending?: boolean
  language?: string[]
  license?: string[]
  inferenceSpeed?: ModelPerformance['inferenceSpeed'][]
  pricingTier?: ModelPricing['tier'][]
  task?: string
  modelSize?: string
  sortBy?: string
  limit?: number  // Add missing limit property for pagination
}

export interface SearchOptions {
  query?: string
  filters?: Partial<DiscoveryFilters>
  sortBy?: 'downloads' | 'likes' | 'updated' | 'name' | 'popularity' | 'cost'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface DiscoveryResults {
  models: ModelMetadata[]
  totalCount: number
  page: number
  pageSize: number
  hasNextPage: boolean
  filters: DiscoveryFilters
  searchQuery?: string
  organizationStats: OrganizationStats
  searchTime?: number
  cacheHit?: boolean
}

export type OrganizationStats = Record<Organization, {
  totalModels: number
  averageRating: number
  totalDownloads: number
  featuredModels: string[]
  categories: {
    [category: string]: number
  }
  costDistribution: {
    free: number
    pro: number
    enterprise: number
  }
}>

export interface ModelDeploymentConfig {
  modelId: string
  organization: Organization
  instanceType: string
  scalingConfig: {
    minInstances: number
    maxInstances: number
    targetUtilization: number
  }
  environment: {
    [key: string]: string
  }
  timeout: number
  memoryMB: number
  gpuType?: string
}

export interface DeploymentResult {
  success: boolean
  deploymentId?: string
  endpoint?: string
  estimatedCost?: number
  error?: string
  logs?: string[]
}

export interface ModelCache {
  data: ModelMetadata[]
  timestamp: number
  ttl: number
  searchParams: string
}

export interface CacheStats {
  totalEntries: number
  validEntries: number
  expiredEntries: number
  memoryUsageKB: number
  hitRate: number
  lastCleared?: string
}

// Model search and filtering types
export type ModelSortField = 'downloads' | 'likes' | 'updated' | 'name' | 'popularity' | 'cost' | 'accuracy'
export type SortOrder = 'asc' | 'desc'
export type ModelTypeFilter = 'all' | 'text-generation' | 'text-classification' | 'image-classification' |
                             'question-answering' | 'summarization' | 'translation' | 'conversational' |
                             'fill-mask' | 'token-classification' | 'zero-shot-classification'

// API Response types
export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: ApiError
  metadata?: {
    timestamp: string
    requestId: string
    rateLimit?: {
      remaining: number
      resetTime: string
    }
  }
}

// Event types for real-time updates
export interface ModelUpdateEvent {
  type: 'model_updated' | 'model_deployed' | 'model_removed' | 'popularity_changed'
  modelId: string
  organization: Organization
  timestamp: string
  data: any
}

export interface OrganizationUpdateEvent {
  type: 'new_models' | 'stats_updated' | 'featured_changed'
  organization: Organization
  timestamp: string
  data: any
}

// Validation schemas (for runtime validation)
export interface ModelValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Export utility type helpers
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

// Model comparison types
export interface ModelComparison {
  models: ModelMetadata[]
  metrics: {
    [metric: string]: {
      values: number[]
      bestIndex: number
      worstIndex: number
    }
  }
  recommendation?: {
    modelId: string
    reason: string
    confidence: number
  }
}

// Trending and analytics types
export interface TrendingAnalytics {
  period: 'daily' | 'weekly' | 'monthly'
  topModels: {
    modelId: string
    growthRate: number
    currentRank: number
    previousRank: number
  }[]
  organizationTrends: {
    [key in Organization]: {
      growthRate: number
      newModels: number
      popularityChange: number
    }
  }
}

export default ModelMetadata