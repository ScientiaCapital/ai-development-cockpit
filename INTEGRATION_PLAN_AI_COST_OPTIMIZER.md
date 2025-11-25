# AI Cost Optimizer Integration Plan

## 🎯 Executive Summary

Integrate the **ai-cost-optimizer** from Enterprise into the AI Development Cockpit to provide intelligent multi-LLM routing and cost optimization capabilities.

**Key Benefits:**
- 💰 Automatic cost optimization through intelligent model routing
- 🎯 Complexity-based prompt routing (simple → Gemini Flash, complex → Claude Haiku/RunPod)
- 📊 Real-time cost tracking and analytics
- 🔄 Seamless integration with existing RunPod and HuggingFace infrastructure
- 🚀 Reduce monthly AI costs from projected $50+ to <$30 target

---

## 📊 Current State Analysis

### AI Development Cockpit (Current Project)
**Tech Stack:**
- **Frontend:** Next.js 15.5.3 + React 18 + TypeScript
- **Backend:** Next.js API Routes
- **LLM Integration:** RunPod serverless + HuggingFace
- **Auth:** Supabase
- **Monitoring:** Prometheus + Grafana + Winston
- **Caching:** LRU Cache + Redis
- **Database:** Supabase PostgreSQL

**Current Vendors:**
- Anthropic Claude (fallback)
- HuggingFace (model discovery)
- RunPod (Chinese LLM deployment)
- Supabase (auth + database)
- OpenTelemetry/Prometheus (monitoring)

### AI Cost Optimizer (Integration Target)
**Tech Stack:**
- **Backend:** FastAPI + Uvicorn (Python)
- **Database:** SQLite3
- **MCP Server:** Model Context Protocol integration
- **Frontend:** Next.js API routes (modular)

**Vendors:**
- Google Gemini Flash (free tier)
- Anthropic Claude Haiku (paid)
- OpenRouter (40+ models)
- Cerebras (experimental)

---

## 🔗 Vendor Alignment Matrix

| Vendor | Current Project | ai-cost-optimizer | Integration Strategy |
|--------|----------------|-------------------|---------------------|
| **Anthropic Claude** | ✅ Used | ✅ Used | ✅ **ALIGNED** - Use same API key |
| **Google Gemini** | ❌ Not used | ✅ Used | ✅ **ADD** - Free tier for simple queries |
| **OpenRouter** | ✅ In .env | ✅ Used | ✅ **ALIGNED** - Enable for fallback |
| **RunPod** | ✅ Core service | ❌ Not used | ✅ **EXTEND** - Add as premium tier |
| **HuggingFace** | ✅ Model discovery | ❌ Not used | ✅ **KEEP** - Maintain discovery |
| **Supabase** | ✅ Auth + DB | ❌ Not used | ✅ **EXTEND** - Migrate SQLite to Supabase |
| **Cerebras** | ❌ Not used | ✅ Used | ⚠️ **OPTIONAL** - Experimental only |

**Unified Vendor Strategy:**
- **Free Tier:** Google Gemini Flash (simple queries)
- **Mid Tier:** Claude Haiku, OpenRouter (complex queries)
- **Premium Tier:** RunPod Chinese LLMs (specialized tasks)
- **Monitoring:** Prometheus + Grafana (unified)
- **Database:** Supabase PostgreSQL (migrate from SQLite)

---

## 🏗️ Integration Architecture

### Three-Layer Routing System

```
┌─────────────────────────────────────────────────────────┐
│           Next.js Frontend (React + TypeScript)         │
│     (AI Dev Cockpit.com + Enterprise.com)           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Cost Optimizer Routing Layer (NEW)              │
│  ┌────────────────────────────────────────────────┐    │
│  │ Complexity Analyzer:                            │    │
│  │ • Token count < 100 = Simple                   │    │
│  │ • Keywords (explain, design) = Complex         │    │
│  │ • Semantic analysis = Context awareness        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Decision Engine:                                        │
│  ├─ Simple Query (cost: ~$0.0001)                      │
│  │  → Google Gemini Flash (free tier)                  │
│  │                                                      │
│  ├─ Complex Query (cost: ~$0.001)                      │
│  │  → Claude Haiku / OpenRouter                        │
│  │                                                      │
│  └─ Specialized Query (cost: ~$0.01)                   │
│     → RunPod Chinese LLMs (Qwen, DeepSeek)            │
│                                                          │
│  Cost Tracker:                                          │
│  └─ Supabase PostgreSQL (replaces SQLite)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Provider Integrations                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Gemini  │  │  Claude  │  │ RunPod   │             │
│  │  Flash   │  │  Haiku   │  │  vLLM    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐                            │
│  │OpenRouter│  │Cerebras  │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Monitoring & Analytics Layer                     │
│  • Prometheus metrics (request count, latency, cost)    │
│  • Grafana dashboards (real-time cost tracking)         │
│  • Winston logging (audit trail)                        │
│  • Organization-specific cost isolation                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Plan

### Phase 1: Foundation Setup (2-3 hours)
- [ ] **1.1** Update `.env.example` with unified vendor configuration
- [ ] **1.2** Create `src/services/cost-optimizer/` directory structure
- [ ] **1.3** Define TypeScript interfaces for cost optimizer
- [ ] **1.4** Create Supabase migration for cost tracking tables
- [ ] **1.5** Install additional dependencies (if needed)

### Phase 2: Core Integration (4-6 hours)
- [ ] **2.1** Port complexity analyzer from Python to TypeScript
- [ ] **2.2** Implement routing engine with provider selection logic
- [ ] **2.3** Create Gemini Flash client integration
- [ ] **2.4** Create OpenRouter client integration
- [ ] **2.5** Integrate with existing RunPod vLLM service
- [ ] **2.6** Add cost calculation and tracking to Supabase

### Phase 3: API Layer (2-3 hours)
- [ ] **3.1** Create `/api/optimize/complete` endpoint (replaces direct LLM calls)
- [ ] **3.2** Create `/api/optimize/stats` endpoint (cost analytics)
- [ ] **3.3** Create `/api/optimize/recommendation` endpoint (preview routing)
- [ ] **3.4** Update existing chat interface to use optimizer
- [ ] **3.5** Add cost display to UI components

### Phase 4: Monitoring & Analytics (3-4 hours)
- [ ] **4.1** Extend Prometheus metrics for cost tracking
- [ ] **4.2** Create Grafana dashboard for cost optimization
- [ ] **4.3** Add organization-specific cost isolation
- [ ] **4.4** Implement cost alerts and notifications
- [ ] **4.5** Create cost reporting API endpoints

### Phase 5: Testing & Validation (2-3 hours)
- [ ] **5.1** Unit tests for complexity analyzer
- [ ] **5.2** Integration tests for routing engine
- [ ] **5.3** E2E tests for cost tracking
- [ ] **5.4** Load testing for performance validation
- [ ] **5.5** Cost accuracy validation

### Phase 6: Documentation & Deployment (1-2 hours)
- [ ] **6.1** Update CLAUDE.md with cost optimizer usage
- [ ] **6.2** Create cost optimization best practices guide
- [ ] **6.3** Update README with new capabilities
- [ ] **6.4** Deploy to production with monitoring
- [ ] **6.5** Monitor initial cost savings

**Total Estimated Time:** 14-21 hours (2-3 days)

---

## 📋 Unified Environment Configuration

### Updated `.env.example`

```bash
# ============================================================================
# AI DEVELOPMENT COCKPIT - UNIFIED CONFIGURATION
# ============================================================================

# ----------------------------------------------------------------------------
# CORE LLM PROVIDERS (Cost Optimization Tiers)
# ----------------------------------------------------------------------------

# Tier 1: Free/Ultra-Low-Cost (Simple Queries)
GOOGLE_API_KEY="your_google_api_key_here"                 # Required: Gemini Flash (free tier)

# Tier 2: Mid-Cost (Complex Queries)
ANTHROPIC_API_KEY="your_anthropic_api_key_here"           # Required: Claude Haiku/Sonnet
OPENROUTER_API_KEY="YOUR_OPENROUTER_KEY_HERE"             # Required: Multi-model fallback

# Tier 3: Premium (Specialized Chinese LLMs)
RUNPOD_API_KEY="your_runpod_api_key_here"                 # Required: Qwen, DeepSeek, ChatGLM
HUGGINGFACE_API_KEY="your_huggingface_api_key_here"       # Required: Model discovery

# Experimental/Optional
CEREBRAS_API_KEY="your_cerebras_api_key_here"             # Optional: Experimental fast inference

# ----------------------------------------------------------------------------
# ADDITIONAL LLM PROVIDERS (Optional)
# ----------------------------------------------------------------------------
PERPLEXITY_API_KEY="your_perplexity_api_key_here"         # Optional: Research mode
OPENAI_API_KEY="your_openai_api_key_here"                 # Optional: GPT models
MISTRAL_API_KEY="your_mistral_key_here"                   # Optional: Mistral models
XAI_API_KEY="YOUR_XAI_KEY_HERE"                           # Optional: xAI models
GROQ_API_KEY="YOUR_GROQ_KEY_HERE"                         # Optional: Groq fast inference
OLLAMA_API_KEY="your_ollama_api_key_here"                 # Optional: Local Ollama server

# ----------------------------------------------------------------------------
# AUTHENTICATION & DATABASE
# ----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url_here" # Required: Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here" # Required: Supabase anon key
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"    # Required: Admin operations

# ----------------------------------------------------------------------------
# COST OPTIMIZER CONFIGURATION
# ----------------------------------------------------------------------------
COST_OPTIMIZER_ENABLED="true"                             # Enable intelligent routing
COST_OPTIMIZER_DEFAULT_TIER="auto"                        # auto | free | mid | premium
COST_OPTIMIZER_COMPLEXITY_THRESHOLD="100"                 # Token count threshold
COST_OPTIMIZER_DAILY_BUDGET="5.00"                        # Daily budget in USD
COST_OPTIMIZER_MONTHLY_BUDGET="50.00"                     # Monthly budget in USD
COST_OPTIMIZER_API_URL="http://localhost:3001"            # Internal API endpoint

# ----------------------------------------------------------------------------
# RUNPOD CONFIGURATION
# ----------------------------------------------------------------------------
RUNPOD_API_ENDPOINT="https://api.runpod.io/v2"           # RunPod API base URL
RUNPOD_WORKSPACE_ID="your_workspace_id_here"             # RunPod workspace
NEXT_PUBLIC_RUNPOD_API_KEY="your_runpod_api_key_here"   # Client-side RunPod key

# ----------------------------------------------------------------------------
# MONITORING & ANALYTICS
# ----------------------------------------------------------------------------
PROMETHEUS_PORT="9090"                                    # Prometheus metrics port
GRAFANA_PORT="3000"                                       # Grafana dashboard port
LOG_LEVEL="INFO"                                          # DEBUG | INFO | WARN | ERROR
ENABLE_COST_ALERTS="true"                                 # Enable cost threshold alerts

# ----------------------------------------------------------------------------
# ORGANIZATION CONFIGURATION
# ----------------------------------------------------------------------------
SWAGGYSTACKS_ORG_ID="arcade"                       # AI Dev Cockpit organization
SCIENTIA_ORG_ID="scientia-capital"                       # Enterprise organization

# ----------------------------------------------------------------------------
# OPTIONAL: DEVELOPMENT TOOLS
# ----------------------------------------------------------------------------
GITHUB_API_KEY="your_github_api_key_here"                # Optional: GitHub integration
AZURE_OPENAI_API_KEY="your_azure_key_here"               # Optional: Azure OpenAI
```

---

## 🎯 Cost Savings Projection

### Current Architecture (Without Cost Optimizer)
- **Simple queries:** Claude Haiku @ $0.25/1M input tokens → **$0.50/day**
- **Complex queries:** RunPod Chinese LLMs @ $0.15/1M tokens → **$1.00/day**
- **Monthly projection:** **$45-50/month**

### Optimized Architecture (With Cost Optimizer)
- **Simple queries (70%):** Gemini Flash @ FREE → **$0.00/day**
- **Complex queries (25%):** Claude Haiku @ $0.25/1M tokens → **$0.13/day**
- **Specialized queries (5%):** RunPod Chinese LLMs → **$0.05/day**
- **Monthly projection:** **$15-20/month** 💰

**Expected Savings:** 60-65% reduction (~$30/month savings)

---

## 🔄 Migration Strategy

### Database Migration (SQLite → Supabase)

**Create Supabase Tables:**
```sql
-- Cost tracking table
CREATE TABLE cost_optimizer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  prompt_text TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  model_used TEXT NOT NULL,
  provider TEXT NOT NULL,
  complexity_score FLOAT NOT NULL,
  cost_usd DECIMAL(10, 6) NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost aggregations (materialized view)
CREATE MATERIALIZED VIEW cost_optimizer_daily_stats AS
SELECT
  organization_id,
  DATE(created_at) as date,
  COUNT(*) as request_count,
  SUM(cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency,
  SUM(CASE WHEN provider = 'gemini' THEN 1 ELSE 0 END) as gemini_requests,
  SUM(CASE WHEN provider = 'claude' THEN 1 ELSE 0 END) as claude_requests,
  SUM(CASE WHEN provider = 'runpod' THEN 1 ELSE 0 END) as runpod_requests
FROM cost_optimizer_requests
GROUP BY organization_id, DATE(created_at);

-- Create indexes
CREATE INDEX idx_cost_requests_org ON cost_optimizer_requests(organization_id);
CREATE INDEX idx_cost_requests_created ON cost_optimizer_requests(created_at);
CREATE INDEX idx_cost_requests_user ON cost_optimizer_requests(user_id);

-- Row Level Security
ALTER TABLE cost_optimizer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON cost_optimizer_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert requests"
  ON cost_optimizer_requests FOR INSERT
  WITH CHECK (true);
```

---

## 🔧 Technical Implementation Details

### Directory Structure
```
src/
├── services/
│   ├── cost-optimizer/
│   │   ├── index.ts                    # Main service export
│   │   ├── complexity-analyzer.ts      # Token counting + keyword analysis
│   │   ├── routing-engine.ts           # Model selection logic
│   │   ├── cost-calculator.ts          # Cost tracking
│   │   ├── providers/
│   │   │   ├── gemini-client.ts        # Google Gemini integration
│   │   │   ├── claude-client.ts        # Anthropic Claude integration
│   │   │   ├── openrouter-client.ts    # OpenRouter integration
│   │   │   ├── runpod-client.ts        # RunPod integration (existing)
│   │   │   └── cerebras-client.ts      # Cerebras integration (optional)
│   │   └── database/
│   │       ├── cost-tracker.ts         # Supabase cost tracking
│   │       └── analytics.ts            # Cost analytics queries
│   └── runpod/                         # Existing RunPod services
├── types/
│   └── cost-optimizer.ts               # TypeScript interfaces
├── app/
│   └── api/
│       └── optimize/
│           ├── complete/route.ts       # Optimized completion endpoint
│           ├── stats/route.ts          # Cost statistics
│           └── recommendation/route.ts # Routing recommendation
└── components/
    └── cost-optimizer/
        ├── CostDashboard.tsx           # Cost visualization
        ├── ModelSelector.tsx           # Manual model override
        └── SavingsIndicator.tsx        # Real-time savings display
```

### Key TypeScript Interfaces

```typescript
// src/types/cost-optimizer.ts

export interface ComplexityScore {
  score: number;           // 0-100 complexity score
  tokenCount: number;      // Total prompt tokens
  hasComplexKeywords: boolean;
  estimatedLatency: number; // ms
  recommendedTier: 'free' | 'mid' | 'premium';
}

export interface ProviderConfig {
  name: string;
  tier: 'free' | 'mid' | 'premium';
  costPerInputToken: number;
  costPerOutputToken: number;
  maxTokens: number;
  enabled: boolean;
}

export interface OptimizationRequest {
  prompt: string;
  organizationId: string;
  userId?: string;
  maxTokens?: number;
  temperature?: number;
  forceProvider?: string; // Override auto-routing
}

export interface OptimizationResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  cost: number;
  latency: number;
  savings: number; // Compared to default model
}

export interface CostStats {
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalRequests: number;
  totalCost: number;
  averageLatency: number;
  providerBreakdown: {
    [provider: string]: {
      requests: number;
      cost: number;
    };
  };
  savings: number; // Compared to non-optimized
}
```

---

## 🎨 UI/UX Enhancements

### Cost Dashboard Component
```typescript
// components/cost-optimizer/CostDashboard.tsx
- Real-time cost tracking
- Daily/weekly/monthly breakdown
- Provider usage charts
- Savings visualization
- Budget alerts
```

### Chat Interface Updates
```typescript
// Add to ModernChatInterface.tsx
- Model routing indicator (shows which tier was used)
- Cost per message display
- Cumulative session cost
- "Optimize for cost" toggle
- Manual model override option
```

---

## ✅ Success Criteria

1. **Cost Reduction:** Achieve 50%+ reduction in monthly AI costs
2. **Performance:** Routing decision < 50ms overhead
3. **Accuracy:** 95%+ routing accuracy (simple vs complex)
4. **Reliability:** 99.9% uptime for optimizer service
5. **Transparency:** Real-time cost visibility for all users
6. **User Experience:** Zero noticeable latency impact

---

## 🚀 Next Steps

1. **Review and approve** this integration plan
2. **Update `.env.example`** with unified configuration
3. **Install dependencies** for the AI Development Cockpit
4. **Begin Phase 1** (Foundation Setup)
5. **Iterate and validate** through each phase

---

## 📚 References

- **ai-cost-optimizer repo:** https://github.com/Enterprise/ai-cost-optimizer
- **Current project:** /home/user/ai-development-cockpit
- **CLAUDE.md context:** Phase 6 priorities include authentication and model management
- **Task Master context:** `llm-platform` Task 10 (TypeScript type safety) nearly complete

---

**Status:** Ready for implementation pending approval and dependency installation.
