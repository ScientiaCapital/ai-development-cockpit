/**
 * RunPod Serverless Handler
 *
 * Entry point for RunPod serverless execution.
 * Handles job inputs, orchestrates agents, and returns results.
 *
 * Part of Phase 3: RunPod Deployment - Task 4.2
 * Created: 2025-11-20
 * Fixed: 2025-11-20 (matched actual AgentOrchestrator interface)
 */

import { AgentOrchestrator, StartProjectRequest } from '../orchestrator/AgentOrchestrator'
import { EventBus, AgentEvent } from '../orchestrator/EventBus'

/**
 * Job Input Schema
 *
 * Defines the expected input format from RunPod requests
 */
interface JobInput {
  userRequest: string
  userId: string
  organizationId: string
  projectName?: string
}

/**
 * Job Output Schema
 *
 * Defines the response format returned to RunPod
 */
interface JobOutput {
  status: 'success' | 'error'
  output?: {
    projectId: string
    projectName: string
    currentPhase: string
    progress: number
    needsApproval: string | null
  }
  error?: string
}

/**
 * Initialize System
 *
 * Gets singleton instances of orchestrator and event bus.
 * Note: AgentOrchestrator manages its own dependencies internally.
 */
function initializeSystem(): {
  orchestrator: AgentOrchestrator
  eventBus: EventBus
} {
  console.log('🔧 Initializing AI Development Cockpit system...')

  // Get singleton instances (constructor is private/internal)
  const eventBus = EventBus.getInstance()
  const orchestrator = AgentOrchestrator.getInstance()

  console.log('✅ System initialized successfully')

  return { orchestrator, eventBus }
}

/**
 * RunPod Handler
 *
 * Main entry point for RunPod serverless jobs.
 * Processes job inputs and orchestrates AI agent teams.
 *
 * @param job - RunPod job object with input payload
 * @returns Job output with results or error
 */
export async function handler(job: { input: JobInput }): Promise<JobOutput> {
  const startTime = Date.now()

  try {
    console.log('🚀 RunPod job started')
    console.log('📥 Input:', JSON.stringify(job.input, null, 2))

    // Validate input
    const { userRequest, userId, organizationId, projectName } = job.input

    if (!userRequest || !userId || !organizationId) {
      throw new Error('Missing required fields: userRequest, userId, and organizationId')
    }

    // Initialize system components
    const { orchestrator, eventBus } = initializeSystem()

    // Track events for progress monitoring
    const events: Array<{ timestamp: string; event: string; data: any }> = []

    // Subscribe to key events
    eventBus.on(AgentEvent.AgentStarted, (data) => {
      console.log(`🤖 Agent started: ${data.agentType} (${data.agentId})`)
      events.push({
        timestamp: new Date().toISOString(),
        event: 'agent:started',
        data,
      })
    })

    eventBus.on(AgentEvent.ProjectComplete, (data) => {
      console.log(`✅ Project completed: ${data.projectId}`)
      events.push({
        timestamp: new Date().toISOString(),
        event: 'project:complete',
        data,
      })
    })

    eventBus.on(AgentEvent.Error, (data) => {
      console.error(`❌ Error: ${data.error}`)
      events.push({
        timestamp: new Date().toISOString(),
        event: 'error',
        data,
      })
    })

    // Execute orchestration using the actual startProject method
    console.log('🎯 Starting agent orchestration...')
    const startRequest: StartProjectRequest = {
      userRequest,
      userId,
      organizationId,
      projectName,
    }

    const result = await orchestrator.startProject(startRequest)

    const duration = Date.now() - startTime
    console.log(`✅ Orchestration complete in ${duration}ms`)
    console.log(`📊 Events tracked: ${events.length}`)

    // Return success response
    return {
      status: 'success',
      output: {
        projectId: result.projectId,
        projectName: result.status.currentPhase,
        currentPhase: result.status.currentPhase,
        progress: result.status.progress,
        needsApproval: result.status.needsApproval || null,
      },
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Handler error:', error)
    console.error(`Failed after ${duration}ms`)

    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }
  }
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
