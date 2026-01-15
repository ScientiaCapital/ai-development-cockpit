-- Simple Form Submissions Table (standalone, no FK dependencies)
-- Created: 2025-12-21
-- Purpose: Store form submissions from webapp without complex dependencies

CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template info (stored as text, not FK)
    template_name TEXT NOT NULL,
    template_trade TEXT NOT NULL,

    -- Submission data
    form_title TEXT NOT NULL,
    form_data JSONB NOT NULL,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_by TEXT NOT NULL DEFAULT 'anonymous',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,

    -- Coperniq sync (future)
    coperniq_synced BOOLEAN DEFAULT false,
    coperniq_record_id TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_trade ON form_submissions(template_trade);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template ON form_submissions(template_name);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS form_submissions_updated_at ON form_submissions;
CREATE TRIGGER form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_form_submissions_updated_at();

-- RLS (allow all for now, can restrict later)
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public insert/select for demo (no auth required)
CREATE POLICY "Allow public read" ON form_submissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON form_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON form_submissions FOR UPDATE USING (true);

COMMENT ON TABLE form_submissions IS 'Stores form submissions from MEP templates webapp';
