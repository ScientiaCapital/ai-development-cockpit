# Dashboard Build Guide - Step-by-Step with Screenshots

**Created**: 2025-12-22
**Project**: Coperniq MEP Templates
**Purpose**: Complete guide for building best-in-industry dashboards in Coperniq Analytics

---

## Current State Assessment (2025-12-22)

### Existing Hub Structure

**Location**: https://app.coperniq.io/112/analytics

**7 Hubs Currently Configured**:

1. **FieldOps Hub**
   - 🎯 [Demo] Daily Dispatch Board
   - 🌞 Dispatch | Install Crew 1
   - 🎯 Dispatch | TSS
   - 🚚 Dispatch Site Survey
   - 🚚 Service Dispatch View

2. **Operations Hub**
   - 🏆 CXO/VP Dashboard (ID: 267) - 14 widgets
   - 🎯 Residential EPC

3. **Permitting Team Hub**
   - 📫 AHJ Permit View
   - 📫 AHJ Permitting Task List

4. **Pre-Con Hub**
   - 🔥 Pre-Con Portfolio

5. **Project Management**
   - 🎯 Task List

6. **Sales Hub**
   - 💸 Sales Scheduler

7. **Other** (Orphaned Dashboards)
   - 📊 Con/O&M
   - 🎯 Priority projects
   - 📊 Project Manager
   - 📈 Service Dispatch
   - 📊 Test Sales Rep Dashboard

### Current Problems Identified

1. **Hodge-podge Organization**: 7 Hubs with no clear persona separation
2. **Duplicate Dispatch Views**: 5+ dispatch-related dashboards scattered across FieldOps Hub and "Other"
3. **Mixing Roles**: Operations Hub combines Executive (CXO/VP) with operational dashboards
4. **Orphaned Dashboards**: 5 dashboards in "Other" category with no clear home
5. **Missing Critical Hubs**: No dedicated Hubs for:
   - Field Technician (mobile-optimized)
   - Accounting & Billing
   - Service Agreements & O&M
   - Customer Service

---

## Hub Renaming Strategy

### Hubs to Rename (Manual - Tim Does This)

| Current Hub | New Hub Name | Action |
|-------------|--------------|--------|
| FieldOps Hub | 🚚 Dispatch & Scheduling | Rename |
| Operations Hub | 🏢 Executive Dashboard | Rename |
| Sales Hub | 💼 Sales & Estimating | Rename |
| Other | (Delete) | Move dashboards first, then delete |

### Hubs to Keep As-Is

| Hub Name | Status |
|----------|--------|
| Permitting Team Hub | Keep (niche role) |
| Pre-Con Hub | Keep or merge into Project Management |
| Project Management | Keep (rename to "📋 Project Management") |

### New Hubs to Create

| New Hub | Emoji | Priority | When to Build |
|---------|-------|----------|---------------|
| Field Technician | 🔧 | High | Day 3 |
| Accounting & Billing | 🧾 | Medium | Week 3 |
| Service Agreements & O&M | 🎫 | Medium | Week 3 |
| Customer Service | 📞 | Low | Week 4 |

---

## CXO/VP Dashboard Analysis (Current Best Example)

**Dashboard ID**: 267
**Last Updated**: 12/16/2025, 4:32 PM
**Description**: "This is a dashboard for senior executives and leaders at Coperniq Energy"
**Access**: Shared with entire company

### 14 Widgets Currently Configured:

1. **🏆 Sales Rep Ranking ($)** - This Quarter
   - Data: Sales Rep, User
   - Type: Leaderboard/Ranking
   - Shows: Top 2 sales reps by revenue ($43M+ top performer)

2. **🏆 Sales Team Ranking ($)** - All time
   - Data: Sales Rep, Team
   - Type: Leaderboard/Ranking
   - Shows: Teams by revenue ($44.8M "No team" group)

3. **🏆 Sales Team Ranking (kW)** - All time
   - Data: Sales Rep, Team
   - Type: Leaderboard/Ranking
   - Shows: Teams by solar capacity (331,713 kW)

4. **Resi | Solar+Battery | EPC - Bottlenecks by Phase** - Last 365 Days
   - Type: Funnel/Conversion chart
   - Shows: Phase conversion rates (Welcome → Site Survey → Engineering → Permitting → Construction → Inspection → O&M)
   - Key Insight: 80.56% Welcome→Survey, 41.38% Survey→Engineering conversion

5. **🔍 QA/QC | Visits Per Site Survey** - This Quarter
   - Type: KPI Card
   - Value: 2 visits per survey

6. **💧 Resi | Solar+Battery | EPC - Average pull-through from Onboarding to PTO** - All time
   - Type: Timeline/Gantt
   - Status: No data to visualize yet

7. **Where are projects put on hold?** - Year-to-date
   - Type: Status breakdown
   - Status: No data to visualize yet

8. **Projects Timeline** - All time
   - Type: Timeline/Gantt
   - Status: No data to visualize yet

9. **Project Phase** - Last 30 Days
   - Type: Status breakdown
   - Status: No data to visualize yet

10. **RSC - In-House Leads Pipeline** - Last 30 Days
    - Type: Pipeline/Funnel
    - Status: No data to visualize yet

11. **Pipeline Work Orders** - Last 30 Days
    - Type: Stacked bar chart
    - Shows: Work orders by status (95 Queued, 26 Scheduled, 18 Working, 29 Cancelled)
    - Statuses: Queued, Scheduled, On the way, Working, Clocked out, Changes requested, Cancelled

12. **Project Site Address** - Last 30 Days, Time/Day
    - Type: Timeline chart
    - Shows: Projects created over time (daily breakdown)

13. **Work Orders by Status** - Last 30 Days
    - Type: Timeline with SLA indicators
    - Shows: Time in phase vs. total time by workflow stage
    - SLA violations: Within SLA (green), Yellow violation, Red violation

14. **Site Surveys** - Quarter-to-date, Completed
    - Type: KPI Card
    - Value: 1 survey completed

### Widget Configuration Patterns Observed:

**Time Ranges Available**:
- This Quarter
- All time
- Last 365 Days
- Year-to-date
- Last 30 Days
- Quarter-to-date

**Visualization Types**:
- Leaderboard/Ranking (with emojis for 1st/2nd/3rd place)
- Funnel/Conversion chart (phase-based workflows)
- KPI Cards (single number metrics)
- Stacked bar charts (work orders by status)
- Timeline/Gantt charts (project timelines)
- Status breakdown charts

**Data Grouping**:
- By Sales Rep, User
- By Sales Rep, Team
- By Phase (workflow stages)
- By Status (work order states)
- By Time (Day, Week, Month, Quarter)

**Common Filters**:
- Time range (This Quarter, Last 30 Days, etc.)
- Status (Queued, Scheduled, Working, etc.)
- Phase (Welcome, Site Survey, Engineering, etc.)
- Assignee (Sales Rep, Team, User)

---

## Prerequisites for Dashboard Building

### Before You Build (Checklist)

- [ ] **Demo Data Populated**: 20 strategic demo clients with realistic data
  - 50+ work orders (mixed statuses)
  - 30+ projects (various phases)
  - 20+ invoices (mixed statuses)
  - 10+ service plan instances
  - 15+ assets (equipment)

- [ ] **Company Settings Configured**:
  - [ ] Labels (Section 18) - Emergency, Routine, PM labels
  - [ ] Teams (Section 4) - Tech teams for filtering
  - [ ] Service Plans (Section 20) - Bronze/Silver/Gold plans
  - [ ] Roles (Section 2) - Dispatcher, Field Tech, Sales Rep roles

- [ ] **Hubs Renamed** (Tim does manually):
  - [ ] FieldOps Hub → Dispatch & Scheduling
  - [ ] Operations Hub → Executive Dashboard
  - [ ] Sales Hub → Sales & Estimating

---

## Dashboard Creation Workflow (Via Playwright UI Automation)

### Step 1: Navigate to Analytics

```
URL: https://app.coperniq.io/112/analytics
```

### Step 2: Click "+ New Dashboard" Button

**Location**: Top section of Analytics page
**Button**: Usually near dashboard dropdown

### Step 3: Fill Dashboard Creation Form

**Form Fields**:
1. **Emoji Picker**: Select persona-appropriate emoji
   - 🚚 Dispatch & Scheduling
   - 🔧 Field Technician
   - 💼 Sales & Estimating
   - 🏢 Executive Dashboard
   - 📋 Project Management
   - 🧾 Accounting & Billing
   - 🎫 Service Agreements & O&M
   - 📞 Customer Service

2. **Name Field**: "[Persona] Dashboard"
   - Example: "Dispatch & Scheduling Dashboard"
   - Example: "Field Technician Dashboard"

3. **Hub Dropdown**: Select or create Hub
   - Select: Existing Hub from dropdown
   - Create: Type new Hub name to create

4. **Description**: 1-2 sentences explaining purpose
   - Example: "Real-time scheduling, emergency queue, and tech assignment for dispatchers and operations coordinators"
   - Keep under 255 characters

5. **Access Control**: **CRITICAL - Must select "Share with entire Company"**
   - Radio button: "Share with entire Company" ✅
   - DO NOT select "Private" (only visible to you)

### Step 4: Click "CREATE" Button

### Step 5: Wait for Dashboard Creation Confirmation

### Step 6: Toggle "Edit mode" Switch

**Location**: Top right of dashboard page
**Toggle**: Switch to ON position

### Step 7: Add Widgets

**Button**: Click "+ Add Widget"

### Step 8: Configure Widget

**Widget Configuration Fields**:

1. **Widget Name**: Descriptive name
   - Example: "Today's Schedule"
   - Example: "Unassigned Work Orders"

2. **Data Source**: Select Coperniq type
   - Task (Work Orders)
   - FinancialDocument (Invoices/Quotes)
   - Project (Jobs/Installations)
   - Contact (Customers/Leads)
   - Site (Customer Locations)
   - Asset (Equipment)
   - ServicePlanInstance (Service Agreements)
   - System (Monitored Systems)
   - Form (Checklists/Inspections)

3. **Filters**: Apply conditions
   - Date range: Today, This Week, This Month, This Quarter, Last 30 Days
   - Status: Queued, Scheduled, Working, Clocked Out, Cancelled
   - Assignee: Current User, Specific User, Team, Null (Unassigned)
   - Priority: 1 (Emergency), 2 (High), 3 (Medium), 4 (Low)
   - isField: True (Field Work), False (Office Work)

4. **Grouping**: Organize data by
   - By Assignee (Technician)
   - By Status
   - By Priority
   - By Trade
   - By Customer
   - By Date (Day, Week, Month)

5. **Time Range**: Select period
   - Today
   - This Week
   - This Month
   - This Quarter
   - Last 30 Days
   - Last 90 Days
   - Year-to-date
   - All time

6. **Visualization Type**: Choose chart/table
   - Table (sortable, filterable)
   - Bar Chart (stacked, grouped)
   - Funnel Chart (conversion rates)
   - KPI Card (single metric)
   - Timeline (Gantt-style)
   - Ranking/Leaderboard
   - Status Breakdown (pie chart)

7. **Sorting**: Order results
   - By Date (newest first, oldest first)
   - By Priority (highest first)
   - By Amount (largest first)
   - By Name (alphabetical)

### Step 9: Save Widget

**Button**: Click "Save" after widget configuration

### Step 10: Repeat Steps 7-9 for Each Widget

Continue adding widgets until dashboard is complete (typically 5-7 widgets per dashboard)

### Step 11: Exit Edit Mode

**Toggle**: Switch "Edit mode" to OFF position

### Step 12: Screenshot Dashboard

**Tool**: Playwright MCP `browser_take_screenshot`
**Filename**: `[hub-name]-[dashboard-name]-complete.png`
**Location**: Save to `.playwright-mcp/` directory

---

## Widget Configuration Examples

### Example 1: "Today's Schedule" Widget (Dispatch Hub)

**Purpose**: Show all work orders scheduled for today, grouped by technician

**Configuration**:
- **Widget Name**: "Today's Schedule"
- **Data Source**: Task (Work Orders)
- **Filters**:
  - Date Range: Today
  - Status: Scheduled
- **Grouping**: By Assignee (Technician)
- **Visualization**: Table
- **Columns**: Job ID, Customer Name, Site Address, Appointment Time, Status
- **Sorting**: By Appointment Time (earliest first)

### Example 2: "Unassigned Work Orders" Widget (Dispatch Hub)

**Purpose**: Show open work orders waiting for technician assignment

**Configuration**:
- **Widget Name**: "Unassigned Work Orders"
- **Data Source**: Task (Work Orders)
- **Filters**:
  - Assignee: Null (Unassigned)
  - Status: Open
- **Sorting**: By Priority (highest first), then by Created Date (oldest first)
- **Visualization**: Table
- **Columns**: Job ID, Customer Name, Priority, Created Date, Trade

### Example 3: "Emergency Queue" Widget (Dispatch Hub)

**Purpose**: Show Priority 1 emergency calls with SLA countdown timer

**Configuration**:
- **Widget Name**: "Emergency Queue"
- **Data Source**: Task (Work Orders)
- **Filters**:
  - Priority: 1 (Emergency)
  - Status: Queued, Scheduled
- **Sorting**: By Created Date (oldest first)
- **Visualization**: Table with SLA indicators
- **Columns**: Job ID, Customer Name, Created Date, SLA Timer (minutes remaining)
- **Alerts**: Red highlight if SLA > 15 minutes

---

## Next Steps

This guide will be expanded with:
- Complete screenshots of every step
- Troubleshooting guide for common errors
- Filter patterns library (50+ filter combinations)
- Grouping patterns library
- Time range best practices
- Access control settings guide

**Status**: Foundation complete, ready for dashboard building to begin after Tim renames Hubs.

---

## Related Playbook Documents

- `00_UNIVERSAL_DASHBOARD_PLAYBOOK.md` - Master framework
- `02_DASHBOARD_CATALOG_TEMPLATE.md` - Reusable template for any trade
- `03_DASHBOARD_BEST_PRACTICES.md` - Design patterns
- `04_COPERNIQ_VS_COMPETITORS.md` - Competitive positioning
