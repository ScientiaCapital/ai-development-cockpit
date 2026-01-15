#!/usr/bin/env python3
"""
Kipper Energy Solutions - Chat UI
==================================

LangServe/Streamlit chat interface for Instance 388.

Features:
- Chat with AI assistant about MEP services
- Schedule appointments
- Get pricing estimates
- Check service area
- View agent dashboard

Run: streamlit run chat_ui/app.py
"""

import os
import streamlit as st
from datetime import datetime
from dotenv import load_dotenv
import anthropic

load_dotenv()

# =============================================================================
# Page Configuration
# =============================================================================

st.set_page_config(
    page_title="Kipper Energy Solutions AI",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    .main-header {
        color: #00d4ff;
        font-size: 2.5rem;
        font-weight: bold;
        text-align: center;
        padding: 1rem;
    }
    .sub-header {
        color: #a0a0a0;
        text-align: center;
        margin-bottom: 2rem;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }
    .user-message {
        background-color: #2d3a4a;
        border-left: 4px solid #00d4ff;
    }
    .assistant-message {
        background-color: #1f2937;
        border-left: 4px solid #10b981;
    }
    .sidebar-section {
        background-color: rgba(255,255,255,0.05);
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# =============================================================================
# System Prompt
# =============================================================================

SYSTEM_PROMPT = """You are a helpful AI assistant for Kipper Energy Solutions, a multi-trade MEP contractor serving Alabama, Georgia, Florida, and Tennessee.

## Services We Offer
- **HVAC**: Air conditioning, heating, heat pumps, ductwork
- **Plumbing**: Repairs, water heaters, backflow testing
- **Electrical**: Panel upgrades, generators, EV chargers
- **Solar**: Installation, battery storage, maintenance
- **Fire Protection**: Sprinkler inspection, alarm testing

## How You Can Help
1. Schedule service appointments
2. Provide pricing estimates
3. Answer questions about our services
4. Check if we service their area
5. Explain our service plans (Bronze/Silver/Gold)

## Important Guidelines
- Be professional but friendly
- Always confirm service address for appointments
- For emergencies, recommend calling our 24/7 line
- Mention our service plans when relevant

## Company Info
- Website: kipperenergy.com (fictional)
- Office Hours: Mon-Fri 7am-6pm, Sat 8am-2pm
- Emergency: 24/7 available
- Instance: Coperniq #388
"""

# =============================================================================
# Initialize Session State
# =============================================================================

if "messages" not in st.session_state:
    st.session_state.messages = []

if "client" not in st.session_state:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        st.session_state.client = anthropic.Anthropic(api_key=api_key)
    else:
        st.session_state.client = None

# =============================================================================
# Sidebar
# =============================================================================

with st.sidebar:
    st.markdown("### ⚡ Kipper Energy Solutions")
    st.markdown("##### Instance 388")

    st.divider()

    st.markdown("### 📊 Agent Dashboard")

    col1, col2 = st.columns(2)
    with col1:
        st.metric("Active Calls", "2", "↑1")
    with col2:
        st.metric("Open WOs", "12", "↓3")

    st.divider()

    st.markdown("### 🤖 Available Agents")
    agents = {
        "Voice AI": "🟢 Online",
        "Dispatch": "🟢 Ready",
        "Collections": "🟢 Ready",
        "PM Scheduler": "🟢 Ready",
        "Quote Builder": "🟢 Ready"
    }
    for agent, status in agents.items():
        st.markdown(f"- **{agent}**: {status}")

    st.divider()

    st.markdown("### 🛠️ Quick Actions")
    if st.button("📅 Schedule Service"):
        st.session_state.messages.append({
            "role": "user",
            "content": "I'd like to schedule a service appointment"
        })
        st.rerun()

    if st.button("💰 Get Pricing"):
        st.session_state.messages.append({
            "role": "user",
            "content": "Can you tell me about your pricing?"
        })
        st.rerun()

    if st.button("📍 Check Service Area"):
        st.session_state.messages.append({
            "role": "user",
            "content": "Do you service my area?"
        })
        st.rerun()

    if st.button("🗑️ Clear Chat"):
        st.session_state.messages = []
        st.rerun()

    st.divider()
    st.caption(f"v1.0.0 | {datetime.now().strftime('%Y-%m-%d %H:%M')}")

# =============================================================================
# Main Chat Interface
# =============================================================================

st.markdown('<h1 class="main-header">⚡ Kipper Energy Solutions</h1>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">AI-Powered MEP Contractor | Instance 388</p>', unsafe_allow_html=True)

# Display chat messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Chat input
if prompt := st.chat_input("How can I help you today?"):
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})

    with st.chat_message("user"):
        st.markdown(prompt)

    # Generate response
    with st.chat_message("assistant"):
        if st.session_state.client:
            with st.spinner("Thinking..."):
                try:
                    # Build message history for Claude
                    messages = [
                        {"role": m["role"], "content": m["content"]}
                        for m in st.session_state.messages
                    ]

                    response = st.session_state.client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=1024,
                        system=SYSTEM_PROMPT,
                        messages=messages
                    )

                    assistant_response = response.content[0].text
                    st.markdown(assistant_response)

                    # Add to history
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": assistant_response
                    })

                except Exception as e:
                    st.error(f"Error: {str(e)}")
        else:
            no_api_response = """I apologize, but I'm not fully configured yet.

To enable the AI assistant, please set the `ANTHROPIC_API_KEY` environment variable.

In the meantime, here's what Kipper Energy Solutions offers:
- **HVAC Service**: AC repair, heating, heat pumps
- **Plumbing**: Water heaters, leak repair, backflow
- **Electrical**: Panel upgrades, generators, EV chargers
- **Solar**: Installation, battery, maintenance
- **Fire Protection**: Sprinkler, alarm, extinguisher

Call us at (251) 555-0100 for immediate assistance!"""
            st.markdown(no_api_response)
            st.session_state.messages.append({
                "role": "assistant",
                "content": no_api_response
            })

# Welcome message if no chat history
if not st.session_state.messages:
    st.info("""
    👋 **Welcome to Kipper Energy Solutions AI Assistant!**

    I can help you with:
    - 📅 Scheduling service appointments
    - 💰 Getting pricing estimates
    - 📍 Checking if we service your area
    - ❓ Answering questions about our services

    Just type your question below or use the Quick Actions in the sidebar!
    """)

# =============================================================================
# Footer
# =============================================================================

st.divider()
st.markdown("""
<div style='text-align: center; color: #666; font-size: 0.8rem;'>
    <p>🏢 Kipper Energy Solutions | Coperniq Instance 388</p>
    <p>HVAC • Plumbing • Electrical • Solar • Fire Protection</p>
    <p>Serving AL, GA, FL, TN | 24/7 Emergency Service</p>
</div>
""", unsafe_allow_html=True)
