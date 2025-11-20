/**
 * Language Adapter Interface - Multi-Language Code Generation Foundation
 *
 * Enables agents to generate production-ready code in Python, Go, Rust, and TypeScript
 * by transforming generic agent outputs into language-specific implementations.
 *
 * Part of Phase 3: Multi-Language Support
 * Created: 2025-11-17
 */

/**
 * Project context specific to language adaptation.
 *
 * Provides the necessary information for adapters to generate
 * language-specific code with proper framework integration.
 *
 * @interface AdapterProjectContext
 * @property {string} language - Target programming language
 * @property {string} framework - Framework to use (e.g., 'fastapi' for Python, 'gin' for Go)
 * @property {string} [testFramework] - Testing framework (e.g., 'pytest', 'go test', 'cargo test')
 * @property {string} targetDirectory - Directory where code will be generated
 *
 * @example
 * ```typescript
 * const context: AdapterProjectContext = {
 *   language: 'python',
 *   framework: 'fastapi',
 *   testFramework: 'pytest',
 *   targetDirectory: '/app/backend'
 * }
 * ```
 */
export interface AdapterProjectContext {
  language: 'typescript' | 'python' | 'go' | 'rust'
  framework: string
  testFramework?: string
  targetDirectory: string
}

/**
 * Result of code adaptation process.
 *
 * Contains all generated files and the project structure needed
 * to create a complete, buildable project in the target language.
 *
 * @interface AdaptedCode
 * @property {Array} files - Generated source files with paths and content
 * @property {FileStructure} projectStructure - Directory structure and config files
 *
 * @example
 * ```typescript
 * const adapted: AdaptedCode = {
 *   files: [
 *     { path: 'src/main.py', content: '...' },
 *     { path: 'src/api/routes.py', content: '...' }
 *   ],
 *   projectStructure: {
 *     directories: ['src', 'src/api', 'tests'],
 *     configFiles: [
 *       { path: 'requirements.txt', content: 'fastapi==0.104.1\n...' }
 *     ]
 *   }
 * }
 * ```
 */
export interface AdaptedCode {
  files: {
    path: string
    content: string
  }[]
  projectStructure: FileStructure
}

/**
 * Project directory structure and configuration files.
 *
 * Defines the complete file system layout for a language-specific project,
 * including all necessary configuration files (package.json, requirements.txt, etc.).
 *
 * @interface FileStructure
 * @property {string[]} directories - List of directories to create
 * @property {Array} configFiles - Configuration files (package.json, Cargo.toml, etc.)
 *
 * @example
 * ```typescript
 * const structure: FileStructure = {
 *   directories: ['src', 'tests', 'config'],
 *   configFiles: [
 *     { path: 'package.json', content: '{"name": "my-app"...}' },
 *     { path: 'tsconfig.json', content: '{"compilerOptions"...}' }
 *   ]
 * }
 * ```
 */
export interface FileStructure {
  directories: string[]
  configFiles: {
    path: string
    content: string
  }[]
}

/**
 * Testing framework configuration.
 *
 * Provides language-specific testing framework details needed
 * to generate properly structured test files.
 *
 * @interface TestFramework
 * @property {string} name - Framework name (e.g., 'pytest', 'jest', 'cargo test')
 * @property {string} fileExtension - Test file extension (e.g., '.test.ts', '_test.py')
 * @property {string} importPattern - How to import test utilities
 *
 * @example
 * ```typescript
 * const framework: TestFramework = {
 *   name: 'pytest',
 *   fileExtension: '_test.py',
 *   importPattern: 'import pytest'
 * }
 * ```
 */
export interface TestFramework {
  name: string
  fileExtension: string
  importPattern: string
}

/**
 * Language adapter interface.
 *
 * Transforms generic agent output into language-specific, production-ready code.
 * Each language (Python, Go, Rust, TypeScript) implements this interface to provide
 * language-specific code generation, formatting, and project structure.
 *
 * @interface LanguageAdapter
 * @property {string} language - The target programming language
 *
 * @example
 * ```typescript
 * class PythonAdapter implements LanguageAdapter {
 *   readonly language = 'python'
 *
 *   async adaptCode(output: Record<string, unknown>, context: AdapterProjectContext) {
 *     // Transform to Python code
 *   }
 * }
 * ```
 */
export interface LanguageAdapter {
  readonly language: 'python' | 'go' | 'rust' | 'typescript'

  /**
   * Adapt generic code to language-specific implementation.
   *
   * Takes generic agent output and transforms it into production-ready code
   * following language-specific conventions, patterns, and best practices.
   *
   * @param {Record<string, unknown>} agentOutput - Generic output from agent
   * @param {AdapterProjectContext} context - Project context for adaptation
   * @returns {Promise<AdaptedCode>} Complete adapted code with file structure
   */
  adaptCode(agentOutput: Record<string, unknown>, context: AdapterProjectContext): Promise<AdaptedCode>

  /**
   * Get project structure for this language.
   *
   * Returns the standard directory structure and configuration files
   * for the specified framework in this language.
   *
   * @param {string} framework - Framework name (e.g., 'fastapi', 'gin', 'axum')
   * @returns {FileStructure} Directory and config file structure
   */
  getProjectStructure(framework: string): FileStructure

  /**
   * Get testing framework details.
   *
   * Returns information about the default testing framework for this language,
   * including file naming conventions and import patterns.
   *
   * @returns {TestFramework} Testing framework configuration
   */
  getTestingFramework(): TestFramework

  /**
   * Format code according to language conventions.
   *
   * Applies language-specific formatting rules (e.g., black for Python,
   * gofmt for Go, rustfmt for Rust, prettier for TypeScript).
   *
   * @param {string} code - Raw code to format
   * @returns {Promise<string>} Formatted code
   */
  formatCode(code: string): Promise<string>
}
