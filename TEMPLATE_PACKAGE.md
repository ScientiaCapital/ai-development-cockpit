# MEP Contractor Template Package

**The 80/20 Approach: Pre-built templates + simple customization**

Instead of building a full form builder, we provide ready-to-use templates that cover 80-90% of needs. Contractors just edit the 10-20% specific to their business.

---

## What We Deliver

### 1. ESTIMATING TEMPLATES

**Quote Templates (JSON/Excel)**
```
HVAC_Residential_Quote.json
├── Labor: Service call, hourly rates, flat rate options
├── Equipment: AC units, furnaces, heat pumps, thermostats
├── Materials: Refrigerant, filters, ductwork, insulation
└── Markups: Default 35% parts, 50% labor

HVAC_Commercial_Quote.json
├── Labor: T&M rates, prevailing wage options
├── Equipment: RTUs, chillers, VRF systems
├── Materials: Commercial-grade supplies
└── Markups: Default 25% (competitive commercial)

Plumbing_Service_Quote.json
├── Labor: Drain cleaning, fixture install, repipe
├── Materials: Pipes, fittings, fixtures, water heaters
└── Flat rate pricing for common repairs

Electrical_Service_Quote.json
├── Labor: Panel upgrades, outlet install, troubleshooting
├── Materials: Wire, breakers, outlets, fixtures
└── Code compliance line items
```

**Price Books (CSV/Excel)**
```
HVAC_PriceBook_2024.csv
├── 500+ common HVAC parts with costs
├── Suggested retail pricing
├── Vendor cross-reference (Ferguson, Johnstone, etc.)

Plumbing_PriceBook_2024.csv
├── 400+ plumbing parts
├── Fixture pricing
├── Drain cleaning equipment

Electrical_PriceBook_2024.csv
├── Wire, conduit, breakers
├── Fixture pricing
├── Code compliance items
```

**How Contractor Customizes (10-20%):**
- Adjust labor rates to their market
- Add/remove items from price book
- Change default markups
- Add company-specific services

---

### 2. FORM TEMPLATES

**Inspection Forms (PDF/Digital)**
```
HVAC Forms:
├── AC_System_Inspection.pdf (16 checkpoints)
├── Furnace_Safety_Inspection.pdf (22 checkpoints)
├── PM_Agreement_Service_Report.pdf
├── Refrigerant_Tracking_Log.pdf (EPA compliance)
└── Load_Calculation_Worksheet.pdf

Plumbing Forms:
├── Backflow_Test_Report.pdf (state-compliant)
├── Water_Heater_Inspection.pdf
├── Camera_Inspection_Report.pdf
├── Drain_Cleaning_Service_Report.pdf
└── Fixture_Count_Worksheet.pdf

Electrical Forms:
├── Panel_Inspection_Report.pdf
├── Ground_Fault_Test_Report.pdf
├── Circuit_Load_Analysis.pdf
├── Arc_Flash_Label_Request.pdf
└── Code_Violation_Checklist.pdf

Fire Protection Forms:
├── Sprinkler_System_Inspection.pdf (NFPA 25)
├── Fire_Extinguisher_Inspection.pdf
├── Hydrant_Flow_Test_Report.pdf
├── Alarm_System_Test_Report.pdf
└── Deficiency_Tracking_Log.pdf
```

**How Contractor Customizes (10-20%):**
- Add company logo/branding
- Add/remove checkpoints
- Change terminology to match their process
- Add custom fields for their workflow

---

### 3. WORKFLOW TEMPLATES

**Work Order Templates**
```
HVAC_Service_Call.template
├── Customer info, equipment, symptoms
├── Diagnosis checklist
├── Parts used tracking
├── Labor time tracking
├── Before/after photos
└── Customer signature

PM_Agreement_Visit.template
├── Equipment list to service
├── Seasonal checklist (heating/cooling)
├── Filter replacement log
├── Recommendation section
└── Next visit scheduling

Emergency_Dispatch.template
├── Priority level
├── Symptom description
├── Customer callback number
├── Technician dispatch
└── ETA notification
```

**How Contractor Customizes (10-20%):**
- Adjust priority levels
- Add company-specific steps
- Change notification preferences

---

### 4. EQUIPMENT DATABASE

**Pre-built Equipment Catalogs**
```
HVAC_Equipment_Catalog.csv
├── Carrier, Trane, Lennox, Rheem models
├── Model numbers, specs, warranty info
├── Common failure modes
├── Parts cross-reference

Water_Heater_Catalog.csv
├── AO Smith, Bradford White, Rheem
├── Tank sizes, BTU ratings
├── Installation requirements

Electrical_Equipment_Catalog.csv
├── Panel brands (Square D, Siemens, Eaton)
├── Breaker compatibility
└── Common upgrades
```

---

## Delivery Format Options

### Option A: Static Files ($2-5K)
- Deliver as ZIP of templates
- Contractor imports into their system
- Manual customization in Excel/Word
- One-time purchase

### Option B: Supabase-Ready Package ($5-10K)
- Pre-built Supabase schema
- Templates as database seeds
- Simple admin UI for customization
- Can integrate with Coperniq

### Option C: Full Integration ($15-25K)
- Templates integrated into Coperniq
- In-app customization UI
- Version control for templates
- Trade-specific onboarding

---

## Template Customization UI (Simple)

Instead of drag-drop builder, provide **simple edit mode**:

```
┌─────────────────────────────────────────┐
│ AC System Inspection Checklist          │
│ ─────────────────────────────────────── │
│                                         │
│ ☑ Check thermostat operation      [Edit]│
│ ☑ Inspect air filter              [Edit]│
│ ☑ Check refrigerant levels        [Edit]│
│ ☑ Inspect electrical connections  [Edit]│
│ ☐ Check condensate drain          [Edit]│ ← Can disable
│ + Add custom checkpoint                 │ ← Can add
│                                         │
│ [Save Changes]  [Reset to Default]      │
└─────────────────────────────────────────┘
```

**What Contractors Can Do:**
- Enable/disable checkpoints
- Edit checkpoint text
- Add custom checkpoints
- Reorder items
- Save as new template version

**What They CAN'T Do (keeps it simple):**
- Change field types (text vs checkbox)
- Complex conditional logic
- Multi-page forms
- These require full form builder ($20K+)

---

## What This Costs

| Package | What's Included | Price |
|---------|-----------------|-------|
| **Starter** | 50 templates, static files | $2,500 |
| **Pro** | 100+ templates, Supabase ready | $7,500 |
| **Enterprise** | Full integration, custom templates | $15,000+ |

---

## Build Timeline

### Week 1-2: Template Collection
- Gather all form templates
- Standardize format (JSON + PDF)
- Create price books from industry data

### Week 3: Packaging
- Create Supabase schema
- Seed scripts for templates
- Basic admin UI for customization

### Week 4: Delivery
- Documentation
- Video tutorials
- Contractor onboarding guide

**Total: 4 weeks, $5-10K to productize**

---

## Revenue Model

| Approach | Price | Margin |
|----------|-------|--------|
| Template sale | $2,500-15,000 | 90%+ (digital product) |
| Template + Setup | $5,000-25,000 | 70% |
| Template + Build | $25,000-100K+ | 50% (custom dev) |

**The pitch:**
"We have 100+ pre-built templates from auditing dozens of MEP contractors. They cover 80-90% of what you need. Instead of building from scratch, start with these and customize the 10-20% for your business."

---

## Template Inventory Needed

### Phase 1: Core Templates (50)
- 10 quote templates (by trade)
- 20 inspection forms (by trade)
- 10 work order templates
- 10 workflow templates

### Phase 2: Extended (100+)
- Price books by region
- State-specific compliance forms
- Equipment catalogs
- PM agreement templates

### Phase 3: Premium (200+)
- Industry certifications (NATE, EPA)
- Insurance compliance forms
- Commercial bid templates
- AIA billing formats
