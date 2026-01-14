"""
Voice Providers for Coperniq MEP Templates

Active Providers:
- TTS: Cartesia Sonic-3 (57 emotions, <100ms TTFB)
- STT: Deepgram Nova-3 (streaming, ~150ms latency)

Chinese Model Alternatives (Commented Out - Ready for Use):
- TTS: CosyVoice (Apache 2.0, 150ms streaming, $7.15/M UTF-8)
- TTS: Kokoro (Apache 2.0, 82M params, ~$1/M chars, runs on CPU)
- STT: SenseVoice (MIT, 5-15x faster than Whisper, $0.17/hr)

To enable Chinese models:
1. Uncomment the implementation in the respective provider file
2. Uncomment the imports below
3. Add to __all__ list
"""

# =============================================================================
# Active Providers
# =============================================================================
from .cartesia_tts import CartesiaTTSProvider, MEP_EMOTION_PRESETS
from .deepgram_stt import DeepgramSTTProvider
from .stt_base import STTProvider, STTProviderConfig, TranscriptResult
from .tts_base import TTSProvider, TTSProviderConfig

# =============================================================================
# Chinese Model Alternatives (Commented Out)
# Uncomment when ready to use - all are Commercial-Safe (Apache 2.0 / MIT)
# =============================================================================

# CosyVoice TTS - Alibaba's streaming TTS with 150ms latency
# License: Apache 2.0 | GitHub: https://github.com/FunAudioLLM/CosyVoice
# Cost: $7.15/M UTF-8 bytes via SiliconFlow
# from .cosyvoice_tts import CosyVoiceTTSProvider, COSYVOICE_MEP_EMOTIONS

# SenseVoice STT - 5-15x faster than Whisper
# License: MIT | GitHub: https://github.com/FunAudioLLM/SenseVoice
# Cost: $0.17/hour via SiliconFlow (vs $0.25 Deepgram)
# from .sensevoice_stt import SenseVoiceSTTProvider, SENSEVOICE_EMOTION_MAP

# Kokoro TTS - Ultra-lightweight 82M param TTS (runs on CPU!)
# License: Apache 2.0 | HuggingFace: https://huggingface.co/hexgrad/Kokoro-82M
# Cost: ~$1/M chars (Together AI) or FREE (self-hosted)
# from .kokoro_tts import KokoroTTSProvider, KOKORO_MEP_VOICES

__all__ = [
    # Active providers
    "CartesiaTTSProvider",
    "DeepgramSTTProvider",
    "STTProvider",
    "STTProviderConfig",
    "TranscriptResult",
    "TTSProvider",
    "TTSProviderConfig",
    "MEP_EMOTION_PRESETS",

    # Chinese alternatives (uncomment when enabling):
    # "CosyVoiceTTSProvider",
    # "COSYVOICE_MEP_EMOTIONS",
    # "SenseVoiceSTTProvider",
    # "SENSEVOICE_EMOTION_MAP",
    # "KokoroTTSProvider",
    # "KOKORO_MEP_VOICES",
]
