import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy - Request interceptor for Next.js App Router.
 *
 * Since locale is now detected server-side in the layout (no redirects needed),
 * this proxy is minimal and only handles necessary request processing.
 *
 * Privacy-preserving:
 * - No redirects (locale detected in server components)
 * - No cookies set
 * - No user tracking
 * - Accept-Language header handled in server components, not proxy
 *
 * @param request - Next.js request object
 * @returns NextResponse with pass-through
 */
export function proxy(request: NextRequest) {
  console.log('### proxy.ts', {
    request,
  });
  // Simply pass through all requests
  // Locale detection happens server-side in layout components
  // No redirects needed - this preserves user privacy and avoids redirect overhead
  return NextResponse.next();
}

export const config = {
  // Match all paths except static files and API routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
