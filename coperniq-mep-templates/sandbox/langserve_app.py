#!/usr/bin/env python3
"""
Coperniq LangServe App - Chat UI for Instance 388
==================================================

Provides LangChain UI / LangServe chat interface for Coperniq agents.

Run:
    python langserve_app.py

Access:
    http://localhost:8388/coperniq/playground  - Main agent
    http://localhost:8388/voice-ai/playground  - Voice AI agent
    http://localhost:8388/dispatch/playground  - Dispatch agent
    http://localhost:8388/docs                 - API documentation
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import HumanMessage, AIMessage
from pydantic import BaseModel, Field

# Import our agents
import sys
sys.path.insert(0, str(Path(__file__).parent))

from coperniq_agent import (
    coperniq_graph,
    build_coperniq_graph,
    CoperniqAgentState,
    SYSTEM_PROMPTS,
)


# =============================================================================
# Simplified Input Schema for Playground
# =============================================================================

class ChatInput(BaseModel):
    """Simple chat input - just messages, no extra config needed."""
    messages: List[Dict[str, str]] = Field(
        default=[],
        description="List of messages. Each message has 'type' (human/ai) and 'content'."
    )


def wrap_graph_with_defaults(graph, default_agent_type: str = "general"):
    """Wrap a graph to provide default agent_type and context."""

    def process_input(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add defaults for agent_type and context if not provided."""
        messages = input_data.get("messages", [])
        return {
            "messages": messages,
            "agent_type": input_data.get("agent_type", default_agent_type),
            "context": input_data.get("context", {}),
        }

    def extract_output(output: Dict[str, Any]) -> Dict[str, Any]:
        """Extract just the messages from output."""
        return output

    return (
        RunnableLambda(process_input)
        | graph
        | RunnableLambda(extract_output)
    ).with_types(input_type=ChatInput)

# =============================================================================
# FastAPI App
# =============================================================================

app = FastAPI(
    title="Coperniq Agent API",
    description="LangServe API for Coperniq Instance 388 (Kipper Energy Solutions)",
    version="1.0.0",
)

# CORS for chat UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Health Endpoint
# =============================================================================

@app.get("/health")
async def health():
    """Health check endpoint."""
    from coperniq_langgraph_tools import coperniq_health_check
    result = coperniq_health_check.invoke({})
    return {
        "status": "healthy" if result.get("success") else "unhealthy",
        "instance": "388",
        "company": "Kipper Energy Solutions",
        "api": result,
    }


@app.get("/agents")
async def list_agents():
    """List available agents."""
    return {
        "agents": list(SYSTEM_PROMPTS.keys()),
        "instance": "388",
    }


# =============================================================================
# LangServe Routes (with simplified input schema for playground)
# =============================================================================

# Main agent (auto-routes based on message content)
add_routes(
    app,
    wrap_graph_with_defaults(coperniq_graph, "general"),
    path="/coperniq",
    enable_feedback_endpoint=True,
    enable_public_trace_link_endpoint=True,
)

# Specialized agents with their own endpoints
# Each gets a fresh graph instance with pre-set agent type

# Voice AI - handles inbound calls
add_routes(
    app,
    wrap_graph_with_defaults(build_coperniq_graph(), "voice_ai"),
    path="/voice-ai",
)

# Dispatch - assigns technicians
add_routes(
    app,
    wrap_graph_with_defaults(build_coperniq_graph(), "dispatch"),
    path="/dispatch",
)

# Collections - follows up on invoices
add_routes(
    app,
    wrap_graph_with_defaults(build_coperniq_graph(), "collections"),
    path="/collections",
)

# PM Scheduler - preventive maintenance
add_routes(
    app,
    wrap_graph_with_defaults(build_coperniq_graph(), "pm_scheduler"),
    path="/pm-scheduler",
)

# Quote Builder - creates quotes
add_routes(
    app,
    wrap_graph_with_defaults(build_coperniq_graph(), "quote_builder"),
    path="/quote-builder",
)


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8388"))

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║  Coperniq LangServe - Instance 388 (Kipper Energy Solutions)  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Chat Playgrounds:                                           ║
║    http://localhost:{port}/coperniq/playground                 ║
║    http://localhost:{port}/voice-ai/playground                 ║
║    http://localhost:{port}/dispatch/playground                 ║
║    http://localhost:{port}/collections/playground              ║
║    http://localhost:{port}/pm-scheduler/playground             ║
║    http://localhost:{port}/quote-builder/playground            ║
║                                                              ║
║  API Docs:                                                   ║
║    http://localhost:{port}/docs                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
""")

    uvicorn.run(
        "langserve_app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
