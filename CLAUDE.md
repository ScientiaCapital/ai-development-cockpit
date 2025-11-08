# Claude Code Configuration - AI Development Cockpit

**Last Updated**: 2025-11-08
**Status**: Active Development - Agent Orchestration System
**Branch**: `main`

---

## 🎯 Project Overview

**AI Development Cockpit** is a multi-agent orchestration system that empowers **coding noobs** to build complete software applications using plain English descriptions.

### The Vision

**For**: People with zero coding background who want to build software
**What**: Describe what you want in plain English, and a team of expert AI agents builds it for you
**How**: An intelligent orchestrator spawns specialized agents, coordinates their work, and learns from every project

### Core Value Proposition

- 🎓 **Zero technical knowledge required** - Just describe what you want
- 🤖 **Expert AI agent teams** - Architecture, backend, frontend, testing, deployment
- 📈 **Gets smarter over time** - Feedback loop improves with each project
- 💰 **90% cost savings** - Powered by [ai-cost-optimizer](https://github.com/ScientiaCapital/ai-cost-optimizer)
- ⚡ **Fast iteration** - Agents work in parallel

---

## 🏗️ Architecture Overview

### The Orchestrator

```
User: "I want to build a todo app with user authentication"
                            ↓
        ┌───────────────────────────────┐
        │   Agent Orchestrator          │
        │   - Analyzes requirements     │
        │   - Plans architecture        │
        │   - Spawns agent team         │
        │   - Coordinates workflow      │
        └───────────────┬───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │ Code    │    │ Backend │    │Frontend │
   │Architect│    │Developer│    │Developer│
   └────┬────┘    └────┬────┘    └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
              ┌────────┴────────┐
              │                 │
         ┌────▼────┐      ┌────▼────┐
         │ Tester  │      │ DevOps  │
         │ Agent   │      │ Agent   │
         └─────────┘      └─────────┘
                  │
                  ▼
            Built Application
```

### Tech Stack

**Frontend**: Next.js 14, TypeScript, Tailwind CSS
**Backend**: Supabase (auth + database), API Routes
**AI Integration**: Cost-optimized LLM routing
**Deployment**: Vercel (serverless functions)
**Cost Optimization**: [ai-cost-optimizer](https://github.com/ScientiaCapital/ai-cost-optimizer) service

---

## 🤖 Agent System

### Available Agents

#### 1. Code Architect Agent
**Purpose**: Designs system architecture and technical specifications
**Responsibilities**:
- Analyze user requirements
- Design database schema
- Plan API architecture
- Create file structure
- Define data flow

**Example Output**:
```typescript
{
  architecture: {
    frontend: "Next.js with TypeScript",
    backend: "API routes + Supabase",
    database: "PostgreSQL (via Supabase)",
    auth: "Supabase Auth with JWT"
  },
  fileStructure: {
    "src/app/": "Next.js app router pages",
    "src/components/": "React components",
    "src/services/": "Business logic",
    "src/types/": "TypeScript definitions"
  }
}
```

#### 2. Backend Developer Agent
**Purpose**: Builds server-side logic and APIs
**Responsibilities**:
- Create API endpoints
- Implement business logic
- Database operations (CRUD)
- Authentication/authorization
- Error handling

**Tools Used**:
- Supabase Client
- TypeScript
- API Route handlers

#### 3. Frontend Developer Agent
**Purpose**: Builds user interface and client-side logic
**Responsibilities**:
- Create React components
- Implement UI/UX design
- Handle state management
- Form validation
- API integration

**Tools Used**:
- React/Next.js
- Tailwind CSS
- TypeScript
- React hooks

#### 4. Tester Agent
**Purpose**: Ensures code quality and catches bugs
**Responsibilities**:
- Write unit tests
- Write E2E tests (Playwright)
- Test edge cases
- Validate API responses
- Check accessibility

**Tools Used**:
- Jest (unit tests)
- Playwright (E2E tests)
- Testing Library

#### 5. DevOps Agent
**Purpose**: Handles deployment and infrastructure
**Responsibilities**:
- Configure Vercel deployment
- Setup environment variables
- Database migrations
- CI/CD workflows
- Monitoring setup

**Tools Used**:
- Vercel CLI
- GitHub Actions
- Supabase CLI

---

## 💰 ai-cost-optimizer Integration

### Service-to-Service Architecture

The AI Development Cockpit integrates with [ai-cost-optimizer](https://github.com/ScientiaCapital/ai-cost-optimizer) as a **separate microservice**:

```
┌─────────────────────────────────────┐
│  ai-development-cockpit             │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Agent Orchestrator           │ │
│  │  ├─ CodeArchitect             │ │
│  │  ├─ BackendDeveloper          │ │
│  │  ├─ FrontendDeveloper         │ │
│  │  ├─ Tester                    │ │
│  │  └─ DevOpsEngineer            │ │
│  └───────────┬───────────────────┘ │
│              │                      │
│              │ All AI requests      │
│              │                      │
│  ┌───────────▼───────────────────┐ │
│  │  CostOptimizerClient          │ │
│  │  - Wraps API calls            │ │──────┐
│  │  - Transparent to agents      │ │      │
│  └───────────────────────────────┘ │      │
└─────────────────────────────────────┘      │
                                             │
                 HTTP/API                    │
                                             │
                                             ▼
        ┌─────────────────────────────────────────┐
        │  ai-cost-optimizer (Separate Service)   │
        │  Deployed on Vercel                     │
        │                                         │
        │  Routes AI requests to:                 │
        │  - Gemini (FREE) - 70% of queries       │
        │  - Claude Haiku - Complex queries       │
        │  - Premium models - Edge cases          │
        │                                         │
        │  Result: 90% cost savings               │
        └─────────────────────────────────────────┘
```

### Implementation

**Environment Configuration**:
```bash
# .env
COST_OPTIMIZER_API_URL=https://your-cost-optimizer.vercel.app
COST_OPTIMIZER_API_KEY=your_api_key_here
```

**Usage in Agents**:
```typescript
// src/services/cost-optimizer/client.ts
import { CostOptimizerClient } from '@/services/cost-optimizer/client'

const costOptimizer = new CostOptimizerClient({
  apiUrl: process.env.COST_OPTIMIZER_API_URL!,
  apiKey: process.env.COST_OPTIMIZER_API_KEY!
})

// All agents use this for AI calls
export async function callAI(params: {
  prompt: string
  complexity: 'simple' | 'medium' | 'complex'
  agentType: string
}) {
  const response = await costOptimizer.optimizeCompletion({
    prompt: params.prompt,
    complexity: params.complexity,
    metadata: {
      agent: params.agentType,
      timestamp: new Date().toISOString()
    }
  })

  return response.text
}
```

**Benefits**:
- ✅ Agents don't need to know about costs
- ✅ Cost optimizer handles all routing
- ✅ Both repos evolve independently
- ✅ Other projects can use cost-optimizer too
- ✅ 90% cost savings automatically

---

## 📈 Feedback Loop System

### How It Learns

The system improves with every project built:

```
1. User Request
   "Build a todo app"
         ↓
2. Orchestrator Plans
   - Spawns agents
   - Tracks decisions
         ↓
3. Agents Build
   - Generate code
   - Run tests
   - Deploy
         ↓
4. Feedback Collection
   - Did tests pass?
   - Any errors during build?
   - Deployment successful?
   - User satisfaction
         ↓
5. Learning Storage
   - Store successful patterns
   - Flag failed approaches
   - Update agent prompts
         ↓
6. Next Project (Smarter!)
   - Better architecture decisions
   - Fewer errors
   - Faster build times
```

### Storage

**Feedback Data Structure**:
```typescript
interface ProjectFeedback {
  projectId: string
  userRequest: string
  agentsSpawned: string[]
  decisions: {
    agent: string
    decision: string
    successful: boolean
  }[]
  buildTime: number
  testsPass: boolean
  deploymentSuccess: boolean
  userRating?: number
  patterns: {
    successful: string[]
    failed: string[]
  }
}
```

**Stored in**: Supabase (PostgreSQL)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier)
- Vercel account (free tier)
- API keys for cost-optimizer

### Installation

```bash
# 1. Clone repository
git clone https://github.com/ScientiaCapital/ai-development-cockpit.git
cd ai-development-cockpit

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your keys:
# - COST_OPTIMIZER_API_URL
# - COST_OPTIMIZER_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Setup database
# Run Supabase migrations (see /supabase/migrations/)

# 5. Start development server
npm run dev

# 6. Open browser
# http://localhost:3000
```

### Environment Variables

**Required**:
```bash
# Cost Optimizer (ai-cost-optimizer service)
COST_OPTIMIZER_API_URL=https://your-optimizer.vercel.app
COST_OPTIMIZER_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Server-side only
```

**Optional**:
```bash
# Direct LLM access (fallback if cost-optimizer unavailable)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

---

## 🎯 Development Workflow

### Building a New Agent

```typescript
// src/agents/BaseAgent.ts
import { callAI } from '@/services/cost-optimizer/client'

export abstract class BaseAgent {
  constructor(
    protected agentType: string,
    protected projectContext: ProjectContext
  ) {}

  protected async think(prompt: string, complexity: 'simple' | 'medium' | 'complex') {
    return callAI({
      prompt,
      complexity,
      agentType: this.agentType
    })
  }

  abstract execute(): Promise<AgentOutput>
}

// Example: CodeArchitect extends BaseAgent
export class CodeArchitect extends BaseAgent {
  async execute(): Promise<ArchitectureOutput> {
    const architecture = await this.think(
      `Design architecture for: ${this.projectContext.userRequest}`,
      'complex'
    )

    return parseArchitecture(architecture)
  }
}
```

### Spawning Agents

```typescript
// src/orchestrator/AgentOrchestrator.ts
import { CodeArchitect } from '@/agents/CodeArchitect'
import { BackendDeveloper } from '@/agents/BackendDeveloper'

export class AgentOrchestrator {
  async buildProject(userRequest: string) {
    // 1. Architect designs system
    const architect = new CodeArchitect('code-architect', { userRequest })
    const architecture = await architect.execute()

    // 2. Backend dev builds APIs
    const backendDev = new BackendDeveloper('backend-dev', {
      userRequest,
      architecture
    })
    const backend = await backendDev.execute()

    // 3. Frontend dev builds UI
    // 4. Tester validates
    // 5. DevOps deploys

    // 6. Collect feedback
    await this.storeFeedback({ ... })
  }
}
```

---

## 📊 Project Structure

```
ai-development-cockpit/
├── src/
│   ├── orchestrator/
│   │   ├── AgentOrchestrator.ts      # Main orchestrator
│   │   ├── AgentSpawner.ts           # Spawns agents dynamically
│   │   └── FeedbackLoop.ts           # Learning system
│   ├── agents/
│   │   ├── BaseAgent.ts              # Abstract base class
│   │   ├── CodeArchitect.ts          # Architecture agent
│   │   ├── BackendDeveloper.ts       # Backend agent
│   │   ├── FrontendDeveloper.ts      # Frontend agent
│   │   ├── Tester.ts                 # Testing agent
│   │   └── DevOpsEngineer.ts         # Deployment agent
│   ├── services/
│   │   ├── cost-optimizer/
│   │   │   └── CostOptimizerClient.ts  # Wraps ai-cost-optimizer API
│   │   ├── project/
│   │   │   └── ProjectManager.ts       # Manages user projects
│   │   └── feedback/
│   │       └── FeedbackCollector.ts    # Collects learning data
│   ├── app/
│   │   ├── dashboard/                # User dashboard
│   │   ├── project-builder/          # Project creation UI
│   │   ├── projects/[id]/            # Project detail pages
│   │   └── api/
│   │       ├── orchestrator/         # Agent spawning API
│   │       └── feedback/             # Feedback API
│   ├── components/
│   │   ├── project/                  # Project UI components
│   │   ├── agents/                   # Agent status displays
│   │   └── feedback/                 # Feedback forms
│   └── types/
│       ├── agents.ts                 # Agent interfaces
│       ├── project.ts                # Project types
│       └── feedback.ts               # Feedback types
├── supabase/
│   └── migrations/                   # Database migrations
├── tests/
│   ├── agents/                       # Agent tests
│   ├── orchestrator/                 # Orchestrator tests
│   └── e2e/                          # End-to-end tests
└── docs/
    ├── agents/                       # Agent documentation
    ├── architecture/                 # System design docs
    └── integration/                  # Integration guides
```

---

## 🧪 Testing

### Agent Testing

```bash
# Run all tests
npm run test

# Test specific agent
npm run test -- tests/agents/CodeArchitect.test.ts

# Test orchestrator
npm run test -- tests/orchestrator/

# E2E tests (full project build)
npm run test:e2e
```

### Manual Testing

```bash
# Test agent spawning
npm run dev

# Navigate to http://localhost:3000/project-builder
# Enter: "Build a todo app with user authentication"
# Watch agents work in real-time
```

---

## 📚 Documentation

### Internal Docs

- **README.md** - Project overview and quick start
- **docs/architecture/** - System architecture diagrams
- **docs/agents/** - Individual agent documentation
- **docs/integration/cost-optimizer.md** - ai-cost-optimizer integration guide
- **docs/feedback-loop.md** - Learning system documentation

### API Documentation

Agent API endpoints:
- `POST /api/orchestrator/spawn` - Spawn agent team for project
- `GET /api/orchestrator/status/:projectId` - Check agent progress
- `POST /api/feedback/submit` - Submit project feedback
- `GET /api/feedback/patterns` - Get successful patterns

---

## 🔒 Authentication & Security

### User Authentication

Uses Supabase Auth:
- Email/password authentication
- OAuth providers (Google, GitHub)
- JWT-based sessions
- Row Level Security (RLS)

### API Security

- All API routes require authentication
- Rate limiting on agent spawning
- Project isolation (users can only see their projects)
- Environment variables for secrets

---

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Configure environment variables in Vercel dashboard:
# - COST_OPTIMIZER_API_URL
# - COST_OPTIMIZER_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### Supabase Setup

```bash
# 1. Create Supabase project at supabase.com
# 2. Get credentials from project settings
# 3. Run migrations
npx supabase db push

# 4. Enable Row Level Security
# See supabase/migrations/ for RLS policies
```

---

## 🎯 Roadmap

### Phase 1: Core Agents (Current)
- [x] Agent orchestration system
- [x] Code Architect agent
- [ ] Backend Developer agent
- [ ] Frontend Developer agent
- [ ] Tester agent
- [ ] DevOps agent

### Phase 2: Learning System
- [ ] Feedback collection
- [ ] Pattern recognition
- [ ] Agent prompt optimization
- [ ] Success metrics tracking

### Phase 3: Advanced Features
- [ ] More specialized agents (DB Designer, Security Auditor, Performance Optimizer)
- [ ] Multi-language support (Python, Go, Rust)
- [ ] Custom agent creation
- [ ] Agent marketplace

### Phase 4: Scaling
- [ ] Parallel agent execution
- [ ] Distributed orchestration
- [ ] Real-time collaboration
- [ ] Team workspaces

---

## 💡 Best Practices

### Agent Development

**Do**:
- ✅ Extend BaseAgent for all agents
- ✅ Use cost-optimizer for ALL AI calls
- ✅ Implement comprehensive error handling
- ✅ Log decisions for feedback loop
- ✅ Write tests for agent logic

**Don't**:
- ❌ Call LLM APIs directly (always use cost-optimizer)
- ❌ Hard-code agent prompts (make them adaptive)
- ❌ Skip feedback collection
- ❌ Forget to test edge cases

### Cost Optimization

- Always route through ai-cost-optimizer
- Classify complexity correctly (simple/medium/complex)
- Monitor cost per project
- Track which agents cost most

### Feedback Loop

- Collect feedback on every project
- Store both successes and failures
- Use data to improve agent prompts
- Track improvement metrics over time

---

## 🔗 Related Projects

- **[ai-cost-optimizer](https://github.com/ScientiaCapital/ai-cost-optimizer)** - 90% cost savings for AI requests
- More to come as we build the ecosystem!

---

## 🤝 Contributing

We welcome contributions! Focus areas:
- New agent types
- Improved orchestration logic
- Better feedback loop algorithms
- Cost optimization strategies

---

**Status**: 🟢 **Active Development**

**Next**: Building the core agent team (Architect, Backend, Frontend, Tester, DevOps)

Ready to empower coding noobs to build anything! 🚀
