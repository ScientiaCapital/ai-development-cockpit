"""
Integrations Package - Plugin Architecture for Instance 388
============================================================

Provides extensible integration points for future connections.
All integration configs are protected (gitignored).

Usage:
    from sandbox.integrations import IntegrationRegistry

    registry = IntegrationRegistry()
    registry.register("crm", CRMConnector())
    registry.get("crm").sync_contacts()
"""

from .registry import IntegrationRegistry, Integration
from .webhook_dispatcher import WebhookDispatcher

__all__ = [
    "IntegrationRegistry",
    "Integration",
    "WebhookDispatcher",
]
