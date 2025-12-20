-- MEP Templates Schema for Coperniq Template Automation
-- Created: 2025-12-20
-- Purpose: Store template specs for Playwright seeding OR API integration

-- Main templates table
CREATE TABLE IF NOT EXISTS mep_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'HVAC', 'Plumbing', 'Electrical', 'Fire Protection'
    compliance VARCHAR(100),        -- 'EPA Section 608', 'NFPA 25', etc.
    work_order_type VARCHAR(100),
    work_order_name VARCHAR(255),
    spec JSONB NOT NULL,            -- Full YAML spec as JSON
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'seeded', 'verified'
    coperniq_template_id VARCHAR(50), -- ID after created in Coperniq
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template groups (sections within a template)
CREATE TABLE IF NOT EXISTS mep_template_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES mep_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    is_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template fields
CREATE TABLE IF NOT EXISTS mep_template_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES mep_template_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'Text', 'Numeric', 'Single select', 'Multiple select', 'File'
    required BOOLEAN DEFAULT FALSE,
    placeholder TEXT,
    description TEXT,
    options JSONB,                   -- For select fields: ["Option 1", "Option 2"]
    alert_threshold NUMERIC,         -- For numeric fields with alerts
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seeding jobs (track Playwright automation runs)
CREATE TABLE IF NOT EXISTS mep_seeding_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES mep_templates(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed'
    method VARCHAR(20) NOT NULL,     -- 'playwright', 'api'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    coperniq_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_mep_templates_category ON mep_templates(category);
CREATE INDEX IF NOT EXISTS idx_mep_templates_status ON mep_templates(status);
CREATE INDEX IF NOT EXISTS idx_mep_template_groups_template ON mep_template_groups(template_id);
CREATE INDEX IF NOT EXISTS idx_mep_template_fields_group ON mep_template_fields(group_id);

-- RLS Policies (enable Row Level Security)
ALTER TABLE mep_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_template_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_seeding_jobs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access" ON mep_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON mep_template_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON mep_template_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON mep_seeding_jobs FOR SELECT TO authenticated USING (true);

-- Allow full access for service role (backend automation)
CREATE POLICY "Service role full access" ON mep_templates FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON mep_template_groups FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON mep_template_fields FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON mep_seeding_jobs FOR ALL TO service_role USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mep_templates_updated_at
    BEFORE UPDATE ON mep_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
