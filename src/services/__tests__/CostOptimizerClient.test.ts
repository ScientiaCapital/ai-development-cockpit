import { CostOptimizerClient } from '../CostOptimizerClient';

// Mock fetch
global.fetch = jest.fn();

describe('CostOptimizerClient', () => {
  let client: CostOptimizerClient;

  beforeEach(() => {
    client = new CostOptimizerClient({
      baseURL: 'http://localhost:8000'
    });
    jest.clearAllMocks();
  });

  it('should make a completion request', async () => {
    const mockResponse = {
      response: 'Generated code',
      provider: 'deepseek',
      model: 'deepseek-chat',
      tokens_in: 10,
      tokens_out: 20,
      cost: 0.0001
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const response = await client.complete('Test prompt', {
      max_tokens: 100,
      task_type: 'code-generation',
      complexity: 'simple'
    });

    expect(response).toHaveProperty('response');
    expect(response).toHaveProperty('provider');
    expect(response).toHaveProperty('cost');
    expect(response.provider).toBe('deepseek');
    expect(response.cost).toBe(0.0001);
  });

  it('should handle connection errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

    const badClient = new CostOptimizerClient({
      baseURL: 'http://localhost:9999' // Bad port
    });

    await expect(badClient.complete('test')).rejects.toThrow();
  });

  it('should retry on transient failures', async () => {
    let attempts = 0;
    const mockFetch = jest.fn(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          response: 'success',
          provider: 'test',
          model: 'test-model',
          tokens_in: 10,
          tokens_out: 20,
          cost: 0.001
        })
      });
    });

    global.fetch = mockFetch as any;

    const response = await client.complete('test');
    expect(attempts).toBe(3);
    expect(response.response).toBe('success');
  });

  it('should open circuit breaker after threshold failures', async () => {
    const mockFetch = jest.fn(() => Promise.reject(new Error('Always fails')));
    global.fetch = mockFetch as any;

    // Trigger circuit breaker
    for (let i = 0; i < 5; i++) {
      try {
        await client.complete('test');
      } catch (e) {
        // Expected
      }
    }

    // Circuit should be open, request fails immediately
    const start = Date.now();
    try {
      await client.complete('test');
    } catch (e) {
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // No retry delay
    }
  });

  it('should recover from OPEN to HALF_OPEN to CLOSED after timeout', async () => {
    const mockFetch = jest.fn(() => Promise.reject(new Error('Service down')));
    global.fetch = mockFetch as any;

    // Trigger circuit breaker (5 failures)
    for (let i = 0; i < 5; i++) {
      try {
        await client.complete('test');
      } catch (e) {
        // Expected
      }
    }

    // Circuit is now OPEN
    await expect(client.complete('test')).rejects.toThrow('Circuit breaker is open');

    // Wait 60 seconds for reset timeout
    await new Promise(resolve => setTimeout(resolve, 60100));

    // Now mock should succeed to test HALF_OPEN → CLOSED transition
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'recovered',
        provider: 'test',
        model: 'test-model',
        tokens_in: 10,
        tokens_out: 20,
        cost: 0.001
      })
    });

    // This request should succeed and close the circuit
    const response = await client.complete('test');
    expect(response.response).toBe('recovered');

    // Verify circuit is CLOSED by making another successful request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'still working',
        provider: 'test',
        model: 'test-model',
        tokens_in: 10,
        tokens_out: 20,
        cost: 0.001
      })
    });

    const response2 = await client.complete('test');
    expect(response2.response).toBe('still working');
  }, 70000);

  it('should re-open circuit if HALF_OPEN request fails', async () => {
    const mockFetch = jest.fn(() => Promise.reject(new Error('Service down')));
    global.fetch = mockFetch as any;

    // Trigger circuit breaker (5 failures)
    for (let i = 0; i < 5; i++) {
      try {
        await client.complete('test');
      } catch (e) {
        // Expected
      }
    }

    // Circuit is now OPEN
    await expect(client.complete('test')).rejects.toThrow('Circuit breaker is open');

    // Wait 60 seconds for reset timeout
    await new Promise(resolve => setTimeout(resolve, 60100));

    // Request in HALF_OPEN state fails - circuit should re-open
    await expect(client.complete('test')).rejects.toThrow('Service down');

    // Circuit should be OPEN again
    await expect(client.complete('test')).rejects.toThrow('Circuit breaker is open');
  }, 70000);
});
