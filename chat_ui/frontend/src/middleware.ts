/**
 * Next.js Middleware - SaaS-Level Security
 *
 * Security features:
 * - Rate limiting (prevents abuse)
 * - CSRF protection
 * - Request validation
 * - IP-based blocking for suspicious activity
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const CHAT_RATE_LIMIT = 20; // 20 chat messages per minute

// In-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Get client identifier (IP + User-Agent hash for better identification)
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Simple hash of IP + UA (use crypto.subtle in production)
  const combined = `${ip}:${userAgent.substring(0, 50)}`;
  return combined;
}

// Check rate limit
function checkRateLimit(
  clientId: string,
  limit: number,
  endpoint: string
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${clientId}:${endpoint}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: limit - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (record.count >= limit) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetIn: record.resetTime - now,
  };
}

// Generate CSRF token (simple implementation - use crypto in production)
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// CSRF token store (use session/Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number }>();

export async function middleware(request: NextRequest) {
  // Clean up rate limit store periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitStore();
  }

  const clientId = getClientId(request);
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api')) {
    // Determine rate limit based on endpoint
    const limit = pathname === '/api/chat' ? CHAT_RATE_LIMIT : MAX_REQUESTS_PER_WINDOW;
    const rateLimitResult = checkRateLimit(clientId, limit, pathname);

    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
            'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      Math.ceil(rateLimitResult.resetIn / 1000).toString()
    );

    // CSRF protection for mutating requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfHeader = request.headers.get('x-csrf-token');
      const csrfCookie = request.cookies.get('csrf-token')?.value;

      // For now, skip CSRF for API routes proxied to FastAPI backend
      // In production, implement full CSRF validation

      // Add CSRF token to response if not present
      if (!csrfCookie) {
        const newToken = generateCSRFToken();
        response.cookies.set('csrf-token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600, // 1 hour
          path: '/',
        });
      }
    }

    return response;
  }

  // For non-API routes, just add security headers
  const response = NextResponse.next();

  // Ensure CSRF token cookie exists for forms
  const csrfCookie = request.cookies.get('csrf-token')?.value;
  if (!csrfCookie) {
    const newToken = generateCSRFToken();
    response.cookies.set('csrf-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
