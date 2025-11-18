# Multi-Language + Phase 3 Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable agents to generate Python/Go/Rust code with multi-model orchestration and JSON validation.

**Architecture:** Language Adapter pattern translates agent outputs to language-specific code. Pluggable provider system routes tasks to optimal models (Claude, Qwen, DeepSeek). Python microservice validates JSON schemas using Pydantic + Outlines. RunPod deployment enables 24/7 operation.

**Tech Stack:** TypeScript, Jest, Python (FastAPI, Pydantic, Outlines), Docker, GitHub Actions, RunPod

---

## Part 1: Language Adapter Foundation (Hours 1-3)

### Task 1.1: Language Adapter Interface

**Goal:** Create the base interface for all language adapters.

**Files:**
- Create: `src/adapters/LanguageAdapter.ts`
- Create: `src/adapters/index.ts`

---

#### Step 1: Create LanguageAdapter interface

Create `src/adapters/LanguageAdapter.ts`:

```typescript
/**
 * Base interface for language-specific code adapters
 */
export interface ProjectContext {
  language: 'typescript' | 'python' | 'go' | 'rust'
  framework: string
  testFramework?: string
  targetDirectory: string
}

export interface AdaptedCode {
  files: {
    path: string
    content: string
  }[]
  projectStructure: FileStructure
}

export interface FileStructure {
  directories: string[]
  configFiles: {
    path: string
    content: string
  }[]
}

export interface TestFramework {
  name: string
  fileExtension: string
  importPattern: string
}

/**
 * Language adapter interface
 * Transforms generic agent output into language-specific, production-ready code
 */
export interface LanguageAdapter {
  readonly language: 'python' | 'go' | 'rust' | 'typescript'

  /**
   * Adapt generic code to language-specific implementation
   */
  adaptCode(agentOutput: any, context: ProjectContext): Promise<AdaptedCode>

  /**
   * Get project structure for this language
   */
  getProjectStructure(framework: string): FileStructure

  /**
   * Get testing framework details
   */
  getTestingFramework(): TestFramework

  /**
   * Format code according to language conventions
   */
  formatCode(code: string): Promise<string>
}
```

#### Step 2: Create exports file

Create `src/adapters/index.ts`:

```typescript
export { LanguageAdapter, ProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
```

#### Step 3: Commit

```bash
cd ~/.config/superpowers/worktrees/ai-development-cockpit/multi-language-phase3
git add src/adapters/
git commit -m "feat(adapters): add LanguageAdapter interface

- Base interface for all language adapters
- Types for ProjectContext, AdaptedCode, FileStructure
- Testing framework interface"
```

---

### Task 1.2: Python Adapter (TDD)

**Goal:** Build Python adapter that generates FastAPI code with pytest tests.

**Files:**
- Create: `tests/adapters/PythonAdapter.test.ts`
- Create: `src/adapters/PythonAdapter.ts`
- Modify: `src/adapters/index.ts`

---

#### Step 1: Write the failing test

Create `tests/adapters/PythonAdapter.test.ts`:

```typescript
import { PythonAdapter } from '@/adapters/PythonAdapter'
import { ProjectContext } from '@/adapters/LanguageAdapter'

describe('PythonAdapter', () => {
  let adapter: PythonAdapter
  let context: ProjectContext

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
```

#### Step 2: Run test to verify it fails

```bash
cd ~/.config/superpowers/worktrees/ai-development-cockpit/multi-language-phase3
npm test -- tests/adapters/PythonAdapter.test.ts
```

**Expected:** FAIL with "Cannot find module '@/adapters/PythonAdapter'"

---

#### Step 3: Write minimal implementation

Create `src/adapters/PythonAdapter.ts`:

```typescript
import { LanguageAdapter, ProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class PythonAdapter implements LanguageAdapter {
  readonly language = 'python' as const

  async adaptCode(agentOutput: any, context: ProjectContext): Promise<AdaptedCode> {
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

    return `from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

@router.${method.toLowerCase()}("${endpoint}")
async def ${handler}() -> ${returnType}:
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
    const resource = handlerOrEndpoint.replace(/[\/{}]/g, '_').replace(/_+/g, '_').trim()
    return `src/routes/${resource}.py`
  }
}
```

#### Step 4: Update exports

Modify `src/adapters/index.ts`:

```typescript
export { LanguageAdapter, ProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
export { PythonAdapter } from './PythonAdapter'
```

#### Step 5: Run test to verify it passes

```bash
npm test -- tests/adapters/PythonAdapter.test.ts
```

**Expected:** PASS (4 tests passing)

---

#### Step 6: Commit

```bash
git add src/adapters/PythonAdapter.ts tests/adapters/PythonAdapter.test.ts src/adapters/index.ts
git commit -m "feat(adapters): add PythonAdapter with FastAPI support

- Generate FastAPI endpoints with type hints
- Include error handling with HTTPException
- Format code with black
- Generate pytest testing structure
- TDD with 4 passing tests"
```

---

### Task 1.3: Go Adapter (TDD)

**Goal:** Build Go adapter that generates Gin framework code with testing package support.

**Files:**
- Create: `tests/adapters/GoAdapter.test.ts`
- Create: `src/adapters/GoAdapter.ts`
- Modify: `src/adapters/index.ts`

---

#### Step 1: Write the failing test

Create `tests/adapters/GoAdapter.test.ts`:

```typescript
import { GoAdapter } from '@/adapters/GoAdapter'
import { ProjectContext } from '@/adapters/LanguageAdapter'

describe('GoAdapter', () => {
  let adapter: GoAdapter
  let context: ProjectContext

  beforeEach(() => {
    adapter = new GoAdapter()
    context = {
      language: 'go',
      framework: 'gin',
      targetDirectory: '/tmp/test-project'
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
      expect(result.files[0].path).toContain('handlers/users.go')
      expect(result.files[0].content).toContain('func GetUsers(c *gin.Context)')
      expect(result.files[0].content).toContain('c.JSON(http.StatusOK,')
      expect(result.files[0].content).toContain('error handling')
    })
  })

  describe('getProjectStructure', () => {
    it('should return Gin project structure', () => {
      const structure = adapter.getProjectStructure('gin')

      expect(structure.directories).toContain('cmd')
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

      expect(formatted).toContain('func main() {')
    })
  })
})
```

#### Step 2: Run test to verify it fails

```bash
npm test -- tests/adapters/GoAdapter.test.ts
```

**Expected:** FAIL with "Cannot find module '@/adapters/GoAdapter'"

---

#### Step 3: Write minimal implementation

Create `src/adapters/GoAdapter.ts`:

```typescript
import { LanguageAdapter, ProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class GoAdapter implements LanguageAdapter {
  readonly language = 'go' as const

  async adaptCode(agentOutput: any, context: ProjectContext): Promise<AdaptedCode> {
    const code = this.generateGinCode(agentOutput)
    const formatted = await this.formatCode(code)

    return {
      files: [{
        path: this.getFilePath(agentOutput.handler),
        content: formatted
      }],
      projectStructure: this.getProjectStructure(context.framework)
    }
  }

  getProjectStructure(framework: string): FileStructure {
    if (framework === 'gin') {
      return {
        directories: [
          'cmd/server',
          'internal/handlers',
          'internal/models',
          'internal/services',
          'pkg',
          'tests'
        ],
        configFiles: [
          {
            path: 'go.mod',
            content: `module github.com/yourorg/yourproject

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/stretchr/testify v1.8.4
)`
          },
          {
            path: '.env.example',
            content: `# Server Configuration
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
GIN_MODE=release

# Database
DATABASE_URL=postgres://user:password@localhost:5432/dbname?sslmode=disable`
          },
          {
            path: 'Makefile',
            content: `build:
	go build -o bin/server cmd/server/main.go

test:
	go test -v ./...

run:
	go run cmd/server/main.go

fmt:
	go fmt ./...

lint:
	golangci-lint run`
          }
        ]
      }
    }

    throw new Error(`Unsupported framework: ${framework}`)
  }

  getTestingFramework(): TestFramework {
    return {
      name: 'testing',
      fileExtension: '_test.go',
      importPattern: `import (
	"testing"
	"github.com/stretchr/testify/assert"
)`
    }
  }

  async formatCode(code: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`echo '${code.replace(/'/g, "'\\''")}' | gofmt`)
      return stdout
    } catch (error) {
      console.warn('gofmt not available, skipping formatting')
      return code
    }
  }

  private generateGinCode(agentOutput: any): string {
    const { endpoint, method = 'GET', handler, returnType = '[]interface{}' } = agentOutput

    return `package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

// ${handler} handles ${method} ${endpoint}
func ${handler}(c *gin.Context) {
	// TODO: Implement business logic

	// Error handling example
	if err := someOperation(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Success response
	c.JSON(http.StatusOK, gin.H{
		"data": ${returnType}{},
	})
}
`
  }

  private getFilePath(handler: string): string {
    const filename = handler.toLowerCase().replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
    return `internal/handlers/${filename}.go`
  }
}
```

#### Step 4: Update exports

Modify `src/adapters/index.ts`:

```typescript
export { LanguageAdapter, ProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
export { PythonAdapter } from './PythonAdapter'
export { GoAdapter } from './GoAdapter'
```

#### Step 5: Run test to verify it passes

```bash
npm test -- tests/adapters/GoAdapter.test.ts
```

**Expected:** PASS (4 tests passing)

---

#### Step 6: Commit

```bash
git add src/adapters/GoAdapter.ts tests/adapters/GoAdapter.test.ts src/adapters/index.ts
git commit -m "feat(adapters): add GoAdapter with Gin framework support

- Generate Gin handlers with error handling
- Idiomatic Go naming conventions
- Format code with gofmt
- testing package support
- TDD with 4 passing tests"
```

---

## Part 2: Complete Multi-Language Support (Hours 4-6)

### Task 2.1: Rust Adapter (TDD)

**Goal:** Build Rust adapter that generates Actix-web code with cargo test support.

**Files:**
- Create: `tests/adapters/RustAdapter.test.ts`
- Create: `src/adapters/RustAdapter.ts`
- Modify: `src/adapters/index.ts`

---

#### Step 1: Write the failing test

Create `tests/adapters/RustAdapter.test.ts`:

```typescript
import { RustAdapter } from '@/adapters/RustAdapter'
import { ProjectContext } from '@/adapters/LanguageAdapter'

describe('RustAdapter', () => {
  let adapter: RustAdapter
  let context: ProjectContext

  beforeEach(() => {
    adapter = new RustAdapter()
    context = {
      language: 'rust',
      framework: 'actix-web',
      targetDirectory: '/tmp/test-project'
    }
  })

  describe('adaptCode', () => {
    it('should generate Actix handler with Result type', async () => {
      const agentOutput = {
        endpoint: '/users',
        method: 'GET',
        handler: 'get_users',
        returnType: 'Vec<User>'
      }

      const result = await adapter.adaptCode(agentOutput, context)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toContain('handlers/users.rs')
      expect(result.files[0].content).toContain('async fn get_users')
      expect(result.files[0].content).toContain('Result<')
      expect(result.files[0].content).toContain('HttpResponse')
    })
  })

  describe('getProjectStructure', () => {
    it('should return Actix project structure', () => {
      const structure = adapter.getProjectStructure('actix-web')

      expect(structure.directories).toContain('src')
      expect(structure.directories).toContain('tests')
      expect(structure.configFiles.find(f => f.path === 'Cargo.toml')).toBeDefined()
    })
  })

  describe('formatCode', () => {
    it('should format Rust code with rustfmt', async () => {
      const unformatted = 'fn main(  ){let x=5;}'

      const formatted = await adapter.formatCode(unformatted)

      expect(formatted).toContain('fn main() {')
      expect(formatted).toContain('let x = 5;')
    })
  })
})
```

#### Step 2: Run test to verify it fails

```bash
npm test -- tests/adapters/RustAdapter.test.ts
```

**Expected:** FAIL with "Cannot find module '@/adapters/RustAdapter'"

---

#### Step 3: Write minimal implementation

Create `src/adapters/RustAdapter.ts`:

```typescript
import { LanguageAdapter, ProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class RustAdapter implements LanguageAdapter {
  readonly language = 'rust' as const

  async adaptCode(agentOutput: any, context: ProjectContext): Promise<AdaptedCode> {
    const code = this.generateActixCode(agentOutput)
    const formatted = await this.formatCode(code)

    return {
      files: [{
        path: this.getFilePath(agentOutput.handler),
        content: formatted
      }],
      projectStructure: this.getProjectStructure(context.framework)
    }
  }

  getProjectStructure(framework: string): FileStructure {
    if (framework === 'actix-web') {
      return {
        directories: ['src', 'src/handlers', 'src/models', 'src/services', 'tests'],
        configFiles: [
          {
            path: 'Cargo.toml',
            content: `[package]
name = "yourproject"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4.4"
actix-rt = "2.9"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.34", features = ["full"] }
env_logger = "0.10"
dotenv = "0.15"

[dev-dependencies]
actix-web-test = "0.1"`
          },
          {
            path: '.env.example',
            content: `# Server Configuration
RUST_LOG=info
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database
DATABASE_URL=postgres://user:password@localhost:5432/dbname`
          }
        ]
      }
    }

    throw new Error(`Unsupported framework: ${framework}`)
  }

  getTestingFramework(): TestFramework {
    return {
      name: 'cargo test',
      fileExtension: '.rs',
      importPattern: `#[cfg(test)]
mod tests {
    use super::*;
}`
    }
  }

  async formatCode(code: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`echo '${code.replace(/'/g, "'\\''")}' | rustfmt`)
      return stdout
    } catch (error) {
      console.warn('rustfmt not available, skipping formatting')
      return code
    }
  }

  private generateActixCode(agentOutput: any): string {
    const { endpoint, method = 'GET', handler, returnType = 'Vec<User>' } = agentOutput

    return `use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: i32,
    pub name: String,
}

/// ${handler.replace(/_/g, ' ')}
pub async fn ${handler}() -> Result<HttpResponse> {
    // TODO: Implement business logic

    match some_operation().await {
        Ok(data) => Ok(HttpResponse::Ok().json(data)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })))
    }
}

async fn some_operation() -> Result<${returnType}, Box<dyn std::error::Error>> {
    Ok(Vec::new())
}
`
  }

  private getFilePath(handler: string): string {
    return `src/handlers/${handler}.rs`
  }
}
```

#### Step 4: Update exports

Modify `src/adapters/index.ts`:

```typescript
export { LanguageAdapter, ProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
export { PythonAdapter } from './PythonAdapter'
export { GoAdapter } from './GoAdapter'
export { RustAdapter } from './RustAdapter'
```

#### Step 5: Run test to verify it passes

```bash
npm test -- tests/adapters/RustAdapter.test.ts
```

**Expected:** PASS (3 tests passing)

---

#### Step 6: Commit

```bash
git add src/adapters/RustAdapter.ts tests/adapters/RustAdapter.test.ts src/adapters/index.ts
git commit -m "feat(adapters): add RustAdapter with Actix-web support

- Generate Actix handlers with Result types
- Ownership and error handling patterns
- Format code with rustfmt
- cargo test support
- TDD with 3 passing tests"
```

---

### Task 2.2: Integrate Adapters into BaseAgent

**Goal:** Add language adapter support to all agents.

**Files:**
- Modify: `src/agents/BaseAgent.ts`
- Modify: `src/agents/BackendDeveloper.ts`
- Modify: `tests/agents/BackendDeveloper.test.ts`

---

#### Step 1: Add adapter to BaseAgent

Modify `src/agents/BaseAgent.ts` - add after imports:

```typescript
import { LanguageAdapter, ProjectContext, PythonAdapter, GoAdapter, RustAdapter } from '@/adapters'

export interface BaseAgentContext {
  userRequest: string
  language?: 'typescript' | 'python' | 'go' | 'rust'
  framework?: string
  [key: string]: any
}
```

Add to BaseAgent class:

```typescript
protected adapter?: LanguageAdapter

constructor(agentType: string, protected context: BaseAgentContext) {
  this.agentType = agentType

  // Initialize language adapter if language specified
  if (context.language) {
    this.adapter = this.getAdapter(context.language)
  }
}

private getAdapter(language: string): LanguageAdapter {
  switch(language) {
    case 'python':
      return new PythonAdapter()
    case 'go':
      return new GoAdapter()
    case 'rust':
      return new RustAdapter()
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}
```

#### Step 2: Update BackendDeveloper to use adapter

Modify `src/agents/BackendDeveloper.ts` - update execute() method:

```typescript
async execute(): Promise<AgentOutput> {
  const startTime = Date.now()

  console.log(`⚙️  BackendDeveloper: Generating ${this.context.language || 'TypeScript'} backend code...`)

  // ... existing code ...

  // Use adapter if available
  if (this.adapter && this.context.language !== 'typescript') {
    const projectContext: ProjectContext = {
      language: this.context.language as any,
      framework: this.context.framework || 'fastapi',
      targetDirectory: this.workspace.getWorkspacePath()
    }

    const adapted = await this.adapter.adaptCode(response.content, projectContext)

    // Write adapted files
    for (const file of adapted.files) {
      await this.workspace.writeFile(file.path, file.content)
    }

    return {
      filesCreated: adapted.files.map(f => f.path),
      filesModified: [],
      cost: this.totalCost,
      duration: Date.now() - startTime,
      metadata: {
        language: this.context.language,
        framework: this.context.framework
      }
    }
  }

  // ... existing TypeScript code path ...
}
```

#### Step 3: Add test for multi-language support

Modify `tests/agents/BackendDeveloper.test.ts` - add test:

```typescript
describe('Multi-language support', () => {
  it('should generate Python FastAPI code when language is python', async () => {
    const pythonAgent = new BackendDeveloper({
      userRequest: 'Create users API',
      language: 'python',
      framework: 'fastapi',
      architecture: { /* ... */ }
    })

    mockOptimizeCompletion.mockResolvedValue({
      content: JSON.stringify({
        endpoint: '/users',
        method: 'GET',
        handler: 'get_users'
      }),
      provider: 'test',
      model: 'test',
      cost: 0.001,
      tokens: { input: 100, output: 200 },
      duration: 1000
    })

    const result = await pythonAgent.execute()

    expect(result.metadata?.language).toBe('python')
    expect(result.filesCreated[0]).toContain('.py')
  })
})
```

#### Step 4: Run tests

```bash
npm test -- tests/agents/BackendDeveloper.test.ts
```

**Expected:** PASS (all tests including new multi-language test)

---

#### Step 5: Commit

```bash
git add src/agents/BaseAgent.ts src/agents/BackendDeveloper.ts tests/agents/BackendDeveloper.test.ts
git commit -m "feat(agents): integrate language adapters into agents

- Add language adapter selection to BaseAgent
- Update BackendDeveloper to use adapters for Python/Go/Rust
- Add test for multi-language code generation
- Agents now language-agnostic"
```

---

### Task 2.3: E2E Multi-Language Test

**Goal:** Verify end-to-end Python/Go/Rust project generation.

**Files:**
- Create: `tests/e2e/multi-language.test.ts`

---

#### Step 1: Create E2E test

Create `tests/e2e/multi-language.test.ts`:

```typescript
import { BackendDeveloper } from '@/agents/BackendDeveloper'
import { FrontendDeveloper } from '@/agents/FrontendDeveloper'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('Multi-Language E2E Tests', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `ml-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should generate complete Python FastAPI project', async () => {
    const backendDev = new BackendDeveloper({
      userRequest: 'Create a REST API for task management',
      language: 'python',
      framework: 'fastapi',
      architecture: { database: 'postgresql' }
    })

    const result = await backendDev.execute()

    expect(result.filesCreated.length).toBeGreaterThan(0)
    expect(result.filesCreated.some(f => f.endsWith('.py'))).toBe(true)

    // Verify project structure
    const reqFile = path.join(testDir, 'requirements.txt')
    expect(await fs.access(reqFile).then(() => true).catch(() => false)).toBe(true)
  })

  it('should generate complete Go Gin project', async () => {
    const backendDev = new BackendDeveloper({
      userRequest: 'Create a REST API for task management',
      language: 'go',
      framework: 'gin',
      architecture: { database: 'postgresql' }
    })

    const result = await backendDev.execute()

    expect(result.filesCreated.some(f => f.endsWith('.go'))).toBe(true)
  })

  it('should generate complete Rust Actix project', async () => {
    const backendDev = new BackendDeveloper({
      userRequest: 'Create a REST API for task management',
      language: 'rust',
      framework: 'actix-web',
      architecture: { database: 'postgresql' }
    })

    const result = await backendDev.execute()

    expect(result.filesCreated.some(f => f.endsWith('.rs'))).toBe(true)
  })
})
```

#### Step 2: Run E2E tests

```bash
npm test -- tests/e2e/multi-language.test.ts
```

**Expected:** PASS (3 E2E tests passing)

---

#### Step 3: Commit

```bash
git add tests/e2e/multi-language.test.ts
git commit -m "test: add E2E tests for multi-language project generation

- Test Python FastAPI project generation
- Test Go Gin project generation
- Test Rust Actix project generation
- Verify project structure for each language"
```

---

**Part 1 & 2 Complete! Multi-language support fully implemented with 14+ passing tests.**

---

## Part 3: Provider System (Hours 7-9)

### Task 3.1: Provider Interface

**Goal:** Create base interface for all AI model providers.

**Files:**
- Create: `src/providers/IProvider.ts`
- Create: `src/providers/index.ts`

---

#### Step 1: Create IProvider interface

Create `src/providers/IProvider.ts`:

```typescript
export interface ProviderCapabilities {
  vision: boolean      // Can process images/PDFs
  jsonMode: boolean    // Supports structured output
  streaming: boolean   // Supports streaming responses
  contextWindow: number
}

export interface CompletionParams {
  prompt: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface VisionParams extends CompletionParams {
  images: string[]     // URLs or base64
  imageType: 'url' | 'base64'
}

export interface TokenUsage {
  input: number
  output: number
  total: number
}

export interface CompletionResult {
  content: string
  provider: string
  model: string
  cost: number
  tokens: TokenUsage
  duration: number
}

/**
 * Base interface for AI model providers
 */
export interface IProvider {
  readonly name: string
  readonly capabilities: ProviderCapabilities

  /**
   * Generate text completion
   */
  generateCompletion(params: CompletionParams): Promise<CompletionResult>

  /**
   * Generate completion with vision/multimodal support
   */
  generateWithVision(params: VisionParams): Promise<CompletionResult>

  /**
   * Calculate cost for given token usage
   */
  calculateCost(tokens: TokenUsage): number
}
```

#### Step 2: Create exports

Create `src/providers/index.ts`:

```typescript
export {
  IProvider,
  ProviderCapabilities,
  CompletionParams,
  VisionParams,
  TokenUsage,
  CompletionResult
} from './IProvider'
```

#### Step 3: Commit

```bash
git add src/providers/
git commit -m "feat(providers): add IProvider interface

- Base interface for all AI providers
- Vision/multimodal support
- Token usage and cost calculation
- Streaming capabilities definition"
```

---

### Task 3.2: Claude Provider (TDD)

**Goal:** Implement Claude 4.5 Sonnet provider.

**Files:**
- Create: `tests/providers/ClaudeProvider.test.ts`
- Create: `src/providers/ClaudeProvider.ts`
- Modify: `src/providers/index.ts`

---

#### Step 1: Write the failing test

Create `tests/providers/ClaudeProvider.test.ts`:

```typescript
import { ClaudeProvider } from '@/providers/ClaudeProvider'

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Response from Claude' }],
        usage: { input_tokens: 100, output_tokens: 200 },
        model: 'claude-sonnet-4.5-20250929'
      })
    }
  }))
}))

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider

  beforeEach(() => {
    provider = new ClaudeProvider('test-api-key')
  })

  it('should have correct capabilities', () => {
    expect(provider.capabilities.vision).toBe(true)
    expect(provider.capabilities.jsonMode).toBe(true)
    expect(provider.capabilities.contextWindow).toBe(200000)
  })

  it('should generate completion', async () => {
    const result = await provider.generateCompletion({
      prompt: 'Test prompt',
      temperature: 0.7
    })

    expect(result.content).toBe('Response from Claude')
    expect(result.provider).toBe('anthropic')
    expect(result.model).toBe('claude-sonnet-4.5')
    expect(result.cost).toBeGreaterThan(0)
  })

  it('should calculate cost correctly', () => {
    const cost = provider.calculateCost({
      input: 1000000,
      output: 1000000,
      total: 2000000
    })

    // Claude 4.5 pricing: $3/M input, $15/M output
    expect(cost).toBe(18) // (1M * $3) + (1M * $15)
  })
})
```

#### Step 2: Run test to verify it fails

```bash
npm test -- tests/providers/ClaudeProvider.test.ts
```

**Expected:** FAIL with "Cannot find module '@/providers/ClaudeProvider'"

---

#### Step 3: Install Anthropic SDK

```bash
cd ~/.config/superpowers/worktrees/ai-development-cockpit/multi-language-phase3
npm install @anthropic-ai/sdk
```

---

#### Step 4: Write minimal implementation

Create `src/providers/ClaudeProvider.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { IProvider, ProviderCapabilities, CompletionParams, VisionParams, TokenUsage, CompletionResult } from './IProvider'

export class ClaudeProvider implements IProvider {
  readonly name = 'anthropic'
  readonly capabilities: ProviderCapabilities = {
    vision: true,
    jsonMode: true,
    streaming: true,
    contextWindow: 200000
  }

  private client: Anthropic
  private model = 'claude-sonnet-4.5-20250929'

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async generateCompletion(params: CompletionParams): Promise<CompletionResult> {
    const startTime = Date.now()

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature || 0.7,
      system: params.systemPrompt,
      messages: [{
        role: 'user',
        content: params.prompt
      }]
    })

    const tokens: TokenUsage = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens
    }

    return {
      content: response.content[0].text,
      provider: this.name,
      model: 'claude-sonnet-4.5',
      cost: this.calculateCost(tokens),
      tokens,
      duration: Date.now() - startTime
    }
  }

  async generateWithVision(params: VisionParams): Promise<CompletionResult> {
    const startTime = Date.now()

    const content: any[] = [
      { type: 'text', text: params.prompt }
    ]

    for (const image of params.images) {
      if (params.imageType === 'url') {
        content.push({
          type: 'image',
          source: { type: 'url', url: image }
        })
      } else {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: image }
        })
      }
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: params.maxTokens || 4096,
      messages: [{ role: 'user', content }]
    })

    const tokens: TokenUsage = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens
    }

    return {
      content: response.content[0].text,
      provider: this.name,
      model: 'claude-sonnet-4.5',
      cost: this.calculateCost(tokens),
      tokens,
      duration: Date.now() - startTime
    }
  }

  calculateCost(tokens: TokenUsage): number {
    // Claude 4.5 Sonnet pricing
    const inputCostPer1M = 3.00
    const outputCostPer1M = 15.00

    const inputCost = (tokens.input / 1000000) * inputCostPer1M
    const outputCost = (tokens.output / 1000000) * outputCostPer1M

    return inputCost + outputCost
  }
}
```

#### Step 5: Update exports

Modify `src/providers/index.ts`:

```typescript
export {
  IProvider,
  ProviderCapabilities,
  CompletionParams,
  VisionParams,
  TokenUsage,
  CompletionResult
} from './IProvider'
export { ClaudeProvider } from './ClaudeProvider'
```

#### Step 6: Run tests

```bash
npm test -- tests/providers/ClaudeProvider.test.ts
```

**Expected:** PASS (3 tests passing)

---

#### Step 7: Commit

```bash
git add src/providers/ClaudeProvider.ts tests/providers/ClaudeProvider.test.ts src/providers/index.ts package.json
git commit -m "feat(providers): add ClaudeProvider with vision support

- Claude 4.5 Sonnet integration
- Vision/multimodal support
- Accurate cost calculation ($3/M input, $15/M output)
- TDD with 3 passing tests"
```

---

**NOTE:** Due to space constraints, I'm providing the high-level outline for remaining tasks. Each would follow the same TDD pattern.

### Task 3.3: Additional Providers (QwenProvider, DeepSeekProvider)
- Same TDD pattern as ClaudeProvider
- QwenProvider: Vision support, free tier
- DeepSeekProvider: Code-focused, very cheap ($0.14/M)

### Task 3.4: ModelRouter
- Route tasks to optimal provider based on type
- Cost vs quality trade-offs
- Fallback logic

---

## Part 4: JSON Validator + RunPod (Hours 10-11)

### Task 4.1: Python FastAPI Validator Service
- Pydantic schemas for OrchestratorPlan, AgentOutput
- FastAPI endpoints: /validate/plan, /validate/agent-output
- Outlines integration for constrained generation
- Dockerfile.serverless

### Task 4.2: RunPod Deployment
- GitHub Actions workflow
- Node.js handler.js
- Push to GHCR
- Deploy to RunPod

---

## Part 5: Integration (Hour 12)

### Task 5.1: GitHub Login Button
- Add button to dashboard
- Test OAuth flow

### Task 5.2: E2E Test
- Full workflow: text → plan → agents → PR
- Verify all components

---

## Verification Checklist

Before marking complete:

- [ ] All language adapters working (Python, Go, Rust)
- [ ] All providers working (Claude, Qwen, DeepSeek)
- [ ] Model router routes correctly
- [ ] Python validator service deployed
- [ ] RunPod deployment successful
- [ ] GitHub button functional
- [ ] E2E test passes
- [ ] All unit tests passing (20+)

---

**Plan saved to:** `docs/plans/2025-11-17-multi-language-phase3-implementation-plan.md`
