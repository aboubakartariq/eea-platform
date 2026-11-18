import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Accent, PublicCompetition } from "./competition-types";

export const COMPETITIONS_TAG = "competitions";

const toPublic = (r: typeof schema.competitions.$inferSelect): PublicCompetition => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  code: r.code,
  kind: r.kind,
  accent: (["gold", "blue", "magenta", "navy"].includes(r.accent) ? r.accent : "blue") as Accent,
  icon: r.icon,
  summary: r.summary,
  gradeFrom: r.gradeFrom,
  gradeTo: r.gradeTo,
  modes: r.modes,
  levels: r.levels,
  durationMinutes: r.durationMinutes,
  feePkr: r.feePkr,
  registrationCloses: r.registrationCloses,
  examDate: r.examDate,
  content: r.content,
});

/** Published competitions, cached and refreshed when staff edit a competition. */
export async function getPublishedCompetitions(): Promise<PublicCompetition[]> {
  "use cache";
  cacheTag(COMPETITIONS_TAG);
  cacheLife("hours");
  const rows = await db.select().from(schema.competitions).where(eq(schema.competitions.status, "published")).orderBy(asc(schema.competitions.sortOrder), asc(schema.competitions.name));
  return rows.map(toPublic);
}

export async function getPublishedCompetition(slug: string): Promise<PublicCompetition | null> {
  "use cache";
  cacheTag(COMPETITIONS_TAG);
  cacheLife("hours");
  const row = await db.query.competitions.findFirst({ where: and(eq(schema.competitions.slug, slug), eq(schema.competitions.status, "published")) });
  return row ? toPublic(row) : null;
}

/** Upcoming first; competitions without a date go last. */
export const byExamDate = (a: PublicCompetition, b: PublicCompetition) => (a.examDate ?? "9999").localeCompare(b.examDate ?? "9999");

/** Competitions schools can register for today (published, details complete, not closed). Not cached. */
export async function getOpenCompetitions(): Promise<PublicCompetition[]> {
  const { gte, isNotNull, sql } = await import("drizzle-orm");
  const t = schema.competitions;
  const rows = await db
    .select()
    .from(t)
    .where(and(eq(t.status, "published"), isNotNull(t.gradeFrom), isNotNull(t.gradeTo), isNotNull(t.feePkr), isNotNull(t.examDate), gte(t.registrationCloses, sql`current_date`)))
    .orderBy(asc(t.registrationCloses));
  return rows.map(toPublic);
}
