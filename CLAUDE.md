# AI Development Cockpit

**Updated**: 2025-12-06
**Status**: Phase 3 Complete | RunPod Deployment In Progress
**Branch**: `main`

---

## Quick Start

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npx tsc --noEmit     # Type check
```

---

## Project Overview

Multi-agent orchestration system enabling non-coders to build software in any language using plain English.

**Stack**: Next.js 15, TypeScript, LangGraph, FastAPI
**Languages**: Python, Go, Rust, TypeScript
**Cost Savings**: 89% via multi-provider routing (Claude, DeepSeek, Qwen)

---

## What's Built

| Feature | Status |
|---------|--------|
| Chat Interface (`/chat`) | Complete |
| Multi-Language Adapters | Complete (Python, Go, Rust, TS) |
| Multi-Model Providers | Complete (Claude, DeepSeek, Qwen) |
| Cost Optimizer | Complete (89% savings) |
| GitHub OAuth | Complete |
| LangGraph Orchestrator | Complete |
| Agent Team Integration | Complete (98 tests) |

**Active Agents**: BackendDeveloper, FrontendDeveloper, Tester, DevOpsEngineer

---

## Key Files

```
src/
├── app/chat/           # Chat interface
├── orchestrator/       # LangGraph state machine
├── agents/             # AI agent implementations
├── adapters/           # Language adapters (Python/Go/Rust/TS)
├── providers/          # AI model providers
└── services/           # Cost optimizer, requirements extractor
```

---

## Required Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## Rules

- **NO OpenAI** - Use Claude, DeepSeek, or Qwen only
- **API keys in .env only** - Never hardcode
- **TDD methodology** - Test first

---

## Documentation

| File | Purpose |
|------|---------|
| `PLAN.md` | Master plan, roadmap, active work |
| `README.md` | Public project description |
| `docs/archive/` | Historical summaries and guides |

---

## Deployment

- **Docker Hub**: `tmk74/ai-development-cockpit:latest`
- **RunPod Template**: `t5tolm6jo7`
- **RunPod Endpoint**: `xb46cmloysnzro`

---

## Links

- **GitHub**: https://github.com/ScientiaCapital/ai-development-cockpit
- **Docker Hub**: https://hub.docker.com/r/tmk74/ai-development-cockpit
- **Supabase**: https://supabase.com/dashboard/project/xucngysrzjtwqzgcutqf
