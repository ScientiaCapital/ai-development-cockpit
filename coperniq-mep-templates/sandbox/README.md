# Coperniq Sandbox - Instance 388

Agentic AI system for Kipper Energy Solutions.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment
export COPERNIQ_API_KEY=your_key
export ANTHROPIC_API_KEY=sk-ant-...

# Check status
python coperniq_cli.py status

# Start chat UI
python langserve_app.py
# Access: http://localhost:8388/coperniq/playground

# Run Ralph loop
python ../ralph_loop.py run
```

## Files

| File | Purpose |
|------|---------|
| `coperniq_langgraph_tools.py` | 20+ LangGraph tools for Coperniq API |
| `coperniq_agent.py` | Multi-agent system with auto-routing |
| `coperniq_cli.py` | CLI for quick commands |
| `langserve_app.py` | LangServe chat playgrounds |
| `voice/` | Voice AI providers (Cartesia TTS, Deepgram STT) |

## Agents

| Agent | Tools | Use Case |
|-------|-------|----------|
| `voice_ai` | create_request, log_call, dispatch | Inbound customer calls |
| `dispatch` | dispatch_technician, create_work_order | Assign technicians |
| `collections` | get_aging_invoices, log_call | AR follow-up |
| `pm_scheduler` | get_pm_due_assets, create_work_order | Preventive maintenance |
| `quote_builder` | create_invoice | Generate quotes |

## Usage Examples

### CLI

```bash
./coperniq_cli.py health        # Check API
./coperniq_cli.py clients       # List clients
./coperniq_cli.py projects      # List projects
./coperniq_cli.py requests      # List service requests
./coperniq_cli.py templates     # Work order templates
./coperniq_cli.py aging         # Aging invoices
./coperniq_cli.py chat "Create request for AC repair"
```

### Python

```python
from sandbox.coperniq_agent import coperniq_agent

# Simple invocation
response = coperniq_agent.invoke("Create service request for AC repair at 123 Main St")

# With specific agent
from sandbox.coperniq_agent import voice_ai_agent
response = voice_ai_agent.invoke("Customer calling about no heat - emergency")
```

### LangServe

```bash
# Start server
python langserve_app.py

# Access playgrounds
http://localhost:8388/coperniq/playground     # Main agent
http://localhost:8388/voice-ai/playground     # Voice AI
http://localhost:8388/dispatch/playground     # Dispatch
http://localhost:8388/collections/playground  # Collections
```

## Environment Variables

Required:
- `COPERNIQ_API_KEY` - Coperniq API key
- `ANTHROPIC_API_KEY` - Claude API key

Optional:
- `DEEPGRAM_API_KEY` - For voice STT
- `CARTESIA_API_KEY` - For voice TTS
- `TWILIO_ACCOUNT_SID` - For phone integration
