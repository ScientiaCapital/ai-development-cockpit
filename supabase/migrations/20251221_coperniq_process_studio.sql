-- Coperniq Process Studio - Complete Schema
-- Created: 2025-12-21
-- Purpose: Mirror ALL Process Studio templates for version control, auditing, and improvement
-- Covers: Project Workflows, Request Workflows, Field WOs, Office WOs, Forms, Payment Structures, Document Requests, Automations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE ENUMS
-- ============================================================================

-- Template type enum matching Coperniq Process Studio sections
CREATE TYPE process_studio_type AS ENUM (
    'project_workflow',
    'request_workflow',
    'field_work_order',
    'office_work_order',
    'form',
    'payment_structure',
    'document_request',
    'automation'
);

-- Trade/vertical enum
CREATE TYPE trade_enum AS ENUM (
    'hvac',
    'plumbing',
    'electrical',
    'solar',
    'fire_protection',
    'roofing',
    'low_voltage',
    'controls',
    'general_contractor',
    'multi_trade',
    'om_service'
);

-- Workflow phase enum
CREATE TYPE workflow_phase AS ENUM (
    'sales',
    'design',
    'permit',
    'procurement',
    'install',
    'commissioning',
    'closeout',
    'service',
    'om'
);

-- Priority enum
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

-- ============================================================================
-- 1. WORKFLOWS (Project Workflows + Request Workflows)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ps_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Coperniq reference
    coperniq_id VARCHAR(50) UNIQUE,
    coperniq_url TEXT,

    -- Workflow metadata
    name TEXT NOT NULL,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('project', 'request')),
    trade trade_enum,
    description TEXT,

    -- Workflow configuration
    is_default BOOLEAN DEFAULT false,
    trigger_conditions JSONB,           -- When this workflow activates

    -- Audit tracking
    audit_score INTEGER CHECK (audit_score >= 0 AND audit_score <= 10),
    audit_notes TEXT,

    -- Version control
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'claude-code'
);

-- Workflow stages (phases within a workflow)
CREATE TABLE IF NOT EXISTS ps_workflow_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES ps_workflows(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    description TEXT,

    -- Stage behavior
    is_required BOOLEAN DEFAULT true,
    auto_advance BOOLEAN DEFAULT false,
    completion_criteria JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(workflow_id, stage_order)
);

-- ============================================================================
-- 2. WORK ORDERS (Field Work Orders + Office Work Orders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ps_work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Coperniq reference
    coperniq_id VARCHAR(50) UNIQUE,
    coperniq_url TEXT,

    -- Work order metadata
    name TEXT NOT NULL,
    work_order_type TEXT NOT NULL CHECK (work_order_type IN ('field', 'office')),
    trade trade_enum,
    category TEXT,                       -- 'permit', 'inspection', 'service', 'sales', 'admin'
    phase workflow_phase,
    description TEXT,
    instructions TEXT,                   -- Full instructions from Coperniq

    -- Defaults
    priority priority_enum DEFAULT 'medium',
    default_assignee TEXT,
    estimated_duration_hours NUMERIC,

    -- Compliance
    compliance_standards TEXT[],         -- ['EPA 608', 'NFPA 25', 'NEC 2023']

    -- Audit tracking
    audit_score INTEGER CHECK (audit_score >= 0 AND audit_score <= 10),
    audit_notes TEXT,
    audit_date TIMESTAMPTZ,
    improvements_suggested TEXT[],

    -- Version control
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'claude-code'
);

-- Work order checklist items
CREATE TABLE IF NOT EXISTS ps_work_order_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES ps_work_orders(id) ON DELETE CASCADE,

    item_text TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,

    -- Expert assessment
    is_actionable BOOLEAN DEFAULT true,
    is_industry_standard BOOLEAN DEFAULT false,
    compliance_reference TEXT,
    suggested_improvement TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(work_order_id, display_order)
);

-- ============================================================================
-- 3. FORMS (Form Templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ps_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Coperniq reference
    coperniq_id VARCHAR(50) UNIQUE,
    coperniq_url TEXT,

    -- Form metadata
    name TEXT NOT NULL,
    trade trade_enum,
    category TEXT,                       -- 'inspection', 'checklist', 'report', 'intake'
    phase workflow_phase,
    description TEXT,

    -- Compliance
    compliance_standards TEXT[],

    -- Counts
    total_fields INTEGER DEFAULT 0,
    total_groups INTEGER DEFAULT 0,

    -- Audit tracking
    audit_score INTEGER CHECK (audit_score >= 0 AND audit_score <= 10),
    audit_notes TEXT,

    -- Version control
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'claude-code'
);

-- Form groups (sections within a form)
CREATE TABLE IF NOT EXISTS ps_form_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES ps_forms(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_critical BOOLEAN DEFAULT false,
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(form_id, display_order)
);

-- Form fields
CREATE TABLE IF NOT EXISTS ps_form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES ps_forms(id) ON DELETE CASCADE,
    group_id UUID REFERENCES ps_form_groups(id) ON DELETE SET NULL,

    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'numeric', 'single_select', 'multiple_select', 'file', 'date', 'signature')),

    is_required BOOLEAN DEFAULT false,
    placeholder TEXT,
    description TEXT,

    -- For select fields
    options JSONB,                       -- ["Option 1", "Option 2"]

    -- Validation
    validation_rules JSONB,              -- {min: 0, max: 100, pattern: "regex"}
    alert_threshold NUMERIC,             -- For numeric fields with alerts

    display_order INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(form_id, name)
);

-- ============================================================================
-- 4. PAYMENT STRUCTURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ps_payment_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Coperniq reference
    coperniq_id VARCHAR(50) UNIQUE,
    coperniq_url TEXT,

    -- Payment structure metadata
    name TEXT NOT NULL,
    trade trade_enum,
    category TEXT,                       -- 'residential', 'commercial', 'service'
    description TEXT,

    -- Payment terms
    total_milestones INTEGER DEFAULT 0,

    -- Audit tracking
    audit_score INTEGER CHECK (audit_score >= 0 AND audit_score <= 10),
    audit_notes TEXT,

    -- Version control
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'claude-code'
);

-- Payment milestones
CREATE TABLE IF NOT EXISTS ps_payment_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_structure_id UUID NOT NULL REFERENCES ps_payment_structures(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    milestone_order INTEGER NOT NULL DEFAULT 1,

    -- Payment details
    percentage NUMERIC CHECK (percentage >= 0 AND percentage <= 100),
    fixed_amount NUMERIC,

    -- Trigger
    trigger_event TEXT,                  -- 'contract_signed', 'equipment_delivered', 'install_complete'
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(payment_structure_id, milestone_order)
);

-- ============================================================================
-- 5. DOCUMENT REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ps_document_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Coperniq reference
    coperniq_id VARCHAR(50) UNIQUE,
    coperniq_url TEXT,

    -- Document request metadata
    name TEXT NOT NULL,
    trade trade_enum,
    category TEXT,                       -- 'permit', 'compliance', 'warranty', 'financial'
    description TEXT,

    -- Request configuration
    is_required BOOLEAN DEFAULT true,
    due_days INTEGER,                    -- Days after trigger to request
    reminder_days INTEGER[],             -- [3, 7, 14] days before due

    -- Audit tracking
    audit_score INTEGER CHECK (audit_score >= 0 AND audit_score <= 10),
    audit_notes TEXT,

    -- Version control
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'claude-code'
);

-- Document request items
CREATE TABLE IF NOT EXISTS ps_document_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_request_id UUID NOT NULL REFERENCES ps_document_requests(id) ON DELETE CASCADE,

    document_name TEXT NOT NULL,
    document_type TEXT,                  -- 'pdf', 'image', 'any'
    is_required BOOLEAN DEFAULT true,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(document_request_id, display_order)
);

-- ============================================================================
-- 6. AUTOMATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ps_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Coperniq reference
    coperniq_id VARCHAR(50) UNIQUE,
    coperniq_url TEXT,

    -- Automation metadata
    name TEXT NOT NULL,
    trade trade_enum,
    description TEXT,

    -- Automation configuration
    trigger_type TEXT,                   -- 'status_change', 'date', 'field_update', 'webhook'
    trigger_config JSONB,                -- Trigger conditions
    action_type TEXT,                    -- 'create_task', 'send_email', 'update_field', 'webhook'
    action_config JSONB,                 -- Action parameters

    -- Audit tracking
    audit_score INTEGER CHECK (audit_score >= 0 AND audit_score <= 10),
    audit_notes TEXT,

    -- Version control
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'claude-code'
);

-- ============================================================================
-- 7. UNIFIED AUDIT HISTORY (for all template types)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ps_audit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference to any template type
    template_type process_studio_type NOT NULL,
    template_id UUID NOT NULL,           -- References the specific template

    -- Audit data
    audit_score INTEGER NOT NULL CHECK (audit_score >= 0 AND audit_score <= 10),
    audit_notes TEXT,

    -- Detailed criteria scores
    criteria_scores JSONB,               -- {"completeness": 8, "actionability": 9, "compliance": 7}

    -- Findings
    missing_items TEXT[],
    improvements_suggested TEXT[],

    audited_at TIMESTAMPTZ DEFAULT NOW(),
    audited_by TEXT DEFAULT 'claude-code'
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Workflows
CREATE INDEX idx_ps_workflows_type ON ps_workflows(workflow_type);
CREATE INDEX idx_ps_workflows_trade ON ps_workflows(trade);
CREATE INDEX idx_ps_workflow_stages_workflow ON ps_workflow_stages(workflow_id);

-- Work Orders
CREATE INDEX idx_ps_work_orders_type ON ps_work_orders(work_order_type);
CREATE INDEX idx_ps_work_orders_trade ON ps_work_orders(trade);
CREATE INDEX idx_ps_work_orders_phase ON ps_work_orders(phase);
CREATE INDEX idx_ps_work_orders_audit ON ps_work_orders(audit_score);
CREATE INDEX idx_ps_wo_checklist_wo ON ps_work_order_checklist(work_order_id);

-- Forms
CREATE INDEX idx_ps_forms_trade ON ps_forms(trade);
CREATE INDEX idx_ps_forms_category ON ps_forms(category);
CREATE INDEX idx_ps_form_groups_form ON ps_form_groups(form_id);
CREATE INDEX idx_ps_form_fields_form ON ps_form_fields(form_id);
CREATE INDEX idx_ps_form_fields_group ON ps_form_fields(group_id);

-- Payment Structures
CREATE INDEX idx_ps_payment_structures_trade ON ps_payment_structures(trade);
CREATE INDEX idx_ps_payment_milestones_ps ON ps_payment_milestones(payment_structure_id);

-- Document Requests
CREATE INDEX idx_ps_doc_requests_trade ON ps_document_requests(trade);
CREATE INDEX idx_ps_doc_request_items_dr ON ps_document_request_items(document_request_id);

-- Automations
CREATE INDEX idx_ps_automations_trade ON ps_automations(trade);
CREATE INDEX idx_ps_automations_trigger ON ps_automations(trigger_type);

-- Audit History
CREATE INDEX idx_ps_audit_template_type ON ps_audit_history(template_type);
CREATE INDEX idx_ps_audit_template_id ON ps_audit_history(template_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ps_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_work_order_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_form_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_payment_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_document_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_audit_history ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read" ON ps_workflows FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_workflow_stages FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_work_orders FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_work_order_checklist FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_forms FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_form_groups FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_form_fields FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_payment_structures FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_payment_milestones FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_document_requests FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_document_request_items FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_automations FOR SELECT USING (true);
CREATE POLICY "Public read" ON ps_audit_history FOR SELECT USING (true);

-- Service role full access for all tables
CREATE POLICY "Service full" ON ps_workflows FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_workflow_stages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_work_orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_work_order_checklist FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_forms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_form_groups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_form_fields FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_payment_structures FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_payment_milestones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_document_requests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_document_request_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_automations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full" ON ps_audit_history FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION ps_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ps_workflows_updated BEFORE UPDATE ON ps_workflows FOR EACH ROW EXECUTE FUNCTION ps_update_timestamp();
CREATE TRIGGER ps_work_orders_updated BEFORE UPDATE ON ps_work_orders FOR EACH ROW EXECUTE FUNCTION ps_update_timestamp();
CREATE TRIGGER ps_forms_updated BEFORE UPDATE ON ps_forms FOR EACH ROW EXECUTE FUNCTION ps_update_timestamp();
CREATE TRIGGER ps_payment_structures_updated BEFORE UPDATE ON ps_payment_structures FOR EACH ROW EXECUTE FUNCTION ps_update_timestamp();
CREATE TRIGGER ps_document_requests_updated BEFORE UPDATE ON ps_document_requests FOR EACH ROW EXECUTE FUNCTION ps_update_timestamp();
CREATE TRIGGER ps_automations_updated BEFORE UPDATE ON ps_automations FOR EACH ROW EXECUTE FUNCTION ps_update_timestamp();

-- ============================================================================
-- SUMMARY VIEWS
-- ============================================================================

-- Complete Process Studio inventory
CREATE OR REPLACE VIEW ps_inventory AS
SELECT 'workflow' as type, id, name, trade::text, audit_score, is_active, created_at FROM ps_workflows
UNION ALL
SELECT work_order_type || '_work_order' as type, id, name, trade::text, audit_score, is_active, created_at FROM ps_work_orders
UNION ALL
SELECT 'form' as type, id, name, trade::text, audit_score, is_active, created_at FROM ps_forms
UNION ALL
SELECT 'payment_structure' as type, id, name, trade::text, audit_score, is_active, created_at FROM ps_payment_structures
UNION ALL
SELECT 'document_request' as type, id, name, trade::text, audit_score, is_active, created_at FROM ps_document_requests
UNION ALL
SELECT 'automation' as type, id, name, trade::text, audit_score, is_active, created_at FROM ps_automations;

-- Work order summary with checklist count
CREATE OR REPLACE VIEW ps_work_order_summary AS
SELECT
    wo.id,
    wo.name,
    wo.work_order_type,
    wo.trade,
    wo.category,
    wo.phase,
    wo.coperniq_id,
    wo.priority,
    wo.audit_score,
    COUNT(woc.id) as checklist_count,
    wo.version,
    wo.is_active,
    wo.created_at
FROM ps_work_orders wo
LEFT JOIN ps_work_order_checklist woc ON woc.work_order_id = wo.id
GROUP BY wo.id;

-- Form summary with field count
CREATE OR REPLACE VIEW ps_form_summary AS
SELECT
    f.id,
    f.name,
    f.trade,
    f.category,
    f.coperniq_id,
    f.audit_score,
    COUNT(DISTINCT fg.id) as group_count,
    COUNT(DISTINCT ff.id) as field_count,
    f.version,
    f.is_active,
    f.created_at
FROM ps_forms f
LEFT JOIN ps_form_groups fg ON fg.form_id = f.id
LEFT JOIN ps_form_fields ff ON ff.form_id = f.id
GROUP BY f.id;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get full work order with checklist
CREATE OR REPLACE FUNCTION ps_get_work_order_full(p_coperniq_id TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'work_order', row_to_json(wo.*),
        'checklist', COALESCE((
            SELECT jsonb_agg(row_to_json(woc.*) ORDER BY woc.display_order)
            FROM ps_work_order_checklist woc
            WHERE woc.work_order_id = wo.id
        ), '[]'::jsonb)
    )
    INTO result
    FROM ps_work_orders wo
    WHERE wo.coperniq_id = p_coperniq_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get full form with groups and fields
CREATE OR REPLACE FUNCTION ps_get_form_full(p_coperniq_id TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'form', row_to_json(f.*),
        'groups', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'group', row_to_json(fg.*),
                    'fields', COALESCE((
                        SELECT jsonb_agg(row_to_json(ff.*) ORDER BY ff.display_order)
                        FROM ps_form_fields ff
                        WHERE ff.group_id = fg.id
                    ), '[]'::jsonb)
                ) ORDER BY fg.display_order
            )
            FROM ps_form_groups fg
            WHERE fg.form_id = f.id
        ), '[]'::jsonb)
    )
    INTO result
    FROM ps_forms f
    WHERE f.coperniq_id = p_coperniq_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Stats by trade
CREATE OR REPLACE FUNCTION ps_stats_by_trade()
RETURNS TABLE (
    trade TEXT,
    workflow_count BIGINT,
    work_order_count BIGINT,
    form_count BIGINT,
    payment_structure_count BIGINT,
    avg_audit_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.trade,
        COUNT(DISTINCT w.id) as workflow_count,
        COUNT(DISTINCT wo.id) as work_order_count,
        COUNT(DISTINCT f.id) as form_count,
        COUNT(DISTINCT ps.id) as payment_structure_count,
        ROUND(AVG(COALESCE(wo.audit_score, f.audit_score, ps.audit_score)), 1) as avg_audit_score
    FROM (
        SELECT DISTINCT trade::text FROM ps_workflows WHERE trade IS NOT NULL
        UNION SELECT DISTINCT trade::text FROM ps_work_orders WHERE trade IS NOT NULL
        UNION SELECT DISTINCT trade::text FROM ps_forms WHERE trade IS NOT NULL
    ) t(trade)
    LEFT JOIN ps_workflows w ON w.trade::text = t.trade
    LEFT JOIN ps_work_orders wo ON wo.trade::text = t.trade
    LEFT JOIN ps_forms f ON f.trade::text = t.trade
    LEFT JOIN ps_payment_structures ps ON ps.trade::text = t.trade
    GROUP BY t.trade
    ORDER BY t.trade;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ps_workflows IS 'Project and Request Workflows from Coperniq Process Studio';
COMMENT ON TABLE ps_work_orders IS 'Field and Office Work Order templates';
COMMENT ON TABLE ps_forms IS 'Form templates with groups and fields';
COMMENT ON TABLE ps_payment_structures IS 'Payment milestone structures';
COMMENT ON TABLE ps_document_requests IS 'Document request templates';
COMMENT ON TABLE ps_automations IS 'Automation rules and triggers';
COMMENT ON TABLE ps_audit_history IS 'Unified audit history for all template types';
COMMENT ON VIEW ps_inventory IS 'Complete inventory of all Process Studio templates';
