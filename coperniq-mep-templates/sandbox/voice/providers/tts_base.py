"""
TTS Provider Base - Abstract interface for text-to-speech providers.

This module defines the TTSProvider interface that all TTS implementations
must follow (Cartesia, etc.).

Adapted from Vozlux voice stack for Coperniq MEP contractors.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncGenerator, List, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class TTSProviderConfig:
    """Configuration for TTS provider."""

    voice_id: str
    language: str = "en"
    model_id: str = "sonic-3"  # Latest Cartesia model with best quality
    sample_rate: int = 8000  # Telephony standard
    encoding: str = "pcm_s16le"  # 16-bit PCM for Twilio

    # Speed control: "slowest", "slow", "normal", "fast", "fastest"
    # Or numeric: 0.5 = half speed, 2.0 = double speed
    speed: str = "normal"

    # Emotion controls (Cartesia Sonic only)
    # e.g., ["positivity:high", "warmth:medium"]
    emotions: Optional[List[str]] = None


class TTSProvider(ABC):
    """
    Abstract base class for text-to-speech providers.

    Implementations:
    - CartesiaTTSProvider: Cartesia Sonic-3 with streaming + emotions

    All methods are async to support streaming and non-blocking I/O.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name for logging and identification."""
        pass

    @property
    @abstractmethod
    def supports_streaming(self) -> bool:
        """Whether this provider supports streaming audio output."""
        pass

    @property
    @abstractmethod
    def supports_emotions(self) -> bool:
        """Whether this provider supports emotion controls."""
        pass

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        config: TTSProviderConfig
    ) -> bytes:
        """
        Synthesize text to audio (non-streaming).

        Generates complete audio and returns all bytes at once.
        Use for short utterances or when streaming isn't needed.

        Args:
            text: Text to synthesize
            config: TTS configuration

        Returns:
            Complete audio data as bytes
        """
        pass

    @abstractmethod
    async def synthesize_stream(
        self,
        text: str,
        config: TTSProviderConfig
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream synthesized audio chunks.

        Yields audio chunks as they're generated for low-latency playback.
        First chunk should arrive in <100ms for Cartesia Sonic-3.

        Args:
            text: Text to synthesize
            config: TTS configuration

        Yields:
            Audio chunks as bytes
        """
        pass

    async def warmup(self) -> None:
        """
        Warm up the provider connection.

        Call before first synthesis to reduce latency.
        Default implementation does nothing.
        """
        pass

    async def close(self) -> None:
        """
        Close provider connections and cleanup.

        Call when done with the provider.
        Default implementation does nothing.
        """
        pass

    def get_latency_estimate_ms(self) -> int:
        """
        Estimated time to first audio byte in milliseconds.

        Returns:
            Latency estimate in ms
        """
        return 100  # Default estimate

    @staticmethod
    def format_emotions(emotions: Optional[List[str]]) -> Optional[List[str]]:
        """
        Validate and format emotion tags.

        Args:
            emotions: List of emotion tags like ["positivity:high"]

        Returns:
            Validated emotion list or None
        """
        if not emotions:
            return None

        valid_emotions = []
        valid_emotion_names = {
            "positivity", "negativity", "anger", "sadness",
            "surprise", "curiosity", "warmth"
        }
        valid_levels = {"lowest", "low", "medium", "high", "highest"}

        for emotion in emotions:
            if ":" not in emotion:
                continue

            parts = emotion.split(":")
            if len(parts) != 2:
                continue

            name, level = parts[0].strip(), parts[1].strip()
            if name in valid_emotion_names and level in valid_levels:
                valid_emotions.append(f"{name}:{level}")

        return valid_emotions if valid_emotions else None
