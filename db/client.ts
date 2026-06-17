import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Drizzle ORM client — the single database interface for the application.
 *
 * Uses the Neon serverless HTTP driver, which is optimised for Vercel's
 * serverless and edge runtimes (no persistent TCP connection required).
 *
 * The POSTGRES_URL env var is the pooled connection string provided by
 * Vercel when you attach a Postgres database to the project.
 *
 * This file is server-only. Never import it from client components.
 */

if (!process.env.POSTGRES_URL) {
  throw new Error(
    "POSTGRES_URL is not set. " +
      "Add it to .env.local for local development or to your Vercel project environment variables.",
  );
}

const sql = neon(process.env.POSTGRES_URL);

export const db = drizzle(sql, { schema });
