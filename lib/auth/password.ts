import { createHash, timingSafeEqual } from "crypto";

/**
 * lib/auth/password.ts
 *
 * Single-author password validation.
 *
 * Security model
 * ──────────────
 * The admin password lives in ADMIN_PASSWORD (env var). It is never hashed
 * at rest — it's a shared secret between the operator and the server, not
 * something a user chose from a pool of millions. The env var itself is the
 * credential store.
 *
 * Timing-safe comparison
 * ──────────────────────
 * A naïve `attempt === password` leaks password length via timing: Node's
 * string comparison short-circuits on the first differing character, so an
 * attacker measuring latency can infer how many leading characters matched.
 *
 * `crypto.timingSafeEqual` requires both buffers to be the same byte length,
 * which reveals length via a thrown error. To sidestep this, both values are
 * SHA-256-hashed first: the digests are always 32 bytes regardless of input
 * length, making the comparison constant-time with no length oracle.
 *
 * Threat model note: SHA-256 here is not a password *strengthener* — it is
 * purely a length-normaliser to satisfy `timingSafeEqual`. The strength of
 * the authentication depends entirely on ADMIN_PASSWORD being unguessable.
 */

/**
 * Compare a login attempt against the ADMIN_PASSWORD environment variable.
 *
 * @returns `true` if the attempt matches, `false` otherwise.
 * @throws  if ADMIN_PASSWORD is not set in the environment.
 */
export function verifyAdminPassword(attempt: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD is not set. " +
        "Add it to .env.local for local development or to your Vercel project environment variables.",
    );
  }

  // Hash both sides to equalise buffer length before constant-time compare.
  const attemptHash = createHash("sha256").update(attempt).digest();
  const passwordHash = createHash("sha256").update(adminPassword).digest();

  return timingSafeEqual(attemptHash, passwordHash);
}
