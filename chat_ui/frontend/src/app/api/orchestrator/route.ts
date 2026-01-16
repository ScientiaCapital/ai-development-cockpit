/**
 * Multi-LLM Orchestrator API
 *
 * Routes requests to the optimal LLM based on task:
 * - Claude Opus 4.5: Complex reasoning, tool use, agentic tasks
 * - Claude Sonnet 4.5: Fast responses, simple queries
 * - Qwen VL (OpenRouter): Image analysis, OCR, document processing
 * - Cartesia Sonic 3: Voice TTS with low latency
 * - Deepgram: Voice STT
 *
 * NO OpenAI - Uses Anthropic, OpenRouter, Cartesia, Deepgram
 */

import { NextRequest, NextResponse } from 'next/server';

// API Endpoints
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CARTESIA_API_URL = 'https://api.cartesia.ai/tts/bytes';
const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

// Model Configuration - NO OpenAI
const MODELS = {
  // Claude Family (Primary - via Anthropic)
  claude_opus: 'claude-opus-4-5-20251101',      // Best reasoning, tools
  claude_sonnet: 'claude-sonnet-4-5-20250929',  // Fast, efficient
  claude_haiku: 'claude-haiku-4-5-20251001',    // Fastest

  // Vision Language Models (via OpenRouter)
  qwen_vl_plus: 'qwen/qwen-2.5-vl-72b-instruct', // Best VLM quality
  qwen_vl_fast: 'qwen/qwen-2.5-vl-7b-instruct',  // Fast VLM
  gemini_flash: 'google/gemini-flash-1.5',        // Alternative VLM

  // Voice (via Cartesia Sonic 3)
  cartesia_sonic: 'sonic-3',                      // TTS - Sonic 3 model with emotion/speed controls

  // STT (via Deepgram or AssemblyAI)
  deepgram_nova: 'nova-2',                        // STT - best accuracy, real-time
  assemblyai_best: 'best',                        // STT - highest accuracy, batch
  assemblyai_nano: 'nano',                        // STT - fast, lightweight
} as const;

// STT Provider selection
type STTProvider = 'deepgram' | 'assemblyai';

// Route type determines which LLM to use
type RouteType = 'reasoning' | 'simple' | 'vision' | 'voice_tts' | 'voice_stt';

interface OrchestratorRequest {
  route: RouteType;
  messages?: Array<{ role: string; content: string | unknown }>;
  text?: string;           // For TTS
  audio?: string;          // Base64 audio for STT
  image?: string;          // Base64 image for VLM
  imageUrl?: string;       // URL image for VLM
  model?: string;          // Override model selection
  voice?: string;          // Voice ID for TTS
  voiceEmotion?: string;   // Emotion for TTS (happy, sad, neutral, etc.)
  sttProvider?: STTProvider; // Choose STT provider
  tradeContext?: string;   // Trade for context-aware responses
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL DROPDOWN OPTIONS (for MVP UI)
// ═══════════════════════════════════════════════════════════════════════════
export const MODEL_OPTIONS = {
  reasoning: [
    { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Best reasoning, most capable', tier: 'premium' },
    { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Fast & smart balance', tier: 'standard' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', description: 'Best Chinese LLM, cost-effective', tier: 'budget' },
  ],
  vision: [
    { id: 'qwen/qwen-2.5-vl-72b-instruct', name: 'Qwen VL 72B', description: 'Best VLM quality', tier: 'premium' },
    { id: 'qwen/qwen-2.5-vl-7b-instruct', name: 'Qwen VL 7B', description: 'Fast VLM', tier: 'standard' },
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash', description: 'Google alternative', tier: 'standard' },
  ],
  voice_tts: [
    { id: 'sonic-3', name: 'Cartesia Sonic 3', description: '40ms latency, emotions', tier: 'premium' },
  ],
  voice_stt: [
    { id: 'deepgram:nova-2', name: 'Deepgram Nova 2', description: 'Real-time, best accuracy', tier: 'premium' },
    { id: 'assemblyai:best', name: 'AssemblyAI Best', description: 'Highest accuracy', tier: 'premium' },
    { id: 'assemblyai:nano', name: 'AssemblyAI Nano', description: 'Fast & lightweight', tier: 'standard' },
  ],
};

// Voice emotion options for Cartesia Sonic 3
// Speed range: 0.6 to 1.5 (multiplier, where 1.0 = normal speed)
// Emotion: single string from ~50 options: neutral, angry, excited, content, sad, scared, etc.
// Source: https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion
const VOICE_EMOTIONS: Record<string, { speed: number; emotion: string }> = {
  neutral: { speed: 1.0, emotion: 'neutral' },           // Default natural speech
  happy: { speed: 1.0, emotion: 'excited' },             // Upbeat, energetic
  professional: { speed: 0.9, emotion: 'content' },      // Calm, assured (slightly slower for clarity)
  urgent: { speed: 1.15, emotion: 'angry' },             // Fast, intense
  calm: { speed: 0.85, emotion: 'content' },             // Slow, relaxed
  empathetic: { speed: 0.88, emotion: 'sad' },           // Gentle, understanding
};

// Trade-specific system prompts for context
const TRADE_CONTEXTS: Record<string, string> = {
  hvac: 'You are Mark, a senior HVAC technician with EPA 608 and NATE certifications. Speak calmly and knowledgeably.',
  plumbing: 'You are a master plumber with UPC/IPC code expertise. Speak practically and directly.',
  electrical: 'You are a master electrician with OSHA 30 certification. Always prioritize safety. Cite NEC codes.',
  solar: 'You are a NABCEP certified solar specialist. Expert in NEC 690/705 and interconnection.',
  'fire-safety': 'You are a fire protection specialist. Expert in NFPA 13/25/72. Life safety is paramount.',
  'low-voltage': 'You are a low voltage specialist. Expert in security, access control, and BICSI cabling.',
  roofing: 'You are a roofing specialist. Expert in materials, inspections, and insurance claims.',
};

/**
 * Route to Claude (Anthropic Direct)
 */
async function routeToClaude(
  messages: Array<{ role: string; content: string | unknown }>,
  model: string,
  tradeContext?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const systemPrompt = tradeContext
    ? `${TRADE_CONTEXTS[tradeContext] || ''}\n\nYou are an AI assistant for MEP contractors with access to Coperniq.`
    : 'You are an AI assistant for MEP contractors with access to Coperniq.';

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || 'No response generated';
}

/**
 * Route to OpenRouter (VLMs - Qwen, Gemini)
 */
async function routeToOpenRouter(
  messages: Array<{ role: string; content: unknown }>,
  model: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://kipper-energy.ai',
      'X-Title': 'Kipper Energy AI',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
}

/**
 * Route to Cartesia (TTS) with Sonic 3 + Emotions
 */
async function routeToCartesia(
  text: string,
  voiceId?: string,
  emotion?: string
): Promise<Buffer> {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) throw new Error('CARTESIA_API_KEY not configured');

  // Get emotion config or default to neutral
  const emotionConfig = VOICE_EMOTIONS[emotion as keyof typeof VOICE_EMOTIONS] || VOICE_EMOTIONS.neutral;

  const response = await fetch(CARTESIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'Cartesia-Version': '2025-04-16',
    },
    body: JSON.stringify({
      model_id: MODELS.cartesia_sonic,
      transcript: text,
      voice: {
        mode: 'id',
        id: voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091', // Default professional voice
      },
      // Sonic 3 controls: speed (0.6-1.5), emotion (single string)
      // Docs: https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion
      generation_config: {
        speed: emotionConfig.speed,
        emotion: emotionConfig.emotion,
      },
      output_format: {
        container: 'mp3',
        encoding: 'mp3',
        sample_rate: 44100,  // Standard MP3 sample rate for browser playback
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cartesia API error: ${response.status} - ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Route to Deepgram (STT) - Real-time streaming capable
 * Supports webm/opus audio from browser MediaRecorder
 */
async function routeToDeepgram(audioBase64: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY not configured');

  const audioBuffer = Buffer.from(audioBase64, 'base64');

  // Log audio info for debugging
  console.log('[Deepgram] Audio buffer size:', audioBuffer.length, 'bytes');

  // Deepgram params: model, smart_format, punctuate
  // For webm/opus from browser, we let Deepgram auto-detect the encoding
  const params = new URLSearchParams({
    model: MODELS.deepgram_nova,
    smart_format: 'true',
    punctuate: 'true',
    language: 'en',
  });

  const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/webm',
      Authorization: `Token ${apiKey}`,
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Deepgram] Error response:', error);
    throw new Error(`Deepgram API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  console.log('[Deepgram] Transcript:', transcript);
  return transcript;
}

/**
 * Route to AssemblyAI (STT) - Highest accuracy batch processing
 */
async function routeToAssemblyAI(audioBase64: string, model: string = 'best'): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY not configured');

  const audioBuffer = Buffer.from(audioBase64, 'base64');

  // Step 1: Upload audio
  const uploadResponse = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: audioBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`AssemblyAI upload error: ${uploadResponse.status}`);
  }

  const { upload_url } = await uploadResponse.json();

  // Step 2: Create transcription
  const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      speech_model: model === 'nano' ? 'nano' : 'best',
      punctuate: true,
      format_text: true,
    }),
  });

  if (!transcriptResponse.ok) {
    throw new Error(`AssemblyAI transcript error: ${transcriptResponse.status}`);
  }

  const { id: transcriptId } = await transcriptResponse.json();

  // Step 3: Poll for completion (max 30 seconds)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
      headers: { Authorization: apiKey },
    });

    const result = await statusResponse.json();

    if (result.status === 'completed') {
      return result.text || '';
    } else if (result.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${result.error}`);
    }
  }

  throw new Error('AssemblyAI transcription timeout');
}

/**
 * Build VLM message with image
 */
function buildVLMMessage(
  prompt: string,
  imageBase64?: string,
  imageUrl?: string
): Array<{ role: string; content: unknown }> {
  const content: unknown[] = [];

  // Add image if provided
  if (imageBase64) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${imageBase64}`,
      },
    });
  } else if (imageUrl) {
    content.push({
      type: 'image_url',
      image_url: { url: imageUrl },
    });
  }

  // Add text prompt
  content.push({
    type: 'text',
    text: prompt,
  });

  return [{ role: 'user', content }];
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestratorRequest = await request.json();
    const { route, messages, text, audio, image, imageUrl, model, voice, voiceEmotion, sttProvider, tradeContext } = body;

    console.log(`[Orchestrator] Route: ${route}, Trade: ${tradeContext || 'general'}`);

    let result: Record<string, unknown> = {};

    switch (route) {
      // ═══════════════════════════════════════════════════════════════════════
      // REASONING: Complex tasks, tool use → Claude Opus
      // ═══════════════════════════════════════════════════════════════════════
      case 'reasoning': {
        if (!messages) throw new Error('Messages required for reasoning route');
        const selectedModel = model || MODELS.claude_opus;
        const response = await routeToClaude(messages, selectedModel, tradeContext);
        result = { text: response, model: selectedModel, route };
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SIMPLE: Quick responses → Claude Haiku
      // ═══════════════════════════════════════════════════════════════════════
      case 'simple': {
        if (!messages) throw new Error('Messages required for simple route');
        const selectedModel = model || MODELS.claude_haiku;
        const response = await routeToClaude(messages, selectedModel, tradeContext);
        result = { text: response, model: selectedModel, route };
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // VISION: Image analysis, OCR → Qwen VL via OpenRouter
      // ═══════════════════════════════════════════════════════════════════════
      case 'vision': {
        if (!image && !imageUrl) throw new Error('Image required for vision route');
        const prompt = messages?.[0]?.content as string || 'Describe this image in detail.';
        const vlmMessages = buildVLMMessage(prompt, image, imageUrl);
        const selectedModel = model || MODELS.qwen_vl_plus;
        const response = await routeToOpenRouter(vlmMessages, selectedModel);
        result = { text: response, model: selectedModel, route };
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // VOICE TTS: Text to Speech → Cartesia Sonic 3 with Emotions
      // ═══════════════════════════════════════════════════════════════════════
      case 'voice_tts': {
        if (!text) throw new Error('Text required for TTS route');
        const audioBuffer = await routeToCartesia(text, voice, voiceEmotion);
        result = {
          audio: audioBuffer.toString('base64'),
          format: 'mp3',
          model: MODELS.cartesia_sonic,
          emotion: voiceEmotion || 'neutral',
          route,
        };
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // VOICE STT: Speech to Text → Deepgram or AssemblyAI
      // ═══════════════════════════════════════════════════════════════════════
      case 'voice_stt': {
        if (!audio) throw new Error('Audio required for STT route');
        const provider = sttProvider || 'deepgram';
        let transcript: string;
        let usedModel: string;

        if (provider === 'assemblyai') {
          // Parse model from format like "assemblyai:best" or use default
          const assemblyModel = model?.includes(':') ? model.split(':')[1] : 'best';
          transcript = await routeToAssemblyAI(audio, assemblyModel);
          usedModel = `assemblyai:${assemblyModel}`;
        } else {
          transcript = await routeToDeepgram(audio);
          usedModel = `deepgram:${MODELS.deepgram_nova}`;
        }

        result = { text: transcript, model: usedModel, provider, route };
        break;
      }

      default:
        throw new Error(`Unknown route: ${route}`);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Orchestrator] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check with model info and dropdown options
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    name: 'Kipper Energy AI - Multi-LLM Orchestrator',
    version: '1.0.0',
    routes: ['reasoning', 'simple', 'vision', 'voice_tts', 'voice_stt'],

    // Model dropdown options for UI
    modelOptions: MODEL_OPTIONS,

    // Voice emotions available
    voiceEmotions: Object.keys(VOICE_EMOTIONS),

    // Supported trades
    trades: Object.keys(TRADE_CONTEXTS),

    // Provider status
    providers: {
      claude: !!process.env.ANTHROPIC_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      cartesia: !!process.env.CARTESIA_API_KEY,
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
      coperniq: !!process.env.COPERNIQ_API_KEY,
    },

    // Raw model IDs for reference
    models: MODELS,
  });
}
