"""
Deepgram STT Provider - Nova-3 Streaming Speech-to-Text

This provider implements the STTProvider interface for Deepgram's
Nova models, optimized for telephony:
- 8kHz/mulaw input from Twilio Media Streams
- Real-time streaming transcription
- Utterance end detection (utterance_end_ms)
- Bilingual Spanish/English support

Models:
- "nova-3": Latest and most accurate (recommended)
- "nova-2": Previous generation, slightly faster

Adapted from Vozlux voice stack for Coperniq MEP contractors.

API Key: DEEPGRAM_API_KEY from environment
NO OPENAI - Uses Deepgram only.
"""

import os
import logging
import asyncio
from typing import Optional, Any

from .stt_base import STTProvider, STTProviderConfig, TranscriptResult

logger = logging.getLogger(__name__)


# Language mappings for Deepgram
DEEPGRAM_LANGUAGES = {
    "en": "en-US",
    "es": "es-419",  # Latin American Spanish
    "es-MX": "es-419",
}


class DeepgramSTTProvider(STTProvider):
    """
    Deepgram streaming STT provider using Nova models.

    Features:
    - Real-time streaming transcription
    - Low latency (~150ms typical)
    - Utterance end detection
    - Smart formatting and punctuation
    - Bilingual Spanish/English support

    Usage:
        provider = DeepgramSTTProvider()

        # Set up callbacks
        provider.on_transcript(handle_transcript)
        provider.on_utterance_end(handle_utterance_end)

        # Connect and stream audio
        await provider.connect(config)
        for audio_chunk in audio_stream:
            await provider.send_audio(audio_chunk)
        await provider.disconnect()
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Deepgram provider.

        Args:
            api_key: Deepgram API key (defaults to DEEPGRAM_API_KEY env var)
        """
        super().__init__()

        self._api_key = api_key or os.environ.get("DEEPGRAM_API_KEY")
        if not self._api_key:
            raise ValueError(
                "Deepgram API key not configured. "
                "Set DEEPGRAM_API_KEY in .env file."
            )

        self._client: Optional[Any] = None
        self._connection: Optional[Any] = None
        self._config: Optional[STTProviderConfig] = None
        self._listen_task: Optional[asyncio.Task] = None

    @property
    def name(self) -> str:
        return "deepgram-nova"

    @property
    def supports_streaming(self) -> bool:
        return True

    def get_latency_estimate_ms(self) -> int:
        """Nova models have ~150ms latency."""
        return 150

    async def connect(self, config: STTProviderConfig) -> None:
        """
        Connect to Deepgram streaming transcription.

        Uses Deepgram SDK v5+ with async context manager.

        Args:
            config: STT configuration

        Raises:
            ConnectionError: If connection fails
        """
        if self._is_connected:
            logger.warning("Already connected to Deepgram")
            return

        self._config = config

        try:
            from deepgram import AsyncDeepgramClient
            from deepgram.core.events import EventType

            # Initialize async Deepgram client
            self._client = AsyncDeepgramClient(api_key=self._api_key)

            # Get language code
            language = DEEPGRAM_LANGUAGES.get(config.language, config.language)

            # Create WebSocket connection using v1 API
            self._connection = await self._client.listen.v1.connect(
                model=config.model,
                language=language,
                encoding=config.encoding,
                sample_rate=str(config.sample_rate),
            )

            # Register event handlers
            self._connection.on(EventType.OPEN, self._handle_open)
            self._connection.on(EventType.MESSAGE, self._handle_message)
            self._connection.on(EventType.CLOSE, self._handle_close)
            self._connection.on(EventType.ERROR, self._handle_error)

            # Start listening for events in background
            self._listen_task = asyncio.create_task(
                self._connection.start_listening()
            )

            self._is_connected = True
            logger.info(
                f"Connected to Deepgram STT (model={config.model}, "
                f"lang={language}, sample_rate={config.sample_rate})"
            )

        except ImportError:
            raise ImportError(
                "deepgram-sdk package not installed. "
                "Run: pip install deepgram-sdk"
            )
        except Exception as e:
            logger.error(f"Deepgram connection failed: {e}")
            await self.disconnect()
            raise ConnectionError(f"Deepgram connection failed: {e}") from e

    async def send_audio(self, audio: bytes) -> None:
        """
        Send audio chunk for transcription.

        Args:
            audio: Audio data as bytes (should match config encoding/sample_rate)

        Raises:
            RuntimeError: If not connected
        """
        if not self._is_connected or not self._connection:
            raise RuntimeError("Not connected to Deepgram")

        if not audio:
            return

        try:
            from deepgram.extensions.types.sockets import ListenV1MediaMessage
            await self._connection.send_media(ListenV1MediaMessage(data=audio))
        except Exception as e:
            logger.error(f"Error sending audio to Deepgram: {e}")
            raise

    async def disconnect(self) -> None:
        """Disconnect from Deepgram and cleanup."""
        # Cancel listening task
        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass
            self._listen_task = None

        # Close connection
        if self._connection:
            try:
                from deepgram.extensions.types.sockets import ListenV1ControlMessage
                await self._connection.send_control(
                    ListenV1ControlMessage(type="CloseStream")
                )
            except Exception as e:
                logger.warning(f"Error closing Deepgram connection: {e}")

            self._connection = None

        self._client = None
        self._is_connected = False
        logger.debug("Disconnected from Deepgram STT")

    async def flush(self) -> None:
        """
        Flush pending audio and wait for final results.

        Signals end of audio stream to Deepgram.
        """
        if self._connection and self._is_connected:
            try:
                from deepgram.extensions.types.sockets import ListenV1ControlMessage
                await self._connection.send_control(
                    ListenV1ControlMessage(type="Finalize")
                )
                # Give time for final results to arrive
                await asyncio.sleep(0.2)
            except Exception as e:
                logger.warning(f"Error flushing Deepgram: {e}")

    def _handle_open(self, *args, **kwargs) -> None:
        """Handle connection open event."""
        logger.debug("Deepgram WebSocket connection opened")

    def _handle_close(self, *args, **kwargs) -> None:
        """Handle connection close event."""
        logger.debug("Deepgram WebSocket connection closed")
        self._is_connected = False

    def _handle_message(self, message: Any) -> None:
        """
        Handle message event from Deepgram.

        In v5 SDK, all transcript events come through MESSAGE.
        We need to check the message type and extract data accordingly.
        """
        if message is None:
            return

        try:
            # Get message type
            msg_type = getattr(message, "type", None)

            if msg_type == "Results":
                # This is a transcript result
                self._process_transcript(message)
            elif msg_type == "UtteranceEnd":
                # Utterance end event
                logger.debug("Deepgram utterance end detected")
                asyncio.create_task(self._emit_utterance_end())
            elif msg_type == "SpeechStarted":
                # Speech started event - for barge-in/interruption handling
                logger.debug("Deepgram speech started - emitting for interruption handling")
                asyncio.create_task(self._emit_speech_started())
            elif msg_type == "Metadata":
                logger.debug(f"Deepgram metadata: {message}")
            else:
                logger.debug(f"Deepgram message type: {msg_type}")

        except Exception as e:
            logger.error(f"Error handling Deepgram message: {e}")

    def _process_transcript(self, result: Any) -> None:
        """Process a transcript result from Deepgram."""
        try:
            # Extract transcript from response
            channel = getattr(result, "channel", None)
            if not channel:
                return

            alternatives = getattr(channel, "alternatives", [])
            if not alternatives:
                return

            alt = alternatives[0]
            text = getattr(alt, "transcript", "")

            if not text:
                return

            # Build result
            transcript_result = TranscriptResult(
                text=text,
                is_final=getattr(result, "is_final", False),
                confidence=getattr(alt, "confidence", 0.0),
                words=getattr(alt, "words", None),
                start_time=getattr(result, "start", 0.0),
                end_time=getattr(result, "start", 0.0) + getattr(result, "duration", 0.0),
            )

            # Emit to callback
            asyncio.create_task(self._emit_transcript(transcript_result))

            if transcript_result.is_final:
                logger.debug(f"Deepgram transcript (final): {text}")
            else:
                logger.debug(f"Deepgram transcript (interim): {text[:50]}...")

        except Exception as e:
            logger.error(f"Error processing Deepgram transcript: {e}")

    def _handle_error(self, error: Any) -> None:
        """Handle error event from Deepgram."""
        logger.error(f"Deepgram error: {error}")

    async def __aenter__(self) -> "DeepgramSTTProvider":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit - ensures cleanup."""
        await self.disconnect()
