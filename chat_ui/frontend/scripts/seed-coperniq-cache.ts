#!/usr/bin/env node
/**
 * Pre-seed Coperniq Cache
 *
 * Fetches real Coperniq data locally (where API works) and saves it
 * as a static JSON file for deployment. This provides REAL data as
 * a fallback when Vercel is rate-limited.
 *
 * Usage:
 *   node scripts/seed-coperniq-cache.mjs
 *   OR
 *   npm run seed:coperniq
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually from .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const OUTPUT_PATH = join(__dirname, '..', 'public', 'coperniq-cache.json');
const DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchEndpoint(endpoint: string, apiKey: string): Promise<unknown[]> {
  console.log(`  Fetching ${endpoint}...`);
  const res = await fetch(`${COPERNIQ_API_URL}${endpoint}`, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error(`  ❌ ${endpoint}: HTTP ${res.status}`);
    return [];
  }

  const data = await res.json();
  const items = Array.isArray(data) ? data : data.data || [];
  console.log(`  ✅ ${endpoint}: ${items.length} items`);
  return items;
}

async function main() {
  const apiKey = envVars.COPERNIQ_API_KEY;

  if (!apiKey) {
    console.error('❌ COPERNIQ_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Seeding Coperniq cache with real data from Instance 388...\n');

  // Fetch all endpoints with delays
  const clients = await fetchEndpoint('/clients', apiKey);
  await delay(DELAY_MS);

  const projects = await fetchEndpoint('/projects', apiKey);
  await delay(DELAY_MS);

  const requests = await fetchEndpoint('/requests', apiKey);
  await delay(DELAY_MS);

  // Invoices might not exist
  let invoices: unknown[] = [];
  try {
    invoices = await fetchEndpoint('/invoices', apiKey);
  } catch {
    console.log('  ⚠️ /invoices not available');
  }

  // Transform data
  const cache = {
    source: 'pre-seeded',
    instance: { id: 388, name: 'KES', type: 'production' },
    timestamp: new Date().toISOString(),
    seededAt: new Date().toISOString(),
    customers: transformClients(clients),
    customersCount: clients.length,
    projects: transformProjects(projects),
    projectsCount: projects.length,
    requests: transformRequests(requests),
    requestsCount: requests.length,
    workOrders: [
      ...transformRequestsToWorkOrders(requests),
      ...transformProjectsToWorkOrders(projects),
    ],
    workOrdersCount: requests.length + projects.length,
    invoices: invoices.length > 0 ? transformInvoices(invoices) : [],
    invoicesCount: invoices.length,
  };

  // Ensure public directory exists
  const publicDir = dirname(OUTPUT_PATH);
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  // Write cache file
  writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2));

  console.log(`\n✅ Cache saved to: ${OUTPUT_PATH}`);
  console.log(`   Customers: ${cache.customersCount}`);
  console.log(`   Projects: ${cache.projectsCount}`);
  console.log(`   Requests: ${cache.requestsCount}`);
  console.log(`   Work Orders: ${cache.workOrdersCount}`);
  console.log(`   Invoices: ${cache.invoicesCount}`);
}

// Transform functions (same as in route.ts)
type AnyRecord = Record<string, unknown>;

function transformClients(clients: unknown[]): AnyRecord[] {
  return (clients as AnyRecord[]).map((client) => ({
    id: `client-${client.id}`,
    name: client.title || client.name || 'Unknown',
    email: client.primaryEmail,
    phone: client.primaryPhone,
    address: formatAddress(client),
    createdAt: client.createdAt || new Date().toISOString(),
    status: 'active',
    clientType: client.clientType,
  }));
}

function transformProjects(projects: unknown[]): AnyRecord[] {
  return (projects as AnyRecord[]).map((proj) => ({
    id: `proj-${proj.id}`,
    title: proj.title || 'Untitled Project',
    customer: (proj.client as AnyRecord)?.name || 'Unassigned',
    address: formatAddress(proj),
    stage: mapProjectStage(proj.status as string, proj.stage as string),
    trade: proj.trade || 'General',
    estimatedValue: proj.estimatedValue,
    createdAt: proj.createdAt || new Date().toISOString(),
    progress: calculateProgress(proj.status as string, proj.stage as string),
  }));
}

function transformRequests(requests: unknown[]): AnyRecord[] {
  return (requests as AnyRecord[]).map((req) => ({
    id: `request-${req.id}`,
    title: req.title || req.subject || 'Service Request',
    description: req.description,
    customer: (req.customer as AnyRecord)?.name || 'Unknown',
    priority: mapPriority(req.priority as string),
    status: mapRequestStatus(req.status as string),
    source: mapSource(req.source as string),
    trade: req.trade,
    createdAt: req.createdAt || new Date().toISOString(),
  }));
}

function transformRequestsToWorkOrders(requests: unknown[]): AnyRecord[] {
  return (requests as AnyRecord[]).map((req) => ({
    id: `req-${req.id}`,
    title: req.title || 'Service Request',
    status: mapStatus(req.status as string),
    priority: req.priority || 'normal',
    trade: req.trade || 'General',
    orderType: inferOrderType(req.title as string, req.description as string),
    customer: (req.client as AnyRecord)?.name || 'Unassigned',
    address: formatAddress(req),
    scheduledDate: req.dueDate,
    createdAt: req.createdAt || new Date().toISOString(),
    type: 'request',
  }));
}

function transformProjectsToWorkOrders(projects: unknown[]): AnyRecord[] {
  return (projects as AnyRecord[]).map((proj) => ({
    id: `proj-${proj.id}`,
    title: proj.title || 'Untitled Project',
    status: mapProjectStatusToWorkOrder(proj.status as string, proj.stage as string),
    priority: 'normal',
    trade: proj.trade || 'General',
    orderType: inferOrderType(proj.title as string, proj.description as string),
    customer: (proj.client as AnyRecord)?.name || 'Unassigned',
    address: formatAddress(proj),
    scheduledDate: proj.startDate || proj.endDate,
    createdAt: proj.createdAt || new Date().toISOString(),
    type: 'project',
  }));
}

function transformInvoices(invoices: unknown[]): AnyRecord[] {
  return (invoices as AnyRecord[]).map((inv) => ({
    id: `inv-${inv.id}`,
    invoiceNumber: inv.invoiceNumber || inv.number || `INV-${inv.id}`,
    customer: (inv.client as AnyRecord)?.name || 'Unknown',
    amount: inv.amount || inv.total || 0,
    status: mapInvoiceStatus(inv.status as string),
    dueDate: inv.dueDate,
    createdAt: inv.createdAt || new Date().toISOString(),
  }));
}

// Helper functions
function formatAddress(obj: AnyRecord): string {
  const parts: string[] = [];
  if (obj.address && Array.isArray(obj.address)) {
    parts.push(...(obj.address as string[]));
  } else if (obj.street) {
    parts.push(obj.street as string);
  }
  if (obj.city) parts.push(obj.city as string);
  if (obj.state) parts.push(obj.state as string);
  if (obj.zip || obj.zipcode) parts.push((obj.zip || obj.zipcode) as string);
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

main().catch(console.error);
