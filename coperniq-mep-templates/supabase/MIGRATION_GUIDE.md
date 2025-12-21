# Supabase Migration Guide - MEP Templates System

**Created:** 2025-12-20
**Database:** Coperniq MEP Templates (PostgreSQL on Supabase)

---

## Overview

This guide covers the complete database migration strategy for the MEP Templates system. Three sequential migrations establish the schema for templates, contractor configurations, and Coperniq integration.

### Migration Files

| # | File | Purpose | Status |
|---|------|---------|--------|
| 1 | `001_create_templates_schema.sql` | Base template schema | ✅ Existing |
| 2 | `002_contractor_configs.sql` | Contractor configs, form submissions, usage tracking | ✅ New |
| 3 | `003_coperniq_integration.sql` | CSV imports, Coperniq sync, data lineage | ✅ New |

---

## Migration 1: Base Template Schema

**File:** `001_create_templates_schema.sql` (EXISTING)

### Tables Created

1. **templates** - Template metadata and specifications
2. **template_groups** - Field groupings within templates
3. **template_fields** - Individual form fields with validation

### Key Features

- UUID primary keys with v4 generation
- Enums for `trade_type` and `phase_type`
- 8 indexes for fast lookups
- RLS policies for public read + service role full access
- Helper function `get_template_full()` for nested data retrieval
- View `template_summary` for aggregated statistics

### Sample Data

Templates are synced from YAML files in `coperniq-mep-templates/templates/`:

```bash
# Example: HVAC templates
coperniq-mep-templates/templates/hvac/
├── lead_intake.yaml          # Sales phase
├── site_survey.yaml          # Design phase
├── equipment_proposal.yaml    # Design phase
└── job_planning.yaml         # Install phase
```

---

## Migration 2: Contractor Configurations & Forms

**File:** `002_contractor_configs.sql` (NEW)

### Tables Created

#### mep_contractor_configs
Stores wizard-generated configurations for each contractor.

```sql
-- Key columns
id: UUID PRIMARY KEY
contractor_name: TEXT NOT NULL
contractor_email: TEXT (for auth)
trades: TEXT[] -- Enabled trades (hvac, plumbing, etc.)
markets: TEXT[] -- Residential, commercial, industrial
phases: TEXT[] -- Enabled workflow phases
templates_enabled: TEXT[] -- Array of template names
preset_used: TEXT -- Which preset (hvac_residential, full_mep, etc.)
is_active: BOOLEAN
created_at, updated_at: TIMESTAMPTZ
```

**Sample Data:**
```sql
INSERT INTO mep_contractor_configs (
    contractor_name,
    contractor_email,
    trades,
    markets,
    phases,
    preset_used
) VALUES (
    'ABC Heating & Cooling',
    'john@abcheating.com',
    ARRAY['hvac', 'plumbing'],
    ARRAY['residential', 'commercial'],
    ARRAY['sales', 'install', 'service'],
    'hvac_residential'
);
```

#### mep_form_submissions
Stores completed form submissions with audit trail.

```sql
-- Key columns
id: UUID PRIMARY KEY
template_id: UUID REFERENCES templates(id)
contractor_config_id: UUID REFERENCES mep_contractor_configs(id)
form_title: TEXT
form_data: JSONB -- {fieldName: value, ...}
status: submission_status -- draft, submitted, approved, rejected, archived
submitted_by: TEXT
submitted_at: TIMESTAMPTZ (auto-set when submitted)
coperniq_import_status: TEXT -- pending, success, failed
coperniq_import_id: TEXT -- Coperniq transaction reference
```

**Status Transitions:**
```
draft → submitted → approved/rejected → archived
```

**Sample Data:**
```sql
INSERT INTO mep_form_submissions (
    template_id,
    contractor_config_id,
    form_title,
    form_data,
    submitted_by,
    status
) VALUES (
    (SELECT id FROM templates WHERE name = 'lead_intake'),
    'contractor-uuid',
    'Acme HVAC - John Smith Lead',
    '{"customerName":"John Smith","phone":"555-1234","budget":"$5000"}',
    'jane@abcheating.com',
    'draft'
);
```

#### mep_template_usage
Analytics tracking for template usage patterns.

```sql
-- Key columns
id: UUID PRIMARY KEY
template_id: UUID REFERENCES templates(id)
contractor_config_id: UUID REFERENCES mep_contractor_configs(id)
submission_id: UUID REFERENCES mep_form_submissions(id)
action: usage_action_type -- viewed, filled, submitted, edited, exported
time_spent_seconds: INTEGER
user_email: TEXT
timestamp: TIMESTAMPTZ
```

### Views Created

#### contractor_summary
Aggregated view of contractor activity:
```sql
SELECT
    contractor_name,
    template_enabled_count,
    total_submissions,
    draft_submissions,
    submitted_submissions,
    approved_submissions,
    last_submission_at
FROM contractor_summary
WHERE contractor_email = ?;
```

#### template_usage_analytics
Template performance metrics:
```sql
SELECT
    template_name,
    unique_contractors,
    views,
    fills,
    submissions,
    avg_time_spent_seconds,
    last_used_at
FROM template_usage_analytics;
```

#### form_submission_details
Rich form submission details:
```sql
SELECT
    form_title,
    status,
    template_trade,
    contractor_name,
    submitted_by,
    submitted_at,
    coperniq_import_status,
    form_data
FROM form_submission_details;
```

### Functions

#### record_template_usage()
Track template usage:
```sql
SELECT record_template_usage(
    p_template_id := 'template-uuid',
    p_contractor_id := 'contractor-uuid',
    p_action := 'viewed',
    p_user_email := 'user@example.com',
    p_time_spent_seconds := 300
);
```

#### create_form_submission()
Create a submission with auto-increment:
```sql
SELECT create_form_submission(
    p_template_id := 'template-uuid',
    p_contractor_id := 'contractor-uuid',
    p_form_title := 'Service Call - Acme Corp',
    p_form_data := '{"status":"completed",...}',
    p_submitted_by := 'tech@example.com'
);
```

#### get_contractor_template_stats()
Get usage stats for a contractor:
```sql
SELECT * FROM get_contractor_template_stats('contractor-uuid');
-- Returns: template_id, template_name, trade, views, fills, submissions, last_used_at
```

### Indexes

Total of **17 indexes** for optimal query performance:

| Index | On Columns | Purpose |
|-------|-----------|---------|
| `idx_contractor_configs_name` | contractor_name | Lookup by name |
| `idx_contractor_configs_email` | contractor_email | Lookup by email |
| `idx_contractor_configs_trades` | trades (GIN) | Array search |
| `idx_contractor_configs_markets` | markets (GIN) | Array search |
| `idx_contractor_configs_active` | is_active | Filter active |
| `idx_form_submissions_status` | status | Filter by status |
| `idx_form_submissions_composite` | (contractor_id, template_id, status) | Common join queries |
| `idx_template_usage_composite` | (contractor_id, template_id, action) | Usage analytics |

### RLS Policies

**mep_contractor_configs:**
- ✅ Public read (active configs only)
- ✅ Service role full access
- ✅ Contractor read own config
- ✅ Contractor create/update own config

**mep_form_submissions:**
- ✅ Service role full access
- ✅ Contractor read own submissions
- ✅ Contractor create submissions
- ✅ Contractor update draft submissions only

**mep_template_usage:**
- ✅ Service role full access
- ✅ Contractor read own usage
- ✅ Contractor create own usage

---

## Migration 3: Coperniq Integration & CSV Tracking

**File:** `003_coperniq_integration.sql` (NEW)

### Tables Created

#### csv_imports
Tracks all CSV file imports from contractors.

```sql
-- Key columns
id: UUID PRIMARY KEY
contractor_config_id: UUID REFERENCES mep_contractor_configs(id)
import_name: TEXT -- CSV filename (e.g., "Contact.csv")
coperniq_type: TEXT -- Contact, Site, Asset, Task, System, ServicePlanInstance, FinancialDocument
file_size_bytes: INTEGER
file_hash: TEXT -- SHA256 for deduplication
total_records_attempted: INTEGER
total_records_success: INTEGER
total_records_failed: INTEGER
status: csv_import_status -- pending, validating, processing, success, partial_success, failed
duration_seconds: INTEGER -- Auto-calculated on completion
coperniq_sync_status: TEXT -- pending, synced, failed
coperniq_transaction_id: TEXT -- Reference to Coperniq API transaction
error_summary: JSONB -- {field_errors: {...}, validation_errors: [...]}
imported_by: TEXT
created_at, updated_at: TIMESTAMPTZ
```

**Sample Data:**
```sql
INSERT INTO csv_imports (
    contractor_config_id,
    import_name,
    coperniq_type,
    file_size_bytes,
    file_hash,
    imported_by
) VALUES (
    'contractor-uuid',
    'Contact.csv',
    'Contact',
    45678,
    'sha256_hash_here',
    'admin@example.com'
);
```

#### csv_import_records
Individual record-level details for debugging.

```sql
-- Key columns
id: UUID PRIMARY KEY
csv_import_id: UUID REFERENCES csv_imports(id)
record_number: INTEGER -- 1-based position in CSV
record_data: JSONB -- Original CSV row as JSON
record_key: TEXT -- Primary key value for dedup (email, name, etc.)
status: csv_record_status -- valid, skipped, error, duplicate, warning
error_message: TEXT
coperniq_id: TEXT -- ID of created record in Coperniq
invalid_fields: TEXT[] -- Field names that failed validation
missing_required_fields: TEXT[] -- Required fields that were missing
processed_at: TIMESTAMPTZ
```

**Sample Data:**
```sql
INSERT INTO csv_import_records (
    csv_import_id,
    record_number,
    record_data,
    record_key,
    status
) VALUES (
    'import-uuid',
    1,
    '{"name":"John Smith","email":"john@example.com","phone":"555-1234"}',
    'john@example.com',
    'valid'
);
```

#### coperniq_field_mapping
Maps Coperniq GraphQL field names to MEP template fields.

```sql
-- Key columns
id: UUID PRIMARY KEY
coperniq_type: TEXT -- Contact, Site, Asset, Task, System, etc.
coperniq_field_name: TEXT -- camelCase from Coperniq schema
coperniq_field_type: TEXT -- string, number, boolean, datetime, array, object
template_id: UUID REFERENCES templates(id)
template_field_id: UUID REFERENCES template_fields(id)
template_field_name: TEXT
is_required: BOOLEAN
is_custom: BOOLEAN -- Custom field in Coperniq
description: TEXT
example_values: TEXT[]
mapping_confidence: DECIMAL(3,2) -- 0.0 - 1.0
```

**EXACT Coperniq Field Names (camelCase):**
```
Contact: name, emails[], phones[], title, status, source
Site: fullAddress, street, city, state, zipcode, clientId, timezone
Asset: name, type, manufacturer, model, serialNumber, size, installDate, siteId
Task: title, description, status, priority, startDate, endDate, isField, assigneeId, assetId
System: name, size, status, installedAt, operationalAt, monitored, projectId
ServicePlanInstance: servicePlanId, clientId, startDate, endDate, durationMonths, totalPrice, status
FinancialDocument: title, type, status, amount, issueDate, dueDate, recordId, clientId
```

#### csv_column_mapping
Maps CSV headers to Coperniq fields with transformation rules.

```sql
-- Key columns
id: UUID PRIMARY KEY
csv_import_id: UUID REFERENCES csv_imports(id)
csv_column_number: INTEGER -- Column position (1-based)
csv_column_header: TEXT -- Header text from CSV (e.g., "Customer Name")
coperniq_type: TEXT -- Target type
coperniq_field_name: TEXT -- Target field in Coperniq (camelCase)
transformation_rule: TEXT -- null, trim, uppercase, parse_date, parse_number, custom
transformation_params: JSONB -- {dateFormat: "MM/DD/YYYY", ...}
is_required: BOOLEAN
validation_rule: TEXT -- Regex or SQL expression
```

**Sample Data:**
```sql
INSERT INTO csv_column_mapping (
    csv_import_id,
    csv_column_number,
    csv_column_header,
    coperniq_type,
    coperniq_field_name,
    transformation_rule,
    is_required
) VALUES (
    'import-uuid',
    1,
    'Customer Name',
    'Contact',
    'name',
    'trim',
    true
);
```

#### coperniq_sync_log
Audit log of all Coperniq API synchronization operations.

```sql
-- Key columns
id: UUID PRIMARY KEY
csv_import_id: UUID REFERENCES csv_imports(id)
operation_type: TEXT -- import, update, delete, sync_check
entity_type: TEXT -- Contact, Site, Asset, Task, System, etc.
records_processed: INTEGER
records_successful: INTEGER
records_failed: INTEGER
status: TEXT -- success, partial_success, failed
transaction_id: TEXT -- Coperniq transaction ID
api_response_status: INTEGER -- HTTP status
api_response_time_ms: INTEGER
api_error_code: TEXT
api_error_message: TEXT
rollback_attempted: BOOLEAN
rollback_successful: BOOLEAN
performed_by: TEXT
started_at, completed_at: TIMESTAMPTZ
```

**Sample Data:**
```sql
INSERT INTO coperniq_sync_log (
    csv_import_id,
    operation_type,
    entity_type,
    records_processed,
    records_successful,
    records_failed,
    status,
    transaction_id,
    api_response_status,
    performed_by
) VALUES (
    'import-uuid',
    'import',
    'Contact',
    100,
    98,
    2,
    'partial_success',
    'coperniq-tx-123456',
    200,
    'admin@example.com'
);
```

#### data_lineage
Tracks complete data flow from CSV → forms → Coperniq.

```sql
-- Key columns
id: UUID PRIMARY KEY
csv_import_record_id: UUID REFERENCES csv_import_records(id)
form_submission_id: UUID REFERENCES mep_form_submissions(id)
coperniq_entity_type: TEXT
coperniq_entity_id: TEXT
coperniq_company_id: TEXT -- Company ID in Coperniq (112 for sandbox)
transformation_applied: TEXT -- Description of transformations
data_quality_score: DECIMAL(3,2) -- 0.0 - 1.0
created_at, updated_at: TIMESTAMPTZ
```

### Views Created

#### csv_import_summary
Overview of all CSV imports with statistics.

```sql
SELECT
    import_name,
    coperniq_type,
    status,
    total_records_attempted,
    total_records_success,
    success_rate,
    duration_seconds,
    contractor_name,
    imported_by,
    created_at
FROM csv_import_summary;
```

#### coperniq_sync_history
Complete sync operation history with performance metrics.

```sql
SELECT
    operation_type,
    entity_type,
    records_processed,
    records_successful,
    records_failed,
    status,
    api_response_time_ms,
    transaction_id,
    contractor_name,
    import_name,
    started_at
FROM coperniq_sync_history
ORDER BY started_at DESC;
```

### Functions

#### create_csv_import()
Create a new CSV import with initialization.

```sql
SELECT create_csv_import(
    p_contractor_id := 'contractor-uuid',
    p_import_name := 'Contact.csv',
    p_coperniq_type := 'Contact',
    p_imported_by := 'admin@example.com',
    p_file_size_bytes := 45678,
    p_file_hash := 'sha256_hash'
);
-- Returns: import_id UUID
```

#### add_csv_import_record()
Add individual record to an import.

```sql
SELECT add_csv_import_record(
    p_import_id := 'import-uuid',
    p_record_number := 1,
    p_record_data := '{"name":"John","email":"john@example.com"}'::JSONB,
    p_status := 'valid'::csv_record_status
);
-- Returns: record_id UUID
```

#### log_coperniq_sync()
Log a Coperniq synchronization operation.

```sql
SELECT log_coperniq_sync(
    p_csv_import_id := 'import-uuid',
    p_operation_type := 'import',
    p_entity_type := 'Contact',
    p_records_processed := 100,
    p_records_successful := 98,
    p_records_failed := 2,
    p_status := 'partial_success',
    p_performed_by := 'admin@example.com',
    p_transaction_id := 'coperniq-tx-123456'
);
-- Returns: log_id UUID
```

### Indexes

Total of **20 indexes** for CSV tracking and Coperniq integration:

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_csv_imports_status` | csv_imports | status | Filter by status |
| `idx_csv_imports_coperniq_status` | csv_imports | coperniq_sync_status | Sync tracking |
| `idx_csv_imports_hash` | csv_imports | file_hash | Duplicate detection |
| `idx_csv_import_records_status` | csv_import_records | status | Find errors |
| `idx_csv_import_records_coperniq_id` | csv_import_records | coperniq_id | Coperniq lookup |
| `idx_coperniq_sync_log_status` | coperniq_sync_log | status | Sync status |
| `idx_coperniq_sync_log_timestamp` | coperniq_sync_log | started_at DESC | Recent syncs |
| `idx_data_lineage_coperniq` | data_lineage | (coperniq_entity_type, coperniq_entity_id) | Reverse lookup |

### RLS Policies

**csv_imports, csv_import_records:**
- ✅ Service role full access
- ✅ Contractor read own imports
- ✅ No direct write access for contractors (enforced via functions)

**coperniq_field_mapping:**
- ✅ Public read (reference data)
- ✅ Service role full access

**coperniq_sync_log, data_lineage:**
- ✅ Service role full access
- ✅ Contractor read own logs and lineage

---

## Deployment Strategy

### Prerequisites

```bash
# Verify Supabase project exists
supabase projects list

# Set project reference
export SUPABASE_PROJECT_ID=your-project-id
```

### Step 1: Apply Migrations

```bash
# Navigate to migrations directory
cd coperniq-mep-templates/supabase/migrations

# Apply migrations (Supabase CLI will execute in order)
supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Execute 001_create_templates_schema.sql (if not already done)
# 3. Execute 002_contractor_configs.sql
# 4. Execute 003_coperniq_integration.sql
```

### Step 2: Seed Initial Data

```sql
-- Seed Coperniq field mappings
INSERT INTO coperniq_field_mapping (
    coperniq_type, coperniq_field_name, coperniq_field_type, is_required
) VALUES
    ('Contact', 'name', 'string', true),
    ('Contact', 'emails', 'array', false),
    ('Contact', 'phones', 'array', false),
    ('Site', 'fullAddress', 'string', true),
    ('Site', 'clientId', 'string', true),
    ('Asset', 'name', 'string', true),
    ('Asset', 'type', 'string', true),
    ('Task', 'title', 'string', true),
    ('Task', 'status', 'string', true),
    ('System', 'name', 'string', true),
    ('ServicePlanInstance', 'servicePlanId', 'string', true),
    ('FinancialDocument', 'title', 'string', true);
```

### Step 3: Verify Schema

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'mep_%';

-- Check RLS is enabled
SELECT * FROM information_schema.tables
WHERE table_name IN (
    'mep_contractor_configs',
    'mep_form_submissions',
    'mep_template_usage',
    'csv_imports',
    'csv_import_records'
);

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

### Step 4: Enable RLS Policies

All RLS policies are created by the migration scripts. Verify they're active:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'mep_%' OR tablename LIKE 'csv_%';
-- Should show "true" for all
```

---

## Data Flow Diagram

```
CSV Upload
    ↓
csv_imports (metadata)
    ↓
csv_import_records (individual rows)
    ↓
csv_column_mapping (transformation rules)
    ↓
Coperniq GraphQL API (via orchestrator.py)
    ↓
coperniq_sync_log (operation audit)
    ↓
data_lineage (flow tracking)
    ↓
Coperniq Database (Contact, Site, Asset, etc.)

Forms (optional parallel path):
Form Template (templates table)
    ↓
Contractor fills form
    ↓
mep_form_submissions (draft/submitted)
    ↓
→ data_lineage (optional: cross-reference with CSV)
→ Coperniq API (if exported)
```

---

## Coperniq GraphQL Type Mappings

### CSV Import → Coperniq Type Mapping

| CSV File | Coperniq Type | Required Fields | Typical Use |
|----------|--------------|-----------------|------------|
| Contact.csv | Contact | name, emails[] \| phones[] | Customers, leads, technicians |
| Site.csv | Site | fullAddress, clientId | Customer locations |
| Asset.csv | Asset | name, type, siteId | Equipment (HVAC units, panels) |
| Task.csv | Task | title, status, siteId | Work orders, service calls |
| System.csv | System | name, siteId | Monitored systems (solar, IoT) |
| ServicePlanInstance.csv | ServicePlanInstance | servicePlanId, clientId | Service agreements |
| FinancialDocument.csv | FinancialDocument | title, type, clientId | Invoices, quotes |

### Field Name Convention (camelCase)

All Coperniq field names use **camelCase** (not snake_case):

```
CORRECT:    name, email, clientId, fullAddress, installDate, isField
INCORRECT:  client_id, full_address, install_date, is_field
```

### Common Field Mappings

```
CSV Column      →   Coperniq Field     →   Template Field
"Customer Name" →   Contact.name       →   lead_intake.customerName
"Email"         →   Contact.emails[]   →   lead_intake.email
"Phone"         →   Contact.phones[]   →   lead_intake.phone
"Address"       →   Site.fullAddress   →   site_survey.address
"City"          →   Site.city          →   site_survey.city
"Equipment"     →   Asset.name         →   equipment_proposal.equipmentName
"Status"        →   Task.status        →   work_order.status
```

---

## Query Examples

### Contractor Setup

```sql
-- Get contractor's config with template count
SELECT * FROM contractor_summary
WHERE contractor_name = 'ABC Heating & Cooling';

-- Get contractor's recent submissions
SELECT * FROM form_submission_details
WHERE contractor_name = 'ABC Heating & Cooling'
  AND submitted_at > NOW() - INTERVAL '30 days'
ORDER BY submitted_at DESC;
```

### CSV Import Tracking

```sql
-- Get import status summary
SELECT
    import_name,
    status,
    total_records_attempted,
    total_records_success,
    success_rate,
    duration_seconds
FROM csv_import_summary
WHERE contractor_id = 'contractor-uuid'
ORDER BY created_at DESC;

-- Find failed records for debugging
SELECT
    record_number,
    record_key,
    error_message,
    invalid_fields,
    missing_required_fields
FROM csv_import_records
WHERE csv_import_id = 'import-uuid'
  AND status IN ('error', 'duplicate');
```

### Coperniq Sync Audit

```sql
-- Check sync history for a contractor
SELECT * FROM coperniq_sync_history
WHERE contractor_name = 'ABC Heating & Cooling'
ORDER BY started_at DESC
LIMIT 20;

-- Find failed syncs
SELECT * FROM coperniq_sync_history
WHERE status != 'success'
ORDER BY started_at DESC;

-- Check API performance
SELECT
    entity_type,
    COUNT(*) as sync_count,
    ROUND(AVG(api_response_time_ms)) as avg_response_ms,
    MAX(api_response_time_ms) as max_response_ms
FROM coperniq_sync_log
WHERE completed_at > NOW() - INTERVAL '7 days'
GROUP BY entity_type;
```

### Template Usage Analytics

```sql
-- Get most popular templates
SELECT * FROM template_usage_analytics
ORDER BY submissions DESC
LIMIT 10;

-- Time spent per template trade
SELECT
    trade,
    COUNT(DISTINCT template_name) as template_count,
    ROUND(AVG(avg_time_spent_seconds)) as avg_time_per_template
FROM template_usage_analytics
GROUP BY trade;
```

### Data Lineage Tracking

```sql
-- Trace data flow from CSV to Coperniq
SELECT
    cir.record_key,
    cir.record_data,
    dl.transformation_applied,
    dl.coperniq_entity_type,
    dl.coperniq_entity_id,
    dl.data_quality_score
FROM csv_import_records cir
LEFT JOIN data_lineage dl ON dl.csv_import_record_id = cir.id
WHERE cir.csv_import_id = 'import-uuid';

-- Find data with low quality scores
SELECT * FROM data_lineage
WHERE data_quality_score < 0.8
ORDER BY data_quality_score ASC;
```

---

## Troubleshooting

### Common Issues

#### Issue: CSV Import Stuck in "Processing"
```sql
-- Check for long-running imports
SELECT * FROM csv_imports
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '30 minutes';

-- Manual status update (caution: verify first)
UPDATE csv_imports
SET status = 'failed', error_summary = '{"reason": "timeout"}'::jsonb
WHERE id = 'import-uuid';
```

#### Issue: Coperniq Sync Failed
```sql
-- Check sync error details
SELECT
    transaction_id,
    entity_type,
    api_error_code,
    api_error_message,
    records_failed
FROM coperniq_sync_log
WHERE status != 'success'
ORDER BY started_at DESC
LIMIT 5;

-- Retry sync (implement in orchestrator.py)
SELECT log_coperniq_sync(
    'import-uuid',
    'import',
    'Contact',
    100,
    100,
    0,
    'success',
    'admin@example.com'
);
```

#### Issue: Duplicate Records
```sql
-- Find duplicate records in import
SELECT
    record_key,
    COUNT(*) as count,
    ARRAY_AGG(id) as record_ids
FROM csv_import_records
WHERE csv_import_id = 'import-uuid'
GROUP BY record_key
HAVING COUNT(*) > 1;

-- Get details on duplicates
SELECT * FROM csv_import_records
WHERE csv_import_id = 'import-uuid'
  AND status = 'duplicate'
ORDER BY record_key;
```

#### Issue: Field Validation Failures
```sql
-- Find validation errors by field
SELECT
    field,
    COUNT(*) as error_count,
    ARRAY_AGG(DISTINCT error_message) as error_messages
FROM (
    SELECT
        UNNEST(invalid_fields) as field,
        error_message
    FROM csv_import_records
    WHERE csv_import_id = 'import-uuid'
      AND status = 'error'
) AS t
GROUP BY field
ORDER BY error_count DESC;
```

---

## Performance Tuning

### Index Optimization

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Unused indexes (candidates for removal)
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Query Performance

```sql
-- Analyze table statistics
ANALYZE mep_contractor_configs;
ANALYZE mep_form_submissions;
ANALYZE csv_imports;
ANALYZE csv_import_records;

-- View query plan
EXPLAIN ANALYZE
SELECT * FROM form_submission_details
WHERE contractor_name = 'ABC Heating'
  AND status = 'submitted';
```

### Connection Pooling (pgBouncer)

Supabase automatically provides connection pooling. Configure in Supabase dashboard:
- **Connection Mode:** Transaction (for most applications)
- **Pool Size:** 10-20 connections per user

---

## Backup & Recovery

### Backup Strategy

Supabase provides automatic daily backups. For critical data:

```bash
# Export database (via Supabase CLI)
supabase db pull

# Schedule weekly exports
0 2 * * 0 supabase db pull > ~/backups/mep_templates_$(date +%Y%m%d).sql
```

### Point-in-Time Recovery

If you need to restore from a specific timestamp:

1. Contact Supabase support for PITR (within 7 days)
2. Or restore from exported SQL file:

```bash
psql postgresql://user:pass@host/db < backup.sql
```

---

## Security Considerations

### RLS Best Practices

All migrations include RLS policies:

1. **Public Read** - Only for read-only data (field mappings)
2. **Service Role** - Full access (orchestrator, migrations)
3. **Authenticated** - User-specific access (contractors own data)
4. **No Direct Write** - CSV/Coperniq operations via functions only

### API Key Security

```bash
# .env.local (never commit)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Use only anon key in frontend
# Use service key only in backend
```

### Audit Logging

All changes are tracked via timestamps and user fields:

```sql
-- Audit trail for a contractor
SELECT
    contractor_name,
    'config_created' as event,
    created_at as timestamp,
    created_by
FROM mep_contractor_configs
WHERE contractor_id = 'id'

UNION ALL

SELECT
    cc.contractor_name,
    'submission_' || status,
    updated_at,
    'system'
FROM mep_form_submissions fs
LEFT JOIN mep_contractor_configs cc ON cc.id = fs.contractor_config_id
WHERE fs.contractor_config_id = 'id';
```

---

## Rollback Procedures

Each migration includes rollback SQL in comments:

```bash
# To rollback Migration 3:
# Execute SQL from 003_coperniq_integration.sql "Down Migration" section

# To rollback Migration 2:
# Execute SQL from 002_contractor_configs.sql "Down Migration" section

# Verify rollback
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'mep_%';
-- Should return 0 rows after full rollback
```

---

## Next Steps

1. **Apply migrations** to development environment first
2. **Seed Coperniq field mappings** with exact GraphQL type names
3. **Test CSV import workflow** with sample files
4. **Verify Coperniq API integration** in `orchestrator.py`
5. **Load test** with realistic contractor data
6. **Deploy to staging** for E2B sandbox testing
7. **Production deployment** after validation

---

## Support & Documentation

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Coperniq API:** https://coperniq.dev/project-service/graphql
- **Project Repo:** https://github.com/ScientiaCapital/ai-development-cockpit

---

**Last Updated:** 2025-12-20
**Status:** Production-Ready Migrations
