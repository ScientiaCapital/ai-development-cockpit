import { CostOptimizerClient } from './CostOptimizerClient';

/**
 * Represents a message in a conversation
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

/**
 * Structured requirements extracted from natural language conversation
 */
export interface ExtractedRequirements {
  projectType?: 'web_app' | 'api' | 'mobile_app' | 'cli_tool' | 'library';
  language?: 'python' | 'javascript' | 'typescript' | 'go' | 'rust';
  framework?: string; // e.g., 'fastapi', 'nextjs', 'react', 'gin'
  features: string[]; // e.g., ['auth', 'database', 'api', 'ui']
  constraints?: string[]; // e.g., ['must scale to 10k users', 'budget $100/month']
  clarificationNeeded: string[]; // Questions to ask user
  confidence: 'high' | 'medium' | 'low'; // How confident in the extraction
}

/**
 * Service that transforms conversational user input into structured technical requirements.
 *
 * Designed for "coding noobs" who describe what they want in plain English.
 * Extracts project type, language preference, features, and constraints from natural language.
 * Identifies missing information and asks clarifying questions.
 *
 * Example:
 * Input: "I want to build a website to sell my art"
 * Output: {
 *   projectType: 'web_app',
 *   features: ['ecommerce', 'portfolio'],
 *   clarificationNeeded: ['Do you want users to create accounts?'],
 *   confidence: 'medium'
 * }
 */
export class RequirementsExtractor {
  private costOptimizer: CostOptimizerClient;

  constructor(costOptimizer?: CostOptimizerClient) {
    this.costOptimizer = costOptimizer || new CostOptimizerClient({
      baseURL: process.env.COST_OPTIMIZER_URL || 'http://localhost:8000'
    });
  }

  /**
   * Extracts structured technical requirements from a conversation history.
   *
   * @param conversation - Array of conversation messages between user and assistant
   * @returns Structured requirements including project type, features, and clarification questions
   * @throws Error if the AI response cannot be parsed or network issues occur
   */
  async extractFromConversation(conversation: ConversationMessage[]): Promise<ExtractedRequirements> {
    const prompt = this.buildPrompt(conversation);

    try {
      const response = await this.costOptimizer.complete(prompt, {
        task_type: 'conversation',
        complexity: 'medium',
        max_tokens: 1000
      });

      return this.validateAndParseResponse(response.response);
    } catch (error) {
      // Re-throw network errors or parsing errors
      throw error;
    }
  }

  /**
   * Builds a structured prompt for the AI to extract requirements.
   *
   * @private
   * @param conversation - Array of conversation messages
   * @returns Formatted prompt string for the AI
   */
  private buildPrompt(conversation: ConversationMessage[]): string {
    // Build conversation context
    const conversationText = conversation
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `You are a requirements extraction expert for an AI development platform.
Your job is to extract technical requirements from conversations with non-technical users who describe what they want to build in plain English.

Extract technical requirements from this conversation:

${conversationText}

Analyze the conversation and extract:
1. **Project Type**: What kind of application is this? (web_app, api, mobile_app, cli_tool, library)
2. **Language**: If mentioned, what programming language? (python, javascript, typescript, go, rust)
3. **Framework**: If mentioned or implied, what framework? (fastapi, django, flask, nextjs, react, gin, actix, etc.)
4. **Features**: What specific features or capabilities are needed? (auth, database, api, ui, email, payments, etc.)
5. **Constraints**: Any technical or business constraints? (scale, budget, performance, deadlines)
6. **Clarification Needed**: What questions should we ask the user to get missing information?
7. **Confidence**: How confident are you in this extraction? (high, medium, low)

Guidelines for extraction:
- Be forgiving of vague descriptions
- If project type is unclear, leave it undefined and ask for clarification
- If language is not mentioned, leave it undefined (we'll ask the user later)
- Extract features even from casual descriptions (e.g., "sell my art" → ecommerce, portfolio)
- Always identify at least one clarification question unless all details are crystal clear
- Use "low" confidence for very vague requests, "medium" for partial info, "high" for detailed requirements

Respond with JSON only (no markdown, no explanation):
{
  "projectType": "web_app|api|mobile_app|cli_tool|library",
  "language": "python|javascript|typescript|go|rust",
  "framework": "framework-name",
  "features": ["feature1", "feature2", ...],
  "constraints": ["constraint1", "constraint2", ...],
  "clarificationNeeded": ["question1", "question2", ...],
  "confidence": "high|medium|low"
}

Important: Return ONLY the JSON object, nothing else.`;
  }

  /**
   * Validates and parses the AI's response into structured requirements.
   *
   * @private
   * @param response - Raw text response from the AI
   * @returns Parsed and validated requirements object
   * @throws Error if response is not valid JSON
   */
  private validateAndParseResponse(response: string): ExtractedRequirements {
    // Try to extract JSON from response (in case AI adds extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error}`);
    }

    // Build validated requirements object with defaults
    const requirements: ExtractedRequirements = {
      projectType: this.validateProjectType(parsed.projectType),
      language: this.validateLanguage(parsed.language),
      framework: typeof parsed.framework === 'string' ? parsed.framework : undefined,
      features: Array.isArray(parsed.features) ? parsed.features.filter(f => typeof f === 'string') : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints.filter(c => typeof c === 'string') : undefined,
      clarificationNeeded: Array.isArray(parsed.clarificationNeeded)
        ? parsed.clarificationNeeded.filter(q => typeof q === 'string')
        : [],
      confidence: this.validateConfidence(parsed.confidence) || 'low'
    };

    return requirements;
  }

  /**
   * Validates that a project type is one of the allowed values.
   *
   * @private
   * @param value - Value to validate
   * @returns Valid project type or undefined
   */
  private validateProjectType(value: unknown): ExtractedRequirements['projectType'] {
    const validTypes = ['web_app', 'api', 'mobile_app', 'cli_tool', 'library'];
    if (typeof value === 'string' && validTypes.includes(value)) {
      return value as ExtractedRequirements['projectType'];
    }
    return undefined;
  }

  /**
   * Validates that a language is one of the allowed values.
   *
   * @private
   * @param value - Value to validate
   * @returns Valid language or undefined
   */
  private validateLanguage(value: unknown): ExtractedRequirements['language'] {
    const validLanguages = ['python', 'javascript', 'typescript', 'go', 'rust'];
    if (typeof value === 'string' && validLanguages.includes(value)) {
      return value as ExtractedRequirements['language'];
    }
    return undefined;
  }

  /**
   * Validates that a confidence level is one of the allowed values.
   *
   * @private
   * @param value - Value to validate
   * @returns Valid confidence level or undefined
   */
  private validateConfidence(value: unknown): ExtractedRequirements['confidence'] | undefined {
    const validConfidence = ['high', 'medium', 'low'];
    if (typeof value === 'string' && validConfidence.includes(value)) {
      return value as ExtractedRequirements['confidence'];
    }
    return undefined;
  }
}
