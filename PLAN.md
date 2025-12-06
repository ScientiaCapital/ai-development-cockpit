# AI Development Cockpit - Master Plan

**Last Updated**: 2025-12-06
**Status**: Phase 3 Complete | RunPod Deployment In Progress
**Branch**: `main`

---

## Project Vision

Enable non-coders to build software in any language (Python, Go, Rust, TypeScript) using plain English, powered by multi-agent orchestration and cost-optimized AI routing.

**Core Value**: Transform coding noobs into software engineering managers who direct AI agent teams to build real products.

---

## Current State Summary

### Completed (Phases 1-3)

| Component | Status | Details |
|-----------|--------|---------|
| **Chat Interface** | `/chat` | Plain English to code |
| **Multi-Language Adapters** | 4 languages | Python/FastAPI, Go/Gin, Rust/Actix-web, TypeScript |
| **Multi-Model Providers** | 3 providers | Claude Sonnet 4.5, DeepSeek Chat, Qwen VL Plus |
| **Cost Optimizer** | 89% savings | Circuit breaker, retry logic, multi-provider routing |
| **GitHub OAuth** | Working | Login, repo browsing |
| **Agent Team** | Integrated | BackendDeveloper, FrontendDeveloper, Tester, DevOpsEngineer |
| **LangGraph Orchestrator** | Complete | buildNode, testNode, deployNode, feedbackNode |
| **Tests** | 98 passing | Unit + Integration coverage |

### Architecture

```
┌────────────────────────────────────────┐
│  User Request (Plain English)          │
└──────────────┬─────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  LangGraph Orchestrator (src/orchestrator/graph.ts)  │
├──────────────────────────────────────────────────────┤
│  buildNode    → BackendDeveloper + FrontendDeveloper │
│  testNode     → Tester (unit + e2e)                  │
│  deployNode   → DevOpsEngineer                       │
│  feedbackNode → Cost/time aggregation                │
└──────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  Cost Optimizer (src/services/costOptimizer.ts)      │
├──────────────────────────────────────────────────────┤
│  DeepSeek ($0.27/1M) → Code generation               │
│  Qwen ($0.31/1M)     → Visual analysis               │
│  Claude ($3.00/1M)   → Complex reasoning (fallback)  │
└──────────────────────────────────────────────────────┘
```

---

## Active Work

### In Progress: RunPod Deployment

**Objective**: Deploy to production RunPod endpoint and validate E2E

**Tasks**:
- [ ] Verify Docker image on RunPod (`tmk74/ai-development-cockpit:latest`)
- [ ] Test `/chat` endpoint with real requests
- [ ] Monitor GPU utilization in RunPod dashboard
- [ ] Validate cost savings (target: ≥80%)

**Deployment Info**:
- Docker Hub: `tmk74/ai-development-cockpit:latest`
- RunPod Template ID: `t5tolm6jo7`
- RunPod Endpoint ID: `xb46cmloysnzro`

---

## Roadmap

### Phase 4: Production Polish (Next)
- [ ] RunPod deployment testing
- [ ] E2E testing on production API
- [ ] Real-time progress dashboard
- [ ] User feedback collection

### Phase 5: Advanced Features (Future)
- [ ] Multi-file project generation (entire repos)
- [ ] Version control integration (auto-commit to Git)
- [ ] Collaborative editing (multiple users)
- [ ] Code review agent

### Phase 6: Scale (Future)
- [ ] Learning system (pattern recognition)
- [ ] A/B test provider routing
- [ ] Enterprise features
- [ ] Agent marketplace

---

## Key Files

```
src/
├── app/chat/                 # Chat interface
├── orchestrator/
│   └── graph.ts              # LangGraph state machine
├── agents/
│   ├── BackendDeveloper.ts   # API/backend generation
│   ├── FrontendDeveloper.ts  # React/Next.js generation
│   ├── Tester.ts             # Jest + Playwright tests
│   └── DevOpsEngineer.ts     # Deployment configs
├── adapters/
│   ├── PythonAdapter.ts      # FastAPI
│   ├── GoAdapter.ts          # Gin
│   ├── RustAdapter.ts        # Actix-web
│   └── TypeScriptAdapter.ts  # Express/React
├── providers/
│   ├── ClaudeProvider.ts
│   ├── DeepSeekProvider.ts
│   └── QwenProvider.ts
└── services/
    └── costOptimizer.ts      # Multi-provider routing
```

---

## Development Commands

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Deploy to Docker Hub
docker build -f Dockerfile.serverless -t tmk74/ai-development-cockpit:latest .
docker push tmk74/ai-development-cockpit:latest
```

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GITHUB_CLIENT_ID=Iv23...
GITHUB_CLIENT_SECRET=...
```

---

## Critical Rules

1. **NO OpenAI** - Use Claude, DeepSeek, or Qwen only
2. **API keys in .env only** - Never hardcode
3. **TDD methodology** - Test first, code second
4. **Cost optimization** - Achieve ≥80% savings

---

## Links

- **GitHub**: https://github.com/ScientiaCapital/ai-development-cockpit
- **Docker Hub**: https://hub.docker.com/r/tmk74/ai-development-cockpit
- **Supabase**: https://supabase.com/dashboard/project/xucngysrzjtwqzgcutqf

---

## Session Notes

### 2025-12-06
- Consolidated documentation (archived old summaries/reports)
- Removed taskmaster/shrimp task system
- Created master PLAN.md

### 2025-11-30
- Context engineering files created (6-file system)
- BACKLOG.md for sprint tracking

### 2025-11-29
- Agent Team Integration complete (98 new tests)
- LangGraph orchestrator with all nodes wired

### 2025-11-25
- Docker Hub deployment (`tmk74`)
- RunPod workers initializing

---

*This is the master plan. For project configuration, see CLAUDE.md. For public info, see README.md.*
