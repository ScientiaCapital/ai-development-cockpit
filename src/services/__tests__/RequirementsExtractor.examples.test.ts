/**
 * Example test scenarios demonstrating RequirementsExtractor capabilities.
 * These tests show real-world use cases for "coding noobs" describing projects in plain English.
 */

import { RequirementsExtractor } from '../RequirementsExtractor';
import { CostOptimizerClient } from '../CostOptimizerClient';

jest.mock('../CostOptimizerClient');

describe('RequirementsExtractor - Example Scenarios', () => {
  let extractor: RequirementsExtractor;
  let mockCostOptimizer: jest.Mocked<CostOptimizerClient>;

  beforeEach(() => {
    mockCostOptimizer = {
      complete: jest.fn(),
    } as any;

    extractor = new RequirementsExtractor(mockCostOptimizer);
  });

  describe('Real-world examples from coding noobs', () => {
    it('Example 1: Art portfolio website', async () => {
      const conversation = [
        {
          role: 'user' as const,
          content: 'I want to build a website to sell my art',
          id: '1'
        }
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'web_app',
          features: ['ecommerce', 'portfolio', 'image_gallery'],
          clarificationNeeded: [
            'Do you want users to create accounts?',
            'What payment processor do you want to use?',
            'Do you need inventory management?'
          ],
          confidence: 'medium'
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 50,
        tokens_out: 100,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      // Verify extraction
      expect(result.projectType).toBe('web_app');
      expect(result.features).toEqual(['ecommerce', 'portfolio', 'image_gallery']);
      expect(result.clarificationNeeded).toContain('Do you want users to create accounts?');
      expect(result.confidence).toBe('medium');
    });

    it('Example 2: Email automation tool', async () => {
      const conversation = [
        { role: 'user' as const, content: 'I need email automation', id: '1' },
        { role: 'assistant' as const, content: 'What kind of emails do you want to send?', id: '2' },
        { role: 'user' as const, content: 'Follow-ups for clients who haven\'t responded', id: '3' },
        { role: 'assistant' as const, content: 'Where is your client data stored?', id: '4' },
        { role: 'user' as const, content: 'In a Google Sheet with their names and emails', id: '5' }
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'cli_tool',
          language: 'python',
          framework: 'click',
          features: [
            'email_automation',
            'google_sheets_integration',
            'follow_up_tracking',
            'scheduled_sending'
          ],
          clarificationNeeded: [
            'What email service do you want to use (Gmail, SendGrid, etc)?',
            'How often should it check for people to follow up with?'
          ],
          confidence: 'high'
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 100,
        tokens_out: 150,
        cost: 0.0002,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('cli_tool');
      expect(result.language).toBe('python');
      expect(result.features).toContain('email_automation');
      expect(result.features).toContain('google_sheets_integration');
      expect(result.confidence).toBe('high');
    });

    it('Example 3: Fitness tracking app', async () => {
      const conversation = [
        {
          role: 'user' as const,
          content: 'I want to make an app where people can track their workouts',
          id: '1'
        },
        {
          role: 'assistant' as const,
          content: 'Do you want a mobile app or a website?',
          id: '2'
        },
        {
          role: 'user' as const,
          content: 'Mobile app for iPhone and Android',
          id: '3'
        }
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'mobile_app',
          language: 'typescript',
          framework: 'react-native',
          features: [
            'workout_tracking',
            'exercise_logging',
            'progress_charts',
            'user_accounts',
            'cross_platform'
          ],
          clarificationNeeded: [
            'Do you want social features (sharing workouts, following friends)?',
            'Should it integrate with health apps like Apple Health?',
            'Do you want nutrition tracking too?'
          ],
          confidence: 'high'
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 80,
        tokens_out: 130,
        cost: 0.00015,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('mobile_app');
      expect(result.framework).toBe('react-native');
      expect(result.features).toContain('workout_tracking');
      expect(result.features).toContain('cross_platform');
    });

    it('Example 4: Restaurant reservation API', async () => {
      const conversation = [
        {
          role: 'user' as const,
          content: 'I need an API for my restaurant app that handles reservations',
          id: '1'
        },
        {
          role: 'assistant' as const,
          content: 'What programming language would you prefer?',
          id: '2'
        },
        {
          role: 'user' as const,
          content: 'I heard Python is good for APIs',
          id: '3'
        }
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'api',
          language: 'python',
          framework: 'fastapi',
          features: [
            'reservation_management',
            'table_availability',
            'customer_notifications',
            'rest_api',
            'database'
          ],
          clarificationNeeded: [
            'How many tables does your restaurant have?',
            'Do you want email/SMS notifications for confirmations?',
            'Should customers be able to modify or cancel reservations?'
          ],
          confidence: 'high'
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 75,
        tokens_out: 120,
        cost: 0.00014,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('api');
      expect(result.language).toBe('python');
      expect(result.framework).toBe('fastapi');
      expect(result.features).toContain('reservation_management');
    });

    it('Example 5: Super vague request (low confidence)', async () => {
      const conversation = [
        {
          role: 'user' as const,
          content: 'I need something for my business',
          id: '1'
        }
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          features: [],
          clarificationNeeded: [
            'What kind of business do you have?',
            'What problem are you trying to solve?',
            'Who will use this application?',
            'Do you need a website, mobile app, or something else?'
          ],
          confidence: 'low'
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 35,
        tokens_out: 90,
        cost: 0.0001,
      });

      const result = await extractor.extractFromConversation(conversation);

      // No project type or language extracted
      expect(result.projectType).toBeUndefined();
      expect(result.language).toBeUndefined();

      // Lots of clarification needed
      expect(result.clarificationNeeded.length).toBeGreaterThanOrEqual(4);
      expect(result.confidence).toBe('low');
    });

    it('Example 6: Budget-constrained startup MVP', async () => {
      const conversation = [
        {
          role: 'user' as const,
          content: 'I want to build a social network for dog owners but I only have $200 budget',
          id: '1'
        }
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'web_app',
          features: [
            'user_profiles',
            'photo_sharing',
            'social_feed',
            'comments',
            'dog_profiles'
          ],
          constraints: [
            'budget $200',
            'MVP only',
            'use free tier services'
          ],
          clarificationNeeded: [
            'What are the must-have features for your MVP?',
            'How many users do you expect in the first month?'
          ],
          confidence: 'medium'
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 60,
        tokens_out: 110,
        cost: 0.00012,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('web_app');
      expect(result.features).toContain('social_feed');
      expect(result.constraints).toContain('budget $200');
      expect(result.constraints).toContain('MVP only');
    });

    it('Example 7: Scaling requirements', async () => {
      const conversation = [
        {
          role: 'user' as const,
          content: 'I need a REST API that can handle 100,000 requests per day',
          id: '1'
        }
      ];

      mockCostOptimizer.complete.mockResolvedValue({
        response: JSON.stringify({
          projectType: 'api',
          features: [
            'rest_api',
            'high_performance',
            'rate_limiting',
            'caching'
          ],
          constraints: [
            'must handle 100k requests/day',
            'high availability required',
            'fast response times'
          ],
          clarificationNeeded: [
            'What will the API do?',
            'What programming language do you prefer?',
            'Do you need database persistence?'
          ],
          confidence: 'medium'
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 55,
        tokens_out: 105,
        cost: 0.00011,
      });

      const result = await extractor.extractFromConversation(conversation);

      expect(result.projectType).toBe('api');
      expect(result.features).toContain('high_performance');
      expect(result.constraints).toContain('must handle 100k requests/day');
    });
  });
});
