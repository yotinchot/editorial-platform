import { cookies } from "next/headers";

/**
 * lib/auth/cookies.ts
 *
 * Cookie helpers for the admin session token.
 *
 * Cookie configuration
 * ────────────────────
 * Name:     __editorial_session
 * HttpOnly: true  — JS on the client cannot read or steal the token.
 * SameSite: lax   — Sent on top-level navigations (GET to /admin) but not
 *                   on cross-site POST requests, preventing CSRF.
 * Secure:   true in production — cookie is only sent over HTTPS.
 * Path:     /     — Scoped to the whole origin (not just /admin) so the
 *                   browser always sends it; the middleware decides relevance.
 * MaxAge:   none  — Session-scoped: the browser discards it when closed.
 *
 * Note on `cookies()` in Next.js 15+
 * ────────────────────────────────────
 * `cookies()` from "next/headers" is async in Next.js 15 and later.
 * All three helpers are async to match this expectation.
 */

export const SESSION_COOKIE_NAME = "__editorial_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  // No maxAge / expires → session cookie (cleared when browser closes).
} as const;

/**
 * Reads the raw session token from the incoming request's cookies.
 * Returns `undefined` if the cookie is absent.
 */
export async function getSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Sets the session cookie containing the raw session token.
 * Call immediately after `createSession()`.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
}

/**
 * Clears the session cookie.
 * Call as part of the logout flow, after `destroySession()`.
 */
export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
