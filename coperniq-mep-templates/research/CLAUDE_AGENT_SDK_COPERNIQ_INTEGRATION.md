# Claude Agent SDK + Coperniq Instance 388 Integration

**Created:** 2026-01-13
**Status:** RESEARCH & ARCHITECTURE
**Goal:** Enable AI agents to manage Coperniq MEP workflows via Claude Desktop/Claude Code

---

## Executive Summary

After researching Claude Agent SDK, LangChain 1.0, LangGraph 1.0, CrewAI, and Google ADK, **the recommended approach is building an MCP (Model Context Protocol) server** that exposes Coperniq's REST/GraphQL API to Claude.

**Why MCP?**
- Works with both **Claude Desktop** AND **Claude Code** (your daily tools)
- No additional infrastructure required
- Official Anthropic standard with 16,000+ community servers
- Native integration with Claude Agent SDK

---

## Agent Framework Comparison

| Framework | Best For | Coperniq Fit | Complexity |
|-----------|----------|--------------|------------|
| **MCP Server** | Claude Desktop/Code integration | ⭐⭐⭐⭐⭐ | Low |
| **Claude Agent SDK** | Autonomous coding agents | ⭐⭐⭐⭐ | Medium |
| **LangGraph 1.0** | Complex multi-agent orchestration | ⭐⭐⭐ | High |
| **LangChain 1.0** | Middleware, chains, RAG | ⭐⭐⭐ | Medium |
| **CrewAI** | Role-based agent teams | ⭐⭐ | Medium |
| **Google ADK** | Google Cloud ecosystem | ⭐ | High |

### Recommendation: MCP Server + Claude Agent SDK

```
┌────────────────────────────────────────────────────────────┐
│                    YOUR WORKFLOW                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   ┌─────────────┐    ┌──────────────────┐    ┌─────────┐  │
│   │   Claude    │    │  Coperniq MCP    │    │ Coperniq│  │
│   │   Desktop   │───▶│     Server       │───▶│   API   │  │
│   │  or Code    │    │  (Python/TS)     │    │  v1     │  │
│   └─────────────┘    └──────────────────┘    └─────────┘  │
│                                                            │
│   You: "Create a quote for the HVAC job at 123 Main St"   │
│   Claude: Calls coperniq_create_quote tool                 │
│   MCP Server: POST /v1/financial-documents                 │
│   Result: Quote #388-2026-0142 created                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Coperniq MCP Server Architecture

### Proposed Tools (Phase 1)

| Tool Name | Description | Coperniq Endpoint |
|-----------|-------------|-------------------|
| `coperniq_list_projects` | List active jobs/projects | GET /v1/projects |
| `coperniq_get_project` | Get project details | GET /v1/projects/{id} |
| `coperniq_create_quote` | Create financial document | POST /v1/financial-documents |
| `coperniq_update_quote` | Update quote/invoice | PATCH /v1/financial-documents/{id} |
| `coperniq_list_catalog` | List catalog items | GET /v1/catalog-items |
| `coperniq_add_line_item` | Add item to quote | POST /v1/line-items |
| `coperniq_list_contacts` | List customers | GET /v1/contacts |
| `coperniq_create_task` | Create work order/task | POST /v1/tasks |
| `coperniq_get_schedule` | Get tech schedule | GET /v1/schedule |

### Proposed Resources (Phase 1)

| Resource URI | Description |
|--------------|-------------|
| `coperniq://projects/active` | All active projects |
| `coperniq://catalog/hvac` | HVAC catalog items |
| `coperniq://catalog/electrical` | Electrical catalog items |
| `coperniq://contacts/recent` | Recently accessed contacts |
| `coperniq://templates/forms` | Form templates |

---

## Implementation: Python MCP Server

### Project Structure

```
coperniq-mcp-server/
├── src/
│   ├── __init__.py
│   ├── server.py          # FastMCP server setup
│   ├── tools/
│   │   ├── projects.py    # Project tools
│   │   ├── quotes.py      # Quote/invoice tools
│   │   ├── catalog.py     # Catalog tools
│   │   └── contacts.py    # Contact tools
│   ├── resources/
│   │   └── coperniq.py    # Resource definitions
│   └── api/
│       └── client.py      # Coperniq API client
├── pyproject.toml
├── .env.example
└── README.md
```

### Core Server Implementation

```python
# src/server.py
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
import os

load_dotenv()

# Initialize MCP server
mcp = FastMCP(
    name="coperniq",
    version="1.0.0",
    description="Coperniq MEP Platform Integration"
)

# Coperniq API configuration
COPERNIQ_API_URL = "https://api.coperniq.io/v1"
COPERNIQ_API_KEY = os.getenv("COPERNIQ_API_KEY")
COPERNIQ_COMPANY_ID = os.getenv("COPERNIQ_COMPANY_ID", "388")
```

### Example Tool: Create Quote

```python
# src/tools/quotes.py
import httpx
from mcp.server.fastmcp import FastMCP

@mcp.tool()
async def create_quote(
    contact_id: int,
    project_id: int,
    title: str,
    line_items: list[dict]
) -> dict:
    """
    Create a new quote in Coperniq.

    Args:
        contact_id: The customer's contact ID
        project_id: The associated project/job ID
        title: Quote title (e.g., "HVAC System Replacement")
        line_items: List of items with catalog_item_id, quantity, price

    Returns:
        Created quote with ID and PDF URL

    Example:
        create_quote(
            contact_id=1234,
            project_id=5678,
            title="Residential AC Install - 3 Ton",
            line_items=[
                {"catalog_item_id": 101, "quantity": 1, "price": 4500.00},
                {"catalog_item_id": 102, "quantity": 1, "price": 2500.00}
            ]
        )
    """
    async with httpx.AsyncClient() as client:
        # Create the financial document (quote)
        response = await client.post(
            f"{COPERNIQ_API_URL}/financial-documents",
            headers={
                "x-api-key": COPERNIQ_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "type": "QUOTE",
                "title": title,
                "contactId": contact_id,
                "projectId": project_id,
                "status": "DRAFT"
            }
        )
        response.raise_for_status()
        quote = response.json()

        # Add line items
        for item in line_items:
            await client.post(
                f"{COPERNIQ_API_URL}/line-items",
                headers={
                    "x-api-key": COPERNIQ_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "financialDocumentId": quote["id"],
                    "catalogItemId": item["catalog_item_id"],
                    "quantity": item["quantity"],
                    "unitPrice": item["price"]
                }
            )

        return {
            "quote_id": quote["id"],
            "title": title,
            "status": "DRAFT",
            "url": f"https://app.coperniq.io/{COPERNIQ_COMPANY_ID}/quotes/{quote['id']}"
        }
```

### Example Tool: List Active Projects

```python
@mcp.tool()
async def list_projects(
    status: str = "ACTIVE",
    trade: str | None = None,
    limit: int = 20
) -> list[dict]:
    """
    List projects from Coperniq with optional filtering.

    Args:
        status: Filter by status (ACTIVE, COMPLETED, ON_HOLD)
        trade: Filter by trade (HVAC, ELECTRICAL, PLUMBING, SOLAR)
        limit: Maximum number of results (default 20)

    Returns:
        List of projects with id, title, customer, address, status
    """
    params = {"status": status, "limit": limit}
    if trade:
        params["tradeGroup"] = trade

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{COPERNIQ_API_URL}/projects",
            headers={"x-api-key": COPERNIQ_API_KEY},
            params=params
        )
        response.raise_for_status()
        projects = response.json()

        return [
            {
                "id": p["id"],
                "title": p["title"],
                "customer": p.get("contact", {}).get("name"),
                "address": p.get("site", {}).get("fullAddress"),
                "status": p["status"],
                "trade": p.get("tradeGroup")
            }
            for p in projects
        ]
```

### Running the Server

```python
# src/server.py (continued)
if __name__ == "__main__":
    mcp.run(transport='stdio')
```

---

## Claude Desktop Configuration

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "coperniq": {
      "command": "uv",
      "args": [
        "--directory",
        "/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/coperniq-mcp-server",
        "run",
        "src/server.py"
      ],
      "env": {
        "COPERNIQ_API_KEY": "your-api-key-here",
        "COPERNIQ_COMPANY_ID": "388"
      }
    }
  }
}
```

### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json` with similar configuration.

---

## Claude Code Configuration

Add to `~/.claude/settings.json` or project's `.claude/settings.json`:

```json
{
  "mcpServers": {
    "coperniq": {
      "command": "uv",
      "args": [
        "--directory",
        "/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/coperniq-mcp-server",
        "run",
        "src/server.py"
      ]
    }
  }
}
```

---

## Usage Examples

Once configured, you can interact with Coperniq directly in Claude:

### Natural Language → Coperniq Actions

**You:** "Show me all active HVAC jobs"
**Claude:** *calls `list_projects(status="ACTIVE", trade="HVAC")`*
```
Found 7 active HVAC projects:
1. #2026-0142 - AC Replacement at 123 Main St (Johnson Residence)
2. #2026-0138 - Furnace Install at 456 Oak Ave (Smith Commercial)
...
```

**You:** "Create a quote for the Johnson job with a 3-ton split system and installation labor"
**Claude:** *calls `create_quote(...)` with catalog items*
```
✅ Quote #388-2026-0142 created
- 3 Ton Split AC System: $4,500
- Residential AC Install - 3 Ton: $2,500
- Total: $7,000

View: https://app.coperniq.io/388/quotes/142
```

**You:** "Schedule a tech to start installation next Monday at 8am"
**Claude:** *calls `create_task(...)`*
```
✅ Task created: AC Installation - Johnson Residence
- Date: Monday, Jan 20, 2026 @ 8:00 AM
- Duration: 6 hours
- Assigned to: Available tech (pending assignment)
```

---

## Phase 2: Advanced Features

### Payment Structure Tools

| Tool | Description |
|------|-------------|
| `apply_milestone_schedule` | Apply 50/50, 40/30/30, or custom milestones |
| `add_financing_option` | Attach GreenSky/Synchrony financing |
| `apply_rebate` | Calculate and apply utility rebates |
| `generate_invoice` | Convert quote to invoice |

### Automation Triggers

| Tool | Description |
|------|-------------|
| `setup_pm_schedule` | Create recurring maintenance visits |
| `create_service_agreement` | Generate membership/service contract |
| `send_quote_for_approval` | Email quote to customer |

### AI-Powered Features

| Tool | Description |
|------|-------------|
| `estimate_job_cost` | AI-powered cost estimation |
| `suggest_upsells` | Recommend related catalog items |
| `generate_proposal` | Create professional proposal PDF |

---

## Alternative Approaches (For Reference)

### Option B: LangGraph 1.0 + Claude

If you need multi-agent orchestration (e.g., multiple AI agents reviewing quotes):

```python
from langgraph.graph import StateGraph
from langchain_anthropic import ChatAnthropic

# Define agent state
class QuoteState(TypedDict):
    contact: dict
    project: dict
    line_items: list
    quote: dict | None
    approved: bool

# Create workflow
workflow = StateGraph(QuoteState)
workflow.add_node("fetch_contact", fetch_contact_node)
workflow.add_node("build_quote", build_quote_node)
workflow.add_node("review_quote", review_quote_node)
workflow.add_node("send_quote", send_quote_node)

# Add edges
workflow.add_edge("fetch_contact", "build_quote")
workflow.add_edge("build_quote", "review_quote")
workflow.add_conditional_edges("review_quote", ...)

app = workflow.compile()
```

**When to use LangGraph:** Complex workflows with branching logic, human-in-the-loop approval, or multi-agent collaboration.

### Option C: Claude Agent SDK Direct

For autonomous background agents:

```python
from claude_agent_sdk import query, ClaudeAgentOptions

# Build a Coperniq agent
options = ClaudeAgentOptions(
    system_prompt="""You are a Coperniq MEP operations assistant.
    You help contractors manage jobs, quotes, and schedules.
    Always confirm before making changes to customer data.""",
    mcp_servers={"coperniq": coperniq_server},
    allowed_tools=[
        "mcp__coperniq__list_projects",
        "mcp__coperniq__create_quote",
        "mcp__coperniq__create_task"
    ]
)

async for message in query(
    prompt="Review today's schedule and send reminders",
    options=options
):
    print(message)
```

---

## Implementation Roadmap

### Week 1: Core MCP Server
- [ ] Set up Python project with FastMCP
- [ ] Implement Coperniq API client
- [ ] Build 5 core tools (list_projects, get_project, create_quote, list_catalog, create_task)
- [ ] Test with Claude Desktop

### Week 2: Claude Code Integration
- [ ] Add to Claude Code settings
- [ ] Test from terminal workflows
- [ ] Build payment structure tools
- [ ] Add catalog search/filter tools

### Week 3: Advanced Tools
- [ ] Milestone payment automation
- [ ] Service agreement creation
- [ ] Quote PDF generation
- [ ] Email/notification tools

### Week 4: Polish & Documentation
- [ ] Error handling & retries
- [ ] Rate limiting
- [ ] Documentation
- [ ] Demo video

---

## Sources

- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Claude Agent SDK Python](https://github.com/anthropics/claude-agent-sdk-python)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Tutorial: Build Your First Server](https://towardsdatascience.com/model-context-protocol-mcp-tutorial-build-your-first-mcp-server-in-6-steps/)
- [LangChain & LangGraph 1.0 Announcement](https://blog.langchain.com/langchain-langgraph-1dot0/)
- [Anthropic Introduction to MCP Course](https://anthropic.skilljar.com/introduction-to-model-context-protocol)

---

## Next Steps

1. **Create the MCP server project** in `/coperniq-mcp-server`
2. **Implement core tools** using Coperniq REST API
3. **Configure Claude Desktop** to use the server
4. **Test with real workflows** (creating quotes, scheduling jobs)
5. **Expand to payment structures** (milestones, financing, rebates)
