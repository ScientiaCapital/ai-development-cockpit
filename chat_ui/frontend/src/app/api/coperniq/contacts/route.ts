/**
 * Coperniq Contacts API Route
 * CRUD operations for customer contacts
 *
 * Endpoints:
 * - GET /api/coperniq/contacts - List all contacts
 * - GET /api/coperniq/contacts?id=123 - Get single contact
 * - GET /api/coperniq/contacts?phone=5121234567 - Lookup by phone
 * - POST /api/coperniq/contacts - Create new contact
 * - PUT /api/coperniq/contacts?id=123 - Update contact
 * - DELETE /api/coperniq/contacts?id=123 - Delete contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const CACHE_TTL = 60; // 1 minute cache for contact lists

// Normalize phone number for lookup (last 10 digits)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

// GET: List contacts, get by ID, or lookup by phone
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
  const phone = request.nextUrl.searchParams.get('phone');

  try {
    // Lookup by phone number
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      const res = await fetch(`${COPERNIQ_API_URL}/clients`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Coperniq API error: ${res.status}`);
      }

      const clients = await res.json();
      const data = Array.isArray(clients) ? clients : clients.data || [];

      // Search for matching phone (check multiple phone fields)
      const match = data.find((client: Record<string, unknown>) => {
        const phones = [
          client.phone,
          client.primaryPhone,
          client.mobilePhone,
          client.workPhone,
          ...(Array.isArray(client.phones) ? client.phones.map((p: { number: string }) => p.number) : []),
        ].filter(Boolean);

        return phones.some((p: unknown) => normalizePhone(String(p)) === normalizedPhone);
      });

      return NextResponse.json({
        found: !!match,
        contact: match ? transformContact(match) : null,
        searchedPhone: normalizedPhone,
        instance: instanceInfo,
      });
    }

    // Get single contact by ID
    if (id) {
      const res = await fetch(`${COPERNIQ_API_URL}/clients/${id}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }
        throw new Error(`Coperniq API error: ${res.status}`);
      }

      const contact = await res.json();
      return NextResponse.json({
        contact: transformContact(contact),
        instance: instanceInfo,
      });
    }

    // List all contacts
    const res = await fetch(`${COPERNIQ_API_URL}/clients`, {
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
    const contacts = Array.isArray(data) ? data : data.data || [];

    const response = NextResponse.json({
      contacts: contacts.map(transformContact),
      count: contacts.length,
      instance: instanceInfo,
    });
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}`);
    return response;

  } catch (error) {
    console.error('[Contacts GET] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      instance: instanceInfo,
    }, { status: 500 });
  }
}

// POST: Create new contact
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

    // Map to Coperniq contact fields
    const contactData = {
      name: body.name,
      title: body.name, // Coperniq sometimes uses title
      email: body.email,
      primaryEmail: body.email,
      phone: body.phone,
      primaryPhone: body.phone,
      mobilePhone: body.mobile,
      address: body.address,
      street: body.street,
      city: body.city,
      state: body.state,
      zipcode: body.zip || body.zipcode,
      clientType: body.type || 'RESIDENTIAL',
      source: body.source || 'PHONE',
      notes: body.notes,
    };

    const res = await fetch(`${COPERNIQ_API_URL}/clients`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const created = await res.json();
    return NextResponse.json({
      success: true,
      contact: transformContact(created),
      instance: instanceInfo,
    }, { status: 201 });

  } catch (error) {
    console.error('[Contacts POST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: Update existing contact
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
    return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Only include fields that are being updated
    const updateData: Record<string, unknown> = {};
    if (body.name) { updateData.name = body.name; updateData.title = body.name; }
    if (body.email) { updateData.email = body.email; updateData.primaryEmail = body.email; }
    if (body.phone) { updateData.phone = body.phone; updateData.primaryPhone = body.phone; }
    if (body.mobile) updateData.mobilePhone = body.mobile;
    if (body.address) updateData.address = body.address;
    if (body.street) updateData.street = body.street;
    if (body.city) updateData.city = body.city;
    if (body.state) updateData.state = body.state;
    if (body.zip || body.zipcode) updateData.zipcode = body.zip || body.zipcode;
    if (body.type) updateData.clientType = body.type;
    if (body.notes) updateData.notes = body.notes;

    const res = await fetch(`${COPERNIQ_API_URL}/clients/${id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const updated = await res.json();
    return NextResponse.json({
      success: true,
      contact: transformContact(updated),
      instance: instanceInfo,
    });

  } catch (error) {
    console.error('[Contacts PUT] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: Remove contact
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
    return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${COPERNIQ_API_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      throw new Error(`Coperniq API error: ${res.status}`);
    }

    return NextResponse.json({ success: true, deleted: id });

  } catch (error) {
    console.error('[Contacts DELETE] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Transform Coperniq client to our contact format
function transformContact(client: Record<string, unknown>): Record<string, unknown> {
  return {
    id: client.id,
    name: client.title || client.name || 'Unknown',
    email: client.primaryEmail || client.email,
    phone: client.primaryPhone || client.phone,
    mobile: client.mobilePhone,
    address: formatAddress(client),
    street: client.street,
    city: client.city,
    state: client.state,
    zip: client.zipcode || client.zip,
    type: client.clientType,
    source: client.source,
    notes: client.notes,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

function formatAddress(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  if (obj.street) parts.push(obj.street as string);
  if (obj.city) parts.push(obj.city as string);
  if (obj.state) parts.push(obj.state as string);
  if (obj.zipcode || obj.zip) parts.push((obj.zipcode || obj.zip) as string);
  return parts.join(', ');
}
