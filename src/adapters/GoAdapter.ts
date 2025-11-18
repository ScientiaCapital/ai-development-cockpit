import { LanguageAdapter, AdapterProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'

const execAsync = promisify(exec)

/**
 * Go language adapter for Gin framework
 * Converts agent output to Go/Gin code structure
 */
export class GoAdapter implements LanguageAdapter {
  readonly language = 'go' as const

  /**
   * Adapts agent output to Go code with proper formatting
   *
   * @param agentOutput - The agent's code generation output
   * @param context - Project context including framework information
   * @returns Adapted code with file paths and project structure
   *
   * @example
   * ```typescript
   * const adapter = new GoAdapter()
   * const result = await adapter.adaptCode({
   *   endpoint: '/users',
   *   method: 'GET',
   *   handler: 'GetUsers',
   *   returnType: '[]User'
   * }, { framework: 'gin', projectName: 'my-api' })
   * ```
   */
  async adaptCode(agentOutput: Record<string, unknown>, context: AdapterProjectContext): Promise<AdaptedCode> {
    const code = this.generateGinCode(agentOutput)
    const formatted = await this.formatCode(code)

    // Type narrowing for handler
    const handler = typeof agentOutput.handler === 'string' ? agentOutput.handler : 'HandleRequest'

    return {
      files: [{
        path: this.getFilePath(handler),
        content: formatted
      }],
      projectStructure: this.getProjectStructure(context.framework)
    }
  }

  /**
   * Gets the project structure for a given Go framework
   *
   * @param framework - The framework name (e.g., 'gin')
   * @returns File structure with directories and config files
   *
   * @throws {Error} If framework is not supported
   */
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

  /**
   * Gets the testing framework configuration for Go
   *
   * @returns Testing framework configuration for testing package
   */
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

  /**
   * Formats Go code using gofmt
   * Uses temporary file approach to avoid shell injection vulnerabilities
   *
   * @param code - The Go code to format
   * @returns Formatted code, or original code if gofmt is unavailable
   *
   * @example
   * ```typescript
   * const formatted = await adapter.formatCode('package main\nfunc main(){}')
   * // Returns properly formatted Go code
   * ```
   */
  async formatCode(code: string): Promise<string> {
    const tempFile = `/tmp/format-${Date.now()}-${Math.random().toString(36).substring(7)}.go`

    try {
      // Write code to temp file to avoid shell injection
      await writeFile(tempFile, code, 'utf-8')

      // Format with gofmt
      const { stdout } = await execAsync(`gofmt "${tempFile}"`)

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

      console.warn('gofmt not available, skipping formatting')
      return code
    }
  }

  /**
   * Generates Gin handler code from agent output
   *
   * @param agentOutput - Agent output containing endpoint configuration
   * @returns Generated Gin Go code
   *
   * @private
   */
  private generateGinCode(agentOutput: Record<string, unknown>): string {
    // Type narrowing with defaults
    const endpoint = typeof agentOutput.endpoint === 'string' ? agentOutput.endpoint : '/default'
    const method = typeof agentOutput.method === 'string' ? agentOutput.method : 'GET'
    const handler = typeof agentOutput.handler === 'string' ? agentOutput.handler : 'HandleRequest'
    const returnType = typeof agentOutput.returnType === 'string' ? agentOutput.returnType : '[]interface{}'

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

func someOperation() error {
	return nil
}
`
  }

  /**
   * Converts Go handler name to filename
   * Converts PascalCase to snake_case for file naming
   *
   * @param handler - Handler function name (e.g., 'GetUsers')
   * @returns File path (e.g., 'internal/handlers/get_users.go')
   *
   * @private
   */
  private getFilePath(handler: string): string {
    // Convert PascalCase to snake_case
    const filename = handler
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
    return `internal/handlers/${filename}.go`
  }
}
