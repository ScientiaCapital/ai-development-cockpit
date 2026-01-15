# Coperniq MEP Templates

**Updated:** 2025-01-15
**Status:** Instance 388 Integration | Full Cleanup Complete
**Branch:** `main`

---

## Critical Rules

- **NO OpenAI** - Use Claude, DeepSeek, Qwen via OpenRouter only
- **API keys in .env only** - Never hardcode
- **Use EXACT Coperniq field names** - From bug-hive GraphQL discovery
- **Instance 388 is the backbone** - No sandbox, no separate webapp needed

---

## What This Project Is

MEP template package for Coperniq contractors. Provides pre-built form templates, workflow configurations, and trade-specific catalogs for HVAC, Plumbing, Electrical, Fire Protection, Solar, and more.

**Target Instance:** https://app.coperniq.io/388

---

## GTM Verticals (config/gtm_verticals/)

| Vertical | File | Workflow | Primary Tables |
|----------|------|----------|----------------|
| Solar EPC | `solar_epc.json` | Phase-based | Contact, Site, Project, System |
| HVAC/MEP | `hvac_mep.json` | Phase-based | Contact, Site, Project, Asset, Task |
| O&M Service | `om_service.json` | Ticket-based | Contact, Site, Asset, Task, ServicePlanInstance |
| Multi-Trade | `multi_trade.json` | Hybrid | All types combined |
| Roofing | `roofing_contractor.json` | Phase-based | Contact, Site, Project |

---

## Coperniq GraphQL Types (EXACT Names)

From `COPERNIQ_SCHEMA.md` (bug-hive discovery):

| Type | Fields | Use For |
|------|--------|---------|
| `Contact` | 192 | Customers, leads |
| `Site` | 119 | Customer locations |
| `Project` | - | Jobs, installations |
| `Asset` | 67 | Equipment (HVAC units, panels, water heaters) |
| `Task` | 55 | Work orders, service calls, PM visits |
| `System` | 106 | Monitored systems (solar, IoT) |
| `ServicePlanInstance` | 41 | Active service agreements |
| `FinancialDocument` | 64 | Invoices, quotes |
| `Form` | 138 | Checklists, inspections |

### Key Field Names (camelCase!)

```
Contact: name, emails[], phones[], title, status, source
Site: fullAddress, street, city, state, zipcode, clientId, timezone
Asset: name, type, manufacturer, model, serialNumber, size, installDate, siteId
Task: title, description, status, priority, startDate, endDate, isField, assigneeId, assetId, siteId
System: name, size, status, installedAt, operationalAt, monitored, projectId, siteId
ServicePlanInstance: servicePlanId, clientId, startDate, endDate, durationMonths, totalPrice, status
FinancialDocument: title, type, status, amount, issueDate, dueDate, recordId, clientId
```

---

## Project Structure

```
.
├── config/                      # Configuration files
│   ├── gtm_verticals/           # GTM vertical configs
│   ├── master-catalog/          # Trade-specific catalogs
│   ├── payment-structures/      # Pricing templates
│   ├── project-workflows/       # Workflow definitions
│   ├── service-plans/           # Service agreement templates
│   └── trade-automations/       # Automation rules
├── data/                        # CSV data files
├── docs/                        # Documentation
├── research/                    # Research notes
├── scripts/                     # Utility scripts
├── supabase/                    # Database schemas
├── templates/                   # Form templates
└── tests/                       # Test files
```

---

## Form Field Types (6 types)

| Type | Icon | Use Case |
|------|------|----------|
| Text | `Aa` | Names, notes, serial numbers |
| Numeric | `123` | Measurements, readings |
| Single select | `○` | Yes/No, status, ratings |
| Multiple select | `☑` | Multiple deficiencies |
| File | `📎` | Photos, documents |
| Group | `⊞` | Section headers |

---

## Templates by Trade

### HVAC (7 templates)
- Lead Intake Form
- Site Survey Residential
- Equipment Proposal
- Job Planning Worksheet
- AC System Inspection
- Furnace Safety Inspection
- Refrigerant Tracking Log (EPA 608)

### Plumbing
- Backflow Preventer Test
- Camera Inspection Report
- Water Heater Service

### Electrical
- Panel Inspection
- Circuit Load Analysis

### Solar (3 templates)
- Solar Site Assessment
- Solar Proposal Builder
- Solar Commercial Audit

### Fire Protection (2 templates)
- Sprinkler Inspection (NFPA 25)
- Fire Extinguisher Inspection

---

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://coperniq.dev/project-service/graphql` | Main GraphQL API |
| `https://coperniq.dev/project-service/graphql-read` | Read-only GraphQL |
| Instance: 388 | Production instance |

---

## Development Commands

```bash
# Initialize environment
./init.sh

# Run RALPH loop (template builder)
python ralph_loop.py

# View template inventory
cat TEMPLATE_INVENTORY.md
```

---

## Key Documentation Files

| File | Purpose |
|------|---------|
| `COPERNIQ_SCHEMA.md` | Full GraphQL schema |
| `TEMPLATE_INVENTORY.md` | Current template status |
| `BACKLOG.md` | Remaining work |
| `QUICK_START.md` | Getting started guide |
| `docs/COPERNIQ_REST_API_REFERENCE.md` | REST API reference |

---

## Links

- **Coperniq Instance 388:** https://app.coperniq.io/388
- **Process Studio:** /388/company/studio/templates/form-templates
- **GraphQL:** https://coperniq.dev/project-service/graphql
