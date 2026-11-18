"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertSchoolManager } from "@/lib/auth/school";
import { audit } from "@/lib/server/audit";
import { readStudentSheet } from "@/lib/server/excel";
import { rateLimit } from "@/lib/server/rate-limit";
import { checkRows, dedupeKey, validateRow, type CleanStudent } from "@/lib/student-import";

export type StudentFormState = { ok?: string; error?: string; fieldErrors?: Record<string, string> } | undefined;

const todayPk = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

async function existingKeys(schoolId: string) {
  const rows = await db.select({ f: schema.students.firstName, l: schema.students.lastName, d: schema.students.dateOfBirth }).from(schema.students).where(eq(schema.students.schoolId, schoolId));
  return new Set(rows.map((r) => dedupeKey({ firstName: r.f, lastName: r.l, dateOfBirth: r.d })));
}

const studentValues = (schoolId: string, userId: string, s: CleanStudent) => ({
  ...s,
  schoolId,
  createdBy: userId,
  code: sql<string>`'EEA-S-' || nextval('student_code_seq')`,
});

export async function addStudentAction(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const { school, user } = await assertSchoolManager();
  const raw = Object.fromEntries(["firstName", "lastName", "dateOfBirth", "grade", "section", "gender", "guardianName", "guardianPhone", "guardianEmail"].map((k) => [k, formData.get(k) ?? ""]));
  const { value, errors } = validateRow(raw, todayPk());
  if (!value) return { error: errors.join(" ") };
  if ((await existingKeys(school.id)).has(dedupeKey(value))) return { error: "This student is already in your list (same name and date of birth)." };
  const [row] = await db.insert(schema.students).values(studentValues(school.id, user.id, value)).returning({ id: schema.students.id, code: schema.students.code });
  await audit({ actorUserId: user.id, action: "student.created", entityType: "student", entityId: row.id, after: { schoolId: school.id, grade: value.grade } });
  revalidatePath("/school/students");
  return { ok: `${value.firstName} ${value.lastName} added with student ID ${row.code}.` };
}

export type UploadState = { error?: string } | undefined;

export async function uploadStudentFileAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const { school, user } = await assertSchoolManager();
  if (!(await rateLimit(`import:${school.id}`, 20, 60 * 60))) return { error: "Too many uploads. Please wait a while and try again." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an Excel file to upload." };
  if (file.size > 2 * 1024 * 1024) return { error: "The file is larger than 2 MB. Split it into smaller files." };
  if (!/\.xlsx$/i.test(file.name)) return { error: "Please upload an Excel .xlsx file (Excel: File › Save As › Excel Workbook)." };

  let sheet;
  try {
    sheet = await readStudentSheet(await file.arrayBuffer());
  } catch {
    return { error: "This file couldn't be read as an Excel workbook. Save it as .xlsx and try again." };
  }
  if ("error" in sheet) return { error: sheet.error };

  const checked = checkRows(sheet.rows, await existingKeys(school.id), todayPk());
  const tally = (s: string) => checked.filter((r) => r.status === s).length;
  const imp = await db.transaction(async (tx) => {
    const [i] = await tx
      .insert(schema.bulkImports)
      .values({ schoolId: school.id, uploadedBy: user.id, fileName: file.name.slice(0, 200), totalRows: checked.length, validRows: tally("valid"), errorRows: tally("error"), duplicateRows: tally("duplicate") })
      .returning({ id: schema.bulkImports.id });
    for (let k = 0; k < checked.length; k += 500) {
      await tx.insert(schema.importRows).values(checked.slice(k, k + 500).map((r) => ({ importId: i.id, rowNumber: r.rowNumber, data: r.data, errors: r.errors, status: r.status })));
    }
    return i;
  });
  redirect(`/school/students/import/${imp.id}`);
}

export async function confirmImportAction(formData: FormData) {
  const { school, user } = await assertSchoolManager();
  const id = z.string().uuid().parse(formData.get("importId"));
  const imp = await db.query.bulkImports.findFirst({ where: and(eq(schema.bulkImports.id, id), eq(schema.bulkImports.schoolId, school.id)) });
  if (!imp || imp.status !== "previewed") redirect(`/school/students/import/${id}`);

  const rows = await db.select().from(schema.importRows).where(and(eq(schema.importRows.importId, id), eq(schema.importRows.status, "valid")));
  // Re-check against the current list in case students were added since the preview.
  const keys = await existingKeys(school.id);
  const today = todayPk();
  let imported = 0;
  await db.transaction(async (tx) => {
    for (const r of rows) {
      const { value } = validateRow(r.data, today);
      if (!value || keys.has(dedupeKey(value))) {
        await tx.update(schema.importRows).set({ status: "duplicate", errors: ["Added to your list after this file was checked."] }).where(eq(schema.importRows.id, r.id));
        continue;
      }
      keys.add(dedupeKey(value));
      const [s] = await tx.insert(schema.students).values(studentValues(school.id, user.id, value)).returning({ id: schema.students.id });
      await tx.update(schema.importRows).set({ status: "imported", studentId: s.id }).where(eq(schema.importRows.id, r.id));
      imported++;
    }
    await tx.update(schema.bulkImports).set({ status: "imported", importedRows: imported, completedAt: new Date() }).where(eq(schema.bulkImports.id, id));
  });
  await audit({ actorUserId: user.id, action: "students.imported", entityType: "import", entityId: id, after: { schoolId: school.id, file: imp.fileName, imported } });
  revalidatePath("/school/students");
  redirect(`/school/students/import/${id}`);
}

export async function cancelImportAction(formData: FormData) {
  const { school } = await assertSchoolManager();
  const id = z.string().uuid().parse(formData.get("importId"));
  await db.update(schema.bulkImports).set({ status: "cancelled", completedAt: new Date() }).where(and(eq(schema.bulkImports.id, id), eq(schema.bulkImports.schoolId, school.id), eq(schema.bulkImports.status, "previewed")));
  redirect("/school/students/import");
}
