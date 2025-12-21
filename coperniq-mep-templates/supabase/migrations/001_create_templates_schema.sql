-- Coperniq MEP Templates Schema
-- Generated: 2025-12-20
-- Purpose: Store template specifications in Supabase for persistence and querying

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table - stores template metadata
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    trade TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    phase TEXT, -- sales, design, permit, install, commissioning, om, service
    compliance TEXT[], -- Array of compliance standards
    work_order_type TEXT,
    work_order_name TEXT,
    total_fields INTEGER DEFAULT 0,
    total_groups INTEGER DEFAULT 0,
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'ai-development-cockpit'
);

-- Template groups table - stores field groupings
CREATE TABLE IF NOT EXISTS template_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, name)
);

-- Template fields table - stores individual form fields
CREATE TABLE IF NOT EXISTS template_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    group_id UUID REFERENCES template_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('Text', 'Numeric', 'Single select', 'Multiple select', 'File')),
    is_required BOOLEAN DEFAULT false,
    placeholder TEXT,
    description TEXT,
    options JSONB, -- For select types: ["Option 1", "Option 2"]
    validation_rules JSONB, -- {min: 0, max: 100, pattern: "regex"}
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, name)
);

-- Trade enum type for consistency
CREATE TYPE trade_type AS ENUM (
    'hvac',
    'plumbing',
    'electrical',
    'solar',
    'fire_protection',
    'controls',
    'tud_market',
    'low_voltage',
    'roofing',
    'general_contractor'
);

-- Phase enum for workflow stages
CREATE TYPE phase_type AS ENUM (
    'sales',
    'design',
    'permit',
    'install',
    'commissioning',
    'om',
    'service'
);

-- Create indexes for fast lookups
CREATE INDEX idx_templates_trade ON templates(trade);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_phase ON templates(phase);
CREATE INDEX idx_templates_active ON templates(is_active);
CREATE INDEX idx_template_fields_template ON template_fields(template_id);
CREATE INDEX idx_template_fields_group ON template_fields(group_id);
CREATE INDEX idx_template_groups_template ON template_groups(template_id);

-- Function to update timestamp on changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for templates table
CREATE TRIGGER templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Row Level Security policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for now)
CREATE POLICY "Public read access" ON templates FOR SELECT USING (true);
CREATE POLICY "Public read access" ON template_groups FOR SELECT USING (true);
CREATE POLICY "Public read access" ON template_fields FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access" ON templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON template_groups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON template_fields FOR ALL USING (auth.role() = 'service_role');

-- View for complete template with field count
CREATE OR REPLACE VIEW template_summary AS
SELECT
    t.id,
    t.name,
    t.display_name,
    t.trade,
    t.category,
    t.phase,
    t.emoji,
    t.compliance,
    t.version,
    t.is_active,
    COUNT(DISTINCT g.id) as group_count,
    COUNT(DISTINCT f.id) as field_count,
    COUNT(DISTINCT CASE WHEN f.is_required THEN f.id END) as required_field_count,
    t.created_at,
    t.updated_at
FROM templates t
LEFT JOIN template_groups g ON g.template_id = t.id
LEFT JOIN template_fields f ON f.template_id = t.id
GROUP BY t.id;

-- Function to get full template with groups and fields
CREATE OR REPLACE FUNCTION get_template_full(template_name TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'template', row_to_json(t.*),
        'groups', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', g.id,
                    'name', g.name,
                    'display_order', g.display_order,
                    'fields', COALESCE((
                        SELECT jsonb_agg(row_to_json(f.*) ORDER BY f.display_order)
                        FROM template_fields f
                        WHERE f.group_id = g.id
                    ), '[]'::jsonb)
                ) ORDER BY g.display_order
            )
            FROM template_groups g
            WHERE g.template_id = t.id
        ), '[]'::jsonb)
    )
    INTO result
    FROM templates t
    WHERE t.name = template_name;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE templates IS 'MEP form template specifications for Coperniq';
COMMENT ON TABLE template_groups IS 'Logical groupings of fields within a template';
COMMENT ON TABLE template_fields IS 'Individual form fields with type and validation';
