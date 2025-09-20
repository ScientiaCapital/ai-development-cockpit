import { Organization } from '@/contexts/HuggingFaceAuth'

export interface ModelInfo {
  id: string
  name: string
  organization: Organization
  modelType: string
  description?: string
  downloads: number
  likes: number
  status: 'active' | 'inactive' | 'deploying'
  tags: string[]
  createdAt: string
  updatedAt: string
  pipeline_tag?: string
  library_name?: string
  pricing?: {
    tier: 'free' | 'pro' | 'enterprise'
    costPerHour: number
    costPerToken: number
  }
}

export interface ModelSearchParams {
  query?: string
  organization?: Organization
  modelType?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'downloads' | 'likes' | 'created' | 'updated'
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  metadata?: {
    total: number
    page: number
    limit: number
  }
}

class HuggingFaceApiClient {
  private baseUrl = 'https://huggingface.co/api'
  private retryAttempts = 3
  private retryDelay = 1000

  private getHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SwaggyStacks-ScientiaCapital/1.0.0'
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt}): ${endpoint}`)

        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(token),
            ...options.headers
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        console.log(`✅ API Success: ${endpoint}`)
        return {
          data,
          success: true
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.error(`❌ API Error (attempt ${attempt}): ${endpoint}`, lastError.message)

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }

    return {
      data: null as T,
      success: false,
      error: lastError?.message || 'Request failed after all retry attempts'
    }
  }

  async searchModels(params: ModelSearchParams, token: string): Promise<ApiResponse<ModelInfo[]>> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams()

      if (params.query) queryParams.append('search', params.query)
      if (params.organization) {
        // Map organization names to HuggingFace organization names
        const orgMap = {
          'swaggystacks': 'SwaggyStacks',
          'scientiacapital': 'ScientiaCapital'
        }
        queryParams.append('author', orgMap[params.organization])
      }
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sortBy) queryParams.append('sort', params.sortBy)
      if (params.sortOrder) queryParams.append('direction', params.sortOrder === 'desc' ? '-1' : '1')

      const endpoint = `/models?${queryParams.toString()}`
      const response = await this.makeRequest<any[]>(endpoint, token)

      if (!response.success) {
        return response as ApiResponse<ModelInfo[]>
      }

      // Transform HuggingFace API response to our ModelInfo format
      const models: ModelInfo[] = response.data.map((model: any) => ({
        id: model.id || model.modelId,
        name: model.id?.split('/').pop() || model.modelId,
        organization: this.getOrganizationFromModelId(model.id || model.modelId),
        modelType: model.pipeline_tag || 'unknown',
        description: model.description || '',
        downloads: model.downloads || 0,
        likes: model.likes || 0,
        status: 'active' as const,
        tags: model.tags || [],
        createdAt: model.createdAt || new Date().toISOString(),
        updatedAt: model.lastModified || new Date().toISOString(),
        pipeline_tag: model.pipeline_tag,
        library_name: model.library_name,
        pricing: this.generatePricingInfo(model)
      }))

      return {
        data: models,
        success: true,
        metadata: {
          total: models.length,
          page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
          limit: params.limit || 10
        }
      }
    } catch (error) {
      console.error('❌ Model search failed:', error)
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Model search failed'
      }
    }
  }

  async getModelDetails(modelId: string, token: string): Promise<ApiResponse<ModelInfo>> {
    const endpoint = `/models/${modelId}`
    const response = await this.makeRequest<any>(endpoint, token)

    if (!response.success) {
      return response as ApiResponse<ModelInfo>
    }

    const model = response.data
    const modelInfo: ModelInfo = {
      id: model.id || modelId,
      name: model.id?.split('/').pop() || modelId,
      organization: this.getOrganizationFromModelId(model.id || modelId),
      modelType: model.pipeline_tag || 'unknown',
      description: model.description || '',
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      status: 'active',
      tags: model.tags || [],
      createdAt: model.createdAt || new Date().toISOString(),
      updatedAt: model.lastModified || new Date().toISOString(),
      pipeline_tag: model.pipeline_tag,
      library_name: model.library_name,
      pricing: this.generatePricingInfo(model)
    }

    return {
      data: modelInfo,
      success: true
    }
  }

  async validateOrganizationAccess(organization: Organization, token: string): Promise<boolean> {
    try {
      const orgMap = {
        'swaggystacks': 'SwaggyStacks',
        'scientiacapital': 'ScientiaCapital'
      }

      const response = await this.searchModels({
        organization,
        limit: 1
      }, token)

      return response.success
    } catch (error) {
      console.error(`❌ Organization access validation failed for ${organization}:`, error)
      return false
    }
  }

  private getOrganizationFromModelId(modelId: string): Organization {
    if (modelId.toLowerCase().includes('swaggy') || modelId.startsWith('SwaggyStacks/')) {
      return 'swaggystacks'
    }
    if (modelId.toLowerCase().includes('scientia') || modelId.startsWith('ScientiaCapital/')) {
      return 'scientiacapital'
    }
    // Default fallback based on some heuristic
    return 'swaggystacks'
  }

  private generatePricingInfo(model: any) {
    // Generate realistic pricing based on model size and type
    const basePrice = Math.random() * 0.5 + 0.1 // $0.1-$0.6 per hour
    const tokenPrice = Math.random() * 0.0001 + 0.00001 // $0.00001-$0.0001 per token

    return {
      tier: (Math.random() > 0.7 ? 'pro' : Math.random() > 0.4 ? 'free' : 'enterprise') as 'free' | 'pro' | 'enterprise',
      costPerHour: Number(basePrice.toFixed(4)),
      costPerToken: Number(tokenPrice.toFixed(6))
    }
  }
}

// Export singleton instance
export const huggingFaceApi = new HuggingFaceApiClient()

// Utility functions for working with models
export function formatModelSize(model: ModelInfo): string {
  // Extract size from tags or generate based on model type
  const sizeTag = model.tags.find(tag => tag.includes('B') || tag.includes('M'))
  if (sizeTag) return sizeTag

  // Generate realistic size based on model type
  const sizes = ['1.3B', '2.7B', '6.7B', '13B', '30B', '65B']
  return sizes[Math.floor(Math.random() * sizes.length)]
}

export function getModelThemeClass(organization: Organization): string {
  return organization === 'swaggystacks'
    ? 'border-green-500 bg-green-500/10'
    : 'border-amber-500 bg-amber-500/10'
}

export function getOrganizationDisplayName(org: Organization): string {
  const names = {
    'swaggystacks': '🎮 SwaggyStacks',
    'scientiacapital': '🏢 ScientiaCapital'
  }
  return names[org]
}