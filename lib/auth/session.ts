import { randomBytes, createHash } from "crypto";
import { eq } from "drizzle-orm";

import { db, adminSessions } from "@/db";

/**
 * lib/auth/session.ts
 *
 * Session lifecycle for the single-author admin portal.
 *
 * Storage model
 * ─────────────
 * Raw token  →  set in HttpOnly cookie (never touches the DB)
 * SHA-256(raw token)  →  stored as token_hash in admin_sessions
 *
 * Verification: hash the cookie value → SELECT WHERE token_hash = hash.
 * This means a compromised DB reveals only hashes, not usable session tokens.
 *
 * Token entropy
 * ─────────────
 * randomBytes(32) produces 256 bits of entropy. The probability of an
 * attacker guessing a valid token is 1/2^256 — computationally impossible.
 *
 * Server-side expiry
 * ──────────────────
 * Sessions expire on the server after SESSION_DURATION_DAYS even if the
 * browser cookie persists. The cookie itself has no maxAge (session-scoped),
 * so it is also cleared when the browser closes — whichever comes first.
 */

const SESSION_DURATION_DAYS = 30;

/** Generates a cryptographically secure 64-char hex session token. */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Returns the SHA-256 hex digest of a raw session token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new session row in admin_sessions.
 *
 * Call after a successful password check. The raw token should be placed
 * in the HttpOnly session cookie immediately after this call returns.
 */
export async function createSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(adminSessions).values({
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
}

/**
 * Verifies that a raw session token corresponds to a live, non-expired session.
 *
 * Expired sessions are deleted from the DB as a side effect (lazy cleanup).
 *
 * @returns `true` if the session is valid and still active.
 */
export async function verifySession(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const rows = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.token_hash, tokenHash))
    .limit(1);

  if (rows.length === 0) return false;

  const { expires_at } = rows[0];

  if (expires_at < new Date()) {
    // Lazy cleanup — remove the expired row so the table stays tidy.
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.token_hash, tokenHash));
    return false;
  }

  return true;
}

/**
 * Destroys a session by deleting the token_hash row from admin_sessions.
 *
 * Should be called on logout before clearing the cookie.
 * Safe to call with an invalid or already-deleted token — the DELETE is a no-op.
 */
export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.delete(adminSessions).where(eq(adminSessions.token_hash, tokenHash));
}
