# ai-development-cockpit

**Branch**: main | **Updated**: 2025-12-21 (End of Session)
**Sprint**: APP26 Architecture & Planning - Coperniq MEP Templates

## Status

**ARCHITECTURAL AUDIT COMPLETE** - Shifted from reactive building to systematic planning. LIVE audit of Coperniq Process Studio shows **295+ total items** (71 MEP templates by Tim, 224+ existing/demo). Created comprehensive APP26 playbook with dependency graph preventing circular building.

**Key Discovery**: O&M workflows MUST be built BEFORE payment structures (payment structures require workflow phase mappings).

## Tomorrow Start: APP26 6-Hour Sprint (Hour 0)

**Build 2 O&M Workflows First** (Foundation Layer):

1. **[MEP] Solar O&M Performance Service** (15 min)
   - URL: https://app.coperniq.io/112/company/studio/workflows/project-workflows
   - Name: `[MEP] Solar O&M Performance Service`
   - Description: `O&M workflow for solar performance contracts with $/kW-year pricing ($16-$24/kW typical). Liquidated damages for underperformance. Monthly monitoring and reporting. Commercial and utility-scale solar.` (under 255 chars)
   - Phase: Operation and Maintenance

2. **[MEP] Industrial MC/RAV Service** (15 min)
   - Name: `[MEP] Industrial MC/RAV Service`
   - Description: `O&M workflow for industrial maintenance contracts. 2-4% of asset replacement value annually. Includes predictive maintenance, condition monitoring, spare parts management. Manufacturing, data centers, industrial facilities.` (under 255 chars)
   - Phase: Operation and Maintenance

**Then Update/Create 5 Payment Structures** (Hour 1-2):
1. Update [MEP] SLA-Based Uptime (fix workflow mapping: 20661 → 20662)
2. Create [MEP] Solar O&M Performance
3. Create [MEP] Outcome-Based Comfort
4. Create [MEP] Industrial MC/RAV
5. Create [MEP] Data Center Mission Critical

See `coperniq-mep-templates/docs/APP26_ARCHITECTURE.md` for complete 6-hour sprint plan.

## Done (This Session - Dec 21)

**LIVE AUDIT via Playwright MCP**:
- Audited all Process Studio sections (Project Workflows, Request Workflows, Field WOs, Office WOs, Forms, Payment Structures, Automations)
- Captured exact counts: 11 Project Workflows, 10 Request Workflows, 68 Field WOs, 85 Office WOs, 12 Payment Structures, 70+ Automations
- Total: 295+ items (71 MEP, 224+ existing/demo)

**ARCHITECTURE DOCUMENTS CREATED**:
1. **APP26_ARCHITECTURE.md** - Master build plan with dependency graph
   - Critical Discovery: O&M Workflow Requirement (must exist before payment structures)
   - 3-Layer Architecture: Workflows → Payment Structures → Documentation
   - 6-hour sprint plan with hourly breakdowns
   - Key Learnings: Workflow descriptions max 255 chars, payment structure milestone mapping errors
   - APP26 Objection Handler for sales

2. **APP26_CONFIGURATION_GUIDE.md** - Complete Company Settings map
   - All 24 sections documented across 4 categories (Company Settings, Properties, Process Studio, Configure)
   - Priority levels: CRITICAL → HIGH → MEDIUM → LOW
   - Configuration sequence with dependencies
   - MEP contractor use cases for each section

3. **HUBS_ARCHITECTURE.md** - Hub audit and redesign plan
   - Current State Audit: 7 Hubs with hodge-podge organization, duplicate views, orphan dashboards
   - Proposed: 8 persona-based Hubs (Executive, Sales, Dispatch, Field Tech, PM, Accounting, Service Manager, Customer Service)
   - 4-week implementation plan (Phase 1-4)
   - View design patterns for MEP contractors
   - Mobile vs Desktop optimization strategy
   - Demo environment strategy

**BACKLOG UPDATED**:
- Added BL-015: Coperniq Hubs Redesign (4-week effort, 8 Hubs)

**DOCUMENTATION UPDATED**:
- gtme-journal.md: Comprehensive Dec 21 entry added
- Backlog.md: Hubs epic added with full phase breakdown

**SECURITY SCAN**:
- Secrets scan: PASS (0 exposed)
- .env files: Not tracked in git
- API keys: Clean (no sk-ant-, sk-or-, AKIA, ghp_, xox* patterns found)

## Blockers

**None** - Clear path forward established. Architecture complete, ready for systematic implementation.

## Current Template Inventory

| Category | MEP by Tim | Existing/Demo | TOTAL |
|----------|------------|---------------|-------|
| Project Workflows | 8 | 3 | **11** |
| Request Workflows | 8 | 2 | **10** |
| Field Work Orders | 21 | 47 | **68** |
| Office Work Orders | 14 | 71 | **85** |
| Forms | 11 | 33 | **44** |
| Payment Structures | 11 | 1 | **12** |
| Automations | 3 | 67+ | **70+** |
| **TOTAL** | **76 MEP** | **224+** | **300+** |

**Note**: Previous count of 61 templates was UNDERCOUNTED. Actual MEP templates = 76.

## Payment Structure Status

**Complete (7)**:
1. ✅ [MEP] HVAC-as-a-Service (EaaS)
2. ✅ [MEP] ESPC Gain-Sharing (Energy Savings Performance)
3. ✅ [MEP] Multi-Trade Project
4. ✅ [MEP] Service Agreement Monthly
5. ✅ [MEP] Roofing Install
6. ✅ [MEP] Emergency Service Call
7. ✅ [MEP] Electrical Panel Upgrade + 3 more (11 total built)

**Needs Update (1)**:
- ⚠️ [MEP] SLA-Based Uptime - Currently maps to wrong workflow (20661), should map to [MEP] Mission-Critical SLA Service (20662)

**Needs Creation (4)**:
- ⏳ [MEP] Solar O&M Performance
- ⏳ [MEP] Outcome-Based Comfort
- ⏳ [MEP] Industrial MC/RAV
- ⏳ [MEP] Data Center Mission Critical

## O&M Workflow Status

**Complete (2)**:
1. ✅ [MEP] HVAC EaaS Service Agreement (ID: 20661)
2. ✅ [MEP] Mission-Critical SLA Service (ID: 20662)

**Needs Creation (2)**:
3. ⏳ [MEP] Solar O&M Performance Service
4. ⏳ [MEP] Industrial MC/RAV Service

## Key Reference Files

**Architecture**:
- `coperniq-mep-templates/docs/APP26_ARCHITECTURE.md` - Master build plan, dependency graph, 6-hour sprint
- `coperniq-mep-templates/docs/APP26_CONFIGURATION_GUIDE.md` - 24 Company Settings sections mapped
- `coperniq-mep-templates/docs/HUBS_ARCHITECTURE.md` - 8-Hub redesign plan (4-week effort)

**Implementation Guides**:
- `coperniq-mep-templates/docs/AI_PROMPTS_BEST_PRACTICES.md` - Exact prompts for workflows/payment structures
- `coperniq-mep-templates/docs/DEMO_ENVIRONMENT_PLAN.md` - 20 strategic demo clients
- `coperniq-mep-templates/docs/COPERNIQ_CAPABILITIES.md` - Automation triggers/actions reference
- `coperniq-mep-templates/QUICK_BUILD_REFERENCE.md` - Fast manual build specs
- `coperniq-mep-templates/TEMPLATE_INVENTORY.md` - Sprint progress tracker

**Research** (from parallel agents):
- `coperniq-mep-templates/research/MEP_PAYMENT_STRUCTURES.md` - Commercial/C&I/Utility pricing models
- `coperniq-mep-templates/research/service-plan-research-by-trade.md` - Deep trade-specific service plans
- `coperniq-mep-templates/research/residential-mep-payment-structures.md` - Residential pricing patterns
- `coperniq-mep-templates/research/electrical_solar_payment_structures.md` - Trade-specific electrical/solar
- `coperniq-mep-templates/research/PROPERTY_MANAGEMENT_PAYMENT_STRUCTURES.md` - Property management pricing

## Critical URLs

- **Process Studio Home**: https://app.coperniq.io/112/company/studio
- **Project Workflows**: https://app.coperniq.io/112/company/studio/workflows/project-workflows
- **Request Workflows**: https://app.coperniq.io/112/company/studio/workflows/request-workflows
- **Payment Structures**: https://app.coperniq.io/112/company/studio/templates/payment-structure-templates
- **Automations**: https://app.coperniq.io/112/company/studio/automations
- **Field Work Orders**: https://app.coperniq.io/112/company/studio/templates/field-wo-templates
- **Office Work Orders**: https://app.coperniq.io/112/company/studio/templates/office-wo-templates
- **Forms**: https://app.coperniq.io/112/company/studio/templates/form-templates

## Next Sprint Priorities

### Immediate (6-Hour Sprint from APP26_ARCHITECTURE.md):
1. **Hour 0-1**: Complete 2 O&M workflows (Solar, Industrial)
2. **Hour 1-2**: Update/create 5 payment structures
3. **Hour 2-3**: Document all in AI_PROMPTS_BEST_PRACTICES.md
4. **Hour 3-4**: Test all payment structures
5. **Hour 4-6**: Build remaining 7 automations

### After Templates Complete:
6. **Week 1-4**: Execute Hubs redesign (BL-015)
   - Week 1: Build 3 critical Hubs (Dispatch, Field Tech, Sales)
   - Week 2: Build 2 management Hubs (Project Management, Executive)
   - Week 3: Build 2 back-office Hubs (Accounting, Service Agreements)
   - Week 4: Build 1 customer-facing Hub (Customer Service)

## Tech Stack

Next.js 15.5.3 | TypeScript | OpenRouter (Claude) | Supabase | Tailwind | shadcn/ui | Playwright MCP | E2B Sandbox
