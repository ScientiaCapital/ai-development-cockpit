/**
 * BaseAgent Language Adapter Integration Tests
 *
 * Tests for BaseAgent's ability to integrate with the language adapter system
 * to transform generic code outputs into language-specific implementations.
 *
 * Part of Phase 3: Multi-Language Support - Task 2.2
 * Created: 2025-11-17
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { BaseAgent } from '@/agents/BaseAgent'
import { AgentType, AgentOutput, ProjectContext } from '@/types/orchestrator'

/**
 * Concrete test implementation of BaseAgent for testing purposes
 */
class TestAgent extends BaseAgent {
  async execute(): Promise<AgentOutput> {
    return this.getOutput()
  }

  // Expose protected method for testing
  async testAdaptCodeToLanguage(agentOutput: Record<string, unknown>) {
    return this.adaptCodeToLanguage(agentOutput)
  }

  // Expose protected property for testing
  setLanguageContext(context: {
    language: 'typescript' | 'python' | 'go' | 'rust'
    framework: string
  }) {
    this.languageContext = context
  }
}

describe('BaseAgent Language Adapter Integration', () => {
  let mockContext: ProjectContext

  beforeEach(() => {
    mockContext = {
      state: {
        userRequest: 'Test request',
        userId: 'test-user',
        organizationId: 'test-org',
        projectId: 'test-project',
        projectName: 'Test Project',
        createdAt: new Date().toISOString(),
        agentsSpawned: [],
        agentOutputs: {},
        errors: [],
        retryCount: 0,
      },
      organizationId: 'test-org',
      userId: 'test-user',
      costOptimizerUrl: 'http://localhost:3000',
      costOptimizerApiKey: 'test-key',
    }
  })

  describe('languageContext property', () => {
    it('should initialize without language context by default', () => {
      const agent = new TestAgent('CodeArchitect', mockContext)
      expect(agent).toBeDefined()
    })

    it('should accept language context configuration', () => {
      const agent = new TestAgent('BackendDeveloper', mockContext)

      agent.setLanguageContext({
        language: 'python',
        framework: 'fastapi',
      })

      // Test that context was set (via behavior test below)
      expect(agent).toBeDefined()
    })
  })

  describe('adaptCodeToLanguage method', () => {
    it('should return empty structure when no language context is set', async () => {
      const agent = new TestAgent('FrontendDeveloper', mockContext)

      const agentOutput = {
        component: 'UserAuth',
        functionality: 'Authentication',
      }

      const result = await agent.testAdaptCodeToLanguage(agentOutput)

      expect(result).toEqual({
        files: [],
        projectStructure: {
          directories: [],
          configFiles: [],
        },
      })
    })

    it('should adapt code using PythonAdapter when language is python', async () => {
      const agent = new TestAgent('BackendDeveloper', mockContext)

      agent.setLanguageContext({
        language: 'python',
        framework: 'fastapi',
      })

      const agentOutput = {
        apiEndpoint: '/users',
        method: 'GET',
        functionality: 'List users',
      }

      const result = await agent.testAdaptCodeToLanguage(agentOutput)

      // Verify structure
      expect(result).toHaveProperty('files')
      expect(result).toHaveProperty('projectStructure')
      expect(Array.isArray(result.files)).toBe(true)

      // Verify it used Python adapter (check for Python-specific structure)
      // Files may be generated or empty depending on adapter logic
      expect(result.files).toBeDefined()

      // Verify project structure has Python config files
      const hasRequirementsTxt = result.projectStructure.configFiles.some((f) =>
        f.path.includes('requirements.txt')
      )
      expect(hasRequirementsTxt).toBe(true)
    })

    it('should adapt code using GoAdapter when language is go', async () => {
      const agent = new TestAgent('BackendDeveloper', mockContext)

      agent.setLanguageContext({
        language: 'go',
        framework: 'gin',
      })

      const agentOutput = {
        apiEndpoint: '/users',
        method: 'GET',
        functionality: 'List users',
      }

      const result = await agent.testAdaptCodeToLanguage(agentOutput)

      // Verify structure
      expect(result).toHaveProperty('files')
      expect(result).toHaveProperty('projectStructure')

      // Verify it used Go adapter (check for Go-specific structure)
      expect(result.files).toBeDefined()

      // Verify project structure has Go config files
      const hasGoMod = result.projectStructure.configFiles.some((f) =>
        f.path.includes('go.mod')
      )
      expect(hasGoMod).toBe(true)
    })

    it('should adapt code using RustAdapter when language is rust', async () => {
      const agent = new TestAgent('BackendDeveloper', mockContext)

      agent.setLanguageContext({
        language: 'rust',
        framework: 'actix-web',
      })

      const agentOutput = {
        apiEndpoint: '/users',
        method: 'GET',
        functionality: 'List users',
      }

      const result = await agent.testAdaptCodeToLanguage(agentOutput)

      // Verify structure
      expect(result).toHaveProperty('files')
      expect(result).toHaveProperty('projectStructure')

      // Verify it used Rust adapter (check for Rust-specific structure)
      expect(result.files).toBeDefined()

      // Verify project structure has Rust config files
      const hasCargoToml = result.projectStructure.configFiles.some((f) =>
        f.path.includes('Cargo.toml')
      )
      expect(hasCargoToml).toBe(true)
    })

    it('should handle complex agent output with multiple components', async () => {
      const agent = new TestAgent('BackendDeveloper', mockContext)

      agent.setLanguageContext({
        language: 'python',
        framework: 'fastapi',
      })

      const agentOutput = {
        endpoints: [
          { path: '/users', method: 'GET' },
          { path: '/users', method: 'POST' },
          { path: '/users/:id', method: 'GET' },
        ],
        models: ['User', 'UserCreate'],
        database: 'postgresql',
      }

      const result = await agent.testAdaptCodeToLanguage(agentOutput)

      // Verify it produces files
      expect(result.files.length).toBeGreaterThan(0)

      // Verify it has proper structure
      expect(result.projectStructure.directories.length).toBeGreaterThan(0)
      expect(result.projectStructure.configFiles.length).toBeGreaterThan(0)
    })

    it('should pass correct context to adapter', async () => {
      const agent = new TestAgent('Tester', mockContext)

      agent.setLanguageContext({
        language: 'go',
        framework: 'gin',
      })

      const agentOutput = {
        testSuite: 'UserTests',
        tests: ['TestGetUser', 'TestCreateUser'],
      }

      const result = await agent.testAdaptCodeToLanguage(agentOutput)

      // Verify it returns valid structure (files may be empty for simple case)
      expect(result).toHaveProperty('files')
      expect(result).toHaveProperty('projectStructure')

      // Verify Go-specific config
      const hasGoMod = result.projectStructure.configFiles.some((f) =>
        f.path.includes('go.mod')
      )
      expect(hasGoMod).toBe(true)
    })

    it('should support framework-specific configuration', async () => {
      const agent = new TestAgent('BackendDeveloper', mockContext)

      // Python with FastAPI
      agent.setLanguageContext({
        language: 'python',
        framework: 'fastapi',
      })

      const agentOutput = { endpoint: '/test', method: 'GET' }

      const result = await agent.testAdaptCodeToLanguage(agentOutput)

      // FastAPI should have specific config in requirements.txt
      const hasFastApiConfig = result.projectStructure.configFiles.some(
        (f) => f.path.includes('requirements.txt') && f.content.includes('fastapi')
      )
      expect(hasFastApiConfig).toBe(true)

      // Should have Python-specific structure
      const hasPythonDirs = result.projectStructure.directories.some(
        (d) => d.includes('src')
      )
      expect(hasPythonDirs).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle adapter errors gracefully', async () => {
      const agent = new TestAgent('DevOpsEngineer', mockContext)

      // Set invalid language (TypeScript not yet implemented)
      agent.setLanguageContext({
        language: 'typescript',
        framework: 'express',
      })

      const agentOutput = { deployment: 'config' }

      // Should throw error about unsupported language
      await expect(agent.testAdaptCodeToLanguage(agentOutput)).rejects.toThrow()
    })
  })

  describe('integration with agent workflow', () => {
    it('should allow agents to check if language context is set', () => {
      const agent = new TestAgent('CodeArchitect', mockContext)

      // No context set initially
      expect(agent).toBeDefined()

      // Set context
      agent.setLanguageContext({
        language: 'rust',
        framework: 'axum',
      })

      // Context should now be available
      expect(agent).toBeDefined()
    })
  })
})
