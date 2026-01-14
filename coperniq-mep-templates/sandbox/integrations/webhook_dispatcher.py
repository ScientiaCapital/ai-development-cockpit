"""
Webhook Dispatcher - Event Distribution System
==============================================

Dispatches events to registered webhook integrations.
Supports async delivery, retries, and dead-letter handling.

Usage:
    dispatcher = WebhookDispatcher()

    # Register a webhook
    dispatcher.register_webhook("slack", "https://hooks.slack.com/...")

    # Dispatch an event
    await dispatcher.dispatch("work_order.created", {"id": 123, "title": "AC Repair"})
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Standard event types for MEP workflows."""
    # Work Orders
    WORK_ORDER_CREATED = "work_order.created"
    WORK_ORDER_UPDATED = "work_order.updated"
    WORK_ORDER_COMPLETED = "work_order.completed"
    WORK_ORDER_CANCELLED = "work_order.cancelled"

    # Dispatching
    TECH_DISPATCHED = "tech.dispatched"
    TECH_ARRIVED = "tech.arrived"
    TECH_COMPLETED = "tech.completed"

    # Voice/Calls
    CALL_RECEIVED = "call.received"
    CALL_COMPLETED = "call.completed"
    CALL_ESCALATED = "call.escalated"

    # Collections
    INVOICE_SENT = "invoice.sent"
    INVOICE_OVERDUE = "invoice.overdue"
    PAYMENT_RECEIVED = "payment.received"

    # PM/Scheduling
    PM_SCHEDULED = "pm.scheduled"
    PM_REMINDER = "pm.reminder"
    PM_COMPLETED = "pm.completed"

    # Quotes
    QUOTE_CREATED = "quote.created"
    QUOTE_SENT = "quote.sent"
    QUOTE_ACCEPTED = "quote.accepted"
    QUOTE_REJECTED = "quote.rejected"


@dataclass
class WebhookConfig:
    """Configuration for a webhook endpoint."""
    name: str
    url: str
    enabled: bool = True
    secret: Optional[str] = None  # For HMAC signing
    events: List[str] = field(default_factory=list)  # Empty = all events
    retry_count: int = 3
    retry_delay: int = 5  # seconds
    timeout: int = 30  # seconds
    headers: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DeliveryAttempt:
    """Record of a webhook delivery attempt."""
    webhook_name: str
    event_type: str
    payload: Dict[str, Any]
    attempt_number: int
    timestamp: datetime
    success: bool
    status_code: Optional[int] = None
    response: Optional[str] = None
    error: Optional[str] = None


class WebhookDispatcher:
    """
    Dispatches events to registered webhooks.

    Features:
    - Event filtering per webhook
    - Async parallel delivery
    - Retry with exponential backoff
    - Dead-letter queue for failed deliveries
    - HMAC signature support
    """

    def __init__(self):
        self._webhooks: Dict[str, WebhookConfig] = {}
        self._dead_letter: List[DeliveryAttempt] = []
        self._delivery_log: List[DeliveryAttempt] = []
        self._event_handlers: Dict[str, List[Callable]] = {}

    def register_webhook(
        self,
        name: str,
        url: str,
        events: Optional[List[str]] = None,
        secret: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        """
        Register a webhook endpoint.

        Args:
            name: Unique webhook name
            url: Webhook URL
            events: List of event types to receive (None = all)
            secret: Secret for HMAC signing
            headers: Additional headers to include
        """
        config = WebhookConfig(
            name=name,
            url=url,
            events=events or [],
            secret=secret,
            headers=headers or {},
        )
        self._webhooks[name] = config
        logger.info(f"Registered webhook: {name} -> {url}")

    def unregister_webhook(self, name: str) -> bool:
        """
        Unregister a webhook.

        Args:
            name: Webhook name

        Returns:
            True if removed, False if not found
        """
        if name in self._webhooks:
            del self._webhooks[name]
            logger.info(f"Unregistered webhook: {name}")
            return True
        return False

    def register_handler(
        self,
        event_type: str,
        handler: Callable[[str, Dict[str, Any]], Any],
    ) -> None:
        """
        Register a local event handler (in addition to webhooks).

        Args:
            event_type: Event type to handle
            handler: Async callable (event_type, payload) -> Any
        """
        if event_type not in self._event_handlers:
            self._event_handlers[event_type] = []
        self._event_handlers[event_type].append(handler)

    async def dispatch(
        self,
        event_type: str,
        payload: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dispatch an event to all registered webhooks.

        Args:
            event_type: Type of event
            payload: Event payload
            metadata: Additional metadata

        Returns:
            Dict with delivery results per webhook
        """
        results = {}
        event_data = {
            "event": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": payload,
            "metadata": metadata or {},
        }

        # Dispatch to webhooks
        tasks = []
        for name, config in self._webhooks.items():
            if not config.enabled:
                results[name] = {"skipped": True, "reason": "disabled"}
                continue

            # Check event filter
            if config.events and event_type not in config.events:
                results[name] = {"skipped": True, "reason": "filtered"}
                continue

            tasks.append(self._deliver_to_webhook(name, config, event_data))

        # Execute webhook deliveries in parallel
        if tasks:
            webhook_results = await asyncio.gather(*tasks, return_exceptions=True)
            for i, (name, _) in enumerate(
                (n, c) for n, c in self._webhooks.items()
                if c.enabled and (not c.events or event_type in c.events)
            ):
                if isinstance(webhook_results[i], Exception):
                    results[name] = {"success": False, "error": str(webhook_results[i])}
                else:
                    results[name] = webhook_results[i]

        # Dispatch to local handlers
        handlers = self._event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event_type, payload)
                else:
                    handler(event_type, payload)
            except Exception as e:
                logger.error(f"Handler error for {event_type}: {e}")

        logger.info(f"Dispatched {event_type} to {len(results)} webhooks")
        return results

    async def _deliver_to_webhook(
        self,
        name: str,
        config: WebhookConfig,
        event_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Deliver event to a single webhook with retries.

        Args:
            name: Webhook name
            config: Webhook configuration
            event_data: Event data to send

        Returns:
            Delivery result
        """
        import httpx
        import hashlib
        import hmac
        import json

        for attempt in range(config.retry_count):
            try:
                headers = {
                    "Content-Type": "application/json",
                    "X-Webhook-Event": event_data["event"],
                    "X-Webhook-Timestamp": event_data["timestamp"],
                    **config.headers,
                }

                # Add HMAC signature if secret is configured
                if config.secret:
                    payload_bytes = json.dumps(event_data).encode()
                    signature = hmac.new(
                        config.secret.encode(),
                        payload_bytes,
                        hashlib.sha256,
                    ).hexdigest()
                    headers["X-Webhook-Signature"] = f"sha256={signature}"

                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        config.url,
                        json=event_data,
                        headers=headers,
                        timeout=config.timeout,
                    )

                delivery = DeliveryAttempt(
                    webhook_name=name,
                    event_type=event_data["event"],
                    payload=event_data["data"],
                    attempt_number=attempt + 1,
                    timestamp=datetime.now(),
                    success=response.status_code < 400,
                    status_code=response.status_code,
                    response=response.text[:500] if response.text else None,
                )
                self._delivery_log.append(delivery)

                if response.status_code < 400:
                    return {
                        "success": True,
                        "status_code": response.status_code,
                        "attempts": attempt + 1,
                    }

                # Non-retryable status codes
                if response.status_code in (400, 401, 403, 404):
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": "Non-retryable error",
                    }

            except Exception as e:
                delivery = DeliveryAttempt(
                    webhook_name=name,
                    event_type=event_data["event"],
                    payload=event_data["data"],
                    attempt_number=attempt + 1,
                    timestamp=datetime.now(),
                    success=False,
                    error=str(e),
                )
                self._delivery_log.append(delivery)

                if attempt < config.retry_count - 1:
                    # Exponential backoff
                    await asyncio.sleep(config.retry_delay * (2 ** attempt))
                    continue

                # Add to dead letter queue
                self._dead_letter.append(delivery)
                return {
                    "success": False,
                    "error": str(e),
                    "attempts": attempt + 1,
                    "dead_lettered": True,
                }

        return {"success": False, "error": "Max retries exceeded", "attempts": config.retry_count}

    def get_dead_letters(self) -> List[Dict[str, Any]]:
        """Get all dead-lettered deliveries."""
        return [
            {
                "webhook": d.webhook_name,
                "event": d.event_type,
                "payload": d.payload,
                "timestamp": d.timestamp.isoformat(),
                "error": d.error,
            }
            for d in self._dead_letter
        ]

    def get_delivery_stats(self) -> Dict[str, Any]:
        """Get delivery statistics."""
        total = len(self._delivery_log)
        successful = sum(1 for d in self._delivery_log if d.success)

        return {
            "total_deliveries": total,
            "successful": successful,
            "failed": total - successful,
            "success_rate": (successful / total * 100) if total > 0 else 0,
            "dead_letters": len(self._dead_letter),
            "webhooks_registered": len(self._webhooks),
        }

    def list_webhooks(self) -> List[Dict[str, Any]]:
        """List all registered webhooks."""
        return [
            {
                "name": name,
                "url": config.url,
                "enabled": config.enabled,
                "events": config.events or ["*"],
            }
            for name, config in self._webhooks.items()
        ]


# =============================================================================
# Singleton Dispatcher
# =============================================================================

_dispatcher: Optional[WebhookDispatcher] = None


def get_dispatcher() -> WebhookDispatcher:
    """Get or create global dispatcher instance."""
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = WebhookDispatcher()
    return _dispatcher


# =============================================================================
# Convenience Functions
# =============================================================================

async def dispatch_event(
    event_type: str,
    payload: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Dispatch an event using the global dispatcher.

    Args:
        event_type: Event type (use EventType enum)
        payload: Event payload
        metadata: Additional metadata

    Returns:
        Delivery results
    """
    dispatcher = get_dispatcher()
    return await dispatcher.dispatch(event_type, payload, metadata)


# =============================================================================
# Example Usage
# =============================================================================

if __name__ == "__main__":
    async def test():
        dispatcher = get_dispatcher()

        # Register some webhooks
        dispatcher.register_webhook(
            "slack",
            "https://hooks.slack.com/services/...",
            events=[EventType.CALL_ESCALATED, EventType.WORK_ORDER_CREATED],
        )

        dispatcher.register_webhook(
            "teams",
            "https://outlook.office.com/webhook/...",
            events=[EventType.INVOICE_OVERDUE],
        )

        print("Registered webhooks:", dispatcher.list_webhooks())

        # Dispatch an event (will fail since URLs are fake)
        result = await dispatch_event(
            EventType.WORK_ORDER_CREATED,
            {"id": 123, "title": "AC Repair", "priority": "urgent"},
        )
        print("Dispatch result:", result)

        # Check stats
        print("Stats:", dispatcher.get_delivery_stats())

    asyncio.run(test())
