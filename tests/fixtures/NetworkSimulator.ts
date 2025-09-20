/**
 * Network Simulator - Simulates various network conditions for testing
 * Provides realistic network scenarios for deployment testing across different conditions
 */

export interface NetworkCondition {
  name: string;
  description: string;
  latency: {
    min: number; // milliseconds
    max: number; // milliseconds
    jitter: number; // variation in latency
  };
  bandwidth: {
    download: number; // Mbps
    upload: number; // Mbps
  };
  packetLoss: number; // percentage (0-100)
  reliability: number; // percentage (0-100)
  scenarios: NetworkScenario[];
}

export interface NetworkScenario {
  type: 'stable' | 'degraded' | 'intermittent' | 'congested' | 'offline';
  duration: number; // milliseconds
  probability: number; // 0-1, likelihood of this scenario occurring
  impact: {
    latencyMultiplier: number; // 1.0 = no change, 2.0 = double latency
    bandwidthMultiplier: number; // 1.0 = no change, 0.5 = half bandwidth
    packetLossIncrease: number; // additional packet loss percentage
  };
}

export interface NetworkMetrics {
  timestamp: number;
  latency: number;
  bandwidth: number;
  packetLoss: number;
  connectionStatus: 'connected' | 'degraded' | 'disconnected';
  throughput: number; // actual data transfer rate
  errorRate: number; // percentage of failed requests
}

/**
 * Predefined network conditions for testing different scenarios
 */
export const networkConditions: Record<string, NetworkCondition> = {
  // Ideal conditions
  enterprise_fiber: {
    name: 'Enterprise Fiber',
    description: 'High-speed enterprise fiber connection',
    latency: { min: 1, max: 5, jitter: 1 },
    bandwidth: { download: 1000, upload: 1000 },
    packetLoss: 0.01,
    reliability: 99.9,
    scenarios: [
      {
        type: 'stable',
        duration: 300000, // 5 minutes
        probability: 0.95,
        impact: { latencyMultiplier: 1.0, bandwidthMultiplier: 1.0, packetLossIncrease: 0 }
      },
      {
        type: 'congested',
        duration: 30000, // 30 seconds
        probability: 0.05,
        impact: { latencyMultiplier: 1.5, bandwidthMultiplier: 0.8, packetLossIncrease: 0.1 }
      }
    ]
  },

  // Standard business connection
  business_broadband: {
    name: 'Business Broadband',
    description: 'Standard business broadband connection',
    latency: { min: 10, max: 30, jitter: 5 },
    bandwidth: { download: 100, upload: 50 },
    packetLoss: 0.1,
    reliability: 99.5,
    scenarios: [
      {
        type: 'stable',
        duration: 240000, // 4 minutes
        probability: 0.8,
        impact: { latencyMultiplier: 1.0, bandwidthMultiplier: 1.0, packetLossIncrease: 0 }
      },
      {
        type: 'congested',
        duration: 60000, // 1 minute
        probability: 0.15,
        impact: { latencyMultiplier: 2.0, bandwidthMultiplier: 0.6, packetLossIncrease: 0.5 }
      },
      {
        type: 'degraded',
        duration: 30000, // 30 seconds
        probability: 0.05,
        impact: { latencyMultiplier: 3.0, bandwidthMultiplier: 0.3, packetLossIncrease: 1.0 }
      }
    ]
  },

  // Mobile/Edge conditions
  mobile_4g: {
    name: 'Mobile 4G',
    description: '4G mobile connection with typical variations',
    latency: { min: 20, max: 80, jitter: 15 },
    bandwidth: { download: 50, upload: 20 },
    packetLoss: 0.5,
    reliability: 95.0,
    scenarios: [
      {
        type: 'stable',
        duration: 120000, // 2 minutes
        probability: 0.6,
        impact: { latencyMultiplier: 1.0, bandwidthMultiplier: 1.0, packetLossIncrease: 0 }
      },
      {
        type: 'intermittent',
        duration: 45000, // 45 seconds
        probability: 0.3,
        impact: { latencyMultiplier: 2.5, bandwidthMultiplier: 0.4, packetLossIncrease: 2.0 }
      },
      {
        type: 'degraded',
        duration: 15000, // 15 seconds
        probability: 0.1,
        impact: { latencyMultiplier: 5.0, bandwidthMultiplier: 0.1, packetLossIncrease: 5.0 }
      }
    ]
  },

  // Poor conditions for stress testing
  satellite_connection: {
    name: 'Satellite Connection',
    description: 'High-latency satellite connection',
    latency: { min: 500, max: 800, jitter: 100 },
    bandwidth: { download: 25, upload: 3 },
    packetLoss: 1.0,
    reliability: 90.0,
    scenarios: [
      {
        type: 'stable',
        duration: 180000, // 3 minutes
        probability: 0.7,
        impact: { latencyMultiplier: 1.0, bandwidthMultiplier: 1.0, packetLossIncrease: 0 }
      },
      {
        type: 'degraded',
        duration: 60000, // 1 minute
        probability: 0.2,
        impact: { latencyMultiplier: 1.5, bandwidthMultiplier: 0.5, packetLossIncrease: 3.0 }
      },
      {
        type: 'offline',
        duration: 5000, // 5 seconds
        probability: 0.1,
        impact: { latencyMultiplier: 10.0, bandwidthMultiplier: 0.0, packetLossIncrease: 100.0 }
      }
    ]
  },

  // Chaos testing - extremely poor conditions
  chaos_network: {
    name: 'Chaos Network',
    description: 'Extremely poor network conditions for chaos testing',
    latency: { min: 100, max: 5000, jitter: 1000 },
    bandwidth: { download: 1, upload: 0.5 },
    packetLoss: 10.0,
    reliability: 50.0,
    scenarios: [
      {
        type: 'intermittent',
        duration: 30000, // 30 seconds
        probability: 0.4,
        impact: { latencyMultiplier: 3.0, bandwidthMultiplier: 0.2, packetLossIncrease: 15.0 }
      },
      {
        type: 'degraded',
        duration: 20000, // 20 seconds
        probability: 0.3,
        impact: { latencyMultiplier: 5.0, bandwidthMultiplier: 0.1, packetLossIncrease: 25.0 }
      },
      {
        type: 'offline',
        duration: 10000, // 10 seconds
        probability: 0.2,
        impact: { latencyMultiplier: 10.0, bandwidthMultiplier: 0.0, packetLossIncrease: 100.0 }
      },
      {
        type: 'stable',
        duration: 15000, // 15 seconds
        probability: 0.1,
        impact: { latencyMultiplier: 1.0, bandwidthMultiplier: 1.0, packetLossIncrease: 0 }
      }
    ]
  }
};

/**
 * Network simulator for testing deployment behavior under various network conditions
 */
export class NetworkSimulator {
  private currentCondition: NetworkCondition;
  private currentScenario: NetworkScenario | null = null;
  private scenarioStartTime: number = 0;
  private metricsHistory: NetworkMetrics[] = [];
  private isSimulating: boolean = false;
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(initialCondition: string = 'business_broadband') {
    this.currentCondition = networkConditions[initialCondition];
    if (!this.currentCondition) {
      throw new Error(`Unknown network condition: ${initialCondition}`);
    }
  }

  /**
   * Start network simulation
   */
  startSimulation(): void {
    if (this.isSimulating) return;

    this.isSimulating = true;
    this.scenarioStartTime = Date.now();
    this.selectInitialScenario();

    // Update metrics every second
    this.simulationInterval = setInterval(() => {
      this.updateMetrics();
      this.checkScenarioTransition();
    }, 1000);
  }

  /**
   * Stop network simulation
   */
  stopSimulation(): void {
    if (!this.isSimulating) return;

    this.isSimulating = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Change network condition
   */
  setNetworkCondition(conditionName: string): void {
    const condition = networkConditions[conditionName];
    if (!condition) {
      throw new Error(`Unknown network condition: ${conditionName}`);
    }

    this.currentCondition = condition;
    this.scenarioStartTime = Date.now();
    this.selectInitialScenario();
  }

  /**
   * Force a specific network scenario
   */
  forceScenario(scenarioType: NetworkScenario['type'], duration?: number): void {
    const scenario = this.currentCondition.scenarios.find(s => s.type === scenarioType);
    if (!scenario) {
      throw new Error(`Scenario type ${scenarioType} not available for current condition`);
    }

    this.currentScenario = {
      ...scenario,
      duration: duration || scenario.duration
    };
    this.scenarioStartTime = Date.now();
  }

  /**
   * Get current network metrics
   */
  getCurrentMetrics(): NetworkMetrics {
    if (!this.currentScenario) {
      return this.generateBaselineMetrics();
    }

    return this.generateMetricsWithScenario(this.currentScenario);
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(since?: number): NetworkMetrics[] {
    if (since) {
      return this.metricsHistory.filter(m => m.timestamp >= since);
    }
    return [...this.metricsHistory];
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metricsHistory = [];
  }

  /**
   * Get available network conditions
   */
  getAvailableConditions(): string[] {
    return Object.keys(networkConditions);
  }

  /**
   * Get current condition info
   */
  getCurrentCondition(): NetworkCondition {
    return this.currentCondition;
  }

  /**
   * Get current scenario info
   */
  getCurrentScenario(): NetworkScenario | null {
    return this.currentScenario;
  }

  /**
   * Simulate network delay for a request
   */
  async simulateRequest(dataSize: number = 1024): Promise<{ success: boolean; latency: number; throughput: number }> {
    const metrics = this.getCurrentMetrics();

    // Calculate latency with jitter
    const baseLatency = metrics.latency;
    const jitter = (Math.random() - 0.5) * this.currentCondition.latency.jitter;
    const totalLatency = Math.max(0, baseLatency + jitter);

    // Simulate the delay
    await new Promise(resolve => setTimeout(resolve, totalLatency));

    // Determine if request succeeds based on packet loss and error rate
    const success = Math.random() > (metrics.packetLoss / 100) && Math.random() > (metrics.errorRate / 100);

    // Calculate throughput based on bandwidth and data size
    const throughput = success ? this.calculateThroughput(dataSize, metrics.bandwidth) : 0;

    return {
      success,
      latency: totalLatency,
      throughput
    };
  }

  /**
   * Batch simulate multiple requests
   */
  async simulateRequestBatch(
    requestCount: number,
    dataSize: number = 1024,
    concurrency: number = 5
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    averageThroughput: number;
    results: Array<{ success: boolean; latency: number; throughput: number }>;
  }> {
    const results: Array<{ success: boolean; latency: number; throughput: number }> = [];

    // Process requests in batches to respect concurrency limit
    for (let i = 0; i < requestCount; i += concurrency) {
      const batchSize = Math.min(concurrency, requestCount - i);
      const batchPromises = Array.from({ length: batchSize }, () =>
        this.simulateRequest(dataSize)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.length - successfulRequests;
    const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    const averageThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;

    return {
      totalRequests: requestCount,
      successfulRequests,
      failedRequests,
      averageLatency,
      averageThroughput,
      results
    };
  }

  private selectInitialScenario(): void {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const scenario of this.currentCondition.scenarios) {
      cumulativeProbability += scenario.probability;
      if (random <= cumulativeProbability) {
        this.currentScenario = scenario;
        break;
      }
    }

    if (!this.currentScenario) {
      this.currentScenario = this.currentCondition.scenarios[0];
    }
  }

  private updateMetrics(): void {
    const metrics = this.getCurrentMetrics();
    this.metricsHistory.push(metrics);

    // Keep only last 300 entries (5 minutes at 1-second intervals)
    if (this.metricsHistory.length > 300) {
      this.metricsHistory = this.metricsHistory.slice(-300);
    }
  }

  private checkScenarioTransition(): void {
    if (!this.currentScenario) return;

    const scenarioElapsed = Date.now() - this.scenarioStartTime;
    if (scenarioElapsed >= this.currentScenario.duration) {
      // Transition to new scenario
      this.selectInitialScenario();
      this.scenarioStartTime = Date.now();
    }
  }

  private generateBaselineMetrics(): NetworkMetrics {
    const latency = this.currentCondition.latency.min +
                   Math.random() * (this.currentCondition.latency.max - this.currentCondition.latency.min);

    return {
      timestamp: Date.now(),
      latency,
      bandwidth: this.currentCondition.bandwidth.download,
      packetLoss: this.currentCondition.packetLoss,
      connectionStatus: 'connected',
      throughput: this.currentCondition.bandwidth.download,
      errorRate: (100 - this.currentCondition.reliability) / 100
    };
  }

  private generateMetricsWithScenario(scenario: NetworkScenario): NetworkMetrics {
    const baseMetrics = this.generateBaselineMetrics();

    // Apply scenario impacts
    const adjustedLatency = baseMetrics.latency * scenario.impact.latencyMultiplier;
    const adjustedBandwidth = baseMetrics.bandwidth * scenario.impact.bandwidthMultiplier;
    const adjustedPacketLoss = baseMetrics.packetLoss + scenario.impact.packetLossIncrease;

    // Determine connection status
    let connectionStatus: NetworkMetrics['connectionStatus'] = 'connected';
    if (scenario.type === 'offline' || adjustedPacketLoss > 50) {
      connectionStatus = 'disconnected';
    } else if (scenario.type === 'degraded' || scenario.type === 'intermittent' || adjustedPacketLoss > 5) {
      connectionStatus = 'degraded';
    }

    return {
      timestamp: Date.now(),
      latency: adjustedLatency,
      bandwidth: adjustedBandwidth,
      packetLoss: Math.min(100, adjustedPacketLoss),
      connectionStatus,
      throughput: connectionStatus === 'disconnected' ? 0 : adjustedBandwidth * 0.8, // 80% efficiency
      errorRate: Math.min(1, adjustedPacketLoss / 100 + (100 - this.currentCondition.reliability) / 100)
    };
  }

  private calculateThroughput(dataSize: number, bandwidth: number): number {
    // Convert bandwidth from Mbps to bytes per second
    const bandwidthBytesPerSecond = (bandwidth * 1024 * 1024) / 8;

    // Calculate theoretical transfer time
    const transferTime = dataSize / bandwidthBytesPerSecond;

    // Apply efficiency factor (usually 70-90% of theoretical)
    const efficiency = 0.75 + Math.random() * 0.15; // 75-90%

    return (dataSize / transferTime) * efficiency;
  }

  /**
   * Export simulation data for analysis
   */
  exportSimulationData(): {
    condition: NetworkCondition;
    currentScenario: NetworkScenario | null;
    metrics: NetworkMetrics[];
    summary: {
      totalSamples: number;
      averageLatency: number;
      averageBandwidth: number;
      averagePacketLoss: number;
      connectionUptime: number; // percentage
    };
  } {
    const summary = this.calculateSummaryStats();

    return {
      condition: this.currentCondition,
      currentScenario: this.currentScenario,
      metrics: this.metricsHistory,
      summary
    };
  }

  private calculateSummaryStats() {
    if (this.metricsHistory.length === 0) {
      return {
        totalSamples: 0,
        averageLatency: 0,
        averageBandwidth: 0,
        averagePacketLoss: 0,
        connectionUptime: 0
      };
    }

    const totalSamples = this.metricsHistory.length;
    const averageLatency = this.metricsHistory.reduce((sum, m) => sum + m.latency, 0) / totalSamples;
    const averageBandwidth = this.metricsHistory.reduce((sum, m) => sum + m.bandwidth, 0) / totalSamples;
    const averagePacketLoss = this.metricsHistory.reduce((sum, m) => sum + m.packetLoss, 0) / totalSamples;
    const connectedSamples = this.metricsHistory.filter(m => m.connectionStatus === 'connected').length;
    const connectionUptime = (connectedSamples / totalSamples) * 100;

    return {
      totalSamples,
      averageLatency,
      averageBandwidth,
      averagePacketLoss,
      connectionUptime
    };
  }
}

/**
 * Helper function to create network simulator for specific deployment scenarios
 */
export function createNetworkSimulatorForScenario(
  organization: 'swaggystacks' | 'scientia',
  environment: 'development' | 'staging' | 'production'
): NetworkSimulator {
  let conditionName: string;

  if (environment === 'production') {
    conditionName = organization === 'scientia' ? 'enterprise_fiber' : 'business_broadband';
  } else if (environment === 'staging') {
    conditionName = 'business_broadband';
  } else {
    conditionName = 'mobile_4g'; // Developers often work on mobile/variable connections
  }

  return new NetworkSimulator(conditionName);
}

/**
 * Helper function to run network stress test
 */
export async function runNetworkStressTest(
  simulator: NetworkSimulator,
  duration: number = 60000 // 1 minute
): Promise<{
  success: boolean;
  metrics: NetworkMetrics[];
  summary: {
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    maxLatency: number;
    throughputMbps: number;
  };
}> {
  const startTime = Date.now();
  const requestInterval = 1000; // 1 request per second
  const results: Array<{ success: boolean; latency: number; throughput: number }> = [];

  simulator.startSimulation();

  try {
    while (Date.now() - startTime < duration) {
      const result = await simulator.simulateRequest(1024); // 1KB requests
      results.push(result);

      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, requestInterval));
    }
  } finally {
    simulator.stopSimulation();
  }

  const metrics = simulator.getMetricsHistory(startTime);
  const successfulRequests = results.filter(r => r.success).length;
  const successRate = successfulRequests / results.length;
  const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const maxLatency = Math.max(...results.map(r => r.latency));
  const averageThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;
  const throughputMbps = (averageThroughput * 8) / (1024 * 1024); // Convert to Mbps

  return {
    success: successRate >= 0.95, // 95% success rate threshold
    metrics,
    summary: {
      totalRequests: results.length,
      successRate,
      averageLatency,
      maxLatency,
      throughputMbps
    }
  };
}