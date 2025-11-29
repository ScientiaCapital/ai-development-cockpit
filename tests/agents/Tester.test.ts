/**
 * Tester Agent Tests
 *
 * TDD RED Phase: Comprehensive tests for the Tester agent
 * Tests cover initialization, execution, prompt building for both unit and E2E tests,
 * error handling, and file generation following BaseAgent patterns.
 */

import { Tester } from '@/agents/Tester'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

// Mock fetch for cost optimizer calls
global.fetch = jest.fn()

describe('Tester', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-tester')

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()

    // Default mock response for cost optimizer - unit test scenario
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify([
          {
            path: 'tests/components/Button.test.tsx',
            content: `import { render, screen } from '@testing-library/react'\nimport { Button } from '@/components/Button'\n\ndescribe('Button', () => {\n  it('renders correctly', () => {\n    render(<Button>Click me</Button>)\n    expect(screen.getByText('Click me')).toBeInTheDocument()\n  })\n})`
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
    it('should initialize with correct agent type for unit tests', () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests for the LoginForm component',
        workspace,
        codeToTest: 'export function LoginForm() { return <form>...</form> }',
        testType: 'unit'
      })

      expect(agent.agentType).toBe('Tester')
    })

    it('should initialize with correct agent type for e2e tests', () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write E2E test for login flow',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      expect(agent.agentType).toBe('Tester')
    })

    it('should accept code to test for unit tests', () => {
      const codeToTest = `
        export function Calculator() {
          const [result, setResult] = useState(0)
          return <div>{result}</div>
        }
      `
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests for Calculator',
        workspace,
        codeToTest,
        testType: 'unit'
      })

      expect(agent.agentType).toBe('Tester')
    })

    it('should accept empty code for e2e tests (flow-based)', () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Test checkout flow',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      expect(agent.agentType).toBe('Tester')
    })
  })

  describe('execute', () => {
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
      expect(output).toHaveProperty('duration')
      expect(output).toHaveProperty('success')
      expect(Array.isArray(output.filesCreated)).toBe(true)
    })

    it('should call cost optimizer with medium complexity', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write unit tests',
        workspace,
        codeToTest: 'export function Example() { return <div /> }',
        testType: 'unit'
      })

      await agent.execute()

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.complexity).toBe('medium')
    })

    it('should track file creation via filesCreated array', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Button() {}',
        testType: 'unit'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('tests/components/Button.test.tsx')
    })

    it('should track costs via output.cost', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Button() {}',
        testType: 'unit'
      })

      const output = await agent.execute()

      expect(output.cost).toBe(0.001)
    })

    it('should track duration in milliseconds', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Button() {}',
        testType: 'unit'
      })

      const output = await agent.execute()

      expect(output.duration).toBeGreaterThanOrEqual(0)
      expect(typeof output.duration).toBe('number')
    })
  })

  describe('prompt building - unit tests', () => {
    it('should include Jest in unit test prompt', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests for LoginForm',
        workspace,
        codeToTest: 'export function LoginForm() { return <form /> }',
        testType: 'unit'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('jest')
    })

    it('should include React Testing Library in unit test prompt', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Component() { return <div /> }',
        testType: 'unit'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('testing library')
    })

    it('should include code to test in unit test prompt', async () => {
      const codeToTest = 'export function SpecialButton() { return <button>Special</button> }'
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests for SpecialButton',
        workspace,
        codeToTest,
        testType: 'unit'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt).toContain(codeToTest)
    })

    it('should include user request in prompt', async () => {
      const userRequest = 'Write comprehensive tests for user profile editing'
      const agent = new Tester({
        projectId: 'test-123',
        userRequest,
        workspace,
        codeToTest: 'export function ProfileEditor() {}',
        testType: 'unit'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt).toContain(userRequest)
    })
  })

  describe('prompt building - e2e tests', () => {
    beforeEach(() => {
      // Mock response for E2E tests
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'tests/e2e/login-flow.spec.ts',
              content: `import { test, expect } from '@playwright/test'\n\ntest('user can login', async ({ page }) => {\n  await page.goto('/login')\n  await expect(page).toHaveTitle(/Login/)\n})`
            }
          ]),
          cost: 0.002,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })
    })

    it('should include Playwright in e2e test prompt', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Test login flow',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('playwright')
    })

    it('should include user workflows in e2e test prompt', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Test checkout flow',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('workflow')
    })

    it('should include responsive design in e2e test prompt', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Test mobile checkout',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      await agent.execute()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.prompt.toLowerCase()).toContain('responsive')
    })

    it('should create E2E test files in correct directory', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Test login',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toContain('tests/e2e/login-flow.spec.ts')
    })
  })

  describe('error handling', () => {
    it('should handle fallback when JSON parse fails for unit tests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'This is not valid JSON',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Component() {}',
        testType: 'unit'
      })

      const output = await agent.execute()

      // Should create fallback unit test file
      expect(output.filesCreated).toContain('tests/components/ExampleComponent.test.tsx')
      expect(output.warnings?.length).toBeGreaterThan(0)
    })

    it('should handle fallback when JSON parse fails for e2e tests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Invalid JSON response',
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Test login flow',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      const output = await agent.execute()

      // Should create fallback E2E test file
      expect(output.filesCreated).toContain('tests/e2e/example-flow.spec.ts')
      expect(output.warnings?.length).toBeGreaterThan(0)
    })

    it('should handle cost optimizer errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Button() {}',
        testType: 'unit'
      })

      const output = await agent.execute()

      expect(output.success).toBe(false)
      expect(output.errors?.length).toBeGreaterThan(0)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Button() {}',
        testType: 'unit'
      })

      const output = await agent.execute()

      expect(output.success).toBe(false)
      expect(output.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('file generation', () => {
    it('should create multiple test files', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'tests/components/Button.test.tsx',
              content: 'describe("Button", () => {})'
            },
            {
              path: 'tests/components/Input.test.tsx',
              content: 'describe("Input", () => {})'
            }
          ]),
          cost: 0.002,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests for Button and Input',
        workspace,
        codeToTest: 'export function Button() {} export function Input() {}',
        testType: 'unit'
      })

      const output = await agent.execute()

      expect(output.filesCreated).toHaveLength(2)
      expect(output.filesCreated).toContain('tests/components/Button.test.tsx')
      expect(output.filesCreated).toContain('tests/components/Input.test.tsx')
    })

    it('should write unit test files to workspace', async () => {
      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Write tests',
        workspace,
        codeToTest: 'export function Button() {}',
        testType: 'unit'
      })

      await agent.execute()

      // Verify file was written to workspace
      const fileExists = await workspace.fileExists('tests/components/Button.test.tsx')
      expect(fileExists).toBe(true)
    })

    it('should write e2e test files to workspace', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: JSON.stringify([
            {
              path: 'tests/e2e/checkout.spec.ts',
              content: `import { test, expect } from '@playwright/test'\ntest('checkout', async ({ page }) => {})`
            }
          ]),
          cost: 0.001,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      })

      const agent = new Tester({
        projectId: 'test-123',
        userRequest: 'Test checkout',
        workspace,
        codeToTest: '',
        testType: 'e2e'
      })

      await agent.execute()

      // Verify file was written to workspace
      const fileExists = await workspace.fileExists('tests/e2e/checkout.spec.ts')
      expect(fileExists).toBe(true)
    })
  })
})
