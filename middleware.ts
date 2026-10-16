
import { NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  // Web authentication now uses Django session cookies
  // on the API domain, not a readable accessToken cookie
  // on the Next.js frontend domain.
  //
  // Authentication and authorization must be enforced
  // by the API and the protected page/layout guards.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/student/:path*',
    '/tutor/:path*',
    '/admin/:path*',
    '/company/:path*',
  ],
};
