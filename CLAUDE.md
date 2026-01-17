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
| `https://api.coperniq.io/v1` | REST API (primary) |
| `https://coperniq.dev/project-service/graphql` | Main GraphQL API |
| `https://coperniq.dev/project-service/graphql-read` | Read-only GraphQL |
| Instance: 388 | Production instance |

---

## ⚠️ CRITICAL: Coperniq API Rate Limits

**Coperniq has VERY aggressive rate limits. This section is MANDATORY reading.**

### Empirical Findings (2026-01-16)

| Delay | Result |
|-------|--------|
| Parallel (0ms) | ❌ HTTP 429 immediately |
| 200ms between requests | ❌ HTTP 429 |
| 500ms between requests | ❌ HTTP 429 |
| **1000ms between requests** | ✅ Works (recommended minimum) |

### Required Pattern

**NEVER make parallel Coperniq API calls.** Always use sequential requests with delays:

```typescript
// ❌ WRONG - will get rate limited
const [clients, projects] = await Promise.all([
  fetch('/v1/clients'),
  fetch('/v1/projects'),
]);

// ✅ CORRECT - sequential with 1000ms delay
const clients = await fetch('/v1/clients');
await new Promise(r => setTimeout(r, 1000));
const projects = await fetch('/v1/projects');
```

### Unified Endpoint Solution

The app uses `/api/coperniq/all` which:
1. Makes sequential API calls with 1000ms delays
2. Caches results for 5 minutes (300 seconds)
3. Prevents frontend from hitting Coperniq directly

**All dashboard components should use this unified endpoint, NOT individual Coperniq endpoints.**

### Rate Limit Recovery

- Coperniq doesn't return standard rate limit headers (`X-RateLimit-*`)
- Recovery time is unclear (observed 5-15 minutes)
- Once rate limited from Vercel IPs, all endpoints return 429
- Local testing may work while Vercel is rate-limited (different IPs)

### Configuration

```
REQUEST_DELAY = 1000;  // ms between Coperniq calls (DO NOT REDUCE)
CACHE_TTL = 300;       // 5 minutes server-side cache
FRONTEND_CACHE = 30;   // 30 seconds client-side cache
```

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
