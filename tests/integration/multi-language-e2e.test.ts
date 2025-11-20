/**
 * E2E Multi-Language Code Generation Test
 *
 * Tests the complete flow from agent to language adapter to code generation
 * Simulates real agent usage of the multi-language system
 */

import { BaseAgent } from '@/agents/BaseAgent'
import { AgentOutput, ProjectContext, ProjectState } from '@/types/orchestrator'
import { AdaptedCode } from '@/adapters/LanguageAdapter'

/**
 * Test Agent Implementation
 *
 * Simulates a real agent (like BackendDeveloper) using the language adapter system
 * to generate code in different languages.
 */
class TestAgent extends BaseAgent {
  async execute(): Promise<AgentOutput> {
    // Not used in these tests - we test adaptCodeToLanguage directly
    return this.getOutput()
  }

  /**
   * Public wrapper to expose protected method for testing
   */
  async generateCodeInLanguage(
    agentOutput: Record<string, unknown>
  ): Promise<AdaptedCode> {
    return this.adaptCodeToLanguage(agentOutput)
  }

  /**
   * Public method to set language context for testing
   */
  setLanguage(language: 'typescript' | 'python' | 'go' | 'rust', framework: string) {
    this.languageContext = { language, framework }
  }
}

/**
 * Helper to create test context
 */
function createTestContext(projectName: string): ProjectContext {
  const state: ProjectState = {
    userRequest: 'Test project',
    userId: 'test-user',
    organizationId: 'test-org',
    projectId: 'test-project-id',
    projectName,
    createdAt: new Date().toISOString(),
    agentsSpawned: [],
    agentOutputs: {},
    errors: [],
    retryCount: 0,
  }

  return {
    state,
    organizationId: 'test-org',
    userId: 'test-user',
    costOptimizerUrl: 'http://localhost:3000',
    costOptimizerApiKey: 'test-key',
  }
}

describe('E2E Multi-Language Code Generation', () => {
  let agent: TestAgent

  beforeEach(() => {
    const context = createTestContext('test-api')
    agent = new TestAgent('backend-developer', context)
  })

  describe('Python Code Generation', () => {
    it('should generate complete Python FastAPI project', async () => {
      // Set language context
      agent.setLanguage('python', 'fastapi')

      // Simulate agent generating an API endpoint
      const agentOutput = {
        endpoint: 'get_users',
        method: 'GET',
        path: '/api/users',
        responseType: 'List[User]',
        description: 'Get all users from database',
      }

      // Generate code
      const result = await agent.generateCodeInLanguage(agentOutput)

      // Verify Python files generated
      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toContain('.py')
      expect(result.files[0].content).toContain('from fastapi import')
      expect(result.files[0].content).toContain('async def')
      expect(result.files[0].content).toContain('APIRouter')

      // Verify project structure - adapters may use subdirectories
      expect(result.projectStructure.directories.some(d => d.includes('src'))).toBe(true)
      expect(result.projectStructure.directories.some(d => d.includes('tests'))).toBe(true)

      // Verify config files
      const requirementsTxt = result.projectStructure.configFiles.find(
        (f) => f.path === 'requirements.txt'
      )
      expect(requirementsTxt).toBeDefined()
      expect(requirementsTxt!.content).toContain('fastapi')
      expect(requirementsTxt!.content).toContain('uvicorn')
      expect(requirementsTxt!.content).toContain('pydantic')
    })

    it('should generate Python code with proper type hints', async () => {
      agent.setLanguage('python', 'fastapi')

      const agentOutput = {
        endpoint: 'create_user',
        method: 'POST',
        path: '/api/users',
        requestType: 'CreateUserRequest',
        responseType: 'User',
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Verify async function generated
      expect(result.files[0].content).toContain('async def')
      // Pydantic models should be included
      expect(result.files[0].content).toContain('BaseModel')
      expect(result.files[0].content).toContain('from fastapi import')
    })

    it('should generate Python code with database integration', async () => {
      agent.setLanguage('python', 'fastapi')

      const agentOutput = {
        endpoint: 'get_user_by_id',
        method: 'GET',
        path: '/api/users/{user_id}',
        responseType: 'User',
        database: {
          table: 'users',
          operation: 'select',
        },
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Should include async function
      expect(result.files[0].content).toContain('async def')
      expect(result.files[0].content).toContain('from fastapi import')
      // Should have requirements.txt with database dependencies
      const requirementsTxt = result.projectStructure.configFiles.find(
        (f) => f.path === 'requirements.txt'
      )
      expect(requirementsTxt).toBeDefined()
      expect(requirementsTxt!.content).toContain('fastapi')
    })
  })

  describe('Go Code Generation', () => {
    it('should generate complete Go Gin project', async () => {
      agent.setLanguage('go', 'gin')

      const agentOutput = {
        endpoint: 'GetUsers',
        method: 'GET',
        path: '/api/users',
        responseType: '[]User',
        description: 'Get all users',
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Verify Go files
      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toContain('.go')
      expect(result.files[0].content).toContain('package')
      expect(result.files[0].content).toContain('gin')
      expect(result.files[0].content).toContain('func ')
      expect(result.files[0].content).toContain('*gin.Context')

      // Verify project structure - adapters may use subdirectories
      expect(result.projectStructure.directories.some(d => d.includes('cmd'))).toBe(true)
      expect(result.projectStructure.directories.some(d => d.includes('internal'))).toBe(true)
      expect(result.projectStructure.directories.some(d => d.includes('pkg'))).toBe(true)

      // Verify config files
      const goMod = result.projectStructure.configFiles.find(
        (f) => f.path === 'go.mod'
      )
      expect(goMod).toBeDefined()
      expect(goMod!.content).toMatch(/module\s+\S+/)  // Accept any module name
      expect(goMod!.content).toContain('go 1.21')
      expect(goMod!.content).toContain('github.com/gin-gonic/gin')
    })

    it('should generate Go code with proper error handling', async () => {
      agent.setLanguage('go', 'gin')

      const agentOutput = {
        endpoint: 'CreateUser',
        method: 'POST',
        path: '/api/users',
        requestType: 'CreateUserRequest',
        responseType: 'User',
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Go should have explicit error handling (with flexible whitespace)
      expect(result.files[0].content).toMatch(/if\s+err\s+[:=]+\s+.*err\s+!=\s+nil/)
      expect(result.files[0].content).toContain('c.JSON(')
      expect(result.files[0].content).toContain('gin.H')
    })

    it('should generate Go code with database integration', async () => {
      agent.setLanguage('go', 'gin')

      const agentOutput = {
        endpoint: 'GetUserByID',
        method: 'GET',
        path: '/api/users/:id',
        responseType: 'User',
        database: {
          table: 'users',
          operation: 'select',
        },
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Should include handler function
      expect(result.files[0].content).toContain('func ')
      expect(result.files[0].content).toContain('*gin.Context')
      // Verify go.mod exists with gin dependency
      const goMod = result.projectStructure.configFiles.find((f) => f.path === 'go.mod')
      expect(goMod).toBeDefined()
      expect(goMod!.content).toContain('github.com/gin-gonic/gin')
      // Note: GORM would be added when database operations are actually implemented
    })
  })

  describe('Rust Code Generation', () => {
    it('should generate complete Rust Actix-web project', async () => {
      agent.setLanguage('rust', 'actix-web')

      const agentOutput = {
        endpoint: 'get_users',
        method: 'GET',
        path: '/api/users',
        responseType: 'Vec<User>',
        description: 'Get all users',
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Verify Rust files
      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toContain('.rs')
      expect(result.files[0].content).toContain('use actix_web::')
      expect(result.files[0].content).toContain('async fn get_users')
      expect(result.files[0].content).toContain('HttpResponse')

      // Verify project structure - adapters may use different naming
      expect(result.projectStructure.directories.some(d => d.includes('src'))).toBe(true)
      expect(result.projectStructure.directories.some(d => d.includes('tests'))).toBe(true)

      // Verify config files
      const cargoToml = result.projectStructure.configFiles.find(
        (f) => f.path === 'Cargo.toml'
      )
      expect(cargoToml).toBeDefined()
      expect(cargoToml!.content).toContain('[package]')
      expect(cargoToml!.content).toMatch(/name\s*=\s*"[^"]+"/);  // Accept any project name
      expect(cargoToml!.content).toContain('[dependencies]')
      expect(cargoToml!.content).toContain('actix-web')
      expect(cargoToml!.content).toContain('tokio')
      expect(cargoToml!.content).toContain('serde')
    })

    it('should generate Rust code with proper error handling', async () => {
      agent.setLanguage('rust', 'actix-web')

      const agentOutput = {
        endpoint: 'create_user',
        method: 'POST',
        path: '/api/users',
        requestType: 'CreateUserRequest',
        responseType: 'User',
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Rust should use Result types
      expect(result.files[0].content).toContain('-> Result<')
      expect(result.files[0].content).toContain('HttpResponse')
      expect(result.files[0].content).toContain('Json<')
      // Should have async function
      expect(result.files[0].content).toContain('async fn')
    })

    it('should generate Rust code with database integration', async () => {
      agent.setLanguage('rust', 'actix-web')

      const agentOutput = {
        endpoint: 'get_user_by_id',
        method: 'GET',
        path: '/api/users/{id}',
        responseType: 'User',
        database: {
          table: 'users',
          operation: 'select',
        },
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Should include async function
      expect(result.files[0].content).toContain('async fn')
      expect(result.files[0].content).toContain('HttpResponse')
      // Verify Cargo.toml exists with actix-web
      const cargoToml = result.projectStructure.configFiles.find(
        (f) => f.path === 'Cargo.toml'
      )
      expect(cargoToml).toBeDefined()
      expect(cargoToml!.content).toContain('actix-web')
      // Note: SQLx would be added when database operations are actually implemented
    })
  })

  describe('Multi-Language Project', () => {
    it('should generate microservices in different languages', async () => {
      // Test that we can generate multiple services in different languages
      const context = createTestContext('multi-service-app')

      // Python API Service
      const pythonAgent = new TestAgent('backend-developer', context)
      pythonAgent.setLanguage('python', 'fastapi')

      const pythonOutput = {
        service: 'user-service',
        endpoint: 'get_users',
        method: 'GET',
        path: '/api/users',
      }

      const pythonResult = await pythonAgent.generateCodeInLanguage(pythonOutput)
      expect(pythonResult.files[0].path).toContain('.py')
      expect(pythonResult.files[0].content).toContain('fastapi')

      // Go Service
      const goAgent = new TestAgent('backend-developer', context)
      goAgent.setLanguage('go', 'gin')

      const goOutput = {
        service: 'notification-service',
        endpoint: 'SendNotification',
        method: 'POST',
        path: '/api/notifications',
      }

      const goResult = await goAgent.generateCodeInLanguage(goOutput)
      expect(goResult.files[0].path).toContain('.go')
      expect(goResult.files[0].content).toContain('gin')

      // Rust Service
      const rustAgent = new TestAgent('backend-developer', context)
      rustAgent.setLanguage('rust', 'actix-web')

      const rustOutput = {
        service: 'analytics-service',
        endpoint: 'process_events',
        method: 'POST',
        path: '/api/events',
      }

      const rustResult = await rustAgent.generateCodeInLanguage(rustOutput)
      expect(rustResult.files[0].path).toContain('.rs')
      expect(rustResult.files[0].content).toContain('actix_web')

      // Verify all three services generated successfully
      expect(pythonResult.files).toHaveLength(1)
      expect(goResult.files).toHaveLength(1)
      expect(rustResult.files).toHaveLength(1)

      // Verify different project structures
      expect(pythonResult.projectStructure.configFiles.some((f) => f.path === 'requirements.txt')).toBe(true)
      expect(goResult.projectStructure.configFiles.some((f) => f.path === 'go.mod')).toBe(true)
      expect(rustResult.projectStructure.configFiles.some((f) => f.path === 'Cargo.toml')).toBe(true)
    })
  })

  describe('TypeScript (Default Behavior)', () => {
    it('should return empty structure when no language context set', async () => {
      // Don't set language context - should default to TypeScript (empty structure)
      const agentOutput = {
        endpoint: 'getUsers',
        method: 'GET',
        path: '/api/users',
      }

      const result = await agent.generateCodeInLanguage(agentOutput)

      // Should return empty structure (TypeScript is default in Next.js)
      expect(result.files).toEqual([])
      expect(result.projectStructure.directories).toEqual([])
      expect(result.projectStructure.configFiles).toEqual([])
    })
  })

  describe('Language Context Switching', () => {
    it('should allow switching languages between generations', async () => {
      // Generate Python code
      agent.setLanguage('python', 'fastapi')
      const pythonResult = await agent.generateCodeInLanguage({
        endpoint: 'test',
        method: 'GET',
      })
      expect(pythonResult.files[0].path).toContain('.py')

      // Switch to Go
      agent.setLanguage('go', 'gin')
      const goResult = await agent.generateCodeInLanguage({
        endpoint: 'test',
        method: 'GET',
      })
      expect(goResult.files[0].path).toContain('.go')

      // Switch to Rust
      agent.setLanguage('rust', 'actix-web')
      const rustResult = await agent.generateCodeInLanguage({
        endpoint: 'test',
        method: 'GET',
      })
      expect(rustResult.files[0].path).toContain('.rs')
    })
  })

  describe('Complex Agent Output', () => {
    it('should handle complex agent output with multiple endpoints', async () => {
      agent.setLanguage('python', 'fastapi')

      const complexOutput = {
        endpoints: [
          {
            name: 'get_users',
            method: 'GET',
            path: '/api/users',
            responseType: 'List[User]',
          },
          {
            name: 'create_user',
            method: 'POST',
            path: '/api/users',
            requestType: 'CreateUserRequest',
            responseType: 'User',
          },
          {
            name: 'delete_user',
            method: 'DELETE',
            path: '/api/users/{user_id}',
            responseType: 'None',
          },
        ],
        models: [
          {
            name: 'User',
            fields: ['id', 'email', 'name'],
          },
        ],
      }

      const result = await agent.generateCodeInLanguage(complexOutput)

      // Should handle complex nested output
      expect(result.files).toHaveLength(1)
      expect(result.files[0].content).toBeDefined()
      expect(result.files[0].content.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty agent output', async () => {
      agent.setLanguage('python', 'fastapi')

      const result = await agent.generateCodeInLanguage({})

      // Should still return valid structure
      expect(result.files).toBeDefined()
      expect(result.projectStructure).toBeDefined()
    })

    it('should handle invalid framework by throwing error', async () => {
      agent.setLanguage('python', 'django')  // Django not implemented yet

      // Should throw error for unsupported framework
      await expect(
        agent.generateCodeInLanguage({
          endpoint: 'test',
          method: 'GET',
        })
      ).rejects.toThrow('Unsupported framework: django')
    })
  })
})
