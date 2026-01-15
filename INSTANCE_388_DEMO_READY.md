# Instance 388 - ICP Demo Ready

**Status:** ✅ COMPLETE
**Date:** 2026-01-13
**Instance:** https://app.coperniq.io/388
**Company:** Kipper Energy Solutions

---

## What's Configured

### In Coperniq UI (Live)
| Component | Count | Status |
|-----------|-------|--------|
| Trade Groups | 7 | ✅ Active |
| Service Plans | 18 | ✅ Live |
| Work Order Templates | 20+ | ✅ Live |
| Labels | 32 | ✅ Active |
| Analytics Dashboards | 5 | ✅ Active |
| Payment Structures | 5 | ✅ Configured |
| API Key | 1 | ✅ Generated |

### Config Files Ready for Deployment
| Category | Files | Description |
|----------|-------|-------------|
| Project Workflows | 3 | Solar (9 phases), HVAC (7 phases), Field Service (6 phases) |
| Trade Automations | 2 | Core + trade-specific triggers |
| File Request Workflows | 1 | 8 templates (project docs, insurance, equipment, trade-specific) |
| Payment Structures | 4 | Service agreements, milestone payments, financing |
| GTM Verticals | 4 | Solar EPC, HVAC/MEP, O&M Service, Multi-Trade |
| Master Catalog | 10 | 378+ items across 8 trades |
| Form Templates | 64 | YAML templates by trade and phase |
| Work Order Templates | 6 | Service, PM, Solar, Battery, EV Charger |

---

## API Integration Ready

### Coperniq REST API (Documented)
- **Base URL:** `https://api.coperniq.io/v1`
- **Auth:** `x-api-key` header
- **Reference:** `docs/COPERNIQ_REST_API_REFERENCE.md`

### Key Endpoints for Agent Integration
```
Projects:     POST /v1/projects
Requests:     POST /v1/requests
Work Orders:  POST /v1/projects/{id}/work-orders
Invoices:     POST /v1/invoices
Calls:        POST /v1/projects/{id}/calls
Forms:        PATCH /v1/forms/{id}
Files:        POST /v1/projects/{id}/files/upload
```

### Voice AI Call Logging
```json
{
  "reason": "SERVICE | PRODUCT | PROCESS | ACCOUNTING | REVENUE_OPPORTUNITY | FEEDBACK | OTHER",
  "disposition": "VISIT_SCHEDULED | INFO_PROVIDED | ISSUE_RESOLVED | FOLLOW_UP | ESCALATION | NO_ACTION | UNRESPONSIVE | OTHER",
  "outcome": "ANSWERED | MISSED"
}
```

---

## Demo Scenarios

### 1. Solar Installation Project
- Create project via API with workflow
- Auto-generate phases: Lead → Site Survey → Design → Contract → Permit → Install → Inspection → Interconnect → PTO
- Milestone payments: 10/40/40/10 structure

### 2. HVAC Service Call
- Inbound call logged via Voice AI
- Create request via API
- Dispatch technician via work order template
- Complete form on mobile
- Auto-generate invoice

### 3. PM Reminder Automation
- Service plan triggers seasonal PM
- Auto-create work orders for Gold/Silver customers
- Send appointment confirmation SMS/email

### 4. Multi-Trade O&M Contract
- Property management bundle ($21K/yr)
- Quarterly visits across HVAC, Plumbing, Electrical
- Auto-invoice on schedule

---

## Files Structure

```
coperniq-mep-templates/
├── INSTANCE_388_DEMO_READY.md     # This file
├── config/
│   ├── project-workflows/         # 3 phase-based workflows
│   │   ├── solar-installation-workflow.json
│   │   ├── hvac-installation-workflow.json
│   │   └── field-service-workflow.json
│   ├── trade-automations/         # 7 trade triggers
│   │   ├── core-automations.json
│   │   └── trade-specific-automations.json
│   ├── file-requests/             # 8 file request templates
│   │   └── file-request-workflows.json
│   ├── payment-structures/        # 4 pricing configs
│   ├── gtm_verticals/             # 4 GTM configs
│   ├── master-catalog/            # 378+ catalog items
│   └── service-plans/             # 18 service plan specs
├── templates/
│   ├── hvac/                      # 10 HVAC forms
│   ├── solar/                     # 10 Solar forms
│   ├── electrical/                # 6 Electrical forms
│   ├── plumbing/                  # 6 Plumbing forms
│   ├── fire_protection/           # 5 Fire forms
│   ├── service_plans/             # 4 Service plan forms
│   └── work_orders/               # 6 Work order templates
└── docs/
    ├── COPERNIQ_REST_API_REFERENCE.md    # 40+ endpoints
    ├── COPERNIQ_AGENTIC_PLATFORM.md      # Architecture
    └── SERVICE_PLANS_ROADMAP.md          # Complete roadmap
```

---

## LangChain/Claude Agent SDK Integration

### Agent Capabilities
1. **Voice AI Agent**: Process inbound calls, create requests, schedule visits
2. **Dispatch Agent**: Assign work orders based on tech availability + trade + location
3. **Collections Agent**: Follow up on aging invoices, log call outcomes
4. **PM Scheduler Agent**: Generate seasonal maintenance work orders from service plans
5. **Quote Agent**: Build proposals using catalog items and pricing structures

### MCP Server Tools (Planned)
```python
TOOLS = [
    "coperniq_create_project",
    "coperniq_create_request",
    "coperniq_create_work_order",
    "coperniq_dispatch_technician",
    "coperniq_create_invoice",
    "coperniq_log_call",
    "coperniq_get_pm_due_assets",
    "coperniq_get_expiring_contracts",
    "coperniq_get_aging_invoices"
]
```

---

## ICP Demo Talking Points

### For HVAC Contractors
- "Your technicians fill out the Furnace Safety Inspection on their phone"
- "Refrigerant tracking automatically logs to EPA 608 compliance record"
- "Bronze/Silver/Gold service plans with tiered discounts configured"

### For Solar Contractors
- "9-phase workflow from Lead to PTO, with SLA tracking"
- "Interconnection agreement file request auto-sends when permit approved"
- "ITC Safe Harbor milestone payments (10/40/40/10) built-in"

### For Multi-Trade Contractors
- "One platform, all 7 trades - no context switching"
- "Property managers get one invoice for HVAC + Plumbing + Electrical"
- "32 strategic labels for filtering: PM Due, Emergency, Warranty Expiring"

### For Service Managers
- "Voice AI answers calls, creates tickets, dispatches techs"
- "Aging invoices auto-flagged, collections call logged"
- "Service agreement renewals tracked 60 days out"

---

## Next Steps (Optional Enhancements)

1. **Stripe Onboarding**: Enable payment processing
2. **Solar Monitoring**: Connect Enphase/SolarEdge for O&M alerts
3. **QuickBooks**: Auto-sync invoices
4. **Voice AI**: Deploy Twilio + Deepgram + Cartesia integration
5. **MCP Server**: Build Claude Code integration tools

---

*Instance 388 is ready for ICP demos. All templates, workflows, and API documentation are complete.*
