import { HuggingFaceApiClient, ApiClientConfig, ModelSearchResult, ModelInfo, BatchSearchResult } from '../../../src/services/huggingface/api-client';
import axios from 'axios';
import { jest } from '@jest/globals';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HuggingFaceApiClient', () => {
  let client: HuggingFaceApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create client instance
    const config: Partial<ApiClientConfig> = {
      apiKey: 'test-api-key',
      organization: 'test-org',
      enableLogging: false,
    };

    client = new HuggingFaceApiClient(config);
  });

  describe('Basic HTTP Methods', () => {
    it('should make GET requests successfully', async () => {
      const mockResponse = {
        data: { test: 'data' },
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ test: 'data' });
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'get',
        url: '/test',
      });
    });

    it('should make POST requests with data', async () => {
      const mockResponse = {
        data: { created: true },
        status: 201,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      const postData = { name: 'test' };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.post('/test', postData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ created: true });
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'post',
        url: '/test',
        data: postData,
      });
    });

    it('should handle API errors properly', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Model not found' },
          headers: {},
        },
        message: 'Request failed with status code 404',
      };

      mockAxiosInstance.request.mockRejectedValue(mockError);

      await expect(client.get('/nonexistent')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Model not found',
        statusCode: 404,
        retryable: false,
      });
    });
  });

  describe('Model Discovery', () => {
    it('should search models with parameters', async () => {
      const mockModels: ModelSearchResult[] = [
        {
          id: 'test-model',
          author: 'test-author',
          sha: 'abc123',
          created_at: '2023-01-01',
          last_modified: '2023-01-02',
          private: false,
          gated: false,
          downloads: 1000,
          likes: 50,
          tags: ['chinese', 'text-generation'],
          pipeline_tag: 'text-generation',
        },
      ];

      const mockResponse = {
        data: mockModels,
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.searchModels({
        query: 'chinese',
        author: 'test-author',
        sort: 'downloads',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockModels);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'get',
        url: expect.stringContaining('/models?'),
      });

      const call = mockAxiosInstance.request.mock.calls[0][0];
      expect(call.url).toContain('search=chinese');
      expect(call.url).toContain('author=test-author');
      expect(call.url).toContain('sort=downloads');
      expect(call.url).toContain('limit=10');
    });

    it('should get model details', async () => {
      const mockModel: ModelInfo = {
        id: 'test-model',
        modelId: 'test-model',
        author: 'test-author',
        sha: 'abc123',
        created_at: '2023-01-01',
        last_modified: '2023-01-02',
        private: false,
        gated: false,
        downloads: 1000,
        likes: 50,
        tags: ['chinese', 'text-generation'],
        pipeline_tag: 'text-generation',
        siblings: [],
        description: 'Test model description',
      };

      const mockResponse = {
        data: mockModel,
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.getModel('test-model', {
        securityStatus: true,
        files_metadata: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockModel);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'get',
        url: expect.stringContaining('/models/test-model'),
      });

      const call = mockAxiosInstance.request.mock.calls[0][0];
      expect(call.url).toContain('securityStatus=true');
      expect(call.url).toContain('files_metadata=true');
    });

    it('should search Chinese models specifically', async () => {
      const mockModels: ModelSearchResult[] = [
        {
          id: 'Qwen/Qwen2.5-7B-Instruct',
          author: 'Qwen',
          sha: 'abc123',
          created_at: '2023-01-01',
          last_modified: '2023-01-02',
          private: false,
          gated: false,
          downloads: 50000,
          likes: 500,
          tags: ['chinese', 'instruct', 'text-generation'],
          pipeline_tag: 'text-generation',
        },
      ];

      const mockResponse = {
        data: mockModels,
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.searchChineseModels({
        minDownloads: 1000,
        includeInstruct: true,
        includeChat: true,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockModels);

      const call = mockAxiosInstance.request.mock.calls[0][0];
      expect(call.url).toContain('filter=language%3Azh%2Cinstruct%2Cconversational');
      expect(call.url).toContain('sort=downloads');
      expect(call.url).toContain('direction=desc');
    });
  });

  describe('Batch Operations', () => {
    it('should perform batch model searches', async () => {
      const mockBatchResults: BatchSearchResult[] = [
        {
          id: 'query1',
          success: true,
          data: [
            {
              id: 'model1',
              author: 'author1',
              sha: 'abc123',
              created_at: '2023-01-01',
              last_modified: '2023-01-02',
              private: false,
              gated: false,
              downloads: 1000,
              likes: 50,
              tags: ['chinese'],
              pipeline_tag: 'text-generation',
            },
          ],
        },
        {
          id: 'query2',
          success: true,
          data: [
            {
              id: 'model2',
              author: 'author2',
              sha: 'def456',
              created_at: '2023-01-01',
              last_modified: '2023-01-02',
              private: false,
              gated: false,
              downloads: 2000,
              likes: 100,
              tags: ['english'],
              pipeline_tag: 'text-generation',
            },
          ],
        },
      ];

      const mockResponse = {
        data: mockBatchResults,
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const queries = [
        { id: 'query1', query: 'chinese', limit: 10 },
        { id: 'query2', query: 'english', limit: 5 },
      ];

      const result = await client.batchSearchModels(queries);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBatchResults);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'post',
        url: '/batch',
        data: {
          requests: expect.arrayContaining([
            expect.objectContaining({
              id: 'query1',
              method: 'GET',
              url: expect.stringContaining('query=chinese'),
            }),
            expect.objectContaining({
              id: 'query2',
              method: 'GET',
              url: expect.stringContaining('query=english'),
            }),
          ]),
        },
      });
    });

    it('should perform batch model detail fetching', async () => {
      const modelIds = ['model1', 'model2'];
      const mockBatchResults = [
        {
          id: 'model1',
          success: true,
          data: {
            id: 'model1',
            modelId: 'model1',
            author: 'author1',
            downloads: 1000,
            siblings: [],
          },
        },
        {
          id: 'model2',
          success: true,
          data: {
            id: 'model2',
            modelId: 'model2',
            author: 'author2',
            downloads: 2000,
            siblings: [],
          },
        },
      ];

      const mockResponse = {
        data: mockBatchResults,
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.batchGetModels(modelIds, {
        securityStatus: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBatchResults);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'post',
        url: '/batch',
        data: {
          requests: expect.arrayContaining([
            expect.objectContaining({
              id: 'model1',
              method: 'GET',
              url: expect.stringContaining('/models/model1'),
            }),
            expect.objectContaining({
              id: 'model2',
              method: 'GET',
              url: expect.stringContaining('/models/model2'),
            }),
          ]),
        },
      });
    });
  });

  describe('Error Handling and Retries', () => {
    it('should retry on retryable errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
          headers: {},
        },
        message: 'Request failed with status code 500',
      };

      const mockSuccess = {
        data: { success: true },
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      // First call fails, second succeeds
      mockAxiosInstance.request
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);

      const result = await client.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true });
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
          headers: {},
        },
        message: 'Request failed with status code 400',
      };

      mockAxiosInstance.request.mockRejectedValue(mockError);

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        retryable: false,
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    });

    it('should handle rate limiting with retry-after', async () => {
      const mockError = {
        response: {
          status: 429,
          data: { message: 'Rate limited' },
          headers: {
            'retry-after': '2',
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 3600,
          },
        },
        message: 'Request failed with status code 429',
      };

      const mockSuccess = {
        data: { success: true },
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      // Mock setTimeout to avoid actual delays in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn: (...args: any[]) => void) => {
        fn();
        return 123 as any;
      });

      mockAxiosInstance.request
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);

      const result = await client.get('/test');

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Configuration and Stats', () => {
    it('should update API key', () => {
      client.setApiKey('new-api-key');
      // API key is set internally, we can't directly test it without exposing private properties
      // This test mainly ensures the method doesn't throw errors
      expect(() => client.setApiKey('new-api-key')).not.toThrow();
    });

    it('should update organization', () => {
      client.setOrganization('new-org');
      expect(() => client.setOrganization('new-org')).not.toThrow();
    });

    it('should return request statistics', () => {
      const stats = client.getStats();
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('errorRate');
      expect(typeof stats.requests).toBe('number');
      expect(typeof stats.errors).toBe('number');
      expect(typeof stats.errorRate).toBe('number');
    });

    it('should reset statistics', () => {
      client.resetStats();
      const stats = client.getStats();
      expect(stats.requests).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.errorRate).toBe(0);
    });
  });

  describe('Popular Chinese Models', () => {
    it('should get popular Chinese models with enhanced metadata', async () => {
      const mockBatchResults = [
        {
          id: 'Qwen/Qwen2.5-7B-Instruct',
          success: true,
          data: {
            id: 'Qwen/Qwen2.5-7B-Instruct',
            modelId: 'Qwen/Qwen2.5-7B-Instruct',
            author: 'Qwen',
            sha: 'abc123',
            created_at: '2023-01-01',
            last_modified: '2023-01-02',
            private: false,
            gated: false,
            downloads: 100000,
            likes: 1000,
            tags: ['chinese', 'instruct', 'text-generation'],
            pipeline_tag: 'text-generation',
            siblings: [],
          },
        },
      ];

      const mockResponse = {
        data: mockBatchResults,
        status: 200,
        headers: {},
        config: { metadata: { requestId: 'test-123', startTime: Date.now() } },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.getPopularChineseModels(5);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toMatchObject({
        id: 'Qwen/Qwen2.5-7B-Instruct',
        isPopular: true,
        chineseCapabilities: expect.arrayContaining(['instruction-following']),
        recommendedUseCase: 'Task-specific instructions and automation',
      });
    });
  });

  describe('WebSocket Support', () => {
    // Note: WebSocket testing would require more complex mocking
    // This is a basic structure test
    it('should have WebSocket subscription methods', () => {
      expect(typeof client.subscribeToModelUpdates).toBe('function');
      expect(typeof client.unsubscribeFromModelUpdates).toBe('function');
      expect(typeof client.getActiveWebSocketConnections).toBe('function');
      expect(typeof client.closeAllWebSocketConnections).toBe('function');
    });

    it('should return empty array for active connections initially', () => {
      const connections = client.getActiveWebSocketConnections();
      expect(Array.isArray(connections)).toBe(true);
      expect(connections).toHaveLength(0);
    });
  });
});