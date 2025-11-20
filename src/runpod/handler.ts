/**
 * RunPod Serverless Handler
 *
 * This handler receives job requests from RunPod, executes the agent orchestration,
 * and returns results in RunPod's expected format.
 *
 * Job Input Format:
 * {
 *   "description": "Build a REST API for task management",
 *   "language": "python" | "go" | "rust" | "typescript",
 *   "framework": "fastapi" | "gin" | "actix-web" | "nextjs",
 *   "githubRepo"?: string,
 *   "features"?: string[]
 * }
 *
 * Job Output Format:
 * {
 *   "status": "success" | "error",
 *   "output": {
 *     "plan": OrchestratorPlan,
 *     "agents": AgentOutput[],
 *     "files": GeneratedFile[],
 *     "summary": string
 *   },
 *   "error"?: string
 * }
 */

import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator'
import { EventBus } from '../orchestrator/EventBus'
import { ModelRouter } from '../providers/ModelRouter'
import { ProviderRegistry } from '../providers/ProviderRegistry'
import { LanguageRouter } from '../adapters/LanguageRouter'

interface JobInput {
  description: string
  language: 'python' | 'go' | 'rust' | 'typescript'
  framework?: string
  githubRepo?: string
  features?: string[]
}

interface JobOutput {
  status: 'success' | 'error'
  output?: {
    plan: any
    agents: any[]
    files: any[]
    summary: string
    costSavings: {
      totalTokens: number
      totalCost: number
      savingsVsClaude: number
      percentSavings: number
    }
  }
  error?: string
}

/**
 * Initialize the agent system
 */
async function initializeSystem(): Promise<{
  orchestrator: AgentOrchestrator
  eventBus: EventBus
}> {
  // Initialize event bus
  const eventBus = new EventBus()

  // Initialize provider registry
  const providerRegistry = new ProviderRegistry()
  await providerRegistry.initialize()

  // Initialize model router
  const modelRouter = new ModelRouter(providerRegistry)

  // Initialize language router
  const languageRouter = new LanguageRouter()

  // Initialize orchestrator
  const orchestrator = new AgentOrchestrator({
    modelRouter,
    languageRouter,
    eventBus,
  })

  return { orchestrator, eventBus }
}

/**
 * Main handler function
 * This is called by RunPod for each job
 */
export async function handler(job: { input: JobInput }): Promise<JobOutput> {
  const startTime = Date.now()

  console.log('[RunPod Handler] Starting job:', {
    jobId: job,
    input: job.input,
    timestamp: new Date().toISOString(),
  })

  try {
    // Validate input
    if (!job.input || !job.input.description) {
      throw new Error('Missing required field: description')
    }

    if (!job.input.language) {
      throw new Error('Missing required field: language')
    }

    const { description, language, framework, githubRepo, features } = job.input

    // Initialize the agent system
    console.log('[RunPod Handler] Initializing agent system...')
    const { orchestrator, eventBus } = await initializeSystem()

    // Subscribe to orchestrator events for logging
    eventBus.on('agent:started', (event) => {
      console.log(`[Agent Started] ${event.agentType}`)
    })

    eventBus.on('agent:completed', (event) => {
      console.log(`[Agent Completed] ${event.agentType}`)
    })

    eventBus.on('agent:failed', (event) => {
      console.error(`[Agent Failed] ${event.agentType}:`, event.error)
    })

    // Execute orchestration
    console.log('[RunPod Handler] Executing orchestration...')
    const result = await orchestrator.orchestrate({
      description,
      language,
      framework: framework || getDefaultFramework(language),
      githubRepo,
      features,
    })

    // Calculate execution time
    const executionTime = Date.now() - startTime
    console.log('[RunPod Handler] Job completed successfully:', {
      executionTime: `${executionTime}ms`,
      filesGenerated: result.files.length,
      agentsUsed: result.agents.length,
    })

    // Return success response
    return {
      status: 'success',
      output: {
        plan: result.plan,
        agents: result.agents,
        files: result.files,
        summary: generateSummary(result),
        costSavings: result.costSavings || {
          totalTokens: 0,
          totalCost: 0,
          savingsVsClaude: 0,
          percentSavings: 0,
        },
      },
    }
  } catch (error) {
    const executionTime = Date.now() - startTime

    console.error('[RunPod Handler] Job failed:', {
      error: error instanceof Error ? error.message : String(error),
      executionTime: `${executionTime}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Return error response
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get default framework for a language
 */
function getDefaultFramework(language: string): string {
  const defaults: Record<string, string> = {
    python: 'fastapi',
    go: 'gin',
    rust: 'actix-web',
    typescript: 'nextjs',
  }

  return defaults[language] || 'unknown'
}

/**
 * Generate a summary of the orchestration result
 */
function generateSummary(result: any): string {
  const { plan, agents, files, costSavings } = result

  const summary = [
    `Generated ${files.length} files for ${plan.language}/${plan.framework} project.`,
    ``,
    `Agents used: ${agents.map((a: any) => a.agentType).join(', ')}`,
    ``,
    `Cost optimization:`,
    `- Total tokens: ${costSavings?.totalTokens.toLocaleString() || 0}`,
    `- Total cost: $${costSavings?.totalCost.toFixed(4) || '0.0000'}`,
    `- Savings vs Claude: ${costSavings?.percentSavings.toFixed(2) || 0}%`,
    ``,
    `Files generated:`,
    ...files.slice(0, 10).map((f: any) => `- ${f.path}`),
    files.length > 10 ? `... and ${files.length - 10} more files` : '',
  ].filter(Boolean).join('\n')

  return summary
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }
}

// Export for RunPod serverless
if (require.main === module) {
  // This will be called by RunPod
  const runpod = require('runpod-sdk')

  runpod.runpod_serverless.start({
    handler: async (job: any) => {
      return await handler(job)
    },
  })
}
