/**
 * Base Agent Class
 *
 * Abstract class that all AI agents extend
 * Provides cost-optimized AI thinking via the ai-cost-optimizer service
 */

import { AgentType, AgentOutput, ProjectContext } from '@/types/orchestrator'

export interface AgentThinkOptions {
  prompt: string
  complexity: 'simple' | 'medium' | 'complex'
  maxTokens?: number
  temperature?: number
}

export abstract class BaseAgent {
  protected agentType: AgentType
  protected context: ProjectContext
  protected output: Partial<AgentOutput>

  constructor(agentType: AgentType, context: ProjectContext) {
    this.agentType = agentType
    this.context = context
    this.output = {
      agentType,
      filesCreated: [],
      filesModified: [],
      warnings: [],
      errors: [],
      notes: '',
      duration: 0,
      cost: 0
    }
  }

  /**
   * Call the ai-cost-optimizer service for AI reasoning
   * This routes requests to the most cost-effective provider
   */
  protected async think(options: AgentThinkOptions): Promise<string> {
    const startTime = Date.now()

    try {
      const response = await fetch(
        `${this.context.costOptimizerUrl}/api/optimize/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.context.costOptimizerApiKey}`
          },
          body: JSON.stringify({
            prompt: options.prompt,
            complexity: options.complexity,
            agentType: this.agentType,
            organizationId: this.context.organizationId,
            maxTokens: options.maxTokens,
            temperature: options.temperature || 0.7
          })
        }
      )

      if (!response.ok) {
        throw new Error(
          `Cost optimizer error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      // Track cost
      this.output.cost = (this.output.cost || 0) + data.cost

      console.log(
        `💭 ${this.agentType} thinking via ${data.provider}/${data.model} ($${data.cost.toFixed(4)})`
      )

      return data.content
    } catch (error) {
      const errorMsg = `Failed to call cost optimizer: ${error}`
      this.addError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      this.output.duration = (this.output.duration || 0) + (Date.now() - startTime)
    }
  }

  /**
   * Add a file to the created files list
   */
  protected addFileCreated(filePath: string): void {
    this.output.filesCreated = this.output.filesCreated || []
    this.output.filesCreated.push(filePath)
  }

  /**
   * Add a file to the modified files list
   */
  protected addFileModified(filePath: string): void {
    this.output.filesModified = this.output.filesModified || []
    this.output.filesModified.push(filePath)
  }

  /**
   * Add a warning
   */
  protected addWarning(warning: string): void {
    this.output.warnings = this.output.warnings || []
    this.output.warnings.push(warning)
    console.warn(`⚠️ ${this.agentType}: ${warning}`)
  }

  /**
   * Add an error
   */
  protected addError(error: string): void {
    this.output.errors = this.output.errors || []
    this.output.errors.push(error)
    console.error(`❌ ${this.agentType}: ${error}`)
  }

  /**
   * Add a note
   */
  protected addNote(note: string): void {
    this.output.notes = this.output.notes || ''
    this.output.notes += note + '\n'
  }

  /**
   * Get the final output
   */
  getOutput(): AgentOutput {
    return {
      ...this.output,
      success: (this.output.errors?.length || 0) === 0
    } as AgentOutput
  }

  /**
   * Execute the agent's task
   * Must be implemented by all agents
   */
  abstract execute(): Promise<AgentOutput>
}
