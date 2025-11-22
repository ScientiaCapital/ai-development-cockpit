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

  constructor(config: CostOptimizerConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 120000; // 2 minutes default
    this.maxRetries = 3;
    this.circuitState = CircuitState.CLOSED;
    this.failures = 0;
    this.failureThreshold = 5;
  }

  async complete(
    prompt: string,
    options: CompletionRequest = {}
  ): Promise<CompletionResponse> {
    if (this.circuitState === CircuitState.OPEN) {
      throw new Error('Circuit breaker is open - service unavailable');
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
    throw new Error('Max retries exceeded');
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
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.circuitState = CircuitState.OPEN;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
