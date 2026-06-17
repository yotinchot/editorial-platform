import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

/**
 * Drizzle ORM client — the single database interface for the application.
 *
 * Uses postgres.js (standard TCP/SSL) which works with any standard
 * PostgreSQL endpoint including Prisma Data Platform (db.prisma.io),
 * Neon, Supabase, and self-hosted Postgres.
 *
 * In serverless runtimes (Vercel), max: 1 prevents connection pool
 * exhaustion — each function instance opens one connection.
 *
 * This file is server-only. Never import it from client components.
 */

if (!process.env.POSTGRES_URL) {
  throw new Error(
    "POSTGRES_URL is not set. " +
      "Add it to .env.local for local development or to your Vercel project environment variables.",
  );
}

const client = postgres(process.env.POSTGRES_URL, {
  // Keep max:1 for serverless — each invocation owns one connection.
  // Increase only if running in a long-lived Node.js server.
  max: 1,
  ssl: "require",
});

export const db = drizzle(client, { schema });
