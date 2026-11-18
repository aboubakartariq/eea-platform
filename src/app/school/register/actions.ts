"use server";

import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertSchoolManager } from "@/lib/auth/school";
import { getOpenCompetitions } from "@/lib/competitions";
import { isEligible } from "@/lib/competition-types";
import { audit } from "@/lib/server/audit";

export type RegisterState = { error?: string } | undefined;

export async function createRegistrationAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const { school, user } = await assertSchoolManager();
  const competitionId = z.string().uuid().parse(formData.get("competitionId"));
  const mode = z.enum(["online", "paper"]).safeParse(formData.get("mode"));
  const ids = z.array(z.string().uuid()).max(5000).safeParse(formData.getAll("studentIds"));
  if (!ids.success || ids.data.length === 0) return { error: "Select at least one student." };
  if (!mode.success) return { error: "Choose how your students will take the exam." };

  const competition = (await getOpenCompetitions()).find((c) => c.id === competitionId);
  if (!competition) return { error: "Registration for this competition is closed." };
  if (!competition.modes.includes(mode.data)) return { error: "This exam mode isn't offered for this competition." };

  const uniqueIds = [...new Set(ids.data)];
  const students = await db.select({ id: schema.students.id, grade: schema.students.grade }).from(schema.students).where(and(eq(schema.students.schoolId, school.id), eq(schema.students.archived, false), inArray(schema.students.id, uniqueIds)));
  if (students.length !== uniqueIds.length) return { error: "Some selected students were not found in your list. Refresh the page and try again." };
  const ineligible = students.filter((s) => !isEligible(competition, s.grade));
  if (ineligible.length) return { error: `${ineligible.length} selected student(s) are not in the eligible grades.` };
  const already = await db.select({ id: schema.registrationItems.studentId }).from(schema.registrationItems).where(and(eq(schema.registrationItems.competitionId, competitionId), inArray(schema.registrationItems.studentId, uniqueIds)));
  if (already.length) return { error: `${already.length} selected student(s) are already registered for this competition.` };

  const fee = competition.feePkr!;
  let registrationId: string;
  try {
    registrationId = await db.transaction(async (tx) => {
      const year = competition.examDate!.slice(0, 4);
      const [reg] = await tx
        .insert(schema.registrations)
        .values({
          reference: sql`${`REG-${year}-`} || nextval('registration_ref_seq')`,
          schoolId: school.id,
          competitionId,
          mode: mode.data,
          feePkr: fee,
          studentCount: students.length,
          totalPkr: fee * students.length,
          createdBy: user.id,
        })
        .returning({ id: schema.registrations.id, reference: schema.registrations.reference });
      await tx.insert(schema.registrationItems).values(students.map((s) => ({ registrationId: reg.id, competitionId, studentId: s.id, grade: s.grade })));
      return reg.id;
    });
  } catch (e) {
    if (String((e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code) === "23505") return { error: "Some students were registered by someone else just now. Refresh and try again." };
    throw e;
  }
  await audit({ actorUserId: user.id, action: "registration.created", entityType: "registration", entityId: registrationId, after: { schoolId: school.id, competition: competition.code, students: students.length, totalPkr: fee * students.length } });
  redirect(`/school/registrations/${registrationId}?new=1`);
}
