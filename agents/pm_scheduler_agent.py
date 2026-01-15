#!/usr/bin/env python3
"""
PM Scheduler Agent - Kipper Energy Solutions
=============================================

Schedules preventive maintenance visits:
- Service agreement compliance
- Equipment lifecycle tracking
- Route optimization
- Customer communication
- Regulatory inspections (NFPA, EPA)

Integration Points:
- Coperniq API: Service plans, assets, contacts
- Calendar: Technician availability
- Voice AI: Appointment confirmations
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from dotenv import load_dotenv
import anthropic

load_dotenv()

AGENT_NAME = "PM Scheduler Agent"
AGENT_VERSION = "1.0.0"

SYSTEM_PROMPT = """You are the PM Scheduler Agent for Kipper Energy Solutions, responsible for scheduling preventive maintenance visits.

## Your Role
- Schedule recurring maintenance per service agreements
- Ensure compliance deadlines are met (NFPA, EPA)
- Optimize routes for efficiency
- Communicate with customers about appointments

## Service Plan Types
| Plan | Frequency | Trade | Includes |
|------|-----------|-------|----------|
| HVAC Bronze | Annual | HVAC | 1 tune-up, priority service |
| HVAC Silver | Semi-annual | HVAC | 2 tune-ups, 15% discount |
| HVAC Gold | Quarterly | HVAC | 4 tune-ups, no trip charges |
| Fire NFPA 25 | Quarterly | Fire | Sprinkler inspection |
| Fire Extinguisher | Annual | Fire | Extinguisher service |
| Backflow | Annual | Plumbing | Backflow certification |
| Generator PM | Semi-annual | Electrical | Generator maintenance |

## Scheduling Rules
1. Schedule 2-4 weeks in advance
2. Confirm 48 hours before
3. Respect customer preferences (AM/PM)
4. Bundle multi-trade visits when possible
5. Prioritize compliance deadlines

## Compliance Deadlines
- NFPA 25: Quarterly/annual (fire sprinklers)
- EPA 608: Log refrigerant within 30 days
- Backflow: Annual per local utility
- Fire extinguisher: Annual inspection
"""

TOOLS = [
    {
        "name": "get_upcoming_pm_visits",
        "description": "Get list of preventive maintenance visits due",
        "input_schema": {
            "type": "object",
            "properties": {
                "days_ahead": {"type": "integer", "description": "How many days to look ahead"},
                "trade": {"type": "string", "enum": ["HVAC", "Plumbing", "Electrical", "Fire", "all"]},
                "service_plan_type": {"type": "string", "description": "Specific service plan to filter"}
            }
        }
    },
    {
        "name": "schedule_pm_visit",
        "description": "Schedule a PM visit for a customer",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "service_plan_id": {"type": "string"},
                "preferred_date": {"type": "string"},
                "time_window": {"type": "string", "enum": ["morning", "afternoon", "anytime"]},
                "technician_id": {"type": "string"}
            },
            "required": ["customer_id", "service_plan_id", "preferred_date"]
        }
    },
    {
        "name": "send_appointment_reminder",
        "description": "Send appointment reminder/confirmation",
        "input_schema": {
            "type": "object",
            "properties": {
                "appointment_id": {"type": "string"},
                "reminder_type": {"type": "string", "enum": ["initial_schedule", "48_hour_reminder", "day_of_reminder", "on_the_way"]},
                "channel": {"type": "string", "enum": ["email", "sms", "both"]}
            },
            "required": ["appointment_id", "reminder_type"]
        }
    },
    {
        "name": "check_compliance_deadlines",
        "description": "Check for upcoming compliance deadlines",
        "input_schema": {
            "type": "object",
            "properties": {
                "compliance_type": {"type": "string", "enum": ["NFPA_25", "EPA_608", "backflow", "fire_extinguisher", "all"]},
                "days_until_due": {"type": "integer"}
            }
        }
    },
    {
        "name": "optimize_route",
        "description": "Optimize technician route for a day of PM visits",
        "input_schema": {
            "type": "object",
            "properties": {
                "technician_id": {"type": "string"},
                "date": {"type": "string"},
                "appointments": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["technician_id", "date"]
        }
    }
]


@dataclass
class PMSchedulerAgent:
    """PM Scheduler agent for maintenance scheduling."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.conversation: List[Dict] = []

    async def schedule_visits(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule PM visits based on request."""
        prompt = f"""Schedule preventive maintenance visits:

Request Type: {request.get('type', 'upcoming_due')}
Trade: {request.get('trade', 'all')}
Date Range: {request.get('date_range', 'Next 30 days')}
Priority: {request.get('priority', 'normal')}

{request.get('additional_context', '')}

Please identify visits that need scheduling and create appointments."""

        self.conversation.append({"role": "user", "content": prompt})

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=self.conversation
        )

        result = {"plan": "", "appointments_created": []}

        for block in response.content:
            if block.type == "text":
                result["plan"] = block.text
            elif block.type == "tool_use":
                result["appointments_created"].append({
                    "tool": block.name,
                    "input": block.input
                })

        return result


async def main():
    """Test PM scheduler agent."""
    agent = PMSchedulerAgent()

    request = {
        "type": "upcoming_due",
        "trade": "HVAC",
        "date_range": "Next 14 days",
        "priority": "high",
        "additional_context": "End of month - need to complete all January PM visits"
    }

    result = await agent.schedule_visits(request)
    print("PM Schedule Plan:")
    print(result["plan"])


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
