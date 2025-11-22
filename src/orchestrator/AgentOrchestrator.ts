/**
 * Agent Orchestrator
 *
 * High-level orchestration API that manages the LangGraph workflow
 * and provides a simple interface for the frontend
 */

import { ProjectState, ProjectFeedback } from '@/types/orchestrator'
import { CodebaseReview } from '@/types/events'
import { createOrchestratorGraph } from './graph'
import { EventBus, AgentEvent } from './EventBus'
import { CostOptimizerClient as NewCostOptimizerClient } from '@/services/CostOptimizerClient'
import { CostOptimizerClient as LegacyCostOptimizerClient } from '@/services/cost-optimizer/CostOptimizerClient'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import path from 'path'

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

export interface OrchestratorConfig {
  costOptimizerClient?: NewCostOptimizerClient
}

export interface BuildStats {
  totalCost: number
  requestCount: number
}

export class AgentOrchestrator {
  private static instance: AgentOrchestrator | null = null

  private graph: any
  private activeProjects: Map<string, ProjectState>
  private eventBus: EventBus
  private legacyCostOptimizer: LegacyCostOptimizerClient
  private newCostOptimizer: NewCostOptimizerClient | null
  private buildCosts: number[]

  /**
   * Get the singleton orchestrator instance (static method)
   */
  static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator()
    }
    return AgentOrchestrator.instance
  }

  constructor(config: OrchestratorConfig = {}) {
    this.graph = createOrchestratorGraph()
    this.activeProjects = new Map()
    this.eventBus = EventBus.getInstance()
    this.buildCosts = []

    // Store optional new cost optimizer client
    this.newCostOptimizer = config.costOptimizerClient || null

    // Initialize legacy cost optimizer client for backward compatibility
    const apiUrl = process.env.COST_OPTIMIZER_API_URL || 'http://localhost:3001'
    const apiKey = process.env.COST_OPTIMIZER_API_KEY || 'dev-key'

    this.legacyCostOptimizer = new LegacyCostOptimizerClient({
      apiUrl,
      apiKey
    })

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

  /**
   * Review a codebase and analyze its structure
   * This is Task 5 implementation
   */
  async reviewCodebase(projectPath: string): Promise<CodebaseReview> {
    const projectId = uuidv4()

    // Emit ReviewStarted event
    this.eventBus.emit(AgentEvent.ReviewStarted, {
      projectId,
      repoPath: projectPath
    })

    try {
      // Scan directory structure
      const structure = await this.scanDirectory(projectPath)

      // Identify existing agents
      const agentsDir = path.join(projectPath, 'src/agents')
      const existingAgents = await this.findAgents(agentsDir)

      // Call LLM for intelligent review using cost optimizer
      const prompt = `Review this codebase structure and provide recommendations:

Structure:
${JSON.stringify(structure, null, 2)}

Existing agents: ${existingAgents.join(', ') || 'none'}

Provide a brief analysis of:
1. Current architecture and patterns
2. Existing agent capabilities
3. Code organization quality
4. Recommendations for improvements or next steps`

      let responseContent: string
      let cost: number

      // Use new CostOptimizerClient if provided, otherwise use legacy
      if (this.newCostOptimizer) {
        const response = await this.newCostOptimizer.complete(prompt, {
          task_type: 'code-generation',
          complexity: 'medium',
          max_tokens: 1000
        })
        responseContent = response.response
        cost = response.cost

        // Track costs
        this.buildCosts.push(cost)
      } else {
        const response = await this.legacyCostOptimizer.optimizeCompletion({
          prompt,
          complexity: 'medium',
          agentType: 'AgentOrchestrator',
          organizationId: 'default-org',
          maxTokens: 1000
        })
        responseContent = response.content
        cost = response.cost
      }

      // Parse the response into structured data
      const review: CodebaseReview = {
        summary: responseContent,
        architecture: structure,
        existingAgents,
        patterns: {
          hasAgents: existingAgents.length > 0,
          hasComponents: this.hasDirectory(structure, 'components'),
          hasServices: this.hasDirectory(structure, 'services'),
          hasTests: this.hasDirectory(structure, 'tests') || this.hasDirectory(structure, '__tests__')
        }
      }

      // Emit ReviewComplete event
      this.eventBus.emit(AgentEvent.ReviewComplete, {
        projectId,
        review
      })

      console.log(`✅ Codebase review completed for ${projectPath}`)
      console.log(`📊 Found ${existingAgents.length} agent(s)`)

      return review
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Emit Error event
      this.eventBus.emit(AgentEvent.Error, {
        projectId,
        error: errorMessage,
        context: { projectPath }
      })

      console.error(`❌ Codebase review failed for ${projectPath}:`, error)
      throw error
    }
  }

  /**
   * Scan directory structure recursively
   * Excludes node_modules, .git, and other common ignore patterns
   */
  private async scanDirectory(dir: string, depth: number = 0): Promise<any> {
    const maxDepth = 5 // Prevent infinite recursion
    const ignorePatterns = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage']

    if (depth > maxDepth) {
      return {}
    }

    const stats = await fs.stat(dir)
    if (!stats.isDirectory()) {
      return { file: path.basename(dir) }
    }

    const files = await fs.readdir(dir)
    const structure: any = {}

    for (const file of files) {
      // Skip ignored directories
      if (ignorePatterns.includes(file)) {
        continue
      }

      const fullPath = path.join(dir, file)

      try {
        const stat = await fs.stat(fullPath)

        if (stat.isDirectory()) {
          structure[file] = await this.scanDirectory(fullPath, depth + 1)
        } else {
          structure[file] = 'file'
        }
      } catch (error) {
        // Skip files/directories we can't access
        continue
      }
    }

    return structure
  }

  /**
   * Find agent files in the agents directory
   * Excludes BaseAgent.ts and index.ts
   */
  private async findAgents(agentsDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(agentsDir)
      const excludePatterns = ['BaseAgent.ts', 'index.ts', '.test.ts', '.spec.ts']

      return files
        .filter(f => {
          // Must be a .ts file
          if (!f.endsWith('.ts')) return false

          // Exclude certain patterns
          return !excludePatterns.some(pattern => f.includes(pattern))
        })
        .map(f => f.replace('.ts', ''))
    } catch (error) {
      // Directory doesn't exist or can't be read
      return []
    }
  }

  /**
   * Check if a directory exists in the structure
   */
  private hasDirectory(structure: any, dirName: string): boolean {
    if (typeof structure !== 'object' || structure === null) {
      return false
    }

    for (const key in structure) {
      if (key === dirName && typeof structure[key] === 'object') {
        return true
      }

      if (typeof structure[key] === 'object') {
        if (this.hasDirectory(structure[key], dirName)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Get build stats (cost and request tracking)
   */
  getBuildStats(): BuildStats {
    return {
      totalCost: this.buildCosts.reduce((sum, cost) => sum + cost, 0),
      requestCount: this.buildCosts.length
    }
  }

  /**
   * Reset build stats
   */
  resetBuildStats(): void {
    this.buildCosts = []
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
