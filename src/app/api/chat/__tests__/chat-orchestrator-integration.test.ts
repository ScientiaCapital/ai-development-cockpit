/**
 * Test Task 7: Connect Chat Interface to Orchestrator
 *
 * Tests the full flow:
 * 1. User sends messages
 * 2. RequirementsExtractor analyzes conversation
 * 3. When confidence is high, trigger AgentOrchestrator
 * 4. Return build status to user
 */

import { POST, setCostOptimizer } from '../route';
import { NextRequest } from 'next/server';
import { CostOptimizerClient } from '@/services/CostOptimizerClient';
import { RequirementsExtractor } from '@/services/RequirementsExtractor';
import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator';

// Mock dependencies
jest.mock('@/services/RequirementsExtractor');
jest.mock('@/orchestrator/AgentOrchestrator');

describe('Chat to Orchestrator Integration (Task 7)', () => {
  let mockCostOptimizer: jest.Mocked<CostOptimizerClient>;
  let mockRequirementsExtractor: jest.Mocked<RequirementsExtractor>;
  let mockOrchestrator: jest.Mocked<AgentOrchestrator>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup cost optimizer mock
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

    // Setup requirements extractor mock
    mockRequirementsExtractor = {
      extractFromConversation: jest.fn()
    } as any;

    // Setup orchestrator mock
    mockOrchestrator = {
      startProject: jest.fn().mockResolvedValue({
        projectId: 'test-project-123',
        status: {
          projectId: 'test-project-123',
          status: 'running',
          currentPhase: 'architecture',
          agentsActive: ['CodeArchitect'],
          progress: 0,
          needsApproval: null,
          errors: []
        }
      }),
      getProjectStatus: jest.fn()
    } as any;

    // Inject mocks
    setCostOptimizer(mockCostOptimizer);
    (RequirementsExtractor as jest.Mock).mockImplementation(() => mockRequirementsExtractor);
    (AgentOrchestrator as jest.Mock).mockImplementation(() => mockOrchestrator);
  });

  afterEach(() => {
    setCostOptimizer(null);
  });

  describe('Requirements Extraction Flow', () => {
    it('should extract requirements from conversation on every message', async () => {
      const history = [
        { id: '1', role: 'user' as const, content: 'I want to build an API' },
        { id: '2', role: 'assistant' as const, content: 'What kind of API?' },
        { id: '3', role: 'user' as const, content: 'REST API for a blog' }
      ];

      // Mock low confidence - needs more info
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: undefined,
        framework: undefined,
        features: ['rest', 'blog'],
        clarificationNeeded: ['What language do you prefer?', 'Do you need authentication?'],
        confidence: 'low'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'REST API for a blog',
          history
        })
      });

      await POST(request);

      // Should call requirements extraction
      expect(mockRequirementsExtractor.extractFromConversation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ content: 'I want to build an API' }),
          expect.objectContaining({ content: 'REST API for a blog' })
        ])
      );
    });

    it('should ask clarifying questions when confidence is low', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        features: ['rest'],
        clarificationNeeded: ['What language?', 'Do you need auth?'],
        confidence: 'low'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I need an API',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('requirementsExtracted');
      expect(data.requirementsExtracted.confidence).toBe('low');
      expect(data.requirementsExtracted.clarificationNeeded).toHaveLength(2);

      // Should NOT trigger build
      expect(mockOrchestrator.startProject).not.toHaveBeenCalled();
    });

    it('should ask clarifying questions when confidence is medium', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest', 'database'],
        clarificationNeeded: ['Do you need authentication?'],
        confidence: 'medium'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Python REST API with database',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.requirementsExtracted.confidence).toBe('medium');

      // Should NOT trigger build
      expect(mockOrchestrator.startProject).not.toHaveBeenCalled();
    });
  });

  describe('Build Triggering Flow', () => {
    it('should trigger build when confidence is high', async () => {
      const history = [
        { id: '1', role: 'user' as const, content: 'I want to build a Python FastAPI REST API' },
        { id: '2', role: 'assistant' as const, content: 'What features do you need?' },
        { id: '3', role: 'user' as const, content: 'User authentication and PostgreSQL database' }
      ];

      // Mock high confidence - ready to build
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        framework: 'fastapi',
        features: ['auth', 'database', 'rest'],
        constraints: ['postgresql'],
        clarificationNeeded: [],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Yes, start building it!',
          history
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('buildStarted', true);
      expect(data).toHaveProperty('projectId');
      expect(data).toHaveProperty('buildStatus');

      // Should trigger orchestrator
      expect(mockOrchestrator.startProject).toHaveBeenCalledWith(
        expect.objectContaining({
          userRequest: expect.stringContaining('Python FastAPI'),
          projectName: expect.any(String)
        })
      );
    });

    it('should format user request from extracted requirements', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'web_app',
        language: 'typescript',
        framework: 'nextjs',
        features: ['auth', 'dashboard', 'api'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Start building',
          history: [
            { id: '1', role: 'user' as const, content: 'Build a Next.js dashboard with auth' }
          ]
        })
      });

      await POST(request);

      expect(mockOrchestrator.startProject).toHaveBeenCalledWith(
        expect.objectContaining({
          userRequest: expect.stringContaining('typescript'),
          userId: expect.any(String),
          organizationId: expect.any(String)
        })
      );
    });

    it('should return build status information', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'go',
        framework: 'gin',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Go ahead',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.buildStarted).toBe(true);
      expect(data.projectId).toBe('test-project-123');
      expect(data.buildStatus).toMatchObject({
        status: 'running',
        currentPhase: 'architecture'
      });
    });
  });

  describe('Build Trigger Detection', () => {
    it('should detect explicit "yes" as build confirmation', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes',
          history: []
        })
      });

      await POST(request);
      expect(mockOrchestrator.startProject).toHaveBeenCalled();
    });

    it('should detect "ready" as build confirmation', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "I'm ready to build",
          history: []
        })
      });

      await POST(request);
      expect(mockOrchestrator.startProject).toHaveBeenCalled();
    });

    it('should detect "build it" as build confirmation', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'build it now',
          history: []
        })
      });

      await POST(request);
      expect(mockOrchestrator.startProject).toHaveBeenCalled();
    });

    it('should detect "start" as build confirmation', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'start building',
          history: []
        })
      });

      await POST(request);
      expect(mockOrchestrator.startProject).toHaveBeenCalled();
    });

    it('should NOT build if confidence is low even with confirmation keywords', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: undefined,
        features: [],
        clarificationNeeded: ['What do you want to build?'],
        confidence: 'low'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes build it',
          history: []
        })
      });

      await POST(request);
      expect(mockOrchestrator.startProject).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle requirements extraction errors gracefully', async () => {
      mockRequirementsExtractor.extractFromConversation.mockRejectedValue(
        new Error('Failed to parse requirements')
      );

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Build an API',
          history: []
        })
      });

      const response = await POST(request);

      // Should still return a response, not fail completely
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('response');
    });

    it('should handle orchestrator startup errors gracefully', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      mockOrchestrator.startProject.mockRejectedValue(
        new Error('Orchestrator service unavailable')
      );

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('buildStarted', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to start build');
    });
  });

  describe('Response Format', () => {
    it('should return correct format for low confidence (no build)', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        features: ['rest'],
        clarificationNeeded: ['What language?'],
        confidence: 'low'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I need an API',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toMatchObject({
        response: expect.any(String),
        cost: expect.any(Number),
        provider: expect.any(String),
        requirementsExtracted: expect.objectContaining({
          confidence: 'low',
          clarificationNeeded: expect.any(Array)
        })
      });
      expect(data).not.toHaveProperty('buildStarted');
    });

    it('should return correct format for high confidence (build started)', async () => {
      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        framework: 'fastapi',
        features: ['rest', 'auth'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes',
          history: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toMatchObject({
        response: expect.any(String),
        cost: expect.any(Number),
        provider: expect.any(String),
        buildStarted: true,
        projectId: expect.any(String),
        buildStatus: expect.objectContaining({
          status: expect.any(String),
          currentPhase: expect.any(String)
        }),
        requirementsExtracted: expect.objectContaining({
          confidence: 'high'
        })
      });
    });
  });

  describe('Security: Input Sanitization', () => {
    it('should sanitize shell metacharacters from user input', async () => {
      const history = [
        { id: '1', role: 'user' as const, content: 'Build API with `rm -rf /` in description' }
      ];

      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        framework: 'fastapi',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes start',
          history
        })
      });

      await POST(request);

      // Verify orchestrator was called with sanitized input (no backticks)
      const callArgs = mockOrchestrator.startProject.mock.calls[0][0];
      expect(callArgs.userRequest).not.toContain('`');
      expect(callArgs.userRequest).toContain('rm -rf /'); // Content preserved, just metacharacters removed
    });

    it('should remove shell metacharacters: backticks, dollar signs, braces', async () => {
      const history = [
        { id: '1', role: 'user' as const, content: 'Build ${MALICIOUS} API with `echo "test"` and {braces}' }
      ];

      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'build it',
          history
        })
      });

      await POST(request);

      const callArgs = mockOrchestrator.startProject.mock.calls[0][0];
      expect(callArgs.userRequest).not.toContain('`');
      expect(callArgs.userRequest).not.toContain('$');
      expect(callArgs.userRequest).not.toContain('{');
      expect(callArgs.userRequest).not.toContain('}');
    });

    it('should preserve safe characters: letters, numbers, spaces, newlines, tabs', async () => {
      const history = [
        { id: '1', role: 'user' as const, content: 'Build API\nwith\ttabs and newlines\r\nTest 123!' }
      ];

      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes',
          history
        })
      });

      await POST(request);

      const callArgs = mockOrchestrator.startProject.mock.calls[0][0];
      expect(callArgs.userRequest).toContain('Build API');
      expect(callArgs.userRequest).toContain('Test 123!');
    });

    it('should truncate extremely long input to prevent DoS', async () => {
      const longContent = 'A'.repeat(10000); // 10k characters
      const history = [
        { id: '1', role: 'user' as const, content: longContent }
      ];

      mockRequirementsExtractor.extractFromConversation.mockResolvedValue({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        confidence: 'high'
      });

      const request = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes',
          history
        })
      });

      await POST(request);

      const callArgs = mockOrchestrator.startProject.mock.calls[0][0];
      // Should be truncated to 5000 chars max (plus other request parts)
      expect(callArgs.userRequest.length).toBeLessThan(longContent.length);
    });
  });

  describe('Full E2E Flow', () => {
    it('should complete full flow: low confidence → questions → high confidence → build', async () => {
      // Step 1: Initial vague request (low confidence)
      mockRequirementsExtractor.extractFromConversation.mockResolvedValueOnce({
        projectType: undefined,
        features: [],
        clarificationNeeded: ['What type of application?'],
        confidence: 'low'
      });

      const request1 = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I want to build something',
          history: []
        })
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();

      expect(data1.requirementsExtracted.confidence).toBe('low');
      expect(mockOrchestrator.startProject).not.toHaveBeenCalled();

      // Step 2: User provides more details (medium confidence)
      mockRequirementsExtractor.extractFromConversation.mockResolvedValueOnce({
        projectType: 'api',
        language: 'python',
        features: ['rest'],
        clarificationNeeded: ['What features do you need?'],
        confidence: 'medium'
      });

      const request2 = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'A Python REST API',
          history: [
            { id: '1', role: 'user' as const, content: 'I want to build something' }
          ]
        })
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(data2.requirementsExtracted.confidence).toBe('medium');
      expect(mockOrchestrator.startProject).not.toHaveBeenCalled();

      // Step 3: User provides all details (high confidence) and confirms
      mockRequirementsExtractor.extractFromConversation.mockResolvedValueOnce({
        projectType: 'api',
        language: 'python',
        framework: 'fastapi',
        features: ['rest', 'auth', 'database'],
        confidence: 'high'
      });

      const request3 = new NextRequest('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'yes build it',
          history: [
            { id: '1', role: 'user' as const, content: 'I want to build something' },
            { id: '2', role: 'user' as const, content: 'A Python REST API' },
            { id: '3', role: 'user' as const, content: 'With auth and database' }
          ]
        })
      });

      const response3 = await POST(request3);
      const data3 = await response3.json();

      expect(data3.requirementsExtracted.confidence).toBe('high');
      expect(data3.buildStarted).toBe(true);
      expect(mockOrchestrator.startProject).toHaveBeenCalled();
    });
  });
});
