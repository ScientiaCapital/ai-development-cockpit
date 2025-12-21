# ai-development-cockpit

**Branch**: main | **Updated**: 2025-12-21 (End of Day)
**Sprint**: MEP Automations Build - Manual Coperniq Process Studio

## Status
Phase 4 Active: Coperniq MEP Templates. Building 10 MEP automations in Process Studio. **61 templates built**, 20 remaining. 2 automations fully complete, 1 in progress (Job to Invoice needs email fields configured).

## Tomorrow Start: [MEP] Job to Invoice Email Config
**URL**: https://app.coperniq.io/112/company/studio/automations/5734

**What's Done**:
- Automation created with name "[MEP] Job to Invoice"
- Trigger configured: "Work Order marked complete"
- Action type selected: "Send email"
- From address set: "No Reply - coperniqenergy@coperniq.io"

**What's Needed** (continue here):
1. Configure "To" field - use Coperniq token for customer email
2. Configure "Subject" - instructional example like "Work Complete - Invoice Ready for /Project name"
3. Configure "Body" - instructional email showing token usage
4. Click Save on Action section
5. Then continue with remaining 7 automations

## Automations Progress
- [x] [MEP] HVAC Lead Assignment (COMPLETE - "Update property" action)
- [x] [MEP] Quote to Job (COMPLETE - "Create project" action)
- [ ] [MEP] Job to Invoice (IN PROGRESS - email fields needed)
- [ ] [MEP] Payment Update
- [ ] [MEP] Permit to Install
- [ ] [MEP] Emergency WO
- [ ] [MEP] PM Ticket
- [ ] [MEP] Portal Welcome
- [ ] [MEP] Review Alert
- [ ] [MEP] Renewal Reminder

## User Guidance (from today)
"The demo environment should be instructional - show examples by calling out what is built and how it should be updated/edited, just like in coding"

## Done (This Session - Dec 21)
- Built [MEP] HVAC Lead Assignment automation (Request created → Update property)
- Built [MEP] Quote to Job automation (Request phase started → Create project)
- Started [MEP] Job to Invoice (Work Order completed → Send email)
- Created COPERNIQ_CAPABILITIES.md (Coperniq feature reference)
- Created AUTOMATION_RESEARCH.md (25+ automation patterns)
- Updated TEMPLATE_INVENTORY.md counts (61 built, 20 remaining)
- Security scan passed: No secrets exposed
- Dependency audit: @types/next-pwa has stale Next 13 dep (low priority)

## Blockers
- Playwright browser unlocked but email field configuration requires understanding Coperniq's token system (use "/" to insert dynamic tokens)

## Security Status
- Secrets scan: PASS (0 exposed)
- .env audit: PASS (17 keys, all in .env only)
- CVE audit: 1 low-priority issue (@types/next-pwa dev dep)
- Git history: CLEAN

## Key Reference Files
- `coperniq-mep-templates/docs/COPERNIQ_CAPABILITIES.md` - 10 automation patterns with triggers/actions
- `coperniq-mep-templates/QUICK_BUILD_REFERENCE.md` - Automation specs and compliance requirements
- `coperniq-mep-templates/TEMPLATE_INVENTORY.md` - Sprint progress tracker

## Critical URLs
- **Coperniq Automations**: https://app.coperniq.io/112/company/studio/automations
- **Job to Invoice Edit**: https://app.coperniq.io/112/company/studio/automations/5734
- **Process Studio**: https://app.coperniq.io/112/company/studio/templates

## Tech Stack
Next.js 15.5.3 | TypeScript | OpenRouter (Claude) | Supabase | Tailwind | shadcn/ui
