# Coperniq Hubs - Demo Environment Architecture

**Created**: 2025-12-21
**Purpose**: Audit existing Hubs structure and design clean MEP contractor demo environment

---

## What Are Hubs?

**Hubs** are Coperniq's dashboard/navigation layer - collections of views that show relevant data for specific team roles or workflows.

**Think**: Salesforce "Apps" or HubSpot "Workspaces" - role-based views that filter the noise and show exactly what each person needs to see.

---

## Current State - Complete Hodge Podge Audit

### Existing Hubs (from screenshots)

| Hub Name | Views/Dashboards | Issues |
|----------|------------------|--------|
| **FieldOps Hub** | [Demo] Daily Dispatch Board, Dispatch Install Crew 1, Dispatch TSS, Dispatch Site Survey, Service Dispatch View | 5 dispatch views but unclear which to use |
| **Operations Hub** | CXO/VP Dashboard, Residential EPC | Only 2 views, mixing executive + vertical |
| **Permitting Team Hub** | AHJ Permit View, AHJ Permitting Task List | Good - focused on permitting |
| **Pre-Con Hub** | Pre-Con Portfolio | Only 1 view, incomplete |
| **Project Management** | Task List | Only 1 view, too generic |
| **Sales Hub** | Sales Scheduler | Only 1 view, missing pipeline/leads |
| **Other** | Con/O&M, Priority projects, Project Manager, Service Dispatch, Test Sales Rep Dashboard | 5 orphaned views with no clear organization |

### Problems with Current Structure

1. **No Clear Personas**: Mixing executive (CXO/VP) with operational (Dispatch) in same category
2. **Duplicate Dispatch Views**: 5+ dispatch boards with unclear differences
3. **Orphan Views in "Other"**: Critical views like "Service Dispatch" buried in catch-all category
4. **Missing Key Hubs**: No dedicated hubs for Accounting, Technicians, Customer Service
5. **Vertical Mixing**: "Residential EPC" in Operations Hub is too specific for solar, doesn't apply to MEP
6. **Demo Pollution**: "[Demo]" prefix views mixed with production views

---

## Ideal Hub Architecture for MEP Contractors

### Design Principles

1. **Persona-Based**: Each Hub = One role (Technician, Sales Rep, Operations Manager, etc.)
2. **Task-Oriented**: Views within Hub show what that role needs to accomplish TODAY
3. **Progressive Disclosure**: Start with high-level overview, drill down to details
4. **Trade-Agnostic**: Works for HVAC, Plumbing, Electrical, Multi-Trade contractors
5. **Clean Demo Data**: No "[Demo]" prefixes, no "test" views, no orphan dashboards

---

## Proposed Hub Structure (8 Core Hubs)

### Hub 1: 🏢 Executive Dashboard
**Persona**: Owner, VP, General Manager
**Purpose**: Business health at a glance - revenue, margins, pipeline, team performance

**Views**:
1. **Business Health Overview** - KPIs: Revenue MTD/YTD, Gross margin %, Cash flow
2. **Sales Pipeline** - Funnel: Leads → Qualified → Proposals → Won (by trade, by rep)
3. **Operations Overview** - WOs completed, jobs in progress, overdue projects
4. **Financial Summary** - AR aging, AP due, invoice collection rate
5. **Team Performance** - Revenue per tech, utilization %, customer satisfaction

**Why It Matters**: Owners need one place to see if the business is healthy or has issues requiring intervention.

---

### Hub 2: 💼 Sales & Estimating
**Persona**: Sales Rep, Estimator, Business Development Manager
**Purpose**: Manage sales pipeline from lead to signed contract

**Views**:
1. **My Leads** - Unqualified leads assigned to me, sorted by urgency
2. **Active Proposals** - Quotes sent, waiting for customer decision
3. **Follow-Up Queue** - Leads/proposals needing action (7-day, 30-day, 90-day)
4. **Won Projects This Month** - Closed deals, conversion rate, avg deal size
5. **Lead Sources** - Where leads are coming from (Google, referrals, emergency calls)

**Why It Matters**: Sales reps waste time searching for "What do I need to follow up on today?" This Hub answers that instantly.

---

### Hub 3: 🚚 Dispatch & Scheduling
**Persona**: Dispatcher, Scheduler, Operations Coordinator
**Purpose**: Assign work orders to techs, manage daily/weekly schedule

**Views**:
1. **Today's Schedule** - All WOs scheduled for today, by tech, with map view
2. **Unassigned Work Orders** - Open WOs needing tech assignment
3. **Emergency Queue** - Priority 1 emergency calls, SLA countdown timers
4. **PM Schedule** - Preventive maintenance visits due this week/month
5. **Tech Availability** - Who's available, who's on PTO, who's on-call

**Why It Matters**: Dispatchers need to see "Who can take this emergency call right now?" and "Are we on track for today's schedule?"

---

### Hub 4: 🔧 Field Technician
**Persona**: Field Technician, Installer, Service Tech
**Purpose**: See my assigned work orders, complete checklists, submit time

**Views**:
1. **My Work Orders Today** - WOs assigned to me, sorted by appointment time
2. **My Work Order History** - Completed WOs (last 30 days) for reference
3. **Parts Needed** - Materials to pick up from warehouse before job
4. **Timesheet** - Clock in/out, track hours per job
5. **Customer Info Quick View** - Site address, special instructions, equipment history

**Why It Matters**: Techs on phones/tablets need simple, mobile-optimized view of "What's my job today and where do I go?"

---

### Hub 5: 📋 Project Management
**Persona**: Project Manager, Construction Manager, Foreman
**Purpose**: Track multi-phase projects (commercial installs, retrofits) from start to closeout

**Views**:
1. **Active Projects** - All projects in progress, status, % complete
2. **Projects Needing Action** - Permits pending, inspections overdue, POs not submitted
3. **Project Financials** - Budget vs actual, change orders, invoice status
4. **Milestone Tracker** - M1/M2/M3 payment milestones, completion dates
5. **Team Workload** - Which PMs are over/under capacity

**Why It Matters**: PMs need to see "Which projects are at risk?" and "What needs my attention today?"

---

### Hub 6: 🧾 Accounting & Billing
**Persona**: Accountant, Bookkeeper, AR/AP Clerk
**Purpose**: Manage invoices, payments, collections, vendor bills

**Views**:
1. **Invoices to Send** - Completed jobs ready to invoice
2. **AR Aging** - Outstanding invoices: Current, 30, 60, 90+ days
3. **Payments Received Today** - Cash collected, to be deposited
4. **AP Due This Week** - Vendor bills to pay, POs to approve
5. **Financial Reports** - P&L, cash flow, job costing

**Why It Matters**: Accountants need to see "What invoices are overdue and need collection calls?" and "What bills are due?"

---

### Hub 7: 🎫 Service Agreements & O&M
**Persona**: Service Manager, O&M Coordinator, Renewal Specialist
**Purpose**: Manage recurring service agreements, PM schedules, renewals

**Views**:
1. **Service Plans Active** - All clients with Bronze/Silver/Gold plans
2. **PM Visits Due** - Scheduled maintenance visits due this week/month
3. **Renewals This Quarter** - Service agreements expiring, renewal quotes to send
4. **Service Plan Revenue** - MRR, churn rate, upsell opportunities
5. **SLA Compliance** - Mission-critical contracts, uptime %, SLA violations

**Why It Matters**: Service managers need to see "Which PM visits are overdue?" and "Which contracts are up for renewal?"

---

### Hub 8: 📞 Customer Service
**Persona**: Customer Service Rep, Receptionist, Call Center
**Purpose**: Handle inbound calls, schedule appointments, answer customer questions

**Views**:
1. **Inbound Requests Today** - New service requests, emergency calls
2. **Appointment Scheduling** - Available time slots by tech, by trade
3. **Customer Lookup** - Search by phone/address, view history
4. **Feedback & Reviews** - Recent surveys, negative reviews needing follow-up
5. **Portal Access Requests** - Customers requesting online account access

**Why It Matters**: CSRs need to see "What time slots are available?" and "What's this customer's service history?"

---

## Hub Implementation Backlog

### Phase 1: Critical Hubs (Week 1)
**Goal**: Get operational teams productive immediately

1. **Dispatch & Scheduling Hub** (8 hours)
   - Build "Today's Schedule" view (filter: date = today, group by tech)
   - Build "Unassigned Work Orders" view (filter: status = open, assignee = null)
   - Build "Emergency Queue" view (filter: priority = emergency, sort by created date)
   - Add to FieldOps Hub, rename to "Dispatch & Scheduling"

2. **Field Technician Hub** (4 hours)
   - Build "My Work Orders Today" view (filter: assignee = current user, date = today)
   - Build "My Timesheet" view (show time entries for current user)
   - Create new Hub "Field Technician" (mobile-optimized)

3. **Sales & Estimating Hub** (6 hours)
   - Build "My Leads" view (filter: assigned to current user, status != won/lost)
   - Build "Active Proposals" view (filter: status = proposal sent)
   - Build "Follow-Up Queue" view (filter: last contact > 7 days ago)
   - Rename "Sales Hub" to "Sales & Estimating", add views

### Phase 2: Management Hubs (Week 2)
**Goal**: Give managers visibility into operations

4. **Project Management Hub** (8 hours)
   - Build "Active Projects" view (filter: status = in progress)
   - Build "Projects Needing Action" view (filter: milestones overdue OR permits pending)
   - Build "Project Financials" view (show budget vs actual, margin %)
   - Rename existing "Project Management" hub, rebuild views

5. **Executive Dashboard Hub** (10 hours)
   - Build "Business Health Overview" (KPI cards: revenue MTD, margin %, cash flow)
   - Build "Sales Pipeline" (funnel chart: leads → proposals → won)
   - Build "Operations Overview" (WOs completed, jobs in progress, overdue)
   - Rename "Operations Hub" to "Executive Dashboard", rebuild

### Phase 3: Back-Office Hubs (Week 3)
**Goal**: Streamline accounting and service agreement management

6. **Accounting & Billing Hub** (8 hours)
   - Build "Invoices to Send" view (filter: project complete, invoice status = draft)
   - Build "AR Aging" view (group by: days overdue, show totals)
   - Build "Payments Received Today" view (filter: payment date = today)
   - Create new Hub "Accounting & Billing"

7. **Service Agreements & O&M Hub** (8 hours)
   - Build "Service Plans Active" view (filter: service plan != null, status = active)
   - Build "PM Visits Due" view (filter: due date <= 30 days, type = PM)
   - Build "Renewals This Quarter" view (filter: expiration date <= 90 days)
   - Create new Hub "Service Agreements & O&M"

### Phase 4: Customer-Facing Hubs (Week 4)
**Goal**: Improve customer service and communication

8. **Customer Service Hub** (6 hours)
   - Build "Inbound Requests Today" view (filter: created date = today, status = new)
   - Build "Appointment Scheduling" (calendar view with tech availability)
   - Build "Customer Lookup" (search by phone, email, address)
   - Create new Hub "Customer Service"

---

## View Design Patterns for MEP Contractors

### Pattern 1: Today's Work (Dispatch, Tech, CSR)
**Components**:
- Date filter: Today
- Group by: Tech or Time Slot
- Sort by: Appointment time ascending
- Map view: Show addresses on map
- Mobile-optimized: Large touch targets, minimal scrolling

**Why**: Operational teams need "What do I do RIGHT NOW?" not "What happened last month?"

---

### Pattern 2: Action Required (Sales, PM, Accounting)
**Components**:
- Highlight overdue items in red
- Sort by: Days overdue descending
- Filter: Status = needs action
- Quick actions: Assign, Send, Approve buttons

**Why**: Managers need to triage "What's on fire?" before looking at healthy projects.

---

### Pattern 3: KPI Dashboard (Executive, Service Manager)
**Components**:
- Top row: KPI cards (Revenue, Margin, Utilization)
- Middle: Trend charts (Last 12 months)
- Bottom: Detailed table for drill-down

**Why**: Executives need high-level health check, with ability to drill into problems.

---

### Pattern 4: Pipeline/Funnel (Sales, PM)
**Components**:
- Funnel chart: Stages from left to right
- Conversion rates between stages
- Filter by: Trade, Sales Rep, Date Range

**Why**: Sales teams need to visualize "Where are deals getting stuck?"

---

## Hub Configuration Requirements

### Prerequisites (from APP26_CONFIGURATION_GUIDE.md)

Before building Hubs, these sections must be configured:

1. **Labels** (Section 18) - For filtering views (Emergency, Routine, PM, etc.)
2. **Teams** (Section 4) - For grouping techs in dispatch views
3. **Service Plans** (Section 20) - For O&M Hub service plan views
4. **Payment Structures** (Section 15) - For Project Financials views
5. **Roles** (Section 2) - For role-based Hub visibility

---

## Demo Environment Strategy

### Problem with Current Demo
- "[Demo]" prefix views mixed with production views
- No clear narrative: "This is what an HVAC contractor sees" vs "This is what a solar EPC sees"
- Orphan views in "Other" hub confuse prospects

### Clean Demo Strategy

**Option A: Single MEP Contractor Demo**
- Configure Hubs for multi-trade MEP contractor (HVAC + Plumbing + Electrical)
- Show all 8 Hubs with realistic data (not "[Demo]" prefixes)
- Use "Coperniq Energy" company name (realistic contractor)

**Option B: Multiple Vertical Demos**
- Create separate Hub sets for:
  - HVAC Service Contractor (Bronze/Silver/Gold service plans)
  - Commercial MEP (Multi-trade projects)
  - Solar EPC (Residential + C&I solar)
- Let prospects pick their vertical

**Recommendation**: **Option A** - Single MEP contractor demo with all 8 Hubs
**Why**: Simpler to maintain, shows cross-sell opportunities (HVAC contractor adding plumbing), demonstrates full platform capabilities.

---

## Hub Naming Conventions

### Current (Confusing)
- ❌ "FieldOps Hub" - What does "FieldOps" mean?
- ❌ "Pre-Con Hub" - Jargon (Pre-Construction)
- ❌ "Other" - Catch-all for orphans

### Proposed (Clear)
- ✅ "Dispatch & Scheduling" - Exactly what it does
- ✅ "Field Technician" - Clear persona
- ✅ "Sales & Estimating" - Clear persona
- ✅ "Executive Dashboard" - Clear persona

**Rule**: Hub names should answer "Who is this for?" or "What does this do?"

---

## Mobile vs Desktop Optimization

### Mobile-First Hubs
1. **Field Technician** - Techs use phones/tablets on-site
2. **Dispatch & Scheduling** - Dispatchers use tablets in office
3. **Customer Service** - CSRs use phones for on-the-go

**Design**: Large buttons, minimal text, map views, one-tap actions

### Desktop-Optimized Hubs
4. **Executive Dashboard** - Multi-monitor setups with charts
5. **Accounting & Billing** - Spreadsheet-like tables with sorting
6. **Project Management** - Gantt charts, detailed financials

**Design**: Dense information, multiple columns, export to Excel

### Hybrid (Works Both Ways)
7. **Sales & Estimating** - Reps use laptops + phones
8. **Service Agreements & O&M** - Managers use both

**Design**: Responsive layout, progressive disclosure (mobile shows summary, desktop shows details)

---

## Success Metrics

### Phase 1 Complete (Week 1):
- [ ] 3 Critical Hubs built (Dispatch, Field Tech, Sales)
- [ ] All views have realistic demo data (20 clients from DEMO_ENVIRONMENT_PLAN.md)
- [ ] Mobile-optimized for Field Tech hub

### Phase 2 Complete (Week 2):
- [ ] 2 Management Hubs built (Project Management, Executive)
- [ ] KPI dashboards show accurate metrics from demo data
- [ ] Prospect can see "day in the life" for each persona

### Phase 3 Complete (Week 3):
- [ ] 2 Back-Office Hubs built (Accounting, Service Agreements)
- [ ] Service plan renewal workflow demonstrated
- [ ] Financial reports show realistic margins and AR aging

### Phase 4 Complete (Week 4):
- [ ] 1 Customer-Facing Hub built (Customer Service)
- [ ] All 8 Hubs documented with screenshots
- [ ] Sales enablement deck created: "Hubs Tour for MEP Contractors"

---

## Next Steps

1. **Add to BACKLOG.md**: Hub redesign as separate epic (4-week effort)
2. **Dependency**: Complete 20 demo clients (DEMO_ENVIRONMENT_PLAN.md) before building Hub views
3. **Design Mockups**: Sketch each Hub's views before implementation
4. **User Testing**: Get feedback from actual MEP contractors on Hub organization

---

## Related Documents

- `APP26_ARCHITECTURE.md` - Workflow and payment structure dependencies
- `APP26_CONFIGURATION_GUIDE.md` - Section 18 (Labels) needed for Hub filters
- `DEMO_ENVIRONMENT_PLAN.md` - 20 strategic clients for realistic Hub data

---

**Last Updated**: 2025-12-21
**Status**: Audit complete, ready for BACKLOG.md entry
**Next**: Document in BACKLOG.md as "Epic: Redesign Hubs for MEP Demo Environment"
