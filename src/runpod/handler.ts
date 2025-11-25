/**
 * RunPod Serverless Worker - HTTP Server Pattern
 *
 * This module creates an HTTP server for RunPod serverless deployment.
 * RunPod workers for Node.js must expose HTTP endpoints.
 *
 * Endpoints:
 * - GET /health - Health check
 * - POST / - Process job
 *
 * Job Input Format:
 * {
 *   "input": {
 *     "description": "Build a REST API for task management",
 *     "language": "python" | "go" | "rust" | "typescript",
 *     "framework": "fastapi" | "gin" | "actix-web" | "nextjs",
 *     "githubRepo"?: string,
 *     "features"?: string[]
 *   }
 * }
 *
 * Job Output Format:
 * {
 *   "status": "success" | "error",
 *   "output": { ... },
 *   "error"?: string
 * }
 */

import * as http from 'http'
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator'
import { EventBus, AgentEvent } from '../orchestrator/EventBus'

const PORT = parseInt(process.env.PORT || '8080', 10)

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
    plan: Record<string, unknown>
    agents: unknown[]
    files: unknown[]
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
  const eventBus = EventBus.getInstance()
  const orchestrator = AgentOrchestrator.getInstance()
  return { orchestrator, eventBus }
}

/**
 * Process a job request
 */
async function processJob(job: { input: JobInput }): Promise<JobOutput> {
  const startTime = Date.now()

  console.log('[RunPod Worker] Starting job:', {
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

    const { description, language } = job.input

    // Initialize the agent system
    console.log('[RunPod Worker] Initializing agent system...')
    const { orchestrator, eventBus } = await initializeSystem()

    // Subscribe to orchestrator events for logging
    eventBus.on(AgentEvent.AgentStarted, (event) => {
      console.log(`[Agent Started] ${event.agentType}`)
    })

    eventBus.on(AgentEvent.AgentProgress, (event) => {
      console.log(`[Agent Progress] ${event.agentId}: ${event.status}`)
    })

    eventBus.on(AgentEvent.Error, (event) => {
      console.error(`[Error] ${event.projectId}:`, event.error)
    })

    // Execute orchestration
    console.log('[RunPod Worker] Executing orchestration...')
    const result = await orchestrator.startProject({
      userRequest: description,
      projectName: `${language}-${Date.now()}`,
      userId: 'runpod-serverless',
      organizationId: 'runpod-default',
    })

    const executionTime = Date.now() - startTime
    console.log('[RunPod Worker] Job completed:', {
      executionTime: `${executionTime}ms`,
      projectId: result.projectId,
      status: result.status,
    })

    return {
      status: 'success',
      output: {
        plan: {},
        agents: [],
        files: [],
        summary: `Project ${result.projectId} started with status: ${result.status}`,
        costSavings: {
          totalTokens: 0,
          totalCost: 0,
          savingsVsClaude: 0,
          percentSavings: 0,
        },
      },
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('[RunPod Worker] Job failed:', {
      error: error instanceof Error ? error.message : String(error),
      executionTime: `${executionTime}ms`,
    })

    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Parse JSON body from request
 */
function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Send JSON response
 */
function sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

/**
 * HTTP Server for RunPod
 */
const server = http.createServer(async (req, res) => {
  const url = req.url || '/'
  const method = req.method || 'GET'

  console.log(`[${method}] ${url}`)

  // Health check endpoint
  if (url === '/health' && method === 'GET') {
    sendJson(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    })
    return
  }

  // Job processing endpoint
  if (url === '/' && method === 'POST') {
    try {
      const body = await parseBody(req) as { input?: JobInput }
      const result = await processJob({ input: body.input as JobInput })
      sendJson(res, result.status === 'success' ? 200 : 500, result)
    } catch (error) {
      sendJson(res, 400, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Bad request',
      })
    }
    return
  }

  // RunPod also sends to /runsync for synchronous requests
  if (url === '/runsync' && method === 'POST') {
    try {
      const body = await parseBody(req) as { input?: JobInput }
      const result = await processJob({ input: body.input as JobInput })
      sendJson(res, result.status === 'success' ? 200 : 500, result)
    } catch (error) {
      sendJson(res, 400, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Bad request',
      })
    }
    return
  }

  // 404 for unknown routes
  sendJson(res, 404, { error: 'Not found' })
})

// Start server when run directly
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[RunPod Worker] Server listening on port ${PORT}`)
    console.log(`[RunPod Worker] Health check: http://localhost:${PORT}/health`)
    console.log(`[RunPod Worker] Job endpoint: POST http://localhost:${PORT}/`)
  })
}

// Export for testing
export { processJob, server }
