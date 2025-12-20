# Coperniq Form Builder Discovery Report

**Date:** 2025-12-20
**Status:** GATE 0 Complete - Discovery Approved
**Captured by:** AI Development Cockpit Agent Team

---

## Process Studio Navigation

Located at: `Company Settings > Process Studio`

### Available Template Types
| Type | URL Path | Description |
|------|----------|-------------|
| **Project Workflows** | `/studio/workflows/project-workflows` | Workflow automations for projects |
| **Request Workflows** | `/studio/workflows/request-workflows` | Workflow automations for requests |
| **Field Work Orders** | `/studio/templates/field-wo-templates` | Work orders for field technicians |
| **Office Work Orders** | `/studio/templates/office-wo-templates` | Work orders for office staff |
| **Forms** | `/studio/templates/form-templates` | Custom forms (33+ templates) |
| **Payment Structures** | `/studio/templates/payment-structure-templates` | Payment milestone templates |
| **Document Requests** | `/studio/templates/document-request-templates` | Document collection templates |
| **Automations** | `/studio/automations` | Workflow automation rules |

---

## Form Field Types Available

### Core Field Types

| Field Type | Icon | Description | Use Case |
|------------|------|-------------|----------|
| **Text** | `Aa` | Free text input | Equipment names, notes, serial numbers |
| **Numeric** | `123` | Number input | Measurements, quantities, readings |
| **Single select** | `○` | Dropdown (one choice) | Yes/No, condition ratings, status |
| **Multiple select** | `☑` | Dropdown (multiple choices) | Trades involved, issues found |
| **File** | `📎` | File/image upload | Photos, documents, sketches |
| **Group** | `⊞` | Section grouping | Organize fields into logical sections |

### Project Properties (Linkable)

Forms can pull data from project properties:

**Standard Properties:**
- Trades, Status, Project value, Project size
- Sales Rep, Project Manager, Owner
- Description, Last activity
- Profit, Revenue, Cost
- Primary phone, Primary email
- Site Address (Street, City, State, Zipcode)
- AHJ (Authority Having Jurisdiction)
- Created By, Created at, Record ID

**Custom Property Categories:**
- Project Charter (PM Assistant, Priority, etc.)
- Site & System Info (System Size, Battery Size, Mount Type, etc.)
- Financial Information (Contract Price, PPW, etc.)
- Stakeholder Info (Lead Source, Utility Company, etc.)
- Integrations Metadata (QuickBooks, Stripe, etc.)
- Compliance, Accounting-related, Other

---

## Form Structure Pattern

### General Information Section
- **Work Order**: Link to associated work order template
- **Due date**: Optional due date
- **Labels**: Tags for categorization

### Form Fields Section
Organized into **Groups** with descriptive titles:

```
├── Group: [Section Name]
│   ├── Field 1 (type: text/numeric/select/file)
│   ├── Field 2 (type: text/numeric/select/file)
│   └── Field 3 (linked project property)
├── Group: [Section Name]
│   ├── Field 1
│   └── Field 2
└── ...
```

### Editing Interface
- **Edit Field**: Configure field settings (name, required, validation)
- **Mobile Preview**: See how form looks on mobile devices
- **Save/Cancel**: Persist changes

---

## Existing Templates (33+ Templates)

### Solar/Energy Templates (Coperniq Default)
| Template Name | Created By | Purpose |
|---------------|------------|---------|
| Site Survey - Rooftop PV | Coperniq Automation | Site assessment for solar |
| Customer Intake | Coperniq Automation | Initial customer onboarding |
| Permitting Process | Coperniq Automation | Permit application tracking |
| AHJ Permit Application | Coperniq Automation | AHJ permit submission |
| AHJ Inspection | Coperniq Automation | Final inspection checklist |
| PTO/Interconnection | Coperniq Automation | Utility interconnection |
| MPU/Electrical | Coperniq Automation | Main panel upgrade |
| Installation - PV | Coperniq Automation | Solar installation checklist |
| Plansets/RFD | Coperniq Automation | Design documentation |
| Customer Request For Renovation | Coperniq Automation | Change order handling |
| LightReach JCO | Coperniq Automation | JCO processing |

### Custom Templates (Company-Specific)
| Template Name | Created By | Purpose |
|---------------|------------|---------|
| Battery Inspection | Luai Al-akwaa | Battery system inspection |
| Change Order Form | Luai Al-akwaa | Change order documentation |
| Alarm Form | Nicholas Copernicus | Alarm system setup |
| Prewire Form | Levi Natividad | Prewiring checklist |
| Permitting form New Jersey | Levi Natividad | NJ-specific permitting |
| Detach and Reset | Levi Natividad | D&R procedure |
| MPU (copy) | Nicholas Copernicus | MPU variant |
| Button Form | Nicholas Copernicus | Testing template |

---

## Site Survey Example Analysis

### "Site Survey - Rooftop PV (Coperniq)" Structure:

**Group: General Information**
- Work Order: 📷 Tech site audit (post-sale)
- Due date: None
- Labels: None

**Group: (Customer Info)**
- Customer (linked: Title)
- Is this home part of an HOA? (Single select)
- Photo of address from street (File)
- AHJ (linked property)
- Is this a modular or manufactured home? (Single select)
- If home is modular, list manufacturer (Text)
- Address (linked: Site Address)
- Name of HOA (where applicable) (Text)
- Home Manufacturer Serial # (Text)
- Is it a ground mount? How many stories (Single select)
- Is there an existing solar installation? (Single select)

**Group: Electrical**
- Year of manufacture (Numeric)
- Picture of weather head to transformer (File)
- Type of feed (Single select)
- Main Panel drawback pic (File)
- Pic of meter SN (File)
- Clear pic of main breaker, displaying CB value (File)
- Main panel Closed (File)
- Main Panel CB mapping (File)
- Pic of main panel label (if present) (File)
- Main panel feed from ground or feed from roof (Single select)
- Main panel open (File)
- Pic of sub-panel (where present) Open and closed (File)

**Group: Roof**
- Main panel deadfront removed (File)
- Ufer ground or other visible MP grounding (File)
- Main panel drawback (10') (File)
- Roof A/B/C tilt (Numeric x3)
- Picture of Roof plane A/B/C (File x3)
- Roof type (Single select)
- Rafter measurement (width) (Numeric)
- Rafter measurement (spacing) (Numeric)
- Roof material layering (Single select)
- Pics of any visible roof damage (File)
- Sketch of all roof planes (File)

**Group: Existing Solar (if applicable)**
- Make and model of panels (Text)
- Panel quantity (Numeric)
- Make and model of inverters (Text)
- Inverter quantity (Numeric)
- Existing solar CB(S) (Text)
- Pics showing all panels and arrays (File)

**Group: Ground Mount**
- Sketch of proposed install area (File)
- Pitch of proposed location (Numeric)
- Soil type (Single select)
- Are there any observable unpermitted buildings? (Single select)

---

## MEP Template Design Guidelines

Based on discovery, MEP templates should follow this pattern:

### Field Type Selection
| Data Type | Coperniq Field Type |
|-----------|---------------------|
| Equipment names, models, serial numbers | **Text** |
| Measurements, readings, quantities | **Numeric** |
| Pass/Fail, Yes/No, Condition ratings | **Single select** |
| Multiple deficiencies, trades involved | **Multiple select** |
| Photos, documents, signatures | **File** |
| Logical sections | **Group** |

### MEP-Specific Adaptations

**HVAC Templates Should Include:**
- Equipment identification group (make, model, serial)
- System measurements group (pressures, temps, airflow)
- Inspection checklist group (single selects for pass/fail)
- Photo documentation group (file uploads)
- Technician notes group (text fields)
- Compliance/safety group (required signatures)

**Plumbing Templates Should Include:**
- Fixture/equipment info group
- Test results group (pressures, flow rates)
- Compliance group (backflow, cross-connection)
- Photo documentation group

**Electrical Templates Should Include:**
- Panel information group
- Circuit measurements group
- Safety compliance group (NEC references)
- Photo documentation group

**Fire Protection Templates Should Include:**
- System identification group
- Inspection points group (NFPA 25 requirements)
- Deficiency tracking group (multiple select)
- Tag/certification info group

---

## API/Integration Notes

- Forms appear to use GraphQL for data operations
- Templates have unique IDs (e.g., `/form-templates/142945`)
- Work orders can be linked to form templates
- Project properties can be auto-populated from project context

---

## Screenshots

- Full form builder interface: `coperniq-form-builder-discovery.png`
- Location: `.playwright-mcp/` directory

---

## GATE 0 Status: ✅ APPROVED

All discovery criteria met:
- [x] All Process Studio pages mapped
- [x] Field types documented (6 types)
- [x] Existing template structure analyzed
- [x] Project properties integration understood
- [x] Screenshot captured for reference

**Next Step:** Begin GATE 1 - HVAC Template Specs Design
