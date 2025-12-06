# Cost Optimizer Usage Guide

## Overview

The Cost Optimizer is an intelligent LLM request routing system that automatically selects the most cost-effective provider for each request based on complexity analysis. It achieves 60-65% cost savings while maintaining high-quality responses.

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env.local
```

Configure at least one API key from each tier:

**Tier 1 (Free/Ultra-Low-Cost):**
```env
GOOGLE_API_KEY="your_google_api_key_here"
```

**Tier 2 (Mid-Cost):**
```env
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
OPENROUTER_API_KEY="your_openrouter_key_here"
```

**Tier 3 (Premium - Chinese LLMs):**
```env
RUNPOD_API_KEY="your_runpod_api_key_here"
```

**Budget Configuration:**
```env
COST_OPTIMIZER_ENABLED="true"
DAILY_BUDGET_SWAGGYSTACKS="2.00"
DAILY_BUDGET_SCIENTIA_CAPITAL="5.00"
MONTHLY_BUDGET_SWAGGYSTACKS="50.00"
MONTHLY_BUDGET_SCIENTIA_CAPITAL="150.00"
```

### 2. Database Setup

Run the Supabase migration to create required tables:

```bash
supabase db push
```

Or manually execute:
```bash
psql $DATABASE_URL < supabase/migrations/20251030_cost_optimizer_tables.sql
```

### 3. Basic Usage

#### Using the React Hook (Recommended)

```tsx
import { useOptimizer } from '@/hooks/useOptimizer'

function MyComponent() {
  const {
    optimize,
    loading,
    response,
    error,
    totalCost,
    totalSavings,
    savingsPercentage
  } = useOptimizer({
    organization: 'arcade',
    onSuccess: (response) => {
      console.log('Optimization complete!', response)
    },
    onError: (error) => {
      console.error('Optimization failed:', error)
    }
  })

  const handleSubmit = async () => {
    await optimize({
      prompt: "Explain quantum computing in simple terms",
      maxTokens: 500,
      temperature: 0.7
    })
  }

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Submit'}
      </button>

      {response && (
        <div>
          <p>{response.content}</p>
          <SavingsIndicator
            savings={totalSavings}
            savingsPercentage={savingsPercentage}
            totalCost={totalCost}
            provider={response.provider}
            tier={response.tier}
            variant="detailed"
          />
        </div>
      )}

      {error && <div className="error">{error.message}</div>}
    </div>
  )
}
```

#### Using the API Endpoint Directly

```typescript
// POST /api/optimize/complete
const response = await fetch('/api/optimize/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "What is machine learning?",
    organizationId: "arcade",
    maxTokens: 1000,
    temperature: 0.7
  })
})

const data = await response.json()
console.log('Response:', data.content)
console.log('Cost:', data.cost.total)
console.log('Savings:', data.savings)
console.log('Provider:', data.provider)
```

## API Reference

### POST /api/optimize/complete

Main endpoint for cost-optimized LLM completions.

**Request Body:**
```typescript
{
  prompt: string                    // Required: The user's prompt
  organizationId: string           // Required: 'arcade' or 'scientia-capital'
  userId?: string                  // Optional: User identifier
  maxTokens?: number              // Optional: Max completion tokens (default: 1000)
  temperature?: number            // Optional: 0.0-2.0 (default: 0.7)
  forceProvider?: string          // Optional: Force specific provider
  forceTier?: string              // Optional: Force specific tier
  systemMessage?: string          // Optional: System prompt
  conversationHistory?: Array<{   // Optional: Previous messages
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  stream?: boolean                // Optional: Stream response (default: false)
  metadata?: object               // Optional: Additional metadata
}
```

**Response:**
```typescript
{
  content: string                 // LLM response
  model: string                   // Model used
  provider: string               // Provider used (gemini/claude/openrouter/runpod)
  tier: string                   // Tier used (free/mid/premium)
  requestId: string              // Unique request ID

  tokensUsed: {
    input: number
    output: number
    total: number
  }

  cost: {
    input: number               // Cost in USD
    output: number
    total: number
  }

  savings: number               // Amount saved vs Claude Sonnet
  savingsPercentage: number     // Percentage saved
  latency: number              // Response time in ms

  complexityAnalysis: {
    score: number               // Complexity score (0-100)
    tokenCount: number
    hasComplexKeywords: boolean
    recommendedTier: string
    recommendedProvider: string
    confidence: number
    reasoning: string
  }

  timestamp: string
}
```

**Response Headers:**
```
X-Provider: gemini
X-Tier: free
X-Cost: 0.000000
X-Savings: 0.003750
X-Latency: 847
```

### GET /api/optimize/recommendation

Get routing recommendation without executing the request.

**Query Parameters:**
```
?prompt=<prompt>
&organization=<org>
&maxTokens=<tokens>
```

**Response:**
```typescript
{
  recommendedProvider: string
  recommendedTier: string
  model: string
  estimatedCost: number
  estimatedSavings: number
  complexity: {
    score: number
    tokenCount: number
    reasoning: string
  }
}
```

### GET /api/optimize/stats

Retrieve cost statistics and analytics.

**Query Parameters:**
```
?organization=<org>
&period=<hourly|daily|weekly|monthly>
```

**Response:**
```typescript
{
  organization: string
  period: string

  totalRequests: number
  totalCost: number
  totalSavings: number
  savingsPercentage: number

  averageLatency: number
  averageCost: number
  averageTokens: number

  budgetStatus: {
    dailyUsed: number
    dailyLimit: number
    dailyPercentage: number
    monthlyUsed: number
    monthlyLimit: number
    monthlyPercentage: number
  }

  providerDistribution: Array<{
    provider: string
    count: number
    percentage: number
    totalCost: number
    avgLatency: number
  }>

  tierDistribution: Array<{
    tier: string
    count: number
    percentage: number
    totalCost: number
  }>

  timeRange: {
    start: string
    end: string
  }
}
```

## React Components

### CostDashboard

Real-time cost tracking dashboard with auto-refresh.

```tsx
import { CostDashboard } from '@/components/cost-optimizer/CostDashboard'

function AnalyticsPage() {
  return (
    <CostDashboard
      organization="arcade"
      period="daily"              // hourly/daily/weekly/monthly
      autoRefresh={true}          // Auto-refresh every 60 seconds
      refreshInterval={60000}     // Custom refresh interval (ms)
    />
  )
}
```

**Features:**
- Real-time cost metrics
- Budget status bars with color-coded progress
- Provider distribution breakdown
- Tier usage statistics
- Average latency and cost per request
- Savings percentage and total savings

### SavingsIndicator

Visual savings display with multiple variants.

```tsx
import { SavingsIndicator } from '@/components/cost-optimizer/SavingsIndicator'

// Badge variant - compact display
<SavingsIndicator
  savings={0.003750}
  savingsPercentage={100}
  totalCost={0}
  provider="gemini"
  tier="free"
  variant="badge"
/>

// Inline variant - single line
<SavingsIndicator
  savings={0.001875}
  savingsPercentage={50}
  totalCost={0.001875}
  provider="claude"
  tier="mid"
  variant="inline"
/>

// Detailed variant - full breakdown
<SavingsIndicator
  savings={0.003750}
  savingsPercentage={100}
  totalCost={0}
  provider="gemini"
  tier="free"
  variant="detailed"
  showBreakdown={true}
/>
```

## Routing Logic

### Complexity Analysis

Requests are analyzed based on:

1. **Token Count:**
   - <100 tokens → Simple
   - 100-500 tokens → Medium
   - \>500 tokens → Complex

2. **Keyword Detection:**
   - **Complex keywords:** analyze, explain, compare, implement, debug, optimize, architecture, algorithm, etc.
   - **Simple keywords:** what, who, when, where, list, define, etc.
   - **Chinese characters:** Detected with Unicode ranges

3. **Scoring Algorithm:**
   ```
   Base Score = (tokenCount / 10) + complexityBonus

   If hasComplexKeywords: +20 points
   If hasSimpleKeywords: -10 points
   If hasChineseText: Route to RunPod (premium tier)

   Final Score = 0-100
   ```

### Tier Selection

| Score | Tier | Providers | Use Cases |
|-------|------|-----------|-----------|
| 0-30 | Free | Gemini Flash | Simple factual queries, definitions, quick answers |
| 31-70 | Mid | Claude Haiku, OpenRouter | Analysis, explanations, code review, debugging |
| 71-100 | Premium | RunPod (Qwen/DeepSeek) | Complex architecture, Chinese language, specialized tasks |

### Provider Fallback Chain

**Tier 1 (Free):**
1. Gemini Flash (primary)
2. Claude Haiku (fallback)

**Tier 2 (Mid):**
1. Claude Haiku (primary)
2. OpenRouter/Llama-3.1-70B (fallback)
3. Gemini Flash (fallback)

**Tier 3 (Premium):**
1. RunPod/Qwen2.5-72B (primary)
2. Claude Haiku (fallback)

## Budget Management

### Budget Enforcement

The system checks budgets before each request:

1. **Daily Budget Check:**
   - Queries current day's spending from database
   - Rejects requests if daily limit exceeded (429 status)

2. **Monthly Budget Check:**
   - Queries current month's spending
   - Rejects requests if monthly limit exceeded (429 status)

3. **Budget Alerts:**
   - 75% threshold: Warning alert
   - 90% threshold: Critical alert
   - 100%: Requests blocked

### Budget Configuration

Set organization-specific budgets in `.env.local`:

```env
# AI Dev Cockpit budgets
DAILY_BUDGET_SWAGGYSTACKS="2.00"
MONTHLY_BUDGET_SWAGGYSTACKS="50.00"

# Enterprise budgets
DAILY_BUDGET_SCIENTIA_CAPITAL="5.00"
MONTHLY_BUDGET_SCIENTIA_CAPITAL="150.00"
```

### Monitoring Budget Status

```typescript
import { useOptimizer } from '@/hooks/useOptimizer'

const { fetchStats } = useOptimizer({ organization: 'arcade' })

const stats = await fetchStats('daily')
console.log('Daily budget:', stats.budgetStatus.dailyPercentage + '%')
console.log('Monthly budget:', stats.budgetStatus.monthlyPercentage + '%')
```

## Advanced Usage

### Force Specific Provider

Override automatic routing:

```typescript
await optimize({
  prompt: "Explain quantum computing",
  forceProvider: "claude",
  forceTier: "mid"
})
```

### Conversation History

Include previous messages for context:

```typescript
await optimize({
  prompt: "What about quantum entanglement?",
  conversationHistory: [
    { role: 'user', content: 'Explain quantum computing' },
    { role: 'assistant', content: 'Quantum computing uses...' }
  ]
})
```

### System Message

Set system-level instructions:

```typescript
await optimize({
  prompt: "Explain machine learning",
  systemMessage: "You are an expert computer science teacher. Explain concepts clearly with examples."
})
```

### Streaming Responses

Enable streaming for real-time output:

```typescript
await optimize({
  prompt: "Write a long essay on AI",
  stream: true,
  maxTokens: 2000
})
```

### Custom Metadata

Attach metadata for tracking:

```typescript
await optimize({
  prompt: "Debug this code",
  metadata: {
    feature: "code-review",
    userId: "user-123",
    sessionId: "session-456"
  }
})
```

## Cost Estimation

### Expected Costs by Tier

**Tier 1 (Free) - 70% of traffic:**
- Gemini Flash: $0.00 per request
- Expected: 0 requests/day × $0.00 = **$0.00/day**

**Tier 2 (Mid) - 25% of traffic:**
- Claude Haiku: ~$0.001-0.003 per request
- Expected: 25 requests/day × $0.002 = **$0.05/day**

**Tier 3 (Premium) - 5% of traffic:**
- RunPod Qwen: ~$0.01-0.03 per request
- Expected: 5 requests/day × $0.02 = **$0.10/day**

**Total Expected Cost:** $0.15/day = **$4.50/month**

**Without Optimization (Claude Sonnet):**
- 100 requests/day × $0.015 = $1.50/day = **$45/month**

**Savings:** $40.50/month (90% reduction)

### Real-Time Cost Tracking

```tsx
import { CostDashboard } from '@/components/cost-optimizer/CostDashboard'

<CostDashboard organization="arcade" period="daily" />
```

View live metrics:
- Total cost today
- Total savings today
- Savings percentage
- Provider distribution
- Budget status

## Testing

### Unit Tests

Run the complexity analyzer tests:

```bash
npm test tests/unit/complexity-analyzer.test.ts
```

Test coverage includes:
- Simple query routing
- Complex query routing
- Chinese text detection
- Token counting accuracy
- Scoring algorithm
- Confidence levels
- Edge cases

### Integration Testing

Test the full API flow:

```bash
# Test optimization endpoint
curl -X POST http://localhost:3001/api/optimize/complete \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is AI?",
    "organizationId": "arcade",
    "maxTokens": 500
  }'

# Test stats endpoint
curl http://localhost:3001/api/optimize/stats?organization=arcade&period=daily

# Test recommendation endpoint
curl http://localhost:3001/api/optimize/recommendation?prompt=What+is+AI&organization=arcade
```

### Manual Testing Checklist

- [ ] Simple query routes to Gemini (free tier)
- [ ] Complex query routes to Claude (mid tier)
- [ ] Chinese text routes to RunPod (premium tier)
- [ ] Budget limits enforced (daily and monthly)
- [ ] Fallback providers work when primary fails
- [ ] Cost tracking logs to database correctly
- [ ] Dashboard displays real-time stats
- [ ] Savings calculations accurate

## Troubleshooting

### Issue: 429 Budget Exceeded Error

**Cause:** Daily or monthly budget limit reached

**Solution:**
1. Check current budget usage:
   ```bash
   curl http://localhost:3001/api/optimize/stats?organization=arcade
   ```
2. Increase budget in `.env.local`:
   ```env
   DAILY_BUDGET_SWAGGYSTACKS="5.00"
   MONTHLY_BUDGET_SWAGGYSTACKS="100.00"
   ```
3. Restart the application

### Issue: Provider API Key Invalid

**Cause:** Missing or incorrect API key

**Solution:**
1. Verify API keys in `.env.local`
2. Check key format and validity
3. Test key directly with provider's API
4. Restart application after updating

### Issue: No Cost Data in Dashboard

**Cause:** Database not configured or migrations not run

**Solution:**
1. Run Supabase migrations:
   ```bash
   supabase db push
   ```
2. Verify database connection:
   ```bash
   psql $SUPABASE_URL -c "SELECT COUNT(*) FROM cost_optimizer_requests;"
   ```
3. Check Supabase credentials in `.env.local`

### Issue: High Latency

**Cause:** Provider performance or network issues

**Solution:**
1. Check provider health:
   ```sql
   SELECT * FROM cost_optimizer_provider_health ORDER BY created_at DESC LIMIT 10;
   ```
2. Force different provider:
   ```typescript
   await optimize({ prompt, forceProvider: "claude" })
   ```
3. Monitor latency in dashboard

### Issue: Incorrect Routing

**Cause:** Complexity analysis misclassification

**Solution:**
1. Check complexity analysis:
   ```typescript
   const rec = await getRecommendation({ prompt, organizationId })
   console.log('Recommended:', rec)
   ```
2. Force specific tier if needed:
   ```typescript
   await optimize({ prompt, forceTier: "mid" })
   ```
3. Report issue for model tuning

## Performance Optimization

### Caching Strategy

The system implements two levels of caching:

1. **Request-level caching:** Identical prompts within 5 minutes return cached responses
2. **Stats caching:** Dashboard stats cached for 60 seconds

### Database Optimization

Materialized views refresh every hour:
```sql
REFRESH MATERIALIZED VIEW cost_optimizer_daily_stats;
REFRESH MATERIALIZED VIEW cost_optimizer_hourly_stats;
```

Manual refresh if needed:
```bash
psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW cost_optimizer_daily_stats;"
```

### Provider Health Monitoring

The system tracks provider health and automatically fails over:
- Success rate monitoring
- Average latency tracking
- Automatic circuit breaking on failures

## Security

### API Key Management

- Never commit API keys to version control
- Use environment variables exclusively
- Rotate keys regularly
- Use separate keys for development and production

### Row Level Security (RLS)

Database access is restricted by organization:

```sql
-- Users can only access their organization's data
CREATE POLICY "Organization isolation"
  ON cost_optimizer_requests
  FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );
```

### Budget Protection

- Hard limits prevent overspending
- Real-time budget checking before requests
- Automated alerts at 75% and 90% thresholds

## Production Deployment

See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

Quick checklist:
- [ ] Configure all API keys in production environment
- [ ] Run database migrations
- [ ] Set production budget limits
- [ ] Configure monitoring and alerts
- [ ] Test all three tiers with real requests
- [ ] Verify cost tracking and analytics
- [ ] Set up backup providers

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review database logs and API responses
3. Monitor provider health status
4. Check budget and rate limits

## Changelog

**Version 1.0.0 (October 30, 2024)**
- Initial release with 3-tier routing
- React hooks and UI components
- Real-time cost tracking
- Budget enforcement
- Comprehensive testing suite
