"""
Integration Registry - Plugin Management System
===============================================

Central registry for all external integrations.
Supports lazy loading, health checks, and event routing.

Usage:
    registry = IntegrationRegistry()

    # Register an integration
    registry.register("hubspot", HubSpotConnector(api_key="..."))

    # Get and use
    crm = registry.get("hubspot")
    crm.create_contact(...)

    # Check health
    health = registry.health_check()
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Type
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

# Registry state file (protected - gitignored)
REGISTRY_FILE = Path(__file__).parent / ".registry_state.json"


@dataclass
class IntegrationConfig:
    """Configuration for an integration."""
    name: str
    type: str  # crm, accounting, marketing, webhook, etc.
    enabled: bool = True
    api_base_url: Optional[str] = None
    auth_type: str = "api_key"  # api_key, oauth2, basic
    rate_limit: int = 100  # requests per minute
    timeout: int = 30  # seconds
    retry_count: int = 3
    metadata: Dict[str, Any] = field(default_factory=dict)


class Integration(ABC):
    """Base class for all integrations."""

    def __init__(self, config: Optional[IntegrationConfig] = None):
        self.config = config
        self._last_sync: Optional[datetime] = None
        self._error_count: int = 0

    @property
    @abstractmethod
    def name(self) -> str:
        """Integration name."""
        pass

    @property
    @abstractmethod
    def integration_type(self) -> str:
        """Integration type (crm, accounting, etc.)."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if integration is healthy."""
        pass

    @abstractmethod
    async def sync(self) -> Dict[str, Any]:
        """Sync data with external system."""
        pass

    def get_status(self) -> Dict[str, Any]:
        """Get integration status."""
        return {
            "name": self.name,
            "type": self.integration_type,
            "enabled": self.config.enabled if self.config else True,
            "last_sync": self._last_sync.isoformat() if self._last_sync else None,
            "error_count": self._error_count,
        }


class IntegrationRegistry:
    """
    Central registry for managing integrations.

    Provides:
    - Plugin registration/discovery
    - Health monitoring
    - Event routing
    - State persistence
    """

    def __init__(self):
        self._integrations: Dict[str, Integration] = {}
        self._configs: Dict[str, IntegrationConfig] = {}
        self._load_state()

    def register(
        self,
        name: str,
        integration: Integration,
        config: Optional[IntegrationConfig] = None,
    ) -> None:
        """
        Register an integration.

        Args:
            name: Unique integration name
            integration: Integration instance
            config: Optional configuration
        """
        if config:
            self._configs[name] = config
            integration.config = config

        self._integrations[name] = integration
        self._save_state()
        logger.info(f"Registered integration: {name}")

    def unregister(self, name: str) -> bool:
        """
        Unregister an integration.

        Args:
            name: Integration name

        Returns:
            True if removed, False if not found
        """
        if name in self._integrations:
            del self._integrations[name]
            if name in self._configs:
                del self._configs[name]
            self._save_state()
            logger.info(f"Unregistered integration: {name}")
            return True
        return False

    def get(self, name: str) -> Optional[Integration]:
        """
        Get an integration by name.

        Args:
            name: Integration name

        Returns:
            Integration instance or None
        """
        return self._integrations.get(name)

    def list_integrations(self) -> List[str]:
        """List all registered integration names."""
        return list(self._integrations.keys())

    def get_by_type(self, integration_type: str) -> List[Integration]:
        """
        Get all integrations of a specific type.

        Args:
            integration_type: Type to filter by (crm, accounting, etc.)

        Returns:
            List of matching integrations
        """
        return [
            integration
            for integration in self._integrations.values()
            if integration.integration_type == integration_type
        ]

    async def health_check(self) -> Dict[str, Any]:
        """
        Check health of all registered integrations.

        Returns:
            Dict with health status per integration
        """
        results = {}
        for name, integration in self._integrations.items():
            try:
                healthy = await integration.health_check()
                results[name] = {
                    "healthy": healthy,
                    "type": integration.integration_type,
                }
            except Exception as e:
                results[name] = {
                    "healthy": False,
                    "type": integration.integration_type,
                    "error": str(e),
                }
        return results

    async def sync_all(self) -> Dict[str, Any]:
        """
        Sync all enabled integrations.

        Returns:
            Dict with sync results per integration
        """
        results = {}
        for name, integration in self._integrations.items():
            if integration.config and not integration.config.enabled:
                results[name] = {"skipped": True, "reason": "disabled"}
                continue

            try:
                result = await integration.sync()
                results[name] = {"success": True, "result": result}
            except Exception as e:
                results[name] = {"success": False, "error": str(e)}
                integration._error_count += 1

        self._save_state()
        return results

    def get_status(self) -> Dict[str, Any]:
        """
        Get status of all integrations.

        Returns:
            Dict with status per integration
        """
        return {
            name: integration.get_status()
            for name, integration in self._integrations.items()
        }

    def _load_state(self) -> None:
        """Load registry state from file."""
        if REGISTRY_FILE.exists():
            try:
                with open(REGISTRY_FILE) as f:
                    data = json.load(f)
                    for name, config_data in data.get("configs", {}).items():
                        self._configs[name] = IntegrationConfig(**config_data)
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"Failed to load registry state: {e}")

    def _save_state(self) -> None:
        """Save registry state to file."""
        try:
            data = {
                "configs": {
                    name: asdict(config)
                    for name, config in self._configs.items()
                },
                "updated_at": datetime.now().isoformat(),
            }
            REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(REGISTRY_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save registry state: {e}")


# =============================================================================
# Built-in Integration Types
# =============================================================================

class CoperniqIntegration(Integration):
    """Coperniq API integration (always enabled)."""

    @property
    def name(self) -> str:
        return "coperniq"

    @property
    def integration_type(self) -> str:
        return "platform"

    async def health_check(self) -> bool:
        try:
            import sys
            sys.path.insert(0, str(Path(__file__).parent.parent))
            from coperniq_langgraph_tools import coperniq_health_check
            result = coperniq_health_check.invoke({})
            return result.get("success", False)
        except Exception:
            return False

    async def sync(self) -> Dict[str, Any]:
        return {"status": "coperniq is the primary platform, no sync needed"}


class WebhookIntegration(Integration):
    """Generic webhook integration for external notifications."""

    def __init__(self, webhook_url: str, config: Optional[IntegrationConfig] = None):
        super().__init__(config)
        self.webhook_url = webhook_url

    @property
    def name(self) -> str:
        return "webhook"

    @property
    def integration_type(self) -> str:
        return "webhook"

    async def health_check(self) -> bool:
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                response = await client.head(self.webhook_url, timeout=5)
                return response.status_code < 500
        except Exception:
            return False

    async def sync(self) -> Dict[str, Any]:
        return {"status": "webhooks are event-driven, no sync needed"}

    async def send(self, event_type: str, payload: Dict[str, Any]) -> bool:
        """Send webhook event."""
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.webhook_url,
                    json={"event": event_type, "data": payload},
                    timeout=10,
                )
                return response.status_code < 400
        except Exception as e:
            logger.error(f"Webhook send failed: {e}")
            return False


# =============================================================================
# Singleton Registry
# =============================================================================

_registry: Optional[IntegrationRegistry] = None


def get_registry() -> IntegrationRegistry:
    """Get or create global registry instance."""
    global _registry
    if _registry is None:
        _registry = IntegrationRegistry()
        # Always register Coperniq
        _registry.register("coperniq", CoperniqIntegration())
    return _registry


if __name__ == "__main__":
    import asyncio

    async def test():
        registry = get_registry()
        print("Registered integrations:", registry.list_integrations())

        health = await registry.health_check()
        print("Health:", health)

        status = registry.get_status()
        print("Status:", status)

    asyncio.run(test())
