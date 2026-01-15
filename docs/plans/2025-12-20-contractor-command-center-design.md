# Contractor Command Center - Design Specification

**Created**: 2025-12-20
**Status**: Approved
**Goal**: Full interactive platform where any MEP contractor can browse, fill templates, and talk to AI agents

---

## Overview

A Vercel-ready Next.js platform that gives contractors:
1. **Their world** - Templates, forms, jobs tailored to their trade
2. **Click everywhere** - Full interactive UI, not just an API
3. **3 AI agents** - Natural language assistants that do real work

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              NEXT.JS 14 (App Router)                │
│                  Deploys to Vercel                  │
├─────────────────────────────────────────────────────┤
│  FRONTEND                                           │
│  • shadcn/ui components (polished, fast)            │
│  • Contractor Dashboard                             │
│  • Template Browser with click-to-fill              │
│  • Chat Panel for AI Agents                         │
├─────────────────────────────────────────────────────┤
│  API ROUTES (/api/*)                                │
│  • /api/agents/formfiller                           │
│  • /api/agents/jobhelper                            │
│  • /api/agents/docgen                               │
│  • /api/templates/*                                 │
├─────────────────────────────────────────────────────┤
│  AI LAYER                                           │
│  • Claude Sonnet 4 via Anthropic SDK                │
│  • Vercel AI SDK for streaming chat                 │
└─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────┐
│  SUPABASE                                           │
│  • Contractor configs (mep_contractor_configs)      │
│  • Job/customer seed data                           │
│  • Form submissions (mep_form_submissions)          │
└─────────────────────────────────────────────────────┘
```

---

## The 3 AI Agents (MVP)

### 1. FormFiller Agent

**Purpose**: Auto-populates templates with job context

**Trigger Phrases**:
- "Fill out the AC inspection for..."
- "Start the furnace safety form for..."
- "Complete the refrigerant log for..."

**Tools**:
- `get_template` - Load template structure
- `get_job_details` - Pull job/customer/equipment info
- `fill_form` - Populate fields
- `save_draft` - Save progress

**Example**:
```
User: "Fill out the AC inspection for 456 Elm Street"

FormFiller: "I found the job at 456 Elm Street for Mrs. Chen.
I've pre-filled the inspection form with:
- Customer: Linda Chen
- Equipment: Carrier 24ACC636 (installed 2019)
- Last service: March 2024

Ready to start the inspection. What's the outdoor temp today?"
```

### 2. JobHelper Agent

**Purpose**: Answers questions about jobs, schedule, prep

**Trigger Phrases**:
- "What's on my schedule?"
- "Tell me about the Johnson job"
- "What do I need for tomorrow?"

**Tools**:
- `search_jobs` - Find jobs by customer, date, status
- `get_job_details` - Full job information
- `get_customer_history` - Past work for customer
- `list_equipment` - Equipment at site

**Example**:
```
User: "What do I have tomorrow?"

JobHelper: "Tomorrow (Monday) you have 3 jobs:
1. 8:00 AM - AC Install @ 789 Pine (Martinez) - 3-ton Trane
2. 1:00 PM - Maintenance @ 456 Elm (Chen) - Annual tune-up
3. 4:00 PM - Service call @ 123 Oak (Wilson) - No cooling

The Martinez install needs a permit. Want me to check status?"
```

### 3. DocGen Agent

**Purpose**: Creates professional documents from job data

**Trigger Phrases**:
- "Create invoice for..."
- "Generate proposal for..."
- "Send estimate to..."

**Tools**:
- `generate_invoice` - Create invoice from job
- `generate_proposal` - Create equipment proposal
- `create_pdf` - Render to PDF
- `email_customer` - Send to customer

**Example**:
```
User: "Create invoice for the Martinez install"

DocGen: "I've created Invoice #2024-0892 for the Martinez job:

Martinez Residence - 3-Ton Trane AC Install
Equipment: $4,200
Labor (8 hrs): $960
Permit: $150
Total: $5,310

Ready to send to carlos.martinez@email.com?"
```

---

## Coperniq Schema Alignment

All data uses **exact Coperniq field names** (camelCase) for zero-friction handoff:

| Coperniq Entity     | Key Fields |
|---------------------|------------|
| Contact             | name, emails[], phones[], title, status, source |
| Site                | fullAddress, street, city, state, zipcode, clientId |
| Asset               | name, type, manufacturer, model, serialNumber, installDate |
| Task                | title, description, status, priority, startDate, endDate, assigneeId |
| System              | name, size, status, installedAt, monitored, projectId |
| ServicePlanInstance | servicePlanId, clientId, startDate, durationMonths, totalPrice |
| FinancialDocument   | title, type, status, amount, issueDate, dueDate |

---

## Setup Script

```bash
./scripts/demo_setup.sh --trade=hvac --company="Tim's HVAC"
```

**Creates demo data (Coperniq-native):**

```
config/demo_data/
├── contacts.json      # 5 customers
├── sites.json         # 5 job locations
├── assets.json        # 8 equipment units
├── tasks.json         # 10 jobs (mixed statuses)
├── systems.json       # 3 monitored systems
└── contractor.json    # Company profile + enabled templates
```

**Seed Data Quantities**:
- 5 Contacts (customers)
- 5 Sites (job locations)
- 8 Assets (equipment - mix of HVAC units)
- 10 Tasks (jobs - pending, in-progress, completed)
- 3 Systems (monitored installations)
- 2 ServicePlanInstances (maintenance contracts)
- 3 FinancialDocuments (invoices)

---

## Page Structure

```
/                       → Landing (trade selector)
/dashboard              → Contractor home (today's jobs, alerts)
/templates              → Browse all templates for their trade
/templates/[id]/fill    → Fill out a specific template
/jobs                   → Job list (Tasks in Coperniq terms)
/jobs/[id]              → Job detail page
/customers              → Customer list (Contacts)
/customers/[id]         → Customer detail with history
/chat                   → AI Agent chat interface
/settings               → Company config, preferences
```

---

## UI Components (shadcn/ui)

**Dashboard**:
- Today's jobs card
- Recent activity feed
- Quick actions (new job, fill form)
- Agent chat widget (collapsible)

**Template Browser**:
- Grid/list toggle
- Filter by phase (sales, install, service)
- Search
- Click to preview → Click to fill

**Job Detail**:
- Customer info card
- Equipment list
- Related forms (filled/pending)
- Timeline of activity
- Quick agent actions

**Chat Interface**:
- 3 agent tabs (FormFiller, JobHelper, DocGen)
- Streaming responses
- Quick action buttons
- Context-aware suggestions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| AI | Anthropic Claude Sonnet 4 |
| AI Streaming | Vercel AI SDK |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (optional for MVP) |
| Deployment | Vercel |
| Templates | 60 YAML files (already built) |

---

## File Structure

```
contractor-command-center/
├── app/
│   ├── page.tsx                 # Landing - trade selector
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard
│   ├── templates/
│   │   ├── page.tsx             # Template browser
│   │   └── [id]/
│   │       ├── page.tsx         # Template detail
│   │       └── fill/
│   │           └── page.tsx     # Fill form
│   ├── jobs/
│   │   ├── page.tsx             # Job list
│   │   └── [id]/
│   │       └── page.tsx         # Job detail
│   ├── customers/
│   │   ├── page.tsx             # Customer list
│   │   └── [id]/
│   │       └── page.tsx         # Customer detail
│   ├── chat/
│   │   └── page.tsx             # Agent chat
│   ├── settings/
│   │   └── page.tsx             # Settings
│   └── api/
│       ├── agents/
│       │   ├── formfiller/
│       │   │   └── route.ts
│       │   ├── jobhelper/
│       │   │   └── route.ts
│       │   └── docgen/
│       │       └── route.ts
│       └── templates/
│           └── route.ts
├── components/
│   ├── ui/                      # shadcn components
│   ├── dashboard/
│   ├── templates/
│   ├── jobs/
│   ├── customers/
│   └── chat/
├── lib/
│   ├── agents/
│   │   ├── formfiller.ts
│   │   ├── jobhelper.ts
│   │   └── docgen.ts
│   ├── supabase.ts
│   └── templates.ts
├── scripts/
│   └── demo_setup.sh
└── config/
    └── demo_data/
```

---

## Implementation Order

1. **Setup** - Next.js + shadcn/ui + Supabase connection
2. **Demo Script** - Seed Coperniq-native data
3. **Dashboard** - Landing + trade selector + main dashboard
4. **Templates** - Browser + detail + fill form
5. **Jobs/Customers** - List and detail pages
6. **Agent 1: FormFiller** - Template auto-fill
7. **Agent 2: JobHelper** - Job/schedule queries
8. **Agent 3: DocGen** - Document generation
9. **Polish** - Chat widget, mobile, edge cases
10. **Deploy** - Vercel production

---

## Success Criteria

- [ ] Contractor selects trade → sees relevant templates
- [ ] Can click through all pages (dashboard, templates, jobs, customers)
- [ ] Can fill out a template with pre-populated data
- [ ] Can chat with FormFiller and get a form started
- [ ] Can ask JobHelper "what's on my schedule?"
- [ ] Can ask DocGen to create an invoice
- [ ] Setup script configures everything in one command
- [ ] Deploys to Vercel with one command
- [ ] Data exports match Coperniq CSV format exactly

---

## Notes

- NO OpenAI - Claude only
- API keys in .env only
- Agents can be extended later (more tools, more agents)
- Mobile-responsive from the start
