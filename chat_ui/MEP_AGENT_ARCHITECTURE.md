# MEP Agent Architecture Guide

**Created**: 2026-01-15
**Based on**: Official Claude documentation + 4 research agent findings
**Purpose**: Set up all MEP agents correctly with skills and MCP tools for async operation

---

## Cost Optimization Strategy

**Customer-Facing Surface**: Anthropic Claude (brand trust, quality)
**Backend Workhorses**: OpenRouter models at 1/10th cost

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Interface                        │
│              "Powered by Claude" branding                    │
│           (Trust, quality perception, premium UX)            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Intelligent Router                        │
│                                                              │
│   Simple Q&A ───────────► DeepSeek V3.2 ($0.14/MTok)        │
│   Form Generation ──────► Qwen3-Coder ($0.90/MTok)          │
│   Complex Reasoning ────► Claude Opus ($5/$25 MTok)         │
│   Vision/Equipment ─────► Qwen3 VL ($0.10/MTok)             │
│   Speed-Critical ───────► Groq Llama (<100ms)               │
└─────────────────────────────────────────────────────────────┘
```

### Cost Comparison (1M tokens)

| Task | Claude Only | Multi-Provider | Savings |
|------|-------------|----------------|---------|
| Simple chat | $5.00 | $0.14 (DeepSeek) | **97%** |
| Code generation | $15.00 | $0.90 (Qwen) | **94%** |
| Complex reasoning | $5.00 | $5.00 (Claude) | 0% |
| Image analysis | $5.00 | $0.10 (Qwen VL) | **98%** |

**Strategy**: Claude handles the 10-20% of requests requiring premium reasoning. OpenRouter handles the other 80-90% at 1/10th cost.

---

## Coperniq Instances

| Instance | URL | Purpose | Status |
|----------|-----|---------|--------|
| **112** | https://app.coperniq.io/112 | Primary test instance | Active |
| **93** | https://app.coperniq.io/93 | Secondary test instance | Active |
| **388** | https://app.coperniq.io/388 | Original Kipper Energy | Active |

**Multi-Instance Architecture**:
```typescript
// Environment-based instance selection
const COPERNIQ_INSTANCES = {
  '112': { apiKey: process.env.COPERNIQ_API_KEY_112, name: 'Instance 112' },
  '93': { apiKey: process.env.COPERNIQ_API_KEY_93, name: 'Instance 93' },
  '388': { apiKey: process.env.COPERNIQ_API_KEY_388, name: 'Kipper Energy' },
};

// Select instance per request
const instance = COPERNIQ_INSTANCES[req.query.instance || '388'];
```

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Claude Tool Use (Current Implementation)](#2-claude-tool-use-current-implementation)
3. [MCP Server Integration](#3-mcp-server-integration)
4. [Claude Agent SDK (Subagents)](#4-claude-agent-sdk-subagents)
5. [Skills System](#5-skills-system)
6. [Tool Search for Scale](#6-tool-search-for-scale)
7. [MEP-Specific Implementation](#7-mep-specific-implementation)
8. [Best Practices](#8-best-practices)

---

## 1. Architecture Overview

### Current State (Chat UI)
```
User → Chat UI → Next.js API Route → Claude API + Tools → Coperniq API
                                   ↓
                              Agentic Loop (MAX 5 iterations)
                                   ↓
                              Tool Results → Final Response
```

### Target State (Full MEP Platform)
```
                    ┌──────────────────────────────────────┐
                    │         MEP Orchestrator             │
                    │    (Claude Agent SDK + Skills)       │
                    └──────────────────┬───────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐            ┌───────────────┐            ┌───────────────┐
│ HVAC Agent    │            │ Plumbing Agent│            │ Electrical    │
│ Tools: Read,  │            │ Tools: Read,  │            │ Agent         │
│ get_work_orders│           │ get_contacts  │            │ Tools: Read,  │
└───────────────┘            └───────────────┘            │ Bash(calc)    │
                                                          └───────────────┘
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │        Coperniq MCP Server           │
                    │  (Instance 388 - Work Orders, etc.)  │
                    └──────────────────────────────────────┘
```

---

## 2. Claude Tool Use (Current Implementation)

### What We Built (route.ts)

**Location**: `src/app/api/chat/route.ts`

```typescript
// Tool definitions for Coperniq
const TOOLS = [
  {
    name: 'get_work_orders',
    description: 'Get work orders from Coperniq...',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['all', 'pending', 'scheduled', 'in_progress', 'completed'] },
        trade: { type: 'string', enum: ['all', 'HVAC', 'Plumbing', 'Electrical', 'Solar', 'Fire Protection'] },
        limit: { type: 'number', description: 'Maximum results. Default 10.' }
      },
      required: []
    }
  },
  // get_contacts, get_projects...
];

// Agentic loop pattern
while (loopCount < MAX_LOOPS) {
  const response = await fetch(ANTHROPIC_API_URL, {
    body: JSON.stringify({
      model: modelId,
      tools: TOOLS,
      messages: conversationMessages,
    }),
  });

  if (data.stop_reason === 'tool_use') {
    // Execute tool, add results, continue loop
  }
}
```

### Key Patterns

1. **Tool Schema**: Use JSON Schema with `type: 'object'`, `properties`, `required`
2. **Agentic Loop**: Keep calling Claude until `stop_reason === 'end_turn'`
3. **Tool Results**: Return as `tool_result` content blocks with matching `tool_use_id`

### Production Enhancements (To Add)

```typescript
// Add strict mode for guaranteed schema compliance
{
  name: 'get_work_orders',
  strict: true,  // NEW: Guarantees inputs match schema
  input_schema: {
    // ...
    additionalProperties: false  // Required for strict mode
  }
}
```

---

## 3. MCP Server Integration

### Option A: Direct MCP from API (Recommended for Production)

Use the MCP Connector beta to connect Claude API directly to MCP servers:

```typescript
// Next.js API Route with MCP
const response = await fetch(ANTHROPIC_API_URL, {
  headers: {
    'anthropic-beta': 'mcp-client-2025-11-20',  // Enable MCP connector
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    mcp_servers: [{
      type: 'url',
      name: 'coperniq-mcp',
      url: 'https://your-mcp-server.com/sse',
      authorization_token: process.env.COPERNIQ_MCP_TOKEN
    }],
    tools: [{
      type: 'mcp_toolset',
      mcp_server_name: 'coperniq-mcp',
      // Optional: restrict to specific tools
      default_config: { enabled: true }
    }],
    messages: conversationMessages
  })
});
```

### Option B: Build Your Own MCP Server

**Python (FastMCP):**

```python
# mcp-servers/coperniq/server.py
from mcp.server.fastmcp import FastMCP
import os, httpx

app = FastMCP("coperniq-mcp")

@app.tool()
async def get_work_orders(
    status: str = "all",
    trade: str = "all",
    limit: int = 10
) -> dict:
    """Get work orders from Coperniq Instance 388.

    Args:
        status: Filter by status (all, pending, scheduled, in_progress, completed)
        trade: Filter by trade (all, HVAC, Plumbing, Electrical, Solar, Fire Protection)
        limit: Maximum results to return
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{os.environ['COPERNIQ_API_URL']}/requests",
            headers={'x-api-key': os.environ['COPERNIQ_API_KEY']}
        )
        work_orders = response.json()

        # Apply filters
        if status != "all":
            work_orders = [wo for wo in work_orders if wo.get('status') == status]
        if trade != "all":
            work_orders = [wo for wo in work_orders if wo.get('trade') == trade]

        return {"total": len(work_orders[:limit]), "work_orders": work_orders[:limit]}

@app.tool()
async def create_work_order(
    title: str,
    trade: str,
    customer_id: str,
    description: str = "",
    priority: str = "normal"
) -> dict:
    """Create a new work order in Coperniq."""
    # Implementation...

if __name__ == "__main__":
    app.run()
```

### MCP vs Direct Tools: When to Use Each

| Scenario | Use Direct Tools | Use MCP Server |
|----------|------------------|----------------|
| < 10 tools | ✅ | Overkill |
| 10-50 tools | Consider | ✅ Recommended |
| 50+ tools | ❌ Context bloat | ✅ + Tool Search |
| Tools shared across apps | ❌ | ✅ |
| Desktop + API both need tools | ❌ | ✅ |

---

## 4. Claude Agent SDK (Subagents)

### Defining Trade-Specific Subagents

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

# HVAC Inspection Agent (Read-only analysis)
hvac_inspector = AgentDefinition(
    description="HVAC system inspection specialist. Use for AC units, furnace, refrigerant analysis, zone balance assessments.",
    prompt="""You are an HVAC inspection expert for Kipper Energy Solutions.

Your expertise:
- EPA 608 certified refrigerant handling
- NATE certification standards
- Manual J load calculations
- ACCA Quality Installation guidelines

When analyzing equipment:
1. Check model/serial numbers
2. Verify refrigerant charge (R-410A, R-22 phase-out)
3. Assess ductwork sizing
4. Calculate efficiency metrics

Use get_work_orders to see scheduled HVAC jobs.
Use get_contacts to verify customer information.""",
    tools=["Read", "Grep", "Glob", "get_work_orders", "get_contacts"]  # Read-only
)

# Form Template Generator (Full write access)
form_generator = AgentDefinition(
    description="Template builder for MEP inspection forms. Creates YAML/JSON definitions for Coperniq import.",
    prompt="""Generate professional form templates for MEP contractors.

Template structure:
- Field groups (Equipment Info, Inspection Checklist, Findings)
- Field types (text, number, select, checkbox, photo, signature)
- Validation rules
- Branching logic

Output clean YAML compatible with Coperniq Process Studio import.""",
    tools=["Read", "Write", "Edit", "Grep", "Glob"]  # Can create files
)
```

### Orchestrator Pattern

```python
async def mep_orchestrator():
    """Main orchestrator delegates to trade-specific agents."""

    async for message in query(
        prompt="""You are the MEP Operations Coordinator for Kipper Energy Solutions.

Your role is to delegate work to specialized agents:
- HVAC Inspector: AC/furnace inspections, refrigerant tracking
- Plumbing Specialist: Backflow tests, water heater service
- Electrical Analyzer: Panel inspections, load calculations
- Form Generator: Create/update inspection templates

When a user asks about a specific trade, delegate to that agent.
When they need forms built, delegate to Form Generator.

Always verify work orders in Coperniq before dispatching.""",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Glob", "Task"],  # Task = spawn subagents
            agents={
                "hvac-inspector": hvac_inspector,
                "plumbing-specialist": plumbing_specialist,
                "electrical-analyzer": electrical_analyzer,
                "form-generator": form_generator
            }
        )
    ):
        yield message
```

### Parallel Execution (Multiple Trades at Once)

```python
# Validate template across all trades simultaneously
prompt = """
Validate the Universal Equipment Inspection template using all available agents:
- Use HVAC Inspector to check HVAC-specific fields
- Use Plumbing Specialist to verify plumbing requirements
- Use Electrical Analyzer to confirm electrical safety fields

Run ALL validations in PARALLEL. Report findings from each agent.
"""
```

### Agent Resumption (Continue Interrupted Work)

```python
# First session: Start building template
session_id = None
async for message in query(prompt="Design HVAC Panel Inspection form..."):
    if hasattr(message, "session_id"):
        session_id = message.session_id  # Save this!

# Second session: Resume with feedback
async for message in query(
    prompt="Add photo capture and signature fields",
    options=ClaudeAgentOptions(resume=session_id)  # Continue context
):
    pass  # Full context preserved
```

---

## 5. Skills System

### Skill Structure

```
.claude/skills/mep-form-builder/
├── SKILL.md           # Main instructions (required, <500 lines)
├── REFERENCE.md       # Detailed API docs (loaded on demand)
├── EXAMPLES.md        # Real-world usage patterns
├── TEMPLATES/         # Form templates
│   ├── hvac-inspection.yaml
│   ├── plumbing-inspection.yaml
│   └── electrical-inspection.yaml
└── scripts/
    └── validate_form.py  # Executed, not loaded into context
```

### SKILL.md Format

```yaml
---
name: mep-form-builder
description: Create inspection forms and checklists for HVAC, plumbing, electrical work in Coperniq. Use when building templates, creating field inspection checklists, designing equipment audit forms, or implementing trade-specific workflows.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# MEP Form Builder

## When to Use
- Creating new inspection forms
- Modifying existing templates
- Building trade-specific checklists
- Generating Coperniq-compatible YAML

## Quick Start

1. Define form structure:
```yaml
form:
  name: HVAC Equipment Inspection
  fields:
    - name: technician_id
      type: text
      required: true
    - name: equipment_make
      type: text
    - name: refrigerant_type
      type: select
      options: [R-410A, R-22, R-32]
```

2. Validate: `python scripts/validate_form.py form.yaml`
3. Import to Coperniq Process Studio

## Files Involved
- `COPERNIQ_SCHEMA.md` - GraphQL types reference
- `TEMPLATES/` - Pre-built form templates

For complete field reference, see [REFERENCE.md](REFERENCE.md).
```

### Progressive Disclosure (How Skills Load)

| Level | When Loaded | What's Included |
|-------|-------------|-----------------|
| 1 | Always (startup) | Only `name` and `description` (~100 tokens) |
| 2 | When triggered | SKILL.md body (~5k tokens max) |
| 3 | As needed | REFERENCE.md, scripts (via bash, no token cost) |

### Recommended MEP Skills to Create

1. **mep-form-builder** (CRITICAL)
   - Create Coperniq form templates
   - Triggers: "form template", "inspection checklist", "build form"

2. **mep-coperniq-schema** (Reference)
   - Task, Contact, Site, Asset, System schema
   - Triggers: "Coperniq schema", "GraphQL types"

3. **mep-trade-patterns** (Domain)
   - HVAC/Plumbing/Electrical inspection patterns
   - Triggers: trade names, "inspection", "service call"

4. **coperniq-api-operations** (API)
   - GraphQL mutations, authentication
   - Triggers: "create task", "update asset", "API"

---

## 6. Tool Search for Scale

When you have 50+ tools (MCP servers + direct tools), use Tool Search:

```typescript
// Enable tool search for large tool sets
const response = await fetch(ANTHROPIC_API_URL, {
  headers: {
    'anthropic-beta': 'advanced-tool-use-2025-11-20',  // Tool search
  },
  body: JSON.stringify({
    tools: [
      // Tool search tool (always loaded)
      { type: 'tool_search_tool_regex_20251119', name: 'tool_search' },

      // Deferred tools (not loaded until discovered)
      {
        name: 'get_work_orders',
        defer_loading: true,  // Won't consume context until searched
        // ... schema
      },
      {
        name: 'create_work_order',
        defer_loading: true,
        // ... schema
      },
      // ... 100+ more tools
    ],
    messages: conversationMessages
  })
});
```

### Benefits
- **85% token reduction**: Tool definitions don't consume context until needed
- **Accuracy improvement**: Opus 4.5: 79.5% → 88.1% on MCP evaluations
- **Scalability**: Handle 10,000+ tools

---

## 7. MEP-Specific Implementation

### Phase 1: Enhance Current Chat (Week 1)

1. **Verify tool use in production**
   - Confirm COPERNIQ_API_KEY is set in Vercel
   - Test `get_work_orders` tool activation

2. **Add more tools**
   ```typescript
   // Add to route.ts TOOLS array
   {
     name: 'create_work_order',
     description: 'Create a new work order in Coperniq...',
     input_schema: {/* ... */}
   },
   {
     name: 'get_assets',
     description: 'Get equipment assets...',
     input_schema: {/* ... */}
   }
   ```

3. **Add strict mode** for production reliability

### Phase 2: Build MCP Server (Week 2)

1. Create `mcp-servers/coperniq/` directory
2. Implement FastMCP server with all Coperniq operations
3. Deploy to cloud (Railway, Fly.io, etc.)
4. Switch chat API to use MCP connector

### Phase 3: Add Subagents (Week 3)

1. Create trade-specific agent definitions
2. Build orchestrator with delegation logic
3. Enable parallel execution for multi-trade requests

### Phase 4: Add Skills (Week 4)

1. Create `mep-form-builder` skill
2. Create `mep-coperniq-schema` reference skill
3. Create `mep-trade-patterns` domain skill
4. Test skill auto-discovery

---

## 8. Best Practices

### Tool Descriptions

```typescript
// GOOD: Specific, includes triggers
"Get work orders from Coperniq. Can filter by status (pending, scheduled, in_progress, completed) or trade (HVAC, Plumbing, Electrical). Use when user asks about jobs, service calls, or work orders."

// BAD: Too vague
"Get work orders"
```

### Parallel Tool Use

```typescript
// System prompt addition
"""
For maximum efficiency, when performing multiple independent operations,
invoke all relevant tools simultaneously. Prioritize parallel execution
whenever possible.
"""
```

### Error Handling

```typescript
async function executeTool(name: string, input: any): Promise<string> {
  try {
    const result = await callCoperniqAPI(name, input);
    return JSON.stringify(result);
  } catch (error) {
    // Return error as tool result - Claude will handle gracefully
    return JSON.stringify({
      error: true,
      message: `Failed to execute ${name}: ${error.message}`,
      suggestion: "Try with different parameters or check API status"
    });
  }
}
```

### Context Management

- **Agentic loops**: Set MAX_LOOPS (5 is good default)
- **Tool results**: Keep concise (summarize large datasets)
- **Skills**: Use progressive disclosure (don't load everything upfront)

---

## Quick Reference

| Need | Solution |
|------|----------|
| Simple tool calling | Direct tools in API (current implementation) |
| 10+ tools, multiple apps | MCP Server |
| 50+ tools | MCP + Tool Search |
| Trade-specific agents | Claude Agent SDK subagents |
| Domain knowledge | Skills (SKILL.md files) |
| Parallel validation | Subagent parallel execution |
| Resume interrupted work | Session ID resumption |

---

## Documentation Sources

- [Tool Use Overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [MCP Connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector)
- [Tool Search Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Effective Agent Harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
