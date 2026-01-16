/**
 * Unified Coperniq API Route
 *
 * Fetches all Coperniq data in a single request with staggered calls
 * to avoid rate limiting (429 errors).
 *
 * Instead of 5 parallel requests hitting Coperniq simultaneously,
 * this endpoint makes sequential calls with delays.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

// Delay between API calls to avoid rate limiting (ms)
const REQUEST_DELAY = 200;

// Cache the response for 60 seconds
const CACHE_TTL = 60;

// Simple delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') ||
    '388';

  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    console.error(`COPERNIQ_API_KEY not configured for instance ${instanceId}`);
    return NextResponse.json({
      error: `API key not configured for instance ${instanceId}`,
      source: 'error',
      instance: instanceInfo,
    }, { status: 500 });
  }

  const results: Record<string, unknown> = {
    source: 'coperniq',
    instance: instanceInfo,
    timestamp: new Date().toISOString(),
  };

  const errors: string[] = [];

  // Helper to fetch from Coperniq with error handling
  async function fetchCoperniq(endpoint: string, name: string) {
    try {
      const res = await fetch(`${COPERNIQ_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        next: { revalidate: CACHE_TTL },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${name}: ${msg}`);
      console.error(`Coperniq ${name} error:`, msg);
      return null;
    }
  }

  // Fetch data sequentially with delays to avoid rate limiting
  // Order: clients, projects, requests (most important first)

  console.log(`[Coperniq All] Starting sequential fetch for instance ${instanceId}`);

  // 1. Clients (customers)
  const clients = await fetchCoperniq('/clients', 'clients');
  results.customers = clients ? transformClients(clients) : null;
  results.customersCount = clients?.length || 0;

  await delay(REQUEST_DELAY);

  // 2. Projects
  const projects = await fetchCoperniq('/projects', 'projects');
  results.projects = projects ? transformProjects(projects) : null;
  results.projectsCount = projects?.length || 0;

  await delay(REQUEST_DELAY);

  // 3. Requests (service requests)
  const requests = await fetchCoperniq('/requests', 'requests');
  results.requests = requests ? transformRequests(requests) : null;
  results.requestsCount = requests?.length || 0;

  await delay(REQUEST_DELAY);

  // 4. Work Orders (combines requests + projects for schedule view)
  // Already have the data, just transform differently
  results.workOrders = [
    ...(requests ? transformRequestsToWorkOrders(requests) : []),
    ...(projects ? transformProjectsToWorkOrders(projects) : []),
  ];
  results.workOrdersCount = results.workOrders.length;

  // 5. Invoices - Coperniq may use /invoices or /financial-documents
  // Try invoices first
  await delay(REQUEST_DELAY);
  let invoices = await fetchCoperniq('/invoices', 'invoices');
  if (!invoices) {
    // Try financial-documents as fallback
    invoices = await fetchCoperniq('/financial-documents', 'financial-documents');
  }
  results.invoices = invoices ? transformInvoices(invoices) : null;
  results.invoicesCount = invoices?.length || 0;

  // Add errors if any
  if (errors.length > 0) {
    results.errors = errors;
    results.source = errors.length === 5 ? 'error' : 'partial';
  }

  console.log(`[Coperniq All] Completed: customers=${results.customersCount}, projects=${results.projectsCount}, requests=${results.requestsCount}, invoices=${results.invoicesCount}`);

  const response = NextResponse.json(results);
  response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`);
  return response;
}

// Transform functions (simplified versions)

function transformClients(clients: unknown[]): unknown[] {
  return clients.map((client: Record<string, unknown>) => ({
    id: `client-${client.id}`,
    name: client.title || client.name || 'Unknown',
    email: client.email,
    phone: client.phone,
    address: formatAddress(client),
    createdAt: client.createdAt || new Date().toISOString(),
    status: 'active',
  }));
}

function transformProjects(projects: unknown[]): unknown[] {
  return projects.map((proj: Record<string, unknown>) => ({
    id: `proj-${proj.id}`,
    title: proj.title || 'Untitled Project',
    customer: (proj.client as Record<string, unknown>)?.name || 'Unassigned',
    address: formatAddress(proj),
    stage: mapProjectStage(proj.status as string, proj.stage as string),
    trade: proj.trade || 'General',
    estimatedValue: proj.estimatedValue,
    createdAt: proj.createdAt || new Date().toISOString(),
    progress: calculateProgress(proj.status as string, proj.stage as string),
  }));
}

function transformRequests(requests: unknown[]): unknown[] {
  return requests.map((req: Record<string, unknown>) => ({
    id: `request-${req.id}`,
    title: req.title || req.subject || 'Service Request',
    description: req.description,
    customer: (req.customer as Record<string, unknown>)?.name || 'Unknown',
    priority: mapPriority(req.priority as string),
    status: mapRequestStatus(req.status as string),
    source: mapSource(req.source as string),
    trade: req.trade,
    createdAt: req.createdAt || new Date().toISOString(),
  }));
}

function transformRequestsToWorkOrders(requests: unknown[]): unknown[] {
  return requests.map((req: Record<string, unknown>) => ({
    id: `req-${req.id}`,
    title: req.title || 'Service Request',
    status: mapStatus(req.status as string),
    priority: req.priority || 'normal',
    trade: req.trade || 'General',
    orderType: inferOrderType(req.title as string, req.description as string),
    customer: (req.client as Record<string, unknown>)?.name || 'Unassigned',
    address: formatAddress(req),
    scheduledDate: req.dueDate,
    createdAt: req.createdAt || new Date().toISOString(),
    type: 'request',
  }));
}

function transformProjectsToWorkOrders(projects: unknown[]): unknown[] {
  return projects.map((proj: Record<string, unknown>) => ({
    id: `proj-${proj.id}`,
    title: proj.title || 'Untitled Project',
    status: mapProjectStatusToWorkOrder(proj.status as string, proj.stage as string),
    priority: 'normal',
    trade: proj.trade || 'General',
    orderType: inferOrderType(proj.title as string, proj.description as string),
    customer: (proj.client as Record<string, unknown>)?.name || 'Unassigned',
    address: formatAddress(proj),
    scheduledDate: proj.startDate || proj.endDate,
    createdAt: proj.createdAt || new Date().toISOString(),
    type: 'project',
  }));
}

function transformInvoices(invoices: unknown[]): unknown[] {
  return invoices.map((inv: Record<string, unknown>) => ({
    id: `inv-${inv.id}`,
    invoiceNumber: inv.invoiceNumber || inv.number || `INV-${inv.id}`,
    customer: (inv.client as Record<string, unknown>)?.name || 'Unknown',
    amount: inv.amount || inv.total || 0,
    status: mapInvoiceStatus(inv.status as string),
    dueDate: inv.dueDate,
    createdAt: inv.createdAt || new Date().toISOString(),
  }));
}

// Helper functions

function formatAddress(obj: Record<string, unknown>): string {
  const parts = [];
  if (obj.address && Array.isArray(obj.address)) {
    parts.push(...obj.address);
  } else if (obj.street) {
    parts.push(obj.street);
  }
  if (obj.city) parts.push(obj.city);
  if (obj.state) parts.push(obj.state);
  if (obj.zip || obj.zipcode) parts.push(obj.zip || obj.zipcode);
  return parts.join(', ');
}

function mapProjectStage(status?: string, stage?: string): string {
  const s = (stage || status || '').toUpperCase();
  if (s.includes('LEAD')) return 'lead';
  if (s.includes('PROPOSAL')) return 'proposal';
  if (s.includes('SOLD')) return 'sold';
  if (s.includes('PROGRESS') || s.includes('ACTIVE')) return 'in_progress';
  if (s.includes('COMPLETE')) return 'complete';
  if (s.includes('CANCEL')) return 'cancelled';
  return 'lead';
}

function calculateProgress(status?: string, stage?: string): number {
  const mapped = mapProjectStage(status, stage);
  const progressMap: Record<string, number> = {
    lead: 10, proposal: 25, sold: 40, in_progress: 65, complete: 100, cancelled: 0,
  };
  return progressMap[mapped] || 10;
}

function mapPriority(priority?: string): string {
  const p = (priority || '').toLowerCase();
  if (p.includes('emergency') || p.includes('urgent')) return 'emergency';
  if (p.includes('high')) return 'high';
  if (p.includes('low')) return 'low';
  return 'normal';
}

function mapRequestStatus(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('convert')) return 'converted';
  if (s.includes('schedul')) return 'scheduled';
  if (s.includes('contact')) return 'contacted';
  return 'new';
}

function mapSource(source?: string): string {
  const s = (source || '').toLowerCase();
  if (s.includes('phone')) return 'phone';
  if (s.includes('email')) return 'email';
  if (s.includes('web')) return 'web';
  if (s.includes('sms')) return 'sms';
  return 'other';
}

function mapStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'in_progress',
    'ON_HOLD': 'pending',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'SCHEDULED': 'scheduled',
  };
  return statusMap[(status || '').toUpperCase()] || 'pending';
}

function mapProjectStatusToWorkOrder(status?: string, stage?: string): string {
  if (stage) {
    const stageMap: Record<string, string> = {
      'LEAD': 'pending',
      'PROPOSAL': 'pending',
      'SOLD': 'scheduled',
      'IN_PROGRESS': 'in_progress',
      'COMPLETE': 'completed',
      'CANCELLED': 'cancelled',
    };
    return stageMap[(stage || '').toUpperCase()] || mapStatus(status);
  }
  return mapStatus(status);
}

function inferOrderType(title?: string, description?: string): 'work' | 'office' | 'field' {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const officeKeywords = ['callback', 'billing', 'invoice', 'quote', 'estimate', 'follow-up', 'admin'];
  if (officeKeywords.some(kw => text.includes(kw))) return 'office';
  const fieldKeywords = ['found issue', 'discovered', 'additional work', 'add-on', 'on-site'];
  if (fieldKeywords.some(kw => text.includes(kw))) return 'field';
  return 'work';
}

function mapInvoiceStatus(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('paid')) return 'paid';
  if (s.includes('overdue') || s.includes('past')) return 'overdue';
  if (s.includes('draft')) return 'draft';
  if (s.includes('void') || s.includes('cancel')) return 'cancelled';
  return 'pending';
}
