import { AgentOrchestrator } from '../AgentOrchestrator';
import { CostOptimizerClient } from '../../services/CostOptimizerClient';

jest.mock('../../services/CostOptimizerClient');

describe('AgentOrchestrator with CostOptimizerClient', () => {
  let orchestrator: AgentOrchestrator;
  let mockCostOptimizer: jest.Mocked<CostOptimizerClient>;

  beforeEach(() => {
    // Create a properly mocked CostOptimizerClient
    mockCostOptimizer = {
      complete: jest.fn().mockResolvedValue({
        response: JSON.stringify({
          summary: 'Generated architecture analysis',
          architecture: { hasAgents: true },
          existingAgents: ['CodeArchitect'],
          patterns: {
            hasAgents: true,
            hasComponents: true,
            hasServices: true,
            hasTests: true
          }
        }),
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 500,
        tokens_out: 200,
        cost: 0.0001
      })
    } as any;

    // Test that orchestrator accepts costOptimizerClient in constructor
    orchestrator = new AgentOrchestrator({
      costOptimizerClient: mockCostOptimizer
    });
  });

  it('should accept CostOptimizerClient in constructor', () => {
    expect(orchestrator).toBeDefined();
  });

  it('should use cost optimizer for codebase review AI calls', async () => {
    const projectPath = '/test/project';

    // Mock filesystem calls
    const fs = require('fs').promises;
    jest.spyOn(fs, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'readdir').mockResolvedValue(['src', 'package.json']);

    await orchestrator.reviewCodebase(projectPath);

    expect(mockCostOptimizer.complete).toHaveBeenCalledWith(
      expect.stringContaining('Review this codebase'),
      expect.objectContaining({
        task_type: 'code-generation'
      })
    );
  });

  it('should track costs and request counts per build session', async () => {
    const projectPath = '/test/project';

    // Mock filesystem
    const fs = require('fs').promises;
    jest.spyOn(fs, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'readdir').mockResolvedValue(['src']);

    // Perform multiple operations
    await orchestrator.reviewCodebase(projectPath);

    const stats = orchestrator.getBuildStats();
    expect(stats.totalCost).toBeGreaterThan(0);
    expect(stats.requestCount).toBe(1);
    expect(stats.totalCost).toBe(0.0001);
  });

  it('should accumulate costs across multiple AI calls', async () => {
    const projectPath = '/test/project';

    // Mock filesystem
    const fs = require('fs').promises;
    jest.spyOn(fs, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'readdir').mockResolvedValue(['src']);

    // Mock different costs for different calls
    mockCostOptimizer.complete
      .mockResolvedValueOnce({
        response: 'First call',
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens_in: 100,
        tokens_out: 50,
        cost: 0.0001
      })
      .mockResolvedValueOnce({
        response: 'Second call',
        provider: 'claude',
        model: 'claude-sonnet-4.5',
        tokens_in: 200,
        tokens_out: 100,
        cost: 0.0005
      });

    // Make two calls
    await orchestrator.reviewCodebase(projectPath);
    await orchestrator.reviewCodebase(projectPath);

    const stats = orchestrator.getBuildStats();
    expect(stats.requestCount).toBe(2);
    expect(stats.totalCost).toBeCloseTo(0.0006, 4); // 0.0001 + 0.0005 (4 decimal places)
  });

  it('should use existing ModelRouter behavior when CostOptimizerClient not provided', () => {
    // Test backward compatibility
    const orchestratorWithoutCostOptimizer = new AgentOrchestrator();
    expect(orchestratorWithoutCostOptimizer).toBeDefined();
  });

  it('should reset build stats between sessions', async () => {
    const projectPath = '/test/project';

    // Mock filesystem
    const fs = require('fs').promises;
    jest.spyOn(fs, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'readdir').mockResolvedValue(['src']);

    // First session
    await orchestrator.reviewCodebase(projectPath);
    let stats = orchestrator.getBuildStats();
    expect(stats.totalCost).toBe(0.0001);

    // Reset stats
    orchestrator.resetBuildStats();

    // Check stats after reset
    stats = orchestrator.getBuildStats();
    expect(stats.totalCost).toBe(0);
    expect(stats.requestCount).toBe(0);
  });
});
