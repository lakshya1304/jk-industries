import { NextResponse, type NextRequest } from "next/server";

/**
 * Coarse access gate (Next 16 "proxy", formerly middleware).
 *
 * This only checks for the presence of a session cookie so unauthenticated
 * visitors never reach the admin UI. The cookie's signature is verified for
 * real inside the admin layout and every /api/admin route handler.
 */
const ADMIN_SESSION_COOKIE = "sc_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/admin")) {
    if (!hasCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    if (hasCookie) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (!hasCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*"],
};
