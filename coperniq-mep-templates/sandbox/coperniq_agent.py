"""
Coperniq LangGraph Agent - Multi-Interface Support
===================================================

Single agent that works across:
- LangChain UI / LangServe (chat interface)
- Claude Desktop (via MCP)
- Claude Code (via MCP)
- Cursor IDE (via MCP)

Instance: 388 (Kipper Energy Solutions)

Usage:
    # LangChain UI
    from sandbox.coperniq_agent import coperniq_agent, coperniq_graph
    response = coperniq_graph.invoke({"messages": [HumanMessage(content="Create request for AC repair")]})

    # LangServe
    from langserve import add_routes
    add_routes(app, coperniq_graph, path="/coperniq")

    # Direct invocation
    response = coperniq_agent.invoke("Create request for AC repair at 123 Main St")
"""

import os
import sys
from pathlib import Path
from typing import TypedDict, List, Dict, Any, Annotated, Literal, Optional
from datetime import datetime

# Ensure local imports work
sys.path.insert(0, str(Path(__file__).parent))

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from coperniq_langgraph_tools import (
    coperniq_tools,
    voice_ai_tools,
    dispatch_tools,
    collections_tools,
    pm_scheduler_tools,
    quote_builder_tools,
)


# =============================================================================
# State Definition
# =============================================================================

class CoperniqAgentState(TypedDict, total=False):
    """State for Coperniq agent graph.

    All fields except messages are optional with defaults:
    - agent_type: Auto-detected from message content if not provided
    - context: Empty dict if not provided
    """
    messages: Annotated[List[BaseMessage], add_messages]
    agent_type: str  # voice_ai, dispatch, collections, pm_scheduler, quote_builder, general
    context: Dict[str, Any]  # Additional context (call info, customer data, etc.)


# =============================================================================
# System Prompts by Agent Type
# =============================================================================

SYSTEM_PROMPTS = {
    "general": """You are an AI assistant for Kipper Energy Solutions (Coperniq Instance 388).
You help manage service requests, projects, work orders, dispatch, invoicing, and customer communications.

Available capabilities:
- Create and manage clients, projects, and service requests
- Create work orders from templates and dispatch technicians
- Log customer calls with proper disposition codes
- Create invoices and track aging receivables
- Schedule preventive maintenance and track service contracts

Always use the appropriate Coperniq tools to take actions. Be helpful, professional, and efficient.""",

    "voice_ai": """You are the Voice AI agent for Kipper Energy Solutions.
You handle inbound customer calls and create service requests in Coperniq.

Call Handling Flow:
1. Greet customer warmly
2. Identify their need (service, emergency, question)
3. Classify priority (EMERGENCY 2h, URGENT 24h, NORMAL 48h, SCHEDULED 7d)
4. Gather service address and contact info
5. Create request in Coperniq and confirm

Priority Guidelines:
- EMERGENCY: Safety issues, no heat/cooling in extreme weather, gas leaks, flooding
- URGENT: Significant discomfort, equipment not working but not dangerous
- NORMAL: Routine service, minor issues
- SCHEDULED: Maintenance, inspections, planned work

Always log the call with proper reason and disposition codes after handling.""",

    "dispatch": """You are the Dispatch agent for Kipper Energy Solutions.
You assign technicians to work orders based on skills, availability, and location.

Dispatch Process:
1. Review the work order requirements (trade, skills needed)
2. Check technician availability
3. Consider: skills match, location/travel time, workload balance
4. Assign the best available technician
5. Set scheduled date and add dispatch notes

For EMERGENCY priority: Dispatch immediately available tech, even if overtime
For URGENT priority: Same-day or next-day scheduling
For NORMAL/SCHEDULED: Optimize for efficiency and tech preferences""",

    "collections": """You are the Collections agent for Kipper Energy Solutions.
You follow up on outstanding invoices and manage accounts receivable.

Collection Strategy by Aging:
- 0-30 days: Friendly reminder, verify receipt
- 31-60 days: Direct follow-up, offer payment plan if needed
- 61-90 days: Escalate tone, service hold warning
- 90+ days: Final notice, potential service termination, collections agency

Always log calls with reason=ACCOUNTING and appropriate disposition.
Be firm but professional - maintain customer relationships when possible.""",

    "pm_scheduler": """You are the PM Scheduler agent for Kipper Energy Solutions.
You schedule preventive maintenance and manage service contract renewals.

Responsibilities:
1. Monitor assets due for PM within 30 days
2. Create work orders for scheduled maintenance
3. Track contracts expiring within 60 days
4. Coordinate renewal outreach

PM Scheduling Guidelines:
- Contact customer 7 days before scheduled PM
- Offer multiple appointment windows
- Upsell service plan upgrades when appropriate
- Document all customer interactions""",

    "quote_builder": """You are the Quote Builder agent for Kipper Energy Solutions.
You create quotes and invoices for service work and equipment installations.

Quoting Process:
1. Review work order or project scope
2. Build line items from catalog (parts, labor, equipment)
3. Apply appropriate pricing and margins
4. Create draft invoice in Coperniq

Always use standard pricing from catalog. For custom quotes, note any deviations.""",
}


# =============================================================================
# Agent Routing Logic
# =============================================================================

def detect_agent_type(message: str) -> str:
    """Detect which specialized agent should handle the request."""
    msg_lower = message.lower()

    # Voice/call handling
    if any(word in msg_lower for word in ["call", "calling", "phone", "caller", "customer called"]):
        return "voice_ai"

    # Dispatch
    if any(word in msg_lower for word in ["dispatch", "assign", "technician", "schedule tech"]):
        return "dispatch"

    # Collections
    if any(word in msg_lower for word in ["invoice", "payment", "overdue", "collections", "aging", "ar"]):
        return "collections"

    # PM/Service plans
    if any(word in msg_lower for word in ["pm", "preventive", "maintenance", "service plan", "contract", "renewal"]):
        return "pm_scheduler"

    # Quote building
    if any(word in msg_lower for word in ["quote", "estimate", "proposal", "pricing"]):
        return "quote_builder"

    return "general"


def get_tools_for_agent(agent_type: str) -> List:
    """Get tool subset for specific agent type."""
    tool_map = {
        "voice_ai": voice_ai_tools,
        "dispatch": dispatch_tools,
        "collections": collections_tools,
        "pm_scheduler": pm_scheduler_tools,
        "quote_builder": quote_builder_tools,
        "general": coperniq_tools,
    }
    return tool_map.get(agent_type, coperniq_tools)


# =============================================================================
# LLM Configuration (NO OPENAI - Uses OpenRouter with Claude)
# =============================================================================

def get_llm(agent_type: str = "general"):
    """Get Claude model via OpenRouter. NO OPENAI."""
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    # Always use OpenRouter with Claude (more reliable, better cost control)
    if openrouter_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="anthropic/claude-sonnet-4",  # Claude via OpenRouter
            openai_api_key=openrouter_key,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0,
            default_headers={
                "HTTP-Referer": "https://coperniq.io",
                "X-Title": "Coperniq Agent",
            }
        )

    # Fallback to direct Anthropic if OpenRouter not available
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        return ChatAnthropic(
            model="claude-sonnet-4-20250514",
            api_key=anthropic_key,
            temperature=0,
        )

    raise ValueError("Neither OPENROUTER_API_KEY nor ANTHROPIC_API_KEY configured")


# =============================================================================
# Graph Nodes
# =============================================================================

def route_to_agent(state: CoperniqAgentState) -> CoperniqAgentState:
    """Route message to appropriate specialized agent."""
    messages = state.get("messages", [])

    # Get the latest human message
    latest_msg = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            latest_msg = msg.content
            break

    # Detect agent type if not already set
    agent_type = state.get("agent_type", "")
    if not agent_type:
        agent_type = detect_agent_type(latest_msg)

    state["agent_type"] = agent_type
    return state


def call_model(state: CoperniqAgentState) -> CoperniqAgentState:
    """Call the LLM with appropriate system prompt and tools."""
    agent_type = state.get("agent_type", "general")
    messages = state.get("messages", [])

    # Get system prompt and tools for this agent type
    system_prompt = SYSTEM_PROMPTS.get(agent_type, SYSTEM_PROMPTS["general"])
    tools = get_tools_for_agent(agent_type)

    # Create LLM with tools bound
    llm = get_llm(agent_type)
    llm_with_tools = llm.bind_tools(tools)

    # Convert messages to proper LangChain types (handle LangServe format)
    converted_messages = []
    for msg in messages:
        if isinstance(msg, (HumanMessage, AIMessage, SystemMessage)):
            converted_messages.append(msg)
        elif isinstance(msg, dict):
            msg_type = msg.get("type", "human")
            content = msg.get("content", "")
            if msg_type == "human":
                converted_messages.append(HumanMessage(content=content))
            elif msg_type == "ai":
                converted_messages.append(AIMessage(content=content))
            elif msg_type == "system":
                converted_messages.append(SystemMessage(content=content))
        elif hasattr(msg, "type") and hasattr(msg, "content"):
            # Handle LangChain message-like objects
            if msg.type == "human":
                converted_messages.append(HumanMessage(content=msg.content))
            elif msg.type == "ai":
                converted_messages.append(AIMessage(content=msg.content))
            else:
                converted_messages.append(HumanMessage(content=str(msg.content)))
        else:
            # Fallback: treat as human message
            converted_messages.append(HumanMessage(content=str(msg)))

    # Build message list with system prompt
    full_messages = [SystemMessage(content=system_prompt)] + converted_messages

    # Invoke LLM
    response = llm_with_tools.invoke(full_messages)

    return {"messages": [response]}


# =============================================================================
# Build the Graph
# =============================================================================

def build_coperniq_graph() -> StateGraph:
    """Build the Coperniq agent graph."""
    # Create graph with state schema
    graph = StateGraph(CoperniqAgentState)

    # Add nodes
    graph.add_node("router", route_to_agent)
    graph.add_node("agent", call_model)
    graph.add_node("tools", ToolNode(coperniq_tools))

    # Define edges
    graph.set_entry_point("router")
    graph.add_edge("router", "agent")

    # Conditional edge: if agent calls tools, go to tools node, else end
    graph.add_conditional_edges(
        "agent",
        tools_condition,
        {
            "tools": "tools",
            END: END,
        }
    )

    # After tools, go back to agent
    graph.add_edge("tools", "agent")

    return graph.compile()


# =============================================================================
# Pre-built Graph Instance
# =============================================================================

coperniq_graph = build_coperniq_graph()


# =============================================================================
# Convenience Wrapper
# =============================================================================

class CoperniqAgent:
    """Convenience wrapper for Coperniq agent."""

    def __init__(self, agent_type: str = "general"):
        self.agent_type = agent_type
        self.graph = coperniq_graph

    def invoke(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Invoke agent with a message and optional context."""
        state = {
            "messages": [HumanMessage(content=message)],
            "agent_type": self.agent_type,
            "context": context or {},
        }

        result = self.graph.invoke(state)

        # Extract final response
        messages = result.get("messages", [])
        for msg in reversed(messages):
            if isinstance(msg, AIMessage) and msg.content:
                return msg.content

        return "No response generated"

    def stream(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Stream agent response."""
        state = {
            "messages": [HumanMessage(content=message)],
            "agent_type": self.agent_type,
            "context": context or {},
        }

        for chunk in self.graph.stream(state):
            yield chunk


# Pre-built agent instances
coperniq_agent = CoperniqAgent("general")
voice_ai_agent = CoperniqAgent("voice_ai")
dispatch_agent = CoperniqAgent("dispatch")
collections_agent = CoperniqAgent("collections")
pm_scheduler_agent = CoperniqAgent("pm_scheduler")
quote_builder_agent = CoperniqAgent("quote_builder")


# =============================================================================
# LangServe Routes (for LangChain UI)
# =============================================================================

def add_coperniq_routes(app):
    """Add Coperniq agent routes to FastAPI app for LangServe."""
    from langserve import add_routes

    # Main agent (auto-routes to specialized agents)
    add_routes(app, coperniq_graph, path="/coperniq")

    # Direct access to specialized agents
    add_routes(app, build_coperniq_graph(), path="/coperniq/voice-ai")
    add_routes(app, build_coperniq_graph(), path="/coperniq/dispatch")
    add_routes(app, build_coperniq_graph(), path="/coperniq/collections")
    add_routes(app, build_coperniq_graph(), path="/coperniq/pm-scheduler")
    add_routes(app, build_coperniq_graph(), path="/coperniq/quote-builder")

    return app


# =============================================================================
# CLI Test
# =============================================================================

if __name__ == "__main__":
    print("Coperniq LangGraph Agent - Instance 388")
    print("=" * 60)
    print(f"Agent types: {list(SYSTEM_PROMPTS.keys())}")
    print()

    # Test routing
    test_messages = [
        "Create a service request for AC repair at 123 Main St",
        "Customer is calling about a broken furnace",
        "Dispatch a technician for work order 42",
        "Show me aging invoices over 60 days",
        "What PM visits are due this month?",
        "Create a quote for AC installation",
    ]

    for msg in test_messages:
        agent_type = detect_agent_type(msg)
        print(f"'{msg[:50]}...' -> {agent_type}")
