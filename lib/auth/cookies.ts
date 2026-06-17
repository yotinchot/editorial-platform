/**
 * lib/auth/cookies.ts
 *
 * TODO (Authentication Phase):
 *
 * Responsibilities:
 * - Set the session cookie after a successful login.
 * - Read the session cookie from an incoming request (used by middleware/proxy).
 * - Clear the session cookie on logout.
 *
 * Cookie configuration (to be applied):
 * - Name:     `__editorial_session`
 * - HttpOnly: true   — inaccessible to client-side JS
 * - SameSite: lax    — CSRF protection for navigation requests
 * - Secure:   true in production (process.env.NODE_ENV === "production")
 * - Path:     /
 * - MaxAge:   session-scoped (no explicit maxAge → expires when browser closes)
 *
 * Example surface:
 *   export function setSessionCookie(res: NextResponse, token: string): void
 *   export function getSessionToken(req: NextRequest): string | undefined
 *   export function clearSessionCookie(res: NextResponse): void
 */

export const SESSION_COOKIE_NAME = "__editorial_session";
