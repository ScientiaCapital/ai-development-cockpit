# Fire Protection Contractor Project Workflows
## Expert Reference for Coperniq Workflow Configuration

**Document Version**: 1.0
**Date**: 2025-01-13
**Purpose**: Comprehensive reference for fire protection contractor workflows, compliance frameworks, and service models to support Coperniq template configuration.

---

## Table of Contents
1. [Fire Protection Trade Categories](#1-fire-protection-trade-categories)
2. [Project Types](#2-project-types)
3. [Compliance Framework](#3-compliance-framework-critical)
4. [New Construction Project Phases](#4-new-construction-project-phases)
5. [ITM Service Model](#5-inspection-testing--maintenance-itm-service-model)
6. [Recurring Revenue Models](#6-recurring-revenue-models)
7. [Deficiency Management Workflow](#7-deficiency-management-workflow)
8. [Coperniq Workflow Mapping](#8-coperniq-workflow-mapping)

---

## 1. Fire Protection Trade Categories

### 1.1 Fire Sprinkler Systems

| System Type | Pipe Contents | Sprinkler Heads | Response Time | Primary Applications |
|-------------|--------------|-----------------|---------------|----------------------|
| **Wet Pipe** | Water (constant) | Closed (heat-activated) | Immediate | Heated buildings, offices, schools, most commercial |
| **Dry Pipe** | Pressurized air/nitrogen | Closed (heat-activated) | Slight delay (air release first) | Freezing environments, unheated warehouses, parking garages |
| **Pre-Action** | Pressurized air | Closed (2-step activation) | Delayed | Data centers, museums, libraries, telecom rooms |
| **Deluge** | Empty (atmospheric) | Open (all discharge simultaneously) | Immediate upon valve activation | High-hazard: chemical plants, power plants, aircraft hangars |

**Single Interlock Pre-Action**: Detection system activation fills pipes, then heat opens heads
**Double Interlock Pre-Action**: Requires BOTH detection AND heat activation (maximum protection against accidental discharge)

**Governing Standard**: NFPA 13 - Standard for the Installation of Sprinkler Systems

---

### 1.2 Fire Alarm Systems (NFPA 72)

**Components:**
- Fire alarm control panel (FACP)
- Initiating devices (smoke detectors, heat detectors, manual pull stations)
- Notification appliances (horns, strobes, speakers)
- Duct smoke detectors
- Elevator recall interfaces
- HVAC shutdown integration
- Mass notification systems (MNS)

**System Types:**
- Conventional (zone-based)
- Addressable (device-level identification)
- Hybrid systems
- Voice evacuation systems

**Key Requirements:**
- Detector sensitivity testing: Within 1 year after installation, every 2 years thereafter
- Reacceptance testing: 100% of affected components + 10% of unaffected initiating devices

---

### 1.3 Fire Extinguisher Service (NFPA 10)

**Extinguisher Classifications:**
- Class A: Ordinary combustibles (wood, paper, cloth)
- Class B: Flammable liquids (gasoline, oil, grease)
- Class C: Electrical equipment
- Class D: Combustible metals
- Class K: Cooking oils/fats (commercial kitchens)

**Agent Types:**
- Water
- Dry chemical (ABC, BC)
- CO2
- Clean agent (Halotron, FE-36)
- Wet chemical (Class K)

---

### 1.4 Fire Suppression Systems

#### Kitchen Hood Suppression (NFPA 17A)
- Wet chemical systems (UL 300 compliant)
- Pre-engineered systems
- Nozzles over each cooking appliance
- Integration with hood ventilation
- Fuel shutoff integration

#### Clean Agent Systems (NFPA 2001)
- FM-200 (HFC-227ea)
- Novec 1230 (FK-5-1-12)
- Inert gas systems (IG-541, IG-55, IG-100)
- No residue, safe for electronics
- Used in server rooms, museums, archives

**Common Applications:**
- Data centers
- Telecom switching rooms
- Control rooms
- Medical imaging rooms
- Archive/record storage

---

### 1.5 Fire Pump Systems (NFPA 20)

**Pump Types:**
- Horizontal split-case
- Vertical turbine
- End suction
- Vertical in-line

**Driver Types:**
- Electric motor-driven
- Diesel engine-driven
- Combination (electric + diesel backup)

**Key Components:**
- Fire pump controller
- Jockey pump (pressure maintenance)
- Pressure gauges (suction/discharge)
- Flow test header
- Bypass line

---

### 1.6 Standpipe Systems (NFPA 14)

**Classes:**
- **Class I**: 2.5" hose connections for fire department use
- **Class II**: 1.5" hose connections with attached hose for occupant use
- **Class III**: Both 2.5" and 1.5" connections (combined I & II)

**Types:**
- Automatic wet: Water always in pipes
- Automatic dry: Air pressure, fills on demand
- Semi-automatic dry: Remote or manual valve activation
- Manual dry: Fire department connection only

**Pressure Requirements (post-1993 NFPA 14):**
- Minimum: 100 psi at hose outlet
- Maximum: 175 psi at hose outlet

---

### 1.7 Smoke Control / Pressurization Systems (NFPA 92)

**System Types:**
- Stairwell pressurization
- Elevator hoistway pressurization
- Vestibule pressurization
- Zone smoke control
- Smoke refuge area pressurization
- Atrium smoke exhaust

**Design Documentation Required:**
- Detailed Design Report
- Operations and Maintenance (O&M) Manual

---

## 2. Project Types

### 2.1 New Construction (Design-Build or Plan-Spec)

**Delivery Methods:**
- **Design-Build**: Fire protection contractor handles both design and installation
- **Plan-Spec**: Engineer designs, contractor bids and installs per spec

**Typical Scope:**
- Complete fire sprinkler system design and installation
- Fire alarm system installation
- Standpipe system installation
- Fire pump installation (if required)
- Coordination with all trades

---

### 2.2 Tenant Improvement (TI) / Buildout

**Scope:**
- Modification of existing systems for new tenant layouts
- Addition/relocation of sprinkler heads
- Fire alarm device additions/relocations
- Code compliance for new occupancy classification
- AHJ plan review for modifications

**Key Considerations:**
- Tie-in to existing risers
- Hydraulic recalculation if significant changes
- Ceiling type changes (drop vs. exposed)
- Occupancy classification changes

---

### 2.3 Retrofit / Upgrade

**Common Triggers:**
- Code adoption requiring sprinkler protection
- Insurance requirements
- Change of occupancy
- Building additions
- System obsolescence

**Challenges:**
- Working around existing structure
- Concealed piping considerations
- Higher cost ($2-7/sq ft vs $1-2 for new construction)
- Phased installation while building occupied

---

### 2.4 Annual Inspections (NFPA 25 ITM)

**Comprehensive Annual Requirements:**
- Sprinkler system inspection and testing
- Fire pump flow testing
- Standpipe testing
- Fire alarm testing
- Fire extinguisher annual maintenance
- Emergency/exit lighting testing

---

### 2.5 5-Year Inspections

**Internal Pipe Inspection (NFPA 25 Ch. 14):**
- Open flushing connection at end of main
- Remove sprinkler head near end of branch line
- Assess for corrosion, scale, foreign material
- Document findings with photos

**Obstruction Investigation Triggers:**
- Foreign material found during internal inspection
- Any of 15 NFPA 25 obstruction indicators present

**Additional 5-Year Requirements:**
- Dry pipe/pre-action trip test
- Hydrostatic testing of FDC piping (150 psi for 2 hours)
- Standpipe hose testing
- Pressure regulating device testing

---

### 2.6 Service and Repairs

**Common Service Calls:**
- Impaired system restoration
- Accidental discharge cleanup
- Freeze damage repairs
- Vandalism repairs
- Corrective maintenance
- Emergency repairs

---

## 3. Compliance Framework (CRITICAL)

### 3.1 Primary NFPA Standards

| Standard | Title | Scope |
|----------|-------|-------|
| **NFPA 13** | Standard for Installation of Sprinkler Systems | Design, installation of automatic sprinkler systems |
| **NFPA 13R** | Standard for Installation in Low-Rise Residential | 1-4 story residential occupancies |
| **NFPA 13D** | Standard for Installation in 1- and 2-Family Dwellings | Single/two-family homes and manufactured homes |
| **NFPA 14** | Standard for Installation of Standpipe and Hose Systems | Standpipe system design and installation |
| **NFPA 20** | Standard for Installation of Stationary Pumps | Fire pump design and installation |
| **NFPA 25** | Standard for ITM of Water-Based Fire Protection | Inspection, testing, maintenance requirements |
| **NFPA 72** | National Fire Alarm and Signaling Code | Fire alarm design, installation, ITM |
| **NFPA 10** | Standard for Portable Fire Extinguishers | Selection, installation, inspection, maintenance |
| **NFPA 17A** | Standard for Wet Chemical Extinguishing Systems | Kitchen hood suppression systems |
| **NFPA 2001** | Standard on Clean Agent Fire Extinguishing Systems | Data center, telecom suppression |
| **NFPA 92** | Standard for Smoke Control Systems | Smoke containment and exhaust systems |
| **NFPA 96** | Standard for Ventilation Control of Commercial Cooking | Kitchen exhaust systems |

### 3.2 Authority Having Jurisdiction (AHJ)

**Who is the AHJ?**
- Local fire marshal
- State fire marshal
- Building department
- Insurance carrier
- Federal agencies (for specific occupancies)

**AHJ Responsibilities:**
- Plan review and approval
- Permit issuance
- Construction inspections
- Final acceptance testing witness
- Ongoing compliance verification

**Key AHJ Interactions:**
1. Pre-construction meeting
2. Plan submittal and review
3. Permit issuance
4. Rough-in inspections
5. Hydrostatic test witness
6. Final inspection and acceptance
7. Certificate of occupancy sign-off

### 3.3 State Fire Marshal Requirements

**Common State-Level Requirements:**
- Contractor licensing (fire protection contractor license)
- Designer/engineer licensing (P.E. stamp requirements)
- Journeyman/fitter certification
- NICET certification requirements
- Plan examiner certification
- Inspector certification

### 3.4 Retroactivity Note

**IMPORTANT**: NFPA 25 does NOT include a retroactivity clause. All systems, regardless of installation date, must comply with current NFPA 25 ITM requirements.

---

## 4. New Construction Project Phases

### Phase 1: Design & Engineering
**Duration**: 2-6 weeks typical

| Task | Description | Deliverables |
|------|-------------|--------------|
| Site survey | Review architectural/structural drawings | Field notes, RFIs |
| Hydraulic calculations | Size pipe, verify water supply adequacy | Hydraulic calc report |
| System layout | Design pipe routing, head placement | Sprinkler layout drawings |
| Coordination | MEP coordination with HVAC, electrical, plumbing | Clash detection report |
| Material takeoff | Quantity all pipe, fittings, heads, hangers | BOM (Bill of Materials) |

### Phase 2: AHJ Plan Review
**Duration**: 2-8 weeks (varies by jurisdiction)

| Task | Description | Deliverables |
|------|-------------|--------------|
| Plan submittal | Submit drawings to fire marshal | Permit application |
| Respond to comments | Address plan review corrections | Revised drawings |
| Permit issuance | Receive approval to proceed | Building permit |
| Pre-construction meeting | Coordinate with GC and AHJ | Meeting minutes |

**Required Submittal Documents:**
- Cover sheet with project info
- Floor plan layouts
- Hydraulic calculations
- Riser diagrams
- System data sheets
- Cut sheets for key components
- Water supply flow test data

### Phase 3: Underground Rough-In
**Duration**: 1-3 weeks

| Task | Description | Deliverables |
|------|-------------|--------------|
| Excavation | Dig trenches for underground mains | Trench inspection |
| Pipe installation | Install underground fire mains | Installation photos |
| Thrust blocks | Pour concrete thrust blocks at bends | Inspection approval |
| Hydrostatic test | Test underground at 200 psi | Test certificate |
| Backfill | Backfill and compact | Compaction test |
| AHJ inspection | Underground inspection | Inspection sign-off |

### Phase 4: Above-Ground Rough-In
**Duration**: 2-8 weeks (varies by building size)

| Task | Description | Deliverables |
|------|-------------|--------------|
| Riser installation | Install main risers, cross mains | Progress photos |
| Branch line installation | Install branch lines per layout | Installation checklist |
| Hanger installation | Install seismic bracing, hangers | Hanger inspection |
| Valve installation | Install OS&Y valves, check valves | Valve checklist |
| Pressure test | Test sections before concealment | Test reports |
| AHJ rough inspection | Inspect before ceiling installation | Inspection sign-off |

### Phase 5: Trim-Out
**Duration**: 1-2 weeks

| Task | Description | Deliverables |
|------|-------------|--------------|
| Sprinkler head installation | Install heads after ceiling in | Head count verification |
| Escutcheon installation | Install covers at ceiling penetrations | Visual inspection |
| FDC installation | Install fire department connection | FDC checklist |
| Signage installation | Install required signs | Signage checklist |
| Final alignment | Adjust heads for proper spacing | QC checklist |

### Phase 6: Hydrostatic Test
**Duration**: 1 day

| Task | Description | Deliverables |
|------|-------------|--------------|
| System fill | Fill system, bleed air | N/A |
| Pressure test | 200 psi for 2 hours (new) | Test certificate |
| Leak repair | Repair any leaks identified | Repair documentation |
| Retest | Retest if repairs made | Final test certificate |

**Test Pressures:**
- New systems: 200 psi for 2 hours
- Modifications (>20 heads): 200 psi or 50 psi above operating pressure
- Alterations: 175 psi minimum for 2 hours

### Phase 7: Final Inspection
**Duration**: 1 day

| Task | Description | Deliverables |
|------|-------------|--------------|
| Witness test | Fire marshal witnesses acceptance test | Inspection report |
| Flow test | Verify water flow at most remote head | Flow test data |
| Alarm test | Verify alarm, supervisory signals | Signal verification |
| Documentation review | Review as-builts, hydraulics, manuals | Acceptance certificate |
| Final punch list | Address any deficiencies | Punch list closeout |

### Phase 8: As-Built Drawings
**Duration**: 1-2 weeks post-completion

| Task | Description | Deliverables |
|------|-------------|--------------|
| Field verification | Verify installed matches drawings | Field notes |
| Drawing updates | Update drawings with actual install | As-built drawings |
| Document package | Compile all project documents | O&M manual |
| Owner training | Train owner on system operation | Training sign-off |
| Warranty initiation | Start warranty period | Warranty certificate |

---

## 5. Inspection, Testing & Maintenance (ITM) Service Model

### 5.1 Inspection Frequency Matrix

| Component | Weekly | Monthly | Quarterly | Semi-Annual | Annual | 5-Year | 10-Year |
|-----------|--------|---------|-----------|-------------|--------|--------|---------|
| **Wet Pipe Sprinkler** | | Gauges, valve position | Control valves, FDC | | Full system | Internal pipe | |
| **Dry Pipe Sprinkler** | Gauges, air pressure | | Enclosure heat, low point drains | | Full system, trip test | Internal pipe, trip test | |
| **Pre-Action** | Gauges, air pressure | | Low point drains | | Full system, trip test | Internal pipe | |
| **Deluge** | | Gauges | Valve position | | Full system, trip test | Internal pipe | |
| **Fire Pump (Diesel)** | Churn test (30 min) | | | | Flow test (3 points) | | |
| **Fire Pump (Electric)** | | Churn test (10 min) | | | Flow test (3 points) | | |
| **Standpipes** | | | | | Main drain test, hose valve insp | Hydro test, hose test | |
| **Fire Alarm** | | Visual (some devices) | | Visual inspection | Full functional test | | Sensitivity test |
| **Fire Extinguishers** | | Visual inspection | | | Maintenance | 6-year internal exam | 12-year hydro |
| **Kitchen Hood** | | Visual | | Full inspection | | | 12-year hydro |
| **Clean Agent** | | | | | Full inspection | | |

### 5.2 Quarterly Visual Inspection Checklist

**Sprinkler Systems:**
- [ ] Water flow alarm devices
- [ ] Valve alarm devices (tamper switches)
- [ ] Control valve position (locked/supervised)
- [ ] Signal devices (exterior)
- [ ] Hydraulic nameplate legible
- [ ] Fire department connections (caps, gaskets, visibility)

### 5.3 Annual Testing Requirements

**Fire Sprinkler Systems:**
- Main drain test (each riser)
- Waterflow alarm devices
- Control valve operation
- Alarm device functional test
- Sprinkler head sample (20+ years old)

**Fire Pump Annual Flow Test:**
- No-flow (churn) condition
- 100% rated flow
- 150% rated flow
- Record: suction pressure, discharge pressure, RPM, amps (electric)

**Fire Alarm Annual Testing:**
- All initiating devices
- All notification appliances
- Control panel functions
- Remote annunciators
- HVAC shutdown
- Elevator recall
- Door holder release
- Central station communication

**Fire Extinguishers:**
- External examination
- Operating instructions check
- HMIS label present
- Tamper seal verification
- Pressure gauge check (stored pressure)
- Weigh extinguisher
- New service tag

### 5.4 5-Year Internal Inspection Protocol (NFPA 25 Ch. 14)

**Required Assessment Points:**
1. System valve
2. Riser
3. Cross main
4. Branch line (near end)

**Procedure:**
1. Open flushing connection at end of main
2. Remove sprinkler head near end of branch line
3. Visually inspect interior for:
   - Corrosion
   - Scale buildup
   - Organic material (MIC - microbiologically influenced corrosion)
   - Foreign objects
   - Sediment
4. Document findings with photos
5. Report to building owner

**If Foreign Material Found:**
- Initiate obstruction investigation
- Determine extent of problem
- Recommend corrective action (flushing, chemical treatment, pipe replacement)

### 5.5 Deficiency Tracking Workflow

```
┌─────────────────────┐
│ INSPECTION COMPLETE │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Deficiency Found?   │─Yes─▶│ Classify Deficiency │
└──────────┬──────────┘     └──────────┬──────────┘
           │No                         │
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Issue Clean Report  │     │ IMPAIRMENT          │──▶ Immediate action required
└─────────────────────┘     │ (System cannot      │    Fire watch may be needed
                            │  perform function)  │
                            ├─────────────────────┤
                            │ CRITICAL DEFICIENCY │──▶ Correct ASAP
                            │ (Material impact on │    Can affect system performance
                            │  system performance)│
                            ├─────────────────────┤
                            │ NONCRITICAL         │──▶ Correct within reasonable time
                            │ (Does not impact    │    Does not affect function
                            │  performance)       │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │ Generate Repair     │
                            │ Quote/Work Order    │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │ Schedule Repair     │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │ Complete Repair     │
                            │ Document Resolution │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │ Update Compliance   │
                            │ Records             │
                            └─────────────────────┘
```

### 5.6 Compliance Documentation Package

**Required Records (per building):**
- System Record of Inspection & Testing (NFPA 72 form)
- Record of Completion (new/modified systems)
- Deficiency reports with corrective actions
- Device lists and locations
- Central station signal logs
- Hydraulic calculations (sprinkler)
- As-built drawings
- Equipment manuals
- Contractor certifications/licenses

---

## 6. Recurring Revenue Models

### 6.1 ITM Service Agreements

**Contract Types:**
| Type | Frequency | Typical Scope |
|------|-----------|---------------|
| Basic Annual | 1x/year | Annual inspection per NFPA 25 |
| Enhanced | 2-4x/year | Quarterly + Annual inspections |
| Full Service | 4-12x/year | All required ITM + priority service |
| All-Inclusive | Ongoing | ITM + repairs included (flat fee) |

**Service Agreement Benefits:**
- Predictable revenue for contractor
- Budget certainty for building owner
- Compliance assurance
- Priority scheduling
- Discounted repair rates

### 6.2 Fire Alarm Monitoring Contracts

**Services Included:**
- 24/7 central station monitoring
- Alarm signal response
- Supervisory signal tracking
- Trouble signal notification
- Monthly monitoring fee
- Annual communication test

**Contract Terms:**
- Monthly, quarterly, or annual billing
- Multi-year discount options
- Auto-renewal provisions
- 30-60 day cancellation notice

### 6.3 Fire Extinguisher Service Routes

**Route Model:**
| Service | Frequency | Revenue Type |
|---------|-----------|--------------|
| Monthly visual inspection | Monthly | Per unit fee |
| Annual maintenance | Annual | Per unit + parts |
| 6-year internal exam | Every 6 years | Per unit + parts |
| 12-year hydrostatic | Every 12 years | Per unit + replacement |
| Recharge service | As needed | Service call + agent |

**Key Metrics:**
- Extinguishers per route
- Average service time per unit
- Replacement rate
- Parts/agent markup

### 6.4 Preventive Maintenance Agreements (PMA)

**Typical PMA Scope:**
- All scheduled ITM per NFPA
- Priority emergency service
- Discount on repairs (typically 10-20%)
- 24/7 emergency response
- Compliance tracking and reminders
- Annual budget planning

### 6.5 Recurring Revenue Value

**Industry Benchmarks:**
- Companies with 70-80% recurring revenue achieve EBITDA multiples 2-3x higher
- Recurring revenue stabilizes cash flow
- Higher customer retention
- Lower customer acquisition cost
- Premium valuation for M&A

---

## 7. Deficiency Management Workflow

### 7.1 Deficiency Categories (NFPA 25)

| Category | Definition | Required Response |
|----------|------------|-------------------|
| **Impairment** | System or portion cannot perform its function | Immediate - fire watch may be required |
| **Critical Deficiency** | Can have material impact on system performance | As soon as possible |
| **Noncritical Deficiency** | Does not impact system performance | Reasonable timeframe |

### 7.2 Common Deficiencies by System Type

**Fire Sprinkler:**
- Painted/loaded sprinkler heads (critical)
- Obstructed sprinkler heads (critical)
- Missing escutcheons (noncritical)
- Inadequate spare sprinklers (noncritical)
- Corroded pipe (varies)
- Closed control valve (impairment)

**Fire Alarm:**
- Damaged devices (varies)
- Obstructed detection (critical)
- Panel troubles (varies)
- Failed devices (critical)
- Missing documentation (noncritical)

**Fire Extinguishers:**
- Low pressure (critical)
- Obstructed access (noncritical)
- Missing signage (noncritical)
- Damaged cylinder (critical)
- Expired service (noncritical)

### 7.3 Documentation Requirements

**Deficiency Report Must Include:**
- Building/location information
- System identification
- Deficiency description
- Classification (impairment/critical/noncritical)
- Photo documentation
- Recommended corrective action
- Estimated cost
- Priority/timeframe
- Inspector name and credentials

---

## 8. Coperniq Workflow Mapping

### 8.1 Recommended Project Phases (New Construction)

```
Phase 1: DESIGN
├── Task: Site Survey
├── Task: Hydraulic Calculations
├── Task: System Layout Design
├── Task: MEP Coordination
└── Task: Material Takeoff

Phase 2: PERMIT
├── Task: Plan Submittal
├── Task: Plan Review Response
├── Task: Permit Issuance
└── Task: Pre-Construction Meeting

Phase 3: UNDERGROUND
├── Task: Excavation
├── Task: Underground Pipe Install
├── Task: Hydrostatic Test - Underground
├── Task: AHJ Underground Inspection
└── Task: Backfill

Phase 4: ROUGH-IN
├── Task: Riser Installation
├── Task: Cross Main Installation
├── Task: Branch Line Installation
├── Task: Hanger/Bracing Installation
├── Task: AHJ Rough Inspection
└── Task: Pre-Cover Hydro Test

Phase 5: TRIM-OUT
├── Task: Sprinkler Head Installation
├── Task: Escutcheon Installation
├── Task: FDC Installation
├── Task: Signage Installation
└── Task: Final Alignment Check

Phase 6: TESTING
├── Task: Final Hydrostatic Test
├── Task: Flow Test
├── Task: Alarm Test
└── Task: AHJ Acceptance Test

Phase 7: CLOSEOUT
├── Task: As-Built Drawings
├── Task: O&M Manual Delivery
├── Task: Owner Training
├── Task: Warranty Documentation
└── Task: Final Billing
```

### 8.2 ITM Service Workflow

```
Phase 1: SCHEDULING
├── Task: Service Agreement Review
├── Task: Schedule Inspection
└── Task: Notify Customer

Phase 2: INSPECTION
├── Task: Perform Visual Inspection
├── Task: Perform Functional Testing
├── Task: Document Findings
└── Task: Generate Inspection Report

Phase 3: DEFICIENCY MANAGEMENT
├── Task: Classify Deficiencies
├── Task: Generate Repair Quotes
├── Task: Customer Approval
└── Task: Schedule Repairs

Phase 4: REMEDIATION
├── Task: Perform Repairs
├── Task: Re-inspect Corrected Items
└── Task: Close Deficiencies

Phase 5: COMPLIANCE
├── Task: Update Compliance Records
├── Task: Submit to AHJ (if required)
├── Task: Notify Central Station
└── Task: Archive Documentation
```

### 8.3 Task Types for Coperniq

| Task Type | Use Case | Typical Duration |
|-----------|----------|------------------|
| Design Task | Engineering, layouts, calcs | 1-5 days |
| Permit Task | AHJ submittals, review | 2-8 weeks |
| Installation Task | Field work | Hours to days |
| Inspection Task | ITM activities | 1-4 hours |
| Testing Task | Flow tests, functional tests | 1-4 hours |
| Repair Task | Deficiency correction | Varies |
| Documentation Task | Reports, as-builts | 1-3 days |

### 8.4 Asset Types for Coperniq

| Asset Type | Description | ITM Frequency |
|------------|-------------|---------------|
| Fire Sprinkler System | Wet, dry, pre-action, deluge | Quarterly/Annual/5-Year |
| Fire Alarm System | FACP and all devices | Semi-Annual/Annual |
| Fire Pump | Electric or diesel | Weekly/Monthly/Annual |
| Standpipe System | Class I, II, III | Quarterly/Annual/5-Year |
| Fire Extinguisher | All classifications | Monthly/Annual/6-Year/12-Year |
| Kitchen Hood Suppression | NFPA 17A system | Semi-Annual |
| Clean Agent System | NFPA 2001 system | Annual |
| Smoke Control System | NFPA 92 system | Semi-Annual/Annual |

### 8.5 Contact Types for Coperniq

| Contact Role | Responsibilities |
|--------------|-----------------|
| Building Owner | Property owner, contract signatory |
| Facility Manager | Day-to-day contact, scheduling |
| Fire Marshal (AHJ) | Plan review, inspections, approvals |
| Property Manager | Multi-tenant coordination |
| Insurance Representative | Risk assessment, requirements |
| General Contractor | New construction coordination |

---

## Sources

### NFPA Standards and ITM
- [Understanding NFPA 25 - National Fire Sprinkler Association](https://nfsa.org/2025/02/20/understanding-nfpa-25/)
- [NFPA 25 Inspections, Testing, and Maintenance Checklist - USAFP](https://www.usafireprotectioninc.com/inspections-testing-and-maintenance-checklist/)
- [NFPA 25 and Properly Maintaining a Sprinkler System](https://www.nfpa.org/news-blogs-and-articles/blogs/2024/08/26/nfpa-25-and-properly-maintaining-a-sprinkler-system)
- [NFPA 25 Testing Requirements: Your Guide | Emergent](https://www.emergent.tech/blog/nfpa-25-testing-requirements)

### Fire Sprinkler Installation
- [Fire Sprinkler Systems in New Construction Projects - Fireline](https://www.fireline.com/fire-sprinkler-systems-in-new-construction-projects/)
- [Commercial Fire Sprinkler System Installation - FireProTech](https://fireprotechllc.com/blog/fire-sprinkler-system-installation/)
- [Changes in the 2025 Edition of NFPA 13 | TechNotes - NFSA](https://nfsa.org/2024/07/23/changes-in-the-2025-edition-of-nfpa-13-technotes/)

### Fire Alarm Systems
- [NFPA 72 Fire Alarm Requirements - DRC](https://www.drcgc.com/blog/nfpa-72-fire-alarm-requirements-what-you-need-to-know)
- [NFPA 72 Testing And Inspection Requirements - Fire Safety Alarms](https://firesafetyalarms.com/nfpa-72-testing-and-inspection-requirements-what-you-need-to-know/)

### Fire Extinguishers
- [NFPA 10: Fire Extinguisher Tests, Inspections & Maintenance](https://www.fireservicepro.com/Fire-Extinguishers/NFPA-10-portable-fire-extinguisher-tests-inspections.html)
- [Guide to Fire Extinguisher ITM | NFPA](https://www.nfpa.org/news-blogs-and-articles/blogs/2020/10/30/guide-to-fire-extinguisher-itm)

### Fire Pump and Standpipe
- [Fire Pump Flow Test: NFPA 25 Requirements - QRFS](https://blog.qrfs.com/245-the-fire-pump-flow-test-nfpa-25-requirements-for-fire-pump-tests-part-1/)
- [Understanding Standpipe Flow Testing | NFSA](https://nfsa.org/2022/10/13/standpipe-flow-testing/)
- [Overview of NFPA 14 - Koorsen](https://blog.koorsen.com/overview-of-nfpa-14-installation-of-standpipe-and-hose-systems)

### Suppression Systems
- [NFPA 2001 Guidelines for Clean Agent Systems](https://kordfire.com/nfpa-2001-guidelines-for-clean-agent-fire-suppression-systems/)
- [Installing a Wet Chemical System Under NFPA 17A](https://donerighthfs.com/nfpa-17a/)
- [UL 300 Kitchen Fire Suppression Requirements - Koorsen](https://blog.koorsen.com/understanding-the-ul-300-kitchen-fire-suppression-system-requirements-in-the-nfpa-17-a)

### 5-Year Inspections
- [Understanding the 5-Year Internal Fire Sprinkler Inspection - Legion Fire Protection](https://legionfireprotection.com/understanding-the-5-year-internal-fire-sprinkler-inspection-nfpa-25/)
- [Internal Assessments & Fire Sprinkler Obstructions | NFPA 25 - NFSA](https://nfsa.org/2025/03/21/internal-assessments-fire-sprinkler-obstructions-nfpa-25/)

### Smoke Control
- [NFPA 92 Defines Design, Testing of Smoke Control Systems - CSE](https://www.csemag.com/articles/nfpa-92-defines-design-testing-of-smoke-control-systems/)
- [Annual Testing Requirements for Smoke Control Systems - Sparc](https://sparcfp.com/annual-testing-requirements-smoke-control-systems/)

### Sprinkler System Types
- [Wet Pipe vs. Dry Pipe vs. Pre-Action vs. Deluge - Nexus Fire](https://nexus-fire.com/wet-pipe-systems-vs-dry-pipe-systems-vs-pre-action-systems-vs-deluge-systems-a-comprehensive-comparison-of-fire-protection-solutions/)
- [Understanding Different Types of Fire Sprinkler Systems - DFS Pumps](https://dfspumps.com/different-fire-sprinkler-system/)

### Business & Recurring Revenue
- [How Building Owners Benefit from PMA and ITM Programs - JF Ahern](https://www.jfahern.com/blog/2022/02/10/how-building-owners-can-benefit-pma-and-itm-programs)
- [ServiceTrade Data Highlights Fire Protection Shifts](https://internationalfireandsafetyjournal.com/servicetrade-fire-protection/)
- [Life Safety Inspection Software - QRFS](https://blog.qrfs.com/262-life-safety-fire-sprinkler-inspection-software-repairs-the-process-for-correcting-deficiencies/)

---

*Document prepared for Coperniq workflow template configuration. For additional technical questions, refer to the latest editions of referenced NFPA standards.*
