import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Extract domain from hostname (handle localhost for development)
  const domain = hostname.includes('localhost')
    ? 'swaggystacks' // Default to SwaggyStacks for local development
    : hostname.includes('swaggystacks.com')
      ? 'swaggystacks'
      : hostname.includes('scientiacapital.com')
        ? 'scientia'
        : 'swaggystacks' // Default fallback

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-domain', domain)

  // Handle domain-specific routing
  const url = request.nextUrl.clone()

  // If we're on the root path, serve the appropriate landing page
  if (url.pathname === '/') {
    url.pathname = `/${domain}`
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  // For all other requests, pass through with domain header
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
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