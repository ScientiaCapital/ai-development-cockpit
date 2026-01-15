/**
 * Chat API Route - Claude Integration with Tool Use
 *
 * Handles chat messages via Anthropic Claude API WITH TOOLS.
 * Claude can query Coperniq work orders, contacts, and assets.
 *
 * NO OpenAI - Uses Anthropic Claude only
 *
 * Model Selection:
 * - claude-opus-4.5 (default) - Best reasoning, agentic tasks
 * - claude-sonnet-4.5 - Fast, efficient for simple tasks
 */

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

// Available Claude models (NO OpenAI)
// Source: https://platform.claude.com/docs/en/about-claude/models/overview
const AVAILABLE_MODELS = {
  // Claude 4.5 Family (Latest)
  'claude-opus-4.5': 'claude-opus-4-5-20251101',     // Premium: $5/$25 per MTok
  'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929', // Best balance: $3/$15 per MTok
  'claude-haiku-4.5': 'claude-haiku-4-5-20251001',   // Fastest: $1/$5 per MTok
  // Legacy aliases for convenience
  'opus': 'claude-opus-4-5-20251101',
  'sonnet': 'claude-sonnet-4-5-20250929',
  'haiku': 'claude-haiku-4-5-20251001',
} as const;

type ModelAlias = keyof typeof AVAILABLE_MODELS;

// Default to Opus 4.5 for superior reasoning
const DEFAULT_MODEL: ModelAlias = 'claude-opus-4.5';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: ModelAlias;
  stream?: boolean;
  sessionId?: string;
  image?: string; // Base64 encoded image for VLM analysis
  trade?: string; // Trade context for image analysis
}

// MEP Domain Expert System Prompt - Full Intelligence Layer
const SYSTEM_PROMPT = `You are an AI assistant for Kipper Energy Solutions, a MEP (Mechanical, Electrical, Plumbing) contractor. You are powered by Claude and have COMPLETE ACCESS to Coperniq - the contractor's operating system.

## YOUR SUPERPOWERS (40+ Tools)

### 📋 Work Orders - Full Control
- get_work_orders: Query all work orders, filter by status/trade
- get_project_work_orders: Work orders for a specific project
- get_client_work_orders: Work orders for a specific client
- get_request_work_orders: Work orders for a service request
- create_work_order: Create new work orders
- update_work_order: Update status, schedule, details
- delete_work_order: Remove work orders
- get_work_order_templates: Get templates for quick creation

### 👥 Clients & Contacts
- get_clients: Search customers (residential/commercial)
- get_client: Get full client details
- create_client: Add new customers
- update_client: Update contact info, address
- delete_client: Remove clients
- get_contacts: Look up contact information

### 🏗️ Projects
- get_projects: List all projects, filter by status
- get_project: Get full project details with all related data
- create_project: Start new projects
- update_project: Modify project details
- delete_project: Archive/remove projects

### 📞 Service Requests
- get_requests: View service calls/tickets
- create_request: Log new service requests
- update_request: Update priority, status
- delete_request: Close/remove requests

### 📦 Catalog Items (Equipment, Parts, Services)
- get_catalog_items: Search inventory - solar panels, inverters, batteries, HVAC units, plumbing parts
- get_catalog_item: Get pricing, specs, availability
- create_catalog_item: Add new products/services
- update_catalog_item: Update pricing, descriptions
- delete_catalog_item: Remove items

### 💰 Invoices & Line Items
- get_invoices: View invoices by client/project
- create_invoice: Generate new invoices
- update_invoice: Modify amounts, status, due dates
- delete_invoice: Cancel invoices
- get_line_items: View line items on invoices/projects
- add_line_item: Add products/services to invoices

### 📝 Forms & Inspections
- get_project_forms: Get inspection checklists, service reports
- update_form: Submit form data, mark complete

### 📁 Files & Documents
- get_project_files: Get attached documents, photos
- get_request_files: Files on service requests
- delete_file: Remove files

### 📞 Call Logging
- get_calls: View call history for projects/clients
- log_call: Record phone interactions

### 👤 Team Management
- get_users: List team members, technicians
- get_teams: View team structure
- get_roles: Get user role definitions

### ⚙️ Configuration
- get_workflows: View workflow templates, project phases
- get_properties: Custom field definitions

## HOW TO USE YOUR POWERS

ALWAYS use tools to get REAL data. Never guess. Never say "I don't have access."

Examples:
- "Show me today's work orders" → get_work_orders
- "What equipment do we have?" → get_catalog_items
- "Find John's contact info" → get_clients or get_contacts
- "Create an invoice for the HVAC repair" → create_invoice
- "What solar panels do we stock?" → get_catalog_items with category filter
- "Update the job to completed" → update_work_order
- "Show me all projects for ABC Company" → get_client then get_project_work_orders

## TRADE EXPERTISE
You support: HVAC, Plumbing, Electrical, Solar, Low Voltage, Fire & Safety, Roofing

## REGULATORY & COMPLIANCE EXPERTISE

You are a compliance expert for MEP contractors. When asked about codes, certifications, or inspections, provide AUTHORITATIVE guidance:

### HVAC Compliance
**EPA Section 608 Certification (Refrigerants)**
- Type I: Small appliances (<5 lbs refrigerant)
- Type II: High/very high pressure (R-410A, R-22, etc.)
- Type III: Low pressure (chillers)
- Universal: All types - RECOMMENDED for field techs
- Certification NEVER expires once obtained
- 2025: R-410A phase-down active - GWP 700+ restricted

**ASHRAE Standards**
- ASHRAE 62.1: Ventilation for Acceptable Indoor Air Quality
- ASHRAE 90.1: Energy Standard for Buildings (code in most jurisdictions)
- ASHRAE 55: Thermal Comfort
- Manual J: Residential load calculations (REQUIRED for proper sizing)
- Manual D: Duct design
- Manual S: Equipment selection

### Electrical Compliance (NEC 2023)
**Arc Fault Protection (NEC 210.12)**
- AFCI required for ALL 120V 15/20A circuits in dwelling units
- Covers: kitchens, bedrooms, living rooms, hallways, closets, laundry
- Replacement receptacles MUST be AFCI protected (NEC 406.4)

**Panel Requirements (NEC 408.4)**
- ALL circuits must be legibly identified
- Arc flash labels required for 1200A+ breakers (NEC 240.87)

**GFCI Locations (NEC 210.8)**
- Bathrooms, kitchens, outdoors, garages, crawl spaces, unfinished basements
- Within 6 feet of sinks

### Plumbing Compliance
**Backflow Prevention (ASSE 5110/5130)**
- Certification: 40-hour initial course + practical exam
- Recertification: 8-hour course every 3 years
- Must test RPZ, DC, PVB, SVPB BY MEMORY
- Annual testing REQUIRED for all backflow assemblies

**Water Heater Standards**
- UL 174: Electric water heaters
- ANSI Z21.10.1: Gas water heaters
- Tempering valves required at 120°F max delivery

### Fire Protection (NFPA 25)
**Inspection Frequencies**
- WEEKLY: Control valves, gauges (dry/pre-action)
- MONTHLY: Alarm valves, pipe pressure
- QUARTERLY: Main drain test, alarms
- ANNUALLY: Full system test (licensed professional)
- EVERY 5 YEARS: High-temp/harsh environment systems
- EVERY 10 YEARS: Dry sprinkler replacement

**NFPA 72: Fire Alarm Systems**
- Visual inspections: WEEKLY
- Testing: ANNUALLY by licensed professional
- Sensitivity testing: EVERY 2 YEARS

### Low Voltage (NEC Article 725)
- Class 2: <30V, <100VA (security, thermostats, LANs)
- Class 3: >30V but <100VA (PA systems, nurse call)
- Article 760: Fire alarm systems
- Article 800: Communications circuits
- Separation from power circuits REQUIRED

### Solar/PV Compliance
**NEC Article 690: Solar PV**
- Rapid shutdown required (NEC 690.12)
- DC arc fault protection for rooftop arrays
- Equipment grounding requirements

**Interconnection**
- IEEE 1547: Interconnection standard
- Utility approval required BEFORE energizing
- Permission to Operate (PTO) documentation

### OSHA Construction (29 CFR 1926)
- PPE inspection: DAILY before use
- Fall protection: Required above 6 feet
- Ladder safety: 3-point contact
- Electrical safety: GFCI or assured grounding program
- Heat illness prevention: Water, rest, shade

## PERSONALITY
Be helpful, concise, and professional. Use industry terminology. You're like having a knowledgeable office manager who knows every customer, every job, and every piece of equipment.`;

// Claude Tool Definitions for Coperniq - ALL ENDPOINTS
const TOOLS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // WORK ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_work_orders',
    description: 'Get work orders from Coperniq. Can filter by status or trade.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'pending', 'scheduled', 'in_progress', 'completed'],
          description: 'Filter by status.',
        },
        trade: {
          type: 'string',
          enum: ['all', 'HVAC', 'Plumbing', 'Electrical', 'Solar', 'Fire Protection', 'Low Voltage', 'Roofing'],
          description: 'Filter by trade.',
        },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'create_work_order',
    description: 'Create a new work order for a project, request, or client.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Work order title' },
        description: { type: 'string', description: 'Work order description' },
        projectId: { type: 'number', description: 'Project ID (optional)' },
        clientId: { type: 'number', description: 'Client ID (optional)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      },
      required: ['title'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_clients',
    description: 'Get clients (customers) from Coperniq. Includes both residential and commercial.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by name or address' },
        clientType: { type: 'string', enum: ['all', 'RESIDENTIAL', 'COMMERCIAL'] },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_client',
    description: 'Get a specific client by ID.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'number', description: 'Client ID' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'create_client',
    description: 'Create a new client in Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Client/company name' },
        clientType: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
        address: { type: 'string', description: 'Client address' },
        primaryEmail: { type: 'string', description: 'Email address' },
        primaryPhone: { type: 'string', description: 'Phone number' },
      },
      required: ['title'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_contacts',
    description: 'Get contacts from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by name or company' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_projects',
    description: 'Get projects from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by title or address' },
        status: { type: 'string', enum: ['all', 'active', 'completed', 'on_hold'] },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'get_project',
    description: 'Get a specific project by ID with full details.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project in Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Project title' },
        description: { type: 'string', description: 'Project description' },
        address: { type: 'string', description: 'Project address' },
        clientId: { type: 'number', description: 'Client ID' },
        workflowId: { type: 'number', description: 'Workflow template ID' },
      },
      required: ['title'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUESTS (Service Calls)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_requests',
    description: 'Get service requests/calls from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'create_request',
    description: 'Create a new service request/call.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Request title' },
        description: { type: 'string', description: 'Description of the issue' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        clientId: { type: 'number', description: 'Client ID' },
      },
      required: ['title'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATALOG ITEMS (Equipment, Parts, Services)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_catalog_items',
    description: 'Get catalog items (equipment, parts, services) from Coperniq. Includes solar panels, inverters, HVAC units, plumbing parts, etc.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by name or category' },
        category: { type: 'string', description: 'Filter by category (PV_MODULE, BATTERY_SYSTEM, HVAC, PLUMBING, etc.)' },
        type: { type: 'string', enum: ['all', 'PRODUCT', 'SERVICE'], description: 'Filter by type' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_catalog_item',
    description: 'Get a specific catalog item by ID with pricing details.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'number', description: 'Catalog item ID' },
      },
      required: ['itemId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_invoices',
    description: 'Get invoices from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'number', description: 'Filter by client ID' },
        projectId: { type: 'number', description: 'Filter by project ID' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'create_invoice',
    description: 'Create a new invoice.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Invoice title' },
        amount: { type: 'number', description: 'Total amount' },
        clientId: { type: 'number', description: 'Client ID' },
        projectId: { type: 'number', description: 'Project ID' },
        dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
      },
      required: ['title', 'amount'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_project_forms',
    description: 'Get forms for a project (inspection checklists, service reports, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
        status: { type: 'string', enum: ['all', 'UNASSIGNED', 'ASSIGNED', 'COMPLETED'], description: 'Filter by status' },
      },
      required: ['projectId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLS (Phone Logs)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_calls',
    description: 'Get call logs for a project, request, or client.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
        clientId: { type: 'number', description: 'Client ID' },
        requestId: { type: 'number', description: 'Request ID' },
      },
    },
  },
  {
    name: 'log_call',
    description: 'Log a phone call in Coperniq.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
        clientId: { type: 'number', description: 'Client ID' },
        note: { type: 'string', description: 'Call notes' },
        outcome: { type: 'string', enum: ['ANSWERED', 'MISSED'], description: 'Call outcome' },
        reason: { type: 'string', description: 'Call reason category' },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS & TEAMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_users',
    description: 'Get users (team members, technicians) from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_teams',
    description: 'Get teams from Coperniq.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOWS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_workflows',
    description: 'Get workflow templates (project phases, statuses).',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE/DELETE - PROJECTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_project',
    description: 'Update an existing project.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        status: { type: 'string', description: 'New status' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'delete_project',
    description: 'Delete a project.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID to delete' },
      },
      required: ['projectId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE/DELETE - REQUESTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_request',
    description: 'Update an existing service request.',
    input_schema: {
      type: 'object',
      properties: {
        requestId: { type: 'number', description: 'Request ID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        status: { type: 'string', description: 'New status' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'delete_request',
    description: 'Delete a service request.',
    input_schema: {
      type: 'object',
      properties: {
        requestId: { type: 'number', description: 'Request ID to delete' },
      },
      required: ['requestId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE/DELETE - WORK ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_work_order',
    description: 'Update an existing work order.',
    input_schema: {
      type: 'object',
      properties: {
        workOrderId: { type: 'number', description: 'Work order ID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        status: { type: 'string', description: 'New status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        scheduledDate: { type: 'string', description: 'Scheduled date (ISO 8601)' },
      },
      required: ['workOrderId'],
    },
  },
  {
    name: 'delete_work_order',
    description: 'Delete a work order.',
    input_schema: {
      type: 'object',
      properties: {
        workOrderId: { type: 'number', description: 'Work order ID to delete' },
      },
      required: ['workOrderId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE/DELETE - CLIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_client',
    description: 'Update an existing client.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'number', description: 'Client ID' },
        title: { type: 'string', description: 'New name/title' },
        primaryEmail: { type: 'string', description: 'New email' },
        primaryPhone: { type: 'string', description: 'New phone' },
        address: { type: 'string', description: 'New address' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'delete_client',
    description: 'Delete a client.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'number', description: 'Client ID to delete' },
      },
      required: ['clientId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL CRUD - CATALOG ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_catalog_item',
    description: 'Create a new catalog item (equipment, part, or service).',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Item name' },
        description: { type: 'string', description: 'Item description' },
        type: { type: 'string', enum: ['PRODUCT', 'SERVICE'], description: 'Item type' },
        category: { type: 'string', description: 'Category (PV_MODULE, BATTERY_SYSTEM, HVAC, etc.)' },
        price: { type: 'number', description: 'Unit price' },
        cost: { type: 'number', description: 'Unit cost' },
        sku: { type: 'string', description: 'SKU/Part number' },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'update_catalog_item',
    description: 'Update an existing catalog item.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'number', description: 'Catalog item ID' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
        price: { type: 'number', description: 'New price' },
        cost: { type: 'number', description: 'New cost' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'delete_catalog_item',
    description: 'Delete a catalog item.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'number', description: 'Catalog item ID to delete' },
      },
      required: ['itemId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE/DELETE - INVOICES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_invoice',
    description: 'Update an existing invoice.',
    input_schema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'number', description: 'Invoice ID' },
        title: { type: 'string', description: 'New title' },
        amount: { type: 'number', description: 'New amount' },
        status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
        dueDate: { type: 'string', description: 'New due date (ISO 8601)' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'delete_invoice',
    description: 'Delete an invoice.',
    input_schema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'number', description: 'Invoice ID to delete' },
      },
      required: ['invoiceId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILES API - Upload, Download, Delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_project_files',
    description: 'Get files attached to a project.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_request_files',
    description: 'Get files attached to a service request.',
    input_schema: {
      type: 'object',
      properties: {
        requestId: { type: 'number', description: 'Request ID' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from a project or request.',
    input_schema: {
      type: 'object',
      properties: {
        fileId: { type: 'number', description: 'File ID to delete' },
        projectId: { type: 'number', description: 'Project ID (if project file)' },
        requestId: { type: 'number', description: 'Request ID (if request file)' },
      },
      required: ['fileId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LINE ITEMS API
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_line_items',
    description: 'Get line items for a project, request, or invoice.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
        requestId: { type: 'number', description: 'Request ID' },
        invoiceId: { type: 'number', description: 'Invoice ID' },
      },
    },
  },
  {
    name: 'add_line_item',
    description: 'Add a line item to a project, request, or invoice.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
        requestId: { type: 'number', description: 'Request ID' },
        invoiceId: { type: 'number', description: 'Invoice ID' },
        catalogItemId: { type: 'number', description: 'Catalog item ID' },
        description: { type: 'string', description: 'Line item description' },
        quantity: { type: 'number', description: 'Quantity' },
        unitPrice: { type: 'number', description: 'Unit price' },
      },
      required: ['catalogItemId', 'quantity'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPERTIES API (Custom Fields)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_properties',
    description: 'Get custom property definitions.',
    input_schema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['PROJECT', 'REQUEST', 'CLIENT'], description: 'Entity type' },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORK ORDER TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_work_order_templates',
    description: 'Get work order templates for creating new work orders.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE FORMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_form',
    description: 'Update form data (inspection checklist, service report, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        formId: { type: 'number', description: 'Form ID' },
        data: { type: 'object', description: 'Form field values' },
        status: { type: 'string', enum: ['UNASSIGNED', 'ASSIGNED', 'COMPLETED'] },
      },
      required: ['formId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ROLES API
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_roles',
    description: 'Get user roles defined in Coperniq.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT WORK ORDERS (by project)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_project_work_orders',
    description: 'Get work orders for a specific project.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT WORK ORDERS (by client)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_client_work_orders',
    description: 'Get work orders for a specific client.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'number', description: 'Client ID' },
      },
      required: ['clientId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST WORK ORDERS (by request)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_request_work_orders',
    description: 'Get work orders for a specific service request.',
    input_schema: {
      type: 'object',
      properties: {
        requestId: { type: 'number', description: 'Request ID' },
      },
      required: ['requestId'],
    },
  },
];

// Helper: Make Coperniq API request
async function coperniqFetch(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<unknown> {
  const response = await fetch(`${COPERNIQ_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Coperniq API error: ${response.status}`);
  }
  return response.json();
}

// Execute tools against Coperniq API
async function executeTool(toolName: string, toolInput: Record<string, unknown>, apiKey: string): Promise<string> {
  try {
    switch (toolName) {
      // ═══════════════════════════════════════════════════════════════════════
      // WORK ORDERS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_work_orders': {
        const workOrders = await coperniqFetch('/work-orders', apiKey) as Array<Record<string, unknown>>;
        let results = Array.isArray(workOrders) ? workOrders : [];

        const { status, trade, limit = 10 } = toolInput;
        if (status && status !== 'all') {
          results = results.filter((wo) => String(wo.status || '').toLowerCase().includes(String(status).toLowerCase()));
        }
        if (trade && trade !== 'all') {
          const tradeStr = String(trade).toLowerCase();
          results = results.filter((wo) => String(wo.title || '').toLowerCase().includes(tradeStr));
        }

        return JSON.stringify({
          total: results.length,
          showing: Math.min(results.length, Number(limit)),
          work_orders: results.slice(0, Number(limit)),
        });
      }

      case 'create_work_order': {
        const { projectId, clientId, ...body } = toolInput;
        let endpoint = '/work-orders';
        if (projectId) endpoint = `/projects/${projectId}/work-orders`;
        else if (clientId) endpoint = `/clients/${clientId}/work-orders`;

        const result = await coperniqFetch(endpoint, apiKey, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return JSON.stringify({ success: true, work_order: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // CLIENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_clients': {
        const params = new URLSearchParams();
        if (toolInput.search) params.append('q', String(toolInput.search));
        if (toolInput.clientType && toolInput.clientType !== 'all') {
          // Filter after fetch since API may not support this param
        }
        const url = '/clients' + (params.toString() ? `?${params}` : '');
        const clients = await coperniqFetch(url, apiKey) as Array<Record<string, unknown>>;
        let results = Array.isArray(clients) ? clients : [];

        const { clientType, limit = 20 } = toolInput;
        if (clientType && clientType !== 'all') {
          results = results.filter((c) => c.clientType === clientType);
        }

        return JSON.stringify({
          total: results.length,
          showing: Math.min(results.length, Number(limit)),
          clients: results.slice(0, Number(limit)),
        });
      }

      case 'get_client': {
        const client = await coperniqFetch(`/clients/${toolInput.clientId}`, apiKey);
        return JSON.stringify({ client });
      }

      case 'create_client': {
        const result = await coperniqFetch('/clients', apiKey, {
          method: 'POST',
          body: JSON.stringify(toolInput),
        });
        return JSON.stringify({ success: true, client: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // CONTACTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_contacts': {
        const contacts = await coperniqFetch('/contacts', apiKey) as Array<Record<string, unknown>>;
        let results = Array.isArray(contacts) ? contacts : [];

        const { search, limit = 10 } = toolInput;
        if (search) {
          const searchLower = String(search).toLowerCase();
          results = results.filter((c) =>
            String(c.name || '').toLowerCase().includes(searchLower) ||
            String(c.companyName || '').toLowerCase().includes(searchLower)
          );
        }

        return JSON.stringify({
          total: results.length,
          showing: Math.min(results.length, Number(limit)),
          contacts: results.slice(0, Number(limit)),
        });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // PROJECTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_projects': {
        const params = new URLSearchParams();
        if (toolInput.search) params.append('q', String(toolInput.search));
        const url = '/projects' + (params.toString() ? `?${params}` : '');
        const projects = await coperniqFetch(url, apiKey) as Array<Record<string, unknown>>;
        let results = Array.isArray(projects) ? projects : [];

        const { status, limit = 10 } = toolInput;
        if (status && status !== 'all') {
          results = results.filter((p) => String(p.status || '').toLowerCase().includes(String(status).toLowerCase()));
        }

        return JSON.stringify({
          total: results.length,
          showing: Math.min(results.length, Number(limit)),
          projects: results.slice(0, Number(limit)),
        });
      }

      case 'get_project': {
        const project = await coperniqFetch(`/projects/${toolInput.projectId}`, apiKey);
        return JSON.stringify({ project });
      }

      case 'create_project': {
        const result = await coperniqFetch('/projects', apiKey, {
          method: 'POST',
          body: JSON.stringify(toolInput),
        });
        return JSON.stringify({ success: true, project: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // REQUESTS (Service Calls)
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_requests': {
        const requests = await coperniqFetch('/requests', apiKey) as Array<Record<string, unknown>>;
        let results = Array.isArray(requests) ? requests : [];

        const { search, limit = 10 } = toolInput;
        if (search) {
          const searchLower = String(search).toLowerCase();
          results = results.filter((r) => String(r.title || '').toLowerCase().includes(searchLower));
        }

        return JSON.stringify({
          total: results.length,
          showing: Math.min(results.length, Number(limit)),
          requests: results.slice(0, Number(limit)),
        });
      }

      case 'create_request': {
        const result = await coperniqFetch('/requests', apiKey, {
          method: 'POST',
          body: JSON.stringify(toolInput),
        });
        return JSON.stringify({ success: true, request: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // CATALOG ITEMS (Equipment, Parts, Services)
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_catalog_items': {
        const params = new URLSearchParams();
        if (toolInput.search) params.append('q', String(toolInput.search));
        const url = '/catalog-items' + (params.toString() ? `?${params}` : '');
        const items = await coperniqFetch(url, apiKey) as Array<Record<string, unknown>>;
        let results = Array.isArray(items) ? items : [];

        const { category, type, limit = 20 } = toolInput;
        if (category) {
          const categoryLower = String(category).toLowerCase();
          results = results.filter((item) => String(item.category || '').toLowerCase().includes(categoryLower));
        }
        if (type && type !== 'all') {
          results = results.filter((item) => item.type === type);
        }

        return JSON.stringify({
          total: results.length,
          showing: Math.min(results.length, Number(limit)),
          catalog_items: results.slice(0, Number(limit)),
        });
      }

      case 'get_catalog_item': {
        const item = await coperniqFetch(`/catalog-items/${toolInput.itemId}`, apiKey);
        return JSON.stringify({ catalog_item: item });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // INVOICES
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_invoices': {
        let url = '/invoices';
        if (toolInput.projectId) url = `/projects/${toolInput.projectId}/invoices`;
        else if (toolInput.clientId) url = `/clients/${toolInput.clientId}/invoices`;

        const invoices = await coperniqFetch(url, apiKey) as Array<Record<string, unknown>>;
        const limit = Number(toolInput.limit) || 10;

        return JSON.stringify({
          total: invoices.length,
          showing: Math.min(invoices.length, limit),
          invoices: invoices.slice(0, limit),
        });
      }

      case 'create_invoice': {
        const result = await coperniqFetch('/invoices', apiKey, {
          method: 'POST',
          body: JSON.stringify(toolInput),
        });
        return JSON.stringify({ success: true, invoice: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FORMS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_project_forms': {
        const params = new URLSearchParams();
        if (toolInput.status && toolInput.status !== 'all') params.append('status', String(toolInput.status));
        const url = `/projects/${toolInput.projectId}/forms` + (params.toString() ? `?${params}` : '');
        const forms = await coperniqFetch(url, apiKey);
        return JSON.stringify({ forms });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // CALLS (Phone Logs)
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_calls': {
        let url = '/calls';
        if (toolInput.projectId) url = `/projects/${toolInput.projectId}/calls`;
        else if (toolInput.clientId) url = `/clients/${toolInput.clientId}/calls`;
        else if (toolInput.requestId) url = `/requests/${toolInput.requestId}/calls`;

        try {
          const calls = await coperniqFetch(url, apiKey);
          return JSON.stringify({ calls });
        } catch {
          return JSON.stringify({ calls: [], message: 'No calls found or endpoint not available' });
        }
      }

      case 'log_call': {
        let url = '/calls';
        if (toolInput.projectId) url = `/projects/${toolInput.projectId}/calls`;
        else if (toolInput.clientId) url = `/clients/${toolInput.clientId}/calls`;

        const result = await coperniqFetch(url, apiKey, {
          method: 'POST',
          body: JSON.stringify(toolInput),
        });
        return JSON.stringify({ success: true, call: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // USERS & TEAMS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_users': {
        const users = await coperniqFetch('/users', apiKey);
        return JSON.stringify({ users });
      }

      case 'get_teams': {
        const teams = await coperniqFetch('/users/teams', apiKey);
        return JSON.stringify({ teams });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // WORKFLOWS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_workflows': {
        const workflows = await coperniqFetch('/workflows', apiKey);
        return JSON.stringify({ workflows });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // UPDATE/DELETE - PROJECTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_project': {
        const { projectId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/projects/${projectId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, project: result });
      }

      case 'delete_project': {
        await coperniqFetch(`/projects/${toolInput.projectId}`, apiKey, {
          method: 'DELETE',
        });
        return JSON.stringify({ success: true, message: 'Project deleted' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // UPDATE/DELETE - REQUESTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_request': {
        const { requestId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/requests/${requestId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, request: result });
      }

      case 'delete_request': {
        await coperniqFetch(`/requests/${toolInput.requestId}`, apiKey, {
          method: 'DELETE',
        });
        return JSON.stringify({ success: true, message: 'Request deleted' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // UPDATE/DELETE - WORK ORDERS
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_work_order': {
        const { workOrderId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/work-orders/${workOrderId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, work_order: result });
      }

      case 'delete_work_order': {
        await coperniqFetch(`/work-orders/${toolInput.workOrderId}`, apiKey, {
          method: 'DELETE',
        });
        return JSON.stringify({ success: true, message: 'Work order deleted' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // UPDATE/DELETE - CLIENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_client': {
        const { clientId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/clients/${clientId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, client: result });
      }

      case 'delete_client': {
        await coperniqFetch(`/clients/${toolInput.clientId}`, apiKey, {
          method: 'DELETE',
        });
        return JSON.stringify({ success: true, message: 'Client deleted' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FULL CRUD - CATALOG ITEMS
      // ═══════════════════════════════════════════════════════════════════════
      case 'create_catalog_item': {
        const result = await coperniqFetch('/catalog-items', apiKey, {
          method: 'POST',
          body: JSON.stringify(toolInput),
        });
        return JSON.stringify({ success: true, catalog_item: result });
      }

      case 'update_catalog_item': {
        const { itemId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/catalog-items/${itemId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, catalog_item: result });
      }

      case 'delete_catalog_item': {
        await coperniqFetch(`/catalog-items/${toolInput.itemId}`, apiKey, {
          method: 'DELETE',
        });
        return JSON.stringify({ success: true, message: 'Catalog item deleted' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // UPDATE/DELETE - INVOICES
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_invoice': {
        const { invoiceId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/invoices/${invoiceId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, invoice: result });
      }

      case 'delete_invoice': {
        await coperniqFetch(`/invoices/${toolInput.invoiceId}`, apiKey, {
          method: 'DELETE',
        });
        return JSON.stringify({ success: true, message: 'Invoice deleted' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FILES API
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_project_files': {
        const files = await coperniqFetch(`/projects/${toolInput.projectId}/files`, apiKey);
        return JSON.stringify({ files });
      }

      case 'get_request_files': {
        const files = await coperniqFetch(`/requests/${toolInput.requestId}/files`, apiKey);
        return JSON.stringify({ files });
      }

      case 'delete_file': {
        let url = `/files/${toolInput.fileId}`;
        if (toolInput.projectId) url = `/projects/${toolInput.projectId}/files/${toolInput.fileId}`;
        else if (toolInput.requestId) url = `/requests/${toolInput.requestId}/files/${toolInput.fileId}`;

        await coperniqFetch(url, apiKey, { method: 'DELETE' });
        return JSON.stringify({ success: true, message: 'File deleted' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // LINE ITEMS API
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_line_items': {
        let url = '/line-items';
        if (toolInput.projectId) url = `/projects/${toolInput.projectId}/line-items`;
        else if (toolInput.requestId) url = `/requests/${toolInput.requestId}/line-items`;
        else if (toolInput.invoiceId) url = `/invoices/${toolInput.invoiceId}/line-items`;

        const lineItems = await coperniqFetch(url, apiKey);
        return JSON.stringify({ line_items: lineItems });
      }

      case 'add_line_item': {
        let url = '/line-items';
        if (toolInput.projectId) url = `/projects/${toolInput.projectId}/line-items`;
        else if (toolInput.requestId) url = `/requests/${toolInput.requestId}/line-items`;
        else if (toolInput.invoiceId) url = `/invoices/${toolInput.invoiceId}/line-items`;

        const { projectId, requestId, invoiceId, ...lineItemData } = toolInput;
        const result = await coperniqFetch(url, apiKey, {
          method: 'POST',
          body: JSON.stringify(lineItemData),
        });
        return JSON.stringify({ success: true, line_item: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // PROPERTIES API
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_properties': {
        const params = new URLSearchParams();
        if (toolInput.entityType) params.append('entityType', String(toolInput.entityType));
        const url = '/properties' + (params.toString() ? `?${params}` : '');
        const properties = await coperniqFetch(url, apiKey);
        return JSON.stringify({ properties });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // WORK ORDER TEMPLATES
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_work_order_templates': {
        const templates = await coperniqFetch('/work-orders/templates', apiKey);
        return JSON.stringify({ templates });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // UPDATE FORMS
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_form': {
        const { formId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/forms/${formId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, form: result });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ROLES API
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_roles': {
        const roles = await coperniqFetch('/users/roles', apiKey);
        return JSON.stringify({ roles });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // WORK ORDERS BY ENTITY
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_project_work_orders': {
        const workOrders = await coperniqFetch(`/projects/${toolInput.projectId}/work-orders`, apiKey);
        return JSON.stringify({ work_orders: workOrders });
      }

      case 'get_client_work_orders': {
        const workOrders = await coperniqFetch(`/clients/${toolInput.clientId}/work-orders`, apiKey);
        return JSON.stringify({ work_orders: workOrders });
      }

      case 'get_request_work_orders': {
        const workOrders = await coperniqFetch(`/requests/${toolInput.requestId}/work-orders`, apiKey);
        return JSON.stringify({ work_orders: workOrders });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`Tool ${toolName} error:`, error);
    return JSON.stringify({ error: `Failed to execute ${toolName}`, details: String(error) });
  }
}

export async function POST(request: NextRequest) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const coperniqApiKey = process.env.COPERNIQ_API_KEY;

  if (!anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const { messages, model: modelAlias = DEFAULT_MODEL, image, trade } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Resolve model alias to full model ID
    const modelId = AVAILABLE_MODELS[modelAlias] || AVAILABLE_MODELS[DEFAULT_MODEL];

    console.log(`Chat request using model: ${modelAlias} -> ${modelId}${image ? ' (with image)' : ''}`);

    // Build conversation with any existing messages
    let conversationMessages: Array<{ role: string; content: unknown }> = messages.map((msg, index) => {
      // If this is the last user message and we have an image, include it
      if (index === messages.length - 1 && msg.role === 'user' && image) {
        // Extract media type from base64 string
        const mediaTypeMatch = image.match(/^data:(image\/[^;]+);base64,/);
        const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
        const base64Data = image.replace(/^data:image\/[^;]+;base64,/, '');

        // Build multi-content message with image + text for Claude Vision
        return {
          role: msg.role,
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: trade
                ? `[Trade: ${trade.toUpperCase()}]\n\n${msg.content}\n\nPlease analyze this ${trade} equipment/photo and extract all relevant information. Include: manufacturer, model, serial number, specifications, condition, and any recommendations.`
                : msg.content,
            },
          ],
        };
      }

      return {
        role: msg.role,
        content: msg.content,
      };
    });

    // Agentic loop: Keep calling Claude until we get a final text response
    let finalResponse = '';
    let loopCount = 0;
    const MAX_LOOPS = 5;

    while (loopCount < MAX_LOOPS) {
      loopCount++;

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: coperniqApiKey ? TOOLS : [], // Only include tools if Coperniq is configured
          messages: conversationMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();

      // Check stop_reason to determine next action
      if (data.stop_reason === 'end_turn') {
        // Claude finished - extract text
        const textBlock = data.content?.find((block: { type: string }) => block.type === 'text');
        finalResponse = textBlock?.text || 'I apologize, but I could not generate a response.';
        break;
      }

      if (data.stop_reason === 'tool_use') {
        // Claude wants to use a tool - execute it and continue
        const toolUseBlocks = data.content?.filter((block: { type: string }) => block.type === 'tool_use') || [];

        if (toolUseBlocks.length === 0) {
          // No tool blocks found, extract any text
          const textBlock = data.content?.find((block: { type: string }) => block.type === 'text');
          finalResponse = textBlock?.text || 'I apologize, but I could not generate a response.';
          break;
        }

        // Add assistant's response to conversation
        conversationMessages.push({
          role: 'assistant',
          content: data.content,
        });

        // Execute each tool and collect results
        const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];

        for (const toolBlock of toolUseBlocks) {
          console.log(`Executing tool: ${toolBlock.name}`, toolBlock.input);

          const result = await executeTool(
            toolBlock.name,
            toolBlock.input || {},
            coperniqApiKey || ''
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result,
          });
        }

        // Add tool results to conversation
        conversationMessages.push({
          role: 'user',
          content: toolResults,
        });

        console.log(`Tool loop ${loopCount}: Executed ${toolResults.length} tools, continuing...`);
      } else {
        // Unknown stop_reason or max_tokens - extract what we have
        const textBlock = data.content?.find((block: { type: string }) => block.type === 'text');
        finalResponse = textBlock?.text || 'I apologize, but I ran into a limit processing your request.';
        break;
      }
    }

    if (loopCount >= MAX_LOOPS && !finalResponse) {
      finalResponse = 'I apologize, but I reached the maximum number of operations. Please try a simpler request.';
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: finalResponse,
      },
      toolsUsed: loopCount > 1,
      model: modelId,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your message. Please try again.',
        }
      },
      { status: 500 }
    );
  }
}

// Health check endpoint with model info
export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    status: hasApiKey ? 'healthy' : 'missing_api_key',
    provider: 'anthropic',
    defaultModel: AVAILABLE_MODELS[DEFAULT_MODEL],
    availableModels: Object.keys(AVAILABLE_MODELS).filter(k => !['opus', 'sonnet'].includes(k)),
    modelAliases: AVAILABLE_MODELS,
  });
}
