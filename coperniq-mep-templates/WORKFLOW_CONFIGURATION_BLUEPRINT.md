# MEP Workflow Configuration Blueprint
**Created**: 2025-12-22
**Purpose**: Complete drag-and-drop guide for all 10 MEP workflows

---

## How to Use This Guide

For each workflow phase below:
1. **Check if the item exists** in your templates (Field WOs, Office WOs, Forms, Documents, Payment Structures)
2. **If it exists**: Drag it into that phase ✓
3. **If it doesn't exist**: Note it and create manually OR skip for now
4. **Move to next phase** systematically

---

## 1. [MEP] Plumbing Service Call (Project Workflow)

**Workflow Type**: Project Workflow
**Use Case**: Plumbing remodels, fixture replacements, whole-house re-pipes

### Phase 1: Initiation
**SLA**: Yellow 2hrs | Red 4hrs

**Drag these items:**
- [ ] **Office WO**: "Customer Intake Call" - Log customer info, problem description
- [ ] **Office WO**: "Preliminary Scope Definition" - What needs to be done?
- [ ] **Field WO**: "Plumbing Site Assessment" - Tech visits to assess scope
- [ ] **Form**: "Plumbing Site Survey Form" - Document existing conditions
- [ ] **Payment Structure**: [MEP] Plumbing Remodel - M1 50% (already added ✓)
- [ ] **Automation**: "Assign Lead to Plumber" - Auto-assign based on territory

### Phase 2: Design
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Plumbing Design" - Layout, fixture selection, pipe routing
- [ ] **Office WO**: "Material Takeoff" - Calculate pipe, fittings, fixtures needed
- [ ] **Office WO**: "Load Calculation (Water)" - Fixture units, pipe sizing per UPC
- [ ] **Form**: "Plumbing Design Worksheet" - Document design decisions
- [ ] **Document Request**: "Customer Approval - Design" - Get sign-off on fixtures

### Phase 3: Engineering
**SLA**: Yellow 2 days | Red 4 days

**Drag these items:**
- [ ] **Office WO**: "Code Compliance Review" - UPC/IPC compliance check
- [ ] **Office WO**: "Structural Coordination" - Where to run pipes? Load-bearing walls?
- [ ] **Office WO**: "MEP Coordination" - Conflicts with HVAC/electrical?
- [ ] **Office WO**: "Isometric Drawing Creation" - Pipe routing diagrams
- [ ] **Document Request**: "Engineer Stamp (if required)" - For commercial jobs

### Phase 4: Permitting
**SLA**: Yellow 7 days | Red 14 days

**Drag these items:**
- [ ] **Office WO**: "Permit Application Preparation" - Compile drawings, calcs, forms
- [ ] **Office WO**: "Permit Submittal" - Submit to AHJ (city/county)
- [ ] **Office WO**: "Plan Review Response" - Address city comments
- [ ] **Document**: "Permit Application" - Copy of submitted permit
- [ ] **Automation**: "Permit Approved Notification" - Alert PM when permit issued
- [ ] **Milestone**: "Permit Issued" - Gate before procurement

### Phase 5: Procurement
**SLA**: Yellow 3 days | Red 5 days

**Drag these items:**
- [ ] **Office WO**: "Material Order - Pipes & Fittings" - PVC, copper, PEX
- [ ] **Office WO**: "Fixture Order" - Toilets, sinks, water heaters
- [ ] **Office WO**: "Vendor Coordination" - Delivery scheduling
- [ ] **Office WO**: "Material Receiving & Inspection" - Check quantities, damage
- [ ] **Milestone**: "Materials On-Site" - Ready to start construction

### Phase 6: Construction
**SLA**: Yellow 5 days | Red 10 days

**Drag these items:**
- [ ] **Field WO**: "Rough-In Plumbing" - Install drain/waste/vent, water lines
- [ ] **Field WO**: "Pressure Test" - Test water lines for leaks
- [ ] **Field WO**: "Inspection - Rough Plumbing" - City inspector approval
- [ ] **Field WO**: "Fixture Installation" - Set toilets, sinks, water heater
- [ ] **Field WO**: "Final Plumbing Inspection" - City final inspection
- [ ] **Form**: "Plumbing Inspection Checklist" - Document compliance
- [ ] **Payment Structure**: [MEP] Plumbing Remodel - M2 50% (final payment)
- [ ] **Automation**: "Project Completion Email" - Send thank you, warranty info

---

## 2. [MEP] HVAC Service Agreement (Project Workflow)

**Workflow Type**: Project Workflow
**Use Case**: Ongoing HVAC maintenance contracts (Bronze/Silver/Gold plans)

### Phase 1: Enrollment
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Service Agreement Setup" - Select plan tier (Bronze/Silver/Gold)
- [ ] **Office WO**: "Equipment Inventory" - Document all HVAC units for PM schedule
- [ ] **Office WO**: "Customer Portal Setup" - Give online access
- [ ] **Form**: "HVAC Equipment Inventory Form" - Capture make/model/serial/age
- [ ] **Payment Structure**: [MEP] Service Agreement Monthly - Set up recurring billing
- [ ] **Automation**: "Welcome to Service Plan" - Email with what to expect

### Phase 2: Scheduling
**SLA**: Yellow 2 days | Red 3 days

**Drag these items:**
- [ ] **Office WO**: "PM Visit Scheduling" - Book spring/fall tune-ups
- [ ] **Automation**: "Auto-Create PM Work Orders" - Generate based on plan frequency
- [ ] **Automation**: "Appointment Reminder (48hrs)" - Text/email reminder

### Phase 3: Service Delivery
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "HVAC Preventive Maintenance" - Spring/fall tune-up
- [ ] **Form**: "HVAC PM Inspection Checklist" - Document findings
- [ ] **Field WO**: "Filter Replacement" - Replace filters per plan
- [ ] **Field WO**: "Refrigerant Charge Check" - Ensure proper charge
- [ ] **Automation**: "PM Complete Notification" - Email customer with findings

### Phase 4: Invoicing
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Monthly Invoice Generation" - Auto-bill service plan fee
- [ ] **Office WO**: "Add-On Service Invoice" - Bill for repairs outside plan
- [ ] **Payment Structure**: [MEP] Service Agreement Monthly - Recurring charge
- [ ] **Automation**: "Payment Received Thank You" - Confirm payment

### Phase 5: Renewal
**SLA**: Yellow 30 days | Red 45 days

**Drag these items:**
- [ ] **Office WO**: "Service Plan Renewal Outreach" - Contact 60 days before expiration
- [ ] **Office WO**: "Renewal Contract Preparation" - Update pricing, terms
- [ ] **Automation**: "Renewal Reminder (90/60/30 days)" - Progressive reminders
- [ ] **Milestone**: "Contract Renewed" - Customer re-signed

---

## 3. [MEP] HVAC Lead Pipeline (Request Workflow)

**Workflow Type**: Request Workflow (Sales/Lead Management)
**Use Case**: Track HVAC sales opportunities from inquiry to signed contract

### Phase 1: New
**SLA**: Yellow 15 min | Red 30 min

**Drag these items:**
- [ ] **Office WO**: "Lead Intake Call" - Answer phone, log lead info
- [ ] **Office WO**: "Lead Source Tracking" - Google, referral, Yelp, etc.
- [ ] **Automation**: "Assign Lead to Sales Rep" - Round-robin or territory-based
- [ ] **Automation**: "Immediate Response Email" - "Thanks, we'll call you soon"

### Phase 2: Qualification
**SLA**: Yellow 4 hours | Red 8 hours

**Drag these items:**
- [ ] **Office WO**: "Discovery Call" - Understand need, timeline, budget
- [ ] **Office WO**: "BANT Qualification" - Budget, Authority, Need, Timeline
- [ ] **Office WO**: "Decision Maker Identification" - Who signs the check?
- [ ] **Milestone**: "Qualified Lead" - Meets BANT criteria

### Phase 3: Feasibility Analysis
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "HVAC Site Survey" - Measure space, assess existing system
- [ ] **Form**: "HVAC Site Survey Residential" - Capture measurements, photos
- [ ] **Office WO**: "Technical Feasibility Review" - Can we do this job?
- [ ] **Office WO**: "Permit Requirements Research" - What permits needed?

### Phase 4: Financial Modeling
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Manual J Load Calculation" - Proper sizing
- [ ] **Office WO**: "Equipment Selection" - Brand, model, SEER rating
- [ ] **Office WO**: "Cost Estimation" - Labor + materials + markup
- [ ] **Office WO**: "Rebate Research" - Utility rebates, tax credits
- [ ] **Milestone**: "Estimate Approved (Internal)" - Manager reviews pricing

### Phase 5: Proposal
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Proposal Creation (Good/Better/Best)" - 3 options
- [ ] **Office WO**: "Proposal Presentation" - Walk through options with customer
- [ ] **Form**: "HVAC Equipment Proposal" - Professional quote
- [ ] **Automation**: "Send Proposal Email" - Email PDF automatically
- [ ] **Milestone**: "Proposal Sent" - Track sent date

### Phase 6: Negotiation
**SLA**: Yellow 3 days | Red 7 days

**Drag these items:**
- [ ] **Office WO**: "Follow-up Call (Day 3)" - "Did you receive it?"
- [ ] **Office WO**: "Follow-up Call (Day 7)" - "Any questions?"
- [ ] **Office WO**: "Objection Handling" - Address price/warranty concerns
- [ ] **Office WO**: "Financing Options" - Monthly payment calculator
- [ ] **Automation**: "Follow-up Reminder (Day 7)" - Alert sales rep

### Phase 7: Closed
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Contract Signing (Won)" - Get signature, collect deposit
- [ ] **Office WO**: "Lost Lead Survey (Lost)" - Why did we lose?
- [ ] **Automation**: "Convert to Project Workflow (Won)" - Move to installation
- [ ] **Automation**: "Welcome Packet (Won)" - What to expect next
- [ ] **Milestone**: "Deal Won" OR "Deal Lost"

---

## 4. [MEP] Solar EPC Project (Project Workflow)

**Workflow Type**: Project Workflow
**Use Case**: Residential/commercial solar installations

### Phase 1: Welcome
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Contract Review & Signing" - Finalize contract
- [ ] **Office WO**: "Customer Onboarding" - Explain process, timeline
- [ ] **Office WO**: "Utility Account Verification" - Confirm utility provider
- [ ] **Payment Structure**: Solar EPC - Deposit 10% - Collect upfront
- [ ] **Automation**: "Welcome Email" - What to expect, timeline

### Phase 2: Site Survey
**SLA**: Yellow 3 days | Red 5 days

**Drag these items:**
- [ ] **Field WO**: "Solar Site Assessment" - Roof condition, shading, orientation
- [ ] **Form**: "Solar Site Assessment" - Document roof type, pitch, obstructions
- [ ] **Office WO**: "Shading Analysis" - Use tools to calculate shade impact
- [ ] **Office WO**: "Electrical Panel Assessment" - Capacity for solar breaker

### Phase 3: Engineering
**SLA**: Yellow 7 days | Red 14 days

**Drag these items:**
- [ ] **Office WO**: "Solar System Design" - Panel layout, inverter selection
- [ ] **Office WO**: "Electrical Design (NEC 2023)" - AC/DC wiring, disconnect
- [ ] **Office WO**: "Structural Engineering" - Roof load calculations
- [ ] **Office WO**: "Production Modeling" - PVWatts or similar
- [ ] **Form**: "Solar System Design Package" - Plans for permitting

### Phase 4: Permitting
**SLA**: Yellow 14 days | Red 30 days

**Drag these items:**
- [ ] **Office WO**: "Permit Application Submittal" - Building + electrical permits
- [ ] **Office WO**: "HOA Approval (if needed)" - Some communities require
- [ ] **Office WO**: "Utility Interconnection Application" - Net metering agreement
- [ ] **Document**: "Building Permit" - Copy of approved permit
- [ ] **Milestone**: "Permit Issued" - Ready for procurement

### Phase 5: Procurement
**SLA**: Yellow 7 days | Red 14 days

**Drag these items:**
- [ ] **Office WO**: "Solar Panel Order" - Modules (e.g., 30x 400W panels)
- [ ] **Office WO**: "Inverter Order" - String inverter or microinverters
- [ ] **Office WO**: "Racking System Order" - Roof mounts, rails, hardware
- [ ] **Office WO**: "Delivery Scheduling" - Coordinate truck access
- [ ] **Payment Structure**: Solar EPC - M1 Materials 40% - Bill after materials ordered

### Phase 6: Construction
**SLA**: Yellow 5 days | Red 10 days

**Drag these items:**
- [ ] **Field WO**: "Racking Installation" - Mount rails to roof
- [ ] **Field WO**: "Panel Installation" - Mount modules, wire strings
- [ ] **Field WO**: "Electrical Work" - AC/DC disconnect, breaker, inverter
- [ ] **Field WO**: "Grounding & Bonding" - NEC 690 compliance
- [ ] **Form**: "Solar Installation Checklist" - Document each step

### Phase 7: Inspection
**SLA**: Yellow 5 days | Red 10 days

**Drag these items:**
- [ ] **Office WO**: "Schedule Building Inspection" - Call city inspector
- [ ] **Field WO**: "Building Inspection" - City inspector approves
- [ ] **Office WO**: "Schedule Electrical Inspection" - Separate or combined
- [ ] **Field WO**: "Electrical Inspection" - Utility inspector approves
- [ ] **Milestone**: "Inspection Passed" - System can be energized

### Phase 8: Interconnection
**SLA**: Yellow 7 days | Red 14 days

**Drag these items:**
- [ ] **Office WO**: "PTO Application Submittal" - Permission To Operate
- [ ] **Field WO**: "System Commissioning" - Turn on system, verify production
- [ ] **Office WO**: "Customer Training" - Show monitoring app, answer questions
- [ ] **Form**: "Solar System Commissioning Report" - Document startup
- [ ] **Payment Structure**: Solar EPC - M2 Final 50% - Bill after PTO

### Phase 9: O&M (Operation & Maintenance)
**SLA**: Yellow 30 days | Red 60 days

**Drag these items:**
- [ ] **Office WO**: "Performance Monitoring Setup" - Enphase/SolarEdge monitoring
- [ ] **Office WO**: "SREC Registration (if applicable)" - Solar Renewable Energy Credits
- [ ] **Automation**: "Quarterly Performance Report" - Email production stats
- [ ] **Automation**: "System Alert Notification" - Alert if system offline

---

## 5. [MEP] Emergency Service Call (Request Workflow)

**Workflow Type**: Request Workflow
**Use Case**: After-hours emergencies (burst pipe, no heat, no AC)

### Phase 1: Dispatch
**SLA**: Yellow 15 min | Red 30 min

**Drag these items:**
- [ ] **Office WO**: "Emergency Call Intake" - Log emergency details
- [ ] **Office WO**: "Technician Assignment" - Dispatch on-call tech
- [ ] **Automation**: "Emergency Alert (Tech)" - Text tech with address
- [ ] **Automation**: "Customer ETA Notification" - "Tech en route, 20 min"

### Phase 2: Diagnosis
**SLA**: Yellow 1 hour | Red 2 hours

**Drag these items:**
- [ ] **Field WO**: "Emergency Plumbing/HVAC" - Tech arrives, diagnoses issue
- [ ] **Form**: "Emergency Service Report" - Document problem, cause
- [ ] **Office WO**: "Customer Authorization (Emergency)" - Approve emergency pricing

### Phase 3: Repair
**SLA**: Yellow 2 hours | Red 4 hours

**Drag these items:**
- [ ] **Field WO**: "Emergency Repair Execution" - Fix the problem
- [ ] **Office WO**: "Parts Procurement (Emergency)" - Source parts ASAP
- [ ] **Form**: "Emergency Work Completion Report" - Document repair

### Phase 4: Billing
**SLA**: Yellow 1 hour | Red 2 hours

**Drag these items:**
- [ ] **Office WO**: "Emergency Invoice Creation" - Bill emergency rates
- [ ] **Payment Structure**: [MEP] Emergency Service Call - Full payment on-site
- [ ] **Automation**: "Emergency Invoice Email" - Send receipt

---

## 6. [MEP] Multi-Trade Commercial Project (Project Workflow)

**Workflow Type**: Project Workflow
**Use Case**: Large commercial projects with HVAC + Plumbing + Electrical

### Phase 1: Pre-Construction
**SLA**: Yellow 7 days | Red 14 days

**Drag these items:**
- [ ] **Office WO**: "Kickoff Meeting" - Meet GC, owner, trades
- [ ] **Office WO**: "Submittal Log Creation" - Track all submittals
- [ ] **Office WO**: "RFI Log Creation" - Track requests for information
- [ ] **Office WO**: "Trade Coordination" - MEP coordination meetings

### Phase 2: Engineering
**SLA**: Yellow 14 days | Red 30 days

**Drag these items:**
- [ ] **Office WO**: "HVAC Design" - Load calc, equipment selection, duct layout
- [ ] **Office WO**: "Plumbing Design" - Fixture layout, pipe routing, sizing
- [ ] **Office WO**: "Electrical Design" - Panel schedules, lighting layout
- [ ] **Office WO**: "MEP Coordination (BIM)" - Clash detection
- [ ] **Document Request**: "Engineer Stamp - MEP" - Sealed drawings

### Phase 3: Permitting
**SLA**: Yellow 30 days | Red 60 days

**Drag these items:**
- [ ] **Office WO**: "Permit Application (Building)" - Submit to AHJ
- [ ] **Office WO**: "Permit Application (Mechanical)" - HVAC permit
- [ ] **Office WO**: "Permit Application (Plumbing)" - Plumbing permit
- [ ] **Office WO**: "Permit Application (Electrical)" - Electrical permit
- [ ] **Milestone**: "All Permits Issued" - Ready for procurement

### Phase 4: Procurement
**SLA**: Yellow 14 days | Red 30 days

**Drag these items:**
- [ ] **Office WO**: "HVAC Equipment Order" - RTUs, air handlers, boilers
- [ ] **Office WO**: "Plumbing Fixtures Order" - Commercial fixtures
- [ ] **Office WO**: "Electrical Gear Order" - Panels, transformers, switchgear
- [ ] **Office WO**: "Material Expediting" - Track long-lead items
- [ ] **Payment Structure**: [MEP] Multi-Trade Project - M1 Mobilization 20%

### Phase 5: Construction
**SLA**: Yellow 60 days | Red 90 days

**Drag these items:**
- [ ] **Field WO**: "HVAC Rough-In" - Ductwork, piping, equipment pads
- [ ] **Field WO**: "Plumbing Rough-In" - DWV, water distribution
- [ ] **Field WO**: "Electrical Rough-In" - Conduit, wire pulls, panels
- [ ] **Field WO**: "HVAC Equipment Setting" - Set RTUs, air handlers
- [ ] **Field WO**: "Plumbing Fixture Installation" - Set fixtures
- [ ] **Field WO**: "Electrical Trim-Out" - Devices, fixtures, panels
- [ ] **Payment Structure**: [MEP] Multi-Trade Project - M2 50% - Rough-in complete
- [ ] **Payment Structure**: [MEP] Multi-Trade Project - M3 30% - Final payment

### Phase 6: Closeout
**SLA**: Yellow 14 days | Red 30 days

**Drag these items:**
- [ ] **Office WO**: "O&M Manual Compilation" - Operating manuals, warranties
- [ ] **Office WO**: "As-Built Drawing Creation" - Document final conditions
- [ ] **Office WO**: "Training - Facilities Staff" - Teach customer to operate
- [ ] **Office WO**: "Punch List Creation" - List remaining items
- [ ] **Field WO**: "Punch List Completion" - Complete remaining work
- [ ] **Document**: "Certificate of Substantial Completion" - Project complete

---

## 7. [MEP] Electrical Panel Upgrade (Project Workflow)

**Workflow Type**: Project Workflow
**Use Case**: Upgrade 100A to 200A service, add circuits

### Phase 1: Assessment
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "Electrical Panel Assessment" - Inspect existing panel
- [ ] **Form**: "Electrical Panel Survey" - Document existing conditions
- [ ] **Office WO**: "Load Calculation (NEC Article 220)" - Size new panel

### Phase 2: Design
**SLA**: Yellow 2 days | Red 3 days

**Drag these items:**
- [ ] **Office WO**: "Electrical Design" - Panel schedule, breaker layout
- [ ] **Office WO**: "Equipment Selection" - Choose panel, meter, breakers
- [ ] **Office WO**: "Utility Coordination" - Notify utility of upgrade

### Phase 3: Permitting
**SLA**: Yellow 3 days | Red 5 days

**Drag these items:**
- [ ] **Office WO**: "Electrical Permit Application" - Submit to AHJ
- [ ] **Document**: "Load Calculation Sheet" - For permit submittal
- [ ] **Milestone**: "Permit Issued" - Ready to order materials

### Phase 4: Procurement
**SLA**: Yellow 3 days | Red 5 days

**Drag these items:**
- [ ] **Office WO**: "Panel Order" - 200A panel, meter combo
- [ ] **Office WO**: "Breaker Order" - All required breakers
- [ ] **Office WO**: "Wire & Conduit Order" - Service entrance conductors
- [ ] **Payment Structure**: [MEP] Electrical Panel Upgrade - Deposit 50%

### Phase 5: Installation
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "Power Disconnect (Utility)" - Schedule utility cutoff
- [ ] **Field WO**: "Panel Installation" - Remove old, install new panel
- [ ] **Field WO**: "Service Entrance Wiring" - Wire from meter to panel
- [ ] **Field WO**: "Grounding & Bonding" - Ground rods, bonding jumpers
- [ ] **Field WO**: "Power Reconnect (Utility)" - Utility reconnects service

### Phase 6: Inspection
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "Electrical Inspection" - City/county inspector approves
- [ ] **Form**: "Electrical Inspection Report" - Document compliance
- [ ] **Payment Structure**: [MEP] Electrical Panel Upgrade - Final 50%

---

## 8. [MEP] Roofing Install (Project Workflow)

**Workflow Type**: Project Workflow
**Use Case**: Residential/commercial re-roof

### Phase 1: Estimate
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "Roof Inspection" - Assess condition, take measurements
- [ ] **Form**: "Roof Assessment Form" - Document findings, photos
- [ ] **Office WO**: "Material Takeoff" - Calculate squares, shingles, underlayment
- [ ] **Office WO**: "Proposal Creation" - Good/Better/Best options

### Phase 2: Contract
**SLA**: Yellow 3 days | Red 7 days

**Drag these items:**
- [ ] **Office WO**: "Contract Negotiation" - Address objections, close deal
- [ ] **Office WO**: "Contract Signing" - Get signature, collect deposit
- [ ] **Payment Structure**: [MEP] Roofing Install - Deposit 33%

### Phase 3: Procurement
**SLA**: Yellow 3 days | Red 5 days

**Drag these items:**
- [ ] **Office WO**: "Shingle Order" - Architectural shingles, color
- [ ] **Office WO**: "Underlayment Order" - Synthetic or felt
- [ ] **Office WO**: "Flashing Order" - Step, valley, drip edge
- [ ] **Office WO**: "Delivery Scheduling" - Dumpster + materials

### Phase 4: Installation
**SLA**: Yellow 3 days | Red 5 days

**Drag these items:**
- [ ] **Field WO**: "Tear-Off" - Remove old shingles, inspect decking
- [ ] **Field WO**: "Decking Repair" - Replace rotted plywood
- [ ] **Field WO**: "Ice & Water Shield" - Install in valleys, eaves
- [ ] **Field WO**: "Underlayment Installation" - Roll out synthetic underlayment
- [ ] **Field WO**: "Shingle Installation" - Nail off new shingles
- [ ] **Field WO**: "Flashing Installation" - Step flashing, valleys, penetrations
- [ ] **Field WO**: "Ridge Vent Installation" - Continuous ridge vent
- [ ] **Payment Structure**: [MEP] Roofing Install - Progress 34% - Tear-off complete

### Phase 5: Cleanup
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "Site Cleanup" - Magnet sweep, dumpster removal
- [ ] **Field WO**: "Final Inspection" - Walk roof with customer
- [ ] **Form**: "Roofing Completion Checklist" - Document quality
- [ ] **Payment Structure**: [MEP] Roofing Install - Final 33%

---

## 9. [MEP] Fire Sprinkler Inspection (Request Workflow)

**Workflow Type**: Request Workflow (Service/Inspection)
**Use Case**: NFPA 25 quarterly/annual inspections

### Phase 1: Scheduling
**SLA**: Yellow 3 days | Red 7 days

**Drag these items:**
- [ ] **Office WO**: "Inspection Scheduling" - Book quarterly/annual inspection
- [ ] **Automation**: "Inspection Reminder (7 days)" - Email/text reminder
- [ ] **Automation**: "Tech Assignment" - Assign certified tech

### Phase 2: Inspection
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Field WO**: "Fire Sprinkler System Inspection per NFPA 25" - Perform inspection
- [ ] **Form**: "Sprinkler Inspection (NFPA 25)" - Document findings
- [ ] **Field WO**: "Deficiency Correction" - Fix any issues found

### Phase 3: Reporting
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Inspection Report Generation" - Compile findings
- [ ] **Office WO**: "AHJ Notification (if required)" - Submit to fire marshal
- [ ] **Document**: "NFPA 25 Inspection Certificate" - Provide to customer
- [ ] **Automation**: "Inspection Report Email" - Send PDF to customer

### Phase 4: Billing
**SLA**: Yellow 1 day | Red 2 days

**Drag these items:**
- [ ] **Office WO**: "Inspection Invoice" - Bill inspection fee
- [ ] **Office WO**: "Deficiency Repair Invoice" - Bill for any repairs
- [ ] **Automation**: "Invoice Email" - Send invoice automatically

---

## 10. [MEP] EaaS (Equipment-as-a-Service) Project (Project Workflow)

**Workflow Type**: Project Workflow
**Use Case**: HVAC EaaS model (like solar PPA but for HVAC)

### Phase 1: Qualification
**SLA**: Yellow 2 days | Red 3 days

**Drag these items:**
- [ ] **Office WO**: "Credit Check" - Verify creditworthiness for contract
- [ ] **Office WO**: "Property Assessment" - Confirm customer owns property
- [ ] **Field WO**: "HVAC Condition Assessment" - Inspect existing system
- [ ] **Form**: "HVAC System Assessment" - Document age, condition

### Phase 2: Contract
**SLA**: Yellow 5 days | Red 7 days

**Drag these items:**
- [ ] **Office WO**: "EaaS Contract Preparation" - Draft 15-year agreement
- [ ] **Office WO**: "Financial Modeling" - Monthly payment calculation
- [ ] **Office WO**: "Contract Review with Customer" - Explain terms
- [ ] **Office WO**: "Contract Signing" - Get signature
- [ ] **Payment Structure**: [MEP] HVAC-as-a-Service (EaaS) - Monthly recurring

### Phase 3: Installation
**SLA**: Yellow 5 days | Red 10 days

**Drag these items:**
- [ ] **Office WO**: "Equipment Procurement" - Order HVAC equipment
- [ ] **Field WO**: "Old Equipment Removal" - Remove existing system
- [ ] **Field WO**: "New Equipment Installation" - Install new HVAC system
- [ ] **Field WO**: "Startup & Commissioning" - Test system operation
- [ ] **Form**: "HVAC System Commissioning Report" - Document startup

### Phase 4: Operation
**SLA**: Ongoing (monthly)

**Drag these items:**
- [ ] **Automation**: "Monthly Invoice Generation" - Auto-bill monthly fee
- [ ] **Automation**: "Auto-Create PM Work Orders" - Quarterly PM visits
- [ ] **Field WO**: "HVAC Preventive Maintenance" - PM visits per contract
- [ ] **Automation**: "Performance Monitoring Alert" - Alert if system offline

---

## Quick Reference: SLA Guidelines

| Workflow Type | Phase Type | Yellow SLA | Red SLA |
|---------------|------------|------------|---------|
| Emergency Service | All phases | 15-30 min | 1-2 hours |
| Service Call | Dispatch | 2 hours | 4 hours |
| Service Call | Completion | 1 day | 2 days |
| Sales/Lead | Response | 15 min | 30 min |
| Sales/Lead | Qualification | 4 hours | 8 hours |
| Sales/Lead | Proposal | 1 day | 2 days |
| Installation Project | Initiation | 1 day | 2 days |
| Installation Project | Design | 2-3 days | 5-7 days |
| Installation Project | Permitting | 7-14 days | 14-30 days |
| Installation Project | Procurement | 3-5 days | 7-10 days |
| Installation Project | Construction | 5-10 days | 10-20 days |
| Commercial Project | Pre-Con | 7 days | 14 days |
| Commercial Project | Engineering | 14 days | 30 days |
| Commercial Project | Permitting | 30 days | 60 days |
| Commercial Project | Construction | 60 days | 90 days |

---

## Automation Templates

**Common automations to add across workflows:**

### Customer Communication
- [ ] "Immediate Response Email" - Trigger: New lead created
- [ ] "Appointment Reminder (48hrs)" - Trigger: Work order scheduled
- [ ] "Follow-up (Day 3/7)" - Trigger: Proposal sent (sales)
- [ ] "Thank You Email" - Trigger: Payment received

### Team Coordination
- [ ] "Assign to Tech/Sales Rep" - Trigger: Work order/lead created
- [ ] "Tech Dispatch Alert" - Trigger: Emergency work order
- [ ] "Manager Approval Request" - Trigger: Estimate > $10K
- [ ] "Permit Approved Notification" - Trigger: Permit status = approved

### System Integration
- [ ] "Convert to Project Workflow" - Trigger: Deal won (sales)
- [ ] "Auto-Create PM Work Orders" - Trigger: Service plan enrollment
- [ ] "Invoice Generation" - Trigger: Work order completed
- [ ] "Payment Reminder (Overdue)" - Trigger: Invoice 30 days overdue

---

## Payment Structure Reference

**Typical milestone payment structures:**

| Project Type | M1 | M2 | M3 | M4 |
|--------------|----|----|----|----|
| Small Install (<$10K) | 50% deposit | 50% final | - | - |
| Medium Install ($10-50K) | 33% deposit | 34% progress | 33% final | - |
| Large Install (>$50K) | 25% deposit | 25% materials | 25% rough-in | 25% final |
| Solar EPC | 10% deposit | 40% materials | 50% final | - |
| Commercial Project | 20% mobilization | 50% progress | 30% final | - |
| Service Agreement | Monthly recurring | - | - | - |
| EaaS Model | Monthly recurring (15 years) | - | - | - |

---

## Next Steps

1. **Copy this blueprint** and keep it open while configuring workflows
2. **Work through one workflow at a time** systematically
3. **Check off items as you drag them** into each phase
4. **Note missing items** that need to be created
5. **Move to next workflow** when complete

**You've got this!** 🚀 Knock out all 10 workflows using this blueprint.
