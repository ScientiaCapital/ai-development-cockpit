#!/usr/bin/env python3
"""
Voice AI Server for Kipper Energy Solutions - Instance 388
============================================================

Architecture:
- Twilio ConversationRelay → WebSocket → Claude API
- STT: Deepgram Nova-3 (via ConversationRelay)
- TTS: Cartesia Sonic (via ConversationRelay)
- LLM: Claude Sonnet 4 for reasoning + tool use

Endpoints:
- /ws/voice - WebSocket for ConversationRelay
- /voice/inbound - Twilio webhook for inbound calls
- /voice/outbound - API to initiate outbound calls
- /voice/status - Call status webhook

Requirements:
    pip install fastapi uvicorn websockets anthropic httpx python-dotenv twilio
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import anthropic
import httpx

# Load environment variables
load_dotenv()

# =============================================================================
# Configuration
# =============================================================================

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
COPERNIQ_API_KEY = os.getenv("COPERNIQ_API_KEY")
COPERNIQ_INSTANCE = os.getenv("COPERNIQ_COMPANY_ID", "388")

# Voice AI System Prompt for MEP Contractor
SYSTEM_PROMPT = """You are a friendly, professional AI assistant for Kipper Energy Solutions, a multi-trade MEP contractor in the Southeast United States.

## Your Capabilities
- Schedule service appointments (HVAC, Plumbing, Electrical, Solar, Fire Protection)
- Answer questions about our services and service areas
- Take emergency service requests with high priority
- Provide estimated arrival times and pricing ranges
- Transfer to a human technician when needed

## Service Trades
- HVAC: AC repair, furnace service, duct cleaning, heat pumps
- Plumbing: Leak repair, water heater, backflow testing, drain cleaning
- Electrical: Panel upgrades, generator installation, EV chargers
- Solar: System maintenance, battery storage, production monitoring
- Fire Protection: Sprinkler inspection, alarm testing, extinguisher service

## Important Guidelines
1. Always confirm the service address before scheduling
2. For emergencies (gas leak, flooding, no heat/AC), escalate immediately
3. Spell out numbers when speaking (e.g., "two-fifty" not "250")
4. Be concise - phone conversations should be efficient
5. If unsure, offer to have a technician call back

## Company Info
- Service area: Alabama, Georgia, Florida, Tennessee
- Emergency line: Available 24/7
- Office hours: Monday-Friday 7am-6pm, Saturday 8am-2pm
"""

# Tool definitions for Claude
TOOLS = [
    {
        "name": "schedule_service_call",
        "description": "Schedule a service appointment for a customer. Use when customer wants to book a service visit.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_name": {
                    "type": "string",
                    "description": "Customer's full name"
                },
                "phone": {
                    "type": "string",
                    "description": "Customer phone number"
                },
                "service_address": {
                    "type": "string",
                    "description": "Full service address including city and state"
                },
                "trade": {
                    "type": "string",
                    "enum": ["HVAC", "Plumbing", "Electrical", "Solar", "Fire Protection"],
                    "description": "Service trade category"
                },
                "issue_description": {
                    "type": "string",
                    "description": "Brief description of the issue or service needed"
                },
                "is_emergency": {
                    "type": "boolean",
                    "description": "True if this is an emergency requiring same-day service"
                },
                "preferred_date": {
                    "type": "string",
                    "description": "Preferred appointment date (YYYY-MM-DD format)"
                },
                "preferred_time": {
                    "type": "string",
                    "enum": ["morning", "afternoon", "anytime"],
                    "description": "Preferred time window"
                }
            },
            "required": ["customer_name", "service_address", "trade", "issue_description"]
        }
    },
    {
        "name": "check_service_area",
        "description": "Check if an address is within our service area",
        "input_schema": {
            "type": "object",
            "properties": {
                "zip_code": {
                    "type": "string",
                    "description": "5-digit ZIP code to check"
                },
                "city": {
                    "type": "string",
                    "description": "City name"
                },
                "state": {
                    "type": "string",
                    "description": "2-letter state code"
                }
            },
            "required": ["state"]
        }
    },
    {
        "name": "get_pricing_estimate",
        "description": "Get a rough pricing estimate for a service type",
        "input_schema": {
            "type": "object",
            "properties": {
                "service_type": {
                    "type": "string",
                    "description": "Type of service (e.g., 'AC tune-up', 'water heater replacement')"
                },
                "trade": {
                    "type": "string",
                    "enum": ["HVAC", "Plumbing", "Electrical", "Solar", "Fire Protection"]
                }
            },
            "required": ["service_type", "trade"]
        }
    },
    {
        "name": "escalate_to_human",
        "description": "Transfer the call to a human representative. Use for emergencies or complex issues.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Why the call is being transferred"
                },
                "priority": {
                    "type": "string",
                    "enum": ["normal", "urgent", "emergency"],
                    "description": "Priority level"
                },
                "customer_info": {
                    "type": "string",
                    "description": "Summary of customer and issue for handoff"
                }
            },
            "required": ["reason", "priority"]
        }
    },
    {
        "name": "log_call_disposition",
        "description": "Log the outcome of a call for CRM records",
        "input_schema": {
            "type": "object",
            "properties": {
                "disposition": {
                    "type": "string",
                    "enum": ["appointment_scheduled", "information_provided", "transferred_to_human",
                             "customer_callback_requested", "wrong_number", "spam"],
                    "description": "Call outcome"
                },
                "notes": {
                    "type": "string",
                    "description": "Additional notes about the call"
                },
                "follow_up_required": {
                    "type": "boolean",
                    "description": "Whether follow-up is needed"
                }
            },
            "required": ["disposition"]
        }
    }
]

# =============================================================================
# Logging Setup
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("voice_ai")

# =============================================================================
# Tool Execution Functions
# =============================================================================

async def execute_tool(tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool and return the result."""

    if tool_name == "schedule_service_call":
        return await schedule_service_call(tool_input)
    elif tool_name == "check_service_area":
        return check_service_area(tool_input)
    elif tool_name == "get_pricing_estimate":
        return get_pricing_estimate(tool_input)
    elif tool_name == "escalate_to_human":
        return await escalate_to_human(tool_input)
    elif tool_name == "log_call_disposition":
        return await log_call_disposition(tool_input)
    else:
        return {"error": f"Unknown tool: {tool_name}"}


async def schedule_service_call(params: Dict[str, Any]) -> Dict[str, Any]:
    """Create a work order in Coperniq."""
    # In production, this would call Coperniq API
    # For now, return a confirmation
    confirmation_number = f"WO-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    is_emergency = params.get("is_emergency", False)
    trade = params.get("trade", "General")

    if is_emergency:
        response_time = "A technician will call you within 15 minutes"
    else:
        response_time = "A technician will contact you within 2 hours to confirm"

    return {
        "success": True,
        "confirmation_number": confirmation_number,
        "message": f"Service call scheduled for {trade}. {response_time}. Your confirmation number is {confirmation_number}.",
        "trade": trade,
        "is_emergency": is_emergency,
        "customer_name": params.get("customer_name"),
        "service_address": params.get("service_address")
    }


def check_service_area(params: Dict[str, Any]) -> Dict[str, Any]:
    """Check if location is in service area."""
    state = params.get("state", "").upper()

    # Kipper Energy Solutions service states
    service_states = ["AL", "GA", "FL", "TN"]

    if state in service_states:
        return {
            "in_service_area": True,
            "message": f"Great news! We service {state}. We can definitely help you."
        }
    else:
        return {
            "in_service_area": False,
            "message": f"Unfortunately, {state} is outside our current service area. We serve Alabama, Georgia, Florida, and Tennessee."
        }


def get_pricing_estimate(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get pricing estimate for service."""
    service_type = params.get("service_type", "").lower()
    trade = params.get("trade", "General")

    # Base pricing estimates
    estimates = {
        "HVAC": {
            "service call": "$89-$129 diagnostic fee",
            "ac tune-up": "$89-$149",
            "furnace tune-up": "$89-$129",
            "ac repair": "$150-$500+ depending on parts",
            "heat pump installation": "$5,000-$15,000",
            "ac installation": "$4,000-$12,000"
        },
        "Plumbing": {
            "service call": "$79-$119 diagnostic fee",
            "drain cleaning": "$99-$299",
            "water heater repair": "$150-$400",
            "water heater replacement": "$1,200-$3,500",
            "leak repair": "$150-$600"
        },
        "Electrical": {
            "service call": "$89-$149 diagnostic fee",
            "outlet repair": "$75-$200",
            "panel upgrade": "$1,500-$4,000",
            "ev charger installation": "$500-$2,500",
            "generator installation": "$5,000-$15,000"
        },
        "Solar": {
            "system inspection": "$150-$300",
            "panel cleaning": "$150-$400",
            "inverter replacement": "$1,500-$3,500",
            "battery installation": "$10,000-$25,000"
        },
        "Fire Protection": {
            "sprinkler inspection": "$150-$400",
            "alarm testing": "$100-$300",
            "extinguisher service": "$20-$50 per unit"
        }
    }

    trade_estimates = estimates.get(trade, {})

    for key, price in trade_estimates.items():
        if key in service_type:
            return {
                "estimate": price,
                "message": f"For {service_type}, typical pricing is {price}. Final price depends on specific conditions at your property.",
                "disclaimer": "This is an estimate. A technician will provide an exact quote on-site."
            }

    return {
        "estimate": "Varies",
        "message": f"For {service_type}, pricing varies based on the specific work needed. Our diagnostic fee for {trade} starts at $79-$149, which is waived if you proceed with the repair.",
        "disclaimer": "A technician will provide an exact quote after assessing the situation."
    }


async def escalate_to_human(params: Dict[str, Any]) -> Dict[str, Any]:
    """Transfer call to human representative."""
    priority = params.get("priority", "normal")
    reason = params.get("reason", "Customer request")

    if priority == "emergency":
        transfer_message = "I'm transferring you immediately to our emergency dispatch team. Please stay on the line."
    elif priority == "urgent":
        transfer_message = "I'm connecting you with a technician now. Please hold for just a moment."
    else:
        transfer_message = "Let me transfer you to one of our team members who can help you further."

    return {
        "success": True,
        "message": transfer_message,
        "transfer_initiated": True,
        "priority": priority,
        "reason": reason
    }


async def log_call_disposition(params: Dict[str, Any]) -> Dict[str, Any]:
    """Log call outcome to CRM."""
    disposition = params.get("disposition", "unknown")
    notes = params.get("notes", "")

    logger.info(f"Call disposition logged: {disposition} - {notes}")

    return {
        "success": True,
        "logged": True,
        "disposition": disposition,
        "timestamp": datetime.now().isoformat()
    }

# =============================================================================
# Voice AI Session Manager
# =============================================================================

class VoiceAISession:
    """Manages a single voice conversation session."""

    def __init__(self, call_sid: str):
        self.call_sid = call_sid
        self.conversation: List[Dict[str, Any]] = []
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.started_at = datetime.now()
        self.call_disposition = None

    async def process_message(self, user_message: str) -> str:
        """Process user message and return AI response."""

        # Add user message to conversation
        self.conversation.append({
            "role": "user",
            "content": user_message
        })

        # Call Claude API
        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=self.conversation
            )

            # Process response
            assistant_content = []
            text_response = ""

            for block in response.content:
                if block.type == "text":
                    text_response = block.text
                    assistant_content.append({"type": "text", "text": block.text})

                elif block.type == "tool_use":
                    # Execute the tool
                    tool_result = await execute_tool(block.name, block.input)

                    # Add tool use to conversation
                    assistant_content.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input
                    })

                    # Add assistant message with tool use
                    self.conversation.append({
                        "role": "assistant",
                        "content": assistant_content
                    })

                    # Add tool result
                    self.conversation.append({
                        "role": "user",
                        "content": [{
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(tool_result)
                        }]
                    })

                    # Get follow-up response from Claude
                    follow_up = self.client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=1024,
                        system=SYSTEM_PROMPT,
                        tools=TOOLS,
                        messages=self.conversation
                    )

                    for fb in follow_up.content:
                        if fb.type == "text":
                            text_response = fb.text
                            self.conversation.append({
                                "role": "assistant",
                                "content": [{"type": "text", "text": fb.text}]
                            })
                            break

                    return text_response

            # If no tool was used, add text response to conversation
            if assistant_content:
                self.conversation.append({
                    "role": "assistant",
                    "content": assistant_content
                })

            return text_response

        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return "I apologize, but I'm having technical difficulties. Let me transfer you to a team member."

# =============================================================================
# FastAPI Application
# =============================================================================

# Store active sessions
active_sessions: Dict[str, VoiceAISession] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Voice AI Server starting up...")
    logger.info(f"Coperniq Instance: {COPERNIQ_INSTANCE}")
    logger.info(f"Twilio Phone: {TWILIO_PHONE_NUMBER}")
    yield
    logger.info("Voice AI Server shutting down...")

app = FastAPI(
    title="Kipper Energy Solutions Voice AI",
    description="AI-powered voice assistant for MEP contractor",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Kipper Energy Solutions Voice AI",
        "instance": COPERNIQ_INSTANCE,
        "active_calls": len(active_sessions)
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "components": {
            "anthropic_api": "configured" if ANTHROPIC_API_KEY else "missing",
            "twilio": "configured" if all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN]) else "missing",
            "coperniq": "configured" if COPERNIQ_API_KEY else "missing"
        },
        "active_sessions": len(active_sessions),
        "timestamp": datetime.now().isoformat()
    }


@app.websocket("/ws/voice/{call_sid}")
async def voice_websocket(websocket: WebSocket, call_sid: str):
    """
    WebSocket endpoint for Twilio ConversationRelay.

    Receives transcribed speech from Twilio, processes with Claude,
    and returns text for TTS.
    """
    await websocket.accept()
    logger.info(f"WebSocket connected for call: {call_sid}")

    # Create session
    session = VoiceAISession(call_sid)
    active_sessions[call_sid] = session

    try:
        # Send initial greeting
        greeting = "Hello, thank you for calling Kipper Energy Solutions. I'm your AI assistant. How can I help you today?"
        await websocket.send_json({
            "type": "text",
            "content": greeting
        })

        while True:
            # Receive message from Twilio
            data = await websocket.receive_json()

            if data.get("type") == "transcript":
                # User speech transcribed
                user_text = data.get("content", "")
                logger.info(f"[{call_sid}] User: {user_text}")

                # Process with Claude
                response_text = await session.process_message(user_text)
                logger.info(f"[{call_sid}] AI: {response_text}")

                # Send response back to Twilio for TTS
                await websocket.send_json({
                    "type": "text",
                    "content": response_text
                })

            elif data.get("type") == "hangup":
                # Call ended
                logger.info(f"[{call_sid}] Call ended")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for call: {call_sid}")
    except Exception as e:
        logger.error(f"Error in WebSocket: {e}")
    finally:
        # Clean up session
        if call_sid in active_sessions:
            del active_sessions[call_sid]


@app.post("/voice/inbound")
async def inbound_call(request: Request):
    """
    Twilio webhook for inbound calls.
    Returns TwiML to connect to ConversationRelay WebSocket.
    """
    from twilio.twiml.voice_response import VoiceResponse, Connect

    form_data = await request.form()
    call_sid = form_data.get("CallSid", "unknown")
    from_number = form_data.get("From", "unknown")

    logger.info(f"Inbound call received: {call_sid} from {from_number}")

    response = VoiceResponse()

    # Connect to ConversationRelay WebSocket
    connect = Connect()
    connect.conversationRelay(
        url=f"wss://{request.url.hostname}/ws/voice/{call_sid}",
        voice="Polly.Joanna-Neural",  # Use Amazon Polly neural voice
        language="en-US",
        transcriptionProvider="google",
        speechModel="phone_call"
    )
    response.append(connect)

    return response.to_xml()


@app.post("/voice/outbound")
async def initiate_outbound_call(
    to_number: str,
    reason: str = "service_follow_up",
    customer_name: Optional[str] = None
):
    """
    API endpoint to initiate outbound calls.
    """
    from twilio.rest import Client as TwilioClient

    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        raise HTTPException(status_code=500, detail="Twilio not configured")

    client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    try:
        call = client.calls.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            url=f"{os.getenv('BASE_URL', 'https://localhost:8000')}/voice/outbound-twiml",
            status_callback=f"{os.getenv('BASE_URL', 'https://localhost:8000')}/voice/status"
        )

        logger.info(f"Outbound call initiated: {call.sid} to {to_number}")

        return {
            "success": True,
            "call_sid": call.sid,
            "to_number": to_number,
            "reason": reason
        }

    except Exception as e:
        logger.error(f"Error initiating outbound call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/voice/status")
async def call_status(request: Request):
    """Webhook for call status updates."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    call_status = form_data.get("CallStatus")

    logger.info(f"Call {call_sid} status: {call_status}")

    return {"received": True}


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
