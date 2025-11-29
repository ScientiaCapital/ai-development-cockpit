/**
 * DevOpsEngineer Agent Tests
 *
 * TDD RED Phase: Comprehensive tests for the DevOpsEngineer agent
 * Tests cover initialization, execution, prompt building for different deployment targets,
 * error handling, and file generation following BaseAgent patterns.
 */

import { DevOpsEngineer } from '@/agents/DevOpsEngineer'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

// Mock fetch for cost optimizer calls
global.fetch = jest.fn()

describe('DevOpsEngineer', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-devops')

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()

    // Default mock response for cost optimizer - vercel config
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify([
          {
            path: 'vercel.json',
            content: `{\n  "buildCommand": "npm run build",\n  "devCommand": "npm run dev",\n  "framework": "nextjs"\n}`
          }
        ]),
        cost: 0.001,
        provider: 'deepseek',
        model: 'deepseek-chat'
      })
    })
  })

  afterEach(async () => {
    await workspace.cleanup()
  })

  describe('initialization', () => {
    it('should initialize with correct agent type for Vercel deployment', () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup Vercel deployment',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      expect(agent.agentType).toBe('DevOpsEngineer')
    })

    it('should initialize with correct agent type for Docker deployment', () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create Dockerfile',
        workspace,
        deploymentTarget: 'docker',
        framework: 'nextjs'
      })

      expect(agent.agentType).toBe('DevOpsEngineer')
    })

    it('should initialize with correct agent type for GitHub Actions', () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup CI/CD pipeline',
        workspace,
        deploymentTarget: 'github-actions',
        framework: 'nextjs'
      })

      expect(agent.agentType).toBe('DevOpsEngineer')
    })

    it('should initialize with correct agent type for all targets', () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup complete deployment',
        workspace,
        deploymentTarget: 'all',
        framework: 'nextjs'
      })

      expect(agent.agentType).toBe('DevOpsEngineer')
    })

    it('should accept different framework values', () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup FastAPI deployment',
        workspace,
        deploymentTarget: 'docker',
        framework: 'fastapi'
      })

      expect(agent.agentType).toBe('DevOpsEngineer')
    })
  })

  describe('execute', () => {
    it('should execute and return agent output', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup deployment configuration',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output).toHaveProperty('filesCreated')
      expect(output).toHaveProperty('cost')
      expect(output).toHaveProperty('duration')
      expect(output).toHaveProperty('success')
      expect(Array.isArray(output.filesCreated)).toBe(true)
    })

    it('should call cost optimizer with medium complexity', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup Vercel',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      await agent.execute()

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.complexity).toBe('medium')
    })

    it('should track file creation via filesCreated array', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup Vercel',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('vercel.json')
    })

    it('should track costs via output.cost', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup Vercel',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.cost).toBe(0.001)
    })

    it('should track duration in milliseconds', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup deployment',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.duration).toBeGreaterThanOrEqual(0)
      expect(typeof output.duration).toBe('number')
    })
  })

  describe('prompt building - vercel', () => {
    it('should include vercel in prompt when target is vercel', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup Vercel deployment',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('vercel')
    })

    it('should include framework in prompt', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup deployment',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('nextjs')
    })

    it('should include user request in prompt', async () => {
      const userRequest = 'Setup production Vercel deployment with preview environments'
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest,
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt).toContain(userRequest)
    })
  })

  describe('prompt building - docker', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'Dockerfile',
              content: 'FROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["npm", "start"]'
            },
            {
              path: '.dockerignore',
              content: 'node_modules\n.next\n.git'
            }
          ]),
          cost: 0.002,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })
    })

    it('should include docker in prompt when target is docker', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create Docker setup',
        workspace,
        deploymentTarget: 'docker',
        framework: 'nextjs'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('docker')
    })

    it('should create Dockerfile when target is docker', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create Docker setup',
        workspace,
        deploymentTarget: 'docker',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('Dockerfile')
    })

    it('should create .dockerignore when target is docker', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create Docker setup',
        workspace,
        deploymentTarget: 'docker',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('.dockerignore')
    })
  })

  describe('prompt building - github-actions', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: '.github/workflows/deploy.yml',
              content: `name: Deploy\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest`
            }
          ]),
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })
    })

    it('should include github actions in prompt when target is github-actions', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create CI/CD pipeline',
        workspace,
        deploymentTarget: 'github-actions',
        framework: 'nextjs'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('github actions')
    })

    it('should create workflow file in .github/workflows directory', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create CI/CD',
        workspace,
        deploymentTarget: 'github-actions',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('.github/workflows/deploy.yml')
    })
  })

  describe('prompt building - all targets', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'vercel.json',
              content: '{\n  "framework": "nextjs"\n}'
            },
            {
              path: 'Dockerfile',
              content: 'FROM node:18-alpine'
            },
            {
              path: '.dockerignore',
              content: 'node_modules'
            },
            {
              path: '.github/workflows/deploy.yml',
              content: 'name: Deploy'
            }
          ]),
          cost: 0.003,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })
    })

    it('should generate all config types when target is all', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup complete deployment',
        workspace,
        deploymentTarget: 'all',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('vercel.json')
      expect(output.filesCreated).toContain('Dockerfile')
      expect(output.filesCreated).toContain('.dockerignore')
      expect(output.filesCreated).toContain('.github/workflows/deploy.yml')
    })

    it('should include complete deployment in prompt when target is all', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup full deployment',
        workspace,
        deploymentTarget: 'all',
        framework: 'nextjs'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('complete')
    })
  })

  describe('error handling', () => {
    it('should handle fallback when JSON parse fails for vercel', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'This is not valid JSON',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup Vercel',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      // Should create fallback vercel config
      expect(output.filesCreated).toContain('vercel.json')
      expect(output.warnings?.length).toBeGreaterThan(0)
    })

    it('should handle fallback when JSON parse fails for docker', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Invalid JSON response',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create Docker setup',
        workspace,
        deploymentTarget: 'docker',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      // Should create fallback docker files
      expect(output.filesCreated).toContain('Dockerfile')
      expect(output.filesCreated).toContain('.dockerignore')
      expect(output.warnings?.length).toBeGreaterThan(0)
    })

    it('should handle fallback when JSON parse fails for github-actions', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Not JSON',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup CI/CD',
        workspace,
        deploymentTarget: 'github-actions',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      // Should create fallback workflow file
      expect(output.filesCreated).toContain('.github/workflows/deploy.yml')
      expect(output.warnings?.length).toBeGreaterThan(0)
    })

    it('should handle fallback when JSON parse fails for all', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Parse error',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup all deployment',
        workspace,
        deploymentTarget: 'all',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      // Should create all fallback configs
      expect(output.filesCreated).toContain('vercel.json')
      expect(output.filesCreated).toContain('Dockerfile')
      expect(output.filesCreated).toContain('.dockerignore')
      expect(output.filesCreated).toContain('.github/workflows/deploy.yml')
      expect(output.warnings?.length).toBeGreaterThan(0)
    })

    it('should handle cost optimizer errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup deployment',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.success).toBe(false)
      expect(output.errors?.length).toBeGreaterThan(0)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup deployment',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      const output = await agent.execute()

      expect(output.success).toBe(false)
      expect(output.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('file generation', () => {
    it('should write vercel.json to workspace', async () => {
      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup Vercel',
        workspace,
        deploymentTarget: 'vercel',
        framework: 'nextjs'
      })

      await agent.execute()

      const fileExists = await workspace.fileExists('vercel.json')
      expect(fileExists).toBe(true)
    })

    it('should write Dockerfile to workspace', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            { path: 'Dockerfile', content: 'FROM node:18' }
          ]),
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create Docker',
        workspace,
        deploymentTarget: 'docker',
        framework: 'nextjs'
      })

      await agent.execute()

      const fileExists = await workspace.fileExists('Dockerfile')
      expect(fileExists).toBe(true)
    })

    it('should write GitHub workflow to workspace', async () => {
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

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Setup CI/CD',
        workspace,
        deploymentTarget: 'github-actions',
        framework: 'nextjs'
      })

      await agent.execute()

      const fileExists = await workspace.fileExists('.github/workflows/deploy.yml')
      expect(fileExists).toBe(true)
    })

    it('should include framework in fallback Dockerfile', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Not JSON - triggers fallback',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new DevOpsEngineer({
        projectId: 'test-123',
        userRequest: 'Create Docker',
        workspace,
        deploymentTarget: 'docker',
        framework: 'fastapi'
      })

      await agent.execute()

      const content = await workspace.readFile('Dockerfile')
      expect(content).toContain('fastapi')
    })
  })
})
