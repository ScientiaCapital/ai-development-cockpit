# ai-development-cockpit

**Branch**: main | **Updated**: 2025-12-21

## Status
Phase 4 Active: Coperniq MEP Templates webapp deployed to Vercel. 60 MEP templates complete. Service Plan templates rebuilt as enterprise-grade enrollment forms. Next: Build all templates directly in Coperniq's Form Builder.

## Tomorrow's Focus
1. [ ] Build 60 templates directly in Coperniq Form Builder
   - **URL**: https://app.coperniq.io/112/company/studio/templates/form-templates
2. [ ] Configure Project Workflows in Coperniq
   - **URL**: https://app.coperniq.io/112/company/studio/workflows/project-workflows
3. [ ] Fix test paths (webapp directory structure)

## Done (This Session - Dec 21)
- OpenRouter migration completed for all 3 AI agents (FormFiller, JobHelper, DocGen)
- Rebuilt Service Plan templates as enterprise enrollment forms:
  - `hvac_bronze.yaml` - 24 fields, 5 groups
  - `hvac_silver.yaml` - 22 fields, 5 groups
  - `hvac_gold.yaml` - 24 fields, 5 groups
  - `plumbing_protect.yaml` - 23 fields, 5 groups
- Created form submissions backend:
  - `supabase/migrations/004_simple_form_submissions.sql`
  - `app/api/submissions/route.ts`
- Security audit passed:
  - No hardcoded secrets
  - No .env files tracked
  - Next.js 14.2.35 (latest patch)
- Verified enterprise template requirements documented

## Done (Previous Sessions - Dec 20)
- Contractor Command Center webapp deployed to Vercel
- 60 MEP templates created across 12 trades
- 3 AI agents (FormFiller, JobHelper, DocGen) integrated
- GTM vertical configs created (solar_epc, hvac_mep, om_service, multi_trade)
- Schema aligned to Coperniq GraphQL types

## Blockers
- Playwright browser lock prevents Coperniq automation (need manual build)

## Active Worktrees
| Path | Branch | Purpose |
|------|--------|---------|
| `main` | main | Current work |
| `claude-sdk-integration` | feature/claude-sdk-cost-optimizer-integration | Claude SDK |

## Enterprise Template Requirements (Future)
- Asset linking (equipment → form)
- Compliance validation (EPA 608, NFPA 25)
- History/trending (measurements over time)
- Calculated fields (auto-totals, efficiency ratings)
- Conditional logic (show/hide based on selections)
- Approval workflows (tech → supervisor → customer)

## Critical URLs
- **Coperniq Form Builder**: https://app.coperniq.io/112/company/studio/templates/form-templates
- **Coperniq Workflows**: https://app.coperniq.io/112/company/studio/workflows/project-workflows
- **Vercel Webapp**: https://webapp-scientia-capital.vercel.app

## Quick Commands
```bash
npm run dev      # Start dev server (webapp)
npm run build    # Production build
npm test         # Run tests (needs path fixes)
git push         # Push changes to origin
```

## Tech Stack
Next.js 14 | TypeScript | OpenRouter (Claude) | Supabase | Tailwind | shadcn/ui

## Links
- GitHub: https://github.com/ScientiaCapital/ai-development-cockpit
- Coperniq: https://app.coperniq.io/112
