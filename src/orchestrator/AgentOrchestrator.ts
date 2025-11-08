/**
 * Agent Orchestrator
 *
 * High-level orchestration API that manages the LangGraph workflow
 * and provides a simple interface for the frontend
 */

import { ProjectState, ProjectFeedback } from '@/types/orchestrator'
import { createOrchestratorGraph } from './graph'
import { v4 as uuidv4 } from 'uuid'

export interface StartProjectRequest {
  userRequest: string
  userId: string
  organizationId: string
  projectName?: string
}

export interface ProjectStatus {
  projectId: string
  status: 'running' | 'waiting_approval' | 'completed' | 'failed'
  currentPhase: string
  agentsActive: string[]
  progress: number // 0-100
  needsApproval?: 'architecture' | 'deployment' | 'tests' | null
  architecture?: any
  testResults?: any
  deploymentStatus?: string
  errors: string[]
}

export class AgentOrchestrator {
  private graph: any
  private activeProjects: Map<string, ProjectState>

  constructor() {
    this.graph = createOrchestratorGraph()
    this.activeProjects = new Map()

    console.log('🎯 Agent Orchestrator initialized')
  }

  /**
   * Start a new project
   */
  async startProject(request: StartProjectRequest): Promise<{
    projectId: string
    status: ProjectStatus
  }> {
    const projectId = uuidv4()

    const initialState: ProjectState = {
      projectId,
      projectName: request.projectName || `Project ${projectId.substring(0, 8)}`,
      userRequest: request.userRequest,
      userId: request.userId,
      organizationId: request.organizationId,
      createdAt: new Date().toISOString(),
      agentsSpawned: [],
      agentOutputs: {},
      errors: [],
      retryCount: 0
    }

    // Store state
    this.activeProjects.set(projectId, initialState)

    console.log(`🚀 Starting new project: ${projectId}`)
    console.log(`📝 Request: "${request.userRequest}"`)

    try {
      // Run the first node (architect)
      const result = await this.graph.invoke(initialState)

      // Update state
      this.activeProjects.set(projectId, result)

      return {
        projectId,
        status: this.getProjectStatus(projectId)
      }
    } catch (error) {
      console.error(`❌ Project ${projectId} failed:`, error)

      const state = this.activeProjects.get(projectId)!
      state.errors.push(`Orchestration error: ${error}`)
      this.activeProjects.set(projectId, state)

      return {
        projectId,
        status: this.getProjectStatus(projectId)
      }
    }
  }

  /**
   * Approve current phase and continue execution
   */
  async approveAndContinue(
    projectId: string,
    approved: boolean,
    notes?: string
  ): Promise<ProjectStatus> {
    const state = this.activeProjects.get(projectId)

    if (!state) {
      throw new Error(`Project ${projectId} not found`)
    }

    if (!state.needsApproval) {
      throw new Error(`Project ${projectId} is not waiting for approval`)
    }

    console.log(
      `${approved ? '✅' : '❌'} User ${approved ? 'approved' : 'rejected'} ${state.needsApproval} phase`
    )

    if (notes) {
      console.log(`📝 User notes: ${notes}`)
    }

    // Update state
    state.userApproved = approved

    if (!approved && notes) {
      // Store rejection notes based on phase
      if (state.needsApproval === 'architecture') {
        state.architectureRevisionNotes = notes
      }
    }

    try {
      // Continue execution
      const result = await this.graph.invoke(state)

      // Update state
      this.activeProjects.set(projectId, result)

      return this.getProjectStatus(projectId)
    } catch (error) {
      console.error(`❌ Project ${projectId} continuation failed:`, error)

      state.errors.push(`Continuation error: ${error}`)
      this.activeProjects.set(projectId, state)

      return this.getProjectStatus(projectId)
    }
  }

  /**
   * Get current status of a project
   */
  getProjectStatus(projectId: string): ProjectStatus {
    const state = this.activeProjects.get(projectId)

    if (!state) {
      throw new Error(`Project ${projectId} not found`)
    }

    // Calculate progress
    let progress = 0
    if (state.architecture) progress += 25
    if (state.agentOutputs.BackendDeveloper) progress += 25
    if (state.testResults) progress += 25
    if (state.deploymentStatus === 'deployed') progress += 25

    // Determine status
    let status: 'running' | 'waiting_approval' | 'completed' | 'failed' = 'running'

    if (state.errors.length > 0) {
      status = 'failed'
    } else if (state.needsApproval) {
      status = 'waiting_approval'
    } else if (state.deploymentStatus === 'deployed') {
      status = 'completed'
    }

    // Determine current phase
    let currentPhase = 'initializing'
    if (state.agentsSpawned.includes('CodeArchitect')) currentPhase = 'architecture'
    if (state.agentsSpawned.includes('BackendDeveloper')) currentPhase = 'development'
    if (state.agentsSpawned.includes('Tester')) currentPhase = 'testing'
    if (state.agentsSpawned.includes('DevOpsEngineer')) currentPhase = 'deployment'
    if (state.feedback) currentPhase = 'completed'

    return {
      projectId: state.projectId,
      status,
      currentPhase,
      agentsActive: state.agentsSpawned,
      progress,
      needsApproval: state.needsApproval,
      architecture: state.architecture,
      testResults: state.testResults,
      deploymentStatus: state.deploymentStatus,
      errors: state.errors
    }
  }

  /**
   * Get detailed state for a project
   */
  getProjectState(projectId: string): ProjectState | undefined {
    return this.activeProjects.get(projectId)
  }

  /**
   * List all active projects
   */
  listProjects(): ProjectStatus[] {
    return Array.from(this.activeProjects.keys()).map((projectId) =>
      this.getProjectStatus(projectId)
    )
  }

  /**
   * Cancel a project
   */
  cancelProject(projectId: string): void {
    if (!this.activeProjects.has(projectId)) {
      throw new Error(`Project ${projectId} not found`)
    }

    this.activeProjects.delete(projectId)
    console.log(`🛑 Project ${projectId} cancelled`)
  }

  /**
   * Get feedback for completed projects
   */
  getProjectFeedback(projectId: string): ProjectFeedback | undefined {
    const state = this.activeProjects.get(projectId)
    return state?.feedback
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null

/**
 * Get the singleton orchestrator instance
 */
export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator()
  }
  return orchestratorInstance
}
