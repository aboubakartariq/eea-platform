import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { visibleSet } from "./results";

/** Published results for one school's students in one competition. */
export async function schoolResults(schoolId: string, competitionId: string) {
  return db
    .select({
      id: schema.results.id, grade: schema.results.grade, rank: schema.results.rank, cohort: schema.results.cohortSize, rankInSchool: schema.results.rankInSchool, schoolCohort: schema.results.schoolCohortSize,
      score: schema.results.score, max: schema.results.maxScore, percent: schema.results.percent, award: schema.results.awardLabel, absent: schema.results.absent,
      first: schema.students.firstName, last: schema.students.lastName, code: schema.students.code, section: schema.students.section, roll: schema.registrationItems.rollNumber,
      certificateId: schema.certificates.id, revoked: schema.certificates.revokedAt,
    })
    .from(schema.results)
    .innerJoin(schema.resultSets, eq(schema.resultSets.id, schema.results.resultSetId))
    .innerJoin(schema.students, eq(schema.students.id, schema.results.studentId))
    .innerJoin(schema.registrationItems, eq(schema.registrationItems.id, schema.results.registrationItemId))
    .leftJoin(schema.certificates, eq(schema.certificates.resultId, schema.results.id))
    .where(and(eq(schema.results.schoolId, schoolId), eq(schema.results.competitionId, competitionId), visibleSet))
    .orderBy(asc(schema.results.grade), sql`${schema.results.rank} asc nulls last`, asc(schema.students.lastName));
}

export async function schoolResultCompetitions(schoolId: string) {
  return db
    .selectDistinct({ id: schema.competitions.id, name: schema.competitions.name })
    .from(schema.results)
    .innerJoin(schema.resultSets, eq(schema.resultSets.id, schema.results.resultSetId))
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.results.competitionId))
    .where(and(eq(schema.results.schoolId, schoolId), visibleSet));
}
