# Agent Orchestration System MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Review → Plan → Execute orchestration system allowing users to point at a codebase, request features, and watch AI agents build them with real-time progress tracking.

**Architecture:** Event-driven orchestration using LangGraph StateGraph for workflow management, TypeScript EventEmitter for agent communication, and Supabase Realtime for dashboard updates. Orchestrator reviews codebase (using Explore agent pattern), generates execution plan, spawns specialized agents (starting with BackendDeveloper), and coordinates file generation in temporary workspaces.

**Tech Stack:** Next.js 15, TypeScript, LangGraph, Supabase, Cost Optimizer (Cerebras/OpenRouter/Claude), Radix UI

---

## Prerequisites

**Before starting:**
- ✅ Worktree created at `~/.config/superpowers/worktrees/ai-development-cockpit/agent-orchestration-system`
- ✅ Dependencies installed (npm install completed)
- ✅ Design document reviewed at `docs/plans/2025-11-17-agent-orchestration-system-design.md`

**Required Skills:**
- @superpowers:test-driven-development - Write tests first, verify failures, implement minimally
- @superpowers:verification-before-completion - Verify commands run successfully before claiming done

---

## Task 1: Orchestrator Configuration System

**Goal:** Allow easy orchestrator model switching via env vars and CLI command

**Files:**
- Create: `src/config/orchestrator.config.ts`
- Create: `scripts/set-orchestrator.ts`
- Modify: `package.json` (add script)
- Test: `tests/config/orchestrator.config.test.ts`

### Step 1: Write failing test for orchestrator config

**File:** `tests/config/orchestrator.config.test.ts`

```typescript
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
```

### Step 2: Run test to verify it fails

```bash
cd ~/.config/superpowers/worktrees/ai-development-cockpit/agent-orchestration-system
npm test -- tests/config/orchestrator.config.test.ts
```

**Expected:** FAIL with "Cannot find module '@/config/orchestrator.config'"

### Step 3: Implement orchestrator config

**File:** `src/config/orchestrator.config.ts`

```typescript
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
  return ORCHESTRATOR_CONFIG
}

export function updateOrchestratorModel(model: OrchestratorModel): void {
  ORCHESTRATOR_CONFIG.model = model
  // For persistence, we'll update .env file via CLI script
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/config/orchestrator.config.test.ts
```

**Expected:** PASS (3 tests)

### Step 5: Create CLI script for model switching

**File:** `scripts/set-orchestrator.ts`

```typescript
#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const validModels = [
  'claude-sonnet-4.5',
  'claude-opus-4',
  'deepseek-r1',
  'kimi-k1.5',
  'gpt-4-turbo',
  'llama-3.3-70b',
  'qwen-2.5-coder-32b'
]

const model = process.argv[2]

if (!model) {
  console.error('Usage: npm run orchestrator:use <model>')
  console.log('Available models:')
  validModels.forEach(m => console.log(`  - ${m}`))
  process.exit(1)
}

if (!validModels.includes(model)) {
  console.error(`Invalid model: ${model}`)
  console.log('Available models:')
  validModels.forEach(m => console.log(`  - ${m}`))
  process.exit(1)
}

// Update .env file
const envPath = path.join(process.cwd(), '.env')
const envExamplePath = path.join(process.cwd(), '.env.example')

let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8')
} else if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf-8')
}

// Update or add ORCHESTRATOR_MODEL
const modelRegex = /^ORCHESTRATOR_MODEL=.*/m
if (modelRegex.test(envContent)) {
  envContent = envContent.replace(modelRegex, `ORCHESTRATOR_MODEL=${model}`)
} else {
  envContent += `\nORCHESTRATOR_MODEL=${model}\n`
}

fs.writeFileSync(envPath, envContent)

console.log(`✅ Orchestrator model set to: ${model}`)
console.log(`📝 Updated .env file`)
console.log(`🔄 Restart your dev server to apply changes`)
```

### Step 6: Add npm script

**File:** `package.json` (add to scripts section)

```json
{
  "scripts": {
    "orchestrator:use": "tsx scripts/set-orchestrator.ts"
  }
}
```

### Step 7: Test CLI command

```bash
npm run orchestrator:use claude-sonnet-4.5
```

**Expected:**
```
✅ Orchestrator model set to: claude-sonnet-4.5
📝 Updated .env file
🔄 Restart your dev server to apply changes
```

### Step 8: Commit Task 1

```bash
git add src/config/orchestrator.config.ts
git add tests/config/orchestrator.config.test.ts
git add scripts/set-orchestrator.ts
git add package.json
git commit -m "feat: add orchestrator configuration system with CLI switching

- Created OrchestratorConfig interface with model/provider types
- Added getOrchestratorConfig() for runtime config access
- Implemented CLI command: npm run orchestrator:use <model>
- Supports 7 models: Claude Sonnet/Opus, DeepSeek, Kimi, GPT-4, Llama, Qwen
- Tests verify config loading and env var overrides

Tests: 3 passing"
```

---

## Task 2: Event Bus for Agent Communication

**Goal:** Create typed event system for orchestrator and agents to communicate

**Files:**
- Create: `src/orchestrator/EventBus.ts`
- Create: `src/types/events.ts`
- Test: `tests/orchestrator/EventBus.test.ts`

### Step 1: Write failing test for EventBus

**File:** `tests/orchestrator/EventBus.test.ts`

```typescript
import { EventBus, AgentEvent } from '@/orchestrator/EventBus'

describe('EventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  it('should emit and receive events', () => {
    const handler = jest.fn()
    eventBus.on(AgentEvent.ReviewStarted, handler)

    const data = { projectId: 'test-123' }
    eventBus.emit(AgentEvent.ReviewStarted, data)

    expect(handler).toHaveBeenCalledWith(data)
  })

  it('should support multiple listeners for same event', () => {
    const handler1 = jest.fn()
    const handler2 = jest.fn()

    eventBus.on(AgentEvent.CodeGenerated, handler1)
    eventBus.on(AgentEvent.CodeGenerated, handler2)

    const data = { files: ['test.ts'] }
    eventBus.emit(AgentEvent.CodeGenerated, data)

    expect(handler1).toHaveBeenCalledWith(data)
    expect(handler2).toHaveBeenCalledWith(data)
  })

  it('should unsubscribe listeners', () => {
    const handler = jest.fn()
    eventBus.on(AgentEvent.AgentStarted, handler)
    eventBus.off(AgentEvent.AgentStarted, handler)

    eventBus.emit(AgentEvent.AgentStarted, {})

    expect(handler).not.toHaveBeenCalled()
  })
})
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/orchestrator/EventBus.test.ts
```

**Expected:** FAIL with "Cannot find module '@/orchestrator/EventBus'"

### Step 3: Define event types

**File:** `src/types/events.ts`

```typescript
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
```

### Step 4: Implement EventBus

**File:** `src/orchestrator/EventBus.ts`

```typescript
import { EventEmitter } from 'events'
import { AgentEvent, EventData } from '@/types/events'

export { AgentEvent } from '@/types/events'

export class EventBus extends EventEmitter {
  private static instance: EventBus

  private constructor() {
    super()
    this.setMaxListeners(100) // Support many concurrent agents
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  emit<E extends AgentEvent>(event: E, data: EventData[E]): boolean {
    console.log(`[EventBus] ${event}`, data)
    return super.emit(event, data)
  }

  on<E extends AgentEvent>(
    event: E,
    listener: (data: EventData[E]) => void
  ): this {
    return super.on(event, listener)
  }

  off<E extends AgentEvent>(
    event: E,
    listener: (data: EventData[E]) => void
  ): this {
    return super.off(event, listener)
  }

  once<E extends AgentEvent>(
    event: E,
    listener: (data: EventData[E]) => void
  ): this {
    return super.once(event, listener)
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance()
```

### Step 5: Run test to verify it passes

```bash
npm test -- tests/orchestrator/EventBus.test.ts
```

**Expected:** PASS (3 tests)

### Step 6: Commit Task 2

```bash
git add src/orchestrator/EventBus.ts
git add src/types/events.ts
git add tests/orchestrator/EventBus.test.ts
git commit -m "feat: implement typed event bus for agent communication

- Created EventBus singleton extending Node EventEmitter
- Defined 16 event types for orchestration lifecycle
- Added TypeScript event data interfaces for type safety
- Supports review, planning, execution, testing, and approval phases
- Singleton pattern ensures single event bus instance

Tests: 3 passing"
```

---

## Task 3: Project Workspace Service (Temp Directory)

**Goal:** Create service to manage temporary project workspaces for file generation (git worktrees in later phase)

**Files:**
- Create: `src/services/workspace/ProjectWorkspace.ts`
- Test: `tests/services/workspace/ProjectWorkspace.test.ts`

### Step 1: Write failing test for ProjectWorkspace

**File:** `tests/services/workspace/ProjectWorkspace.test.ts`

```typescript
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('ProjectWorkspace', () => {
  let workspace: ProjectWorkspace
  const projectId = 'test-project-123'

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup()
    }
  })

  it('should create temporary workspace directory', async () => {
    workspace = await ProjectWorkspace.create(projectId)

    expect(workspace.rootDir).toContain(projectId)
    const exists = await fs.access(workspace.rootDir).then(() => true).catch(() => false)
    expect(exists).toBe(true)
  })

  it('should write and read files', async () => {
    workspace = await ProjectWorkspace.create(projectId)

    await workspace.writeFile('src/test.ts', 'export const foo = "bar"')
    const content = await workspace.readFile('src/test.ts')

    expect(content).toBe('export const foo = "bar"')
  })

  it('should list all files', async () => {
    workspace = await ProjectWorkspace.create(projectId)

    await workspace.writeFile('src/a.ts', 'a')
    await workspace.writeFile('src/b.ts', 'b')
    await workspace.writeFile('test/c.test.ts', 'c')

    const files = await workspace.listFiles()

    expect(files).toContain('src/a.ts')
    expect(files).toContain('src/b.ts')
    expect(files).toContain('test/c.test.ts')
  })

  it('should cleanup workspace', async () => {
    workspace = await ProjectWorkspace.create(projectId)
    const workspaceDir = workspace.rootDir

    await workspace.cleanup()

    const exists = await fs.access(workspaceDir).then(() => true).catch(() => false)
    expect(exists).toBe(false)
  })
})
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/services/workspace/ProjectWorkspace.test.ts
```

**Expected:** FAIL with "Cannot find module '@/services/workspace/ProjectWorkspace'"

### Step 3: Implement ProjectWorkspace

**File:** `src/services/workspace/ProjectWorkspace.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export class ProjectWorkspace {
  private constructor(
    public readonly projectId: string,
    public readonly rootDir: string
  ) {}

  static async create(projectId: string): Promise<ProjectWorkspace> {
    const rootDir = path.join(os.tmpdir(), 'ai-cockpit-projects', projectId)
    await fs.mkdir(rootDir, { recursive: true })

    return new ProjectWorkspace(projectId, rootDir)
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.rootDir, relativePath)
    const dir = path.dirname(fullPath)

    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true })

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.rootDir, relativePath)
    return fs.readFile(fullPath, 'utf-8')
  }

  async fileExists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.rootDir, relativePath)
    return fs.access(fullPath).then(() => true).catch(() => false)
  }

  async listFiles(): Promise<string[]> {
    const files: string[] = []

    async function walk(dir: string, baseDir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          await walk(fullPath, baseDir)
        } else {
          const relativePath = path.relative(baseDir, fullPath)
          files.push(relativePath)
        }
      }
    }

    await walk(this.rootDir, this.rootDir)
    return files
  }

  async cleanup(): Promise<void> {
    await fs.rm(this.rootDir, { recursive: true, force: true })
  }

  getAbsolutePath(relativePath: string): string {
    return path.join(this.rootDir, relativePath)
  }
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/services/workspace/ProjectWorkspace.test.ts
```

**Expected:** PASS (4 tests)

### Step 5: Commit Task 3

```bash
git add src/services/workspace/ProjectWorkspace.ts
git add tests/services/workspace/ProjectWorkspace.test.ts
git commit -m "feat: implement project workspace service for file generation

- Created ProjectWorkspace class for temporary project directories
- Uses /tmp/ai-cockpit-projects/{projectId} for isolation
- Supports writeFile, readFile, listFiles, cleanup operations
- Automatically creates nested directories when writing files
- Recursive cleanup removes entire workspace

Tests: 4 passing"
```

---

## Task 4: BackendDeveloper Agent Skeleton

**Goal:** Create BackendDeveloper agent extending BaseAgent with basic structure

**Files:**
- Create: `src/agents/BackendDeveloper.ts`
- Test: `tests/agents/BackendDeveloper.test.ts`
- Modify: `src/agents/index.ts` (export new agent)

### Step 1: Write failing test for BackendDeveloper

**File:** `tests/agents/BackendDeveloper.test.ts`

```typescript
import { BackendDeveloper } from '@/agents/BackendDeveloper'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

describe('BackendDeveloper', () => {
  let workspace: ProjectWorkspace

  beforeEach(async () => {
    workspace = await ProjectWorkspace.create('test-backend-dev')
  })

  afterEach(async () => {
    await workspace.cleanup()
  })

  it('should initialize with agent type', () => {
    const agent = new BackendDeveloper({
      projectId: 'test-123',
      userRequest: 'Build API for todo items',
      workspace,
    })

    expect(agent.agentType).toBe('BackendDeveloper')
  })

  it('should execute and return agent output', async () => {
    const agent = new BackendDeveloper({
      projectId: 'test-123',
      userRequest: 'Build simple API endpoint',
      workspace,
    })

    const output = await agent.execute()

    expect(output).toHaveProperty('filesCreated')
    expect(output).toHaveProperty('cost')
    expect(Array.isArray(output.filesCreated)).toBe(true)
  })
})
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/agents/BackendDeveloper.test.ts
```

**Expected:** FAIL with "Cannot find module '@/agents/BackendDeveloper'"

### Step 3: Implement BackendDeveloper agent skeleton

**File:** `src/agents/BackendDeveloper.ts`

```typescript
import { BaseAgent } from './BaseAgent'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

export interface BackendDeveloperContext {
  projectId: string
  userRequest: string
  workspace: ProjectWorkspace
  architecture?: any
}

export interface BackendDeveloperOutput {
  filesCreated: string[]
  filesModified: string[]
  cost: number
  duration: number
}

export class BackendDeveloper extends BaseAgent {
  agentType = 'BackendDeveloper' as const

  private workspace: ProjectWorkspace
  private userRequest: string
  private architecture?: any

  constructor(context: BackendDeveloperContext) {
    super(context.projectId)
    this.workspace = context.workspace
    this.userRequest = context.userRequest
    this.architecture = context.architecture
  }

  async execute(): Promise<BackendDeveloperOutput> {
    const startTime = Date.now()

    try {
      // TODO: Load skills (test-driven-development, api-design-patterns, security-best-practices)
      // TODO: Use MCP tools (context7, sequential-thinking, supabase)

      // For MVP: Generate simple API file structure
      const prompt = this.buildPrompt()
      const response = await this.think(prompt, 'simple')

      // Parse response and generate files
      const files = await this.generateFiles(response)

      const duration = Date.now() - startTime

      return {
        filesCreated: files,
        filesModified: [],
        cost: this.totalCost,
        duration,
      }
    } catch (error) {
      console.error('[BackendDeveloper] Error:', error)
      throw error
    }
  }

  private buildPrompt(): string {
    return `You are a backend developer agent. Generate TypeScript files for the following request:

User Request: ${this.userRequest}

${this.architecture ? `Architecture Context:\n${JSON.stringify(this.architecture, null, 2)}\n` : ''}

Generate a simple API structure with:
1. API route file (app/api/[resource]/route.ts)
2. Service layer file (src/services/[resource]Service.ts)
3. Type definitions (src/types/[resource].ts)

Return a JSON array of files:
[
  {
    "path": "app/api/todos/route.ts",
    "content": "import { NextRequest, NextResponse } from 'next/server'..."
  },
  {
    "path": "src/services/todoService.ts",
    "content": "export class TodoService { ... }"
  }
]

Keep it simple and focused. Use Next.js 15 patterns.`
  }

  private async generateFiles(response: string): Promise<string[]> {
    try {
      // Try to parse JSON response
      const files = JSON.parse(response)
      const createdFiles: string[] = []

      for (const file of files) {
        await this.workspace.writeFile(file.path, file.content)
        createdFiles.push(file.path)

        // Track file creation
        this.filesCreated.push(file.path)
      }

      return createdFiles
    } catch (error) {
      // If JSON parsing fails, create a single example file
      console.warn('[BackendDeveloper] Failed to parse response, creating example file')

      const exampleFile = 'src/example-generated.ts'
      await this.workspace.writeFile(exampleFile, `// Generated by BackendDeveloper\n// Request: ${this.userRequest}\n\nexport const placeholder = true;`)

      this.filesCreated.push(exampleFile)
      return [exampleFile]
    }
  }
}
```

### Step 4: Add BaseAgent properties for tracking

**File:** `src/agents/BaseAgent.ts` (add tracking properties)

Find the BaseAgent class and add these properties if they don't exist:

```typescript
export abstract class BaseAgent {
  protected projectId: string
  protected totalCost: number = 0
  protected filesCreated: string[] = []
  protected filesModified: string[] = []
  protected warnings: string[] = []
  protected errors: string[] = []

  constructor(projectId: string) {
    this.projectId = projectId
  }

  // ... existing methods ...
}
```

### Step 5: Export BackendDeveloper from index

**File:** `src/agents/index.ts`

```typescript
export { BaseAgent } from './BaseAgent'
export { CodeArchitect } from './CodeArchitect'
export { BackendDeveloper } from './BackendDeveloper'
```

### Step 6: Run test to verify it passes

```bash
npm test -- tests/agents/BackendDeveloper.test.ts
```

**Expected:** PASS (2 tests)

### Step 7: Commit Task 4

```bash
git add src/agents/BackendDeveloper.ts
git add src/agents/BaseAgent.ts
git add src/agents/index.ts
git add tests/agents/BackendDeveloper.test.ts
git commit -m "feat: implement BackendDeveloper agent skeleton

- Created BackendDeveloper extending BaseAgent
- Supports file generation via ProjectWorkspace
- Builds prompts with user request and architecture context
- Parses LLM JSON responses and generates files
- Tracks filesCreated, cost, and duration
- Fallback to example file if JSON parsing fails

Tests: 2 passing"
```

---

## Task 5: Orchestrator Codebase Review

**Goal:** Add codebase review capability to orchestrator using existing file system tools

**Files:**
- Modify: `src/orchestrator/AgentOrchestrator.ts` (add reviewCodebase method)
- Create: `src/types/orchestrator.ts` (add CodebaseReview type)
- Test: `tests/orchestrator/AgentOrchestrator.test.ts`

### Step 1: Write failing test for codebase review

**File:** `tests/orchestrator/AgentOrchestrator.test.ts`

```typescript
import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator'

describe('AgentOrchestrator - Codebase Review', () => {
  let orchestrator: AgentOrchestrator

  beforeEach(() => {
    orchestrator = AgentOrchestrator.getInstance()
  })

  it('should review a codebase and return summary', async () => {
    const review = await orchestrator.reviewCodebase({
      projectId: 'test-review-123',
      repoPath: process.cwd(), // Current ai-development-cockpit repo
      userRequest: 'Add missing agents',
    })

    expect(review).toHaveProperty('summary')
    expect(review).toHaveProperty('fileCount')
    expect(review).toHaveProperty('existingAgents')
    expect(review.summary).toBeTruthy()
  }, 60000) // 60 second timeout for LLM call

  it('should emit ReviewStarted and ReviewComplete events', async () => {
    const { eventBus } = require('@/orchestrator/EventBus')
    const startHandler = jest.fn()
    const completeHandler = jest.fn()

    eventBus.on('review:started', startHandler)
    eventBus.on('review:complete', completeHandler)

    await orchestrator.reviewCodebase({
      projectId: 'test-events-123',
      repoPath: process.cwd(),
      userRequest: 'Test events',
    })

    expect(startHandler).toHaveBeenCalled()
    expect(completeHandler).toHaveBeenCalled()
  }, 60000)
})
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/orchestrator/AgentOrchestrator.test.ts
```

**Expected:** FAIL with "orchestrator.reviewCodebase is not a function"

### Step 3: Add CodebaseReview types

**File:** `src/types/orchestrator.ts` (create if doesn't exist)

```typescript
export interface CodebaseReview {
  projectId: string
  repoPath: string
  summary: string
  fileCount: number
  directoryStructure: string[]
  existingAgents: string[]
  techStack: string[]
  patterns: {
    framework: string
    testing: string
    styling: string
  }
  recommendations: string[]
}

export interface ReviewRequest {
  projectId: string
  repoPath: string
  userRequest: string
}
```

### Step 4: Implement reviewCodebase in AgentOrchestrator

**File:** `src/orchestrator/AgentOrchestrator.ts`

Add this method to the AgentOrchestrator class:

```typescript
import { eventBus, AgentEvent } from './EventBus'
import { CodebaseReview, ReviewRequest } from '@/types/orchestrator'
import { CostOptimizerClient } from '@/services/cost-optimizer/CostOptimizerClient'
import fs from 'fs/promises'
import path from 'path'

export class AgentOrchestrator {
  // ... existing code ...

  async reviewCodebase(request: ReviewRequest): Promise<CodebaseReview> {
    const { projectId, repoPath, userRequest } = request

    // Emit review started event
    eventBus.emit(AgentEvent.ReviewStarted, { projectId, repoPath })

    try {
      // Read directory structure
      const files = await this.scanDirectory(repoPath)

      // Identify existing agents
      const agentFiles = files.filter(f => f.includes('/agents/') && f.endsWith('.ts'))
      const existingAgents = agentFiles.map(f => path.basename(f, '.ts'))

      // Read package.json to understand tech stack
      const packageJsonPath = path.join(repoPath, 'package.json')
      let techStack: string[] = []
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        techStack = Object.keys(packageJson.dependencies || {})
      } catch (e) {
        console.warn('Could not read package.json')
      }

      // Build LLM prompt for review
      const prompt = `You are an expert software architect reviewing a codebase.

Repository: ${repoPath}
User Request: ${userRequest}

Files Found (${files.length} total):
${files.slice(0, 50).join('\n')}
${files.length > 50 ? `\n... and ${files.length - 50} more files` : ''}

Existing Agents:
${existingAgents.join(', ') || 'None found'}

Tech Stack:
${techStack.slice(0, 20).join(', ')}

Provide a concise codebase review (2-3 paragraphs) covering:
1. Current architecture and patterns
2. What's already implemented
3. Gaps relevant to the user's request
4. Recommendations for implementation

Return ONLY the review summary text, no JSON.`

      // Call LLM via cost optimizer
      const costOptimizer = new CostOptimizerClient({
        apiUrl: process.env.COST_OPTIMIZER_API_URL || 'http://localhost:3000',
        apiKey: process.env.COST_OPTIMIZER_API_KEY || 'dev-key',
      })

      const summary = await costOptimizer.optimizeCompletion({
        prompt,
        complexity: 'medium',
        metadata: {
          projectId,
          agentType: 'orchestrator-review',
        }
      })

      const review: CodebaseReview = {
        projectId,
        repoPath,
        summary: summary.text || 'Review completed',
        fileCount: files.length,
        directoryStructure: this.buildDirectoryTree(files),
        existingAgents,
        techStack: techStack.slice(0, 10),
        patterns: {
          framework: this.detectFramework(techStack),
          testing: this.detectTesting(techStack),
          styling: this.detectStyling(techStack),
        },
        recommendations: [],
      }

      // Emit review complete event
      eventBus.emit(AgentEvent.ReviewComplete, { projectId, review })

      return review
    } catch (error) {
      eventBus.emit(AgentEvent.Error, {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: { phase: 'review' }
      })
      throw error
    }
  }

  private async scanDirectory(dir: string, baseDir?: string): Promise<string[]> {
    if (!baseDir) baseDir = dir

    const files: string[] = []
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      // Skip common ignore patterns
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue
      }

      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(baseDir, fullPath)

      if (entry.isDirectory()) {
        const subFiles = await this.scanDirectory(fullPath, baseDir)
        files.push(...subFiles)
      } else {
        files.push(relativePath)
      }
    }

    return files
  }

  private buildDirectoryTree(files: string[]): string[] {
    const dirs = new Set<string>()

    files.forEach(file => {
      const parts = file.split(path.sep)
      let current = ''
      parts.slice(0, -1).forEach(part => {
        current = current ? path.join(current, part) : part
        dirs.add(current)
      })
    })

    return Array.from(dirs).sort()
  }

  private detectFramework(techStack: string[]): string {
    if (techStack.includes('next')) return 'Next.js'
    if (techStack.includes('react')) return 'React'
    if (techStack.includes('vue')) return 'Vue'
    if (techStack.includes('express')) return 'Express'
    return 'Unknown'
  }

  private detectTesting(techStack: string[]): string {
    if (techStack.includes('jest')) return 'Jest'
    if (techStack.includes('vitest')) return 'Vitest'
    if (techStack.includes('playwright')) return 'Playwright'
    return 'None'
  }

  private detectStyling(techStack: string[]): string {
    if (techStack.includes('tailwindcss')) return 'Tailwind CSS'
    if (techStack.includes('styled-components')) return 'Styled Components'
    if (techStack.includes('sass')) return 'Sass'
    return 'CSS'
  }
}
```

### Step 5: Run test to verify it passes

```bash
npm test -- tests/orchestrator/AgentOrchestrator.test.ts
```

**Expected:** PASS (2 tests) - Note: These tests call real LLM, may take 30-60 seconds

### Step 6: Commit Task 5

```bash
git add src/orchestrator/AgentOrchestrator.ts
git add src/types/orchestrator.ts
git add tests/orchestrator/AgentOrchestrator.test.ts
git commit -m "feat: implement orchestrator codebase review capability

- Added reviewCodebase() method to AgentOrchestrator
- Scans directory structure, identifies existing agents
- Detects tech stack from package.json
- Calls LLM via cost optimizer for intelligent review
- Emits ReviewStarted and ReviewComplete events
- Returns CodebaseReview with summary, patterns, and recommendations

Tests: 2 passing (LLM integration tests)"
```

---

## Task 6: Dashboard API Endpoint for Review

**Goal:** Create API endpoint to trigger codebase review from dashboard

**Files:**
- Create: `src/app/api/orchestrator/review/route.ts`
- Test: Test manually via curl or Postman

### Step 1: Implement review API endpoint

**File:** `src/app/api/orchestrator/review/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, repoPath, userRequest } = body

    if (!projectId || !repoPath || !userRequest) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, repoPath, userRequest' },
        { status: 400 }
      )
    }

    const orchestrator = AgentOrchestrator.getInstance()

    const review = await orchestrator.reviewCodebase({
      projectId,
      repoPath,
      userRequest,
    })

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error('[API] Review error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

### Step 2: Test API endpoint

```bash
# Start dev server (in another terminal)
cd ~/.config/superpowers/worktrees/ai-development-cockpit/agent-orchestration-system
npm run dev

# Test review endpoint
curl -X POST http://localhost:3000/api/orchestrator/review \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-123",
    "repoPath": "'$(pwd)'",
    "userRequest": "Add the 4 missing agents"
  }'
```

**Expected:** JSON response with `success: true` and `review` object containing summary

### Step 3: Commit Task 6

```bash
git add src/app/api/orchestrator/review/route.ts
git commit -m "feat: add API endpoint for codebase review

- Created POST /api/orchestrator/review endpoint
- Accepts projectId, repoPath, userRequest
- Calls AgentOrchestrator.reviewCodebase()
- Returns CodebaseReview JSON response
- Error handling with 400/500 status codes

Manual test: curl localhost:3000/api/orchestrator/review"
```

---

## Task 7: Simple Dashboard UI for Review

**Goal:** Create basic UI to trigger codebase review and see results

**Files:**
- Modify: `src/app/project-builder/page.tsx` (enhance existing page)
- Create: `src/components/orchestrator/ReviewDisplay.tsx`

### Step 1: Create ReviewDisplay component

**File:** `src/components/orchestrator/ReviewDisplay.tsx`

```typescript
'use client'

import { CodebaseReview } from '@/types/orchestrator'

interface ReviewDisplayProps {
  review: CodebaseReview | null
  isLoading: boolean
}

export function ReviewDisplay({ review, isLoading }: ReviewDisplayProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!review) {
    return null
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">Codebase Review</h3>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Files:</span>{' '}
          <span className="font-medium">{review.fileCount}</span>
        </div>
        <div>
          <span className="text-gray-500">Existing Agents:</span>{' '}
          <span className="font-medium">{review.existingAgents.length}</span>
        </div>
        <div>
          <span className="text-gray-500">Framework:</span>{' '}
          <span className="font-medium">{review.patterns.framework}</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Summary</h4>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.summary}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Existing Agents</h4>
        <div className="flex flex-wrap gap-2">
          {review.existingAgents.map(agent => (
            <span key={agent} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              {agent}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Update project-builder page

**File:** `src/app/project-builder/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ReviewDisplay } from '@/components/orchestrator/ReviewDisplay'
import { CodebaseReview } from '@/types/orchestrator'

export default function ProjectBuilderPage() {
  const [userRequest, setUserRequest] = useState('')
  const [review, setReview] = useState<CodebaseReview | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReview = async () => {
    if (!userRequest.trim()) {
      setError('Please enter a request')
      return
    }

    setIsReviewing(true)
    setError(null)

    try {
      const response = await fetch('/api/orchestrator/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: `project-${Date.now()}`,
          repoPath: process.cwd(), // Will be replaced with user's selected repo
          userRequest: userRequest.trim(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Review failed')
      }

      setReview(data.review)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">AI Development Cockpit</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            What do you want to build?
          </label>
          <textarea
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            placeholder="e.g., Add the 4 missing agents: BackendDeveloper, FrontendDeveloper, Tester, DevOpsEngineer"
            className="w-full p-3 border rounded-lg h-24"
          />
        </div>

        <button
          onClick={handleReview}
          disabled={isReviewing}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isReviewing ? 'Reviewing...' : 'Review & Plan'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <ReviewDisplay review={review} isLoading={isReviewing} />
      </div>
    </div>
  )
}
```

### Step 3: Test UI manually

```bash
# Dev server should still be running
# Open browser: http://localhost:3000/project-builder
# Enter: "Add the 4 missing agents"
# Click "Review & Plan"
# Verify review displays
```

**Expected:** Review appears with file count, existing agents, summary

### Step 4: Commit Task 7

```bash
git add src/components/orchestrator/ReviewDisplay.tsx
git add src/app/project-builder/page.tsx
git commit -m "feat: add basic dashboard UI for codebase review

- Created ReviewDisplay component showing review summary
- Updated project-builder page with review form
- Users can enter request and trigger review
- Displays file count, existing agents, framework detection
- Loading state with skeleton UI
- Error handling and display

Manual test: localhost:3000/project-builder"
```

---

## CHECKPOINT: MVP Core Complete

**At this point you have:**
- ✅ Orchestrator configuration (7 model choices)
- ✅ Event bus for agent communication
- ✅ Project workspace service (temp directories)
- ✅ BackendDeveloper agent skeleton
- ✅ Codebase review capability
- ✅ API endpoint for review
- ✅ Basic dashboard UI

**You can TEST the MVP:**
1. Start dev server: `npm run dev`
2. Open: `http://localhost:3000/project-builder`
3. Enter: "Add BackendDeveloper agent"
4. Click "Review & Plan"
5. See codebase review with AI-generated summary

**Next Steps (Optional for Tonight):**
- Task 8: Plan generation
- Task 9: Agent execution
- Task 10: Real-time progress

**OR stop here and demo what we have!**

---

## Task 8: Plan Generation (OPTIONAL)

**Goal:** Generate execution plan from review and user request

**Files:**
- Modify: `src/orchestrator/AgentOrchestrator.ts` (add generatePlan method)
- Create: `src/app/api/orchestrator/plan/route.ts`
- Modify: `src/app/project-builder/page.tsx` (add plan display)

### Step 1: Implement generatePlan

**File:** `src/orchestrator/AgentOrchestrator.ts`

Add method:

```typescript
async generatePlan(params: {
  projectId: string
  review: CodebaseReview
  userRequest: string
}): Promise<ExecutionPlan> {
  const { projectId, review, userRequest } = params

  eventBus.emit(AgentEvent.PlanGenerating, { projectId })

  const prompt = `You are a technical project planner. Generate a detailed implementation plan.

User Request: ${userRequest}

Codebase Review:
${review.summary}

Existing Agents: ${review.existingAgents.join(', ')}
Tech Stack: ${review.techStack.join(', ')}

Create a plan with 2-4 phases. Each phase should have:
- Phase name
- 2-4 specific tasks
- Estimated time (in minutes)
- Estimated cost (in USD)

Return JSON:
{
  "phases": [
    {
      "id": "phase-1",
      "name": "Phase Name",
      "tasks": [
        { "id": "task-1-1", "description": "Task description", "files": ["path/to/file.ts"], "estimatedTime": 120 }
      ],
      "estimatedTime": 120,
      "estimatedCost": 0.50
    }
  ],
  "totalEstimatedTime": 240,
  "totalEstimatedCost": 1.00
}`

  const costOptimizer = new CostOptimizerClient({
    apiUrl: process.env.COST_OPTIMIZER_API_URL || 'http://localhost:3000',
    apiKey: process.env.COST_OPTIMIZER_API_KEY || 'dev-key',
  })

  const response = await costOptimizer.optimizeCompletion({
    prompt,
    complexity: 'medium',
    metadata: { projectId, agentType: 'orchestrator-plan' }
  })

  const plan = JSON.parse(response.text)

  eventBus.emit(AgentEvent.PlanGenerated, { projectId, plan })

  return plan
}
```

### Step 2: Create plan API endpoint

**File:** `src/app/api/orchestrator/plan/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, review, userRequest } = body

    if (!projectId || !review || !userRequest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const orchestrator = AgentOrchestrator.getInstance()
    const plan = await orchestrator.generatePlan({
      projectId,
      review,
      userRequest,
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('[API] Plan generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Step 3: Update dashboard to show plan

Modify `src/app/project-builder/page.tsx` to call plan endpoint after review completes and display phases/tasks.

### Step 4: Commit Task 8

```bash
git add src/orchestrator/AgentOrchestrator.ts
git add src/app/api/orchestrator/plan/route.ts
git add src/app/project-builder/page.tsx
git commit -m "feat: implement execution plan generation

- Added generatePlan() to AgentOrchestrator
- Creates 2-4 phases with tasks, time, and cost estimates
- LLM generates structured JSON plan
- API endpoint POST /api/orchestrator/plan
- Dashboard displays plan phases and tasks

Tests: Manual via dashboard"
```

---

## Verification & Testing

### Run All Tests

```bash
cd ~/.config/superpowers/worktrees/ai-development-cockpit/agent-orchestration-system
npm test
```

**Expected:** All tests passing (13+ tests)

### Manual End-to-End Test

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
open http://localhost:3000/project-builder

# 3. Test flow
Enter: "Add the 4 missing agents to the project"
Click: "Review & Plan"
Wait: 30-60 seconds
Verify: Review displays with summary
Click: "Generate Plan" (if implemented)
Verify: Plan displays with phases

# 4. Test CLI
npm run orchestrator:use deepseek-r1
Verify: .env updated with ORCHESTRATOR_MODEL=deepseek-r1
```

### Type Check

```bash
npm run type-check
```

**Expected:** No TypeScript errors

---

## Deployment to Main Branch

### Option 1: Merge from Worktree

```bash
# In worktree
git add -A
git commit -m "feat: complete agent orchestration MVP

All 7 tasks implemented:
- Orchestrator configuration with CLI
- Event bus for agent communication
- Project workspace service
- BackendDeveloper agent skeleton
- Codebase review capability
- API endpoints and dashboard UI
- Tests passing

Ready for production testing"

# Switch to main repo
cd /Users/tmkipper/Desktop/tk_projects/ai-development-cockpit
git merge feature/agent-orchestration-system
git push origin main
```

### Option 2: Create Pull Request

```bash
# In worktree
git push origin feature/agent-orchestration-system

# Create PR via GitHub UI or gh CLI
gh pr create --title "Agent Orchestration MVP" --body "Implements Review → Plan → Execute system"
```

---

## Next Session: Skills + MCP Integration

**Tomorrow's Plan:**
1. Skills library integration (TDD, API design, security)
2. MCP client for agents (context7, sequential-thinking)
3. Enhanced BackendDeveloper with real code generation
4. FrontendDeveloper agent
5. Real-time dashboard updates via Supabase

**Files to create:**
- `src/services/skills/SkillLibrary.ts`
- `src/services/mcp/AgentMCPClient.ts`
- `.agent-skills/test-driven-development.md`
- `src/agents/FrontendDeveloper.ts`

---

## Success Criteria

**MVP is complete when:**
- ✅ User can review any codebase via dashboard
- ✅ Orchestrator generates AI summary in <60 seconds
- ✅ User can switch orchestrator models via CLI
- ✅ Events are emitted and logged
- ✅ BackendDeveloper agent can be instantiated
- ✅ All tests passing
- ✅ TypeScript type-check passes

**Demo Script:**
1. Show orchestrator model switching
2. Enter "Add BackendDeveloper agent" in dashboard
3. Show codebase review with AI summary
4. Show event logs in console
5. Show generated files in temp workspace

**Cost:** ~$0.10-0.20 per full review+plan cycle using Cerebras

---

**End of Implementation Plan**

This plan provides 100% of what you need to build the MVP tonight. Each task is 2-5 minutes per step, with exact file paths and complete code.

Ready to execute!
