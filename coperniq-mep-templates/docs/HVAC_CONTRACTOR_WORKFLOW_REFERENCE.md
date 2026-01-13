# HVAC/Mechanical Contractor Workflow Reference

**Version**: 1.0
**Updated**: 2025-01-13
**Purpose**: Expert-level reference for Coperniq workflow configuration
**Compiled By**: AI Development Cockpit Research Team

---

## Table of Contents

1. [HVAC Project Types](#1-hvac-project-types)
2. [Equipment Categories](#2-equipment-categories)
3. [Project Phases - By Project Type](#3-project-phases---by-project-type)
4. [Compliance Requirements](#4-compliance-requirements)
5. [Service/Maintenance Model](#5-servicemaintenance-model)
6. [Key Business Metrics](#6-key-business-metrics)
7. [Coperniq Workflow Mapping](#7-coperniq-workflow-mapping)

---

## 1. HVAC Project Types

### 1.1 Residential Replacement

**Description**: Most common project type - replacing existing HVAC systems in occupied homes.

| Aspect | Details |
|--------|---------|
| Typical Timeline | 1-3 days |
| Average Ticket | $5,000 - $12,500 |
| Permit Required | Varies by jurisdiction |
| Common Equipment | Split systems, heat pumps, mini-splits |

**Sub-categories**:
- **Split Systems**: AC condenser + furnace/air handler (most common)
- **Package Units**: All-in-one rooftop or ground-level
- **Mini-Splits**: Ductless, single or multi-zone
- **Heat Pumps**: Air-source or ground-source

### 1.2 Residential New Construction

**Description**: Installing HVAC in new home builds, coordinated with general contractor.

| Aspect | Details |
|--------|---------|
| Typical Timeline | 2-4 weeks (phased with construction) |
| Average Ticket | $8,000 - $20,000+ |
| Permit Required | Yes (part of building permit) |
| Design Required | Manual J, S, D calculations |

**Key Phases**:
1. Rough-in (ductwork, piping, wiring)
2. Final installation (equipment, registers)
3. Commissioning and testing

### 1.3 Light Commercial (Under 25 tons)

**Description**: Small commercial buildings - offices, retail, restaurants.

| Aspect | Details |
|--------|---------|
| Typical Timeline | 1-2 weeks |
| Average Ticket | $15,000 - $75,000 |
| Permit Required | Yes |
| Common Equipment | RTUs, split systems, VRF |

**Common Applications**:
- Strip malls
- Small offices (under 10,000 sq ft)
- Restaurants
- Medical/dental offices
- Small warehouses

### 1.4 Commercial Design-Build

**Description**: Engineer and install complete HVAC systems for medium/large commercial.

| Aspect | Details |
|--------|---------|
| Typical Timeline | 3-12 months |
| Average Ticket | $100,000 - $1,000,000+ |
| Permit Required | Yes (multiple) |
| Design Required | PE-stamped drawings |

**Scope Includes**:
- Load calculations
- Equipment selection
- Ductwork design
- Controls and BMS integration
- Commissioning

### 1.5 Industrial HVAC

**Description**: Manufacturing, warehouses, process cooling applications.

| Aspect | Details |
|--------|---------|
| Typical Timeline | 6-18 months |
| Average Ticket | $500,000 - $5,000,000+ |
| Permit Required | Yes (multiple agencies) |
| Common Equipment | Chillers, boilers, air handlers |

**Special Considerations**:
- Process cooling requirements
- Ventilation for hazardous materials
- High air change rates
- 24/7 operation requirements

### 1.6 Cleanroom/Critical Environments

**Description**: Pharmaceutical, semiconductor, healthcare - ultra-precise climate control.

| Aspect | Details |
|--------|---------|
| Typical Timeline | 12-24 months |
| Average Ticket | $1,000,000 - $10,000,000+ |
| Permit Required | Yes + regulatory approval |
| Standards | ISO 14644, GMP, FDA |

**Classification Requirements**:

| Grade | ISO Class | Air Changes/Hour | Use Case |
|-------|-----------|------------------|----------|
| A | ISO 5 | 300-600 | Aseptic filling |
| B | ISO 5-7 | 40-60 | Background for Grade A |
| C | ISO 7-8 | 20-40 | Less critical steps |
| D | ISO 8 | 10-20 | Early processing |

**Critical Parameters**:
- Temperature: 18-24°C (64-75°F)
- Humidity: 30-50% RH
- Pressure differential: 0.05" w.g. minimum
- HEPA/ULPA filtration required

---

## 2. Equipment Categories

### 2.1 Split Systems (AC + Furnace)

**Description**: Separate indoor and outdoor units connected by refrigerant lines.

| Component | Location | Function |
|-----------|----------|----------|
| Condenser | Outdoor | Heat rejection |
| Evaporator Coil | Indoor (on furnace) | Heat absorption |
| Furnace | Indoor | Heating + air handler |
| Refrigerant Lines | Between units | Heat transfer medium |

**Sizing Range**: 1.5 - 5 tons (residential), up to 20 tons (commercial splits)

**Refrigerant Transition (2025)**:
- Legacy: R-410A (being phased out for new equipment)
- New: R-454B (Puron Advance) - A2L classification
- R-410A available for service through 2040s

### 2.2 Heat Pumps

#### Air-Source Heat Pumps (ASHP)

| Aspect | Details |
|--------|---------|
| Efficiency | COP 2.5-4.0 |
| Min Outdoor Temp | -10°F to -25°F (cold climate models) |
| Typical Cost | $4,000 - $8,000 (equipment only) |
| Best For | Moderate climates, efficiency priority |

#### Ground-Source/Geothermal Heat Pumps (GSHP)

| Loop Type | Depth/Area | Best For |
|-----------|------------|----------|
| Horizontal | 4-6 ft deep, 400+ sq ft | Large lots |
| Vertical | 100-400 ft deep | Limited land |
| Pond/Lake | 8+ ft underwater | Property with water |

| Aspect | Details |
|--------|---------|
| Efficiency | COP 3.0-6.0 |
| Lifespan | 25+ years (indoor), 50+ years (loop) |
| Typical Cost | $15,000 - $35,000 (includes drilling) |
| Best For | Long-term investment, extreme climates |

### 2.3 Ductless Mini-Splits

**Configuration Options**:
- Single-zone: 1 outdoor + 1 indoor
- Multi-zone: 1 outdoor + 2-8 indoor units

| Aspect | Details |
|--------|---------|
| Efficiency | SEER2 up to 42 |
| Installation Time | 1-2 days |
| Typical Cost | $3,000 - $15,000 |
| Best For | Additions, retrofits, zoning |

**Indoor Unit Types**:
- Wall-mounted (most common)
- Ceiling cassette
- Floor console
- Slim ducted

### 2.4 Package Units / Rooftop Units (RTUs)

**Description**: All components in single cabinet, typically roof-mounted.

| Aspect | Details |
|--------|---------|
| Capacity Range | 3 - 150+ tons |
| Installation | Crane/helicopter required for large units |
| Configuration | Cooling only, heat pump, or gas/electric |
| Best For | Commercial buildings with flat roofs |

**Installation Considerations**:
- Structural roof assessment
- Curb adapter requirements
- Ductwork penetrations
- Electrical capacity

### 2.5 VRF/VRV Systems

**Description**: Variable Refrigerant Flow - highly zoned commercial systems.

| Aspect | Details |
|--------|---------|
| Capacity Range | 6 - 72+ tons |
| Zones | Up to 64 indoor units per system |
| Energy Savings | 30-40% vs conventional |
| Best For | Multi-zone buildings, retrofits |

**System Types**:
- **Heat Recovery**: Simultaneous heating and cooling
- **Heat Pump**: All zones same mode

**Installation Phases**:
1. Site Preparation (4-6 hours)
2. Unit Installation (6-8 hours, 1-2 days)
3. Piping and Electrical (varies by scope)
4. Testing and Commissioning

### 2.6 Chillers and Boilers

#### Chiller Types

| Type | Capacity | Best For |
|------|----------|----------|
| Scroll | 15-200 tons | Small commercial |
| Screw | 70-500 tons | Medium commercial |
| Centrifugal | 200-2,000+ tons | Large commercial/industrial |
| Absorption | 100-1,500 tons | Waste heat applications |

#### Boiler Types

| Type | Efficiency | Best For |
|------|------------|----------|
| Firetube | 80-85% | Steam, large buildings |
| Watertube | 85-90% | High-pressure steam |
| Condensing | 90-98% | Hot water, high efficiency |

### 2.7 Air Handlers and Fan Coils

| Component | Description | Typical Size |
|-----------|-------------|--------------|
| Air Handler Unit (AHU) | Blower + coil + filter | 1,000 - 100,000+ CFM |
| Fan Coil Unit (FCU) | Compact, zone-level | 200 - 2,000 CFM |
| Terminal Units (VAV) | Variable volume boxes | 50 - 3,000 CFM |

---

## 3. Project Phases - By Project Type

### 3.1 Residential Replacement - Standard Workflow

```
PHASE 1: SALES/ASSESSMENT
├── Lead/Inquiry (inbound or outbound)
├── Qualification call
└── Schedule site survey

PHASE 2: DESIGN/ESTIMATION
├── Site survey (1-2 hours)
│   ├── Measure existing equipment
│   ├── Assess ductwork condition
│   ├── Check electrical capacity
│   └── Take photos
├── Manual J load calculation (if required)
├── Equipment selection (Manual S)
└── Generate proposal/estimate

PHASE 3: SALES CLOSE
├── Present options (Good/Better/Best)
├── Explain financing options
├── Contract signing
└── Collect deposit

PHASE 4: PRE-INSTALLATION
├── Permit application (if required)
├── Equipment ordering
├── Schedule installation
└── Customer confirmation call

PHASE 5: INSTALLATION
├── Demo existing equipment
├── Install new equipment
│   ├── Set outdoor unit
│   ├── Install indoor unit/coil
│   ├── Connect refrigerant lines
│   ├── Connect electrical
│   └── Connect ductwork
└── Duration: 4-8 hours (typical)

PHASE 6: COMMISSIONING
├── System startup
├── Refrigerant charge verification
├── Airflow balancing
├── Thermostat programming
└── Performance testing

PHASE 7: CLOSEOUT
├── Customer walkthrough/training
├── Equipment registration
├── Collect final payment
├── Request review/referral
├── Inspection (if required)
└── Offer service agreement
```

### 3.2 Commercial Design-Build Workflow

```
PHASE 1: BUSINESS DEVELOPMENT
├── RFP/RFQ response
├── Site walk/assessment
├── Preliminary design
└── Proposal submission

PHASE 2: PRE-CONSTRUCTION
├── Contract negotiation
├── Engineering design
│   ├── Load calculations
│   ├── Equipment selection
│   ├── Ductwork design (Manual D)
│   ├── Controls design
│   └── PE stamp/review
├── Permit drawings
├── Permit application
└── Equipment procurement

PHASE 3: ROUGH-IN
├── Ductwork installation
├── Piping installation
├── Refrigerant lines
├── Electrical rough-in
└── Coordination with other trades

PHASE 4: EQUIPMENT INSTALLATION
├── Equipment delivery
├── Rigging/setting (crane if needed)
├── Mechanical connections
├── Electrical connections
└── Controls wiring

PHASE 5: TESTING & BALANCING
├── System startup
├── Performance testing
├── Air/water balancing
├── Controls checkout
└── Punch list items

PHASE 6: COMMISSIONING
├── Functional performance testing
├── Building automation integration
├── Training (building staff)
├── Documentation package
└── Final inspection

PHASE 7: WARRANTY/SERVICE
├── 1-year warranty period
├── Seasonal check-ins
└── Service agreement transition
```

### 3.3 Service Call Workflow

```
PHASE 1: DISPATCH
├── Customer call received
├── Call booking (qualification)
├── Dispatch assignment
└── En route notification

PHASE 2: DIAGNOSIS
├── Arrival/check-in
├── Customer interview
├── System inspection
├── Diagnostic testing
└── Problem identification

PHASE 3: REPAIR DECISION
├── Present findings
├── Provide repair options
├── Get customer approval
└── Parts availability check

PHASE 4: REPAIR EXECUTION
├── Perform repair
├── Test system operation
├── Clean work area
└── Customer demonstration

PHASE 5: CLOSEOUT
├── Invoice generation
├── Payment collection
├── Offer service agreement
├── Request review
└── Follow-up call (24-48 hrs)
```

---

## 4. Compliance Requirements

### 4.1 EPA Section 608 Certification

**Requirement**: Mandatory for anyone handling refrigerants.

| Certification Type | Equipment Category | Charge Size |
|--------------------|-------------------|-------------|
| Type I | Small appliances | <5 lbs |
| Type II | High-pressure equipment | 5+ lbs |
| Type III | Low-pressure equipment | 5+ lbs |
| Universal | All categories | Any |

**Recordkeeping Requirements**:

| Document | Retention | Required For |
|----------|-----------|--------------|
| Proof of certification | Permanent | All technicians |
| Service invoices | 3 years | Appliances 50+ lbs |
| Leak inspection records | 3 years | Appliances 50+ lbs |
| Disposal records | 3 years | 5-50 lb appliances |

**Leak Rate Thresholds**:

| Equipment Type | Leak Rate Trigger | Repair Deadline |
|----------------|-------------------|-----------------|
| Comfort cooling | 10% | 30 days |
| Commercial refrigeration | 20% | 30 days |
| Industrial process | 30% | 30 days |

**Annual Reporting Trigger**: 125%+ of full charge leaked in calendar year.

### 4.2 AIM Act / Refrigerant Transition (2025)

**Timeline**:

| Date | Requirement |
|------|-------------|
| Jan 1, 2024 | 40% HFC production cut |
| Jan 1, 2025 | R-410A prohibited for NEW equipment manufacturing |
| Jan 1, 2026 | R-410A split systems must be installed |
| Jan 1, 2027 | VRF systems with R-410A must be installed |
| Jan 1, 2028 | R-410A package units must be installed |
| 2036 | 85% total HFC reduction |

**New Refrigerants**:

| Refrigerant | GWP | Classification | Notes |
|-------------|-----|----------------|-------|
| R-410A (legacy) | 2,088 | A1 (non-flammable) | Phase-out |
| R-454B (Puron Advance) | 466 | A2L (mildly flammable) | Primary replacement |
| R-32 | 675 | A2L | European preference |

**A2L Handling Requirements**:
- Specialized equipment and training
- Updated building codes
- Leak detection in certain applications
- Certified A2L cylinders

### 4.3 AHRI Equipment Certification

**Purpose**: Independent third-party verification of equipment performance.

**Directory Access**: [ahridirectory.org](https://ahridirectory.org)

**Key Certifications**:

| Product | Standard | Ratings Verified |
|---------|----------|------------------|
| Unitary AC/HP | AHRI 210/240 | SEER2, EER2, HSPF2 |
| Mini-splits | AHRI 210/240 | SEER2, EER2 |
| Chillers | AHRI 550/590 | kW/ton, IPLV |
| Boilers | AHRI 1500 | Thermal efficiency |

### 4.4 ACCA/ANSI Standards

**Manual J (Load Calculation)**:
- ANSI/ACCA Manual J - 8th Edition
- Required for proper equipment sizing
- Often required for permits
- Considers: orientation, insulation, windows, occupancy

**Manual S (Equipment Selection)**:
- Matches equipment to calculated loads
- Ensures proper sizing (not oversized)
- Selects for heating AND cooling loads

**Manual D (Duct Design)**:
- Proper duct sizing for airflow
- Static pressure calculations
- Register/grille sizing (Manual T)

### 4.5 DOE Efficiency Standards (SEER2)

**Effective**: January 1, 2023

**Regional Minimums (Split Systems)**:

| Region | AC SEER2 | HP SEER2 | HP HSPF2 |
|--------|----------|----------|----------|
| North | 13.4 | 14.3 | 7.5 |
| South | 14.3 | 14.3 | 7.5 |
| Southwest | 14.3* | 14.3 | 7.5 |

*Southwest requires 11.7 EER2 for AC

**Tax Credit Requirements** (30% up to $600):
- Split AC: SEER2 ≥17.0, EER2 ≥12.0
- Packaged: SEER2 ≥16.0, EER2 ≥11.5
- Must be ENERGY STAR certified

### 4.6 State/Local Licensing

**State License Types**:

| License Type | Description |
|--------------|-------------|
| Contractor | Business license to bid/pull permits |
| Master | Supervision authority |
| Journeyman | Independent work under master |
| Apprentice | Learning under supervision |

**Common State Requirements**:

| Requirement | Typical Threshold |
|-------------|-------------------|
| Experience | 2-6 years |
| Examination | Trade + business/law |
| Insurance | $100K liability, $25K property |
| Bond | $10K - $25K |

**Notable State Variations**:
- California: Most stringent, C-20 HVAC license
- Texas: $115 license fee, 1-year renewal
- Florida: $100K liability required
- Iowa: Licenses all levels including apprentices
- Kansas: No state license (local only)

---

## 5. Service/Maintenance Model

### 5.1 Seasonal PM Visits

**Spring (Pre-Cooling Season)**:

| Task | Time | Frequency |
|------|------|-----------|
| Replace/clean air filter | 5 min | Every visit |
| Clean condenser coil | 15-30 min | Annual |
| Check refrigerant levels | 10 min | Annual |
| Inspect electrical connections | 10 min | Annual |
| Test capacitors | 10 min | Annual |
| Clear condensate drain | 5 min | Annual |
| Verify thermostat operation | 5 min | Every visit |
| Measure airflow/temperature | 10 min | Annual |

**Fall (Pre-Heating Season)**:

| Task | Time | Frequency |
|------|------|-----------|
| Inspect heat exchanger | 15-20 min | Annual |
| Check burners/clean | 15 min | Annual |
| Test ignition system | 10 min | Annual |
| Inspect flue/vent pipes | 10 min | Annual |
| Test safety controls | 10 min | Annual |
| Check gas connections | 10 min | Annual |
| Verify CO detector operation | 5 min | Annual |
| Test emergency shutoff | 5 min | Annual |

### 5.2 Service Agreement Tiers

**Bronze Tier** ($15-25/month):
- 2 PM visits per year (spring + fall)
- 2 filter changes
- 10% parts discount
- Priority scheduling
- Diagnostic discount ($50-80)
- No overtime charges

**Silver Tier** ($25-40/month):
- Everything in Bronze +
- 15% parts discount
- Same-day service (when available)
- No diagnostic fee
- Annual duct inspection
- Thermostat battery replacement

**Gold Tier** ($40-60/month):
- Everything in Silver +
- 20% parts discount
- Parts warranty extension
- 24/7 emergency service
- Annual indoor air quality check
- Filter auto-ship program
- No trip charges

**Platinum/VIP Tier** ($60-100/month):
- Everything in Gold +
- Includes select repairs/parts
- Guaranteed response time (2-4 hours)
- Equipment replacement credits
- Annual system efficiency report
- Transferable to new owner

### 5.3 Emergency Service

**Pricing Models**:

| Time Period | Premium |
|-------------|---------|
| After-hours (6 PM - 8 AM) | 1.5x |
| Weekends | 1.5x - 2x |
| Holidays | 2x - 3x |
| Service agreement customers | No premium |

**Response Time Targets**:
- Service agreement: 2-4 hours
- Non-agreement: Same day
- Emergency (no heat in winter): 2-6 hours

### 5.4 Refrigerant Tracking (EPA Compliance)

**Required Records for 50+ lb Systems**:

| Field | Required |
|-------|----------|
| Service date | Yes |
| Technician name/cert # | Yes |
| Refrigerant type | Yes |
| Amount added | Yes |
| Amount recovered | Yes |
| Leak location (if applicable) | Yes |
| Repair verification | Yes |

**Coperniq Form Fields**:
```
refrigerant_type: [R-22, R-410A, R-454B, R-32, Other]
amount_lbs: decimal
action: [Added, Recovered, Evacuated]
system_charge_lbs: decimal
leak_rate_percent: calculated
cylinder_tracking_id: string
technician_epa_cert: string
```

---

## 6. Key Business Metrics

### 6.1 Financial Metrics

| Metric | Benchmark | Top Performers |
|--------|-----------|----------------|
| Gross Profit Margin | 40-60% | 60%+ |
| Net Profit Margin | 5-12% | 15-25% |
| Revenue per Tech | $150K-250K | $300K+ |
| Revenue per Service Call | $250-400 | $500+ |

### 6.2 Sales Metrics

| Metric | Benchmark | Top Performers |
|--------|-----------|----------------|
| Call Booking Rate | 60-70% | 80%+ |
| Appointment Show Rate | 90% | 95%+ |
| Close Rate (Replacement) | 25-35% | 45%+ |
| Close Rate (Service Agreement) | 25% | 40%+ |
| Average Ticket (Service) | $250-400 | $500+ |
| Average Ticket (Replacement) | $8,000-12,000 | $15,000+ |

### 6.3 Operational Metrics

| Metric | Benchmark | Top Performers |
|--------|-----------|----------------|
| First-Time Fix Rate | 75-85% | 90%+ |
| Callback Rate | 5-10% | <3% |
| Average Jobs per Tech/Day | 3-4 | 5-6 |
| Technician Utilization | 70-80% | 85%+ |
| Response Time (Emergency) | 4-8 hours | <2 hours |

### 6.4 Service Agreement Metrics

| Metric | Benchmark | Top Performers |
|--------|-----------|----------------|
| Agreement Attachment Rate | 25% | 50%+ |
| Agreement Retention Rate | 70-80% | 90%+ |
| Agreements per $1M Revenue | 250 | 1,000+ |
| Revenue from Agreements | 39-55% | 60%+ |
| Customer Lifetime Value | $2,000-5,000 | $10,000+ |

### 6.5 Cost Metrics

| Metric | Benchmark |
|--------|-----------|
| Cost per Lead | $50-150 |
| Cost per Qualified Lead | $150-250 |
| Cost per Customer Acquisition | $250-350 |
| Marketing as % of Revenue | 5-10% |
| Labor as % of Revenue | 25-35% |

---

## 7. Coperniq Workflow Mapping

### 7.1 Entity Mapping

| HVAC Concept | Coperniq Entity | Key Fields |
|--------------|-----------------|------------|
| Customer | Contact | name, phone, email, address |
| Job Site | Site | address, property_type, sqft |
| Equipment | Asset | model, serial, install_date, refrigerant |
| Work Order | Task | type, status, scheduled_date, tech |
| Service Agreement | ServicePlanInstance | tier, start_date, renewal_date |
| Invoice | FinancialDocument | amount, status, due_date |

### 7.2 Task Types for HVAC

```yaml
hvac_task_types:
  installation:
    - residential_replacement
    - new_construction_rough_in
    - new_construction_final
    - commercial_installation
    - ductwork_installation

  service:
    - diagnostic
    - repair
    - emergency_call
    - callback

  maintenance:
    - pm_spring_cooling
    - pm_fall_heating
    - filter_change
    - duct_cleaning

  inspection:
    - permit_inspection
    - commissioning
    - warranty_inspection
    - code_compliance

  sales:
    - site_survey
    - load_calculation
    - estimate_delivery
    - contract_signing
```

### 7.3 Status Flow - Residential Replacement

```yaml
project_statuses:
  - lead
  - qualified
  - survey_scheduled
  - survey_complete
  - proposal_sent
  - contract_signed
  - permit_pending
  - equipment_ordered
  - scheduled
  - in_progress
  - install_complete
  - commissioning
  - inspection_scheduled
  - inspection_passed
  - closed_won
  - closed_lost
```

### 7.4 Required Form Templates

| Form Name | Use Case | Key Fields |
|-----------|----------|------------|
| Site Survey | Pre-sale assessment | existing_equipment, measurements, photos |
| Load Calculation | Manual J data | sqft, insulation, windows, orientation |
| Installation Checklist | Quality control | equipment_set, connections, startup |
| Commissioning Report | System verification | temps, pressures, airflow, refrigerant |
| PM Checklist | Seasonal maintenance | filter, coil, electrical, refrigerant |
| Refrigerant Log | EPA compliance | type, amount, action, serial |
| Service Call Report | Repair documentation | diagnosis, repair, parts, time |

### 7.5 Automation Triggers

```yaml
automations:
  lead_created:
    - send_confirmation_email
    - assign_to_sales_rep
    - create_follow_up_task

  survey_complete:
    - generate_proposal
    - schedule_follow_up_call

  contract_signed:
    - create_permit_task
    - create_equipment_order_task
    - schedule_installation
    - send_welcome_packet

  installation_complete:
    - create_commissioning_task
    - schedule_customer_training
    - offer_service_agreement

  pm_due:
    - send_reminder_email
    - create_pm_task
    - assign_to_tech

  service_agreement_expiring:
    - send_renewal_notice_30_days
    - send_renewal_notice_7_days
    - create_renewal_task
```

---

## Sources

### Project Phases & Workflow
- [ServiceTitan - Residential Construction Management](https://www.servicetitan.com/blog/residential-construction-management)
- [ServiceTitan - HVAC Project Management Template](https://www.servicetitan.com/templates/hvac/project-management)
- [ACHR News - 2026 HVAC Market Outlook](https://www.achrnews.com/articles/165674-signs-of-a-turnaround-what-2026-holds-for-the-hvac-construction-market)

### Business Metrics
- [Lokal HQ - 10 HVAC KPIs to Track in 2025](https://lokalhq.com/blog/hvac-key-performance-indicators/)
- [Mar-Hy Distributors - Key Financial Metrics 2025](https://www.marhy.com/key-financial-metrics-for-hvac-success-in-2025/)
- [FieldEdge - HVAC Service Agreement Programs](https://fieldedge.com/blog/hvac-service-agreement-programs/)

### Compliance & Regulations
- [EPA Section 608 Certification Requirements](https://www.epa.gov/section608/section-608-technician-certification-requirements)
- [EPA Recordkeeping for Stationary Refrigeration](https://www.epa.gov/section608/recordkeeping-and-reporting-requirements-stationary-refrigeration)
- [AHRI Certification Directory](https://ahridirectory.org/)
- [ACCA Manual J Standards](https://www.acca.org/standards/technical-manuals/manual-j)
- [ACIQ - 2025 EPA Refrigerant Guide](https://aciq.com/aciq-dealer-program/2025-epa-refrigerant-phase-out/)
- [DOE SEER2/EER2 Requirements](https://www.iccsafe.org/products-and-services/i-codes/doe-seer2-eer2/)

### Equipment & Installation
- [GREE Comfort - VRF Systems Guide](https://www.greecomfort.com/news-and-events/vrf-hvac-systems/)
- [VERTEX Engineering - VRF Installation](https://vertexeng.com/insights/variable-refrigerant-flow-vrf-installation-and-commissioning/)
- [Department of Energy - Geothermal Heat Pumps](https://www.energy.gov/energysaver/geothermal-heat-pumps)
- [Trane - Rooftop Units](https://www.trane.com/commercial/north-america/us/en/products-systems/packaged-units-and-split-systems/rooftop-units.html)

### Cleanroom/Critical Environments
- [ISPE - Pharmaceutical Cleanroom Design](https://ispe.org/pharmaceutical-engineering/september-october-2021/pharmaceutical-cleanroom-design-iso-14644-16)
- [GMP Insiders - Cleanroom Classifications](https://gmpinsiders.com/gmp-cleanroom-classifications/)

### Maintenance
- [Energy Star - Maintenance Checklist](https://www.energystar.gov/saveathome/heating-cooling/maintenance-checklist)
- [ServiceTitan - HVAC Maintenance Checklist](https://www.servicetitan.com/templates/hvac/maintenance-checklist)
- [FieldPulse - HVAC Maintenance Contracts](https://www.fieldpulse.com/resources/blog/hvac-maintenance-contracts)

### Licensing
- [ServiceTitan - HVAC Licenses by State](https://www.servicetitan.com/licensing/hvac)
- [Harbor Compliance - Mechanical Contractor License](https://www.harborcompliance.com/mechanical-contractor-license)

---

*Document generated for Coperniq MEP Templates project. For internal use.*
