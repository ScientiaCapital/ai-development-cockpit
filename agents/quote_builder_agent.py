#!/usr/bin/env python3
"""
Quote Builder Agent - Kipper Energy Solutions
==============================================

Generates professional proposals from site surveys:
- Good/Better/Best pricing tiers
- Equipment specifications
- Rebate and incentive calculations
- Financing options
- ROI projections

Integration Points:
- Coperniq API: Site surveys, contacts, equipment catalog
- Pricing database: Labor rates, material costs
- Utility databases: Rebate programs
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from dotenv import load_dotenv
import anthropic

load_dotenv()

AGENT_NAME = "Quote Builder Agent"
AGENT_VERSION = "1.0.0"

SYSTEM_PROMPT = """You are the Quote Builder Agent for Kipper Energy Solutions, responsible for generating professional proposals.

## Your Role
- Create Good/Better/Best proposals from site survey data
- Calculate accurate pricing including labor and materials
- Research and apply available rebates and incentives
- Present financing options
- Generate ROI projections for energy equipment

## Pricing Structure

### Labor Rates
| Level | Hourly Rate | Use For |
|-------|------------|---------|
| Apprentice | $45 | Helper tasks |
| Journeyman | $75 | Standard work |
| Lead Tech | $95 | Complex installs |
| Master | $125 | Critical systems |

### Material Markup
- Standard: 30% markup on cost
- Premium: 25% markup
- Budget-conscious: 35% markup

### Good/Better/Best Formula
| Tier | Equipment | Efficiency | Warranty | Price Point |
|------|-----------|------------|----------|-------------|
| Good | Builder grade | Meets code | 5 years | Budget-friendly |
| Better | Mid-tier brand | 14-16 SEER | 10 years | Best value |
| Best | Premium brand | 18+ SEER | 12+ years | Maximum comfort |

## Rebate Programs (SE Region)
- TVA EnergyRight: Up to $1,500 heat pumps
- Alabama Power: $300 AC, $400 heat pump
- Georgia Power: $250-$500 HVAC
- FPL: $150 AC tune-up, $400 heat pump
- Federal IRA: 30% tax credit (heat pumps, solar)

## Financing Options
- Same as cash (12 months)
- Low rate (3.99% 60 months)
- Extended (6.99% 120 months)
- PACE financing (for commercial)
"""

TOOLS = [
    {
        "name": "get_site_survey_data",
        "description": "Retrieve site survey data for a project",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "survey_type": {"type": "string", "enum": ["hvac_residential", "hvac_commercial", "solar", "electrical", "plumbing"]}
            },
            "required": ["project_id"]
        }
    },
    {
        "name": "calculate_equipment_sizing",
        "description": "Calculate required equipment size based on survey",
        "input_schema": {
            "type": "object",
            "properties": {
                "square_footage": {"type": "number"},
                "climate_zone": {"type": "string"},
                "insulation_level": {"type": "string", "enum": ["poor", "average", "good", "excellent"]},
                "num_stories": {"type": "integer"},
                "window_type": {"type": "string"}
            },
            "required": ["square_footage", "climate_zone"]
        }
    },
    {
        "name": "get_equipment_pricing",
        "description": "Get equipment pricing for Good/Better/Best options",
        "input_schema": {
            "type": "object",
            "properties": {
                "equipment_type": {"type": "string", "enum": ["AC", "heat_pump", "furnace", "air_handler", "mini_split", "package_unit"]},
                "size_tons": {"type": "number"},
                "tier": {"type": "string", "enum": ["good", "better", "best", "all"]}
            },
            "required": ["equipment_type", "size_tons"]
        }
    },
    {
        "name": "lookup_rebates",
        "description": "Find available rebates and incentives",
        "input_schema": {
            "type": "object",
            "properties": {
                "state": {"type": "string"},
                "utility": {"type": "string"},
                "equipment_type": {"type": "string"},
                "efficiency_rating": {"type": "number"}
            },
            "required": ["state", "equipment_type"]
        }
    },
    {
        "name": "calculate_roi",
        "description": "Calculate ROI for energy efficiency upgrade",
        "input_schema": {
            "type": "object",
            "properties": {
                "current_equipment_age": {"type": "integer"},
                "current_efficiency": {"type": "number"},
                "new_efficiency": {"type": "number"},
                "annual_energy_cost": {"type": "number"},
                "install_cost": {"type": "number"}
            },
            "required": ["current_efficiency", "new_efficiency", "install_cost"]
        }
    },
    {
        "name": "generate_proposal_pdf",
        "description": "Generate formatted PDF proposal",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "project_id": {"type": "string"},
                "options": {"type": "array", "items": {"type": "object"}},
                "valid_days": {"type": "integer"}
            },
            "required": ["customer_id", "project_id", "options"]
        }
    }
]


@dataclass
class QuoteBuilderAgent:
    """Quote builder agent for proposal generation."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.conversation: List[Dict] = []

    async def build_quote(self, survey_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build a Good/Better/Best quote from survey data."""
        prompt = f"""Create a Good/Better/Best proposal from this site survey:

Customer: {survey_data.get('customer_name')}
Address: {survey_data.get('address')}
State: {survey_data.get('state')}
Utility: {survey_data.get('utility')}

Property Details:
- Square Footage: {survey_data.get('square_footage', 'Unknown')}
- Stories: {survey_data.get('stories', 1)}
- Existing Equipment: {survey_data.get('existing_equipment', 'Unknown')}
- Equipment Age: {survey_data.get('equipment_age', 'Unknown')} years
- Current Issues: {survey_data.get('issues', 'None noted')}

Please:
1. Calculate appropriate equipment sizing
2. Get pricing for Good/Better/Best options
3. Find available rebates
4. Calculate ROI
5. Prepare the proposal"""

        self.conversation.append({"role": "user", "content": prompt})

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=self.conversation
        )

        result = {"proposal_summary": "", "pricing_options": [], "rebates": [], "roi": None}

        for block in response.content:
            if block.type == "text":
                result["proposal_summary"] = block.text
            elif block.type == "tool_use":
                if "pricing" in block.name.lower():
                    result["pricing_options"].append(block.input)
                elif "rebate" in block.name.lower():
                    result["rebates"].append(block.input)
                elif "roi" in block.name.lower():
                    result["roi"] = block.input

        return result


async def main():
    """Test quote builder agent."""
    agent = QuoteBuilderAgent()

    survey = {
        "customer_name": "Johnson Family",
        "address": "456 Oak Street, Mobile, AL 36602",
        "state": "AL",
        "utility": "Alabama Power",
        "square_footage": 2400,
        "stories": 2,
        "existing_equipment": "15 SEER Carrier AC, 90% gas furnace",
        "equipment_age": 12,
        "issues": "AC struggling to cool upstairs, high utility bills"
    }

    result = await agent.build_quote(survey)
    print("Proposal Summary:")
    print(result["proposal_summary"])


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
