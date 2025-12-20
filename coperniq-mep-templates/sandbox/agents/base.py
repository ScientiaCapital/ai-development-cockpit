"""
Base Agent Configuration
Uses OpenRouter for cost-effective LLM calls (DeepSeek, Qwen, Claude)
Includes MEP/Energy-specific prompts for domain expertise
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from openai import OpenAI


def load_agent_prompts() -> Dict[str, Any]:
    """Load MEP/Energy-specific prompts from config file"""
    config_path = Path(__file__).parent.parent.parent / "config" / "agent_prompts.yaml"
    if config_path.exists():
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    return {}


def get_trade_prompt(trade: str) -> str:
    """Get the system prompt for a specific trade"""
    prompts = load_agent_prompts()
    trade_prompts = prompts.get("system_prompts", {})
    if trade in trade_prompts:
        return trade_prompts[trade].get("prompt", "")
    return ""


def get_task_prompt(task: str) -> str:
    """Get the prompt for a specific task type"""
    prompts = load_agent_prompts()
    task_prompts = prompts.get("task_prompts", {})
    if task in task_prompts:
        return task_prompts[task].get("prompt", "")
    return ""


def build_agent_prompt(trade: str, task: str) -> str:
    """Build a complete agent prompt combining trade expertise and task instructions"""
    trade_prompt = get_trade_prompt(trade)
    task_prompt = get_task_prompt(task)
    return f"{trade_prompt}\n\n---\n\nTASK:\n{task_prompt}"


@dataclass
class AgentConfig:
    """Configuration for LangGraph agents using OpenRouter"""

    # Model routing strategy for cost optimization
    MODELS = {
        "reasoning": "anthropic/claude-sonnet-4",     # Complex decisions
        "coding": "deepseek/deepseek-chat",            # Code generation
        "fast": "google/gemini-2.0-flash-001",         # Quick responses
        "vision": "qwen/qwen-2.5-vl-72b-instruct"      # Image analysis
    }

    # Fallback chain for resilience
    FALLBACK_CHAIN = [
        "deepseek/deepseek-chat",
        "google/gemini-2.0-flash-001",
        "anthropic/claude-sonnet-4"
    ]


class OpenRouterClient:
    """OpenRouter client for tool-calling LLM requests"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment")

        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
        )

    def chat_with_tools(
        self,
        messages: list,
        tools: list,
        model: str = "deepseek/deepseek-chat",
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Make a tool-calling request to OpenRouter

        Args:
            messages: Conversation history
            tools: List of tool definitions (JSON schema)
            model: Model to use from OpenRouter
            temperature: Sampling temperature

        Returns:
            Response with potential tool calls
        """
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            temperature=temperature,
            extra_headers={
                "HTTP-Referer": "https://coperniq.io",
                "X-Title": "Coperniq MEP Agent"
            }
        )

        return {
            "content": response.choices[0].message.content,
            "tool_calls": response.choices[0].message.tool_calls,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }

    def simple_chat(
        self,
        prompt: str,
        model: str = "deepseek/deepseek-chat",
        system: str = "You are a helpful MEP domain expert."
    ) -> str:
        """Simple chat without tools"""
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content


# Tool definitions for MEP template agents
MEP_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_template",
            "description": "Create a new MEP form template in Coperniq",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Template name with [MEP] prefix"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["HVAC", "Plumbing", "Electrical", "Fire Protection", "Low Voltage", "Roofing"]
                    },
                    "groups": {
                        "type": "array",
                        "description": "Field groups in the template",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "fields": {"type": "array"}
                            }
                        }
                    }
                },
                "required": ["name", "category", "groups"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "validate_template",
            "description": "Validate a template against MEP compliance standards",
            "parameters": {
                "type": "object",
                "properties": {
                    "template_id": {
                        "type": "string",
                        "description": "ID of template to validate"
                    },
                    "compliance_standards": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Standards to check (EPA 608, NFPA 25, NEC, etc.)"
                    }
                },
                "required": ["template_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "submit_form",
            "description": "Submit test data to a form template",
            "parameters": {
                "type": "object",
                "properties": {
                    "template_id": {
                        "type": "string",
                        "description": "ID of template to submit to"
                    },
                    "test_data": {
                        "type": "object",
                        "description": "Field values to submit"
                    }
                },
                "required": ["template_id", "test_data"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_templates",
            "description": "List all templates in the sandbox",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Filter by category (optional)"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_certification_requirements",
            "description": "Get certification requirements for a trade",
            "parameters": {
                "type": "object",
                "properties": {
                    "trade": {
                        "type": "string",
                        "enum": ["hvac", "plumbing", "electrical", "fire_protection", "low_voltage", "roofing"]
                    }
                },
                "required": ["trade"]
            }
        }
    }
]


# Certification knowledge base (from our research)
CERTIFICATION_KB = {
    "hvac": {
        "required": ["EPA 608 Universal", "State HVAC License"],
        "recommended": ["NATE Certification", "OSHA 10/30"],
        "advanced": ["ASHRAE CHD", "ASHRAE BCxP"],
        "compliance": ["EPA Section 608", "AIM Act", "ASHRAE 90.1"]
    },
    "plumbing": {
        "required": ["State Plumbing License"],
        "recommended": ["ASSE 5110 Backflow Tester", "OSHA 10"],
        "advanced": ["Master Plumber", "EPA Lead-Safe"],
        "compliance": ["IPC/UPC", "Cross-Connection Control"]
    },
    "electrical": {
        "required": ["State Electrical License", "OSHA 10"],
        "recommended": ["NEC Certification", "OSHA 30"],
        "advanced": ["CEI-R", "CEI-M", "Thermography Level II"],
        "compliance": ["NEC 2023", "NFPA 70B", "NFPA 70E"]
    },
    "fire_protection": {
        "required": ["State Fire Protection License", "NICET Level I+"],
        "recommended": ["NICET Level II", "OSHA 10"],
        "advanced": ["NICET Level III/IV"],
        "compliance": ["NFPA 25", "NFPA 10", "NFPA 72", "NFPA 13"]
    },
    "low_voltage": {
        "required": ["State Low Voltage License"],
        "recommended": ["BICSI Installer 1", "OSHA 10"],
        "advanced": ["BICSI Technician", "BICSI RCDD"],
        "compliance": ["TIA-568", "NEC Article 800"]
    },
    "roofing": {
        "required": ["State Roofing License", "OSHA 10"],
        "recommended": ["GAF Certified", "CertainTeed SELECT"],
        "advanced": ["NRCA PROCertification", "GAF Master Elite"],
        "compliance": ["IRC", "IBC", "OSHA Fall Protection"]
    }
}
