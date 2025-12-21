-- ============================================
-- Knowledge Base & Fine-tuning Integration
-- Created: 2025-12-21
-- Purpose: Knowledge capture, training data generation, and fine-tuning job tracking
-- Part of unsloth-mcp-server integration with ai-development-cockpit
-- ============================================

-- ============================================
-- Knowledge Entries (Core Content Storage)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization context (matches cost_optimizer pattern)
    organization_id TEXT NOT NULL CHECK (organization_id IN ('swaggystacks', 'scientia-capital')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Source information
    source_type TEXT NOT NULL CHECK (source_type IN ('book', 'article', 'notes', 'chart', 'video', 'other')),
    source_title TEXT,
    source_author TEXT,
    source_chapter TEXT,
    source_page_numbers TEXT,
    source_url TEXT,
    source_image_path TEXT,

    -- Content
    raw_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,

    -- Classification
    category TEXT NOT NULL CHECK (category IN (
        -- Trading & Finance
        'candlestick_patterns', 'chart_patterns', 'technical_indicators',
        'risk_management', 'trading_psychology', 'market_structure',
        'options_strategies', 'fundamental_analysis', 'order_flow', 'volume_analysis',
        -- Sales & Business
        'sales_techniques', 'negotiation', 'persuasion', 'closing',
        'business_strategy', 'marketing', 'leadership', 'management', 'startups',
        -- Self-Help
        'mindset', 'habits', 'productivity', 'motivation', 'success_principles',
        -- Wealth
        'wealth_building', 'real_estate', 'passive_income',
        -- Communication
        'communication', 'public_speaking', 'networking',
        -- MEP & Trades (aligns with mep_templates)
        'energy_systems', 'solar_power', 'electrical_systems', 'hvac_systems',
        'mechanical_engineering', 'plumbing_systems', 'fire_protection', 'building_automation',
        'carpentry', 'masonry', 'roofing', 'insulation', 'welding',
        'safety_regulations', 'blueprints', 'estimating', 'project_management',
        -- General
        'general'
    )),

    -- Quality metrics
    quality_score NUMERIC(5,2) DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    ocr_confidence NUMERIC(5,2) DEFAULT 0 CHECK (ocr_confidence BETWEEN 0 AND 100),
    manually_reviewed BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_org ON knowledge_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user ON knowledge_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_category ON knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_source_type ON knowledge_entries(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_quality ON knowledge_entries(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_created ON knowledge_entries(created_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_text ON knowledge_entries USING gin(to_tsvector('english', cleaned_text));

-- ============================================
-- Topics (Normalized Tags)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT, -- Optional: link to parent category
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_topics_name ON knowledge_topics(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_topics_usage ON knowledge_topics(usage_count DESC);

-- ============================================
-- Entry-Topic Junction
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_entry_topics (
    entry_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES knowledge_topics(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_topics_entry ON knowledge_entry_topics(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_topics_topic ON knowledge_entry_topics(topic_id);

-- ============================================
-- Training Pairs (Generated Q&A)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_training_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE,

    -- Training pair content
    instruction TEXT NOT NULL,
    input TEXT DEFAULT '',
    output TEXT NOT NULL,

    -- Format and quality
    format TEXT NOT NULL CHECK (format IN ('alpaca', 'sharegpt', 'chatml')),
    quality_score NUMERIC(5,2) DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),

    -- Generation metadata
    generated_by TEXT, -- 'claude', 'gemini', 'manual'
    generation_prompt TEXT,

    -- Review status
    approved BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_pairs_entry ON knowledge_training_pairs(entry_id);
CREATE INDEX IF NOT EXISTS idx_training_pairs_format ON knowledge_training_pairs(format);
CREATE INDEX IF NOT EXISTS idx_training_pairs_approved ON knowledge_training_pairs(approved);
CREATE INDEX IF NOT EXISTS idx_training_pairs_quality ON knowledge_training_pairs(quality_score DESC);

-- ============================================
-- Fine-tuning Datasets
-- ============================================

CREATE TABLE IF NOT EXISTS finetuning_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization context
    organization_id TEXT NOT NULL CHECK (organization_id IN ('swaggystacks', 'scientia-capital')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Dataset info
    name TEXT NOT NULL,
    description TEXT,

    -- Content
    format TEXT NOT NULL CHECK (format IN ('alpaca', 'sharegpt', 'chatml')),
    entry_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Categories included
    categories TEXT[] DEFAULT '{}',

    -- Export info
    huggingface_repo TEXT,
    huggingface_url TEXT,
    local_path TEXT,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'exported', 'archived')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datasets_org ON finetuning_datasets(organization_id);
CREATE INDEX IF NOT EXISTS idx_datasets_user ON finetuning_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON finetuning_datasets(status);

-- ============================================
-- Dataset-Pair Junction
-- ============================================

CREATE TABLE IF NOT EXISTS finetuning_dataset_pairs (
    dataset_id UUID REFERENCES finetuning_datasets(id) ON DELETE CASCADE,
    pair_id UUID REFERENCES knowledge_training_pairs(id) ON DELETE CASCADE,
    order_index INTEGER,
    PRIMARY KEY (dataset_id, pair_id)
);

CREATE INDEX IF NOT EXISTS idx_dataset_pairs_dataset ON finetuning_dataset_pairs(dataset_id);

-- ============================================
-- Fine-tuning Jobs (Training Runs)
-- ============================================

CREATE TABLE IF NOT EXISTS finetuning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization context
    organization_id TEXT NOT NULL CHECK (organization_id IN ('swaggystacks', 'scientia-capital')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Job identification
    job_name TEXT NOT NULL,
    dataset_id UUID REFERENCES finetuning_datasets(id) ON DELETE SET NULL,

    -- Model configuration
    base_model TEXT NOT NULL, -- 'unsloth/Llama-3.2-1B', etc.
    output_model TEXT,

    -- Training config
    training_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    -- Expected structure:
    -- {
    --   "lora_r": 16,
    --   "lora_alpha": 32,
    --   "learning_rate": 2e-4,
    --   "epochs": 3,
    --   "batch_size": 4,
    --   "max_seq_length": 2048
    -- }

    -- RunPod integration
    runpod_pod_id TEXT,
    runpod_endpoint_id TEXT,
    gpu_type TEXT, -- 'RTX A5000', 'A100', etc.

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'queued', 'starting', 'training',
        'saving', 'exporting', 'completed', 'failed', 'cancelled'
    )),
    progress NUMERIC(5,2) DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    current_epoch INTEGER DEFAULT 0,
    total_epochs INTEGER,

    -- Metrics
    training_loss NUMERIC(10,6),
    eval_loss NUMERIC(10,6),

    -- Cost tracking (links to cost_optimizer)
    estimated_cost_usd NUMERIC(10,4),
    actual_cost_usd NUMERIC(10,4),
    gpu_hours NUMERIC(10,4),

    -- Logs and artifacts
    logs_url TEXT,
    model_url TEXT, -- HuggingFace or local path

    -- Error handling
    error_message TEXT,
    error_details JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finetuning_jobs_org ON finetuning_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_finetuning_jobs_user ON finetuning_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_finetuning_jobs_status ON finetuning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_finetuning_jobs_dataset ON finetuning_jobs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_finetuning_jobs_created ON finetuning_jobs(created_at DESC);

-- ============================================
-- Job Checkpoints
-- ============================================

CREATE TABLE IF NOT EXISTS finetuning_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES finetuning_jobs(id) ON DELETE CASCADE,

    -- Checkpoint info
    step INTEGER NOT NULL,
    epoch INTEGER,

    -- Metrics at checkpoint
    training_loss NUMERIC(10,6),
    eval_loss NUMERIC(10,6),

    -- Storage
    checkpoint_path TEXT,
    size_bytes BIGINT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_job ON finetuning_checkpoints(job_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_step ON finetuning_checkpoints(step);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entry_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_training_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finetuning_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finetuning_dataset_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finetuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finetuning_checkpoints ENABLE ROW LEVEL SECURITY;

-- Knowledge entries: users see their own, service role sees all
DROP POLICY IF EXISTS "Users view own knowledge entries" ON knowledge_entries;
CREATE POLICY "Users view own knowledge entries" ON knowledge_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access knowledge entries" ON knowledge_entries;
CREATE POLICY "Service role full access knowledge entries" ON knowledge_entries
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Topics: readable by all authenticated
DROP POLICY IF EXISTS "Authenticated read topics" ON knowledge_topics;
CREATE POLICY "Authenticated read topics" ON knowledge_topics
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role full access topics" ON knowledge_topics;
CREATE POLICY "Service role full access topics" ON knowledge_topics
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Entry topics: follow entry permissions
DROP POLICY IF EXISTS "Users view own entry topics" ON knowledge_entry_topics;
CREATE POLICY "Users view own entry topics" ON knowledge_entry_topics
    FOR SELECT TO authenticated
    USING (entry_id IN (SELECT id FROM knowledge_entries WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access entry topics" ON knowledge_entry_topics;
CREATE POLICY "Service role full access entry topics" ON knowledge_entry_topics
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Training pairs: follow entry permissions
DROP POLICY IF EXISTS "Users view own training pairs" ON knowledge_training_pairs;
CREATE POLICY "Users view own training pairs" ON knowledge_training_pairs
    FOR SELECT TO authenticated
    USING (entry_id IN (SELECT id FROM knowledge_entries WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access training pairs" ON knowledge_training_pairs;
CREATE POLICY "Service role full access training pairs" ON knowledge_training_pairs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Datasets: users see their own
DROP POLICY IF EXISTS "Users manage own datasets" ON finetuning_datasets;
CREATE POLICY "Users manage own datasets" ON finetuning_datasets
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access datasets" ON finetuning_datasets;
CREATE POLICY "Service role full access datasets" ON finetuning_datasets
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Dataset pairs: follow dataset permissions
DROP POLICY IF EXISTS "Users view own dataset pairs" ON finetuning_dataset_pairs;
CREATE POLICY "Users view own dataset pairs" ON finetuning_dataset_pairs
    FOR SELECT TO authenticated
    USING (dataset_id IN (SELECT id FROM finetuning_datasets WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access dataset pairs" ON finetuning_dataset_pairs;
CREATE POLICY "Service role full access dataset pairs" ON finetuning_dataset_pairs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Fine-tuning jobs: users see their own
DROP POLICY IF EXISTS "Users manage own finetuning jobs" ON finetuning_jobs;
CREATE POLICY "Users manage own finetuning jobs" ON finetuning_jobs
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access finetuning jobs" ON finetuning_jobs;
CREATE POLICY "Service role full access finetuning jobs" ON finetuning_jobs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Checkpoints: follow job permissions
DROP POLICY IF EXISTS "Users view own checkpoints" ON finetuning_checkpoints;
CREATE POLICY "Users view own checkpoints" ON finetuning_checkpoints
    FOR SELECT TO authenticated
    USING (job_id IN (SELECT id FROM finetuning_jobs WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access checkpoints" ON finetuning_checkpoints;
CREATE POLICY "Service role full access checkpoints" ON finetuning_checkpoints
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Triggers
-- ============================================

-- Use existing update_updated_at_column() function from projects migration

DROP TRIGGER IF EXISTS update_knowledge_entries_updated_at ON knowledge_entries;
CREATE TRIGGER update_knowledge_entries_updated_at
    BEFORE UPDATE ON knowledge_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finetuning_datasets_updated_at ON finetuning_datasets;
CREATE TRIGGER update_finetuning_datasets_updated_at
    BEFORE UPDATE ON finetuning_datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finetuning_jobs_updated_at ON finetuning_jobs;
CREATE TRIGGER update_finetuning_jobs_updated_at
    BEFORE UPDATE ON finetuning_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Get knowledge stats for an organization
CREATE OR REPLACE FUNCTION get_knowledge_stats(org_id TEXT)
RETURNS TABLE (
    total_entries BIGINT,
    total_training_pairs BIGINT,
    avg_quality NUMERIC,
    categories_count BIGINT,
    entries_by_category JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT ke.id)::BIGINT,
        COUNT(DISTINCT ktp.id)::BIGINT,
        AVG(ke.quality_score)::NUMERIC,
        COUNT(DISTINCT ke.category)::BIGINT,
        jsonb_object_agg(ke.category, cnt.count)
    FROM knowledge_entries ke
    LEFT JOIN knowledge_training_pairs ktp ON ktp.entry_id = ke.id
    LEFT JOIN (
        SELECT category, COUNT(*) as count
        FROM knowledge_entries
        WHERE organization_id = org_id
        GROUP BY category
    ) cnt ON cnt.category = ke.category
    WHERE ke.organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get finetuning job cost estimate
CREATE OR REPLACE FUNCTION estimate_finetuning_cost(
    dataset_tokens INTEGER,
    base_model TEXT,
    gpu_type TEXT DEFAULT 'RTX A5000',
    epochs INTEGER DEFAULT 3
)
RETURNS NUMERIC AS $$
DECLARE
    gpu_cost_per_hour NUMERIC;
    tokens_per_second NUMERIC;
    estimated_hours NUMERIC;
BEGIN
    -- GPU pricing (approximate)
    gpu_cost_per_hour := CASE gpu_type
        WHEN 'RTX A5000' THEN 0.16
        WHEN 'RTX A6000' THEN 0.29
        WHEN 'A100-40GB' THEN 0.89
        WHEN 'A100-80GB' THEN 1.19
        ELSE 0.20
    END;

    -- Tokens per second (approximate for Unsloth)
    tokens_per_second := CASE
        WHEN base_model LIKE '%1B%' THEN 8000
        WHEN base_model LIKE '%3B%' THEN 5000
        WHEN base_model LIKE '%7B%' THEN 3000
        WHEN base_model LIKE '%8B%' THEN 2500
        WHEN base_model LIKE '%13B%' THEN 1500
        ELSE 2000
    END;

    -- Estimate hours
    estimated_hours := (dataset_tokens::NUMERIC * epochs) / (tokens_per_second * 3600);

    RETURN ROUND(estimated_hours * gpu_cost_per_hour, 4);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grants
-- ============================================

GRANT SELECT ON knowledge_entries TO authenticated;
GRANT ALL ON knowledge_entries TO service_role;

GRANT SELECT ON knowledge_topics TO authenticated;
GRANT ALL ON knowledge_topics TO service_role;

GRANT SELECT ON knowledge_entry_topics TO authenticated;
GRANT ALL ON knowledge_entry_topics TO service_role;

GRANT SELECT ON knowledge_training_pairs TO authenticated;
GRANT ALL ON knowledge_training_pairs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON finetuning_datasets TO authenticated;
GRANT ALL ON finetuning_datasets TO service_role;

GRANT SELECT ON finetuning_dataset_pairs TO authenticated;
GRANT ALL ON finetuning_dataset_pairs TO service_role;

GRANT SELECT, INSERT, UPDATE ON finetuning_jobs TO authenticated;
GRANT ALL ON finetuning_jobs TO service_role;

GRANT SELECT ON finetuning_checkpoints TO authenticated;
GRANT ALL ON finetuning_checkpoints TO service_role;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE knowledge_entries IS 'Captured knowledge content from books, articles, notes, etc.';
COMMENT ON TABLE knowledge_topics IS 'Normalized topic tags for knowledge entries';
COMMENT ON TABLE knowledge_training_pairs IS 'Generated instruction-tuning Q&A pairs from knowledge entries';
COMMENT ON TABLE finetuning_datasets IS 'Curated datasets for fine-tuning, exported to HuggingFace';
COMMENT ON TABLE finetuning_jobs IS 'Fine-tuning job tracking with RunPod integration';
COMMENT ON TABLE finetuning_checkpoints IS 'Training checkpoints for job recovery and model versioning';

-- ============================================
-- Dependencies
-- ============================================
-- Requires: update_updated_at_column() function (from 20251129_projects_table.sql)
-- Integrates with: cost_optimizer_requests (for cost tracking)
-- Used by: unsloth-mcp-server, ai-development-cockpit
