/**
 * Twilio TTS Endpoint - Generates audio using Cartesia
 *
 * This endpoint generates speech using our Cartesia voice stack
 * and returns audio that Twilio can play via <Play> verb.
 */

import { NextRequest, NextResponse } from 'next/server';

// Cartesia Voice IDs
const VOICE_CONFIG = {
  male: {
    voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091', // Mark (Professional)
    emotion: 'professional',
  },
  female: {
    voiceId: 'b7d50908-b17c-442d-ad8d-810c63997ed9', // Sarah (Professional)
    emotion: 'professional',
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || 'Hello, how can I help you?';
    const voice = (searchParams.get('voice') || 'male') as keyof typeof VOICE_CONFIG;

    const config = VOICE_CONFIG[voice] || VOICE_CONFIG.male;

    // Call Cartesia TTS
    const cartesiaResponse = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CARTESIA_API_KEY || '',
        'Cartesia-Version': '2024-06-10',
      },
      body: JSON.stringify({
        transcript: text,
        model_id: 'sonic-english',
        voice: {
          mode: 'id',
          id: config.voiceId,
          __experimental_controls: {
            speed: 'normal',
            emotion: [config.emotion + ':medium'],
          },
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
      }),
    });

    if (!cartesiaResponse.ok) {
      console.error('[TTS] Cartesia error:', await cartesiaResponse.text());
      // Fallback to silent audio
      return new NextResponse(null, { status: 500 });
    }

    const audioBuffer = await cartesiaResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[TTS] Error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
