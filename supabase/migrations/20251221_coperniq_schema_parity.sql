-- Coperniq Schema Parity Migration
-- Generated: 2025-12-21
-- Purpose: Create core business data tables matching Coperniq GraphQL schema exactly
-- Source: /Users/tmkipper/Desktop/tk_projects/bug-hive/COPERNIQ_SCHEMA.md

-- ============================================================================
-- CORE BUSINESS DATA TABLES (12 tables)
-- These mirror Coperniq's GraphQL types for seamless data sync
-- ============================================================================

-- 1. CONTACTS (Coperniq Contact type - 192 fields)
-- Customers, leads, and all contact records
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,                    -- Sync with Coperniq
    name TEXT,
    title TEXT,
    description TEXT,
    emails TEXT[],                                 -- Array of email addresses
    phones TEXT[],                                 -- Array of phone numbers
    emails_normalized TEXT[],                      -- Normalized for matching
    status TEXT DEFAULT 'active',
    portal_status TEXT,                            -- Customer portal access status
    source TEXT,                                   -- Lead source
    referral_code TEXT,
    referrer_contact_id UUID REFERENCES contacts(id),
    last_invited_at TIMESTAMPTZ,
    invited_count INTEGER DEFAULT 0,
    last_signed_in_at TIMESTAMPTZ,
    company_id INTEGER NOT NULL,
    created_by UUID,
    search_string TEXT,                            -- Full-text search field
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contacts IS 'Customers, leads, and contact records - mirrors Coperniq Contact type';

-- 2. SITES (Coperniq Site type - 119 fields)
-- Customer property/location information
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    uid TEXT UNIQUE,
    full_address TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zipcode TEXT,
    geo_location POINT,                            -- PostGIS point type
    street_view_url TEXT,
    address_normalized JSONB,                      -- Normalized address data
    address_pretty TEXT,
    full_address_from_google TEXT,
    client_id UUID REFERENCES contacts(id),        -- Customer/account
    company_id INTEGER NOT NULL,
    jurisdiction_id INTEGER,                       -- AHJ (Authority Having Jurisdiction)
    utility_id INTEGER,
    image_file_id INTEGER,
    timezone TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sites IS 'Customer locations and properties - mirrors Coperniq Site type';

-- 3. SYSTEMS (Coperniq System type - 106 fields)
-- Monitored systems (solar, HVAC with IoT, etc.)
-- Created before assets/tasks due to FK references
CREATE TABLE IF NOT EXISTS systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    uuid TEXT UNIQUE,
    name TEXT,
    size TEXT,                                     -- Capacity
    number TEXT,                                   -- System number
    client_type TEXT,
    connection_type TEXT,
    status TEXT,
    provider_status TEXT,
    operation_status TEXT,
    provider_id INTEGER,
    integration_id INTEGER,
    address TEXT,
    address_normalized JSONB,
    address_city TEXT,
    address_state TEXT,
    address_street TEXT,
    address_zip TEXT,
    timezone TEXT,
    project_id INTEGER,
    site_id UUID REFERENCES sites(id),
    profile_id INTEGER,                            -- Monitoring profile
    monitored BOOLEAN DEFAULT false,
    profile_overrides JSONB,
    last_report_at TIMESTAMPTZ,
    installed_at TIMESTAMPTZ,
    operational_at TIMESTAMPTZ,
    notes TEXT,
    address_forced BOOLEAN DEFAULT false,
    company_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE systems IS 'Monitored systems (solar, HVAC IoT) - mirrors Coperniq System type';

-- 4. ASSETS (Coperniq Asset type - 67 fields)
-- Customer equipment and assets
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    uid TEXT UNIQUE,
    name TEXT,
    type TEXT,                                     -- Equipment type (hvac, water_heater, panel)
    status TEXT,                                   -- Operational status
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    size TEXT,                                     -- Capacity/size
    install_date TIMESTAMPTZ,
    manufacturing_date TIMESTAMPTZ,
    expected_lifetime INTEGER,                     -- Expected lifespan in months
    description TEXT,
    cover_image_file_id INTEGER,
    nameplate_image_file_id INTEGER,
    site_id UUID REFERENCES sites(id),
    project_id INTEGER,
    company_id INTEGER NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assets IS 'Customer equipment (HVAC units, panels, water heaters) - mirrors Coperniq Asset type';

-- 5. SERVICE_PLANS (Coperniq ServicePlan type - 25 fields)
-- Recurring service plan templates
CREATE TABLE IF NOT EXISTS service_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    name TEXT,
    description TEXT,
    duration_months INTEGER,
    auto_renew BOOLEAN DEFAULT false,
    total_price DECIMAL(12,2),
    pricing_type TEXT,                             -- flat, tiered, etc.
    invoicing_frequency TEXT,                      -- monthly, quarterly, annual
    invoice_term_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    image_file_id INTEGER,
    company_id INTEGER NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE service_plans IS 'Service agreement templates - mirrors Coperniq ServicePlan type';

-- 6. SERVICE_PLAN_INSTANCES (Coperniq ServicePlanInstance type - 41 fields)
-- Active service agreements with customers
CREATE TABLE IF NOT EXISTS service_plan_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    service_plan_id UUID REFERENCES service_plans(id),
    client_id UUID REFERENCES contacts(id),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    duration_months INTEGER,
    auto_renew BOOLEAN DEFAULT false,
    total_price DECIMAL(12,2),
    pricing_type TEXT,
    invoicing_frequency TEXT,
    invoice_term_days INTEGER,
    status TEXT,
    company_id INTEGER NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE service_plan_instances IS 'Active service contracts - mirrors Coperniq ServicePlanInstance type';

-- 7. TASKS (Coperniq Task type - 55 fields)
-- Work orders, service calls, and field operations
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    uid TEXT UNIQUE,
    title TEXT,
    description TEXT,
    status TEXT,
    priority INTEGER,
    position INTEGER,
    project_id INTEGER,
    company_id INTEGER NOT NULL,
    created_by UUID,
    assignee_id UUID,
    template_task_id UUID REFERENCES tasks(id),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    start_date_all_day BOOLEAN DEFAULT false,
    end_date_all_day BOOLEAN DEFAULT false,
    completion_date TIMESTAMPTZ,
    completion_time TEXT,
    completion_time_in_s INTEGER,
    is_field BOOLEAN DEFAULT false,                -- Field work order flag
    next_visit_id INTEGER,
    address TEXT,                                  -- Work location
    is_archived BOOLEAN DEFAULT false,
    is_closed BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    calculated_status TEXT,
    system_id UUID REFERENCES systems(id),
    asset_id UUID REFERENCES assets(id),
    site_id UUID REFERENCES sites(id),
    service_plan_instance_id UUID REFERENCES service_plan_instances(id),
    is_template BOOLEAN DEFAULT false,
    template_property_ids INTEGER[],
    virtual_properties JSONB,
    first_label_id INTEGER,
    is_colored BOOLEAN DEFAULT false,
    project_stage_id INTEGER,
    job_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tasks IS 'Work orders, service calls, field operations - mirrors Coperniq Task type';

-- 8. FORMS (Coperniq Form type - 138 fields)
-- Checklists, inspections, and data collection forms
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    name TEXT,
    title TEXT,
    description TEXT,
    status TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMPTZ,
    is_template BOOLEAN DEFAULT false,
    template_id UUID REFERENCES forms(id),
    assignee_id UUID,
    assignee_property_id INTEGER,                  -- Dynamic assignment
    due_date TIMESTAMPTZ,
    due_date_x_days_after INTEGER,                 -- Relative due date
    company_id INTEGER NOT NULL,
    created_by UUID,
    stage_id INTEGER,
    parent_task_id UUID REFERENCES tasks(id),
    file_id INTEGER,
    members JSONB,
    privilege_own BOOLEAN DEFAULT false,
    privilege_team BOOLEAN DEFAULT false,
    privilege_all BOOLEAN DEFAULT false,
    old_fields JSONB,                              -- Legacy field storage
    fields JSONB,                                  -- Modern field storage
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE forms IS 'Checklists, inspections, data collection - mirrors Coperniq Form type';

-- 9. FINANCIAL_DOCUMENTS (Coperniq FinancialDocument type - 64 fields)
-- Invoices, quotes, and billing documents
CREATE TABLE IF NOT EXISTS financial_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    uid TEXT UNIQUE,
    title TEXT,
    description TEXT,
    type TEXT,                                     -- invoice, quote, bill, etc.
    status TEXT,                                   -- draft, sent, paid, etc.
    amount DECIMAL(12,2),
    amount_paid DECIMAL(12,2),
    base_amount DECIMAL(12,2),
    percentage DECIMAL(5,2),
    calculation_method TEXT,
    issue_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    record_id INTEGER,                             -- Project/job reference
    client_id UUID REFERENCES contacts(id),
    company_id INTEGER NOT NULL,
    created_by_id UUID,
    based_on_id UUID REFERENCES financial_documents(id),
    based_on_uid TEXT,
    service_plan_instance_id UUID REFERENCES service_plan_instances(id),
    external_id TEXT,
    external_pdf_url TEXT,
    external_acceptance_url TEXT,
    external_payment_url TEXT,
    shared_with_portal BOOLEAN DEFAULT false,
    revision INTEGER DEFAULT 1,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE financial_documents IS 'Invoices, quotes, billing - mirrors Coperniq FinancialDocument type';

-- 10. ACTIONS (Coperniq Action type - 139 fields)
-- Workflow automation actions
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    title TEXT,
    description TEXT,
    type TEXT,
    status TEXT,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_template BOOLEAN DEFAULT false,
    action_template_id UUID REFERENCES actions(id),
    company_id INTEGER NOT NULL,
    project_id INTEGER,
    project_stage_id INTEGER,
    parent_task_id UUID REFERENCES tasks(id),
    created_by UUID,
    assign_all_contacts BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE actions IS 'Workflow automation actions - mirrors Coperniq Action type';

-- 11. TASK_VISITS (Coperniq TaskVisit type - 18 fields)
-- Individual visits within a work order
CREATE TABLE IF NOT EXISTS task_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    position INTEGER,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    start_date_all_day BOOLEAN DEFAULT false,
    end_date_all_day BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    job_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_visits IS 'Scheduled visits within work orders - mirrors Coperniq TaskVisit type';

-- 12. PAYMENT_RECORDS (Coperniq PaymentRecord type - 26 fields)
-- Payment tracking for invoices
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coperniq_id INTEGER UNIQUE,
    uid TEXT UNIQUE,
    financial_document_id UUID NOT NULL REFERENCES financial_documents(id) ON DELETE CASCADE,
    amount DECIMAL(12,2),
    payment_method TEXT,
    payment_reference TEXT,
    payment_date TIMESTAMPTZ,
    status TEXT,
    processed_at TIMESTAMPTZ,
    card_brand TEXT,
    card_last4 TEXT,
    bank_name TEXT,
    bank_account_last4 TEXT,
    bank_account_type TEXT,
    bank_account_holder_type TEXT,
    bank_routing_number TEXT,
    is_external BOOLEAN DEFAULT false,
    external_id TEXT,
    notes TEXT,
    company_id INTEGER NOT NULL,
    created_by_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE payment_records IS 'Payment tracking for invoices - mirrors Coperniq PaymentRecord type';

-- ============================================================================
-- INDEXES
-- Optimized for common query patterns
-- ============================================================================

-- Contact lookups
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_emails ON contacts USING GIN(emails);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING GIN(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(search_string, '')));

-- Site lookups
CREATE INDEX IF NOT EXISTS idx_sites_company ON sites(company_id);
CREATE INDEX IF NOT EXISTS idx_sites_client ON sites(client_id);
CREATE INDEX IF NOT EXISTS idx_sites_state ON sites(state);
CREATE INDEX IF NOT EXISTS idx_sites_zipcode ON sites(zipcode);

-- System lookups
CREATE INDEX IF NOT EXISTS idx_systems_company ON systems(company_id);
CREATE INDEX IF NOT EXISTS idx_systems_site ON systems(site_id);
CREATE INDEX IF NOT EXISTS idx_systems_status ON systems(status);
CREATE INDEX IF NOT EXISTS idx_systems_monitored ON systems(monitored);

-- Asset lookups
CREATE INDEX IF NOT EXISTS idx_assets_company ON assets(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_site ON assets(site_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_serial ON assets(serial_number);

-- Service plan lookups
CREATE INDEX IF NOT EXISTS idx_service_plans_company ON service_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_active ON service_plans(is_active);

-- Service plan instance lookups
CREATE INDEX IF NOT EXISTS idx_spi_company ON service_plan_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_spi_client ON service_plan_instances(client_id);
CREATE INDEX IF NOT EXISTS idx_spi_status ON service_plan_instances(status);
CREATE INDEX IF NOT EXISTS idx_spi_dates ON service_plan_instances(start_date, end_date);

-- Task lookups (critical for work order management)
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_site ON tasks(site_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_field ON tasks(is_field);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_template ON tasks(is_template);

-- Form lookups
CREATE INDEX IF NOT EXISTS idx_forms_company ON forms(company_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_parent_task ON forms(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_forms_template ON forms(is_template);

-- Financial document lookups
CREATE INDEX IF NOT EXISTS idx_financial_docs_company ON financial_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_docs_type ON financial_documents(type);
CREATE INDEX IF NOT EXISTS idx_financial_docs_status ON financial_documents(status);
CREATE INDEX IF NOT EXISTS idx_financial_docs_client ON financial_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_docs_dates ON financial_documents(issue_date, due_date);

-- Action lookups
CREATE INDEX IF NOT EXISTS idx_actions_company ON actions(company_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_parent_task ON actions(parent_task_id);

-- Task visit lookups
CREATE INDEX IF NOT EXISTS idx_task_visits_task ON task_visits(task_id);
CREATE INDEX IF NOT EXISTS idx_task_visits_dates ON task_visits(start_date, end_date);

-- Payment record lookups
CREATE INDEX IF NOT EXISTS idx_payment_records_financial_doc ON payment_records(financial_document_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_company ON payment_records(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_plan_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Public read access (for development - tighten for production)
CREATE POLICY "Public read contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Public read sites" ON sites FOR SELECT USING (true);
CREATE POLICY "Public read systems" ON systems FOR SELECT USING (true);
CREATE POLICY "Public read assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Public read service_plans" ON service_plans FOR SELECT USING (true);
CREATE POLICY "Public read service_plan_instances" ON service_plan_instances FOR SELECT USING (true);
CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public read forms" ON forms FOR SELECT USING (true);
CREATE POLICY "Public read financial_documents" ON financial_documents FOR SELECT USING (true);
CREATE POLICY "Public read actions" ON actions FOR SELECT USING (true);
CREATE POLICY "Public read task_visits" ON task_visits FOR SELECT USING (true);
CREATE POLICY "Public read payment_records" ON payment_records FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role contacts" ON contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role sites" ON sites FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role systems" ON systems FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role assets" ON assets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role service_plans" ON service_plans FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role service_plan_instances" ON service_plan_instances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role tasks" ON tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role forms" ON forms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role financial_documents" ON financial_documents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role actions" ON actions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role task_visits" ON task_visits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role payment_records" ON payment_records FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps on modifications
-- ============================================================================

-- Reuse update_updated_at function from previous migration if exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER service_plans_updated_at BEFORE UPDATE ON service_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER service_plan_instances_updated_at BEFORE UPDATE ON service_plan_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER financial_documents_updated_at BEFORE UPDATE ON financial_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER actions_updated_at BEFORE UPDATE ON actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER task_visits_updated_at BEFORE UPDATE ON task_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payment_records_updated_at BEFORE UPDATE ON payment_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS
-- Useful aggregations and summaries
-- ============================================================================

-- Customer summary view
CREATE OR REPLACE VIEW customer_summary AS
SELECT
    c.id,
    c.coperniq_id,
    c.name,
    c.status,
    c.source,
    COUNT(DISTINCT s.id) as site_count,
    COUNT(DISTINCT a.id) as asset_count,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT spi.id) as active_contracts,
    COALESCE(SUM(fd.amount), 0) as total_billed,
    COALESCE(SUM(fd.amount_paid), 0) as total_paid,
    c.created_at,
    c.updated_at
FROM contacts c
LEFT JOIN sites s ON s.client_id = c.id
LEFT JOIN assets a ON a.site_id = s.id
LEFT JOIN tasks t ON t.site_id = s.id AND t.is_template = false
LEFT JOIN service_plan_instances spi ON spi.client_id = c.id AND spi.status = 'active'
LEFT JOIN financial_documents fd ON fd.client_id = c.id
GROUP BY c.id;

-- Work order dashboard view
CREATE OR REPLACE VIEW work_order_dashboard AS
SELECT
    t.id,
    t.coperniq_id,
    t.title,
    t.status,
    t.priority,
    t.is_field,
    t.start_date,
    t.end_date,
    t.assignee_id,
    s.full_address as site_address,
    s.city as site_city,
    s.state as site_state,
    c.name as customer_name,
    c.phones as customer_phones,
    COUNT(DISTINCT f.id) as form_count,
    COUNT(DISTINCT tv.id) as visit_count,
    t.created_at,
    t.updated_at
FROM tasks t
LEFT JOIN sites s ON s.id = t.site_id
LEFT JOIN contacts c ON c.id = s.client_id
LEFT JOIN forms f ON f.parent_task_id = t.id
LEFT JOIN task_visits tv ON tv.task_id = t.id
WHERE t.is_template = false
GROUP BY t.id, s.id, c.id;

-- Asset inventory view
CREATE OR REPLACE VIEW asset_inventory AS
SELECT
    a.id,
    a.coperniq_id,
    a.name,
    a.type,
    a.manufacturer,
    a.model,
    a.serial_number,
    a.status,
    a.install_date,
    s.full_address as site_address,
    c.name as customer_name,
    COUNT(DISTINCT t.id) as related_tasks,
    a.created_at
FROM assets a
LEFT JOIN sites s ON s.id = a.site_id
LEFT JOIN contacts c ON c.id = s.client_id
LEFT JOIN tasks t ON t.asset_id = a.id
WHERE a.is_archived = false
GROUP BY a.id, s.id, c.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW customer_summary IS 'Aggregated customer data with site, asset, task, and financial summaries';
COMMENT ON VIEW work_order_dashboard IS 'Work order overview with customer and site details';
COMMENT ON VIEW asset_inventory IS 'Asset inventory with customer and maintenance history';
