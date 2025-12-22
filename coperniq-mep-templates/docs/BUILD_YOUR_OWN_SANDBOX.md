# Build Your Own Coperniq Sandbox - Complete Cookbook

**Last Updated**: 2025-12-21
**Time to Complete**: 6-8 hours for full MEP contractor demo environment
**Outcome**: Production-ready Coperniq instance with 20 demo clients, 50+ templates, realistic data

---

## 🎯 What You'll Build

A fully-functional MEP contractor management system with:
- ✅ **8 Project Workflows** (HVAC, Plumbing, Electrical, Fire, O&M)
- ✅ **11 Payment Structures** (EaaS, ESPC, SLA-Based, Solar O&M, etc.)
- ✅ **35+ Forms** (Inspections, site surveys, compliance checklists)
- ✅ **20+ Work Order Templates** (Field + Office)
- ✅ **10 Automations** (Payment received, PM scheduling, emergency dispatch)
- ✅ **20 Demo Clients** (Residential, Commercial, Industrial with complete history)
- ✅ **8 Persona-Based Hubs** (CSR, Sales, Dispatch, Field Tech, PM, Accounting, Service Manager, Executive)

**Why This Matters**: Prove Coperniq value in 1 day demo vs. 3-6 months manual setup

---

## 📋 Prerequisites

### Required Access
- [ ] Coperniq account (https://app.coperniq.io)
- [ ] Company Admin role (to access Process Studio)
- [ ] Browser: Chrome/Edge (for Playwright automation)

### Time Blocks
- **Phase 1** (2 hours): Core templates (Workflows, Payment Structures, Forms)
- **Phase 2** (2 hours): Work Orders + Automations
- **Phase 3** (2 hours): Demo clients using AI
- **Phase 4** (2 hours): Hubs + Testing

---

## 🚀 Phase 1: Core Templates (2 hours)

### Step 1.1: Create O&M Workflows (30 min)

**Why First**: Payment structures REQUIRE workflows to exist before creation (dependency requirement)

**Navigate to**: https://app.coperniq.io/112/company/studio/workflows/project-workflows

**Create 4 O&M Workflows**:

1. **[MEP] HVAC EaaS Service Agreement**
   ```
   Click "Workflow" button
   Name: [MEP] HVAC EaaS Service Agreement
   Description: O&M workflow for EaaS agreements. Contractor owns equipment, customer pays monthly for cooling/heating outcomes. Includes monitoring, PM, repairs, replacement. Measured by BTU meter. 20-70% energy savings.
   Phase: Operation and Maintenance
   Click "Create"
   Note workflow ID (e.g., 20661) for payment structure mapping
   ```

2. **[MEP] Mission-Critical SLA Service**
   ```
   Name: [MEP] Mission-Critical SLA Service
   Description: O&M workflow for mission-critical facilities. Tier III/IV uptime guarantees (99.982%-99.995%). 24/7 monitoring, N+1 redundancy verification, performance bonuses/penalties. Data centers, hospitals, telecom.
   Phase: Operation and Maintenance
   Note workflow ID (e.g., 20662)
   ```

3. **[MEP] Solar O&M Performance Service**
   ```
   Name: [MEP] Solar O&M Performance Service
   Description: O&M workflow for solar performance contracts with $/kW-year pricing ($16-$24/kW typical). Liquidated damages for underperformance. Monthly monitoring and reporting. Commercial and utility-scale solar.
   Phase: Operation and Maintenance
   Note workflow ID (e.g., 20663)
   ```

4. **[MEP] Industrial MC/RAV Service**
   ```
   Name: [MEP] Industrial MC/RAV Service
   Description: O&M workflow for industrial maintenance contracts. 2-4% of asset replacement value annually. Includes predictive maintenance, condition monitoring, spare parts management. Manufacturing, data centers, industrial facilities.
   Phase: Operation and Maintenance
   Note workflow ID (e.g., 20664)
   ```

**Checkpoint**: You now have 4 O&M workflows. Screenshot each workflow ID.

---

### Step 1.2: Create Payment Structures (45 min)

**Navigate to**: https://app.coperniq.io/112/company/studio/templates/payment-structure-templates

**Create 11 Payment Structures** (use workflow IDs from Step 1.1):

1. **[MEP] HVAC-as-a-Service (EaaS)**
   ```
   Click "Template" button
   Name: [MEP] HVAC-as-a-Service (EaaS)
   Description: Monthly subscription model where contractor owns equipment and customer pays for cooling/heating outcomes (not equipment ownership). Measured by BTU meter at site. Customer benefits: No upfront capital, predictable OpEx, guaranteed performance. Contractor benefits: Recurring revenue, long-term customer relationships. Energy savings: 20-70%.
   Type: Invoice
   Click "Workflow" button → Select "[MEP] HVAC EaaS Service Agreement" (workflow ID from 1.1)
   Select Phase: Operation and Maintenance
   Milestone M1: 100%
   Delete M2 and M3 (single monthly billing milestone)
   Click "Create"
   ```

2. **[MEP] SLA-Based Uptime (Mission Critical)**
   ```
   Name: [MEP] SLA-Based Uptime (Mission Critical)
   Description: Mission-critical O&M with SLA uptime guarantees. Base monthly fee + performance bonuses for exceeding SLA, penalties for violations. 24/7 monitoring, 2-hour emergency response. Tier III/IV data centers, hospitals, telecom facilities. N+1 redundancy verification.
   Type: Invoice
   Workflow: [MEP] Mission-Critical SLA Service (workflow ID from 1.1)
   Phase: Operation and Maintenance
   M1: 100%, delete M2/M3
   ```

3. **[MEP] Solar O&M Performance ($/kW-year)**
   ```
   Name: [MEP] Solar O&M Performance ($/kW-year)
   Description: Performance-based solar O&M contract with $/kW-year pricing ($16-$24/kW typical). Contractor guarantees system availability and performance ratio. Liquidated damages for underperformance ($/kWh). Monthly monitoring, inverter/module replacement, vegetation management. Typical term: 10-20 years.
   Type: Invoice
   Workflow: [MEP] Solar O&M Performance Service (workflow ID from 1.1)
   Phase: Operation and Maintenance
   M1: 100%, delete M2/M3
   ```

4. **[MEP] Industrial Maintenance Contract (2-4% RAV)**
   ```
   Name: [MEP] Industrial Maintenance Contract (2-4% RAV)
   Description: Industrial maintenance contract priced at 2-4% of asset replacement value annually. Includes predictive maintenance, condition monitoring, emergency response, spare parts management. Typical for manufacturing equipment, data center infrastructure, mission-critical systems. SLA-based with uptime guarantees. 3-5 year terms.
   Type: Invoice
   Workflow: [MEP] Industrial MC/RAV Service (workflow ID from 1.1)
   Phase: Operation and Maintenance
   M1: 100%, delete M2/M3
   ```

5. **[MEP] Outcome-Based Comfort (Pay-per-Degree)**
   ```
   Name: [MEP] Outcome-Based Comfort (Pay-per-Degree)
   Description: Monthly subscription where customer pays for thermal comfort outcomes, not equipment. Contractor guarantees indoor temp within 70-78°F year-round. Fixed $/month based on square footage and climate zone. Includes monitoring, PM, repairs, replacement. Customer: No upfront cost, guaranteed comfort. Contractor: Recurring revenue, equipment optimization.
   Type: Invoice
   Workflow: [MEP] HVAC EaaS Service Agreement (workflow ID 20661 - reuse)
   Phase: Operation and Maintenance
   M1: 100%, delete M2/M3
   ```

6. **[MEP] Data Center Mission Critical (Tier III/IV SLA)**
   ```
   Name: [MEP] Data Center Mission Critical (Tier III/IV SLA)
   Description: Mission-critical data center maintenance with Tier III (99.982%) or Tier IV (99.995%) availability guarantees. Monthly service with performance bonuses for exceeding SLA, penalties for violations. 2-hour emergency response. 24/7 monitoring and N+1 redundancy verification. Pricing: Base monthly fee + SLA incentive structure.
   Type: Invoice
   Workflow: [MEP] Mission-Critical SLA Service (workflow ID 20662 - reuse)
   Phase: Operation and Maintenance
   M1: 100%, delete M2/M3
   ```

7-11. **Project-Based Payment Structures** (use existing HVAC Commercial workflow):
   - [MEP] ESPC Gain-Sharing (70/30 split, M1: 30% Engineering, M2: 30% Construction, M3: 40% Commissioning)
   - [MEP] Multi-Trade Project (Custom milestone splits per trade)
   - [MEP] Service Agreement Monthly (Recurring O&M billing)
   - [MEP] Roofing Install (M1: 50% Materials, M2: 50% Completion)
   - [MEP] Emergency Service Call (M1: 100% upon completion)

**Checkpoint**: You now have 11 payment structures. Test 1-2 by creating a sample project.

---

### Step 1.3: Create Forms with AI (45 min)

**Navigate to**: https://app.coperniq.io/112/company/studio/templates/form-templates

**Use "✨ Ask AI" to create forms 30x faster than manual**

**Create 10 Essential Forms**:

1. **HVAC PM Inspection** (Commercial/Residential)
   ```
   Click "Template" → "✨ Ask AI"
   Prompt: "Create commercial HVAC monthly PM inspection form. Include: technician name, date, client, building address, equipment type (RTU/chiller/boiler/air handler), serial number, visual inspection checklist (belts/filters/refrigerant leaks/electrical connections), temperature readings (supply/return/outdoor air), operational tests (compressor startup/fan operation/thermostat calibration), deficiencies found, corrective actions, parts replaced, labor hours, customer signature, next PM due date."

   AI generates 7 sections with 20+ fields
   Review → Click "Save"
   Time: 10 seconds vs. 30 minutes manual
   ```

2. **Electrical Panel Inspection** (NEC Compliance)
   ```
   Prompt: "Create electrical panel safety inspection form per NFPA 70. Include: inspector certification number, facility name, panel location, panel rating (amps), number of circuits, visual inspection (corrosion/overheating/loose connections/labeling), thermal imaging (hot spots), torque testing, load calculations, deficiencies found, corrective actions, customer signature, next inspection due date."
   ```

3. **Fire Sprinkler Inspection** (NFPA 25 Quarterly)
   ```
   Prompt: "Create fire sprinkler quarterly inspection form per NFPA 25. Include: inspector certification, facility name, system type (wet/dry/pre-action), valve inspection (tamper switches/control valves/OS&Y position), gauge readings (static/residual/flow), alarm testing (water flow/supervisory/tamper), visual inspection (pipe hangers/sprinkler heads/obstructions), deficiencies with photos, corrective actions, AHJ notification requirements, inspector signature, next inspection due date."
   ```

4. **Plumbing Backflow Test** (Certified Inspection)
   ```
   Prompt: "Create backflow prevention test form for certified plumbing inspection. Include: tester certification number, client name, site address, device type (RPZ/DC/DCVA/PVB), manufacturer, model, serial number, test kit calibration date, initial test (check valve #1/#2, relief valve, differential pressure), repairs made, final test results, pass/fail determination, city/county submission requirements, customer signature, next annual test due date."
   ```

5. **Refrigerant Tracking Log** (EPA 608 Compliance)
   ```
   Prompt: "Create EPA 608 refrigerant tracking log form. Include: technician EPA certification number, date, client, equipment type, refrigerant type (R-410A/R-22/R-134a/etc), cylinder serial number, starting weight, ending weight, amount added (lbs), reason for addition (leak repair/new install/seasonal adjustment), leak test performed (yes/no), disposal method if recovered, customer signature, EPA compliance notes."
   ```

6. **Site Survey - Residential** (HVAC/Solar)
   ```
   Prompt: "Create residential site survey form for HVAC and solar installations. Include: surveyor name, date, homeowner info, property address, square footage, number of stories, roof type/condition/pitch, attic access, existing equipment (make/model/age), electrical panel capacity, ductwork condition, insulation R-value, customer goals (comfort/cost savings/green energy), photos (nameplate/electrical panel/attic), preliminary system sizing, estimated project cost, customer signature."
   ```

7. **Commercial Site Survey** (Multi-Trade)
   ```
   Prompt: "Create commercial building site survey form for multi-trade projects. Include: surveyor, date, facility name, building type/size, occupancy hours, existing systems (HVAC/electrical/plumbing/fire protection), BAS/controls, utility account numbers, recent utility bills, compliance requirements (LEED/Title 24/ASHRAE), roof access/structural capacity, electrical service capacity, water service capacity, gas service capacity, photos, trade-specific notes, customer requirements, estimated budget."
   ```

8. **Customer Satisfaction Survey** (Post-Service)
   ```
   Prompt: "Create post-service customer satisfaction survey. Include: service date, technician name, service type, rating questions (technician professionalism 1-5, work quality 1-5, timeliness 1-5, overall satisfaction 1-5), would you recommend us (yes/no), likelihood to use again (1-10), feedback comments, permission to use as testimonial (yes/no), referral interest (yes/no), customer signature/date."
   ```

9. **Service Agreement Enrollment** (O&M Plans)
   ```
   Prompt: "Create service agreement enrollment form for O&M service plans. Include: customer info, property address, equipment inventory (type/make/model/serial for each unit), service plan selection (Bronze/Silver/Gold/Platinum), plan benefits summary, visit frequency, priority response level, parts/labor coverage, pricing (monthly/annual), payment method (credit card/ACH/invoice), auto-renewal option, customer signature/date, start date."
   ```

10. **Emergency Service Authorization** (After-Hours)
    ```
    Prompt: "Create emergency service authorization form for after-hours work. Include: date/time of call, customer name, callback number, property address, emergency description, estimated arrival time, after-hours service rate disclosure, estimated repair cost range, authorization to proceed (yes/no with limit), payment method required (credit card for emergency work), customer verbal authorization recorded by (CSR name), follow-up appointment if needed, customer signature upon arrival."
    ```

**Pro Tip**: Copy successful prompts into a template document for reuse

**Checkpoint**: 10 forms created in 45 minutes (would take 5+ hours manually)

---

## 🚀 Phase 2: Work Orders + Automations (2 hours)

### Step 2.1: Create Document Request Templates (30 min)

**Navigate to**: https://app.coperniq.io/112/company/studio/templates/document-request-templates

**Create 15 Essential Document Requests**:

1. **Utility Bills** (12 months for solar/efficiency projects)
2. **Proof of Insurance** (General liability, workers comp)
3. **Building Plans/As-Builts** (For renovation/addition work)
4. **Property Deed/Title** (For solar/PACE financing)
5. **HOA Approval** (For exterior work in HOA communities)
6. **Electrical Panel Photos** (Nameplate ratings, breaker layout)
7. **Equipment Nameplate Photos** (Model, serial, specs)
8. **Signed Contract** (Upload executed agreement)
9. **Change Order Approval** (Customer authorization for scope changes)
10. **Final Inspection Certificate** (AHJ sign-off)
11. **Warranty Registration** (Equipment manufacturer warranty)
12. **Lien Waiver** (Subcontractor/supplier payment confirmation)
13. **EPA Lead Certification** (Pre-1978 renovation disclosure)
14. **Asbestos Survey Report** (Commercial building compliance)
15. **Fire Marshal Approval** (Life safety system signoff)

**Checkpoint**: Document requests ready for project workflows

---

### Step 2.2: Create Automations (1.5 hours)

**Navigate to**: https://app.coperniq.io/112/company/studio/automations

**Create 10 Critical Automations**:

1. **Payment Received → Update Project**
   ```
   Trigger: (webhook from payment processor)
   Actions:
   - Update project status to "Paid"
   - Send email to customer: "Payment received! Thank you."
   - Send email to accounting: "Payment recorded for Project #XYZ"
   ```

2. **Job Complete → Create Invoice**
   ```
   Trigger: Work Order Status Updated = "Complete"
   Actions:
   - Create invoice (use AI with work order details)
   - Send email to customer with payment link
   - Notify accounting team
   ```

3. **Permit Approved → Schedule Installation**
   ```
   Trigger: Record Stage Updated = "Permit Approved"
   Actions:
   - Create work order: Installation (use workflow template)
   - Set dynamic due date: +3 business days
   - Send email to customer: "Permit approved! Scheduling install."
   - SMS to assigned tech: "New installation scheduled"
   ```

4. **Emergency Call → Dispatch Tech**
   ```
   Trigger: Work Order Created with Template = "Emergency"
   Actions:
   - SMS to on-call tech: "EMERGENCY: [Customer] - [Issue]"
   - Email to dispatch manager: "Emergency WO created"
   - Create reminder: "Check response in 30 min"
   - Start SLA timer
   ```

5. **PM Due → Create Work Order**
   ```
   Trigger: Record Stage SLA Violation (PM overdue)
   Actions:
   - Create work order: Preventive Maintenance
   - Email to customer: "Your scheduled maintenance is due"
   - SMS to assigned tech: "PM visit needed for [Customer]"
   ```

6. **New Customer → Welcome Email**
   ```
   Trigger: Record Created with Workflow = "New Customer Onboarding"
   Actions:
   - Send email: "Welcome! Here's your portal access."
   - Create reminder: "Call customer in 3 days for check-in"
   - SMS: "Welcome! Your portal login has been emailed."
   ```

7. **Negative Review → Manager Alert**
   ```
   Trigger: (webhook from review platform)
   Actions:
   - Email to manager: "ALERT: Negative review from [Customer]"
   - Create reminder: "Respond to review within 24 hours"
   - Add comment to project: "Negative review received"
   ```

8. **Contract Expiring → Renewal Reminder**
   ```
   Trigger: Record Stage SLA Violation (30 days before expiration)
   Actions:
   - Email to customer: "Your service agreement expires soon"
   - Email to sales rep: "Renewal opportunity for [Customer]"
   - Create reminder: "Follow up on renewal in 7 days"
   ```

9. **Milestone Complete → Invoice Next Phase**
   ```
   Trigger: Record Stage Updated = "Milestone Complete"
   Actions:
   - Create invoice for next milestone (use payment structure milestones)
   - Email to customer with payment link
   - Update project % complete
   ```

10. **Lead Response → Assign Sales Rep**
    ```
    Trigger: Request Created with Source = "Web Form"
    Actions:
    - Assign to sales rep (round-robin or by territory)
    - Send email to sales rep: "New lead assigned"
    - Create reminder: "Contact lead within 1 hour"
    - SMS to customer: "Thanks! We'll call you within 1 hour."
    ```

**Checkpoint**: 10 automations active, test 2-3 with sample data

---

## 🚀 Phase 3: Demo Clients with AI (2 hours)

**THIS IS THE GAME-CHANGER**: Use AI to create 20 demo clients 10x faster

### Step 3.1: Residential HVAC Clients (30 min)

**Navigate to**: Projects → "+ PROJECT" → "✨ Ask AI"

**Create 4 clients with complete history**:

1. **Sarah Martinez - Phoenix, AZ - Bronze Plan**
   ```
   Prompt: "Create annual HVAC PM visit for new residential customer Sarah Martinez in Phoenix, AZ. Customer has 15-year-old Trane XR14 3-ton AC unit, serial number A12345678, installed 2010. Service plan: Bronze (1 annual visit). Technician replaced air filter, checked refrigerant levels (R-410A, within spec), tested thermostat calibration. All systems operating normally. Completed 12/15/2025. Service total: $150."

   AI creates:
   - New client: Sarah Martinez (you select from dropdown or create new)
   - New site: Phoenix, AZ (auto-matched or create)
   - New project with complete service history
   - Work order auto-generated
   - Ready to invoice

   Then create asset:
   Navigate to Assets → "+ ASSET" → "✨ Ask AI"
   Prompt: "Trane 3-ton AC unit, model XR14, 15 years old. Serial A12345678. Installed 2010 at Sarah Martinez home, Phoenix AZ. R-410A refrigerant. Expected lifetime 20 years. Active, Bronze service plan."

   AI creates complete asset record linked to customer
   ```

2. **Robert Chen - Austin, TX - Silver Plan**
   ```
   Prompt: "Create spring HVAC tune-up for Robert Chen in Austin, TX. Customer has 8-year-old Carrier 4-ton AC unit, model 24ACB4, installed 2017. Silver service plan (2 visits/year). Technician performed spring startup, replaced filter, checked refrigerant (R-410A, added 0.5 lbs for minor leak), cleaned condenser coils, tested capacitors. Recommended monitor for refrigerant leak. Completed 4/10/2025. Service: $200."

   Asset prompt: "Carrier 4-ton AC unit, model 24ACB4, 8 years old. Serial XYZ789. Installed 2017 at Robert Chen home, Austin TX. R-410A refrigerant. Note: Minor refrigerant leak detected spring 2025, monitoring. Expected lifetime 15 years. Active, Silver plan."
   ```

3. **Jennifer Williams - Atlanta, GA - Gold Plan**
   ```
   Prompt: "Create quarterly HVAC PM for Jennifer Williams, Atlanta GA. Gold service plan (4 visits/year). Customer has 3-year-old Lennox heat pump XP20-036-230, 3-ton, dual fuel. This is Q4 winter check. Technician tested heat pump operation, inspected heat strips, checked defrost cycle, verified thermostat programming, replaced filter. System operating excellently. Completed 12/18/2025. Service: $250."

   Asset: "Lennox 3-ton heat pump, model XP20-036-230, 3 years old. Serial LNX2022123. Installed 2022 at Jennifer Williams home, Atlanta GA. Dual fuel system (heat pump + gas furnace backup). Expected lifetime 18-20 years. Active, Gold plan with quarterly visits."
   ```

4. **Michael Thompson - Charlotte, NC - Platinum Plan**
   ```
   Prompt: "Create Platinum quarterly PM for Michael Thompson, Charlotte NC. Customer has new Trane XV20i variable-speed heat pump, 4-ton, installed 2024. Premium service includes: comprehensive inspection, system performance analysis, efficiency report, priority 2-hour emergency response. This visit: winter performance check, verified ComfortLink II controls, analyzed energy usage vs. baseline, confirmed 20 SEER performance. System exceeding expectations. Completed 12/20/2025. Service: $400."

   Asset: "Trane 4-ton variable-speed heat pump, model XV20i, 1 year old. Serial TRN2024500. Installed January 2024 at Michael Thompson home, Charlotte NC. 20 SEER rating, ComfortLink II smart controls. Expected lifetime 20+ years. Active, Platinum plan with quarterly premium service."
   ```

**Result**: 4 residential clients with complete service history, assets, projects in 30 minutes

---

### Step 3.2: Commercial/Industrial Clients (1 hour)

**Use same AI pattern for remaining 16 clients**:

5. **Downtown Office Tower LLC** - SF - Commercial HVAC
6. **Retail Plaza Management** - Dallas - Multi-Trade
7. **Industrial Warehouse Solutions** - NJ - Electrical + HVAC
8. **Sunset Apartments HOA** - San Diego - Multi-Family
9. **Riverfront Condos Management** - Portland - Multi-Family
10. **American Food Processing Inc** - Fresno - Refrigeration
11. **DataCenter Midwest LLC** - Chicago - Mission Critical
12. **Wellness Medical Group** - Boston - Healthcare HVAC + Fire
13. **Thai Spice Restaurant** - Seattle - Commercial Kitchen
14. **Urban Outfitters Flagship** - Brooklyn - Retail HVAC
15. **City Public Library** - Denver - Government HVAC
16-20. **Solar EPC Clients** - Residential/Commercial/Utility-scale

**Prompt Template** (customize per client):
```
Create [service type] project for [client name] in [location]. Customer [equipment details]. [Service plan or contract type]. [Work performed]. Completed [date]. Total: [price].
```

**Asset Template**:
```
[Equipment type] [capacity], model [model], [age] years old. Serial [serial]. Installed [year] at [client] [location]. [Technical specs]. Expected lifetime [years]. [Status], [service plan].
```

**Checkpoint**: 20 clients created with projects + assets in 1.5 hours (would take 2-3 days manually)

---

## 🚀 Phase 4: Hubs + Testing (2 hours)

### Step 4.1: Create Persona-Based Hubs (1 hour)

**Navigate to**: Hubs → "Create Hub" (from sidebar)

**Create 8 Hubs** (persona-based organization):

1. **CSR/Receptionist Hub**
   - Inbound Requests Today (filter: created date = today)
   - Appointment Scheduling (calendar view)
   - Customer Lookup (search interface)

2. **Sales Rep Hub**
   - My Active Quotes (filter: assigned to me, status = sent)
   - Follow-Up Queue (filter: last contact > 7 days)
   - Won Deals This Month (filter: status = won, date = this month)

3. **Dispatcher Hub**
   - Today's Schedule (filter: date = today, group by tech)
   - Unassigned Work Orders (filter: assignee = null)
   - Emergency Queue (filter: priority = emergency)

4. **Field Tech Hub** (Mobile-Optimized)
   - My Work Orders Today (filter: assignee = current user)
   - My Timesheet (current week hours)
   - Parts Needed (materials to pick up)

5. **Project Manager Hub**
   - Active Projects (filter: status = in progress)
   - Projects Needing Action (filter: overdue milestones)
   - Project Financials (budget vs actual)

6. **Accountant Hub**
   - Invoices to Send (filter: project complete, invoice = draft)
   - AR Aging (group by days overdue)
   - Payments Received Today (filter: payment date = today)

7. **Service Manager Hub**
   - Service Plans Active (filter: service plan != null)
   - PM Visits Due (filter: due date <= 30 days)
   - Renewals This Quarter (filter: expiration <= 90 days)

8. **Executive Dashboard Hub**
   - Business Health Overview (KPI cards: revenue, margin, cash flow)
   - Sales Pipeline (funnel view)
   - Operations Overview (jobs complete, in progress, overdue)

**Checkpoint**: All 8 Hubs created and populated with demo data

---

### Step 4.2: Test All Features (1 hour)

**End-to-End Testing**:

1. **Sales Workflow Test**
   - Create request with AI
   - Convert to quote with AI
   - Win quote → Create project with AI
   - Verify work orders auto-generated
   - Complete work order
   - Create invoice with AI
   - Mark invoice paid

2. **PM Workflow Test**
   - Find customer with service plan
   - Create PM project with AI
   - Create asset with AI (if equipment not in database)
   - Complete PM work order with mobile form
   - Create invoice
   - Schedule next PM visit

3. **Emergency Workflow Test**
   - Create emergency project with AI
   - Verify emergency automation fired (SMS, email alerts)
   - Assign to tech
   - Tech completes work order
   - Create emergency invoice
   - Customer pays

4. **Automation Testing**
   - Trigger each automation
   - Verify actions executed (emails sent, WOs created, statuses updated)
   - Fix any broken automations

**Checkpoint**: All workflows tested, any issues documented and fixed

---

## 📊 Success Metrics

### Completeness Check

- [ ] **Templates**: 8 workflows, 11 payment structures, 35+ forms, 20+ work orders, 15 document requests
- [ ] **Automations**: 10 automations active and tested
- [ ] **Clients**: 20 demo clients with complete history (projects, assets, invoices)
- [ ] **Hubs**: 8 persona-based Hubs with relevant views
- [ ] **Data**: 50+ projects, 100+ assets, 75+ invoices (from demo clients)

### Quality Check

- [ ] **AI Adoption**: 80%+ of records created via AI (not manual)
- [ ] **Workflow Mapping**: All payment structures mapped to correct workflows
- [ ] **Form Usability**: Forms tested on mobile device (field tech experience)
- [ ] **Hub Accuracy**: Hub views show correct filtered data
- [ ] **Automation Reliability**: All automations trigger correctly

### Time Savings

| Task | Manual Time | AI Time | Improvement |
|------|-------------|---------|-------------|
| Form creation | 30 min | 10 sec | 180x faster |
| Project creation | 10 min | 1 min | 10x faster |
| Asset creation | 5 min | 30 sec | 10x faster |
| Invoice creation | 10 min | 1 min | 10x faster |
| **Total Sandbox** | **3-6 months** | **6-8 hours** | **100x faster** |

---

## 🎓 Training Your Team

### Week 1: Onboarding (8 personas)
- Day 1: CSRs (Request/Quote AI)
- Day 2: Sales Reps (Quote/Project AI)
- Day 3: Dispatchers (Project AI + automation)
- Day 4: Field Techs (Asset AI + mobile forms)
- Day 5: Accountants (Invoice AI)

### Week 2-4: Adoption
- Set 80% AI adoption target
- Track metrics (time savings, data quality)
- Refine prompts based on team feedback
- Celebrate wins

---

## 📚 Reference Documents

**Created in This Session**:
1. `AI_PROMPTS_BEST_PRACTICES.md` - All AI prompts with examples
2. `ROLE_BASED_AI_WORKFLOWS.md` - Persona-specific workflows
3. `AI_EFFICIENCY_PATTERNS.md` - Training exercises
4. `WORKFLOW_PAYMENT_DEPENDENCY_MAP.md` - Build sequence rules

**Use These for**:
- Customer training
- Team onboarding
- Troubleshooting
- Replication at other companies

---

## 🚀 What You've Accomplished

**In 6-8 hours, you've built**:
- Production-ready MEP contractor management system
- 20 demo clients with realistic data
- 50+ templates covering all trades
- 10 automations handling repetitive tasks
- 8 persona-based Hubs for role-specific workflows
- Complete AI-first operational playbook

**Business Value**:
- **10x faster** data entry across all roles
- **$50K+ value** in saved setup time (vs. 3-6 month manual build)
- **Replicable** for unlimited contractors
- **Scalable** operations (2x workload, same headcount)

---

## ⚡ Quick Reference: AI Prompts

**Copy/paste these prompts to build your sandbox fast**:

### Create Project:
```
[Service type] for [customer name] in [location]. [Equipment details]. [Service plan]. [Work performed]. Completed [date]. Total: $[amount].
```

### Create Asset:
```
[Equipment type] [capacity], model [model], [age] years old. Serial [serial]. Installed [year] at [customer] [location]. [Technical specs]. Expected lifetime [years]. [Status], [service plan].
```

### Create Invoice:
```
Invoice [customer] for [service] completed [date]. [Work performed with technical details]. Total: $[amount]. Payment terms: [Net 30/Due on receipt].
```

### Create Form:
```
Create [form type] for [trade/compliance standard]. Include: [comma-separated field list]. Add signature capture and next inspection due date.
```

---

**Last Updated**: 2025-12-21
**Status**: Production-ready cookbook
**Time to Complete**: 6-8 hours
**Support**: Use reference docs in `/docs` folder for detailed prompts and examples

---

**🎯 Your sandbox is now ready for customer demos, team training, and sales presentations!**
