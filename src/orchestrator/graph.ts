/**
 * LangGraph State Machine
 *
 * Orchestrates the multi-agent workflow with human-in-the-loop approval gates
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph'
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
 * State Annotation for LangGraph
 * Defines the structure and behavior of data flowing through the graph
 */
const ProjectStateAnnotation = Annotation.Root({
  // User input
  userRequest: Annotation<string>({
    reducer: (x, y?) => y ?? x,
    default: () => ''
  }),
  userId: Annotation<string>({
    reducer: (x, y?) => y ?? x,
    default: () => ''
  }),
  organizationId: Annotation<string>({
    reducer: (x, y?) => y ?? x,
    default: () => ''
  }),

  // Project metadata
  projectId: Annotation<string>({
    reducer: (x, y?) => y ?? x,
    default: () => ''
  }),
  projectName: Annotation<string>({
    reducer: (x, y?) => y ?? x,
    default: () => ''
  }),
  createdAt: Annotation<string>({
    reducer: (x, y?) => y ?? x,
    default: () => new Date().toISOString()
  }),

  // Architecture phase
  architecture: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined
  }),
  architectureApproved: Annotation<boolean>({
    reducer: (x, y?) => y ?? x,
    default: () => false
  }),
  architectureRevisionNotes: Annotation<string | undefined>({
    reducer: (x, y?) => y ?? x,
    default: () => undefined
  }),

  // Development phase
  agentsSpawned: Annotation<string[]>({
    reducer: (x, y?) => y ?? x,
    default: () => []
  }),
  agentOutputs: Annotation<Record<string, any>>({
    reducer: (x, y?) => ({ ...x, ...y }),
    default: () => ({})
  }),

  // Testing phase
  testResults: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined
  }),
  testsApproved: Annotation<boolean>({
    reducer: (x, y?) => y ?? x,
    default: () => false
  }),

  // Deployment phase
  deploymentConfig: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined
  }),
  deploymentApproved: Annotation<boolean>({
    reducer: (x, y?) => y ?? x,
    default: () => false
  }),
  deploymentStatus: Annotation<string | undefined>({
    reducer: (x, y?) => y ?? x,
    default: () => undefined
  }),

  // Feedback & learning
  feedback: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined
  }),

  // Human-in-the-loop gates
  needsApproval: Annotation<'architecture' | 'deployment' | 'tests' | null>({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  userApproved: Annotation<boolean>({
    reducer: (x, y?) => y ?? x,
    default: () => false
  }),

  // Error handling
  errors: Annotation<string[]>({
    reducer: (x, y?) => [...x, ...(y || [])],
    default: () => []
  }),
  retryCount: Annotation<number>({
    reducer: (x, y?) => y ?? x,
    default: () => 0
  })
})

/**
 * Create the LangGraph state machine
 */
export function createOrchestratorGraph() {
  // @ts-ignore - Type inference issues with Annotation.Root in LangGraph 0.2.x
  const graph: any = new StateGraph(ProjectStateAnnotation)

  // Add nodes
  graph.addNode('architect', architectNode)
  graph.addNode('build', buildNode)
  graph.addNode('test', testNode)
  graph.addNode('deploy', deployNode)
  graph.addNode('feedback', feedbackNode)

  // Add conditional edges for routing
  graph.addConditionalEdges(
    'architect',
    (state: any) => (state.userApproved ? 'build' : 'wait'),
    {
      build: 'build',
      wait: END // Pause until approval
    }
  )

  graph.addConditionalEdges(
    'build',
    (state: any) => (state.userApproved ? 'test' : 'wait'),
    {
      test: 'test',
      wait: END
    }
  )

  graph.addConditionalEdges(
    'test',
    (state: any) => (state.userApproved ? 'deploy' : 'wait'),
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
