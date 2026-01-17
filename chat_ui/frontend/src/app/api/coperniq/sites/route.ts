/**
 * Coperniq Sites API Route
 * CRUD operations for customer service locations
 *
 * Endpoints:
 * - GET /api/coperniq/sites - List all sites
 * - GET /api/coperniq/sites?id=123 - Get single site
 * - GET /api/coperniq/sites?clientId=456 - Get sites for a client
 * - POST /api/coperniq/sites - Create new site
 * - PUT /api/coperniq/sites?id=123 - Update site
 * - DELETE /api/coperniq/sites?id=123 - Delete site
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const CACHE_TTL = 60; // 1 minute cache

// GET: List sites, get by ID, or filter by client
export async function GET(request: NextRequest) {
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') || '388';
  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    return NextResponse.json({
      error: `API key not configured for instance ${instanceId}`,
      instance: instanceInfo,
    }, { status: 500 });
  }

  const id = request.nextUrl.searchParams.get('id');
  const clientId = request.nextUrl.searchParams.get('clientId');

  try {
    // Get single site by ID
    if (id) {
      const res = await fetch(`${COPERNIQ_API_URL}/sites/${id}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: 'Site not found' }, { status: 404 });
        }
        throw new Error(`Coperniq API error: ${res.status}`);
      }

      const site = await res.json();
      return NextResponse.json({
        site: transformSite(site),
        instance: instanceInfo,
      });
    }

    // List all sites (optionally filtered by client)
    let url = `${COPERNIQ_API_URL}/sites`;
    if (clientId) {
      url += `?clientId=${clientId}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: CACHE_TTL },
    });

    if (!res.ok) {
      throw new Error(`Coperniq API error: ${res.status}`);
    }

    const data = await res.json();
    const sites = Array.isArray(data) ? data : data.data || [];

    const response = NextResponse.json({
      sites: sites.map(transformSite),
      count: sites.length,
      clientId: clientId || null,
      instance: instanceInfo,
    });
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}`);
    return response;

  } catch (error) {
    console.error('[Sites GET] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      instance: instanceInfo,
    }, { status: 500 });
  }
}

// POST: Create new site
export async function POST(request: NextRequest) {
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') || '388';
  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    return NextResponse.json({
      error: `API key not configured for instance ${instanceId}`,
    }, { status: 500 });
  }

  try {
    const body = await request.json();

    // Map to Coperniq site fields
    const siteData = {
      name: body.name || body.title,
      title: body.name || body.title,
      street: body.street || body.address,
      city: body.city,
      state: body.state,
      zipcode: body.zip || body.zipcode,
      fullAddress: body.fullAddress || formatFullAddress(body),
      clientId: body.clientId || body.client_id,
      timezone: body.timezone || 'America/Chicago', // Austin, TX default
      notes: body.notes,
      propertyType: body.propertyType || body.type,
      sqft: body.sqft,
      yearBuilt: body.yearBuilt,
    };

    // clientId is required
    if (!siteData.clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const res = await fetch(`${COPERNIQ_API_URL}/sites`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(siteData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const created = await res.json();
    return NextResponse.json({
      success: true,
      site: transformSite(created),
      instance: instanceInfo,
    }, { status: 201 });

  } catch (error) {
    console.error('[Sites POST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: Update existing site
export async function PUT(request: NextRequest) {
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') || '388';
  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);
  const id = request.nextUrl.searchParams.get('id');

  if (!apiKey) {
    return NextResponse.json({
      error: `API key not configured for instance ${instanceId}`,
    }, { status: 500 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Site ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Only include fields that are being updated
    const updateData: Record<string, unknown> = {};
    if (body.name) { updateData.name = body.name; updateData.title = body.name; }
    if (body.street || body.address) updateData.street = body.street || body.address;
    if (body.city) updateData.city = body.city;
    if (body.state) updateData.state = body.state;
    if (body.zip || body.zipcode) updateData.zipcode = body.zip || body.zipcode;
    if (body.fullAddress) updateData.fullAddress = body.fullAddress;
    if (body.timezone) updateData.timezone = body.timezone;
    if (body.notes) updateData.notes = body.notes;
    if (body.propertyType || body.type) updateData.propertyType = body.propertyType || body.type;
    if (body.sqft) updateData.sqft = body.sqft;
    if (body.yearBuilt) updateData.yearBuilt = body.yearBuilt;

    const res = await fetch(`${COPERNIQ_API_URL}/sites/${id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const updated = await res.json();
    return NextResponse.json({
      success: true,
      site: transformSite(updated),
      instance: instanceInfo,
    });

  } catch (error) {
    console.error('[Sites PUT] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: Remove site
export async function DELETE(request: NextRequest) {
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') || '388';
  const apiKey = getCoperniqApiKey(instanceId);
  const id = request.nextUrl.searchParams.get('id');

  if (!apiKey) {
    return NextResponse.json({
      error: `API key not configured for instance ${instanceId}`,
    }, { status: 500 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Site ID required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${COPERNIQ_API_URL}/sites/${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }
      throw new Error(`Coperniq API error: ${res.status}`);
    }

    return NextResponse.json({ success: true, deleted: id });

  } catch (error) {
    console.error('[Sites DELETE] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Transform Coperniq site to our format
function transformSite(site: Record<string, unknown>): Record<string, unknown> {
  const client = site.client as Record<string, unknown> | undefined;

  return {
    id: site.id,
    name: site.title || site.name,
    fullAddress: site.fullAddress || formatFullAddress(site),
    street: site.street,
    city: site.city,
    state: site.state,
    zip: site.zipcode || site.zip,
    timezone: site.timezone,
    clientId: site.clientId,
    clientName: client?.name || client?.title,
    propertyType: site.propertyType,
    sqft: site.sqft,
    yearBuilt: site.yearBuilt,
    notes: site.notes,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
  };
}

function formatFullAddress(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  if (obj.street || obj.address) parts.push((obj.street || obj.address) as string);
  if (obj.city) parts.push(obj.city as string);
  if (obj.state) parts.push(obj.state as string);
  if (obj.zipcode || obj.zip) parts.push((obj.zipcode || obj.zip) as string);
  return parts.join(', ');
}
