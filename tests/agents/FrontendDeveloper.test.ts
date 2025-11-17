import { FrontendDeveloper } from '@/agents/FrontendDeveloper'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

describe('FrontendDeveloper', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-frontend-dev')
  })

  afterEach(async () => {
    await workspace.cleanup()
  })

  it('should initialize with agent type', () => {
    const agent = new FrontendDeveloper({
      projectId: 'test-123',
      userRequest: 'Create a login form component',
      workspace,
      projectContext: {
        framework: 'Next.js 15',
        styling: 'Tailwind CSS',
        uiLibrary: 'shadcn/ui'
      }
    })

    expect(agent.agentType).toBe('FrontendDeveloper')
  })

  it('should execute and return agent output', async () => {
    const agent = new FrontendDeveloper({
      projectId: 'test-123',
      userRequest: 'Create a simple button component',
      workspace,
      projectContext: {
        framework: 'Next.js 15',
        styling: 'Tailwind CSS'
      }
    })

    const output = await agent.execute()

    expect(output).toHaveProperty('filesCreated')
    expect(output).toHaveProperty('cost')
    expect(Array.isArray(output.filesCreated)).toBe(true)
  })
})
