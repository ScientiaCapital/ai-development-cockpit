import { RequirementsExtractor } from '../RequirementsExtractor';
import { CostOptimizerClient } from '../CostOptimizerClient';

// Mock the CostOptimizerClient
jest.mock('../CostOptimizerClient');

describe('RequirementsExtractor', () => {
  let extractor: RequirementsExtractor;
  let mockCostOptimizer: jest.Mocked<CostOptimizerClient>;

  beforeEach(() => {
    // Create a mock cost optimizer
    mockCostOptimizer = {
      complete: jest.fn(),
    } as any;

    extractor = new RequirementsExtractor(mockCostOptimizer);
  });

  describe('extractFromConversation', () => {
    it('should extract project type from simple web app description', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I want to build a website to sell my art', id: '1' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'web_app',
          features: ['ecommerce', 'portfolio'],
          clarificationNeeded: ['Do you want users to create accounts?'],
          confidence: 'medium',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 50,
        tokens_out: 100,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('web_app');
      expect(result.features).toContain('ecommerce');
      expect(result.features).toContain('portfolio');
      expect(result.clarificationNeeded.length).toBeGreaterThan(0);
      expect(result.confidence).toBe('medium');
    });

    it('should extract language preference when explicitly mentioned', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I need a REST API in Python', id: '1' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'api',
          language: 'python',
          framework: 'fastapi',
          features: ['rest_api'],
          clarificationNeeded: [],
          confidence: 'high',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 40,
        tokens_out: 80,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('api');
      expect(result.language).toBe('python');
      expect(result.framework).toBe('fastapi');
      expect(result.confidence).toBe('high');
    });

    it('should handle vague descriptions with low confidence', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I need something for my business', id: '1' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          features: [],
          clarificationNeeded: [
            'What kind of business do you have?',
            'What problem are you trying to solve?',
            'Who will use this application?',
          ],
          confidence: 'low',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 35,
        tokens_out: 90,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBeUndefined();
      expect(result.language).toBeUndefined();
      expect(result.clarificationNeeded.length).toBeGreaterThanOrEqual(3);
      expect(result.confidence).toBe('low');
    });

    it('should extract multiple features from detailed description', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I want to build an app where users can create accounts, post photos, and comment on each other\'s posts', id: '1' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'web_app',
          features: ['auth', 'user_accounts', 'photo_upload', 'comments', 'social_features'],
          clarificationNeeded: ['Do you want mobile apps or just a website?'],
          confidence: 'high',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 60,
        tokens_out: 120,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.features).toContain('auth');
      expect(result.features).toContain('user_accounts');
      expect(result.features).toContain('photo_upload');
      expect(result.features).toContain('comments');
      expect(result.features).toContain('social_features');
    });

    it('should extract constraints when mentioned', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I need an API that can handle 10,000 users and costs less than $100/month to run', id: '1' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'api',
          features: ['scalable'],
          constraints: ['must scale to 10k users', 'budget $100/month'],
          clarificationNeeded: ['What data will the API handle?'],
          confidence: 'medium',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 55,
        tokens_out: 95,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.constraints).toContain('must scale to 10k users');
      expect(result.constraints).toContain('budget $100/month');
    });

    it('should handle multi-turn conversations', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I need email automation', id: '1' },
        { role: 'assistant' as const, content: 'What kind of emails do you want to send?', id: '2' },
        { role: 'user' as const, content: 'Follow-ups for clients', id: '3' },
        { role: 'assistant' as const, content: 'Where is your client data stored?', id: '4' },
        { role: 'user' as const, content: 'In a Google Sheet', id: '5' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'cli_tool',
          language: 'python',
          features: ['email_automation', 'google_sheets_integration', 'client_management'],
          framework: 'click',
          clarificationNeeded: ['What email service do you want to use?'],
          confidence: 'high',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 100,
        tokens_out: 130,
        cost: 0.0002,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('cli_tool');
      expect(result.language).toBe('python');
      expect(result.features).toContain('email_automation');
      expect(result.features).toContain('google_sheets_integration');
    });

    it('should handle mobile app requests', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I want to build a mobile app for iOS and Android', id: '1' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'mobile_app',
          language: 'typescript',
          framework: 'react-native',
          features: ['cross_platform', 'mobile'],
          clarificationNeeded: ['What will the app do?'],
          confidence: 'medium',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 45,
        tokens_out: 85,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('mobile_app');
      expect(result.framework).toBe('react-native');
    });

    it('should handle library/package requests', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I want to create a reusable component library in React', id: '1' },
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'library',
          language: 'typescript',
          framework: 'react',
          features: ['component_library', 'reusable_components'],
          clarificationNeeded: ['What components do you need?'],
          confidence: 'high',
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 50,
        tokens_out: 90,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('library');
      expect(result.features).toContain('component_library');
    });

    it('should handle parsing errors gracefully', async () => {
      const conversation = [
        { role: 'user' as const, content: 'Build me an app', id: '1' },
      ];

      // Simulate malformed JSON response
      mockCostOptimizer.complete.mockResolvedValue({
        response: 'This is not valid JSON {broken',
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 30,
        tokens_out: 40,
        cost: 0.0001,
      });

      await expect(extractor.extractFromConversation(conversation)).rejects.toThrow();
    });

    it('should handle network errors from cost optimizer', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I need a web app', id: '1' },
      ];

      mockCostOptimizer.complete.mockRejectedValue(new Error('Network error'));

      await expect(extractor.extractFromConversation(conversation)).rejects.toThrow('Network error');
    });
  });

  describe('buildPrompt', () => {
    it('should build a well-structured prompt from conversation', () => {
      const conversation = [
        { role: 'user' as const, content: 'I want to build a website', id: '1' },
        { role: 'assistant' as const, content: 'What kind of website?', id: '2' },
        { role: 'user' as const, content: 'An online store', id: '3' },
      ];

      // Access private method via type assertion for testing
      const prompt = (extractor as any).buildPrompt(conversation);

      expect(prompt).toContain('user: I want to build a website');
      expect(prompt).toContain('assistant: What kind of website?');
      expect(prompt).toContain('user: An online store');
      expect(prompt).toContain('Extract technical requirements');
      expect(prompt).toContain('projectType');
      expect(prompt).toContain('language');
      expect(prompt).toContain('features');
    });
  });

  describe('validateAndParseResponse', () => {
    it('should parse valid JSON response', () => {
      const validJson = JSON.stringify({
        projectType: 'web_app',
        language: 'typescript',
        features: ['auth', 'database'],
        confidence: 'high',
        clarificationNeeded: [],
      });

      const result = (extractor as any).validateAndParseResponse(validJson);

      expect(result.projectType).toBe('web_app');
      expect(result.language).toBe('typescript');
      expect(result.features).toEqual(['auth', 'database']);
    });

    it('should throw on invalid JSON', () => {
      const invalidJson = 'not valid json {';

      expect(() => {
        (extractor as any).validateAndParseResponse(invalidJson);
      }).toThrow();
    });

    it('should handle JSON with extra whitespace', () => {
      const jsonWithWhitespace = `

        {
          "projectType": "api",
          "features": ["rest"]
        }

      `;

      const result = (extractor as any).validateAndParseResponse(jsonWithWhitespace);
      expect(result.projectType).toBe('api');
    });
  });
});
