import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Fixed-window rate limit stored in Postgres. Returns true when the call is allowed.
 * Atomic: one upsert per call.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const t = schema.rateLimits;
  const [row] = await db
    .insert(t)
    .values({ key, windowStart: new Date(), count: 1 })
    .onConflictDoUpdate({
      target: t.key,
      set: {
        count: sql`case when ${t.windowStart} < now() - make_interval(secs => ${windowSeconds}) then 1 else ${t.count} + 1 end`,
        windowStart: sql`case when ${t.windowStart} < now() - make_interval(secs => ${windowSeconds}) then now() else ${t.windowStart} end`,
      },
    })
    .returning({ count: t.count });
  return row.count <= limit;
}
