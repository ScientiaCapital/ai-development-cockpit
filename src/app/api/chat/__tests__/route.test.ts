import { POST, setCostOptimizer } from '../route';
import { NextRequest } from 'next/server';
import { CostOptimizerClient } from '@/services/CostOptimizerClient';

describe('POST /api/chat', () => {
  let mockCostOptimizer: jest.Mocked<CostOptimizerClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock
    mockCostOptimizer = {
      complete: jest.fn().mockResolvedValue({
        response: 'I can help you build that!',
        provider: 'claude',
        model: 'claude-3-haiku-20240307',
        tokens_in: 50,
        tokens_out: 25,
        cost: 0.0001
      })
    } as any;

    // Inject mock into route
    setCostOptimizer(mockCostOptimizer);
  });

  afterEach(() => {
    // Clean up
    setCostOptimizer(null);
  });

  describe('Basic chat functionality', () => {
    it('should accept POST requests with message and history', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I need a REST API',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('response');
      expect(typeof data.response).toBe('string');
    });

    it('should return cost information when available', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Build an API',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('cost');
      expect(data).toHaveProperty('provider');
      expect(typeof data.cost).toBe('number');
      expect(typeof data.provider).toBe('string');
    });

    it('should include conversation history in the request', async () => {
      const history = [
        { id: '1', role: 'user' as const, content: 'What can you do?' },
        { id: '2', role: 'assistant' as const, content: 'I can build apps!' }
      ];

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Build me an API',
          history
        })
      });

      await POST(request);

      expect(mockCostOptimizer.complete).toHaveBeenCalledWith(
        expect.stringContaining('Build me an API'),
        expect.objectContaining({
          task_type: 'conversation'
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return 400 for missing message', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 500 when cost optimizer fails', async () => {
      mockCostOptimizer.complete.mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle circuit breaker open state gracefully', async () => {
      mockCostOptimizer.complete.mockRejectedValue(
        new Error('Circuit breaker is open - service unavailable')
      );

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('unavailable');
    });
  });

  describe('Integration with CostOptimizerClient', () => {
    it('should use conversation task type for chat', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello',
          history: []
        })
      });

      await POST(request);

      expect(mockCostOptimizer.complete).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          task_type: 'conversation',
          complexity: 'simple'
        })
      );
    });

    it('should format conversation history correctly', async () => {
      const history = [
        { id: '1', role: 'user' as const, content: 'First question' },
        { id: '2', role: 'assistant' as const, content: 'First answer' },
        { id: '3', role: 'user' as const, content: 'Second question' }
      ];

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Third question',
          history
        })
      });

      await POST(request);

      const calledPrompt = mockCostOptimizer.complete.mock.calls[0][0];
      expect(calledPrompt).toContain('First question');
      expect(calledPrompt).toContain('First answer');
      expect(calledPrompt).toContain('Second question');
      expect(calledPrompt).toContain('Third question');
    });

    it('should limit max_tokens for chat responses', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Tell me about your features',
          history: []
        })
      });

      await POST(request);

      expect(mockCostOptimizer.complete).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          max_tokens: 500
        })
      );
    });
  });

  describe('Response format', () => {
    it('should return correct response structure', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toMatchObject({
        response: expect.any(String),
        cost: expect.any(Number),
        provider: expect.any(String)
      });
    });

    it('should handle responses without cost info gracefully', async () => {
      mockCostOptimizer.complete.mockResolvedValue({
        response: 'Response text',
        provider: 'unknown',
        model: 'unknown',
        tokens_in: 0,
        tokens_out: 0,
        cost: 0
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.response).toBe('Response text');
      expect(data.cost).toBe(0);
    });
  });

  describe('Security', () => {
    it('should accept special characters in user input', async () => {
      const inputWithSpecialChars = '<script>alert("xss")</script>Build an API';

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputWithSpecialChars,
          history: []
        })
      });

      await POST(request);

      const calledPrompt = mockCostOptimizer.complete.mock.calls[0][0];
      expect(calledPrompt).toContain('Build an API');
      // Special characters are passed through to AI (AI handles context)
      expect(calledPrompt).toContain('script');
    });

    it('should validate history array', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: 'not an array' // Invalid
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Input validation', () => {
    it('should reject empty message', async () => {
      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          history: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('cannot be empty');
    });

    it('should reject message exceeding max length', async () => {
      const longMessage = 'a'.repeat(10001); // 10001 chars > 10000 max

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: longMessage,
          history: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('too long');
    });

    it('should reject history exceeding max size', async () => {
      const largeHistory = Array.from({ length: 51 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`
      }));

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: largeHistory
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('too large');
    });

    it('should validate history message structure', async () => {
      const invalidHistory = [
        { role: 'invalid', content: 'test' } // Invalid role
      ];

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: invalidHistory
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid message format');
    });

    it('should reject history messages missing role', async () => {
      const invalidHistory = [
        { content: 'test' } // Missing role
      ];

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: invalidHistory as any
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid message format');
    });

    it('should reject history messages missing content', async () => {
      const invalidHistory = [
        { role: 'user' } // Missing content
      ];

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test',
          history: invalidHistory as any
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid message format');
    });
  });
});
