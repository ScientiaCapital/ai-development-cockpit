# E2B Sandbox GTM Motion - Design Document

> **Handoff to**: ai-development-cockpit team
> **Date**: 2025-12-20
> **Status**: Ready for implementation planning

---

## Executive Summary

Pre-sales GTM motion enabling Academy graduates to experience Coperniq's AI capabilities with their own data before committing to a live instance. Time-boxed 30-60 day sandbox demonstrates immediate value, then converts to paid Coperniq subscription.

**Differentiator**: ServiceTitan and BuildOps offer dashboards. Coperniq offers AI that *computes* on contractor data.

---

## Architecture Overview

```
Academy Graduate
      ↓
Vertical Selection (4 templates)
├── Solar EPC
├── HVAC/MEP
├── O&M Service
└── Multi-Trade Bundle
      ↓
CSV Upload (6 months history)
├── clients.csv
├── projects.csv
├── work_orders.csv
└── invoices.csv
      ↓
E2B Sandbox (30-60 day trial)
├── Pre-configured Supabase schema
├── LangGraph agents (already built)
├── Claude NL interface
└── Their data, ready to query
      ↓
Trial Expires → "Go live with Coperniq"
```

**Key Components:**
- **Template Engine**: JSON configs per vertical (schema, workflows, properties)
- **CSV Ingestor**: Validates + transforms uploads into Coperniq schema
- **E2B Runtime**: Isolated sandbox per user with expiration
- **Agent Layer**: Existing sales-agent LangGraph code, pointed at sandbox

---

## Template Structure (4 Verticals)

### Template: Solar EPC

| Element | Configuration |
|---------|---------------|
| **Schema** | clients, sites, projects |
| **Phases** | Sales → Design → Permit → Install → PTO → Interconnect |
| **Properties** | system_size_kw, panel_count, inverter_type, utility_provider, ahj |
| **Agents** | fleet_performance, permit_tracker, install_scheduler, interconnection_status |
| **Sample Queries** | "Show production vs design", "Which permits are overdue?" |

### Template: HVAC/MEP

| Element | Configuration |
|---------|---------------|
| **Schema** | clients, sites, projects |
| **Phases** | Bid → Award → Submittal → Install → Commission → Closeout |
| **Properties** | tonnage, equipment_type, permit_type, inspection_status |
| **Agents** | job_profitability, crew_scheduler, equipment_tracker |
| **Sample Queries** | "What's my margin by job type?", "Schedule next week's installs" |

### Template: O&M Service

| Element | Configuration |
|---------|---------------|
| **Schema** | clients, assets, work_orders, service_agreements |
| **Phases** | N/A (ticket-based) |
| **Properties** | asset_type, warranty_status, service_interval, last_service_date |
| **Agents** | maintenance_scheduler, warranty_tracker, asset_health |
| **Sample Queries** | "Which systems need service this month?", "Show warranty expirations" |

### Template: Multi-Trade Bundle

| Element | Configuration |
|---------|---------------|
| **Schema** | All of the above combined |
| **Phases** | Per-trade phase sets |
| **Properties** | Union of all vertical properties |
| **Agents** | All agents + cross_trade_profitability, resource_optimizer |
| **Sample Queries** | "Compare profitability: Solar vs HVAC", "Optimize crew across trades" |

---

## CSV Ingestion & Mapping

### Required CSVs per Vertical

| CSV | Required Columns | Optional Columns |
|-----|------------------|------------------|
| `clients.csv` | name, email, phone, address | company, source, created_date |
| `projects.csv` | client_name, project_name, status, start_date | value, phase, assigned_to |
| `work_orders.csv` | project_name, wo_type, scheduled_date, status | crew, duration, notes |
| `invoices.csv` | project_name, amount, date, status | paid_date, line_items |

### Smart Column Mapping

```python
# Fuzzy matching for common variations
COLUMN_ALIASES = {
    "client_name": ["customer", "client", "account", "company_name"],
    "project_name": ["job", "job_name", "project", "project_id"],
    "scheduled_date": ["date", "start", "scheduled", "appt_date"],
    "status": ["state", "stage", "phase", "wo_status"]
}
```

### Validation Rules

- Required columns present (or mapped via aliases)
- Date formats parseable (ISO, US, EU formats supported)
- Email/phone format check (warn, don't block)
- Duplicate detection (by name + date)

### Post-Import Summary

```
✓ 847 clients imported
✓ 234 projects imported (12 skipped - missing client)
✓ 1,892 work orders imported
✓ 198 invoices imported
⚠ 3 warnings: invalid phone formats (row 12, 89, 203)

Your sandbox is ready. Ask Claude anything.
```

---

## E2B Sandbox Runtime & Trial Expiration

### Sandbox Lifecycle

```
Day 0: Academy certified → Vertical selected → CSV uploaded
       ↓
Day 1-30: Full sandbox access
       - Unlimited Claude queries
       - All vertical agents active
       - Data persists across sessions
       ↓
Day 25: Email: "5 days left - schedule your Coperniq demo"
       ↓
Day 30: Sandbox freezes (read-only)
       - Can view past queries/charts
       - Cannot run new analysis
       - CTA: "Go live with Coperniq"
       ↓
Day 60: Sandbox deleted
       - Data purged
       - Must re-upload if they return
```

### Technical Stack

| Component | Technology |
|-----------|------------|
| Sandbox Runtime | E2B (e2b.dev) |
| Database | Supabase (isolated schema per user) |
| Agents | LangGraph (existing sales-agent) |
| NL Interface | Claude via Anthropic API |
| Frontend | Next.js (Academy extension) |
| Trial Management | Supabase + cron job |

---

## Killer Use Cases (Demo Scripts)

### 1. Fleet Performance Analysis
```
User: "Show me my solar fleet performance vs. last month"

Agent:
- Queries fact_cpq_asset_readings in sandbox
- Generates production comparison chart
- Identifies underperforming systems needing service
```

### 2. Crew Scheduling Optimization
```
User: "Calculate crew scheduling for next week's installs"

Agent:
- Pulls work orders from Coperniq schema
- Runs optimization algorithm in sandbox
- Outputs optimal route + crew assignments
```

### 3. Cross-Trade Profitability
```
User: "What's my true job profitability across trades?"

Agent:
- Queries invoices, timesheets, materials
- Runs P&L calculation in sandbox
- Shows profit by trade (Solar vs HVAC vs Electrical)
```

### 4. Utility Bill Analysis
```
User: [Uploads utility bill PDF]
"Analyze this for solar sizing"

Agent:
- Extracts data in sandbox (OCR + parsing)
- Returns solar/battery sizing recommendation
```

---

## Integration Points

### Existing Assets to Leverage

| Asset | Location | Status |
|-------|----------|--------|
| LangGraph Agents | `sales-agent/` | Ready |
| Supabase Schema | `dim_*`, `fact_*` tables | Ready |
| Academy Platform | `05-academy/web/` | Deployed |
| GTME Templates | `05-gtme-motions/` | Synced |

### New Components Needed

| Component | Owner | Priority |
|-----------|-------|----------|
| E2B Integration | ai-development-cockpit | P0 |
| CSV Ingestor | ai-development-cockpit | P0 |
| Template JSON Configs | Coperniq team | P1 |
| Trial Management UI | Academy team | P1 |
| Expiration Emails | Marketing | P2 |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Academy → Sandbox Activation | 60% of graduates |
| CSV Upload Completion | 80% of activations |
| Queries per Trial | 20+ per user |
| Trial → Paid Conversion | 25% |
| Time to First Insight | < 5 minutes post-upload |

---

## Handoff Checklist

- [x] Architecture approved
- [x] Template structure defined (4 verticals)
- [x] CSV mapping spec complete
- [x] Trial lifecycle documented
- [ ] E2B account setup (ai-development-cockpit)
- [ ] Template JSON files created
- [ ] Integration with existing sales-agent
- [ ] Academy UI for sandbox onboarding

---

**Next Step**: ai-development-cockpit team to create implementation plan using this design.
