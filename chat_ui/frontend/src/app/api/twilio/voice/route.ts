/**
 * Twilio Voice Webhook - AI Voice Agent for Kipper Energy Solutions
 * Uses Cartesia TTS (Mark voice) - NO Polly/AWS voices
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Get base URL for TTS endpoint
const getBaseUrl = () => {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://kipper-energy-solutions.vercel.app';
};

// Generate TTS URL using our Cartesia voice stack
const ttsUrl = (text: string, voice: 'male' | 'female' = 'male') => {
  return `${getBaseUrl()}/api/twilio/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
};

// Trade routing keywords
const TRADE_KEYWORDS = {
  hvac: ['hvac', 'air conditioning', 'ac', 'heating', 'furnace', 'heat pump', 'thermostat', 'cold', 'hot', 'temperature', 'cooling', 'vent', 'duct', 'refrigerant'],
  plumbing: ['plumbing', 'plumber', 'leak', 'pipe', 'water', 'drain', 'clog', 'toilet', 'faucet', 'sink', 'shower', 'water heater', 'sewer', 'backflow'],
  electrical: ['electrical', 'electrician', 'outlet', 'circuit', 'breaker', 'panel', 'wire', 'light', 'power', 'voltage', 'spark', 'switch', 'socket'],
  solar: ['solar', 'panel', 'inverter', 'battery', 'energy', 'power generation', 'roof mount', 'sun'],
  emergency: ['emergency', 'urgent', 'gas leak', 'flooding', 'fire', 'no heat', 'no power', 'safety', 'dangerous'],
};

// Digit to trade mapping for IVR
const DIGIT_TO_TRADE: Record<string, string> = {
  '1': 'hvac',
  '2': 'plumbing',
  '3': 'electrical',
  '4': 'solar',
  '0': 'emergency',
};

// Voice scripts
const SCRIPTS = {
  welcome: `Thank you for calling Kipper Energy Solutions. My name is Mark, and I'm your AI assistant.`,
  ivr: `Press 1 for HVAC. Press 2 for Plumbing. Press 3 for Electrical. Press 4 for Solar. Press 0 for emergencies. Or simply describe your issue.`,
  noInput: `I didn't catch that. Let me transfer you to our team.`,
  hvac: `I understand you need help with heating or cooling. Can you tell me more about the issue?`,
  plumbing: `I understand you have a plumbing concern. Is this a leak, drain issue, or water heater problem?`,
  electrical: `I hear you have an electrical issue. Safety first - are you seeing sparks or smelling burning?`,
  solar: `Great, I can help with solar questions. Are you interested in a new installation or service?`,
  emergency: `This is being treated as an emergency. I'm notifying our dispatch team now.`,
  general: `I'd be happy to help. Are you calling about HVAC, plumbing, electrical, or solar?`,
  transfer: `I'm connecting you with our team now. Please hold.`,
};

// Detect trade from speech
function detectTrade(text: string): string {
  const lowerText = text.toLowerCase();

  if (TRADE_KEYWORDS.emergency.some(kw => lowerText.includes(kw))) {
    return 'emergency';
  }

  for (const [trade, keywords] of Object.entries(TRADE_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return trade;
    }
  }

  return 'general';
}

export async function POST(request: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const speechResult = formData.get('SpeechResult') as string | null;
    const digits = formData.get('Digits') as string | null;

    console.log(`[Voice] Call: ${callSid}, From: ${from}, Speech: ${speechResult}, Digits: ${digits}`);

    // Handle IVR digit selection
    if (digits && DIGIT_TO_TRADE[digits]) {
      const trade = DIGIT_TO_TRADE[digits];
      logToComperniq(callSid, from, `IVR: ${digits}`, trade).catch(console.error);
      sendSMS(from, `Kipper Energy: Your ${trade.toUpperCase()} request is being processed.`).catch(console.error);

      if (trade === 'emergency') {
        twiml.redirect('/api/twilio/voice/emergency');
      } else {
        const gather = twiml.gather({
          input: ['speech', 'dtmf'],
          action: `/api/twilio/voice/trade?trade=${trade}`,
          method: 'POST',
          speechTimeout: 'auto',
          language: 'en-US',
        });
        gather.play(ttsUrl(SCRIPTS[trade as keyof typeof SCRIPTS] || SCRIPTS.general));
        twiml.redirect(`/api/twilio/voice/transfer?trade=${trade}`);
      }
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    // Initial call - play welcome with IVR
    if (!speechResult && !digits) {
      const gather = twiml.gather({
        input: ['speech', 'dtmf'],
        action: '/api/twilio/voice',
        method: 'POST',
        speechTimeout: 'auto',
        timeout: 10,
        numDigits: 1,
        language: 'en-US',
      });
      gather.play(ttsUrl(SCRIPTS.welcome + ' ' + SCRIPTS.ivr));
      twiml.play(ttsUrl(SCRIPTS.noInput));
      twiml.redirect('/api/twilio/voice/transfer');
    }

    // Speech detected - route to trade
    if (speechResult) {
      const trade = detectTrade(speechResult);
      logToComperniq(callSid, from, speechResult, trade).catch(console.error);
      sendSMS(from, `Kipper Energy: Request received for ${trade.toUpperCase()} service.`).catch(console.error);

      if (trade === 'emergency') {
        twiml.redirect('/api/twilio/voice/emergency');
      } else {
        const gather = twiml.gather({
          input: ['speech', 'dtmf'],
          action: `/api/twilio/voice/trade?trade=${trade}`,
          method: 'POST',
          speechTimeout: 'auto',
          language: 'en-US',
        });
        gather.play(ttsUrl(SCRIPTS[trade as keyof typeof SCRIPTS] || SCRIPTS.general));
        twiml.play(ttsUrl(SCRIPTS.transfer));
        twiml.redirect(`/api/twilio/voice/transfer?trade=${trade}`);
      }
    }

  } catch (error) {
    console.error('[Voice] Error:', error);
    twiml.play(ttsUrl('We are experiencing technical difficulties. Please hold.'));
    twiml.redirect('/api/twilio/voice/transfer');
  }

  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
}

// Log to Coperniq Instance 388
async function logToComperniq(callSid: string, from: string, speech: string, trade: string) {
  try {
    await fetch(`${process.env.COPERNIQ_API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.COPERNIQ_API_KEY || '',
      },
      body: JSON.stringify({
        title: `Phone Call - ${trade.toUpperCase()}`,
        description: `Customer: ${from}\nRequest: ${speech}\nTrade: ${trade}\nCall: ${callSid}`,
        status: 'NEW',
        priority: trade === 'emergency' ? 'URGENT' : 'NORMAL',
        type: 'SERVICE_CALL',
      }),
    });
  } catch (error) {
    console.error('[Coperniq] Error:', error);
  }
}

// Send SMS via Twilio
async function sendSMS(to: string, message: string) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to.replace(/[^\d+]/g, ''),
    });
  } catch (error) {
    console.error('[SMS] Error:', error);
  }
}
