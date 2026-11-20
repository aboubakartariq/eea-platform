"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import type { FormState } from "@/lib/auth/actions";
import { keepValues } from "@/lib/form-values";
import { OPTION_IDS, toSnapshot, validateQuestion, type QuestionInput } from "@/lib/questions";
import { validateQuestionRow } from "@/lib/question-import";
import { audit } from "@/lib/server/audit";
import { readQuestionSheet } from "@/lib/server/excel";

const uuid = z.string().uuid();
const lines = (v: FormDataEntryValue | null) => String(v ?? "").split(/\r?\n/);

function fromForm(formData: FormData) {
  return validateQuestion({
    competitionId: String(formData.get("competitionId") ?? ""),
    gradeFrom: String(formData.get("gradeFrom") ?? ""),
    gradeTo: String(formData.get("gradeTo") ?? ""),
    level: String(formData.get("level") ?? "1"),
    type: String(formData.get("type") ?? ""),
    stem: String(formData.get("stem") ?? ""),
    optionText: Object.fromEntries(OPTION_IDS.map((id) => [id, String(formData.get(`opt${id}`) ?? "")])),
    correct: formData.getAll("correct").map(String),
    numericValue: String(formData.get("numericValue") ?? ""),
    tolerance: String(formData.get("tolerance") ?? ""),
    accepted: lines(formData.get("accepted")),
    explanation: String(formData.get("explanation") ?? ""),
    topic: String(formData.get("topic") ?? ""),
    difficulty: String(formData.get("difficulty") ?? ""),
    tags: String(formData.get("tags") ?? "").split(","),
    marks: String(formData.get("marks") ?? "1"),
  });
}

async function competitionExists(id: string) {
  if (!uuid.safeParse(id).success) return false;
  return !!(await db.query.competitions.findFirst({ where: eq(schema.competitions.id, id), columns: { id: true } }));
}

const sameContent = (a: QuestionInput, b: QuestionInput) => JSON.stringify(toSnapshot(a)) === JSON.stringify(toSnapshot(b)) && a.competitionId === b.competitionId;

export async function saveQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("questions.manage");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  if (id && !uuid.safeParse(id).success) return { error: "Question not found." };
  const parsed = fromForm(formData);
  if (!parsed.ok) return { values: keepValues(formData), error: "Please fix the highlighted fields.", fieldErrors: parsed.errors };
  const v = parsed.value;
  if (!(await competitionExists(v.competitionId))) return { values: keepValues(formData), fieldErrors: { competitionId: "Choose a competition." } };

  if (!id) {
    const newId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(schema.questions)
        .values({ ...v, code: sql`'Q-' || nextval('question_code_seq')`, createdBy: actor.id, updatedBy: actor.id })
        .returning({ id: schema.questions.id, code: schema.questions.code });
      await tx.insert(schema.questionVersions).values({ questionId: row.id, version: 1, snapshot: toSnapshot(v), changedBy: actor.id });
      return row;
    });
    await audit({ actorUserId: actor.id, action: "question.created", entityType: "question", entityId: newId.id, after: { code: newId.code } });
    revalidatePath("/admin/questions");
    redirect(`/admin/questions/${newId.id}?saved=1`);
  }

  const before = await db.query.questions.findFirst({ where: eq(schema.questions.id, id) });
  if (!before) return { error: "Question not found." };
  if (before.status === "retired") return { values: keepValues(formData), error: "This question is retired. Restore it before editing." };
  const beforeInput: QuestionInput = { ...before, explanation: before.explanation, type: before.type, difficulty: before.difficulty };
  if (sameContent(beforeInput, v)) return { ok: "No changes to save." };

  const version = before.version + 1;
  await db.transaction(async (tx) => {
    await tx
      .update(schema.questions)
      .set({ ...v, version, status: "draft", updatedBy: actor.id, approvedBy: null, approvedAt: null, reviewNote: null })
      .where(eq(schema.questions.id, id));
    await tx.insert(schema.questionVersions).values({ questionId: id, version, snapshot: toSnapshot(v), changedBy: actor.id });
  });
  await audit({ actorUserId: actor.id, action: "question.updated", entityType: "question", entityId: id, before: { version: before.version, status: before.status }, after: { version, status: "draft" } });
  revalidatePath(`/admin/questions/${id}`);
  return {
    ok: before.status === "approved"
      ? `Saved as version ${version}. It was approved before, so it now needs approving again. Papers already made keep the old version.`
      : `Saved as version ${version}.`,
  };
}

type ReviewState = { error?: string; ok?: string } | undefined;

/** Moves one question between statuses, enforcing who may do what. */
export async function reviewQuestionAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const op = String(formData.get("op"));
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) return { error: "Question not found." };
  const needs = op === "submit" || op === "restore" ? "questions.manage" : "questions.approve";
  const actor = await assertPermission(needs);
  const q = await db.query.questions.findFirst({ where: eq(schema.questions.id, id) });
  if (!q) return { error: "Question not found." };
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;

  let set: Partial<typeof schema.questions.$inferInsert> | null = null;
  let message = "";
  if (op === "submit" && q.status === "draft") {
    set = { status: "review", reviewNote: null };
    message = "Sent for review.";
  } else if (op === "approve" && q.status === "review") {
    // Maker–checker: the person who wrote this version cannot approve it.
    if (q.updatedBy === actor.id) return { error: "You wrote this version, so someone else must approve it." };
    set = { status: "approved", approvedBy: actor.id, approvedAt: new Date(), reviewNote: null };
    message = "Approved. It can now be used on papers.";
  } else if (op === "send_back" && q.status === "review") {
    if (!note) return { error: "Write a note so the author knows what to change." };
    set = { status: "draft", reviewNote: note };
    message = "Sent back to the author with your note.";
  } else if (op === "retire" && q.status !== "retired") {
    set = { status: "retired" };
    message = "Retired. It will not be picked for new papers.";
  } else if (op === "restore" && q.status === "retired") {
    set = { status: "draft", approvedBy: null, approvedAt: null };
    message = "Restored as a draft.";
  }
  if (!set) return { error: "That change isn't possible from the question's current status. Reload the page." };
  // Only change it if nobody else changed the status meanwhile.
  const done = await db.update(schema.questions).set(set).where(and(eq(schema.questions.id, id), eq(schema.questions.status, q.status))).returning({ id: schema.questions.id });
  if (!done.length) return { error: "Someone else changed this question just now. Reload the page." };
  await audit({ actorUserId: actor.id, action: `question.${op}`, entityType: "question", entityId: id, before: { status: q.status }, after: { status: set.status, note } });
  revalidatePath(`/admin/questions/${id}`);
  revalidatePath("/admin/questions");
  return { ok: message };
}

/** Approves several questions at once from the list (skipping any the approver wrote). */
export async function bulkApproveAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const actor = await assertPermission("questions.approve");
  const ids = formData.getAll("ids").map(String).filter((s) => uuid.safeParse(s).success).slice(0, 500);
  if (!ids.length) return { error: "Tick the questions you want to approve." };
  const rows = await db.select({ id: schema.questions.id, status: schema.questions.status, updatedBy: schema.questions.updatedBy }).from(schema.questions).where(inArray(schema.questions.id, ids));
  const ok = rows.filter((r) => r.status === "review" && r.updatedBy !== actor.id).map((r) => r.id);
  const own = rows.filter((r) => r.status === "review" && r.updatedBy === actor.id).length;
  if (ok.length) {
    await db.update(schema.questions).set({ status: "approved", approvedBy: actor.id, approvedAt: new Date(), reviewNote: null }).where(and(inArray(schema.questions.id, ok), eq(schema.questions.status, "review")));
    await audit({ actorUserId: actor.id, action: "question.approve_bulk", entityType: "question", after: { count: ok.length, ids: ok } });
  }
  revalidatePath("/admin/questions");
  const skipped = rows.length - ok.length;
  return ok.length
    ? { ok: `Approved: ${ok.length}.${skipped ? ` Skipped: ${skipped}.` : ""}${own ? ` Written by you, so skipped: ${own}.` : ""}` }
    : { error: own ? "You wrote these questions, so someone else must approve them." : "None of the ticked questions are waiting for review." };
}

export type QuestionImportState = { error?: string; ok?: string; rowErrors?: { row: number; errors: string[] }[] } | undefined;

/** Imports a whole sheet as drafts. If any row has a problem, nothing is imported. */
export async function importQuestionsAction(_prev: QuestionImportState, formData: FormData): Promise<QuestionImportState> {
  const actor = await assertPermission("questions.manage");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an Excel file to upload." };
  if (file.size > 3 * 1024 * 1024) return { error: "The file is larger than 3 MB. Split it into smaller files." };
  if (!/\.xlsx$/i.test(file.name)) return { error: "Please upload an Excel .xlsx file." };
  let sheet: Awaited<ReturnType<typeof readQuestionSheet>>;
  try {
    sheet = await readQuestionSheet(await file.arrayBuffer());
  } catch {
    return { error: "This file couldn't be read as an Excel workbook. Save it as .xlsx and try again." };
  }
  if ("error" in sheet) return { error: sheet.error };

  const comps = await db.select({ id: schema.competitions.id, code: schema.competitions.code }).from(schema.competitions);
  const codes = new Map(comps.map((c) => [c.code.toUpperCase(), c.id]));
  const good: QuestionInput[] = [];
  const rowErrors: { row: number; errors: string[] }[] = [];
  const seen = new Map<string, number>();
  for (const { rowNumber, raw } of sheet.rows) {
    const r = validateQuestionRow(raw, codes);
    if (!r.ok) { rowErrors.push({ row: rowNumber, errors: r.errors }); continue; }
    const key = `${r.value.competitionId}|${r.value.stem.toLowerCase().replace(/\s+/g, " ")}`;
    if (seen.has(key)) { rowErrors.push({ row: rowNumber, errors: [`Same question as row ${seen.get(key)}.`] }); continue; }
    seen.set(key, rowNumber);
    good.push(r.value);
  }
  if (rowErrors.length) return { error: `Nothing was imported. Rows with problems: ${rowErrors.length}. Fix them and upload the file again.`, rowErrors: rowErrors.slice(0, 200) };

  const count = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.questions)
      .values(good.map((v) => ({ ...v, code: sql`'Q-' || nextval('question_code_seq')`, source: "excel", createdBy: actor.id, updatedBy: actor.id })))
      .returning({ id: schema.questions.id });
    await tx.insert(schema.questionVersions).values(inserted.map((row, i) => ({ questionId: row.id, version: 1, snapshot: toSnapshot(good[i]), changedBy: actor.id })));
    return inserted.length;
  });
  await audit({ actorUserId: actor.id, action: "questions.imported", entityType: "question", after: { file: file.name.slice(0, 200), count } });
  revalidatePath("/admin/questions");
  return { ok: `Imported as drafts: ${count}. Send them for review when they're ready.` };
}

/** Sends all of the actor's own drafts (optionally from one import) for review. */
export async function submitDraftsAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const actor = await assertPermission("questions.manage");
  const ids = formData.getAll("ids").map(String).filter((s) => uuid.safeParse(s).success).slice(0, 500);
  if (!ids.length) return { error: "Tick the drafts you want to send for review." };
  const done = await db.update(schema.questions).set({ status: "review", reviewNote: null }).where(and(inArray(schema.questions.id, ids), eq(schema.questions.status, "draft"))).returning({ id: schema.questions.id });
  if (done.length) await audit({ actorUserId: actor.id, action: "question.submit_bulk", entityType: "question", after: { count: done.length } });
  revalidatePath("/admin/questions");
  return done.length ? { ok: `Sent for review: ${done.length}.` } : { error: "None of the ticked questions are drafts." };
}
