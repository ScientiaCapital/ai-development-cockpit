export type OrchestratorModel =
  | 'claude-sonnet-4.5'
  | 'claude-opus-4'
  | 'deepseek-r1'
  | 'kimi-k1.5'
  | 'gpt-4-turbo'
  | 'llama-3.3-70b'
  | 'qwen-2.5-coder-32b'

export type OrchestratorProvider =
  | 'anthropic'
  | 'openrouter'
  | 'cerebras'

export interface OrchestratorConfig {
  model: OrchestratorModel
  provider: OrchestratorProvider
  temperature: number
  maxTokens: number
  pollingIntervalMs: number
  requireApproval: {
    beforeBuild: boolean
    beforeTests: boolean
    beforeDeploy: boolean
  }
}

export const ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  model: (process.env.ORCHESTRATOR_MODEL as OrchestratorModel) || 'claude-sonnet-4.5',
  provider: (process.env.ORCHESTRATOR_PROVIDER as OrchestratorProvider) || 'anthropic',
  temperature: 0.1,
  maxTokens: 4000,
  pollingIntervalMs: 5000,
  requireApproval: {
    beforeBuild: false,
    beforeTests: false,
    beforeDeploy: true,
  }
}

export function getOrchestratorConfig(): OrchestratorConfig {
  // Return a fresh config object that reads current env vars
  return {
    model: (process.env.ORCHESTRATOR_MODEL as OrchestratorModel) || 'claude-sonnet-4.5',
    provider: (process.env.ORCHESTRATOR_PROVIDER as OrchestratorProvider) || 'anthropic',
    temperature: 0.1,
    maxTokens: 4000,
    pollingIntervalMs: 5000,
    requireApproval: {
      beforeBuild: false,
      beforeTests: false,
      beforeDeploy: true,
    }
  }
}

export function updateOrchestratorModel(model: OrchestratorModel): void {
  ORCHESTRATOR_CONFIG.model = model
  // For persistence, we'll update .env file via CLI script
}
