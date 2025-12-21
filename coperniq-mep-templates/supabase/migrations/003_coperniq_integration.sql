-- Coperniq MEP Templates - Coperniq Integration & CSV Import Tracking
-- Created: 2025-12-20
-- Purpose: Track CSV imports, Coperniq GraphQL sync, and data lineage

-- ============================================================================
-- CSV Import Tracking Table
-- Tracks all CSV file imports for audit and troubleshooting
-- ============================================================================

CREATE TYPE csv_import_status AS ENUM (
    'pending',
    'validating',
    'processing',
    'success',
    'partial_success',
    'failed',
    'rollback'
);

CREATE TYPE csv_record_status AS ENUM (
    'valid',
    'skipped',
    'error',
    'duplicate',
    'warning'
);

CREATE TABLE IF NOT EXISTS csv_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Import metadata
    contractor_config_id UUID NOT NULL REFERENCES mep_contractor_configs(id) ON DELETE CASCADE,
    import_name TEXT NOT NULL, -- CSV filename or import batch name
    coperniq_type TEXT NOT NULL, -- Contact, Site, Asset, Task, System, ServicePlanInstance, FinancialDocument

    -- Import file info
    file_size_bytes INTEGER,
    file_hash TEXT, -- SHA256 hash for duplicate detection
    total_records_attempted INTEGER DEFAULT 0,
    total_records_success INTEGER DEFAULT 0,
    total_records_failed INTEGER DEFAULT 0,

    -- Import execution details
    status csv_import_status DEFAULT 'pending' NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER, -- (completed_at - started_at)

    -- Coperniq sync details
    coperniq_sync_status TEXT, -- pending, synced, failed
    coperniq_sync_timestamp TIMESTAMPTZ,
    coperniq_transaction_id TEXT, -- Reference to Coperniq GraphQL transaction
    coperniq_error_message TEXT, -- Error from Coperniq API if sync failed

    -- Import error summary
    error_summary JSONB, -- {field_errors: {fieldName: count, ...}, validation_errors: [...]}

    -- Audit trail
    imported_by TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_import_name CHECK (import_name ~ '^\s*\S'),
    CONSTRAINT valid_coperniq_type CHECK (
        coperniq_type IN (
            'Contact', 'Site', 'Asset', 'Task', 'System',
            'ServicePlanInstance', 'FinancialDocument'
        )
    ),
    CONSTRAINT duration_positive CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT record_counts_positive CHECK (
        total_records_attempted >= 0 AND
        total_records_success >= 0 AND
        total_records_failed >= 0
    ),
    CONSTRAINT record_counts_consistent CHECK (
        total_records_success + total_records_failed <= total_records_attempted
    )
);

-- ============================================================================
-- CSV Record Details Table
-- Individual record-level import details for debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS csv_import_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference to parent import
    csv_import_id UUID NOT NULL REFERENCES csv_imports(id) ON DELETE CASCADE,

    -- Record identification
    record_number INTEGER NOT NULL, -- Position in CSV (1-based)
    record_data JSONB NOT NULL, -- Original CSV row as JSON
    record_key TEXT, -- Primary key value (email, name, etc.) for deduplication

    -- Processing status
    status csv_record_status DEFAULT 'valid' NOT NULL,
    error_message TEXT, -- Why record failed or was skipped
    warning_message TEXT, -- Non-blocking warnings
    skipped_reason TEXT, -- Why record was skipped (duplicate, filter, etc.)

    -- Coperniq reference
    coperniq_id TEXT, -- ID of created/updated record in Coperniq
    coperniq_type_name TEXT, -- Specific Coperniq type created (Contact, Site, etc.)

    -- Field validation details
    invalid_fields TEXT[], -- Array of field names that failed validation
    missing_required_fields TEXT[], -- Required fields that were missing

    -- Timestamps
    processed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_record_number CHECK (record_number > 0),
    CONSTRAINT valid_record_status CHECK (status IN ('valid', 'skipped', 'error', 'duplicate', 'warning'))
);

-- ============================================================================
-- Coperniq Data Mapping Table
-- Maps Coperniq GraphQL types and fields to MEP templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS coperniq_field_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Mapping details
    coperniq_type TEXT NOT NULL, -- Contact, Site, Asset, Task, etc.
    coperniq_field_name TEXT NOT NULL, -- camelCase field name from Coperniq
    coperniq_field_type TEXT, -- string, number, boolean, datetime, array, object

    -- Template mapping
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    template_field_id UUID REFERENCES template_fields(id) ON DELETE SET NULL,
    template_field_name TEXT, -- Name of matching template field

    -- Mapping metadata
    is_required BOOLEAN DEFAULT false, -- Required in Coperniq
    is_custom BOOLEAN DEFAULT false, -- Custom field in Coperniq
    description TEXT,
    example_values TEXT[], -- Sample values for documentation

    -- Mapping confidence
    mapping_confidence DECIMAL(3, 2) CHECK (mapping_confidence >= 0 AND mapping_confidence <= 1.0),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_coperniq_type CHECK (
        coperniq_type IN (
            'Contact', 'Site', 'Asset', 'Task', 'System',
            'ServicePlanInstance', 'FinancialDocument'
        )
    ),
    CONSTRAINT field_name_not_empty CHECK (coperniq_field_name ~ '^\s*\S'),
    UNIQUE(coperniq_type, coperniq_field_name)
);

-- ============================================================================
-- CSV Column Mapping Table
-- Maps CSV header columns to Coperniq fields for import
-- ============================================================================

CREATE TABLE IF NOT EXISTS csv_column_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Import reference
    csv_import_id UUID NOT NULL REFERENCES csv_imports(id) ON DELETE CASCADE,

    -- CSV structure
    csv_column_number INTEGER NOT NULL, -- Column position (1-based)
    csv_column_header TEXT NOT NULL, -- Header text from CSV

    -- Target Coperniq field
    coperniq_type TEXT NOT NULL, -- Where this column maps to
    coperniq_field_name TEXT NOT NULL, -- Target field name in Coperniq

    -- Transformation
    transformation_rule TEXT, -- null, 'trim', 'uppercase', 'parse_date', 'parse_number', custom SQL
    transformation_params JSONB, -- {dateFormat: 'MM/DD/YYYY', ...}

    -- Validation
    is_required BOOLEAN DEFAULT false,
    validation_rule TEXT, -- Regex or SQL expression for validation

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_column_number CHECK (csv_column_number > 0),
    CONSTRAINT field_name_not_empty CHECK (coperniq_field_name ~ '^\s*\S')
);

-- ============================================================================
-- Coperniq Sync Audit Log
-- Tracks all synchronization events with Coperniq
-- ============================================================================

CREATE TABLE IF NOT EXISTS coperniq_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Sync reference
    csv_import_id UUID REFERENCES csv_imports(id) ON DELETE SET NULL,
    contractor_config_id UUID REFERENCES mep_contractor_configs(id) ON DELETE SET NULL,

    -- Sync operation details
    operation_type TEXT NOT NULL, -- 'import', 'update', 'delete', 'sync_check'
    entity_type TEXT NOT NULL, -- Contact, Site, Asset, Task, System, etc.
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Coperniq API details
    graphql_query TEXT, -- First 1000 chars of GraphQL mutation for reference
    api_response_status INTEGER, -- HTTP status code
    api_response_time_ms INTEGER,
    api_error_code TEXT,
    api_error_message TEXT,

    -- Sync outcome
    status TEXT NOT NULL, -- success, partial_success, failed
    transaction_id TEXT, -- Coperniq transaction ID
    rollback_attempted BOOLEAN DEFAULT false,
    rollback_successful BOOLEAN DEFAULT false,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Audit
    performed_by TEXT NOT NULL,
    notes TEXT,

    -- Constraints
    CONSTRAINT valid_operation_type CHECK (operation_type IN ('import', 'update', 'delete', 'sync_check')),
    CONSTRAINT positive_count CHECK (records_processed >= 0 AND records_successful >= 0 AND records_failed >= 0),
    CONSTRAINT valid_status CHECK (status IN ('success', 'partial_success', 'failed'))
);

-- ============================================================================
-- Contractor Data Lineage Table
-- Tracks data flow from CSV imports through Coperniq
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source (CSV)
    csv_import_record_id UUID REFERENCES csv_import_records(id) ON DELETE CASCADE,

    -- Intermediate (Form Submission if applicable)
    form_submission_id UUID REFERENCES mep_form_submissions(id) ON DELETE SET NULL,

    -- Destination (Coperniq)
    coperniq_entity_type TEXT NOT NULL,
    coperniq_entity_id TEXT NOT NULL,
    coperniq_company_id TEXT,

    -- Lineage metadata
    transformation_applied TEXT, -- Description of any data transformation
    data_quality_score DECIMAL(3, 2), -- 0-1 score for data quality

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_coperniq_type CHECK (
        coperniq_entity_type IN (
            'Contact', 'Site', 'Asset', 'Task', 'System',
            'ServicePlanInstance', 'FinancialDocument'
        )
    ),
    CONSTRAINT valid_quality_score CHECK (data_quality_score >= 0 AND data_quality_score <= 1.0)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- CSV imports indexes
CREATE INDEX idx_csv_imports_contractor ON csv_imports(contractor_config_id);
CREATE INDEX idx_csv_imports_type ON csv_imports(coperniq_type);
CREATE INDEX idx_csv_imports_status ON csv_imports(status);
CREATE INDEX idx_csv_imports_created ON csv_imports(created_at DESC);
CREATE INDEX idx_csv_imports_coperniq_status ON csv_imports(coperniq_sync_status);
CREATE INDEX idx_csv_imports_hash ON csv_imports(file_hash);
CREATE INDEX idx_csv_imports_composite ON csv_imports(contractor_config_id, coperniq_type, status);

-- CSV import records indexes
CREATE INDEX idx_csv_import_records_import ON csv_import_records(csv_import_id);
CREATE INDEX idx_csv_import_records_status ON csv_import_records(status);
CREATE INDEX idx_csv_import_records_coperniq_id ON csv_import_records(coperniq_id);
CREATE INDEX idx_csv_import_records_record_key ON csv_import_records(record_key);

-- Coperniq field mapping indexes
CREATE INDEX idx_coperniq_field_mapping_type ON coperniq_field_mapping(coperniq_type);
CREATE INDEX idx_coperniq_field_mapping_field ON coperniq_field_mapping(coperniq_field_name);
CREATE INDEX idx_coperniq_field_mapping_template ON coperniq_field_mapping(template_id);

-- CSV column mapping indexes
CREATE INDEX idx_csv_column_mapping_import ON csv_column_mapping(csv_import_id);
CREATE INDEX idx_csv_column_mapping_coperniq ON csv_column_mapping(coperniq_type, coperniq_field_name);

-- Coperniq sync log indexes
CREATE INDEX idx_coperniq_sync_log_import ON coperniq_sync_log(csv_import_id);
CREATE INDEX idx_coperniq_sync_log_contractor ON coperniq_sync_log(contractor_config_id);
CREATE INDEX idx_coperniq_sync_log_status ON coperniq_sync_log(status);
CREATE INDEX idx_coperniq_sync_log_timestamp ON coperniq_sync_log(started_at DESC);
CREATE INDEX idx_coperniq_sync_log_entity ON coperniq_sync_log(entity_type);

-- Data lineage indexes
CREATE INDEX idx_data_lineage_csv_record ON data_lineage(csv_import_record_id);
CREATE INDEX idx_data_lineage_submission ON data_lineage(form_submission_id);
CREATE INDEX idx_data_lineage_coperniq ON data_lineage(coperniq_entity_type, coperniq_entity_id);
CREATE INDEX idx_data_lineage_company ON data_lineage(coperniq_company_id);

-- ============================================================================
-- Triggers for Timestamp Management
-- ============================================================================

CREATE TRIGGER csv_imports_updated_at
    BEFORE UPDATE ON csv_imports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER coperniq_field_mapping_updated_at
    BEFORE UPDATE ON coperniq_field_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER data_lineage_updated_at
    BEFORE UPDATE ON data_lineage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-calculate duration for CSV imports
CREATE OR REPLACE FUNCTION calculate_import_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER csv_imports_calculate_duration
    BEFORE UPDATE ON csv_imports
    FOR EACH ROW
    EXECUTE FUNCTION calculate_import_duration();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_import_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coperniq_field_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_column_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE coperniq_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;

-- CSV imports
CREATE POLICY "Service role full access" ON csv_imports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Contractor read own imports" ON csv_imports FOR SELECT USING (
    auth.role() = 'authenticated' AND
    contractor_config_id IN (
        SELECT id FROM mep_contractor_configs
        WHERE contractor_email = auth.jwt() ->> 'email'
    )
);

-- CSV import records
CREATE POLICY "Service role full access" ON csv_import_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Contractor read own records" ON csv_import_records FOR SELECT USING (
    auth.role() = 'authenticated' AND
    csv_import_id IN (
        SELECT id FROM csv_imports ci
        WHERE ci.contractor_config_id IN (
            SELECT id FROM mep_contractor_configs
            WHERE contractor_email = auth.jwt() ->> 'email'
        )
    )
);

-- Coperniq field mapping - public read
CREATE POLICY "Public read access" ON coperniq_field_mapping FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON coperniq_field_mapping FOR ALL USING (auth.role() = 'service_role');

-- CSV column mapping
CREATE POLICY "Service role full access" ON csv_column_mapping FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Contractor read own mapping" ON csv_column_mapping FOR SELECT USING (
    auth.role() = 'authenticated' AND
    csv_import_id IN (
        SELECT id FROM csv_imports ci
        WHERE ci.contractor_config_id IN (
            SELECT id FROM mep_contractor_configs
            WHERE contractor_email = auth.jwt() ->> 'email'
        )
    )
);

-- Coperniq sync log
CREATE POLICY "Service role full access" ON coperniq_sync_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Contractor read own logs" ON coperniq_sync_log FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (contractor_config_id IN (
        SELECT id FROM mep_contractor_configs
        WHERE contractor_email = auth.jwt() ->> 'email'
    ) OR
    csv_import_id IN (
        SELECT id FROM csv_imports ci
        WHERE ci.contractor_config_id IN (
            SELECT id FROM mep_contractor_configs
            WHERE contractor_email = auth.jwt() ->> 'email'
        )
    ))
);

-- Data lineage
CREATE POLICY "Service role full access" ON data_lineage FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Contractor read own lineage" ON data_lineage FOR SELECT USING (
    auth.role() = 'authenticated' AND
    csv_import_record_id IN (
        SELECT id FROM csv_import_records cir
        WHERE cir.csv_import_id IN (
            SELECT id FROM csv_imports ci
            WHERE ci.contractor_config_id IN (
                SELECT id FROM mep_contractor_configs
                WHERE contractor_email = auth.jwt() ->> 'email'
            )
        )
    )
);

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- CSV import summary with record stats
CREATE OR REPLACE VIEW csv_import_summary AS
SELECT
    ci.id,
    ci.import_name,
    ci.coperniq_type,
    ci.status,
    ci.total_records_attempted,
    ci.total_records_success,
    ci.total_records_failed,
    ROUND((ci.total_records_success::NUMERIC / NULLIF(ci.total_records_attempted, 0) * 100)::NUMERIC, 2) as success_rate,
    ci.duration_seconds,
    ci.coperniq_sync_status,
    ci.imported_by,
    ci.created_at,
    cc.contractor_name,
    COUNT(DISTINCT cir.id) as detail_records_count,
    COUNT(CASE WHEN cir.status = 'valid' THEN 1 END) as valid_records,
    COUNT(CASE WHEN cir.status = 'error' THEN 1 END) as error_records,
    COUNT(CASE WHEN cir.status = 'duplicate' THEN 1 END) as duplicate_records
FROM csv_imports ci
LEFT JOIN mep_contractor_configs cc ON cc.id = ci.contractor_config_id
LEFT JOIN csv_import_records cir ON cir.csv_import_id = ci.id
GROUP BY ci.id, cc.contractor_name;

-- Coperniq sync history
CREATE OR REPLACE VIEW coperniq_sync_history AS
SELECT
    csl.id,
    csl.operation_type,
    csl.entity_type,
    csl.records_processed,
    csl.records_successful,
    csl.records_failed,
    csl.status,
    csl.api_response_time_ms,
    csl.transaction_id,
    csl.api_error_message,
    csl.started_at,
    csl.completed_at,
    csl.performed_by,
    cc.contractor_name,
    ci.import_name
FROM coperniq_sync_log csl
LEFT JOIN mep_contractor_configs cc ON cc.id = csl.contractor_config_id
LEFT JOIN csv_imports ci ON ci.id = csl.csv_import_id
ORDER BY csl.started_at DESC;

-- ============================================================================
-- Functions for Integration
-- ============================================================================

-- Create CSV import with initial validation
CREATE OR REPLACE FUNCTION create_csv_import(
    p_contractor_id UUID,
    p_import_name TEXT,
    p_coperniq_type TEXT,
    p_imported_by TEXT,
    p_file_size_bytes INTEGER DEFAULT NULL,
    p_file_hash TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_import_id UUID;
BEGIN
    INSERT INTO csv_imports (
        contractor_config_id,
        import_name,
        coperniq_type,
        imported_by,
        file_size_bytes,
        file_hash,
        status,
        started_at
    )
    VALUES (
        p_contractor_id,
        p_import_name,
        p_coperniq_type,
        p_imported_by,
        p_file_size_bytes,
        p_file_hash,
        'pending',
        NOW()
    )
    RETURNING id INTO v_import_id;

    RETURN v_import_id;
END;
$$ LANGUAGE plpgsql;

-- Add CSV import record
CREATE OR REPLACE FUNCTION add_csv_import_record(
    p_import_id UUID,
    p_record_number INTEGER,
    p_record_data JSONB,
    p_status csv_record_status DEFAULT 'valid',
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_record_id UUID;
BEGIN
    INSERT INTO csv_import_records (
        csv_import_id,
        record_number,
        record_data,
        status,
        error_message
    )
    VALUES (
        p_import_id,
        p_record_number,
        p_record_data,
        p_status,
        p_error_message
    )
    RETURNING id INTO v_record_id;

    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql;

-- Log Coperniq sync operation
CREATE OR REPLACE FUNCTION log_coperniq_sync(
    p_csv_import_id UUID,
    p_operation_type TEXT,
    p_entity_type TEXT,
    p_records_processed INTEGER,
    p_records_successful INTEGER,
    p_records_failed INTEGER,
    p_status TEXT,
    p_performed_by TEXT,
    p_transaction_id TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO coperniq_sync_log (
        csv_import_id,
        operation_type,
        entity_type,
        records_processed,
        records_successful,
        records_failed,
        status,
        transaction_id,
        api_error_message,
        performed_by,
        completed_at
    )
    VALUES (
        p_csv_import_id,
        p_operation_type,
        p_entity_type,
        p_records_processed,
        p_records_successful,
        p_records_failed,
        p_status,
        p_transaction_id,
        p_error_message,
        p_performed_by,
        NOW()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE csv_imports IS
    'Tracks CSV file imports from contractors including file metadata, import status, and Coperniq sync status.';

COMMENT ON TABLE csv_import_records IS
    'Individual record-level details for CSV imports. One row per CSV data row for debugging and validation.';

COMMENT ON TABLE coperniq_field_mapping IS
    'Maps Coperniq GraphQL field names to MEP template fields for bidirectional integration.';

COMMENT ON TABLE csv_column_mapping IS
    'Maps CSV column headers to Coperniq fields including transformation rules and validation.';

COMMENT ON TABLE coperniq_sync_log IS
    'Audit log of all synchronization operations with Coperniq API including success/failure details.';

COMMENT ON TABLE data_lineage IS
    'Tracks data flow from CSV imports through forms to Coperniq entities for data governance.';

COMMENT ON FUNCTION create_csv_import IS
    'Creates a new CSV import record and initializes tracking. Returns import ID.';

COMMENT ON FUNCTION add_csv_import_record IS
    'Adds individual record details to a CSV import. Returns record ID.';

COMMENT ON FUNCTION log_coperniq_sync IS
    'Logs a Coperniq synchronization operation with results. Returns log ID.';

-- ============================================================================
-- Down Migration (in comments for reference)
-- ============================================================================
/*
-- To rollback this migration, execute:

DROP FUNCTION IF EXISTS log_coperniq_sync(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS add_csv_import_record(UUID, INTEGER, JSONB, csv_record_status, TEXT);
DROP FUNCTION IF EXISTS create_csv_import(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT);
DROP VIEW IF EXISTS coperniq_sync_history;
DROP VIEW IF EXISTS csv_import_summary;
DROP TRIGGER IF EXISTS data_lineage_updated_at ON data_lineage;
DROP TRIGGER IF EXISTS coperniq_field_mapping_updated_at ON coperniq_field_mapping;
DROP TRIGGER IF EXISTS csv_imports_updated_at ON csv_imports;
DROP TRIGGER IF EXISTS csv_imports_calculate_duration ON csv_imports;
DROP FUNCTION IF EXISTS calculate_import_duration();
DROP TABLE IF EXISTS data_lineage;
DROP TABLE IF EXISTS coperniq_sync_log;
DROP TABLE IF EXISTS csv_column_mapping;
DROP TABLE IF EXISTS coperniq_field_mapping;
DROP TABLE IF EXISTS csv_import_records;
DROP TABLE IF EXISTS csv_imports;
DROP TYPE IF EXISTS csv_record_status;
DROP TYPE IF EXISTS csv_import_status;
*/
