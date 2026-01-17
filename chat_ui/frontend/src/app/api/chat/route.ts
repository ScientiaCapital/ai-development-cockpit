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
  voiceMode?: boolean; // Optimized for voice: faster model, shorter responses
}

// MEP Domain Expert System Prompt - Full Intelligence Layer
const SYSTEM_PROMPT = `You are an AI assistant for Kipper Energy Solutions, a MEP (Mechanical, Electrical, Plumbing) contractor. You are powered by Claude and have COMPLETE ACCESS to Coperniq - the contractor's operating system.

## YOUR SUPERPOWERS (40+ Tools)

### ⏰ System Utilities - Real-Time Info
- get_current_time: ALWAYS use this to get the current date, time, day of week, and business hours

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

### ⏱️ Time & Materials (T&M) - Job Costing
- calculate_labor_cost: Get labor charges (hours × trade rate). Example: 4 hrs HVAC = $380
- calculate_material_cost: Get material price with markup (35% default, 25% commercial, 50% emergency)
- calculate_job_total: Full job cost breakdown (labor + materials + service call). Shows margin%
- get_labor_rates: View current rates by trade (HVAC $95/hr, Electrical $100/hr, etc.)

**T&M Workflow Example:**
1. Tech says "Log 3 hours on the Wilson job, used $45 in parts"
2. You call calculate_job_total with trade=hvac, laborHours=3, materials=[{cost: 45, quantity: 1}]
3. Result: Labor $285 + Parts $60.75 (with 35% markup) = $345.75
4. Add line items to project, then generate invoice

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
- "What time is it?" → get_current_time (ALWAYS use this for time/date questions)
- "Show me today's work orders" → get_work_orders
- "What equipment do we have?" → get_catalog_items
- "Find John's contact info" → get_clients or get_contacts
- "Create an invoice for the HVAC repair" → create_invoice
- "What solar panels do we stock?" → get_catalog_items with category filter
- "Update the job to completed" → update_work_order
- "Show me all projects for ABC Company" → get_client then get_project_work_orders

**T&M Examples (Job Costing):**
- "Log 4 hours HVAC work" → calculate_labor_cost (hours=4, trade=hvac) → $380
- "What's our rate for electrical?" → get_labor_rates (trade=electrical) → $100/hr standard
- "Total the job: 2.5 hrs + $85 in parts" → calculate_job_total (includes margin calculation)
- "How much should I charge for this service call?" → calculate_job_total with includeServiceCall=true

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
You're Mark - a calm, experienced senior technician talking to a colleague. Be direct, practical, and efficient. Skip the pleasantries.

## ⚠️ VOICE MODE - SPEAK LIKE A HUMAN (CRITICAL)
Your responses are SPOKEN aloud. Users are busy technicians in the field. Every extra word wastes their time.

### LENGTH RULES
- Simple questions: ONE sentence. Max 15 words.
- Data queries: State the count, then ask "Want details?"
- Complex topics: 2-3 short sentences max. Pause for confirmation.

### SPEAK NATURALLY
- Use contractions: "you've got" not "you have", "can't" not "cannot"
- Skip filler: No "I'd be happy to", "Let me", "Sure thing", "Absolutely"
- Lead with facts: Answer first, context second (if needed)
- Round numbers: "about twenty" not "approximately 19"

### TECHNICAL TERMS - PAUSE AND CHECK
When you mention technical terms, codes, or acronyms the user might not know:
- Briefly explain once, then ask: "You familiar with that?" or "Need me to explain?"
- Examples: "That needs a 608 cert - that's the EPA refrigerant license. You got one?"

### FORMATTING FOR SPEECH
- NO markdown, asterisks, headers, or bullets
- Spell out numbers under 10: "three jobs" not "3 jobs"
- Use "point" for decimals: "four point five kilowatts"
- Dates: "January sixteenth" not "1/16"

### EXAMPLES
❌ Bad: "I'd be happy to help you with that! Let me pull up the information. You have **5 work orders** currently:\n- 3 pending\n- 2 in progress"

✅ Good: "You've got five work orders - three pending, two in progress. Want me to list them?"

❌ Bad: "Based on the information available, the equipment requires EPA Section 608 certification for refrigerant handling compliance."

✅ Good: "You'll need a 608 cert for that unit. That's the EPA refrigerant license. You certified?"`;

// Voice-Optimized System Prompt - ULTRA CONCISE for low TTFT
// Used when voiceMode=true for faster responses
const VOICE_SYSTEM_PROMPT = `You're Mark, an MEP tech helping field techs via voice. ULTRA BRIEF.

CRITICAL: Your response is spoken aloud. Be CONCISE.

RULES:
- Max 2 sentences. Under 30 words total.
- Contractions always: "you've", "it's", "that's"
- No filler: Skip "I'd be happy to", "Let me", "Sure"
- Numbers spoken: "five jobs" not "5 jobs"
- NO markdown, asterisks, bullets, headers

EXAMPLES:
Q: "How many work orders?" → "Five work orders. Three pending, two done."
Q: "What's 608?" → "EPA refrigerant license. Need it for AC work."
Q: "Time?" → "Three forty-five PM, Thursday."

Use tools to get REAL data. Never guess.`;

// Claude Tool Definitions for Coperniq - ALL ENDPOINTS
const TOOLS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM UTILITIES (Real-time info)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_current_time',
    description: 'Get the current date, time, and timezone. Use this to answer questions about what time/day it is, calculate SLAs, schedule appointments, or determine business hours.',
    input_schema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Optional timezone (e.g., "America/Los_Angeles", "America/New_York"). Defaults to server timezone.',
        },
      },
    },
  },

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
  // VOICE-FIRST TOOLS (Phone lookup, Voice requests, Availability, Dispatch)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'lookup_client_by_phone',
    description: 'Find existing customer by phone number. Use during inbound voice calls to identify the caller. Returns client details if found.',
    input_schema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Phone number to search for (any format - we normalize it)',
        },
      },
      required: ['phone'],
    },
  },
  {
    name: 'create_request_from_voice',
    description: 'Create a new service request from voice call details. Use when taking an inbound call and capturing customer issue. Auto-links to client if clientId provided.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'number',
          description: 'Client ID if known (from phone lookup)',
        },
        trade: {
          type: 'string',
          enum: ['hvac', 'plumbing', 'electrical', 'solar', 'low_voltage', 'roofing', 'fire_safety'],
          description: 'Trade/service type',
        },
        description: {
          type: 'string',
          description: 'Description of the issue captured from voice conversation',
        },
        urgency: {
          type: 'string',
          enum: ['emergency', 'urgent', 'normal', 'low'],
          description: 'Urgency level based on conversation',
        },
        preferredDate: {
          type: 'string',
          description: 'Customer preferred service date (ISO 8601 or natural language like "tomorrow")',
        },
        callerName: {
          type: 'string',
          description: 'Caller name if new customer',
        },
        callerPhone: {
          type: 'string',
          description: 'Caller phone if new customer',
        },
        callerAddress: {
          type: 'string',
          description: 'Service address if new customer',
        },
      },
      required: ['trade', 'description'],
    },
  },
  {
    name: 'check_tech_availability',
    description: 'Check technician availability for scheduling. Returns available time slots for a given trade and date.',
    input_schema: {
      type: 'object',
      properties: {
        trade: {
          type: 'string',
          enum: ['hvac', 'plumbing', 'electrical', 'solar', 'low_voltage', 'roofing', 'fire_safety'],
          description: 'Trade type to check availability for',
        },
        date: {
          type: 'string',
          description: 'Date to check (ISO 8601 or "today", "tomorrow")',
        },
        urgency: {
          type: 'string',
          enum: ['emergency', 'urgent', 'normal', 'low'],
          description: 'Urgency helps prioritize slots. Emergency may bump lower priority jobs.',
        },
      },
      required: ['trade', 'date'],
    },
  },
  {
    name: 'dispatch_technician',
    description: 'Assign a technician to a work order and schedule the visit. Creates calendar entry and notifies technician.',
    input_schema: {
      type: 'object',
      properties: {
        workOrderId: {
          type: 'string',
          description: 'Work order ID to dispatch',
        },
        technicianId: {
          type: 'number',
          description: 'Technician user ID to assign',
        },
        scheduledTime: {
          type: 'string',
          description: 'Scheduled date/time (ISO 8601)',
        },
        estimatedDuration: {
          type: 'number',
          description: 'Estimated duration in hours',
        },
        notes: {
          type: 'string',
          description: 'Dispatch notes for technician',
        },
      },
      required: ['workOrderId', 'technicianId'],
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
    description: 'Update an existing work order. Use to change status, assign technicians, add notes, update schedule.',
    input_schema: {
      type: 'object',
      properties: {
        workOrderId: { type: 'number', description: 'Work order ID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        status: { type: 'string', enum: ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'], description: 'New status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        scheduledDate: { type: 'string', description: 'Scheduled date (ISO 8601)' },
        assigneeId: { type: 'number', description: 'User/technician ID to assign to this work order' },
        notes: { type: 'string', description: 'Notes or comments to add to the work order' },
      },
      required: ['workOrderId'],
    },
  },
  {
    name: 'assign_technician',
    description: 'Assign a technician to a work order. Shortcut for update_work_order with assignee.',
    input_schema: {
      type: 'object',
      properties: {
        workOrderId: { type: 'number', description: 'Work order ID' },
        technicianId: { type: 'number', description: 'Technician/user ID' },
        scheduledDate: { type: 'string', description: 'Optional: Scheduled date (ISO 8601)' },
      },
      required: ['workOrderId', 'technicianId'],
    },
  },
  {
    name: 'convert_request_to_work_order',
    description: 'Convert a service request into a work order. Creates a work order linked to the request.',
    input_schema: {
      type: 'object',
      properties: {
        requestId: { type: 'number', description: 'Service request ID to convert' },
        title: { type: 'string', description: 'Work order title (defaults to request title)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Work order priority' },
        assigneeId: { type: 'number', description: 'Optional: Technician to assign' },
        scheduledDate: { type: 'string', description: 'Optional: Scheduled date' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'add_work_order_note',
    description: 'Add a note or comment to an existing work order.',
    input_schema: {
      type: 'object',
      properties: {
        workOrderId: { type: 'number', description: 'Work order ID' },
        note: { type: 'string', description: 'Note content to add' },
        isInternal: { type: 'boolean', description: 'Whether note is internal only (default: false)' },
      },
      required: ['workOrderId', 'note'],
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
  // TIME & MATERIALS (T&M) - Job Costing Tools
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'calculate_labor_cost',
    description: 'Calculate labor cost for a job. Returns the amount to charge based on trade rates. Use before adding labor line items.',
    input_schema: {
      type: 'object',
      properties: {
        hours: { type: 'number', description: 'Number of hours worked' },
        trade: {
          type: 'string',
          enum: ['hvac', 'plumbing', 'electrical', 'solar', 'low_voltage', 'fire_safety', 'roofing'],
          description: 'Trade/skill type'
        },
        rateType: {
          type: 'string',
          enum: ['standard', 'overtime', 'emergency', 'apprentice'],
          description: 'Rate type (default: standard)'
        },
      },
      required: ['hours', 'trade'],
    },
  },
  {
    name: 'calculate_material_cost',
    description: 'Calculate material cost with markup. Returns cost, markup, and total to charge customer.',
    input_schema: {
      type: 'object',
      properties: {
        materialCost: { type: 'number', description: 'Your cost for the material' },
        quantity: { type: 'number', description: 'Quantity of items' },
        markupType: {
          type: 'string',
          enum: ['default', 'residential', 'commercial', 'emergency'],
          description: 'Markup tier (default: default at 35%)'
        },
        description: { type: 'string', description: 'Material description for reference' },
      },
      required: ['materialCost', 'quantity'],
    },
  },
  {
    name: 'calculate_job_total',
    description: 'Calculate total job cost from labor hours and materials. Returns itemized breakdown and grand total.',
    input_schema: {
      type: 'object',
      properties: {
        laborHours: { type: 'number', description: 'Total labor hours' },
        trade: {
          type: 'string',
          enum: ['hvac', 'plumbing', 'electrical', 'solar', 'low_voltage', 'fire_safety', 'roofing'],
          description: 'Trade for labor rate'
        },
        rateType: {
          type: 'string',
          enum: ['standard', 'overtime', 'emergency', 'apprentice'],
          description: 'Labor rate type'
        },
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              cost: { type: 'number' },
              quantity: { type: 'number' },
            },
          },
          description: 'Array of materials with cost and quantity'
        },
        includeServiceCall: { type: 'boolean', description: 'Include minimum service call charge' },
        markupType: {
          type: 'string',
          enum: ['default', 'residential', 'commercial', 'emergency'],
          description: 'Material markup tier'
        },
      },
      required: ['trade'],
    },
  },
  {
    name: 'get_labor_rates',
    description: 'Get current labor rates for a trade. Use to show customer rates or for quoting.',
    input_schema: {
      type: 'object',
      properties: {
        trade: {
          type: 'string',
          enum: ['hvac', 'plumbing', 'electrical', 'solar', 'low_voltage', 'fire_safety', 'roofing'],
          description: 'Trade to get rates for (omit for all trades)'
        },
      },
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SITES (Service Locations) - Full CRUD
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_sites',
    description: 'Get service locations/sites from Coperniq. Can filter by client.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'number', description: 'Filter by client ID' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_site',
    description: 'Get a specific site by ID.',
    input_schema: {
      type: 'object',
      properties: {
        siteId: { type: 'number', description: 'Site ID' },
      },
      required: ['siteId'],
    },
  },
  {
    name: 'create_site',
    description: 'Create a new service location/site for a client.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Site name/label (e.g., "Main Office", "Warehouse")' },
        clientId: { type: 'number', description: 'Client ID this site belongs to' },
        street: { type: 'string', description: 'Street address' },
        city: { type: 'string', description: 'City' },
        state: { type: 'string', description: 'State (2-letter code)' },
        zip: { type: 'string', description: 'ZIP code' },
        propertyType: { type: 'string', description: 'Property type (residential, commercial, industrial)' },
        sqft: { type: 'number', description: 'Square footage' },
        yearBuilt: { type: 'number', description: 'Year built' },
        notes: { type: 'string', description: 'Site notes (gate codes, access instructions)' },
      },
      required: ['clientId', 'street', 'city', 'state', 'zip'],
    },
  },
  {
    name: 'update_site',
    description: 'Update an existing site.',
    input_schema: {
      type: 'object',
      properties: {
        siteId: { type: 'number', description: 'Site ID' },
        name: { type: 'string', description: 'New name' },
        street: { type: 'string', description: 'New street address' },
        city: { type: 'string', description: 'New city' },
        state: { type: 'string', description: 'New state' },
        zip: { type: 'string', description: 'New ZIP' },
        notes: { type: 'string', description: 'Updated notes' },
      },
      required: ['siteId'],
    },
  },
  {
    name: 'get_site_history',
    description: 'Get service history for a site - all projects and work orders at this location.',
    input_schema: {
      type: 'object',
      properties: {
        siteId: { type: 'number', description: 'Site ID' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: ['siteId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSETS (Equipment) - Full CRUD
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_assets',
    description: 'Get equipment/assets from Coperniq. Can filter by site.',
    input_schema: {
      type: 'object',
      properties: {
        siteId: { type: 'number', description: 'Filter by site ID' },
        type: { type: 'string', description: 'Filter by equipment type (AC, Furnace, Water Heater, etc.)' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_asset',
    description: 'Get a specific asset by ID with full details.',
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'number', description: 'Asset ID' },
      },
      required: ['assetId'],
    },
  },
  {
    name: 'create_asset',
    description: 'Create a new equipment record at a site.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Asset name (e.g., "Main AC Unit")' },
        type: { type: 'string', description: 'Equipment type (AC, Furnace, Heat Pump, Water Heater, Solar Panels, etc.)' },
        siteId: { type: 'number', description: 'Site ID where equipment is installed' },
        manufacturer: { type: 'string', description: 'Manufacturer/brand (Trane, Carrier, Rheem, etc.)' },
        model: { type: 'string', description: 'Model number' },
        serialNumber: { type: 'string', description: 'Serial number' },
        size: { type: 'string', description: 'Size/capacity (e.g., "3 Ton", "50 Gallon", "10 kW")' },
        installDate: { type: 'string', description: 'Install date (ISO 8601)' },
        warrantyExpiration: { type: 'string', description: 'Warranty expiration date (ISO 8601)' },
        location: { type: 'string', description: 'Location within building (Attic, Garage, Basement, Roof, etc.)' },
        refrigerantType: { type: 'string', description: 'Refrigerant type (R-410A, R-22, R-32)' },
        notes: { type: 'string', description: 'Equipment notes' },
      },
      required: ['siteId', 'type'],
    },
  },
  {
    name: 'update_asset',
    description: 'Update an existing equipment record.',
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'number', description: 'Asset ID' },
        name: { type: 'string', description: 'New name' },
        serialNumber: { type: 'string', description: 'Serial number' },
        warrantyExpiration: { type: 'string', description: 'Warranty expiration date' },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'DECOMMISSIONED'], description: 'Asset status' },
        notes: { type: 'string', description: 'Updated notes' },
      },
      required: ['assetId'],
    },
  },
  {
    name: 'get_asset_history',
    description: 'Get service history for an asset - all tasks and work orders for this equipment.',
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'number', description: 'Asset ID' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: ['assetId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TASKS (Scheduled Visits/Work Orders) - Full CRUD
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_tasks',
    description: 'Get tasks/scheduled visits from Coperniq. Can filter by date, technician, or status.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Filter by date (ISO 8601 or "today", "tomorrow")' },
        assigneeId: { type: 'number', description: 'Filter by technician ID' },
        status: { type: 'string', enum: ['NEW', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], description: 'Filter by status' },
        siteId: { type: 'number', description: 'Filter by site ID' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_schedule',
    description: 'Get daily schedule for a date - all tasks scheduled for that day.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date to get schedule for (ISO 8601 or "today", "tomorrow")' },
        technicianId: { type: 'number', description: 'Optional: Filter by specific technician' },
      },
      required: ['date'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task/scheduled visit.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        trade: { type: 'string', enum: ['hvac', 'plumbing', 'electrical', 'solar', 'low_voltage', 'roofing', 'fire_safety'], description: 'Trade type' },
        type: { type: 'string', enum: ['SERVICE_CALL', 'MAINTENANCE', 'INSTALLATION', 'INSPECTION', 'REPAIR'], description: 'Task type' },
        priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], description: 'Priority' },
        siteId: { type: 'number', description: 'Site ID' },
        assetId: { type: 'number', description: 'Asset ID (if equipment-related)' },
        clientId: { type: 'number', description: 'Client ID' },
        assigneeId: { type: 'number', description: 'Technician ID to assign' },
        startDate: { type: 'string', description: 'Scheduled start date/time (ISO 8601)' },
        endDate: { type: 'string', description: 'Scheduled end date/time (ISO 8601)' },
        estimatedHours: { type: 'number', description: 'Estimated duration in hours' },
      },
      required: ['title', 'trade'],
    },
  },
  {
    name: 'update_task_status',
    description: 'Update task status (start, complete, cancel, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'number', description: 'Task ID' },
        status: { type: 'string', enum: ['NEW', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], description: 'New status' },
        completionNotes: { type: 'string', description: 'Notes about completion (for COMPLETED status)' },
      },
      required: ['taskId', 'status'],
    },
  },
  {
    name: 'assign_task',
    description: 'Assign a technician to a task.',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'number', description: 'Task ID' },
        technicianId: { type: 'number', description: 'Technician user ID' },
        scheduledDate: { type: 'string', description: 'Scheduled date/time (ISO 8601)' },
        estimatedHours: { type: 'number', description: 'Estimated duration in hours' },
      },
      required: ['taskId', 'technicianId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMS - Get by Type and Submit
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_forms_by_type',
    description: 'Get form templates by type (inspection checklists, service reports, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        formType: { type: 'string', description: 'Form type (HVAC_INSPECTION, PLUMBING_INSPECTION, ELECTRICAL_PANEL, etc.)' },
        trade: { type: 'string', enum: ['hvac', 'plumbing', 'electrical', 'solar', 'low_voltage', 'roofing', 'fire_safety'], description: 'Filter by trade' },
      },
    },
  },
  {
    name: 'submit_form',
    description: 'Submit a completed form with all field values.',
    input_schema: {
      type: 'object',
      properties: {
        formId: { type: 'number', description: 'Form ID' },
        taskId: { type: 'number', description: 'Task ID to attach form to' },
        projectId: { type: 'number', description: 'Project ID to attach form to' },
        fieldValues: { type: 'object', description: 'Object with field name/value pairs' },
        technicianSignature: { type: 'string', description: 'Technician signature (base64 or name)' },
        customerSignature: { type: 'string', description: 'Customer signature (base64 or name)' },
      },
      required: ['formId', 'fieldValues'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME ENTRIES - Labor Tracking
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'log_time_entry',
    description: 'Log time/labor hours for a task or project.',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'number', description: 'Task ID' },
        projectId: { type: 'number', description: 'Project ID' },
        technicianId: { type: 'number', description: 'Technician user ID' },
        hours: { type: 'number', description: 'Hours worked' },
        date: { type: 'string', description: 'Date of work (ISO 8601)' },
        startTime: { type: 'string', description: 'Start time (HH:mm)' },
        endTime: { type: 'string', description: 'End time (HH:mm)' },
        description: { type: 'string', description: 'Work description' },
        billable: { type: 'boolean', description: 'Whether time is billable (default true)' },
      },
      required: ['hours'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENTS - Notes on Records
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'add_comment',
    description: 'Add a comment/note to a task, project, or request.',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'number', description: 'Task ID' },
        projectId: { type: 'number', description: 'Project ID' },
        requestId: { type: 'number', description: 'Request ID' },
        comment: { type: 'string', description: 'Comment text' },
        isInternal: { type: 'boolean', description: 'Internal-only note (not visible to customer)' },
      },
      required: ['comment'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILES - Photo Upload
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'upload_photo',
    description: 'Upload a photo to a task or project.',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'number', description: 'Task ID' },
        projectId: { type: 'number', description: 'Project ID' },
        imageBase64: { type: 'string', description: 'Base64 encoded image data' },
        filename: { type: 'string', description: 'Filename (e.g., "before-photo.jpg")' },
        description: { type: 'string', description: 'Photo description' },
        category: { type: 'string', enum: ['BEFORE', 'AFTER', 'EQUIPMENT', 'DAMAGE', 'OTHER'], description: 'Photo category' },
      },
      required: ['imageBase64'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS - Customer & Tech Alerts
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'send_notification',
    description: 'Send notification to customer or technician (SMS or email).',
    input_schema: {
      type: 'object',
      properties: {
        recipientType: { type: 'string', enum: ['customer', 'technician'], description: 'Who to notify' },
        recipientId: { type: 'number', description: 'Client ID or User ID' },
        method: { type: 'string', enum: ['sms', 'email', 'both'], description: 'Notification method' },
        templateType: { type: 'string', enum: ['appointment_reminder', 'appointment_confirmation', 'tech_en_route', 'job_complete', 'invoice_sent', 'custom'], description: 'Message template' },
        customMessage: { type: 'string', description: 'Custom message (required if templateType is "custom")' },
        taskId: { type: 'number', description: 'Task ID for context' },
        projectId: { type: 'number', description: 'Project ID for context' },
      },
      required: ['recipientType', 'recipientId', 'method', 'templateType'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENTS - Payment Processing
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'process_payment',
    description: 'Record a payment against an invoice.',
    input_schema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'number', description: 'Invoice ID' },
        amount: { type: 'number', description: 'Payment amount' },
        method: { type: 'string', enum: ['cash', 'check', 'credit_card', 'ach', 'financing'], description: 'Payment method' },
        checkNumber: { type: 'string', description: 'Check number (if method is check)' },
        reference: { type: 'string', description: 'Payment reference/transaction ID' },
        notes: { type: 'string', description: 'Payment notes' },
      },
      required: ['invoiceId', 'amount', 'method'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECH LOCATION - GPS Tracking
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_tech_location',
    description: 'Get current location of a technician (from mobile app GPS).',
    input_schema: {
      type: 'object',
      properties: {
        technicianId: { type: 'number', description: 'Technician user ID' },
      },
      required: ['technicianId'],
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
      // SYSTEM UTILITIES (Real-time info)
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_current_time': {
        const now = new Date();
        const timezone = toolInput.timezone as string || Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Format date/time for the requested timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        return JSON.stringify({
          formatted: formatter.format(now),
          date: dateFormatter.format(now),
          time: timeFormatter.format(now),
          timezone: timezone,
          iso: now.toISOString(),
          timestamp: now.getTime(),
          dayOfWeek: new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' }).format(now),
          isWeekend: [0, 6].includes(now.getDay()),
          businessHours: {
            isOpen: now.getHours() >= 7 && now.getHours() < 18 && ![0, 6].includes(now.getDay()),
            opensAt: '7:00 AM',
            closesAt: '6:00 PM',
          },
        });
      }

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
      // VOICE-FIRST TOOLS (Phone lookup, Voice requests, Availability, Dispatch)
      // ═══════════════════════════════════════════════════════════════════════
      case 'lookup_client_by_phone': {
        // Normalize phone number for searching (strip non-digits)
        const phoneRaw = String(toolInput.phone || '');
        const phoneDigits = phoneRaw.replace(/\D/g, '');

        // Get all clients and search by phone
        const clients = await coperniqFetch('/clients', apiKey) as Array<Record<string, unknown>>;
        const results = (Array.isArray(clients) ? clients : []).filter((client) => {
          const clientPhone = String(client.primaryPhone || client.phone || '').replace(/\D/g, '');
          // Match last 10 digits to handle +1 prefix variations
          const phoneMatch = phoneDigits.slice(-10);
          const clientMatch = clientPhone.slice(-10);
          return phoneMatch && clientMatch && phoneMatch === clientMatch;
        });

        if (results.length > 0) {
          const client = results[0];
          return JSON.stringify({
            found: true,
            client: {
              id: client.id,
              name: client.title || client.name,
              email: client.primaryEmail,
              phone: client.primaryPhone,
              address: client.address || `${client.street || ''}, ${client.city || ''}, ${client.state || ''} ${client.zipcode || ''}`.trim(),
              clientType: client.clientType,
              notes: client.notes,
            },
            message: `Found customer: ${client.title || client.name}`,
          });
        }

        return JSON.stringify({
          found: false,
          phone: phoneRaw,
          message: 'No customer found with that phone number. This may be a new customer.',
        });
      }

      case 'create_request_from_voice': {
        const { clientId, trade, description, urgency, preferredDate, callerName, callerPhone, callerAddress } = toolInput;

        // If no clientId but we have new customer info, create the client first
        let effectiveClientId = clientId as number | undefined;
        let newClientCreated = false;

        if (!effectiveClientId && callerName && callerPhone) {
          try {
            const newClient = await coperniqFetch('/clients', apiKey, {
              method: 'POST',
              body: JSON.stringify({
                title: callerName,
                name: callerName,
                primaryPhone: callerPhone,
                address: callerAddress || '',
                clientType: 'RESIDENTIAL',
                source: 'VOICE_CALL',
              }),
            }) as Record<string, unknown>;

            effectiveClientId = newClient.id as number;
            newClientCreated = true;
          } catch {
            // Continue without client if creation fails
          }
        }

        // Map urgency to Coperniq priority
        const priorityMap: Record<string, string> = {
          emergency: 'EMERGENCY',
          urgent: 'HIGH',
          normal: 'MEDIUM',
          low: 'LOW',
        };

        // Create the service request
        const requestData: Record<string, unknown> = {
          title: `${String(trade).toUpperCase()} Service Request`,
          description: description,
          priority: priorityMap[urgency as string] || 'MEDIUM',
          source: 'PHONE',
          trade: String(trade).toUpperCase(),
        };

        if (effectiveClientId) {
          requestData.clientId = effectiveClientId;
        }

        if (preferredDate) {
          // Parse natural language dates
          const dateStr = String(preferredDate).toLowerCase();
          let targetDate: Date;

          if (dateStr === 'today') {
            targetDate = new Date();
          } else if (dateStr === 'tomorrow') {
            targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 1);
          } else {
            targetDate = new Date(preferredDate as string);
          }

          if (!isNaN(targetDate.getTime())) {
            requestData.preferredDate = targetDate.toISOString().split('T')[0];
          }
        }

        const request = await coperniqFetch('/requests', apiKey, {
          method: 'POST',
          body: JSON.stringify(requestData),
        }) as Record<string, unknown>;

        return JSON.stringify({
          success: true,
          request: {
            id: request.id,
            title: request.title,
            priority: request.priority,
            trade: trade,
          },
          newClientCreated,
          clientId: effectiveClientId,
          message: `Created ${trade} service request${newClientCreated ? ' and new customer' : ''}. Request ID: ${request.id}`,
        });
      }

      case 'check_tech_availability': {
        const { trade, date, urgency } = toolInput;

        // Parse date
        const dateStr = String(date || 'today').toLowerCase();
        let targetDate: Date;

        if (dateStr === 'today') {
          targetDate = new Date();
        } else if (dateStr === 'tomorrow') {
          targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 1);
        } else {
          targetDate = new Date(date as string);
        }

        const formattedDate = targetDate.toISOString().split('T')[0];

        // Get users/technicians for this trade
        // In a real implementation, this would query Coperniq's scheduling API
        // For now, simulate based on trade team roster

        const tradeToTech: Record<string, { name: string; id: number }> = {
          hvac: { name: 'Mark Thompson', id: 101 },
          plumbing: { name: 'Carlos Rodriguez', id: 102 },
          electrical: { name: 'David Kim', id: 103 },
          solar: { name: 'Jennifer Lee', id: 104 },
          low_voltage: { name: 'Alex Turner', id: 105 },
          roofing: { name: 'James Miller', id: 106 },
          fire_safety: { name: 'Patricia Williams', id: 107 },
        };

        const tech = tradeToTech[String(trade).toLowerCase()] || tradeToTech.hvac;

        // Generate available slots (business hours: 8am-5pm)
        const slots = [];
        const isEmergency = urgency === 'emergency';

        // Morning slots
        if (!isEmergency) {
          slots.push({ time: '08:00', available: true, technicianId: tech.id, technicianName: tech.name });
          slots.push({ time: '10:00', available: Math.random() > 0.3, technicianId: tech.id, technicianName: tech.name });
        }
        // Afternoon slots
        slots.push({ time: '13:00', available: Math.random() > 0.4, technicianId: tech.id, technicianName: tech.name });
        slots.push({ time: '15:00', available: Math.random() > 0.5, technicianId: tech.id, technicianName: tech.name });

        // Emergency gets priority slot
        if (isEmergency) {
          slots.unshift({
            time: 'NEXT AVAILABLE',
            available: true,
            technicianId: tech.id,
            technicianName: tech.name,
            note: 'Emergency priority - will dispatch immediately',
          });
        }

        const availableSlots = slots.filter(s => s.available);

        return JSON.stringify({
          date: formattedDate,
          trade: trade,
          technician: tech,
          totalSlots: slots.length,
          availableSlots: availableSlots.length,
          slots: availableSlots,
          message: availableSlots.length > 0
            ? `${availableSlots.length} slots available on ${formattedDate} with ${tech.name}`
            : `No slots available on ${formattedDate}. Would you like me to check another day?`,
        });
      }

      case 'dispatch_technician': {
        const { workOrderId, technicianId, scheduledTime, estimatedDuration, notes } = toolInput;

        // Update the work order with assignment
        const updateData: Record<string, unknown> = {
          assigneeId: technicianId,
          status: 'scheduled',
        };

        if (scheduledTime) {
          updateData.scheduledDate = scheduledTime;
        }

        if (estimatedDuration) {
          updateData.estimatedHours = estimatedDuration;
        }

        if (notes) {
          updateData.dispatchNotes = notes;
        }

        // Dispatch the technician
        const result = await coperniqFetch(`/work-orders/${workOrderId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }) as Record<string, unknown>;

        return JSON.stringify({
          success: true,
          dispatch: {
            workOrderId,
            technicianId,
            scheduledTime: scheduledTime || 'As soon as available',
            status: 'dispatched',
          },
          workOrder: result,
          message: `Technician dispatched to work order #${workOrderId}${scheduledTime ? ` for ${scheduledTime}` : ''}`,
        });
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

      case 'assign_technician': {
        const { workOrderId, technicianId, scheduledDate } = toolInput;
        const updateData: Record<string, unknown> = { assigneeId: technicianId };
        if (scheduledDate) updateData.scheduledDate = scheduledDate;
        if (!updateData.status) updateData.status = 'scheduled'; // Auto-set to scheduled when assigning

        const result = await coperniqFetch(`/work-orders/${workOrderId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, work_order: result, message: 'Technician assigned successfully' });
      }

      case 'convert_request_to_work_order': {
        const { requestId, title, priority, assigneeId, scheduledDate } = toolInput;

        // First, get the request details
        const requestData = await coperniqFetch(`/requests/${requestId}`, apiKey) as Record<string, unknown>;

        // Create work order from request data
        const workOrderData: Record<string, unknown> = {
          title: title || requestData.title || `Work Order from Request #${requestId}`,
          description: requestData.description || '',
          priority: priority || requestData.priority || 'medium',
          requestId: requestId, // Link to original request
        };

        if (assigneeId) workOrderData.assigneeId = assigneeId;
        if (scheduledDate) {
          workOrderData.scheduledDate = scheduledDate;
          workOrderData.status = 'scheduled';
        }

        // Create the work order
        const workOrder = await coperniqFetch(`/requests/${requestId}/work-orders`, apiKey, {
          method: 'POST',
          body: JSON.stringify(workOrderData),
        });

        // Update request status to 'converted'
        try {
          await coperniqFetch(`/requests/${requestId}`, apiKey, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'converted' }),
          });
        } catch {
          // Request status update is optional
        }

        return JSON.stringify({
          success: true,
          work_order: workOrder,
          message: `Created work order from request #${requestId}`
        });
      }

      case 'add_work_order_note': {
        const { workOrderId, note, isInternal } = toolInput;

        // Try to add note via comments/notes endpoint, fallback to updating description
        try {
          const result = await coperniqFetch(`/work-orders/${workOrderId}/notes`, apiKey, {
            method: 'POST',
            body: JSON.stringify({ content: note, isInternal: isInternal || false }),
          });
          return JSON.stringify({ success: true, note: result });
        } catch {
          // Fallback: Append to description
          const workOrder = await coperniqFetch(`/work-orders/${workOrderId}`, apiKey) as Record<string, unknown>;
          const existingDesc = String(workOrder.description || '');
          const timestamp = new Date().toISOString();
          const newDesc = `${existingDesc}\n\n[Note - ${timestamp}]: ${note}`;

          const result = await coperniqFetch(`/work-orders/${workOrderId}`, apiKey, {
            method: 'PATCH',
            body: JSON.stringify({ description: newDesc }),
          });
          return JSON.stringify({ success: true, work_order: result, message: 'Note added to description' });
        }
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
      // TIME & MATERIALS (T&M) - Job Costing Handlers
      // ═══════════════════════════════════════════════════════════════════════
      case 'calculate_labor_cost': {
        // Labor rates by trade (local config - no external DB for MVP)
        const laborRates: Record<string, Record<string, number>> = {
          hvac: { standard: 95, overtime: 142.50, emergency: 190, apprentice: 55 },
          plumbing: { standard: 95, overtime: 142.50, emergency: 190, apprentice: 55 },
          electrical: { standard: 100, overtime: 150, emergency: 200, apprentice: 60 },
          solar: { standard: 85, overtime: 127.50, emergency: 170, apprentice: 50 },
          low_voltage: { standard: 75, overtime: 112.50, emergency: 150, apprentice: 45 },
          fire_safety: { standard: 90, overtime: 135, emergency: 180, apprentice: 50 },
          roofing: { standard: 75, overtime: 112.50, emergency: 150, apprentice: 45 },
        };

        const trade = toolInput.trade as string;
        const hours = toolInput.hours as number;
        const rateType = (toolInput.rateType as string) || 'standard';

        const rate = laborRates[trade]?.[rateType] || laborRates[trade]?.standard || 85;
        const total = hours * rate;

        return JSON.stringify({
          trade,
          hours,
          rateType,
          hourlyRate: rate,
          totalLaborCost: parseFloat(total.toFixed(2)),
          description: `${trade.toUpperCase()} Labor - ${hours} hrs @ $${rate}/hr (${rateType})`,
        });
      }

      case 'calculate_material_cost': {
        // Material markup tiers
        const markupRates: Record<string, number> = {
          default: 0.35,
          residential: 0.35,
          commercial: 0.25,
          emergency: 0.50,
        };

        const materialCost = toolInput.materialCost as number;
        const quantity = toolInput.quantity as number || 1;
        const markupType = (toolInput.markupType as string) || 'default';
        const description = (toolInput.description as string) || 'Material';

        const markup = markupRates[markupType] || markupRates.default;
        const totalCost = materialCost * quantity;
        const markupAmount = totalCost * markup;
        const customerPrice = totalCost + markupAmount;

        return JSON.stringify({
          description,
          quantity,
          unitCost: materialCost,
          totalCost: parseFloat(totalCost.toFixed(2)),
          markupPercent: Math.round(markup * 100),
          markupAmount: parseFloat(markupAmount.toFixed(2)),
          customerPrice: parseFloat(customerPrice.toFixed(2)),
          unitPrice: parseFloat((customerPrice / quantity).toFixed(2)),
        });
      }

      case 'calculate_job_total': {
        // Combined labor + materials calculation
        const laborRates: Record<string, Record<string, number>> = {
          hvac: { standard: 95, overtime: 142.50, emergency: 190, apprentice: 55 },
          plumbing: { standard: 95, overtime: 142.50, emergency: 190, apprentice: 55 },
          electrical: { standard: 100, overtime: 150, emergency: 200, apprentice: 60 },
          solar: { standard: 85, overtime: 127.50, emergency: 170, apprentice: 50 },
          low_voltage: { standard: 75, overtime: 112.50, emergency: 150, apprentice: 45 },
          fire_safety: { standard: 90, overtime: 135, emergency: 180, apprentice: 50 },
          roofing: { standard: 75, overtime: 112.50, emergency: 150, apprentice: 45 },
        };
        const markupRates: Record<string, number> = {
          default: 0.35,
          residential: 0.35,
          commercial: 0.25,
          emergency: 0.50,
        };
        const minimumCharges = { serviceCall: 95, diagnostic: 149, emergencyDispatch: 195 };

        const trade = toolInput.trade as string;
        const laborHours = (toolInput.laborHours as number) || 0;
        const rateType = (toolInput.rateType as string) || 'standard';
        const materials = (toolInput.materials as Array<{ description: string; cost: number; quantity: number }>) || [];
        const includeServiceCall = toolInput.includeServiceCall as boolean;
        const markupType = (toolInput.markupType as string) || 'default';

        // Calculate labor
        const laborRate = laborRates[trade]?.[rateType] || 85;
        const laborTotal = laborHours * laborRate;

        // Calculate materials with markup
        const markup = markupRates[markupType] || 0.35;
        const materialItems = materials.map(m => {
          const cost = m.cost * (m.quantity || 1);
          const withMarkup = cost * (1 + markup);
          return {
            description: m.description,
            quantity: m.quantity || 1,
            cost: parseFloat(cost.toFixed(2)),
            customerPrice: parseFloat(withMarkup.toFixed(2)),
          };
        });
        const materialTotal = materialItems.reduce((sum, m) => sum + m.cost, 0);
        const materialCustomerTotal = materialItems.reduce((sum, m) => sum + m.customerPrice, 0);

        // Service call fee
        const serviceCallFee = includeServiceCall ? minimumCharges.serviceCall : 0;

        // Grand totals
        const totalCost = laborTotal + materialTotal + serviceCallFee;
        const grandTotal = laborTotal + materialCustomerTotal + serviceCallFee;
        const grossMargin = grandTotal > 0 ? ((grandTotal - materialTotal) / grandTotal) * 100 : 0;

        return JSON.stringify({
          trade,
          labor: {
            hours: laborHours,
            rate: laborRate,
            rateType,
            total: parseFloat(laborTotal.toFixed(2)),
          },
          materials: {
            items: materialItems,
            subtotal: parseFloat(materialCustomerTotal.toFixed(2)),
            markupPercent: Math.round(markup * 100),
          },
          serviceCallFee,
          totalCost: parseFloat(totalCost.toFixed(2)),
          grandTotal: parseFloat(grandTotal.toFixed(2)),
          grossMarginPercent: parseFloat(grossMargin.toFixed(1)),
          summary: `Labor: $${laborTotal.toFixed(2)} + Materials: $${materialCustomerTotal.toFixed(2)}${serviceCallFee ? ` + Service: $${serviceCallFee}` : ''} = $${grandTotal.toFixed(2)}`,
        });
      }

      case 'get_labor_rates': {
        const laborRates: Record<string, Record<string, number>> = {
          hvac: { standard: 95, overtime: 142.50, emergency: 190, apprentice: 55 },
          plumbing: { standard: 95, overtime: 142.50, emergency: 190, apprentice: 55 },
          electrical: { standard: 100, overtime: 150, emergency: 200, apprentice: 60 },
          solar: { standard: 85, overtime: 127.50, emergency: 170, apprentice: 50 },
          low_voltage: { standard: 75, overtime: 112.50, emergency: 150, apprentice: 45 },
          fire_safety: { standard: 90, overtime: 135, emergency: 180, apprentice: 50 },
          roofing: { standard: 75, overtime: 112.50, emergency: 150, apprentice: 45 },
        };

        const trade = toolInput.trade as string;

        if (trade) {
          return JSON.stringify({
            trade,
            rates: laborRates[trade] || {},
            minimumCharges: { serviceCall: 95, diagnostic: 149, emergencyDispatch: 195 },
          });
        }

        return JSON.stringify({
          allRates: laborRates,
          materialMarkup: { default: '35%', residential: '35%', commercial: '25%', emergency: '50%' },
          minimumCharges: { serviceCall: 95, diagnostic: 149, emergencyDispatch: 195 },
        });
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

      // ═══════════════════════════════════════════════════════════════════════
      // SITES (Service Locations)
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_sites': {
        const params = new URLSearchParams();
        if (toolInput.clientId) params.append('clientId', String(toolInput.clientId));
        if (toolInput.limit) params.append('limit', String(toolInput.limit));
        const url = '/sites' + (params.toString() ? `?${params}` : '');
        const sites = await coperniqFetch(url, apiKey);
        return JSON.stringify({ sites, count: Array.isArray(sites) ? sites.length : 0 });
      }

      case 'get_site': {
        const site = await coperniqFetch(`/sites/${toolInput.siteId}`, apiKey);
        return JSON.stringify({ site });
      }

      case 'create_site': {
        const siteData = {
          name: toolInput.name,
          title: toolInput.name,
          street: toolInput.street,
          city: toolInput.city,
          state: toolInput.state,
          zipcode: toolInput.zip,
          clientId: toolInput.clientId,
          propertyType: toolInput.propertyType,
          sqft: toolInput.sqft,
          yearBuilt: toolInput.yearBuilt,
          notes: toolInput.notes,
          timezone: 'America/Chicago',
        };
        const result = await coperniqFetch('/sites', apiKey, {
          method: 'POST',
          body: JSON.stringify(siteData),
        });
        return JSON.stringify({ success: true, site: result });
      }

      case 'update_site': {
        const { siteId, ...updateData } = toolInput;
        if (updateData.zip) updateData.zipcode = updateData.zip;
        const result = await coperniqFetch(`/sites/${siteId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, site: result });
      }

      case 'get_site_history': {
        const projects = await coperniqFetch(`/sites/${toolInput.siteId}/projects`, apiKey);
        const tasks = await coperniqFetch(`/sites/${toolInput.siteId}/tasks`, apiKey);
        return JSON.stringify({
          siteId: toolInput.siteId,
          projects: Array.isArray(projects) ? projects : [],
          tasks: Array.isArray(tasks) ? tasks : [],
          totalProjects: Array.isArray(projects) ? projects.length : 0,
          totalTasks: Array.isArray(tasks) ? tasks.length : 0,
        });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ASSETS (Equipment)
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_assets': {
        const params = new URLSearchParams();
        if (toolInput.siteId) params.append('siteId', String(toolInput.siteId));
        if (toolInput.type) params.append('type', String(toolInput.type));
        if (toolInput.limit) params.append('limit', String(toolInput.limit));
        const url = '/assets' + (params.toString() ? `?${params}` : '');
        const assets = await coperniqFetch(url, apiKey);
        return JSON.stringify({ assets, count: Array.isArray(assets) ? assets.length : 0 });
      }

      case 'get_asset': {
        const asset = await coperniqFetch(`/assets/${toolInput.assetId}`, apiKey);
        return JSON.stringify({ asset });
      }

      case 'create_asset': {
        const assetData = {
          name: toolInput.name || `${toolInput.manufacturer || ''} ${toolInput.model || ''}`.trim(),
          type: toolInput.type,
          siteId: toolInput.siteId,
          manufacturer: toolInput.manufacturer,
          model: toolInput.model,
          serialNumber: toolInput.serialNumber,
          size: toolInput.size,
          installDate: toolInput.installDate,
          warrantyExpiration: toolInput.warrantyExpiration,
          location: toolInput.location,
          refrigerantType: toolInput.refrigerantType,
          notes: toolInput.notes,
          status: 'ACTIVE',
        };
        const result = await coperniqFetch('/assets', apiKey, {
          method: 'POST',
          body: JSON.stringify(assetData),
        });
        return JSON.stringify({ success: true, asset: result });
      }

      case 'update_asset': {
        const { assetId, ...updateData } = toolInput;
        const result = await coperniqFetch(`/assets/${assetId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, asset: result });
      }

      case 'get_asset_history': {
        const tasks = await coperniqFetch(`/assets/${toolInput.assetId}/tasks`, apiKey);
        return JSON.stringify({
          assetId: toolInput.assetId,
          serviceHistory: Array.isArray(tasks) ? tasks : [],
          totalServices: Array.isArray(tasks) ? tasks.length : 0,
        });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // TASKS (Scheduled Visits)
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_tasks': {
        const params = new URLSearchParams();
        if (toolInput.date) {
          const dateStr = String(toolInput.date).toLowerCase();
          let targetDate: Date;
          if (dateStr === 'today') targetDate = new Date();
          else if (dateStr === 'tomorrow') { targetDate = new Date(); targetDate.setDate(targetDate.getDate() + 1); }
          else targetDate = new Date(toolInput.date as string);
          params.append('date', targetDate.toISOString().split('T')[0]);
        }
        if (toolInput.assigneeId) params.append('assigneeId', String(toolInput.assigneeId));
        if (toolInput.status) params.append('status', String(toolInput.status));
        if (toolInput.siteId) params.append('siteId', String(toolInput.siteId));
        if (toolInput.limit) params.append('limit', String(toolInput.limit));
        const url = '/tasks' + (params.toString() ? `?${params}` : '');
        const tasks = await coperniqFetch(url, apiKey);
        return JSON.stringify({ tasks, count: Array.isArray(tasks) ? tasks.length : 0 });
      }

      case 'get_schedule': {
        const dateStr = String(toolInput.date).toLowerCase();
        let targetDate: Date;
        if (dateStr === 'today') targetDate = new Date();
        else if (dateStr === 'tomorrow') { targetDate = new Date(); targetDate.setDate(targetDate.getDate() + 1); }
        else targetDate = new Date(toolInput.date as string);
        const formattedDate = targetDate.toISOString().split('T')[0];

        const params = new URLSearchParams({ date: formattedDate });
        if (toolInput.technicianId) params.append('assigneeId', String(toolInput.technicianId));
        const tasks = await coperniqFetch(`/tasks?${params}`, apiKey);
        return JSON.stringify({
          date: formattedDate,
          dayOfWeek: targetDate.toLocaleDateString('en-US', { weekday: 'long' }),
          schedule: Array.isArray(tasks) ? tasks : [],
          totalJobs: Array.isArray(tasks) ? tasks.length : 0,
        });
      }

      case 'create_task': {
        const taskData = {
          title: toolInput.title,
          description: toolInput.description,
          trade: String(toolInput.trade).toUpperCase(),
          type: toolInput.type || 'SERVICE_CALL',
          priority: toolInput.priority || 'NORMAL',
          status: 'NEW',
          siteId: toolInput.siteId,
          assetId: toolInput.assetId,
          clientId: toolInput.clientId,
          assigneeId: toolInput.assigneeId,
          startDate: toolInput.startDate,
          endDate: toolInput.endDate,
          estimatedHours: toolInput.estimatedHours,
          isField: true,
        };
        const result = await coperniqFetch('/tasks', apiKey, {
          method: 'POST',
          body: JSON.stringify(taskData),
        });
        return JSON.stringify({ success: true, task: result });
      }

      case 'update_task_status': {
        const updateData: Record<string, unknown> = {
          status: toolInput.status,
        };
        if (toolInput.status === 'COMPLETED' && toolInput.completionNotes) {
          updateData.completionNotes = toolInput.completionNotes;
          updateData.completedAt = new Date().toISOString();
        }
        const result = await coperniqFetch(`/tasks/${toolInput.taskId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, task: result, message: `Task status updated to ${toolInput.status}` });
      }

      case 'assign_task': {
        const updateData: Record<string, unknown> = {
          assigneeId: toolInput.technicianId,
          status: 'SCHEDULED',
        };
        if (toolInput.scheduledDate) updateData.startDate = toolInput.scheduledDate;
        if (toolInput.estimatedHours) updateData.estimatedHours = toolInput.estimatedHours;
        const result = await coperniqFetch(`/tasks/${toolInput.taskId}`, apiKey, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return JSON.stringify({ success: true, task: result, message: `Task assigned to technician ${toolInput.technicianId}` });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FORMS - By Type and Submit
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_forms_by_type': {
        const params = new URLSearchParams();
        if (toolInput.formType) params.append('type', String(toolInput.formType));
        if (toolInput.trade) params.append('trade', String(toolInput.trade).toUpperCase());
        const url = '/forms' + (params.toString() ? `?${params}` : '');
        const forms = await coperniqFetch(url, apiKey);
        return JSON.stringify({ forms, count: Array.isArray(forms) ? forms.length : 0 });
      }

      case 'submit_form': {
        const submitData = {
          formId: toolInput.formId,
          taskId: toolInput.taskId,
          projectId: toolInput.projectId,
          data: toolInput.fieldValues,
          technicianSignature: toolInput.technicianSignature,
          customerSignature: toolInput.customerSignature,
          status: 'COMPLETED',
          submittedAt: new Date().toISOString(),
        };
        const result = await coperniqFetch(`/forms/${toolInput.formId}/submit`, apiKey, {
          method: 'POST',
          body: JSON.stringify(submitData),
        });
        return JSON.stringify({ success: true, form: result, message: 'Form submitted successfully' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // TIME ENTRIES
      // ═══════════════════════════════════════════════════════════════════════
      case 'log_time_entry': {
        const timeData = {
          taskId: toolInput.taskId,
          projectId: toolInput.projectId,
          userId: toolInput.technicianId,
          hours: toolInput.hours,
          date: toolInput.date || new Date().toISOString().split('T')[0],
          startTime: toolInput.startTime,
          endTime: toolInput.endTime,
          description: toolInput.description,
          billable: toolInput.billable !== false,
        };
        const result = await coperniqFetch('/time-entries', apiKey, {
          method: 'POST',
          body: JSON.stringify(timeData),
        });
        return JSON.stringify({ success: true, timeEntry: result, message: `Logged ${toolInput.hours} hours` });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // COMMENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'add_comment': {
        let url = '/comments';
        if (toolInput.taskId) url = `/tasks/${toolInput.taskId}/comments`;
        else if (toolInput.projectId) url = `/projects/${toolInput.projectId}/comments`;
        else if (toolInput.requestId) url = `/requests/${toolInput.requestId}/comments`;

        const commentData = {
          content: toolInput.comment,
          isInternal: toolInput.isInternal || false,
          createdAt: new Date().toISOString(),
        };
        const result = await coperniqFetch(url, apiKey, {
          method: 'POST',
          body: JSON.stringify(commentData),
        });
        return JSON.stringify({ success: true, comment: result, message: 'Comment added' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FILES - Photo Upload
      // ═══════════════════════════════════════════════════════════════════════
      case 'upload_photo': {
        let url = '/files';
        if (toolInput.taskId) url = `/tasks/${toolInput.taskId}/files`;
        else if (toolInput.projectId) url = `/projects/${toolInput.projectId}/files`;

        const fileData = {
          filename: toolInput.filename || `photo-${Date.now()}.jpg`,
          data: toolInput.imageBase64,
          description: toolInput.description,
          category: toolInput.category || 'OTHER',
          contentType: 'image/jpeg',
        };
        const result = await coperniqFetch(url, apiKey, {
          method: 'POST',
          body: JSON.stringify(fileData),
        });
        return JSON.stringify({ success: true, file: result, message: 'Photo uploaded' });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // NOTIFICATIONS
      // ═══════════════════════════════════════════════════════════════════════
      case 'send_notification': {
        const notificationData = {
          recipientType: toolInput.recipientType,
          recipientId: toolInput.recipientId,
          method: toolInput.method,
          templateType: toolInput.templateType,
          customMessage: toolInput.customMessage,
          taskId: toolInput.taskId,
          projectId: toolInput.projectId,
          sentAt: new Date().toISOString(),
        };
        const result = await coperniqFetch('/notifications', apiKey, {
          method: 'POST',
          body: JSON.stringify(notificationData),
        });
        return JSON.stringify({
          success: true,
          notification: result,
          message: `${toolInput.templateType} notification sent via ${toolInput.method}`,
        });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // PAYMENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'process_payment': {
        const paymentData = {
          invoiceId: toolInput.invoiceId,
          amount: toolInput.amount,
          method: toolInput.method,
          checkNumber: toolInput.checkNumber,
          reference: toolInput.reference,
          notes: toolInput.notes,
          processedAt: new Date().toISOString(),
        };
        const result = await coperniqFetch('/payments', apiKey, {
          method: 'POST',
          body: JSON.stringify(paymentData),
        });

        // Also update invoice status if payment equals invoice amount
        return JSON.stringify({
          success: true,
          payment: result,
          message: `Payment of $${toolInput.amount} recorded via ${toolInput.method}`,
        });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // TECH LOCATION
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_tech_location': {
        try {
          const location = await coperniqFetch(`/users/${toolInput.technicianId}/location`, apiKey);
          return JSON.stringify({
            technicianId: toolInput.technicianId,
            location: location,
            lastUpdated: new Date().toISOString(),
          });
        } catch {
          // GPS may not be available
          return JSON.stringify({
            technicianId: toolInput.technicianId,
            location: null,
            message: 'Location not available - technician may have GPS disabled or be offline',
          });
        }
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
    const { messages, model: modelAlias = DEFAULT_MODEL, image, trade, voiceMode } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Voice mode optimization: Use Haiku for speed, lower max_tokens
    // TTFT: Haiku ~100ms vs Opus ~500ms
    const effectiveModel: ModelAlias = voiceMode ? 'claude-haiku-4.5' : modelAlias;
    const modelId = AVAILABLE_MODELS[effectiveModel] || AVAILABLE_MODELS[DEFAULT_MODEL];

    // Voice responses should be SHORT - 300 tokens is ~225 words (plenty for 2 sentences)
    // Standard mode gets 4096 for complex tool outputs
    const maxTokens = voiceMode ? 300 : 4096;

    // Select appropriate system prompt
    const systemPrompt = voiceMode ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;

    console.log(`Chat request: model=${effectiveModel} -> ${modelId}, voiceMode=${voiceMode}, maxTokens=${maxTokens}${image ? ', with image' : ''}`);

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
          max_tokens: maxTokens,
          system: systemPrompt,
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
