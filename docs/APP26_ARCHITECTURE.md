# APP26 - Coperniq 2026 Replatforming Architecture

**Created**: 2025-12-21
**Purpose**: Complete architectural plan for building MEP contractor templates in Coperniq Process Studio

---

## Executive Summary

**APP26** is the comprehensive playbook for building a complete MEP contractor business system in Coperniq. This document establishes the dependency graph, build sequence, and architectural decisions for creating innovative payment structures and workflows that competitors (ServiceTitan, Housecall Pro, FieldEdge) cannot match.

**Key Innovation**: Equipment-as-a-Service (EaaS), ESPC Gain-Sharing, SLA-Based Uptime, and other performance-based payment models require **O&M workflows** (not project workflows) to enable monthly recurring revenue with performance guarantees.

---

## Current State - Complete Coperniq Process Studio Inventory

### Live Audit Results (Dec 21, 2025)

| Component | MEP by Tim | Existing/Demo | **TOTAL** |
|-----------|------------|---------------|-----------|
| **Project Workflows** | 8 | 3 | **11** |
| **Request Workflows** | 8 | 2 | **10** |
| **Field Work Orders** | 21 | 47 | **68** |
| **Office Work Orders** | 14 | 71 | **85** |
| **Forms** | (TBD) | (TBD) | **(TBD)** |
| **Payment Structures** | 11 | 1 | **12** |
| **Automations** | 3 | 67+ | **70+** |

---

## MEP Templates Built by Tim (71+ items)

### Project Workflows (8 MEP)
1. ✅ [MEP] HVAC Residential Retrofit
2. ✅ [MEP] Plumbing Service Call
3. ✅ [MEP] Roofing Residential
4. ✅ [MEP] Electrical Service
5. ✅ [MEP] HVAC Commercial
6. ✅ [MEP] Fire Protection Install
7. ✅ [MEP] HVAC EaaS Service Agreement (O&M workflow)
8. ✅ [MEP] Mission-Critical SLA Service (O&M workflow)

### Request Workflows (8 MEP)
1. ✅ [MEP] HVAC Lead Pipeline
2. ✅ [MEP] Plumbing Lead Pipeline
3. ✅ [MEP] Electrical Lead Pipeline
4. ✅ [MEP] Roofing Lead Pipeline
5. ✅ [MEP] Emergency Service Pipeline
6. ✅ [EMERGENCY] Power Outage Response
7. ✅ [EMERGENCY] Generator Sales Fast-Track
8. ✅ [EMERGENCY] Battery/Solar Post-Outage

### Field Work Orders (21 MEP)
Emergency & Service:
- Emergency Plumbing, Roof Leak Repair, Grease Trap Service
- Fire Sprinkler NFPA 25, Backflow Test, Mini-Split EPA 608
- EV Charger NEC 625, Generator Install/Service, Panel Upgrade
- HVAC Emergency, Commercial Refrigeration, Medical Equipment Priority
- Battery Backup, Transfer Switch, Ductwork, Water Heater
- Furnace Safety, AC Maintenance, HVAC Commissioning

### Office Work Orders (14 MEP)
Operations & Coordination:
- Subcontractor Coordination, Code Compliance Review
- Lien Waiver Processing, Inspection Scheduling
- Customer Follow-up Call, Vendor PO Processing
- Service Agreement Renewal, Backflow Test Scheduling
- Electrical/Plumbing Permit Applications
- Warranty Registration, Quote Prep, Load Calc Review, Permit Tracking

### Payment Structures (11 MEP)
**Innovative (3 complete, 4 pending):**
1. ✅ [MEP] HVAC-as-a-Service (EaaS) - Monthly subscription, BTU meter outcomes
2. ✅ [MEP] ESPC Gain-Sharing (Energy Savings Performance) - 70/30 split, M&V protocols
3. ⚠️ [MEP] SLA-Based Uptime (Mission Critical) - **NEEDS WORKFLOW UPDATE** (uses wrong workflow)
4. ⏳ [MEP] Solar O&M Performance - $/kW-year with liquidated damages
5. ⏳ [MEP] Outcome-Based Comfort - Pay-per-degree monthly
6. ⏳ [MEP] Industrial MC/RAV - 2-4% of asset value annually
7. ⏳ [MEP] Data Center Mission Critical - Tier III/IV SLA-based

**Traditional (4 complete):**
8. ✅ [MEP] Multi-Trade Project - 30/30/30/10 milestone
9. ✅ [MEP] Service Agreement Monthly - Recurring O&M
10. ✅ [MEP] Roofing Install - Traditional project
11. ✅ [MEP] Emergency Service Call - T&M emergency

**Project-Based (4 complete):**
12. ✅ [MEP] Electrical Panel Upgrade
13. ✅ [MEP] Plumbing Remodel
14. ✅ [MEP] HVAC Commercial Install
15. ✅ [MEP] HVAC Residential Install

### Automations (3 MEP)
1. ✅ [MEP] HVAC Lead Assignment - Request created → Update property
2. ✅ [MEP] Quote to Job - Request phase started → Create project
3. ⏳ [MEP] Job to Invoice - Work Order completed → Send email (IN PROGRESS)

---

## Critical Architectural Discovery

### The O&M Workflow Requirement

**Problem**: Payment structures for innovative business models (EaaS, SLA, ESPC) require mapping to **Operation and Maintenance (O&M) workflows**, but Coperniq only had 1 demo O&M workflow by default.

**Solution**: Create dedicated O&M workflows for each innovative payment model BEFORE creating the payment structure.

### Workflow Type Matrix

| Payment Model | Workflow Type | Why |
|---------------|---------------|-----|
| EaaS (Equipment-as-a-Service) | **O&M Workflow** | Monthly recurring service, contractor owns equipment |
| SLA-Based Uptime | **O&M Workflow** | Monthly service with performance bonuses/penalties |
| Solar O&M Performance | **O&M Workflow** | $/kW-year recurring maintenance with liquidated damages |
| Industrial MC/RAV | **O&M Workflow** | Annual maintenance contracts (2-4% of asset value) |
| ESPC Gain-Sharing | **Project Workflow** | One-time project with performance-based payment over 5-25 years |
| Traditional Install | **Project Workflow** | One-time installation projects |

---

## Dependency Graph - What Must Be Built First

### Layer 1: O&M Workflows (Foundation)
**Build these FIRST** - Payment structures depend on them existing.

1. ✅ [MEP] HVAC EaaS Service Agreement (ID: 20661)
2. ✅ [MEP] Mission-Critical SLA Service (ID: 20662)
3. ⏳ [MEP] Solar O&M Performance Service
4. ⏳ [MEP] Industrial MC/RAV Service

**Why First**: Payment structures MUST have a workflow to map milestones to. Creating payment structures before workflows = error: "Milestone 'M1' must have at least one workflow mapping"

### Layer 2: Payment Structures (Revenue Models)
**Build these SECOND** - After workflows exist.

1. ✅ [MEP] HVAC-as-a-Service (EaaS) → Maps to: [MEP] HVAC EaaS Service Agreement
2. ⚠️ [MEP] SLA-Based Uptime → **UPDATE MAPPING**: Currently uses 20661, should use 20662
3. ⏳ [MEP] Solar O&M Performance → Maps to: [MEP] Solar O&M Performance Service
4. ⏳ [MEP] Outcome-Based Comfort → Maps to: [MEP] HVAC EaaS Service Agreement
5. ⏳ [MEP] Industrial MC/RAV → Maps to: [MEP] Industrial MC/RAV Service
6. ⏳ [MEP] Data Center Mission Critical → Maps to: [MEP] Mission-Critical SLA Service

### Layer 3: Documentation (APP26 Playbook)
**Build these THIRD** - After workflows + payment structures are tested.

- AI_PROMPTS_BEST_PRACTICES.md - Exact prompts for each workflow/payment structure
- DEMO_ENVIRONMENT_PLAN.md - 20 strategic demo clients using all payment structures
- VIDEO_FACTORY scripts - 56 feature + competitive videos

---

## Optimal Build Sequence (Next 6 Hours)

### Hour 0-1: Complete O&M Workflows
**Goal**: Finish the foundation layer so payment structures can be created.

1. **[MEP] Solar O&M Performance Service** (15 min)
   - Name: `[MEP] Solar O&M Performance Service`
   - Description: `O&M workflow for solar performance contracts with $/kW-year pricing ($16-$24/kW typical). Liquidated damages for underperformance. Monthly monitoring and reporting. Commercial and utility-scale solar.` (under 255 chars)
   - Phase: Operation and Maintenance
   - URL: Create at /112/company/studio/workflows/project-workflows

2. **[MEP] Industrial MC/RAV Service** (15 min)
   - Name: `[MEP] Industrial MC/RAV Service`
   - Description: `O&M workflow for industrial maintenance contracts. 2-4% of asset replacement value annually. Includes predictive maintenance, condition monitoring, spare parts management. Manufacturing, data centers, industrial facilities.` (under 255 chars)
   - Phase: Operation and Maintenance
   - URL: Create at /112/company/studio/workflows/project-workflows

### Hour 1-2: Update + Create Payment Structures
**Goal**: Fix existing errors and create remaining innovative payment structures.

1. **Update [MEP] SLA-Based Uptime** (5 min)
   - Current: Maps to [MEP] HVAC EaaS Service Agreement (20661) - WRONG
   - Fix: Map to [MEP] Mission-Critical SLA Service (20662)
   - URL: /112/company/studio/templates/payment-structure-templates

2. **[MEP] Solar O&M Performance** (15 min)
   - Name: `[MEP] Solar O&M Performance ($/kW-year)`
   - Description: Performance-based solar O&M contract with $/kW-year pricing ($16-$24/kW typical). Contractor guarantees system availability and performance ratio. Liquidated damages for underperformance ($/kWh). Monthly monitoring, inverter/module replacement, vegetation management. Typical term: 10-20 years. Commercial and utility-scale solar projects.
   - Type: Invoice
   - Milestone: M1 = 100% → Operation and Maintenance
   - Workflow: [MEP] Solar O&M Performance Service

3. **[MEP] Outcome-Based Comfort** (15 min)
   - Name: `[MEP] Outcome-Based Comfort (Pay-per-Degree)`
   - Description: Monthly subscription where customer pays for thermal comfort outcomes, not equipment. Contractor guarantees indoor temp within 70-78°F year-round. Fixed $/month based on square footage and climate zone. Includes monitoring, PM, repairs, replacement. Customer benefits: No upfront cost, guaranteed comfort. Contractor benefits: Recurring revenue, equipment optimization.
   - Type: Invoice
   - Milestone: M1 = 100% → Operation and Maintenance
   - Workflow: [MEP] HVAC EaaS Service Agreement

4. **[MEP] Industrial MC/RAV** (15 min)
   - Name: `[MEP] Industrial Maintenance Contract (2-4% RAV)`
   - Description: Industrial maintenance contract priced at 2-4% of asset replacement value annually. Includes predictive maintenance, condition monitoring, emergency response, spare parts management. Typical for manufacturing equipment, data center infrastructure, mission-critical systems. SLA-based with uptime guarantees. 3-5 year terms with renewal options.
   - Type: Invoice
   - Milestone: M1 = 100% → Operation and Maintenance
   - Workflow: [MEP] Industrial MC/RAV Service

5. **[MEP] Data Center Mission Critical** (15 min)
   - Name: `[MEP] Data Center Mission Critical (Tier III/IV SLA)`
   - Description: Mission-critical data center maintenance with Tier III (99.982%) or Tier IV (99.995%) availability guarantees. Monthly service with performance bonuses for exceeding SLA, penalties for violations. 2-hour emergency response. 24/7 monitoring and N+1 redundancy verification. Pricing: Base monthly fee + SLA incentive structure.
   - Type: Invoice
   - Milestone: M1 = 100% → Operation and Maintenance
   - Workflow: [MEP] Mission-Critical SLA Service

### Hour 2-3: Document Everything in APP26 Playbook
**Goal**: Create comprehensive documentation for customers to replicate.

1. **Update AI_PROMPTS_BEST_PRACTICES.md** (30 min)
   - Add Solar O&M Performance entry with exact prompts
   - Add Industrial MC/RAV entry with exact prompts
   - Add Outcome-Based Comfort entry with exact prompts
   - Add Data Center Mission Critical entry with exact prompts
   - Document key learnings from each build

2. **Create WORKFLOW_PAYMENT_DEPENDENCY_MAP.md** (30 min)
   - Visual dependency graph showing which workflows enable which payment structures
   - Error prevention guide: "Always build workflows before payment structures"
   - Troubleshooting: Common errors and fixes

### Hour 3-4: Test All Payment Structures
**Goal**: Verify every payment structure works correctly with proper workflow mapping.

Test Protocol:
1. Navigate to each payment structure
2. Verify milestone structure (100% M1 for O&M, split milestones for projects)
3. Verify workflow mapping is correct
4. Verify description accurately reflects business model
5. Document any issues in APP26_TESTING_LOG.md

### Hour 4-6: Build Remaining Automations
**Goal**: Complete the 10 MEP automation layer.

Remaining 7 automations:
1. [MEP] Payment Received - Invoice paid → Update project status, send receipt
2. [MEP] Permit Approved → Install - Permit approved → Create install WO with dynamic due date
3. [MEP] Emergency Dispatch - Emergency WO created → SMS on-call, email manager, 30-min reminder
4. [MEP] PM Due → Create Ticket - SLA violation → Create PM WO, notify customer, SMS tech
5. [MEP] New Customer Welcome - New customer onboarding → Welcome email + portal access SMS
6. [MEP] Negative Review Alert - Review webhook → Email manager, create follow-up task
7. [MEP] Contract Renewal - 30 days before expiration → Email customer, notify sales rep

---

## Key Learnings for APP26

### 1. Workflow Description Limits
**Rule**: Workflow descriptions max 255 characters.
**Example**: Original EaaS description was 289 chars → trimmed to 254 chars.
**Pattern**: Focus on outcomes, metrics, and key features. Remove filler words.

### 2. O&M vs Project Workflows
**O&M Workflows**: Monthly recurring services (EaaS, SLA, service agreements)
- Phase: "Operation and Maintenance"
- Payment Structure: M1 = 100%
- Examples: EaaS, SLA-Based Uptime, Solar O&M

**Project Workflows**: One-time installations or projects
- Phases: Multiple (Engineering, Construction, Commissioning, etc.)
- Payment Structure: Split milestones (30/30/40, etc.)
- Examples: ESPC, Commercial Installs, Retrofits

### 3. Payment Structure → Workflow Mapping Errors
**Error**: "Milestone 'M1' must have at least one workflow mapping"
**Cause**: No workflow exists to map the payment structure to.
**Fix**: Always create workflow FIRST, then payment structure.

### 4. Innovative Payment Models Require Dedicated Workflows
**Anti-Pattern**: Mapping SLA-Based Uptime to generic EaaS workflow
**Pattern**: Create specific workflow for each business model (Mission-Critical SLA Service for data centers, not generic EaaS)
**Why**: Ensures accurate process representation and phase mapping

---

## APP26 Objection Handler

**Prospect**: "We're locked into ServiceTitan for 2 more years."

**Response**: "What's your APP26 look like? Most contractors we talk to are paying for 3 platforms to do what one should - ServiceTitan for dispatch, separate billing for EaaS revenue, and spreadsheets for ESPC gain-sharing tracking. Coperniq's payment structures let you model Equipment-as-a-Service, performance contracts, and SLA-based pricing in one platform. How are you currently tracking monthly recurring revenue from service agreements?"

---

## Success Metrics

### Phase 1: Foundation (Hours 0-1)
- [ ] 2 O&M workflows created (Solar, Industrial)
- [ ] All 4 O&M workflows exist and tested

### Phase 2: Revenue Models (Hours 1-2)
- [ ] 1 payment structure updated ([MEP] SLA-Based Uptime)
- [ ] 4 payment structures created (Solar, Comfort, Industrial, Data Center)
- [ ] All 11 innovative payment structures mapped correctly

### Phase 3: Documentation (Hours 2-3)
- [ ] AI_PROMPTS_BEST_PRACTICES.md updated with 4 new entries
- [ ] WORKFLOW_PAYMENT_DEPENDENCY_MAP.md created
- [ ] All prompts documented for customer replication

### Phase 4: Testing (Hours 3-4)
- [ ] 11 payment structures tested
- [ ] 0 workflow mapping errors
- [ ] APP26_TESTING_LOG.md created with evidence

### Phase 5: Automations (Hours 4-6)
- [ ] 7 automations built and tested
- [ ] 10 total MEP automations complete
- [ ] All automations documented in APP26

---

## Next Steps After 6-Hour Sprint

1. **Create 20 Demo Clients** using Coperniq AI (DEMO_ENVIRONMENT_PLAN.md)
2. **Populate Sites, Assets, Projects, Invoices** using AI prompts
3. **Build Video Factory** content (56 videos: 20 feature + 36 competitive)
4. **Test End-to-End Workflows** with real data
5. **Deploy APP26 Sales Enablement** to sales team

---

**Last Updated**: 2025-12-21
**Status**: 2 O&M workflows built, 9 remaining items in 6-hour sprint
**Owner**: Tim Kipper
**Next Session**: Continue at Hour 0 - Create [MEP] Solar O&M Performance Service workflow

---

## Files to Reference

- `AI_PROMPTS_BEST_PRACTICES.md` - Exact prompts for workflows and payment structures
- `DEMO_ENVIRONMENT_PLAN.md` - 20 strategic demo clients across all ICPs
- `COPERNIQ_CAPABILITIES.md` - Coperniq feature reference (automation triggers/actions)
- `QUICK_BUILD_REFERENCE.md` - Fast manual build specs for remaining templates
- `TEMPLATE_INVENTORY.md` - Sprint progress tracker

**Project Context**: `/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/.claude/PROJECT_CONTEXT.md`
**GTME Journal**: `/Users/tmkipper/Desktop/tk_projects/coperniq-forge/docs/gtme-journal.md`
