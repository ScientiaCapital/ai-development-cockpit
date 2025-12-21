# ai-development-cockpit

**Branch**: main (3 commits ahead of origin) | **Updated**: 2025-12-20

## Status
Phase 4 Active: Coperniq MEP Templates + Clean Energy + TUD Market Platform. Building agentic AI team to create 54+ form templates for MEP contractors before EOY. GTM vertical configs completed with exact Coperniq GraphQL schema alignment.

## Today's Focus
1. [ ] Push 3 local commits to origin
2. [ ] Wave 1: Explore Coperniq UI (Playwright MCP)
3. [ ] Wave 2: Create 54 template YAML files (6 parallel agents)
4. [ ] Wave 3: Infrastructure (FastAPI server, Supabase schema)
5. [ ] Wave 4: Seed templates to Coperniq via Playwright

## Done (This Session - Dec 20)
- GTM vertical JSON files created (`config/gtm_verticals/`)
  - `solar_epc.json` - Phase-based workflow (Sales → Interconnect)
  - `hvac_mep.json` - Phase-based workflow (Bid → Closeout)
  - `om_service.json` - Ticket-based workflow (service calls, PM)
  - `multi_trade.json` - Hybrid workflow (inherits all three)
- Schema aligned to exact Coperniq GraphQL types:
  - Contact (192 fields), Site (119 fields), Asset (67 fields)
  - Task (55 fields), System (106 fields), ServicePlanInstance (41 fields)
- E2B Sandbox GTM design spec documented
- `load_vertical()` method added to orchestrator

## Done (Previous Sessions)
- Phase 3 Complete: Agent Team Integration (98 tests)
- LangGraph orchestrator with all agents wired
- RunPod deployment configuration
- MEP Template Product specs (31KB of documentation)

## Blockers
- 3 commits need to be pushed to origin
- CTO API access pending for direct Coperniq GraphQL

## Active Worktrees
- `main` - Current work (this branch)
- `feature/claude-sdk-cost-optimizer-integration` - Claude SDK integration (separate)

## Review Gates Required
| Gate | What's Reviewed | Status |
|------|-----------------|--------|
| Gate 0 | Discovery Approval | Pending |
| Gate 1 | Template Specs Approval | Pending |
| Gate 2 | Schema Approval | Pending |
| Gate 3 | Code Approval | Pending |
| Gate 4 | UI Validation in Coperniq | Pending |

## Agent Matching for Next Tasks

| Task | Agent Type | Model |
|------|-----------|-------|
| Explore Coperniq UI | `Explore` | Sonnet |
| HVAC templates (10) | `feature-dev:code-architect` | Sonnet |
| Plumbing templates (6) | `feature-dev:code-architect` | Sonnet |
| Electrical templates (6) | `feature-dev:code-architect` | Sonnet |
| Solar templates (10) | `feature-dev:code-architect` | Sonnet |
| Fire Protection (5) | `feature-dev:code-architect` | Sonnet |
| Controls + TUD (13) | `feature-dev:code-architect` | Sonnet |
| FastAPI server | `api-scaffolding:fastapi-pro` | DeepSeek |
| Review all | `superpowers:code-reviewer` | Opus |

## Critical Rules
- **NO OpenAI models** - Use Claude, DeepSeek, or Qwen only
- API keys in `.env` only, never hardcode
- TDD methodology - Test first
- 100% review gates before proceeding

## Quick Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm test         # Run tests
git push         # Push 3 pending commits
```

## Tech Stack
Next.js 15 | TypeScript | FastAPI | RunPod Serverless | Claude + DeepSeek + Qwen | 89% cost savings

## Links
- GitHub: https://github.com/ScientiaCapital/ai-development-cockpit
- Coperniq: https://app.coperniq.io/112
- Plan File: `~/.claude/plans/linked-weaving-twilight.md`
