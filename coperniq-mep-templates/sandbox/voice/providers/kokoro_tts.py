"""
Kokoro TTS Provider - Ultra-lightweight 82M parameter TTS.

License: Apache 2.0 (Commercial-safe)
HuggingFace: https://huggingface.co/hexgrad/Kokoro-82M
API: Together AI (~$1/M characters) or self-hosted

Features:
- Only 82M parameters (can run on CPU!)
- Quality comparable to much larger models
- Apache 2.0 licensed - trained on permissive data only
- <$1 per million characters
- Extremely fast inference

Best for:
- Edge devices and lightweight deployments
- Cost-sensitive applications
- CPU-only environments
- High-volume, quality-acceptable use cases

CURRENTLY COMMENTED OUT - Uncomment to enable as lightweight alternative.

Usage:
    from voice.providers.kokoro_tts import KokoroTTSProvider

    provider = KokoroTTSProvider()  # Uses local model by default
    audio = await provider.synthesize("Hello!", config)
"""

# =============================================================================
# COMMENTED OUT - Ready for future use
# =============================================================================

# import os
# import logging
# from typing import AsyncGenerator, Optional
# from dataclasses import dataclass
#
# from .tts_base import TTSProvider, TTSProviderConfig
#
# logger = logging.getLogger(__name__)
#
#
# @dataclass
# class KokoroConfig(TTSProviderConfig):
#     """Kokoro-specific configuration."""
#
#     # Model variant
#     model_id: str = "kokoro-82m"
#
#     # Voice style (Kokoro has limited but high-quality voices)
#     # Available: "default", "storyteller", "friendly", "professional"
#     voice_style: str = "professional"
#
#     # Speed adjustment (0.5 = half speed, 2.0 = double speed)
#     speed: float = 1.0
#
#     # Kokoro-specific: pronunciation style
#     # "american", "british", "neutral"
#     accent: str = "american"
#
#
# # Kokoro voice presets for MEP contractors
# KOKORO_MEP_VOICES = {
#     # Lighter-weight presets for Kokoro
#     "voice_ai": {
#         "voice_style": "friendly",
#         "speed": 1.0,
#     },
#     "dispatch": {
#         "voice_style": "professional",
#         "speed": 1.05,  # Slightly faster for urgency
#     },
#     "collections": {
#         "voice_style": "professional",
#         "speed": 0.95,  # Slightly slower for clarity
#     },
#     "pm_scheduler": {
#         "voice_style": "friendly",
#         "speed": 1.0,
#     },
#     "quote_builder": {
#         "voice_style": "professional",
#         "speed": 1.0,
#     },
# }
#
#
# class KokoroTTSProvider(TTSProvider):
#     """
#     Kokoro TTS Provider - Ultra-lightweight TTS.
#
#     Deployment options:
#     1. Together AI API: ~$1/M characters (TOGETHER_API_KEY)
#     2. Self-hosted via HuggingFace Transformers (local)
#     3. ONNX Runtime for CPU deployment
#
#     Cost comparison:
#     - Kokoro (Together): ~$1/M chars, ~$0.06/hr audio
#     - Kokoro (self-hosted): FREE (just compute)
#     - Cartesia: ~$15-25/M chars
#     - CosyVoice (SiliconFlow): $7.15/M UTF-8 bytes
#
#     Model size comparison:
#     - Kokoro: 82M params, <1GB VRAM
#     - CosyVoice: 500M params, 2-4GB VRAM
#     - Cartesia Sonic: ~1B+ params (cloud only)
#     """
#
#     def __init__(
#         self,
#         api_key: Optional[str] = None,
#         use_local: bool = False,
#     ):
#         """
#         Initialize Kokoro provider.
#
#         Args:
#             api_key: Together AI API key (or TOGETHER_API_KEY env var)
#             use_local: If True, load model locally instead of using API
#         """
#         self._api_key = api_key or os.getenv("TOGETHER_API_KEY")
#         self._use_local = use_local
#         self._model = None
#         self._processor = None
#
#         if use_local:
#             logger.info("Kokoro: Using local model (will load on first use)")
#         elif not self._api_key:
#             logger.warning(
#                 "Kokoro: No Together API key configured. "
#                 "Set TOGETHER_API_KEY or use_local=True."
#             )
#
#     @property
#     def name(self) -> str:
#         return "Kokoro"
#
#     @property
#     def supports_streaming(self) -> bool:
#         # Kokoro supports streaming via chunked generation
#         return True
#
#     @property
#     def supports_emotions(self) -> bool:
#         # Kokoro has voice styles but not fine-grained emotions
#         return False
#
#     def get_latency_estimate_ms(self) -> int:
#         # Kokoro is extremely fast due to small size
#         # Local: ~50-100ms, API: ~100-200ms
#         return 100 if self._use_local else 150
#
#     async def _load_local_model(self) -> None:
#         """Load Kokoro model locally using HuggingFace Transformers."""
#         if self._model is not None:
#             return
#
#         logger.info("Loading Kokoro model locally...")
#
#         try:
#             # Import here to avoid loading if not using local mode
#             from transformers import AutoProcessor, AutoModelForTextToWaveform
#             import torch
#
#             model_name = "hexgrad/Kokoro-82M"
#
#             self._processor = AutoProcessor.from_pretrained(model_name)
#             self._model = AutoModelForTextToWaveform.from_pretrained(
#                 model_name,
#                 torch_dtype=torch.float32,  # CPU-friendly
#             )
#
#             # Move to GPU if available
#             if torch.cuda.is_available():
#                 self._model = self._model.cuda()
#                 logger.info("Kokoro model loaded on GPU")
#             else:
#                 logger.info("Kokoro model loaded on CPU")
#
#         except ImportError as e:
#             raise RuntimeError(
#                 "Kokoro local mode requires: pip install transformers torch"
#             ) from e
#
#     async def synthesize(
#         self,
#         text: str,
#         config: TTSProviderConfig
#     ) -> bytes:
#         """
#         Synthesize text to audio.
#
#         Uses Together AI API or local model based on configuration.
#         """
#         if self._use_local:
#             return await self._synthesize_local(text, config)
#         else:
#             return await self._synthesize_api(text, config)
#
#     async def _synthesize_api(
#         self,
#         text: str,
#         config: TTSProviderConfig
#     ) -> bytes:
#         """Synthesize using Together AI API."""
#         import httpx
#
#         if not self._api_key:
#             raise ValueError("Together API key not configured")
#
#         headers = {
#             "Authorization": f"Bearer {self._api_key}",
#             "Content-Type": "application/json",
#         }
#
#         payload = {
#             "model": "hexgrad/Kokoro-82M",
#             "input": text,
#             "response_format": "pcm",
#         }
#
#         async with httpx.AsyncClient() as client:
#             response = await client.post(
#                 "https://api.together.xyz/v1/audio/speech",
#                 headers=headers,
#                 json=payload,
#                 timeout=30.0
#             )
#             response.raise_for_status()
#             return response.content
#
#     async def _synthesize_local(
#         self,
#         text: str,
#         config: TTSProviderConfig
#     ) -> bytes:
#         """Synthesize using local model."""
#         import asyncio
#
#         await self._load_local_model()
#
#         # Run in executor to avoid blocking
#         loop = asyncio.get_event_loop()
#         return await loop.run_in_executor(
#             None,
#             self._synthesize_local_sync,
#             text,
#             config
#         )
#
#     def _synthesize_local_sync(
#         self,
#         text: str,
#         config: TTSProviderConfig
#     ) -> bytes:
#         """Synchronous local synthesis (run in executor)."""
#         import torch
#         import numpy as np
#
#         inputs = self._processor(text, return_tensors="pt")
#
#         if torch.cuda.is_available():
#             inputs = {k: v.cuda() for k, v in inputs.items()}
#
#         with torch.no_grad():
#             output = self._model(**inputs)
#
#         # Convert to PCM bytes
#         audio = output.waveform.cpu().numpy().squeeze()
#         audio = (audio * 32767).astype(np.int16)
#
#         return audio.tobytes()
#
#     async def synthesize_stream(
#         self,
#         text: str,
#         config: TTSProviderConfig
#     ) -> AsyncGenerator[bytes, None]:
#         """
#         Stream synthesized audio chunks.
#
#         For Kokoro, we generate full audio then chunk it
#         (model is fast enough that this is acceptable).
#         """
#         audio = await self.synthesize(text, config)
#
#         # Stream in 1024-byte chunks
#         chunk_size = 1024
#         for i in range(0, len(audio), chunk_size):
#             yield audio[i:i + chunk_size]
#
#     async def warmup(self) -> None:
#         """Warm up the model (load if local)."""
#         if self._use_local:
#             await self._load_local_model()
#         logger.info("Kokoro provider ready")
#
#     async def close(self) -> None:
#         """Close provider and free resources."""
#         self._model = None
#         self._processor = None
#         logger.info("Kokoro provider closed")


# =============================================================================
# Placeholder class for when not enabled
# =============================================================================

class KokoroTTSProvider:
    """
    Placeholder for Kokoro TTS Provider.

    Uncomment the implementation above to enable.

    License: Apache 2.0 (Commercial-safe)
    HuggingFace: https://huggingface.co/hexgrad/Kokoro-82M
    Cost: ~$1/M chars (Together AI) or FREE (self-hosted)
    Size: 82M params (can run on CPU!)
    """

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "Kokoro provider is not enabled. "
            "Uncomment the implementation in kokoro_tts.py to use."
        )
