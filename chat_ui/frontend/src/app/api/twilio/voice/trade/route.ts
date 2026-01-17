/**
 * Trade-Specific Voice Handler - Uses Cartesia TTS
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const getBaseUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kipper-energy-solutions.vercel.app';
const ttsUrl = (text: string) => `${getBaseUrl()}/api/twilio/tts?text=${encodeURIComponent(text)}&voice=male`;

// Trade-specific confirmation scripts - All 7 trades
const SCRIPTS: Record<string, string> = {
  hvac: `Thank you for those details. I'm creating a service request for Mark Thompson and our HVAC team. Would you like to schedule a same-day appointment?`,
  plumbing: `Got it. I'm logging this for Carlos Rodriguez and our plumbing team. Would you prefer same-day service or a specific time?`,
  electrical: `Understood. I'm creating a request for David Kim and our electrical team. When would you like us to come out?`,
  solar: `Perfect. I'll have Jennifer Lee, our solar specialist, follow up. Do you have a preferred time for a callback?`,
  low_voltage: `Thank you for the details. I'm creating a service request for Alex Turner, our low voltage specialist. When works best for a site visit?`,
  roofing: `Got it. I'm logging this for James Miller and our roofing team. Would you like a same-day inspection or a scheduled appointment?`,
  fire_safety: `Understood. I'm creating a request for Patricia Williams, our fire safety specialist. Do you need an annual inspection or is this more urgent?`,
  general: `Thank you. I'll have the right specialist contact you. Is there a best time to reach you?`,
  fallback: `I'll have our team call you back shortly. Thank you for calling Kipper Energy Solutions.`,
};

export async function POST(request: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const { searchParams } = new URL(request.url);
    const trade = searchParams.get('trade') || 'general';
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult') as string | null;

    if (speechResult) {
      twiml.play(ttsUrl(SCRIPTS[trade] || SCRIPTS.general));
      const gather = twiml.gather({
        input: ['speech'],
        action: `/api/twilio/voice/schedule?trade=${trade}`,
        method: 'POST',
        speechTimeout: 'auto',
        language: 'en-US',
      });
      gather.pause({ length: 5 });
      twiml.play(ttsUrl(SCRIPTS.fallback));
      twiml.hangup();
    } else {
      twiml.redirect(`/api/twilio/voice/transfer?trade=${trade}`);
    }

  } catch (error) {
    console.error('[Trade] Error:', error);
    twiml.redirect('/api/twilio/voice/transfer');
  }

  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
}
