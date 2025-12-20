"""
Autonomous Agent System for Coperniq MEP Templates

Implements the Anthropic Cookbook agent loop pattern with:
- Tool use with automatic execution
- LLM vs VLM model routing based on task type
- OpenRouter multi-provider support
- MEP domain-specific tools

Based on patterns from:
- Anthropic Cookbook: Tool use and agent loops
- OpenRouter API: Multi-provider tool calling
"""

import os
import json
import base64
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from datetime import datetime

# OpenRouter uses OpenAI-compatible API
from openai import OpenAI


class ModelType(Enum):
    """Model types for routing"""
    LLM = "llm"           # Text-only language model
    VLM = "vlm"           # Vision-language model
    REASONING = "reasoning"  # Complex reasoning
    FAST = "fast"         # Quick responses
    CODING = "coding"     # Code generation


class TaskType(Enum):
    """Task types that determine model selection"""
    QUERY = "query"               # Natural language query
    ANALYSIS = "analysis"         # Data analysis
    IMAGE_ANALYSIS = "image"      # Image/document analysis
    CODE_GENERATION = "code"      # Generate code
    COMPLEX_REASONING = "reason"  # Multi-step reasoning
    QUICK_RESPONSE = "quick"      # Simple lookups


@dataclass
class ModelConfig:
    """Configuration for available models"""

    # OpenRouter model IDs (NO OpenAI!)
    MODELS = {
        ModelType.REASONING: "anthropic/claude-sonnet-4",
        ModelType.CODING: "deepseek/deepseek-chat",
        ModelType.FAST: "google/gemini-2.0-flash-001",
        ModelType.VLM: "qwen/qwen-2.5-vl-72b-instruct",
        ModelType.LLM: "deepseek/deepseek-chat",  # Default LLM
    }

    # Task to model mapping
    TASK_ROUTING = {
        TaskType.QUERY: ModelType.LLM,
        TaskType.ANALYSIS: ModelType.REASONING,
        TaskType.IMAGE_ANALYSIS: ModelType.VLM,
        TaskType.CODE_GENERATION: ModelType.CODING,
        TaskType.COMPLEX_REASONING: ModelType.REASONING,
        TaskType.QUICK_RESPONSE: ModelType.FAST,
    }

    # Fallback chain for resilience
    FALLBACK_CHAIN = [
        "deepseek/deepseek-chat",
        "google/gemini-2.0-flash-001",
        "anthropic/claude-sonnet-4"
    ]


@dataclass
class ToolCall:
    """Represents a tool call from the model"""
    id: str
    name: str
    arguments: Dict[str, Any]


@dataclass
class ToolResult:
    """Result from executing a tool"""
    tool_call_id: str
    content: str
    is_error: bool = False


@dataclass
class AgentResponse:
    """Complete response from agent execution"""
    content: str
    tool_calls_made: List[ToolCall] = field(default_factory=list)
    tool_results: List[ToolResult] = field(default_factory=list)
    model_used: str = ""
    total_tokens: int = 0
    execution_time_ms: int = 0
    success: bool = True
    error: Optional[str] = None


class ModelRouter:
    """Routes tasks to appropriate models (LLM vs VLM)"""

    def __init__(self, config: ModelConfig = None):
        self.config = config or ModelConfig()

    def detect_task_type(self, query: str, has_images: bool = False) -> TaskType:
        """Detect task type from query content"""
        query_lower = query.lower()

        # Image analysis always needs VLM
        if has_images:
            return TaskType.IMAGE_ANALYSIS

        # Complex reasoning keywords
        reasoning_keywords = [
            "analyze", "compare", "evaluate", "trade-off",
            "recommend", "strategy", "optimize", "why"
        ]
        if any(kw in query_lower for kw in reasoning_keywords):
            return TaskType.COMPLEX_REASONING

        # Code generation keywords
        code_keywords = [
            "code", "script", "function", "generate", "write",
            "implement", "sql", "query", "python"
        ]
        if any(kw in query_lower for kw in code_keywords):
            return TaskType.CODE_GENERATION

        # Quick response keywords
        quick_keywords = [
            "list", "show", "what is", "how many", "count"
        ]
        if any(kw in query_lower for kw in quick_keywords):
            return TaskType.QUICK_RESPONSE

        # Analysis keywords
        analysis_keywords = [
            "margin", "profit", "trend", "performance",
            "forecast", "predict", "pattern"
        ]
        if any(kw in query_lower for kw in analysis_keywords):
            return TaskType.ANALYSIS

        # Default to standard query
        return TaskType.QUERY

    def select_model(
        self,
        task_type: TaskType = None,
        query: str = None,
        has_images: bool = False,
        force_model: ModelType = None
    ) -> str:
        """Select the best model for the task"""

        # Allow forcing a specific model type
        if force_model:
            return self.config.MODELS.get(force_model, self.config.MODELS[ModelType.LLM])

        # Auto-detect task type if not provided
        if task_type is None and query:
            task_type = self.detect_task_type(query, has_images)

        if task_type is None:
            task_type = TaskType.QUERY

        # Get model type for task
        model_type = self.config.TASK_ROUTING.get(task_type, ModelType.LLM)

        # Get actual model ID
        return self.config.MODELS.get(model_type, self.config.MODELS[ModelType.LLM])

    def is_vlm_needed(self, query: str, has_images: bool = False) -> bool:
        """Check if a VLM is needed for this query"""
        if has_images:
            return True

        vlm_keywords = ["image", "photo", "picture", "screenshot", "document", "pdf", "scan"]
        return any(kw in query.lower() for kw in vlm_keywords)


class MEPToolRegistry:
    """Registry of tools available to MEP agents"""

    def __init__(self):
        self._tools: Dict[str, Dict] = {}
        self._handlers: Dict[str, Callable] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        """Register default MEP domain tools"""

        # Query data tool
        self.register_tool(
            name="query_data",
            description="Query contractor data from the sandbox database",
            parameters={
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "enum": ["Contact", "Site", "Asset", "Task", "Project", "System", "FinancialDocument"],
                        "description": "Coperniq table to query"
                    },
                    "filters": {
                        "type": "object",
                        "description": "Filter conditions as key-value pairs"
                    },
                    "aggregation": {
                        "type": "string",
                        "enum": ["sum", "count", "avg", "min", "max", "group_by"],
                        "description": "Aggregation to apply (optional)"
                    },
                    "group_by": {
                        "type": "string",
                        "description": "Field to group by (if aggregation is group_by)"
                    }
                },
                "required": ["table"]
            },
            handler=self._handle_query_data
        )

        # Calculate metrics tool
        self.register_tool(
            name="calculate_metrics",
            description="Calculate business metrics like margin, revenue, costs",
            parameters={
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "enum": ["margin", "revenue", "cost", "profit", "labor_cost", "material_cost"],
                        "description": "Metric to calculate"
                    },
                    "dimension": {
                        "type": "string",
                        "description": "Dimension to break down by (e.g., 'job_type', 'technician', 'month')"
                    },
                    "date_range": {
                        "type": "object",
                        "properties": {
                            "start": {"type": "string", "format": "date"},
                            "end": {"type": "string", "format": "date"}
                        }
                    }
                },
                "required": ["metric"]
            },
            handler=self._handle_calculate_metrics
        )

        # Schedule optimizer tool
        self.register_tool(
            name="schedule_optimizer",
            description="Optimize technician schedules for jobs and service calls",
            parameters={
                "type": "object",
                "properties": {
                    "date_range": {
                        "type": "object",
                        "properties": {
                            "start": {"type": "string", "format": "date"},
                            "end": {"type": "string", "format": "date"}
                        },
                        "required": ["start", "end"]
                    },
                    "constraints": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Scheduling constraints (e.g., 'minimize_travel', 'respect_skills')"
                    }
                },
                "required": ["date_range"]
            },
            handler=self._handle_schedule_optimizer
        )

        # Equipment tracker tool
        self.register_tool(
            name="equipment_tracker",
            description="Track equipment status, warranties, and maintenance schedules",
            parameters={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["warranty_status", "maintenance_due", "service_history", "inventory"],
                        "description": "Action to perform"
                    },
                    "equipment_type": {
                        "type": "string",
                        "description": "Filter by equipment type (optional)"
                    },
                    "days_ahead": {
                        "type": "integer",
                        "description": "Look ahead window in days (for maintenance_due)"
                    }
                },
                "required": ["action"]
            },
            handler=self._handle_equipment_tracker
        )

        # Create report tool
        self.register_tool(
            name="create_report",
            description="Generate a formatted report from query results",
            parameters={
                "type": "object",
                "properties": {
                    "report_type": {
                        "type": "string",
                        "enum": ["summary", "detailed", "chart_data", "export"],
                        "description": "Type of report to generate"
                    },
                    "title": {
                        "type": "string",
                        "description": "Report title"
                    },
                    "data": {
                        "type": "object",
                        "description": "Data to include in report"
                    }
                },
                "required": ["report_type", "title"]
            },
            handler=self._handle_create_report
        )

        # Get recommendations tool
        self.register_tool(
            name="get_recommendations",
            description="Get AI recommendations based on data patterns",
            parameters={
                "type": "object",
                "properties": {
                    "domain": {
                        "type": "string",
                        "enum": ["profitability", "scheduling", "maintenance", "sales", "service"],
                        "description": "Domain for recommendations"
                    },
                    "context": {
                        "type": "object",
                        "description": "Additional context for recommendations"
                    }
                },
                "required": ["domain"]
            },
            handler=self._handle_get_recommendations
        )

    def register_tool(
        self,
        name: str,
        description: str,
        parameters: Dict,
        handler: Callable
    ):
        """Register a new tool"""
        self._tools[name] = {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": parameters
            }
        }
        self._handlers[name] = handler

    def get_tools(self) -> List[Dict]:
        """Get all tool definitions for API call"""
        return list(self._tools.values())

    def execute_tool(self, name: str, arguments: Dict) -> str:
        """Execute a tool and return result"""
        if name not in self._handlers:
            return json.dumps({"error": f"Unknown tool: {name}"})

        try:
            result = self._handlers[name](arguments)
            return json.dumps(result) if isinstance(result, dict) else str(result)
        except Exception as e:
            return json.dumps({"error": str(e)})

    # Tool handlers (mock implementations for now)

    def _handle_query_data(self, args: Dict) -> Dict:
        """Handle data query - mock implementation"""
        table = args.get("table", "unknown")
        filters = args.get("filters", {})
        aggregation = args.get("aggregation")

        # Mock response based on table
        mock_data = {
            "Contact": [
                {"id": 1, "name": "John Smith", "type": "commercial"},
                {"id": 2, "name": "ACME Corp", "type": "commercial"}
            ],
            "Asset": [
                {"id": 1, "name": "RTU-001", "type": "HVAC", "status": "operational"},
                {"id": 2, "name": "Chiller-001", "type": "HVAC", "status": "maintenance_due"}
            ],
            "Task": [
                {"id": 1, "title": "PM Visit", "status": "scheduled", "priority": 2},
                {"id": 2, "title": "Service Call", "status": "pending", "priority": 1}
            ]
        }

        return {
            "table": table,
            "filters_applied": filters,
            "aggregation": aggregation,
            "results": mock_data.get(table, []),
            "count": len(mock_data.get(table, []))
        }

    def _handle_calculate_metrics(self, args: Dict) -> Dict:
        """Handle metrics calculation - mock implementation"""
        metric = args.get("metric", "revenue")
        dimension = args.get("dimension")

        # Mock metrics
        mock_metrics = {
            "margin": {"overall": 0.32, "by_dimension": {"residential": 0.28, "commercial": 0.38}},
            "revenue": {"total": 450000, "by_dimension": {"residential": 180000, "commercial": 270000}},
            "profit": {"total": 144000, "by_dimension": {"residential": 50400, "commercial": 93600}}
        }

        return {
            "metric": metric,
            "dimension": dimension,
            "value": mock_metrics.get(metric, {"total": 0}),
            "period": "current_quarter"
        }

    def _handle_schedule_optimizer(self, args: Dict) -> Dict:
        """Handle schedule optimization - mock implementation"""
        date_range = args.get("date_range", {})
        constraints = args.get("constraints", [])

        return {
            "date_range": date_range,
            "constraints_applied": constraints,
            "optimized_schedule": [
                {"date": "2025-12-23", "technician": "Mike", "jobs": ["PM-101", "PM-102"]},
                {"date": "2025-12-23", "technician": "Sarah", "jobs": ["SC-201", "Install-301"]}
            ],
            "efficiency_score": 0.87,
            "recommendations": [
                "Consolidate PM visits by geographic zone",
                "Consider adding afternoon install slot"
            ]
        }

    def _handle_equipment_tracker(self, args: Dict) -> Dict:
        """Handle equipment tracking - mock implementation"""
        action = args.get("action", "inventory")
        days_ahead = args.get("days_ahead", 30)

        if action == "warranty_status":
            return {
                "expiring_soon": [
                    {"asset": "RTU-003", "warranty_end": "2025-01-15", "days_left": 26}
                ],
                "expired": [
                    {"asset": "Chiller-002", "warranty_end": "2024-11-30"}
                ]
            }
        elif action == "maintenance_due":
            return {
                "due_within_days": days_ahead,
                "assets": [
                    {"asset": "RTU-001", "due_date": "2025-12-28", "service_type": "PM"},
                    {"asset": "AHU-002", "due_date": "2026-01-05", "service_type": "Filter Change"}
                ]
            }
        else:
            return {"action": action, "status": "completed"}

    def _handle_create_report(self, args: Dict) -> Dict:
        """Handle report creation - mock implementation"""
        report_type = args.get("report_type", "summary")
        title = args.get("title", "Report")

        return {
            "report_type": report_type,
            "title": title,
            "generated_at": datetime.now().isoformat(),
            "status": "generated",
            "content": f"# {title}\n\nReport generated successfully."
        }

    def _handle_get_recommendations(self, args: Dict) -> Dict:
        """Handle recommendations - mock implementation"""
        domain = args.get("domain", "general")

        recommendations = {
            "profitability": [
                "Increase commercial mix to improve margins",
                "Review material costs on residential jobs",
                "Consider value-added services (PM agreements)"
            ],
            "scheduling": [
                "Consolidate travel by geographic zone",
                "Allocate senior techs to complex jobs",
                "Buffer time for emergency calls"
            ],
            "maintenance": [
                "3 assets due for PM this week",
                "2 warranties expiring in 30 days",
                "Consider proactive filter replacement"
            ]
        }

        return {
            "domain": domain,
            "recommendations": recommendations.get(domain, ["No specific recommendations"]),
            "confidence": 0.85
        }


class AutonomousAgent:
    """
    Autonomous agent that executes queries using the agent loop pattern.

    Implements:
    - Anthropic Cookbook agent loop (while tool_use, process tools)
    - OpenRouter multi-provider support
    - Automatic LLM/VLM routing
    - MEP domain tools
    """

    MAX_ITERATIONS = 10  # Prevent infinite loops

    def __init__(
        self,
        api_key: Optional[str] = None,
        vertical: str = "hvac_mep",
        system_prompt: Optional[str] = None
    ):
        """
        Initialize autonomous agent

        Args:
            api_key: OpenRouter API key (or set OPENROUTER_API_KEY env var)
            vertical: GTM vertical for context
            system_prompt: Override default system prompt
        """
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found")

        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key
        )

        self.vertical = vertical
        self.model_router = ModelRouter()
        self.tool_registry = MEPToolRegistry()

        # Load vertical-specific system prompt
        self.system_prompt = system_prompt or self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """Build system prompt with MEP domain knowledge"""
        return f"""You are an AI assistant for MEP (Mechanical, Electrical, Plumbing) contractors.

VERTICAL: {self.vertical}

You have access to tools that can:
- Query contractor data (contacts, sites, assets, tasks, projects)
- Calculate business metrics (margin, revenue, costs)
- Optimize technician schedules
- Track equipment and warranties
- Generate reports
- Provide recommendations

When answering questions:
1. Use the appropriate tool to get data
2. Analyze the results
3. Provide clear, actionable insights
4. Use MEP industry terminology appropriately

Always be helpful, accurate, and focused on practical business value."""

    def _process_tool_calls(
        self,
        tool_calls: List[Any]
    ) -> List[ToolResult]:
        """Process tool calls from model response"""
        results = []

        for tool_call in tool_calls:
            name = tool_call.function.name

            # Parse arguments
            try:
                arguments = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                arguments = {}

            # Execute tool
            result = self.tool_registry.execute_tool(name, arguments)

            results.append(ToolResult(
                tool_call_id=tool_call.id,
                content=result,
                is_error="error" in result.lower()
            ))

        return results

    def run(
        self,
        query: str,
        images: Optional[List[str]] = None,
        force_model: Optional[ModelType] = None,
        max_iterations: int = None
    ) -> AgentResponse:
        """
        Run the agent on a query using the agent loop pattern

        This implements the Anthropic Cookbook pattern:
        while response.stop_reason == "tool_use":
            process_tool_calls()
            continue_conversation()

        Args:
            query: User query
            images: Optional list of image paths/URLs for VLM
            force_model: Force a specific model type
            max_iterations: Override max iterations

        Returns:
            AgentResponse with final result
        """
        start_time = datetime.now()
        max_iter = max_iterations or self.MAX_ITERATIONS

        # Determine if VLM is needed
        has_images = bool(images)

        # Select model
        model = self.model_router.select_model(
            query=query,
            has_images=has_images,
            force_model=force_model
        )

        # Build initial messages
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]

        # Handle images for VLM
        if has_images and images:
            content = [{"type": "text", "text": query}]
            for img in images:
                if img.startswith("data:") or img.startswith("http"):
                    content.append({
                        "type": "image_url",
                        "image_url": {"url": img}
                    })
                else:
                    # Load local file
                    with open(img, "rb") as f:
                        b64 = base64.b64encode(f.read()).decode()
                        content.append({
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
                        })
            messages.append({"role": "user", "content": content})
        else:
            messages.append({"role": "user", "content": query})

        # Track all tool calls and results
        all_tool_calls: List[ToolCall] = []
        all_tool_results: List[ToolResult] = []
        total_tokens = 0

        # Agent loop - keep going while model wants to use tools
        iteration = 0
        final_content = ""

        while iteration < max_iter:
            iteration += 1

            try:
                # Call the model
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=self.tool_registry.get_tools(),
                    tool_choice="auto",
                    temperature=0.7,
                    extra_headers={
                        "HTTP-Referer": "https://coperniq.io",
                        "X-Title": "Coperniq MEP Agent"
                    }
                )

                # Track tokens
                if response.usage:
                    total_tokens += response.usage.total_tokens

                message = response.choices[0].message
                finish_reason = response.choices[0].finish_reason

                # Check if we have tool calls
                if message.tool_calls:
                    # Add assistant message with tool calls
                    messages.append({
                        "role": "assistant",
                        "content": message.content,
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments
                                }
                            }
                            for tc in message.tool_calls
                        ]
                    })

                    # Process tool calls
                    tool_results = self._process_tool_calls(message.tool_calls)

                    # Track tool calls
                    for tc in message.tool_calls:
                        try:
                            args = json.loads(tc.function.arguments)
                        except:
                            args = {}
                        all_tool_calls.append(ToolCall(
                            id=tc.id,
                            name=tc.function.name,
                            arguments=args
                        ))
                    all_tool_results.extend(tool_results)

                    # Add tool results to messages
                    for result in tool_results:
                        messages.append({
                            "role": "tool",
                            "tool_call_id": result.tool_call_id,
                            "content": result.content
                        })

                    # Continue the loop to let model process results
                    continue

                # No tool calls - we have the final response
                final_content = message.content or ""
                break

            except Exception as e:
                # Handle API errors
                execution_time = int((datetime.now() - start_time).total_seconds() * 1000)
                return AgentResponse(
                    content=f"Error during agent execution: {str(e)}",
                    tool_calls_made=all_tool_calls,
                    tool_results=all_tool_results,
                    model_used=model,
                    total_tokens=total_tokens,
                    execution_time_ms=execution_time,
                    success=False,
                    error=str(e)
                )

        # Calculate execution time
        execution_time = int((datetime.now() - start_time).total_seconds() * 1000)

        return AgentResponse(
            content=final_content,
            tool_calls_made=all_tool_calls,
            tool_results=all_tool_results,
            model_used=model,
            total_tokens=total_tokens,
            execution_time_ms=execution_time,
            success=True
        )

    def simple_query(
        self,
        query: str,
        force_model: Optional[ModelType] = None
    ) -> str:
        """Simple query without tool use - just get a response"""
        model = self.model_router.select_model(
            query=query,
            force_model=force_model
        )

        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.7
        )

        return response.choices[0].message.content or ""


# =============================================================================
# INTEGRATION WITH E2B RUNTIME
# =============================================================================

def create_sandbox_agent(vertical: str) -> AutonomousAgent:
    """
    Create an autonomous agent for a sandbox

    Usage:
        agent = create_sandbox_agent("hvac_mep")
        response = agent.run("What's my margin by job type?")
    """
    return AutonomousAgent(vertical=vertical)


def run_sandbox_query(vertical: str, query: str, images: List[str] = None) -> AgentResponse:
    """
    Run a query in the sandbox context

    Usage:
        response = run_sandbox_query("hvac_mep", "Which assets need service?")
    """
    agent = AutonomousAgent(vertical=vertical)
    return agent.run(query, images=images)


# =============================================================================
# DEMO
# =============================================================================

def demo_autonomous_agent():
    """Demonstrate autonomous agent capabilities"""
    print("\n" + "="*60)
    print("AUTONOMOUS AGENT DEMO")
    print("="*60 + "\n")

    # Check for API key
    if not os.getenv("OPENROUTER_API_KEY"):
        print("Note: OPENROUTER_API_KEY not set. Using mock mode.")
        print("Set OPENROUTER_API_KEY to run with real models.\n")
        return

    # Create agent
    agent = AutonomousAgent(vertical="hvac_mep")

    # Demo queries
    queries = [
        "What's my margin by job type?",
        "Which assets are due for maintenance?",
        "Schedule next week's PM visits efficiently"
    ]

    print("Running sample queries...")
    print("-" * 40)

    for query in queries:
        print(f"\nQ: {query}")

        response = agent.run(query)

        print(f"Model: {response.model_used}")
        print(f"Tools used: {[tc.name for tc in response.tool_calls_made]}")
        print(f"Tokens: {response.total_tokens}")
        print(f"Time: {response.execution_time_ms}ms")
        print(f"Response preview: {response.content[:200]}...")
        print("-" * 40)

    print("\n" + "="*60)
    print("DEMO COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    demo_autonomous_agent()
