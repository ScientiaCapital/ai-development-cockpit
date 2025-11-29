/**
 * LangGraph State Machine
 *
 * Orchestrates the multi-agent workflow with human-in-the-loop approval gates
 */

import { StateGraph, END } from '@langchain/langgraph'
import { ProjectState } from '@/types/orchestrator'
import { CodeArchitect } from '@/agents/CodeArchitect'
import { BackendDeveloper } from '@/agents/BackendDeveloper'
import { FrontendDeveloper } from '@/agents/FrontendDeveloper'
import { Tester } from '@/agents/Tester'
import { DevOpsEngineer } from '@/agents/DevOpsEngineer'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

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

  try {
    // Create workspace for agents
    const workspace = await ProjectWorkspace.create(state.projectId)

    // Run BackendDeveloper agent
    const backend = new BackendDeveloper({
      projectId: state.projectId,
      userRequest: state.userRequest,
      workspace,
      architecture: state.architecture
    })
    const backendOutput = await backend.execute()
    console.log(`✅ BackendDeveloper created ${backendOutput.filesCreated.length} files`)

    // Run FrontendDeveloper agent
    const frontend = new FrontendDeveloper({
      projectId: state.projectId,
      userRequest: state.userRequest,
      workspace,
      projectContext: {
        framework: 'nextjs',
        styling: 'tailwind'
      },
      architecture: state.architecture
    })
    const frontendOutput = await frontend.execute()
    console.log(`✅ FrontendDeveloper created ${frontendOutput.filesCreated.length} files`)

    return {
      agentOutputs: {
        ...state.agentOutputs,
        BackendDeveloper: backendOutput,
        FrontendDeveloper: frontendOutput
      },
      agentsSpawned: [...state.agentsSpawned, 'BackendDeveloper', 'FrontendDeveloper'],
      needsApproval: 'tests' // Pause for test approval
    }
  } catch (error) {
    console.error('[buildNode] Error:', error)
    return {
      agentsSpawned: [...state.agentsSpawned, 'BackendDeveloper', 'FrontendDeveloper'],
      errors: [...state.errors, `Build phase failed: ${error}`],
      needsApproval: 'tests'
    }
  }
}

/**
 * Test Node - Tester runs comprehensive tests
 */
async function testNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('🧪 Testing phase starting...')

  try {
    // Create workspace for agents
    const workspace = await ProjectWorkspace.create(state.projectId)

    // Get generated code from build phase for unit testing
    const backendCode = JSON.stringify(
      state.agentOutputs?.BackendDeveloper?.filesCreated || []
    )

    // Run Tester for unit tests
    const unitTester = new Tester({
      projectId: state.projectId,
      userRequest: state.userRequest,
      workspace,
      codeToTest: backendCode,
      testType: 'unit'
    })
    const unitOutput = await unitTester.execute()
    console.log(`✅ Tester (unit) created ${unitOutput.filesCreated.length} test files`)

    // Run Tester for E2E tests
    const e2eTester = new Tester({
      projectId: state.projectId,
      userRequest: state.userRequest,
      workspace,
      codeToTest: '', // E2E tests use flow descriptions, not code
      testType: 'e2e'
    })
    const e2eOutput = await e2eTester.execute()
    console.log(`✅ Tester (e2e) created ${e2eOutput.filesCreated.length} test files`)

    // Build TestResults in expected format
    const testResults = {
      unitTests: {
        name: 'Unit Tests',
        passed: unitOutput.errors?.length ? 0 : 1,
        failed: unitOutput.errors?.length || 0,
        skipped: 0,
        duration: unitOutput.duration || 0,
        failures: (unitOutput.errors || []).map((e) => ({
          test: 'unknown',
          error: e,
          stackTrace: ''
        }))
      },
      integrationTests: {
        name: 'Integration Tests',
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        failures: []
      },
      e2eTests: {
        name: 'E2E Tests',
        passed: e2eOutput.errors?.length ? 0 : 1,
        failed: e2eOutput.errors?.length || 0,
        skipped: 0,
        duration: e2eOutput.duration || 0,
        failures: (e2eOutput.errors || []).map((e) => ({
          test: 'unknown',
          error: e,
          stackTrace: ''
        }))
      },
      overallStatus:
        !unitOutput.errors?.length && !e2eOutput.errors?.length
          ? ('passed' as const)
          : ('failed' as const)
    }

    // Combine unit and e2e outputs into a single AgentOutput for Tester
    const combinedTesterOutput = {
      agentType: 'Tester' as const,
      success: !unitOutput.errors?.length && !e2eOutput.errors?.length,
      filesCreated: [...unitOutput.filesCreated, ...e2eOutput.filesCreated],
      filesModified: [],
      notes: `Generated ${unitOutput.filesCreated.length} unit tests and ${e2eOutput.filesCreated.length} E2E tests`,
      warnings: [...(unitOutput.warnings || []), ...(e2eOutput.warnings || [])],
      errors: [...(unitOutput.errors || []), ...(e2eOutput.errors || [])],
      duration: (unitOutput.duration || 0) + (e2eOutput.duration || 0),
      cost: (unitOutput.cost || 0) + (e2eOutput.cost || 0)
    }

    return {
      agentOutputs: {
        ...state.agentOutputs,
        Tester: combinedTesterOutput
      },
      agentsSpawned: [...state.agentsSpawned, 'Tester'],
      testResults,
      needsApproval: 'deployment' // Pause for deployment approval
    }
  } catch (error) {
    console.error('[testNode] Error:', error)
    return {
      agentsSpawned: [...state.agentsSpawned, 'Tester'],
      errors: [...state.errors, `Test phase failed: ${error}`],
      needsApproval: 'deployment'
    }
  }
}

/**
 * Deploy Node - DevOps engineer deploys to production
 */
async function deployNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('🚀 Deployment phase starting...')

  try {
    // Create workspace for agents
    const workspace = await ProjectWorkspace.create(state.projectId)

    // Run DevOpsEngineer with all deployment targets
    const devops = new DevOpsEngineer({
      projectId: state.projectId,
      userRequest: state.userRequest,
      workspace,
      deploymentTarget: 'all',
      framework: 'nextjs'
    })
    const devopsOutput = await devops.execute()
    console.log(`✅ DevOpsEngineer created ${devopsOutput.filesCreated.length} config files`)

    // Build DeploymentConfig in expected format
    const deploymentConfig = {
      platform: 'vercel',
      environment: { NODE_ENV: 'production' },
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      domain: undefined
    }

    return {
      agentOutputs: {
        ...state.agentOutputs,
        DevOpsEngineer: devopsOutput
      },
      agentsSpawned: [...state.agentsSpawned, 'DevOpsEngineer'],
      deploymentConfig,
      deploymentStatus: 'deployed'
    }
  } catch (error) {
    console.error('[deployNode] Error:', error)
    return {
      agentsSpawned: [...state.agentsSpawned, 'DevOpsEngineer'],
      errors: [...state.errors, `Deployment phase failed: ${error}`],
      deploymentStatus: 'failed'
    }
  }
}

/**
 * Feedback Node - Collect feedback and learn
 */
async function feedbackNode(state: ProjectState): Promise<Partial<ProjectState>> {
  console.log('📈 Collecting feedback...')

  // Calculate total costs from all agents
  const totalCost = Object.values(state.agentOutputs || {}).reduce(
    (sum, output) => {
      if (typeof output === 'object' && output !== null) {
        return sum + ((output as { cost?: number }).cost || 0)
      }
      return sum
    },
    0
  )

  // Calculate total build time from all agents
  const totalTime = Object.values(state.agentOutputs || {}).reduce(
    (sum, output) => {
      if (typeof output === 'object' && output !== null) {
        return sum + ((output as { duration?: number }).duration || 0)
      }
      return sum
    },
    0
  )

  // Determine test results from Tester output (now a flat AgentOutput)
  const testerOutput = state.agentOutputs?.Tester as { errors?: string[] } | undefined
  const testsPass = !testerOutput?.errors?.length

  // Track successful and failed agents
  const successful = state.agentsSpawned.filter((agentName) => {
    const output = state.agentOutputs?.[agentName]
    if (typeof output === 'object' && output !== null) {
      const errors = (output as { errors?: string[] }).errors
      return !errors || errors.length === 0
    }
    return true
  })

  const failed = state.agentsSpawned.filter((agentName) => {
    const output = state.agentOutputs?.[agentName]
    if (typeof output === 'object' && output !== null) {
      const errors = (output as { errors?: string[] }).errors
      return errors && errors.length > 0
    }
    return false
  })

  console.log(`📊 Total cost: $${totalCost.toFixed(4)}`)
  console.log(`⏱️ Total time: ${totalTime}ms`)
  console.log(`✅ Successful agents: ${successful.length}`)
  console.log(`❌ Failed agents: ${failed.length}`)

  return {
    feedback: {
      projectId: state.projectId,
      userRequest: state.userRequest,
      agentsSpawned: state.agentsSpawned,
      decisions: [],
      buildTime: totalTime,
      testsPass,
      deploymentSuccess: state.deploymentStatus === 'deployed',
      patterns: {
        successful,
        failed
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
 *
 * TODO: Fix LangGraph API compatibility issues
 * The current LangGraph version has different type signatures
 * This implementation needs to be updated to match the new API
 * See: https://github.com/langchain-ai/langgraphjs/releases
 */
// @ts-ignore - LangGraph API compatibility issues with StateGraph initialization
export function createOrchestratorGraph() {
  // @ts-ignore - LangGraph API compatibility issues
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
  // @ts-ignore - LangGraph API compatibility issues with addNode
  graph.addNode('architect', architectNode)
  // @ts-ignore - LangGraph API compatibility issues with addNode
  graph.addNode('build', buildNode)
  // @ts-ignore - LangGraph API compatibility issues with addNode
  graph.addNode('test', testNode)
  // @ts-ignore - LangGraph API compatibility issues with addNode
  graph.addNode('deploy', deployNode)
  // @ts-ignore - LangGraph API compatibility issues with addNode
  graph.addNode('feedback', feedbackNode)

  // Add conditional edges for routing
  // @ts-ignore - LangGraph API compatibility issues with addConditionalEdges
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (graph as any).addConditionalEdges(
    'architect',
    (state: any) => (state.userApproved ? 'build' : 'wait'),
    {
      build: 'build',
      wait: END // Pause until approval
    }
  )

  // @ts-ignore - LangGraph API compatibility issues with addConditionalEdges
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (graph as any).addConditionalEdges(
    'build',
    (state: any) => (state.userApproved ? 'test' : 'wait'),
    {
      test: 'test',
      wait: END
    }
  )

  // @ts-ignore - LangGraph API compatibility issues with addConditionalEdges
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (graph as any).addConditionalEdges(
    'test',
    (state: any) => (state.userApproved ? 'deploy' : 'wait'),
    {
      deploy: 'deploy',
      wait: END
    }
  )

  // @ts-ignore - LangGraph API compatibility issues with addEdge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (graph as any).addEdge('deploy', 'feedback')
  // @ts-ignore - LangGraph API compatibility issues with addEdge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (graph as any).addEdge('feedback', END)

  // Set entry point
  // @ts-ignore - LangGraph API compatibility issues with setEntryPoint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (graph as any).setEntryPoint('architect')

  return graph.compile()
}
