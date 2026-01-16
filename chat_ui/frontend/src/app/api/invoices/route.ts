/**
 * Invoices API Route - Coperniq Proxy
 *
 * Proxies requests to Coperniq API for invoice management.
 * Maps to Coperniq /v1/invoices endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

// Coperniq Invoice schema
interface CoperniqInvoice {
  id: number;
  invoiceNumber?: string;
  status?: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  balance?: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  client?: {
    id: number;
    name?: string;
  };
  project?: {
    id: number;
    title?: string;
  };
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

// Our Invoice format for the UI
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerId?: string;
  project?: string;
  projectId?: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  total: number;
  subtotal: number;
  tax: number;
  balance: number;
  dueDate?: string;
  createdAt: string;
  daysPastDue?: number;
  lineItemCount: number;
}

export interface InvoiceStatusCounts {
  all: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
}

export interface AgingBuckets {
  current: number;      // 0-30 days
  days30: number;       // 30-60 days
  days60: number;       // 60-90 days
  days90Plus: number;   // 90+ days
}

export async function GET(request: NextRequest) {
  // Get instance from header or query param, default to 388 (Kipper Energy)
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') ||
    '388';

  const statusFilter = request.nextUrl.searchParams.get('status') || '';

  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    console.error(`COPERNIQ_API_KEY not configured for instance ${instanceId}`);
    return NextResponse.json({
      error: `API key not configured for instance ${instanceId}`,
      invoices: getDemoInvoices(),
      statusCounts: getDemoStatusCounts(),
      agingBuckets: getDemoAgingBuckets(),
    }, { status: 200 });
  }

  try {
    // Coperniq uses /invoices for invoices
    const invoicesRes = await fetch(`${COPERNIQ_API_URL}/invoices`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!invoicesRes.ok) {
      throw new Error(`Coperniq API error: ${invoicesRes.status}`);
    }

    const data = await invoicesRes.json();
    const invoicesArray = Array.isArray(data) ? data : data.data || [];

    // Transform to our Invoice format
    let invoices = transformToInvoices(invoicesArray);

    // Calculate status counts
    const statusCounts = calculateStatusCounts(invoices);

    // Calculate aging buckets
    const agingBuckets = calculateAgingBuckets(invoices);

    // Calculate total outstanding
    const totalOutstanding = invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.balance, 0);

    // Filter by status if provided
    if (statusFilter && statusFilter !== 'all') {
      invoices = invoices.filter(inv => inv.status === statusFilter);
    }

    return NextResponse.json({
      invoices,
      source: 'coperniq',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      statusCounts,
      agingBuckets,
      totalOutstanding,
      total: invoices.length,
    });
  } catch (error) {
    console.error(`Coperniq API error (instance ${instanceId}):`, error);

    // Return demo data on error so UI still works
    let demoInvoices = getDemoInvoices();
    const statusCounts = getDemoStatusCounts();
    const agingBuckets = getDemoAgingBuckets();

    // Filter demo data by status
    if (statusFilter && statusFilter !== 'all') {
      demoInvoices = demoInvoices.filter(inv => inv.status === statusFilter);
    }

    const totalOutstanding = demoInvoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.balance, 0);

    return NextResponse.json({
      invoices: demoInvoices,
      source: 'demo',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      statusCounts,
      agingBuckets,
      totalOutstanding,
      error: `Using demo data - Coperniq instance ${instanceId} connection failed`,
      total: demoInvoices.length,
    });
  }
}

// Transform Coperniq invoices to our Invoice format
function transformToInvoices(invoices: CoperniqInvoice[]): Invoice[] {
  if (!Array.isArray(invoices)) {
    return [];
  }

  // Log first invoice to see actual schema from Coperniq
  if (invoices.length > 0) {
    console.log('Coperniq Invoice Schema Sample:', JSON.stringify(invoices[0], null, 2));
  }

  const today = new Date();

  return invoices.map((inv) => {
    const invAny = inv as unknown as Record<string, unknown>;

    // Calculate days past due
    let daysPastDue = 0;
    let status: Invoice['status'] = 'draft';

    const dueDate = inv.dueDate || invAny.due_date as string;
    if (dueDate) {
      const due = new Date(dueDate);
      const diffTime = today.getTime() - due.getTime();
      daysPastDue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Map status
    status = mapStatus(inv.status || invAny.status as string, daysPastDue);

    return {
      id: `invoice-${inv.id}`,
      invoiceNumber: inv.invoiceNumber || invAny.invoice_number as string || `INV-${inv.id}`,
      customer: inv.client?.name || invAny.customerName as string || 'Unknown Customer',
      customerId: inv.client?.id ? `client-${inv.client.id}` : undefined,
      project: inv.project?.title || invAny.projectName as string,
      projectId: inv.project?.id ? `project-${inv.project.id}` : undefined,
      status,
      total: inv.total || invAny.total as number || 0,
      subtotal: inv.subtotal || invAny.subtotal as number || 0,
      tax: inv.tax || invAny.tax as number || 0,
      balance: inv.balance || invAny.balance as number || inv.total || 0,
      dueDate: dueDate || undefined,
      createdAt: inv.createdAt || new Date().toISOString(),
      daysPastDue: daysPastDue > 0 ? daysPastDue : undefined,
      lineItemCount: inv.lineItems?.length || 0,
    };
  });
}

function mapStatus(status?: string, daysPastDue?: number): Invoice['status'] {
  const s = status?.toLowerCase() || '';

  // Check if overdue based on due date
  if (daysPastDue && daysPastDue > 0 && s !== 'paid' && s !== 'cancelled') {
    return 'overdue';
  }

  if (s.includes('paid') || s.includes('complete')) return 'paid';
  if (s.includes('view')) return 'viewed';
  if (s.includes('sent') || s.includes('open')) return 'sent';
  if (s.includes('cancel') || s.includes('void')) return 'cancelled';
  return 'draft';
}

function calculateStatusCounts(invoices: Invoice[]): InvoiceStatusCounts {
  return {
    all: invoices.length,
    draft: invoices.filter(inv => inv.status === 'draft').length,
    sent: invoices.filter(inv => inv.status === 'sent' || inv.status === 'viewed').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
  };
}

function calculateAgingBuckets(invoices: Invoice[]): AgingBuckets {
  const unpaid = invoices.filter(inv =>
    inv.status !== 'paid' && inv.status !== 'cancelled'
  );

  return {
    current: unpaid.filter(inv => !inv.daysPastDue || inv.daysPastDue <= 30).reduce((sum, inv) => sum + inv.balance, 0),
    days30: unpaid.filter(inv => inv.daysPastDue && inv.daysPastDue > 30 && inv.daysPastDue <= 60).reduce((sum, inv) => sum + inv.balance, 0),
    days60: unpaid.filter(inv => inv.daysPastDue && inv.daysPastDue > 60 && inv.daysPastDue <= 90).reduce((sum, inv) => sum + inv.balance, 0),
    days90Plus: unpaid.filter(inv => inv.daysPastDue && inv.daysPastDue > 90).reduce((sum, inv) => sum + inv.balance, 0),
  };
}

function getDemoStatusCounts(): InvoiceStatusCounts {
  return {
    all: 12,
    draft: 2,
    sent: 4,
    paid: 4,
    overdue: 2,
  };
}

function getDemoAgingBuckets(): AgingBuckets {
  return {
    current: 15250.00,
    days30: 8450.00,
    days60: 3200.00,
    days90Plus: 1850.00,
  };
}

// Demo data for development/fallback
function getDemoInvoices(): Invoice[] {
  const today = new Date();

  return [
    {
      id: 'demo-inv-1',
      invoiceNumber: 'INV-2025-001',
      customer: 'Sarah Martinez',
      project: 'AC System Replacement',
      status: 'overdue',
      total: 8500.00,
      subtotal: 7800.00,
      tax: 700.00,
      balance: 8500.00,
      dueDate: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      daysPastDue: 45,
      lineItemCount: 5,
    },
    {
      id: 'demo-inv-2',
      invoiceNumber: 'INV-2025-002',
      customer: 'Mike Thompson',
      project: 'Water Heater Install',
      status: 'paid',
      total: 2850.00,
      subtotal: 2600.00,
      tax: 250.00,
      balance: 0,
      dueDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 3,
    },
    {
      id: 'demo-inv-3',
      invoiceNumber: 'INV-2025-003',
      customer: 'Lisa Anderson',
      project: 'Electrical Panel Upgrade',
      status: 'sent',
      total: 4200.00,
      subtotal: 3850.00,
      tax: 350.00,
      balance: 4200.00,
      dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 4,
    },
    {
      id: 'demo-inv-4',
      invoiceNumber: 'INV-2025-004',
      customer: 'Commercial Property Group',
      project: 'HVAC Maintenance Contract',
      status: 'overdue',
      total: 12500.00,
      subtotal: 11500.00,
      tax: 1000.00,
      balance: 12500.00,
      dueDate: new Date(today.getTime() - 95 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      daysPastDue: 95,
      lineItemCount: 8,
    },
    {
      id: 'demo-inv-5',
      invoiceNumber: 'INV-2025-005',
      customer: 'James Wilson',
      project: 'Solar Panel Installation',
      status: 'paid',
      total: 28500.00,
      subtotal: 26500.00,
      tax: 2000.00,
      balance: 0,
      dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 12,
    },
    {
      id: 'demo-inv-6',
      invoiceNumber: 'INV-2025-006',
      customer: 'Robert Garcia',
      project: 'Furnace Repair',
      status: 'sent',
      total: 650.00,
      subtotal: 600.00,
      tax: 50.00,
      balance: 650.00,
      dueDate: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 2,
    },
    {
      id: 'demo-inv-7',
      invoiceNumber: 'INV-2025-007',
      customer: 'Jennifer Davis',
      status: 'draft',
      total: 5800.00,
      subtotal: 5300.00,
      tax: 500.00,
      balance: 5800.00,
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 6,
    },
    {
      id: 'demo-inv-8',
      invoiceNumber: 'INV-2025-008',
      customer: 'Emily Brown',
      project: 'Thermostat Installation',
      status: 'paid',
      total: 450.00,
      subtotal: 400.00,
      tax: 50.00,
      balance: 0,
      dueDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 2,
    },
    {
      id: 'demo-inv-9',
      invoiceNumber: 'INV-2025-009',
      customer: 'Tech Solutions Inc',
      project: 'Server Room HVAC',
      status: 'sent',
      total: 18750.00,
      subtotal: 17250.00,
      tax: 1500.00,
      balance: 18750.00,
      dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 10,
    },
    {
      id: 'demo-inv-10',
      invoiceNumber: 'INV-2025-010',
      customer: 'Sunset Apartments',
      project: 'Multi-Unit Plumbing',
      status: 'paid',
      total: 7200.00,
      subtotal: 6600.00,
      tax: 600.00,
      balance: 0,
      dueDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 7,
    },
    {
      id: 'demo-inv-11',
      invoiceNumber: 'INV-2025-011',
      customer: 'Metro Office Complex',
      status: 'draft',
      total: 3400.00,
      subtotal: 3100.00,
      tax: 300.00,
      balance: 3400.00,
      createdAt: new Date().toISOString(),
      lineItemCount: 4,
    },
    {
      id: 'demo-inv-12',
      invoiceNumber: 'INV-2025-012',
      customer: 'Happy Home Services',
      project: 'Annual Maintenance',
      status: 'sent',
      total: 1200.00,
      subtotal: 1100.00,
      tax: 100.00,
      balance: 1200.00,
      dueDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemCount: 3,
    },
  ];
}
