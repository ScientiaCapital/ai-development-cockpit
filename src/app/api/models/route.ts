import { NextRequest, NextResponse } from 'next/server'
import HuggingFaceDiscoveryService from '@/services/huggingface/discovery.service'
import RunPodDeploymentService from '@/services/runpod/deployment.service'

// Lazy initialize services - only create when needed, not at module load time
let hfService: HuggingFaceDiscoveryService | null = null;
let runpodService: RunPodDeploymentService | null = null;

function getHFService(): HuggingFaceDiscoveryService {
  if (!hfService) {
    hfService = new HuggingFaceDiscoveryService();
  }
  return hfService;
}

function getRunPodService(): RunPodDeploymentService | null {
  try {
    if (!runpodService && process.env.RUNPOD_API_KEY) {
      runpodService = new RunPodDeploymentService();
    }
    return runpodService;
  } catch (error) {
    console.warn('RunPod service not available:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const task = searchParams.get('task') || 'text-generation'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'downloads'

    // Get services lazily
    const hf = getHFService();
    const searchResult = await hf.searchModels({
      search,
      task: task === 'all' ? 'text-generation' : task,
      sort: sortBy as 'downloads' | 'likes' | 'updated',
      limit,
      offset
    });

    // Transform models to match API format
    const transformedModels = searchResult.models.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      downloads: model.downloads,
      likes: model.likes,
      tags: model.tags,
      size: `${model.modelSize.toFixed(1)} GB`,
      cost_per_token: model.cost.estimatedHourly / 1000000, // Rough estimate
      provider: 'runpod',
      status: 'available',
      parameterCount: model.parameterCount,
      license: model.license,
      author: model.author,
      task: model.task,
      cost: model.cost,
      requirements: model.requirements,
      deployment: model.deployment
    }));

    // Calculate cost analytics
    const avgHourlyCost = transformedModels.reduce((sum, model) => sum + model.cost.estimatedHourly, 0) / transformedModels.length;
    const traditionalAPICost = 750; // Monthly cost for OpenAI equivalent usage
    const avgSavings = transformedModels.reduce((sum, model) => sum + model.cost.savingsVsOpenAI, 0) / transformedModels.length;

    return NextResponse.json({
      success: true,
      data: {
        models: transformedModels,
        pagination: {
          total: searchResult.total,
          limit,
          offset,
          hasMore: searchResult.hasMore
        },
        analytics: {
          totalModels: searchResult.total,
          avgCostSavings: `${Math.round(avgSavings)}%`,
          traditionalAPICost,
          avgOpenSourceCost: avgHourlyCost,
          tags: [...new Set(transformedModels.flatMap(m => m.tags))].slice(0, 20)
        }
      }
    })
  } catch (error) {
    console.error('Models API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Check HUGGINGFACE_TOKEN environment variable'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, modelId, config } = body

    // Check if services are initialized
    if (!hfService || !runpodService) {
      throw new Error('Services not initialized. Check environment variables.');
    }

    switch (action) {
      case 'deploy':
        if (!modelId) {
          return NextResponse.json({
            success: false,
            error: 'modelId is required for deployment'
          }, { status: 400 })
        }

        // Get model information from HuggingFace
        const model = await hfService.getModelInfo(modelId);
        if (!model) {
          return NextResponse.json({
            success: false,
            error: 'Model not found'
          }, { status: 404 })
        }

        // Deploy model using RunPod service
        const deploymentResult = await runpodService.deployModel({
          modelId,
          containerImage: config?.containerImage,
          gpuType: config?.gpuType,
          minWorkers: config?.minWorkers || 0,
          maxWorkers: config?.maxWorkers || 3,
          timeout: config?.timeout || 300,
          envVars: config?.envVars
        });

        return NextResponse.json({
          success: true,
          data: {
            deploymentId: deploymentResult.endpointId,
            endpoint: deploymentResult.endpointUrl,
            model: {
              id: model.id,
              name: model.name,
              description: model.description,
              parameterCount: model.parameterCount,
              framework: model.deployment.framework
            },
            status: deploymentResult.status,
            estimatedTime: '30-60 seconds',
            deploymentTime: deploymentResult.deploymentTime,
            cost: {
              setup: 0,
              hourly: deploymentResult.estimatedCostPerHour,
              monthly: deploymentResult.estimatedCostPerHour * 24 * 30,
              idle: 0.001 // per minute when idle
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

        // Get model information from HuggingFace
        const estimateModel = await hfService.getModelInfo(modelId);
        if (!estimateModel) {
          return NextResponse.json({
            success: false,
            error: 'Model not found'
          }, { status: 404 })
        }

        const tokensPerMonth = body.tokensPerMonth || 1000000 // 1M tokens default

        // Calculate based on actual model costs
        const monthlyCost = estimateModel.cost.estimatedMonthly;
        const traditionalCost = tokensPerMonth * 0.03; // OpenAI pricing
        const savings = traditionalCost - monthlyCost;

        return NextResponse.json({
          success: true,
          data: {
            model: {
              id: estimateModel.id,
              name: estimateModel.name,
              parameterCount: estimateModel.parameterCount,
              requirements: estimateModel.requirements
            },
            estimate: {
              tokensPerMonth,
              monthlyCost: monthlyCost.toFixed(2),
              traditionalCost: traditionalCost.toFixed(2),
              savings: savings.toFixed(2),
              savingsPercentage: estimateModel.cost.savingsVsOpenAI,
              breakdown: {
                hourly: estimateModel.cost.estimatedHourly,
                gpuMemoryRequired: `${estimateModel.requirements.recommendedGpuMemory}GB`,
                framework: estimateModel.deployment.framework
              }
            }
          }
        })

      case 'status':
        if (!body.endpointId) {
          return NextResponse.json({
            success: false,
            error: 'endpointId is required for status check'
          }, { status: 400 })
        }

        // Check deployment health using RunPod service
        const healthStatus = await runpodService.checkEndpointHealth(body.endpointId);

        return NextResponse.json({
          success: true,
          data: {
            endpointId: body.endpointId,
            status: healthStatus.status,
            workersReady: healthStatus.workersReady,
            workersIdle: healthStatus.workersIdle,
            lastActivity: healthStatus.lastActivity
          }
        })

      case 'stop':
        if (!body.endpointId) {
          return NextResponse.json({
            success: false,
            error: 'endpointId is required to stop deployment'
          }, { status: 400 })
        }

        // Stop deployment using RunPod service
        const stopResult = await runpodService.stopEndpoint(body.endpointId);

        return NextResponse.json({
          success: stopResult,
          data: {
            endpointId: body.endpointId,
            stopped: stopResult
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
      details: error instanceof Error ? error.message : 'Check environment variables'
    }, { status: 500 })
  }
}