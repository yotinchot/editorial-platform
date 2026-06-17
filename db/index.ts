/**
 * db/index.ts
 *
 * TODO (Phase 2 — Database & Content Model):
 *
 * Responsibilities:
 * - Instantiate the Drizzle ORM client bound to Vercel Postgres.
 * - Export `db` as the single query interface used throughout the app.
 *
 * Implementation notes:
 * - Use `@vercel/postgres` + `drizzle-orm/vercel-postgres` adapter.
 * - The connection string comes from POSTGRES_URL (set in Vercel env vars).
 * - Import schema tables from `db/schema/index.ts` and pass to `drizzle()`.
 * - This file runs only on the server; never import it from client components.
 *
 * Example:
 *   import { drizzle } from "drizzle-orm/vercel-postgres";
 *   import { sql } from "@vercel/postgres";
 *   import * as schema from "./schema";
 *
 *   export const db = drizzle(sql, { schema });
 */

export {};
