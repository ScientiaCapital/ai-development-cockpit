# AI Development Cockpit

**Updated**: 2025-11-25
**Status**: Phase 3 Complete ✅ | Claude SDK Integration Complete ✅
**Branch**: `main`

---

## Project Overview

Multi-agent orchestration system enabling non-coders to build software in any language using plain English.

**Stack**: Next.js 15, TypeScript, FastAPI, RunPod Serverless
**Languages**: Python, Go, Rust, TypeScript
**Cost Savings**: 89% via multi-provider routing (Claude, DeepSeek, Qwen)

---

## Current State

### Completed Features
- **Chat Interface**: `/chat` - Plain English to code
- **Multi-Language Adapters**: Python/FastAPI, Go/Gin, Rust/Actix-web, TypeScript
- **Multi-Model Providers**: Claude Sonnet 4.5, DeepSeek Chat, Qwen VL Plus
- **Cost Optimizer**: Circuit breaker, retry logic, 89% savings
- **GitHub OAuth**: Login, repo browsing
- **RunPod Config**: Serverless deployment ready

### Theme System
- `'arcade'` - Green terminal aesthetic
- `'enterprise'` - Blue professional look

---

## Key Files

```
src/
├── app/chat/           # Chat interface
├── orchestrator/       # Agent orchestration
├── providers/          # AI model providers
├── adapters/           # Language adapters
├── services/           # Cost optimizer, requirements extractor
└── runpod/            # Serverless handler
```

---

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
```

### Required Environment Variables
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

## Links

- **GitHub**: https://github.com/ScientiaCapital/ai-development-cockpit
- **Supabase**: https://supabase.com/dashboard/project/xucngysrzjtwqzgcutqf

---

## Next Steps

1. Deploy to RunPod (serverless endpoint)
2. E2E testing on production
3. Real-time progress dashboard
4. Feedback loop for continuous improvement
