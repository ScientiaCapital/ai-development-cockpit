#!/usr/bin/env python3
"""
Kipper Energy Solutions - Modern Chat UI
=========================================

FastAPI-based chat interface with Coperniq GraphQL integration.
Inspired by LobeChat/Manus AI design patterns.

Features:
- Real-time chat with Claude AI
- Coperniq API integration (contacts, work orders, assets)
- Agent status dashboard
- Voice AI call monitoring
- Modern, responsive design

Run: uvicorn chat_ui.main:app --reload --port 8000
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
import anthropic

load_dotenv()

# =============================================================================
# Models
# =============================================================================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class AgentStatus(BaseModel):
    name: str
    status: str  # "online", "busy", "offline"
    active_tasks: int = 0
    last_activity: Optional[str] = None

class WorkOrder(BaseModel):
    id: str
    title: str
    status: str
    trade: str
    customer: str
    scheduled_date: Optional[str] = None

# =============================================================================
# Coperniq GraphQL Client
# =============================================================================

class CoperniqClient:
    """GraphQL client for Coperniq API."""

    def __init__(self):
        self.api_url = os.getenv("COPERNIQ_API_URL", "https://api.coperniq.io/graphql")
        self.api_key = os.getenv("COPERNIQ_API_KEY", "")
        self.instance_id = os.getenv("COPERNIQ_INSTANCE_ID", "388")

    async def query(self, query: str, variables: Dict = None) -> Dict[str, Any]:
        """Execute a GraphQL query."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Instance-ID": self.instance_id
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.api_url,
                    json={"query": query, "variables": variables or {}},
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"errors": [{"message": str(e)}]}

    async def get_contacts(self, limit: int = 10) -> List[Dict]:
        """Get recent contacts from Coperniq."""
        query = """
        query GetContacts($limit: Int!) {
            contacts(first: $limit, orderBy: CREATED_AT_DESC) {
                nodes {
                    id
                    name
                    email
                    phone
                    companyName
                    createdAt
                }
            }
        }
        """
        result = await self.query(query, {"limit": limit})
        if "data" in result and result["data"]:
            return result["data"].get("contacts", {}).get("nodes", [])
        return []

    async def get_work_orders(self, limit: int = 10) -> List[Dict]:
        """Get recent work orders (Tasks in Coperniq)."""
        query = """
        query GetTasks($limit: Int!) {
            tasks(first: $limit, orderBy: CREATED_AT_DESC) {
                nodes {
                    id
                    title
                    status
                    priority
                    createdAt
                    scheduledDate
                }
            }
        }
        """
        result = await self.query(query, {"limit": limit})
        if "data" in result and result["data"]:
            return result["data"].get("tasks", {}).get("nodes", [])
        return []

    async def get_assets(self, limit: int = 10) -> List[Dict]:
        """Get assets from Coperniq."""
        query = """
        query GetAssets($limit: Int!) {
            assets(first: $limit, orderBy: CREATED_AT_DESC) {
                nodes {
                    id
                    make
                    model
                    serialNumber
                    installDate
                    warrantyEnd
                }
            }
        }
        """
        result = await self.query(query, {"limit": limit})
        if "data" in result and result["data"]:
            return result["data"].get("assets", {}).get("nodes", [])
        return []

# =============================================================================
# Chat Manager
# =============================================================================

class ChatManager:
    """Manages chat conversations with Claude."""

    SYSTEM_PROMPT = """You are the AI assistant for Kipper Energy Solutions, a multi-trade MEP contractor serving Alabama, Georgia, Florida, and Tennessee.

## Your Capabilities
You have access to real-time data from our Coperniq system including:
- Customer contacts and accounts
- Work orders and service calls
- Equipment assets and warranties
- Service plans and schedules

## Services We Offer
- **HVAC**: Air conditioning, heating, heat pumps, ductwork
- **Plumbing**: Repairs, water heaters, backflow testing
- **Electrical**: Panel upgrades, generators, EV chargers
- **Solar**: Installation, battery storage, maintenance
- **Fire Protection**: Sprinkler inspection, alarm testing

## How to Help
1. Schedule service appointments
2. Look up customer information
3. Check work order status
4. Provide pricing estimates
5. Answer service questions
6. Explain service plans (Bronze/Silver/Gold)

## Guidelines
- Be professional but friendly
- Verify customer identity before sharing account details
- For emergencies, recommend calling our 24/7 line
- Mention service plan upgrades when relevant

## Company Info
- Instance: Coperniq #388
- Office Hours: Mon-Fri 7am-6pm, Sat 8am-2pm
- Emergency: 24/7 available
"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.client = anthropic.Anthropic(api_key=api_key) if api_key else None
        self.conversations: Dict[str, List[Dict]] = {}
        self.coperniq = CoperniqClient()

    async def chat(self, conversation_id: str, message: str) -> str:
        """Process a chat message and return response."""
        if not self.client:
            return "AI assistant not configured. Please set ANTHROPIC_API_KEY."

        # Initialize or get conversation
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []

        # Add user message
        self.conversations[conversation_id].append({
            "role": "user",
            "content": message
        })

        try:
            # Check if user is asking about data we can fetch
            context = await self._get_context_for_query(message)

            # Build messages with context
            messages = self.conversations[conversation_id].copy()
            if context:
                # Inject context into the latest user message
                messages[-1]["content"] = f"{message}\n\n[System Context: {context}]"

            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=self.SYSTEM_PROMPT,
                messages=messages
            )

            assistant_response = response.content[0].text

            # Add assistant response to history
            self.conversations[conversation_id].append({
                "role": "assistant",
                "content": assistant_response
            })

            return assistant_response

        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"

    async def _get_context_for_query(self, message: str) -> str:
        """Fetch relevant context from Coperniq based on query."""
        message_lower = message.lower()
        context_parts = []

        # Check for customer-related queries
        if any(word in message_lower for word in ["customer", "contact", "client", "account"]):
            contacts = await self.coperniq.get_contacts(5)
            if contacts:
                context_parts.append(f"Recent contacts: {json.dumps(contacts[:3], default=str)}")

        # Check for work order queries
        if any(word in message_lower for word in ["work order", "service call", "job", "task", "appointment"]):
            work_orders = await self.coperniq.get_work_orders(5)
            if work_orders:
                context_parts.append(f"Recent work orders: {json.dumps(work_orders[:3], default=str)}")

        # Check for asset/equipment queries
        if any(word in message_lower for word in ["equipment", "asset", "unit", "system", "hvac", "ac"]):
            assets = await self.coperniq.get_assets(5)
            if assets:
                context_parts.append(f"Recent assets: {json.dumps(assets[:3], default=str)}")

        return " | ".join(context_parts) if context_parts else ""

# =============================================================================
# Agent Dashboard
# =============================================================================

class AgentDashboard:
    """Tracks status of AI agents."""

    def __init__(self):
        self.agents = {
            "voice-ai": AgentStatus(
                name="Voice AI",
                status="online",
                active_tasks=0,
                last_activity=datetime.now().isoformat()
            ),
            "dispatch": AgentStatus(
                name="Dispatch",
                status="online",
                active_tasks=0,
                last_activity=datetime.now().isoformat()
            ),
            "collections": AgentStatus(
                name="Collections",
                status="online",
                active_tasks=0,
                last_activity=datetime.now().isoformat()
            ),
            "pm-scheduler": AgentStatus(
                name="PM Scheduler",
                status="online",
                active_tasks=0,
                last_activity=datetime.now().isoformat()
            ),
            "quote-builder": AgentStatus(
                name="Quote Builder",
                status="online",
                active_tasks=0,
                last_activity=datetime.now().isoformat()
            )
        }

    def get_all_status(self) -> List[AgentStatus]:
        return list(self.agents.values())

    def update_status(self, agent_id: str, status: str, active_tasks: int = 0):
        if agent_id in self.agents:
            self.agents[agent_id].status = status
            self.agents[agent_id].active_tasks = active_tasks
            self.agents[agent_id].last_activity = datetime.now().isoformat()

# =============================================================================
# FastAPI App
# =============================================================================

chat_manager = ChatManager()
agent_dashboard = AgentDashboard()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    print("🚀 Kipper Energy Solutions Chat UI starting...")
    yield
    print("👋 Chat UI shutting down...")

app = FastAPI(
    title="Kipper Energy Solutions Chat",
    description="AI-powered chat interface for MEP contractor operations",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# API Routes
# =============================================================================

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    """Serve the modern chat UI."""
    return get_chat_html()

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest) -> JSONResponse:
    """Process a chat message."""
    conversation_id = request.conversation_id or "default"
    response = await chat_manager.chat(conversation_id, request.message)
    return JSONResponse({
        "response": response,
        "conversation_id": conversation_id,
        "timestamp": datetime.now().isoformat()
    })

@app.get("/api/agents")
async def get_agents() -> JSONResponse:
    """Get status of all AI agents."""
    agents = agent_dashboard.get_all_status()
    return JSONResponse({
        "agents": [agent.model_dump() for agent in agents]
    })

@app.get("/api/work-orders")
async def get_work_orders() -> JSONResponse:
    """Get recent work orders from Coperniq."""
    coperniq = CoperniqClient()
    work_orders = await coperniq.get_work_orders(10)
    return JSONResponse({"work_orders": work_orders})

@app.get("/api/contacts")
async def get_contacts() -> JSONResponse:
    """Get recent contacts from Coperniq."""
    coperniq = CoperniqClient()
    contacts = await coperniq.get_contacts(10)
    return JSONResponse({"contacts": contacts})

@app.get("/api/assets")
async def get_assets() -> JSONResponse:
    """Get recent assets from Coperniq."""
    coperniq = CoperniqClient()
    assets = await coperniq.get_assets(10)
    return JSONResponse({"assets": assets})

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time chat."""
    await websocket.accept()
    conversation_id = f"ws_{datetime.now().timestamp()}"

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            response = await chat_manager.chat(conversation_id, message["content"])

            await websocket.send_json({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.now().isoformat()
            })
    except WebSocketDisconnect:
        pass

# =============================================================================
# Modern Chat UI HTML (XSS-Safe)
# =============================================================================

def get_chat_html() -> str:
    """Return the modern chat UI HTML with XSS-safe JavaScript."""
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kipper Energy Solutions AI</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0ea5e9;
            --primary-dark: #0284c7;
            --bg-dark: #0f172a;
            --bg-card: #1e293b;
            --bg-input: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --border: #334155;
            --success: #22c55e;
            --warning: #f59e0b;
            --error: #ef4444;
            --radius: 12px;
            --radius-sm: 8px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
        }

        /* Sidebar */
        .sidebar {
            width: 280px;
            background: var(--bg-card);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 20px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 20px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .logo-text h1 {
            font-size: 16px;
            font-weight: 600;
        }

        .logo-text span {
            font-size: 12px;
            color: var(--text-muted);
        }

        /* Agent Dashboard */
        .section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            margin-bottom: 12px;
        }

        .agents-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
        }

        .agent-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: var(--bg-input);
            border-radius: var(--radius-sm);
            transition: background 0.2s;
        }

        .agent-item:hover {
            background: #3b4a5f;
        }

        .agent-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .agent-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .agent-name {
            font-size: 13px;
            font-weight: 500;
        }

        .agent-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: var(--text-secondary);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .status-dot.online { background: var(--success); }
        .status-dot.busy { background: var(--warning); }
        .status-dot.offline { background: var(--error); }

        /* Quick Actions */
        .quick-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
        }

        .action-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: var(--bg-input);
            border-color: var(--primary);
        }

        /* Stats */
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: auto;
        }

        .stat-card {
            background: var(--bg-input);
            border-radius: var(--radius-sm);
            padding: 12px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 600;
        }

        .stat-label {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        /* Main Chat Area */
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        /* Header */
        .header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .header-title {
            font-size: 18px;
            font-weight: 600;
        }

        .header-subtitle {
            font-size: 13px;
            color: var(--text-muted);
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .icon-btn {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-sm);
            background: var(--bg-input);
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .icon-btn:hover {
            background: var(--border);
            color: var(--text-primary);
        }

        /* Messages */
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .message {
            display: flex;
            gap: 12px;
            max-width: 80%;
        }

        .message.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }

        .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .message.assistant .message-avatar {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        }

        .message.user .message-avatar {
            background: var(--bg-input);
        }

        .message-content {
            background: var(--bg-card);
            padding: 12px 16px;
            border-radius: var(--radius);
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .message.user .message-content {
            background: var(--primary);
        }

        .message-time {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        /* Welcome State */
        .welcome {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
        }

        .welcome-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            margin-bottom: 24px;
        }

        .welcome h2 {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .welcome p {
            color: var(--text-secondary);
            max-width: 400px;
            margin-bottom: 24px;
        }

        .suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }

        .suggestion {
            padding: 8px 16px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .suggestion:hover {
            border-color: var(--primary);
            background: var(--bg-input);
        }

        /* Input Area */
        .input-area {
            padding: 16px 24px 24px;
            background: var(--bg-dark);
        }

        .input-container {
            display: flex;
            gap: 12px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 12px 16px;
            transition: border-color 0.2s;
        }

        .input-container:focus-within {
            border-color: var(--primary);
        }

        .input-container input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
        }

        .input-container input::placeholder {
            color: var(--text-muted);
        }

        .send-btn {
            width: 36px;
            height: 36px;
            background: var(--primary);
            border: none;
            border-radius: var(--radius-sm);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .send-btn:hover {
            background: var(--primary-dark);
        }

        .send-btn:disabled {
            background: var(--bg-input);
            cursor: not-allowed;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 12px;
            font-size: 11px;
            color: var(--text-muted);
            border-top: 1px solid var(--border);
        }

        /* Loading */
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 8px 16px;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            background: var(--text-muted);
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-8px); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar { display: none; }
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="logo">
            <div class="logo-icon">⚡</div>
            <div class="logo-text">
                <h1>Kipper Energy</h1>
                <span>Instance 388</span>
            </div>
        </div>

        <div class="section-title">AI Agents</div>
        <div class="agents-list" id="agents-list"></div>

        <div class="section-title">Quick Actions</div>
        <div class="quick-actions" id="quick-actions"></div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="active-calls">0</div>
                <div class="stat-label">Active Calls</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="open-wos">0</div>
                <div class="stat-label">Open WOs</div>
            </div>
        </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="main">
        <header class="header">
            <div>
                <div class="header-title">AI Assistant</div>
                <div class="header-subtitle">Powered by Claude • Coperniq Instance 388</div>
            </div>
            <div class="header-actions">
                <button class="icon-btn" id="clear-btn" title="New Chat">🗑️</button>
                <button class="icon-btn" id="refresh-btn" title="Refresh">🔄</button>
            </div>
        </header>

        <div class="messages" id="messages">
            <!-- Welcome state -->
            <div class="welcome" id="welcome">
                <div class="welcome-icon">⚡</div>
                <h2>Welcome to Kipper Energy AI</h2>
                <p>I\'m your AI assistant for scheduling services, checking work orders, getting pricing estimates, and more.</p>
                <div class="suggestions" id="suggestions"></div>
            </div>
        </div>

        <div class="input-area">
            <div class="input-container">
                <input
                    type="text"
                    id="chat-input"
                    placeholder="Ask about services, scheduling, pricing..."
                >
                <button class="send-btn" id="send-btn">➤</button>
            </div>
        </div>

        <div class="footer">
            HVAC • Plumbing • Electrical • Solar • Fire Protection | Serving AL, GA, FL, TN
        </div>
    </main>

    <script>
        // DOM Elements
        const messagesEl = document.getElementById('messages');
        const welcomeEl = document.getElementById('welcome');
        const inputEl = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const clearBtn = document.getElementById('clear-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        const agentsListEl = document.getElementById('agents-list');
        const quickActionsEl = document.getElementById('quick-actions');
        const suggestionsEl = document.getElementById('suggestions');

        let conversationId = 'chat_' + Date.now();
        let isLoading = false;

        // Agent data
        const agents = [
            { id: 'voice-ai', name: 'Voice AI', icon: '📞', color: '#3b82f6', status: 'online' },
            { id: 'dispatch', name: 'Dispatch', icon: '🚚', color: '#22c55e', status: 'online' },
            { id: 'collections', name: 'Collections', icon: '💰', color: '#f59e0b', status: 'online' },
            { id: 'pm-scheduler', name: 'PM Scheduler', icon: '📅', color: '#8b5cf6', status: 'online' },
            { id: 'quote-builder', name: 'Quote Builder', icon: '📋', color: '#ec4899', status: 'online' }
        ];

        // Quick actions
        const quickActions = [
            { icon: '📅', text: 'Schedule Service', query: 'Schedule a service call' },
            { icon: '💰', text: 'Get Pricing', query: 'Get pricing estimate' },
            { icon: '📍', text: 'Service Area', query: 'Check service area' },
            { icon: '📋', text: 'Work Orders', query: 'View my work orders' }
        ];

        // Suggestions
        const suggestionItems = [
            { icon: '📅', text: 'Schedule HVAC', query: 'Schedule an HVAC service call' },
            { icon: '📋', text: 'Service Plans', query: 'What are your service plans?' },
            { icon: '📍', text: 'Service Area', query: 'Do you service my area?' },
            { icon: '💰', text: 'Pricing', query: 'Get a pricing estimate' }
        ];

        // Initialize UI
        function initUI() {
            // Render agents
            agents.forEach(agent => {
                const item = document.createElement('div');
                item.className = 'agent-item';

                const info = document.createElement('div');
                info.className = 'agent-info';

                const iconEl = document.createElement('div');
                iconEl.className = 'agent-icon';
                iconEl.style.background = agent.color;
                iconEl.textContent = agent.icon;

                const nameEl = document.createElement('span');
                nameEl.className = 'agent-name';
                nameEl.textContent = agent.name;

                info.appendChild(iconEl);
                info.appendChild(nameEl);

                const statusEl = document.createElement('div');
                statusEl.className = 'agent-status';

                const dot = document.createElement('span');
                dot.className = 'status-dot ' + agent.status;

                const statusText = document.createTextNode(agent.status === 'online' ? 'Online' : 'Ready');

                statusEl.appendChild(dot);
                statusEl.appendChild(statusText);

                item.appendChild(info);
                item.appendChild(statusEl);
                agentsListEl.appendChild(item);
            });

            // Render quick actions
            quickActions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'action-btn';
                btn.textContent = action.icon + ' ' + action.text;
                btn.addEventListener('click', () => sendSuggestion(action.query));
                quickActionsEl.appendChild(btn);
            });

            // Render suggestions
            suggestionItems.forEach(item => {
                const btn = document.createElement('div');
                btn.className = 'suggestion';
                btn.textContent = item.icon + ' ' + item.text;
                btn.addEventListener('click', () => sendSuggestion(item.query));
                suggestionsEl.appendChild(btn);
            });
        }

        // Send message
        async function sendMessage() {
            const message = inputEl.value.trim();
            if (!message || isLoading) return;

            // Hide welcome
            welcomeEl.style.display = 'none';

            // Add user message
            addMessage('user', message);
            inputEl.value = '';

            // Show typing indicator
            isLoading = true;
            sendBtn.disabled = true;
            const typingEl = addTypingIndicator();

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        conversation_id: conversationId
                    })
                });

                const data = await response.json();
                typingEl.remove();
                addMessage('assistant', data.response);

            } catch (error) {
                typingEl.remove();
                addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            }

            isLoading = false;
            sendBtn.disabled = false;
        }

        // Add message to UI (XSS-safe using textContent)
        function addMessage(role, content) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message ' + role;

            const avatarEl = document.createElement('div');
            avatarEl.className = 'message-avatar';
            avatarEl.textContent = role === 'assistant' ? '⚡' : '👤';

            const wrapperEl = document.createElement('div');

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            contentEl.textContent = content;  // XSS-safe: using textContent

            const timeEl = document.createElement('div');
            timeEl.className = 'message-time';
            timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            wrapperEl.appendChild(contentEl);
            wrapperEl.appendChild(timeEl);

            messageEl.appendChild(avatarEl);
            messageEl.appendChild(wrapperEl);

            messagesEl.appendChild(messageEl);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        // Add typing indicator
        function addTypingIndicator() {
            const el = document.createElement('div');
            el.className = 'message assistant';

            const avatarEl = document.createElement('div');
            avatarEl.className = 'message-avatar';
            avatarEl.textContent = '⚡';

            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';

            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'typing-dot';
                indicator.appendChild(dot);
            }

            el.appendChild(avatarEl);
            el.appendChild(indicator);
            messagesEl.appendChild(el);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return el;
        }

        // Send suggestion
        function sendSuggestion(text) {
            inputEl.value = text;
            sendMessage();
        }

        // Clear chat
        function clearChat() {
            conversationId = 'chat_' + Date.now();
            // Remove all messages except welcome
            const messages = messagesEl.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            welcomeEl.style.display = 'flex';
        }

        // Refresh data
        async function refreshData() {
            try {
                const response = await fetch('/api/agents');
                const data = await response.json();
                console.log('Agents:', data.agents);
            } catch (error) {
                console.error('Error refreshing:', error);
            }
        }

        // Event listeners
        sendBtn.addEventListener('click', sendMessage);
        clearBtn.addEventListener('click', clearChat);
        refreshBtn.addEventListener('click', refreshData);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Initialize
        initUI();
        refreshData();
    </script>
</body>
</html>
'''

# =============================================================================
# Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
