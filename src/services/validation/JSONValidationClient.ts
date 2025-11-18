/**
 * JSON Validation Client
 *
 * TypeScript client for the Python JSON validator service.
 * Validates orchestrator plans and agent outputs before execution.
 */

export interface ValidationResponse {
  valid: boolean
  errors: string[]
  validated_data: any
}

export interface GeneratedFile {
  path: string
  content: string
  description: string
}

export interface AgentTask {
  agent_type: 'CodeArchitect' | 'BackendDeveloper' | 'FrontendDeveloper' | 'Tester' | 'DevOpsEngineer'
  description: string
  dependencies: string[]
  estimated_duration: number
}

export interface OrchestratorPlan {
  project_name: string
  language: 'typescript' | 'python' | 'go' | 'rust'
  framework: string
  tasks: AgentTask[]
  total_estimated_time: number
  created_at?: string
}

export interface AgentOutput {
  agent_type: string
  files_created: GeneratedFile[]
  files_modified?: GeneratedFile[]
  warnings?: string[]
  errors?: string[]
  metadata?: Record<string, any>
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class JSONValidationClient {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl
  }

  /**
   * Validate an orchestrator plan
   */
  async validatePlan(data: OrchestratorPlan): Promise<ValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/validate/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ValidationResponse = await response.json()

      if (!result.valid) {
        throw new ValidationError(
          'Plan validation failed',
          result.errors
        )
      }

      return result
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to validate plan: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Validate agent output
   */
  async validateAgentOutput(data: AgentOutput): Promise<ValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/validate/agent-output`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ValidationResponse = await response.json()

      if (!result.valid) {
        throw new ValidationError(
          'Agent output validation failed',
          result.errors
        )
      }

      return result
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to validate agent output: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Validate a generated file
   */
  async validateFile(data: GeneratedFile): Promise<ValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/validate/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ValidationResponse = await response.json()

      if (!result.valid) {
        throw new ValidationError(
          'File validation failed',
          result.errors
        )
      }

      return result
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to validate file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Check if the validation service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET'
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.status === 'healthy'
    } catch {
      return false
    }
  }

  /**
   * Get service information
   */
  async getServiceInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      throw new Error(`Failed to get service info: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Default instance using localhost
 */
export const validationClient = new JSONValidationClient(
  process.env.NEXT_PUBLIC_VALIDATOR_URL || 'http://localhost:8001'
)
