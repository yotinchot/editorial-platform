import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not auto-load .env.local (that is a Next.js convention).
// Load it explicitly so all db:* scripts pick up local credentials.
config({ path: ".env.local" });

/**
 * Drizzle Kit configuration.
 *
 * - `generate` reads schema only — no DB connection required.
 * - `migrate`, `studio`, `push` require POSTGRES_URL_NON_POOLING (direct
 *   connection, bypasses PgBouncer which blocks DDL statements).
 *
 * Usage:
 *   pnpm db:generate   → write SQL to db/migrations/
 *   pnpm db:migrate    → apply pending migrations to Vercel Postgres
 *   pnpm db:studio     → open Drizzle Studio browser UI
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: {
    // Direct (non-pooled) connection is required for DDL migrations.
    // Use the pooled POSTGRES_URL for runtime queries in db/client.ts.
    url: process.env.POSTGRES_URL_NON_POOLING ?? "",
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "public",
  },
  verbose: true,
  strict: true,
});
