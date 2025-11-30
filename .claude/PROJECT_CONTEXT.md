# ai-development-cockpit

**Branch**: main | **Updated**: 2025-11-30

## Status
Phase 3 Complete. Agent Team Integration Complete. LangGraph orchestrator with BackendDeveloper, FrontendDeveloper, Tester, DevOpsEngineer all wired in. RunPod deployment in progress.

## Today's Focus
1. [ ] Deploy to RunPod (serverless endpoint)
2. [ ] E2E testing on production
3. [ ] Real-time progress dashboard

## Done (This Session)
- (none yet)

## Critical Rules
- **NO OpenAI models** - Use Claude, DeepSeek, or Qwen only
- API keys in `.env` only, never hardcode
- TDD methodology - Test first

## Blockers
(none)

## Quick Commands
```bash
# Start dev server
npm run dev

# Production build
npm run build

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

## Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: FastAPI (Python)
- **AI Models**: Claude Sonnet 4.5, DeepSeek Chat, Qwen VL Plus
- **Deployment**: RunPod Serverless, Vercel
- **Database**: Supabase
- **Auth**: GitHub OAuth
- **Cost Savings**: 89% via multi-provider routing
