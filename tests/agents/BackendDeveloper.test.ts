import { BackendDeveloper } from '@/agents/BackendDeveloper'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

describe('BackendDeveloper', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-backend-dev')
  })

  afterEach(async () => {
    await workspace.cleanup()
  })

  it('should initialize with agent type', () => {
    const agent = new BackendDeveloper({
      projectId: 'test-123',
      userRequest: 'Build API for todo items',
      workspace,
    })

    expect(agent.agentType).toBe('BackendDeveloper')
  })

  it('should execute and return agent output', async () => {
    const agent = new BackendDeveloper({
      projectId: 'test-123',
      userRequest: 'Build simple API endpoint',
      workspace,
    })

    const output = await agent.execute()

    expect(output).toHaveProperty('filesCreated')
    expect(output).toHaveProperty('cost')
    expect(Array.isArray(output.filesCreated)).toBe(true)
  })
})
