/**
 * HTTP Server Wrapper for Coperniq MCP Server
 *
 * Exposes the MCP server as an HTTP API for:
 * - RunPod serverless deployment
 * - Cloud access from voice agents
 * - Any HTTP-based AI agent framework
 *
 * NO OpenAI - Claude only
 */

import http from 'http';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '8080', 10);
const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const API_KEY = process.env.COPERNIQ_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// Coperniq API Client
// ─────────────────────────────────────────────────────────────────────────────

async function coperniqFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  if (!API_KEY) {
    throw new Error('COPERNIQ_API_KEY not configured');
  }

  const url = `${COPERNIQ_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': API_KEY,
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

// ─────────────────────────────────────────────────────────────────────────────
// Tool Definitions (same as MCP server)
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  // Work Orders
  { name: 'get_work_orders', description: 'Get work orders', category: 'work_orders' },
  { name: 'create_work_order', description: 'Create work order', category: 'work_orders' },
  { name: 'update_work_order', description: 'Update work order', category: 'work_orders' },
  { name: 'delete_work_order', description: 'Delete work order', category: 'work_orders' },
  // Clients
  { name: 'get_clients', description: 'Get clients', category: 'clients' },
  { name: 'get_client', description: 'Get client by ID', category: 'clients' },
  { name: 'create_client', description: 'Create client', category: 'clients' },
  { name: 'update_client', description: 'Update client', category: 'clients' },
  { name: 'delete_client', description: 'Delete client', category: 'clients' },
  // Projects
  { name: 'get_projects', description: 'Get projects', category: 'projects' },
  { name: 'get_project', description: 'Get project by ID', category: 'projects' },
  { name: 'create_project', description: 'Create project', category: 'projects' },
  { name: 'update_project', description: 'Update project', category: 'projects' },
  { name: 'delete_project', description: 'Delete project', category: 'projects' },
  // Requests
  { name: 'get_requests', description: 'Get service requests', category: 'requests' },
  { name: 'create_request', description: 'Create service request', category: 'requests' },
  { name: 'update_request', description: 'Update service request', category: 'requests' },
  { name: 'delete_request', description: 'Delete service request', category: 'requests' },
  // Contacts
  { name: 'get_contacts', description: 'Get contacts', category: 'contacts' },
  // Catalog Items
  { name: 'get_catalog_items', description: 'Get catalog items', category: 'catalog' },
  { name: 'get_catalog_item', description: 'Get catalog item by ID', category: 'catalog' },
  { name: 'create_catalog_item', description: 'Create catalog item', category: 'catalog' },
  { name: 'update_catalog_item', description: 'Update catalog item', category: 'catalog' },
  { name: 'delete_catalog_item', description: 'Delete catalog item', category: 'catalog' },
  // Invoices
  { name: 'get_invoices', description: 'Get invoices', category: 'invoices' },
  { name: 'create_invoice', description: 'Create invoice', category: 'invoices' },
  { name: 'update_invoice', description: 'Update invoice', category: 'invoices' },
  { name: 'delete_invoice', description: 'Delete invoice', category: 'invoices' },
  // Forms
  { name: 'get_project_forms', description: 'Get forms for project', category: 'forms' },
  { name: 'update_form', description: 'Update form', category: 'forms' },
  // Files
  { name: 'get_project_files', description: 'Get project files', category: 'files' },
  { name: 'get_request_files', description: 'Get request files', category: 'files' },
  { name: 'delete_file', description: 'Delete file', category: 'files' },
  // Calls
  { name: 'get_calls', description: 'Get call logs', category: 'calls' },
  { name: 'log_call', description: 'Log a call', category: 'calls' },
  // Line Items
  { name: 'get_line_items', description: 'Get line items', category: 'line_items' },
  { name: 'add_line_item', description: 'Add line item', category: 'line_items' },
  // Users & Teams
  { name: 'get_users', description: 'Get users', category: 'users' },
  { name: 'get_teams', description: 'Get teams', category: 'users' },
  { name: 'get_roles', description: 'Get roles', category: 'users' },
  // Workflows & Properties
  { name: 'get_workflows', description: 'Get workflows', category: 'config' },
  { name: 'get_properties', description: 'Get custom properties', category: 'config' },
  { name: 'get_work_order_templates', description: 'Get work order templates', category: 'config' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tool Execution
// ─────────────────────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    // Work Orders
    case 'get_work_orders':
      return coperniqFetch('/work-orders');
    case 'create_work_order': {
      const { projectId, clientId, ...body } = args;
      let endpoint = '/work-orders';
      if (projectId) endpoint = `/projects/${projectId}/work-orders`;
      else if (clientId) endpoint = `/clients/${clientId}/work-orders`;
      return coperniqFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
    }
    case 'update_work_order': {
      const { workOrderId, ...body } = args;
      return coperniqFetch(`/work-orders/${workOrderId}`, { method: 'PATCH', body: JSON.stringify(body) });
    }
    case 'delete_work_order':
      return coperniqFetch(`/work-orders/${args.workOrderId}`, { method: 'DELETE' });

    // Clients
    case 'get_clients':
      return coperniqFetch('/clients');
    case 'get_client':
      return coperniqFetch(`/clients/${args.clientId}`);
    case 'create_client':
      return coperniqFetch('/clients', { method: 'POST', body: JSON.stringify(args) });
    case 'update_client': {
      const { clientId, ...body } = args;
      return coperniqFetch(`/clients/${clientId}`, { method: 'PATCH', body: JSON.stringify(body) });
    }
    case 'delete_client':
      return coperniqFetch(`/clients/${args.clientId}`, { method: 'DELETE' });

    // Projects
    case 'get_projects':
      return coperniqFetch('/projects');
    case 'get_project':
      return coperniqFetch(`/projects/${args.projectId}`);
    case 'create_project':
      return coperniqFetch('/projects', { method: 'POST', body: JSON.stringify(args) });
    case 'update_project': {
      const { projectId, ...body } = args;
      return coperniqFetch(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(body) });
    }
    case 'delete_project':
      return coperniqFetch(`/projects/${args.projectId}`, { method: 'DELETE' });

    // Requests
    case 'get_requests':
      return coperniqFetch('/requests');
    case 'create_request':
      return coperniqFetch('/requests', { method: 'POST', body: JSON.stringify(args) });
    case 'update_request': {
      const { requestId, ...body } = args;
      return coperniqFetch(`/requests/${requestId}`, { method: 'PATCH', body: JSON.stringify(body) });
    }
    case 'delete_request':
      return coperniqFetch(`/requests/${args.requestId}`, { method: 'DELETE' });

    // Contacts
    case 'get_contacts':
      return coperniqFetch('/contacts');

    // Catalog Items
    case 'get_catalog_items':
      return coperniqFetch('/catalog-items');
    case 'get_catalog_item':
      return coperniqFetch(`/catalog-items/${args.itemId}`);
    case 'create_catalog_item':
      return coperniqFetch('/catalog-items', { method: 'POST', body: JSON.stringify(args) });
    case 'update_catalog_item': {
      const { itemId, ...body } = args;
      return coperniqFetch(`/catalog-items/${itemId}`, { method: 'PATCH', body: JSON.stringify(body) });
    }
    case 'delete_catalog_item':
      return coperniqFetch(`/catalog-items/${args.itemId}`, { method: 'DELETE' });

    // Invoices
    case 'get_invoices': {
      if (args.projectId) return coperniqFetch(`/projects/${args.projectId}/invoices`);
      if (args.clientId) return coperniqFetch(`/clients/${args.clientId}/invoices`);
      return coperniqFetch('/invoices');
    }
    case 'create_invoice':
      return coperniqFetch('/invoices', { method: 'POST', body: JSON.stringify(args) });
    case 'update_invoice': {
      const { invoiceId, ...body } = args;
      return coperniqFetch(`/invoices/${invoiceId}`, { method: 'PATCH', body: JSON.stringify(body) });
    }
    case 'delete_invoice':
      return coperniqFetch(`/invoices/${args.invoiceId}`, { method: 'DELETE' });

    // Forms
    case 'get_project_forms':
      return coperniqFetch(`/projects/${args.projectId}/forms`);
    case 'update_form': {
      const { formId, ...body } = args;
      return coperniqFetch(`/forms/${formId}`, { method: 'PATCH', body: JSON.stringify(body) });
    }

    // Files
    case 'get_project_files':
      return coperniqFetch(`/projects/${args.projectId}/files`);
    case 'get_request_files':
      return coperniqFetch(`/requests/${args.requestId}/files`);
    case 'delete_file': {
      if (args.projectId) return coperniqFetch(`/projects/${args.projectId}/files/${args.fileId}`, { method: 'DELETE' });
      if (args.requestId) return coperniqFetch(`/requests/${args.requestId}/files/${args.fileId}`, { method: 'DELETE' });
      return coperniqFetch(`/files/${args.fileId}`, { method: 'DELETE' });
    }

    // Calls
    case 'get_calls': {
      if (args.projectId) return coperniqFetch(`/projects/${args.projectId}/calls`);
      if (args.clientId) return coperniqFetch(`/clients/${args.clientId}/calls`);
      return coperniqFetch('/calls');
    }
    case 'log_call': {
      const { projectId, clientId, ...body } = args;
      let endpoint = '/calls';
      if (projectId) endpoint = `/projects/${projectId}/calls`;
      else if (clientId) endpoint = `/clients/${clientId}/calls`;
      return coperniqFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
    }

    // Line Items
    case 'get_line_items': {
      if (args.projectId) return coperniqFetch(`/projects/${args.projectId}/line-items`);
      if (args.requestId) return coperniqFetch(`/requests/${args.requestId}/line-items`);
      if (args.invoiceId) return coperniqFetch(`/invoices/${args.invoiceId}/line-items`);
      return coperniqFetch('/line-items');
    }
    case 'add_line_item': {
      const { projectId, requestId, invoiceId, ...body } = args;
      let endpoint = '/line-items';
      if (projectId) endpoint = `/projects/${projectId}/line-items`;
      else if (requestId) endpoint = `/requests/${requestId}/line-items`;
      else if (invoiceId) endpoint = `/invoices/${invoiceId}/line-items`;
      return coperniqFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
    }

    // Users & Teams
    case 'get_users':
      return coperniqFetch('/users');
    case 'get_teams':
      return coperniqFetch('/users/teams');
    case 'get_roles':
      return coperniqFetch('/users/roles');

    // Config
    case 'get_workflows':
      return coperniqFetch('/workflows');
    case 'get_properties':
      return coperniqFetch('/properties');
    case 'get_work_order_templates':
      return coperniqFetch('/work-orders/templates');

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Request Handlers
// ─────────────────────────────────────────────────────────────────────────────

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Server
// ─────────────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  try {
    // Health check
    if (url.pathname === '/health' || url.pathname === '/') {
      sendJson(res, 200, {
        status: 'healthy',
        name: 'Coperniq MCP Server',
        version: '1.0.0',
        tools: TOOLS.length,
        coperniq: !!API_KEY,
      });
      return;
    }

    // List tools
    if (url.pathname === '/tools' && req.method === 'GET') {
      sendJson(res, 200, { tools: TOOLS });
      return;
    }

    // Execute tool
    if (url.pathname === '/execute' && req.method === 'POST') {
      const body = await parseBody(req);
      const { tool, args } = body as { tool: string; args: Record<string, unknown> };

      if (!tool) {
        sendJson(res, 400, { error: 'Tool name required' });
        return;
      }

      console.log(`[MCP] Executing tool: ${tool}`, args);
      const result = await executeTool(tool, args || {});
      sendJson(res, 200, { success: true, result });
      return;
    }

    // RunPod serverless handler format
    if (url.pathname === '/runsync' || url.pathname === '/run') {
      const body = await parseBody(req);
      const input = body.input as { tool: string; args: Record<string, unknown> } | undefined;

      if (!input?.tool) {
        sendJson(res, 400, { error: 'input.tool required' });
        return;
      }

      console.log(`[RunPod] Executing: ${input.tool}`);
      const result = await executeTool(input.tool, input.args || {});
      sendJson(res, 200, { output: { success: true, result } });
      return;
    }

    // 404
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('[Server Error]', error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Coperniq MCP Server - HTTP Mode                       ║
╠════════════════════════════════════════════════════════════════╣
║  URL:      http://localhost:${PORT}                               ║
║  Health:   GET  /health                                         ║
║  Tools:    GET  /tools                                          ║
║  Execute:  POST /execute { tool, args }                         ║
║  RunPod:   POST /runsync { input: { tool, args } }              ║
║                                                                  ║
║  Coperniq: ${API_KEY ? '✓ Connected' : '✗ No API Key'}                                     ║
║  Tools:    ${TOOLS.length} available                                          ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export { server };
