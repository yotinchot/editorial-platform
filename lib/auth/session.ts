/**
 * lib/auth/session.ts
 *
 * TODO (Authentication Phase):
 *
 * Responsibilities:
 * - Create a new admin session after a successful password check.
 * - Validate an existing session from an incoming request.
 * - Destroy a session on logout.
 *
 * Implementation notes:
 * - Sessions are stored in the `admin_sessions` Postgres table (see db/schema).
 * - Session tokens are generated with `crypto.randomBytes(32)` and stored
 *   as SHA-256 hashes — never store a raw token in the DB.
 * - Validate by hashing the cookie value and comparing to the stored hash.
 * - Sessions are browser-scoped (no persistent "remember me").
 *
 * Example surface:
 *   export async function createSession(): Promise<string>
 *   export async function validateSession(token: string): Promise<boolean>
 *   export async function deleteSession(token: string): Promise<void>
 */

export {};
