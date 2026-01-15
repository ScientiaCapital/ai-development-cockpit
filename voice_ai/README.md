# Voice AI Server - Kipper Energy Solutions

## Overview

AI-powered voice assistant for MEP contractor call handling using:
- **Twilio ConversationRelay** - Telephony, STT/TTS orchestration
- **Claude Sonnet 4** - Reasoning, tool use, conversation management
- **Deepgram Nova-3** - Speech-to-text (via ConversationRelay)
- **Amazon Polly/Cartesia** - Text-to-speech (via ConversationRelay)

## Architecture

```
                Phone Call
                    │
                    ▼
            ┌───────────────┐
            │    Twilio     │
            │   Voice API   │
            └───────┬───────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  ConversationRelay   │
         │  ┌─────┐   ┌─────┐  │
         │  │ STT │   │ TTS │  │
         │  └──┬──┘   └──▲──┘  │
         └─────┼─────────┼─────┘
               │         │
               ▼         │
         ┌──────────────────┐
         │   WebSocket      │
         │   /ws/voice      │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Voice AI Server │
         │   ┌──────────┐   │
         │   │  Claude  │   │
         │   │ Sonnet 4 │   │
         │   └────┬─────┘   │
         │        │ Tools   │
         │   ┌────▼─────┐   │
         │   │ Coperniq │   │
         │   │   API    │   │
         │   └──────────┘   │
         └──────────────────┘
```

## Quick Start

```bash
# Install dependencies
cd voice_ai
pip install -r requirements.txt

# Set environment variables (or create .env in project root)
export ANTHROPIC_API_KEY=sk-ant-...
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_PHONE_NUMBER=+1...

# Run the server
python server.py
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/ws/voice/{call_sid}` | WS | WebSocket for ConversationRelay |
| `/voice/inbound` | POST | Twilio webhook for inbound calls |
| `/voice/outbound` | POST | API to initiate outbound calls |
| `/voice/status` | POST | Call status webhook |

## Tools Available to AI

1. **schedule_service_call** - Create work orders in Coperniq
2. **check_service_area** - Verify coverage (AL, GA, FL, TN)
3. **get_pricing_estimate** - Provide rough pricing ranges
4. **escalate_to_human** - Transfer to human representative
5. **log_call_disposition** - Record call outcomes

## Twilio Configuration

### Inbound Calls
Point your Twilio phone number to:
```
https://your-domain.com/voice/inbound
```

### ConversationRelay Setup
In Twilio Console → Voice → Settings → ConversationRelay:
- STT Provider: Google Speech
- TTS Provider: Amazon Polly Neural
- Language: en-US

## Testing Locally

```bash
# 1. Start ngrok tunnel
ngrok http 8000

# 2. Update Twilio webhook to ngrok URL
# https://xxxxx.ngrok.io/voice/inbound

# 3. Call your Twilio number
```

## Production Deployment

For production, deploy to:
- AWS Lambda + API Gateway
- Google Cloud Run
- RunPod Serverless (for GPU if needed)

See `../docs/VOICE_AI_DEPLOYMENT.md` for detailed instructions.

## Compliance Notes

- All calls logged for quality assurance
- Call recordings optional (configure in Twilio)
- TCPA compliant for outbound calls
- PCI DSS considerations for payment info
