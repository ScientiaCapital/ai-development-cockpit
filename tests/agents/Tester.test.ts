import { Tester } from '@/agents/Tester'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

describe('Tester', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-tester')
  })

  afterEach(async () => {
    await workspace.cleanup()
  })

  it('should initialize with agent type for unit tests', () => {
    const agent = new Tester({
      projectId: 'test-123',
      userRequest: 'Write tests for the LoginForm component',
      workspace,
      codeToTest: 'export function LoginForm() { return <form>...</form> }',
      testType: 'unit'
    })

    expect(agent.agentType).toBe('Tester')
  })

  it('should initialize with agent type for e2e tests', () => {
    const agent = new Tester({
      projectId: 'test-123',
      userRequest: 'Write E2E test for login flow',
      workspace,
      codeToTest: '',
      testType: 'e2e'
    })

    expect(agent.agentType).toBe('Tester')
  })

  it('should execute and return agent output', async () => {
    const agent = new Tester({
      projectId: 'test-123',
      userRequest: 'Write unit tests for a button component',
      workspace,
      codeToTest: 'export function Button() { return <button>Click</button> }',
      testType: 'unit'
    })

    const output = await agent.execute()

    expect(output).toHaveProperty('filesCreated')
    expect(output).toHaveProperty('cost')
    expect(Array.isArray(output.filesCreated)).toBe(true)
  })
})
