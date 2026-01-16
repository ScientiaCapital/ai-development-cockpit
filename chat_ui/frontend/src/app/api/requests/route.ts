/**
 * Service Requests API Route - Coperniq Proxy
 *
 * Proxies requests to Coperniq API for service request management.
 * Maps to Coperniq /v1/requests endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

// Cache TTL: 60 seconds to prevent rate limiting
const CACHE_TTL = 60;

// Coperniq Request schema
interface CoperniqRequest {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: {
    id: number;
    name?: string;
    phone?: string;
    email?: string;
  };
  address?: string;
  source?: string;
  trade?: string;
  notes?: string;
}

// Our ServiceRequest format for the UI
export interface ServiceRequest {
  id: string;
  title: string;
  description?: string;
  customer: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  priority: 'emergency' | 'high' | 'normal' | 'low';
  status: 'new' | 'contacted' | 'scheduled' | 'converted';
  source: 'phone' | 'email' | 'web' | 'sms' | 'walk-in' | 'other';
  trade?: string;
  createdAt: string;
  notes?: string;
}

export interface PriorityCounts {
  all: number;
  emergency: number;
  high: number;
  normal: number;
  low: number;
}

export async function GET(request: NextRequest) {
  // Get instance from header or query param, default to 388 (Kipper Energy)
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') ||
    '388';

  const priorityFilter = request.nextUrl.searchParams.get('priority') || '';

  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    console.error(`COPERNIQ_API_KEY not configured for instance ${instanceId}`);
    return NextResponse.json({
      error: `API key not configured for instance ${instanceId}`,
      requests: getDemoRequests(),
      priorityCounts: getDemoPriorityCounts(),
    }, { status: 200 });
  }

  try {
    // Coperniq uses /requests for service requests
    const requestsRes = await fetch(`${COPERNIQ_API_URL}/requests`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: CACHE_TTL }, // Cache for 60 seconds
    });

    if (!requestsRes.ok) {
      throw new Error(`Coperniq API error: ${requestsRes.status}`);
    }

    const data = await requestsRes.json();
    const requestsArray = Array.isArray(data) ? data : data.data || [];

    // Transform to our ServiceRequest format
    let requests = transformToServiceRequests(requestsArray);

    // Calculate priority counts
    const priorityCounts: PriorityCounts = {
      all: requests.length,
      emergency: requests.filter(r => r.priority === 'emergency').length,
      high: requests.filter(r => r.priority === 'high').length,
      normal: requests.filter(r => r.priority === 'normal').length,
      low: requests.filter(r => r.priority === 'low').length,
    };

    // Filter by priority if provided
    if (priorityFilter && priorityFilter !== 'all') {
      requests = requests.filter(r => r.priority === priorityFilter);
    }

    return NextResponse.json({
      requests,
      source: 'coperniq',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      priorityCounts,
      total: requests.length,
    });
  } catch (error) {
    console.error(`Coperniq API error (instance ${instanceId}):`, error);

    // Return demo data on error so UI still works
    let demoRequests = getDemoRequests();
    const priorityCounts = getDemoPriorityCounts();

    // Filter demo data by priority
    if (priorityFilter && priorityFilter !== 'all') {
      demoRequests = demoRequests.filter(r => r.priority === priorityFilter);
    }

    return NextResponse.json({
      requests: demoRequests,
      source: 'demo',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      priorityCounts,
      error: `Using demo data - Coperniq instance ${instanceId} connection failed`,
      total: demoRequests.length,
    });
  }
}

// Transform Coperniq requests to our ServiceRequest format
function transformToServiceRequests(requests: CoperniqRequest[]): ServiceRequest[] {
  if (!Array.isArray(requests)) {
    return [];
  }

  // Log first request to see actual schema from Coperniq
  if (requests.length > 0) {
    console.log('Coperniq Request Schema Sample:', JSON.stringify(requests[0], null, 2));
  }

  return requests.map((req) => {
    const reqAny = req as unknown as Record<string, unknown>;

    return {
      id: `request-${req.id}`,
      title: req.title || reqAny.subject as string || reqAny.name as string || 'Service Request',
      description: req.description || reqAny.body as string,
      customer: req.customer?.name || reqAny.customerName as string || 'Unknown Customer',
      customerPhone: req.customer?.phone || reqAny.phone as string,
      customerEmail: req.customer?.email || reqAny.email as string,
      address: req.address || reqAny.location as string,
      priority: mapPriority(req.priority || reqAny.priority as string),
      status: mapStatus(req.status || reqAny.status as string),
      source: mapSource(req.source || reqAny.source as string),
      trade: req.trade || reqAny.trade as string,
      createdAt: req.createdAt || new Date().toISOString(),
      notes: req.notes || reqAny.notes as string,
    };
  });
}

function mapPriority(priority?: string): 'emergency' | 'high' | 'normal' | 'low' {
  const p = priority?.toLowerCase() || '';
  if (p.includes('emergency') || p.includes('urgent') || p.includes('critical')) return 'emergency';
  if (p.includes('high')) return 'high';
  if (p.includes('low')) return 'low';
  return 'normal';
}

function mapStatus(status?: string): 'new' | 'contacted' | 'scheduled' | 'converted' {
  const s = status?.toLowerCase() || '';
  if (s.includes('convert') || s.includes('work order')) return 'converted';
  if (s.includes('schedul')) return 'scheduled';
  if (s.includes('contact')) return 'contacted';
  return 'new';
}

function mapSource(source?: string): 'phone' | 'email' | 'web' | 'sms' | 'walk-in' | 'other' {
  const s = source?.toLowerCase() || '';
  if (s.includes('phone') || s.includes('call')) return 'phone';
  if (s.includes('email')) return 'email';
  if (s.includes('web') || s.includes('online') || s.includes('form')) return 'web';
  if (s.includes('sms') || s.includes('text')) return 'sms';
  if (s.includes('walk') || s.includes('in-person')) return 'walk-in';
  return 'other';
}

function getDemoPriorityCounts(): PriorityCounts {
  return {
    all: 8,
    emergency: 2,
    high: 2,
    normal: 3,
    low: 1,
  };
}

// Demo data for development/fallback
function getDemoRequests(): ServiceRequest[] {
  return [
    {
      id: 'demo-req-1',
      title: 'AC Not Working - No Cold Air',
      description: 'Unit running but not cooling. Tried resetting thermostat.',
      customer: 'Sarah Martinez',
      customerPhone: '(512) 555-0123',
      customerEmail: 'sarah.m@email.com',
      address: '123 Oak Hill Dr, Austin, TX 78735',
      priority: 'emergency',
      status: 'new',
      source: 'phone',
      trade: 'HVAC',
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      notes: 'Customer has elderly parent at home. High heat advisory today.',
    },
    {
      id: 'demo-req-2',
      title: 'Water Heater Leaking',
      description: 'Water pooling around base of tank. Need inspection ASAP.',
      customer: 'Mike Thompson',
      customerPhone: '(512) 555-0456',
      address: '456 Maple Ave, Round Rock, TX 78681',
      priority: 'emergency',
      status: 'contacted',
      source: 'web',
      trade: 'Plumbing',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 'demo-req-3',
      title: 'Electrical Panel Sparking',
      description: 'Saw sparks when flipping breaker. Turned off main power.',
      customer: 'Lisa Anderson',
      customerPhone: '(512) 555-0789',
      address: '789 Cedar Park Blvd, Cedar Park, TX 78613',
      priority: 'high',
      status: 'new',
      source: 'phone',
      trade: 'Electrical',
      createdAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
    },
    {
      id: 'demo-req-4',
      title: 'Solar Panel Not Producing',
      description: 'Monitoring shows zero production for 3 days. Panels look clean.',
      customer: 'James Wilson',
      customerPhone: '(512) 555-0321',
      customerEmail: 'jwilson@techcompany.com',
      address: '321 Innovation Blvd, Austin, TX 78758',
      priority: 'high',
      status: 'contacted',
      source: 'email',
      trade: 'Solar',
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: 'demo-req-5',
      title: 'Furnace Making Loud Noise',
      description: 'Banging sound when furnace starts. Getting worse.',
      customer: 'Robert Garcia',
      customerPhone: '(512) 555-0654',
      address: '654 Pecan St, Pflugerville, TX 78660',
      priority: 'normal',
      status: 'new',
      source: 'phone',
      trade: 'HVAC',
      createdAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    },
    {
      id: 'demo-req-6',
      title: 'Quote Request - New AC System',
      description: 'Current unit is 15 years old. Want quote for replacement.',
      customer: 'Jennifer Davis',
      customerEmail: 'jdavis@email.com',
      address: '888 Sunset Dr, Lakeway, TX 78734',
      priority: 'normal',
      status: 'new',
      source: 'web',
      trade: 'HVAC',
      createdAt: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
    },
    {
      id: 'demo-req-7',
      title: 'Preventive Maintenance Scheduling',
      description: 'Annual HVAC maintenance. Flexible on timing.',
      customer: 'Commercial Property Group',
      customerPhone: '(512) 555-0987',
      customerEmail: 'facilities@cpg.com',
      address: '500 Corporate Blvd, Austin, TX 78701',
      priority: 'normal',
      status: 'contacted',
      source: 'email',
      trade: 'HVAC',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: 'demo-req-8',
      title: 'Thermostat Questions',
      description: 'Need help programming new smart thermostat.',
      customer: 'Emily Brown',
      customerPhone: '(512) 555-0147',
      address: '147 Congress Ave, Austin, TX 78701',
      priority: 'low',
      status: 'new',
      source: 'sms',
      trade: 'HVAC',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ];
}
