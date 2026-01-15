/**
 * Work Orders API Route - Coperniq Proxy
 *
 * Proxies requests to Coperniq API for work order management.
 * Pattern from: coperniq-unified/services/coperniq/client.py
 */

import { NextRequest, NextResponse } from 'next/server';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

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
  const apiKey = process.env.COPERNIQ_API_KEY;

  if (!apiKey) {
    console.error('COPERNIQ_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured', work_orders: [] },
      { status: 500 }
    );
  }

  try {
    // Coperniq uses /requests for work orders (verified endpoint)
    // Also fetch /projects for context
    const [requestsRes, projectsRes] = await Promise.all([
      fetch(`${COPERNIQ_API_URL}/requests`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${COPERNIQ_API_URL}/projects`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
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
      counts: {
        requests: Array.isArray(requests) ? requests.length : (requests.data?.length || 0),
        projects: Array.isArray(projects) ? projects.length : (projects.data?.length || 0),
      },
    });
  } catch (error) {
    console.error('Coperniq API error:', error);

    // Return demo data on error so UI still works
    return NextResponse.json({
      work_orders: getDemoWorkOrders(),
      source: 'demo',
      error: 'Using demo data - Coperniq connection failed',
    });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.COPERNIQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
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
    console.error('Failed to create work order:', error);
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
    customer: proj.client?.name || proj.primaryContact?.name || 'Unassigned',
    address: Array.isArray(proj.address) ? proj.address.join(', ') : '',
    scheduledDate: proj.startDate || proj.endDate,
    createdAt: proj.createdAt || new Date().toISOString(),
    description: proj.description,
    type: 'project',
  }));
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
function getDemoWorkOrders() {
  return [
    {
      id: 'demo-1',
      title: 'AC Unit Not Cooling',
      status: 'scheduled',
      priority: 'high',
      trade: 'HVAC',
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
      customer: 'Green Energy LLC',
      address: '321 Sunset Dr, Nashville, TN',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}
