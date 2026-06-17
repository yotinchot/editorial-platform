import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";

/**
 * Admin route protection — first pass.
 *
 * Two-layer authentication model
 * ───────────────────────────────
 * This proxy is the first pass: it checks only that the session cookie
 * exists. It runs on the Edge runtime and cannot make TCP connections, so a
 * full DB verification here is not feasible with the postgres.js driver.
 *
 * The second pass — the actual security gate — is the Server Component layout
 * at app/admin/(protected)/layout.tsx. It hashes the cookie value, queries
 * admin_sessions, and verifies expiry. Any request that reaches that layout
 * with an invalid or expired token is redirected to /admin/login regardless
 * of what this proxy passed.
 *
 * Why two layers?
 * ───────────────
 * - This proxy catches the common case (no cookie at all) without a DB round-
 *   trip, giving an immediate redirect for unauthenticated visitors.
 * - The layout catches the edge cases: expired tokens, revoked sessions, or a
 *   cookie that was forged/tampered with.
 * - Together they are defence-in-depth: no single layer is the sole guardian.
 *
 * Public admin routes (no session required)
 * ──────────────────────────────────────────
 * /admin/login  — the login form itself must be accessible without auth.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow /admin/login through without any session check.
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // For all other /admin/* routes, require a session cookie to be present.
  // The cookie value is not verified here — that happens in the layout.
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/admin/login", request.url);
    // Preserve the intended destination so the login page can redirect back.
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matches /admin, /admin/posts, /admin/posts/123, etc.
  // The :path* segment matches zero or more additional segments.
  matcher: ["/admin/:path*"],
};
