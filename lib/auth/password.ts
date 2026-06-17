/**
 * lib/auth/password.ts
 *
 * TODO (Authentication Phase):
 *
 * Responsibilities:
 * - Compare a plaintext password attempt against the stored admin credential.
 * - The "stored credential" is the ADMIN_PASSWORD environment variable —
 *   there is no password hashing required because this is a single-author
 *   platform and the secret never touches the database.
 *
 * Security notes:
 * - Use `crypto.timingSafeEqual` to prevent timing-attack enumeration.
 * - Never log the attempt value, even in development.
 * - The env var is read server-side only; it must never appear in client bundles.
 *
 * Example surface:
 *   export function verifyAdminPassword(attempt: string): boolean
 */

export {};
