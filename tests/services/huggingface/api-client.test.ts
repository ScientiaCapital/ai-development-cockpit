import { HuggingFaceApiClient } from '../../../src/services/huggingface/api-client';
import { RequestOptions, HuggingFaceApiResponse } from '../../../src/services/huggingface/api-client';

describe('HuggingFaceApiClient', () => {
  let apiClient: HuggingFaceApiClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    apiClient = new HuggingFaceApiClient('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful requests', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { data: { models: [] } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '99',
          'x-ratelimit-reset': '1609459200',
        }),
        json: async () => mockResponse,
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
      };

      const result = await apiClient.request(config);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://huggingface.co/api/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual({
        data: mockResponse,
        status: 200,
        headers: expect.any(Headers),
        rateLimitInfo: {
          limit: 100,
          remaining: 99,
          reset: 1609459200,
          resetDate: new Date(1609459200 * 1000),
        },
      });
    });

    it('should make a successful POST request with data', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'test-model' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => mockResponse,
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'POST',
        data: requestData,
      };

      const result = await apiClient.request(config);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://huggingface.co/api/models',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.status).toBe(201);
    });
  });

  describe('error handling', () => {
    it('should handle 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => ({ error: 'Invalid request' }),
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
      };

      await expect(apiClient.request(config)).rejects.toThrow('API request failed: 400 Bad Request');
    });

    it('should handle 5xx server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
      };

      await expect(apiClient.request(config)).rejects.toThrow('API request failed: 500 Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
      };

      await expect(apiClient.request(config)).rejects.toThrow('Network error');
    });
  });

  describe('retry mechanism', () => {
    it('should retry on 5xx errors', async () => {
      // First call fails with 500, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers(),
          json: async () => ({ error: 'Server error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true }),
        } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
        retry: { maxRetries: 2, retryDelay: 100 },
      };

      const result = await apiClient.request(config);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ success: true });
    });

    it('should retry on rate limit errors', async () => {
      // First call rate limited, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'retry-after': '1' }),
          json: async () => ({ error: 'Rate limited' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true }),
        } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
        retry: { maxRetries: 2, retryDelay: 100 },
      };

      const result = await apiClient.request(config);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ success: true });
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => ({ error: 'Invalid request' }),
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
        retry: { maxRetries: 2, retryDelay: 100 },
      };

      await expect(apiClient.request(config)).rejects.toThrow('API request failed: 400 Bad Request');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries limit', async () => {
      // All calls fail with 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
        retry: { maxRetries: 2, retryDelay: 10 },
      };

      await expect(apiClient.request(config)).rejects.toThrow('API request failed: 500 Internal Server Error');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('rate limit extraction', () => {
    it('should extract rate limit information from headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'x-ratelimit-limit': '1000',
          'x-ratelimit-remaining': '999',
          'x-ratelimit-reset': '1609459200',
        }),
        json: async () => ({ data: 'test' }),
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
      };

      const result = await apiClient.request(config);

      expect(result.rateLimitInfo).toEqual({
        limit: 1000,
        remaining: 999,
        reset: 1609459200,
        resetDate: new Date(1609459200 * 1000),
      });
    });

    it('should handle missing rate limit headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ data: 'test' }),
      } as Response);

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
      };

      const result = await apiClient.request(config);

      expect(result.rateLimitInfo).toBeUndefined();
    });
  });

  describe('timeout handling', () => {
    it('should handle request timeout', async () => {
      // Mock AbortSignal timeout
      const mockAbortController = new AbortController();
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController);

      // Simulate timeout by rejecting with AbortError after delay
      mockFetch.mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        })
      );

      const config: RequestOptions = {
        url: '/models',
        method: 'GET',
        timeout: 100,
      };

      await expect(apiClient.request(config)).rejects.toThrow('The operation was aborted');
    });
  });
});