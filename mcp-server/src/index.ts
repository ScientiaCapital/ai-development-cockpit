#!/usr/bin/env node
/**
 * Coperniq MCP Server
 *
 * Full Coperniq API access for Claude agents.
 * Supports all 70+ endpoints across 14 resource types.
 *
 * Usage:
 *   Local: npx @coperniq/mcp-server
 *   Cloud: Deploy to RunPod with COPERNIQ_API_KEY env var
 *
 * NO OpenAI - Claude only
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const API_KEY = process.env.COPERNIQ_API_KEY;

if (!API_KEY) {
  console.error('Error: COPERNIQ_API_KEY environment variable is required');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Coperniq API Client
// ─────────────────────────────────────────────────────────────────────────────

async function coperniqFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const url = `${COPERNIQ_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': API_KEY!,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Coperniq API error ${response.status}: ${error}`);
  }

  return response.json();
}

// GET request helper
async function get(endpoint: string, params?: Record<string, unknown>): Promise<unknown> {
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${endpoint}?${queryString}`;
    }
  }
  return coperniqFetch(url);
}

// POST request helper
async function post(endpoint: string, body: unknown): Promise<unknown> {
  return coperniqFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// PATCH request helper
async function patch(endpoint: string, body: unknown): Promise<unknown> {
  return coperniqFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// DELETE request helper
async function del(endpoint: string): Promise<unknown> {
  return coperniqFetch(endpoint, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Definitions - All 70+ Coperniq Endpoints
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_projects',
    description: 'List all projects with optional filtering. Projects represent jobs from initiation to close.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (1-based)' },
        page_size: { type: 'number', description: 'Items per page (max 100)' },
        q: { type: 'string', description: 'Full text search query' },
        title: { type: 'string', description: 'Search by project title' },
        address: { type: 'string', description: 'Search by address' },
        primaryName: { type: 'string', description: 'Search by contact name' },
        primaryEmail: { type: 'string', description: 'Search by contact email' },
        updated_after: { type: 'string', description: 'ISO 8601 timestamp filter' },
        order_by: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
      },
    },
  },
  {
    name: 'search_projects',
    description: 'Advanced search for projects with filters',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query' },
        title: { type: 'string', description: 'Filter by title' },
        status: { type: 'string', description: 'Filter by status' },
      },
    },
  },
  {
    name: 'get_project',
    description: 'Get a single project by ID',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Project title' },
        description: { type: 'string', description: 'Project description' },
        address: { type: 'string', description: 'Project address' },
        workflowId: { type: 'number', description: 'Workflow template ID' },
        clientId: { type: 'number', description: 'Client ID' },
        trade: { type: 'string', description: 'Trade (HVAC, Plumbing, Electrical, etc.)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_project',
    description: 'Update an existing project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID to update' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        status: { type: 'string', description: 'New status' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'delete_project',
    description: 'Delete a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID to delete' },
      },
      required: ['projectId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUESTS (Service Calls / Opportunities)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_requests',
    description: 'List service requests/opportunities. Requests capture inbound service calls.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        page_size: { type: 'number', description: 'Items per page (max 100)' },
        q: { type: 'string', description: 'Search query' },
        updated_after: { type: 'string', description: 'ISO 8601 timestamp filter' },
      },
    },
  },
  {
    name: 'get_request',
    description: 'Get a single request by ID',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'create_request',
    description: 'Create a new service request',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Request title' },
        description: { type: 'string', description: 'Description of the request' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Priority level' },
        clientId: { type: 'number', description: 'Client ID' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_request',
    description: 'Update a service request',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
        title: { type: 'string', description: 'New title' },
        status: { type: 'string', description: 'New status' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'delete_request',
    description: 'Delete a service request',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
      },
      required: ['requestId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_clients',
    description: 'List all clients (customers/organizations)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        page_size: { type: 'number', description: 'Items per page (max 100)' },
        q: { type: 'string', description: 'Search query' },
        title: { type: 'string', description: 'Search by company name' },
        clientType: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'], description: 'Client type' },
        include_contacts: { type: 'boolean', description: 'Include contact details' },
      },
    },
  },
  {
    name: 'get_client',
    description: 'Get a single client by ID',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'create_client',
    description: 'Create a new client',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Client/company name' },
        clientType: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'], description: 'Client type' },
        address: { type: 'string', description: 'Client address' },
        primaryEmail: { type: 'string', description: 'Primary email' },
        primaryPhone: { type: 'string', description: 'Primary phone' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_client',
    description: 'Update a client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
        title: { type: 'string', description: 'New name' },
        address: { type: 'string', description: 'New address' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'delete_client',
    description: 'Delete a client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
      },
      required: ['clientId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORK ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_work_orders',
    description: 'List all work orders for field work coordination',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        page_size: { type: 'number', description: 'Items per page (max 100)' },
        updated_after: { type: 'string', description: 'ISO 8601 timestamp filter' },
        order_by: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
      },
    },
  },
  {
    name: 'list_project_work_orders',
    description: 'List work orders for a specific project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'list_request_work_orders',
    description: 'List work orders for a specific request',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'list_client_work_orders',
    description: 'List work orders for a specific client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'get_work_order',
    description: 'Get a single work order by ID',
    inputSchema: {
      type: 'object',
      properties: {
        workOrderId: { type: 'string', description: 'Work order ID' },
      },
      required: ['workOrderId'],
    },
  },
  {
    name: 'list_work_order_templates',
    description: 'List available work order templates',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_project_work_order',
    description: 'Create a work order for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        title: { type: 'string', description: 'Work order title' },
        description: { type: 'string', description: 'Work order description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Priority' },
        startDate: { type: 'string', description: 'Start date (ISO 8601)' },
        endDate: { type: 'string', description: 'End date (ISO 8601)' },
        templateId: { type: 'number', description: 'Template ID to use' },
        assigneeId: { type: 'number', description: 'User ID to assign' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'create_request_work_order',
    description: 'Create a work order for a request',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
        title: { type: 'string', description: 'Work order title' },
        description: { type: 'string', description: 'Work order description' },
        priority: { type: 'string', description: 'Priority level' },
      },
      required: ['requestId', 'title'],
    },
  },
  {
    name: 'create_client_work_order',
    description: 'Create a work order for a client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
        title: { type: 'string', description: 'Work order title' },
        description: { type: 'string', description: 'Work order description' },
      },
      required: ['clientId', 'title'],
    },
  },
  {
    name: 'update_project_work_order',
    description: 'Update a project work order',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        workOrderId: { type: 'string', description: 'Work order ID' },
        title: { type: 'string', description: 'New title' },
        status: { type: 'string', description: 'New status' },
        isCompleted: { type: 'boolean', description: 'Mark as completed' },
      },
      required: ['projectId', 'workOrderId'],
    },
  },
  {
    name: 'delete_project_work_order',
    description: 'Delete a project work order',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        workOrderId: { type: 'string', description: 'Work order ID' },
      },
      required: ['projectId', 'workOrderId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_invoices',
    description: 'List all invoices',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        page_size: { type: 'number', description: 'Items per page (max 100)' },
        updated_after: { type: 'string', description: 'ISO 8601 timestamp filter' },
      },
    },
  },
  {
    name: 'get_invoice',
    description: 'Get a single invoice by ID',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'Invoice ID' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'get_project_invoices',
    description: 'Get all invoices for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_client_invoices',
    description: 'Get all invoices for a client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'create_invoice',
    description: 'Create a new invoice',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Invoice title' },
        type: { type: 'string', enum: ['INVOICE', 'BILL'], description: 'Invoice type' },
        amount: { type: 'number', description: 'Total amount' },
        dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
        clientId: { type: 'number', description: 'Client ID' },
        projectId: { type: 'number', description: 'Project ID' },
      },
      required: ['title', 'amount'],
    },
  },
  {
    name: 'update_invoice',
    description: 'Update an invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'Invoice ID' },
        status: { type: 'string', description: 'New status' },
        amountPaid: { type: 'number', description: 'Amount paid' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'delete_invoice',
    description: 'Delete an invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'Invoice ID' },
      },
      required: ['invoiceId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_project_forms',
    description: 'List all forms for a project. Forms collect structured data.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        status: {
          type: 'string',
          enum: ['UNASSIGNED', 'ASSIGNED', 'REVIEW', 'CHANGES_REQUESTED', 'COMPLETED', 'CANCELLED'],
          description: 'Filter by form status'
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_form',
    description: 'Get a single form by ID',
    inputSchema: {
      type: 'object',
      properties: {
        formId: { type: 'string', description: 'Form ID' },
      },
      required: ['formId'],
    },
  },
  {
    name: 'update_form',
    description: 'Update a form',
    inputSchema: {
      type: 'object',
      properties: {
        formId: { type: 'string', description: 'Form ID' },
        status: { type: 'string', description: 'New status' },
        assigneeId: { type: 'number', description: 'User ID to assign' },
      },
      required: ['formId'],
    },
  },
  {
    name: 'attach_file_to_form',
    description: 'Attach a file to a form field from URL',
    inputSchema: {
      type: 'object',
      properties: {
        formId: { type: 'string', description: 'Form ID' },
        fieldId: { type: 'string', description: 'Field ID' },
        fileUrl: { type: 'string', description: 'URL of file to attach' },
        fileName: { type: 'string', description: 'Name for the file' },
      },
      required: ['formId', 'fieldId', 'fileUrl'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_project_calls',
    description: 'List all calls for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'list_request_calls',
    description: 'List all calls for a request',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'list_client_calls',
    description: 'List all calls for a client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'create_project_call',
    description: 'Log a call for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        fromNumber: { type: 'string', description: 'From phone number' },
        toNumber: { type: 'string', description: 'To phone number' },
        isInbound: { type: 'boolean', description: 'Is this an inbound call' },
        outcome: { type: 'string', enum: ['ANSWERED', 'MISSED'], description: 'Call outcome' },
        reason: { type: 'string', description: 'Call reason category' },
        note: { type: 'string', description: 'Call notes' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_request_call',
    description: 'Log a call for a request',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
        note: { type: 'string', description: 'Call notes' },
        outcome: { type: 'string', enum: ['ANSWERED', 'MISSED'], description: 'Call outcome' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'create_client_call',
    description: 'Log a call for a client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
        note: { type: 'string', description: 'Call notes' },
        outcome: { type: 'string', enum: ['ANSWERED', 'MISSED'], description: 'Call outcome' },
      },
      required: ['clientId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATALOG ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_catalog_items',
    description: 'List all catalog items (products, services, materials)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        page_size: { type: 'number', description: 'Items per page' },
        q: { type: 'string', description: 'Search query' },
      },
    },
  },
  {
    name: 'get_catalog_item',
    description: 'Get a single catalog item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Catalog item ID' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'create_catalog_item',
    description: 'Create a new catalog item',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Item name' },
        description: { type: 'string', description: 'Item description' },
        price: { type: 'number', description: 'Unit price' },
        unit: { type: 'string', description: 'Unit of measure' },
        category: { type: 'string', description: 'Category' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_catalog_item',
    description: 'Update a catalog item',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Catalog item ID' },
        name: { type: 'string', description: 'New name' },
        price: { type: 'number', description: 'New price' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'delete_catalog_item',
    description: 'Delete a catalog item',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Catalog item ID' },
      },
      required: ['itemId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LINE ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_project_line_items',
    description: 'List all line items for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'replace_project_line_items',
    description: 'Replace all line items for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        lineItems: {
          type: 'array',
          description: 'Array of line items',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
            },
          },
        },
      },
      required: ['projectId', 'lineItems'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_project_files',
    description: 'Get all files for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_request_files',
    description: 'Get all files for a request',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
      },
      required: ['requestId'],
    },
  },
  {
    name: 'upload_project_file_from_url',
    description: 'Upload a file to a project from URL',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        fileUrl: { type: 'string', description: 'URL of file to upload' },
        fileName: { type: 'string', description: 'Name for the file' },
      },
      required: ['projectId', 'fileUrl'],
    },
  },
  {
    name: 'delete_project_file',
    description: 'Delete a file from a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        fileId: { type: 'string', description: 'File ID' },
      },
      required: ['projectId', 'fileId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS & TEAMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_users',
    description: 'List all users in the organization',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_teams',
    description: 'List all teams in the organization',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_roles',
    description: 'List all roles available',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'invite_user',
    description: 'Invite a new user to the organization',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email address to invite' },
        roleId: { type: 'number', description: 'Role ID to assign' },
        teamIds: { type: 'array', items: { type: 'number' }, description: 'Team IDs to add to' },
      },
      required: ['email'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOWS & PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_workflows',
    description: 'List all workflows (project templates)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_workflow',
    description: 'Get a single workflow by ID',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID' },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'list_properties',
    description: 'List all custom properties (fields) defined in the system',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tool Execution
// ─────────────────────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    // Projects
    case 'list_projects': return get('/projects', args);
    case 'search_projects': return get('/projects/search', args);
    case 'get_project': return get(`/projects/${args.projectId}`);
    case 'create_project': return post('/projects', args);
    case 'update_project': return patch(`/projects/${args.projectId}`, args);
    case 'delete_project': return del(`/projects/${args.projectId}`);

    // Requests
    case 'list_requests': return get('/requests', args);
    case 'get_request': return get(`/requests/${args.requestId}`);
    case 'create_request': return post('/requests', args);
    case 'update_request': return patch(`/requests/${args.requestId}`, args);
    case 'delete_request': return del(`/requests/${args.requestId}`);

    // Clients
    case 'list_clients': return get('/clients', args);
    case 'get_client': return get(`/clients/${args.clientId}`);
    case 'create_client': return post('/clients', args);
    case 'update_client': return patch(`/clients/${args.clientId}`, args);
    case 'delete_client': return del(`/clients/${args.clientId}`);

    // Work Orders
    case 'list_work_orders': return get('/work-orders', args);
    case 'list_project_work_orders': return get(`/projects/${args.projectId}/work-orders`);
    case 'list_request_work_orders': return get(`/requests/${args.requestId}/work-orders`);
    case 'list_client_work_orders': return get(`/clients/${args.clientId}/work-orders`);
    case 'get_work_order': return get(`/work-orders/${args.workOrderId}`);
    case 'list_work_order_templates': return get('/work-orders/templates');
    case 'create_project_work_order': return post(`/projects/${args.projectId}/work-orders`, args);
    case 'create_request_work_order': return post(`/requests/${args.requestId}/work-orders`, args);
    case 'create_client_work_order': return post(`/clients/${args.clientId}/work-orders`, args);
    case 'update_project_work_order': return patch(`/projects/${args.projectId}/work-orders/${args.workOrderId}`, args);
    case 'delete_project_work_order': return del(`/projects/${args.projectId}/work-orders/${args.workOrderId}`);

    // Invoices
    case 'list_invoices': return get('/invoices', args);
    case 'get_invoice': return get(`/invoices/${args.invoiceId}`);
    case 'get_project_invoices': return get(`/projects/${args.projectId}/invoices`);
    case 'get_client_invoices': return get(`/clients/${args.clientId}/invoices`);
    case 'create_invoice': return post('/invoices', args);
    case 'update_invoice': return patch(`/invoices/${args.invoiceId}`, args);
    case 'delete_invoice': return del(`/invoices/${args.invoiceId}`);

    // Forms
    case 'list_project_forms': return get(`/projects/${args.projectId}/forms`, { status: args.status });
    case 'get_form': return get(`/forms/${args.formId}`);
    case 'update_form': return patch(`/forms/${args.formId}`, args);
    case 'attach_file_to_form': return post(`/forms/${args.formId}/fields/${args.fieldId}/file`, args);

    // Calls
    case 'list_project_calls': return get(`/projects/${args.projectId}/calls`);
    case 'list_request_calls': return get(`/requests/${args.requestId}/calls`);
    case 'list_client_calls': return get(`/clients/${args.clientId}/calls`);
    case 'create_project_call': return post(`/projects/${args.projectId}/calls`, args);
    case 'create_request_call': return post(`/requests/${args.requestId}/calls`, args);
    case 'create_client_call': return post(`/clients/${args.clientId}/calls`, args);

    // Catalog Items
    case 'list_catalog_items': return get('/catalog-items', args);
    case 'get_catalog_item': return get(`/catalog-items/${args.itemId}`);
    case 'create_catalog_item': return post('/catalog-items', args);
    case 'update_catalog_item': return patch(`/catalog-items/${args.itemId}`, args);
    case 'delete_catalog_item': return del(`/catalog-items/${args.itemId}`);

    // Line Items
    case 'list_project_line_items': return get(`/projects/${args.projectId}/line-items`);
    case 'replace_project_line_items': return post(`/projects/${args.projectId}/line-items`, args);

    // Files
    case 'get_project_files': return get(`/projects/${args.projectId}/files`);
    case 'get_request_files': return get(`/requests/${args.requestId}/files`);
    case 'upload_project_file_from_url': return post(`/projects/${args.projectId}/files/url`, args);
    case 'delete_project_file': return del(`/projects/${args.projectId}/files/${args.fileId}`);

    // Users & Teams
    case 'list_users': return get('/users');
    case 'list_teams': return get('/users/teams');
    case 'list_roles': return get('/users/roles');
    case 'invite_user': return post('/users/invite', args);

    // Workflows & Properties
    case 'list_workflows': return get('/workflows');
    case 'get_workflow': return get(`/workflows/${args.workflowId}`);
    case 'list_properties': return get('/properties');

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'coperniq-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await executeTool(name, args as Record<string, unknown> || {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Resources - Static Knowledge
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCES = [
  {
    uri: 'coperniq://trades/hvac',
    name: 'HVAC Trade Knowledge',
    description: 'HVAC certifications, codes, and best practices',
    mimeType: 'text/plain',
  },
  {
    uri: 'coperniq://trades/electrical',
    name: 'Electrical Trade Knowledge',
    description: 'NEC codes, electrical safety, panel sizing',
    mimeType: 'text/plain',
  },
  {
    uri: 'coperniq://trades/plumbing',
    name: 'Plumbing Trade Knowledge',
    description: 'UPC codes, backflow certification, water heater specs',
    mimeType: 'text/plain',
  },
  {
    uri: 'coperniq://trades/solar',
    name: 'Solar Trade Knowledge',
    description: 'NABCEP, NEC 690/705, interconnection requirements',
    mimeType: 'text/plain',
  },
];

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: RESOURCES };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const knowledgeBase: Record<string, string> = {
    'coperniq://trades/hvac': `
# HVAC Trade Knowledge

## Certifications
- EPA 608 (Type I, II, III, Universal) - Refrigerant handling
- NATE (North American Technician Excellence)
- ACCA Manual J, D, S calculations

## Key Equipment Types
- Split systems (indoor/outdoor)
- Package units (RTUs)
- Mini-splits (ductless)
- Heat pumps
- Furnaces (gas/electric)

## Common Issues
- Low refrigerant (check for leaks)
- Dirty filters
- Capacitor failures
- Compressor issues
- Thermostat problems
    `,
    'coperniq://trades/electrical': `
# Electrical Trade Knowledge

## Code References
- NEC (National Electrical Code) - Updated every 3 years
- OSHA 29 CFR 1926 - Construction safety
- Local amendments vary by jurisdiction

## Service Size Calculations
- 200A typical for modern homes
- 100A for smaller/older homes
- Commercial: Load calculations per NEC Article 220

## Safety Requirements
- Arc-fault protection (AFCI)
- Ground-fault protection (GFCI)
- Proper bonding and grounding
    `,
    'coperniq://trades/plumbing': `
# Plumbing Trade Knowledge

## Code References
- UPC (Uniform Plumbing Code) - Western US
- IPC (International Plumbing Code) - Eastern US
- Local amendments apply

## Certifications
- Backflow prevention tester
- Cross-connection specialist
- Master plumber license

## Common Services
- Water heater replacement
- Drain cleaning
- Fixture installation
- Re-piping (copper, PEX, CPVC)
    `,
    'coperniq://trades/solar': `
# Solar Trade Knowledge

## Certifications
- NABCEP PV Installation Professional
- NABCEP PV Associate
- Electrical license requirements vary

## Code Requirements
- NEC Article 690 (PV Systems)
- NEC Article 705 (Interconnection)
- UL 1703/1741 equipment standards

## Interconnection Process
1. Application submission
2. Engineering review
3. Permit approval
4. Installation inspection
5. Utility meter installation
6. Permission to Operate (PTO)
    `,
  };

  const content = knowledgeBase[uri];
  if (!content) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'text/plain',
        text: content,
      },
    ],
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Prompts - Pre-built Workflows
// ─────────────────────────────────────────────────────────────────────────────

const PROMPTS = [
  {
    name: 'hvac_inspection',
    description: 'HVAC system inspection workflow',
    arguments: [
      { name: 'projectId', description: 'Project ID', required: true },
    ],
  },
  {
    name: 'solar_commissioning',
    description: 'Solar PV commissioning checklist',
    arguments: [
      { name: 'projectId', description: 'Project ID', required: true },
    ],
  },
  {
    name: 'daily_dispatch',
    description: 'Generate daily dispatch summary',
    arguments: [],
  },
];

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: PROMPTS };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'hvac_inspection':
      return {
        description: 'HVAC Inspection Workflow',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Perform an HVAC inspection for project ${args?.projectId}. Check:
1. Filter condition
2. Refrigerant levels
3. Electrical connections
4. Thermostat operation
5. Ductwork condition
6. Safety controls

Use the Coperniq tools to:
1. Get project details
2. List existing work orders
3. Create inspection form entries
4. Update project status`,
            },
          },
        ],
      };

    case 'solar_commissioning':
      return {
        description: 'Solar PV Commissioning',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Commission solar PV system for project ${args?.projectId}. Verify:
1. All panels installed correctly
2. Inverter connected and communicating
3. Monitoring system active
4. Safety disconnects labeled
5. Interconnection paperwork complete

Document results and update project status.`,
            },
          },
        ],
      };

    case 'daily_dispatch':
      return {
        description: 'Daily Dispatch Summary',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate today's dispatch summary:
1. List all open work orders
2. Show technician assignments
3. Identify urgent/priority items
4. Flag any scheduling conflicts
5. Summarize by trade and region`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Coperniq MCP Server running on stdio');
  console.error(`Connected to: ${COPERNIQ_API_URL}`);
  console.error(`Tools available: ${TOOLS.length}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
