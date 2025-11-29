/**
 * FrontendDeveloper Agent Tests
 *
 * TDD RED Phase: Comprehensive tests for the FrontendDeveloper agent
 * Tests cover initialization, execution, prompt building, error handling,
 * and file generation following BaseAgent patterns.
 */

import { FrontendDeveloper } from '@/agents/FrontendDeveloper'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

// Mock fetch for cost optimizer calls
global.fetch = jest.fn()

describe('FrontendDeveloper', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-frontend-dev')

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()

    // Default mock response for cost optimizer
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify([
          {
            path: 'src/components/TodoList.tsx',
            content: `import React from 'react'\n\nexport function TodoList() {\n  return <div>Todo List</div>\n}`
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
    it('should initialize with correct agent type', () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a todo list component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      expect(agent.agentType).toBe('FrontendDeveloper')
    })

    it('should accept optional uiLibrary in project context', () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a dashboard',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind',
          uiLibrary: 'shadcn/ui'
        }
      })

      expect(agent.agentType).toBe('FrontendDeveloper')
    })

    it('should accept optional architecture context', () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a user profile page',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        },
        architecture: {
          components: ['Header', 'Footer', 'Sidebar'],
          routing: 'app-router'
        }
      })

      expect(agent.agentType).toBe('FrontendDeveloper')
    })
  })

  describe('execute', () => {
    it('should execute and return agent output', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a todo list component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      expect(output).toHaveProperty('filesCreated')
      expect(output).toHaveProperty('cost')
      expect(output).toHaveProperty('duration')
      expect(output).toHaveProperty('success')
      expect(Array.isArray(output.filesCreated)).toBe(true)
    })

    it('should call cost optimizer with medium complexity', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a dashboard component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      await agent.execute()

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.complexity).toBe('medium')
    })

    it('should track file creation via filesCreated array', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('src/components/TodoList.tsx')
    })

    it('should track costs via output.cost', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      expect(output.cost).toBe(0.001)
    })

    it('should track duration in milliseconds', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      expect(output.duration).toBeGreaterThanOrEqual(0)
      expect(typeof output.duration).toBe('number')
    })
  })

  describe('prompt building', () => {
    it('should include framework in prompt', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a form component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('nextjs')
    })

    it('should include styling in prompt', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a button component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('tailwind')
    })

    it('should include uiLibrary when provided', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a modal component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind',
          uiLibrary: 'shadcn/ui'
        }
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt).toContain('shadcn/ui')
    })

    it('should include user request in prompt', async () => {
      const userRequest = 'Build a todo list with drag and drop'
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest,
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt).toContain(userRequest)
    })
  })

  describe('error handling', () => {
    it('should handle fallback when JSON parse fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'This is not valid JSON',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      // Should create fallback file
      expect(output.filesCreated).toContain('src/components/ExampleComponent.tsx')
      expect(output.warnings?.length).toBeGreaterThan(0)
    })

    it('should handle cost optimizer errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      expect(output.success).toBe(false)
      expect(output.errors?.length).toBeGreaterThan(0)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      expect(output.success).toBe(false)
      expect(output.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('file generation', () => {
    it('should create multiple component files', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'src/components/Header.tsx',
              content: 'export function Header() { return <header>Header</header> }'
            },
            {
              path: 'src/components/Footer.tsx',
              content: 'export function Footer() { return <footer>Footer</footer> }'
            }
          ]),
          cost: 0.002,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build header and footer components',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      const output = await agent.execute()

      expect(output.filesCreated).toHaveLength(2)
      expect(output.filesCreated).toContain('src/components/Header.tsx')
      expect(output.filesCreated).toContain('src/components/Footer.tsx')
    })

    it('should write files to workspace', async () => {
      const agent = new FrontendDeveloper({
        projectId: 'test-123',
        userRequest: 'Build a todo component',
        workspace,
        projectContext: {
          framework: 'nextjs',
          styling: 'tailwind'
        }
      })

      await agent.execute()

      // Verify file was written to workspace
      const fileExists = await workspace.fileExists('src/components/TodoList.tsx')
      expect(fileExists).toBe(true)
    })
  })
})
