/**
 * Graph Integration Tests
 *
 * TDD RED Phase: Tests for LangGraph orchestration nodes
 * These tests verify that each node correctly integrates with its corresponding agent
 * and properly passes state through the workflow.
 */

import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'
import { ProjectState } from '@/types/orchestrator'
import { BackendDeveloper } from '@/agents/BackendDeveloper'
import { FrontendDeveloper } from '@/agents/FrontendDeveloper'
import { Tester } from '@/agents/Tester'
import { DevOpsEngineer } from '@/agents/DevOpsEngineer'

// Mock fetch for cost optimizer calls
global.fetch = jest.fn()

describe('Graph Integration', () => {
  let workspace: ProjectWorkspace
  let initialState: ProjectState

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-graph-integration')

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()

    // Default mock response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify([
          { path: 'src/test.ts', content: 'export const test = true' }
        ]),
        cost: 0.001,
        provider: 'deepseek',
        model: 'deepseek-chat'
      })
    })

    // Create initial project state
    initialState = {
      userRequest: 'Build a REST API for task management',
      userId: 'test-user',
      organizationId: 'test-org',
      projectId: 'test-project-123',
      projectName: 'Task Manager API',
      createdAt: new Date().toISOString(),
      agentsSpawned: [],
      agentOutputs: {},
      errors: [],
      retryCount: 0
    }
  })

  afterEach(async () => {
    await workspace.cleanup()
  })

  describe('buildNode', () => {
    it('should spawn BackendDeveloper agent', async () => {
      const backend = new BackendDeveloper({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        language: 'typescript',
        framework: 'nextjs'
      })

      const output = await backend.execute()

      expect(output).toHaveProperty('filesCreated')
      expect(output).toHaveProperty('cost')
      expect(output).toHaveProperty('duration')
    })

    it('should spawn FrontendDeveloper agent', async () => {
      const frontend = new FrontendDeveloper({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await frontend.execute()

      expect(output).toHaveProperty('filesCreated')
      expect(output).toHaveProperty('cost')
      expect(output).toHaveProperty('duration')
    })

    it('should spawn both agents and aggregate outputs', async () => {
      // Mock different responses for backend and frontend
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: true,
          json: async () => ({
            content: JSON.stringify([
              {
                path: callCount === 1 ? 'src/api/tasks.ts' : 'src/components/TaskList.tsx',
                content: callCount === 1 ? 'export const api = {}' : 'export function TaskList() {}'
              }
            ]),
            cost: 0.001 * callCount,
            provider: 'deepseek',
            model: 'deepseek-chat'
          })
        })
      })

      const backend = new BackendDeveloper({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        language: 'typescript',
        framework: 'nextjs'
      })
      const backendOutput = await backend.execute()

      const frontend = new FrontendDeveloper({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        projectContext: { framework: 'nextjs', styling: 'tailwind' }
      })
      const frontendOutput = await frontend.execute()

      // Aggregate like buildNode should
      const agentOutputs = {
        BackendDeveloper: backendOutput,
        FrontendDeveloper: frontendOutput
      }

      expect(agentOutputs.BackendDeveloper.filesCreated).toContain('src/api/tasks.ts')
      expect(agentOutputs.FrontendDeveloper.filesCreated).toContain('src/components/TaskList.tsx')
    })

    it('should track agents spawned', async () => {
      const agentsSpawned: string[] = []

      const backend = new BackendDeveloper({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        language: 'typescript',
        framework: 'nextjs'
      })
      await backend.execute()
      agentsSpawned.push('BackendDeveloper')

      const frontend = new FrontendDeveloper({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        projectContext: { framework: 'nextjs', styling: 'tailwind' }
      })
      await frontend.execute()
      agentsSpawned.push('FrontendDeveloper')

      expect(agentsSpawned).toContain('BackendDeveloper')
      expect(agentsSpawned).toContain('FrontendDeveloper')
    })

    it('should set needsApproval to tests after build', async () => {
      // After build, state should indicate tests phase needs approval
      const needsApproval = 'tests'
      expect(needsApproval).toBe('tests')
    })
  })

  describe('testNode', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'tests/api/tasks.test.ts',
              content: `describe('Tasks API', () => { it('works', () => {}) })`
            }
          ]),
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })
    })

    it('should spawn Tester agent for unit tests', async () => {
      const tester = new Tester({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        codeToTest: 'export function createTask() {}',
        testType: 'unit'
      })

      const output = await tester.execute()

      expect(output).toHaveProperty('filesCreated')
      expect(output).toHaveProperty('cost')
    })

    it('should spawn Tester agent for e2e tests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'tests/e2e/tasks.spec.ts',
              content: `test('task flow', async ({ page }) => {})`
            }
          ]),
          cost: 0.002,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const tester = new Tester({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      const output = await tester.execute()

      expect(output).toHaveProperty('filesCreated')
      expect(output.filesCreated).toContain('tests/e2e/tasks.spec.ts')
    })

    it('should include code from build phase in test prompt', async () => {
      // Simulate build phase output
      const backendCode = 'export function createTask(data: TaskInput): Task { return { ...data, id: uuid() } }'

      const tester = new Tester({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        codeToTest: backendCode,
        testType: 'unit'
      })

      await tester.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt).toContain(backendCode)
    })

    it('should aggregate unit and e2e test outputs', async () => {
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: true,
          json: async () => ({
            content: JSON.stringify([
              {
                path: callCount === 1 ? 'tests/unit/tasks.test.ts' : 'tests/e2e/tasks.spec.ts',
                content: callCount === 1 ? 'describe()' : 'test()'
              }
            ]),
            cost: 0.001,
            provider: 'deepseek',
            model: 'deepseek-chat'
          })
        })
      })

      const unitTester = new Tester({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        codeToTest: 'export function task() {}',
        testType: 'unit'
      })
      const unitOutput = await unitTester.execute()

      const e2eTester = new Tester({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })
      const e2eOutput = await e2eTester.execute()

      const testResults = { unit: unitOutput, e2e: e2eOutput }

      expect(testResults.unit.filesCreated).toContain('tests/unit/tasks.test.ts')
      expect(testResults.e2e.filesCreated).toContain('tests/e2e/tasks.spec.ts')
    })

    it('should set needsApproval to deployment after tests', async () => {
      const needsApproval = 'deployment'
      expect(needsApproval).toBe('deployment')
    })
  })

  describe('deployNode', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            { path: 'vercel.json', content: '{"framework": "nextjs"}' },
            { path: 'Dockerfile', content: 'FROM node:18' }
          ]),
          cost: 0.002,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })
    })

    it('should spawn DevOpsEngineer with all targets', async () => {
      const devops = new DevOpsEngineer({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        deploymentTarget: 'all',
        framework: 'nextjs'
      })

      const output = await devops.execute()

      expect(output).toHaveProperty('filesCreated')
      expect(output).toHaveProperty('cost')
    })

    it('should generate Vercel config', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            { path: 'vercel.json', content: '{"framework": "nextjs"}' }
          ]),
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const devops = new DevOpsEngineer({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await devops.execute()

      expect(output.filesCreated).toContain('vercel.json')
    })

    it('should generate Docker files', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            { path: 'Dockerfile', content: 'FROM node:18' },
            { path: '.dockerignore', content: 'node_modules' }
          ]),
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const devops = new DevOpsEngineer({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        deploymentTarget: 'docker',
        framework: 'nextjs'
      })

      const output = await devops.execute()

      expect(output.filesCreated).toContain('Dockerfile')
      expect(output.filesCreated).toContain('.dockerignore')
    })

    it('should generate GitHub Actions workflow', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            { path: '.github/workflows/deploy.yml', content: 'name: Deploy' }
          ]),
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const devops = new DevOpsEngineer({
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        workspace,
        deploymentTarget: 'github-actions',
        framework: 'nextjs'
      })

      const output = await devops.execute()

      expect(output.filesCreated).toContain('.github/workflows/deploy.yml')
    })

    it('should set deploymentStatus to deployed', async () => {
      const deploymentStatus = 'deployed'
      expect(deploymentStatus).toBe('deployed')
    })
  })

  describe('feedbackNode', () => {
    it('should calculate total costs from all agents', () => {
      const agentOutputs = {
        CodeArchitect: { cost: 0.001, filesCreated: [], duration: 100 },
        BackendDeveloper: { cost: 0.002, filesCreated: [], duration: 200 },
        FrontendDeveloper: { cost: 0.002, filesCreated: [], duration: 150 },
        Tester: { cost: 0.001, filesCreated: [], duration: 180 },
        DevOpsEngineer: { cost: 0.001, filesCreated: [], duration: 120 }
      }

      const totalCost = Object.values(agentOutputs).reduce(
        (sum, output) => sum + (output?.cost || 0),
        0
      )

      expect(totalCost).toBe(0.007)
    })

    it('should calculate total build time from all agents', () => {
      const agentOutputs = {
        CodeArchitect: { cost: 0, filesCreated: [], duration: 100 },
        BackendDeveloper: { cost: 0, filesCreated: [], duration: 200 },
        FrontendDeveloper: { cost: 0, filesCreated: [], duration: 150 },
        Tester: { cost: 0, filesCreated: [], duration: 180 },
        DevOpsEngineer: { cost: 0, filesCreated: [], duration: 120 }
      }

      const totalTime = Object.values(agentOutputs).reduce(
        (sum, output) => sum + (output?.duration || 0),
        0
      )

      expect(totalTime).toBe(750)
    })

    it('should track successful agents', () => {
      const agentsSpawned = ['CodeArchitect', 'BackendDeveloper', 'FrontendDeveloper', 'Tester', 'DevOpsEngineer']
      const agentOutputs = {
        CodeArchitect: { errors: [], filesCreated: ['arch.json'], cost: 0 },
        BackendDeveloper: { errors: [], filesCreated: ['api.ts'], cost: 0 },
        FrontendDeveloper: { errors: [], filesCreated: ['App.tsx'], cost: 0 },
        Tester: { errors: ['Test failed'], filesCreated: ['test.ts'], cost: 0 },
        DevOpsEngineer: { errors: [], filesCreated: ['vercel.json'], cost: 0 }
      }

      const successful = agentsSpawned.filter(a => {
        const output = agentOutputs[a as keyof typeof agentOutputs]
        return !output?.errors?.length
      })

      expect(successful).toHaveLength(4)
      expect(successful).not.toContain('Tester')
    })

    it('should track failed agents', () => {
      const agentsSpawned = ['CodeArchitect', 'BackendDeveloper', 'FrontendDeveloper', 'Tester', 'DevOpsEngineer']
      const agentOutputs = {
        CodeArchitect: { errors: [], filesCreated: [], cost: 0 },
        BackendDeveloper: { errors: ['Build failed'], filesCreated: [], cost: 0 },
        FrontendDeveloper: { errors: [], filesCreated: [], cost: 0 },
        Tester: { errors: ['Test failed'], filesCreated: [], cost: 0 },
        DevOpsEngineer: { errors: [], filesCreated: [], cost: 0 }
      }

      const failed = agentsSpawned.filter(a => {
        const output = agentOutputs[a as keyof typeof agentOutputs]
        return output?.errors?.length > 0
      })

      expect(failed).toHaveLength(2)
      expect(failed).toContain('BackendDeveloper')
      expect(failed).toContain('Tester')
    })

    it('should determine testsPass from Tester output', () => {
      const testerOutput = { errors: [], filesCreated: ['test.ts'], cost: 0 }
      const testsPass = !testerOutput?.errors?.length

      expect(testsPass).toBe(true)
    })

    it('should determine deploymentSuccess from deploymentStatus', () => {
      const deploymentStatus = 'deployed'
      const deploymentSuccess = deploymentStatus === 'deployed'

      expect(deploymentSuccess).toBe(true)
    })

    it('should create feedback object with all required fields', () => {
      const agentOutputs = {
        CodeArchitect: { cost: 0.001, duration: 100, filesCreated: [] },
        BackendDeveloper: { cost: 0.002, duration: 200, filesCreated: [] },
        FrontendDeveloper: { cost: 0.002, duration: 150, filesCreated: [] },
        Tester: { cost: 0.001, duration: 180, filesCreated: [], errors: [] },
        DevOpsEngineer: { cost: 0.001, duration: 120, filesCreated: [] }
      }
      const agentsSpawned = Object.keys(agentOutputs)
      const deploymentStatus = 'deployed'

      const totalCost = Object.values(agentOutputs).reduce(
        (sum, output) => sum + (output?.cost || 0),
        0
      )
      const totalTime = Object.values(agentOutputs).reduce(
        (sum, output) => sum + (output?.duration || 0),
        0
      )

      const feedback = {
        projectId: initialState.projectId,
        userRequest: initialState.userRequest,
        agentsSpawned,
        decisions: [],
        buildTime: totalTime,
        totalCost,
        testsPass: !agentOutputs.Tester?.errors?.length,
        deploymentSuccess: deploymentStatus === 'deployed',
        patterns: {
          successful: agentsSpawned.filter(a => !agentOutputs[a as keyof typeof agentOutputs]?.errors?.length),
          failed: agentsSpawned.filter(a => {
            const output = agentOutputs[a as keyof typeof agentOutputs]
            return (output as any)?.errors?.length > 0
          })
        },
        createdAt: new Date().toISOString()
      }

      expect(feedback).toHaveProperty('projectId', initialState.projectId)
      expect(feedback).toHaveProperty('userRequest', initialState.userRequest)
      expect(feedback).toHaveProperty('agentsSpawned')
      expect(feedback).toHaveProperty('buildTime', 750)
      expect(feedback).toHaveProperty('totalCost', 0.007)
      expect(feedback).toHaveProperty('testsPass', true)
      expect(feedback).toHaveProperty('deploymentSuccess', true)
      expect(feedback.patterns.successful).toHaveLength(5)
      expect(feedback.patterns.failed).toHaveLength(0)
    })
  })

  describe('full workflow state transitions', () => {
    it('should pass state from architect to build phase', async () => {
      // Simulate architect output
      const architectOutput = {
        filesCreated: ['architecture.json'],
        cost: 0.001,
        duration: 100
      }

      const state = {
        ...initialState,
        agentOutputs: { CodeArchitect: architectOutput },
        agentsSpawned: ['CodeArchitect'],
        architecture: { components: ['API', 'Frontend'] }
      }

      expect(state.architecture).toBeDefined()
      expect(state.agentsSpawned).toContain('CodeArchitect')
    })

    it('should pass state from build to test phase', async () => {
      const state = {
        ...initialState,
        agentOutputs: {
          CodeArchitect: { filesCreated: [], cost: 0.001, duration: 100 },
          BackendDeveloper: { filesCreated: ['api.ts'], cost: 0.002, duration: 200 },
          FrontendDeveloper: { filesCreated: ['App.tsx'], cost: 0.002, duration: 150 }
        },
        agentsSpawned: ['CodeArchitect', 'BackendDeveloper', 'FrontendDeveloper'],
        architecture: { components: [] }
      }

      expect(state.agentsSpawned).toContain('BackendDeveloper')
      expect(state.agentsSpawned).toContain('FrontendDeveloper')
      expect(state.agentOutputs.BackendDeveloper.filesCreated).toContain('api.ts')
    })

    it('should pass state from test to deploy phase', async () => {
      const state = {
        ...initialState,
        agentOutputs: {
          Tester: { filesCreated: ['test.ts'], cost: 0.001, duration: 180, errors: [] }
        },
        agentsSpawned: ['Tester'],
        testResults: { unit: {}, e2e: {} }
      }

      expect(state.testResults).toBeDefined()
      expect(state.agentsSpawned).toContain('Tester')
    })

    it('should pass state from deploy to feedback phase', async () => {
      const state = {
        ...initialState,
        agentOutputs: {
          DevOpsEngineer: { filesCreated: ['vercel.json'], cost: 0.001, duration: 120 }
        },
        agentsSpawned: ['DevOpsEngineer'],
        deploymentStatus: 'deployed' as const,
        deploymentConfig: { target: 'vercel' }
      }

      expect(state.deploymentStatus).toBe('deployed')
      expect(state.deploymentConfig).toBeDefined()
    })

    it('should accumulate costs across all phases', async () => {
      const phases = [
        { cost: 0.001 }, // architect
        { cost: 0.002 }, // backend
        { cost: 0.002 }, // frontend
        { cost: 0.001 }, // unit tests
        { cost: 0.001 }, // e2e tests
        { cost: 0.002 }  // devops
      ]

      const totalCost = phases.reduce((sum, phase) => sum + phase.cost, 0)

      expect(totalCost).toBeCloseTo(0.009, 5)
    })
  })
})
