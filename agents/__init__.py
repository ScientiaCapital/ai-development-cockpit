"""
Kipper Energy Solutions - Agentic Team
========================================

Instance 388 AI Agent Fleet for MEP contractor operations.

Agents:
- VoiceAI: Handles inbound/outbound phone calls
- Dispatch: Assigns technicians to work orders
- Collections: AR follow-up and payment reminders
- PMScheduler: Schedules preventive maintenance visits
- QuoteBuilder: Generates proposals from site surveys

Architecture:
- Built on Claude Agent SDK / LangGraph patterns
- Each agent has specialized tools and prompts
- Orchestrator coordinates multi-agent workflows
"""

from .dispatch_agent import DispatchAgent
from .collections_agent import CollectionsAgent
from .pm_scheduler_agent import PMSchedulerAgent
from .quote_builder_agent import QuoteBuilderAgent

__all__ = [
    "DispatchAgent",
    "CollectionsAgent",
    "PMSchedulerAgent",
    "QuoteBuilderAgent"
]
