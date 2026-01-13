# Tomorrow Sprint Summary - 2026-01-14

## Session Completed: 2026-01-13

### What Was Accomplished

#### 1. Instance 388 Configuration (100% Complete)
- **Company Settings**: 7 trade groups configured (HVAC, Electrical, Plumbing, Solar/Energy, Roofing, Low Voltage, Fire & Safety)
- **Analytics Dashboards**: 5 dashboards created
- **Process Studio**: 11 workflows + 20 work order templates
- **Service Plans**: Configured and operational
- **API Key**: Generated and tested (`704bacf3-cade-45b6-bd84-ce37c2f6e949`)

#### 2. Master Catalog Research (Complete)
Deployed **10 parallel research agents** to analyze catalog requirements:

| Agent | Items Found | Key Findings |
|-------|-------------|--------------|
| HVAC/Mechanical | 15 + 5 commercial | IAQ services, duct sealing, RTU installations |
| Electrical | 15 | EV charger install, smart switches, VFDs |
| Plumbing | 15 | Leak detection, grease traps, water treatment |
| Solar/Energy | 15 | Commercial inverters, DC fast chargers, BESS |
| Roofing | 15 | TPO/EPDM commercial, metal roofing, insurance claims |
| Low Voltage | 15 | Access control, **RMR monitoring ($39.95-59.95/mo)** |
| Fire Protection | 15 | NFPA compliance items, Class K/CO2 extinguishers |
| **C&I Segment** | 30 | 3-phase service, BAS, commercial generators |
| **Industrial/Utility** | 30 | MV switchgear, MCCs, utility-scale BESS |
| **Resimercial** | 20 | Light commercial RTUs, tenant improvements |

#### 3. Expanded Catalog Created
- **Original catalog**: 115 items (Residential focused)
- **New items added**: 95 items covering C&I, Industrial, Resimercial
- **Total combined**: 210 items
- **File**: `config/master-catalog/catalog-items-expanded.json`

#### 4. Import Script Created
- **File**: `scripts/import_expanded_catalog.py`
- **Tested**: Dry-run successful with 104 items ready to import
- **Status**: Ready for execution

---

## Tomorrow's Tasks (Priority Order)

### CRITICAL - Trade Automations (All 7 Trades)
**This is the MOST IMPORTANT task for tomorrow**

Create automations in Process Studio for each trade:

| Trade | Automation Type | Trigger | Action |
|-------|-----------------|---------|--------|
| **HVAC** | Lead Follow-up | New lead created | Send email + schedule callback |
| **HVAC** | PM Reminder | 30 days before PM due | Create task + notify customer |
| **Electrical** | Permit Tracking | Permit submitted | Auto-update project status |
| **Plumbing** | Emergency Dispatch | Emergency tag added | Alert on-call tech |
| **Solar** | Interconnection | Install complete | Generate utility paperwork |
| **Roofing** | Insurance Claim | Claim tag added | Generate claim documentation |
| **Low Voltage** | RMR Renewal | 60 days before expiry | Create renewal task |
| **Fire Safety** | Inspection Due | Annual date approaching | Schedule inspection visit |

Navigate to: `https://app.coperniq.io/388/company/studio/automations`

### HIGH PRIORITY - Document Templates

Create document templates for each trade:
- [ ] HVAC Service Agreement
- [ ] Electrical Change Order
- [ ] Plumbing Estimate Template
- [ ] Solar Proposal Template
- [ ] Roofing Insurance Scope
- [ ] Low Voltage Monitoring Agreement
- [ ] Fire Safety Inspection Report

Navigate to: `https://app.coperniq.io/388/company/studio/templates/document-templates`

### HIGH PRIORITY - File Requests

Set up file request workflows for collecting customer documents:
- [ ] Site photos (before/after)
- [ ] Permit documents
- [ ] Insurance certificates
- [ ] Equipment manuals/warranties
- [ ] Signed contracts

Navigate to: `https://app.coperniq.io/388/company/studio/templates/file-requests`

### HIGH PRIORITY - Catalog Import

```bash
# 1. Run actual import (not dry-run)
cd coperniq-mep-templates
python3 scripts/import_expanded_catalog.py

# 2. Verify in Coperniq UI
# Navigate to: https://app.coperniq.io/388/company/studio/catalog
```

**Expected**: 104 new items should appear in Coperniq 388 catalog

### HIGH PRIORITY - Solar + Field WO Workflows

Based on PLANNING.md backlog item BL-001:

1. **Create "Solar Installation" Project Workflow**
   - Phases: Lead → Site Survey → Design → Permit → Install → Interconnect → PTO
   - Navigate: Process Studio → Project Workflows → + New

2. **Create "Field Work Order" Templates**
   - Solar Panel Inspection
   - Inverter Diagnostic
   - Battery System Check
   - EV Charger Install Verification

### HIGH PRIORITY - Payment Structures Research

**Do the homework BEFORE contractors ask** - Stay ahead with comprehensive payment research.

#### By Trade Vertical

| Trade | Traditional Structures | Modern Options | Research Focus |
|-------|----------------------|----------------|----------------|
| **HVAC** | Flat rate, T&M, bid | Equipment financing, comfort-as-a-service | Heat pump financing programs, utility rebates |
| **Electrical** | T&M, progress billing | EV charger subscriptions, solar PPA | EV charging subscription models, panel upgrade financing |
| **Plumbing** | Flat rate, emergency rates | Leak detection subscriptions, water treatment rentals | Water-as-a-service models |
| **Solar/Energy** | Cash, loan, lease, PPA | BESS subscriptions, virtual net metering | Community solar, battery leasing, utility tariffs |
| **Roofing** | Insurance claims, progress | Roof-as-a-service, subscription warranties | Extended warranty programs, insurance partnerships |
| **Low Voltage** | Install + RMR | Full RMR models ($39-59/mo) | Security monitoring tiers, video storage pricing |
| **Fire Safety** | Annual contracts | Compliance-as-a-service | NFPA compliance bundles, inspection subscriptions |

#### By Market Segment

| Segment | Common Structures | Emerging Models | Key Differentiators |
|---------|------------------|-----------------|---------------------|
| **Residential** | Credit cards, financing, home equity | BNPL (buy now pay later), utility on-bill | Affordability, instant approval |
| **Resimercial** | Net 30, progress payments | Equipment-as-a-service, lease-to-own | Cash flow management for small business |
| **C&I Commercial** | Progress billing, retainage | Energy savings agreements, PACE financing | Capex vs Opex decision making |
| **Industrial/Utility** | Milestone payments, bonds | Power purchase agreements, ESCOs | Long-term contracts, performance guarantees |

#### Cutting-Edge Payment Innovations

Research these forward-thinking approaches:

- [ ] **Equipment-as-a-Service (EaaS)** - HVAC units, water heaters, solar+storage as monthly fee
- [ ] **Comfort-as-a-Service** - All-inclusive climate control subscription
- [ ] **Energy-as-a-Service** - Bundled solar+storage+EV with single payment
- [ ] **Outcome-Based Contracts** - Payment tied to energy savings achieved
- [ ] **PACE Financing** - Property Assessed Clean Energy for commercial
- [ ] **Green Bank Programs** - State-level low-interest green financing
- [ ] **Utility On-Bill Financing** - Repayment through utility bills
- [ ] **Community Solar Subscriptions** - Shared solar for renters/multi-family
- [ ] **Virtual Net Metering** - Credits across multiple meters
- [ ] **RMR Stacking** - Combining monitoring services (security + HVAC + solar)
- [ ] **Embedded Insurance** - Built-in equipment protection plans
- [ ] **BNPL for Home Services** - Affirm/Klarna-style for contractors

#### Integration Points for Coperniq

- [ ] Configure payment plan options in Service Plans
- [ ] Add financing fields to Project workflows
- [ ] Create payment milestone automations
- [ ] Build invoice templates with payment terms
- [ ] Set up recurring billing for subscriptions

Navigate to:
- Service Plans: `https://app.coperniq.io/388/company/studio/plans`
- Invoice Templates: `https://app.coperniq.io/388/company/studio/templates`

### MEDIUM PRIORITY - Voice Agent POC

Continue Track D from plan file:
- Configure Twilio phone number
- Set up Deepgram STT
- Set up Cartesia TTS
- Test outbound appointment confirmation call

### LOW PRIORITY - Documentation

- Update PLANNING.md with completed catalog research
- Archive research agent outputs to `/docs/research/`

---

## Files Modified/Created Today

```
coperniq-mep-templates/
├── config/master-catalog/
│   ├── catalog-items.json          # Original 115 items
│   └── catalog-items-expanded.json # NEW: 95 additional items
├── scripts/
│   └── import_expanded_catalog.py  # NEW: Import script
└── docs/
    └── TOMORROW_SPRINT_2026-01-14.md # NEW: This file
```

---

## Research Agent Output Locations

For reference, all research findings are cached in:
```
/tmp/claude/-Users-tmkipper-Desktop-tk-projects-ai-development-cockpit/tasks/
├── abe6db5.output  # HVAC research
├── a42fb22.output  # Electrical research
├── a9081a7.output  # Plumbing research
├── a49d64f.output  # Solar/Energy research
├── a31cfb1.output  # Roofing research
├── ade6d67.output  # Low Voltage research
├── a6191b1.output  # Fire Protection research
├── ac540fa.output  # C&I segment research
├── a52227d.output  # Industrial/Utility research
└── a7dc36c.output  # Resimercial research
```

---

## Verification Checklist

Before starting new work, verify:

- [ ] 210+ catalog items visible in Coperniq 388
- [ ] All 11 workflows still functional
- [ ] API key still working
- [ ] .env file has all required keys

---

## Key Pricing Insights from Research

| Item | Cost | Price | Margin |
|------|------|-------|--------|
| **RMR Monitoring - Basic** | $15/mo | $39.95/mo | 166% |
| **RMR Monitoring - Premium** | $22/mo | $59.95/mo | 172% |
| **Commercial RTU 10T** | $25,000 | $45,000 | 80% |
| **DC Fast Charger 50kW** | $55,000 | $95,000 | 73% |
| **Utility BESS 5MWh** | $625,000 | $937,500 | 50% |

**Key Insight**: RMR (Recurring Monthly Revenue) services have the highest margin and should be prioritized in sales workflows.

### Payment Structure Strategy by Margin

| Margin Tier | Items | Recommended Payment Model |
|-------------|-------|---------------------------|
| **150%+** | RMR Monitoring, Service Agreements | Subscription/auto-renew billing |
| **70-100%** | Equipment installs, Commercial RTU | Progress billing, equipment financing |
| **50-70%** | Large commercial, utility-scale | Milestone payments, PPAs, PACE |
| **<50%** | Material-heavy jobs | Down payment + COD, shorter terms |

**Strategic Focus**: Push higher-margin services (RMR, subscriptions) while using financing options to close larger equipment deals that generate long-term service revenue.

---

## Commands for Tomorrow

```bash
# Start session
cd ~/Desktop/tk_projects/ai-development-cockpit/coperniq-mep-templates

# Import expanded catalog
python3 scripts/import_expanded_catalog.py

# Open Coperniq UI
open "https://app.coperniq.io/388/company/studio/catalog"

# View current git status
git status
```

---

## Notes

- **No OpenAI** - All research used Claude, DeepSeek, Qwen via OpenRouter
- **API keys secure** - All in `.env` file only
- **Instance 388** = Kipper Energy Solutions demo instance
- **Plan file**: `~/.claude/plans/jaunty-doodling-bubble.md`
