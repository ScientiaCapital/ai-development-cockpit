import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-start', startTime.toString())

  // Handle routing - pass through all requests
  // (Root path now shows the dashboard with sidebar layout)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add monitoring headers to response
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