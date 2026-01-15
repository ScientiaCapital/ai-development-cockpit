-- Coperniq MEP Templates - Contractor Configuration & Form Submissions
-- Created: 2025-12-20
-- Purpose: Store wizard-generated contractor configs, form submissions, and usage analytics

-- Enable JSON/JSONB operations (already enabled, but explicit for clarity)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Market type enum
CREATE TYPE market_type AS ENUM (
    'residential',
    'commercial',
    'industrial',
    'institutional',
    'mixed'
);

-- Submission status enum
CREATE TYPE submission_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'archived'
);

-- Usage action enum
CREATE TYPE usage_action_type AS ENUM (
    'viewed',
    'filled',
    'submitted',
    'edited',
    'exported'
);

-- ============================================================================
-- mep_contractor_configs table
-- Stores wizard-generated configurations for each contractor
-- ============================================================================
CREATE TABLE IF NOT EXISTS mep_contractor_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic contractor info
    contractor_name TEXT NOT NULL,
    contractor_email TEXT,
    contractor_phone TEXT,
    company_id UUID, -- Reference to Coperniq company ID if available

    -- Configuration arrays
    trades TEXT[] NOT NULL DEFAULT '{}', -- 'hvac', 'plumbing', 'electrical', 'solar', 'fire_protection'
    markets TEXT[] NOT NULL DEFAULT '{}', -- residential, commercial, industrial, institutional, mixed
    phases TEXT[] NOT NULL DEFAULT '{}', -- sales, design, permit, install, commissioning, om, service

    -- Enabled templates (storing template IDs or paths)
    templates_enabled TEXT[] DEFAULT '{}', -- Array of template names/paths
    templates_enabled_count INTEGER DEFAULT 0,

    -- Preset information
    preset_used TEXT, -- hvac_residential, full_mep, solar_epc, om_service, etc.
    preset_customized BOOLEAN DEFAULT false, -- Whether contractor customized the preset

    -- Metadata
    wizard_step_completed INTEGER DEFAULT 0, -- Track wizard progress
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'contractor-wizard',

    -- Constraints
    CONSTRAINT contractor_name_not_empty CHECK (contractor_name ~ '^\s*\S'),
    CONSTRAINT at_least_one_trade CHECK (array_length(trades, 1) > 0 OR trades = '{}'),
    CONSTRAINT at_least_one_market CHECK (array_length(markets, 1) > 0 OR markets = '{}'),
    UNIQUE(contractor_name, contractor_email)
);

-- ============================================================================
-- mep_form_submissions table
-- Stores completed form data from contractors
-- ============================================================================
CREATE TABLE IF NOT EXISTS mep_form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
    contractor_config_id UUID NOT NULL REFERENCES mep_contractor_configs(id) ON DELETE CASCADE,

    -- Form metadata
    form_title TEXT NOT NULL, -- Display name for the submission
    form_data JSONB NOT NULL, -- Complete form submission data with field values

    -- Submission tracking
    submitted_by TEXT NOT NULL, -- Email or user identifier
    status submission_status DEFAULT 'draft' NOT NULL,

    -- Workflow metadata
    submission_number INTEGER, -- Sequential submission number per contractor/template
    parent_submission_id UUID REFERENCES mep_form_submissions(id) ON DELETE SET NULL, -- For tracking revisions
    revision_count INTEGER DEFAULT 0,

    -- Compliance & audit
    coperniq_import_status TEXT, -- pending, success, failed
    coperniq_import_id TEXT, -- Reference to Coperniq import transaction
    import_error_message TEXT, -- Error details if import failed

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT form_title_not_empty CHECK (form_title ~ '^\s*\S'),
    CONSTRAINT valid_json_structure CHECK (form_data IS NOT NULL),
    CONSTRAINT submitted_at_requires_submitted_status CHECK (
        CASE
            WHEN status IN ('submitted', 'approved', 'rejected') THEN submitted_at IS NOT NULL
            ELSE true
        END
    ),
    CONSTRAINT approved_at_requires_approved_status CHECK (
        CASE
            WHEN status = 'approved' THEN approved_at IS NOT NULL
            ELSE true
        END
    )
);

-- ============================================================================
-- mep_template_usage table
-- Tracks template views, fills, and submissions for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS mep_template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    contractor_config_id UUID NOT NULL REFERENCES mep_contractor_configs(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES mep_form_submissions(id) ON DELETE SET NULL,

    -- Action tracking
    action usage_action_type NOT NULL,
    action_count INTEGER DEFAULT 1, -- Aggregate count for similar actions in same session
    time_spent_seconds INTEGER, -- How long spent on template (if available)

    -- User info
    user_email TEXT,

    -- Session tracking
    session_id TEXT, -- Browser session ID if available

    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_time_spent CHECK (time_spent_seconds IS NULL OR time_spent_seconds > 0),
    CONSTRAINT positive_action_count CHECK (action_count > 0)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Contractor config indexes
CREATE INDEX idx_contractor_configs_name ON mep_contractor_configs(contractor_name);
CREATE INDEX idx_contractor_configs_email ON mep_contractor_configs(contractor_email);
CREATE INDEX idx_contractor_configs_trades ON mep_contractor_configs USING GIN(trades);
CREATE INDEX idx_contractor_configs_markets ON mep_contractor_configs USING GIN(markets);
CREATE INDEX idx_contractor_configs_phases ON mep_contractor_configs USING GIN(phases);
CREATE INDEX idx_contractor_configs_active ON mep_contractor_configs(is_active);
CREATE INDEX idx_contractor_configs_created ON mep_contractor_configs(created_at DESC);
CREATE INDEX idx_contractor_configs_preset ON mep_contractor_configs(preset_used);

-- Form submission indexes
CREATE INDEX idx_form_submissions_template ON mep_form_submissions(template_id);
CREATE INDEX idx_form_submissions_contractor ON mep_form_submissions(contractor_config_id);
CREATE INDEX idx_form_submissions_status ON mep_form_submissions(status);
CREATE INDEX idx_form_submissions_submitted_by ON mep_form_submissions(submitted_by);
CREATE INDEX idx_form_submissions_submitted_at ON mep_form_submissions(submitted_at DESC);
CREATE INDEX idx_form_submissions_coperniq_import ON mep_form_submissions(coperniq_import_status);
CREATE INDEX idx_form_submissions_parent ON mep_form_submissions(parent_submission_id);
CREATE INDEX idx_form_submissions_form_data ON mep_form_submissions USING GIN(form_data);
CREATE INDEX idx_form_submissions_composite ON mep_form_submissions(contractor_config_id, template_id, status);

-- Template usage indexes
CREATE INDEX idx_template_usage_template ON mep_template_usage(template_id);
CREATE INDEX idx_template_usage_contractor ON mep_template_usage(contractor_config_id);
CREATE INDEX idx_template_usage_action ON mep_template_usage(action);
CREATE INDEX idx_template_usage_timestamp ON mep_template_usage(timestamp DESC);
CREATE INDEX idx_template_usage_submission ON mep_template_usage(submission_id);
CREATE INDEX idx_template_usage_composite ON mep_template_usage(contractor_config_id, template_id, action);

-- ============================================================================
-- Triggers for timestamp management and counts
-- ============================================================================

-- Update updated_at for contractor configs
CREATE TRIGGER contractor_configs_updated_at
    BEFORE UPDATE ON mep_contractor_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update updated_at for form submissions
CREATE TRIGGER form_submissions_updated_at
    BEFORE UPDATE ON mep_form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-update templates_enabled_count when templates_enabled changes
CREATE OR REPLACE FUNCTION update_contractor_template_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.templates_enabled_count := array_length(NEW.templates_enabled, 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contractor_configs_template_count
    BEFORE INSERT OR UPDATE ON mep_contractor_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_contractor_template_count();

-- Auto-set submitted_at when status changes to submitted
CREATE OR REPLACE FUNCTION set_submission_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
        NEW.submitted_at := NOW();
    END IF;

    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.approved_at := NOW();
    END IF;

    IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
        NEW.archived_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_submissions_status_timestamps
    BEFORE UPDATE ON mep_form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION set_submission_timestamps();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE mep_contractor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_template_usage ENABLE ROW LEVEL SECURITY;

-- Public read access for active configs (allow contractors to see examples)
CREATE POLICY "Public read active configs" ON mep_contractor_configs
    FOR SELECT USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access" ON mep_contractor_configs
    FOR ALL USING (auth.role() = 'service_role');

-- Contractor can read their own config
CREATE POLICY "Contractor read own config" ON mep_contractor_configs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        (contractor_email = auth.jwt() ->> 'email' OR auth.role() = 'service_role')
    );

-- Contractor can insert their own config
CREATE POLICY "Contractor create own config" ON mep_contractor_configs
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR contractor_email = auth.jwt() ->> 'email');

-- Contractor can update their own config
CREATE POLICY "Contractor update own config" ON mep_contractor_configs
    FOR UPDATE USING (
        auth.role() = 'service_role' OR contractor_email = auth.jwt() ->> 'email'
    );

-- Form submissions: service role full access
CREATE POLICY "Service role full access" ON mep_form_submissions
    FOR ALL USING (auth.role() = 'service_role');

-- Form submissions: contractor can read their own
CREATE POLICY "Contractor read own submissions" ON mep_form_submissions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        submitted_by = auth.jwt() ->> 'email'
    );

-- Form submissions: contractor can insert their own
CREATE POLICY "Contractor create own submission" ON mep_form_submissions
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        submitted_by = auth.jwt() ->> 'email'
    );

-- Form submissions: contractor can update draft status only
CREATE POLICY "Contractor update draft submission" ON mep_form_submissions
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        (submitted_by = auth.jwt() ->> 'email' AND status = 'draft')
    );

-- Template usage: service role full access
CREATE POLICY "Service role full access" ON mep_template_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Template usage: contractor can read their own
CREATE POLICY "Contractor read own usage" ON mep_template_usage
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        user_email = auth.jwt() ->> 'email'
    );

-- Template usage: contractor can insert their own
CREATE POLICY "Contractor create own usage" ON mep_template_usage
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        user_email = auth.jwt() ->> 'email'
    );

-- ============================================================================
-- Views for Analytics and Reporting
-- ============================================================================

-- Contractor summary with template counts and submission stats
CREATE OR REPLACE VIEW contractor_summary AS
SELECT
    cc.id,
    cc.contractor_name,
    cc.contractor_email,
    cc.trades,
    cc.markets,
    cc.phases,
    cc.preset_used,
    cc.templates_enabled_count,
    cc.is_active,
    cc.created_at,
    COUNT(DISTINCT fs.id) as total_submissions,
    COUNT(DISTINCT CASE WHEN fs.status = 'draft' THEN fs.id END) as draft_submissions,
    COUNT(DISTINCT CASE WHEN fs.status = 'submitted' THEN fs.id END) as submitted_submissions,
    COUNT(DISTINCT CASE WHEN fs.status = 'approved' THEN fs.id END) as approved_submissions,
    MAX(fs.submitted_at) as last_submission_at
FROM mep_contractor_configs cc
LEFT JOIN mep_form_submissions fs ON fs.contractor_config_id = cc.id
GROUP BY cc.id;

-- Template usage analytics
CREATE OR REPLACE VIEW template_usage_analytics AS
SELECT
    t.id,
    t.name as template_name,
    t.trade,
    t.phase,
    COUNT(DISTINCT mtu.contractor_config_id) as unique_contractors,
    COUNT(CASE WHEN mtu.action = 'viewed' THEN 1 END) as views,
    COUNT(CASE WHEN mtu.action = 'filled' THEN 1 END) as fills,
    COUNT(CASE WHEN mtu.action = 'submitted' THEN 1 END) as submissions,
    COUNT(CASE WHEN mtu.action = 'edited' THEN 1 END) as edits,
    ROUND(AVG(mtu.time_spent_seconds)::numeric, 2) as avg_time_spent_seconds,
    MAX(mtu.timestamp) as last_used_at
FROM templates t
LEFT JOIN mep_template_usage mtu ON mtu.template_id = t.id
GROUP BY t.id, t.name, t.trade, t.phase;

-- Form submission details with template and contractor info
CREATE OR REPLACE VIEW form_submission_details AS
SELECT
    fs.id,
    fs.form_title,
    fs.status,
    fs.submission_number,
    fs.revision_count,
    fs.submitted_by,
    fs.submitted_at,
    fs.approved_at,
    fs.coperniq_import_status,
    fs.created_at,
    fs.updated_at,
    t.name as template_name,
    t.trade as template_trade,
    t.phase as template_phase,
    cc.contractor_name,
    cc.contractor_email,
    cc.preset_used,
    jsonb_object_keys(fs.form_data) as field_count,
    fs.form_data
FROM mep_form_submissions fs
LEFT JOIN templates t ON t.id = fs.template_id
LEFT JOIN mep_contractor_configs cc ON cc.id = fs.contractor_config_id;

-- Contractor activity timeline
CREATE OR REPLACE VIEW contractor_activity_timeline AS
SELECT
    cc.id as contractor_id,
    cc.contractor_name,
    'config_created' as activity_type,
    cc.created_at as activity_time,
    'Configuration created' as activity_description,
    NULL::UUID as submission_id
FROM mep_contractor_configs cc

UNION ALL

SELECT
    fs.contractor_config_id,
    cc.contractor_name,
    CASE
        WHEN fs.status = 'draft' THEN 'form_drafted'
        WHEN fs.status = 'submitted' THEN 'form_submitted'
        WHEN fs.status = 'approved' THEN 'form_approved'
        WHEN fs.status = 'rejected' THEN 'form_rejected'
        ELSE 'form_updated'
    END,
    COALESCE(fs.submitted_at, fs.approved_at, fs.updated_at),
    CONCAT('Form submission: ', fs.form_title),
    fs.id
FROM mep_form_submissions fs
LEFT JOIN mep_contractor_configs cc ON cc.id = fs.contractor_config_id
ORDER BY activity_time DESC;

-- ============================================================================
-- Functions for Common Operations
-- ============================================================================

-- Get contractor's template usage stats
CREATE OR REPLACE FUNCTION get_contractor_template_stats(config_id UUID)
RETURNS TABLE (
    template_id UUID,
    template_name TEXT,
    trade TEXT,
    views INTEGER,
    fills INTEGER,
    submissions INTEGER,
    last_used_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.trade,
        COUNT(CASE WHEN mtu.action = 'viewed' THEN 1 END)::INTEGER,
        COUNT(CASE WHEN mtu.action = 'filled' THEN 1 END)::INTEGER,
        COUNT(CASE WHEN mtu.action = 'submitted' THEN 1 END)::INTEGER,
        MAX(mtu.timestamp)
    FROM templates t
    LEFT JOIN mep_template_usage mtu ON mtu.template_id = t.id
        AND mtu.contractor_config_id = config_id
    WHERE EXISTS (
        SELECT 1 FROM mep_contractor_configs cc
        WHERE cc.id = config_id
    )
    GROUP BY t.id, t.name, t.trade;
END;
$$ LANGUAGE plpgsql;

-- Record template usage action
CREATE OR REPLACE FUNCTION record_template_usage(
    p_template_id UUID,
    p_contractor_id UUID,
    p_action usage_action_type,
    p_user_email TEXT DEFAULT NULL,
    p_time_spent_seconds INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    INSERT INTO mep_template_usage (
        template_id,
        contractor_config_id,
        action,
        user_email,
        time_spent_seconds
    )
    VALUES (
        p_template_id,
        p_contractor_id,
        p_action,
        COALESCE(p_user_email, (SELECT contractor_email FROM mep_contractor_configs WHERE id = p_contractor_id)),
        p_time_spent_seconds
    )
    RETURNING id INTO v_usage_id;

    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- Create a new form submission with auto-increment submission number
CREATE OR REPLACE FUNCTION create_form_submission(
    p_template_id UUID,
    p_contractor_id UUID,
    p_form_title TEXT,
    p_form_data JSONB,
    p_submitted_by TEXT
)
RETURNS UUID AS $$
DECLARE
    v_submission_id UUID;
    v_submission_number INTEGER;
BEGIN
    -- Get next submission number for this contractor/template combo
    SELECT COALESCE(MAX(submission_number), 0) + 1 INTO v_submission_number
    FROM mep_form_submissions
    WHERE contractor_config_id = p_contractor_id
        AND template_id = p_template_id;

    INSERT INTO mep_form_submissions (
        template_id,
        contractor_config_id,
        form_title,
        form_data,
        submitted_by,
        submission_number,
        status
    )
    VALUES (
        p_template_id,
        p_contractor_id,
        p_form_title,
        p_form_data,
        p_submitted_by,
        v_submission_number,
        'draft'
    )
    RETURNING id INTO v_submission_id;

    RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE mep_contractor_configs IS
    'Stores wizard-generated configurations for MEP contractors. Includes enabled trades, markets, phases, and templates.';

COMMENT ON TABLE mep_form_submissions IS
    'Stores completed form submissions from contractors. Tracks status, Coperniq import status, and revision history.';

COMMENT ON TABLE mep_template_usage IS
    'Analytics table tracking template views, fills, submissions, and edits for usage insights.';

COMMENT ON COLUMN mep_contractor_configs.trades IS
    'Array of enabled trades: hvac, plumbing, electrical, solar, fire_protection, controls, etc.';

COMMENT ON COLUMN mep_contractor_configs.templates_enabled IS
    'Array of template names/paths enabled for this contractor configuration.';

COMMENT ON COLUMN mep_form_submissions.form_data IS
    'Complete form submission as JSONB. Structure: {fieldName: value, ...}';

COMMENT ON COLUMN mep_form_submissions.coperniq_import_status IS
    'Status of Coperniq CSV import: pending, success, failed';

COMMENT ON COLUMN mep_template_usage.session_id IS
    'Browser session ID for tracking user sessions across multiple actions.';

COMMENT ON FUNCTION get_contractor_template_stats IS
    'Returns template usage statistics (views, fills, submissions) for a specific contractor.';

COMMENT ON FUNCTION record_template_usage IS
    'Records a template usage action (viewed, filled, submitted, edited, exported). Returns usage record ID.';

COMMENT ON FUNCTION create_form_submission IS
    'Creates a new form submission with auto-incrementing submission number. Returns submission ID.';

-- ============================================================================
-- Down Migration (in comments for reference)
-- ============================================================================
/*
-- To rollback this migration, execute:

DROP FUNCTION IF EXISTS create_form_submission(UUID, UUID, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS record_template_usage(UUID, UUID, usage_action_type, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_contractor_template_stats(UUID);
DROP VIEW IF EXISTS contractor_activity_timeline;
DROP VIEW IF EXISTS form_submission_details;
DROP VIEW IF EXISTS template_usage_analytics;
DROP VIEW IF EXISTS contractor_summary;
DROP TRIGGER IF EXISTS form_submissions_status_timestamps ON mep_form_submissions;
DROP FUNCTION IF EXISTS set_submission_timestamps();
DROP TRIGGER IF EXISTS contractor_configs_template_count ON mep_contractor_configs;
DROP FUNCTION IF EXISTS update_contractor_template_count();
DROP TRIGGER IF EXISTS form_submissions_updated_at ON mep_form_submissions;
DROP TRIGGER IF EXISTS contractor_configs_updated_at ON mep_contractor_configs;
DROP TABLE IF EXISTS mep_template_usage;
DROP TABLE IF EXISTS mep_form_submissions;
DROP TABLE IF EXISTS mep_contractor_configs;
DROP TYPE IF EXISTS usage_action_type;
DROP TYPE IF EXISTS submission_status;
DROP TYPE IF EXISTS market_type;
*/
