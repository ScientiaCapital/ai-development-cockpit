# Deployment Checklist - MEP Templates Database

**Date:** 2025-12-20
**Environment:** Supabase PostgreSQL
**Status:** Ready for deployment

---

## Pre-Deployment Verification

### Database Access
- [ ] Supabase project created and accessible
- [ ] Service role API key generated and stored in .env
- [ ] Anon key configured in Vercel environment variables
- [ ] Connection pooling enabled (pgBouncer)
- [ ] Project region verified (same as application)

### Migration Files
- [ ] 001_create_templates_schema.sql exists (181 lines)
- [ ] 002_contractor_configs.sql exists (596 lines)
- [ ] 003_coperniq_integration.sql exists (672 lines)
- [ ] All files in `/coperniq-mep-templates/supabase/migrations/`
- [ ] Files reviewed for NO OpenAI references
- [ ] Files reviewed for NO hardcoded credentials

### Documentation
- [ ] README.md present (migration overview)
- [ ] MIGRATION_GUIDE.md present (detailed procedures)
- [ ] SCHEMA_REFERENCE.md present (table definitions)
- [ ] INTEGRATION_EXAMPLES.md present (code samples)
- [ ] DEPLOYMENT_CHECKLIST.md present (this file)

---

## Step 1: Apply Base Migration (001)

**Purpose:** Create template tables (already existing)

### Pre-Flight Checks
```sql
-- Verify templates table doesn't exist yet (or if exists, structure is correct)
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'templates'
);
-- Expected: true or false (either is OK, migration handles both)
```

### Execute Migration
```bash
cd coperniq-mep-templates/supabase

# Option A: Supabase CLI
supabase db push

# Option B: Manual via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Click "New Query"
# 3. Copy entire 001_create_templates_schema.sql
# 4. Click "Run"
```

### Verification
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
    'templates', 'template_groups', 'template_fields'
);
-- Expected: 3 rows

-- Check types created
SELECT typname FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND typname IN ('trade_type', 'phase_type');
-- Expected: 2 rows

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_template%';
-- Expected: 8 indexes
```

### Troubleshooting
| Issue | Solution |
|-------|----------|
| "uuid-ossp extension already exists" | OK - idempotent, migration checks with IF NOT EXISTS |
| "Type trade_type already exists" | OK - idempotent, migration checks with IF NOT EXISTS |
| "Table templates already exists" | OK - idempotent, migration checks with IF NOT EXISTS |
| Syntax error in SQL | Verify file wasn't corrupted during transfer |
| Permission denied | Verify service role has create table permissions |

---

## Step 2: Apply Contractor Config Migration (002)

**Purpose:** Create contractor configs, form submissions, and usage tracking

### Pre-Flight Checks
```sql
-- Verify templates table exists (required for FK)
SELECT COUNT(*) FROM templates;
-- Expected: > 0 or can be empty (will populate later)

-- Verify no conflicting tables
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
    'mep_contractor_configs', 'mep_form_submissions', 'mep_template_usage'
);
-- Expected: 0
```

### Execute Migration
```bash
# Option A: Supabase CLI
supabase db push

# Option B: Manual (sequential, after migration 1)
# 1. Go to SQL Editor
# 2. Click "New Query"
# 3. Copy entire 002_contractor_configs.sql
# 4. Click "Run"
```

### Verification
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'mep_%'
  AND table_name NOT LIKE '%_lineage'
ORDER BY table_name;
-- Expected: mep_contractor_configs, mep_form_submissions, mep_template_usage

-- Check enums created
SELECT typname FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND typname IN ('market_type', 'submission_status', 'usage_action_type');
-- Expected: 3 rows

-- Check views created
SELECT viewname FROM pg_views
WHERE schemaname = 'public' AND viewname IN (
    'contractor_summary', 'template_usage_analytics',
    'form_submission_details', 'contractor_activity_timeline'
);
-- Expected: 4 views

-- Check functions created
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'update_contractor_template_count',
    'set_submission_timestamps',
    'get_contractor_template_stats',
    'record_template_usage',
    'create_form_submission'
);
-- Expected: 5 functions

-- Check indexes (17 total for migration 2)
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_contractor%'
   OR indexname LIKE 'idx_form_submissions%'
   OR indexname LIKE 'idx_template_usage%';
-- Expected: 17
```

### Troubleshooting
| Issue | Solution |
|-------|----------|
| "Foreign key constraint fails" | Templates table must exist; run migration 1 first |
| "Function already exists" | OK - migration drops and recreates |
| "Type X already exists" | Verify migration 1 completed; types might be from earlier run |
| "Index already exists" | OK - migration checks with IF NOT EXISTS |
| RLS not enabled | Manually enable: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` |

---

## Step 3: Apply Coperniq Integration Migration (003)

**Purpose:** Create CSV import, sync, and data lineage tables

### Pre-Flight Checks
```sql
-- Verify required tables exist (FK dependencies)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
    'mep_contractor_configs', 'mep_form_submissions',
    'templates', 'template_fields'
);
-- Expected: 4

-- Verify no conflicting tables
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
    'csv_imports', 'csv_import_records', 'coperniq_field_mapping',
    'csv_column_mapping', 'coperniq_sync_log', 'data_lineage'
);
-- Expected: 0
```

### Execute Migration
```bash
# Option A: Supabase CLI
supabase db push

# Option B: Manual (sequential, after migrations 1 & 2)
# 1. Go to SQL Editor
# 2. Click "New Query"
# 3. Copy entire 003_coperniq_integration.sql
# 4. Click "Run"
```

### Verification
```sql
-- Check all 6 new tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
    'csv_imports', 'csv_import_records', 'coperniq_field_mapping',
    'csv_column_mapping', 'coperniq_sync_log', 'data_lineage'
)
ORDER BY table_name;
-- Expected: 6 tables

-- Check enums created
SELECT typname FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND typname IN ('csv_import_status', 'csv_record_status');
-- Expected: 2 rows

-- Check views created
SELECT viewname FROM pg_views
WHERE schemaname = 'public' AND viewname IN (
    'csv_import_summary', 'coperniq_sync_history'
);
-- Expected: 2 views

-- Check functions created
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'create_csv_import',
    'add_csv_import_record',
    'log_coperniq_sync'
);
-- Expected: 3 functions

-- Check indexes (20+ for migration 3)
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public' AND (
    indexname LIKE 'idx_csv%'
    OR indexname LIKE 'idx_coperniq%'
    OR indexname LIKE 'idx_data_lineage%'
);
-- Expected: 20+

-- Verify all 12 tables have RLS enabled
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public' AND (
    tablename LIKE 'templates'
    OR tablename LIKE 'mep_%'
    OR tablename LIKE 'csv_%'
    OR tablename LIKE 'coperniq_%'
    OR tablename LIKE 'data_lineage'
) AND rowsecurity = true;
-- Expected: 12
```

### Troubleshooting
| Issue | Solution |
|-------|----------|
| "Foreign key violation" | All dependency tables must exist; run migrations 1 & 2 first |
| "Index X already exists" | Manual cleanup: `DROP INDEX IF EXISTS index_name;` then re-run |
| RLS policies not applied | Verify migration executed fully; check for SQL errors above |
| Function creation fails | Drop existing: `DROP FUNCTION IF EXISTS function_name(...);` |

---

## Step 4: Seed Reference Data

**Purpose:** Populate Coperniq field mappings

### Create Coperniq Field Mappings
```sql
-- Insert exact Coperniq field names (camelCase!)
INSERT INTO coperniq_field_mapping (
    coperniq_type,
    coperniq_field_name,
    coperniq_field_type,
    is_required,
    description
) VALUES
    -- Contact fields
    ('Contact', 'name', 'string', true, 'Customer/lead name'),
    ('Contact', 'emails', 'array', false, 'Email addresses'),
    ('Contact', 'phones', 'array', false, 'Phone numbers'),
    ('Contact', 'title', 'string', false, 'Job title'),
    ('Contact', 'status', 'string', false, 'Contact status'),
    ('Contact', 'source', 'string', false, 'Lead source'),

    -- Site fields
    ('Site', 'fullAddress', 'string', true, 'Complete street address'),
    ('Site', 'street', 'string', false, 'Street address'),
    ('Site', 'city', 'string', false, 'City name'),
    ('Site', 'state', 'string', false, 'State code'),
    ('Site', 'zipcode', 'string', false, 'ZIP code'),
    ('Site', 'clientId', 'string', true, 'Reference to Contact'),
    ('Site', 'timezone', 'string', false, 'IANA timezone'),

    -- Asset fields
    ('Asset', 'name', 'string', true, 'Equipment name'),
    ('Asset', 'type', 'string', true, 'Equipment type'),
    ('Asset', 'manufacturer', 'string', false, 'Manufacturer name'),
    ('Asset', 'model', 'string', false, 'Model number'),
    ('Asset', 'serialNumber', 'string', false, 'Serial number'),
    ('Asset', 'size', 'string', false, 'Equipment size'),
    ('Asset', 'installDate', 'datetime', false, 'Installation date'),
    ('Asset', 'siteId', 'string', true, 'Reference to Site'),

    -- Task fields
    ('Task', 'title', 'string', true, 'Work order title'),
    ('Task', 'description', 'string', false, 'Detailed description'),
    ('Task', 'status', 'string', true, 'Task status'),
    ('Task', 'priority', 'string', false, 'Priority level'),
    ('Task', 'startDate', 'datetime', false, 'Start date/time'),
    ('Task', 'endDate', 'datetime', false, 'End date/time'),
    ('Task', 'isField', 'boolean', false, 'Is field work'),
    ('Task', 'assigneeId', 'string', false, 'Assigned technician'),
    ('Task', 'assetId', 'string', false, 'Related asset'),
    ('Task', 'siteId', 'string', true, 'Related site'),

    -- System fields
    ('System', 'name', 'string', true, 'System name'),
    ('System', 'size', 'string', false, 'System size'),
    ('System', 'status', 'string', true, 'System status'),
    ('System', 'installedAt', 'datetime', false, 'Install date'),
    ('System', 'operationalAt', 'datetime', false, 'Operational date'),
    ('System', 'monitored', 'boolean', false, 'Is monitored'),
    ('System', 'projectId', 'string', false, 'Related project'),
    ('System', 'siteId', 'string', true, 'Related site'),

    -- ServicePlanInstance fields
    ('ServicePlanInstance', 'servicePlanId', 'string', true, 'Service plan reference'),
    ('ServicePlanInstance', 'clientId', 'string', true, 'Customer reference'),
    ('ServicePlanInstance', 'startDate', 'datetime', false, 'Plan start date'),
    ('ServicePlanInstance', 'endDate', 'datetime', false, 'Plan end date'),
    ('ServicePlanInstance', 'durationMonths', 'number', false, 'Plan duration'),
    ('ServicePlanInstance', 'totalPrice', 'number', false, 'Total cost'),
    ('ServicePlanInstance', 'status', 'string', true, 'Plan status'),

    -- FinancialDocument fields
    ('FinancialDocument', 'title', 'string', true, 'Document title'),
    ('FinancialDocument', 'type', 'string', true, 'Invoice/Quote/Estimate'),
    ('FinancialDocument', 'status', 'string', true, 'Document status'),
    ('FinancialDocument', 'amount', 'number', true, 'Dollar amount'),
    ('FinancialDocument', 'issueDate', 'datetime', false, 'Date issued'),
    ('FinancialDocument', 'dueDate', 'datetime', false, 'Due date'),
    ('FinancialDocument', 'recordId', 'string', false, 'Related record'),
    ('FinancialDocument', 'clientId', 'string', true, 'Customer reference');

-- Verify insert
SELECT COUNT(*) FROM coperniq_field_mapping;
-- Expected: 47 rows
```

### Verification
```sql
-- Check all types have mappings
SELECT coperniq_type, COUNT(*) as field_count
FROM coperniq_field_mapping
GROUP BY coperniq_type
ORDER BY coperniq_type;

-- Expected result:
-- Asset           | 11
-- Contact         | 6
-- FinancialDocument| 8
-- ServicePlanInstance| 7
-- Site            | 10
-- System          | 8
-- Task            | 10
```

---

## Step 5: Verify Complete Schema

### Run Comprehensive Verification
```sql
-- Count all objects
SELECT 'Tables' as object_type, COUNT(*) as count FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Views', COUNT(*) FROM information_schema.views WHERE table_schema = 'public'
UNION ALL
SELECT 'Indexes', COUNT(*) FROM pg_indexes WHERE schemaname = 'public'
UNION ALL
SELECT 'Enums', COUNT(*) FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND typtype = 'e'
UNION ALL
SELECT 'Functions', COUNT(*) FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND pronamespace != (SELECT oid FROM pg_namespace WHERE nspname = 'pg_catalog');

-- Expected:
-- Tables:    12
-- Views:      7
-- Indexes:   50+
-- Enums:     10
-- Functions: 11
```

### Generate Schema Documentation
```bash
# Export schema (Supabase CLI)
supabase db pull

# Or manually backup
pg_dump --schema-only postgresql://user:pass@host/db > schema_backup.sql
```

---

## Step 6: Enable Monitoring & Alerts

### Setup Query Logging
```sql
-- Enable query logging for debugging
ALTER DATABASE [db_name] SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- Check slow query log
SELECT query, mean_exec_time, max_exec_time, calls
FROM pg_stat_statements
WHERE query NOT LIKE 'pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Setup Monitoring via Supabase Dashboard
- [ ] Navigate to Supabase Dashboard → Your Project
- [ ] Go to Database → Monitoring
- [ ] Set up alerts for:
  - [ ] CPU usage > 80%
  - [ ] Database size > [X] GB
  - [ ] Replication lag > 1 second
  - [ ] Connection count > 90

---

## Step 7: Test with Sample Data

### Create Test Contractor
```python
from supabase import create_client
import os

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

# Create contractor
config = supabase.table("mep_contractor_configs").insert({
    "contractor_name": "Test Contractor",
    "contractor_email": "test@example.com",
    "trades": ["hvac"],
    "markets": ["residential"],
    "phases": ["sales"],
    "preset_used": "hvac_residential",
    "is_active": True
}).execute()

print(f"Created: {config.data[0]['id']}")
assert len(config.data) == 1
assert config.data[0]['contractor_name'] == "Test Contractor"
```

### Create Test Form Submission
```python
# Get template ID
templates = supabase.table("templates").select("id").eq(
    "name", "hvac_lead_intake"
).limit(1).execute()

if templates.data:
    template_id = templates.data[0]['id']
    contractor_id = config.data[0]['id']

    # Create submission
    submission = supabase.rpc("create_form_submission", {
        "p_template_id": template_id,
        "p_contractor_id": contractor_id,
        "p_form_title": "Test Lead",
        "p_form_data": {"customerName": "John Doe"},
        "p_submitted_by": "test@example.com"
    }).execute()

    print(f"Created submission: {submission.data}")
    assert submission.data is not None
```

### Verify Data
```sql
-- Check contractor created
SELECT * FROM mep_contractor_configs
WHERE contractor_name = 'Test Contractor';

-- Check submission created
SELECT * FROM mep_form_submissions
WHERE form_title = 'Test Lead';

-- Check usage tracked
SELECT * FROM mep_template_usage
WHERE user_email = 'test@example.com';
```

---

## Step 8: Production Readiness Checklist

### Security
- [ ] All RLS policies enabled on 12 tables
- [ ] Service role API key stored in .env only
- [ ] No hardcoded credentials in any migration files
- [ ] Passwords handled by Supabase Auth
- [ ] Backup encryption enabled

### Performance
- [ ] All 50+ indexes created
- [ ] Query performance verified (< 100ms for common queries)
- [ ] Connection pooling configured
- [ ] Statistics updated: `ANALYZE;`
- [ ] Slow query logging enabled

### Reliability
- [ ] Automatic backups configured (daily)
- [ ] Point-in-time recovery available (7-day retention)
- [ ] Replication lag monitored
- [ ] Database size monitored
- [ ] CPU usage monitored

### Compliance
- [ ] Audit trail enabled (created_by, timestamps on all tables)
- [ ] Data retention policy defined
- [ ] GDPR consent documented
- [ ] Backup retention policy defined
- [ ] Disaster recovery plan documented

### Operations
- [ ] Runbooks created (troubleshooting guides)
- [ ] On-call rotation assigned
- [ ] Alert escalation defined
- [ ] Documentation complete and accessible
- [ ] Team trained on schema and operations

---

## Rollback Procedures

### Emergency Rollback (All Migrations)
```sql
-- From each migration file's "Down Migration" section
-- Execute in REVERSE order (3, 2, 1)

-- Step 1: Drop migration 3 objects
-- (See 003_coperniq_integration.sql - Down Migration section)

-- Step 2: Drop migration 2 objects
-- (See 002_contractor_configs.sql - Down Migration section)

-- Step 3: Drop migration 1 objects (if needed)
-- (See 001_create_templates_schema.sql - Down Migration section)

-- Verify rollback
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'mep_%';
-- Expected: 0 after full rollback
```

### Partial Rollback (Safe)
```sql
-- If migration 3 fails, rollback only migration 3:
-- (Keep migrations 1 & 2 intact)

-- Drop migration 3 objects only
-- (See 003_coperniq_integration.sql - Down Migration section)
```

---

## Post-Deployment Validation

### Day 1: Sanity Checks
- [ ] Connect to database successfully
- [ ] All 12 tables present
- [ ] All 7 views queryable
- [ ] RLS policies working (test with different users)
- [ ] Indexes being used (EXPLAIN ANALYZE)

### Week 1: Performance Baseline
- [ ] Record query execution times
- [ ] Document table row counts
- [ ] Baseline storage usage
- [ ] Baseline CPU/connection metrics

### Month 1: Operational Validation
- [ ] Test backup/restore procedure
- [ ] Test RLS isolation (multi-tenant)
- [ ] Test monitoring alerts
- [ ] Test slow query logging
- [ ] Performance tuning if needed

---

## Success Criteria

- ✅ All 3 migrations applied successfully
- ✅ All 12 tables created with correct structure
- ✅ All 50+ indexes created and used
- ✅ All 7 views queryable
- ✅ All RLS policies enabled
- ✅ Sample data inserted successfully
- ✅ Queries execute < 100ms
- ✅ Monitoring & alerts configured
- ✅ Backup/restore tested
- ✅ Documentation complete

---

## Support & Escalation

### Issues During Deployment
- **SQL Syntax Error:** Check migration file wasn't corrupted; review error message
- **Permission Error:** Verify service role has `CREATE TABLE` privilege
- **FK Constraint Error:** Ensure migrations applied in sequence (1 → 2 → 3)
- **RLS Policy Error:** Verify Supabase Auth is configured; check JWT claims

### Post-Deployment Issues
- **Slow Queries:** Run `ANALYZE;` and check index usage
- **Connection Limit:** Increase pgBouncer pool size in Supabase dashboard
- **Storage Growing:** Check data_lineage and csv_import_records sizes
- **RLS Preventing Access:** Verify user email matches in JWT claims

### Escalation Path
1. Check documentation (MIGRATION_GUIDE.md, SCHEMA_REFERENCE.md)
2. Review logs (slow query log, error logs in Supabase dashboard)
3. Test queries manually in SQL Editor
4. Contact Supabase support with error details + migration files

---

## Sign-Off

- [ ] Database Administrator: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Project Manager: _________________ Date: _______

**Deployment Status:** Ready for Production ✅

---

**Last Updated:** 2025-12-20
**Version:** 1.0
**Status:** Final
