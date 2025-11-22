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

export class CostOptimizerClient {
  private baseURL: string;
  private timeout: number;

  constructor(config: CostOptimizerConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 120000; // 2 minutes default
  }

  async complete(
    prompt: string,
    options: CompletionRequest = {}
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
}
