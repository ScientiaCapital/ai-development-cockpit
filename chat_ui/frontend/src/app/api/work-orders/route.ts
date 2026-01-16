/**
 * Work Orders API Route - Coperniq Proxy
 *
 * Proxies requests to Coperniq API for work order management.
 * Pattern from: coperniq-unified/services/coperniq/client.py
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

// Cache TTL: 60 seconds to prevent rate limiting
const CACHE_TTL = 60;

// Coperniq uses "Tasks" not "WorkOrders" - this maps to their schema
interface CoperniqTask {
  id: string;
  title: string;
  status: string;
  priority?: string;
  trade?: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  projectId?: string;
  description?: string;
}

export async function GET(request: NextRequest) {
  // Get instance from header or query param, default to 388 (Kipper Energy)
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') ||
    '388';

  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    console.error(`COPERNIQ_API_KEY not configured for instance ${instanceId}`);
    return NextResponse.json(
      { error: `API key not configured for instance ${instanceId}`, work_orders: [] },
      { status: 500 }
    );
  }

  try {
    // Coperniq uses /requests for work orders (verified endpoint)
    // Also fetch /projects for context
    // Add caching to prevent rate limiting (429 errors)
    const [requestsRes, projectsRes] = await Promise.all([
      fetch(`${COPERNIQ_API_URL}/requests`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        next: { revalidate: CACHE_TTL }, // Cache for 60 seconds
      }),
      fetch(`${COPERNIQ_API_URL}/projects`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        next: { revalidate: CACHE_TTL }, // Cache for 60 seconds
      }),
    ]);

    if (!requestsRes.ok && !projectsRes.ok) {
      throw new Error(`Coperniq API error: requests=${requestsRes.status}, projects=${projectsRes.status}`);
    }

    const requests = requestsRes.ok ? await requestsRes.json() : [];
    const projects = projectsRes.ok ? await projectsRes.json() : [];

    // Combine and transform to work orders
    const workOrders = [
      ...transformRequestsToWorkOrders(Array.isArray(requests) ? requests : requests.data || []),
      ...transformProjectsToWorkOrders(Array.isArray(projects) ? projects : projects.data || []),
    ];

    return NextResponse.json({
      work_orders: workOrders,
      source: 'coperniq',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      counts: {
        requests: Array.isArray(requests) ? requests.length : (requests.data?.length || 0),
        projects: Array.isArray(projects) ? projects.length : (projects.data?.length || 0),
      },
    });
  } catch (error) {
    console.error(`Coperniq API error (instance ${instanceId}):`, error);

    // Return demo data on error so UI still works
    return NextResponse.json({
      work_orders: getDemoWorkOrders(),
      source: 'demo',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      error: `Using demo data - Coperniq instance ${instanceId} connection failed`,
    });
  }
}

export async function POST(request: NextRequest) {
  // Get instance from header or query param
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') ||
    '388';

  const apiKey = getCoperniqApiKey(instanceId);

  if (!apiKey) {
    return NextResponse.json(
      { error: `API key not configured for instance ${instanceId}` },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${COPERNIQ_API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Coperniq API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to create work order (instance ${instanceId}):`, error);
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    );
  }
}

// Coperniq Request schema (service tickets)
interface CoperniqRequest {
  id: number;
  title: string;
  status: string;
  priority?: string;
  trade?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  client?: {
    id: number;
    name: string;
  };
  primaryContact?: {
    id: number;
    name: string;
  };
  address?: string[];
}

// Coperniq Project schema (longer-term jobs)
interface CoperniqProject {
  id: number;
  title: string;
  status: string;
  stage?: string;
  trade?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  client?: {
    id: number;
    name: string;
  };
  primaryContact?: {
    id: number;
    name: string;
  };
  address?: string[];
}

// Transform Coperniq requests to WorkOrder format
function transformRequestsToWorkOrders(requests: CoperniqRequest[]) {
  if (!Array.isArray(requests)) {
    return [];
  }

  return requests.map((req) => ({
    id: `req-${req.id}`,
    title: req.title || 'Untitled Request',
    status: mapStatus(req.status),
    priority: req.priority || 'normal',
    trade: req.trade || 'General',
    orderType: inferOrderType(req.title, req.description), // Infer from content
    customer: req.client?.name || req.primaryContact?.name || 'Unassigned',
    address: Array.isArray(req.address) ? req.address.join(', ') : '',
    scheduledDate: req.dueDate,
    createdAt: req.createdAt || new Date().toISOString(),
    description: req.description,
    type: 'request',
  }));
}

// Transform Coperniq projects to WorkOrder format
function transformProjectsToWorkOrders(projects: CoperniqProject[]) {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects.map((proj) => ({
    id: `proj-${proj.id}`,
    title: proj.title || 'Untitled Project',
    status: mapProjectStatus(proj.status, proj.stage),
    priority: 'normal',
    trade: proj.trade || 'General',
    orderType: inferOrderType(proj.title, proj.description), // Infer from content
    customer: proj.client?.name || proj.primaryContact?.name || 'Unassigned',
    address: Array.isArray(proj.address) ? proj.address.join(', ') : '',
    scheduledDate: proj.startDate || proj.endDate,
    createdAt: proj.createdAt || new Date().toISOString(),
    description: proj.description,
    type: 'project',
  }));
}

// Infer order type from title and description
// work = standard dispatched jobs
// office = admin, billing, callbacks, estimates
// field = tech-created while on-site
function inferOrderType(title?: string, description?: string): 'work' | 'office' | 'field' {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  // Office keywords: callbacks, billing, admin tasks
  const officeKeywords = ['callback', 'billing', 'invoice', 'quote', 'estimate', 'follow-up', 'admin', 'office', 'review'];
  if (officeKeywords.some(kw => text.includes(kw))) return 'office';

  // Field keywords: tech-discovered issues on-site
  const fieldKeywords = ['found issue', 'discovered', 'additional work', 'add-on', 'while on-site', 'on site'];
  if (fieldKeywords.some(kw => text.includes(kw))) return 'field';

  // Default: standard work order
  return 'work';
}

// Transform Coperniq tasks to our WorkOrder format (legacy - for POST)
function transformToWorkOrders(tasks: CoperniqTask[]) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks.map((task) => ({
    id: task.id,
    title: task.title || 'Untitled Task',
    status: mapStatus(task.status),
    priority: task.priority || 'normal',
    trade: task.trade || 'General',
    customer: task.assignedTo || 'Unassigned',
    address: '', // Not in task, would come from project/site
    scheduledDate: task.dueDate,
    createdAt: task.createdAt || new Date().toISOString(),
    description: task.description,
  }));
}

// Map Coperniq status to our status format
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'in_progress',
    'ON_HOLD': 'pending',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'SCHEDULED': 'scheduled',
  };
  return statusMap[status?.toUpperCase()] || 'pending';
}

// Map Coperniq project status/stage to our status format
function mapProjectStatus(status: string, stage?: string): string {
  // Projects have both status and stage - stage is more specific
  if (stage) {
    const stageMap: Record<string, string> = {
      'LEAD': 'pending',
      'PROPOSAL': 'pending',
      'SOLD': 'scheduled',
      'IN_PROGRESS': 'in_progress',
      'INSTALL': 'in_progress',
      'INSPECTION': 'in_progress',
      'COMPLETE': 'completed',
      'CLOSED': 'completed',
      'CANCELLED': 'cancelled',
    };
    return stageMap[stage.toUpperCase()] || mapStatus(status);
  }
  return mapStatus(status);
}

// Demo data for development/fallback
// Includes all three order types: work, office, field
function getDemoWorkOrders() {
  return [
    // ===== WORK ORDERS (standard dispatched jobs) =====
    {
      id: 'demo-1',
      title: 'AC Unit Not Cooling',
      status: 'scheduled',
      priority: 'high',
      trade: 'HVAC',
      orderType: 'work',
      customer: 'John Smith',
      address: '123 Main St, Birmingham, AL',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'demo-2',
      title: 'Water Heater Replacement',
      status: 'in_progress',
      priority: 'normal',
      trade: 'Plumbing',
      orderType: 'work',
      customer: 'Sarah Johnson',
      address: '456 Oak Ave, Atlanta, GA',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      technicianName: 'Mike T.',
    },
    {
      id: 'demo-3',
      title: 'Panel Upgrade 100A to 200A',
      status: 'pending',
      priority: 'normal',
      trade: 'Electrical',
      orderType: 'work',
      customer: 'ABC Company',
      address: '789 Commerce Blvd, Tampa, FL',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'demo-4',
      title: 'Solar Panel Maintenance',
      status: 'completed',
      priority: 'low',
      trade: 'Solar',
      orderType: 'work',
      customer: 'Green Energy LLC',
      address: '321 Sunset Dr, Nashville, TN',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },

    // ===== OFFICE ORDERS (admin tasks, callbacks, billing) =====
    {
      id: 'demo-5',
      title: 'Callback - HVAC Quote Follow-up',
      status: 'pending',
      priority: 'normal',
      trade: 'HVAC',
      orderType: 'office',
      customer: 'Tech Solutions Inc',
      address: '500 Corporate Dr, Miami, FL',
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 'demo-6',
      title: 'Billing Review - Johnson Residence',
      status: 'in_progress',
      priority: 'normal',
      trade: 'Plumbing',
      orderType: 'office',
      customer: 'Johnson Residence',
      address: '222 Maple St, Orlando, FL',
      createdAt: new Date(Date.now() - 1200000).toISOString(),
      technicianName: 'Admin',
    },
    {
      id: 'demo-7',
      title: 'Quote Estimate - New Construction',
      status: 'pending',
      priority: 'high',
      trade: 'Electrical',
      orderType: 'office',
      customer: 'BuildRight Construction',
      address: '100 Builder Way, Charlotte, NC',
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },

    // ===== FIELD ORDERS (tech-created while on-site) =====
    {
      id: 'demo-8',
      title: 'Found Issue: Ductwork Leak',
      status: 'pending',
      priority: 'high',
      trade: 'HVAC',
      orderType: 'field',
      customer: 'John Smith',
      address: '123 Main St, Birmingham, AL',
      createdAt: new Date(Date.now() - 300000).toISOString(),
      technicianName: 'Carlos R.',
    },
    {
      id: 'demo-9',
      title: 'Discovered: Corroded Pipe - Additional Work',
      status: 'scheduled',
      priority: 'normal',
      trade: 'Plumbing',
      orderType: 'field',
      customer: 'Sarah Johnson',
      address: '456 Oak Ave, Atlanta, GA',
      createdAt: new Date(Date.now() - 450000).toISOString(),
      technicianName: 'Mike T.',
    },
    {
      id: 'demo-10',
      title: 'Add-on: Install GFCI Outlets',
      status: 'in_progress',
      priority: 'normal',
      trade: 'Electrical',
      orderType: 'field',
      customer: 'ABC Company',
      address: '789 Commerce Blvd, Tampa, FL',
      createdAt: new Date(Date.now() - 150000).toISOString(),
      technicianName: 'Dave L.',
    },
  ];
}
