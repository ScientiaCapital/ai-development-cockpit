/**
 * AI Development Cockpit - Orchestrator Type Definitions
 *
 * Core types for the LangGraph-based agent orchestration system
 * that transforms noobs into software engineering managers
 */

// ============================================================================
// Project State (LangGraph State)
// ============================================================================

export interface ProjectState {
  // User input
  userRequest: string
  userId: string
  organizationId: string

  // Project metadata
  projectId: string
  projectName: string
  createdAt: string

  // Architecture phase
  architecture?: ProjectArchitecture
  architectureApproved?: boolean
  architectureRevisionNotes?: string

  // Development phase
  agentsSpawned: string[]
  agentOutputs: Record<string, AgentOutput>

  // Testing phase
  testResults?: TestResults
  testsApproved?: boolean

  // Deployment phase
  deploymentConfig?: DeploymentConfig
  deploymentApproved?: boolean
  deploymentStatus?: 'pending' | 'deploying' | 'deployed' | 'failed'

  // Feedback & learning
  feedback?: ProjectFeedback

  // Human-in-the-loop gates
  needsApproval?: 'architecture' | 'deployment' | 'tests' | null
  userApproved?: boolean

  // Error handling
  errors: string[]
  retryCount: number
}

// ============================================================================
// Architecture Types
// ============================================================================

export interface ProjectArchitecture {
  summary: string
  stack: TechnologyStack
  fileStructure: FileStructure[]
  databaseSchema?: DatabaseSchema
  apiEndpoints?: ApiEndpoint[]
  deploymentStrategy: DeploymentStrategy
  estimatedComplexity: 'simple' | 'medium' | 'complex'
  estimatedTime: string
  estimatedCost: number
}

export interface TechnologyStack {
  frontend?: string[]
  backend?: string[]
  database?: string[]
  infrastructure?: string[]
  testing?: string[]
}

export interface FileStructure {
  path: string
  type: 'file' | 'directory'
  purpose: string
  agent: string // Which agent will create this
}

export interface DatabaseSchema {
  tables: DatabaseTable[]
  relationships: string[]
}

export interface DatabaseTable {
  name: string
  columns: DatabaseColumn[]
  indexes: string[]
}

export interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  default?: string
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  purpose: string
  authentication: boolean
}

export interface DeploymentStrategy {
  platform: 'vercel' | 'netlify' | 'aws' | 'other'
  environment: 'serverless' | 'container' | 'vm'
  cicd: boolean
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentType =
  | 'CodeArchitect'
  | 'BackendDeveloper'
  | 'FrontendDeveloper'
  | 'Tester'
  | 'DevOpsEngineer'
  | 'DatabaseArchitect'
  | 'SecurityAuditor'
  | 'UIUXDesigner'

export interface AgentConfig {
  type: AgentType
  name: string
  description: string
  capabilities: string[]
  costProfile: 'simple' | 'medium' | 'complex' // For cost optimizer routing
}

export interface AgentOutput {
  agentType: AgentType
  success: boolean
  filesCreated: string[]
  filesModified: string[]
  notes: string
  warnings: string[]
  errors: string[]
  duration: number
  cost: number
}

export interface AgentTask {
  taskId: string
  agentType: AgentType
  description: string
  files: string[]
  dependencies: string[] // Other task IDs this depends on
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
}

// ============================================================================
// Testing Types
// ============================================================================

export interface TestResults {
  unitTests: TestSuite
  integrationTests: TestSuite
  e2eTests?: TestSuite
  coverage?: CoverageReport
  overallStatus: 'passed' | 'failed'
}

export interface TestSuite {
  name: string
  passed: number
  failed: number
  skipped: number
  duration: number
  failures: TestFailure[]
}

export interface TestFailure {
  test: string
  error: string
  stackTrace: string
}

export interface CoverageReport {
  lines: number
  functions: number
  branches: number
  statements: number
}

// ============================================================================
// Deployment Types
// ============================================================================

export interface DeploymentConfig {
  platform: string
  environment: Record<string, string>
  buildCommand: string
  startCommand: string
  domain?: string
}

// ============================================================================
// Feedback & Learning Types
// ============================================================================

export interface ProjectFeedback {
  projectId: string
  userRequest: string
  agentsSpawned: string[]
  decisions: Decision[]
  buildTime: number
  testsPass: boolean
  deploymentSuccess: boolean
  userRating?: number
  userComments?: string
  patterns: {
    successful: string[]
    failed: string[]
  }
  createdAt: string
}

export interface Decision {
  agent: string
  decision: string
  successful: boolean
  reasoning: string
}

// ============================================================================
// Cost Optimizer Integration Types
// ============================================================================

export interface CostOptimizerRequest {
  prompt: string
  complexity: 'simple' | 'medium' | 'complex'
  agentType: string
  organizationId: string
  maxTokens?: number
  temperature?: number
}

export interface CostOptimizerResponse {
  content: string
  provider: string
  model: string
  cost: number
  tokens: {
    input: number
    output: number
  }
  duration: number
}

// ============================================================================
// Orchestrator Context
// ============================================================================

export interface ProjectContext {
  state: ProjectState
  organizationId: string
  userId: string
  costOptimizerUrl: string
  costOptimizerApiKey: string
}
