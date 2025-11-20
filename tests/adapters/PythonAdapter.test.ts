import { PythonAdapter } from '@/adapters/PythonAdapter'
import { AdapterProjectContext } from '@/adapters/LanguageAdapter'

describe('PythonAdapter', () => {
  let adapter: PythonAdapter
  let context: AdapterProjectContext

  beforeEach(() => {
    adapter = new PythonAdapter()
    context = {
      language: 'python',
      framework: 'fastapi',
      targetDirectory: '/tmp/test-project'
    }
  })

  describe('adaptCode', () => {
    it('should generate FastAPI endpoint with type hints', async () => {
      const agentOutput = {
        endpoint: '/users',
        method: 'GET',
        handler: 'get_users',
        returnType: 'list[User]'
      }

      const result = await adapter.adaptCode(agentOutput, context)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toBe('src/routes/users.py')
      expect(result.files[0].content).toContain('from typing import List')
      expect(result.files[0].content).toContain('@router.get("/users")')
      expect(result.files[0].content).toContain('async def get_users() -> List[User]:')
    })

    it('should include error handling', async () => {
      const agentOutput = {
        endpoint: '/users/{id}',
        method: 'GET',
        handler: 'get_user_by_id'
      }

      const result = await adapter.adaptCode(agentOutput, context)

      expect(result.files[0].content).toContain('try:')
      expect(result.files[0].content).toContain('except')
      expect(result.files[0].content).toContain('HTTPException')
    })
  })

  describe('getProjectStructure', () => {
    it('should return FastAPI project structure', () => {
      const structure = adapter.getProjectStructure('fastapi')

      expect(structure.directories).toContain('src')
      expect(structure.directories).toContain('tests')
      expect(structure.configFiles.find(f => f.path === 'requirements.txt')).toBeDefined()
      expect(structure.configFiles.find(f => f.path === 'pyproject.toml')).toBeDefined()
    })
  })

  describe('getTestingFramework', () => {
    it('should return pytest framework details', () => {
      const framework = adapter.getTestingFramework()

      expect(framework.name).toBe('pytest')
      expect(framework.fileExtension).toBe('.py')
      expect(framework.importPattern).toContain('import pytest')
    })
  })

  describe('formatCode', () => {
    it('should format Python code with black', async () => {
      const unformatted = 'def foo(  x,y  ):\n  return x+y'

      const formatted = await adapter.formatCode(unformatted)

      expect(formatted).toContain('def foo(x, y):')
      expect(formatted).toContain('    return x + y')
    })
  })
})
