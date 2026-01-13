# Solar/Energy Contractor Workflow Reference
## Comprehensive Guide for Coperniq Configuration

**Version**: 1.0
**Updated**: 2026-01-13
**Purpose**: Deep reference for solar EPC project workflows, phases, financing, tax credits, and integrations

---

## Table of Contents

1. [Residential Solar Project Types](#1-residential-solar-project-types)
2. [Commercial Solar Project Types](#2-commercial-solar-project-types)
3. [Utility-Scale Projects](#3-utility-scale-projects)
4. [Project Phases - Residential Solar](#4-project-phases---residential-solar)
5. [Project Phases - Commercial Solar](#5-project-phases---commercial-solar)
6. [Tax Credits & Incentive Tracking (2026)](#6-tax-credits--incentive-tracking-2026)
7. [Safe Harbor Documentation](#7-safe-harbor-documentation)
8. [O&M and Monitoring](#8-om-and-monitoring)
9. [Key Integrations](#9-key-integrations)
10. [Warranty & Performance Guarantees](#10-warranty--performance-guarantees)

---

## 1. Residential Solar Project Types

### 1.1 Cash Purchase
- **Description**: Customer pays full system cost upfront
- **Ownership**: Customer owns system immediately
- **Tax Credit**: Customer claims ITC directly (25D credit - expires after 2025)
- **Typical Timeline**: 4-8 weeks from contract to PTO
- **Coperniq Fields**: `financing_type: "cash"`, `ownership: "customer"`

### 1.2 Loan Financing

#### Major Loan Providers
| Provider | Typical APR | Terms | Key Features |
|----------|-------------|-------|--------------|
| **GoodLeap** | 5-9% | 7-25 years | #1 point-of-sale lender, AI-powered applications |
| **Sunlight Financial** | ~3.3% | 20+ years | Partner bank: Cross River Bank |
| **Mosaic** | Varies | 20+ years | Pioneer in solar lending, $10B+ funded |

**Loan Workflow**:
1. Pre-qualification (soft credit check)
2. Full application after contract signed
3. Loan approval
4. Documentation signing
5. Project completion milestone
6. Final funding release
7. Tax credit re-amortization (after ITC claimed)

**Coperniq Fields**:
- `financing_type: "loan"`
- `loan_provider: "GoodLeap" | "Sunlight" | "Mosaic" | "Other"`
- `loan_amount`, `loan_term_months`, `apr`
- `loan_status: "pre-qualified" | "approved" | "funded"`

### 1.3 Lease / PPA (Third-Party Ownership)

#### Solar Lease
- **Payment Structure**: Fixed monthly payment (e.g., $230/month)
- **Based On**: System's estimated annual production
- **Predictability**: Consistent year-round payments

#### Power Purchase Agreement (PPA)
- **Payment Structure**: Per kWh (e.g., $0.24/kWh)
- **Based On**: Actual electricity produced
- **Variability**: Higher summer payments, lower winter

**TPO Key Points**:
- Zero or low upfront cost
- Third party owns system and claims ITC
- 20-25 year contract term
- Escalator clauses (annual rate increases)
- End-of-term options: renew, purchase, remove
- Available in ~30 states

**Critical for 2026**: TPO remains eligible for ITC (48E) after residential 25D expires, making it increasingly important for installers.

**Coperniq Fields**:
- `financing_type: "lease" | "ppa"`
- `tpo_provider`
- `monthly_payment` OR `per_kwh_rate`
- `escalator_rate_annual`
- `contract_term_years`

### 1.4 Battery Add-On Projects

#### AC-Coupled Systems
- Connects to AC side of solar installation
- Retrofit-friendly for existing systems
- Works with most solar inverters
- Conversion: DC → AC → DC → AC (more conversion losses)
- **Best For**: Adding storage to existing installations

#### DC-Coupled Systems
- Connects directly to DC side before inverter
- More efficient (fewer conversions)
- Lower equipment cost (no separate inverter)
- **Best For**: New solar + storage installations

**Popular Battery Options**:

| Battery | Coupling | Capacity | Features |
|---------|----------|----------|----------|
| **Tesla Powerwall 3** | DC or AC | 13.5 kWh | Integrated inverter, 6 MPPTs, 20kW DC solar input |
| **Enphase IQ Battery 5P** | AC only | 5 kWh/unit | Modular, 4 microinverters, stackable |
| **Franklin WholePower** | AC | 13.6 kWh | Ground-mount option |

**Coperniq Fields**:
- `battery_included: true/false`
- `battery_model`
- `battery_capacity_kwh`
- `coupling_type: "ac" | "dc"`
- `battery_quantity`

### 1.5 Solar + Storage Combo
- New installation with both solar and battery
- Qualifies for single ITC on total system cost
- Typically DC-coupled for efficiency
- Common configurations: 8-12kW solar + 13.5-27kWh storage

---

## 2. Commercial Solar Project Types

### 2.1 Rooftop C&I (Commercial & Industrial)

**Characteristics**:
- Installed on commercial building rooftops
- Typical size: 50kW - 2MW
- Behind-the-meter consumption
- Often net metered

**Project Considerations**:
- Roof structural assessment critical
- HVAC, skylights, roof penetrations
- Fire code setbacks
- Electrical infrastructure capacity

**Timeline**: 3-12 months depending on complexity

### 2.2 Solar Carports

**Advantages**:
- Highly visible sustainability statement
- Dual function: parking + power
- No roof modification required
- EV charging integration potential

**Design Considerations**:
- Minimum 14ft deck height for trucks/delivery vehicles
- NEC Rapid Shutdown not required for ground-level carports
- Steel structure design
- Foundation requirements

**Cost Structure**:
- Most expensive racking type
- 30% ITC applies to entire structure + solar equipment
- Typical cost: $3-5/watt installed

**Coperniq Fields**:
- `project_type: "carport"`
- `deck_height_ft`
- `parking_spaces`
- `ev_charging_integrated: true/false`

### 2.3 Ground-Mount Commercial

**When to Use**:
- Insufficient roof space
- Poor roof condition
- Large available land
- Tracking system desired

**Types**:
- Fixed tilt (simplest, lowest cost)
- Single-axis tracking (10-25% more production)
- Dual-axis tracking (25-40% more, highest cost)

### 2.4 Community Solar

**Definition**: Solar project where benefits flow to multiple customers (individuals, businesses, nonprofits)

**Business Model**:
1. Developer builds centralized solar array
2. Subscribers purchase or subscribe to portion of output
3. Subscribers receive bill credits from utility
4. Typically 10-20% savings vs utility rate

**Billing Structure**:
- Subscriber receives utility bill + community solar bill
- Bill credit appears on utility statement
- Some states offer on-bill crediting (NY, IL)

**Subscriber Management Requirements**:
- Customer acquisition
- Meter data integration
- Billing and remittance
- Churn replacement
- Customer service

**Major Subscriber Management Platforms**:
- **Arcadia**: 2+ GW under management, $500M+ billing processed
- **Ampion**: Full-service acquisition, billing, customer care
- **Pivot Energy SunCentral**: White-label cloud-based solution

**Coperniq Fields**:
- `project_type: "community_solar"`
- `subscriber_management_platform`
- `total_subscribers`
- `available_capacity_kw`

### 2.5 Commercial PPA Structures

#### On-Site PPA
- System installed at customer's facility
- Customer buys power at fixed rate
- No capital investment required
- Third party owns, operates, maintains

#### Off-Site PPA (Virtual PPA)
- Power generated at remote location
- Financial arrangement, not physical delivery
- Popular for large corporates
- Renewable Energy Credits (RECs) transferred

**Market Trend**: 57% of non-residential capacity was TPO in 2017; rising in many states (95% in Colorado Q4 2017)

---

## 3. Utility-Scale Projects

### 3.1 Ground-Mount Solar Farms

**Scale**: 5MW to 500MW+

**Development Timeline**: 2-5 years
- Site selection & control: 3-6 months
- Environmental studies: 6-12 months
- Permitting: 6-18 months
- Interconnection queue: 12-36 months
- Construction: 6-18 months

**Key Phases**:
1. Site prospecting & land control
2. Resource assessment
3. Interconnection application
4. Environmental review (NEPA if federal land)
5. Permitting (local, state, federal)
6. Financing & tax equity
7. EPC procurement
8. Construction
9. Commissioning & testing
10. Commercial operation date (COD)

### 3.2 Battery Energy Storage Systems (BESS)

**Market Growth**: Expected 15x growth from 28 GW (2023) to 400+ GW (2030)

**Development Timeline**: 18-36 months

**Site Requirements**:
- 100 MW/400 MWh (4-hour): 2-5 acres
- Grid proximity critical
- Access to transmission infrastructure

**Configurations**:
- **AC-Coupled**: Independent from PV, connects via own inverter
- **DC-Coupled**: Direct from PV DC, more common for new builds

**NREL Cost Reference** (60 MW system):
| Duration | Projected Cost Reduction (2022-2035) |
|----------|--------------------------------------|
| 2-hour | 18% (Conservative) to 52% (Advanced) |
| 4-hour | 18% (Conservative) to 52% (Advanced) |
| 6-hour | Similar trajectory |

### 3.3 Solar + Storage Hybrid

**Benefits**:
- ITC applies to storage if charged 75%+ from solar
- Better interconnection queue position
- Grid services revenue (frequency regulation, capacity)
- Improved project economics

**Coperniq Fields for Utility-Scale**:
- `project_type: "utility_scale"`
- `nameplate_capacity_mw_ac`
- `nameplate_capacity_mw_dc`
- `storage_duration_hours`
- `interconnection_voltage_kv`
- `cod_target_date`

---

## 4. Project Phases - Residential Solar

### Phase 1: Lead Capture
**Duration**: Varies (ongoing)

**Lead Sources**:
- Online (website forms, lead aggregators)
- Referral programs
- Door-to-door canvassing
- Events & home shows
- Paid advertising (digital, radio, TV)

**Coperniq Fields**:
- `lead_source`
- `lead_capture_date`
- `lead_score`
- `assigned_sales_rep`

### Phase 2: Sales Appointment
**Duration**: 1-2 hours

**Types**:
- In-home consultation
- Virtual appointment (Zoom, Teams)
- Hybrid (virtual + site photos)

**Activities**:
- Review utility bills
- Discuss energy goals
- Present financing options
- Initial system sizing
- Qualify for incentives

### Phase 3: Site Survey
**Duration**: 1-3 hours on-site

**Assessment Items**:
- Roof condition (age, material, damage)
- Roof measurements
- Structural assessment
- Shading analysis (trees, chimneys)
- Electrical panel evaluation
- Main service entrance
- Meter location
- Conduit routing
- Attic access
- Ground-mount potential

**Coperniq Fields**:
- `site_survey_date`
- `site_survey_tech`
- `roof_age_years`
- `roof_type`
- `main_panel_amps`
- `panel_upgrade_required: true/false`

### Phase 4: Design
**Duration**: 1-5 days

**Design Software Options**:
| Software | Best For | Key Features |
|----------|----------|--------------|
| **Aurora Solar** | Residential | 3D modeling, AI shading, proposals |
| **OpenSolar** | Budget-conscious | Free, end-to-end, good for SMB |
| **HelioScope** | Commercial | 5-10x faster, detailed simulation |

**Design Deliverables**:
- Panel layout
- String configuration
- Production estimate (kWh/year)
- Shade analysis report
- Equipment list
- Financial analysis

### Phase 5: Proposal Presentation
**Duration**: 30-60 minutes

**Proposal Elements**:
- System specifications
- Production estimate
- Savings projection
- Financing comparison (cash, loan, lease, PPA)
- Incentive breakdown (ITC, SREC, rebates)
- ROI / payback period
- Warranty summary

### Phase 6: Contract Signing
**Duration**: 30-60 minutes

**Contract Components**:
- Scope of work
- Equipment specifications
- Payment schedule
- Timeline expectations
- Warranty terms
- Change order process
- Cancellation policy

**Coperniq Fields**:
- `contract_signed_date`
- `contract_value`
- `change_orders[]`

### Phase 7: Permit Application (AHJ)
**Duration**: 2-8 weeks (traditional) OR instant (SolarAPP+)

#### Traditional Permitting
- Building department review
- Compliance with NEC, IBC
- Fire safety regulations
- Zoning review

#### SolarAPP+ (Automated)
**What It Is**: Online portal by NREL for automated permit processing

**Benefits**:
- Reduces review from 20 business days to zero
- Cuts total project timeline by 31% (~14.5 days)
- Instant permits for compliant applications

**Requirements**:
- Contractor registration and training
- Compliant system design
- $25 project fee (first 3 revisions free)

**Coperniq Fields**:
- `permit_application_date`
- `permit_status: "submitted" | "in_review" | "approved" | "issued"`
- `permit_number`
- `solarapp_used: true/false`

### Phase 8: HOA Approval (if applicable)
**Duration**: 2-8 weeks

**Typical Requirements**:
- Detailed plans submission
- System specifications
- Visual mockups
- Installer credentials
- Insurance documentation

**Common Restrictions**:
- Flush-mounted panels required
- Color matching to roof
- Visibility from street limitations
- Ground-mount prohibitions

**Legal Protections**: ~30 states have solar access laws preventing HOA prohibition

**State Examples**:
- **California**: Solar Rights Act - HOA can request "reasonable" changes only
- **Colorado**: 60-day response requirement (auto-approve if missed)
- **Texas**: Cannot require changes that reduce production by 10%+

**Coperniq Fields**:
- `hoa_required: true/false`
- `hoa_submission_date`
- `hoa_status: "pending" | "approved" | "denied"`
- `hoa_approval_date`

### Phase 9: Utility Interconnection Application
**Duration**: 2-3 weeks for application; 1-2 weeks for PTO after install

**Process Steps**:
1. Submit interconnection application
2. Utility reviews system specs
3. Approval to construct
4. Install system
5. Pass inspection
6. Utility installs/replaces meter
7. Final PTO issued

**State Requirements Vary**:
| State | Notable Requirements |
|-------|---------------------|
| California (Rule 21) | PE-stamped diagrams >10kW, $1M liability insurance |
| Texas (ERCOT) | Minimal bureaucracy |
| New York | $2M insurance, PE-certified >12kW |
| Florida | 60-day processing cap |

**Critical Note**: Operating before PTO is illegal in all 50 states - fines up to $15,000

**Coperniq Fields**:
- `interconnection_application_date`
- `interconnection_status`
- `utility_company`
- `meter_number`
- `pto_date`

### Phase 10: Equipment Ordering
**Duration**: 1-4 weeks (varies with supply chain)

**Equipment List**:
- Solar panels
- Inverter(s) or microinverters
- Optimizers (if SolarEdge)
- Racking/mounting hardware
- Electrical components (disconnects, breakers)
- Conduit and wiring
- Monitoring equipment
- Battery (if included)

### Phase 11: Installation Scheduling
**Duration**: Coordinate 1-2 weeks ahead

**Dependencies**:
- Permit issued
- Equipment received
- Crew availability
- Customer availability
- Weather forecast

### Phase 12: Installation
**Duration**: 1-3 days (residential)

**Day 1 (Typical)**:
- Safety setup
- Roof prep
- Racking installation
- Panel mounting

**Day 2**:
- Electrical work
- Inverter installation
- Wiring and connections
- Battery installation (if applicable)

**Day 3** (if needed):
- Finish electrical
- System testing
- Site cleanup
- Customer walkthrough

### Phase 13: Inspection
**Duration**: 1-5 business days to schedule; 1-2 hours on-site

**Inspection Types**:
- **AHJ Building Inspection**: Code compliance
- **Utility Inspection**: Grid connection safety

**Common Inspection Items**:
- Electrical connections
- Grounding
- Racking attachment
- Fire setbacks
- Labeling requirements
- Rapid shutdown compliance

**Coperniq Fields**:
- `inspection_scheduled_date`
- `inspection_status: "scheduled" | "passed" | "failed"`
- `inspection_notes`
- `reinspection_required: true/false`

### Phase 14: PTO (Permission to Operate)
**Duration**: 1-2 weeks after passing inspection

**What PTO Means**:
- Official utility approval
- System can be energized
- Net metering begins
- Meter may be upgraded to bi-directional

**Median Timeline Study**: 53 business days from application to PTO (30,000+ systems analyzed)

**Coperniq Fields**:
- `pto_application_date`
- `pto_received_date`
- `pto_number`
- `system_energized_date`

### Phase 15: System Monitoring Activation
**Duration**: Same day as PTO

**Setup Steps**:
- Create monitoring account
- Connect system to internet
- Verify data transmission
- Configure alerts
- Customer app setup

### Phase 16: O&M Handoff
**Duration**: 30-60 minute walkthrough

**Handoff Items**:
- Owner's manual
- Warranty documentation
- Monitoring app training
- Maintenance guidelines
- Support contact information
- Emergency procedures

---

## 5. Project Phases - Commercial Solar

### Timeline Overview
- **Planning & Execution**: 12-24 months
- **Total Lifecycle**: Planning → O&M → Decommissioning

### Phase 1: Analysis & Financing
- Site suitability assessment
- Load analysis
- Preliminary design
- Financial modeling
- Financing arrangement (PPA, loan, lease, cash)
- Incentive analysis

### Phase 2: Design & Supply Chain
- Detailed engineering
- Structural analysis
- Equipment specification
- Procurement
- Materials delivery coordination

### Phase 3: Construction & Permitting
- Permit applications
- AHJ coordination
- Site preparation
- Installation
- Interconnection

### Phase 4: Operations & Maintenance
- Performance monitoring
- Preventive maintenance
- Asset management
- Reporting

**Best Practice**: "Over-communication" - keep close contact with project team, track changes, create schedules with buffer

---

## 6. Tax Credits & Incentive Tracking (2026)

### 6.1 Investment Tax Credit (ITC) - Base Credit

| Project Type | 2025 | 2026 | Notes |
|--------------|------|------|-------|
| Residential (25D) | 30% | **EXPIRED** | Must be placed in service by 12/31/2025 |
| Commercial (48E) | 30% | 30% | Begin construction by 7/4/2026 |
| TPO/Lease | 30% | 30% | Continues under 48E |

**Critical 2026 Residential Impact**:
- 18% projected decline in residential installations
- TPO (lease/PPA) becomes more attractive
- Systems must be installed AND operational by 12/31/2025

### 6.2 ITC Bonus Adders

| Adder | Amount | Requirements |
|-------|--------|--------------|
| **Domestic Content** | +10% | Steel/iron/manufactured products from US |
| **Energy Community** | +10% | Located in qualifying area |
| **Low-Income Community** | +10% | Located in LIC census tract |
| **Low-Income Residential** | +20% | Qualified LI residential building |
| **Low-Income Economic Benefit** | +20% | 50%+ benefits to LI households |

**Maximum Stacking**: Base 30% + 10% domestic + 10% energy community + 20% LI = **70% ITC**

### 6.3 Domestic Content Requirements

**Thresholds by Year**:
| Construction Start | Domestic Content % Required |
|--------------------|----------------------------|
| Before 2025 | 40% |
| 2025 | 45% |
| 2026 | 50% |
| 2027+ | 55% |

**What Qualifies**:
- Steel and iron: 100% US-manufactured
- Manufactured products: Varies by component

**FEOC Restrictions (2026+)**:
- Cannot have components from restricted countries
- Separate from domestic content requirements
- May fail FEOC even with domestic content qualification

### 6.4 Energy Community Categories

1. **Brownfield Sites**: Former contaminated property
2. **Statistical Area**: Based on unemployment rate (updated annually in May)
3. **Coal Closure**: Communities with closed coal mines/plants

IRS publishes qualifying area lists annually.

### 6.5 Low-Income Communities Bonus Credit Program

**Capacity Allocation**: 1.8 GW annual capacity divided across categories

**Four Categories**:

| Category | Description | Bonus |
|----------|-------------|-------|
| 1 | Located in low-income community census tract | +10% |
| 2 | Located on Indian Land | +10% |
| 3 | Qualified low-income residential building | +20% |
| 4 | Qualified low-income economic benefit project | +20% |

**Eligibility**:
- Maximum 5 MW output
- Must apply for capacity allocation
- Placed in service within 4 years of allocation

**Coperniq Fields**:
- `itc_base_rate`
- `domestic_content_qualified: true/false`
- `energy_community_qualified: true/false`
- `lic_category: 1 | 2 | 3 | 4 | null`
- `total_itc_rate`
- `itc_value_estimated`

---

## 7. Safe Harbor Documentation

### 7.1 Safe Harbor Methods

**Two Methods to Establish Beginning of Construction**:

1. **Physical Work Test**: Actual construction activity
2. **5% Safe Harbor**: 5% of total project cost incurred

**CRITICAL UPDATE (IRS Notice 2025-42)**:
- 5% safe harbor **ELIMINATED** for projects >1.5 MW AC
- Small solar (≤1.5 MW AC) can still use 5% test
- Physical work test now required for larger projects

### 7.2 Physical Work Test Qualifications

**Acceptable Activities**:
- Foundation installation
- Trenching
- Rack mounting on-site
- Off-site manufacturing of custom components (under binding contract)

**NOT Acceptable**:
- Permitting
- Site prep/clearing
- Engineering
- Inventory purchases

**Off-Site Work Requirements**:
- Must be custom (not from inventory)
- Must have binding written contract
- Master contracts can be assigned to affiliates

### 7.3 Key Deadlines

| Date | Significance |
|------|-------------|
| 9/2/2025 | Last date to use 5% safe harbor (for larger projects) |
| 12/31/2025 | Last day before FEOC rules apply |
| 7/4/2026 | Last day to begin construction for ITC eligibility |
| 12/31/2027 | Final placed-in-service deadline |

### 7.4 Continuity Requirement

**4-Year Safe Harbor**: Project placed in service within 4 calendar years of construction start

**Excusable Disruptions**:
- Severe weather / natural disasters
- Permitting delays
- Government requests
- Interconnection delays
- Labor stoppages
- Supply shortages
- Financing delays

### 7.5 Documentation Requirements

**For 5% Test (Small Projects ≤1.5 MW)**:
- Traceable to project-specific components/services
- Pre-existing written contract
- Economic performance occurred (title transfer)
- Detailed expenditure records

**For Physical Work Test**:
- Start real construction by deadline
- Document all milestones
- Maintain continuity records
- Update as costs incurred

**Coperniq Fields**:
- `safe_harbor_method: "5_percent" | "physical_work"`
- `safe_harbor_date`
- `safe_harbor_documentation_complete: true/false`
- `continuity_start_date`
- `placed_in_service_deadline`

---

## 8. O&M and Monitoring

### 8.1 Production Monitoring Platforms

| Platform | Best For | Key Features |
|----------|----------|--------------|
| **Enphase Enlighten** | Microinverter systems | Per-panel data, status/energy/array tabs |
| **SolarEdge Monitoring** | Optimizer systems | Module/string/system level alerts, remote troubleshooting |
| **Tesla App** | Tesla/Powerwall | Solar + battery + grid view, mobile-only |
| **Hoymiles** | Budget microinverters | Basic monitoring |

### 8.2 Monitoring Features

**Enphase**:
- Status tab: Real-time performance
- Energy tab: Production/consumption trends (day/week/month/year/billing cycle)
- Array tab: Individual panel visualization
- Redundancy: If one microinverter fails, others continue

**SolarEdge**:
- Module-level monitoring
- Fault detection at three levels
- Remote troubleshooting and diagnosis
- Automated system alerts
- Historical data for maintenance planning

**Tesla**:
- Solar production view
- Battery state of charge
- Grid import/export
- Time-based controls
- Mobile app only (no desktop/web)

### 8.3 Performance Guarantees

**Typical Structure**:
- Installer guarantees minimum annual production
- If system underperforms, compensation provided
- Usually 90-95% of estimated production guaranteed
- Weather-adjusted calculations

**Measurement**:
- Compare actual vs. expected production
- Account for weather variations
- Adjust for any system issues

### 8.4 Maintenance Services

**Preventive Maintenance**:
- Annual inspections
- Panel cleaning
- Connection checks
- Inverter inspection
- Racking inspection

**Service Visits**:
- Troubleshooting alerts
- Component replacement
- Performance optimization
- Warranty claims

**Coperniq Fields**:
- `monitoring_platform`
- `monitoring_account_created: true/false`
- `performance_guarantee_kwh_annual`
- `service_contract_active: true/false`
- `last_service_visit_date`
- `next_scheduled_maintenance`

---

## 9. Key Integrations

### 9.1 Design Software

| Software | API/Integration | Use Case |
|----------|-----------------|----------|
| **Aurora Solar** | REST API | Residential design, proposals |
| **OpenSolar** | API available | Free design tool, SMB |
| **HelioScope** | Export tools | Commercial projects |
| **PVsyst** | File export | Utility-scale simulation |

### 9.2 Financing Platforms

| Platform | Integration Type | Features |
|----------|------------------|----------|
| **GoodLeap** | Point-of-sale API | Instant pre-qualification |
| **Sunlight Financial** | API | Loan origination |
| **Mosaic** | Dealer portal | Digital loan processing |

### 9.3 Monitoring APIs

| Platform | API Availability | Data Points |
|----------|------------------|-------------|
| **Enphase Enlighten** | Developer API | Production, consumption, alerts |
| **SolarEdge** | Monitoring API | System/site/equipment data |
| **Tesla** | Limited API | Production, battery state |

### 9.4 Permitting Integration

**SolarAPP+**:
- Integration with AHJ permitting software
- API available for software integration
- Standalone option for jurisdictions
- Training required for contractors

**Traditional Permitting Software**:
- E-TRAKiT (Central Square)
- Accela
- OpenGov

### 9.5 Utility Interconnection

**Varies by utility** - typically manual process with portal submission

**Data Required**:
- System specifications
- Electrical diagrams
- Installer credentials
- Insurance documentation

---

## 10. Warranty & Performance Guarantees

### 10.1 Solar Panel Warranties

**Product Warranty (Workmanship)**:
- Duration: 10-25 years
- Covers: Manufacturing defects, premature wear

**Performance Warranty**:
- Duration: 25-40 years (standard: 25 years)
- Typical guarantee: 80-85% output at end of term
- Degradation: ~2% year 1, then 0.5% annually

**Leaders**:
- Silfab: 30-year warranty
- Maxeon: 40-year warranty

**Warranty Types**:
- **Linear**: Constant decrease (98% → 97% → 96%...)
- **Step**: Levels (90% for 10 years → 80% for remaining 15 years)

### 10.2 Inverter Warranties

| Type | Typical Warranty | Notes |
|------|------------------|-------|
| String Inverter | 10-12 years | Extended warranty available |
| Microinverter | 25 years | Enphase industry standard |
| Optimizer | 25 years | SolarEdge |

### 10.3 Other Equipment

| Equipment | Warranty |
|-----------|----------|
| Racking | 10-20 years |
| Battery | 5-10 years |
| Wiring/electrical | Varies by installer |

### 10.4 Important Warranty Considerations

- DIY installation may void warranty
- Labor for replacement usually NOT covered
- Shipping costs usually NOT covered
- Keep all documentation
- Register products properly

**Coperniq Fields**:
- `panel_manufacturer`
- `panel_warranty_years`
- `panel_performance_warranty_years`
- `inverter_warranty_years`
- `battery_warranty_years`
- `installer_workmanship_warranty_years`

---

## Appendix A: Coperniq Entity Mapping

### Contacts (Customers/Leads)
- Lead information
- Customer details
- Billing information

### Sites (Customer Locations)
- Property address
- Utility information
- HOA status
- Roof/site details

### Assets (Equipment)
- Panel model/quantity
- Inverter model
- Battery model
- Monitoring equipment

### Tasks (Work Orders)
- Site survey
- Installation
- Inspection
- Service visits

### Systems (Monitored Systems)
- Production data
- Performance metrics
- Alert status

### ServicePlanInstance (Contracts)
- O&M agreements
- Extended warranties
- Service plans

### FinancialDocument (Invoices/Quotes)
- Proposals
- Invoices
- Change orders
- Financing documents

---

## Appendix B: Critical 2026 Action Items

### For Residential Installers
1. **Educate customers** about 12/31/2025 deadline
2. **Push TPO options** for 2026+ customers
3. **Accelerate pipeline** to close before year-end
4. **Document safe harbor** for any 2025 starts

### For Commercial/C&I
1. **Begin construction by 7/4/2026** for ITC eligibility
2. **Document domestic content** compliance (50% threshold)
3. **Verify FEOC compliance** on all components
4. **Apply for LIC bonus** allocations if applicable

### For Utility-Scale
1. **Physical work test** required (5% safe harbor eliminated)
2. **4-year continuity** to placed-in-service
3. **Interconnection queue** management critical
4. **Safe harbor documentation** for all milestones

---

## Sources

### Residential & Commercial Solar Workflow
- [Syncarpha Capital: Solar Project Development Process](https://syncarpha.com/2025/01/the-solar-project-development-process-guide/)
- [SEIA: Solar Market Insight Reports](https://seia.org/research-resources/solar-market-insight-report-q4-2025/)
- [Mission Solar: Preparing for 2026](https://www.missionsolar.com/blog/preparing-for-2026-a-mission-solar-guide-on-what-commercial-and-residential-solar-professionals-need-to-know/)
- [Energyscape: Solar Changes 2026 Guide](https://energyscaperenewables.com/post/solar-changes-2026-guide/)
- [Greentech Renewables: Commercial Project Management](https://www.greentechrenewables.com/article/ins-and-outs-commercial-project-management-best-practices)
- [PV Magazine: Future of C&I Solar EPCs](https://pv-magazine-usa.com/2025/11/07/the-future-of-ci-solar-epcs-how-software-and-global-engineering-teams-are-reshaping-project-delivery/)

### Tax Credits & Incentives
- [SEIA: Solar Investment Tax Credit](https://seia.org/solar-investment-tax-credit/)
- [SEIA: Commence Construction Guidance](https://seia.org/commence-construction-guidance/)
- [Paradise Energy: Solar Tax Credit Guide](https://www.paradisesolarenergy.com/blog/how-does-the-solar-tax-credit-work/)
- [JK Renewables: 2026 Commercial Tax Credits](https://www.jkrenewables.com/post/your-2026-guide-to-commercial-solar-tax-credits)
- [PPM Solar: Commercial Tax Credits 2025-2027](https://ppm.solar/commercial-solar-tax-credit-2025-guide/)
- [Novogradac: IRS Notice 2025-42 Analysis](https://www.novoco.com/notes-from-novogradac/managing-the-new-irs-notice-2025-42-treasury-and-irs-guidance-on-eliminating-5-safe-harbor-and-clarifying-physical-work-test-for-wind-and-solar-construction)
- [IRS: Low-Income Communities Bonus Credit Program](https://www.irs.gov/credits-deductions/clean-electricity-low-income-communities-bonus-credit-amount-program)

### Permitting & Interconnection
- [GreenLancer: Solar PTO Guide](https://www.greenlancer.com/post/solar-pto)
- [Solar Permit Solutions: PTO Requirements](https://www.solarpermitsolutions.com/blog/solar-pto-requirements-timeline)
- [Energyscape: Solar PTO Guide](https://energyscaperenewables.com/post/solar-pto-guide-for-installers-and-epcs/)
- [EnergySage: Interconnection Process](https://www.energysage.com/solar/solar-interconnection-what-you-need-to-know/)
- [SolarAPP+ Knowledge Base](https://help.gosolarapp.org/)

### Financing
- [Solar Reviews: Best Financing Companies](https://www.solarreviews.com/blog/best-solar-financing-companies)
- [CFPB: Solar Financing Spotlight](https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/)
- [EnergySage: Solar Leases vs PPAs](https://www.energysage.com/solar/solar-leases-vs-ppas/)
- [SEIA: Third-Party Solar Financing](https://seia.org/third-party-solar-financing/)
- [EPA: TPO Financing Structures](https://www.epa.gov/greenpower/understanding-third-party-ownership-financing-structures-renewable-energy)

### Battery Storage
- [Tesla Energy Library: Powerwall 3 Design](https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/SystemDesign/en-us/GUID-3E19662A-E501-47DB-81AE-E9EC19735B8B.html)
- [Good Energy Solutions: Battery Comparison](https://goodenergysolutions.com/solar-battery-showdown-tesla-vs-enphase-vs-franklin-2/)
- [Glint Solar: Utility-Scale BESS Guide](https://www.glintsolar.com/bess-utility-scale-guide)
- [NREL: Utility-Scale Battery Storage](https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage)

### Community Solar
- [DOE: Community Solar Basics](https://www.energy.gov/eere/solar/community-solar-basics)
- [Arcadia: Community Solar for Developers](https://www.arcadia.com/community-solar/for-developers)
- [Solar Power World: Subscription Management](https://www.solarpowerworldonline.com/2024/03/how-are-community-solar-subscriptions-managed/)

### Design Software
- [Aurora Solar](https://aurorasolar.com/)
- [HelioScope](https://helioscope.aurorasolar.com/)
- [OpenSolar Review](https://social-gravity.com/blog/open-solar-review)
- [Sunbase: Design Software Guide](https://www.sunbasedata.com/blog/top-5-solar-design-platforms-in-2026-comparing-tools-installers-actually-use)

### Monitoring & O&M
- [SolarEdge Monitoring Platform](https://www.solaredge.com/us/products/software-tools/monitoring-platform)
- [Tesla Monitoring Support](https://www.tesla.com/support/energy/solar-panels/after-installation/monitoring-your-system)
- [Plug It In Solar: Monitoring Apps Overview](https://plugitinsolar.com/faq/an-overview-of-solar-system-monitoring-apps/)

### HOA & Warranties
- [Aurora Solar: HOA Approval Guide](https://aurorasolar.com/blog/how-to-get-hoa-solar-approval-tips-for-success/)
- [GreenLancer: HOA Guidelines](https://www.greenlancer.com/post/hoas-and-solar-panels)
- [Solar Reviews: Warranty Guide](https://www.solarreviews.com/blog/guide-to-solar-panel-warranties)
- [EnergySage: Solar Panel Warranties](https://www.energysage.com/solar/solar-panel-warranties/)
