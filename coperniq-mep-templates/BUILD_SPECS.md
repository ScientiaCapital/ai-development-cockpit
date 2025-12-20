# Coperniq Build Specifications

**What We Can Build RIGHT NOW**

---

## P0 CRITICAL: Estimating & Quoting Module

### What It Does
Allows contractors to create quotes/estimates for jobs, track win/loss, convert to projects.

### MVP Features (4-6 weeks)
```
1. Quote Creation
   - Customer selection (link to existing /clients/)
   - Line items: labor, materials, equipment
   - Quantity, unit price, extended price
   - Tax calculation
   - Markup/margin settings per quote

2. Price Book
   - Standard labor rates by trade
   - Material catalog with pricing
   - Equipment rental rates
   - Markup defaults

3. Quote Workflow
   - Draft → Sent → Approved/Declined
   - Email quote to customer
   - PDF generation with company branding
   - Customer digital signature

4. Quote-to-Project Conversion
   - One-click convert approved quote to project
   - Auto-populate project with quote line items
```

### Database Schema
```sql
-- quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE,
  customer_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id), -- after conversion
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, approved, declined, expired
  subtotal DECIMAL(12,2),
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(12,2),
  total DECIMAL(12,2),
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- quote_line_items table
CREATE TABLE quote_line_items (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id),
  item_type VARCHAR(20), -- labor, material, equipment, other
  description TEXT,
  quantity DECIMAL(10,2),
  unit VARCHAR(20),
  unit_price DECIMAL(10,2),
  markup_percent DECIMAL(5,2),
  extended_price DECIMAL(12,2),
  sort_order INT
);

-- price_book table
CREATE TABLE price_book (
  id UUID PRIMARY KEY,
  category VARCHAR(50), -- labor, material, equipment
  name VARCHAR(255),
  description TEXT,
  unit VARCHAR(20),
  base_price DECIMAL(10,2),
  default_markup DECIMAL(5,2),
  trade_type VARCHAR(50), -- hvac, plumbing, electrical, fire
  is_active BOOLEAN DEFAULT true
);
```

### API Endpoints
```
POST   /api/quotes              - Create quote
GET    /api/quotes              - List quotes (with filters)
GET    /api/quotes/:id          - Get quote details
PUT    /api/quotes/:id          - Update quote
POST   /api/quotes/:id/send     - Email quote to customer
POST   /api/quotes/:id/convert  - Convert to project
GET    /api/price-book          - Get price book items
POST   /api/price-book          - Add price book item
```

### UI Components
```
/112/quotes/              - Quote list view
/112/quotes/new           - Create new quote
/112/quotes/:id           - Quote detail/edit
/112/quotes/:id/preview   - PDF preview
/112/settings/price-book  - Price book management
```

### Integration Points
- Integrate with existing `/clients/` for customer selection
- Integrate with existing `/projects/` for conversion
- Link to future invoicing module

**Estimated Effort: 160-240 hours ($25-40K at $150-170/hr)**

---

## P0 CRITICAL: Forms & Checklists Builder

### What It Does
Drag-drop form builder for field technicians - inspections, safety checklists, commissioning reports.

### MVP Features (3-5 weeks)
```
1. Form Builder (Admin)
   - Drag-drop field types: text, number, date, checkbox, photo, signature
   - Conditional logic (show/hide based on answers)
   - Required field validation
   - Form templates library

2. Form Filling (Mobile/Field)
   - Offline-capable form completion
   - Photo capture with annotation
   - Customer signature capture
   - GPS location stamp
   - Auto-save drafts

3. Form Management
   - Attach forms to work orders
   - Form submission history
   - PDF export of completed forms
   - Form analytics (completion rates)
```

### Database Schema
```sql
-- form_templates table
CREATE TABLE form_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  category VARCHAR(50), -- inspection, safety, commissioning, custom
  trade_type VARCHAR(50), -- hvac, plumbing, electrical, fire, all
  fields JSONB, -- form field definitions
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- form_submissions table
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES form_templates(id),
  work_order_id UUID REFERENCES work_orders(id),
  submitted_by UUID REFERENCES users(id),
  responses JSONB, -- field values
  photos JSONB, -- photo URLs
  signature_url TEXT,
  location POINT, -- GPS coordinates
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'submitted' -- draft, submitted, reviewed
);
```

### Form Field Schema (JSONB)
```json
{
  "fields": [
    {
      "id": "f1",
      "type": "text",
      "label": "Equipment Serial Number",
      "required": true
    },
    {
      "id": "f2",
      "type": "checkbox",
      "label": "Safety equipment present",
      "options": ["Hard hat", "Safety glasses", "Gloves"]
    },
    {
      "id": "f3",
      "type": "photo",
      "label": "Before photo",
      "required": true
    },
    {
      "id": "f4",
      "type": "signature",
      "label": "Customer signature"
    }
  ],
  "conditions": [
    {
      "if": {"field": "f2", "contains": "Gloves"},
      "show": "f5"
    }
  ]
}
```

### Pre-Built Templates (MEP Specific)
```
HVAC:
- AC System Inspection Checklist
- Furnace Safety Inspection
- Refrigerant Leak Test Form
- PM Agreement Service Report

Plumbing:
- Backflow Test Report
- Camera Inspection Report
- Water Heater Installation Checklist

Electrical:
- Panel Inspection Form
- Ground Fault Test Report
- Circuit Load Analysis

Fire Protection:
- Sprinkler Inspection Report
- Fire Extinguisher Inspection
- Hydrant Flow Test Report
```

**Estimated Effort: 120-200 hours ($20-35K)**

---

## P0 CRITICAL: Inventory Management

### What It Does
Track parts/materials, truck stock, purchase orders, vendor management.

### MVP Features (4-5 weeks)
```
1. Parts Catalog
   - Part number, description, category
   - Unit of measure, cost, sell price
   - Vendor information
   - Min/max stock levels
   - Reorder alerts

2. Inventory Tracking
   - Warehouse locations
   - Truck stock per technician
   - Stock transfers
   - Usage tracking (link to work orders)

3. Purchase Orders
   - Create PO from low stock alerts
   - Vendor selection
   - PO approval workflow
   - Receiving and reconciliation

4. Integration with Work Orders
   - Add parts used on work order
   - Auto-deduct from truck stock
   - Cost tracking per job
```

### Database Schema
```sql
-- parts table
CREATE TABLE parts (
  id UUID PRIMARY KEY,
  part_number VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  unit VARCHAR(20),
  cost DECIMAL(10,2),
  sell_price DECIMAL(10,2),
  default_markup DECIMAL(5,2),
  min_stock INT,
  max_stock INT,
  preferred_vendor_id UUID REFERENCES vendors(id),
  is_active BOOLEAN DEFAULT true
);

-- inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  part_id UUID REFERENCES parts(id),
  location_type VARCHAR(20), -- warehouse, truck
  location_id UUID, -- warehouse_id or user_id (for truck)
  quantity INT,
  last_counted_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- purchase_orders table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE,
  vendor_id UUID REFERENCES vendors(id),
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, partial, received, cancelled
  total DECIMAL(12,2),
  ordered_by UUID REFERENCES users(id),
  ordered_at TIMESTAMP,
  expected_date DATE,
  received_at TIMESTAMP
);

-- work_order_parts table (usage tracking)
CREATE TABLE work_order_parts (
  id UUID PRIMARY KEY,
  work_order_id UUID REFERENCES work_orders(id),
  part_id UUID REFERENCES parts(id),
  quantity INT,
  unit_cost DECIMAL(10,2),
  unit_price DECIMAL(10,2), -- charged to customer
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMP DEFAULT NOW()
);
```

**Estimated Effort: 160-200 hours ($25-35K)**

---

## P1 HIGH: Route Optimization

### What It Does
Optimize technician routes for the day based on appointments, location, traffic.

### MVP Features (2-3 weeks)
```
1. Route Planning
   - Import day's appointments from calendar
   - Optimize route order (minimize drive time)
   - Consider appointment windows
   - Handle priority jobs

2. Real-time Updates
   - Re-route when jobs added/cancelled
   - Traffic-aware routing
   - ETA updates for customers

3. Integration
   - Google Maps Directions API
   - Send route to technician mobile
   - Customer notification of ETA
```

### Implementation Options
```
Option A: Google Maps Platform ($200-500/mo for usage)
- Directions API for routing
- Distance Matrix for optimization
- Maps JavaScript API for display

Option B: OpenRouteService (Open Source)
- Free tier available
- Self-hosted option
- Less accurate traffic data

Option C: OptimoRoute API (SaaS)
- Purpose-built for field service
- $35-45/driver/month
- Best optimization algorithms
```

### Database Additions
```sql
-- technician_routes table
CREATE TABLE technician_routes (
  id UUID PRIMARY KEY,
  technician_id UUID REFERENCES users(id),
  route_date DATE,
  stops JSONB, -- ordered list of work orders with times
  total_distance DECIMAL(10,2),
  total_duration INT, -- minutes
  optimized_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'planned' -- planned, in_progress, completed
);
```

**Estimated Effort: 60-100 hours ($10-17K) + API costs**

---

## P2 MEDIUM: Trade-Specific Templates

### What It Does
Pre-configured templates, forms, and workflows specific to each MEP trade.

### MVP Features (2-3 weeks per trade)
```
HVAC Package:
- Equipment types (AC, furnace, heat pump, RTU)
- Refrigerant tracking (EPA 608 compliance)
- Load calculation templates
- PM agreement scheduling

Plumbing Package:
- Fixture count templates
- Backflow certification workflow
- Camera inspection reports
- Drain cleaning tracking

Electrical Package:
- Panel schedule templates
- Circuit mapping
- Arc flash calculation
- Code compliance checklists

Fire Protection Package:
- Inspection schedules (NFPA)
- Test reports (flow tests)
- Violation tracking
- Hydrant inventory
```

**Estimated Effort: 40-60 hours per trade ($7-10K each)**

---

## Total Build Opportunity

| Module | Effort | Cost Range |
|--------|--------|------------|
| Estimating & Quoting | 160-240 hrs | $25-40K |
| Forms & Checklists | 120-200 hrs | $20-35K |
| Inventory Management | 160-200 hrs | $25-35K |
| Route Optimization | 60-100 hrs | $10-17K |
| Trade Templates (x4) | 160-240 hrs | $28-40K |
| **TOTAL** | **660-980 hrs** | **$108-167K** |

---

## Recommended Build Order

### Phase 1: Foundation (8 weeks, $45-60K)
1. **Forms Builder** - Enables field data capture
2. **Estimating MVP** - Enables sales workflow

### Phase 2: Operations (6 weeks, $35-50K)
3. **Inventory Basics** - Track parts, truck stock
4. **Quote-to-Invoice** - Complete sales cycle

### Phase 3: Optimization (4 weeks, $25-35K)
5. **Route Optimization** - Efficiency gains
6. **Trade Templates** - Industry specifics

---

## How ai-development-cockpit Builds This

### Stack Alignment with Coperniq
- **Frontend**: React + TypeScript (match existing)
- **Backend**: Node.js or Python (check existing)
- **Database**: PostgreSQL (Supabase compatible)
- **Mobile**: React Native or PWA

### Delivery Approach
1. **Sprint 0**: Setup, schema, API scaffolding
2. **Sprint 1-2**: Core CRUD operations
3. **Sprint 3**: UI components, integration
4. **Sprint 4**: Testing, polish, deploy

### Handoff Package
Each module includes:
- Database migrations (SQL)
- API endpoints (OpenAPI spec)
- UI wireframes (Figma or code)
- Test cases
- Integration guide
