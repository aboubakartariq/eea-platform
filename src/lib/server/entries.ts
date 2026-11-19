import "server-only";
import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { SessionUser } from "@/lib/auth/session";
import { setLetter } from "@/lib/exam/engine";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Gives every student on a confirmed registration a roll number, e.g. MMO-27-100245. */
export async function issueRollNumbers(tx: Tx | typeof db, registrationId: string) {
  const [reg] = await tx
    .select({ code: schema.competitions.code, examDate: schema.competitions.examDate })
    .from(schema.registrations)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId))
    .where(eq(schema.registrations.id, registrationId));
  if (!reg) return 0;
  const yy = (reg.examDate ?? new Date().toISOString()).slice(2, 4);
  const done = await tx
    .update(schema.registrationItems)
    .set({ rollNumber: sql`${`${reg.code}-${yy}-`} || nextval('roll_number_seq')` })
    .where(and(eq(schema.registrationItems.registrationId, registrationId), isNull(schema.registrationItems.rollNumber)))
    .returning({ id: schema.registrationItems.id });
  return done.length;
}

/** The final paper for a student's grade, if one exists. */
export async function paperForGrade(competitionId: string, grade: number) {
  const [p] = await db
    .select({ id: schema.papers.id, code: schema.papers.code, printSets: schema.papers.printSets, durationMinutes: schema.papers.durationMinutes })
    .from(schema.papers)
    .where(and(eq(schema.papers.competitionId, competitionId), eq(schema.papers.status, "final"), lte(schema.papers.gradeFrom, grade), gte(schema.papers.gradeTo, grade)))
    .orderBy(schema.papers.finalisedAt)
    .limit(1);
  return p ?? null;
}

/** Which printed version a paper-mode student sits: spread evenly by roll number. */
export const versionFor = (rollNumber: string, printSets: number) => {
  const n = Number(rollNumber.split("-").pop());
  return setLetter(Number.isFinite(n) ? n % Math.max(1, printSets) : 0);
};

/**
 * Can this user see a student's admit card, results and certificates?
 * Staff with the permission, the student, a linked parent, or the student's school.
 */
export async function canSeeStudent(user: SessionUser, studentId: string, staffPermission: "results.view" | "certificates.view" | "registrations.view") {
  if (user.isStaff) return user.permissions.has(staffPermission);
  if (user.kind === "student") return user.studentId === studentId;
  if (user.kind === "parent") {
    const link = await db.query.studentGuardians.findFirst({ where: and(eq(schema.studentGuardians.userId, user.id), eq(schema.studentGuardians.studentId, studentId)) });
    return !!link;
  }
  if (user.kind === "school" && user.permissions.has("portal.school")) {
    const student = await db.query.students.findFirst({ where: eq(schema.students.id, studentId), columns: { schoolId: true } });
    return !!student?.schoolId && user.roles.some((r) => r.schoolId === student.schoolId);
  }
  return false;
}
