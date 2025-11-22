export interface CostOptimizerConfig {
  baseURL: string;
  timeout?: number;
}

export interface CompletionRequest {
  max_tokens?: number;
  task_type?: 'conversation' | 'code-generation' | 'code-review';
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface CompletionResponse {
  response: string;
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost: number;
}

enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export class CostOptimizerClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private circuitState: CircuitState;
  private failures: number;
  private failureThreshold: number;
  private resetTimeout: number;
  private openedAt?: number;

  constructor(config: CostOptimizerConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 120000; // 2 minutes default
    this.maxRetries = 3;
    this.circuitState = CircuitState.CLOSED;
    this.failures = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 60000; // 60 seconds
  }

  async complete(
    prompt: string,
    options: CompletionRequest = {}
  ): Promise<CompletionResponse> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.circuitState === CircuitState.OPEN) {
      const now = Date.now();
      if (this.openedAt && now - this.openedAt >= this.resetTimeout) {
        this.circuitState = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    // In HALF_OPEN state, allow one test request
    if (this.circuitState === CircuitState.HALF_OPEN) {
      try {
        const result = await this.makeRequest(prompt, options);
        // Success in HALF_OPEN → transition to CLOSED
        this.onSuccess();
        return result;
      } catch (error) {
        // Failure in HALF_OPEN → re-open circuit
        this.circuitState = CircuitState.OPEN;
        this.openedAt = Date.now();
        throw error;
      }
    }

    return this.callWithRetry(() => this.makeRequest(prompt, options));
  }

  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        if (i === this.maxRetries - 1) {
          throw error;
        }
        await this.sleep(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
    // Unreachable - TypeScript requires a return/throw after loop
    throw new Error('Unexpected: exceeded max retries');
  }

  private async makeRequest(
    prompt: string,
    options: CompletionRequest
  ): Promise<CompletionResponse> {
    const response = await fetch(`${this.baseURL}/v1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: options.max_tokens || 2000,
        task_type: options.task_type || 'code-generation',
        complexity: options.complexity || 'medium',
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Cost optimizer returned ${response.status}`);
    }

    return response.json();
  }

  private onSuccess() {
    this.failures = 0;
    this.circuitState = CircuitState.CLOSED;
    this.openedAt = undefined;
  }

  private onFailure() {
    // Atomic increment to prevent race conditions
    const currentFailures = ++this.failures;
    if (currentFailures >= this.failureThreshold) {
      this.circuitState = CircuitState.OPEN;
      this.openedAt = Date.now();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
