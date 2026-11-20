"use server";

import { localizeState } from "@/i18n/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getDictionary } from "@/i18n/server";
import { isLocale } from "@/i18n/config";
import { competitionText, gradeText } from "@/i18n/format";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestInfo } from "@/lib/server/request";
import { visibleSet } from "@/lib/server/results";

export type LookupState = {
  error?: string;
  roll?: string;
  result?: { name: string; competition: string; grade: string; absent: boolean; score: string; percent: string; rank: string; award: string | null };
} | undefined;

/** Public result lookup. Needs the roll number and the date of birth, so results can't be browsed. */
async function run(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const roll = String(formData.get("roll") ?? "").trim().toUpperCase().slice(0, 24);
  const dob = String(formData.get("dob") ?? "");
  if (!/^[A-Z]{2,8}-\d{2}-\d{4,10}$/.test(roll)) return { roll, error: "Enter the roll number exactly as it is on the admit card, e.g. MMO-27-100245." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return { roll, error: "Enter the date of birth." };
  const { ip } = await requestInfo();
  if (!(await rateLimit(`result-lookup:${ip ?? "unknown"}`, 20, 600))) return { roll, error: "Too many searches. Please wait a few minutes." };
  const [r] = await db
    .select({ slug: schema.competitions.slug, first: schema.students.firstName, last: schema.students.lastName, competition: schema.competitions.name, grade: schema.results.grade, absent: schema.results.absent, score: schema.results.score, max: schema.results.maxScore, percent: schema.results.percent, rank: schema.results.rank, cohort: schema.results.cohortSize, award: schema.results.awardLabel })
    .from(schema.registrationItems)
    .innerJoin(schema.students, eq(schema.students.id, schema.registrationItems.studentId))
    .innerJoin(schema.results, eq(schema.results.registrationItemId, schema.registrationItems.id))
    .innerJoin(schema.resultSets, eq(schema.resultSets.id, schema.results.resultSetId))
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.results.competitionId))
    .where(and(eq(schema.registrationItems.rollNumber, roll), eq(schema.students.dateOfBirth, dob), visibleSet));
  // Same message whether the roll number, the date of birth or the publication is the problem.
  if (!r) return { roll, error: "No published result matches that roll number and date of birth. Results appear only after EEA publishes them." };
  const loc = String(formData.get("locale") ?? "en");
  const t = await getDictionary(isLocale(loc) ? loc : "en");
  return {
    roll,
    result: {
      name: `${r.first} ${r.last.slice(0, 1)}.`,
      competition: competitionText(t, { slug: r.slug, name: r.competition, summary: "" }).name,
      grade: gradeText(t, r.grade),
      absent: r.absent,
      score: r.absent ? "" : `${Number(r.score)} / ${r.max}`,
      percent: r.absent ? "" : `${Number(r.percent)}%`,
      rank: r.absent ? "" : `${r.rank} of ${r.cohort}`,
      award: r.award ? t.awardNames[r.award] ?? r.award : null,
    },
  };
}

export async function lookupResultAction(prev: LookupState, formData: FormData): Promise<LookupState> {
  return localizeState(await run(prev, formData), formData);
}
