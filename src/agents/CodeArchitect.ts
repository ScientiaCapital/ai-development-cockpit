/**
 * Code Architect Agent
 *
 * The system designer who analyzes requirements and creates
 * comprehensive architecture plans for the project
 */

import { BaseAgent } from './BaseAgent'
import { AgentOutput, ProjectArchitecture, ProjectContext } from '@/types/orchestrator'

export class CodeArchitect extends BaseAgent {
  constructor(context: ProjectContext) {
    super('CodeArchitect', context)
  }

  async execute(): Promise<AgentOutput> {
    const startTime = Date.now()
    this.addNote(`Starting architecture design for: "${this.context.state.userRequest}"`)

    try {
      // Step 1: Analyze the user request
      this.addNote('Analyzing requirements...')
      const analysis = await this.analyzeRequirements()

      // Step 2: Design the architecture
      this.addNote('Designing system architecture...')
      const architecture = await this.designArchitecture(analysis)

      // Step 3: Create file structure plan
      this.addNote('Planning file structure...')
      const fileStructure = await this.planFileStructure(architecture)

      // Step 4: Estimate complexity and cost
      this.addNote('Estimating project complexity...')
      const complexity = await this.estimateComplexity(architecture)

      // Compile final architecture
      const finalArchitecture: ProjectArchitecture = {
        ...architecture,
        summary: architecture.summary || 'Architecture design in progress',
        stack: architecture.stack || { frontend: [], backend: [], database: [], infrastructure: [], testing: [] },
        deploymentStrategy: architecture.deploymentStrategy || { platform: 'other', environment: 'serverless', cicd: false },
        fileStructure,
        estimatedComplexity: complexity.level,
        estimatedTime: complexity.time,
        estimatedCost: complexity.cost
      }

      // Store in context (will be saved to state)
      this.context.state.architecture = finalArchitecture

      this.addNote(
        `Architecture complete! Estimated complexity: ${complexity.level}, time: ${complexity.time}, cost: $${complexity.cost.toFixed(2)}`
      )
    } catch (error) {
      this.addError(`Failed to create architecture: ${error}`)
    }

    this.output.duration = Date.now() - startTime
    return this.getOutput()
  }

  private async analyzeRequirements(): Promise<string> {
    const prompt = `You are a senior software architect. Analyze the following user request and extract:
1. Core features needed
2. Technical requirements
3. Potential challenges
4. Recommended technology stack

User Request: "${this.context.state.userRequest}"

Provide a comprehensive analysis in JSON format.`

    return this.think({
      prompt,
      complexity: 'medium',
      maxTokens: 2000
    })
  }

  private async designArchitecture(analysis: string): Promise<Partial<ProjectArchitecture>> {
    const prompt = `Based on this analysis:
${analysis}

Design a complete system architecture including:
1. Technology stack (frontend, backend, database, infrastructure)
2. Database schema (if needed)
3. API endpoints (if needed)
4. Deployment strategy

Return as JSON matching this structure:
{
  "summary": "Brief architecture overview",
  "stack": {
    "frontend": ["Next.js", "React", "Tailwind"],
    "backend": ["Node.js", "API Routes"],
    "database": ["PostgreSQL", "Prisma"],
    "infrastructure": ["Vercel"],
    "testing": ["Jest", "Playwright"]
  },
  "databaseSchema": { ... },
  "apiEndpoints": [ ... ],
  "deploymentStrategy": { ... }
}`

    const response = await this.think({
      prompt,
      complexity: 'complex',
      maxTokens: 3000
    })

    return JSON.parse(response)
  }

  private async planFileStructure(architecture: Partial<ProjectArchitecture>): Promise<any[]> {
    const prompt = `Given this architecture:
${JSON.stringify(architecture, null, 2)}

Create a complete file structure plan. For each file/directory, specify:
- path: The file/directory path
- type: "file" or "directory"
- purpose: What this file does
- agent: Which agent should create it (CodeArchitect, BackendDeveloper, FrontendDeveloper, Tester, DevOpsEngineer)

Return as JSON array.`

    const response = await this.think({
      prompt,
      complexity: 'medium',
      maxTokens: 2000
    })

    return JSON.parse(response)
  }

  private async estimateComplexity(architecture: Partial<ProjectArchitecture>): Promise<{
    level: 'simple' | 'medium' | 'complex'
    time: string
    cost: number
  }> {
    const prompt = `Analyze this architecture and estimate:
${JSON.stringify(architecture, null, 2)}

Provide:
1. Complexity level (simple/medium/complex)
2. Estimated development time (e.g., "2-3 hours", "1-2 days", "1-2 weeks")
3. Estimated AI cost in USD (based on AI calls needed)

Return as JSON: { "level": "medium", "time": "4-6 hours", "cost": 2.50 }`

    const response = await this.think({
      prompt,
      complexity: 'simple',
      maxTokens: 500
    })

    return JSON.parse(response)
  }
}
