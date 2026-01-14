"""
STT Provider Base - Abstract interface for speech-to-text providers.

This module defines the STTProvider interface for streaming speech recognition
(Deepgram, etc.).

Adapted from Vozlux voice stack for Coperniq MEP contractors.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable, Awaitable, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class STTProviderConfig:
    """Configuration for STT provider."""

    language: str = "en"
    model: str = "nova-3"  # Deepgram Nova-3 - latest and most accurate

    # Streaming settings
    interim_results: bool = True
    punctuate: bool = True
    smart_format: bool = True

    # Utterance detection
    utterance_end_ms: int = 1000  # Silence duration to end utterance
    vad_events: bool = False  # Voice activity detection events

    # Audio format (from Twilio Media Streams)
    sample_rate: int = 8000
    encoding: str = "mulaw"  # Twilio's default format


@dataclass
class TranscriptResult:
    """Result from speech-to-text transcription."""

    text: str
    is_final: bool = False
    confidence: float = 0.0
    words: Optional[list] = None  # Word-level timing if available

    # Timing info
    start_time: float = 0.0
    end_time: float = 0.0


# Type alias for transcript callback
TranscriptCallback = Callable[[TranscriptResult], Awaitable[None]]
UtteranceEndCallback = Callable[[], Awaitable[None]]
SpeechStartedCallback = Callable[[], Awaitable[None]]  # For interruption handling


class STTProvider(ABC):
    """
    Abstract base class for speech-to-text providers.

    Implementations:
    - DeepgramSTTProvider: Streaming STT with Nova-3

    STT providers use callbacks for real-time transcription results.
    """

    def __init__(self):
        self._on_transcript: Optional[TranscriptCallback] = None
        self._on_utterance_end: Optional[UtteranceEndCallback] = None
        self._on_speech_started: Optional[SpeechStartedCallback] = None
        self._is_connected: bool = False

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name for logging and identification."""
        pass

    @property
    @abstractmethod
    def supports_streaming(self) -> bool:
        """Whether this provider supports streaming audio input."""
        pass

    @property
    def is_connected(self) -> bool:
        """Whether the provider is currently connected."""
        return self._is_connected

    def on_transcript(self, callback: TranscriptCallback) -> None:
        """
        Set callback for transcript results.

        Callback is called with TranscriptResult for each transcription.
        May be called multiple times with interim_results (is_final=False)
        before the final result.

        Args:
            callback: Async function to call with results
        """
        self._on_transcript = callback

    def on_utterance_end(self, callback: UtteranceEndCallback) -> None:
        """
        Set callback for utterance end detection.

        Called when silence is detected after speech, indicating
        the user has finished speaking.

        Args:
            callback: Async function to call when utterance ends
        """
        self._on_utterance_end = callback

    def on_speech_started(self, callback: SpeechStartedCallback) -> None:
        """
        Set callback for speech start detection.

        Called when voice activity is detected, indicating the user
        has started speaking. Used for barge-in (interruption) handling -
        stops TTS playback when user speaks.

        Requires STTProviderConfig.vad_events = True.

        Args:
            callback: Async function to call when speech starts
        """
        self._on_speech_started = callback

    @abstractmethod
    async def connect(self, config: STTProviderConfig) -> None:
        """
        Connect to the STT service.

        Must be called before sending audio.

        Args:
            config: STT configuration

        Raises:
            ConnectionError: If connection fails
        """
        pass

    @abstractmethod
    async def send_audio(self, audio: bytes) -> None:
        """
        Send audio chunk for transcription.

        Audio should match the format specified in config (sample_rate, encoding).

        Args:
            audio: Audio data as bytes

        Raises:
            RuntimeError: If not connected
        """
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """
        Disconnect from the STT service.

        Cleanup resources and close connections.
        """
        pass

    async def flush(self) -> None:
        """
        Flush any pending audio and get final results.

        Call before disconnect to ensure all audio is processed.
        Default implementation does nothing.
        """
        pass

    def get_latency_estimate_ms(self) -> int:
        """
        Estimated transcription latency in milliseconds.

        Returns:
            Latency estimate from audio input to transcript
        """
        return 150  # Default estimate for streaming STT

    async def _emit_transcript(self, result: TranscriptResult) -> None:
        """Emit transcript to registered callback."""
        if self._on_transcript:
            await self._on_transcript(result)

    async def _emit_utterance_end(self) -> None:
        """Emit utterance end to registered callback."""
        if self._on_utterance_end:
            await self._on_utterance_end()

    async def _emit_speech_started(self) -> None:
        """Emit speech started to registered callback (for barge-in)."""
        if self._on_speech_started:
            await self._on_speech_started()
