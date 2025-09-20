import { NextRequest, NextResponse } from 'next/server'

// Mock HuggingFace integration for now - in production this would connect to real HF API
const MOCK_MODELS = [
  {
    id: 'meta-llama/Llama-2-7b-chat-hf',
    name: 'Llama 2 7B Chat',
    description: 'Meta\'s Llama 2 model fine-tuned for chat applications',
    downloads: 2500000,
    likes: 15000,
    tags: ['conversational', 'text-generation', 'llama2'],
    size: '13.5 GB',
    cost_per_token: 0.0001,
    provider: 'runpod',
    status: 'available'
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.1',
    name: 'Mistral 7B Instruct',
    description: 'Mistral AI\'s instruction-tuned model',
    downloads: 1800000,
    likes: 12000,
    tags: ['instruction-following', 'text-generation', 'mistral'],
    size: '13.4 GB',
    cost_per_token: 0.0001,
    provider: 'runpod',
    status: 'available'
  },
  {
    id: 'codellama/CodeLlama-7b-Python-hf',
    name: 'Code Llama Python 7B',
    description: 'Code Llama specialized for Python code generation',
    downloads: 950000,
    likes: 8500,
    tags: ['code-generation', 'python', 'programming'],
    size: '13.1 GB',
    cost_per_token: 0.00015,
    provider: 'runpod',
    status: 'available'
  },
  {
    id: 'stabilityai/stablelm-2-1_6b',
    name: 'StableLM 2 1.6B',
    description: 'Stability AI\'s efficient small language model',
    downloads: 650000,
    likes: 4200,
    tags: ['efficient', 'small-model', 'text-generation'],
    size: '3.2 GB',
    cost_per_token: 0.00005,
    provider: 'runpod',
    status: 'available'
  },
  {
    id: 'microsoft/DialoGPT-medium',
    name: 'DialoGPT Medium',
    description: 'Microsoft\'s conversational response generation model',
    downloads: 1200000,
    likes: 7800,
    tags: ['conversational', 'dialogue', 'chatbot'],
    size: '1.4 GB',
    cost_per_token: 0.00008,
    provider: 'runpod',
    status: 'available'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'downloads'
    const order = searchParams.get('order') || 'desc'

    let filteredModels = [...MOCK_MODELS]

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredModels = filteredModels.filter(model =>
        model.name.toLowerCase().includes(searchLower) ||
        model.description.toLowerCase().includes(searchLower) ||
        model.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Apply tag filter
    if (tag) {
      filteredModels = filteredModels.filter(model =>
        model.tags.includes(tag.toLowerCase())
      )
    }

    // Sort models
    filteredModels.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a]
      const bVal = b[sortBy as keyof typeof b]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'desc' ? bVal - aVal : aVal - bVal
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal)
      }

      return 0
    })

    // Apply pagination
    const paginatedModels = filteredModels.slice(offset, offset + limit)

    // Calculate cost comparison with traditional APIs
    const traditionalAPICost = 0.03 // $0.03 per 1K tokens (OpenAI GPT-4)
    const avgOpenSourceCost = paginatedModels.reduce((sum, model) => sum + model.cost_per_token, 0) / paginatedModels.length
    const savings = Math.round(((traditionalAPICost - avgOpenSourceCost) / traditionalAPICost) * 100)

    return NextResponse.json({
      success: true,
      data: {
        models: paginatedModels,
        pagination: {
          total: filteredModels.length,
          limit,
          offset,
          hasMore: offset + limit < filteredModels.length
        },
        analytics: {
          totalModels: MOCK_MODELS.length,
          avgCostSavings: `${savings}%`,
          traditionalAPICost,
          avgOpenSourceCost,
          tags: [...new Set(MOCK_MODELS.flatMap(m => m.tags))]
        }
      }
    })
  } catch (error) {
    console.error('Models API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, modelId, config } = body

    switch (action) {
      case 'deploy':
        if (!modelId) {
          return NextResponse.json({
            success: false,
            error: 'modelId is required for deployment'
          }, { status: 400 })
        }

        const model = MOCK_MODELS.find(m => m.id === modelId)
        if (!model) {
          return NextResponse.json({
            success: false,
            error: 'Model not found'
          }, { status: 404 })
        }

        // Mock RunPod deployment
        const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const endpoint = `https://${deploymentId}.runpod.io`

        return NextResponse.json({
          success: true,
          data: {
            deploymentId,
            endpoint,
            model: model,
            status: 'deploying',
            estimatedTime: '30-60 seconds',
            cost: {
              setup: 0,
              perToken: model.cost_per_token,
              idle: 0.0001 // per second when idle
            }
          }
        })

      case 'estimate':
        if (!modelId) {
          return NextResponse.json({
            success: false,
            error: 'modelId is required for cost estimation'
          }, { status: 400 })
        }

        const estimateModel = MOCK_MODELS.find(m => m.id === modelId)
        if (!estimateModel) {
          return NextResponse.json({
            success: false,
            error: 'Model not found'
          }, { status: 404 })
        }

        const tokensPerMonth = body.tokensPerMonth || 1000000 // 1M tokens default
        const monthlyCost = tokensPerMonth * estimateModel.cost_per_token
        const traditionalCost = tokensPerMonth * 0.03
        const savings = traditionalCost - monthlyCost

        return NextResponse.json({
          success: true,
          data: {
            model: estimateModel,
            estimate: {
              tokensPerMonth,
              monthlyCost: monthlyCost.toFixed(4),
              traditionalCost: traditionalCost.toFixed(2),
              savings: savings.toFixed(2),
              savingsPercentage: Math.round((savings / traditionalCost) * 100)
            }
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Models Action Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Models action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}