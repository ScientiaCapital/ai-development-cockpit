// ============================================================================
// Kipper Energy Solutions - API Client
// ============================================================================

import type {
  ChatRequest,
  ChatResponse,
  Agent,
  WorkOrder,
  Contact,
  Asset,
  DashboardStats,
} from '@/types';

const API_BASE = '/api';

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  return response.json();
}

// Chat API - sends messages array to Claude
// voiceMode=true uses Haiku + shorter max_tokens for faster TTFT
export async function sendChatMessage(
  message: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  voiceMode: boolean = false
): Promise<ChatResponse> {
  // Build messages array with history + new message
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: message },
  ];

  const request: ChatRequest & { voiceMode?: boolean } = { messages };
  if (voiceMode) {
    request.voiceMode = true;
  }
  return fetchApi<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// VLM Image Analysis Response
export interface VLMAnalysisResponse {
  success: boolean;
  analysis: {
    extraction: Record<string, unknown>;
    confidence: number;
    trade?: string;
    processingTimeMs: number;
  };
  chatResponse?: string;
  error?: string;
}

// Send Image for VLM Analysis (FieldVault-style)
export async function analyzeImage(
  imageBase64: string,
  trade: string = 'general',
  prompt?: string
): Promise<VLMAnalysisResponse> {
  return fetchApi<VLMAnalysisResponse>('/analyze-image', {
    method: 'POST',
    body: JSON.stringify({
      image: imageBase64,
      trade,
      prompt: prompt || `Analyze this ${trade} field photo and extract all relevant equipment information.`,
    }),
  });
}

// Send Chat Message with Image Attachment
export async function sendChatMessageWithImage(
  message: string,
  imageBase64: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  trade: string = 'general'
): Promise<ChatResponse> {
  return fetchApi<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        ...conversationHistory,
        { role: 'user' as const, content: message },
      ],
      image: imageBase64,
      trade,
    }),
  });
}

// Upload file to Coperniq (syncs to instance 388)
export async function uploadToCoperniq(
  file: File,
  projectId?: string,
  workOrderId?: string
): Promise<{ success: boolean; fileId: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (projectId) formData.append('projectId', projectId);
  if (workOrderId) formData.append('workOrderId', workOrderId);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json();
}

// Agents API
export async function getAgents(): Promise<{ agents: Agent[] }> {
  return fetchApi<{ agents: Agent[] }>('/agents');
}

// Work Orders API - uses unified cache to avoid rate limiting
export async function getWorkOrders(): Promise<{ work_orders: WorkOrder[] }> {
  // Use unified data layer to avoid 429 rate limiting
  const { getWorkOrdersFromCache } = await import('./coperniqData');
  return getWorkOrdersFromCache();
}

// Update Work Order Status - syncs to Coperniq Instance 388
export async function updateWorkOrderStatus(
  workOrderId: string,
  status: WorkOrder['status'],
  notes?: string
): Promise<{ success: boolean; work_order: WorkOrder }> {
  return fetchApi<{ success: boolean; work_order: WorkOrder }>(`/work-orders/${workOrderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

// Assign Technician to Work Order
export async function assignWorkOrderTechnician(
  workOrderId: string,
  technicianId: string
): Promise<{ success: boolean; work_order: WorkOrder }> {
  return fetchApi<{ success: boolean; work_order: WorkOrder }>(`/work-orders/${workOrderId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ technicianId }),
  });
}

// Contacts API
export async function getContacts(): Promise<{ contacts: Contact[] }> {
  return fetchApi<{ contacts: Contact[] }>('/contacts');
}

// Customer type for Customer Lookup panel
export interface Customer {
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

// Customers API - uses unified cache to avoid rate limiting
export async function getCustomers(search?: string): Promise<{ customers: Customer[]; total: number }> {
  // Use unified data layer to avoid 429 rate limiting
  const { getCustomersFromCache } = await import('./coperniqData');
  return getCustomersFromCache(search);
}

// Project type for Projects panel
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

export interface ProjectStageCounts {
  all: number;
  lead: number;
  proposal: number;
  sold: number;
  in_progress: number;
  complete: number;
}

// Projects API - uses unified cache to avoid rate limiting
export async function getProjects(stage?: string): Promise<{
  projects: Project[];
  total: number;
  stageCounts: ProjectStageCounts;
}> {
  // Use unified data layer to avoid 429 rate limiting
  const { getProjectsFromCache } = await import('./coperniqData');
  const result = await getProjectsFromCache(stage);

  // Calculate stage counts from cached data
  const { getCoperniqData } = await import('./coperniqData');
  const allData = await getCoperniqData();
  const allProjects = allData.projects;

  return {
    projects: result.projects,
    total: result.total,
    stageCounts: {
      all: allProjects.length,
      lead: allProjects.filter(p => p.stage === 'lead').length,
      proposal: allProjects.filter(p => p.stage === 'proposal').length,
      sold: allProjects.filter(p => p.stage === 'sold').length,
      in_progress: allProjects.filter(p => p.stage === 'in_progress').length,
      complete: allProjects.filter(p => p.stage === 'complete').length,
    },
  };
}

// ServiceRequest type for Service Requests panel
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

// Service Requests API - uses unified cache to avoid rate limiting
export async function getRequests(priority?: string): Promise<{
  requests: ServiceRequest[];
  total: number;
  priorityCounts: PriorityCounts;
}> {
  // Use unified data layer to avoid 429 rate limiting
  const { getRequestsFromCache, getCoperniqData } = await import('./coperniqData');
  const result = await getRequestsFromCache(priority);

  // Calculate priority counts from cached data
  const allData = await getCoperniqData();
  const allRequests = allData.requests;

  return {
    requests: result.requests,
    total: result.total,
    priorityCounts: {
      all: allRequests.length,
      emergency: allRequests.filter(r => r.priority === 'emergency').length,
      high: allRequests.filter(r => r.priority === 'high').length,
      normal: allRequests.filter(r => r.priority === 'normal').length,
      low: allRequests.filter(r => r.priority === 'low').length,
    },
  };
}

// Invoice type for Invoices panel
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
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
}

// Invoices API - uses unified cache to avoid rate limiting
export async function getInvoices(status?: string): Promise<{
  invoices: Invoice[];
  total: number;
  statusCounts: InvoiceStatusCounts;
  agingBuckets: AgingBuckets;
  totalOutstanding: number;
}> {
  // Use unified data layer to avoid 429 rate limiting
  const { getInvoicesFromCache, getCoperniqData } = await import('./coperniqData');
  const result = await getInvoicesFromCache(status);

  // Calculate counts from cached data
  const allData = await getCoperniqData();
  const allInvoices = allData.invoices;

  // Calculate aging buckets
  const now = new Date();
  const agingBuckets: AgingBuckets = { current: 0, days30: 0, days60: 0, days90Plus: 0 };
  let totalOutstanding = 0;

  allInvoices.forEach(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return;
    const amount = inv.total || 0;
    totalOutstanding += amount;

    if (!inv.dueDate) {
      agingBuckets.current += amount;
      return;
    }

    const dueDate = new Date(inv.dueDate);
    const daysPast = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPast <= 0) agingBuckets.current += amount;
    else if (daysPast <= 30) agingBuckets.days30 += amount;
    else if (daysPast <= 60) agingBuckets.days60 += amount;
    else agingBuckets.days90Plus += amount;
  });

  return {
    invoices: result.invoices,
    total: result.total,
    statusCounts: {
      all: allInvoices.length,
      draft: allInvoices.filter(i => i.status === 'draft').length,
      sent: allInvoices.filter(i => i.status === 'sent').length,
      paid: allInvoices.filter(i => i.status === 'paid').length,
      overdue: allInvoices.filter(i => i.status === 'overdue').length,
    },
    agingBuckets,
    totalOutstanding,
  };
}

// Assets API
export async function getAssets(): Promise<{ assets: Asset[] }> {
  return fetchApi<{ assets: Asset[] }>('/assets');
}

// Dashboard Stats - Fetches real data from Coperniq Instance 388
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetchApi<{ stats: DashboardStats }>('/stats');
    return response.stats;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    // Return sensible defaults on error
    return {
      openWorkOrders: 0,
      scheduledToday: 0,
      completedToday: 0,
      completedThisWeek: 0,
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0,
      arOver30Days: 0,
      firstTimeFixRate: 85,
      avgResponseTime: 2.4,
      techUtilization: 78,
      activeProjects: 0,
      pendingEstimates: 0,
      openServiceCalls: 0,
      catalogItemCount: 0,
      lowStockItems: 0,
      activeCalls: 0,
    };
  }
}

// ============================================================================
// Voice TTS - Convert text to speech using Cartesia Sonic 3
// ============================================================================

export interface TTSResponse {
  success: boolean;
  audio?: string; // base64 encoded mp3
  format?: string;
  model?: string;
  emotion?: string;
  error?: string;
}

/**
 * Convert text to speech using Cartesia Sonic 3
 * @param text - Text to speak
 * @param voiceId - Cartesia voice ID
 * @param emotion - Voice emotion (neutral, happy, professional, urgent, calm, empathetic)
 * @returns Base64 audio data
 */
export async function speakText(
  text: string,
  voiceId?: string,
  emotion: string = 'professional'
): Promise<TTSResponse> {
  return fetchApi<TTSResponse>('/orchestrator', {
    method: 'POST',
    body: JSON.stringify({
      route: 'voice_tts',
      text,
      voice: voiceId,
      voiceEmotion: emotion,
    }),
  });
}

// Track voice warming state to avoid redundant warm-up calls
let voiceWarmedForId: string | null = null;
let voiceWarmingPromise: Promise<void> | null = null;

/**
 * Warm up the TTS voice to eliminate cold-start latency
 * Makes a quick TTS request that primes Cartesia's model for the voice.
 * Saves 100-200ms on the first real TTS request.
 *
 * @param voiceId - Voice ID to warm up
 * @param emotion - Emotion preset to use
 */
export async function warmVoice(
  voiceId: string = 'a0e99841-438c-4a64-b679-ae501e7d6091',
  emotion: string = 'professional'
): Promise<void> {
  // Already warmed for this voice - skip
  if (voiceWarmedForId === voiceId) {
    console.log('[TTS] Voice already warmed:', voiceId.slice(0, 8));
    return;
  }

  // Warming in progress - wait for it
  if (voiceWarmingPromise) {
    console.log('[TTS] Voice warming in progress, waiting...');
    return voiceWarmingPromise;
  }

  console.log('[TTS] Warming voice:', voiceId.slice(0, 8));
  const startTime = performance.now();

  voiceWarmingPromise = (async () => {
    try {
      // Generate a tiny phrase to prime the model
      // Using "." keeps it minimal while still warming the voice
      await speakText('.', voiceId, emotion);
      voiceWarmedForId = voiceId;
      console.log(`[TTS] Voice warmed in ${Math.round(performance.now() - startTime)}ms`);
    } catch (error) {
      console.warn('[TTS] Voice warming failed (non-critical):', error);
      // Don't throw - warming failure shouldn't block the app
    } finally {
      voiceWarmingPromise = null;
    }
  })();

  return voiceWarmingPromise;
}

/**
 * Reset voice warming state (call when voice settings change significantly)
 */
export function resetVoiceWarming(): void {
  voiceWarmedForId = null;
  voiceWarmingPromise = null;
}

// Track current audio for interrupt capability
let currentAudio: HTMLAudioElement | null = null;

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/**
 * Play audio from base64 encoded data
 * @param base64Audio - Base64 encoded audio
 * @returns Promise that resolves when playback completes
 */
export function playAudio(base64Audio: string): Promise<void> {
  // Stop any currently playing audio
  stopAudio();

  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      currentAudio = audio;

      audio.onended = () => {
        currentAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        currentAudio = null;
        reject(e);
      };
      audio.play().catch((err) => {
        currentAudio = null;
        reject(err);
      });
    } catch (error) {
      currentAudio = null;
      reject(error);
    }
  });
}

/**
 * Clean text for TTS - remove markdown and special characters
 */
function cleanTextForTTS(text: string): string {
  return text
    // Remove markdown headers (# ## ### etc)
    .replace(/^#{1,6}\s*/gm, '')
    // Remove bold/italic markers (* ** _ __)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, 'code block')
    .replace(/`([^`]+)`/g, '$1')
    // Remove bullet points
    .replace(/^[\s]*[-*•]\s*/gm, '')
    // Remove numbered lists formatting
    .replace(/^\d+\.\s*/gm, '')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove emoji sequences that sound weird
    .replace(/:[a-z_]+:/g, '')
    // Clean up multiple spaces/newlines
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Split text into speakable chunks (sentences)
 * Keeps chunks reasonably sized for fast TTS generation
 */
function splitIntoChunks(text: string, maxChunkLength: number = 200): string[] {
  // Split on sentence boundaries
  const sentenceRegex = /[.!?]+\s+/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    sentences.push(text.slice(lastIndex, match.index + match[0].length).trim());
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    sentences.push(text.slice(lastIndex).trim());
  }

  // Combine very short sentences, split very long ones
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length < maxChunkLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  return chunks.filter(c => c.length > 0);
}

/**
 * Speak text using TTS and play it - with chunked streaming for faster response
 * @param text - Text to speak
 * @param voiceId - Optional voice ID
 * @param emotion - Voice emotion
 */
export async function speakAndPlay(
  text: string,
  voiceId?: string,
  emotion: string = 'professional'
): Promise<void> {
  // Clean text for natural speech (remove markdown, etc.)
  const cleanText = cleanTextForTTS(text);

  // For short text, just play directly
  if (cleanText.length < 150) {
    const response = await speakText(cleanText, voiceId, emotion);
    if (response.success && response.audio) {
      await playAudio(response.audio);
    } else {
      console.error('[TTS] Failed to generate speech:', response.error);
    }
    return;
  }

  // For longer text, chunk and stream
  const chunks = splitIntoChunks(cleanText);
  console.log(`[TTS] Streaming ${chunks.length} chunks`);

  // Pre-fetch all chunks in parallel
  const audioQueue: Promise<TTSResponse>[] = chunks.map(chunk =>
    speakText(chunk, voiceId, emotion)
  );

  // Play chunks sequentially as they're ready
  for (let i = 0; i < chunks.length; i++) {
    // Check if audio was stopped (user interrupted)
    if (currentAudio === null && i > 0) {
      console.log('[TTS] Playback stopped by user');
      break;
    }

    try {
      const response = await audioQueue[i];
      if (response.success && response.audio) {
        await playAudio(response.audio);
      }
    } catch (error) {
      console.error(`[TTS] Chunk ${i} failed:`, error);
    }
  }
}

// WebSocket connection for real-time chat
export function createChatWebSocket(
  onMessage: (message: { role: string; content: string; timestamp: string }) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError?.(error);
  };

  ws.onclose = () => {
    onClose?.();
  };

  return ws;
}
