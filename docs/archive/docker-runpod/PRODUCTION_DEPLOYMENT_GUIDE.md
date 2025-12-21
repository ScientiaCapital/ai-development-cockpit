# Production Deployment Guide: Cost Optimizer

**Version:** 1.0.0
**Last Updated:** October 30, 2024
**Status:** Production Ready

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment Validation](#post-deployment-validation)
6. [Monitoring Setup](#monitoring-setup)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Prerequisites

Before deploying to production, ensure you have:

- [ ] **Supabase Project Created**
  - Production Supabase project URL
  - Service role key (for migrations)
  - Anon/public key (for client access)

- [ ] **API Keys Obtained**
  - Google AI API key (Gemini Flash)
  - Anthropic API key (Claude Haiku)
  - OpenRouter API key (fallback models)
  - RunPod API key (Chinese LLMs) - optional

- [ ] **Deployment Platform Ready**
  - Vercel/Netlify/Railway account
  - Domain configured (if using custom domain)
  - Environment variables support verified

- [ ] **Git Repository**
  - All changes committed
  - Branch pushed to remote
  - Build passes locally

- [ ] **Budget Decisions**
  - Daily budget limits determined
  - Monthly budget limits set
  - Organization-specific limits configured

### Resource Requirements

**Minimum:**
- Node.js 18.17+
- 512MB RAM
- 1GB storage
- PostgreSQL 14+ (Supabase)

**Recommended:**
- Node.js 20+
- 1GB RAM
- 2GB storage
- Supabase Pro plan (for production RLS)

---

## Environment Configuration

### 1. Create Production Environment File

Create `.env.production` or configure environment variables in your deployment platform:

```env
# ============================================
# COST OPTIMIZER - PRODUCTION CONFIGURATION
# ============================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# ============================================
# PROVIDER API KEYS
# ============================================

# Tier 1: Free/Ultra-Low-Cost (Required)
GOOGLE_API_KEY="your_production_google_api_key_here"

# Tier 2: Mid-Cost (Required)
ANTHROPIC_API_KEY="your_production_anthropic_api_key_here"
OPENROUTER_API_KEY="your_production_openrouter_api_key_here"

# Tier 3: Premium (Optional - for Chinese LLMs)
RUNPOD_API_KEY="your_production_runpod_api_key_here"

# ============================================
# COST OPTIMIZER CONFIGURATION
# ============================================

COST_OPTIMIZER_ENABLED="true"

# AI Dev Cockpit Budget Limits
DAILY_BUDGET_SWAGGYSTACKS="2.00"
MONTHLY_BUDGET_SWAGGYSTACKS="50.00"

# Enterprise Budget Limits
DAILY_BUDGET_SCIENTIA_CAPITAL="5.00"
MONTHLY_BUDGET_SCIENTIA_CAPITAL="150.00"

# ============================================
# PROVIDER CONFIGURATION
# ============================================

# Tier 1 Provider (Free)
TIER_1_PROVIDER="gemini"
TIER_1_MODEL="gemini-1.5-flash"

# Tier 2 Provider (Mid)
TIER_2_PROVIDER="claude"
TIER_2_MODEL="claude-3-haiku-20240307"

# Tier 3 Provider (Premium)
TIER_3_PROVIDER="runpod"
TIER_3_MODEL="qwen2.5-72b-instruct"

# ============================================
# MONITORING & LOGGING
# ============================================

# Log Level (error, warn, info, debug)
LOG_LEVEL="info"

# Enable detailed request logging
ENABLE_REQUEST_LOGGING="true"

# Enable performance monitoring
ENABLE_PERFORMANCE_MONITORING="true"

# ============================================
# SECURITY
# ============================================

# CORS allowed origins (comma-separated)
CORS_ALLOWED_ORIGINS="https://arcade.com,https://www.arcade.com,https://enterprise.com,https://www.enterprise.com"

# Rate limiting (requests per minute)
RATE_LIMIT_PER_MINUTE="60"

# ============================================
# NEXT.JS CONFIGURATION
# ============================================

NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://arcade.com"
```

### 2. Validate API Keys

Before deploying, validate all API keys are working:

```bash
# Test Gemini API
curl https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_API_KEY

# Test Anthropic API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":1,"messages":[{"role":"user","content":"test"}]}'

# Test OpenRouter API
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

### 3. Security Best Practices

- **Never commit API keys to version control**
- **Use different keys for development and production**
- **Rotate keys every 90 days**
- **Use service accounts with minimum required permissions**
- **Enable API key restrictions (IP allowlist, domain restrictions)**

---

## Database Setup

### 1. Run Database Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

#### Option B: Using psql Directly

```bash
# Set database URL
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres"

# Run migration
psql $DATABASE_URL < supabase/migrations/20251030_cost_optimizer_tables.sql
```

### 2. Verify Database Setup

```sql
-- Connect to production database
psql $DATABASE_URL

-- Verify tables exist
\dt cost_optimizer_*

-- Should show:
-- cost_optimizer_requests
-- cost_optimizer_provider_health
-- cost_optimizer_alerts
-- user_organizations

-- Verify materialized views
\dm

-- Should show:
-- cost_optimizer_daily_stats
-- cost_optimizer_hourly_stats

-- Verify RLS policies are enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'cost_optimizer_%';

-- All tables should have rowsecurity = true

-- Test a simple query
SELECT COUNT(*) FROM cost_optimizer_requests;
```

### 3. Create Initial Data (Optional)

If you want to seed with test data:

```sql
-- Insert test organization mappings
INSERT INTO user_organizations (user_id, org_id)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'arcade'),
  ('00000000-0000-0000-0000-000000000000', 'scientia-capital')
ON CONFLICT DO NOTHING;

-- Initialize provider health records
INSERT INTO cost_optimizer_provider_health (provider, is_available, success_rate, avg_latency_ms)
VALUES
  ('gemini', true, 1.0, 500),
  ('claude', true, 1.0, 800),
  ('openrouter', true, 1.0, 1200),
  ('runpod', true, 1.0, 2000)
ON CONFLICT (provider) DO UPDATE SET
  is_available = EXCLUDED.is_available,
  success_rate = EXCLUDED.success_rate,
  avg_latency_ms = EXCLUDED.avg_latency_ms;
```

---

## Application Deployment

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Configure Project

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GOOGLE_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add OPENROUTER_API_KEY production
vercel env add RUNPOD_API_KEY production
vercel env add COST_OPTIMIZER_ENABLED production
vercel env add DAILY_BUDGET_SWAGGYSTACKS production
vercel env add MONTHLY_BUDGET_SWAGGYSTACKS production
vercel env add DAILY_BUDGET_SCIENTIA_CAPITAL production
vercel env add MONTHLY_BUDGET_SCIENTIA_CAPITAL production
```

#### Step 3: Deploy

```bash
# Deploy to production
vercel --prod

# Your application will be deployed to:
# https://your-project.vercel.app
```

### Option 2: Netlify

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Configure and Deploy

```bash
# Login
netlify login

# Initialize
netlify init

# Set environment variables in Netlify UI:
# https://app.netlify.com/sites/your-site/settings/deploys#environment

# Deploy
netlify deploy --prod
```

### Option 3: Railway

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Deploy

```bash
# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
railway variables set GOOGLE_API_KEY=your_key
# ... (repeat for all variables)

# Deploy
railway up
```

### Option 4: Docker (Self-Hosted)

#### Step 1: Create Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Build and Run

```bash
# Build Docker image
docker build -t cost-optimizer:latest .

# Run container
docker run -d \
  --name cost-optimizer \
  -p 3000:3000 \
  --env-file .env.production \
  cost-optimizer:latest

# Verify it's running
curl http://localhost:3000/api/health
```

---

## Post-Deployment Validation

### 1. Health Check

```bash
# Basic health check
curl https://your-domain.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-10-30T12:00:00.000Z",
#   "services": {
#     "database": "connected",
#     "costOptimizer": "enabled"
#   }
# }
```

### 2. Test API Endpoints

#### Test Optimization Endpoint

```bash
curl -X POST https://your-domain.com/api/optimize/complete \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is artificial intelligence?",
    "organizationId": "arcade",
    "maxTokens": 500
  }'

# Expected response:
# {
#   "content": "Artificial intelligence (AI) is...",
#   "provider": "gemini",
#   "tier": "free",
#   "cost": { "total": 0 },
#   "savings": 0.0015,
#   "savingsPercentage": 100
# }
```

#### Test Stats Endpoint

```bash
curl https://your-domain.com/api/optimize/stats?organization=arcade&period=daily

# Expected response:
# {
#   "organization": "arcade",
#   "period": "daily",
#   "totalRequests": 0,
#   "totalCost": 0,
#   "totalSavings": 0,
#   "budgetStatus": { ... }
# }
```

#### Test Recommendation Endpoint

```bash
curl "https://your-domain.com/api/optimize/recommendation?prompt=Explain%20quantum%20computing&organization=arcade"

# Expected response:
# {
#   "recommendedProvider": "claude",
#   "recommendedTier": "mid",
#   "model": "claude-3-haiku-20240307",
#   "estimatedCost": 0.002,
#   "complexity": { ... }
# }
```

### 3. Verify All Three Tiers

```bash
# Tier 1 (Free) - Simple query
curl -X POST https://your-domain.com/api/optimize/complete \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is 2+2?", "organizationId": "arcade"}'
# Should use Gemini (tier: "free")

# Tier 2 (Mid) - Complex query
curl -X POST https://your-domain.com/api/optimize/complete \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain the architectural differences between REST and GraphQL", "organizationId": "arcade"}'
# Should use Claude (tier: "mid")

# Tier 3 (Premium) - Chinese query
curl -X POST https://your-domain.com/api/optimize/complete \
  -H "Content-Type: application/json" \
  -d '{"prompt": "解释什么是机器学习", "organizationId": "arcade"}'
# Should use RunPod (tier: "premium")
```

### 4. Verify Budget Enforcement

```bash
# Set very low budget for testing
# Update environment variable: DAILY_BUDGET_SWAGGYSTACKS="0.001"
# Redeploy

# Make multiple requests until budget exceeded
for i in {1..100}; do
  curl -X POST https://your-domain.com/api/optimize/complete \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Test budget", "organizationId": "arcade"}'
  sleep 0.1
done

# Should eventually receive 429 response:
# {
#   "error": "Optimization failed",
#   "message": "Daily budget exceeded (100.0%)"
# }

# Reset budget to normal value
```

### 5. Frontend Validation

Visit your deployed application and test:

- [ ] **Dashboard Loads**
  - Navigate to `/arcade` or `/scientia`
  - Verify dashboard renders
  - Check for console errors

- [ ] **Cost Dashboard Works**
  - Stats display correctly
  - Budget bars render
  - Auto-refresh working (wait 60 seconds)

- [ ] **Chat Interface Works** (if implemented)
  - Can send messages
  - Responses display
  - Savings indicator shows

- [ ] **Responsive Design**
  - Test on mobile device
  - Test on tablet
  - Test on desktop

---

## Monitoring Setup

### 1. Database Monitoring

#### Create Monitoring Dashboard in Supabase

1. Navigate to Supabase Dashboard
2. Go to Database → Query Editor
3. Save these queries as "Saved Queries"

**Cost Overview Query:**
```sql
SELECT
  organization_id,
  COUNT(*) as request_count,
  SUM(cost_usd) as total_cost,
  SUM(savings_usd) as total_savings,
  AVG(latency_ms) as avg_latency,
  DATE_TRUNC('hour', created_at) as hour
FROM cost_optimizer_requests
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY organization_id, hour
ORDER BY hour DESC;
```

**Provider Health Query:**
```sql
SELECT
  provider,
  is_available,
  success_rate,
  avg_latency_ms,
  total_requests,
  total_failures,
  last_success_at,
  last_failure_at,
  updated_at
FROM cost_optimizer_provider_health
ORDER BY provider;
```

**Budget Status Query:**
```sql
SELECT
  organization_id,
  SUM(CASE WHEN created_at >= CURRENT_DATE THEN cost_usd ELSE 0 END) as today_cost,
  SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN cost_usd ELSE 0 END) as month_cost
FROM cost_optimizer_requests
GROUP BY organization_id;
```

### 2. Application Monitoring

#### Configure Vercel Analytics (if using Vercel)

```javascript
// pages/_app.tsx or app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

#### Configure Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing({
      traceFetch: true,
      traceXHR: true,
    }),
  ],
})
```

### 3. Budget Alerts

#### Create Supabase Database Function for Alerts

```sql
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS void AS $$
DECLARE
  org RECORD;
  daily_used DECIMAL;
  monthly_used DECIMAL;
  daily_limit DECIMAL;
  monthly_limit DECIMAL;
BEGIN
  FOR org IN SELECT DISTINCT organization_id FROM cost_optimizer_requests
  LOOP
    -- Get usage
    SELECT
      SUM(CASE WHEN created_at >= CURRENT_DATE THEN cost_usd ELSE 0 END),
      SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN cost_usd ELSE 0 END)
    INTO daily_used, monthly_used
    FROM cost_optimizer_requests
    WHERE organization_id = org.organization_id;

    -- Get limits from environment (hard-coded for example)
    daily_limit := CASE
      WHEN org.organization_id = 'arcade' THEN 2.00
      WHEN org.organization_id = 'scientia-capital' THEN 5.00
      ELSE 1.00
    END;

    monthly_limit := CASE
      WHEN org.organization_id = 'arcade' THEN 50.00
      WHEN org.organization_id = 'scientia-capital' THEN 150.00
      ELSE 30.00
    END;

    -- Check thresholds and insert alerts
    IF daily_used >= daily_limit * 0.75 THEN
      INSERT INTO cost_optimizer_alerts (
        organization_id,
        alert_type,
        severity,
        message,
        metadata
      ) VALUES (
        org.organization_id,
        'budget_threshold',
        CASE
          WHEN daily_used >= daily_limit * 0.90 THEN 'critical'
          ELSE 'warning'
        END,
        format('Daily budget at %.1f%%', (daily_used / daily_limit * 100)),
        jsonb_build_object(
          'daily_used', daily_used,
          'daily_limit', daily_limit,
          'percentage', (daily_used / daily_limit * 100)
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### Schedule Alert Checks (Supabase Edge Function)

```typescript
// supabase/functions/check-budgets/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Run budget check
  const { error } = await supabase.rpc('check_budget_alerts')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Set up cron job to run every hour:
```bash
# In Supabase Dashboard → Edge Functions → Cron Jobs
# Add: 0 * * * * (hourly)
```

---

## Rollback Procedures

### Scenario 1: Application Issues

If the application has bugs or issues after deployment:

```bash
# Vercel rollback
vercel rollback

# Or redeploy previous version
git checkout <previous-commit-hash>
vercel --prod

# Docker rollback
docker stop cost-optimizer
docker rm cost-optimizer
docker run -d --name cost-optimizer cost-optimizer:previous-version
```

### Scenario 2: Database Issues

If database migration causes issues:

```sql
-- Backup current data
CREATE TABLE cost_optimizer_requests_backup AS
SELECT * FROM cost_optimizer_requests;

-- Drop new objects if needed
DROP MATERIALIZED VIEW IF EXISTS cost_optimizer_daily_stats;
DROP MATERIALIZED VIEW IF EXISTS cost_optimizer_hourly_stats;
DROP TABLE IF EXISTS cost_optimizer_requests CASCADE;

-- Restore from backup
-- (Restore previous snapshot in Supabase dashboard)
```

### Scenario 3: Budget Exceeded Unexpectedly

```bash
# Temporarily increase budget
vercel env add DAILY_BUDGET_SWAGGYSTACKS production
# Enter new value when prompted

# Redeploy
vercel --prod

# Or disable cost optimizer temporarily
vercel env add COST_OPTIMIZER_ENABLED production
# Enter "false"
vercel --prod
```

### Scenario 4: Provider API Issues

```bash
# Switch to fallback provider
vercel env add TIER_1_PROVIDER production
# Enter "claude" (fallback from gemini)

# Or force all to Claude
vercel env add TIER_2_PROVIDER production
# Enter "claude"

vercel --prod
```

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Symptoms:** All API endpoints return 500

**Diagnosis:**
```bash
# Check application logs
vercel logs --follow  # For Vercel
netlify logs          # For Netlify
docker logs cost-optimizer  # For Docker

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Provider API key invalid
```

**Solution:**
```bash
# Verify all env vars are set
vercel env ls

# Check Supabase connection
curl "https://your-project.supabase.co/rest/v1/?apikey=your_anon_key"

# Test provider keys (see Environment Configuration section)
```

### Issue: Requests Not Logging to Database

**Symptoms:** API works but stats endpoint returns empty

**Diagnosis:**
```sql
-- Check if data is being inserted
SELECT COUNT(*), MAX(created_at)
FROM cost_optimizer_requests;

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'cost_optimizer_requests';
```

**Solution:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE cost_optimizer_requests DISABLE ROW LEVEL SECURITY;

-- Test insert manually
INSERT INTO cost_optimizer_requests (
  organization_id, request_id, prompt_text,
  prompt_tokens, completion_tokens,
  model_used, provider, tier,
  complexity_score, cost_usd, latency_ms
) VALUES (
  'arcade', 'test-001', 'test prompt',
  10, 20, 'test-model', 'gemini', 'free',
  25, 0, 100
);

-- Re-enable RLS
ALTER TABLE cost_optimizer_requests ENABLE ROW LEVEL SECURITY;
```

### Issue: High Latency

**Symptoms:** Requests taking >5 seconds

**Diagnosis:**
```sql
-- Check average latency by provider
SELECT
  provider,
  AVG(latency_ms) as avg_latency,
  MAX(latency_ms) as max_latency,
  COUNT(*) as request_count
FROM cost_optimizer_requests
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY provider;
```

**Solution:**
- Check provider health status
- Switch to faster provider temporarily
- Check network connectivity
- Verify API keys have proper rate limits

### Issue: Budget Not Enforcing

**Symptoms:** Requests continue after budget limit

**Diagnosis:**
```bash
# Check environment variables
echo $DAILY_BUDGET_SWAGGYSTACKS
echo $COST_OPTIMIZER_ENABLED

# Verify budget calculation
curl "https://your-domain.com/api/optimize/stats?organization=arcade&period=daily"
```

**Solution:**
```bash
# Verify budget env vars are numbers, not strings
# Incorrect: DAILY_BUDGET_SWAGGYSTACKS="$2.00"
# Correct:   DAILY_BUDGET_SWAGGYSTACKS="2.00"

# Redeploy with correct format
vercel env rm DAILY_BUDGET_SWAGGYSTACKS production
vercel env add DAILY_BUDGET_SWAGGYSTACKS production
# Enter: 2.00 (no dollar sign, no quotes)

vercel --prod
```

---

## Production Checklist

### Pre-Launch ☑️

- [ ] All environment variables configured
- [ ] API keys validated and working
- [ ] Database migrations run successfully
- [ ] RLS policies enabled and tested
- [ ] Budget limits set appropriately
- [ ] All three tiers tested with real requests
- [ ] Frontend components render correctly
- [ ] Mobile responsiveness verified
- [ ] SSL certificate configured
- [ ] Custom domain configured (if applicable)

### Launch Day ☑️

- [ ] Deploy application to production
- [ ] Run post-deployment validation
- [ ] Test all API endpoints
- [ ] Verify budget enforcement
- [ ] Check monitoring dashboards
- [ ] Announce to users (if applicable)
- [ ] Monitor logs for errors
- [ ] Be available for quick fixes

### Post-Launch (Week 1) ☑️

- [ ] Monitor daily cost trends
- [ ] Review provider distribution
- [ ] Check for any errors or alerts
- [ ] Validate savings calculations
- [ ] Review user feedback (if applicable)
- [ ] Optimize routing if needed
- [ ] Document any issues and resolutions

### Ongoing Maintenance ☑️

- [ ] Weekly cost review
- [ ] Monthly budget analysis
- [ ] Quarterly API key rotation
- [ ] Bi-annual security audit
- [ ] Regular dependency updates
- [ ] Performance optimization reviews

---

## Support and Resources

### Documentation

- [Cost Optimizer Usage Guide](./COST_OPTIMIZER_USAGE_GUIDE.md)
- [Phase 3 Completion Summary](./PHASE_3_COMPLETION_SUMMARY.md)
- [Integration Plan](./INTEGRATION_PLAN_AI_COST_OPTIMIZER.md)

### Provider Documentation

- [Google Gemini API](https://ai.google.dev/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [OpenRouter API](https://openrouter.ai/docs)
- [RunPod Serverless](https://docs.runpod.io/serverless/overview)

### Platform Documentation

- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Production](https://nextjs.org/docs/deployment)

---

## Conclusion

This guide covers complete production deployment of the Cost Optimizer system. Follow each section carefully, validate at each step, and refer to troubleshooting when issues arise.

**Key Reminders:**
1. Never commit API keys
2. Test thoroughly before going live
3. Monitor costs closely in first week
4. Have rollback plan ready
5. Document any custom configurations

**Production Status:** ✅ Ready to Deploy

---

**Last Updated:** October 30, 2024
**Version:** 1.0.0
**Maintained By:** AI Development Team
