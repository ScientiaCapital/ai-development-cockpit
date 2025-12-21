# MEP Templates Schema Reference

**Updated:** 2025-12-20
**Format:** Quick reference for database structure and relationships

---

## Table Relationships

```
templates (core)
    ├── template_groups
    │   └── template_fields
    └── mep_form_submissions
        ├── mep_contractor_configs
        │   ├── csv_imports
        │   │   ├── csv_import_records
        │   │   │   └── data_lineage
        │   │   └── coperniq_sync_log
        │   └── mep_template_usage
        └── form_submission_details (view)
```

---

## Table Definitions

### 1. templates
**Purpose:** MEP form template specifications
**Status:** EXISTING (Migration 1)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| name | TEXT | NOT NULL, UNIQUE | e.g., "hvac_lead_intake" |
| display_name | TEXT | NOT NULL | "HVAC Lead Intake Form" |
| trade | TEXT | NOT NULL | hvac, plumbing, electrical, solar, fire_protection, controls, tud_market, low_voltage, roofing, general_contractor |
| category | TEXT | NOT NULL | sales, design, permit, install, commissioning, om, service |
| description | TEXT | | |
| emoji | TEXT | | 🔧, ☀️, 🚒, etc. |
| phase | TEXT | | sales, design, permit, install, commissioning, om, service |
| compliance | TEXT[] | | Array of standards (NFPA 25, EPA 608, etc.) |
| work_order_type | TEXT | | Coperniq task type |
| work_order_name | TEXT | | Display name in Coperniq |
| total_fields | INTEGER | DEFAULT 0 | |
| total_groups | INTEGER | DEFAULT 0 | |
| version | TEXT | DEFAULT '1.0' | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Trigger-maintained |
| created_by | TEXT | DEFAULT 'ai-development-cockpit' | |

**Key Indexes:**
- idx_templates_trade
- idx_templates_category
- idx_templates_phase
- idx_templates_active

**Relationships:**
- 1 → many template_groups
- 1 → many template_fields
- 1 → many mep_form_submissions
- 1 → many mep_template_usage

---

### 2. template_groups
**Purpose:** Field groupings within templates
**Status:** EXISTING (Migration 1)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| template_id | UUID | FOREIGN KEY, NOT NULL | References templates(id) |
| name | TEXT | NOT NULL, UNIQUE with template_id | "Customer Info", "Equipment" |
| display_order | INTEGER | DEFAULT 1 | Sort order within template |
| is_critical | BOOLEAN | DEFAULT false | Mark as critical section |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Key Indexes:**
- idx_template_groups_template

**Relationships:**
- many ← 1 templates
- 1 → many template_fields

---

### 3. template_fields
**Purpose:** Individual form fields with validation rules
**Status:** EXISTING (Migration 1)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| template_id | UUID | FOREIGN KEY, NOT NULL | References templates(id) |
| group_id | UUID | FOREIGN KEY | References template_groups(id) |
| name | TEXT | NOT NULL, UNIQUE with template_id | "customerName", "systemSize" |
| label | TEXT | NOT NULL | "Customer Name", "System Size (BTU)" |
| field_type | TEXT | NOT NULL, CHECK | Text, Numeric, Single select, Multiple select, File |
| is_required | BOOLEAN | DEFAULT false | |
| placeholder | TEXT | | "Enter customer name..." |
| description | TEXT | | Help text |
| options | JSONB | | ["Option 1", "Option 2"] for selects |
| validation_rules | JSONB | | {min: 0, max: 100, pattern: "regex"} |
| display_order | INTEGER | NOT NULL, DEFAULT 1 | Sort order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Key Indexes:**
- idx_template_fields_template
- idx_template_fields_group

**Relationships:**
- many ← 1 templates
- many ← 1 template_groups

---

### 4. mep_contractor_configs
**Purpose:** Wizard-generated configurations for contractors
**Status:** NEW (Migration 2)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| contractor_name | TEXT | NOT NULL, UNIQUE with email | "ABC Heating & Cooling" |
| contractor_email | TEXT | | john@abcheating.com |
| contractor_phone | TEXT | | |
| company_id | UUID | | Coperniq company reference |
| trades | TEXT[] | NOT NULL, DEFAULT '{}' | hvac, plumbing, electrical, solar, fire_protection |
| markets | TEXT[] | NOT NULL, DEFAULT '{}' | residential, commercial, industrial, institutional, mixed |
| phases | TEXT[] | NOT NULL, DEFAULT '{}' | sales, design, permit, install, commissioning, om, service |
| templates_enabled | TEXT[] | DEFAULT '{}' | Array of template names |
| templates_enabled_count | INTEGER | DEFAULT 0 | Auto-calculated |
| preset_used | TEXT | | hvac_residential, full_mep, solar_epc, om_service |
| preset_customized | BOOLEAN | DEFAULT false | |
| wizard_step_completed | INTEGER | DEFAULT 0 | 0-5 (tracking progress) |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Trigger-maintained |
| created_by | TEXT | DEFAULT 'contractor-wizard' | |

**Key Indexes:**
- idx_contractor_configs_name
- idx_contractor_configs_email
- idx_contractor_configs_trades (GIN)
- idx_contractor_configs_markets (GIN)
- idx_contractor_configs_phases (GIN)
- idx_contractor_configs_active
- idx_contractor_configs_created
- idx_contractor_configs_preset

**Relationships:**
- 1 → many mep_form_submissions
- 1 → many mep_template_usage
- 1 → many csv_imports

---

### 5. mep_form_submissions
**Purpose:** Completed form submissions with audit trail
**Status:** NEW (Migration 2)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| template_id | UUID | FOREIGN KEY, NOT NULL | References templates(id) |
| contractor_config_id | UUID | FOREIGN KEY, NOT NULL | References mep_contractor_configs(id) |
| form_title | TEXT | NOT NULL | "Acme HVAC - John Smith" |
| form_data | JSONB | NOT NULL | {fieldName: value, ...} |
| submitted_by | TEXT | NOT NULL | user@example.com |
| status | submission_status | DEFAULT 'draft' | draft, submitted, approved, rejected, archived |
| submission_number | INTEGER | | Auto-increment per contractor/template |
| parent_submission_id | UUID | FOREIGN KEY | For tracking revisions |
| revision_count | INTEGER | DEFAULT 0 | |
| coperniq_import_status | TEXT | | pending, success, failed |
| coperniq_import_id | TEXT | | Coperniq transaction ID |
| import_error_message | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Trigger-maintained |
| submitted_at | TIMESTAMPTZ | | Auto-set when submitted |
| approved_at | TIMESTAMPTZ | | Auto-set when approved |
| archived_at | TIMESTAMPTZ | | Auto-set when archived |

**Key Indexes:**
- idx_form_submissions_template
- idx_form_submissions_contractor
- idx_form_submissions_status
- idx_form_submissions_submitted_by
- idx_form_submissions_submitted_at
- idx_form_submissions_coperniq_import
- idx_form_submissions_parent
- idx_form_submissions_form_data (GIN)
- idx_form_submissions_composite (contractor_id, template_id, status)

**Relationships:**
- many ← 1 templates
- many ← 1 mep_contractor_configs
- 1 → many self (parent_submission_id)
- 1 → many data_lineage

**Status Transitions:**
```
draft → submitted → approved/rejected
                   ↓
                archived
```

---

### 6. mep_template_usage
**Purpose:** Analytics on template usage patterns
**Status:** NEW (Migration 2)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| template_id | UUID | FOREIGN KEY, NOT NULL | References templates(id) |
| contractor_config_id | UUID | FOREIGN KEY, NOT NULL | References mep_contractor_configs(id) |
| submission_id | UUID | FOREIGN KEY | References mep_form_submissions(id) |
| action | usage_action_type | NOT NULL | viewed, filled, submitted, edited, exported |
| action_count | INTEGER | DEFAULT 1 | Aggregate count |
| time_spent_seconds | INTEGER | | How long spent on template |
| user_email | TEXT | | |
| session_id | TEXT | | Browser session ID |
| timestamp | TIMESTAMPTZ | DEFAULT NOW() | |

**Key Indexes:**
- idx_template_usage_template
- idx_template_usage_contractor
- idx_template_usage_action
- idx_template_usage_timestamp
- idx_template_usage_submission
- idx_template_usage_composite (contractor_id, template_id, action)

**Relationships:**
- many ← 1 templates
- many ← 1 mep_contractor_configs
- many ← 1 mep_form_submissions

---

### 7. csv_imports
**Purpose:** Track all CSV file imports
**Status:** NEW (Migration 3)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| contractor_config_id | UUID | FOREIGN KEY, NOT NULL | References mep_contractor_configs(id) |
| import_name | TEXT | NOT NULL | "Contact.csv", "Asset.csv" |
| coperniq_type | TEXT | NOT NULL, CHECK | Contact, Site, Asset, Task, System, ServicePlanInstance, FinancialDocument |
| file_size_bytes | INTEGER | | |
| file_hash | TEXT | | SHA256 for deduplication |
| total_records_attempted | INTEGER | DEFAULT 0 | |
| total_records_success | INTEGER | DEFAULT 0 | |
| total_records_failed | INTEGER | DEFAULT 0 | |
| status | csv_import_status | DEFAULT 'pending' | pending, validating, processing, success, partial_success, failed, rollback |
| started_at | TIMESTAMPTZ | | |
| completed_at | TIMESTAMPTZ | | |
| duration_seconds | INTEGER | | Auto-calculated |
| coperniq_sync_status | TEXT | | pending, synced, failed |
| coperniq_sync_timestamp | TIMESTAMPTZ | | |
| coperniq_transaction_id | TEXT | | |
| coperniq_error_message | TEXT | | |
| error_summary | JSONB | | {field_errors: {...}, validation_errors: [...]} |
| imported_by | TEXT | NOT NULL | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Trigger-maintained |

**Key Indexes:**
- idx_csv_imports_contractor
- idx_csv_imports_type
- idx_csv_imports_status
- idx_csv_imports_created
- idx_csv_imports_coperniq_status
- idx_csv_imports_hash
- idx_csv_imports_composite (contractor_id, coperniq_type, status)

**Relationships:**
- many ← 1 mep_contractor_configs
- 1 → many csv_import_records
- 1 → many csv_column_mapping
- 1 → many coperniq_sync_log
- 1 → many data_lineage

---

### 8. csv_import_records
**Purpose:** Individual record details within CSV imports
**Status:** NEW (Migration 3)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| csv_import_id | UUID | FOREIGN KEY, NOT NULL | References csv_imports(id) |
| record_number | INTEGER | NOT NULL, CHECK > 0 | 1-based position in CSV |
| record_data | JSONB | NOT NULL | Original CSV row as JSON |
| record_key | TEXT | | Primary key for dedup (email, name, etc.) |
| status | csv_record_status | DEFAULT 'valid' | valid, skipped, error, duplicate, warning |
| error_message | TEXT | | Why record failed |
| warning_message | TEXT | | Non-blocking warnings |
| skipped_reason | TEXT | | Why record was skipped |
| coperniq_id | TEXT | | ID of created record in Coperniq |
| coperniq_type_name | TEXT | | Specific Coperniq type created |
| invalid_fields | TEXT[] | | Field names that failed validation |
| missing_required_fields | TEXT[] | | Required fields missing |
| processed_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Key Indexes:**
- idx_csv_import_records_import
- idx_csv_import_records_status
- idx_csv_import_records_coperniq_id
- idx_csv_import_records_record_key

**Relationships:**
- many ← 1 csv_imports
- 1 → many data_lineage

---

### 9. coperniq_field_mapping
**Purpose:** Map Coperniq GraphQL fields to template fields
**Status:** NEW (Migration 3)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| coperniq_type | TEXT | NOT NULL, CHECK, UNIQUE with field_name | Contact, Site, Asset, Task, System, ServicePlanInstance, FinancialDocument |
| coperniq_field_name | TEXT | NOT NULL, UNIQUE with coperniq_type | camelCase (e.g., fullAddress, installDate) |
| coperniq_field_type | TEXT | | string, number, boolean, datetime, array, object |
| template_id | UUID | FOREIGN KEY | References templates(id) |
| template_field_id | UUID | FOREIGN KEY | References template_fields(id) |
| template_field_name | TEXT | | |
| is_required | BOOLEAN | DEFAULT false | Required in Coperniq |
| is_custom | BOOLEAN | DEFAULT false | Custom field in Coperniq |
| description | TEXT | | |
| example_values | TEXT[] | | Sample values |
| mapping_confidence | DECIMAL(3,2) | CHECK 0-1 | How confident is mapping (0.0-1.0) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Trigger-maintained |

**Key Indexes:**
- idx_coperniq_field_mapping_type
- idx_coperniq_field_mapping_field
- idx_coperniq_field_mapping_template

**Relationships:**
- many → 1 templates (optional)
- many → 1 template_fields (optional)

**Sample Data:**
```
Contact.name → lead_intake.customerName → Confidence: 0.95
Site.fullAddress → site_survey.address → Confidence: 0.90
Asset.installDate → equipment_proposal.installDate → Confidence: 0.85
Task.status → work_order.status → Confidence: 1.00
```

---

### 10. csv_column_mapping
**Purpose:** Map CSV headers to Coperniq fields
**Status:** NEW (Migration 3)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| csv_import_id | UUID | FOREIGN KEY, NOT NULL | References csv_imports(id) |
| csv_column_number | INTEGER | NOT NULL, CHECK > 0 | 1-based position |
| csv_column_header | TEXT | NOT NULL | "Customer Name", "Email" |
| coperniq_type | TEXT | NOT NULL, CHECK | Target type |
| coperniq_field_name | TEXT | NOT NULL | Target field (camelCase) |
| transformation_rule | TEXT | | null, trim, uppercase, parse_date, parse_number, custom |
| transformation_params | JSONB | | {dateFormat: "MM/DD/YYYY", ...} |
| is_required | BOOLEAN | DEFAULT false | |
| validation_rule | TEXT | | Regex or SQL expression |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Key Indexes:**
- idx_csv_column_mapping_import
- idx_csv_column_mapping_coperniq (coperniq_type, coperniq_field_name)

**Relationships:**
- many ← 1 csv_imports

---

### 11. coperniq_sync_log
**Purpose:** Audit log of Coperniq synchronization operations
**Status:** NEW (Migration 3)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| csv_import_id | UUID | FOREIGN KEY | References csv_imports(id) |
| contractor_config_id | UUID | FOREIGN KEY | References mep_contractor_configs(id) |
| operation_type | TEXT | NOT NULL, CHECK | import, update, delete, sync_check |
| entity_type | TEXT | NOT NULL | Contact, Site, Asset, Task, System, etc. |
| records_processed | INTEGER | DEFAULT 0 | |
| records_successful | INTEGER | DEFAULT 0 | |
| records_failed | INTEGER | DEFAULT 0 | |
| graphql_query | TEXT | | First 1000 chars (for reference) |
| api_response_status | INTEGER | | HTTP status code |
| api_response_time_ms | INTEGER | | Coperniq API response time |
| api_error_code | TEXT | | |
| api_error_message | TEXT | | |
| status | TEXT | NOT NULL, CHECK | success, partial_success, failed |
| transaction_id | TEXT | | Coperniq transaction ID |
| rollback_attempted | BOOLEAN | DEFAULT false | |
| rollback_successful | BOOLEAN | DEFAULT false | |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | |
| completed_at | TIMESTAMPTZ | | |
| performed_by | TEXT | NOT NULL | |
| notes | TEXT | | |

**Key Indexes:**
- idx_coperniq_sync_log_import
- idx_coperniq_sync_log_contractor
- idx_coperniq_sync_log_status
- idx_coperniq_sync_log_timestamp
- idx_coperniq_sync_log_entity

**Relationships:**
- many ← 1 csv_imports
- many ← 1 mep_contractor_configs

---

### 12. data_lineage
**Purpose:** Track complete data flow from CSV → forms → Coperniq
**Status:** NEW (Migration 3)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY | v4 generation |
| csv_import_record_id | UUID | FOREIGN KEY | References csv_import_records(id) |
| form_submission_id | UUID | FOREIGN KEY | References mep_form_submissions(id) |
| coperniq_entity_type | TEXT | NOT NULL, CHECK | Contact, Site, Asset, Task, System, etc. |
| coperniq_entity_id | TEXT | NOT NULL | ID in Coperniq |
| coperniq_company_id | TEXT | | Company ID in Coperniq (112 for sandbox) |
| transformation_applied | TEXT | | Description of transformations |
| data_quality_score | DECIMAL(3,2) | CHECK 0-1 | 0.0 (bad) to 1.0 (perfect) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Trigger-maintained |

**Key Indexes:**
- idx_data_lineage_csv_record
- idx_data_lineage_submission
- idx_data_lineage_coperniq (coperniq_entity_type, coperniq_entity_id)
- idx_data_lineage_company

**Relationships:**
- many ← 1 csv_import_records
- many ← 1 mep_form_submissions

---

## Enum Types

### trade_type
```sql
'hvac'
'plumbing'
'electrical'
'solar'
'fire_protection'
'controls'
'tud_market'
'low_voltage'
'roofing'
'general_contractor'
```

### phase_type
```sql
'sales'
'design'
'permit'
'install'
'commissioning'
'om'
'service'
```

### market_type
```sql
'residential'
'commercial'
'industrial'
'institutional'
'mixed'
```

### submission_status
```sql
'draft'
'submitted'
'approved'
'rejected'
'archived'
```

### usage_action_type
```sql
'viewed'
'filled'
'submitted'
'edited'
'exported'
```

### csv_import_status
```sql
'pending'
'validating'
'processing'
'success'
'partial_success'
'failed'
'rollback'
```

### csv_record_status
```sql
'valid'
'skipped'
'error'
'duplicate'
'warning'
```

---

## Views Summary

| View | Purpose | Primary Tables | Use Case |
|------|---------|----------------|----------|
| template_summary | Template counts & stats | templates, template_groups, template_fields | Dashboard |
| contractor_summary | Contractor activity overview | mep_contractor_configs, mep_form_submissions | Reporting |
| template_usage_analytics | Template performance metrics | templates, mep_template_usage | Analytics |
| form_submission_details | Rich submission details | mep_form_submissions, templates, mep_contractor_configs | Details lookup |
| contractor_activity_timeline | Activity history | mep_contractor_configs, mep_form_submissions | Timeline view |
| csv_import_summary | CSV import statistics | csv_imports, csv_import_records, mep_contractor_configs | Import tracking |
| coperniq_sync_history | Sync operation history | coperniq_sync_log, csv_imports, mep_contractor_configs | Sync audit |

---

## Functions Summary

| Function | Parameters | Returns | Purpose |
|----------|-----------|---------|---------|
| update_updated_at() | — | TRIGGER | Auto-update updated_at |
| update_contractor_template_count() | — | TRIGGER | Sync templates_enabled_count |
| set_submission_timestamps() | — | TRIGGER | Auto-set status timestamps |
| calculate_import_duration() | — | TRIGGER | Auto-calculate CSV import duration |
| get_template_full(template_name) | TEXT | JSONB | Nested template with groups/fields |
| get_contractor_template_stats(config_id) | UUID | TABLE | Template usage stats for contractor |
| record_template_usage(template_id, contractor_id, action, ...) | Multiple | UUID | Log template action |
| create_form_submission(template_id, contractor_id, form_title, form_data, submitted_by) | Multiple | UUID | Create submission with auto-increment |
| create_csv_import(contractor_id, import_name, coperniq_type, imported_by) | Multiple | UUID | Initialize CSV import |
| add_csv_import_record(import_id, record_number, record_data, status) | Multiple | UUID | Add record to import |
| log_coperniq_sync(import_id, operation_type, entity_type, ...) | Multiple | UUID | Log sync operation |

---

## Column Type Reference

| Type | Usage | Examples |
|------|-------|----------|
| UUID | Primary keys, foreign keys | id, template_id |
| TEXT | Names, descriptions, enums | contractor_name, status |
| TEXT[] | Arrays of values | trades, markets, templates_enabled |
| INTEGER | Counts, ordinal values | total_records, display_order |
| JSONB | Complex nested data | form_data, error_summary, options |
| BOOLEAN | Flags | is_active, is_required, is_custom |
| TIMESTAMPTZ | Timestamps with timezone | created_at, submitted_at |
| DECIMAL(3,2) | Scores 0-1 | mapping_confidence, data_quality_score |
| ENUM | Predefined values | status, action, trade |

---

## Index Strategy

### Fast Lookups (WHERE clauses)
- contractor_configs_name: `WHERE contractor_name = ?`
- contractor_configs_email: `WHERE contractor_email = ?`
- form_submissions_status: `WHERE status = ?`
- form_submissions_submitted_by: `WHERE submitted_by = ?`

### Array Searches (GIN indexes)
- contractor_configs_trades: `WHERE 'hvac' = ANY(trades)`
- contractor_configs_markets: `WHERE 'residential' = ANY(markets)`
- form_submissions_form_data: `WHERE form_data @> '{"field":"value"}'`

### Sorting & Ranges (DESC)
- form_submissions_submitted_at: `ORDER BY submitted_at DESC`
- csv_imports_created: `ORDER BY created_at DESC`
- coperniq_sync_log_timestamp: `ORDER BY started_at DESC`

### Composite Queries (Multi-column)
- form_submissions_composite: `(contractor_id, template_id, status)`
- csv_imports_composite: `(contractor_id, coperniq_type, status)`
- template_usage_composite: `(contractor_id, template_id, action)`

---

## Constraints & Validation

### Domain Constraints
- contractor_name must not be empty
- at_least_one_trade: `array_length(trades, 1) > 0`
- at_least_one_market: `array_length(markets, 1) > 0`
- positive_count: `records_processed >= 0`
- record_counts_consistent: `success + failed <= attempted`

### Foreign Key Constraints
- All references have ON DELETE CASCADE/RESTRICT as appropriate
- Template references RESTRICT (prevent template deletion if in use)
- Config references CASCADE (delete related records on config deletion)

### Timestamp Constraints
- submitted_at required when status IN ('submitted', 'approved', 'rejected')
- approved_at required when status = 'approved'
- archived_at required when status = 'archived'

---

## Security (RLS)

### Public Read
- templates (all, filtered by is_active)
- coperniq_field_mapping (reference data)

### Service Role Full Access
- All tables (for migrations, orchestrator)

### Authenticated Users
- Read/write own contractor config
- Read/write own form submissions (drafts only)
- Read own usage and import data

### No Direct Writes
- CSV imports/records created via functions only
- Coperniq sync logged via functions only
- Timestamps auto-managed by triggers

---

**Last Updated:** 2025-12-20
**Status:** Production Schema
