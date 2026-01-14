"""
SenseVoice STT Provider - Alibaba's ultra-fast speech-to-text.

License: MIT (Commercial-safe)
GitHub: https://github.com/FunAudioLLM/SenseVoice
API: Available via SiliconFlow ($0.17/hour) or self-hosted

Features:
- 5x faster than Whisper-Small, 15x faster than Whisper-Large
- 50+ languages with superior Chinese/Cantonese recognition
- Built-in emotion detection (SER)
- Audio event detection (laughter, applause, etc.)
- Deployable on iOS, Android, Raspberry Pi via sherpa-onnx

CURRENTLY COMMENTED OUT - Uncomment to enable as alternative to Deepgram.

Usage:
    from voice.providers.sensevoice_stt import SenseVoiceSTTProvider

    provider = SenseVoiceSTTProvider(api_key=os.getenv("SILICONFLOW_API_KEY"))
    await provider.connect(config)
    await provider.send_audio(audio_bytes)
"""

# =============================================================================
# COMMENTED OUT - Ready for future use
# =============================================================================

# import os
# import asyncio
# import logging
# from typing import Optional
# from dataclasses import dataclass
#
# from .stt_base import STTProvider, STTProviderConfig, TranscriptResult
#
# logger = logging.getLogger(__name__)
#
#
# @dataclass
# class SenseVoiceConfig(STTProviderConfig):
#     """SenseVoice-specific configuration."""
#
#     # Model variants: sensevoice-small, sensevoice-large
#     model: str = "sensevoice-small"  # Faster, still excellent quality
#
#     # Enable emotion detection (SenseVoice unique feature)
#     detect_emotion: bool = True
#
#     # Enable audio event detection (laughter, applause, etc.)
#     detect_audio_events: bool = False
#
#     # Language hint (improves accuracy)
#     # Options: "auto", "zh", "en", "ja", "ko", "yue" (Cantonese), etc.
#     language_hint: str = "auto"
#
#     # Output format
#     # "text" = plain text, "itn" = inverse text normalization (dates, numbers)
#     output_format: str = "itn"
#
#
# # SenseVoice emotion mapping for MEP use cases
# SENSEVOICE_EMOTION_MAP = {
#     # Customer emotions detected during calls
#     "angry": "escalate",      # Route to supervisor
#     "sad": "empathize",       # Use warm response
#     "happy": "standard",      # Normal flow
#     "fearful": "emergency",   # Check for safety issue
#     "surprised": "clarify",   # Confirm understanding
#     "neutral": "standard",    # Normal flow
# }
#
#
# class SenseVoiceSTTProvider(STTProvider):
#     """
#     SenseVoice STT Provider using Alibaba's SenseVoice.
#
#     Requires either:
#     - SiliconFlow API key (SILICONFLOW_API_KEY) for hosted inference
#     - Self-hosted SenseVoice server URL (SENSEVOICE_SERVER_URL)
#     - Local sherpa-onnx deployment
#
#     Cost comparison (per hour of audio):
#     - SiliconFlow: $0.17/hour
#     - Deepgram: $0.25/hour (Nova-3)
#     - Whisper API: $0.36/hour
#     - Self-hosted: GPU cost only
#
#     Speed comparison:
#     - SenseVoice-Small: 5x faster than Whisper-Small
#     - SenseVoice-Large: 15x faster than Whisper-Large
#     """
#
#     def __init__(
#         self,
#         api_key: Optional[str] = None,
#         server_url: Optional[str] = None,
#     ):
#         """
#         Initialize SenseVoice provider.
#
#         Args:
#             api_key: SiliconFlow API key (or SILICONFLOW_API_KEY env var)
#             server_url: Self-hosted server URL (or SENSEVOICE_SERVER_URL env var)
#         """
#         super().__init__()
#         self._api_key = api_key or os.getenv("SILICONFLOW_API_KEY")
#         self._server_url = server_url or os.getenv(
#             "SENSEVOICE_SERVER_URL",
#             "https://api.siliconflow.cn/v1/audio/transcriptions"
#         )
#         self._config: Optional[SenseVoiceConfig] = None
#         self._audio_buffer = bytearray()
#         self._processing_task: Optional[asyncio.Task] = None
#
#         if not self._api_key and not server_url:
#             logger.warning(
#                 "SenseVoice: No API key or server URL configured. "
#                 "Set SILICONFLOW_API_KEY or SENSEVOICE_SERVER_URL."
#             )
#
#     @property
#     def name(self) -> str:
#         return "SenseVoice"
#
#     @property
#     def supports_streaming(self) -> bool:
#         # SenseVoice via FunASR supports streaming
#         # SiliconFlow API may require batch mode
#         return True
#
#     def get_latency_estimate_ms(self) -> int:
#         # SenseVoice is 5-15x faster than Whisper
#         # Estimate: 30-50ms for short utterances
#         return 50
#
#     async def connect(self, config: STTProviderConfig) -> None:
#         """
#         Connect to SenseVoice service.
#
#         For SiliconFlow: Validates API key
#         For self-hosted: Opens WebSocket connection
#         """
#         self._config = config if isinstance(config, SenseVoiceConfig) else SenseVoiceConfig(
#             **{k: v for k, v in config.__dict__.items() if hasattr(SenseVoiceConfig, k)}
#         )
#         self._audio_buffer.clear()
#         self._is_connected = True
#         logger.info(f"SenseVoice connected with model: {self._config.model}")
#
#     async def send_audio(self, audio: bytes) -> None:
#         """
#         Send audio chunk for transcription.
#
#         Buffers audio and processes in chunks for efficiency.
#         """
#         if not self._is_connected:
#             raise RuntimeError("SenseVoice not connected")
#
#         self._audio_buffer.extend(audio)
#
#         # Process when we have enough audio (~500ms = 4000 samples @ 8kHz)
#         buffer_threshold = self._config.sample_rate // 2  # 500ms
#         if len(self._audio_buffer) >= buffer_threshold * 2:  # 2 bytes per sample
#             await self._process_buffer()
#
#     async def _process_buffer(self) -> None:
#         """Process accumulated audio buffer."""
#         import httpx
#
#         if not self._audio_buffer:
#             return
#
#         audio_data = bytes(self._audio_buffer)
#         self._audio_buffer.clear()
#
#         try:
#             headers = {
#                 "Authorization": f"Bearer {self._api_key}",
#             }
#
#             # SenseVoice API expects audio file upload
#             files = {
#                 "file": ("audio.wav", audio_data, "audio/wav"),
#             }
#             data = {
#                 "model": self._config.model,
#                 "language": self._config.language_hint,
#             }
#
#             async with httpx.AsyncClient() as client:
#                 response = await client.post(
#                     self._server_url,
#                     headers=headers,
#                     files=files,
#                     data=data,
#                     timeout=10.0
#                 )
#                 response.raise_for_status()
#                 result = response.json()
#
#                 # Emit transcript result
#                 transcript = TranscriptResult(
#                     text=result.get("text", ""),
#                     is_final=True,
#                     confidence=result.get("confidence", 0.95),
#                 )
#
#                 # Add emotion if detected
#                 if self._config.detect_emotion and "emotion" in result:
#                     transcript.emotion = result["emotion"]
#
#                 await self._emit_transcript(transcript)
#
#         except Exception as e:
#             logger.error(f"SenseVoice transcription error: {e}")
#
#     async def disconnect(self) -> None:
#         """Disconnect from SenseVoice service."""
#         # Process any remaining audio
#         if self._audio_buffer:
#             await self._process_buffer()
#
#         self._is_connected = False
#         self._audio_buffer.clear()
#         logger.info("SenseVoice disconnected")
#
#     async def flush(self) -> None:
#         """Process any remaining audio in buffer."""
#         if self._audio_buffer:
#             await self._process_buffer()


# =============================================================================
# Placeholder class for when not enabled
# =============================================================================

class SenseVoiceSTTProvider:
    """
    Placeholder for SenseVoice STT Provider.

    Uncomment the implementation above to enable.

    License: MIT (Commercial-safe)
    GitHub: https://github.com/FunAudioLLM/SenseVoice
    Cost: $0.17/hour via SiliconFlow (vs $0.25 Deepgram)
    Speed: 5-15x faster than Whisper
    """

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "SenseVoice provider is not enabled. "
            "Uncomment the implementation in sensevoice_stt.py to use."
        )
