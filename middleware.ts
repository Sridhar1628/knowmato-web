import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  console.log("🔥 MIDDLEWARE HIT:", request.nextUrl.pathname);

  const token = request.cookies.get("accessToken")?.value;

  console.log("🔥 TOKEN:", token);

  if (!token) {
    console.log("🔥 REDIRECT LOGIN");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/tutor/:path*",
    "/admin/:path*",
  ],
};