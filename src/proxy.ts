import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: sends visitors without a session cookie to /login.
 * Real authorisation happens on the server in every page and action (src/lib/auth/dal.ts).
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("eea_session")) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/school/:path*", "/student/:path*", "/parent/:path*", "/certificates/:path*", "/admit-card/:path*", "/login/verify"],
};
