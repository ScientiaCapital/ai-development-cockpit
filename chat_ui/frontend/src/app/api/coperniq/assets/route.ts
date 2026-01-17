/**
 * Coperniq Assets API Route
 * CRUD operations for equipment and assets
 *
 * Endpoints:
 * - GET /api/coperniq/assets - List all assets
 * - GET /api/coperniq/assets?id=123 - Get single asset
 * - GET /api/coperniq/assets?siteId=456 - Get assets at a site
 * - POST /api/coperniq/assets - Create new asset
 * - PUT /api/coperniq/assets?id=123 - Update asset
 * - DELETE /api/coperniq/assets?id=123 - Delete asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const CACHE_TTL = 60; // 1 minute cache

// Common HVAC equipment types for validation/suggestions
const EQUIPMENT_TYPES = [
  'Air Conditioner',
  'Furnace',
  'Heat Pump',
  'Mini Split',
  'Package Unit',
  'Boiler',
  'Water Heater',
  'Tankless Water Heater',
  'Thermostat',
  'Air Handler',
  'Ductless',
  'Solar Panels',
  'Inverter',
  'Battery',
  'Electrical Panel',
  'Generator',
  'Fire Alarm Panel',
  'Sprinkler System',
  'Backflow Preventer',
];

// GET: List assets, get by ID, or filter by site
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
  const siteId = request.nextUrl.searchParams.get('siteId');
  const includeTypes = request.nextUrl.searchParams.get('includeTypes') === 'true';

  try {
    // Get single asset by ID
    if (id) {
      const res = await fetch(`${COPERNIQ_API_URL}/assets/${id}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }
        throw new Error(`Coperniq API error: ${res.status}`);
      }

      const asset = await res.json();
      return NextResponse.json({
        asset: transformAsset(asset),
        instance: instanceInfo,
      });
    }

    // List all assets (optionally filtered by site)
    let url = `${COPERNIQ_API_URL}/assets`;
    if (siteId) {
      url += `?siteId=${siteId}`;
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
    const assets = Array.isArray(data) ? data : data.data || [];

    const response = NextResponse.json({
      assets: assets.map(transformAsset),
      count: assets.length,
      siteId: siteId || null,
      equipmentTypes: includeTypes ? EQUIPMENT_TYPES : undefined,
      instance: instanceInfo,
    });
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}`);
    return response;

  } catch (error) {
    console.error('[Assets GET] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      instance: instanceInfo,
    }, { status: 500 });
  }
}

// POST: Create new asset
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

    // Map to Coperniq asset fields
    const assetData = {
      name: body.name || `${body.manufacturer || ''} ${body.model || ''}`.trim() || 'Unnamed Asset',
      type: body.type || body.equipmentType,
      manufacturer: body.manufacturer || body.brand,
      model: body.model || body.modelNumber,
      serialNumber: body.serialNumber || body.serial,
      size: body.size || body.capacity, // e.g., "3 Ton", "50 Gallon"
      siteId: body.siteId || body.site_id,
      installDate: body.installDate || body.installed,
      warrantyExpiration: body.warrantyExpiration || body.warranty,
      notes: body.notes,
      status: body.status || 'ACTIVE',
      // Additional fields
      seer: body.seer, // HVAC efficiency rating
      afue: body.afue, // Furnace efficiency
      hspf: body.hspf, // Heat pump efficiency
      refrigerantType: body.refrigerantType || body.refrigerant,
      fuelType: body.fuelType || body.fuel,
      location: body.location, // e.g., "Attic", "Garage", "Basement"
    };

    // siteId is required
    if (!assetData.siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    const res = await fetch(`${COPERNIQ_API_URL}/assets`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assetData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const created = await res.json();
    return NextResponse.json({
      success: true,
      asset: transformAsset(created),
      instance: instanceInfo,
    }, { status: 201 });

  } catch (error) {
    console.error('[Assets POST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: Update existing asset
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
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Only include fields that are being updated
    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.type || body.equipmentType) updateData.type = body.type || body.equipmentType;
    if (body.manufacturer || body.brand) updateData.manufacturer = body.manufacturer || body.brand;
    if (body.model || body.modelNumber) updateData.model = body.model || body.modelNumber;
    if (body.serialNumber || body.serial) updateData.serialNumber = body.serialNumber || body.serial;
    if (body.size || body.capacity) updateData.size = body.size || body.capacity;
    if (body.installDate || body.installed) updateData.installDate = body.installDate || body.installed;
    if (body.warrantyExpiration || body.warranty) updateData.warrantyExpiration = body.warrantyExpiration || body.warranty;
    if (body.notes) updateData.notes = body.notes;
    if (body.status) updateData.status = body.status;
    if (body.seer) updateData.seer = body.seer;
    if (body.afue) updateData.afue = body.afue;
    if (body.hspf) updateData.hspf = body.hspf;
    if (body.refrigerantType || body.refrigerant) updateData.refrigerantType = body.refrigerantType || body.refrigerant;
    if (body.fuelType || body.fuel) updateData.fuelType = body.fuelType || body.fuel;
    if (body.location) updateData.location = body.location;

    const res = await fetch(`${COPERNIQ_API_URL}/assets/${id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const updated = await res.json();
    return NextResponse.json({
      success: true,
      asset: transformAsset(updated),
      instance: instanceInfo,
    });

  } catch (error) {
    console.error('[Assets PUT] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: Remove asset
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
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${COPERNIQ_API_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
      throw new Error(`Coperniq API error: ${res.status}`);
    }

    return NextResponse.json({ success: true, deleted: id });

  } catch (error) {
    console.error('[Assets DELETE] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Transform Coperniq asset to our format
function transformAsset(asset: Record<string, unknown>): Record<string, unknown> {
  const site = asset.site as Record<string, unknown> | undefined;

  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    manufacturer: asset.manufacturer,
    model: asset.model,
    serialNumber: asset.serialNumber,
    size: asset.size,
    siteId: asset.siteId,
    siteName: site?.name || site?.title,
    siteAddress: site?.fullAddress,
    installDate: asset.installDate,
    warrantyExpiration: asset.warrantyExpiration,
    status: asset.status,
    notes: asset.notes,
    // HVAC-specific fields
    seer: asset.seer,
    afue: asset.afue,
    hspf: asset.hspf,
    refrigerantType: asset.refrigerantType,
    fuelType: asset.fuelType,
    location: asset.location,
    // Computed fields
    age: calculateAge(asset.installDate as string),
    warrantyStatus: calculateWarrantyStatus(asset.warrantyExpiration as string),
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

function calculateAge(installDate?: string): string | null {
  if (!installDate) return null;
  const installed = new Date(installDate);
  const now = new Date();
  const years = Math.floor((now.getTime() - installed.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) return 'Less than 1 year';
  if (years === 1) return '1 year';
  return `${years} years`;
}

function calculateWarrantyStatus(warrantyExpiration?: string): string {
  if (!warrantyExpiration) return 'unknown';
  const expiry = new Date(warrantyExpiration);
  const now = new Date();
  if (expiry < now) return 'expired';
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (daysRemaining <= 90) return 'expiring_soon';
  return 'active';
}
