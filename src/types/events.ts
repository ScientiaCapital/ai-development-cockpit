export enum AgentEvent {
  // Review phase
  ReviewStarted = 'review:started',
  ReviewProgress = 'review:progress',
  ReviewComplete = 'review:complete',

  // Planning phase
  PlanGenerating = 'plan:generating',
  PlanGenerated = 'plan:generated',

  // Execution phase
  AgentStarted = 'agent:started',
  AgentProgress = 'agent:progress',
  CodeGenerated = 'code:generated',
  FilesCreated = 'files:created',
  FilesModified = 'files:modified',

  // Testing phase
  TestsStarted = 'tests:started',
  TestsComplete = 'tests:complete',

  // Completion phase
  PhaseComplete = 'phase:complete',
  ProjectComplete = 'project:complete',

  // Approval gates
  ApprovalRequired = 'approval:required',
  ApprovalGranted = 'approval:granted',
  ApprovalDenied = 'approval:denied',

  // Errors
  Error = 'error',
}

export interface EventData {
  [AgentEvent.ReviewStarted]: { projectId: string; repoPath: string }
  [AgentEvent.ReviewProgress]: { projectId: string; progress: number; currentFile: string }
  [AgentEvent.ReviewComplete]: { projectId: string; review: CodebaseReview }

  [AgentEvent.PlanGenerating]: { projectId: string }
  [AgentEvent.PlanGenerated]: { projectId: string; plan: ExecutionPlan }

  [AgentEvent.AgentStarted]: { projectId: string; agentType: string; agentId: string }
  [AgentEvent.AgentProgress]: { projectId: string; agentId: string; status: string }
  [AgentEvent.CodeGenerated]: { projectId: string; agentId: string; files: string[] }
  [AgentEvent.FilesCreated]: { projectId: string; files: string[] }
  [AgentEvent.FilesModified]: { projectId: string; files: string[] }

  [AgentEvent.TestsStarted]: { projectId: string }
  [AgentEvent.TestsComplete]: { projectId: string; passed: boolean; results: any }

  [AgentEvent.PhaseComplete]: { projectId: string; phase: string }
  [AgentEvent.ProjectComplete]: { projectId: string; success: boolean }

  [AgentEvent.ApprovalRequired]: { projectId: string; phase: string; message: string }
  [AgentEvent.ApprovalGranted]: { projectId: string; phase: string }
  [AgentEvent.ApprovalDenied]: { projectId: string; phase: string; reason: string }

  [AgentEvent.Error]: { projectId: string; error: string; context?: any }
}

// Placeholder types (will be implemented in later tasks)
export interface CodebaseReview {
  summary: string
  architecture: any
  existingAgents: string[]
  patterns: any
}

export interface ExecutionPlan {
  phases: PlanPhase[]
  totalEstimatedTime: number
  totalEstimatedCost: number
}

export interface PlanPhase {
  id: string
  name: string
  tasks: PlanTask[]
  estimatedTime: number
  estimatedCost: number
}

export interface PlanTask {
  id: string
  description: string
  files: string[]
  estimatedTime: number
}
