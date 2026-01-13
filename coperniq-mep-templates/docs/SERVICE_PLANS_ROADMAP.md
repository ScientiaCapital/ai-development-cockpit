# Service Plans Roadmap - Multi-Trade MEP Contractor Template Library

**Created:** 2026-01-13
**Updated:** 2026-01-13
**Status:** Weeks 1-3 COMPLETE + O&M Contracts + Warranty | 18 Plans Live
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

### Service Plans (18 Live in Coperniq UI)

#### Residential (8 plans)
- [x] HVAC Bronze Plan (1 year, $199)
- [x] HVAC Silver Plan (1 year, $349)
- [x] HVAC Gold Plan (1 year, $499)
- [x] Plumbing Home Shield (1 year, $249)
- [x] Electrical Safety Plan (1 year, $199)
- [x] Solar Performance Monitoring (1 year, $150)
- [x] Fire Extinguisher Inspection (1 year, $99)
- [x] Total Home Care Bundle (1 year, $699) - Multi-trade flagship

#### Commercial (5 plans)
- [x] Commercial HVAC Basic PM (1 year, $1,500)
- [x] Commercial HVAC Full Service (1 year, $3,000)
- [x] Commercial Fire NFPA 25 (1 year, $800)
- [x] Commercial Electrical Safety (1 year, $1,500)
- [x] Commercial Plumbing PM (1 year, $1,000)

#### O&M Contracts (3 plans)
- [x] Solar O&M Contract (2-Year, $1,800/yr) - C&I solar
- [x] Full Building O&M Contract (3-Year, $12,000/yr) - Multi-trade MEP
- [x] Utility-Scale Solar O&M (5-Year, $10,000/yr) - Industrial/Agriculture

#### Property Management (1 plan)
- [x] Multi-Family MEP Bundle (2-Year, $21,000/yr) - 50-unit model

#### Warranty (1 plan)
- [x] Installation Workmanship Warranty (1-Year, $0) - Post-install lock-in

### Config Files (JSON templates)
- [x] `config/payment-structures/service-agreement-templates.json`
- [x] `config/payment-structures/emergency-premium-pricing.json`
- [x] `config/payment-structures/milestone-payment-templates.json`
- [x] `config/payment-structures/financing-options-templates.json`

---

## Service Plan Matrix - Complete

### RESIDENTIAL - 8 Plans COMPLETE

| Trade | Plan Name | Price | Duration | Visits/Year | Status |
|-------|-----------|-------|----------|-------------|--------|
| **HVAC** | Bronze Maintenance | $199/yr | 12 mo | 2 | DONE |
| **HVAC** | Silver Comfort | $349/yr | 12 mo | 2 | DONE |
| **HVAC** | Gold Total Care | $499/yr | 12 mo | 2 | DONE |
| **Plumbing** | Home Shield | $249/yr | 12 mo | 1 | DONE |
| **Electrical** | Safety Plan | $199/yr | 12 mo | 1 | DONE |
| **Solar** | Performance Monitoring | $150/yr | 12 mo | Continuous | DONE |
| **Fire** | Extinguisher Inspection | $99/yr | 12 mo | 1 | DONE |
| **Multi-Trade** | Total Home Care Bundle | $699/yr | 12 mo | 4 | DONE |

### COMMERCIAL - 5 Plans COMPLETE

| Trade | Plan Name | Price | Duration | Frequency | Status |
|-------|-----------|-------|----------|-----------|--------|
| **HVAC** | Commercial Basic PM | $1,500/yr | 12 mo | Quarterly | DONE |
| **HVAC** | Commercial Full Service | $3,000/yr | 12 mo | Quarterly | DONE |
| **Fire** | NFPA 25 Quarterly | $800/yr | 12 mo | Quarterly | DONE |
| **Electrical** | Commercial Safety | $1,500/yr | 12 mo | Bi-Annual | DONE |
| **Plumbing** | Commercial PM | $1,000/yr | 12 mo | Bi-Annual | DONE |

### O&M CONTRACTS - 3 Plans COMPLETE

| Segment | Plan Name | Price | Duration | Total Value | Status |
|---------|-----------|-------|----------|-------------|--------|
| **C&I Solar** | Solar O&M Contract | $1,800/yr | 24 mo | $3,600 | DONE |
| **Multi-Trade** | Full Building O&M | $12,000/yr | 36 mo | $36,000 | DONE |
| **Utility/Ag** | Utility-Scale Solar O&M | $10,000/yr | 60 mo | $50,000 | DONE |

### PROPERTY MANAGEMENT - 1 Plan COMPLETE

| Segment | Plan Name | Price | Duration | Total Value | Status |
|---------|-----------|-------|----------|-------------|--------|
| **Multi-Family** | MEP Bundle (50-Unit) | $21,000/yr | 24 mo | $42,000 | DONE |

### WARRANTY - 1 Plan COMPLETE

| Type | Plan Name | Price | Duration | Purpose | Status |
|------|-----------|-------|----------|---------|--------|
| **Workmanship** | Installation Warranty | $0 | 12 mo | Post-install lock-in | DONE |

---

## Contract Value Ladder

Understanding the progression from entry-level to enterprise contracts:

| Tier | Example | Annual Value | Duration | Lock-In Strategy |
|------|---------|--------------|----------|------------------|
| **Entry** | Residential Bronze | $199 | 1 year | Low friction entry |
| **Standard** | Commercial PM | $1,000-3,000 | 1 year | Code compliance |
| **Premium** | O&M Contract | $10,000-21,000 | 2-5 years | Long-term recurring |
| **Enterprise** | Utility-Scale O&M | $10,000+/yr | 5 years | $50K+ total value |
| **Lock-In** | Workmanship Warranty | $0 | 1 year | Relationship bridge |

---

## Still To Build

### Property Management Expansion
| Segment | Plan Name | Pricing Model | Status |
|---------|-----------|---------------|--------|
| HOA | Common Area | $500+/mo | TODO |
| Restaurant | Kitchen Package | Flat fee/yr | TODO |
| Data Center | Critical Systems | Retainer | TODO |
| EV Fleet | Charger + Solar | Per-charger/mo | TODO |

### Industrial Specialty
| Segment | Plan Name | Pricing Model | Status |
|---------|-----------|---------------|--------|
| Industrial | Chiller PM | Monthly retainer | TODO |
| Critical | Power Plans | Monthly retainer | TODO |

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

## Coperniq UI Reference

### Service Plan Fields
- **Name**: Display name
- **Total Price**: Annual or per-period cost
- **Duration**: 6/12/24 months or custom (up to 60 months)
- **Renewal**: Manual or Auto-renew
- **Service Schedule**: Work Order Template + Frequency
- **Invoice Schedule**: None/One-time/Monthly/Quarterly/Bi-annual/Annual
- **Invoice Terms**: Net 30 standard for commercial

### Creating a Service Plan
1. Navigate to: Company Settings -> Configure -> Service Plans
2. Click "+ Service Plan" button
3. Fill in Details & Terms section
4. Configure Service Schedule (link to WO template)
5. Set Invoice Schedule
6. Click Create

### Linking to Work Order Templates
Service Plans can auto-generate work orders. Create matching WO templates:
- Process Studio -> Field Work Orders -> Create Template
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

## Progress Checklist

- [x] Consolidate research agent outputs into JSON templates
- [x] Build residential service plans (8 complete)
- [x] Build commercial service plans (5 complete)
- [x] Build O&M contracts (3 complete)
- [x] Build property management bundles (1 complete)
- [x] Build warranty plan (1 complete)
- [x] Create matching Work Order templates (15 templates live)
- [x] Create strategic Labels for ICP contractors (32 labels: 18 Work + 14 Asset)
- [x] Asset types built-in (54 types across 5 categories - Fire Protection gap identified)
- [ ] Complete Stripe payment onboarding (51 items due)
- [ ] Connect solar monitoring (Enphase/SolarEdge) for O&M
- [ ] Connect QuickBooks for accounting sync
- [ ] Test automation triggers
- [ ] Build remaining PM bundles (HOA, Restaurant, Data Center)
- [ ] Build industrial specialty plans

---

## Notes

- ITC Safe Harbor deadline: June 30, 2026 (5% cost incurred locks in tax credit)
- NFPA 25 quarterly inspections are code-required for commercial sprinklers
- Property managers want one vendor, one invoice (huge blue ocean opportunity)
- Per-kW pricing for solar O&M is industry standard ($15-25/kW residential, $8-15/kW utility)
- Warranty plans create the relationship bridge from install to recurring PM revenue
- Multi-year O&M contracts are the "big contract" lock-in for C&I and utility
- **Fire Protection GAP**: Not available as trade or asset type in Coperniq platform (feature request needed)

---

*Last updated: 2026-01-13 (Labels + Asset Discovery Session) by Claude + Tim*

---

## Tomorrow Start: Sprint Guide (2026-01-14)

### Quick Context Load
```
Instance 388: Kipper Energy Solutions
URL: https://app.coperniq.io/388
Status: Labels ✅ | Catalog ✅ | Service Plans ✅ | Payments ⏳
```

### Priority 1: Complete Stripe Onboarding
**Why:** Invoicing blocked until Stripe setup complete
**Action:** Company Settings → General → Payments → "Continue onboarding" (51 items)
**Time:** ~30 mins

### Priority 2: Connect Solar Monitoring
**Why:** Enables O&M contract automation (production alerts, performance tracking)
**Action:** Company Settings → Systems → Install Enphase OR SolarEdge
**Requirements:** Customer API credentials from monitoring portal

### Priority 3: Connect QuickBooks
**Why:** Automates invoice sync, reduces double-entry
**Action:** Company Settings → Integrations → QuickBooks Online → Connect
**Requirements:** QB Online admin login

### Optional: Upload Company Logo
**Where:** Company Settings → General → Company logo
**Format:** PNG/JPG, square preferred

### Blockers to Escalate
| Issue | Who | Notes |
|-------|-----|-------|
| Fire Protection trade missing | Coperniq Support | Submit feature request |
| Fire Protection asset types missing | Coperniq Support | Sprinklers, Fire Pump, Alarm Panel |

### Files Reference
| Doc | Path | Purpose |
|-----|------|---------|
| Architecture | `docs/COPERNIQ_AGENTIC_PLATFORM.md` | MCP server + Voice AI design |
| Service Plans | `docs/SERVICE_PLANS_ROADMAP.md` | 18 plans + pricing |
| Payment Config | `config/payment-structures/` | JSON templates |

### Done Criteria for Tomorrow
- [ ] Stripe onboarding complete (can create invoices)
- [ ] At least one monitoring integration connected
- [ ] Company logo uploaded
- [ ] Fire Protection feature request submitted to Coperniq
