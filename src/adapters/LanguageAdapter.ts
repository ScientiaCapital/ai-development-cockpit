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
