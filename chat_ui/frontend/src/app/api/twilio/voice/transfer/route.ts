/**
 * Transfer Handler - Uses Cartesia TTS
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const getBaseUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kipper-energy-solutions.vercel.app';
const ttsUrl = (text: string) => `${getBaseUrl()}/api/twilio/tts?text=${encodeURIComponent(text)}&voice=male`;

export async function POST(request: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const { searchParams } = new URL(request.url);
    const trade = searchParams.get('trade') || 'general';

    twiml.play(ttsUrl(`I'm connecting you with our ${trade === 'general' ? '' : trade + ' '}team now. Please hold.`));

    twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      timeout: 30,
    }, process.env.TWILIO_PHONE_NUMBER || '+15128771367');

    twiml.play(ttsUrl('Our team is currently assisting other customers. Please leave a message after the beep.'));
    twiml.record({
      maxLength: 120,
      transcribe: true,
      transcribeCallback: '/api/twilio/voice/voicemail',
    });

  } catch (error) {
    console.error('[Transfer] Error:', error);
    twiml.play(ttsUrl('Please call back in a few minutes.'));
    twiml.hangup();
  }

  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
}
