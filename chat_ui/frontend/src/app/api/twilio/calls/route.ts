/**
 * Twilio Calls API - Fetch Live Active Calls
 *
 * Returns current active calls from Twilio for the VoiceAI dashboard.
 * Replaces mock data with real-time call information.
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(accountSid, authToken);
}

// Map Twilio call status to our CallStatus type
function mapCallStatus(twilioStatus: string): 'ringing' | 'active' | 'on_hold' | 'ended' {
  switch (twilioStatus) {
    case 'queued':
    case 'ringing':
    case 'initiated':
      return 'ringing';
    case 'in-progress':
      return 'active';
    case 'completed':
    case 'busy':
    case 'failed':
    case 'no-answer':
    case 'canceled':
      return 'ended';
    default:
      return 'active';
  }
}

// Map Twilio direction to our CallDirection type
function mapDirection(twilioDirection: string): 'inbound' | 'outbound' {
  return twilioDirection === 'inbound' ? 'inbound' : 'outbound';
}

// Calculate call duration in seconds
function calculateDuration(startTime: Date | null): number {
  if (!startTime) return 0;
  return Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
}

export async function GET(request: NextRequest) {
  try {
    const client = getTwilioClient();

    // Fetch calls in progress from Twilio
    const calls = await client.calls.list({
      status: 'in-progress',
      limit: 20,
    });

    // Also get ringing/queued calls
    const ringingCalls = await client.calls.list({
      status: 'ringing',
      limit: 10,
    });

    const queuedCalls = await client.calls.list({
      status: 'queued',
      limit: 10,
    });

    // Combine all active calls
    const allCalls = [...calls, ...ringingCalls, ...queuedCalls];

    // Transform to our VoiceCall format
    const voiceCalls = await Promise.all(
      allCalls.map(async (call) => {
        // Try to get caller info from Twilio lookup (optional)
        let callerName = 'Unknown Caller';
        try {
          if (call.from && process.env.TWILIO_LOOKUP_ENABLED === 'true') {
            const lookup = await client.lookups.v2.phoneNumbers(call.from).fetch({
              fields: 'caller_name',
            });
            const callerInfo = lookup.callerName as unknown as { caller_name?: string } | null;
            if (callerInfo?.caller_name) {
              callerName = callerInfo.caller_name;
            }
          }
        } catch {
          // Lookup failed, use default name
        }

        // Format phone for display
        const phone = call.direction === 'inbound' ? call.from : call.to;

        return {
          id: call.sid,
          callerName,
          callerPhone: phone || 'Unknown',
          direction: mapDirection(call.direction),
          status: mapCallStatus(call.status),
          duration: calculateDuration(call.startTime),
          startTime: call.startTime?.toISOString() || new Date().toISOString(),
          transcriptPreview: '', // Would need additional transcript API integration
        };
      })
    );

    return NextResponse.json({
      calls: voiceCalls,
      count: voiceCalls.length,
      timestamp: new Date().toISOString(),
      source: 'twilio',
    });
  } catch (error) {
    console.error('[Twilio Calls API] Error:', error);

    // If Twilio is not configured, return empty array (not mock data)
    if (error instanceof Error && error.message.includes('credentials')) {
      return NextResponse.json(
        {
          calls: [],
          count: 0,
          timestamp: new Date().toISOString(),
          source: 'twilio',
          error: 'Twilio not configured - add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to environment',
        },
        { status: 200 } // Return 200 so UI still works
      );
    }

    return NextResponse.json(
      {
        calls: [],
        count: 0,
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch calls from Twilio',
      },
      { status: 500 }
    );
  }
}

// POST to initiate an outbound call
export async function POST(request: NextRequest) {
  try {
    const client = getTwilioClient();
    const body = await request.json();

    const { to, from } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" phone number' },
        { status: 400 }
      );
    }

    const twilioPhone = from || process.env.TWILIO_PHONE_NUMBER;
    if (!twilioPhone) {
      return NextResponse.json(
        { error: 'No Twilio phone number configured' },
        { status: 500 }
      );
    }

    // Create outbound call that connects to our voice webhook
    const call = await client.calls.create({
      to,
      from: twilioPhone,
      url: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kipper-energy-solutions.vercel.app'}/api/twilio/voice`,
      method: 'POST',
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    });
  } catch (error) {
    console.error('[Twilio Calls API] Create call error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}
