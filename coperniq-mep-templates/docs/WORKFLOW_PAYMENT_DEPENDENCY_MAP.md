# Workflow → Payment Structure Dependency Map

**Purpose**: Prevent circular building errors by documenting which workflows must exist BEFORE creating payment structures.

**Created**: 2025-12-21

---

## ⚠️ CRITICAL RULE ⚠️

**ALWAYS CREATE WORKFLOWS BEFORE PAYMENT STRUCTURES**

Payment structures REQUIRE workflow mapping. If the workflow doesn't exist yet, you'll get errors when trying to create the payment structure.

---

## Dependency Graph

```
O&M WORKFLOWS (Must Build First)
├── [MEP] HVAC EaaS Service Agreement (ID: 20661)
│   ├── → [MEP] HVAC-as-a-Service (EaaS) ✅ BUILT
│   └── → [MEP] Outcome-Based Comfort (Pay-per-Degree) ✅ BUILT
│
├── [MEP] Mission-Critical SLA Service (ID: 20662)
│   ├── → [MEP] SLA-Based Uptime (Mission Critical) ✅ BUILT
│   └── → [MEP] Data Center Mission Critical (Tier III/IV SLA) ✅ BUILT
│
├── [MEP] Solar O&M Performance Service (ID: 20663)
│   └── → [MEP] Solar O&M Performance ($/kW-year) ✅ BUILT
│
└── [MEP] Industrial MC/RAV Service (ID: 20664)
    └── → [MEP] Industrial Maintenance Contract (2-4% RAV) ✅ BUILT

PROJECT WORKFLOWS (Pre-Existing)
├── [MEP] HVAC Commercial (ID: 20651)
│   └── → [MEP] ESPC Gain-Sharing (Energy Savings Performance) ✅ BUILT
│
└── [Demo/Existing Project Workflows]
    ├── → [MEP] Multi-Trade Project ✅ BUILT
    ├── → [MEP] Roofing Install ✅ BUILT
    ├── → [MEP] Emergency Service Call ✅ BUILT
    ├── → [MEP] Electrical Panel Upgrade ✅ BUILT
    ├── → [MEP] Plumbing Remodel ✅ BUILT
    ├── → [MEP] HVAC Commercial Install ✅ BUILT
    └── → [MEP] HVAC Residential Install ✅ BUILT
```

---

## Build Sequence

### Step 1: Identify Payment Structure Type

**O&M Service Agreements** (Monthly/Annual Subscriptions):
- EaaS, SLA-Based, Performance Contracts, Maintenance Contracts
- **Milestone Structure**: M1 = 100%, M2/M3 deleted
- **Phase Mapping**: "Operation and Maintenance"

**Project-Based Contracts** (One-Time Installations):
- ESPC, Multi-Trade Projects, Installations, Retrofits
- **Milestone Structure**: M1/M2/M3 split (varies by project type)
- **Phase Mapping**: Engineering, Construction, Commissioning, etc.

### Step 2: Check if Workflow Exists

**Before creating payment structure, verify workflow exists:**

1. Navigate to: https://app.coperniq.io/112/company/studio/workflows/project-workflows
2. Search for workflow by name (e.g., "[MEP] Solar O&M Performance Service")
3. If found → Note the workflow ID → Proceed to Step 3
4. If NOT found → BUILD WORKFLOW FIRST → Then proceed to Step 3

### Step 3: Create Payment Structure

**Only after workflow exists:**

1. Navigate to: https://app.coperniq.io/112/company/studio/templates/payment-structure-templates
2. Click "Template" button
3. Fill in payment structure details
4. Click "Workflow" button
5. Select the workflow you verified in Step 2
6. Select the phase (must match workflow phase type)
7. Click "Select"
8. Set milestone percentages (must total 100%)
9. Click "Create"

---

## Common Errors & Fixes

### Error 1: "Milestone 'M1' must have at least one workflow mapping"

**Cause**: You're trying to create a payment structure without mapping it to a workflow.

**Solution**:
1. Click the "Workflow" button in the payment structure dialog
2. Select a workflow from the dropdown
3. Select the phase for M1
4. Click "Select"

**Prevention**: ALWAYS map each milestone to a workflow phase before clicking "Create".

---

### Error 2: Workflow Not in Dropdown List

**Cause**: The workflow you need doesn't exist yet.

**Solution**:
1. Cancel the payment structure creation dialog
2. Navigate to Project Workflows: https://app.coperniq.io/112/company/studio/workflows/project-workflows
3. Click "Workflow" button
4. Create the workflow (name, description, phase)
5. Note the workflow ID after creation
6. Return to payment structures and try again

**Prevention**: Build workflows BEFORE payment structures. Use the dependency graph above.

---

### Error 3: Phase Mismatch

**Cause**: You selected a phase that doesn't exist in the workflow.

**Example**:
- Workflow has phase "Operation and Maintenance"
- You selected "Construction" for M1
- ERROR: Phase not found

**Solution**:
1. Check the workflow's phase configuration
2. Use ONLY the phases that exist in the workflow
3. For O&M contracts, always use "Operation and Maintenance"

**Prevention**: Match payment structure phases to workflow phases.

---

### Error 4: Workflow Description Too Long (>255 characters)

**Cause**: Workflow descriptions have a 255 character limit.

**Solution**:
1. Edit workflow description to be under 255 characters
2. Focus on outcomes and value prop, remove unnecessary details
3. Use abbreviations where appropriate (O&M, PM, HVAC, MEP)

**Example**:
- ❌ Too Long: "Operations and Maintenance workflow for Equipment-as-a-Service agreements where the contractor owns all equipment and the customer pays a monthly fee for guaranteed cooling and heating outcomes measured by a British Thermal Unit meter installed at the customer's site. The contractor is responsible for all aspects of system design, installation, ongoing maintenance, repairs, and eventual equipment replacement at end of life. This model allows customers to avoid large upfront capital expenses while contractors benefit from long-term recurring revenue streams and opportunities to optimize equipment performance." (600+ chars)
- ✅ Just Right: "O&M workflow for EaaS agreements. Contractor owns equipment, customer pays monthly for cooling/heating outcomes. Includes monitoring, PM, repairs, replacement. Measured by BTU meter. 20-70% energy savings." (210 chars)

**Prevention**: Keep workflow descriptions concise (200-250 chars). Use AI_PROMPTS_BEST_PRACTICES.md examples as templates.

---

## Workflow Creation Priority

**High Priority** (Built First - Enable Multiple Payment Structures):

1. ✅ [MEP] HVAC EaaS Service Agreement (20661) → Enables 2 payment structures
2. ✅ [MEP] Mission-Critical SLA Service (20662) → Enables 2 payment structures
3. ✅ [MEP] Solar O&M Performance Service (20663) → Enables 1 payment structure
4. ✅ [MEP] Industrial MC/RAV Service (20664) → Enables 1 payment structure

**Medium Priority** (Project Workflows - Used for Installations):

- [MEP] HVAC Commercial (20651) → ESPC, commercial installs
- [MEP] HVAC Residential → Residential retrofits
- [MEP] Multi-Trade → Complex projects with multiple trades
- [MEP] Electrical Service → Electrical work
- [MEP] Plumbing Service Call → Plumbing repairs
- [MEP] Roofing Residential → Roofing projects
- [MEP] Fire Protection Install → Fire protection systems

**Low Priority** (Specialty Workflows - Built as Needed):

- Emergency Response workflows
- Seasonal workflows (A/C season, heating season)
- Regional-specific workflows (state-specific compliance)

---

## Architecture Layers

### Layer 1: Workflows (Foundation)

**Purpose**: Define the PROCESS (what work gets done, in what order)

**Examples**:
- "[MEP] HVAC EaaS Service Agreement" = Monthly service process
- "[MEP] Solar O&M Performance Service" = Solar performance monitoring process
- "[MEP] HVAC Commercial" = Commercial installation process

**Build This First**: Workflows are the foundation. Nothing can be built without them.

---

### Layer 2: Payment Structures (Revenue Models)

**Purpose**: Define the PRICING (how customers pay for the work)

**Examples**:
- "[MEP] HVAC-as-a-Service (EaaS)" = Monthly subscription pricing
- "[MEP] Solar O&M Performance ($/kW-year)" = $/kW capacity pricing
- "[MEP] ESPC Gain-Sharing" = 70/30 shared savings pricing

**Build This Second**: Payment structures MAP TO workflows. Can't exist without Layer 1.

---

### Layer 3: Documentation (Knowledge Transfer)

**Purpose**: Document the PROMPTS (how to replicate fast setup)

**Examples**:
- AI_PROMPTS_BEST_PRACTICES.md = Exact prompts used to build each template
- WORKFLOW_PAYMENT_DEPENDENCY_MAP.md = Dependency rules to prevent errors
- APP26_ARCHITECTURE.md = Overall system design

**Build This Third**: Documentation captures learnings from building Layers 1 and 2.

---

## Verification Checklist

Before creating a payment structure, verify:

- [ ] Workflow exists (visible in Project Workflows list)
- [ ] Workflow ID captured (for reference in payment structure)
- [ ] Workflow description under 255 characters
- [ ] Workflow phase matches payment structure needs (O&M vs. Project)
- [ ] Payment structure name is descriptive and unique
- [ ] Payment structure description explains value prop
- [ ] Milestones total 100%
- [ ] Each milestone maps to a workflow phase
- [ ] For O&M contracts: M1 = 100%, M2/M3 deleted
- [ ] For project contracts: M1/M2/M3 split reflects effort distribution

---

## Key Learnings from APP26 Sprint

### Discovery 1: O&M Workflows Don't Exist by Default

**Problem**: Coperniq only had 1 O&M workflow demo "[DEMO] O&M - Orphan"

**Impact**: Couldn't create 4 payment structures until workflows were built first

**Solution**: Build O&M workflows as foundation layer:
1. [MEP] HVAC EaaS Service Agreement
2. [MEP] Mission-Critical SLA Service
3. [MEP] Solar O&M Performance Service
4. [MEP] Industrial MC/RAV Service

**Lesson**: Always audit existing workflows BEFORE planning payment structures. Don't assume workflows exist.

---

### Discovery 2: Payment Structures REQUIRE Workflow Mapping

**Problem**: Attempted to create "[MEP] SLA-Based Uptime" payment structure, got error "Milestone 'M1' must have at least one workflow mapping"

**Impact**: Had to cancel payment structure creation, build workflow first, then retry

**Solution**: Dependency graph enforces build sequence: Workflows → Payment Structures → Documentation

**Lesson**: Coperniq's architecture enforces proper dependencies. You can't skip steps.

---

### Discovery 3: Workflow Description Character Limit

**Problem**: Initial workflow descriptions were 400+ characters, got truncated

**Impact**: Lost important details about pricing models, compliance requirements

**Solution**: Refined descriptions to 200-250 characters focusing on outcomes and value prop

**Lesson**: Be concise. Focus on what matters most for search and filtering.

---

### Discovery 4: Multiple Payment Structures Can Share One Workflow

**Example**:
- "[MEP] HVAC EaaS Service Agreement" workflow (ID: 20661) enables:
  - "[MEP] HVAC-as-a-Service (EaaS)" payment structure
  - "[MEP] Outcome-Based Comfort (Pay-per-Degree)" payment structure

**Why This Works**: Same O&M process, different pricing models

**Lesson**: Build workflows based on PROCESS, not pricing. One workflow can enable multiple payment structures.

---

## Related Documentation

- **AI_PROMPTS_BEST_PRACTICES.md** - Exact prompts used for each template
- **APP26_ARCHITECTURE.md** - Master build plan with hourly breakdown
- **APP26_CONFIGURATION_GUIDE.md** - 24 Company Settings sections
- **TEMPLATE_INVENTORY.md** - Progress tracker with status updates
- **QUICK_BUILD_REFERENCE.md** - Fast manual build specs

---

## Next Steps

1. ✅ Complete all 11 payment structures (DONE - 2025-12-21)
2. ⏳ Test all payment structures (Phase 4)
3. ⏳ Build 7 automations (Phase 5)
4. ⏳ Create 20 demo clients
5. ⏳ Populate sites, assets, projects, invoices
6. ⏳ Build Hubs redesign (8 persona-based Hubs)

---

**Last Updated**: 2025-12-21
**Status**: Phase 2 Complete | 11 Payment Structures Built | All Dependencies Mapped
