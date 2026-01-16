/**
 * Customers API Route - Coperniq Proxy
 *
 * Proxies requests to Coperniq API for customer/client management.
 * Maps to Coperniq /v1/clients endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

// Cache TTL: 60 seconds to prevent rate limiting
const CACHE_TTL = 60;

// Coperniq Client schema
interface CoperniqClient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string[];
  city?: string;
  state?: string;
  zip?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  type?: string;
  notes?: string;
  companyName?: string;
}

// Our Customer format for the UI
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'lead';
  projectCount?: number;
  totalRevenue?: number;
}

export async function GET(request: NextRequest) {
  // Get instance from header or query param, default to 388 (Kipper Energy)
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') ||
    '388';

  const searchQuery = request.nextUrl.searchParams.get('search') || '';

  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    console.error(`COPERNIQ_API_KEY not configured for instance ${instanceId}`);
    return NextResponse.json(
      { error: `API key not configured for instance ${instanceId}`, customers: getDemoCustomers() },
      { status: 200 } // Return demo data with 200 so UI still works
    );
  }

  try {
    // Coperniq uses /clients for customers
    // Add Next.js caching to prevent rate limiting
    const clientsRes = await fetch(`${COPERNIQ_API_URL}/clients`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: CACHE_TTL }, // Cache for 60 seconds
    });

    if (!clientsRes.ok) {
      throw new Error(`Coperniq API error: ${clientsRes.status}`);
    }

    const clients = await clientsRes.json();
    const clientsArray = Array.isArray(clients) ? clients : clients.data || [];

    // Transform to our Customer format
    let customers = transformClientsToCustomers(clientsArray);

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.companyName?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query)
      );
    }

    const response = NextResponse.json({
      customers,
      source: 'coperniq',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      total: customers.length,
    });
    // Add cache headers to prevent rate limiting
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`);
    return response;
  } catch (error) {
    console.error(`Coperniq API error (instance ${instanceId}):`, error);

    // Return demo data on error so UI still works
    let demoCustomers = getDemoCustomers();

    // Filter demo data by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      demoCustomers = demoCustomers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.companyName?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      customers: demoCustomers,
      source: 'demo',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      error: `Using demo data - Coperniq instance ${instanceId} connection failed`,
      total: demoCustomers.length,
    });
  }
}

// Transform Coperniq clients to our Customer format
function transformClientsToCustomers(clients: CoperniqClient[]): Customer[] {
  if (!Array.isArray(clients)) {
    return [];
  }

  // Log first client to see actual schema from Coperniq
  if (clients.length > 0) {
    console.log('Coperniq Client Schema Sample:', JSON.stringify(clients[0], null, 2));
  }

  return clients.map((client) => {
    // Coperniq /clients returns projects/sites - title is the main identifier
    const clientAny = client as unknown as Record<string, unknown>;
    const name = clientAny.title as string ||
      client.name ||
      clientAny.displayName ||
      clientAny.fullName ||
      (clientAny.firstName || clientAny.lastName
        ? `${clientAny.firstName || ''} ${clientAny.lastName || ''}`.trim()
        : null) ||
      clientAny.companyName ||
      'Unknown Customer';

    return {
      id: `client-${client.id}`,
      name: name as string,
      email: client.email,
      phone: client.phone,
      address: formatAddress(client),
      companyName: client.companyName,
      createdAt: client.createdAt || new Date().toISOString(),
      status: mapClientStatus(client.status),
      projectCount: 0, // Would need additional API call to get project count
      totalRevenue: 0, // Would need additional API call
    };
  });
}

function formatAddress(client: CoperniqClient): string {
  const parts = [];
  if (client.address && Array.isArray(client.address)) {
    parts.push(...client.address);
  }
  if (client.city) parts.push(client.city);
  if (client.state) parts.push(client.state);
  if (client.zip) parts.push(client.zip);
  return parts.join(', ');
}

function mapClientStatus(status?: string): 'active' | 'inactive' | 'lead' {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('lead') || statusLower.includes('prospect')) return 'lead';
  if (statusLower.includes('inactive') || statusLower.includes('closed')) return 'inactive';
  return 'active';
}

// Demo data for development/fallback
function getDemoCustomers(): Customer[] {
  return [
    {
      id: 'demo-1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(205) 555-0123',
      address: '123 Main St, Birmingham, AL 35203',
      companyName: undefined,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      status: 'active',
      projectCount: 3,
      totalRevenue: 4500,
    },
    {
      id: 'demo-2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(404) 555-0456',
      address: '456 Oak Ave, Atlanta, GA 30301',
      companyName: undefined,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      status: 'active',
      projectCount: 2,
      totalRevenue: 2800,
    },
    {
      id: 'demo-3',
      name: 'Mike Wilson',
      email: 'mike.wilson@techsolutions.com',
      phone: '(813) 555-0789',
      address: '789 Commerce Blvd, Tampa, FL 33601',
      companyName: 'Tech Solutions Inc',
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      status: 'active',
      projectCount: 5,
      totalRevenue: 12500,
    },
    {
      id: 'demo-4',
      name: 'Emily Davis',
      email: 'emily.d@greenenergy.com',
      phone: '(615) 555-0321',
      address: '321 Sunset Dr, Nashville, TN 37201',
      companyName: 'Green Energy LLC',
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      status: 'active',
      projectCount: 1,
      totalRevenue: 8900,
    },
    {
      id: 'demo-5',
      name: 'Robert Brown',
      email: 'rbrown@buildright.com',
      phone: '(704) 555-0654',
      address: '100 Builder Way, Charlotte, NC 28201',
      companyName: 'BuildRight Construction',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      status: 'lead',
      projectCount: 0,
      totalRevenue: 0,
    },
    {
      id: 'demo-6',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@email.com',
      phone: '(407) 555-0987',
      address: '222 Maple St, Orlando, FL 32801',
      companyName: undefined,
      createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
      status: 'active',
      projectCount: 4,
      totalRevenue: 6200,
    },
    {
      id: 'demo-7',
      name: 'James Martinez',
      email: 'jmartinez@commercialservice.com',
      phone: '(305) 555-0147',
      address: '500 Corporate Dr, Miami, FL 33101',
      companyName: 'Commercial Service Co',
      createdAt: new Date(Date.now() - 86400000 * 200).toISOString(),
      status: 'inactive',
      projectCount: 8,
      totalRevenue: 24000,
    },
    {
      id: 'demo-8',
      name: 'Jennifer Taylor',
      email: 'j.taylor@propertygroup.com',
      phone: '(901) 555-0258',
      address: '800 Real Estate Pkwy, Memphis, TN 38101',
      companyName: 'Taylor Property Group',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      status: 'lead',
      projectCount: 0,
      totalRevenue: 0,
    },
  ];
}
