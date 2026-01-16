#!/usr/bin/env node
/**
 * FieldVault MCP Server - Blueprint Analysis, VLM, OCR for MEP Contractors
 *
 * This server provides AI-powered document analysis tools via MCP protocol:
 * - Blueprint takeoff (material quantities)
 * - Equipment photo analysis
 * - OCR for labels and specifications
 * - Trade-specific prompts (HVAC, Plumbing, Electrical, Solar, etc.)
 *
 * VLM Models (Best of the Best - NO OpenAI):
 * - Qwen3-VL-72B: Premium blueprint analysis (highest accuracy)
 * - Qwen3-VL-32B: Standard photo analysis (fast + accurate)
 * - DeepSeek-V3.2: Text extraction and structured output
 *
 * @author Kipper Energy Solutions
 * @license MIT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';

// =============================================================================
// VLM Model Configuration - Best Chinese Models via OpenRouter
// =============================================================================

const VLM_MODELS = {
  // Premium - Highest accuracy for blueprints and complex documents
  premium: {
    vision: 'qwen/qwen-2.5-vl-72b-instruct',  // $0.40/M input, $0.40/M output
    text: 'deepseek/deepseek-chat-v3-0324',   // $0.14/M - Best reasoning
    embedding: 'qwen/qwen3-embedding-8b',     // $0.01/M - Cheapest embeddings
  },
  // Standard - Fast and accurate for field photos
  standard: {
    vision: 'qwen/qwen-2.5-vl-32b-instruct',  // $0.20/M input
    text: 'deepseek/deepseek-chat',           // $0.07/M - Cost effective
    embedding: 'qwen/qwen3-embedding-8b',
  },
  // Budget - For high-volume, less critical analysis
  budget: {
    vision: 'qwen/qwen-2.5-vl-7b-instruct',   // $0.05/M input
    text: 'deepseek/deepseek-chat',
    embedding: 'qwen/qwen3-embedding-8b',
  },
} as const;

type ModelTier = keyof typeof VLM_MODELS;

// =============================================================================
// Trade-Specific Prompts for MEP Analysis
// =============================================================================

const TRADE_PROMPTS: Record<string, string> = {
  hvac: `Analyze this HVAC equipment image. Extract:
- Manufacturer and model number
- Serial number
- BTU/tonnage rating
- SEER/EER efficiency rating
- Refrigerant type (R-410A, R-22, etc.)
- Voltage and phase
- Visible condition (new, good, fair, poor)
- Installation date if visible
- Any safety concerns or code violations
Return as structured JSON.`,

  plumbing: `Analyze this plumbing equipment/fixture image. Extract:
- Manufacturer and model
- Type (water heater, pump, fixture, pipe)
- Capacity/size (gallons, GPM, diameter)
- Material type (copper, PEX, PVC, cast iron)
- Energy factor or efficiency rating
- Serial number if visible
- Condition assessment
- Any code concerns (backflow, venting)
Return as structured JSON.`,

  electrical: `Analyze this electrical equipment image. Extract:
- Manufacturer and model
- Panel type (main, sub, disconnect)
- Amperage rating
- Voltage (120V, 240V, 480V)
- Phase (single, three)
- Number of spaces/circuits
- Condition and age estimate
- NEC code compliance concerns
- AFCI/GFCI requirements
Return as structured JSON.`,

  solar: `Analyze this solar equipment image. Extract:
- Panel manufacturer and model
- Wattage per panel
- Inverter brand/model and capacity
- String configuration if visible
- Battery system details
- Monitoring equipment
- Installation quality assessment
- NEC 690/705 compliance concerns
Return as structured JSON.`,

  roofing: `Analyze this roofing image. Extract:
- Roofing material type (asphalt, metal, tile, flat)
- Estimated age/condition
- Visible damage or wear
- Flashing condition
- Gutter/drainage assessment
- Ventilation adequacy
- Square footage estimate if measurable
- Recommended repairs
Return as structured JSON.`,

  fire_protection: `Analyze this fire protection equipment image. Extract:
- Equipment type (sprinkler, extinguisher, alarm, suppression)
- Manufacturer and model
- Inspection tag dates
- Condition assessment
- NFPA compliance concerns (13, 25, 72)
- Recommended service/replacement
Return as structured JSON.`,

  blueprint: `Analyze this MEP blueprint/drawing. Extract:
- Drawing type (floor plan, mechanical, electrical, plumbing)
- Scale if shown
- Key dimensions
- Equipment schedules visible
- Material takeoff quantities:
  - Linear feet of pipe/conduit/duct
  - Number of fixtures/devices
  - Equipment counts
- Notes and specifications
Return as structured JSON with material quantities.`,

  general: `Analyze this image and extract all relevant equipment information.
Include manufacturer, model, specifications, condition, and any concerns.
Return as structured JSON.`,
};

// =============================================================================
// Initialize OpenRouter Client (NO OpenAI models)
// =============================================================================

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': 'https://fieldvault.ai',
    'X-Title': 'FieldVault MCP Server',
  },
});

// =============================================================================
// VLM Analysis Functions
// =============================================================================

interface AnalysisResult {
  extraction: Record<string, unknown>;
  confidence: number;
  model: string;
  processingTimeMs: number;
  trade: string;
}

/**
 * Analyze image with VLM
 */
async function analyzeImage(
  imageBase64: string,
  trade: string = 'general',
  tier: ModelTier = 'standard',
  customPrompt?: string
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const models = VLM_MODELS[tier];
  const prompt = customPrompt || TRADE_PROMPTS[trade] || TRADE_PROMPTS.general;

  // Extract base64 data and media type
  const mediaTypeMatch = imageBase64.match(/^data:(image\/[^;]+);base64,/);
  const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
  const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');

  try {
    const response = await openrouter.chat.completions.create({
      model: models.vision,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Data}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1, // Low temp for consistent structured output
    });

    const content = response.choices[0]?.message?.content || '{}';

    // Parse JSON from response
    let extraction: Record<string, unknown>;
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        content.match(/\{[\s\S]*\}/);
      extraction = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
    } catch {
      extraction = { raw_response: content, parse_error: true };
    }

    // Calculate confidence based on extraction completeness
    const fields = Object.keys(extraction).filter(k =>
      extraction[k] !== null && extraction[k] !== undefined && extraction[k] !== ''
    );
    const confidence = Math.min(0.95, 0.5 + (fields.length * 0.05));

    return {
      extraction,
      confidence,
      model: models.vision,
      processingTimeMs: Date.now() - startTime,
      trade,
    };
  } catch (error) {
    console.error('VLM analysis error:', error);
    throw error;
  }
}

/**
 * Extract text/OCR from image
 */
async function extractText(
  imageBase64: string,
  tier: ModelTier = 'standard'
): Promise<{ text: string; model: string; processingTimeMs: number }> {
  const startTime = Date.now();
  const models = VLM_MODELS[tier];

  const mediaTypeMatch = imageBase64.match(/^data:(image\/[^;]+);base64,/);
  const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
  const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');

  const response = await openrouter.chat.completions.create({
    model: models.vision,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${base64Data}`,
            },
          },
          {
            type: 'text',
            text: 'Extract ALL text visible in this image. Include labels, model numbers, specifications, and any other text. Return as plain text, preserving layout where possible.',
          },
        ],
      },
    ],
    max_tokens: 2048,
    temperature: 0,
  });

  return {
    text: response.choices[0]?.message?.content || '',
    model: models.vision,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Blueprint material takeoff
 */
async function blueprintTakeoff(
  imageBase64: string,
  trade: string = 'general',
  tier: ModelTier = 'premium' // Use premium for blueprints by default
): Promise<AnalysisResult> {
  const prompt = `Analyze this ${trade} blueprint and provide a material takeoff. Extract:

1. **Equipment Schedule**:
   - Count of each equipment type
   - Model/size specifications

2. **Material Quantities**:
   - Linear feet of pipe/conduit/duct by size
   - Number of fittings by type
   - Fixture counts
   - Device counts (outlets, switches, etc.)

3. **Labor Estimates**:
   - Estimated installation hours
   - Specialty work required

4. **Notes**:
   - Special requirements
   - Code considerations
   - Coordination needs

Return as structured JSON with quantities for cost estimation.`;

  return analyzeImage(imageBase64, 'blueprint', tier, prompt);
}

// =============================================================================
// MCP Server Setup
// =============================================================================

const server = new Server(
  {
    name: 'fieldvault-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Image Analysis Tools
      {
        name: 'analyze_equipment_photo',
        description: 'Analyze a field photo of MEP equipment using Qwen VLM. Extracts manufacturer, model, specs, and condition.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            image: {
              type: 'string',
              description: 'Base64 encoded image (with or without data URL prefix)',
            },
            trade: {
              type: 'string',
              enum: ['hvac', 'plumbing', 'electrical', 'solar', 'roofing', 'fire_protection', 'general'],
              description: 'Trade type for specialized analysis prompts',
            },
            tier: {
              type: 'string',
              enum: ['premium', 'standard', 'budget'],
              description: 'Model tier - premium for highest accuracy, budget for high volume',
            },
          },
          required: ['image'],
        },
      },
      {
        name: 'extract_text_ocr',
        description: 'Extract all text from an image using VLM-based OCR. Great for equipment labels and specification plates.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            image: {
              type: 'string',
              description: 'Base64 encoded image',
            },
            tier: {
              type: 'string',
              enum: ['premium', 'standard', 'budget'],
              description: 'Model tier for OCR accuracy',
            },
          },
          required: ['image'],
        },
      },
      {
        name: 'blueprint_takeoff',
        description: 'Analyze a blueprint/drawing and extract material quantities for cost estimation. Uses premium VLM by default.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            image: {
              type: 'string',
              description: 'Base64 encoded blueprint image',
            },
            trade: {
              type: 'string',
              enum: ['hvac', 'plumbing', 'electrical', 'solar', 'fire_protection', 'general'],
              description: 'Trade type for the blueprint',
            },
            tier: {
              type: 'string',
              enum: ['premium', 'standard'],
              description: 'Model tier - premium recommended for blueprints',
            },
          },
          required: ['image'],
        },
      },
      // Utility Tools
      {
        name: 'list_supported_trades',
        description: 'List all supported trade types with their analysis capabilities',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
      {
        name: 'get_model_info',
        description: 'Get information about available VLM models and their pricing',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'analyze_equipment_photo': {
        const { image, trade = 'general', tier = 'standard' } = args as {
          image: string;
          trade?: string;
          tier?: ModelTier;
        };
        const result = await analyzeImage(image, trade, tier);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'extract_text_ocr': {
        const { image, tier = 'standard' } = args as {
          image: string;
          tier?: ModelTier;
        };
        const result = await extractText(image, tier);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'blueprint_takeoff': {
        const { image, trade = 'general', tier = 'premium' } = args as {
          image: string;
          trade?: string;
          tier?: ModelTier;
        };
        const result = await blueprintTakeoff(image, trade, tier);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_supported_trades': {
        const trades = Object.entries(TRADE_PROMPTS).map(([trade, prompt]) => ({
          trade,
          description: prompt.split('\n')[0].replace('Analyze this ', '').replace(' image. Extract:', ''),
        }));
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ supported_trades: trades }, null, 2),
            },
          ],
        };
      }

      case 'get_model_info': {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                models: VLM_MODELS,
                pricing_note: 'Prices are per million tokens via OpenRouter',
                recommendation: 'Use premium for blueprints, standard for field photos, budget for high-volume OCR',
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// =============================================================================
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FieldVault MCP Server running on stdio');
}

main().catch(console.error);
