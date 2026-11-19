import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse one pool across hot reloads in development.
const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
// An idle connection dropped by the database (restart, failover) must not crash the app;
// the pool replaces it on the next query.
if (!pool.listenerCount("error")) pool.on("error", (err) => console.error("Database connection lost:", err.message));

export const db = drizzle(pool, { schema });
export { schema };
