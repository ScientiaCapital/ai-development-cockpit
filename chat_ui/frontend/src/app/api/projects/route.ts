/**
 * Projects API Route - Coperniq Proxy
 *
 * Proxies requests to Coperniq API for project management.
 * Maps to Coperniq /v1/projects endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoperniqApiKey, getInstanceInfo, INSTANCE_HEADER } from '@/lib/coperniq';

const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';

// Coperniq Project schema
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
  estimatedValue?: number;
  actualValue?: number;
  client?: {
    id: number;
    name: string;
  };
  primaryContact?: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
  };
  address?: string[];
  city?: string;
  state?: string;
  zip?: string;
}

// Our Project format for the UI
export interface Project {
  id: string;
  title: string;
  customer: string;
  address?: string;
  stage: 'lead' | 'proposal' | 'sold' | 'in_progress' | 'complete' | 'cancelled';
  trade?: string;
  estimatedValue?: number;
  actualValue?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  description?: string;
  progress?: number;
}

export async function GET(request: NextRequest) {
  // Get instance from header or query param, default to 388 (Kipper Energy)
  const instanceId = request.headers.get(INSTANCE_HEADER) ||
    request.nextUrl.searchParams.get('instance') ||
    '388';

  const stageFilter = request.nextUrl.searchParams.get('stage') || '';

  const apiKey = getCoperniqApiKey(instanceId);
  const instanceInfo = getInstanceInfo(instanceId);

  if (!apiKey) {
    console.error(`COPERNIQ_API_KEY not configured for instance ${instanceId}`);
    return NextResponse.json(
      { error: `API key not configured for instance ${instanceId}`, projects: getDemoProjects() },
      { status: 200 }
    );
  }

  try {
    const projectsRes = await fetch(`${COPERNIQ_API_URL}/projects`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!projectsRes.ok) {
      throw new Error(`Coperniq API error: ${projectsRes.status}`);
    }

    const projectsData = await projectsRes.json();
    const projectsArray = Array.isArray(projectsData) ? projectsData : projectsData.data || [];

    // Transform to our Project format
    let projects = transformProjects(projectsArray);

    // Filter by stage if provided
    if (stageFilter && stageFilter !== 'all') {
      projects = projects.filter(p => p.stage === stageFilter);
    }

    // Calculate stage counts
    const stageCounts = calculateStageCounts(transformProjects(projectsArray));

    return NextResponse.json({
      projects,
      source: 'coperniq',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      total: projects.length,
      stageCounts,
    });
  } catch (error) {
    console.error(`Coperniq API error (instance ${instanceId}):`, error);

    let demoProjects = getDemoProjects();

    // Filter demo data by stage
    if (stageFilter && stageFilter !== 'all') {
      demoProjects = demoProjects.filter(p => p.stage === stageFilter);
    }

    const stageCounts = calculateStageCounts(getDemoProjects());

    return NextResponse.json({
      projects: demoProjects,
      source: 'demo',
      instance: {
        id: instanceInfo.id,
        name: instanceInfo.name,
        type: instanceInfo.type,
      },
      error: `Using demo data - Coperniq instance ${instanceId} connection failed`,
      total: demoProjects.length,
      stageCounts,
    });
  }
}

// Transform Coperniq projects to our format
function transformProjects(projects: CoperniqProject[]): Project[] {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects.map((proj) => ({
    id: `proj-${proj.id}`,
    title: proj.title || 'Untitled Project',
    customer: proj.client?.name ||
      (proj.primaryContact ? `${proj.primaryContact.firstName || ''} ${proj.primaryContact.lastName || ''}`.trim() : '') ||
      proj.primaryContact?.name ||
      'Unassigned',
    address: formatAddress(proj),
    stage: mapStage(proj.status, proj.stage),
    trade: proj.trade || 'General',
    estimatedValue: proj.estimatedValue,
    actualValue: proj.actualValue,
    startDate: proj.startDate,
    endDate: proj.endDate,
    createdAt: proj.createdAt || new Date().toISOString(),
    description: proj.description,
    progress: calculateProgress(proj.status, proj.stage),
  }));
}

function formatAddress(proj: CoperniqProject): string {
  const parts = [];
  if (proj.address && Array.isArray(proj.address)) {
    parts.push(...proj.address);
  }
  if (proj.city) parts.push(proj.city);
  if (proj.state) parts.push(proj.state);
  if (proj.zip) parts.push(proj.zip);
  return parts.join(', ');
}

function mapStage(status?: string, stage?: string): Project['stage'] {
  const stageStr = (stage || status || '').toUpperCase();

  if (stageStr.includes('LEAD') || stageStr.includes('PROSPECT')) return 'lead';
  if (stageStr.includes('PROPOSAL') || stageStr.includes('QUOTE') || stageStr.includes('ESTIMATE')) return 'proposal';
  if (stageStr.includes('SOLD') || stageStr.includes('WON') || stageStr.includes('ACCEPTED')) return 'sold';
  if (stageStr.includes('PROGRESS') || stageStr.includes('ACTIVE') || stageStr.includes('INSTALL') || stageStr.includes('INSPECTION')) return 'in_progress';
  if (stageStr.includes('COMPLETE') || stageStr.includes('CLOSED') || stageStr.includes('DONE')) return 'complete';
  if (stageStr.includes('CANCEL') || stageStr.includes('LOST')) return 'cancelled';

  return 'lead'; // Default
}

function calculateProgress(status?: string, stage?: string): number {
  const mapped = mapStage(status, stage);
  const progressMap: Record<Project['stage'], number> = {
    lead: 10,
    proposal: 25,
    sold: 40,
    in_progress: 65,
    complete: 100,
    cancelled: 0,
  };
  return progressMap[mapped];
}

function calculateStageCounts(projects: Project[]) {
  return {
    all: projects.length,
    lead: projects.filter(p => p.stage === 'lead').length,
    proposal: projects.filter(p => p.stage === 'proposal').length,
    sold: projects.filter(p => p.stage === 'sold').length,
    in_progress: projects.filter(p => p.stage === 'in_progress').length,
    complete: projects.filter(p => p.stage === 'complete').length,
  };
}

// Demo data for development/fallback
function getDemoProjects(): Project[] {
  return [
    {
      id: 'demo-proj-1',
      title: 'Commercial HVAC Retrofit - Tech Park',
      customer: 'Tech Solutions Inc',
      address: '500 Corporate Dr, Miami, FL',
      stage: 'in_progress',
      trade: 'HVAC',
      estimatedValue: 45000,
      actualValue: 42500,
      startDate: new Date(Date.now() - 86400000 * 14).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      progress: 65,
    },
    {
      id: 'demo-proj-2',
      title: 'Solar Panel Installation - 10kW System',
      customer: 'Green Energy LLC',
      address: '321 Sunset Dr, Nashville, TN',
      stage: 'sold',
      trade: 'Solar',
      estimatedValue: 28000,
      startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      progress: 40,
    },
    {
      id: 'demo-proj-3',
      title: 'Panel Upgrade 200A - Industrial',
      customer: 'BuildRight Construction',
      address: '100 Builder Way, Charlotte, NC',
      stage: 'proposal',
      trade: 'Electrical',
      estimatedValue: 12500,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      progress: 25,
    },
    {
      id: 'demo-proj-4',
      title: 'Multi-Unit Plumbing Renovation',
      customer: 'Taylor Property Group',
      address: '800 Real Estate Pkwy, Memphis, TN',
      stage: 'lead',
      trade: 'Plumbing',
      estimatedValue: 35000,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      progress: 10,
    },
    {
      id: 'demo-proj-5',
      title: 'Office Fire Suppression System',
      customer: 'Commercial Service Co',
      address: '222 Industrial Blvd, Tampa, FL',
      stage: 'complete',
      trade: 'Fire Protection',
      estimatedValue: 18000,
      actualValue: 19200,
      startDate: new Date(Date.now() - 86400000 * 60).toISOString(),
      endDate: new Date(Date.now() - 86400000 * 10).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      progress: 100,
    },
    {
      id: 'demo-proj-6',
      title: 'Rooftop AC Unit Replacement',
      customer: 'ABC Company',
      address: '789 Commerce Blvd, Tampa, FL',
      stage: 'in_progress',
      trade: 'HVAC',
      estimatedValue: 8500,
      startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      progress: 65,
    },
    {
      id: 'demo-proj-7',
      title: 'New Construction Electrical',
      customer: 'HomeBuilders LLC',
      address: '456 New Build Ln, Atlanta, GA',
      stage: 'proposal',
      trade: 'Electrical',
      estimatedValue: 55000,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      progress: 25,
    },
    {
      id: 'demo-proj-8',
      title: 'Water Heater Fleet Replacement',
      customer: 'Property Management Co',
      address: '123 Multi-Unit Ave, Orlando, FL',
      stage: 'lead',
      trade: 'Plumbing',
      estimatedValue: 22000,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      progress: 10,
    },
  ];
}
