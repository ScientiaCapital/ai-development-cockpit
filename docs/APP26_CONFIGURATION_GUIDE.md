# APP26 - Complete Coperniq Configuration Guide

**Created**: 2025-12-21
**Purpose**: Map every Company Settings section and explain why it needs to be configured for MEP contractors

---

## Overview

Coperniq Company Settings has **24 configuration sections** across 4 categories:
1. **Company Settings** (6) - Team structure, notifications, communication
2. **Properties** (3) - Custom fields for Clients, Requests, Projects
3. **Process Studio** (8) - Workflows, templates, payment structures, automations
4. **Configure** (7) - Labels, catalog, service plans, systems, integrations

**This guide documents**: What each section is, why it matters for APP26, and configuration priorities.

---

## Section 1: Company Settings (6 sections)

### 1. General
**URL**: /112/company/general
**Purpose**: Company identity, branding, business information
**Why It Matters for APP26**:
- Company name, logo, contact info appear on customer-facing documents (invoices, proposals, portal)
- Timezone affects scheduling, work order due dates, automation triggers
- Business type (LLC, Corp) affects tax settings and legal documents

**Configuration Priority**: HIGH
**Required For**: Professional customer communications, accurate scheduling

**What to Configure**:
- [ ] Company name: "Coperniq Energy" (or actual contractor name)
- [ ] Logo upload (appears on invoices, proposals, customer portal)
- [ ] Primary phone/email for customer communications
- [ ] Business address (appears on invoices, compliance docs)
- [ ] Timezone (affects all scheduling and automations)
- [ ] Tax ID/License numbers (for compliance and invoicing)

---

### 2. Roles
**URL**: /112/company/roles
**Purpose**: Define permission levels for team members (Admin, Manager, Technician, etc.)
**Why It Matters for APP26**:
- MEP contractors need role-based access: Office staff ≠ Field techs ≠ Sales reps
- Protects sensitive data (financials, customer PII, pricing)
- Enables proper workflow approvals (Manager approves estimates, Admin approves invoices)

**Configuration Priority**: HIGH
**Required For**: Team security, workflow approvals, data protection

**What to Configure**:
- [ ] **Admin** role: Full access (owner, operations manager)
- [ ] **Project Manager** role: Project/client/work order access, no financial settings
- [ ] **Technician** role: Field work orders, time tracking, no pricing visibility
- [ ] **Sales Rep** role: Leads, requests, proposals, no cost visibility
- [ ] **Accountant** role: Financial docs, invoices, bills, no field ops
- [ ] **Customer Service** role: Clients, requests, scheduling, no financials

---

### 3. Members
**URL**: /112/company/users
**Purpose**: Invite team members, assign roles, manage user accounts
**Why It Matters for APP26**:
- Assign real team members to roles defined in #2
- Track who created/modified records (audit trail)
- Enable @mentions in work orders and projects

**Configuration Priority**: MEDIUM
**Required For**: Multi-user collaboration, accountability

**What to Configure**:
- [ ] Invite all team members with correct roles
- [ ] Verify email addresses for notification delivery
- [ ] Set user status (Active/Inactive)
- [ ] Configure user permissions per role

---

### 4. Teams
**URL**: /112/company/teams
**Purpose**: Group users into teams (Install Crew 1, Service Techs, Sales Team)
**Why It Matters for APP26**:
- Assign work orders to teams instead of individuals
- Schedule crew-based work (2-person install teams, 4-person commercial jobs)
- Track team performance metrics

**Configuration Priority**: MEDIUM
**Required For**: Multi-person jobs, crew scheduling, team-based dispatch

**What to Configure**:
- [ ] **Install Crew 1**: 2-3 installers for residential HVAC
- [ ] **Install Crew 2**: Commercial MEP team
- [ ] **Service Techs**: Reactive service calls
- [ ] **PM Techs**: Preventive maintenance visits
- [ ] **Emergency Response**: On-call rotation for SLA contracts
- [ ] **Sales Team**: Lead follow-up and proposal generation

---

### 5. Notifications
**URL**: /112/company/notifications
**Purpose**: Configure email/SMS notifications for team members and customers
**Why It Matters for APP26**:
- Trigger notifications from automations (e.g., "Emergency WO created → SMS on-call tech")
- Keep customers informed (work order completion, invoice ready, service reminder)
- Alert managers to issues (negative review, late project, SLA violation)

**Configuration Priority**: HIGH
**Required For**: Automation workflows, customer communication, SLA monitoring

**What to Configure**:
- [ ] **Work Order Notifications**: Assign/reassign/complete → notify assignee
- [ ] **Project Notifications**: Status change, milestone completion → notify PM
- [ ] **Invoice Notifications**: Created, sent, paid, overdue → notify accounting
- [ ] **Customer Notifications**: Work order scheduled, completed, invoice ready
- [ ] **Emergency Notifications**: SMS to on-call tech for emergency WOs
- [ ] **SLA Notifications**: Approaching violation, violation occurred → notify manager

---

### 6. Emails & Phones
**URL**: /112/company/emails-and-phones
**Purpose**: Configure company email addresses and phone numbers for sending/receiving
**Why It Matters for APP26**:
- Automations need "From" addresses (e.g., "No Reply <noreply@coperniq.io>")
- Inbound emails create requests (customer sends to service@contractor.com → creates request)
- SMS integration for customer reminders and tech dispatch

**Configuration Priority**: HIGH
**Required For**: Email automations, inbound request creation, SMS notifications

**What to Configure**:
- [ ] **No Reply Email**: noreply@contractor.com (for automated emails)
- [ ] **Service Email**: service@contractor.com (inbound request creation)
- [ ] **Sales Email**: sales@contractor.com (lead notifications)
- [ ] **Accounting Email**: billing@contractor.com (invoice delivery)
- [ ] **Main Phone**: (555) 123-4567 (customer communications)
- [ ] **Emergency Phone**: (555) 999-8888 (24/7 emergency dispatch)

---

## Section 2: Properties (3 sections)

### 7. Client Properties
**URL**: /112/company/properties/client
**Purpose**: Custom fields for client records (e.g., "Preferred Tech", "Service Plan Tier", "HOA Name")
**Why It Matters for APP26**:
- Track MEP-specific client info not in default fields
- Enable filtering and reporting (e.g., "All clients with Gold service plan")
- Populate proposal templates with custom data

**Configuration Priority**: MEDIUM
**Required For**: Advanced client segmentation, custom reporting, proposal automation

**What to Configure** (Examples):
- [ ] **Service Plan Tier**: Dropdown (Bronze, Silver, Gold, Platinum)
- [ ] **Preferred Tech**: Lookup (assign favorite tech for service calls)
- [ ] **Equipment Owner**: Radio (Customer, Contractor) - for EaaS tracking
- [ ] **HOA/Property Manager**: Text - for multi-family properties
- [ ] **SLA Type**: Dropdown (Standard, Priority, Mission Critical)
- [ ] **Annual Contract Value**: Currency - for enterprise accounts

---

### 8. Request Properties
**URL**: /112/company/properties/request
**Purpose**: Custom fields for sales requests/leads (e.g., "Lead Source", "Estimated Value", "Urgency")
**Why It Matters for APP26**:
- Qualify leads based on custom criteria
- Track lead sources for marketing ROI
- Prioritize emergency vs. routine requests

**Configuration Priority**: MEDIUM
**Required For**: Lead qualification, sales pipeline management, emergency triage

**What to Configure** (Examples):
- [ ] **Lead Source**: Dropdown (Google, Referral, Cold Call, Emergency Outage)
- [ ] **Estimated Project Value**: Currency - for sales forecasting
- [ ] **Urgency Level**: Dropdown (Emergency, Urgent, Routine)
- [ ] **Equipment Type**: Dropdown (HVAC, Plumbing, Electrical, Multi-Trade)
- [ ] **Decision Timeline**: Dropdown (Immediate, 30 days, 90 days, Long-term)
- [ ] **Competitor Comparison**: Checkbox (ServiceTitan, Housecall Pro, FieldEdge)

---

### 9. Project Properties
**URL**: /112/company/properties/project
**Purpose**: Custom fields for projects (e.g., "Permit Number", "Inspection Date", "Warranty Expiration")
**Why It Matters for APP26**:
- Track compliance requirements (NEC, NFPA, EPA 608 cert numbers)
- Monitor project-specific SLAs and milestones
- Capture performance data for ESPC and EaaS contracts

**Configuration Priority**: HIGH
**Required For**: Compliance tracking, SLA monitoring, performance contracts

**What to Configure** (Examples):
- [ ] **Permit Number**: Text - required for electrical, plumbing, HVAC work
- [ ] **Inspection Date**: Date - track AHJ final inspection
- [ ] **Warranty Expiration**: Date - trigger renewal reminders
- [ ] **BTU Meter ID**: Text - for EaaS outcome tracking
- [ ] **Baseline Energy Usage**: Number - for ESPC gain-sharing calculations
- [ ] **SLA Response Time**: Number (hours) - for mission-critical contracts
- [ ] **Performance Bonus/Penalty**: Currency - for outcome-based contracts

---

## Section 3: Process Studio (8 sections)

### 10. Project Workflows
**URL**: /112/company/studio/workflows/project-workflows
**Purpose**: Define project lifecycle phases (Lead → Design → Install → Closeout → O&M)
**Why It Matters for APP26**:
- **CRITICAL**: Payment structures map milestones to workflow phases
- O&M workflows enable recurring revenue models (EaaS, SLA, service agreements)
- Project workflows enable one-time installations with milestone billing

**Configuration Priority**: CRITICAL
**Required For**: Payment structures, milestone billing, lifecycle management

**Status**: **11 workflows built** (3 demo + 8 MEP)
**Next Steps**: Build remaining 2 O&M workflows (Solar, Industrial)

---

### 11. Request Workflows
**URL**: /112/company/studio/workflows/request-workflows
**Purpose**: Define sales pipeline stages (Raw Lead → Qualified → Proposal → Won/Lost)
**Why It Matters for APP26**:
- Track lead conversion rates by stage
- Automate lead assignment and follow-up (automation: "Request created → Assign to sales rep")
- Emergency triage workflows (Power Outage Response, Generator Sales Fast-Track)

**Configuration Priority**: HIGH
**Required For**: Sales pipeline management, lead automation, emergency response

**Status**: **10 workflows built** (2 demo + 8 MEP)
**Next Steps**: Test automation triggers for request phase changes

---

### 12. Field Work Orders
**URL**: /112/company/studio/templates/field-wo-templates
**Purpose**: Checklists for technicians to complete on-site (AC Maintenance, Panel Upgrade, Fire Sprinkler Inspection)
**Why It Matters for APP26**:
- Ensure compliance (EPA 608, NEC 2023, NFPA 25) with built-in checklists
- Capture field data (refrigerant readings, panel photos, test results)
- Standardize service quality across all techs

**Configuration Priority**: HIGH
**Required For**: Compliance, quality control, field data capture

**Status**: **68 templates** (47 existing + 21 MEP)
**Next Steps**: Build remaining trade-specific WOs (solar, roofing, specialized HVAC)

---

### 13. Office Work Orders
**URL**: /112/company/studio/templates/office-wo-templates
**Purpose**: Internal workflows for office staff (Permit Application, Load Calc Review, Invoice Processing)
**Why It Matters for APP26**:
- Coordinate office-to-field handoffs (Permit approved → Create install WO)
- Track administrative tasks (PO processing, lien waiver collection, warranty registration)
- Ensure back-office efficiency

**Configuration Priority**: MEDIUM
**Required For**: Office-field coordination, administrative efficiency

**Status**: **85 templates** (71 existing + 14 MEP)
**Next Steps**: Build MEP-specific office WOs (e.g., "SREC Application Tracking")

---

### 14. Forms
**URL**: /112/company/studio/templates/form-templates
**Purpose**: Data capture forms (Customer Satisfaction Survey, Site Assessment, Inspection Checklists)
**Why It Matters for APP26**:
- Collect structured data (Furnace Safety Inspection form with pass/fail checklist)
- Enable reporting and analytics (NPS scores, deficiency trends)
- Compliance documentation (NFPA 25 sprinkler inspection reports)

**Configuration Priority**: MEDIUM
**Required For**: Data collection, compliance reporting, customer feedback

**Status**: **TBD** (need to audit)
**Next Steps**: Build trade-specific compliance forms (EPA 608 Refrigerant Log, NEC Load Calc Form)

---

### 15. Payment Structures
**URL**: /112/company/studio/templates/payment-structure-templates
**Purpose**: Define milestone billing structures (30/30/30/10, 100% M1 O&M, ESPC Gain-Sharing)
**Why It Matters for APP26**:
- **CRITICAL**: This is Coperniq's competitive advantage over ServiceTitan
- Enable innovative revenue models (EaaS, SLA-based, performance contracts)
- Map payment milestones to project phases for automated invoicing

**Configuration Priority**: CRITICAL
**Required For**: Innovative business models, automated invoicing, competitive differentiation

**Status**: **12 structures** (1 demo + 11 MEP)
**Next Steps**: Complete remaining 4 innovative structures (Solar O&M, Outcome Comfort, Industrial MC/RAV, Data Center)

---

### 16. Document Requests
**URL**: /112/company/studio/templates/document-request-templates
**Purpose**: Request documents from customers/vendors (Insurance Certificate, W-9, HOA Approval)
**Why It Matters for APP26**:
- Automate compliance document collection
- Track missing documents that block project progress
- Ensure all required paperwork before work begins

**Configuration Priority**: LOW
**Required For**: Document compliance, vendor management

**Status**: **TBD** (need to audit)
**Next Steps**: Build MEP-specific document requests (Electrical Permit, Manufacturer Warranty)

---

### 17. Automations
**URL**: /112/company/studio/automations
**Purpose**: Trigger actions based on events (Request created → Assign to sales rep, Invoice paid → Send receipt)
**Why It Matters for APP26**:
- Reduce manual work (auto-create WOs, auto-send emails, auto-update statuses)
- Enforce SLAs (Emergency WO → SMS on-call tech within 5 minutes)
- Enable scalability (10 techs can service 200 customers with automation)

**Configuration Priority**: HIGH
**Required For**: Operational efficiency, SLA enforcement, scalability

**Status**: **70+ total** (67+ existing + 3 MEP)
**Next Steps**: Build remaining 7 MEP automations (Payment Received, Permit Approved, Emergency Dispatch, etc.)

---

## Section 4: Configure (7 sections)

### 18. Labels
**URL**: /112/company/labels
**Purpose**: Tag records for filtering/grouping (e.g., "Priority Customer", "Emergency Response", "Solar EPC")
**Why It Matters for APP26**:
- Segment clients by service plan tier (Bronze, Silver, Gold)
- Filter work orders by urgency (Emergency, Routine, PM)
- Track project types for analytics (Residential, Commercial, Industrial)

**Configuration Priority**: MEDIUM
**Required For**: Filtering, reporting, segmentation

**What to Configure**:
- [ ] **Service Plan Tiers**: Bronze, Silver, Gold, Platinum
- [ ] **Customer Types**: Residential, Commercial, Industrial, Government
- [ ] **Project Types**: Install, Retrofit, Service Call, PM Visit, Emergency
- [ ] **Urgency Levels**: Emergency, Urgent, Routine
- [ ] **Equipment Types**: HVAC, Plumbing, Electrical, Fire, Solar, Multi-Trade

---

### 19. Catalog
**URL**: /112/company/catalog
**Purpose**: Product/service catalog (equipment SKUs, service offerings, pricing)
**Why It Matters for APP26**:
- Build proposals and invoices with standardized items
- Track inventory (HVAC units, water heaters, electrical panels)
- Maintain pricing consistency across all quotes

**Configuration Priority**: HIGH
**Required For**: Proposal generation, inventory management, pricing consistency

**What to Configure**:
- [ ] **Equipment Catalog**: HVAC units, water heaters, panels, etc. with SKU, cost, price
- [ ] **Service Offerings**: AC Tune-Up, PM Visit, Emergency Service (hourly rates)
- [ ] **Materials**: Refrigerant, copper, wire, etc. with unit pricing
- [ ] **Packages**: Bronze/Silver/Gold service plan bundles

---

### 20. Service Plans
**URL**: /112/company/service-plans
**Purpose**: Define recurring service agreement offerings (HVAC Bronze, Silver, Gold)
**Why It Matters for APP26**:
- Create predictable recurring revenue (MRR)
- Attach service plans to clients for automatic renewal billing
- Trigger PM work orders based on service plan schedules

**Configuration Priority**: HIGH
**Required For**: Recurring revenue, client retention, automated PM scheduling

**What to Configure**:
- [ ] **HVAC Bronze**: $360/year, annual tune-up
- [ ] **HVAC Silver**: $600/year, bi-annual tune-up
- [ ] **HVAC Gold**: $1,200/year, quarterly PM + priority service
- [ ] **HVAC Platinum**: $2,400/year, quarterly PM + 24/7 priority
- [ ] **Commercial RTU**: $2,400/year per unit, quarterly PM
- [ ] **Mission-Critical SLA**: Custom pricing, 99.9%+ uptime guarantee

---

### 21. Systems
**URL**: /112/company/systems
**Purpose**: Define monitored system types (solar array, HVAC system, building automation)
**Why It Matters for APP26**:
- Track solar system performance (kWh generation, inverter uptime)
- Monitor HVAC equipment (BTU output, refrigerant levels for EaaS)
- Capture IoT sensor data for predictive maintenance

**Configuration Priority**: MEDIUM (HIGH for solar/EaaS contractors)
**Required For**: Performance monitoring, EaaS outcome tracking, predictive maintenance

**What to Configure**:
- [ ] **Solar PV System**: Track kWh generation, inverter status, panel count
- [ ] **HVAC System**: Track BTU output, runtime hours, energy consumption
- [ ] **Building Automation System**: Integration with BACnet/Modbus for commercial
- [ ] **Commercial Refrigeration**: Track temp, compressor runtime, refrigerant level
- [ ] **Generator**: Track fuel level, runtime hours, battery voltage

---

### 22. Geolocation
**URL**: /112/company/geolocation
**Purpose**: Define service areas, territories, dispatch zones
**Why It Matters for APP26**:
- Assign work orders to nearest available tech
- Calculate travel time for scheduling
- Track service area coverage for marketing

**Configuration Priority**: LOW
**Required For**: Optimized dispatch, territory management

**What to Configure**:
- [ ] **Service Territories**: North, South, East, West regions
- [ ] **Dispatch Zones**: 20-mile radius circles around office locations
- [ ] **Coverage Areas**: Zip codes or counties serviced

---

### 23. Integrations
**URL**: /112/company/integrations
**Purpose**: Connect to external tools (QuickBooks, Stripe, Twilio, Google Calendar)
**Why It Matters for APP26**:
- Sync invoices to QuickBooks for accounting
- Process payments via Stripe or Square
- Send SMS via Twilio for customer reminders
- Sync work orders to Google Calendar

**Configuration Priority**: HIGH (if using external tools)
**Required For**: Accounting sync, payment processing, SMS delivery, calendar sync

**What to Configure**:
- [ ] **QuickBooks/NetSuite**: Invoice and payment sync
- [ ] **Stripe/Square**: Payment processing
- [ ] **Twilio**: SMS delivery for notifications
- [ ] **Google Calendar**: Work order scheduling sync
- [ ] **Zapier**: Connect to 1,000+ other tools

---

### 24. Portal
**URL**: /112/company/portal
**Purpose**: Customer self-service portal (view invoices, schedule service, request quotes)
**Why It Matters for APP26**:
- Reduce inbound calls (customers self-schedule service)
- Improve customer experience (24/7 access to account info)
- Enable self-service payments (reduce collections overhead)

**Configuration Priority**: MEDIUM
**Required For**: Customer self-service, payment collection, operational efficiency

**What to Configure**:
- [ ] **Portal Branding**: Logo, colors, company name
- [ ] **Customer Access**: Enable invoice viewing, payment submission
- [ ] **Service Request**: Allow customers to create service requests
- [ ] **Scheduling**: Let customers book open appointment slots
- [ ] **Document Sharing**: Share proposals, contracts, warranties

---

## Configuration Priorities for APP26

### CRITICAL (Build First - Blockers)
1. **Project Workflows** - Payment structures depend on these existing
2. **Payment Structures** - Coperniq's competitive advantage
3. **Automations** - Operational efficiency and SLA enforcement

### HIGH (Build Second - Core Operations)
4. **General** - Company identity and branding
5. **Roles** - Team security and permissions
6. **Notifications** - Customer communication and SLA alerts
7. **Emails & Phones** - Automation "From" addresses
8. **Request Workflows** - Sales pipeline management
9. **Field Work Orders** - Compliance and quality control
10. **Project Properties** - Compliance tracking (permit numbers, SLAs)
11. **Catalog** - Pricing consistency and proposal generation
12. **Service Plans** - Recurring revenue foundation
13. **Integrations** - Accounting/payment sync

### MEDIUM (Build Third - Enhanced Functionality)
14. **Members** - Multi-user collaboration
15. **Teams** - Crew-based scheduling
16. **Client Properties** - Advanced segmentation
17. **Request Properties** - Lead qualification
18. **Office Work Orders** - Administrative efficiency
19. **Forms** - Data collection and reporting
20. **Labels** - Filtering and segmentation
21. **Systems** - Performance monitoring (solar, EaaS)
22. **Portal** - Customer self-service

### LOW (Build Last - Nice to Have)
23. **Document Requests** - Document compliance
24. **Geolocation** - Territory management

---

## APP26 Setup Sequence

### Week 1: Foundation
Day 1-2: **Company Settings** (General, Roles, Emails, Notifications)
Day 3-4: **Process Studio** (Project Workflows, Payment Structures)
Day 5: **Automations** (10 MEP automations)

### Week 2: Operations
Day 1-2: **Field/Office Work Orders** (build remaining templates)
Day 3: **Forms** (compliance checklists)
Day 4-5: **Properties** (Client, Request, Project custom fields)

### Week 3: Revenue
Day 1-2: **Service Plans** (Bronze/Silver/Gold offerings)
Day 3-4: **Catalog** (equipment SKUs, service pricing)
Day 5: **Integrations** (QuickBooks, Stripe)

### Week 4: Customer Experience
Day 1-2: **Portal** (customer self-service setup)
Day 3: **Labels** (segmentation and filtering)
Day 4-5: **Demo Data** (20 strategic clients with full lifecycle)

---

## Success Metrics

### Week 1 Complete:
- [ ] All 11 project workflows tested
- [ ] All 11 payment structures mapped correctly
- [ ] 10 MEP automations active

### Week 2 Complete:
- [ ] 100+ work order templates available
- [ ] 20+ compliance forms built
- [ ] Custom properties configured

### Week 3 Complete:
- [ ] 6+ service plans active
- [ ] 500+ catalog items loaded
- [ ] QuickBooks sync operational

### Week 4 Complete:
- [ ] Customer portal live
- [ ] 20 demo clients with full data
- [ ] APP26 playbook published

---

**Last Updated**: 2025-12-21
**Next Step**: Build remaining 2 O&M workflows → Update payment structures → Complete automations

---

## Related Documents

- `APP26_ARCHITECTURE.md` - Dependency graph and build sequence
- `AI_PROMPTS_BEST_PRACTICES.md` - Exact prompts for each template
- `DEMO_ENVIRONMENT_PLAN.md` - 20 strategic demo clients
- `QUICK_BUILD_REFERENCE.md` - Fast manual build specs
