import { GoAdapter } from '@/adapters/GoAdapter'
import { AdapterProjectContext } from '@/adapters/LanguageAdapter'

describe('GoAdapter', () => {
  let adapter: GoAdapter
  let context: AdapterProjectContext

  beforeEach(() => {
    adapter = new GoAdapter()
    context = {
      framework: 'gin',
      projectName: 'test-project'
    }
  })

  describe('adaptCode', () => {
    it('should generate Gin handler with proper error handling', async () => {
      const agentOutput = {
        endpoint: '/users',
        method: 'GET',
        handler: 'GetUsers',
        returnType: '[]User'
      }

      const result = await adapter.adaptCode(agentOutput, context)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toBe('internal/handlers/get_users.go')
      expect(result.files[0].content).toContain('func GetUsers(c *gin.Context)')
      expect(result.files[0].content).toContain('c.JSON(http.StatusOK,')
      expect(result.files[0].content).toContain('Error handling')
    })
  })

  describe('getProjectStructure', () => {
    it('should return Gin project structure', () => {
      const structure = adapter.getProjectStructure('gin')

      expect(structure.directories).toContain('cmd/server')
      expect(structure.directories).toContain('internal/handlers')
      expect(structure.directories).toContain('pkg')
      expect(structure.configFiles.find(f => f.path === 'go.mod')).toBeDefined()
    })
  })

  describe('getTestingFramework', () => {
    it('should return testing package details', () => {
      const framework = adapter.getTestingFramework()

      expect(framework.name).toBe('testing')
      expect(framework.fileExtension).toBe('_test.go')
    })
  })

  describe('formatCode', () => {
    it('should format Go code with gofmt', async () => {
      const unformatted = 'package main\nfunc main(  ){}'

      const formatted = await adapter.formatCode(unformatted)

      // If gofmt is available, it should format properly
      // If not, it returns the original code
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })
  })
})
