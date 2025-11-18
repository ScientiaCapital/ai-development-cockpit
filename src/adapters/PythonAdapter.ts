import { LanguageAdapter, AdapterProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'

const execAsync = promisify(exec)

/**
 * Python language adapter for FastAPI framework
 * Converts agent output to Python/FastAPI code structure
 */
export class PythonAdapter implements LanguageAdapter {
  readonly language = 'python' as const

  /**
   * Adapts agent output to Python code with proper formatting
   *
   * @param agentOutput - The agent's code generation output
   * @param context - Project context including framework information
   * @returns Adapted code with file paths and project structure
   *
   * @example
   * ```typescript
   * const adapter = new PythonAdapter()
   * const result = await adapter.adaptCode({
   *   endpoint: '/users',
   *   method: 'GET',
   *   handler: 'get_users',
   *   returnType: 'List[User]'
   * }, { framework: 'fastapi', projectName: 'my-api' })
   * ```
   */
  async adaptCode(agentOutput: Record<string, unknown>, context: AdapterProjectContext): Promise<AdaptedCode> {
    const code = this.generateFastAPICode(agentOutput)
    const formatted = await this.formatCode(code)

    // Type narrowing for endpoint/handler
    const pathIdentifier = typeof agentOutput.endpoint === 'string'
      ? agentOutput.endpoint
      : typeof agentOutput.handler === 'string'
        ? agentOutput.handler
        : 'default'

    return {
      files: [{
        path: this.getFilePath(pathIdentifier),
        content: formatted
      }],
      projectStructure: this.getProjectStructure(context.framework)
    }
  }

  /**
   * Gets the project structure for a given Python framework
   *
   * @param framework - The framework name (e.g., 'fastapi')
   * @returns File structure with directories and config files
   *
   * @throws {Error} If framework is not supported
   */
  getProjectStructure(framework: string): FileStructure {
    if (framework === 'fastapi') {
      return {
        directories: ['src', 'src/routes', 'src/models', 'src/services', 'tests'],
        configFiles: [
          {
            path: 'requirements.txt',
            content: `fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
python-dotenv>=1.0.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.25.0`
          },
          {
            path: 'pyproject.toml',
            content: `[tool.black]
line-length = 88
target-version = ['py311']

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true`
          },
          {
            path: '.env.example',
            content: `# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname`
          }
        ]
      }
    }

    throw new Error(`Unsupported framework: ${framework}`)
  }

  /**
   * Gets the testing framework configuration for Python
   *
   * @returns Testing framework configuration for pytest
   */
  getTestingFramework(): TestFramework {
    return {
      name: 'pytest',
      fileExtension: '.py',
      importPattern: 'import pytest\nfrom httpx import AsyncClient'
    }
  }

  /**
   * Formats Python code using Black formatter
   * Uses temporary file approach to avoid shell injection vulnerabilities
   *
   * @param code - The Python code to format
   * @returns Formatted code, or original code if Black is unavailable
   *
   * @example
   * ```typescript
   * const formatted = await adapter.formatCode('def hello():return "world"')
   * // Returns: def hello():\n    return "world"
   * ```
   */
  async formatCode(code: string): Promise<string> {
    const tempFile = `/tmp/format-${Date.now()}-${Math.random().toString(36).substring(7)}.py`

    try {
      // Write code to temp file to avoid shell injection
      await writeFile(tempFile, code, 'utf-8')

      // Format with black
      await execAsync(`black --quiet "${tempFile}"`)

      // Read formatted code
      const { stdout } = await execAsync(`cat "${tempFile}"`)

      // Clean up temp file
      await unlink(tempFile)

      return stdout
    } catch (error) {
      // Clean up temp file on error
      try {
        await unlink(tempFile)
      } catch {
        // Ignore cleanup errors
      }

      console.warn('Black not available, skipping formatting')
      return code
    }
  }

  /**
   * Generates FastAPI route code from agent output
   *
   * @param agentOutput - Agent output containing endpoint configuration
   * @returns Generated FastAPI Python code
   *
   * @private
   */
  private generateFastAPICode(agentOutput: Record<string, unknown>): string {
    // Type narrowing with defaults
    const endpoint = typeof agentOutput.endpoint === 'string' ? agentOutput.endpoint : '/default'
    const method = typeof agentOutput.method === 'string' ? agentOutput.method : 'GET'
    const handler = typeof agentOutput.handler === 'string' ? agentOutput.handler : 'handle_request'
    const returnType = typeof agentOutput.returnType === 'string' ? agentOutput.returnType : 'dict'

    // Convert Python 3.9+ type hints to typing module for compatibility
    const normalizedReturnType = returnType.replace(/^list\[/, 'List[').replace(/^dict\[/, 'Dict[')

    return `from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

@router.${method.toLowerCase()}("${endpoint}")
async def ${handler}() -> ${normalizedReturnType}:
    """
    ${handler.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
    """
    try:
        # TODO: Implement business logic
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
`
  }

  private getFilePath(handlerOrEndpoint: string): string {
    // Extract resource name from endpoint or handler
    const resource = handlerOrEndpoint
      .replace(/^\//, '')        // Remove leading slash
      .replace(/[\/{}]/g, '_')   // Replace special chars with underscore
      .replace(/_+/g, '_')       // Collapse multiple underscores
      .replace(/^_|_$/g, '')     // Remove leading/trailing underscores
    return `src/routes/${resource}.py`
  }
}
