/**
 * Streaming Inference Service
 * WebSocket and SSE infrastructure for real-time LLM inference
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextRequest, NextResponse } from 'next/server';

interface InferenceRequest {
  endpointUrl: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  stream?: boolean;
}

interface InferenceResponse {
  text: string;
  tokenCount: number;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface StreamingChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
    index: number;
  }>;
  created: number;
  model: string;
  object: 'chat.completion.chunk';
}

export class StreamingInferenceService {
  private io: SocketIOServer | null = null;
  private activeStreams = new Map<string, AbortController>();

  /**
   * Initialize Socket.IO server
   */
  initializeSocketIO(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://swaggystacks.com', 'https://scientiacapital.com']
          : ['http://localhost:3000'],
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle inference requests
      socket.on('inference:start', async (data: InferenceRequest) => {
        await this.handleInferenceRequest(socket, data);
      });

      // Handle stream cancellation
      socket.on('inference:cancel', (streamId: string) => {
        this.cancelStream(streamId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.cleanupSocketStreams(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Handle WebSocket inference request
   */
  private async handleInferenceRequest(socket: any, request: InferenceRequest): Promise<void> {
    const streamId = `${socket.id}_${Date.now()}`;
    const abortController = new AbortController();
    this.activeStreams.set(streamId, abortController);

    try {
      // Validate request
      if (!request.endpointUrl || !request.prompt) {
        socket.emit('inference:error', {
          streamId,
          error: 'Missing required fields: endpointUrl and prompt'
        });
        return;
      }

      // Emit stream start
      socket.emit('inference:started', {
        streamId,
        timestamp: Date.now()
      });

      // Prepare inference payload
      const payload = {
        model: 'deployed-model',
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 150,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 0.9,
        stop: request.stopSequences || [],
        stream: true
      };

      // Make streaming request to RunPod endpoint
      const response = await fetch(`${request.endpointUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Process streaming response
      await this.processStreamingResponse(response, socket, streamId);

    } catch (error) {
      console.error(`Inference error for stream ${streamId}:`, error);

      socket.emit('inference:error', {
        streamId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Process streaming response from RunPod endpoint
   */
  private async processStreamingResponse(
    response: Response,
    socket: any,
    streamId: string
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let tokenCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === '') continue;
          if (trimmedLine === 'data: [DONE]') {
            socket.emit('inference:completed', {
              streamId,
              totalTokens: tokenCount,
              timestamp: Date.now()
            });
            return;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonData = trimmedLine.slice(6); // Remove 'data: '
              const chunk: StreamingChunk = JSON.parse(jsonData);

              // Extract content from chunk
              const content = chunk.choices[0]?.delta?.content || '';
              const finishReason = chunk.choices[0]?.finish_reason;

              if (content) {
                tokenCount++;

                // Emit token to client
                socket.emit('inference:token', {
                  streamId,
                  content,
                  tokenCount,
                  finishReason,
                  timestamp: Date.now()
                });
              }

              // Check if stream is finished
              if (finishReason) {
                socket.emit('inference:completed', {
                  streamId,
                  finishReason,
                  totalTokens: tokenCount,
                  timestamp: Date.now()
                });
                return;
              }

            } catch (parseError) {
              console.error('Error parsing SSE chunk:', parseError);
              // Continue processing other chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Server-Sent Events endpoint for streaming inference
   */
  async handleSSERequest(request: NextRequest): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const endpointUrl = searchParams.get('endpointUrl');
    const prompt = searchParams.get('prompt');

    if (!endpointUrl || !prompt) {
      return new Response('Missing endpointUrl or prompt parameters', { status: 400 });
    }

    // Create readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const payload = {
            model: 'deployed-model',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.7,
            stream: true
          };

          const response = await fetch(`${endpointUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            controller.error(new Error(`HTTP ${response.status}`));
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.error(new Error('No response reader'));
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && trimmed.startsWith('data: ')) {
                // Forward SSE data to client
                controller.enqueue(new TextEncoder().encode(`${trimmed}\n\n`));
              }
            }
          }

          controller.close();

        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  }

  /**
   * Cancel a streaming inference
   */
  cancelStream(streamId: string): void {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Cleanup streams for a disconnected socket
   */
  private cleanupSocketStreams(socketId: string): void {
    const streamsToCleanup = Array.from(this.activeStreams.keys())
      .filter(streamId => streamId.startsWith(socketId));

    streamsToCleanup.forEach(streamId => {
      this.cancelStream(streamId);
    });
  }

  /**
   * Get active stream statistics
   */
  getStreamStats(): {
    activeStreams: number;
    connectedClients: number;
    totalStreamsToday: number;
  } {
    return {
      activeStreams: this.activeStreams.size,
      connectedClients: this.io?.sockets.sockets.size || 0,
      totalStreamsToday: 0 // TODO: Implement daily counter
    };
  }

  /**
   * Broadcast system message to all connected clients
   */
  broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    if (this.io) {
      this.io.emit('system:message', {
        message,
        type,
        timestamp: Date.now()
      });
    }
  }
}

export default StreamingInferenceService;