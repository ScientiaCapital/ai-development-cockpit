# ai-development-cockpit

**Branch**: main | **Updated**: 2025-12-21
**Sprint**: 10-12 Hour Process Studio Execution

## Status
Phase 4 Active: Coperniq MEP Templates. 22 outdated docs archived. **52+ templates built**, ~20 remaining. Major progress Dec 21 with 14 Field Work Orders complete.

## Current Sprint (Remaining Work)

### Field Work Orders (7 remaining)
- [x] Electrical Panel Upgrade (DONE)
- [x] Generator Installation (DONE)
- [ ] EV Charger Install
- [ ] Ductless Mini-Split Install
- [x] Water Heater Replacement (DONE)
- [ ] Backflow Test & Cert
- [ ] Fire Sprinkler Inspection
- [ ] Grease Trap Service
- [ ] Roof Leak Repair
- [ ] Emergency Plumbing

### Hour 3-4: Emergency Forms (3)
- [ ] Outage Impact Assessment
- [ ] Generator Rental Agreement
- [ ] Post-Outage Safety Checklist

### Hour 4-6: Automations (10)
- [ ] Lead Assignment
- [ ] Quote to Job
- [ ] Job to Invoice
- [ ] Payment Update
- [ ] Permit to Install
- [ ] Emergency WO
- [ ] PM Ticket
- [ ] Portal Welcome
- [ ] Review Alert
- [ ] Renewal Reminder

### Hour 6-11: Templates by Trade (59)
- HVAC (9), Solar (10), Plumbing (6), Electrical (6)
- Fire Protection (5), Controls (5)
- Service Plans (4), TUD Market (8)

See `coperniq-mep-templates/TEMPLATE_INVENTORY.md` for full checklist.

## Done (This Session - Dec 21)
- ULTRATHINK: Full project audit completed
- Archived 22 outdated Nov 2025 docs to `docs/archive/`
- Closed `claude-sdk-integration` worktree
- Created `TEMPLATE_INVENTORY.md` tracking doc
- Added journal entry to coperniq-forge
- Mapped 5 Coperniq differentiators:
  1. Incentive Maximization Engine
  2. SREC Compliance Autopilot (7 states)
  3. Multi-Trade Cross-Sell
  4. Permitting Intelligence
  5. O&M as 20-Year Revenue

## Blockers
- Playwright browser lock prevents Coperniq automation (manual build required)

## Monthly Roadmap (Dec 21 - Jan 21)
- **Week 1**: Process Studio Sprint (76 templates)
- **Week 2**: Automations + Workflows (10 core)
- **Week 3**: Analytics Dashboard MVP
- **Week 4**: Contractor-Specific Dashboards
- **Week 5**: Polish + Documentation

## Critical URLs
- **Coperniq Process Studio**: https://app.coperniq.io/112/company/studio/templates
- **Vercel Webapp**: https://webapp-scientia-capital.vercel.app
- **Template Inventory**: `coperniq-mep-templates/TEMPLATE_INVENTORY.md`

## Research Archive
- `bug-hive/MEP_TEMPLATE_SPEC.md` - 31KB template specs
- `bug-hive/COPERNIQ_SCHEMA.md` - GraphQL types
- `coperniq-mep-templates/docs/compliance/*.md` - State compliance (CA, FL, SREC states)
- `coperniq-mep-templates/docs/incentives/*.md` - Federal + state incentives

## Tech Stack
Next.js 14 | TypeScript | OpenRouter (Claude) | Supabase | Tailwind | shadcn/ui

## Links
- GitHub: https://github.com/ScientiaCapital/ai-development-cockpit
- Coperniq: https://app.coperniq.io/112
