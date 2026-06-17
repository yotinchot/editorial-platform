import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Admin session store.
 *
 * Security model:
 * - A raw session token is generated at login time (crypto.randomBytes).
 * - Only the SHA-256 hash is stored here — the raw token is placed in the
 *   HttpOnly cookie and never written to the DB.
 * - Validation: hash the incoming cookie value → compare to token_hash.
 * - Expired rows should be cleaned up periodically; a Vercel Cron job
 *   calling DELETE WHERE expires_at < NOW() is sufficient.
 *
 * Implementation lives in lib/auth/session.ts (Phase 3).
 */
export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // SHA-256 hex digest of the raw session token in the cookie.
  token_hash: text("token_hash").notNull().unique(),

  // Absolute expiry — server rejects sessions past this timestamp.
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),

  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;
