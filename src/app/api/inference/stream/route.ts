/**
 * Streaming Inference API Route
 * Server-Sent Events endpoint for real-time LLM inference
 */

import { NextRequest } from 'next/server'
import StreamingInferenceService from '@/services/inference/streaming.service'

const streamingService = new StreamingInferenceService();

export async function GET(request: NextRequest) {
  return await streamingService.handleSSERequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'stats':
        const stats = streamingService.getStreamStats();
        return Response.json({
          success: true,
          data: stats
        });

      case 'broadcast':
        const { message, type } = body;
        streamingService.broadcastSystemMessage(message, type);
        return Response.json({
          success: true,
          message: 'Broadcast sent'
        });

      default:
        return Response.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Streaming API Error:', error);
    return Response.json({
      success: false,
      error: 'Streaming service error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}