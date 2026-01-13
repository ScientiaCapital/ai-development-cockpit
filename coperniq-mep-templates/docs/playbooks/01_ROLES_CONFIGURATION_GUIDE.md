# Roles Configuration Guide - Company 63 (Energy Hub)

**Created**: 2025-12-22
**Company**: Company 63 (Energy Hub) - Blank Slate Reference Implementation
**Purpose**: Complete guide for configuring Roles, Members, and Teams from scratch
**Target ICP**: $5-50M Solar + Clean Energy + MEP Contractors (Universal - ALL trades)

---

## Executive Summary

This guide documents the complete configuration of Roles (Section 2), Members (Section 3), and Teams (Section 4) for Company 63 - a **150-person enterprise-scale organization** demonstrating Coperniq at "$25-50M operation" level.

**Why 150 Employees?**: Shows "table stakes" for $10M+ contractors - proves Coperniq can handle multi-regional operations, full org depth (C-Suite → VPs → Regional Managers → Supervisors → Foremen → Techs), and complete departmental maturity.

**Universal Framework**: This structure works for ANY trade mix (HVAC, Plumbing, Electrical, Solar, Fire Protection, Roofing, Controls, Refrigeration), ANY market (Residential, C&I, Industrial, Utility-Scale), ANY size ($1M to $50M+), and ANY business model (Service, Install, EPC, EaaS, O&M).

---

## Section 2: Roles (5 minutes)

### URL
https://app.coperniq.io/63/company/roles

### The 8 Universal Personas

Every field service business has these 8 core personas, regardless of trade or size:

#### 1. **Owner / Executive** 🏢
- **Who**: CEO, President, Owner, VP Operations, General Manager
- **Primary Workflows**: Business health monitoring, strategic planning, financial oversight
- **Day Starts With**: Business health dashboard (revenue MTD, margin %, cash flow)
- **Key Decisions**: Hiring, expansion, pricing strategy, capital investments
- **Platform**: Desktop-first (multi-monitor setup)

#### 2. **Sales Manager / Sales Rep** 💼
- **Who**: Sales Manager, Estimator, Business Development Manager, Account Manager
- **Primary Workflows**: Lead qualification → Proposal → Close → Handoff to PM
- **Day Starts With**: Follow-up queue (who to call today, overdue proposals)
- **Key Decisions**: Which leads to prioritize, pricing strategy, close rates
- **Platform**: Hybrid (desktop for proposals, mobile for site visits)

#### 3. **Dispatcher / Scheduler** 🚚
- **Who**: Dispatcher, Operations Coordinator, Scheduler, Service Manager
- **Primary Workflows**: WO assignment → Tech dispatch → Emergency routing → PM scheduling
- **Day Starts With**: Today's schedule (all techs, all jobs, map view)
- **Key Decisions**: Tech assignment, priority escalation, schedule optimization
- **Platform**: Hybrid (desktop in office, tablet on dispatch floor)

#### 4. **Field Technician** 🔧
- **Who**: Service Technician, Installer, Foreman, Field Crew
- **Primary Workflows**: Clock in → Job completion → Form submission → Clock out
- **Day Starts With**: My work orders today (sorted by appointment time)
- **Key Decisions**: Parts needed, job duration, callback risks
- **Platform**: Mobile-first (phone/tablet on-site, one-hand usability)

#### 5. **Project Manager** 📋
- **Who**: Project Manager, Construction Manager, Project Coordinator, Foreman
- **Primary Workflows**: Project kickoff → Phase tracking → Milestone invoicing → Closeout
- **Day Starts With**: Active projects (on-budget?, on-schedule?, permits pending?)
- **Key Decisions**: Resource allocation, change orders, subcontractor coordination
- **Platform**: Desktop-first (need detail, multiple windows)

#### 6. **Accountant / Bookkeeper** 🧾
- **Who**: Accountant, Controller, AR/AP Clerk, Office Manager
- **Primary Workflows**: Job completion → Invoice creation → Payment tracking → Collections
- **Day Starts With**: Invoices to send (>7 days overdue = priority)
- **Key Decisions**: Collection timing, payment plans, credit holds
- **Platform**: Desktop-first (spreadsheet-style tables, batch operations)

#### 7. **Service Manager / O&M Coordinator** 🎫
- **Who**: Service Manager, Maintenance Coordinator, Renewal Specialist, Customer Success
- **Primary Workflows**: Service plan enrollment → PM scheduling → Renewal → Upsell
- **Day Starts With**: PM visits due this week, renewals expiring this quarter
- **Key Decisions**: Service plan pricing, PM frequency, churn prevention
- **Platform**: Hybrid (desktop for planning, mobile for customer meetings)

#### 8. **Customer Service Rep / Receptionist** 📞
- **Who**: CSR, Receptionist, Call Center Agent, Customer Service
- **Primary Workflows**: Inbound call → Request creation → Quote → Schedule → Follow-up
- **Day Starts With**: Inbound requests today (priority queue, SLA timers)
- **Key Decisions**: Urgency triage, tech availability, quote approval
- **Platform**: Desktop-first (need phone + CRM simultaneously)

---

### Mapping to Coperniq's 4 Default Roles

**Decision**: Use Coperniq's 4 default roles WITHOUT customization - they map perfectly to our 8 personas.

| Persona | Coperniq Role | Why This Role |
|---------|---------------|---------------|
| Owner/Executive | Admin | Needs full company settings access |
| Sales Manager/Rep | Sales | Perfect match - leads, quotes, projects |
| Dispatcher/Scheduler | Manager | Needs to assign WOs, manage schedule |
| Field Technician | Worker | Only needs assigned WOs, mobile-first |
| Project Manager | Manager | Manages projects, creates WOs |
| Accountant/Bookkeeper | Manager | Needs invoice access, financial reports |
| Service Manager/O&M | Manager | Manages service plans, PM scheduling |
| CSR/Receptionist | Worker | Creates requests/quotes, limited access |

**Coperniq's Default 4 Roles** (DO NOT customize):
1. **Admin** - Full access to everything (company settings, all data, all features)
2. **Manager** - Can manage projects, tasks, invoices (no company settings access)
3. **Worker** - Can view/complete assigned work orders (limited backend access)
4. **Sales** - Can create leads, quotes, projects (limited backend access)

**Permissions Automatically Handled by Coperniq**:

| Role | Can Create | Can View | Can Edit | Can Delete |
|------|-----------|----------|----------|------------|
| Admin | Everything | Everything | Everything | Everything |
| Manager | Projects, WOs, Invoices | All assigned + team | All assigned + team | None (archive only) |
| Sales | Leads, Quotes, Projects | All assigned | All assigned | None |
| Worker | Assets, Forms | Assigned WOs only | Assigned WOs only | None |

**Action**: Keep default role names. No customization needed. Move to Section 3 (Members).

**Time Taken**: 5 minutes (review defaults, confirm no changes needed)

---

## Section 3: Members (15 minutes with CSV import)

### URL
https://app.coperniq.io/63/company/members

### 150-Person Enterprise-Scale Organization

**Company Profile**:
- **Name**: Energy Hub (Company ID: 63)
- **Trades**: Mechanical (HVAC), Electrical, Plumbing (MEP) + Solar EPC + Battery Storage
- **Markets**: Residential Service + Commercial Install + C&I Projects + Utility-Scale Solar
- **Revenue**: $25-50M (enterprise-scale demonstration)
- **Scale**: 150 employees across 3 regional locations
- **Labor**: 80% self-perform, 20% subcontractors
- **Business Mix**: 40% service calls, 30% installs, 20% solar EPC, 10% O&M contracts

### Organization Structure by Department

#### **Executive Leadership** (8 - Admin role)
- C-Suite + VPs: CEO, VP Operations, CFO, VP Sales, VP Service, VP Project Management, VP Safety, VP Strategy

#### **Sales & Business Development** (28 - Sales role)
- **Sales Reps** (20): Residential, Commercial, Solar, Inside Sales across 3 regions
- **Estimators** (8): Senior Estimators, Takeoff Specialists

#### **Regional/Branch Management** (12 - Manager role)
- 3 regions × 4 managers each: Operations Manager, Service Manager, Sales Manager, Admin Manager

#### **Dispatch & Scheduling** (8 - Manager role)
- Regional dispatchers (3 regions) + Central dispatch coordinator

#### **Project Management** (15 - Manager role)
- **Commercial PMs** (6): Large commercial projects, C&I work
- **Residential PMs** (5): Residential installs, smaller projects
- **Solar PMs** (4): Solar EPC, utility-scale, interconnection

#### **Accounting & Finance** (12 - Manager role)
- Controllers (2), AR/AP (4), Payroll (2), Financial Analysts (4)

#### **Safety & Compliance** (6 - Manager role)
- Safety Officers, QA/QC, Compliance Managers

#### **Field Leadership** (18 - Manager role)
- **Lead Supervisors** (4): HVAC, Electrical, Plumbing, Solar
- **Foremen** (14): Regional foremen across all trades

#### **Customer Service & Admin** (10 - Worker role)
- CSRs (7), Receptionists, Office Administrators

#### **Warehouse & Procurement** (8 - Worker/Manager role)
- Warehouse Managers, Parts Coordinators

#### **Field Technicians** (70 - Worker role)
- **HVAC Techs** (25): Techs, Apprentices, Helpers
- **Electrical Techs** (20): Electricians, Solar PV, Apprentices
- **Plumbing Techs** (15): Plumbers, Apprentices, Helpers
- **Solar Installers** (10): PV Installers, Roofers

**Total: 150 employees**

### Breakdown by Coperniq Role

| Coperniq Role | Count | Percentage |
|---------------|-------|------------|
| Admin | 8 | 5.3% |
| Sales | 28 | 18.7% |
| Manager | 79 | 52.7% |
| Worker | 35 | 23.3% |
| **TOTAL** | **150** | **100%** |

### Geographic Distribution (Multi-Regional)

| Region | Employees | Focus |
|--------|-----------|-------|
| Region 1 - Metro Central (HQ) | 60 | Executive, Accounting, Central Dispatch, All trades |
| Region 2 - North Suburbs | 45 | Commercial focus, Branch operations |
| Region 3 - South/Industrial | 45 | Industrial/C&I focus, Branch operations |
| **TOTAL** | **150** | - |

### Manual Member Creation Process

**CRITICAL DISCOVERY #1**: Coperniq Company 63 does NOT support CSV import for Members. All 150 members must be created manually one-by-one through the UI.

**CRITICAL DISCOVERY #2**: Coperniq DOES support CSV import via Flatfile for Projects and Requests. Customers migrating from ServiceTitan/FieldEdge/Jobber can bulk import existing jobs and leads.

**Why This Matters for BYOS**: This documents the REAL time investment required. Members = manual (time-intensive). Projects/Requests = CSV import (fast). Customers need to know actual effort, not ideal scenarios.

#### Reference Data Source
**File Path**: `/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/coperniq-mep-templates/data/company-63-members.csv`

Use this CSV as your reference to copy-paste data during manual creation. Open it in Excel/Numbers/Google Sheets for easy reference.

#### Step-by-Step Manual Creation (Per Member)

1. Navigate to https://app.coperniq.io/63/company/members
2. Click "+ Add Member" or "Create New Member" button
3. Fill in form fields:
   - **Email**: sarah.chen@energyhub.com (copy from CSV)
   - **First Name**: Sarah (copy from CSV)
   - **Last Name**: Chen (copy from CSV)
   - **Role**: Select from dropdown (Admin, Manager, Worker, Sales)
   - **Phone**: +1-555-0101 (copy from CSV)
   - **Status**: Active (checkbox or toggle)
4. Click "Save" or "Create Member"
5. Wait for confirmation
6. Move to next member, repeat

**Optimization Tips**:
- Keep CSV open in split-screen for easy copy-paste
- Use keyboard shortcuts (Tab to move between fields, Enter to save)
- Create members in batches by role (all Admins first, then all Sales, etc.)
- Track time per batch to identify fatigue/slowdown patterns

#### Time Tracking Template (Fill in as you work)

| Batch | Role | Count | Start Time | End Time | Total Minutes | Avg Time/Member |
|-------|------|-------|------------|----------|---------------|-----------------|
| 1 | Admin | 8 | _[Fill]_ | _[Fill]_ | _[Fill]_ | _[Fill]_ |
| 2 | Sales | 28 | _[Fill]_ | _[Fill]_ | _[Fill]_ | _[Fill]_ |
| 3 | Manager (First 20) | 20 | _[Fill]_ | _[Fill]_ | _[Fill]_ | _[Fill]_ |
| 4 | Manager (Next 20) | 20 | _[Fill]_ | _[Fill]_ | _[Fill]_ | _[Fill]_ |
| 5 | Manager (Next 20) | 20 | _[Fill]_ | _[Fill]_ | _[Fill]_ | _[Fill]_ |
| 6 | Manager (Last 19) | 19 | _[Fill]_ | _[Fill]_ | _[Fill]_ | _[Fill]_ |
| 7 | Worker | 35 | _[Fill]_ | _[Fill]_ | _[Fill]_ | _[Fill]_ |
| **TOTAL** | **All** | **150** | - | - | _[Fill]_ | _[Fill]_ |

**Estimated Time**:
- **Optimistic**: 150 members × 1 min = 2.5 hours (if very fast, no errors)
- **Realistic**: 150 members × 1.5 min = 3.75 hours (with occasional typos, form lag)
- **Conservative**: 150 members × 2 min = 5 hours (with breaks, fatigue, distractions)

**Time Taken (Actual)**: _[User fills in after completing all 150 members]_

---

## Section 4: Teams (60-90 minutes)

### URL
https://app.coperniq.io/63/company/teams

### The 11 Teams Structure

**Design Principle**: 4 **Trade Teams** (for dispatch, revenue tracking, crew assignment) + 7 **Functional Teams** (for cross-functional coordination, org-wide initiatives, department operations).

**Why 11 Teams?**:
- **Trade Teams** = Revenue Centers: Filter dispatch by trade, track P&L by trade, regional revenue reporting
- **Functional Teams** = Coordination: Cross-functional meetings, org-wide initiatives, department-level operations
- **No Redundancy**: Each team has clear purpose (dispatch, revenue, coordination, or departmental operations)
- **Cross-Assignment Expected**: Many employees serve on both trade and functional teams

---

### Trade-Based Teams (4 Teams)

#### **Team 1: HVAC Team** (35 members)

**Purpose**: Dispatch filtering, HVAC revenue tracking, multi-region HVAC operations

**Leadership**:
- Frank Mitchell (Lead Supervisor)
- Ashley Moore (Foreman - Region 1)
- Donald Brooks (Foreman - Region 2)
- Todd Sullivan (Foreman - Region 3)

**Dispatchers** (3):
- Carlos Rivera (Region 1)
- Keith Butler (Region 2)
- Albert Patterson (Region 3)

**Field Techs** (25):
- Brian Anderson, Crystal Johnson, Derek Williams, Erica Davis, Felix Garcia, Grace Wilson, Henry Martinez, Isabel Rodriguez, Wesley Scott, Yvonne Torres, Zachary Nguyen, Alexander Murphy, Brianna Rivera, Cody Cooper, Destiny Richardson, Ethan Cox, Faith Howard, Gabriel Ward, Holly Torres, Ivan Peterson, Jasmine Gray, + 4 service techs

**PMs** (4):
- Michelle Roberts, Kimberly Hall, Paul Jenkins, Diana Perry

**Sales** (6):
- Maria Garcia, Brandon Scott, Eric Matthews, Sophia Torres, Ryan Campbell, Christine Howard

**Use Cases**:
- "Show me HVAC Team schedule for today"
- "HVAC Team revenue this quarter"
- "Which HVAC techs are available right now?"

---

#### **Team 2: Electrical Team** (30 members)

**Purpose**: Dispatch filtering, Electrical + Solar PV revenue tracking

**Leadership**:
- Gregory Carter (Lead Supervisor)
- William Jackson (Foreman - Commercial)
- Julia Sanders (Foreman - Residential)
- Terry Flores (Foreman - Solar PV)

**Dispatchers** (3):
- Samantha Kim (Region 1)
- Larry Coleman (Region 2)
- Philip Myers (Region 3)

**Field Techs** (20):
- Jacob Brown, Karen Taylor, Louis Thomas, Monica White, Nathan Harris, Olivia Martin, Patrick Lee, Quentin Walker, Rachel Young, Samuel Allen, Tiffany King, Victor Wright, + 8 electricians/solar installers

**PMs** (4):
- Christopher Yang, Anthony Lewis, Jason Turner, Rebecca Green

**Sales** (4):
- Kevin Lee, Amanda Foster, Jordan Price, Matthew Ward

**Use Cases**:
- "Electrical Team schedule for this week"
- "Electrical Team revenue vs HVAC Team revenue"
- "Available electricians for emergency call"

---

#### **Team 3: Plumbing Team** (22 members)

**Purpose**: Dispatch filtering, Plumbing revenue tracking, service + install operations

**Leadership**:
- Melissa Phillips (Lead Supervisor)
- Jean Washington (Foreman - Service)
- Frances Ford (Foreman - New Construction)

**Dispatchers** (2):
- Carlos Rivera (cross-assigned with HVAC)
- Harold Griffin (Region 2)

**Field Techs** (15):
- + 15 plumbers, apprentices, helpers

**PMs** (3):
- Michelle Roberts (cross-assigned with HVAC)
- Anthony Lewis (cross-assigned with Electrical)
- Sharon Henderson

**Sales** (3):
- Amanda Foster (cross-assigned with Electrical)
- Brandon Scott (cross-assigned with HVAC)
- Natalie Brooks

**Use Cases**:
- "Plumbing Team schedule today"
- "Plumbing Team backflow certifications due"
- "Available plumbers for drain camera job"

---

#### **Team 4: Solar Team** (18 members)

**Purpose**: Solar EPC + Utility-Scale dispatch, interconnection tracking, SREC compliance

**Leadership**:
- Nathan Rodriguez (Lead - Utility-Scale)
- Marcus Thompson (Foreman - C&I)
- Alice Hughes (PM - Residential)

**Dispatchers** (2):
- Samantha Kim (cross-assigned with Electrical)
- Walter Sullivan

**Installers** (10):
- + 10 solar installers, roofers, PV electricians

**PMs** (3):
- Jason Turner, Rebecca Green, Russell Hayes

**Sales** (4):
- James Wilson, Thomas White, Jonathan Bell, Victoria Stewart

**Use Cases**:
- "Solar Team schedule this month"
- "Solar EPC revenue vs service revenue"
- "Which solar projects need interconnection approval?"

---

### Functional Teams (7 Teams)

#### **Team 5: Executive Leadership Team** (8 members)

**Members**: Sarah Chen (CEO), Michael Rodriguez (VP Operations), Jennifer Park (CFO), David Thompson (VP Sales), Lisa Anderson (VP Service), Robert Johnson (VP Project Management), Angela Martinez (VP Safety), Thomas Chen (VP Strategy)

**Purpose**: Weekly executive meetings, strategic planning, board reporting, M&A decisions

**Use Cases**:
- "Executive Team meeting agenda"
- "KPIs for executive review"
- "Board presentation data"

---

#### **Team 6: Sales & Estimating Team** (28 members)

**Sales Reps** (20): All sales personnel across regions
**Estimators** (8): All estimating and takeoff specialists

**Purpose**: Sales meetings, pipeline reviews, quota tracking, cross-selling coordination, proposal management

**Use Cases**:
- "Sales Team quota attainment this quarter"
- "Sales pipeline by rep"
- "Top 10 sales performers this month"

---

#### **Team 7: Dispatch & Operations Coordination Team** (8 members)

**Lead**: Jessica Taylor (Director of Dispatch)
**Dispatchers** (7): Carlos Rivera, Samantha Kim, Keith Butler, Larry Coleman, Harold Griffin, Albert Patterson, Philip Myers

**Purpose**: Daily dispatch coordination, emergency routing, SLA compliance, real-time schedule optimization across 3 regions

**Use Cases**:
- "All dispatchers online status"
- "Emergency calls waiting for assignment"
- "SLA violations today"

---

#### **Team 8: Project Management Team** (15 members)

**Commercial PMs** (6): Large commercial, C&I work
**Residential PMs** (5): Residential installs, smaller projects
**Solar PMs** (4): Solar EPC, utility-scale projects

**Purpose**: PM meetings, project reviews, resource allocation, change order approvals, milestone tracking

**Use Cases**:
- "PM Team capacity this month"
- "Projects over budget by PM"
- "Change orders pending approval"

---

#### **Team 9: Accounting & Finance Team** (12 members)

**Controllers** (2): Patricia Miller, Richard Cooper
**AR/AP** (4): Laura Hernandez, Steven Adams, Kimberly Watson, George Parker
**Payroll** (2): Stephanie Evans, Dennis Bailey
**Analysts** (4): Nancy Foster, Keith Butler, Carolyn James, Raymond Powell

**Purpose**: Month-end close, AR/AP management, payroll processing, financial reporting, budget variance analysis

**Use Cases**:
- "AR aging report for Finance Team review"
- "Accounting Team month-end checklist"
- "Outstanding invoices by analyst"

---

#### **Team 10: Field Leadership & Safety Team** (18 members)

**Lead Supervisors** (4): Frank Mitchell (HVAC), Gregory Carter (Electrical), Melissa Phillips (Plumbing), Nathan Rodriguez (Solar)
**Foremen** (14): All regional foremen across trades

**Purpose**: Weekly safety meetings, crew coordination, workforce planning, training programs, OSHA compliance

**Use Cases**:
- "Field Leadership Team safety incidents this month"
- "Foreman utilization by region"
- "Training compliance by crew"

---

#### **Team 11: Customer Service & Admin Team** (10 members)

**Lead CSR**: Emily Davis
**CSRs** (7): + CSRs, receptionists
**Admins** (2): Office administrators

**Purpose**: Call center coordination, portal management, customer feedback reviews, appointment scheduling

**Use Cases**:
- "CSR Team call volume today"
- "Customer satisfaction scores by CSR"
- "Average call answer time"

---

### Teams Creation Process (Manual UI Work)

#### Step-by-Step (Per Team)

1. Navigate to https://app.coperniq.io/63/company/teams
2. Click "Create New Team" or "+ Add Team"
3. Enter Team Name (e.g., "HVAC Team", "Executive Leadership Team")
4. Enter Team Description (optional - explain purpose)
5. Select Team Members from dropdown:
   - Search by name
   - Multi-select (hold Cmd/Ctrl to select multiple)
   - Add leadership first, then members
6. Click "Save" or "Create Team"
7. Screenshot the completed team roster
8. Move to next team, repeat

**Time Per Team**:
- Small teams (8 members): 3-5 minutes
- Medium teams (15-30 members): 5-8 minutes
- Large teams (35+ members): 8-10 minutes

**Total Time**: 60-90 minutes for all 11 teams

#### Alternative (if Bulk Team Assignment Available)
- Use CSV import if Coperniq supports team membership CSV
- Format: `Team Name, Member Email`
- Import all 11 teams at once

---

## Time Tracking Summary

| Section | Task | Time Estimate | Actual Time |
|---------|------|---------------|-------------|
| **Section 2: Roles** | Review default roles, confirm no changes | 5 min | _[User fills in]_ |
| **Section 3: Members** | Open CSV reference file | 1 min | _[User fills in]_ |
| **Section 3: Members** | Create 8 Admin members manually | 8-16 min | _[User fills in]_ |
| **Section 3: Members** | Create 28 Sales members manually | 28-56 min | _[User fills in]_ |
| **Section 3: Members** | Create 79 Manager members manually | 79-158 min | _[User fills in]_ |
| **Section 3: Members** | Create 35 Worker members manually | 35-70 min | _[User fills in]_ |
| **Section 3: Members** | **TOTAL 150 members created** | **2.5-5 hours** | _[User fills in]_ |
| **Section 4: Teams** | Create 11 teams manually | 60-90 min | _[User fills in]_ |
| **Documentation** | Screenshots + this guide | 30 min | _[User fills in]_ |
| **TOTAL** | All 3 sections (Roles, Members, Teams) | **~4-7 hours** | _[User fills in]_ |

**KEY INSIGHT**: Manual member creation is the longest single task in Company Settings configuration. This is why documenting it accurately matters - customers need realistic time expectations.

---

## Screenshots (User to Add)

### Section 2: Roles
- [ ] Screenshot: Coperniq default 4 roles page (Admin, Manager, Worker, Sales)
- [ ] Screenshot: Permissions matrix (what each role can do)

### Section 3: Members
- [ ] Screenshot: CSV file preview (first 20 rows)
- [ ] Screenshot: Coperniq CSV import dialog
- [ ] Screenshot: Members list after import (150 members visible)
- [ ] Screenshot: Breakdown by role (Admin 8, Manager 79, Sales 28, Worker 35)

### Section 4: Teams
- [ ] Screenshot: HVAC Team roster (35 members)
- [ ] Screenshot: Electrical Team roster (30 members)
- [ ] Screenshot: Plumbing Team roster (22 members)
- [ ] Screenshot: Solar Team roster (18 members)
- [ ] Screenshot: Executive Leadership Team roster (8 members)
- [ ] Screenshot: Sales & Estimating Team roster (28 members)
- [ ] Screenshot: Dispatch & Operations Coordination Team roster (8 members)
- [ ] Screenshot: Project Management Team roster (15 members)
- [ ] Screenshot: Accounting & Finance Team roster (12 members)
- [ ] Screenshot: Field Leadership & Safety Team roster (18 members)
- [ ] Screenshot: Customer Service & Admin Team roster (10 members)
- [ ] Screenshot: Teams overview page showing all 11 teams

---

## Gotchas / Common Issues

### CSV Import Issues
**Issue**: CSV import fails with "Invalid format"
**Fix**: Ensure CSV headers match exactly: `Email,First Name,Last Name,Role,Phone,Active`

**Issue**: Duplicate emails rejected
**Fix**: Each email must be unique. Check for typos in CSV.

**Issue**: Invalid role names
**Fix**: Role column must use exact names: `Admin`, `Manager`, `Worker`, `Sales` (case-sensitive)

### Teams Creation Issues
**Issue**: Can't find member in dropdown
**Fix**: Ensure member was imported successfully in Section 3 first

**Issue**: Team member appears in multiple teams
**Fix**: This is expected! Many employees serve on both trade and functional teams (cross-assignment)

**Issue**: Team creation slow with 35+ members
**Fix**: Normal for large teams - expect 8-10 minutes per large team

---

## Next Steps

After completing Sections 2-4 (Roles, Members, Teams):

### **Section 5: Notifications** (1 hour)
- Configure email/SMS automation triggers
- Set up WO assignment notifications
- Configure emergency call alerts
- PM visit reminders

### **Section 6: Emails & Phones** (30 min)
- Configure outbound email templates
- Set up SMS notifications
- Phone number formatting

### **Section 7-9: Properties** (3 hours)
- Client Properties (service plan tier, preferred tech)
- Request Properties (lead source, urgency level)
- Project Properties (permit number, inspection date)

### **Section 10-17: Process Studio** (20-30 hours) - THE CORE
- 11 Project Workflows with drag-and-drop phase configuration
- 10 Request Workflows (lead pipelines, emergency calls)
- 68 Field Work Orders (on-site templates)
- 85 Office Work Orders (admin templates)
- 21+ Forms (compliance checklists)
- 11+ Payment Structures (revenue models)
- Automations (70+ triggers and actions)

### **Section 18-24: Advanced Configuration** (10-15 hours)
- Labels (customer segmentation)
- Catalog (equipment SKUs, pricing)
- Service Plans (Bronze/Silver/Gold tiers)
- Systems (monitored equipment)
- Geolocation (service territories)
- Integrations (QuickBooks, Stripe, Twilio)
- Portal (customer self-service)

---

## Success Metrics

**Quantitative**:
- ✅ 4 Coperniq default roles used (no customization)
- ✅ 150 employees imported from CSV
- ✅ 11 Teams created (4 trade + 7 functional)
- ✅ 0 import errors or role mismatches

**Qualitative**:
- ✅ Enterprise-scale org structure demonstrates Coperniq can handle $10M+ contractors
- ✅ Multi-regional operations (3 locations) show geographic scalability
- ✅ Complete org depth (C-Suite → Foremen → Techs) shows hierarchical capabilities
- ✅ Cross-functional teams (trade + functional) show coordination capabilities
- ✅ Universal framework works for ANY MEP/Energy contractor to replicate

**Competitive Positioning**:
- ServiceTitan requires $15K+ implementation and doesn't show enterprise-scale reference
- FieldEdge lacks multi-trade depth (HVAC-only)
- Jobber lacks organizational hierarchy (small business focus)
- **Coperniq Company 63** = Complete enterprise reference ANY contractor can replicate in 2 hours

---

## BYOS (Build Your Own Sandbox) Cookbook Note

This guide is **Part 1 of 10** in the complete BYOS Cookbook. The full cookbook will cover all 24 Company Settings sections, documenting every click, every configuration, and every decision for ANY contractor to replicate.

**Master Plan**: `/Users/tmkipper/.claude/plans/nifty-orbiting-pillow.md`
**Next Playbook**: `02_PROPERTIES_CONFIGURATION_GUIDE.md` (Sections 7-9: Client, Request, Project Properties)

---

## Credits

- **Plan Author**: Claude (AI Development Cockpit project)
- **User Partner**: Tim Kipper (Scientia Capital)
- **Company 63**: Energy Hub - Universal MEP/Energy Reference Implementation
- **BYOS Framework**: Build Your Own Sandbox methodology for customer self-service implementation

**Status**: Section 2-4 complete. Ready for Section 5 (Notifications).
