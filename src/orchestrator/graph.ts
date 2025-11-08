/**
 * LangGraph State Machine
 *
 * Orchestrates the multi-agent workflow with human-in-the-loop approval gates
 */

import { StateGraph, END } from '@langchain/langgraph'
import { ProjectState } from '@/types/orchestrator'
import { CodeArchitect } from '@/agents/CodeArchitect'

/**
 * Architecture Node - CodeArchitect designs the system
 */
async function architectNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('🏗️ Architecture phase starting...')

  const architect = new CodeArchitect({
    state,
    organizationId: state.organizationId,
    userId: state.userId,
    costOptimizerUrl: process.env.COST_OPTIMIZER_API_URL || '',
    costOptimizerApiKey: process.env.COST_OPTIMIZER_API_KEY || ''
  })

  const output = await architect.execute()

  return {
    agentOutputs: {
      ...state.agentOutputs,
      CodeArchitect: output
    },
    agentsSpawned: [...state.agentsSpawned, 'CodeArchitect'],
    needsApproval: 'architecture' // Pause for user approval
  }
}

/**
 * Build Node - Backend and Frontend developers work in parallel
 */
async function buildNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('💻 Build phase starting...')

  // TODO: Implement BackendDeveloper and FrontendDeveloper agents
  // For now, placeholder

  return {
    agentsSpawned: [...state.agentsSpawned, 'BackendDeveloper', 'FrontendDeveloper'],
    needsApproval: 'tests' // Pause for test approval
  }
}

/**
 * Test Node - Tester runs comprehensive tests
 */
async function testNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('🧪 Testing phase starting...')

  // TODO: Implement Tester agent
  // For now, placeholder

  return {
    agentsSpawned: [...state.agentsSpawned, 'Tester'],
    needsApproval: 'deployment' // Pause for deployment approval
  }
}

/**
 * Deploy Node - DevOps engineer deploys to production
 */
async function deployNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('🚀 Deployment phase starting...')

  // TODO: Implement DevOpsEngineer agent
  // For now, placeholder

  return {
    agentsSpawned: [...state.agentsSpawned, 'DevOpsEngineer'],
    deploymentStatus: 'deployed'
  }
}

/**
 * Feedback Node - Collect feedback and learn
 */
async function feedbackNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('📈 Collecting feedback...')

  // TODO: Implement feedback collection
  // For now, placeholder

  return {
    feedback: {
      projectId: state.projectId,
      userRequest: state.userRequest,
      agentsSpawned: state.agentsSpawned,
      decisions: [],
      buildTime: 0,
      testsPass: true,
      deploymentSuccess: state.deploymentStatus === 'deployed',
      patterns: {
        successful: [],
        failed: []
      },
      createdAt: new Date().toISOString()
    }
  }
}

/**
 * Conditional routing based on user approval
 */
function shouldContinue(state: ProjectState): string {
  // If needs approval and not approved yet, wait
  if (state.needsApproval && !state.userApproved) {
    return 'wait_for_approval'
  }

  // Route based on current phase
  if (!state.architecture) {
    return 'architect'
  }

  if (state.architecture && !state.testResults) {
    return 'build'
  }

  if (state.testResults && !state.deploymentConfig) {
    return 'test'
  }

  if (state.deploymentConfig && state.deploymentStatus !== 'deployed') {
    return 'deploy'
  }

  // All done, collect feedback
  return 'feedback'
}

/**
 * Create the LangGraph state machine
 */
export function createOrchestratorGraph() {
  const graph = new StateGraph<ProjectState>({
    channels: {
      userRequest: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      userId: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      organizationId: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      projectId: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      projectName: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      createdAt: {
        value: (x: string, y?: string) => y ?? x,
        default: () => new Date().toISOString()
      },
      architecture: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
      },
      architectureApproved: {
        value: (x: boolean, y?: boolean) => y ?? x,
        default: () => false
      },
      agentsSpawned: {
        value: (x: string[], y?: string[]) => y ?? x,
        default: () => []
      },
      agentOutputs: {
        value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }),
        default: () => ({})
      },
      needsApproval: {
        value: (x: any, y: any) => y ?? x,
        default: () => null
      },
      userApproved: {
        value: (x: boolean, y?: boolean) => y ?? x,
        default: () => false
      },
      errors: {
        value: (x: string[], y?: string[]) => [...x, ...(y || [])],
        default: () => []
      },
      retryCount: {
        value: (x: number, y?: number) => y ?? x,
        default: () => 0
      }
    }
  })

  // Add nodes
  graph.addNode('architect', architectNode)
  graph.addNode('build', buildNode)
  graph.addNode('test', testNode)
  graph.addNode('deploy', deployNode)
  graph.addNode('feedback', feedbackNode)

  // Add conditional edges for routing
  graph.addConditionalEdges(
    'architect',
    (state) => (state.userApproved ? 'build' : 'wait'),
    {
      build: 'build',
      wait: END // Pause until approval
    }
  )

  graph.addConditionalEdges(
    'build',
    (state) => (state.userApproved ? 'test' : 'wait'),
    {
      test: 'test',
      wait: END
    }
  )

  graph.addConditionalEdges(
    'test',
    (state) => (state.userApproved ? 'deploy' : 'wait'),
    {
      deploy: 'deploy',
      wait: END
    }
  )

  graph.addEdge('deploy', 'feedback')
  graph.addEdge('feedback', END)

  // Set entry point
  graph.setEntryPoint('architect')

  return graph.compile()
}
