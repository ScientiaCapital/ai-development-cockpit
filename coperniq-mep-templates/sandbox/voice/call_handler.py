"""
Voice Call Handler - Twilio Integration for Instance 388
=========================================================

Handles inbound and outbound voice calls via Twilio.
Integrates with Coperniq for call logging and request creation.

Usage:
    from sandbox.voice.call_handler import CallHandler
    handler = CallHandler()

    # Handle inbound
    twiml = await handler.handle_inbound(request)

    # Make outbound call
    call_sid = await handler.make_outbound_call(to_number, message)
"""

import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class CallPriority(str, Enum):
    """Call priority levels."""
    EMERGENCY = "EMERGENCY"  # 2-hour SLA
    URGENT = "URGENT"        # 24-hour SLA
    NORMAL = "NORMAL"        # 48-hour SLA
    SCHEDULED = "SCHEDULED"  # 7-day window


class CallReason(str, Enum):
    """Call reason codes for Coperniq."""
    SERVICE = "SERVICE"
    PRODUCT = "PRODUCT"
    PROCESS = "PROCESS"
    ACCOUNTING = "ACCOUNTING"
    REVENUE_OPPORTUNITY = "REVENUE_OPPORTUNITY"
    FEEDBACK = "FEEDBACK"
    OTHER = "OTHER"


class CallDisposition(str, Enum):
    """Call disposition codes for Coperniq."""
    VISIT_SCHEDULED = "VISIT_SCHEDULED"
    INFO_PROVIDED = "INFO_PROVIDED"
    ISSUE_RESOLVED = "ISSUE_RESOLVED"
    FOLLOW_UP = "FOLLOW_UP"
    ESCALATION = "ESCALATION"
    NO_ACTION = "NO_ACTION"
    UNRESPONSIVE = "UNRESPONSIVE"
    OTHER = "OTHER"


@dataclass
class CallState:
    """State for active call."""
    call_sid: str
    from_number: str
    to_number: str
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    is_inbound: bool = True
    customer_name: Optional[str] = None
    issue_description: Optional[str] = None
    priority: CallPriority = CallPriority.NORMAL
    reason: CallReason = CallReason.SERVICE
    disposition: Optional[CallDisposition] = None
    coperniq_request_id: Optional[int] = None
    coperniq_client_id: Optional[int] = None
    transcript: str = ""
    notes: str = ""


class CallHandler:
    """
    Handles voice calls via Twilio for Kipper Energy Solutions.
    """

    def __init__(self):
        """Initialize call handler with Twilio credentials."""
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")

        self._active_calls: Dict[str, CallState] = {}
        self._twilio_client = None

    @property
    def is_configured(self) -> bool:
        """Check if Twilio is configured."""
        return bool(self.account_sid and self.auth_token and self.phone_number)

    def _get_twilio_client(self):
        """Get or create Twilio client."""
        if self._twilio_client is None:
            try:
                from twilio.rest import Client
                self._twilio_client = Client(self.account_sid, self.auth_token)
            except ImportError:
                logger.warning("Twilio SDK not installed. Install with: pip install twilio")
                return None
        return self._twilio_client

    async def handle_inbound(self, call_data: Dict[str, Any]) -> str:
        """
        Handle inbound call webhook from Twilio.

        Args:
            call_data: Twilio webhook data (CallSid, From, To, etc.)

        Returns:
            TwiML response string
        """
        call_sid = call_data.get("CallSid", "unknown")
        from_number = call_data.get("From", "unknown")
        to_number = call_data.get("To", self.phone_number)

        # Create call state
        state = CallState(
            call_sid=call_sid,
            from_number=from_number,
            to_number=to_number,
            is_inbound=True,
        )
        self._active_calls[call_sid] = state

        logger.info(f"[Inbound] Call from {from_number} - SID: {call_sid}")

        # Generate TwiML greeting
        twiml = self._generate_greeting_twiml()

        return twiml

    async def handle_call_status(self, status_data: Dict[str, Any]) -> None:
        """
        Handle call status webhook (completed, failed, etc.).

        Args:
            status_data: Twilio status webhook data
        """
        call_sid = status_data.get("CallSid", "unknown")
        call_status = status_data.get("CallStatus", "unknown")

        state = self._active_calls.get(call_sid)
        if state:
            state.end_time = datetime.now()

            if call_status == "completed":
                # Log call to Coperniq
                await self._log_call_to_coperniq(state)

            # Cleanup
            del self._active_calls[call_sid]

        logger.info(f"[Status] Call {call_sid} - {call_status}")

    async def make_outbound_call(
        self,
        to_number: str,
        message: str,
        reason: CallReason = CallReason.SERVICE,
    ) -> Optional[str]:
        """
        Make outbound call via Twilio.

        Args:
            to_number: Number to call
            message: Message to speak (TTS)
            reason: Call reason for logging

        Returns:
            Call SID if successful, None otherwise
        """
        client = self._get_twilio_client()
        if not client:
            logger.error("Twilio client not available")
            return None

        try:
            # Generate TwiML for outbound message
            twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">{message}</Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna">If you have any questions, please call us back at {self.phone_number}.</Say>
</Response>"""

            call = client.calls.create(
                to=to_number,
                from_=self.phone_number,
                twiml=twiml,
            )

            # Track call state
            state = CallState(
                call_sid=call.sid,
                from_number=self.phone_number,
                to_number=to_number,
                is_inbound=False,
                reason=reason,
            )
            self._active_calls[call.sid] = state

            logger.info(f"[Outbound] Call to {to_number} - SID: {call.sid}")
            return call.sid

        except Exception as e:
            logger.error(f"Failed to make outbound call: {e}")
            return None

    def _generate_greeting_twiml(self) -> str:
        """Generate TwiML for call greeting."""
        return """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">
        Thank you for calling Kipper Energy Solutions.
        Your comfort is our priority.
    </Say>
    <Pause length="1"/>
    <Gather input="speech" action="/voice/handle-input" timeout="5" speechTimeout="auto">
        <Say voice="Polly.Joanna">
            Please describe your issue, or press 1 for emergency service.
        </Say>
    </Gather>
    <Say voice="Polly.Joanna">
        We didn't receive any input. Please call back if you need assistance.
    </Say>
</Response>"""

    async def _log_call_to_coperniq(self, state: CallState) -> bool:
        """
        Log completed call to Coperniq.

        Args:
            state: Call state with all details

        Returns:
            True if logged successfully
        """
        try:
            # Import here to avoid circular imports
            import sys
            sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
            from coperniq_langgraph_tools import coperniq_log_call

            end_time = state.end_time or datetime.now()

            result = coperniq_log_call.invoke({
                "from_number": state.from_number,
                "to_number": state.to_number,
                "start_time": state.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "reason": state.reason.value,
                "disposition": (state.disposition or CallDisposition.OTHER).value,
                "is_inbound": state.is_inbound,
                "note": state.notes or f"Transcript: {state.transcript[:500]}",
                "client_id": state.coperniq_client_id,
            })

            logger.info(f"[Coperniq] Call logged: {result}")
            return result.get("success", False)

        except Exception as e:
            logger.error(f"Failed to log call to Coperniq: {e}")
            return False

    def classify_priority(self, transcript: str) -> CallPriority:
        """
        Classify call priority based on transcript content.

        Args:
            transcript: Call transcript text

        Returns:
            Appropriate priority level
        """
        text = transcript.lower()

        # Emergency keywords
        emergency_keywords = [
            "emergency", "gas leak", "flooding", "no heat", "no cooling",
            "fire", "smoke", "dangerous", "urgent", "immediately",
            "can't breathe", "carbon monoxide", "co detector",
        ]
        if any(kw in text for kw in emergency_keywords):
            return CallPriority.EMERGENCY

        # Urgent keywords
        urgent_keywords = [
            "not working", "broken", "stopped", "won't start",
            "no hot water", "leaking", "dripping", "strange noise",
        ]
        if any(kw in text for kw in urgent_keywords):
            return CallPriority.URGENT

        # Scheduled keywords
        scheduled_keywords = [
            "schedule", "appointment", "maintenance", "inspection",
            "tune-up", "check-up", "routine", "annual",
        ]
        if any(kw in text for kw in scheduled_keywords):
            return CallPriority.SCHEDULED

        return CallPriority.NORMAL


# Singleton instance
_call_handler: Optional[CallHandler] = None


def get_call_handler() -> CallHandler:
    """Get or create call handler instance."""
    global _call_handler
    if _call_handler is None:
        _call_handler = CallHandler()
    return _call_handler


# =============================================================================
# FastAPI Webhook Routes (for integration)
# =============================================================================

def create_voice_routes():
    """Create FastAPI routes for Twilio webhooks."""
    from fastapi import APIRouter, Request, Response

    router = APIRouter(prefix="/voice", tags=["voice"])

    @router.post("/incoming")
    async def handle_incoming_call(request: Request):
        """Handle incoming Twilio call webhook."""
        form_data = await request.form()
        call_data = dict(form_data)

        handler = get_call_handler()
        twiml = await handler.handle_inbound(call_data)

        return Response(content=twiml, media_type="application/xml")

    @router.post("/status")
    async def handle_call_status(request: Request):
        """Handle Twilio call status webhook."""
        form_data = await request.form()
        status_data = dict(form_data)

        handler = get_call_handler()
        await handler.handle_call_status(status_data)

        return {"status": "ok"}

    @router.post("/handle-input")
    async def handle_speech_input(request: Request):
        """Handle speech input from caller."""
        form_data = await request.form()
        speech_result = form_data.get("SpeechResult", "")
        call_sid = form_data.get("CallSid", "")

        handler = get_call_handler()
        state = handler._active_calls.get(call_sid)

        if state:
            state.transcript = speech_result
            state.priority = handler.classify_priority(speech_result)

        # Acknowledge and transfer or handle
        priority_msg = {
            CallPriority.EMERGENCY: "I understand this is an emergency. Let me connect you with our dispatch team immediately.",
            CallPriority.URGENT: "I understand this is urgent. We'll prioritize your request.",
            CallPriority.NORMAL: "Thank you for the details. We'll schedule a technician for you.",
            CallPriority.SCHEDULED: "Great, let's get that scheduled for you.",
        }

        msg = priority_msg.get(state.priority if state else CallPriority.NORMAL, "Thank you for calling.")

        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">{msg}</Say>
    <Say voice="Polly.Joanna">A team member will contact you shortly. Goodbye!</Say>
</Response>"""

        return Response(content=twiml, media_type="application/xml")

    return router


if __name__ == "__main__":
    # Test configuration
    handler = CallHandler()
    print(f"Twilio configured: {handler.is_configured}")
    print(f"Phone number: {handler.phone_number}")
