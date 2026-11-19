"use server";

import { keepValues, type FormValues } from "@/lib/form-values";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireOwnChild, requireParent } from "@/lib/auth/family";
import { passwordProblem } from "@/lib/auth/password";
import { getOpenCompetitions } from "@/lib/competitions";
import { isEligible } from "@/lib/competition-types";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { setStudentLogin } from "@/lib/server/student-accounts";
import { normalisePhone, parseDate, validateRow } from "@/lib/student-import";

export type ParentFormState = { values?: FormValues; ok?: string; error?: string; fieldErrors?: Record<string, string> } | undefined;

const todayPk = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
const isUnique = (e: unknown) => String((e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code) === "23505";

/** Link a child their school already registered: student ID + date of birth + the parent mobile on the school's record. */
export async function linkChildAction(_prev: ParentFormState, formData: FormData): Promise<ParentFormState> {
  const user = await requireParent();
  if (!(await rateLimit(`link-child:${user.id}`, 10, 60 * 60))) return { values: keepValues(formData), error: "Too many attempts. Please try again in an hour." };
  const code = String(formData.get("studentCode") ?? "").trim().toUpperCase();
  const dob = parseDate(formData.get("dateOfBirth"));
  const phone = normalisePhone(formData.get("phone"));
  if (!/^EEA-S-\d{4,10}$/.test(code) || !dob || !phone) return { values: keepValues(formData), error: "Enter the student ID (e.g. EEA-S-100245), date of birth and mobile number." };

  const student = await db.query.students.findFirst({ where: and(eq(schema.students.code, code), eq(schema.students.archived, false)) });
  const matches = student && student.dateOfBirth === dob && student.guardianPhone === phone;
  if (!matches) {
    await audit({ actorUserId: user.id, action: "parent.link_failed", entityType: "student", entityId: student?.id, after: { code } });
    return { values: keepValues(formData), error: "We couldn't match these details. Check the student ID and date of birth, and use the mobile number the school has on record. If it still doesn't work, ask the school to update the number." };
  }
  await db.insert(schema.studentGuardians).values({ studentId: student.id, userId: user.id, linkedVia: "claimed" }).onConflictDoNothing();
  await audit({ actorUserId: user.id, action: "parent.child_linked", entityType: "student", entityId: student.id });
  redirect(`/parent/children/${student.id}?linked=1`);
}

/** Add a child whose school isn't taking part (an individual entrant). */
export async function addChildAction(_prev: ParentFormState, formData: FormData): Promise<ParentFormState> {
  const user = await requireParent();
  if (!(await rateLimit(`add-child:${user.id}`, 20, 60 * 60))) return { values: keepValues(formData), error: "Too many attempts. Please try again later." };
  const parent = await db.query.users.findFirst({ where: eq(schema.users.id, user.id) });
  const { value, errors } = validateRow(
    {
      firstName: formData.get("firstName"), lastName: formData.get("lastName"), dateOfBirth: formData.get("dateOfBirth"), grade: formData.get("grade"),
      gender: formData.get("gender"), guardianName: parent?.name, guardianPhone: parent?.phone, guardianEmail: parent?.email,
    },
    todayPk(),
  );
  if (!value) return { values: keepValues(formData), error: errors.join(" ") };
  const schoolName = String(formData.get("schoolName") ?? "").trim().slice(0, 200) || null;

  try {
    const studentId = await db.transaction(async (tx) => {
      const [s] = await tx
        .insert(schema.students)
        .values({ ...value, schoolId: null, schoolName, addedByGuardian: user.id, createdBy: user.id, code: sql<string>`'EEA-S-' || nextval('student_code_seq')` })
        .returning({ id: schema.students.id });
      await tx.insert(schema.studentGuardians).values({ studentId: s.id, userId: user.id, linkedVia: "added" });
      return s.id;
    });
    await audit({ actorUserId: user.id, action: "parent.child_added", entityType: "student", entityId: studentId });
    redirect(`/parent/children/${studentId}?added=1`);
  } catch (e) {
    if (isUnique(e)) return { values: keepValues(formData), error: "You have already added a child with this name and date of birth." };
    throw e;
  }
}

/** Create or reset the child's own login (username = student ID). */
export async function setChildLoginAction(_prev: ParentFormState, formData: FormData): Promise<ParentFormState> {
  const studentId = z.string().uuid().parse(formData.get("studentId"));
  const { user, student } = await requireOwnChild(studentId);
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirm") ?? "")) return { values: keepValues(formData), fieldErrors: { confirm: "The passwords don't match." } };
  const problem = passwordProblem(password, { minLength: 8 });
  if (problem) return { values: keepValues(formData), fieldErrors: { password: problem } };
  const r = await setStudentLogin(student, password);
  await audit({ actorUserId: user.id, action: r.created ? "student.login_created" : "student.login_reset", entityType: "student", entityId: student.id });
  revalidatePath(`/parent/children/${studentId}`);
  return { ok: `${student.firstName} can now sign in with student ID ${student.code} and the password you chose.` };
}

/** Register children for an online competition (individual entry). */
export async function registerChildrenAction(_prev: ParentFormState, formData: FormData): Promise<ParentFormState> {
  const user = await requireParent();
  const competitionId = z.string().uuid().parse(formData.get("competitionId"));
  const ids = z.array(z.string().uuid()).max(20).safeParse(formData.getAll("studentIds"));
  if (!ids.success || ids.data.length === 0) return { values: keepValues(formData), error: "Choose at least one child." };
  const competition = (await getOpenCompetitions()).find((c) => c.id === competitionId);
  if (!competition) return { values: keepValues(formData), error: "Registration for this competition is closed." };
  if (!competition.modes.includes("online")) return { values: keepValues(formData), error: "This competition is held on paper at schools, so it can only be entered through a school." };

  const uniqueIds = [...new Set(ids.data)];
  const children = await db
    .select({ id: schema.students.id, grade: schema.students.grade, schoolId: schema.students.schoolId })
    .from(schema.studentGuardians)
    .innerJoin(schema.students, eq(schema.students.id, schema.studentGuardians.studentId))
    .where(and(eq(schema.studentGuardians.userId, user.id), inArray(schema.students.id, uniqueIds), eq(schema.students.archived, false)));
  if (children.length !== uniqueIds.length) return { values: keepValues(formData), error: "One of the selected children isn't linked to your account." };
  if (children.some((c) => !isEligible(competition, c.grade))) return { values: keepValues(formData), error: "One of the selected children isn't in an eligible grade." };
  const already = await db.select({ id: schema.registrationItems.studentId }).from(schema.registrationItems).where(and(eq(schema.registrationItems.competitionId, competitionId), inArray(schema.registrationItems.studentId, uniqueIds)));
  if (already.length) return { values: keepValues(formData), error: "A selected child is already registered for this competition (possibly by their school)." };

  const fee = competition.feePkr!;
  let registrationId: string;
  try {
    registrationId = await db.transaction(async (tx) => {
      const [reg] = await tx
        .insert(schema.registrations)
        .values({ reference: sql`${`REG-${competition.examDate!.slice(0, 4)}-`} || nextval('registration_ref_seq')`, guardianUserId: user.id, competitionId, mode: "online", feePkr: fee, studentCount: children.length, totalPkr: fee * children.length, createdBy: user.id })
        .returning({ id: schema.registrations.id });
      await tx.insert(schema.registrationItems).values(children.map((c) => ({ registrationId: reg.id, competitionId, studentId: c.id, grade: c.grade })));
      return reg.id;
    });
  } catch (e) {
    if (isUnique(e)) return { values: keepValues(formData), error: "A selected child was registered for this competition just now. Refresh and try again." };
    throw e;
  }
  await audit({ actorUserId: user.id, action: "registration.created", entityType: "registration", entityId: registrationId, after: { guardian: user.id, competition: competition.code, students: children.length, totalPkr: fee * children.length } });
  redirect(`/parent/registrations/${registrationId}?new=1`);
}
