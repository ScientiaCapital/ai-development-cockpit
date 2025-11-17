import { ORCHESTRATOR_CONFIG, getOrchestratorConfig } from '@/config/orchestrator.config'

describe('OrchestratorConfig', () => {
  it('should load default orchestrator model from config', () => {
    const config = getOrchestratorConfig()
    expect(config.model).toBeDefined()
    expect(config.provider).toBeDefined()
  })

  it('should allow env var override for model', () => {
    process.env.ORCHESTRATOR_MODEL = 'deepseek-r1'
    const config = getOrchestratorConfig()
    expect(config.model).toBe('deepseek-r1')
  })

  it('should have valid approval gates configuration', () => {
    const config = getOrchestratorConfig()
    expect(config.requireApproval).toBeDefined()
    expect(typeof config.requireApproval.beforeBuild).toBe('boolean')
    expect(typeof config.requireApproval.beforeTests).toBe('boolean')
    expect(typeof config.requireApproval.beforeDeploy).toBe('boolean')
  })
})
