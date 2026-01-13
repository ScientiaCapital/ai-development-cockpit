# Coperniq Agentic Platform Architecture

**Created:** 2026-01-13
**Status:** Architecture Documented | Instance 388 Buildout In Progress
**Target:** Full multi-trade MEP platform with Voice AI agents

---

## Vision

Build an AI-first platform for multi-trade MEP contractors that:
1. **Automates dispatch** via intelligent scheduling agents
2. **Handles calls** with voice AI (inbound/outbound)
3. **Manages PM cycles** proactively with contract tracking
4. **Collects payments** via automated follow-up
5. **Integrates with Claude Code/Desktop** via MCP server

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTERACTION LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Claude Code  │  │Claude Desktop│  │  Voice Calls │  │  Coperniq UI     │ │
│  │   (MCP)      │  │    (MCP)     │  │   (Twilio)   │  │  (Webhooks)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COPERNIQ MCP SERVER                                  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    LANGGRAPH ORCHESTRATOR                              │ │
│  │                                                                        │ │
│  │   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌───────────┐  │ │
│  │   │ Supervisor │───▶│  Router    │───▶│  Trade     │───▶│ Executor  │  │ │
│  │   │   Agent    │    │   Agent    │    │  Agents    │    │  Agent    │  │ │
│  │   └────────────┘    └────────────┘    └────────────┘    └───────────┘  │ │
│  │                                                                        │ │
│  │   SUB-AGENTS: HVAC | Plumbing | Electrical | Solar | Fire | Low-V     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         MCP TOOLS                                      │ │
│  │  Work Orders | Assets | Invoices | Scheduling | Contacts | Calls      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      VOICE AI LAYER                                    │ │
│  │  Cartesia TTS (Sonic-3) | Deepgram STT (Nova-3) | Twilio Voice        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COPERNIQ APIs                                      │
│  GraphQL (4037 types) | REST (50+ endpoints) | WebSocket | Phone Service   │
│                                                                             │
│                        COPERNIQ INSTANCE 388                                │
│                      (Kipper Energy Solutions)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Surface

### Endpoints Discovered

| Service | Endpoint | Purpose |
|---------|----------|---------|
| **GraphQL** | `coperniq.dev/project-service/graphql` | Full CRUD (4,037 types) |
| **GraphQL Read** | `coperniq.dev/project-service/graphql-read` | Read-only queries |
| **User Service** | `coperniq.dev/user-service/*` | Company/user management |
| **Phone Service** | `coperniq.dev/phone-service/phone/*` | Twilio integration |
| **Notifications** | `coperniq.dev/notification-service/*` | Push notifications |
| **WebSocket** | `coperniq.dev/socket/` | Real-time events |

### Core Entity Types

| Type | Fields | Use Case |
|------|--------|----------|
| **Task** | 55 | Work orders, service calls, PM visits |
| **Form** | 138 | Inspections, checklists, custom forms |
| **Asset** | 67 | Equipment tracking by trade |
| **Contact** | 192 | Customer database |
| **Site** | 119 | Customer locations |
| **FinancialDocument** | 64 | Invoices, quotes, bills |
| **System** | 106 | Monitored systems (Solar, IoT) |
| **ServicePlan** | 25 | Service agreement templates |
| **ServicePlanInstance** | 41 | Active contracts |
| **Action** | 139 | Workflow automation |
| **TaskVisit** | 18 | Scheduled visits |
| **PaymentRecord** | 26 | Payment tracking |

---

## Source Projects (Tim's Ecosystem)

| Capability | Source Project | Path |
|------------|----------------|------|
| **GraphQL Schema** | bug-hive | `COPERNIQ_SCHEMA.md` |
| **API Discovery** | bug-hive | `COPERNIQ_ANALYSIS.md` |
| **Auth Tokens** | bug-hive | `coperniq_token.json` |
| **TTS (Cartesia)** | voice-ai-core | `voice_core/providers/cartesia.py` |
| **STT (Deepgram)** | voice-ai-core | `voice_core/providers/deepgram.py` |
| **Phone (Twilio)** | voice-ai-core | `voice_core/providers/twilio.py` |
| **LangGraph State** | lang-core | `lang_core/langgraph/state.py` |
| **Multi-Agent** | lang-core | `lang_core/langgraph/builders.py` |
| **Checkpointing** | lang-core | `lang_core/langgraph/checkpoints.py` |
| **LLM Router** | lang-core | `lang_core/providers/selector.py` |
| **Voice Agent** | langgraph-voice-agents | `agents/voice_agent.py` |
| **Trade Router** | langgraph-voice-agents | `agents/coperniq/orchestrator.py` |
| **Twilio Webhooks** | langgraph-voice-agents | `api/routes/twilio.py` |

---

## MCP Server Tools

### Work Order Management
- `coperniq_create_work_order` - Create field work order
- `coperniq_dispatch_technician` - Dispatch tech with route optimization
- `coperniq_complete_work_order` - Complete WO with forms/photos

### Asset Management
- `coperniq_create_asset` - Create equipment asset
- `coperniq_update_asset_status` - Update labels (PM Due, etc.)
- `coperniq_get_pm_due_assets` - Get assets needing service

### Service Agreements
- `coperniq_activate_service_plan` - Activate contract
- `coperniq_get_expiring_contracts` - List expiring contracts

### Scheduling & Dispatch
- `coperniq_get_technician_availability` - Get calendar
- `coperniq_optimize_route` - Route optimization

### Invoicing
- `coperniq_create_invoice` - Generate invoice
- `coperniq_send_invoice` - Email invoice
- `coperniq_get_aging_invoices` - Aging report

### Voice/Calls
- `coperniq_make_outbound_call` - AI outbound call
- `coperniq_log_call` - Log call notes
- `coperniq_send_sms` - Send SMS

### Forms & Inspections
- `coperniq_get_form_template` - Get form template
- `coperniq_submit_form` - Submit completed form

---

## Voice AI Integration

### Providers

| Provider | Service | Features |
|----------|---------|----------|
| **Cartesia Sonic-3** | TTS | 57 emotions, <150ms TTFB, voice cloning |
| **Deepgram Nova-3** | STT | Streaming, diarization, sentiment |
| **Twilio Voice** | Phone | WebSocket, TwiML, media streaming |

### Use Cases

| Use Case | Trigger | Flow |
|----------|---------|------|
| PM Reminder | 7 days before | Outbound → Confirm appointment |
| Invoice Follow-up | 30+ days past due | Outbound → Collection call |
| Appointment Confirm | 24 hours before | Outbound → Confirm visit |
| Inbound Service | Customer call | Route → Create WO |
| Emergency | Gas leak, flooding | Escalate → Immediate dispatch |

---

## Agent Architecture

### Supervisor Pattern (LangGraph)

```python
# From lang-core patterns
from langgraph.graph import StateGraph, END

workflow = StateGraph(MultiTradeState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("hvac_agent", hvac_handler)
workflow.add_node("plumbing_agent", plumbing_handler)
workflow.add_node("electrical_agent", electrical_handler)
workflow.add_node("solar_agent", solar_handler)
workflow.add_node("fire_agent", fire_handler)
workflow.add_node("dispatcher", dispatch_handler)
workflow.add_node("collections", collections_handler)

workflow.set_entry_point("supervisor")
workflow.add_conditional_edges("supervisor", route_to_agent)
```

### State Schema

```python
MultiTradeState = create_state_schema(
    include_tokens=True,
    include_metadata=True,
    extra_fields={
        "active_trade": str,
        "customer_context": dict,
        "work_order": dict,
        "assets": list,
        "next_action": str,
    }
)
```

---

## Implementation Roadmap

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | 2-3 days | MCP server with CRUD tools |
| **Phase 2** | 3-4 days | LangGraph orchestrator + trade agents |
| **Phase 3** | 2-3 days | Voice integration (Twilio/Cartesia/Deepgram) |
| **Phase 4** | 2-3 days | Automations (PM, invoicing, dispatch) |
| **Phase 5** | 1-2 days | Production deployment |

---

## Environment Variables

```bash
# Coperniq
COPERNIQ_API_KEY=...
COPERNIQ_COMPANY_ID=388

# Voice AI
CARTESIA_API_KEY=...
DEEPGRAM_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# LLM (NO OPENAI)
ANTHROPIC_API_KEY=...
OPENROUTER_API_KEY=...  # DeepSeek, Qwen

# Infrastructure
REDIS_URL=...
LANGCHAIN_API_KEY=...
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `docs/SERVICE_PLANS_ROADMAP.md` | 18 service plans documented |
| `docs/COPERNIQ_AGENTIC_PLATFORM.md` | This architecture doc |
| `config/payment-structures/*.json` | Payment templates |
| `config/trade-automations/*.json` | Automation triggers |
| `scripts/deploy_to_coperniq.py` | Deployment script |

---

*Last updated: 2026-01-13 by Claude + Tim*
