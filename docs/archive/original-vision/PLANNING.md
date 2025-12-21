# AI Development Cockpit - Architecture & Planning

**Last Updated**: 2025-11-30
**Status**: Phase 3 Complete - Agent Team Integration ✅
**Next Phase**: RunPod Deployment + E2E Testing 🚧

---

## Vision

Enable non-coders to build software in any language (Python, Go, Rust, TypeScript) using plain English, powered by multi-agent orchestration and cost-optimized AI routing.

---

## Architecture Overview

### Multi-Agent Team

| Agent | Language | Framework | Responsibilities |
|-------|----------|-----------|------------------|
| **BackendDeveloper** | Python/Go/Rust/TS | FastAPI/Gin/Actix-web/Express | API routes, business logic, database models |
| **FrontendDeveloper** | TypeScript | React 18, Next.js 15 | UI components, state management, client-side logic |
| **Tester** | TypeScript | Jest, Vitest, Playwright | Unit tests, integration tests, E2E tests |
| **DevOpsEngineer** | Bash/YAML | Vercel, RunPod, Docker, GitHub Actions | Deployment configs, CI/CD pipelines, monitoring |

### LangGraph Orchestrator

**File**: `src/orchestrator/graph.ts`

**Nodes**:
```typescript
const workflow = new StateGraph<GraphState>()
  .addNode('buildNode', buildNode)      // Spawns BackendDeveloper + FrontendDeveloper
  .addNode('testNode', testNode)        // Spawns Tester (unit + e2e)
  .addNode('deployNode', deployNode)    // Spawns DevOpsEngineer (vercel/docker/github-actions)
  .addNode('feedbackNode', feedbackNode); // Aggregates costs, time, success/failure
```

**State**:
```typescript
interface GraphState {
  userRequest: string;              // Plain English input
  backendCode?: CodeOutput;         // Generated backend code
  frontendCode?: CodeOutput;        // Generated frontend code
  testResults?: TestResults;        // Test execution results
  deploymentStatus?: DeploymentStatus; // Deployment outcome
  costTracking: {
    totalCost: number;
    provider: string;
    tokensUsed: number;
  };
  errors?: string[];
}
```

**Workflow**:
```
┌──────────────┐
│ User Request │
│ (Plain English)
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌─────────────────┐
│  buildNode   │────▶│ BackendDeveloper│ (Python/Go/Rust/TS)
│              │     └─────────────────┘
│              │     ┌─────────────────┐
│              │────▶│FrontendDeveloper│ (React/Next.js)
└──────┬───────┘     └─────────────────┘
       │
       ▼
┌──────────────┐     ┌─────────────────┐
│  testNode    │────▶│     Tester      │ (Jest/Playwright)
└──────┬───────┘     └─────────────────┘
       │
       ▼
┌──────────────┐     ┌─────────────────┐
│ deployNode   │────▶│ DevOpsEngineer  │ (Vercel/RunPod)
└──────┬───────┘     └─────────────────┘
       │
       ▼
┌──────────────┐
│feedbackNode  │ (Cost tracking, metrics)
└──────────────┘
```

---

## Language Adapters

### Adapter Pattern
```typescript
interface LanguageAdapter {
  language: 'python' | 'go' | 'rust' | 'typescript';
  generateCode(prompt: string): Promise<CodeOutput>;
  validateSyntax(code: string): Promise<boolean>;
  runTests(code: string): Promise<TestResults>;
}
```

### Implementations

**PythonAdapter** (`src/adapters/PythonAdapter.ts`):
- Framework: FastAPI
- Formatter: `black`
- Test Runner: `pytest`
- Use Cases: REST APIs, data processing, ML pipelines

**GoAdapter** (`src/adapters/GoAdapter.ts`):
- Framework: Gin
- Formatter: `gofmt`
- Test Runner: `go test`
- Use Cases: Microservices, CLI tools, high-performance backends

**RustAdapter** (`src/adapters/RustAdapter.ts`):
- Framework: Actix-web
- Formatter: `rustfmt`
- Test Runner: `cargo test`
- Use Cases: GPU compute, WebAssembly, systems programming

**TypeScriptAdapter** (`src/adapters/TypeScriptAdapter.ts`):
- Framework: Express (backend), React (frontend)
- Formatter: `prettier`
- Test Runner: `jest`
- Use Cases: Full-stack JavaScript, serverless functions

---

## Cost Optimization Strategy

### Multi-Provider Routing

**Objective**: Achieve ≥80% cost savings vs Claude-only approach.

| Provider | Model | Cost per 1M tokens | Use Case |
|----------|-------|-------------------|----------|
| **DeepSeek** | deepseek-chat | $0.27 | Code generation (Python/Go/Rust/TS) |
| **Qwen** | qwen-vl-plus | $0.31 | Visual analysis (UI/UX validation) |
| **Claude** | sonnet-4.5 | $3.00 | Complex reasoning (architecture decisions) |

### Cost Calculation Example

**Scenario**: Generate Python FastAPI backend + React frontend

```
Claude-only approach:
- Backend: 50K tokens × $3.00/1M = $0.15
- Frontend: 60K tokens × $3.00/1M = $0.18
- Total: $0.33

Optimized approach:
- Backend (DeepSeek): 50K × $0.27/1M = $0.0135
- Frontend (DeepSeek): 60K × $0.27/1M = $0.0162
- Total: $0.0297

Savings: ($0.33 - $0.0297) / $0.33 × 100 = 89%
```

### Circuit Breaker Configuration

```typescript
{
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  fallbackChain: [
    'deepseek',  // Try cheapest first
    'qwen',      // Fallback to mid-tier
    'claude'     // Last resort for quality
  ],
  costThreshold: 0.10 // Alert if single request > $0.10
}
```

**Implementation**: `src/services/costOptimizer.ts`

---

## Deployment Architecture

### Vercel (Frontend)
- **Platform**: Vercel Edge Network
- **Framework**: Next.js 15
- **Build Command**: `npm run build`
- **Output Directory**: `.next/`
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`

### RunPod (Serverless Backend)
- **Platform**: RunPod Serverless GPU
- **Container**: `tmk74/ai-development-cockpit:latest`
- **Dockerfile**: `Dockerfile.serverless`
- **Template ID**: `t5tolm6jo7`
- **Endpoint ID**: `xb46cmloysnzro`
- **Handler**: `src/runpod/handler.ts`
- **Environment Variables**:
  - `ANTHROPIC_API_KEY`
  - `DEEPSEEK_API_KEY`
  - `DASHSCOPE_API_KEY`

### Docker Hub
- **Username**: `tmk74`
- **Repository**: `ai-development-cockpit`
- **Tags**: `latest`, `v1.0.0`, `v1.1.0`, etc.

### CI/CD Pipeline (GitHub Actions)

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to RunPod

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -f Dockerfile.serverless -t tmk74/ai-development-cockpit:latest .
      - name: Push to Docker Hub
        run: docker push tmk74/ai-development-cockpit:latest
      - name: Trigger RunPod deployment
        run: curl -X POST https://api.runpod.io/v2/xb46cmloysnzro/run
```

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │  E2E Tests  │ (Playwright - 10% of tests)
        │   Slow      │
        └─────────────┘
      ┌───────────────────┐
      │ Integration Tests │ (Jest - 30% of tests)
      │    Medium         │
      └───────────────────┘
  ┌─────────────────────────┐
  │     Unit Tests          │ (Jest/Vitest - 60% of tests)
  │       Fast              │
  └─────────────────────────┘
```

### Current Test Coverage (98 tests)
- **FrontendDeveloper.test.ts**: 17 tests
- **Tester.test.ts**: 24 tests
- **DevOpsEngineer.test.ts**: 30 tests
- **graph.integration.test.ts**: 27 tests

### Test Execution
```bash
# Unit tests (fast)
npm test -- --testPathPattern=unit

# Integration tests
npm test -- --testPathPattern=integration

# E2E tests (slow)
npx playwright test

# Coverage report
npm test -- --coverage
```

### Coverage Targets
- Unit tests: ≥80%
- Integration tests: All critical paths
- E2E tests: Happy path + 2 error scenarios per feature

---

## Security & Compliance

### API Key Management
- **NEVER hardcode** - All keys in `.env` only
- **Environment Variables**: Documented in `.env.example`
- **Git Ignore**: `.env` excluded from version control

### Provider Restrictions
- **NO OpenAI** - Violates project rules
- **Allowed Providers**: Claude (Anthropic), DeepSeek, Qwen (Alibaba)

### Detection Script
```bash
# Run during validation
grep -r "openai" src/ --exclude-dir=node_modules
grep -r "gpt-" src/ --exclude-dir=node_modules
# Should return zero results
```

---

## Theme System

### Arcade Theme (Default)
```typescript
{
  name: 'arcade',
  colors: {
    primary: '#00ff00',
    secondary: '#00aa00',
    background: '#000000',
    text: '#00ff00'
  },
  font: 'JetBrains Mono',
  animations: {
    typing: true,
    cursorBlink: true,
    matrixRain: false
  }
}
```

### Enterprise Theme
```typescript
{
  name: 'enterprise',
  colors: {
    primary: '#0066cc',
    secondary: '#004499',
    background: '#f5f5f5',
    text: '#333333'
  },
  font: 'Inter',
  animations: {
    fade: true,
    slide: true
  }
}
```

**Toggle**: Users can switch themes via `/chat` settings panel.

---

## Performance Optimization

### Code Generation Latency
- **DeepSeek**: ~2-3 seconds for 50K token output
- **Qwen**: ~3-4 seconds for visual analysis
- **Claude**: ~4-5 seconds for complex reasoning

### Parallel Execution
```typescript
// BackendDeveloper and FrontendDeveloper run in parallel
const [backendCode, frontendCode] = await Promise.all([
  backendDeveloper.generateCode(backendPrompt),
  frontendDeveloper.generateCode(frontendPrompt)
]);
// Saves ~5 seconds vs sequential execution
```

### Caching Strategy
- Cache generated code by prompt hash
- TTL: 1 hour for dev, 24 hours for production
- Storage: Redis (future enhancement)

---

## Monitoring & Observability

### Metrics Tracked
1. **Cost Metrics**:
   - Total API cost per request
   - Cost per provider (DeepSeek/Qwen/Claude)
   - Savings vs Claude-only baseline

2. **Performance Metrics**:
   - Code generation time
   - Test execution time
   - Deployment time

3. **Quality Metrics**:
   - Test pass rate
   - Code syntax errors
   - User satisfaction (future)

### Logging
- **Supabase Logs**: All API requests, errors, user actions
- **RunPod Dashboard**: GPU utilization, endpoint health
- **Vercel Analytics**: Page views, load times

---

## Development Workflow

### 1. Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests in watch mode
npm test -- --watch
```

### 2. Feature Development (TDD)
```bash
# Step 1: Write tests
touch tests/unit/[feature].test.ts

# Step 2: Run tests (should fail)
npm test -- [feature].test.ts

# Step 3: Implement feature
touch src/[feature].ts

# Step 4: Run tests (should pass)
npm test -- [feature].test.ts

# Step 5: Refactor
# Improve code quality, re-run tests
```

### 3. Validation
```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Full test suite
npm test
```

### 4. Deployment
```bash
# Frontend (Vercel)
vercel --prod

# Backend (RunPod)
docker build -f Dockerfile.serverless -t tmk74/ai-development-cockpit:latest .
docker push tmk74/ai-development-cockpit:latest
```

---

## Roadmap

### Phase 4: RunPod Deployment (In Progress)
- [ ] Deploy serverless endpoint
- [ ] E2E testing with production API
- [ ] Monitor GPU utilization

### Phase 5: Real-Time Dashboard
- [ ] Live cost tracking
- [ ] Agent progress visualization
- [ ] User request queue

### Phase 6: Feedback Loop
- [ ] Collect user feedback on generated code
- [ ] Automatically improve prompts based on errors
- [ ] A/B test provider routing strategies

### Phase 7: Advanced Features
- [ ] Multi-file projects (generate entire repos)
- [ ] Version control integration (auto-commit to Git)
- [ ] Collaborative editing (multiple users)

---

## Critical Rules (Non-Negotiable)

1. **NO OpenAI models** - Use Claude, DeepSeek, Qwen only
2. **API keys in .env only** - Never hardcode
3. **TDD methodology** - Test first, code second
4. **Cost optimization** - Achieve ≥80% savings vs Claude-only
5. **Multi-language support** - Python, Go, Rust, TypeScript

---

## Links

- **GitHub**: https://github.com/ScientiaCapital/ai-development-cockpit
- **Docker Hub**: https://hub.docker.com/r/tmk74/ai-development-cockpit
- **Supabase**: https://supabase.com/dashboard/project/xucngysrzjtwqzgcutqf
- **Vercel**: https://vercel.com/dashboard
- **RunPod**: https://www.runpod.io/console/serverless

---

**Last Updated**: 2025-11-30
**Next Review**: 2025-12-07
