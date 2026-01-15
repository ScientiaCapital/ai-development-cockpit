# LangChain Integration Reference

**Created:** 2026-01-13
**Status:** Research Complete | Implementation Ready
**Purpose:** Comprehensive reference for LangChain ecosystem integration with Coperniq MEP Platform

---

## Overview

This document consolidates all LangChain/LangGraph documentation relevant to the Coperniq agentic platform. Use this as a quick reference for implementation patterns.

---

## 1. LangChain Studio / UI

### LangChain Studio (Visual Agent Builder)
**Docs:** https://docs.langchain.com/oss/python/langchain/studio

Visual interface for:
- Building and testing LangGraph agents
- Real-time agent execution monitoring
- Debugging agent flows
- Human-in-the-loop approval workflows

**Use for Coperniq:**
- Demo environment for stakeholders
- Testing new agent configurations
- Monitoring live agent operations

### LangChain UI
**Docs:** https://docs.langchain.com/oss/python/langchain/ui

Components for building custom agent UIs:
- Chat interfaces
- Streaming responses
- Tool execution visualization

---

## 2. MCP (Model Context Protocol)

### LangChain MCP Integration
**Docs:** https://docs.langchain.com/oss/python/langchain/mcp

MCP enables:
- Project-local tool definitions
- Cross-IDE compatibility (Claude Code, Cursor, Claude Desktop)
- Standardized tool interface

**Coperniq Implementation:**
```
.mcp/
├── config.json     # Tool definitions
├── agents/         # Agent prompts
├── tools/          # Tool implementations (coperniq.py)
└── gates/          # Review gates
```

---

## 3. Multi-Agent Systems

### Core Multi-Agent Documentation
**Docs:** https://docs.langchain.com/oss/python/langchain/multi-agent

Key concepts:
- Supervisor pattern (orchestrator routes to specialists)
- State sharing between agents
- Tool isolation per agent

### Subagents
**Docs:** https://docs.langchain.com/oss/python/langchain/multi-agent/subagents

Subagent spawning pattern:
```python
# Spawn specialized subagent
result = await task(
    agent="dispatch",
    prompt="Assign technician for HVAC emergency...",
    tools=["coperniq_dispatch_technician"],
    max_turns=5
)
```

**Coperniq Agents:**
| Agent | Purpose | Spawned By |
|-------|---------|------------|
| voice-ai | Inbound calls | Supervisor |
| dispatch | Technician assignment | voice-ai |
| collections | Invoice follow-up | Supervisor |
| pm-scheduler | PM work orders | Supervisor |
| quote-builder | Quote generation | dispatch |

### Handoffs
**Docs:** https://docs.langchain.com/oss/python/langchain/multi-agent/handoffs

Handoff patterns:
- Explicit handoff (agent declares completion)
- Conditional handoff (based on state)
- Error handoff (escalation)

**Coperniq Flow:**
```
voice-ai → dispatch (after request created)
dispatch → quote-builder (after diagnosis)
collections → escalation (after 90+ days)
```

### Skills
**Docs:** https://docs.langchain.com/oss/python/langchain/multi-agent/skills

Skills = reusable agent capabilities:
- Tool bundles
- Specialized prompts
- Domain knowledge

**Coperniq Skills:**
- HVAC diagnosis skill
- Emergency dispatch skill
- Collection call skill
- PM scheduling skill

### Router
**Docs:** https://docs.langchain.com/oss/python/langchain/multi-agent/router

Router patterns:
```python
def route_to_agent(state: MultiTradeState) -> str:
    if state["priority"] == "EMERGENCY":
        return "dispatch"  # Skip queue, immediate dispatch
    elif state["reason"] == "ACCOUNTING":
        return "collections"
    else:
        return "voice-ai"
```

### Custom Workflows
**Docs:** https://docs.langchain.com/oss/python/langchain/multi-agent/custom-workflow

Build custom agent graphs:
```python
workflow = StateGraph(CoperniqState)
workflow.add_node("voice_ai", voice_ai_node)
workflow.add_node("dispatch", dispatch_node)
workflow.add_node("collections", collections_node)
workflow.add_edge("voice_ai", "dispatch")
workflow.add_conditional_edges("dispatch", route_after_dispatch)
```

---

## 4. DeepAgents

### Overview
**Docs:** https://docs.langchain.com/oss/python/deepagents/overview

DeepAgents features:
- Long-running autonomous agents
- File system access
- Subagent spawning
- Progress tracking

### Harness
**Docs:** https://docs.langchain.com/oss/python/deepagents/harness

Agent harness pattern:
- Initializer agent (setup, context gathering)
- Coding agent (execution)
- Review agent (validation)

**Coperniq Harness:**
```python
harness = DeepAgentHarness(
    initializer=CoperniqContextLoader(),
    executor=CoperniqAgentExecutor(),
    reviewer=ReviewGateChecker()
)
```

### Backends
**Docs:** https://docs.langchain.com/oss/python/deepagents/backends

Backend options:
- OpenAI (not used - NO OPENAI rule)
- Anthropic (Claude Sonnet 4 - primary)
- Google (Gemini Flash - fast tasks)
- OpenRouter (DeepSeek, Qwen - cost optimization)

### Subagents
**Docs:** https://docs.langchain.com/oss/python/deepagents/subagents

Spawning subagents:
```python
from deepagents import task

async def process_emergency_call(call_data: dict):
    # Create request
    request_result = await task(
        agent="voice-ai",
        prompt=f"Create emergency request: {call_data}",
    )

    # Dispatch immediately
    dispatch_result = await task(
        agent="dispatch",
        prompt=f"Emergency dispatch for request {request_result.id}",
        depends_on=[request_result]
    )

    return dispatch_result
```

### Human-in-the-Loop
**Docs:** https://docs.langchain.com/oss/python/deepagents/human-in-the-loop

HITL patterns:
- Approval gates (review before execution)
- Interrupt points (pause for human input)
- Escalation triggers (automatic human handoff)

**Coperniq HITL:**
```yaml
# From .mcp/gates/pre-deploy.yaml
approval:
  required: true
  approvers:
    - human
    - senior_agent
```

### Long-Term Memory
**Docs:** https://docs.langchain.com/oss/python/deepagents/long-term-memory

Memory patterns:
- Conversation history
- Customer context
- Agent learnings

**Coperniq Memory:**
- Customer interaction history
- Technician performance data
- Service plan details
- Equipment service records

### Middleware
**Docs:** https://docs.langchain.com/oss/python/deepagents/middleware

Middleware for:
- Logging
- Rate limiting
- Cost tracking
- Gate enforcement

### CLI
**Docs:** https://docs.langchain.com/oss/python/deepagents/cli

CLI usage:
```bash
# Run agent from terminal
deepagents run voice-ai --input '{"call_from": "+15551234567"}'

# Interactive mode
deepagents interactive --agent dispatch

# Batch processing
deepagents batch --config batch-pm-scheduler.yaml
```

---

## 5. Retrieval

### Retrieval Overview
**Docs:** https://docs.langchain.com/oss/python/langchain/retrieval

RAG patterns for:
- Customer lookup
- Equipment specifications
- Service history
- Catalog search

### Retrievers
**Docs:** https://docs.langchain.com/oss/python/integrations/retrievers

Retriever options:
- Vector store (Supabase pgvector)
- Hybrid search
- Self-query

**Coperniq Retrieval:**
```python
# Catalog item retrieval
catalog_retriever = SupabaseRetriever(
    table="catalog_items",
    embedding_column="embedding",
    query_column="description"
)

# Customer history retrieval
customer_retriever = CoperniqGraphQLRetriever(
    entity="Contact",
    include_relations=["projects", "assets", "calls"]
)
```

### Splitters
**Docs:** https://docs.langchain.com/oss/python/integrations/splitters

Document splitting for:
- Service manuals
- Compliance docs (NFPA, NEC)
- Training materials

---

## 6. Long-Term Memory

### Memory Overview
**Docs:** https://docs.langchain.com/oss/python/langchain/long-term-memory

Memory types:
- Conversation memory
- Entity memory
- Summary memory

**Coperniq Memory Schema:**
```python
class CoperniqMemory:
    customer_context: dict      # Name, address, service history
    equipment_context: dict     # Assets, service plans
    conversation_history: list  # Recent interactions
    agent_notes: list           # Internal observations
```

---

## 7. Deployment

### Deploy Overview
**Docs:** https://docs.langchain.com/oss/python/langchain/deploy

Deployment options:
- LangServe (FastAPI)
- LangGraph Cloud
- Self-hosted

**Coperniq Deployment:**
```yaml
# docker-compose.yml
services:
  coperniq-agents:
    image: coperniq-mep-agents:latest
    environment:
      - COPERNIQ_API_KEY
      - ANTHROPIC_API_KEY
      - OPENROUTER_API_KEY
    ports:
      - "8000:8000"
```

---

## 8. Provider Integrations

### Anthropic (Primary)
**Docs:** https://docs.langchain.com/oss/python/integrations/providers/anthropic

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-sonnet-4",
    temperature=0.3,
)
```

### Google (Fast Tasks)
**Docs:** https://docs.langchain.com/oss/python/integrations/providers/google

```python
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-001",
    temperature=0.1,
)
```

### Groq (Low Latency)
**Docs:** https://docs.langchain.com/oss/python/integrations/chat/groq

```python
from langchain_groq import ChatGroq

llm = ChatGroq(
    model="llama-3.3-70b",
    temperature=0.2,
)
```

### HuggingFace (Local/Custom)
**Docs:** https://docs.langchain.com/oss/python/integrations/providers/huggingface

For local embedding models or custom fine-tunes.

---

## 9. Tools & Middleware

### Tools
**Docs:** https://docs.langchain.com/oss/python/integrations/tools

Tool definition pattern:
```python
from langchain.tools import tool

@tool
async def coperniq_create_request(
    title: str,
    address: List[str],
    priority: str = "NORMAL"
) -> dict:
    """Create a service request in Coperniq."""
    # Implementation in .mcp/tools/coperniq.py
    pass
```

### Middleware
**Docs:** https://docs.langchain.com/oss/python/integrations/middleware

Middleware for:
- Request/response logging
- Cost tracking
- Rate limiting
- Gate enforcement

---

## 10. Implementation Checklist

### Phase 1: Foundation
- [x] MCP config structure (`.mcp/config.json`)
- [x] Agent prompt definitions (`.mcp/agents/*.md`)
- [x] Tool implementations (`.mcp/tools/coperniq.py`)
- [x] Review gates (`.mcp/gates/*.yaml`)

### Phase 2: LangGraph Integration
- [ ] Create `agents/orchestrator.py` with LangGraph StateGraph
- [ ] Implement supervisor node
- [ ] Wire up trade agents
- [ ] Add handoff logic

### Phase 3: DeepAgents Features
- [ ] Implement `task()` spawning
- [ ] Add `write_todos()` progress tracking
- [ ] Configure long-term memory
- [ ] Set up HITL approval flow

### Phase 4: Retrieval & Memory
- [ ] Set up Supabase pgvector for catalog
- [ ] Implement customer context retriever
- [ ] Configure conversation memory
- [ ] Add equipment knowledge base

### Phase 5: Deployment
- [ ] Create Docker image
- [ ] Configure LangServe endpoints
- [ ] Set up monitoring (LangSmith)
- [ ] Deploy to production

---

## Quick Reference Links

### Core Documentation
| Topic | URL |
|-------|-----|
| MCP | https://docs.langchain.com/oss/python/langchain/mcp |
| Multi-Agent | https://docs.langchain.com/oss/python/langchain/multi-agent |
| DeepAgents | https://docs.langchain.com/oss/python/deepagents/overview |
| Studio | https://docs.langchain.com/oss/python/langchain/studio |

### Agent Patterns
| Pattern | URL |
|---------|-----|
| Subagents | https://docs.langchain.com/oss/python/langchain/multi-agent/subagents |
| Handoffs | https://docs.langchain.com/oss/python/langchain/multi-agent/handoffs |
| Router | https://docs.langchain.com/oss/python/langchain/multi-agent/router |
| HITL | https://docs.langchain.com/oss/python/deepagents/human-in-the-loop |

### Providers (NO OPENAI)
| Provider | Use Case | URL |
|----------|----------|-----|
| Anthropic | Primary (Claude) | https://docs.langchain.com/oss/python/integrations/providers/anthropic |
| Google | Fast tasks | https://docs.langchain.com/oss/python/integrations/providers/google |
| Groq | Low latency | https://docs.langchain.com/oss/python/integrations/chat/groq |

### Data & Memory
| Topic | URL |
|-------|-----|
| Retrieval | https://docs.langchain.com/oss/python/langchain/retrieval |
| Long-Term Memory | https://docs.langchain.com/oss/python/langchain/long-term-memory |
| Retrievers | https://docs.langchain.com/oss/python/integrations/retrievers |
| Splitters | https://docs.langchain.com/oss/python/integrations/splitters |

### Deployment
| Topic | URL |
|-------|-----|
| Deploy | https://docs.langchain.com/oss/python/langchain/deploy |
| CLI | https://docs.langchain.com/oss/python/deepagents/cli |
| Middleware | https://docs.langchain.com/oss/python/integrations/middleware |

---

## Model Selection Guide

**Rule: NO OPENAI - Use Anthropic, Google, DeepSeek, Qwen**

| Task | Model | Provider | Cost/1M tokens |
|------|-------|----------|----------------|
| Complex reasoning | claude-sonnet-4 | Anthropic | $3.00 |
| Code generation | deepseek-chat | OpenRouter | $0.14 |
| Fast responses | gemini-2.0-flash | Google | $0.10 |
| Vision/multimodal | qwen-2.5-vl-72b | OpenRouter | $0.40 |
| Low latency | llama-3.3-70b | Groq | $0.20 |
| Bulk processing | deepseek-chat | OpenRouter | $0.14 |

---

*Last updated: 2026-01-13 by Claude + Tim*
*Instance 388 - Kipper Energy Solutions*
