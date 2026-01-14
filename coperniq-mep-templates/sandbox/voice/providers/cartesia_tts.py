"""
Cartesia TTS Provider - Sonic-3 Text-to-Speech with MEP Emotion Presets

This provider implements the TTSProvider interface for Cartesia's Sonic-3 model,
optimized for MEP contractor voice workflows:
- 57 valid emotions for nuanced responses
- Agent-specific emotion presets (voice-ai, dispatch, collections, pm-scheduler, quote-builder)
- Trade-specific tone adjustments (HVAC, Plumbing, Electrical, Fire Protection)
- <100ms time to first byte for natural conversations
- Bilingual support (English + Spanish)

NO OPENAI - This uses Cartesia's native API only.

API Key: CARTESIA_API_KEY from environment
"""

import os
import logging
from typing import AsyncGenerator, List, Optional, Dict, Any
from dataclasses import dataclass

from .tts_base import TTSProvider, TTSProviderConfig

logger = logging.getLogger(__name__)


# =============================================================================
# CARTESIA SONIC-3 VALID EMOTIONS (57 total)
# =============================================================================
# These are the ONLY emotions Cartesia accepts. Using invalid emotions = API error.

VALID_EMOTIONS = {
    # Positive emotions
    "happy", "excited", "enthusiastic", "elated", "euphoric",
    "triumphant", "amazed", "surprised", "content", "peaceful",
    "serene", "calm", "grateful", "affectionate", "curious",
    "hopeful", "confident", "proud", "determined", "inspired",
    "energetic", "playful", "mischievous", "amused", "tender",
    "romantic", "nostalgic", "sentimental", "empathetic", "caring",
    # Neutral emotions
    "neutral", "serious", "thoughtful", "contemplative",
    # Negative emotions (for appropriate contexts)
    "sad", "melancholic", "disappointed", "regretful", "apologetic",
    "sympathetic", "concerned", "worried", "anxious", "nervous",
    "frustrated", "annoyed", "impatient", "stern", "authoritative",
    "urgent", "alarmed", "shocked", "skeptical", "suspicious",
    "confused", "puzzled",
}


# =============================================================================
# MEP CONTRACTOR EMOTION PRESETS - THE SECRET SAUCE
# =============================================================================
# Each preset is tuned for specific MEP contractor workflows and customer interactions.

MEP_EMOTION_PRESETS: Dict[str, Dict[str, List[str]]] = {
    # -------------------------------------------------------------------------
    # AGENT-SPECIFIC PRESETS
    # -------------------------------------------------------------------------

    # Voice AI Agent - Handles inbound emergency and service calls
    # Tone: Warm, reassuring, professional - calms anxious customers
    "voice_ai": {
        "default": ["caring", "calm", "empathetic"],
        "emergency": ["urgent", "caring", "determined"],     # NO_HEAT, GAS_LEAK
        "greeting": ["enthusiastic", "caring", "calm"],       # Initial hello
        "scheduling": ["helpful", "content", "confident"],    # Booking appointments
        "escalation": ["concerned", "serious", "empathetic"], # Needs manager
        "farewell": ["grateful", "peaceful", "caring"],       # End of call
    },

    # Dispatch Agent - Coordinates technician assignments
    # Tone: Confident, efficient, organized - projects competence
    "dispatch": {
        "default": ["confident", "calm", "professional"],
        "assignment": ["confident", "determined", "content"], # Assigning tech
        "emergency": ["urgent", "determined", "serious"],     # STAT dispatch
        "update": ["calm", "thoughtful", "neutral"],          # Status updates
        "conflict": ["thoughtful", "neutral", "serious"],     # Scheduling conflicts
    },

    # Collections Agent - Handles overdue invoice follow-ups
    # Tone: Professional, empathetic, understanding - preserves relationships
    "collections": {
        "default": ["neutral", "calm", "empathetic"],
        "reminder_friendly": ["caring", "calm", "hopeful"],   # 0-30 days
        "reminder_concerned": ["concerned", "empathetic", "thoughtful"],  # 31-60 days
        "final_notice": ["serious", "neutral", "concerned"],  # 90+ days
        "payment_plan": ["hopeful", "empathetic", "grateful"],# Offering options
        "resolution": ["grateful", "content", "caring"],      # Payment received
    },

    # PM Scheduler Agent - Preventive maintenance reminders
    # Tone: Friendly, proactive, helpful - positions service positively
    "pm_scheduler": {
        "default": ["enthusiastic", "caring", "helpful"],
        "reminder": ["enthusiastic", "hopeful", "caring"],    # PM due soon
        "seasonal": ["excited", "helpful", "confident"],      # Spring AC, Fall Furnace
        "renewal": ["grateful", "hopeful", "caring"],         # Contract renewal
        "expired": ["concerned", "empathetic", "hopeful"],    # Service plan lapsed
    },

    # Quote Builder Agent - Proposal and estimate generation
    # Tone: Enthusiastic, trustworthy, confident - closes deals
    "quote_builder": {
        "default": ["confident", "enthusiastic", "helpful"],
        "presentation": ["excited", "confident", "proud"],    # Presenting options
        "good_option": ["neutral", "calm", "helpful"],        # Budget option
        "better_option": ["confident", "hopeful", "helpful"], # Mid-tier
        "best_option": ["excited", "enthusiastic", "proud"],  # Premium + service plan
        "objection": ["empathetic", "thoughtful", "calm"],    # Handling concerns
        "closing": ["grateful", "enthusiastic", "hopeful"],   # Asking for decision
    },

    # -------------------------------------------------------------------------
    # TRADE-SPECIFIC ADJUSTMENTS
    # -------------------------------------------------------------------------
    # These modify the agent presets based on trade context

    # HVAC - Heating, Ventilation, Air Conditioning
    # Technical confidence, seasonal awareness
    "hvac": {
        "default": ["confident", "calm", "helpful"],
        "summer_emergency": ["urgent", "caring", "determined"],   # AC out in heat
        "winter_emergency": ["urgent", "caring", "empathetic"],   # Heater out in cold
        "maintenance": ["enthusiastic", "helpful", "confident"],  # Tune-ups
        "technical": ["confident", "thoughtful", "neutral"],      # Explaining repairs
    },

    # Plumbing - Water, Drainage, Gas
    # Urgency handling, water damage empathy
    "plumbing": {
        "default": ["calm", "empathetic", "caring"],
        "leak_emergency": ["urgent", "concerned", "determined"],  # Active leak
        "water_damage": ["empathetic", "concerned", "caring"],    # Customer upset
        "drain": ["neutral", "helpful", "calm"],                  # Routine drain
        "gas_leak": ["urgent", "serious", "authoritative"],       # CRITICAL
    },

    # Electrical - Power, Wiring, Panels
    # Safety-first, code compliance authority
    "electrical": {
        "default": ["confident", "serious", "calm"],
        "safety": ["serious", "authoritative", "concerned"],      # Safety issues
        "code": ["confident", "authoritative", "neutral"],        # Code compliance
        "outage": ["concerned", "calm", "helpful"],               # Power issues
        "upgrade": ["enthusiastic", "confident", "helpful"],      # Panel upgrades
    },

    # Fire Protection - Sprinklers, Extinguishers, Alarms
    # NFPA compliance, inspection formality
    "fire_protection": {
        "default": ["serious", "confident", "neutral"],
        "inspection": ["confident", "authoritative", "neutral"],  # NFPA 25
        "deficiency": ["serious", "concerned", "authoritative"],  # Found issues
        "compliance": ["confident", "calm", "content"],           # Passing inspection
        "emergency": ["urgent", "authoritative", "serious"],      # System failure
    },

    # -------------------------------------------------------------------------
    # CALL DISPOSITION PRESETS
    # -------------------------------------------------------------------------

    "call_disposition": {
        "visit_scheduled": ["grateful", "enthusiastic", "content"],
        "info_provided": ["calm", "content", "helpful"],
        "issue_resolved": ["happy", "content", "caring"],
        "follow_up": ["hopeful", "calm", "caring"],
        "escalation": ["concerned", "serious", "empathetic"],
        "no_action": ["neutral", "calm", "content"],
        "unresponsive": ["neutral", "calm", "thoughtful"],
    },
}


# =============================================================================
# SPEED MAPPINGS
# =============================================================================
# Cartesia speed control - slower for clarity, faster for efficiency

SPEED_MAP = {
    "slowest": -1.0,   # 50% speed - elderly customers, complex info
    "slow": -0.5,      # 75% speed - technical explanations
    "normal": 0.0,     # 100% speed - default
    "fast": 0.5,       # 125% speed - confirmations
    "fastest": 1.0,    # 150% speed - brief acknowledgments
}


# =============================================================================
# VOICE SELECTIONS - MEP Contractor Appropriate
# =============================================================================
# Professional voices that work well for MEP service companies

MEP_VOICES = {
    # English voices
    "en_professional_female": "a0e99841-438c-4a64-b679-ae501e7d6091",  # Sarah
    "en_professional_male": "694f9389-aac1-45b6-b726-9d9369183238",    # Michael
    "en_warm_female": "b7d50908-b17c-442d-ad8d-810c63997ed9",          # Emily

    # Spanish voices (Latin American)
    "es_professional_female": "2ee87190-8f84-4925-97da-e52547f9462c",  # Sofia
    "es_professional_male": "50d6beb4-80ea-4802-8387-6c948fe84208",    # Carlos

    # Default by agent type
    "voice_ai": "b7d50908-b17c-442d-ad8d-810c63997ed9",          # Emily - warm
    "dispatch": "694f9389-aac1-45b6-b726-9d9369183238",          # Michael - confident
    "collections": "a0e99841-438c-4a64-b679-ae501e7d6091",       # Sarah - professional
    "pm_scheduler": "b7d50908-b17c-442d-ad8d-810c63997ed9",      # Emily - friendly
    "quote_builder": "694f9389-aac1-45b6-b726-9d9369183238",     # Michael - authoritative
}


class CartesiaTTSProvider(TTSProvider):
    """
    Cartesia Sonic-3 TTS provider with MEP emotion presets.

    Features:
    - Streaming audio with <100ms TTFB
    - 57 emotion controls for nuanced responses
    - Agent-specific emotion presets
    - Trade-specific tone adjustments
    - Bilingual English/Spanish support

    Usage:
        provider = CartesiaTTSProvider()

        # Get emotions for voice-ai agent during emergency
        emotions = provider.get_emotions("voice_ai", "emergency")

        # Configure with emotions
        config = TTSProviderConfig(
            voice_id=MEP_VOICES["voice_ai"],
            emotions=emotions,
        )

        # Stream audio
        async for chunk in provider.synthesize_stream(text, config):
            await send_audio(chunk)
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Cartesia provider.

        Args:
            api_key: Cartesia API key (defaults to CARTESIA_API_KEY env var)
        """
        self._api_key = api_key or os.environ.get("CARTESIA_API_KEY")
        if not self._api_key:
            raise ValueError(
                "Cartesia API key not configured. "
                "Set CARTESIA_API_KEY in .env file."
            )

        self._client = None
        self._ws_client = None

    @property
    def name(self) -> str:
        return "cartesia-sonic-3"

    @property
    def supports_streaming(self) -> bool:
        return True

    @property
    def supports_emotions(self) -> bool:
        return True

    def get_latency_estimate_ms(self) -> int:
        """Sonic-3 achieves <100ms TTFB."""
        return 80

    @staticmethod
    def get_emotions(
        agent_type: str,
        context: str = "default",
        trade: Optional[str] = None
    ) -> List[str]:
        """
        Get appropriate emotions for agent and context.

        This is the main interface for selecting emotions dynamically
        based on call context.

        Args:
            agent_type: Agent type (voice_ai, dispatch, collections, pm_scheduler, quote_builder)
            context: Situational context (default, emergency, greeting, etc.)
            trade: Optional trade override (hvac, plumbing, electrical, fire_protection)

        Returns:
            List of emotion strings for Cartesia API

        Example:
            # Emergency HVAC call to voice-ai agent
            emotions = CartesiaTTSProvider.get_emotions(
                agent_type="voice_ai",
                context="emergency",
                trade="hvac"
            )
            # Returns: ["urgent", "caring", "determined"] or trade-specific variant
        """
        # Check trade-specific presets first
        if trade and trade in MEP_EMOTION_PRESETS:
            trade_presets = MEP_EMOTION_PRESETS[trade]
            if context in trade_presets:
                return trade_presets[context]

        # Fall back to agent-specific presets
        if agent_type in MEP_EMOTION_PRESETS:
            agent_presets = MEP_EMOTION_PRESETS[agent_type]
            if context in agent_presets:
                return agent_presets[context]
            return agent_presets.get("default", ["neutral", "calm"])

        # Ultimate fallback
        return ["neutral", "calm", "helpful"]

    @staticmethod
    def get_voice_id(agent_type: str, language: str = "en") -> str:
        """
        Get appropriate voice ID for agent and language.

        Args:
            agent_type: Agent type
            language: Language code (en, es)

        Returns:
            Cartesia voice ID
        """
        # Language-specific override
        if language == "es":
            return MEP_VOICES.get("es_professional_female", MEP_VOICES["voice_ai"])

        # Agent-specific voice
        return MEP_VOICES.get(agent_type, MEP_VOICES["voice_ai"])

    @staticmethod
    def validate_emotions(emotions: List[str]) -> List[str]:
        """
        Validate emotions against Cartesia's accepted list.

        Args:
            emotions: List of emotion names

        Returns:
            List of valid emotions (invalid ones filtered out)
        """
        valid = [e for e in emotions if e.lower() in VALID_EMOTIONS]
        if len(valid) != len(emotions):
            invalid = set(emotions) - set(valid)
            logger.warning(f"Invalid emotions filtered: {invalid}")
        return valid

    def _get_client(self):
        """Get or create Cartesia client."""
        if self._client is None:
            try:
                from cartesia import Cartesia
                self._client = Cartesia(api_key=self._api_key)
            except ImportError:
                raise ImportError(
                    "cartesia package not installed. "
                    "Run: pip install cartesia"
                )
        return self._client

    async def _get_ws_client(self):
        """Get or create async WebSocket client for streaming."""
        if self._ws_client is None:
            try:
                from cartesia import AsyncCartesia
                self._ws_client = AsyncCartesia(api_key=self._api_key)
            except ImportError:
                raise ImportError(
                    "cartesia package not installed. "
                    "Run: pip install cartesia"
                )
        return self._ws_client

    async def synthesize(
        self,
        text: str,
        config: TTSProviderConfig
    ) -> bytes:
        """
        Synthesize text to audio (non-streaming).

        Args:
            text: Text to synthesize
            config: TTS configuration

        Returns:
            Complete audio data as bytes
        """
        client = self._get_client()

        # Validate emotions
        emotions = self.validate_emotions(config.emotions or [])

        # Map speed string to Cartesia format
        speed = SPEED_MAP.get(config.speed, 0.0)

        # Build voice config
        voice_config = {
            "mode": "id",
            "id": config.voice_id,
        }

        # Add experimental controls if emotions specified
        if emotions:
            voice_config["__experimental_controls"] = {
                "emotion": emotions,
                "speed": speed,
            }

        # Generate audio
        output = client.tts.bytes(
            model_id=config.model_id or "sonic-3",
            transcript=text,
            voice=voice_config,
            output_format={
                "container": "raw",
                "encoding": config.encoding,
                "sample_rate": config.sample_rate,
            },
            language=config.language,
        )

        return output

    async def synthesize_stream(
        self,
        text: str,
        config: TTSProviderConfig
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream synthesized audio chunks.

        Yields audio chunks as they're generated for <100ms TTFB.

        Args:
            text: Text to synthesize
            config: TTS configuration

        Yields:
            Audio chunks as bytes
        """
        client = await self._get_ws_client()

        # Validate emotions
        emotions = self.validate_emotions(config.emotions or [])

        # Map speed
        speed = SPEED_MAP.get(config.speed, 0.0)

        # Build voice config
        voice_config = {
            "mode": "id",
            "id": config.voice_id,
        }

        if emotions:
            voice_config["__experimental_controls"] = {
                "emotion": emotions,
                "speed": speed,
            }

        # Stream audio
        async for chunk in client.tts.stream(
            model_id=config.model_id or "sonic-3",
            transcript=text,
            voice=voice_config,
            output_format={
                "container": "raw",
                "encoding": config.encoding,
                "sample_rate": config.sample_rate,
            },
            language=config.language,
        ):
            if hasattr(chunk, "audio"):
                yield chunk.audio
            else:
                yield chunk

    async def warmup(self) -> None:
        """Warm up connection by synthesizing empty string."""
        try:
            _ = self._get_client()
            logger.info("Cartesia TTS provider warmed up")
        except Exception as e:
            logger.warning(f"Cartesia warmup failed: {e}")

    async def close(self) -> None:
        """Close WebSocket connection."""
        if self._ws_client:
            try:
                await self._ws_client.close()
            except Exception as e:
                logger.warning(f"Error closing Cartesia client: {e}")
            self._ws_client = None
        self._client = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_mep_voice_config(
    agent_type: str,
    context: str = "default",
    trade: Optional[str] = None,
    language: str = "en"
) -> TTSProviderConfig:
    """
    Convenience function to get fully configured TTSProviderConfig.

    Args:
        agent_type: Agent type (voice_ai, dispatch, etc.)
        context: Situational context (default, emergency, etc.)
        trade: Optional trade (hvac, plumbing, etc.)
        language: Language code (en, es)

    Returns:
        Configured TTSProviderConfig ready to use

    Example:
        config = get_mep_voice_config(
            agent_type="voice_ai",
            context="emergency",
            trade="hvac",
            language="en"
        )
        provider = CartesiaTTSProvider()
        audio = await provider.synthesize("I'm sending help right away!", config)
    """
    return TTSProviderConfig(
        voice_id=CartesiaTTSProvider.get_voice_id(agent_type, language),
        language=language,
        model_id="sonic-3",
        emotions=CartesiaTTSProvider.get_emotions(agent_type, context, trade),
    )
