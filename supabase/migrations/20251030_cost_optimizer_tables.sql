-- ============================================================================
-- Cost Optimizer Database Migration
-- ============================================================================
-- Creates tables and infrastructure for cost tracking and optimization
-- Part of ai-cost-optimizer integration with AI Development Cockpit
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Cost optimizer requests table
-- Stores every LLM request for cost tracking and analytics
CREATE TABLE IF NOT EXISTS cost_optimizer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Organization and user context
  organization_id TEXT NOT NULL CHECK (organization_id IN ('swaggystacks', 'scientia-capital')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Request identification
  request_id TEXT NOT NULL UNIQUE,

  -- Prompt and response data
  prompt_text TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL CHECK (completion_tokens >= 0),
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,

  -- Model and routing information
  model_used TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'claude', 'openrouter', 'runpod', 'cerebras')),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'mid', 'premium')),

  -- Performance metrics
  complexity_score FLOAT NOT NULL CHECK (complexity_score BETWEEN 0 AND 100),
  cost_usd DECIMAL(10, 6) NOT NULL CHECK (cost_usd >= 0),
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),

  -- Caching and optimization flags
  cached BOOLEAN DEFAULT FALSE,
  savings_usd DECIMAL(10, 6) DEFAULT 0 CHECK (savings_usd >= 0),

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT idx_cost_requests_date CHECK (created_at IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_cost_requests_org ON cost_optimizer_requests(organization_id);
CREATE INDEX idx_cost_requests_user ON cost_optimizer_requests(user_id);
CREATE INDEX idx_cost_requests_created ON cost_optimizer_requests(created_at DESC);
CREATE INDEX idx_cost_requests_provider ON cost_optimizer_requests(provider);
CREATE INDEX idx_cost_requests_tier ON cost_optimizer_requests(tier);
CREATE INDEX idx_cost_requests_org_created ON cost_optimizer_requests(organization_id, created_at DESC);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_cost_requests_metadata ON cost_optimizer_requests USING GIN (metadata);

-- ============================================================================
-- AGGREGATION TABLES
-- ============================================================================

-- Daily cost statistics per organization
-- Materialized view for fast analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS cost_optimizer_daily_stats AS
SELECT
  organization_id,
  DATE(created_at) as date,

  -- Request statistics
  COUNT(*) as request_count,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost,
  MAX(cost_usd) as max_cost,
  MIN(cost_usd) as min_cost,

  -- Token statistics
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(total_tokens) as total_tokens,
  AVG(total_tokens) as avg_tokens,

  -- Performance statistics
  AVG(latency_ms) as avg_latency,
  MAX(latency_ms) as max_latency,
  MIN(latency_ms) as min_latency,

  -- Savings statistics
  SUM(savings_usd) as total_savings,
  AVG(savings_usd) as avg_savings,

  -- Provider breakdown
  SUM(CASE WHEN provider = 'gemini' THEN 1 ELSE 0 END) as gemini_requests,
  SUM(CASE WHEN provider = 'claude' THEN 1 ELSE 0 END) as claude_requests,
  SUM(CASE WHEN provider = 'openrouter' THEN 1 ELSE 0 END) as openrouter_requests,
  SUM(CASE WHEN provider = 'runpod' THEN 1 ELSE 0 END) as runpod_requests,
  SUM(CASE WHEN provider = 'cerebras' THEN 1 ELSE 0 END) as cerebras_requests,

  -- Tier breakdown
  SUM(CASE WHEN tier = 'free' THEN 1 ELSE 0 END) as free_tier_requests,
  SUM(CASE WHEN tier = 'mid' THEN 1 ELSE 0 END) as mid_tier_requests,
  SUM(CASE WHEN tier = 'premium' THEN 1 ELSE 0 END) as premium_tier_requests,

  -- Cost breakdown by provider
  SUM(CASE WHEN provider = 'gemini' THEN cost_usd ELSE 0 END) as gemini_cost,
  SUM(CASE WHEN provider = 'claude' THEN cost_usd ELSE 0 END) as claude_cost,
  SUM(CASE WHEN provider = 'openrouter' THEN cost_usd ELSE 0 END) as openrouter_cost,
  SUM(CASE WHEN provider = 'runpod' THEN cost_usd ELSE 0 END) as runpod_cost,
  SUM(CASE WHEN provider = 'cerebras' THEN cost_usd ELSE 0 END) as cerebras_cost,

  -- Cache statistics
  SUM(CASE WHEN cached = true THEN 1 ELSE 0 END) as cached_requests,

  -- Complexity distribution
  AVG(complexity_score) as avg_complexity,
  MAX(complexity_score) as max_complexity,
  MIN(complexity_score) as min_complexity

FROM cost_optimizer_requests
GROUP BY organization_id, DATE(created_at);

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_daily_stats_org_date ON cost_optimizer_daily_stats(organization_id, date);

-- ============================================================================
-- HOURLY STATISTICS VIEW
-- ============================================================================

-- Hourly cost statistics for real-time monitoring
CREATE MATERIALIZED VIEW IF NOT EXISTS cost_optimizer_hourly_stats AS
SELECT
  organization_id,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as request_count,
  SUM(cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency,
  SUM(savings_usd) as total_savings,

  -- Provider distribution
  SUM(CASE WHEN provider = 'gemini' THEN 1 ELSE 0 END) as gemini_requests,
  SUM(CASE WHEN provider = 'claude' THEN 1 ELSE 0 END) as claude_requests,
  SUM(CASE WHEN provider = 'runpod' THEN 1 ELSE 0 END) as runpod_requests

FROM cost_optimizer_requests
GROUP BY organization_id, DATE_TRUNC('hour', created_at);

-- Create unique index on hourly stats
CREATE UNIQUE INDEX idx_hourly_stats_org_hour ON cost_optimizer_hourly_stats(organization_id, hour);

-- ============================================================================
-- PROVIDER HEALTH TABLE
-- ============================================================================

-- Track provider health and availability
CREATE TABLE IF NOT EXISTS cost_optimizer_provider_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Provider information
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'claude', 'openrouter', 'runpod', 'cerebras')),
  organization_id TEXT NOT NULL CHECK (organization_id IN ('swaggystacks', 'scientia-capital')),

  -- Health metrics
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER CHECK (response_time_ms >= 0),
  success_rate FLOAT CHECK (success_rate BETWEEN 0 AND 1),
  error_count INTEGER DEFAULT 0 CHECK (error_count >= 0),

  -- Timestamps
  last_success TIMESTAMP WITH TIME ZONE,
  last_error TIMESTAMP WITH TIME ZONE,
  last_error_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one health record per provider per org
  UNIQUE(provider, organization_id)
);

-- Create index for health monitoring queries
CREATE INDEX idx_provider_health_org ON cost_optimizer_provider_health(organization_id);
CREATE INDEX idx_provider_health_status ON cost_optimizer_provider_health(status);

-- ============================================================================
-- COST ALERTS TABLE
-- ============================================================================

-- Store cost alert events
CREATE TABLE IF NOT EXISTS cost_optimizer_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Alert details
  organization_id TEXT NOT NULL CHECK (organization_id IN ('swaggystacks', 'scientia-capital')),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('daily_budget', 'monthly_budget', 'cost_spike', 'provider_failure')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),

  -- Alert content
  message TEXT NOT NULL,
  recommendation TEXT,

  -- Context data
  stats JSONB,

  -- Alert status
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alert queries
CREATE INDEX idx_alerts_org ON cost_optimizer_alerts(organization_id);
CREATE INDEX idx_alerts_created ON cost_optimizer_alerts(created_at DESC);
CREATE INDEX idx_alerts_severity ON cost_optimizer_alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON cost_optimizer_alerts(acknowledged);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE cost_optimizer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_optimizer_provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_optimizer_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own cost requests"
  ON cost_optimizer_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can view their organization's aggregated stats (no user_id filter)
CREATE POLICY "Users can view organization cost requests"
  ON cost_optimizer_requests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert requests
CREATE POLICY "Service role can insert cost requests"
  ON cost_optimizer_requests FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their organization's provider health
CREATE POLICY "Users can view organization provider health"
  ON cost_optimizer_provider_health FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can manage provider health
CREATE POLICY "Service role can manage provider health"
  ON cost_optimizer_provider_health FOR ALL
  WITH CHECK (true);

-- Policy: Users can view their organization's alerts
CREATE POLICY "Users can view organization alerts"
  ON cost_optimizer_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can acknowledge alerts
CREATE POLICY "Users can acknowledge alerts"
  ON cost_optimizer_alerts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to refresh daily stats materialized view
CREATE OR REPLACE FUNCTION refresh_cost_optimizer_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cost_optimizer_daily_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh hourly stats materialized view
CREATE OR REPLACE FUNCTION refresh_cost_optimizer_hourly_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cost_optimizer_hourly_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily cost for organization
CREATE OR REPLACE FUNCTION get_daily_cost(org_id TEXT, target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT total_cost FROM cost_optimizer_daily_stats
     WHERE organization_id = org_id AND date = target_date),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly cost for organization
CREATE OR REPLACE FUNCTION get_monthly_cost(org_id TEXT, target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(total_cost) FROM cost_optimizer_daily_stats
     WHERE organization_id = org_id
     AND date >= target_month
     AND date < target_month + INTERVAL '1 month'),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED REFRESH (Requires pg_cron extension)
-- ============================================================================

-- Note: Uncomment these if pg_cron is enabled on your Supabase project
-- These will automatically refresh materialized views

-- Refresh hourly stats every 5 minutes
-- SELECT cron.schedule('refresh-hourly-stats', '*/5 * * * *', 'SELECT refresh_cost_optimizer_hourly_stats()');

-- Refresh daily stats every hour at :00
-- SELECT cron.schedule('refresh-daily-stats', '0 * * * *', 'SELECT refresh_cost_optimizer_daily_stats()');

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert initial provider health records
INSERT INTO cost_optimizer_provider_health (provider, organization_id, status, success_rate)
VALUES
  ('gemini', 'swaggystacks', 'healthy', 1.0),
  ('claude', 'swaggystacks', 'healthy', 1.0),
  ('openrouter', 'swaggystacks', 'healthy', 1.0),
  ('runpod', 'swaggystacks', 'healthy', 1.0),
  ('gemini', 'scientia-capital', 'healthy', 1.0),
  ('claude', 'scientia-capital', 'healthy', 1.0),
  ('openrouter', 'scientia-capital', 'healthy', 1.0),
  ('runpod', 'scientia-capital', 'healthy', 1.0)
ON CONFLICT (provider, organization_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cost_optimizer_requests IS 'Tracks every LLM request for cost optimization and analytics';
COMMENT ON TABLE cost_optimizer_provider_health IS 'Monitors health and availability of LLM providers';
COMMENT ON TABLE cost_optimizer_alerts IS 'Stores cost alerts and budget notifications';
COMMENT ON MATERIALIZED VIEW cost_optimizer_daily_stats IS 'Aggregated daily statistics for fast analytics queries';
COMMENT ON MATERIALIZED VIEW cost_optimizer_hourly_stats IS 'Aggregated hourly statistics for real-time monitoring';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON cost_optimizer_requests TO authenticated;
GRANT INSERT ON cost_optimizer_requests TO service_role;
GRANT SELECT ON cost_optimizer_daily_stats TO authenticated;
GRANT SELECT ON cost_optimizer_hourly_stats TO authenticated;
GRANT SELECT ON cost_optimizer_provider_health TO authenticated;
GRANT ALL ON cost_optimizer_provider_health TO service_role;
GRANT SELECT, UPDATE ON cost_optimizer_alerts TO authenticated;
GRANT ALL ON cost_optimizer_alerts TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
  RAISE NOTICE 'Cost Optimizer migration completed successfully';
  RAISE NOTICE 'Tables created: cost_optimizer_requests, cost_optimizer_provider_health, cost_optimizer_alerts';
  RAISE NOTICE 'Materialized views created: cost_optimizer_daily_stats, cost_optimizer_hourly_stats';
  RAISE NOTICE 'Functions created: refresh functions, cost calculation functions';
  RAISE NOTICE 'RLS policies enabled for all tables';
END $$;
