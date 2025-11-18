import { LanguageAdapter, AdapterProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class PythonAdapter implements LanguageAdapter {
  readonly language = 'python' as const

  async adaptCode(agentOutput: any, context: AdapterProjectContext): Promise<AdaptedCode> {
    const code = this.generateFastAPICode(agentOutput)
    const formatted = await this.formatCode(code)

    return {
      files: [{
        path: this.getFilePath(agentOutput.endpoint || agentOutput.handler),
        content: formatted
      }],
      projectStructure: this.getProjectStructure(context.framework)
    }
  }

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

  getTestingFramework(): TestFramework {
    return {
      name: 'pytest',
      fileExtension: '.py',
      importPattern: 'import pytest\nfrom httpx import AsyncClient'
    }
  }

  async formatCode(code: string): Promise<string> {
    try {
      // Try to format with black
      const { stdout } = await execAsync(`echo '${code.replace(/'/g, "'\\''")}' | black -`)
      return stdout
    } catch (error) {
      console.warn('Black not available, skipping formatting')
      return code
    }
  }

  private generateFastAPICode(agentOutput: any): string {
    const { endpoint, method = 'GET', handler, returnType = 'dict' } = agentOutput

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
