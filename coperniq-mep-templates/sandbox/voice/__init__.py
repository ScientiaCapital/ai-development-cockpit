"""
Coperniq MEP Voice Stack - Inbound/Outbound Voice AI for MEP Contractors

Ported from Vozlux voice stack with MEP-specific emotion presets.

Components:
- TTS (Text-to-Speech): Cartesia Sonic-3 with 57 emotions
- STT (Speech-to-Text): Deepgram Nova-3 streaming
- Twilio: WebSocket media streams for telephony

Agent-Specific Emotion Presets:
- voice-ai: Warm, reassuring for emergency/service calls
- dispatch: Confident, efficient for technician coordination
- collections: Professional, empathetic for overdue invoices
- pm-scheduler: Friendly, proactive for maintenance reminders
- quote-builder: Enthusiastic, trustworthy for proposals

Trade-Specific Tone Adjustments:
- HVAC: Technical confidence, seasonal awareness
- Plumbing: Urgency handling, water damage empathy
- Electrical: Safety-first, code compliance authority
- Fire Protection: NFPA compliance, inspection formality
"""

from .providers.cartesia_tts import CartesiaTTSProvider, MEP_EMOTION_PRESETS
from .providers.deepgram_stt import DeepgramSTTProvider
from .providers.stt_base import STTProvider, STTProviderConfig, TranscriptResult
from .providers.tts_base import TTSProvider, TTSProviderConfig

__all__ = [
    "CartesiaTTSProvider",
    "DeepgramSTTProvider",
    "STTProvider",
    "STTProviderConfig",
    "TranscriptResult",
    "TTSProvider",
    "TTSProviderConfig",
    "MEP_EMOTION_PRESETS",
]
