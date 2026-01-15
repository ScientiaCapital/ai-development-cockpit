# Kipper Energy Chat UI

**AI-Powered Command Center for MEP Contractors**

A modern chat interface that connects field service teams with AI agents for smarter work order management, equipment diagnostics, and real-time operational intelligence.

![Built for Coperniq](https://img.shields.io/badge/Built%20for-Coperniq-blue)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black)
![React 19](https://img.shields.io/badge/React-19-61DAFB)

---

## What is this?

A next-generation chat interface that gives MEP contractors (HVAC, Plumbing, Electrical, Solar) an AI-powered command center. Think of it as ChatGPT meets ServiceTitan - but open and extensible.

### Features

- **Real-Time Work Orders** - View and manage work orders synced with your Coperniq instance
- **AI Chat Assistant** - Claude-powered assistant that understands MEP operations
- **Multi-Agent Dashboard** - Monitor specialized AI agents for different trades
- **Voice AI Ready** - Architecture prepared for hands-free field technician support

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `COPERNIQ_API_KEY` | Your Coperniq API key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/        # Claude AI chat endpoint
│   │   ├── work-orders/ # Coperniq work orders proxy
│   │   └── agents/      # AI agent status
│   └── page.tsx         # Main app entry
├── components/
│   ├── ChatInterface/   # Main chat UI
│   ├── WorkOrders/      # Work order panel
│   ├── VoiceAI/         # Voice agent controls
│   └── Sidebar/         # Navigation
└── lib/
    ├── api.ts           # API client
    └── utils.ts         # Utilities
```

---

## API Endpoints

### `GET /api/work-orders`
Fetches work orders from Coperniq.

```typescript
// Response
{
  work_orders: WorkOrder[],
  source: 'coperniq' | 'demo'
}
```

### `POST /api/chat`
Send messages to the AI assistant.

```typescript
// Request
{
  messages: [{ role: 'user', content: 'string' }]
}

// Response
{
  message: { role: 'assistant', content: 'string' },
  model: 'claude-sonnet-4-5-20250514'
}
```

### `GET /api/agents`
Get AI agent status and metrics.

```typescript
// Response
{
  agents: Agent[],
  summary: { online: number, total: number }
}
```

---

## For Coperniq Developers

This project demonstrates how to build AI-native experiences on top of Coperniq's platform:

1. **Work Order Integration** - Direct API integration with Coperniq's task system
2. **Multi-Trade Support** - HVAC, Plumbing, Electrical, Solar, Fire Protection
3. **AI Agent Architecture** - Modular agent system for domain-specific intelligence

### Coperniq API Integration

```typescript
// Example: Fetching tasks from Coperniq
const response = await fetch('https://api.coperniq.io/v1/tasks', {
  headers: {
    'x-api-key': process.env.COPERNIQ_API_KEY,
    'Content-Type': 'application/json',
  },
});
```

---

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS, Radix UI
- **AI Provider**: Anthropic Claude (NO OpenAI)
- **Security**: CSP headers, CSRF protection, Rate limiting
- **Deployment**: Vercel serverless

---

## Security

This project implements SaaS-level security:

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- XSS Protection
- CSRF Tokens
- Rate Limiting
- React 19.2.3+ (CVE-2025-55182 patched)
- Next.js 16.1.2 (All 2025 CVEs patched)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run type-check`
5. Submit a PR

---

## License

MIT

---

Built with ❤️ for the MEP industry by [Scientia Capital](https://github.com/ScientiaCapital)
