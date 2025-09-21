import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const hostname = request.headers.get('host') || ''

  // Extract domain from hostname (handle localhost for development)
  const domain = hostname.includes('localhost')
    ? 'swaggystacks' // Default to SwaggyStacks for local development
    : hostname.includes('swaggystacks.com')
      ? 'swaggystacks'
      : hostname.includes('scientiacapital.com')
        ? 'scientia_capital'
        : 'swaggystacks' // Default fallback

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-domain', domain)
  requestHeaders.set('x-request-start', startTime.toString())

  // Handle domain-specific routing
  const url = request.nextUrl.clone()
  let response: NextResponse;

  // If we're on the root path, serve the appropriate landing page
  if (url.pathname === '/') {
    url.pathname = `/${domain}`
    response = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  } else {
    // For all other requests, pass through with domain header
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Add monitoring headers to response
  response.headers.set('x-organization', domain);
  response.headers.set('x-monitored', 'true');
  response.headers.set('x-response-time', (Date.now() - startTime).toString());

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}