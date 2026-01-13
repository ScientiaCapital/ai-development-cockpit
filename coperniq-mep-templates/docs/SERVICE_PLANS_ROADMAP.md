# Service Plans Roadmap - Multi-Trade MEP Contractor Template Library

**Created:** 2026-01-13
**Updated:** 2026-01-13
**Status:** Research In Progress | Build Phase Next
**Target:** Complete template library for plug-and-play multi-trade contractors

---

## Vision

Build a comprehensive service plan template library that enables:
1. **HVAC-focused contractors** expanding into energy (solar, battery, EV) and plumbing
2. **Energy/Solar contractors** pivoting into 2-3 additional trades (HVAC, electrical, plumbing)
3. **Asset-centric, self-performing contractors** across residential, C&I, industrial, and O&M

---

## What's Already Built (Committed)

### Catalog Items (378 items across 8 trades)
- [x] HVAC: 75 items
- [x] Electrical: 58 items
- [x] Plumbing: 52 items
- [x] Solar/Energy: 67 items
- [x] Fire Protection: 45 items
- [x] Low Voltage: 38 items
- [x] Roofing: 28 items
- [x] Building Envelope: 15 items

### Payment Structures (in Coperniq UI)
- [x] [MEP] Residential Small (50/50)
- [x] [MEP] Residential Medium (30/30/30/10)
- [x] [MEP] Commercial Small (10/40/40/10)
- [x] [MEP] Solar Commercial (Safe Harbor) - 6 milestones with ITC protection
- [x] [MEP] Fire Sprinkler (30/50/20)

### Service Plans (in Coperniq UI)
- [x] HVAC Bronze Plan (1 year, $199)
- [x] HVAC Silver Plan (1 year, $349)
- [x] HVAC Gold Plan (1 year, $499)

### Config Files (JSON templates)
- [x] `config/payment-structures/service-agreement-templates.json`
- [x] `config/payment-structures/emergency-premium-pricing.json`
- [x] `config/payment-structures/milestone-payment-templates.json`
- [x] `config/payment-structures/financing-options-templates.json`

---

## Service Plan Matrix - To Build

### RESIDENTIAL

| Trade | Plan Name | Price | Duration | Visits/Year | Status |
|-------|-----------|-------|----------|-------------|--------|
| **HVAC** | Bronze Maintenance | $199/yr | 12 mo | 2 | DONE |
| **HVAC** | Silver Comfort | $349/yr | 12 mo | 2 | DONE |
| **HVAC** | Gold Total Care | $499/yr | 12 mo | 2 | DONE |
| **Plumbing** | Home Shield | $249/yr | 12 mo | 1 | TODO |
| **Electrical** | Safety Plan | $199/yr | 12 mo | 1 | TODO |
| **Solar** | Performance Monitoring | $15/kW/yr | 12 mo | Continuous | TODO |
| **Fire** | Extinguisher Inspection | $25/unit | 12 mo | 1 | TODO |
| **Multi-Trade** | Total Home Care | $599/yr | 12 mo | 4 | TODO |

### COMMERCIAL & INDUSTRIAL (C&I)

| Trade | Plan Name | Pricing Model | Duration | Response SLA | Status |
|-------|-----------|---------------|----------|--------------|--------|
| **HVAC** | Commercial Basic PM | $75/ton/yr | 12 mo | 24hr | TODO |
| **HVAC** | Commercial Full Service | $150/ton/yr | 12 mo | 4hr | TODO |
| **Electrical** | Commercial Safety | $0.15/sqft/yr | 12 mo | 24hr | TODO |
| **Plumbing** | Commercial Plumbing PM | $0.10/sqft/yr | 12 mo | 24hr | TODO |
| **Fire** | NFPA 25 Quarterly | $8/head/yr | 12 mo | N/A | TODO |
| **Solar** | Commercial PV O&M | $18/kW/yr | 12 mo | 4hr | TODO |
| **Multi-Trade** | Full Building MEP | $0.50-2.00/sqft/yr | 12 mo | 4hr | TODO |

### INDUSTRIAL / UTILITY SCALE

| Trade | Plan Name | Pricing Model | Duration | Response SLA | Status |
|-------|-----------|---------------|----------|--------------|--------|
| **HVAC** | Industrial Chiller PM | Monthly retainer | 36 mo | 2hr | TODO |
| **Electrical** | Critical Power | Monthly retainer | 36 mo | 15min | TODO |
| **Fire** | Suppression System | Annual + T&M | 12 mo | 2hr | TODO |
| **Solar** | Utility O&M | $8-12/kW/yr | 60 mo | 4hr | TODO |
| **Multi-Trade** | Full Facility O&M | Cost-plus w/ cap | 36-60 mo | SLA matrix | TODO |

### PROPERTY MANAGEMENT (Blue Ocean)

| Segment | Plan Name | Pricing Model | Trades | Status |
|---------|-----------|---------------|--------|--------|
| Multi-Family | MEP Bundle | $35/unit/mo | HVAC+Plumbing+Electrical | TODO |
| HOA | Common Area | $500+/mo | All trades | TODO |
| Restaurant | Kitchen Package | Flat fee/yr | HVAC+Fire+Plumbing | TODO |
| Data Center | Critical Systems | Retainer | Cooling+Power+Fire | TODO |
| EV Fleet | Charger + Solar | Per-charger/mo | Electrical+Solar | TODO |

---

## Pricing Reference

### Labor Rates by Trade

| Trade | Journeyman | Lead/Master | Helper | After-Hours (1.5x) | Holiday (2x) |
|-------|------------|-------------|--------|---------------------|--------------|
| HVAC | $125/hr | $145/hr | $75/hr | $187.50 | $250 |
| Plumbing | $135/hr | $165/hr | $80/hr | $202.50 | $270 |
| Electrical | $130/hr | $160/hr | $75/hr | $195 | $260 |
| Fire Protection | $140/hr | N/A | N/A | $210 | $280 |

### Trip Charges

| Segment | Standard | After-Hours | Holiday |
|---------|----------|-------------|---------|
| Residential (in-area) | $89 | $145 | $195 |
| Residential (out-area) | $129 | $195 | $275 |
| Commercial | $125 + $2.50/mi | $195 + $3.50/mi | N/A |

### Diagnostic Fees

| Trade | Standard | Complex/Specialty | Waived If Repair > |
|-------|----------|-------------------|---------------------|
| HVAC | $89 | $145 | $250 |
| Plumbing | $95 | $195-295 | $300 |
| Electrical | $95 | $175-245 | $275 |

### Service Agreement Discounts

| Tier | Parts | Labor | After-Hours Reduction | Trip Waived | Diagnostic Waived |
|------|-------|-------|----------------------|-------------|-------------------|
| Bronze | 10% | 10% | 0% | No | No |
| Silver | 15% | 15% | 10% | No | Yes |
| Gold | 20% | 20% | 25% | Yes | Yes |

---

## Research In Progress

Six research agents are currently gathering comprehensive data:

1. **Residential Plans** - All trades, all tiers
2. **C&I Plans** - Pricing models, SLAs, compliance
3. **Industrial/Utility** - Heavy industrial, utility-scale solar
4. **O&M Contracts** - Full lifecycle, performance-based
5. **Blue Ocean Strategies** - Bundled plans, subscriptions, tech-enabled
6. **Pricing Benchmarks** - Industry rates, margin targets

Output files in `/tmp/claude/` - will be consolidated into JSON templates.

---

## Build Order (Recommended)

### Week 1: Residential Foundation
1. Plumbing Home Shield ($249/yr)
2. Electrical Safety Plan ($199/yr)
3. Solar Performance Monitoring ($15/kW)
4. Fire Extinguisher Inspection ($25/unit)
5. Total Home Care Multi-Trade Bundle ($599/yr)

### Week 2: Commercial Essentials
1. HVAC Commercial Basic PM ($75/ton)
2. HVAC Commercial Full Service ($150/ton)
3. NFPA 25 Quarterly Inspection ($8/head)
4. Commercial Electrical Safety
5. Commercial Plumbing PM

### Week 3: Property Management Bundles
1. Multi-Family MEP Bundle ($35/unit)
2. HOA Common Area Plan
3. Restaurant Kitchen Package
4. Medical Office Compliance Package

### Week 4: Industrial & Specialty
1. Industrial Chiller PM
2. Critical Power Plans
3. Utility-Scale Solar O&M
4. Data Center Package
5. EV Fleet Package

---

## Coperniq UI Reference

### Service Plan Fields
- **Name**: Display name
- **Total Price**: Annual or per-period cost
- **Duration**: 6/12/24 months or custom
- **Renewal**: Manual or Auto-renew
- **Service Schedule**: Work Order Template + Frequency
- **Invoice Schedule**: None/One-time/Monthly/Quarterly/Bi-annual/Annual

### Creating a Service Plan
1. Navigate to: Company Settings → Configure → Service Plans
2. Click "+ Service Plan" button
3. Fill in Details & Terms section
4. Configure Service Schedule (link to WO template)
5. Set Invoice Schedule
6. Click Create

### Linking to Work Order Templates
Service Plans can auto-generate work orders. Create matching WO templates:
- Process Studio → Field Work Orders → Create Template
- Include forms, checklists, parts lists

---

## Files Reference

| File | Purpose |
|------|---------|
| `config/payment-structures/service-agreement-templates.json` | All service plan specs |
| `config/payment-structures/emergency-premium-pricing.json` | After-hours, labor rates |
| `config/payment-structures/milestone-payment-templates.json` | Project milestone templates |
| `config/payment-structures/financing-options-templates.json` | Financing tiers |
| `config/trade-automations/core-automations.json` | Auto-invoice, PM triggers |
| `scripts/deploy_to_coperniq.py` | Deployment script (API + Playwright) |

---

## Next Session Checklist

- [ ] Consolidate research agent outputs into JSON templates
- [ ] Build remaining residential service plans
- [ ] Build commercial service plans
- [ ] Build property management bundles
- [ ] Create matching Work Order templates
- [ ] Test automation triggers
- [ ] Document in CLAUDE.md

---

## Notes

- ITC Safe Harbor deadline: June 30, 2026 (5% cost incurred locks in tax credit)
- NFPA 25 quarterly inspections are code-required for commercial sprinklers
- Property managers want one vendor, one invoice (huge blue ocean opportunity)
- Per-kW pricing for solar O&M is industry standard ($15-25/kW residential, $8-15/kW utility)

---

*Last updated: 2026-01-13 by Claude + Tim*
