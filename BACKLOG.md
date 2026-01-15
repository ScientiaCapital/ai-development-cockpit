# Coperniq MEP Templates - Backlog

**Last Updated**: 2025-12-21

---

## High Priority (Current Sprint)

### BL-001: Complete APP26 6-Hour Sprint
**Module**: Process Studio Templates
**Status**: PLANNED (ready to execute)
**Documentation**: `docs/APP26_ARCHITECTURE.md`

**Goal**: Complete MEP template foundation following dependency graph to prevent circular building.

**Phase 1 (Hour 0-1): O&M Workflows** - Foundation Layer
- [ ] [MEP] Solar O&M Performance Service (15 min)
- [ ] [MEP] Industrial MC/RAV Service (15 min)

**Phase 2 (Hour 1-2): Payment Structures** - Revenue Models
- [ ] Update [MEP] SLA-Based Uptime (fix workflow mapping: 20661 → 20662)
- [ ] Create [MEP] Solar O&M Performance
- [ ] Create [MEP] Outcome-Based Comfort
- [ ] Create [MEP] Industrial MC/RAV
- [ ] Create [MEP] Data Center Mission Critical

**Phase 3 (Hour 2-3): Documentation**
- [ ] Update AI_PROMPTS_BEST_PRACTICES.md with 4 new entries
- [ ] Create WORKFLOW_PAYMENT_DEPENDENCY_MAP.md

**Phase 4 (Hour 3-4): Testing**
- [ ] Test all 11 payment structures
- [ ] Verify workflow mappings
- [ ] Document in APP26_TESTING_LOG.md

**Phase 5 (Hour 4-6): Automations**
- [ ] [MEP] Payment Received
- [ ] [MEP] Permit Approved → Install
- [ ] [MEP] Emergency Dispatch
- [ ] [MEP] PM Due → Create Ticket
- [ ] [MEP] New Customer Welcome
- [ ] [MEP] Negative Review Alert
- [ ] [MEP] Contract Renewal

**Success Criteria**:
- All 4 O&M workflows exist
- All 11 payment structures properly mapped
- All 10 automations built and tested
- 0 workflow mapping errors

---

## Medium Priority (Future Sprints)

### BL-002: Coperniq Hubs Redesign
**Module**: Coperniq Process Studio - Hubs
**Status**: PLANNED (4-week effort)
**Documentation**: `docs/HUBS_ARCHITECTURE.md`

**Problem**: Current Hubs are hodge-podge with no clear personas, duplicate dispatch views (5+ versions), orphan dashboards in "Other" category. Mixing executive + operational roles. Missing dedicated Accounting, Technician, and Customer Service hubs.

**Solution**: Redesign as 8 persona-based Hubs with clear role separation:

1. 🏢 **Executive Dashboard** - Owner/VP/GM
   - Business Health Overview (Revenue MTD/YTD, Gross margin %, Cash flow)
   - Sales Pipeline (Leads → Qualified → Proposals → Won)
   - Operations Overview (WOs completed, jobs in progress, overdue)
   - Financial Summary (AR aging, AP due, invoice collection rate)
   - Team Performance (Revenue per tech, utilization %, customer satisfaction)

2. 💼 **Sales & Estimating** - Sales Rep/Estimator
   - My Leads (unqualified leads, sorted by urgency)
   - Active Proposals (quotes sent, waiting for decision)
   - Follow-Up Queue (7-day, 30-day, 90-day follow-ups)
   - Won Projects This Month (closed deals, conversion rate, avg deal size)
   - Lead Sources (Google, referrals, emergency calls)

3. 🚚 **Dispatch & Scheduling** - Dispatcher/Scheduler
   - Today's Schedule (all WOs for today, by tech, with map view)
   - Unassigned Work Orders (open WOs needing tech assignment)
   - Emergency Queue (Priority 1 calls, SLA countdown timers)
   - PM Schedule (preventive maintenance visits due this week/month)
   - Tech Availability (who's available, PTO, on-call)

4. 🔧 **Field Technician** - Field Tech/Installer (Mobile-Optimized)
   - My Work Orders Today (assigned WOs, sorted by appointment time)
   - My Work Order History (completed WOs, last 30 days)
   - Parts Needed (materials to pick up from warehouse)
   - Timesheet (clock in/out, track hours per job)
   - Customer Info Quick View (site address, special instructions, equipment history)

5. 📋 **Project Management** - PM/Construction Manager
   - Active Projects (all projects in progress, status, % complete)
   - Projects Needing Action (permits pending, inspections overdue, POs not submitted)
   - Project Financials (budget vs actual, change orders, invoice status)
   - Milestone Tracker (M1/M2/M3 payment milestones, completion dates)
   - Team Workload (which PMs are over/under capacity)

6. 🧾 **Accounting & Billing** - Accountant/AR/AP Clerk
   - Invoices to Send (completed jobs ready to invoice)
   - AR Aging (outstanding invoices: Current, 30, 60, 90+ days)
   - Payments Received Today (cash collected, to be deposited)
   - AP Due This Week (vendor bills to pay, POs to approve)
   - Financial Reports (P&L, cash flow, job costing)

7. 🎫 **Service Agreements & O&M** - Service Manager
   - Service Plans Active (all clients with Bronze/Silver/Gold plans)
   - PM Visits Due (scheduled maintenance visits due this week/month)
   - Renewals This Quarter (service agreements expiring, renewal quotes to send)
   - Service Plan Revenue (MRR, churn rate, upsell opportunities)
   - SLA Compliance (mission-critical contracts, uptime %, SLA violations)

8. 📞 **Customer Service** - CSR/Receptionist
   - Inbound Requests Today (new service requests, emergency calls)
   - Appointment Scheduling (available time slots by tech, by trade)
   - Customer Lookup (search by phone/address, view history)
   - Feedback & Reviews (recent surveys, negative reviews needing follow-up)
   - Portal Access Requests (customers requesting online account access)

**Phase 1 (Week 1)**: Critical Hubs
- [ ] Dispatch & Scheduling Hub (8 hours)
  - Build "Today's Schedule" view (filter: date = today, group by tech)
  - Build "Unassigned Work Orders" view (filter: status = open, assignee = null)
  - Build "Emergency Queue" view (filter: priority = emergency, sort by created date)
- [ ] Field Technician Hub (4 hours)
  - Build "My Work Orders Today" view (filter: assignee = current user, date = today)
  - Build "My Timesheet" view (show time entries for current user)
  - Create new Hub "Field Technician" (mobile-optimized)
- [ ] Sales & Estimating Hub (6 hours)
  - Build "My Leads" view (filter: assigned to current user, status != won/lost)
  - Build "Active Proposals" view (filter: status = proposal sent)
  - Build "Follow-Up Queue" view (filter: last contact > 7 days ago)

**Phase 2 (Week 2)**: Management Hubs
- [ ] Project Management Hub (8 hours)
  - Build "Active Projects" view (filter: status = in progress)
  - Build "Projects Needing Action" view (filter: milestones overdue OR permits pending)
  - Build "Project Financials" view (show budget vs actual, margin %)
- [ ] Executive Dashboard Hub (10 hours)
  - Build "Business Health Overview" (KPI cards: revenue MTD, margin %, cash flow)
  - Build "Sales Pipeline" (funnel chart: leads → proposals → won)
  - Build "Operations Overview" (WOs completed, jobs in progress, overdue)

**Phase 3 (Week 3)**: Back-Office Hubs
- [ ] Accounting & Billing Hub (8 hours)
  - Build "Invoices to Send" view (filter: project complete, invoice status = draft)
  - Build "AR Aging" view (group by: days overdue, show totals)
  - Build "Payments Received Today" view (filter: payment date = today)
- [ ] Service Agreements & O&M Hub (8 hours)
  - Build "Service Plans Active" view (filter: service plan != null, status = active)
  - Build "PM Visits Due" view (filter: due date <= 30 days, type = PM)
  - Build "Renewals This Quarter" view (filter: expiration date <= 90 days)

**Phase 4 (Week 4)**: Customer-Facing Hubs
- [ ] Customer Service Hub (6 hours)
  - Build "Inbound Requests Today" view (filter: created date = today, status = new)
  - Build "Appointment Scheduling" (calendar view with tech availability)
  - Build "Customer Lookup" (search by phone, email, address)

**Prerequisites**:
- Complete 20 demo clients from DEMO_ENVIRONMENT_PLAN.md before building Hub views (need realistic data)
- Labels configured (Section 18 from APP26_CONFIGURATION_GUIDE.md)
- Teams configured (Section 4)
- Service Plans configured (Section 20)

**Success Metrics**:
- All 8 Hubs built with persona-based organization
- No duplicate/orphan views
- Mobile-optimized for Field Tech, Dispatch, Customer Service Hubs
- Desktop-optimized for Executive, Accounting, Project Management Hubs
- All views demonstrate real MEP contractor workflows with demo data

---

### BL-003: Demo Environment Population
**Module**: Coperniq Data
**Status**: BLOCKED (waiting for templates completion)
**Documentation**: `docs/DEMO_ENVIRONMENT_PLAN.md`

**Goal**: Create 20 strategic demo clients showing all MEP trades, service plans, and payment structures.

**Phase 1**: Client Cleanup
- [ ] Archive existing 152 clients to "Demo Archive" tag
- [ ] Delete duplicate/test clients
- [ ] Keep only the 20 strategic demo clients

**Phase 2**: Client Creation (Use Coperniq AI)
- [ ] 4 Residential HVAC clients (Bronze/Silver/Gold/Platinum plans)
- [ ] 3 Commercial Property clients
- [ ] 2 Multi-Family/Property Management clients
- [ ] 2 Industrial/Manufacturing clients
- [ ] 1 Healthcare client
- [ ] 2 Retail/Restaurant clients
- [ ] 1 Government client
- [ ] 3 Solar EPC clients (Residential/Commercial/Utility-scale)
- [ ] 1 Fire Protection client
- [ ] 1 Roofing client

**Phase 3**: Asset Population
- [ ] Create equipment assets for each client using AI

**Phase 4**: Project History
- [ ] Create 2-3 historical projects per client

**Phase 5**: Invoice History
- [ ] Create invoice examples showing payment structures in action

**Phase 6**: Payment Structures
- [ ] Verify all 8 payment structures are demonstrated

**Phase 7**: Validation
- [ ] Each client has complete data (site, assets, service plan, projects, invoices)
- [ ] All 14 service plans are in use
- [ ] All 8 payment structures are demonstrated
- [ ] All trades represented

---

### BL-004: Video Factory Content Production
**Module**: Video Factory
**Status**: IN PROGRESS (7/56 videos complete)
**Repository**: https://github.com/ScientiaCapital/video-factory

**Remaining Videos**:
- [ ] 13 remaining feature videos (20 total planned)
- [ ] 36 competitive videos (6 competitors × 6 videos each)

**Dependencies**:
- Coperniq credentials for Playwright automation
- Screenshots from demo environment
- Battle Cards deployment for hosting

---

## Low Priority / Icebox

### BL-005: API Integration
**Module**: Coperniq API
**Status**: BLOCKED (waiting for CTO API credentials)
**Documentation**: `CTO_API_REQUEST.md`

- GraphQL API access for automated template creation
- Bulk import capabilities for demo data
- API authentication and rate limiting

---

### BL-006: E2B Sandbox Integration
**Module**: E2B Sandbox
**Status**: PLANNED (GTM pre-sales motion)

- CSV upload interface
- Vertical selection (Solar EPC, HVAC/MEP, O&M Service, Multi-Trade)
- AI-powered data insights
- Trial management (30-60 day lifecycle)

---

## Related Documentation

**Architecture**:
- `docs/APP26_ARCHITECTURE.md` - Master build plan, dependency graph
- `docs/APP26_CONFIGURATION_GUIDE.md` - 24 Company Settings sections
- `docs/HUBS_ARCHITECTURE.md` - 8-Hub persona-based redesign

**Implementation**:
- `docs/AI_PROMPTS_BEST_PRACTICES.md` - Exact prompts for workflows/payment structures
- `docs/DEMO_ENVIRONMENT_PLAN.md` - 20 strategic demo clients
- `docs/COPERNIQ_CAPABILITIES.md` - Automation triggers/actions
- `QUICK_BUILD_REFERENCE.md` - Fast manual build specs
- `TEMPLATE_INVENTORY.md` - Sprint progress tracker

**Research**:
- `research/MEP_PAYMENT_STRUCTURES.md` - Commercial/C&I/Utility pricing
- `research/service-plan-research-by-trade.md` - Deep trade-specific service plans
- `research/residential-mep-payment-structures.md` - Residential pricing patterns
- `research/electrical_solar_payment_structures.md` - Trade-specific electrical/solar
- `research/PROPERTY_MANAGEMENT_PAYMENT_STRUCTURES.md` - Property management pricing
