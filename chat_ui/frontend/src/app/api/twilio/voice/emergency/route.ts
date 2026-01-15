/**
 * Emergency Handler - Uses Cartesia TTS
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const getBaseUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kipper-energy-solutions.vercel.app';
const ttsUrl = (text: string) => `${getBaseUrl()}/api/twilio/tts?text=${encodeURIComponent(text)}&voice=male`;

const EMERGENCY_SCRIPT = `This is being treated as an emergency. I've notified our dispatch team and a technician will call you back within 5 minutes.

While you wait, here are safety reminders. If you smell gas, leave the building immediately. If you see fire, call 911. If you have flooding, locate your main water shutoff.

A technician will contact you shortly. Stay safe.`;

export async function POST(request: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;

    // Create emergency task
    await createEmergencyTask(callSid, from);

    // Play emergency script using Cartesia
    twiml.play(ttsUrl(EMERGENCY_SCRIPT));
    twiml.play(ttsUrl('Thank you for calling Kipper Energy Solutions. Stay safe.'));
    twiml.hangup();

  } catch (error) {
    console.error('[Emergency] Error:', error);
    twiml.redirect('/api/twilio/voice/transfer?trade=emergency');
  }

  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
}

async function createEmergencyTask(callSid: string, from: string) {
  try {
    await fetch(`${process.env.COPERNIQ_API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.COPERNIQ_API_KEY || '',
      },
      body: JSON.stringify({
        title: '🚨 EMERGENCY CALL',
        description: `URGENT: Emergency call from ${from}\nCall: ${callSid}\nTime: ${new Date().toISOString()}`,
        status: 'NEW',
        priority: 'URGENT',
        type: 'EMERGENCY',
      }),
    });
  } catch (error) {
    console.error('[Emergency Task] Error:', error);
  }
}
