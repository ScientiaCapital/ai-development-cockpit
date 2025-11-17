/**
 * DevOps Engineer Agent
 *
 * Generates deployment configuration files including Dockerfile, Vercel config,
 * GitHub Actions workflows, and other infrastructure-as-code. Follows BaseAgent
 * pattern with cost-optimizer integration for efficient AI usage.
 *
 * @module agents/DevOpsEngineer
 */

import { BaseAgent } from './BaseAgent'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'
import { AgentOutput, ProjectContext } from '@/types/orchestrator'

export interface DevOpsEngineerContext {
  projectId: string
  userRequest: string
  workspace: ProjectWorkspace
  deploymentTarget: 'vercel' | 'docker' | 'github-actions' | 'all'
  framework: string
}

export class DevOpsEngineer extends BaseAgent {
  agentType = 'DevOpsEngineer' as const

  private workspace: ProjectWorkspace
  private userRequest: string
  private deploymentTarget: 'vercel' | 'docker' | 'github-actions' | 'all'
  private framework: string

  constructor(context: DevOpsEngineerContext) {
    // Create a minimal ProjectContext for BaseAgent
    const projectContext: ProjectContext = {
      state: {
        userRequest: context.userRequest,
        userId: 'test-user',
        organizationId: 'test-org',
        projectId: context.projectId,
        projectName: context.projectId,
        createdAt: new Date().toISOString(),
        agentsSpawned: [],
        agentOutputs: {},
        errors: [],
        retryCount: 0,
      },
      organizationId: 'test-org',
      userId: 'test-user',
      costOptimizerUrl: process.env.COST_OPTIMIZER_URL || 'http://localhost:3001',
      costOptimizerApiKey: process.env.COST_OPTIMIZER_API_KEY || 'test-key',
    }

    super('DevOpsEngineer', projectContext)
    this.workspace = context.workspace
    this.userRequest = context.userRequest
    this.deploymentTarget = context.deploymentTarget
    this.framework = context.framework
  }

  async execute(): Promise<AgentOutput> {
    const startTime = Date.now()

    try {
      console.log(`🚀 DevOpsEngineer: Generating ${this.deploymentTarget} configs...`)

      // Build prompt for config generation
      const prompt = this.buildPrompt()
      const response = await this.think({ prompt, complexity: 'medium' })

      // Parse response and generate config files
      const files = await this.generateFiles(response)

      console.log(`✅ DevOpsEngineer: Generated ${files.length} config files`)

      this.output.duration = Date.now() - startTime

      return this.getOutput()
    } catch (error) {
      console.error('[DevOpsEngineer] Error:', error)
      this.addError(`DevOpsEngineer execution failed: ${error}`)
      this.output.duration = Date.now() - startTime
      return this.getOutput()
    }
  }

  private buildPrompt(): string {
    const targetInstructions = {
      vercel: `Generate vercel.json configuration for ${this.framework} deployment`,
      docker: `Generate Dockerfile and docker-compose.yml for ${this.framework}`,
      'github-actions': `Generate GitHub Actions workflow (.github/workflows/deploy.yml) for ${this.framework}`,
      all: `Generate complete deployment setup (Dockerfile, vercel.json, GitHub Actions) for ${this.framework}`
    }

    return `You are an expert DevOps engineer. Generate deployment configuration files:

**User Request:** ${this.userRequest}

**Deployment Target:** ${this.deploymentTarget}
**Framework:** ${this.framework}

**Task:** ${targetInstructions[this.deploymentTarget]}

**Requirements:**
1. Follow best practices for ${this.deploymentTarget}
2. Include environment variable management
3. Optimize for production builds
4. Include health checks where applicable
5. Add proper .dockerignore or .vercelignore
6. Include clear comments
7. Enable caching for faster builds

**Output Format:**
Return a JSON array of configuration files:
[
  {
    "path": "path/to/config/file",
    "content": "// Full config content here..."
  }
]

Generate production-ready configs with security best practices.`
  }

  private async generateFiles(response: string): Promise<string[]> {
    try {
      // Try to parse JSON response
      const files = JSON.parse(response)
      const createdFiles: string[] = []

      for (const file of files) {
        await this.workspace.writeFile(file.path, file.content)
        createdFiles.push(file.path)

        // Track file creation using BaseAgent method
        this.addFileCreated(file.path)
      }

      return createdFiles
    } catch (error) {
      // If JSON parsing fails, create example config files
      console.warn('[DevOpsEngineer] Failed to parse response, creating example config files')
      this.addWarning('Failed to parse AI response, created example config files instead')

      const exampleFiles = this.generateExampleConfigs()
      const createdFiles: string[] = []

      for (const file of exampleFiles) {
        await this.workspace.writeFile(file.path, file.content)
        createdFiles.push(file.path)
        this.addFileCreated(file.path)
      }

      return createdFiles
    }
  }

  private generateExampleConfigs(): Array<{ path: string; content: string }> {
    const configs: Array<{ path: string; content: string }> = []

    if (this.deploymentTarget === 'vercel' || this.deploymentTarget === 'all') {
      configs.push({
        path: 'vercel.json',
        content: `{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
`
      })
    }

    if (this.deploymentTarget === 'docker' || this.deploymentTarget === 'all') {
      configs.push({
        path: 'Dockerfile',
        content: `# Generated by DevOpsEngineer
# Framework: ${this.framework}

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
`
      })

      configs.push({
        path: '.dockerignore',
        content: `node_modules
.next
.git
.env.local
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`
      })
    }

    if (this.deploymentTarget === 'github-actions' || this.deploymentTarget === 'all') {
      configs.push({
        path: '.github/workflows/deploy.yml',
        content: `# Generated by DevOpsEngineer
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`
      })
    }

    return configs
  }
}
