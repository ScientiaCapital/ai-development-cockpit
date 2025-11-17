/**
 * Agent Orchestrator Tests
 * Testing codebase review capability (Task 5)
 */

import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator'
import { EventBus, AgentEvent } from '@/orchestrator/EventBus'
import { CostOptimizerClient } from '@/services/cost-optimizer/CostOptimizerClient'
import path from 'path'
import { promises as fs } from 'fs'
import os from 'os'

// Mock the CostOptimizerClient
jest.mock('@/services/cost-optimizer/CostOptimizerClient')

const mockOptimizeCompletion = jest.fn()

describe('AgentOrchestrator - Codebase Review', () => {
  let orchestrator: AgentOrchestrator
  let eventBus: EventBus
  let testDir: string

  beforeEach(async () => {
    // Setup mock for CostOptimizerClient
    mockOptimizeCompletion.mockResolvedValue({
      content: 'This is a well-structured codebase with good separation of concerns. The existing BackendDeveloper agent provides solid API development capabilities. Recommendations: 1. Add frontend developer agent 2. Implement testing framework 3. Add deployment automation',
      provider: 'mock-provider',
      model: 'mock-model',
      cost: 0.001,
      tokens: { input: 100, output: 50 },
      duration: 100
    })

    ;(CostOptimizerClient as jest.MockedClass<typeof CostOptimizerClient>).mockImplementation(() => ({
      optimizeCompletion: mockOptimizeCompletion,
      getRecommendation: jest.fn(),
      getUsageStats: jest.fn(),
      getStats: jest.fn(),
      resetStats: jest.fn(),
      healthCheck: jest.fn()
    } as any))

    orchestrator = new AgentOrchestrator()
    eventBus = EventBus.getInstance()

    // Create test directory structure
    testDir = path.join(os.tmpdir(), `test-project-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
    await fs.mkdir(path.join(testDir, 'src/agents'), { recursive: true })
    await fs.mkdir(path.join(testDir, 'src/components'), { recursive: true })

    // Create some test agent files
    await fs.writeFile(
      path.join(testDir, 'src/agents/BackendDeveloper.ts'),
      'export class BackendDeveloper {}'
    )
    await fs.writeFile(
      path.join(testDir, 'src/agents/BaseAgent.ts'),
      'export abstract class BaseAgent {}'
    )

    // Create some component files
    await fs.writeFile(
      path.join(testDir, 'src/components/Button.tsx'),
      'export const Button = () => <button />'
    )
  })

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }

    // Remove all event listeners
    eventBus.removeAllListeners()

    // Clear mock calls
    jest.clearAllMocks()
  })

  describe('reviewCodebase()', () => {
    it('should emit ReviewStarted event', async () => {
      const reviewStartedSpy = jest.fn()
      eventBus.on(AgentEvent.ReviewStarted, reviewStartedSpy)

      await orchestrator.reviewCodebase(testDir)

      expect(reviewStartedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: expect.any(String),
          repoPath: testDir
        })
      )
    })

    it('should emit ReviewComplete event with review data', async () => {
      const reviewCompleteSpy = jest.fn()
      eventBus.on(AgentEvent.ReviewComplete, reviewCompleteSpy)

      await orchestrator.reviewCodebase(testDir)

      expect(reviewCompleteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: expect.any(String),
          review: expect.objectContaining({
            summary: expect.any(String),
            existingAgents: expect.any(Array),
            architecture: expect.any(Object),
            patterns: expect.any(Object)
          })
        })
      )
    })

    it('should identify existing agents (excluding BaseAgent)', async () => {
      const reviewCompleteSpy = jest.fn()
      eventBus.on(AgentEvent.ReviewComplete, reviewCompleteSpy)

      await orchestrator.reviewCodebase(testDir)

      const eventData = reviewCompleteSpy.mock.calls[0][0]
      const review = eventData.review

      expect(review.existingAgents).toContain('BackendDeveloper')
      expect(review.existingAgents).not.toContain('BaseAgent')
      expect(review.existingAgents.length).toBe(1)
    })

    it('should return CodebaseReview object', async () => {
      const review = await orchestrator.reviewCodebase(testDir)

      expect(review).toHaveProperty('summary')
      expect(review).toHaveProperty('architecture')
      expect(review).toHaveProperty('existingAgents')
      expect(review).toHaveProperty('patterns')
      expect(typeof review.summary).toBe('string')
      expect(Array.isArray(review.existingAgents)).toBe(true)
    })

    it('should scan directory structure', async () => {
      const review = await orchestrator.reviewCodebase(testDir)

      // Should have analyzed the structure
      expect(review.architecture).toBeDefined()
      expect(review.summary.length).toBeGreaterThan(0)
    })

    it('should handle missing agents directory gracefully', async () => {
      // Create a directory without agents folder
      const emptyDir = path.join(os.tmpdir(), `test-empty-${Date.now()}`)
      await fs.mkdir(emptyDir, { recursive: true })

      try {
        const review = await orchestrator.reviewCodebase(emptyDir)

        expect(review.existingAgents).toEqual([])
        expect(review).toHaveProperty('summary')
      } finally {
        await fs.rm(emptyDir, { recursive: true, force: true })
      }
    })

    it('should emit Error event on failure', async () => {
      const errorSpy = jest.fn()
      eventBus.on(AgentEvent.Error, errorSpy)

      // Try to review a non-existent directory
      const nonExistentDir = '/path/that/does/not/exist'

      await expect(orchestrator.reviewCodebase(nonExistentDir)).rejects.toThrow()

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: expect.any(String),
          error: expect.any(String)
        })
      )
    })

    it('should generate unique projectId for each review', async () => {
      const reviewStartedSpy = jest.fn()
      eventBus.on(AgentEvent.ReviewStarted, reviewStartedSpy)

      await orchestrator.reviewCodebase(testDir)
      await orchestrator.reviewCodebase(testDir)

      expect(reviewStartedSpy).toHaveBeenCalledTimes(2)

      const projectId1 = reviewStartedSpy.mock.calls[0][0].projectId
      const projectId2 = reviewStartedSpy.mock.calls[1][0].projectId

      expect(projectId1).not.toBe(projectId2)
    })
  })
})
