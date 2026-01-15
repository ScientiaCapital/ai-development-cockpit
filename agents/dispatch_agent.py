#!/usr/bin/env python3
"""
Dispatch Agent - Kipper Energy Solutions
=========================================

Assigns technicians to work orders based on:
- Trade certification match
- Geographic proximity
- Skill level
- Current workload
- Customer priority (emergency vs scheduled)

Integration Points:
- Coperniq API: Work orders, technicians, schedules
- Google Maps: Drive time calculation
- Voice AI: Receives calls, updates CRM
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from dotenv import load_dotenv
import anthropic

load_dotenv()

# =============================================================================
# Agent Configuration
# =============================================================================

AGENT_NAME = "Dispatch Agent"
AGENT_VERSION = "1.0.0"

SYSTEM_PROMPT = """You are the Dispatch Agent for Kipper Energy Solutions, a multi-trade MEP contractor.

## Your Role
Assign the right technician to work orders based on skills, location, and availability.

## Decision Factors (Priority Order)
1. **Emergency Priority**: Life-safety issues get immediate dispatch
2. **Trade Match**: Technician must have required certifications
3. **Geographic Proximity**: Minimize drive time
4. **Skill Level**: Match complexity to experience
5. **Workload Balance**: Distribute work fairly

## Technician Roster (Instance 388)
| Name | Trade | Certifications | Truck | Status |
|------|-------|----------------|-------|--------|
| James Wilson | HVAC Lead | EPA 608 Universal, NATE | #101 | Available |
| Carlos Martinez | HVAC Senior | EPA 608, VRF | #102 | Available |
| Ryan O'Brien | HVAC Installer | EPA 608, Ductwork | #103 | Available |
| Kevin Jackson | HVAC Apprentice | EPA 608 Type I | #104 | Available |
| Brian Taylor | Electrical Lead | Master Electrician, Solar | #201 | Available |
| Derek Williams | Electrical | Generator Certified | #202 | Available |
| Robert Anderson | Plumbing Lead | Master Plumber, Backflow | #301 | Available |
| Tony Nguyen | Plumbing | Medical Gas | #302 | Available |
| Steve Patterson | Fire Protection | NICET III, NFPA 25 | #401 | Available |
| Chris Lee | Low Voltage | ESA, Access Control | #402 | Available |

## Service Area
- Alabama (Mobile, Birmingham)
- Georgia (Atlanta, Savannah)
- Florida (Jacksonville, Pensacola)
- Tennessee (Nashville, Memphis)

## Emergency Types (Immediate Dispatch)
- Gas leak
- Flooding/water damage
- No heat (winter)
- No AC (summer, elderly/medical)
- Electrical fire risk
- Refrigeration failure (commercial food)

## Output Format
When assigning a technician, provide:
1. Recommended technician name and truck number
2. Reason for selection
3. Estimated arrival time
4. Any special instructions
"""

# Tool definitions
TOOLS = [
    {
        "name": "get_available_technicians",
        "description": "Get list of available technicians filtered by trade and location",
        "input_schema": {
            "type": "object",
            "properties": {
                "trade": {
                    "type": "string",
                    "enum": ["HVAC", "Plumbing", "Electrical", "Solar", "Fire Protection", "Low Voltage"],
                    "description": "Required trade for the work order"
                },
                "city": {
                    "type": "string",
                    "description": "City where service is needed"
                },
                "is_emergency": {
                    "type": "boolean",
                    "description": "Whether this is an emergency dispatch"
                }
            },
            "required": ["trade"]
        }
    },
    {
        "name": "assign_technician",
        "description": "Assign a specific technician to a work order",
        "input_schema": {
            "type": "object",
            "properties": {
                "work_order_id": {
                    "type": "string",
                    "description": "Work order ID to assign"
                },
                "technician_id": {
                    "type": "string",
                    "description": "Technician employee ID"
                },
                "estimated_arrival": {
                    "type": "string",
                    "description": "Expected arrival time (ISO format)"
                },
                "notes": {
                    "type": "string",
                    "description": "Special instructions for technician"
                }
            },
            "required": ["work_order_id", "technician_id"]
        }
    },
    {
        "name": "get_drive_time",
        "description": "Calculate drive time from technician location to job site",
        "input_schema": {
            "type": "object",
            "properties": {
                "from_location": {
                    "type": "string",
                    "description": "Starting address or GPS coordinates"
                },
                "to_location": {
                    "type": "string",
                    "description": "Destination address"
                }
            },
            "required": ["from_location", "to_location"]
        }
    },
    {
        "name": "check_technician_schedule",
        "description": "Get technician's current schedule and appointments",
        "input_schema": {
            "type": "object",
            "properties": {
                "technician_id": {
                    "type": "string",
                    "description": "Technician employee ID"
                },
                "date": {
                    "type": "string",
                    "description": "Date to check (YYYY-MM-DD)"
                }
            },
            "required": ["technician_id"]
        }
    },
    {
        "name": "send_dispatch_notification",
        "description": "Send notification to technician about new assignment",
        "input_schema": {
            "type": "object",
            "properties": {
                "technician_id": {
                    "type": "string",
                    "description": "Technician to notify"
                },
                "work_order_id": {
                    "type": "string",
                    "description": "Work order details"
                },
                "priority": {
                    "type": "string",
                    "enum": ["normal", "urgent", "emergency"],
                    "description": "Notification priority"
                },
                "message": {
                    "type": "string",
                    "description": "Custom message for technician"
                }
            },
            "required": ["technician_id", "work_order_id", "priority"]
        }
    }
]

# =============================================================================
# Mock Data (In production, this comes from Coperniq API)
# =============================================================================

TECHNICIANS = [
    {"id": "tech-101", "name": "James Wilson", "trade": "HVAC", "certifications": ["EPA 608 Universal", "NATE"], "truck": "#101", "status": "available", "location": "Mobile, AL"},
    {"id": "tech-102", "name": "Carlos Martinez", "trade": "HVAC", "certifications": ["EPA 608", "VRF"], "truck": "#102", "status": "available", "location": "Mobile, AL"},
    {"id": "tech-103", "name": "Ryan O'Brien", "trade": "HVAC", "certifications": ["EPA 608", "Ductwork"], "truck": "#103", "status": "en_route", "location": "Mobile, AL"},
    {"id": "tech-104", "name": "Kevin Jackson", "trade": "HVAC", "certifications": ["EPA 608 Type I"], "truck": "#104", "status": "available", "location": "Mobile, AL"},
    {"id": "tech-201", "name": "Brian Taylor", "trade": "Electrical", "certifications": ["Master Electrician", "Solar"], "truck": "#201", "status": "available", "location": "Atlanta, GA"},
    {"id": "tech-202", "name": "Derek Williams", "trade": "Electrical", "certifications": ["Generator"], "truck": "#202", "status": "available", "location": "Atlanta, GA"},
    {"id": "tech-301", "name": "Robert Anderson", "trade": "Plumbing", "certifications": ["Master Plumber", "Backflow"], "truck": "#301", "status": "available", "location": "Nashville, TN"},
    {"id": "tech-302", "name": "Tony Nguyen", "trade": "Plumbing", "certifications": ["Medical Gas"], "truck": "#302", "status": "available", "location": "Nashville, TN"},
    {"id": "tech-401", "name": "Steve Patterson", "trade": "Fire Protection", "certifications": ["NICET III", "NFPA 25"], "truck": "#401", "status": "available", "location": "Jacksonville, FL"},
    {"id": "tech-402", "name": "Chris Lee", "trade": "Low Voltage", "certifications": ["ESA", "Access Control"], "truck": "#402", "status": "available", "location": "Jacksonville, FL"},
]

# =============================================================================
# Tool Execution Functions
# =============================================================================

def get_available_technicians(trade: str, city: Optional[str] = None, is_emergency: bool = False) -> List[Dict]:
    """Get technicians matching criteria."""
    matching = [t for t in TECHNICIANS if t["trade"] == trade]

    if not is_emergency:
        matching = [t for t in matching if t["status"] == "available"]

    if city:
        # In production, sort by proximity
        pass

    return matching


def assign_technician(work_order_id: str, technician_id: str, estimated_arrival: Optional[str] = None, notes: Optional[str] = None) -> Dict:
    """Assign technician to work order."""
    tech = next((t for t in TECHNICIANS if t["id"] == technician_id), None)

    if not tech:
        return {"success": False, "error": f"Technician {technician_id} not found"}

    # In production, this updates Coperniq
    return {
        "success": True,
        "work_order_id": work_order_id,
        "technician": tech["name"],
        "truck": tech["truck"],
        "estimated_arrival": estimated_arrival or "Within 2 hours",
        "notes": notes
    }


def get_drive_time(from_location: str, to_location: str) -> Dict:
    """Calculate drive time (mock)."""
    # In production, use Google Maps API
    return {
        "from": from_location,
        "to": to_location,
        "duration_minutes": 35,
        "distance_miles": 22.5,
        "traffic": "moderate"
    }


def check_technician_schedule(technician_id: str, date: Optional[str] = None) -> Dict:
    """Get technician schedule (mock)."""
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    # Mock schedule
    return {
        "technician_id": technician_id,
        "date": date,
        "appointments": [
            {"time": "08:00", "type": "PM Visit", "address": "123 Main St"},
            {"time": "11:00", "type": "Service Call", "address": "456 Oak Ave"},
        ],
        "available_slots": ["14:00-18:00"]
    }


def send_dispatch_notification(technician_id: str, work_order_id: str, priority: str, message: Optional[str] = None) -> Dict:
    """Send notification to technician (mock)."""
    tech = next((t for t in TECHNICIANS if t["id"] == technician_id), None)

    return {
        "success": True,
        "technician": tech["name"] if tech else technician_id,
        "work_order_id": work_order_id,
        "priority": priority,
        "notification_sent": True,
        "channel": "SMS + App Push"
    }


# =============================================================================
# Dispatch Agent Class
# =============================================================================

@dataclass
class DispatchAgent:
    """Dispatch agent for technician assignment."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.conversation: List[Dict] = []

    async def dispatch(self, work_order: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main dispatch function - assigns technician to work order.

        Args:
            work_order: Work order details including trade, address, description, priority

        Returns:
            Assignment result with technician, ETA, and notes
        """
        # Build prompt from work order
        prompt = f"""New work order needs dispatch:

Work Order ID: {work_order.get('id', 'WO-NEW')}
Trade: {work_order.get('trade', 'General')}
Address: {work_order.get('address', 'Unknown')}
Description: {work_order.get('description', 'Service call')}
Priority: {work_order.get('priority', 'normal')}
Customer: {work_order.get('customer_name', 'Unknown')}
Phone: {work_order.get('phone', 'Not provided')}

Please recommend the best technician for this job and explain your reasoning."""

        self.conversation.append({"role": "user", "content": prompt})

        # Call Claude
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=self.conversation
        )

        # Process response and tool calls
        result = {"recommendation": "", "assignment": None}

        for block in response.content:
            if block.type == "text":
                result["recommendation"] = block.text

            elif block.type == "tool_use":
                tool_result = self._execute_tool(block.name, block.input)

                # Add to conversation for follow-up
                self.conversation.append({
                    "role": "assistant",
                    "content": [{"type": "tool_use", "id": block.id, "name": block.name, "input": block.input}]
                })
                self.conversation.append({
                    "role": "user",
                    "content": [{"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(tool_result)}]
                })

                if block.name == "assign_technician":
                    result["assignment"] = tool_result

        return result

    def _execute_tool(self, tool_name: str, tool_input: Dict) -> Dict:
        """Execute a tool by name."""
        if tool_name == "get_available_technicians":
            return get_available_technicians(**tool_input)
        elif tool_name == "assign_technician":
            return assign_technician(**tool_input)
        elif tool_name == "get_drive_time":
            return get_drive_time(**tool_input)
        elif tool_name == "check_technician_schedule":
            return check_technician_schedule(**tool_input)
        elif tool_name == "send_dispatch_notification":
            return send_dispatch_notification(**tool_input)
        else:
            return {"error": f"Unknown tool: {tool_name}"}


# =============================================================================
# CLI Testing
# =============================================================================

async def main():
    """Test the dispatch agent."""
    agent = DispatchAgent()

    # Test work order
    work_order = {
        "id": "WO-2026-0115-001",
        "trade": "HVAC",
        "address": "123 Main Street, Mobile, AL 36602",
        "description": "AC not cooling - unit running but warm air",
        "priority": "normal",
        "customer_name": "John Smith",
        "phone": "(251) 555-1234"
    }

    print(f"Dispatching work order: {work_order['id']}")
    print(f"Trade: {work_order['trade']}")
    print(f"Issue: {work_order['description']}")
    print("-" * 50)

    result = await agent.dispatch(work_order)

    print("\nAgent Recommendation:")
    print(result["recommendation"])

    if result.get("assignment"):
        print("\nAssignment Details:")
        print(json.dumps(result["assignment"], indent=2))


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
