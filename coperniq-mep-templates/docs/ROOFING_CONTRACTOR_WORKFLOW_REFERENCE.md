# Roofing Contractor Workflow Reference
## Coperniq Configuration Guide

**Version**: 1.0.0
**Created**: 2026-01-13
**Purpose**: Expert-level reference for configuring roofing contractor workflows in Coperniq

---

## Table of Contents

1. [Roofing Project Types](#1-roofing-project-types)
2. [Project Phases](#2-project-phases)
3. [Key Integrations](#3-key-integrations)
4. [Compliance Requirements](#4-compliance-requirements)
5. [Billing Structures](#5-billing-structures)
6. [Manufacturer Programs](#6-manufacturer-programs)
7. [Material Workflow](#7-material-workflow)
8. [Coperniq Entity Mapping](#8-coperniq-entity-mapping)
9. [Forms & Checklists](#9-forms--checklists)
10. [KPIs & Metrics](#10-kpis--metrics)

---

## 1. Roofing Project Types

### 1.1 Residential Re-Roofing

**Subtypes:**
| Type | Description | Typical Lifespan |
|------|-------------|------------------|
| Asphalt Shingle | Most common residential - 3-tab and architectural | 20-30 years |
| Tile (Clay/Concrete) | Popular in Southwest, Mediterranean style | 50+ years |
| Metal (Standing Seam) | Premium option, energy efficient | 40-70 years |
| Slate | High-end natural stone | 75-100+ years |
| Cedar Shake | Natural wood aesthetic | 30-40 years |

**Typical Project Profile:**
- Duration: 1-5 days
- Crew Size: 3-8 workers
- Workflow: Phase-based (lead to warranty)

### 1.2 Commercial Flat Roofing

**Subtypes:**
| System | Full Name | Market Share | Best For |
|--------|-----------|--------------|----------|
| TPO | Thermoplastic Polyolefin | ~40% | Energy efficiency, white roofs |
| EPDM | Ethylene Propylene Diene Monomer | ~25% | Budget-conscious, black rubber |
| BUR | Built-Up Roofing | ~15% | Heavy-duty, multiple layers |
| PVC | Polyvinyl Chloride | ~15% | Chemical resistance, restaurants |
| Modified Bitumen | Mod-Bit | ~5% | Hybrid performance |

**TPO Installation Methods:**
- **Fully Adhered**: Bonding adhesive to cover board
- **Mechanically Attached**: Fasteners with seam welding
- Heat-welded seams for waterproofing

**EPDM Installation Methods:**
- **Ballasted**: Rocks/pavers hold membrane in place
- **Mechanically Attached**: Fasteners (budget option)
- **Fully Adhered**: Chemical adhesive (cleanest finish)

**Typical Project Profile:**
- Duration: 3-21 days
- Crew Size: 4-15 workers
- Workflow: Bid-based with progress billing

### 1.3 Industrial Roofing

**Subtypes:**
- Large-scale metal roofing
- Spray polyurethane foam (SPF)
- Roof coatings/restoration

**Typical Project Profile:**
- Duration: 7-60 days
- Crew Size: 8-25 workers
- Complex logistics: cranes, staging, multiple phases

### 1.4 Solar-Ready Roofing / Solar Integration

**GAF Timberline Solar:**
- **Product**: Timberline Solar ES 2
- **Output**: 57 watts per shingle (23% improvement over gen 1)
- **Installation**: Nailable like standard shingles - same crew, tools, expertise
- **Advantage**: No rack-mounted panel penetrations
- **Support**: GAF handles system design and electrical permitting

**Workflow Phases:**
1. Lead generation
2. Site assessment (roof condition + solar potential)
3. System design
4. Permitting (building + electrical)
5. Roof installation
6. Electrical work
7. Inspection
8. Utility interconnection

### 1.5 Storm Damage / Insurance Restoration

**Damage Types:**
- Hail damage (impact marks, granule loss)
- Wind damage (lifted/missing shingles, blow-offs)
- Tree damage (punctures, structural)
- Water intrusion (leak damage from previous failures)

**Unique Workflow Requirements:**
- Emergency tarp/dry-in services
- Insurance adjuster coordination
- Xactimate supplement process
- ACV/RCV payment structure

---

## 2. Project Phases

### 2.1 Residential Retail Workflow

```
Lead → Inspection → Proposal → Material Order → Tear-Off → Installation → Final Inspection → Warranty
```

**Phase Details:**

| Phase | Key Activities | Required Data | Integrations |
|-------|---------------|---------------|--------------|
| **Lead** | Door knock, referral, website inquiry | Contact info, address | CRM auto-assign |
| **Inspection** | Roof assessment, measurements, photos | Roof type, age, condition, damage | EagleView, GAF QuickMeasure |
| **Proposal** | Estimate creation, material selection | Squares, materials, price, warranty | Proposal software, pricing API |
| **Material Order** | Order shingles, underlayment, flashing | Full BOM, delivery date | ABC Supply API |
| **Tear-Off** | Remove old roof, inspect deck | Layers removed, deck repairs | Waste manifest |
| **Installation** | Install new roof system | Crew lead, weather, progress | Daily reports |
| **Final Inspection** | Quality check, customer walkthrough | Pass/fail, punch list | Inspection form |
| **Warranty** | Register manufacturer warranty | Warranty type, registration # | GAF/OC/CT portal |

### 2.2 Storm Restoration Workflow

```
Lead → Emergency Tarp → Inspection → Claim Filed → Adjuster Meeting → Supplement → Approval → Material Order → Installation → Completion → Depreciation Release
```

**Critical Insurance Phases:**

| Phase | Description | Key Data |
|-------|-------------|----------|
| **Claim Filed** | Homeowner files claim with carrier | Claim #, policy #, adjuster name |
| **Adjuster Meeting** | On-site meeting with insurance adjuster | Scope agreement, damage findings |
| **Supplement** | Additional items submitted via Xactimate | Line items, codes, amounts |
| **ACV Payment** | Initial check (depreciated value) | ACV amount, deductible |
| **RCV Release** | Recoverable depreciation after completion | Completion docs, final invoice |

### 2.3 Commercial Workflow

```
Bid → Award → Pre-Construction → Mobilization → Demo → Installation → Inspection → Closeout
```

**Phase Details:**

| Phase | Key Activities | Billing Trigger |
|-------|---------------|-----------------|
| **Bid** | RFP response, quantity takeoff | - |
| **Award** | Contract negotiation, signing | Mobilization payment (10%) |
| **Pre-Construction** | Submittals, scheduling, safety plan | - |
| **Mobilization** | Material staging, equipment delivery | - |
| **Demo** | Tear-off existing system | - |
| **Installation** | Membrane installation, flashing | 50% milestone, substantial completion |
| **Inspection** | Third-party inspection, core cuts | - |
| **Closeout** | As-builts, warranty, lien waivers | Final payment less retainage |

---

## 3. Key Integrations

### 3.1 Aerial Measurement Services

#### EagleView
- **Turnaround**: 24-48 hours
- **Data Provided**:
  - Roof square footage
  - Pitch measurements
  - Facet breakdown
  - Ridge, hip, valley, rake, eave lengths
  - Georeferenced imagery (top-down + 4 directional)
- **Integration Partners**: AccuLynx, JobNimbus, Roofr
- **Use Case**: Estimate without climbing roof

#### GAF QuickMeasure
- **Turnaround**: Under 1 hour (single-family), under 24 hours (commercial)
- **Data Provided**:
  - Accurate measurements
  - 3D model for customer visualization
  - Material list auto-generation
- **Integration Partners**: AccuLynx, JobNimbus, Roofle
- **Use Case**: Fast proposals, interactive customer presentations

### 3.2 ABC Supply API

**Launched**: November 2023
**Cost**: Free for ABC Supply customers

**API Capabilities:**
| Feature | Description |
|---------|-------------|
| Product Catalog | Full product database access |
| Real-Time Pricing | Branch-specific, updated nightly |
| Order Placement | Submit orders directly from CRM |
| Delivery Tracking | Status updates, delivery notifications |
| Account Data | Order history, invoices, credits |

**Platform Integrations:**
- **ServiceTitan**: Branch-specific pricing synced to pricebook
- **JobNimbus**: Full visibility, delivery notifications
- **AccuLynx**: Convert estimates to orders in seconds, proof of delivery photos
- **Roofr**: Up-to-date pricing, direct ordering

### 3.3 Roofing CRM Platforms

| Platform | Best For | Pricing | Strengths | Considerations |
|----------|----------|---------|-----------|----------------|
| **JobNimbus** | Small-medium teams | $275-$375/mo | Easy onboarding, flexible boards, open API | Less feature-dense |
| **AccuLynx** | Large operations | Premium | Most features, AI lead scoring, all-in-one | Steep learning curve, rigid |
| **Roofr** | Sales-focused teams | $89/mo CRM, $10 measurements | Fastest estimates, best proposals | Limited post-sale, no mobile app |

### 3.4 Weather Tracking Integration

**Purpose**: Installation window planning

**Data Needed:**
- Precipitation probability
- Wind speed (OSHA limits at 25+ mph)
- Temperature (material adhesion requirements)
- Humidity (affects certain coatings)

**Automation Triggers:**
- Auto-reschedule if rain forecast
- Notify crew of weather changes
- Document weather conditions in daily log

---

## 4. Compliance Requirements

### 4.1 State Licensing

**Overview**: 32 states require state-level roofing license; 18 require local licensing only

**Key State Examples:**

| State | License Required | Threshold | Notes |
|-------|-----------------|-----------|-------|
| California | Yes | $500+ | Class C Specialty via CSLB |
| Arizona | Yes | Any | ROC license, separate res/comm |
| Florida | Yes | Any | Certified Roofing Contractor |
| Texas | No | - | Local permits may apply |
| Illinois | Yes | Any | Limited (8 units) or Unlimited |
| Colorado | No | - | Local requirements vary |
| Indiana | No | - | No state registration required |

**Common Requirements Across States:**
- Workers' compensation insurance
- General liability insurance ($1M+ minimum)
- Surety bond
- Trade examination
- Financial statements

### 4.2 OSHA Fall Protection (29 CFR 1926.501)

**Trigger Height**: 6 feet above lower level

**Low-Slope Roof Requirements:**
- Guardrail systems
- Safety net systems
- Personal fall arrest systems
- Warning line + safety monitoring (roofs 50 ft wide or less)

**Steep-Slope Roof Requirements:**
- Guardrails with toeboards
- Safety nets
- Personal fall arrest systems

**Residential Construction Alternative:**
- **Conditions**: Slope 8:12 or less AND fall distance 25 ft or less
- **Methods**: Safety monitors + slide guards

**Training Required**: All workers on roof must be trained in fall protection methods

### 4.3 EPA RRP Lead Paint Rule

**Applies To**: Pre-1978 homes and child-occupied facilities
**Effective**: April 22, 2010

**Triggers:**
| Location | Threshold |
|----------|-----------|
| Interior | 6 sq ft disturbed per room |
| Exterior | 20 sq ft disturbed |
| Always Covered | Window replacement, demolition |

**Requirements:**
- EPA-certified firm
- Certified renovator on-site
- Lead-safe work practices
- Proper containment
- HEPA-filtered vacuums

**Penalties:**
- Civil: Up to $32,200 per day per violation
- Criminal: Up to $50,000 per day + imprisonment

**Testing**: Assume lead-based paint unless properly tested negative

### 4.4 Waste Disposal Requirements

**Documentation Required:**
- Waste manifests
- Weight tickets
- Disposal receipts
- **Retention**: 3 years minimum

**Hazardous Waste Generator Categories:**

| Category | Monthly Threshold | Storage Limit |
|----------|-------------------|---------------|
| LQG (Large) | 2,205 lbs+ | 90 days |
| SQG (Small) | 220-2,205 lbs | 180-270 days |
| CESQG | Under 220 lbs | 2,205 lbs (no time limit) |

**Asbestos-Containing Roofing:**
- Permit required if >160 sq ft friable material
- OSHA 1926.1101 training required
- Special disposal procedures

**Dumpster Sizing Rule of Thumb:**
- 1,000 sq ft single layer = ~3 cubic yards = ~3 tons

---

## 5. Billing Structures

### 5.1 Retail Residential

**Structure**: Deposit + Completion

| Payment | Typical % | Trigger |
|---------|-----------|---------|
| Deposit | 10-33% | Contract signed |
| Balance | 67-90% | Job completion |

**Payment Methods**: Check, credit card, financing (GreenSky, Mosaic, etc.)

### 5.2 Insurance Restoration (ACV/RCV)

**Key Terms:**

| Term | Definition |
|------|------------|
| **ACV** (Actual Cash Value) | Depreciated value - paid upfront |
| **RCV** (Replacement Cost Value) | Full replacement cost |
| **Recoverable Depreciation** | RCV - ACV, released after completion |
| **Supplement** | Additional scope items via Xactimate |
| **Deductible** | Homeowner responsibility |

**Payment Flow:**

```
1. Claim Approved → Insurance issues ACV check
2. Homeowner pays deductible to contractor
3. Work completed → Contractor submits completion docs
4. Insurance releases recoverable depreciation (RCV - ACV)
```

**Xactimate Formula:**
```
Subtotal (Line Items) + O&P + Tax = RCV
RCV - Depreciation = ACV
ACV - Deductible = Initial Payment
```

**Supplement Process:**
1. Review Xactimate Loss Estimate from adjuster
2. Identify missing items, incorrect quantities, wrong codes
3. Create supplement estimate with proper Xactimate codes
4. Submit to insurance for approval
5. Receive additional payment when approved

### 5.3 Commercial Progress Billing

**Typical Schedule:**

| Milestone | Typical % |
|-----------|-----------|
| Mobilization | 10% |
| 50% Complete | 40% |
| Substantial Completion | 35% |
| Final (less retainage) | 10% |
| Retainage Release | 5% (30-60 days later) |

**Retainage**: 5-10% held until project closeout

---

## 6. Manufacturer Programs

### 6.1 GAF Certification Tiers

#### GAF Certified
- Licensed and insured
- Basic training
- Standard warranty offerings

#### GAF Master Elite (Top 2%)

**Requirements:**
- Licensed in state/province
- $1M+ general liability insurance
- 7+ years in roofing industry
- 1+ year in GAF program
- 99% customer satisfaction (GAF survey)
- B+ BBB rating minimum
- 4.0+ Google star rating
- Ongoing GAF training + testing
- Annual recertification

**Benefits:**
- Golden Pledge 50-year warranty
- Priority leads from GAF
- Marketing support
- Presidents Club recognition (1-3 stars)

### 6.2 Owens Corning Tiers

#### Preferred Contractor

**Requirements:**
- Licensed and insured (GL + WC)
- BBB good standing
- 3+ years in business
- No bankruptcy (7 years)
- No liens/judgments (5 years)
- Clear credit record

#### Platinum Preferred (Top 1%)

**Additional Requirements:**
- $1M+ liability insurance
- Rigorous background screening
- Financial stability verification
- Specialized OC product training
- Continuous education
- Customer service screening

**Benefits:**
- Platinum Protection warranty
- Exclusive territory protection
- Lead generation support

### 6.3 CertainTeed Tiers

#### ShingleMaster
- Trained applicators
- Proper insurance

#### SELECT ShingleMaster (Top 2%)

**Requirements:**
- 5+ years operating OR 1 year as ShingleMaster
- All supervisors = Master Shingle Applicators
- 50%+ of crew = Master Shingle Applicators
- Shingle Quality Specialist on team
- Owner passes Business Fiscal Responsibility exam
- General liability + workers' comp
- Code of ethics compliance
- 4/5+ customer satisfaction rating
- Financial stability verification

**Benefits:**
- 5-Star SureStart PLUS warranty
- Premium warranty offerings
- Marketing materials

---

## 7. Material Workflow

### 7.1 Residential Shingle Materials

**Order List:**
1. Shingles (architectural or 3-tab)
2. Underlayment (synthetic or felt)
3. Ice & water shield
4. Drip edge
5. Flashing (step, wall, pipe boots)
6. Ridge cap
7. Starter strip
8. Vents (ridge, static, powered)
9. Nails (coil or strip)
10. Sealants and caulks

**Installation Sequence:**

```
1. Drip edge at eaves
2. Ice & water shield at eaves, valleys, penetrations
3. Underlayment over ice & water shield
4. Drip edge at rakes (over underlayment)
5. Flashing at penetrations and walls
6. Starter strip at eaves
7. Field shingles (bottom to top)
8. Ridge cap
9. Final flashing and sealant
```

**Ice & Water Shield Placement:**
- Eaves: 2 ft minimum past interior wall line
- Valleys: Full length
- Around penetrations (pipes, vents, skylights)
- Against walls (chimney, dormers)
- Low-slope areas (2:12 to 4:12 pitch)

### 7.2 Commercial Flat Materials

**TPO System:**
- Cover board
- Insulation (polyiso, EPS)
- TPO membrane
- Adhesive or fasteners
- Seam tape
- Flashing membrane
- Termination bars
- Sealants

**EPDM System:**
- Cover board
- Insulation
- EPDM membrane
- Bonding adhesive / fasteners / ballast
- Seam tape or adhesive
- Flashing
- Termination bars

---

## 8. Coperniq Entity Mapping

| Coperniq Entity | Roofing Use Case |
|-----------------|------------------|
| **Contact** | Customer, lead, insurance adjuster |
| **Site** | Property address, roof location |
| **Asset** | Roof system with specifications (type, age, warranty) |
| **Task** | Work order, phase task, inspection |
| **System** | Installed roof system for warranty tracking |
| **FinancialDocument** | Estimate, invoice, insurance supplement, change order |

### Recommended Custom Fields

**Contact:**
- Insurance carrier
- Policy number
- Claim number
- Referral source

**Site:**
- Roof type (shingle, tile, flat, etc.)
- Roof age
- Pitch
- Total squares
- Last inspection date

**Asset (Roof System):**
- Manufacturer
- Product line
- Warranty type
- Warranty expiration
- Installation date

---

## 9. Forms & Checklists

### Inspection Forms
- [ ] Residential Roof Inspection Checklist
- [ ] Commercial Roof Condition Assessment
- [ ] Storm Damage Photo Matrix (hail size reference)
- [ ] Attic Ventilation Assessment

### Safety Forms
- [ ] Job Hazard Analysis (JHA)
- [ ] Daily Safety Briefing
- [ ] Fall Protection Plan
- [ ] Equipment Inspection Checklist

### Production Forms
- [ ] Daily Production Report
- [ ] Material Delivery Verification
- [ ] Quality Control Checklist
- [ ] Installation Completion Checklist

### Customer Forms
- [ ] Customer Authorization/Contract
- [ ] Certificate of Completion
- [ ] Warranty Registration Form
- [ ] Customer Satisfaction Survey

### Insurance Forms
- [ ] Assignment of Benefits (where legal)
- [ ] Scope Agreement Form
- [ ] Supplement Documentation Package
- [ ] Completion Certificate for RCV Release

---

## 10. KPIs & Metrics

### Sales Metrics
| Metric | Target | Calculation |
|--------|--------|-------------|
| Leads Generated | 50+/month | Total new leads |
| Inspections Completed | 80%+ of leads | Inspections / Leads |
| Close Rate | 30-50% | Signed / Inspections |
| Average Ticket | $8,000-$15,000 | Revenue / Jobs |
| Revenue per Lead | $3,000+ | Revenue / Leads |

### Production Metrics
| Metric | Target | Calculation |
|--------|--------|-------------|
| Jobs/Week | 5-10 | Completed jobs |
| Avg Days to Complete | 2-3 (residential) | Start to completion |
| Squares/Day | 15-25 | Squares installed per crew day |
| Callback Rate | <5% | Callbacks / Jobs |
| Punch List Items | <3 per job | Average items |

### Financial Metrics
| Metric | Target | Calculation |
|--------|--------|-------------|
| Gross Margin | 35-45% | (Revenue - COGS) / Revenue |
| Material Cost % | 25-35% | Materials / Revenue |
| Labor Cost % | 20-30% | Labor / Revenue |
| Supplement Recovery | 15-25% | Supplement $ / Original Scope |
| DSO | <30 days | Avg collection time |

### Customer Metrics
| Metric | Target | Calculation |
|--------|--------|-------------|
| CSAT Score | 4.5+/5 | Survey average |
| Google Rating | 4.5+ stars | Review average |
| Referral Rate | 25%+ | Referral leads / Total leads |
| Warranty Claims | <2% | Claims / Jobs |

---

## Sources

- [ABC Supply API Announcement](https://www.abcsupply.com/media-center/press-release/abc-supply-co-inc-gives-customers-unprecedented-access-to-data-with-new-api/)
- [GAF Master Elite Requirements](https://www.gaf.com/en-us/plan-design/homeowner-education/choose-gaf-roofer)
- [GAF QuickMeasure](https://www.gaf.com/en-us/resources/business-services/quickmeasure)
- [GAF Timberline Solar](https://www.gaf.com/en-us/plan-design/homeowner-education/solar-roof)
- [Owens Corning Contractor Network](https://www.owenscorning.com/en-us/roofing/rewards-program)
- [CertainTeed SELECT ShingleMaster](https://www.certainteed.com/select-shinglemaster)
- [OSHA Fall Protection 1926.501](https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.501)
- [EPA RRP Program](https://www.epa.gov/lead/lead-renovation-repair-and-painting-program)
- [ServiceTitan Roofing Trends 2025](https://www.servicetitan.com/blog/roofing-trends)
- [Roofing License Requirements by State](https://www.nextinsurance.com/blog/roofing-license-requirements/)

---

*Document generated for Coperniq MEP Templates project - AI Development Cockpit*
