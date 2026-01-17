/**
 * Coperniq Tasks API Route
 * CRUD operations for work orders, service calls, and scheduled visits
 *
 * Endpoints:
 * - GET /api/coperniq/tasks - List all tasks
 * - GET /api/coperniq/tasks?id=123 - Get single task
 * - GET /api/coperniq/tasks?date=2026-01-16 - Get tasks for a date
 * - GET /api/coperniq/tasks?assigneeId=456 - Get tasks for a technician
 * - GET /api/coperniq/tasks?status=NEW - Filter by status
 * - POST /api/coperniq/tasks - Create new task
 * - PUT /api/coperniq/tasks?id=123 - Update task
 * - DELETE /api/coperniq/tasks?id=123 - Delete task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const CACHE_TTL = 30; // 30 second cache (tasks change frequently)

// Task status values
const TASK_STATUSES = ['NEW', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

// Task priority values
const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

// Task types
const TASK_TYPES = ['SERVICE_CALL', 'MAINTENANCE', 'INSTALLATION', 'INSPECTION', 'REPAIR', 'CALLBACK', 'OTHER'];

// GET: List tasks with various filters
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
  const date = request.nextUrl.searchParams.get('date');
  const assigneeId = request.nextUrl.searchParams.get('assigneeId');
  const status = request.nextUrl.searchParams.get('status');
  const siteId = request.nextUrl.searchParams.get('siteId');
  const assetId = request.nextUrl.searchParams.get('assetId');
  const includeOptions = request.nextUrl.searchParams.get('includeOptions') === 'true';

  try {
    // Get single task by ID
    if (id) {
      const res = await fetch(`${COPERNIQ_API_URL}/tasks/${id}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        throw new Error(`Coperniq API error: ${res.status}`);
      }

      const task = await res.json();
      return NextResponse.json({
        task: transformTask(task),
        instance: instanceInfo,
      });
    }

    // Build query parameters for filtering
    const queryParams = new URLSearchParams();
    if (assigneeId) queryParams.set('assigneeId', assigneeId);
    if (status) queryParams.set('status', status);
    if (siteId) queryParams.set('siteId', siteId);
    if (assetId) queryParams.set('assetId', assetId);

    // Date filtering - get tasks for a specific date or date range
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      queryParams.set('startDate', startOfDay.toISOString());
      queryParams.set('endDate', endOfDay.toISOString());
    }

    const url = `${COPERNIQ_API_URL}/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

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
    const tasks = Array.isArray(data) ? data : data.data || [];

    // Apply local date filtering if Coperniq doesn't support it
    let filteredTasks = tasks;
    if (date && filteredTasks.length > 0) {
      const targetDate = new Date(date).toDateString();
      filteredTasks = tasks.filter((task: Record<string, unknown>) => {
        const taskDate = task.startDate || task.scheduledDate || task.dueDate;
        if (!taskDate) return false;
        return new Date(taskDate as string).toDateString() === targetDate;
      });
    }

    const response = NextResponse.json({
      tasks: filteredTasks.map(transformTask),
      count: filteredTasks.length,
      filters: {
        date: date || null,
        assigneeId: assigneeId || null,
        status: status || null,
        siteId: siteId || null,
        assetId: assetId || null,
      },
      options: includeOptions ? { statuses: TASK_STATUSES, priorities: TASK_PRIORITIES, types: TASK_TYPES } : undefined,
      instance: instanceInfo,
    });
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}`);
    return response;

  } catch (error) {
    console.error('[Tasks GET] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      instance: instanceInfo,
    }, { status: 500 });
  }
}

// POST: Create new task
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

    // Map to Coperniq task fields
    const taskData = {
      title: body.title || body.name,
      description: body.description || body.notes,
      status: body.status || 'NEW',
      priority: body.priority || 'NORMAL',
      type: body.type || 'SERVICE_CALL',
      // Scheduling
      startDate: body.startDate || body.scheduledDate,
      endDate: body.endDate,
      dueDate: body.dueDate,
      isField: body.isField !== false, // Default to field work
      // Relationships
      assigneeId: body.assigneeId || body.technicianId,
      siteId: body.siteId,
      assetId: body.assetId,
      projectId: body.projectId,
      clientId: body.clientId,
      // Trade info
      trade: body.trade,
      estimatedHours: body.estimatedHours || body.duration,
      // Customer info (for service calls)
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
    };

    const res = await fetch(`${COPERNIQ_API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const created = await res.json();
    return NextResponse.json({
      success: true,
      task: transformTask(created),
      instance: instanceInfo,
    }, { status: 201 });

  } catch (error) {
    console.error('[Tasks POST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: Update existing task
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
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Only include fields that are being updated
    const updateData: Record<string, unknown> = {};
    if (body.title || body.name) updateData.title = body.title || body.name;
    if (body.description || body.notes) updateData.description = body.description || body.notes;
    if (body.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.type) updateData.type = body.type;
    if (body.startDate || body.scheduledDate) updateData.startDate = body.startDate || body.scheduledDate;
    if (body.endDate) updateData.endDate = body.endDate;
    if (body.dueDate) updateData.dueDate = body.dueDate;
    if (body.isField !== undefined) updateData.isField = body.isField;
    if (body.assigneeId || body.technicianId) updateData.assigneeId = body.assigneeId || body.technicianId;
    if (body.siteId) updateData.siteId = body.siteId;
    if (body.assetId) updateData.assetId = body.assetId;
    if (body.projectId) updateData.projectId = body.projectId;
    if (body.trade) updateData.trade = body.trade;
    if (body.estimatedHours || body.duration) updateData.estimatedHours = body.estimatedHours || body.duration;

    const res = await fetch(`${COPERNIQ_API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      const errorText = await res.text();
      throw new Error(`Coperniq API error: ${res.status} - ${errorText}`);
    }

    const updated = await res.json();
    return NextResponse.json({
      success: true,
      task: transformTask(updated),
      instance: instanceInfo,
    });

  } catch (error) {
    console.error('[Tasks PUT] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: Remove task
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
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${COPERNIQ_API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      throw new Error(`Coperniq API error: ${res.status}`);
    }

    return NextResponse.json({ success: true, deleted: id });

  } catch (error) {
    console.error('[Tasks DELETE] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Transform Coperniq task to our format
function transformTask(task: Record<string, unknown>): Record<string, unknown> {
  const site = task.site as Record<string, unknown> | undefined;
  const asset = task.asset as Record<string, unknown> | undefined;
  const assignee = task.assignee as Record<string, unknown> | undefined;
  const client = task.client as Record<string, unknown> | undefined;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    type: task.type,
    trade: task.trade,
    // Scheduling
    startDate: task.startDate,
    endDate: task.endDate,
    dueDate: task.dueDate,
    scheduledDate: task.startDate || task.scheduledDate,
    isField: task.isField,
    estimatedHours: task.estimatedHours,
    // Assignee (technician)
    assigneeId: task.assigneeId,
    assigneeName: assignee?.name || assignee?.firstName ? `${assignee?.firstName} ${assignee?.lastName}`.trim() : null,
    // Site/Location
    siteId: task.siteId,
    siteName: site?.name || site?.title,
    siteAddress: site?.fullAddress,
    // Asset/Equipment
    assetId: task.assetId,
    assetName: asset?.name,
    assetType: asset?.type,
    // Client
    clientId: task.clientId,
    clientName: client?.name || client?.title,
    clientPhone: client?.phone || client?.primaryPhone,
    // Metadata
    projectId: task.projectId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
  };
}
