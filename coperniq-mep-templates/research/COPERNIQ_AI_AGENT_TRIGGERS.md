# Coperniq AI Agent Triggers - Inside Instance 388

**Created:** 2026-01-13
**Status:** ARCHITECTURE SPEC
**Goal:** Enable AI agents to be triggered from INSIDE Coperniq (comments, roles, events)

---

## Executive Summary

Coperniq doesn't natively support @mention triggers or AI agent invocation, but we can build this functionality using:

1. **Webhooks** as the bridge between Coperniq events and Claude agents
2. **Comment patterns** to simulate @mentions
3. **Role-based routing** using automation conditions
4. **An Agent Gateway service** that processes requests and posts results back

---

## Architecture: Event-Driven AI Agents

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         COPERNIQ INSTANCE 388                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         USER ACTIONS                                  │   │
│  │                                                                       │   │
│  │  [Option 1]              [Option 2]              [Option 3]          │   │
│  │  Comment: "@ai-quote     Work Order Status       Service Plan        │   │
│  │  create HVAC quote"      Updated → Complete      Expiring in 30 days │   │
│  │         │                       │                       │            │   │
│  └─────────│───────────────────────│───────────────────────│────────────┘   │
│            │                       │                       │                 │
│            ▼                       ▼                       ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     COPERNIQ AUTOMATIONS                             │   │
│  │                                                                       │   │
│  │  Trigger: Comment Added    Trigger: WO Complete   Trigger: SLA Due   │   │
│  │  Condition: Contains       Action: Call Webhook   Action: Call       │   │
│  │  "@ai-" prefix                                    Webhook            │   │
│  │         │                       │                       │            │   │
│  └─────────│───────────────────────│───────────────────────│────────────┘   │
│            │                       │                       │                 │
│            └───────────────────────┼───────────────────────┘                 │
│                                    │                                         │
│                                    ▼                                         │
│                           ┌──────────────────┐                               │
│                           │   WEBHOOK OUT    │                               │
│                           │   (POST event)   │                               │
│                           └────────┬─────────┘                               │
│                                    │                                         │
└────────────────────────────────────│─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       AI AGENT GATEWAY (Your Server)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                      REQUEST ROUTER                                 │     │
│  │                                                                     │     │
│  │  Parse webhook payload → Extract command → Route to agent          │     │
│  │                                                                     │     │
│  │  "@ai-quote" ─────────→ QuoteAgent                                 │     │
│  │  "@ai-schedule" ──────→ SchedulingAgent                            │     │
│  │  "@ai-inspect" ───────→ InspectionAgent                            │     │
│  │  "WO Complete" ───────→ InvoiceAgent                               │     │
│  │  "SLA Due" ───────────→ RenewalAgent                               │     │
│  │                                                                     │     │
│  └─────────────────────────────┬──────────────────────────────────────┘     │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    CLAUDE AGENT EXECUTION                          │     │
│  │                                                                     │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │     │
│  │  │ QuoteAgent   │  │ ScheduleBot  │  │ InspectionAI │             │     │
│  │  │              │  │              │  │              │             │     │
│  │  │ - List items │  │ - Find slot  │  │ - Generate   │             │     │
│  │  │ - Calc price │  │ - Check tech │  │   checklist  │             │     │
│  │  │ - Create PDF │  │ - Book visit │  │ - Review     │             │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │     │
│  │                                                                     │     │
│  └─────────────────────────────┬──────────────────────────────────────┘     │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                  RESPONSE FORMATTER                                 │     │
│  │                                                                     │     │
│  │  Format agent response → Prepare Coperniq API call                 │     │
│  │                                                                     │     │
│  └─────────────────────────────┬──────────────────────────────────────┘     │
│                                │                                             │
└────────────────────────────────│─────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        COPERNIQ API (Response)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST /v1/comments        → Add AI response as comment                      │
│  POST /v1/financial-docs  → Create quote/invoice                            │
│  POST /v1/tasks           → Create work order                               │
│  PATCH /v1/projects/{id}  → Update project status                           │
│                                                                              │
│                           ▼                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    RESULT IN COPERNIQ                              │     │
│  │                                                                     │     │
│  │  💬 New Comment: "✅ Quote #388-2026-0142 created - $7,500"       │     │
│  │     View: https://app.coperniq.io/388/quotes/142                  │     │
│  │                                                                     │     │
│  │  📋 New Quote: Attached to project with line items                │     │
│  │                                                                     │     │
│  │  📅 New Task: Installation scheduled for Monday 8am               │     │
│  │                                                                     │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation: Three Trigger Methods

### Method 1: Comment-Based @Mentions (Simulated)

Since Coperniq doesn't have native @mention triggers, we simulate them:

**How It Works:**
1. User adds comment: `@ai-quote create HVAC replacement quote for 3-ton system`
2. Coperniq automation detects comment containing `@ai-`
3. Automation calls webhook with comment text + context
4. Agent Gateway parses command, executes, returns result
5. Gateway posts response as new comment

**Coperniq Automation Setup:**
```yaml
Name: "[AI] Comment Handler"
Trigger: Comment Added
Condition:
  - Comment body contains "@ai-"
Action:
  - Call Webhook:
      URL: "https://your-agent-gateway.com/coperniq/comment"
      Method: POST
      Headers:
        Authorization: "Bearer {{env.GATEWAY_TOKEN}}"
      Body:
        comment_id: "{{comment.id}}"
        comment_body: "{{comment.body}}"
        project_id: "{{project.id}}"
        client_id: "{{client.id}}"
        user_name: "{{user.name}}"
```

**Supported @Commands:**
| Command | Agent | Action |
|---------|-------|--------|
| `@ai-quote [description]` | QuoteAgent | Generate quote with catalog items |
| `@ai-schedule [request]` | ScheduleAgent | Find available slot and book |
| `@ai-inspect [equipment]` | InspectionAgent | Generate inspection checklist |
| `@ai-invoice [project]` | InvoiceAgent | Generate invoice from WO |
| `@ai-status` | StatusAgent | Summarize project status |
| `@ai-help` | HelpAgent | List available commands |

---

### Method 2: Role-Based Routing (Assignee Triggers)

Trigger different agents based on WHO is assigned:

**How It Works:**
1. Project assigned to "AI Sales Bot" user
2. Automation detects assignment to AI role
3. Webhook triggers appropriate agent
4. Agent performs action, posts result, re-assigns to human

**Coperniq Automation Setup:**
```yaml
Name: "[AI] Role-Based Quote Generator"
Trigger: Project Assignee Updated
Condition:
  - Assignee = "AI Sales Bot"
  - Project Workflow = "HVAC Sales"
Action:
  - Call Webhook:
      URL: "https://your-agent-gateway.com/coperniq/role-trigger"
      Body:
        role: "quote_generator"
        project_id: "{{project.id}}"
        client_id: "{{client.id}}"
        workflow: "{{workflow.name}}"
```

**AI Roles to Create in Coperniq:**
| Role Name | User Type | Trigger Behavior |
|-----------|-----------|------------------|
| `AI Sales Bot` | Virtual | Generate quotes, send proposals |
| `AI Dispatcher` | Virtual | Schedule jobs, assign techs |
| `AI Inspector` | Virtual | Generate inspection forms |
| `AI Collections` | Virtual | Send payment reminders |

---

### Method 3: Event-Based Triggers (Workflow Automation)

Trigger agents on standard workflow events:

**How It Works:**
1. Work Order status changes to "Complete"
2. Automation fires webhook to Agent Gateway
3. InvoiceAgent generates invoice
4. Agent posts invoice back to Coperniq

**Coperniq Automation Examples:**

```yaml
# Auto-generate invoice when WO complete
Name: "[AI] WO Complete → Invoice"
Trigger: Work Order Status Updated
Condition: Status = "Complete"
Action:
  - Call Webhook:
      URL: "https://your-agent-gateway.com/coperniq/event"
      Body:
        event_type: "wo_complete"
        work_order_id: "{{workOrder.id}}"
        project_id: "{{project.id}}"
        line_items: "{{workOrder.lineItems}}"
        labor_hours: "{{workOrder.laborHours}}"
```

```yaml
# Auto-renewal outreach 30 days before expiration
Name: "[AI] Contract Renewal Agent"
Trigger: Record Stage SLA Violation
Condition: Service Plan expiring in 30 days
Action:
  - Call Webhook:
      URL: "https://your-agent-gateway.com/coperniq/event"
      Body:
        event_type: "contract_expiring"
        service_plan_id: "{{servicePlan.id}}"
        client_id: "{{client.id}}"
        expiration_date: "{{servicePlan.endDate}}"
```

---

## Agent Gateway Implementation

### Project Structure

```
coperniq-agent-gateway/
├── src/
│   ├── server.py              # FastAPI server
│   ├── routes/
│   │   ├── comment.py         # Comment @mention handler
│   │   ├── role_trigger.py    # Role-based triggers
│   │   └── event.py           # Workflow event triggers
│   ├── agents/
│   │   ├── quote_agent.py     # Quote generation
│   │   ├── schedule_agent.py  # Scheduling
│   │   ├── invoice_agent.py   # Invoice creation
│   │   ├── inspection_agent.py # Inspection checklists
│   │   └── status_agent.py    # Status summaries
│   ├── coperniq/
│   │   ├── client.py          # Coperniq API client
│   │   └── models.py          # Pydantic models
│   └── config.py              # Configuration
├── pyproject.toml
├── Dockerfile
└── .env.example
```

### Core Server (FastAPI)

```python
# src/server.py
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import anthropic
import httpx

app = FastAPI(title="Coperniq Agent Gateway")

# Coperniq API client
COPERNIQ_API_URL = "https://api.coperniq.io/v1"
COPERNIQ_API_KEY = os.getenv("COPERNIQ_API_KEY")

# Anthropic client
claude = anthropic.Anthropic()

class CommentWebhook(BaseModel):
    comment_id: str
    comment_body: str
    project_id: str
    client_id: str
    user_name: str

@app.post("/coperniq/comment")
async def handle_comment(payload: CommentWebhook):
    """Handle @ai- comment triggers"""

    # Parse command from comment
    command = parse_ai_command(payload.comment_body)

    if not command:
        return {"status": "ignored", "reason": "no @ai command found"}

    # Route to appropriate agent
    if command.startswith("quote"):
        result = await quote_agent(command, payload)
    elif command.startswith("schedule"):
        result = await schedule_agent(command, payload)
    elif command.startswith("inspect"):
        result = await inspection_agent(command, payload)
    elif command.startswith("status"):
        result = await status_agent(command, payload)
    else:
        result = {"error": f"Unknown command: {command}"}

    # Post response back to Coperniq as comment
    await post_comment(
        project_id=payload.project_id,
        body=format_response(result)
    )

    return {"status": "success", "result": result}


def parse_ai_command(comment: str) -> str | None:
    """Extract @ai-xxx command from comment"""
    import re
    match = re.search(r'@ai-(\w+)\s*(.*)', comment, re.IGNORECASE)
    if match:
        return f"{match.group(1)} {match.group(2)}".strip()
    return None


async def post_comment(project_id: str, body: str):
    """Post comment back to Coperniq"""
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{COPERNIQ_API_URL}/comments",
            headers={"x-api-key": COPERNIQ_API_KEY},
            json={
                "projectId": project_id,
                "body": body,
                "type": "AI_RESPONSE"
            }
        )
```

### Quote Agent Example

```python
# src/agents/quote_agent.py
from anthropic import Anthropic

async def quote_agent(command: str, context: dict) -> dict:
    """
    Generate a quote based on natural language request.

    Example command: "quote create HVAC replacement 3-ton split system"
    """
    client = Anthropic()

    # Get project context from Coperniq
    project = await get_project(context["project_id"])
    catalog = await get_catalog_items(trade="HVAC")

    # Build prompt
    system_prompt = """You are a quote generation assistant for an MEP contractor.

    Given a request, identify the appropriate catalog items and quantities.
    Return a structured JSON with:
    - line_items: [{catalog_item_id, name, quantity, price}]
    - subtotal: number
    - tax: number (8.25%)
    - total: number
    - notes: string (any special considerations)

    Available catalog items:
    {catalog}
    """

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=system_prompt.format(catalog=format_catalog(catalog)),
        messages=[
            {"role": "user", "content": f"Create quote for: {command}\n\nProject: {project['title']}\nCustomer: {project['contact']['name']}"}
        ]
    )

    # Parse response and create quote in Coperniq
    quote_data = parse_quote_response(response.content[0].text)

    created_quote = await create_quote(
        project_id=context["project_id"],
        contact_id=project["contactId"],
        line_items=quote_data["line_items"],
        notes=quote_data["notes"]
    )

    return {
        "quote_id": created_quote["id"],
        "total": quote_data["total"],
        "line_items": len(quote_data["line_items"]),
        "url": f"https://app.coperniq.io/388/quotes/{created_quote['id']}"
    }
```

---

## Email & Phone Integration

### Inbound Email Processing

To trigger agents from emails:

**Option 1: Coperniq Email-to-Comment**
- Configure Coperniq to create comments from inbound emails
- Use Comment Handler automation to detect AI commands

**Option 2: External Email Processor**
```
Email → SendGrid/Postmark webhook → Agent Gateway → Coperniq API
```

```python
@app.post("/email/inbound")
async def handle_inbound_email(payload: EmailPayload):
    """Process inbound email and trigger appropriate agent"""

    # Parse email for AI commands
    if "@ai-" in payload.body:
        command = parse_ai_command(payload.body)
        # Find associated project by sender email
        project = await find_project_by_email(payload.from_email)
        # Route to agent
        return await route_to_agent(command, project)

    # Otherwise, create as regular comment
    return await create_comment_from_email(payload)
```

### Phone Call Integration

To trigger agents from call events:

**Option: Twilio/Vonage webhook → Agent Gateway**
```
Call Event → Twilio → Agent Gateway → Coperniq
```

```python
@app.post("/voice/call-completed")
async def handle_call_completed(payload: TwilioCallPayload):
    """Process completed call and trigger follow-up actions"""

    # Find project by phone number
    project = await find_project_by_phone(payload.from_number)

    # Trigger call summary agent
    summary = await call_summary_agent(
        transcript=payload.transcript,
        duration=payload.duration,
        project=project
    )

    # Post call notes to Coperniq
    await post_comment(
        project_id=project["id"],
        body=f"📞 Call Summary:\n{summary}"
    )
```

---

## Deployment Options

### Option 1: RunPod Serverless (Recommended)
- Low cost, scales to zero when idle
- GPU available if needed for local models
- $0.0001/second when running

### Option 2: Railway/Render
- Simple deployment, always-on
- ~$7/month for basic instance
- Good for development/testing

### Option 3: Your VPS
- Full control
- Run alongside other services
- Docker-based deployment

### Environment Variables

```bash
# Coperniq
COPERNIQ_API_KEY=your-api-key
COPERNIQ_COMPANY_ID=388

# Claude
ANTHROPIC_API_KEY=sk-ant-...

# Gateway
GATEWAY_SECRET=shared-secret-for-webhook-auth
GATEWAY_PORT=8000

# Optional: Email Integration
SENDGRID_API_KEY=...
SENDGRID_INBOUND_WEBHOOK_SECRET=...

# Optional: Voice Integration
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

---

## User Experience Flow

### Example 1: Sales Rep Requests Quote

```
1. Sales rep opens project for "Johnson Residence - AC Replacement"
2. Adds comment: "@ai-quote 3-ton split system with installation labor"
3. Coperniq automation fires → Webhook → Agent Gateway
4. QuoteAgent:
   - Pulls catalog items matching "3-ton split" and "installation"
   - Calculates total with tax
   - Creates quote in Coperniq
5. New comment appears: "✅ Quote #388-2026-0142 created - $7,500
   View: https://app.coperniq.io/388/quotes/142"
6. Sales rep clicks link, reviews, sends to customer
```

### Example 2: Dispatcher Needs Schedule

```
1. Dispatcher opens project needing installation scheduled
2. Adds comment: "@ai-schedule installation next week, needs 2 techs, 6 hours"
3. ScheduleAgent:
   - Checks tech availability
   - Finds open slot
   - Creates work order with assignment
4. New comment: "✅ Installation scheduled for Mon Jan 20 @ 8am
   Assigned: Mike (Lead), Jason (Helper)
   Duration: 6 hours"
```

### Example 3: Automatic Invoice

```
1. Technician completes work order in field
2. Marks WO status = "Complete"
3. Automation triggers → InvoiceAgent
4. InvoiceAgent:
   - Pulls line items from WO
   - Adds labor (logged hours × rate)
   - Creates invoice with payment link
5. Customer receives email: "Invoice Ready - $7,500"
6. Comment added: "📧 Invoice #388-2026-0142 sent to customer@email.com"
```

---

## Next Steps

### Phase 1: Basic @Mention System (Week 1)
- [ ] Deploy Agent Gateway (FastAPI on Railway/RunPod)
- [ ] Implement Comment Handler endpoint
- [ ] Build QuoteAgent with catalog integration
- [ ] Create Coperniq automation for @ai- comments
- [ ] Test end-to-end flow

### Phase 2: Role-Based Agents (Week 2)
- [ ] Create AI virtual users in Coperniq
- [ ] Implement role-trigger endpoints
- [ ] Build ScheduleAgent
- [ ] Build InvoiceAgent
- [ ] Add assignment-based automations

### Phase 3: Event-Driven Agents (Week 3)
- [ ] WO Complete → Auto Invoice
- [ ] Contract Expiring → Renewal Outreach
- [ ] SLA Violation → Escalation
- [ ] New Lead → Welcome Sequence

### Phase 4: Advanced Integrations (Week 4)
- [ ] Email inbound processing
- [ ] Call transcript analysis
- [ ] Multi-agent orchestration
- [ ] Analytics dashboard

---

## Technical Requirements

| Component | Technology | Purpose |
|-----------|------------|---------|
| Agent Gateway | FastAPI + Python 3.11 | Webhook receiver, agent orchestration |
| AI Engine | Claude API (Anthropic) | Natural language processing |
| Deployment | RunPod Serverless | Cost-effective hosting |
| Queue (optional) | Redis | Rate limiting, job queue |
| Monitoring | LangSmith | Agent observability |

---

## Security Considerations

1. **Webhook Authentication**: Use shared secret in headers
2. **API Key Protection**: Never expose in responses
3. **Rate Limiting**: Prevent abuse of AI endpoints
4. **Audit Logging**: Track all agent actions
5. **Input Validation**: Sanitize all webhook payloads

---

**Summary**: While Coperniq doesn't natively support @mention triggers, we can build a powerful AI agent system using webhooks as the bridge. The Agent Gateway receives events from Coperniq, routes to appropriate Claude agents, and posts results back via the REST API.

This gives you ServiceTitan Atlas-level AI capabilities, but **customized for YOUR MEP workflows**.
