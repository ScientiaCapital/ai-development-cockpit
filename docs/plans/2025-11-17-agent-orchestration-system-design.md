# AI Development Cockpit - Agent Orchestration System Design

**Date**: 2025-11-17
**Status**: Ready for Implementation
**Target**: MVP Demo Tonight (2-3 hours)

---

## Executive Summary

Build a Review → Plan → Execute system where an orchestrator analyzes codebases, generates implementation plans, and coordinates AI agents to write code. Users interact through a web dashboard with real-time progress tracking.

**MVP Goal**: Point the orchestrator at ai-development-cockpit, request "Add the 4 missing agents," watch it build BackendDeveloper agent tonight.

---

## User Experience

### Access
- Web dashboard: `http://localhost:3000`
- GitHub OAuth integration
- Repository browser in left sidebar

### Workflow

**Step 1: Select Project**
```
User clicks repository: "ai-development-cockpit"
Dashboard shows: repo structure, recent commits, branch status
```

**Step 2: Request Work**
```
User enters: "Add the 4 missing agents: BackendDeveloper, FrontendDeveloper, Tester, DevOpsEngineer"
Selects orchestrator: Claude Sonnet 4.5
Selects mode: Balanced
Clicks: "Review & Plan"
```

**Step 3: Orchestrator Reviews**
```
Orchestrator analyzes codebase:
- Reads file structure
- Identifies existing agents (BaseAgent, CodeArchitect)
- Understands patterns and conventions
- Generates comprehensive review (30-60 seconds)
```

**Step 4: Plan Generation**
```
Orchestrator creates detailed plan:

Phase 1: BackendDeveloper Agent
  Task 1.1: Create BackendDeveloper.ts extending BaseAgent
  Task 1.2: Implement API generation logic
  Task 1.3: Add file writing capability
  Estimated: 2 hours | Cost: $0.50

Phase 2: FrontendDeveloper Agent
  [3 tasks, 2 hours, $0.50]

Phase 3: Tester Agent
  [2 tasks, 1.5 hours, $0.35]

Phase 4: DevOpsEngineer Agent
  [2 tasks, 1.5 hours, $0.35]

Total: 7 hours | $1.70
```

**Step 5: User Approves**
```
User clicks: "Execute Phase 1"
Dashboard shows real-time progress
```

**Step 6: Agent Execution**
```
BackendDeveloper agent spawns:
- Loads skills: TDD, API design, security best practices
- Accesses MCP tools: context7, sequential-thinking, supabase
- Generates code files
- Runs tests
- Reports completion

User reviews generated code:
- View diffs
- Approve or request changes
- Commit to git worktree
```

**Step 7: Iteration**
```
User executes Phase 2, 3, 4
Or queues all phases for overnight execution
```

---

## System Architecture

### Three-Layer Design

**Layer 1: User Interface**
- Next.js dashboard (localhost:3000)
- Real-time status via Supabase Realtime
- GitHub OAuth integration
- Repository browser
- Live agent activity monitor

**Layer 2: Orchestration**
- LangGraph StateGraph workflow
- Event bus (TypeScript EventEmitter)
- Human approval gates
- Progress tracking
- Cost monitoring

**Layer 3: Agent Team**
- BaseAgent (abstract base class)
- Specialized agents (CodeArchitect, BackendDeveloper, etc.)
- Skills library integration
- MCP tools access
- Shared services (filesystem, git, cost optimizer)

### Event-Driven Flow

```
User Request
    ↓
Orchestrator.reviewCodebase()
    ↓ emits ReviewComplete
Orchestrator.generatePlan()
    ↓ emits PlanGenerated
User approves Phase 1
    ↓
Orchestrator.spawnAgent(BackendDeveloper)
    ↓ emits AgentStarted
BackendDeveloper.execute()
    ↓ emits CodeGenerated
Orchestrator.awaitApproval()
    ↓
User approves
    ↓ emits ApprovalGranted
Orchestrator.commitToGit()
    ↓ emits PhaseComplete
```

---

## Component Specifications

### 1. Orchestrator

**File**: `src/orchestrator/AgentOrchestrator.ts` (extends existing)

**New Methods**:
```typescript
async reviewCodebase(repoPath: string): Promise<CodebaseReview>
async generatePlan(review: CodebaseReview, userRequest: string): Promise<ExecutionPlan>
async executePhase(phase: PlanPhase): Promise<PhaseResult>
async spawnAgent(agentType: string, context: AgentContext): Promise<Agent>
```

**Configuration**:
```typescript
// src/config/orchestrator.config.ts
export const ORCHESTRATOR_CONFIG = {
  model: process.env.ORCHESTRATOR_MODEL || 'claude-sonnet-4.5',
  provider: process.env.ORCHESTRATOR_PROVIDER || 'anthropic',
  temperature: 0.1,
  pollingIntervalMs: 5000,
  requireApproval: {
    beforeBuild: false,
    beforeTests: false,
    beforeDeploy: true,
  }
}
```

**CLI Command**:
```bash
npm run orchestrator:use claude-sonnet-4.5
npm run orchestrator:use deepseek-r1
npm run orchestrator:use kimi-k1.5
```

### 2. Agent System

**BaseAgent** (exists): `src/agents/BaseAgent.ts`
- Abstract base class
- `think()` method routes through cost optimizer
- Cost tracking
- Duration monitoring

**BackendDeveloper** (NEW): `src/agents/BackendDeveloper.ts`
```typescript
export class BackendDeveloper extends BaseAgent {
  private skills: SkillLibrary
  private mcp: AgentMCPClient

  async execute(): Promise<AgentOutput> {
    // Load skills
    await this.skills.load([
      'test-driven-development',
      'api-design-patterns',
      'security-best-practices'
    ])

    // Use MCP tools
    const docs = await this.mcp.context7.getDocs('/supabase/supabase', 'api')

    // Generate code
    const files = await this.generateAPIFiles()

    // Write to filesystem
    await this.writeFiles(files)

    return {
      filesCreated: files.map(f => f.path),
      testsPass: true,
      cost: this.totalCost
    }
  }
}
```

**Agent Capabilities**:
```typescript
// src/config/agent-capabilities.config.ts
export const AGENT_CAPABILITIES = {
  skills: {
    BackendDeveloper: [
      'test-driven-development',
      'api-design-patterns',
      'security-best-practices',
    ],
    FrontendDeveloper: [
      'test-driven-development',
      'component-design-patterns',
      'accessibility-checklist',
    ],
  },

  mcpTools: {
    BackendDeveloper: ['context7', 'sequential-thinking', 'supabase', 'github'],
    FrontendDeveloper: ['context7', 'sequential-thinking', 'github'],
    Tester: ['context7', 'playwright', 'supabase'],
    DevOpsEngineer: ['context7', 'github', 'vercel', 'runpod'],
  }
}
```

### 3. Skills Library

**Directory**: `.agent-skills/`

**Structure**:
```
.agent-skills/
├── test-driven-development.md
├── api-design-patterns.md
├── security-best-practices.md
├── component-design-patterns.md
├── accessibility-checklist.md
└── custom/
    └── your-coding-standards.md
```

**Skill Loader**:
```typescript
// src/services/skills/SkillLibrary.ts
export class SkillLibrary {
  async load(skillNames: string[]): Promise<void>
  getInstructions(): string
  applyToPrompt(basePrompt: string): string
}
```

### 4. MCP Integration

**Client**: `src/services/mcp/AgentMCPClient.ts`

```typescript
export class AgentMCPClient {
  private tools: Map<string, MCPTool>

  // Available MCP tools
  context7: Context7Tool
  sequentialThinking: SequentialThinkingTool
  supabase: SupabaseMCPTool
  github: GitHubMCPTool
  playwright: PlaywrightMCPTool
  vercel: VercelMCPTool
  runpod: RunPodMCPTool

  async callTool(toolName: string, params: any): Promise<any>
  listTools(): string[]
}
```

### 5. Event Bus

**File**: `src/orchestrator/EventBus.ts`

```typescript
export enum AgentEvent {
  ReviewStarted = 'review:started',
  ReviewComplete = 'review:complete',
  PlanGenerated = 'plan:generated',
  AgentStarted = 'agent:started',
  CodeGenerated = 'code:generated',
  TestsComplete = 'tests:complete',
  PhaseComplete = 'phase:complete',
  ApprovalRequired = 'approval:required',
}

export class EventBus extends EventEmitter {
  emit(event: AgentEvent, data: any): void
  on(event: AgentEvent, handler: (data: any) => void): void
}
```

### 6. Shared Services

**Git Worktree Service**:
```typescript
// src/services/git/GitWorktreeService.ts
export class GitWorktreeService {
  async createWorktree(projectId: string): Promise<WorktreeContext>
  async commitChanges(message: string): Promise<void>
  async createPR(title: string, body: string): Promise<string>
  async cleanup(): Promise<void>
}
```

**File System Service**:
```typescript
// src/services/filesystem/FileSystemService.ts
export class FileSystemService {
  async writeFile(path: string, content: string): Promise<void>
  async readFile(path: string): Promise<string>
  async getDiff(filePath: string): Promise<string>
  async listFiles(): Promise<string[]>
}
```

**Cost Optimizer** (exists): `src/services/cost-optimizer/CostOptimizerClient.ts`
- Routes AI requests to optimal provider
- Cerebras (fast/cheap) → OpenRouter → Claude (complex)
- 90% cost savings

### 7. Model Configuration

**Agent Model Strategy**:
```typescript
// src/agents/config/models.config.ts
export const AGENT_MODEL_STRATEGY = {
  CodeArchitect: {
    default: 'claude-sonnet-4.5',
    complex: 'claude-opus-4',
    simple: 'llama-3.3-70b',
  },

  BackendDeveloper: {
    default: 'qwen-2.5-coder-32b',
    models: {
      'simple-crud': 'llama-3.3-70b',      // Cerebras
      'auth-security': 'claude-sonnet-4.5', // Premium
      'complex-logic': 'claude-opus-4',     // BUSU mode
    }
  },
}
```

**Supported Models**:
- **Orchestrator**: Claude Sonnet 4.5, Claude Opus 4, DeepSeek R1, Kimi K1.5, GPT-4 Turbo
- **Agents (Speed)**: Llama 3.3 70B, Llama 3.1 8B (Cerebras)
- **Agents (Smart)**: DeepSeek V3, Qwen 2.5 Coder 32B (OpenRouter)
- **Agents (BUSU)**: Claude Sonnet 4.5, Claude Opus 4, GPT-4 Turbo, o1-pro

---

## Database Schema

**New Tables** (Supabase):

```sql
-- Project queue for overnight builds
CREATE TABLE project_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  repo_name TEXT NOT NULL,
  description TEXT NOT NULL,
  orchestrator_model TEXT DEFAULT 'claude-sonnet-4.5',
  mode TEXT DEFAULT 'balanced', -- frugal, balanced, performance, busu
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- queued, reviewing, planning, building, testing, deploying, completed, failed

  -- Review phase
  review_started_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,
  codebase_review JSONB,

  -- Planning phase
  plan_generated_at TIMESTAMPTZ,
  execution_plan JSONB,

  -- Execution phase
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  current_phase TEXT,
  phases_completed INTEGER DEFAULT 0,
  total_phases INTEGER,

  -- Results
  files_created TEXT[],
  files_modified TEXT[],
  git_branch TEXT,
  pr_url TEXT,

  -- Cost tracking
  cost_usd DECIMAL(10,4) DEFAULT 0,
  cost_breakdown JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent execution logs
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project_queue(id) NOT NULL,
  agent_type TEXT NOT NULL, -- CodeArchitect, BackendDeveloper, etc.
  status TEXT NOT NULL, -- started, running, completed, failed

  -- Configuration
  model_used TEXT,
  skills_loaded TEXT[],
  mcp_tools_used TEXT[],

  -- Results
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  output JSONB,
  error TEXT,

  -- Cost
  cost_usd DECIMAL(10,4) DEFAULT 0,
  tokens_used INTEGER
);

-- Real-time events for dashboard
CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project_queue(id) NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Dashboard UI Components

**New Pages**:
- `/project-builder` - Main interface (enhance existing)
- `/projects/[id]/live` - Live agent monitoring

**Key Components**:
```typescript
// src/components/orchestrator/OrchestratorConfig.tsx
// - Model selector dropdown
// - Mode selector (frugal, balanced, performance, busu)
// - Approval gate toggles

// src/components/orchestrator/CodebaseReview.tsx
// - Review progress indicator
// - Findings summary
// - Architecture visualization

// src/components/orchestrator/ExecutionPlan.tsx
// - Phase breakdown
// - Task list with estimates
// - Cost projection
// - Execute buttons per phase

// src/components/agents/AgentMonitor.tsx
// - Real-time agent status
// - Skills loaded indicator
// - MCP tools used
// - Files created/modified
// - Cost tracker

// src/components/agents/LiveProgress.tsx
// - Progress bar per agent
// - Event stream (review started, code generated, etc.)
// - Real-time file changes
```

**Real-time Updates**:
```typescript
// Supabase Realtime subscription
supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'agent_events'
  }, (payload) => {
    updateDashboard(payload.new)
  })
  .subscribe()
```

---

## MVP Implementation Phases

### Tonight (Phase 1): Core Review → Plan → Execute

**Time**: 2-3 hours

**Deliverables**:
1. Orchestrator review capability (uses existing Explore agent pattern)
2. Plan generation (LLM generates structured plan)
3. Event bus (simple TypeScript EventEmitter)
4. BackendDeveloper agent skeleton (extends BaseAgent)
5. Temp directory file generation (skip git worktrees tonight)
6. Dashboard showing live progress
7. CLI command: `npm run orchestrator:use <model>`

**Test Case**:
```
User: "Add BackendDeveloper agent to ai-development-cockpit"
Expected: Orchestrator reviews, plans, generates BackendDeveloper.ts
Time: ~2 minutes
Cost: ~$0.15
```

### Tomorrow (Phase 2): Skills + MCP + Git Worktrees

**Time**: 4-6 hours

**Deliverables**:
1. Skills library integration
2. MCP client setup (context7, sequential-thinking)
3. Git worktree service
4. Complete BackendDeveloper agent with real code generation
5. FrontendDeveloper agent
6. Enhanced dashboard with skill/tool monitoring

### Day 3 (Phase 3): Tester + DevOps + Queue System

**Time**: 4-6 hours

**Deliverables**:
1. Tester agent
2. DevOpsEngineer agent
3. Project queue system
4. Overnight build scheduling
5. GitHub Actions integration

### Day 4 (Phase 4): Docker + RunPod Deployment

**Time**: 4-6 hours

**Deliverables**:
1. Dockerfile (dev + serverless)
2. runpod.toml configuration
3. handler.py entry point
4. GitHub Actions workflow (linux/arm64)
5. requirements.txt + serverless-requirements.txt sync
6. RunPod serverless endpoint deployment

---

## Docker + RunPod Setup (Phase 4)

### Strategy: Clone sales-agents Pattern

**Files to Create**:
```
ai-development-cockpit/
├── Dockerfile                  # Development/production
├── Dockerfile.serverless       # RunPod optimized
├── runpod.toml                # RunPod configuration
├── handler.py                 # Serverless entry point
├── requirements.txt           # Python dependencies (if needed)
├── serverless-requirements.txt # Minimal serverless deps
└── .github/workflows/
    └── build-docker.yml       # linux/arm64 build
```

**Key Constraints**:
1. **Match requirements files** - Ensure library versions align
2. **GitHub Actions builds linux/arm64** - NOT MacBook local builds
3. **Health checks** - Simple health check for RunPod
4. **Environment variables** - All secrets via .env

**Docker Configuration**:
```dockerfile
# Dockerfile.serverless
FROM node:20-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY handler.ts ./
COPY healthcheck.ts ./

# Build TypeScript
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Entry point
CMD ["node", "dist/handler.js"]
```

**RunPod Configuration**:
```toml
# runpod.toml
[project]
name = "ai-development-cockpit"
base_image = "runpod/base:0.6.1"
gpu_count = 0  # CPU-only for orchestration
container_disk_size_gb = 50

[endpoint]
active_workers = 0
max_workers = 3
min_workers = 0
flashboot = true
idle_timeout = 120

[project.env_vars]
POD_INACTIVITY_TIMEOUT = "120"
RUNPOD_DEBUG_LEVEL = "info"
```

**GitHub Actions**:
```yaml
# .github/workflows/build-docker.yml
name: Build Docker Image

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.serverless
          platforms: linux/arm64,linux/amd64
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## Cost Projections

### Development Costs (Tonight - Phase 1)

| Activity | Model | Cost |
|----------|-------|------|
| Codebase review | Claude Sonnet 4.5 | $0.05 |
| Plan generation | Claude Sonnet 4.5 | $0.03 |
| BackendDeveloper agent | Llama 3.3 70B (Cerebras) | $0.02 |
| Testing | Llama 3.3 70B | $0.01 |
| **Total (MVP)** | | **$0.11** |

### 24/7 Operation Costs (After Full Build)

**Example: 5 projects overnight**

| Project | Complexity | Models | Time | Cost |
|---------|-----------|--------|------|------|
| Simple blog | Low | Llama 3.3 70B | 25 min | $0.15 |
| Stripe integration | Medium | Mixed | 1.2 hrs | $1.80 |
| Trading dashboard | High | Opus 4 (BUSU) | 2.5 hrs | $8.50 |
| **Total** | | | **4.2 hrs** | **$10.45** |

**RunPod Cost**: RTX 3090 @ $0.34/hr × 4.2 hrs = $1.43
**Grand Total**: $11.88 for 5 complete applications

---

## Success Metrics

**MVP Success (Tonight)**:
- ✅ Orchestrator reviews ai-development-cockpit codebase
- ✅ Generates execution plan with 4 phases
- ✅ User executes Phase 1
- ✅ BackendDeveloper.ts file created (150+ lines)
- ✅ Dashboard shows real-time progress
- ✅ Total time: <3 minutes
- ✅ Total cost: <$0.20

**Full System Success (Week 1)**:
- ✅ All 4 agents implemented and tested
- ✅ Skills library integrated (5+ skills)
- ✅ MCP tools working (context7, sequential-thinking, github)
- ✅ Git worktree integration
- ✅ Project queue for overnight builds
- ✅ Docker + RunPod deployment
- ✅ Can build complete app overnight (<$15)

---

## Risks & Mitigation

**Risk 1: Docker build fails (like yesterday)**
- **Mitigation**: Use exact sales-agents pattern, GitHub Actions linux/arm64 builds, avoid local MacBook builds

**Risk 2: Agent generates invalid code**
- **Mitigation**: Skills enforce TDD (test first), validation before commit, human approval gates

**Risk 3: Cost overruns**
- **Mitigation**: Cost optimizer routes to Cerebras (90% cheaper), budget alerts in dashboard, require approval before expensive operations

**Risk 4: Git worktree conflicts**
- **Mitigation**: Unique branch per project, automatic cleanup, conflict detection before merge

**Risk 5: Overnight builds fail silently**
- **Mitigation**: Email/Slack notifications, comprehensive logging, retry logic, health checks

---

## Next Steps

**Immediate (Tonight - Phase 4 Complete)**:
1. ✅ Design doc written
2. ⏳ Create implementation plan (Phase 6)
3. ⏳ Setup git worktree for development
4. ⏳ Start building: Orchestrator review capability
5. ⏳ Test MVP: Review → Plan → Execute flow

**Tomorrow**:
1. Skills library integration
2. MCP client setup
3. Complete BackendDeveloper agent
4. Add FrontendDeveloper agent

**This Week**:
1. Tester + DevOps agents
2. Queue system
3. Docker + RunPod deployment
4. First overnight build test

---

## Appendix: Configuration Files

### .env.example Updates

```bash
# Orchestrator Configuration
ORCHESTRATOR_MODEL=claude-sonnet-4.5
ORCHESTRATOR_PROVIDER=anthropic

# Agent Models (override per agent type)
AGENT_BACKEND_MODEL=qwen-2.5-coder-32b
AGENT_FRONTEND_MODEL=llama-3.3-70b
AGENT_TESTER_MODEL=deepseek-v3
AGENT_DEVOPS_MODEL=claude-sonnet-4.5

# Skills & MCP
ENABLE_SKILLS=true
ENABLE_MCP_TOOLS=true

# GitHub Integration
GITHUB_TOKEN=ghp_xxx
GITHUB_DEFAULT_ORG=tmkipper

# RunPod (Phase 4)
RUNPOD_API_KEY=xxx
RUNPOD_ENDPOINT_ID=xxx

# Existing (keep all current env vars)
COST_OPTIMIZER_API_URL=xxx
ANTHROPIC_API_KEY=xxx
CEREBRAS_API_KEY=xxx
OPENROUTER_API_KEY=xxx
# ... etc
```

### package.json Scripts

```json
{
  "scripts": {
    "orchestrator:use": "node scripts/set-orchestrator.js",
    "agent:add-skill": "node scripts/add-skill-to-agent.js",
    "agent:add-mcp-tool": "node scripts/add-mcp-tool.js",
    "agent:list-capabilities": "node scripts/list-agent-capabilities.js",
    "skill:create": "node scripts/create-skill.js"
  }
}
```

---

**End of Design Document**

**Status**: Ready for Implementation
**Next Phase**: Create implementation plan, setup worktree, start building

**Let's build something amazing tonight.** 🚀
