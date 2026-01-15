# Coperniq Agentic Platform Architecture

**Created:** 2026-01-13
**Updated:** 2026-01-13 (Sprint Ready - Full Architecture)
**Status:** ✅ Instance 388 Complete | Agent Architecture Ready
**Target:** Full multi-trade MEP platform with Voice AI agents

---

## Vision

Build an AI-first platform for multi-trade MEP contractors that:
1. **Automates dispatch** via intelligent scheduling agents
2. **Handles calls** with voice AI (inbound/outbound)
3. **Manages PM cycles** proactively with contract tracking
4. **Collects payments** via automated follow-up
5. **Integrates with Claude Code/Desktop/Cursor** via MCP server
6. **Spawns subagents** using DeepAgents patterns for parallelization
7. **Enforces 100% review gates** before any production changes

---

## Quick Start: Any Environment

### Claude Code Terminal
```bash
cd ~/projects/coperniq-mep-templates
# Claude Code auto-discovers .mcp/config.json
# User: "Process today's inbound calls"
# → Spawns voice-ai agent → logs calls → creates requests
```

### Cursor IDE
```bash
# .cursor/mcp.json auto-configures MCP server
# Use Cmd+K to invoke agents
```

### Claude Desktop
```bash
# Add to ~/Library/Application Support/Claude/claude_desktop_config.json
# Tools appear in Claude Desktop automatically
```

### CLI Tool (Standalone)
```bash
coperniq-agent spawn voice-ai --input '{"call_from": "+15551234567"}'
coperniq-agent batch --agents pm-scheduler,collections --parallel
```

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

---

## DeepAgents Integration (LangChain Pattern)

### Core Concept

From [LangChain DeepAgents](https://docs.langchain.com/oss/python/deepagents/overview):

> "DeepAgents spawn specialized subagents to handle complex tasks. Each subagent has its own context window, tools, and memory."

### Key Tools from DeepAgents

| Tool | Purpose | Coperniq Use Case |
|------|---------|-------------------|
| `task` | Spawn subagent for specialized work | Spawn dispatch agent for technician assignment |
| `write_todos` | Track task progress | Track PM visit generation progress |
| `file_system` | Read/write files | Generate reports, export data |
| `done` | Signal completion | Mark work order complete |

### Subagent Spawning Pattern

```python
# From DeepAgents: Spawning a specialized agent
async def spawn_dispatch_agent(request: ServiceRequest):
    """
    Spawn a dispatch agent to assign technicians.
    Agent runs in its own context with specialized tools.
    """
    result = await task(
        agent="dispatch",
        prompt=f"""
        Assign a technician for this service request:
        - Trade: {request.trade}
        - Priority: {request.priority}
        - Location: {request.address}
        - Skills needed: {request.skills_required}

        Consider:
        1. Trade match
        2. Geographic proximity
        3. Current workload
        4. Customer history
        """,
        tools=["coperniq_dispatch_technician", "coperniq_get_technician_availability"],
        max_turns=5
    )
    return result
```

### Planning with write_todos

```python
# Track multi-step operations
await write_todos([
    {"task": "Get assets needing PM", "status": "done"},
    {"task": "Generate work orders for March", "status": "in_progress"},
    {"task": "Send appointment confirmations", "status": "pending"},
    {"task": "Update service plan records", "status": "pending"},
])
```

---

## Project-Local MCP Configuration

### File Structure

```
any-project/
├── .mcp/
│   ├── config.json           # MCP server configuration
│   ├── agents/               # Subagent prompt definitions
│   │   ├── voice-ai.md
│   │   ├── dispatch.md
│   │   ├── collections.md
│   │   └── pm-scheduler.md
│   ├── tools/                # Custom MCP tools (Python)
│   │   └── coperniq.py
│   └── gates/                # Review gate definitions
│       ├── pre-deploy.yaml
│       └── data-quality.yaml
├── progress.txt              # Session state (Claude 4 pattern)
├── tests.json                # Test definitions
└── init.sh                   # Environment setup
```

### .mcp/config.json Schema

```json
{
  "name": "coperniq-mep-agent",
  "version": "1.0.0",
  "description": "Coperniq MEP Contractor Agent Platform",

  "environment": {
    "load_from": ".env",
    "required": [
      "COPERNIQ_API_KEY",
      "ANTHROPIC_API_KEY",
      "OPENROUTER_API_KEY"
    ]
  },

  "tools": [
    {
      "name": "coperniq_create_project",
      "description": "Create a new project in Coperniq",
      "handler": ".mcp/tools/coperniq.py:create_project"
    }
  ],

  "agents": [
    {
      "name": "voice-ai",
      "prompt_file": ".mcp/agents/voice-ai.md",
      "tools": ["coperniq_create_request", "coperniq_log_call"],
      "model": "anthropic/claude-sonnet-4",
      "max_turns": 10
    }
  ],

  "review_gates": {
    "pre_deploy": {
      "file": ".mcp/gates/pre-deploy.yaml",
      "required_for": ["deploy", "push"],
      "blocking": true
    }
  },

  "parallelization": {
    "max_concurrent_agents": 4,
    "dependency_graph": {
      "voice-ai": [],
      "dispatch": ["voice-ai"],
      "collections": [],
      "pm-scheduler": []
    }
  }
}
```

---

## 100% Review Gates

### Gate Philosophy

From [Anthropic's Effective Harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents):

> "The key insight is that agents should be constrained to work within safe boundaries, with human review at critical checkpoints."

### Pre-Deploy Gate (.mcp/gates/pre-deploy.yaml)

```yaml
name: Pre-Deploy Review Gate
version: 1.0.0

checks:
  - name: api_key_scan
    type: secret_scan
    patterns: ["sk-ant-*", "password", "secret"]
    fail_on_match: true

  - name: test_coverage
    type: coverage
    minimum: 80
    fail_below: true

  - name: type_check
    type: command
    command: "npm run typecheck || python -m mypy ."

  - name: security_audit
    type: command
    command: "npm audit --audit-level=critical"

approval_required: true
approvers: ["human", "senior_agent"]
```

### Data Quality Gate (.mcp/gates/data-quality.yaml)

```yaml
name: Data Quality Gate
version: 1.0.0

validations:
  project:
    required_fields: [title, client_id]
    field_rules:
      title: {min_length: 3, max_length: 200}
      client_id: {type: integer, positive: true}

  work_order:
    required_fields: [template_id]

  call:
    required_fields: [from_number, to_number, reason, disposition]
    field_rules:
      reason:
        enum: [SERVICE, PRODUCT, PROCESS, ACCOUNTING, REVENUE_OPPORTUNITY, FEEDBACK, OTHER]
      disposition:
        enum: [VISIT_SCHEDULED, INFO_PROVIDED, ISSUE_RESOLVED, FOLLOW_UP, ESCALATION, NO_ACTION, UNRESPONSIVE, OTHER]

fail_on_invalid: true
```

### Gate Enforcement Pattern

```python
class ReviewGate:
    """
    Enforces 100% review before any production action.
    """

    async def check(self, action: str, data: dict) -> GateResult:
        gate_config = self.load_gate_for_action(action)

        results = []
        for check in gate_config.checks:
            result = await self.run_check(check, data)
            results.append(result)

            if not result.passed and check.blocking:
                return GateResult(
                    passed=False,
                    blocking_check=check.name,
                    message=result.message
                )

        if gate_config.approval_required:
            # Queue for human review
            await self.queue_for_approval(action, data, results)
            return GateResult(passed=False, awaiting_approval=True)

        return GateResult(passed=True, results=results)
```

---

## Parallelization Strategy

### Wave-Based Execution

```
Wave 1 (Independent - Run Parallel):
├── voice-ai (process inbound calls)
├── collections (aging invoice follow-up)
└── pm-scheduler (generate PM work orders)

Wave 2 (Depends on Wave 1):
└── dispatch (assign techs to new requests from voice-ai)

Wave 3 (Depends on Wave 2):
└── quote-builder (create quotes for repairs from dispatch)
```

### Dependency Graph Configuration

```json
{
  "parallelization": {
    "max_concurrent_agents": 4,
    "dependency_graph": {
      "voice-ai": [],
      "dispatch": ["voice-ai"],
      "collections": [],
      "pm-scheduler": [],
      "quote-builder": ["dispatch"]
    }
  }
}
```

### Python Implementation

```python
from typing import List
import asyncio

class ParallelOrchestrator:
    """
    Spawns subagents in parallel waves based on dependency graph.
    """

    async def execute_waves(self, tasks: List[AgentTask]):
        completed = set()

        while not all(t.status == "completed" for t in tasks):
            # Find ready tasks (dependencies satisfied)
            ready = [
                t for t in tasks
                if t.status == "pending"
                and all(dep in completed for dep in t.dependencies)
            ]

            # Respect concurrency limit
            batch = ready[:self.config.max_concurrent_agents]

            # Execute batch in parallel
            results = await asyncio.gather(*[
                self.run_with_gate(t) for t in batch
            ])

            # Update completion status
            for task, result in zip(batch, results):
                task.status = "completed"
                task.result = result
                completed.add(task.id)

    async def run_with_gate(self, task: AgentTask):
        """Run agent with pre/post review gates."""

        # Pre-execution gate
        pre_result = await self.gate.check("pre_execute", task.input)
        if not pre_result.passed:
            raise GateError(f"Pre-gate failed: {pre_result.message}")

        # Execute agent
        result = await self.invoke_agent(task)

        # Post-execution validation
        post_result = await self.gate.check("post_execute", result)
        if not post_result.passed:
            raise GateError(f"Post-gate failed: {post_result.message}")

        return result
```

---

## OpenRouter Integration

### Features Reference

| Feature | Documentation | Use Case |
|---------|---------------|----------|
| **Model Routing** | [docs](https://openrouter.ai/docs/features/model-routing) | Auto-select best model for task |
| **Provider Routing** | [docs](https://openrouter.ai/docs/features/provider-routing) | Fallback across providers |
| **Prompt Caching** | [docs](https://openrouter.ai/docs/features/prompt-caching) | Cache system prompts for cost savings |
| **Tool Calling** | [docs](https://openrouter.ai/docs/features/tool-calling) | Native tool use support |
| **ZDR (Zero Data Retention)** | [docs](https://openrouter.ai/docs/features/zdr) | Privacy for sensitive data |
| **Multimodal** | [docs](https://openrouter.ai/docs/features/multimodal/overview) | Images, PDFs support |

### Model Selection Strategy

```python
# Cost-optimized routing
MODEL_ROUTING = {
    # Complex reasoning tasks
    "reasoning": "anthropic/claude-sonnet-4",

    # Code generation (90% cheaper)
    "coding": "deepseek/deepseek-chat",

    # Fast responses
    "fast": "google/gemini-2.0-flash-001",

    # Vision/multimodal
    "vision": "qwen/qwen-2.5-vl-72b-instruct",

    # Bulk processing (cheapest)
    "bulk": "deepseek/deepseek-chat",
}
```

### OpenRouter Client

```python
import httpx

class OpenRouterClient:
    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self, api_key: str):
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://coperniq.io",
            "X-Title": "Coperniq MEP Agent"
        }

    async def chat(
        self,
        model: str,
        messages: list,
        tools: list = None,
        provider_routing: str = "anthropic,google,deepseek"
    ):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers=self.headers,
                json={
                    "model": model,
                    "messages": messages,
                    "tools": tools,
                    "route": provider_routing,
                }
            )
            return response.json()
```

### Available Models (Recommended)

```bash
# List models via API
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

| Model | Provider | Use Case | Cost (per 1M tokens) |
|-------|----------|----------|---------------------|
| `anthropic/claude-sonnet-4` | Anthropic | Complex reasoning | $3.00 |
| `deepseek/deepseek-chat` | DeepSeek | Coding, bulk | $0.14 |
| `google/gemini-2.0-flash-001` | Google | Fast responses | $0.10 |
| `qwen/qwen-2.5-vl-72b-instruct` | Qwen | Vision/multimodal | $0.40 |

---

## Claude 4 Context Engineering Patterns

### From [Anthropic's Context Engineering Guide](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

#### 1. Session State (progress.txt)

```
# Session Progress - 2026-01-13 14:30

## Completed
- [x] Processed 15 inbound calls
- [x] Created 12 service requests
- [x] Dispatched 8 technicians

## In Progress
- [ ] Collections follow-up (23 remaining)

## Blockers
- Customer #4521 requested callback at 3pm

## Next Actions
1. Complete collections batch
2. Generate quotes for approved repairs
```

#### 2. Test Definitions (tests.json)

```json
{
  "voice_ai_tests": [
    {
      "name": "emergency_call_creates_urgent_request",
      "input": {"reason": "NO_HEAT", "temp": 20},
      "expected": {"priority": "EMERGENCY", "sla_hours": 2}
    }
  ],
  "dispatch_tests": [
    {
      "name": "matches_trade_to_technician",
      "input": {"trade": "HVAC"},
      "expected": {"tech_trade": "HVAC"}
    }
  ]
}
```

#### 3. Environment Setup (init.sh)

```bash
#!/bin/bash
# init.sh - Run at session start

# Load environment
source .env

# Verify API access
curl -s -o /dev/null -w "%{http_code}" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  https://api.coperniq.io/v1/work-orders/templates

# Load previous state
cat progress.txt 2>/dev/null || echo "No previous state"

# Check pending tasks
echo "=== Pending Tasks ==="
grep -E "^\- \[ \]" progress.txt 2>/dev/null
```

---

## Agent-Skill Matching Matrix

| Task Domain | Primary Agent | Tools | Model | Parallelizable |
|-------------|---------------|-------|-------|----------------|
| Inbound Calls | voice-ai | create_request, log_call | Claude Sonnet | ✅ |
| Technician Assignment | dispatch | dispatch_technician | Claude Sonnet | After voice-ai |
| Invoice Follow-up | collections | get_aging_invoices, log_call | Claude Sonnet | ✅ |
| PM Scheduling | pm-scheduler | get_pm_due_assets, create_work_order | Claude Haiku | ✅ |
| Quote Generation | quote-builder | create_invoice | Claude Sonnet | After dispatch |
| Template Building | template-builder | form_builder | Claude Sonnet | ✅ |
| Data Ingestion | data-ingestion | CSV parsing | DeepSeek | ✅ |

---

## Sprint Plan: Implementation Phases

### Phase 1: MCP Server Scaffold (2 hours)

| Task | Parallel | Gate |
|------|----------|------|
| Create .mcp/config.json | - | Schema validation |
| Create tools/coperniq.py | ✅ | Type check |
| Create agent prompts (5) | ✅ | Prompt review |
| Create gate definitions | ✅ | YAML validation |

### Phase 2: Tool Implementation (3 hours)

| Task | Parallel | Gate |
|------|----------|------|
| Implement create_project | ✅ | API test |
| Implement create_request | ✅ | API test |
| Implement create_work_order | ✅ | API test |
| Implement dispatch_technician | ✅ | API test |
| Implement create_invoice | ✅ | API test |
| Implement log_call | ✅ | API test |

### Phase 3: Agent Testing (2 hours)

| Task | Parallel | Gate |
|------|----------|------|
| Test voice-ai flow | - | 100% review |
| Test dispatch flow | - | 100% review |
| Test collections flow | - | 100% review |

### Phase 4: Integration (1 hour)

| Task | Parallel | Gate |
|------|----------|------|
| Configure Claude Code | - | - |
| Configure Cursor | - | - |
| End-to-end demo | - | 100% review |

---

## Research Sources

### Anthropic Engineering
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

### LangChain
- [DeepAgents Overview](https://docs.langchain.com/oss/python/deepagents/overview)
- [DeepAgents GitHub](https://github.com/langchain-ai/deepagents)

### OpenRouter
- [Model Routing](https://openrouter.ai/docs/features/model-routing)
- [Provider Routing](https://openrouter.ai/docs/features/provider-routing)
- [Prompt Caching](https://openrouter.ai/docs/features/prompt-caching)
- [Tool Calling](https://openrouter.ai/docs/features/tool-calling)
- [Privacy (ZDR)](https://openrouter.ai/docs/features/zdr)
- [Models List](https://openrouter.ai/models)

---

*Last updated: 2026-01-13 by Claude + Tim*
*Instance 388 - Kipper Energy Solutions - ICP Demo Ready*
