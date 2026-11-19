import "server-only";
import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { paperForGrade, versionFor } from "./entries";

export async function admitCards(where: { itemIds?: string[]; schoolId?: string; competitionId?: string }) {
  const rows = await db
    .select({
      itemId: schema.registrationItems.id, roll: schema.registrationItems.rollNumber, grade: schema.registrationItems.grade, studentId: schema.students.id,
      first: schema.students.firstName, last: schema.students.lastName, code: schema.students.code, section: schema.students.section,
      school: sql<string | null>`coalesce(${schema.schools.name}, ${schema.students.schoolName})`, schoolCode: schema.schools.code,
      competitionId: schema.competitions.id, competition: schema.competitions.name, examDate: schema.competitions.examDate, duration: schema.competitions.durationMinutes, mode: schema.registrations.mode,
    })
    .from(schema.registrationItems)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
    .innerJoin(schema.students, eq(schema.students.id, schema.registrationItems.studentId))
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrationItems.competitionId))
    .leftJoin(schema.schools, eq(schema.schools.id, schema.registrations.schoolId))
    .where(
      and(
        eq(schema.registrations.status, "confirmed"),
        isNotNull(schema.registrationItems.rollNumber),
        where.itemIds ? inArray(schema.registrationItems.id, where.itemIds.length ? where.itemIds : ["00000000-0000-0000-0000-000000000000"]) : undefined,
        where.schoolId ? eq(schema.registrations.schoolId, where.schoolId) : undefined,
        where.competitionId ? eq(schema.registrationItems.competitionId, where.competitionId) : undefined,
      ),
    )
    .orderBy(asc(schema.registrationItems.grade), asc(schema.students.section), asc(schema.students.lastName));
  const papers = new Map<string, Awaited<ReturnType<typeof paperForGrade>>>();
  return Promise.all(
    rows.map(async (r) => {
      const key = `${r.competitionId}|${r.grade}`;
      if (r.mode === "paper" && !papers.has(key)) papers.set(key, await paperForGrade(r.competitionId, r.grade));
      const paper = papers.get(key);
      return { ...r, version: r.mode === "paper" && paper ? versionFor(r.roll!, paper.printSets) : null, paperDuration: paper?.durationMinutes ?? null };
    }),
  );
}
export type AdmitCardData = Awaited<ReturnType<typeof admitCards>>[number];
