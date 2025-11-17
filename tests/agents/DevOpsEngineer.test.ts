import { DevOpsEngineer } from '@/agents/DevOpsEngineer'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

describe('DevOpsEngineer', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-devops')
  })

  afterEach(async () => {
    await workspace.cleanup()
  })

  it('should initialize with agent type for Vercel deployment', () => {
    const agent = new DevOpsEngineer({
      projectId: 'test-123',
      userRequest: 'Setup Vercel deployment',
      workspace,
      deploymentTarget: 'vercel',
      framework: 'Next.js 15'
    })

    expect(agent.agentType).toBe('DevOpsEngineer')
  })

  it('should initialize with agent type for Docker deployment', () => {
    const agent = new DevOpsEngineer({
      projectId: 'test-123',
      userRequest: 'Create Dockerfile',
      workspace,
      deploymentTarget: 'docker',
      framework: 'Next.js 15'
    })

    expect(agent.agentType).toBe('DevOpsEngineer')
  })

  it('should execute and return agent output', async () => {
    const agent = new DevOpsEngineer({
      projectId: 'test-123',
      userRequest: 'Setup deployment configuration',
      workspace,
      deploymentTarget: 'vercel',
      framework: 'Next.js 15'
    })

    const output = await agent.execute()

    expect(output).toHaveProperty('filesCreated')
    expect(output).toHaveProperty('cost')
    expect(Array.isArray(output.filesCreated)).toBe(true)
  })
})
