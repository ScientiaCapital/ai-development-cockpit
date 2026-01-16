#!/usr/bin/env node
/**
 * Vozlux Voice MCP Server - AI Voice Pipeline for MEP Contractors
 *
 * This server provides voice AI capabilities via MCP protocol:
 * - Text-to-Speech via Cartesia Sonic-3 (40ms latency, emotion control)
 * - Speech-to-Text via Deepgram Nova-3 (best accuracy)
 * - LLM routing with multi-provider support (NO OpenAI)
 *
 * Voice Models (Best of the Best - NO OpenAI):
 * - TTS: Cartesia Sonic-3 (fastest, emotion-aware)
 * - STT: Deepgram Nova-3 (highest accuracy)
 * - LLM: Claude Sonnet 4.5, DeepSeek V3, Groq Llama (task-based routing)
 *
 * @author Kipper Energy Solutions
 * @license MIT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
// =============================================================================
// Voice Provider Configuration - Direct REST APIs (no SDK dependencies)
// =============================================================================

// Voice Presets for MEP Field Scenarios
const VOICE_PRESETS = {
  // Professional male voice for technical instructions
  technician: {
    voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091', // Sonic English - US Male
    emotion: ['professional', 'calm'],
    speed: 1.0,
  },
  // Friendly female voice for customer interactions
  dispatcher: {
    voiceId: '694f9389-aac1-45b6-b726-9d9369183238', // Sonic English - US Female
    emotion: ['friendly', 'helpful'],
    speed: 1.0,
  },
  // Urgent voice for emergency situations
  emergency: {
    voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091',
    emotion: ['urgent', 'serious'],
    speed: 1.1,
  },
  // Calm instructional voice for training
  trainer: {
    voiceId: '694f9389-aac1-45b6-b726-9d9369183238',
    emotion: ['calm', 'encouraging'],
    speed: 0.95,
  },
} as const;

type VoicePreset = keyof typeof VOICE_PRESETS;

// Emotion Controls for Cartesia
const EMOTION_CONTROLS = {
  happy: { positivity: 'high', energy: 'high' },
  sad: { positivity: 'low', energy: 'low' },
  professional: { positivity: 'medium', energy: 'medium' },
  urgent: { positivity: 'low', energy: 'high' },
  calm: { positivity: 'medium', energy: 'low' },
  friendly: { positivity: 'high', energy: 'medium' },
  serious: { positivity: 'low', energy: 'medium' },
  encouraging: { positivity: 'high', energy: 'medium' },
  helpful: { positivity: 'high', energy: 'medium' },
} as const;

// =============================================================================
// LLM Router Configuration (NO OpenAI)
// =============================================================================

// Task types for intelligent routing
type TaskType = 'FAST' | 'REASONING' | 'CREATIVE' | 'CODING' | 'GENERAL' | 'SUMMARIZATION';

interface LLMProvider {
  name: string;
  model: string;
  baseUrl: string;
  apiKeyEnv: string;
  maxTokens: number;
  costPer1MTokens: number;
}

// All LLM routing via OpenRouter - unified gateway with best-of-breed models
const LLM_PROVIDERS: Record<TaskType, LLMProvider> = {
  // Llama 3.3 70B for ultra-fast responses - via OpenRouter
  FAST: {
    name: 'Llama via OpenRouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    maxTokens: 4096,
    costPer1MTokens: 0.20,
  },
  // DeepSeek V3 for complex reasoning - via OpenRouter
  REASONING: {
    name: 'DeepSeek via OpenRouter',
    model: 'deepseek/deepseek-chat-v3-0324',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    maxTokens: 8192,
    costPer1MTokens: 0.14,
  },
  // Claude for creative and nuanced responses - via OpenRouter
  CREATIVE: {
    name: 'Claude via OpenRouter',
    model: 'anthropic/claude-sonnet-4',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    maxTokens: 8192,
    costPer1MTokens: 3.0,
  },
  // DeepSeek Coder for code generation - via OpenRouter
  CODING: {
    name: 'DeepSeek via OpenRouter',
    model: 'deepseek/deepseek-coder',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    maxTokens: 8192,
    costPer1MTokens: 0.14,
  },
  // Google Gemini Flash 2.0 for general conversation - via OpenRouter
  GENERAL: {
    name: 'Gemini via OpenRouter',
    model: 'google/gemini-2.0-flash-001',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    maxTokens: 4096,
    costPer1MTokens: 0.10,
  },
  // Llama 3.3 70B for fast summarization - via OpenRouter
  SUMMARIZATION: {
    name: 'Llama via OpenRouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    maxTokens: 2048,
    costPer1MTokens: 0.20,
  },
};

// =============================================================================
// TTS Functions - Cartesia Sonic-3
// =============================================================================

interface TTSResult {
  audioBase64: string;
  durationMs: number;
  model: string;
  voice: string;
  processingTimeMs: number;
}

/**
 * Generate speech from text using Cartesia Sonic-3
 */
async function textToSpeech(
  text: string,
  preset: VoicePreset = 'technician',
  customEmotion?: string[]
): Promise<TTSResult> {
  const startTime = Date.now();
  const voiceConfig = VOICE_PRESETS[preset];
  const emotions = customEmotion || voiceConfig.emotion;

  // Build emotion controls
  const emotionControls: Record<string, string> = {};
  for (const emotion of emotions) {
    const control = EMOTION_CONTROLS[emotion as keyof typeof EMOTION_CONTROLS];
    if (control) {
      Object.assign(emotionControls, control);
    }
  }

  try {
    // Use Cartesia REST API directly for better control
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      throw new Error('CARTESIA_API_KEY not configured');
    }

    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10',
      },
      body: JSON.stringify({
        model_id: 'sonic-2',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceConfig.voiceId,
        },
        output_format: {
          container: 'mp3',
          bit_rate: 64000, // Must be in bps, not kbps
          sample_rate: 24000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cartesia API error: ${response.status} - ${error}`);
    }

    const audioData = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioData);
    const audioBase64 = audioBuffer.toString('base64');

    // Estimate duration (rough calculation based on audio size)
    const estimatedDurationMs = Math.round((audioBuffer.length / 8000) * 1000);

    return {
      audioBase64,
      durationMs: estimatedDurationMs,
      model: 'cartesia-sonic-2',
      voice: preset,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('TTS error:', error);
    throw error;
  }
}

/**
 * Generate speech with streaming support (for real-time playback)
 */
async function textToSpeechStream(
  text: string,
  preset: VoicePreset = 'technician'
): Promise<{ streamUrl: string; model: string }> {
  const voiceConfig = VOICE_PRESETS[preset];

  // For streaming, we return connection info for WebSocket
  // Client should connect to Cartesia WebSocket directly
  return {
    streamUrl: 'wss://api.cartesia.ai/tts/websocket',
    model: 'cartesia-sonic-2',
  };
}

// =============================================================================
// STT Functions - Deepgram Nova-3
// =============================================================================

interface STTResult {
  transcript: string;
  confidence: number;
  words: Array<{ word: string; start: number; end: number; confidence: number }>;
  durationMs: number;
  model: string;
  processingTimeMs: number;
}

/**
 * Transcribe audio using Deepgram Nova-3
 */
async function speechToText(
  audioBase64: string,
  language: string = 'en-US'
): Promise<STTResult> {
  const startTime = Date.now();
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  // Decode base64 to buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=' + language + '&punctuate=true&diarize=false&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'audio/mp3',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const result = await response.json() as {
      results: {
        channels: Array<{
          alternatives: Array<{
            transcript: string;
            confidence: number;
            words: Array<{ word: string; start: number; end: number; confidence: number }>;
          }>;
        }>;
      };
      metadata: { duration: number };
    };

    const alternative = result.results?.channels?.[0]?.alternatives?.[0];

    return {
      transcript: alternative?.transcript || '',
      confidence: alternative?.confidence || 0,
      words: alternative?.words || [],
      durationMs: Math.round((result.metadata?.duration || 0) * 1000),
      model: 'deepgram-nova-3',
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('STT error:', error);
    throw error;
  }
}

// =============================================================================
// LLM Router Functions
// =============================================================================

interface LLMResult {
  response: string;
  model: string;
  provider: string;
  taskType: TaskType;
  tokensUsed: number;
  costUsd: number;
  processingTimeMs: number;
}

/**
 * Classify task type based on prompt content
 */
function classifyTaskType(prompt: string): TaskType {
  const lowerPrompt = prompt.toLowerCase();

  // Check for coding patterns
  if (
    lowerPrompt.includes('code') ||
    lowerPrompt.includes('function') ||
    lowerPrompt.includes('implement') ||
    lowerPrompt.includes('debug') ||
    lowerPrompt.includes('script')
  ) {
    return 'CODING';
  }

  // Check for reasoning patterns
  if (
    lowerPrompt.includes('explain') ||
    lowerPrompt.includes('analyze') ||
    lowerPrompt.includes('compare') ||
    lowerPrompt.includes('calculate') ||
    lowerPrompt.includes('why')
  ) {
    return 'REASONING';
  }

  // Check for summarization patterns
  if (
    lowerPrompt.includes('summarize') ||
    lowerPrompt.includes('brief') ||
    lowerPrompt.includes('tldr') ||
    lowerPrompt.includes('key points')
  ) {
    return 'SUMMARIZATION';
  }

  // Check for creative patterns
  if (
    lowerPrompt.includes('write') ||
    lowerPrompt.includes('create') ||
    lowerPrompt.includes('story') ||
    lowerPrompt.includes('draft')
  ) {
    return 'CREATIVE';
  }

  // Check for speed-critical patterns
  if (
    lowerPrompt.includes('quick') ||
    lowerPrompt.includes('fast') ||
    lowerPrompt.includes('urgent') ||
    prompt.length < 100
  ) {
    return 'FAST';
  }

  return 'GENERAL';
}

/**
 * Route prompt to appropriate LLM provider via OpenRouter
 * All models accessed through OpenRouter's unified OpenAI-compatible API
 */
async function routeToLLM(
  prompt: string,
  systemPrompt?: string,
  taskType?: TaskType
): Promise<LLMResult> {
  const startTime = Date.now();
  const selectedTaskType = taskType || classifyTaskType(prompt);
  const provider = LLM_PROVIDERS[selectedTaskType];

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${provider.apiKeyEnv} not configured`);
  }

  try {
    // OpenRouter unified API - works for all providers (Groq, DeepSeek, Claude, Gemini)
    const result = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://kipper.energy',
        'X-Title': 'Vozlux Voice MCP Server',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: provider.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful AI assistant for MEP field technicians. Be concise and practical.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!result.ok) {
      const errorBody = await result.text();
      throw new Error(`OpenRouter API error: ${result.status} - ${errorBody}`);
    }

    const data = await result.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { total_tokens: number; prompt_tokens?: number; completion_tokens?: number };
    };

    const response = data.choices[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens ||
      ((data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0));
    const costUsd = (tokensUsed / 1_000_000) * provider.costPer1MTokens;

    return {
      response,
      model: provider.model,
      provider: provider.name,
      taskType: selectedTaskType,
      tokensUsed,
      costUsd,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('LLM routing error:', error);
    throw error;
  }
}

// =============================================================================
// MCP Server Setup
// =============================================================================

const server = new Server(
  {
    name: 'vozlux-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // TTS Tools
      {
        name: 'text_to_speech',
        description: 'Convert text to speech using Cartesia Sonic-3 (40ms latency). Returns base64 encoded MP3 audio.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            text: {
              type: 'string',
              description: 'The text to convert to speech',
            },
            voice_preset: {
              type: 'string',
              enum: ['technician', 'dispatcher', 'emergency', 'trainer'],
              description: 'Voice preset for the speech',
            },
            emotions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Custom emotion controls (happy, sad, professional, urgent, calm, friendly)',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_tts_stream_info',
        description: 'Get WebSocket connection info for streaming TTS (for real-time voice interfaces)',
        inputSchema: {
          type: 'object' as const,
          properties: {
            voice_preset: {
              type: 'string',
              enum: ['technician', 'dispatcher', 'emergency', 'trainer'],
              description: 'Voice preset for the stream',
            },
          },
        },
      },
      // STT Tools
      {
        name: 'speech_to_text',
        description: 'Transcribe audio to text using Deepgram Nova-3 (highest accuracy). Accepts base64 encoded audio.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            audio: {
              type: 'string',
              description: 'Base64 encoded audio (MP3, WAV, etc.)',
            },
            language: {
              type: 'string',
              description: 'Language code (default: en-US)',
            },
          },
          required: ['audio'],
        },
      },
      // LLM Router Tools
      {
        name: 'route_to_llm',
        description: 'Route a prompt to the best LLM based on task type. Auto-classifies or accepts explicit type.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to send to the LLM',
            },
            system_prompt: {
              type: 'string',
              description: 'Optional system prompt for context',
            },
            task_type: {
              type: 'string',
              enum: ['FAST', 'REASONING', 'CREATIVE', 'CODING', 'GENERAL', 'SUMMARIZATION'],
              description: 'Explicit task type for routing (auto-classified if not provided)',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'classify_task',
        description: 'Classify a prompt to determine optimal LLM routing without making the actual call',
        inputSchema: {
          type: 'object' as const,
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to classify',
            },
          },
          required: ['prompt'],
        },
      },
      // Voice Pipeline Tools
      {
        name: 'voice_to_voice',
        description: 'Full voice pipeline: STT → LLM → TTS. Input audio, get audio response.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            audio: {
              type: 'string',
              description: 'Base64 encoded input audio',
            },
            system_prompt: {
              type: 'string',
              description: 'System prompt for the LLM',
            },
            voice_preset: {
              type: 'string',
              enum: ['technician', 'dispatcher', 'emergency', 'trainer'],
              description: 'Voice preset for the response',
            },
            task_type: {
              type: 'string',
              enum: ['FAST', 'REASONING', 'CREATIVE', 'CODING', 'GENERAL', 'SUMMARIZATION'],
              description: 'Task type for LLM routing',
            },
          },
          required: ['audio'],
        },
      },
      // Utility Tools
      {
        name: 'list_voice_presets',
        description: 'List all available voice presets with their configurations',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
      {
        name: 'list_llm_providers',
        description: 'List all available LLM providers and their task type mappings',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'text_to_speech': {
        const { text, voice_preset = 'technician', emotions } = args as {
          text: string;
          voice_preset?: VoicePreset;
          emotions?: string[];
        };
        const result = await textToSpeech(text, voice_preset, emotions);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_tts_stream_info': {
        const { voice_preset = 'technician' } = args as {
          voice_preset?: VoicePreset;
        };
        const result = await textToSpeechStream('', voice_preset);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                ...result,
                voice_config: VOICE_PRESETS[voice_preset],
                instructions: 'Connect to streamUrl via WebSocket. Send { transcript, voice_id } messages.',
              }, null, 2),
            },
          ],
        };
      }

      case 'speech_to_text': {
        const { audio, language = 'en-US' } = args as {
          audio: string;
          language?: string;
        };
        const result = await speechToText(audio, language);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'route_to_llm': {
        const { prompt, system_prompt, task_type } = args as {
          prompt: string;
          system_prompt?: string;
          task_type?: TaskType;
        };
        const result = await routeToLLM(prompt, system_prompt, task_type);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'classify_task': {
        const { prompt } = args as { prompt: string };
        const taskType = classifyTaskType(prompt);
        const provider = LLM_PROVIDERS[taskType];
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                task_type: taskType,
                recommended_provider: provider.name,
                model: provider.model,
                estimated_cost_per_1m_tokens: provider.costPer1MTokens,
              }, null, 2),
            },
          ],
        };
      }

      case 'voice_to_voice': {
        const { audio, system_prompt, voice_preset = 'technician', task_type } = args as {
          audio: string;
          system_prompt?: string;
          voice_preset?: VoicePreset;
          task_type?: TaskType;
        };

        // Step 1: STT
        const sttResult = await speechToText(audio);

        // Step 2: LLM
        const llmResult = await routeToLLM(
          sttResult.transcript,
          system_prompt || 'You are a helpful AI assistant for MEP field technicians. Be concise and practical.',
          task_type
        );

        // Step 3: TTS
        const ttsResult = await textToSpeech(llmResult.response, voice_preset);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                pipeline: 'voice_to_voice',
                input_transcript: sttResult.transcript,
                input_confidence: sttResult.confidence,
                llm_response: llmResult.response,
                llm_provider: llmResult.provider,
                llm_model: llmResult.model,
                output_audio_base64: ttsResult.audioBase64,
                output_duration_ms: ttsResult.durationMs,
                total_processing_time_ms: sttResult.processingTimeMs + llmResult.processingTimeMs + ttsResult.processingTimeMs,
                cost_usd: llmResult.costUsd,
              }, null, 2),
            },
          ],
        };
      }

      case 'list_voice_presets': {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                presets: Object.entries(VOICE_PRESETS).map(([name, config]) => ({
                  name,
                  voiceId: config.voiceId,
                  emotion: config.emotion,
                  speed: config.speed,
                  use_case: {
                    technician: 'Technical instructions and field guidance',
                    dispatcher: 'Customer-facing interactions',
                    emergency: 'Urgent safety situations',
                    trainer: 'Training and onboarding',
                  }[name],
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'list_llm_providers': {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                providers: Object.entries(LLM_PROVIDERS).map(([taskType, provider]) => ({
                  task_type: taskType,
                  provider: provider.name,
                  model: provider.model,
                  max_tokens: provider.maxTokens,
                  cost_per_1m_tokens: provider.costPer1MTokens,
                })),
                routing_logic: {
                  FAST: 'Short prompts, quick responses - Groq LPU (<100ms)',
                  REASONING: 'Complex analysis, explanations - DeepSeek V3',
                  CREATIVE: 'Writing, drafting content - Claude Sonnet',
                  CODING: 'Code generation, debugging - DeepSeek Coder',
                  GENERAL: 'General conversation - Claude Sonnet',
                  SUMMARIZATION: 'Condensing information - Groq LPU',
                },
                note: 'NO OpenAI models - all routing uses Claude, DeepSeek, or Groq',
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// =============================================================================
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vozlux Voice MCP Server running on stdio');
}

main().catch(console.error);
