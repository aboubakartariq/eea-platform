"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import type { BlueprintRow } from "@/db/schema";
import { assertPermission } from "@/lib/auth/dal";
import type { FormState } from "@/lib/auth/actions";
import { keepValues } from "@/lib/form-values";
import { BLUEPRINT_ROWS } from "@/lib/question-ui";
import { audit } from "@/lib/server/audit";
import { fillPaper, loadPool, shortfallMessage, swapCandidate } from "@/lib/server/papers";
import { pickQuestions } from "@/lib/exam/engine";
import { finaliseAttempt } from "@/lib/server/attempts";

const uuid = z.string().uuid();
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

const paperSchema = z
  .object({
    competitionId: z.string().uuid("Choose a competition."),
    title: z.string().trim().min(3, "Give the paper a title.").max(160),
    gradeFrom: z.coerce.number({ message: "Choose the first grade." }).int().min(0).max(12),
    gradeTo: z.coerce.number({ message: "Choose the last grade." }).int().min(0).max(12),
    level: z.coerce.number().int().min(1).max(3),
    durationMinutes: z.coerce.number({ message: "Enter the time allowed." }).int().min(5, "At least 5 minutes.").max(300, "At most 300 minutes."),
    negativePercent: z.coerce.number().int().min(0, "0 to 100.").max(100, "0 to 100."),
    printSets: z.coerce.number().int().min(1).max(4),
    instructions: z.string().trim().max(3000).optional(),
  })
  .refine((v) => v.gradeFrom <= v.gradeTo, { path: ["gradeTo"], message: "The last grade must be the same as or after the first grade." });

function readBlueprint(formData: FormData): { rows: BlueprintRow[]; error?: string } {
  const rows: BlueprintRow[] = [];
  for (let i = 0; i < BLUEPRINT_ROWS; i++) {
    const n = String(formData.get(`bpCount${i}`) ?? "").trim();
    if (!n) continue;
    const c = Number(n);
    if (!Number.isInteger(c) || c < 1 || c > 200) return { rows, error: `Row ${i + 1}: the number of questions must be from 1 to 200.` };
    const topic = String(formData.get(`bpTopic${i}`) ?? "").trim().slice(0, 80) || null;
    const d = String(formData.get(`bpDifficulty${i}`) ?? "");
    rows.push({ topic, difficulty: d === "easy" || d === "medium" || d === "hard" ? d : null, count: c });
  }
  if (!rows.length) return { rows, error: "Add at least one blueprint row with a number of questions." };
  if (rows.reduce((s, r) => s + r.count, 0) > 300) return { rows, error: "A paper can have at most 300 questions." };
  return { rows };
}

export async function createPaperAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("exams.manage");
  const parsed = paperSchema.safeParse(Object.fromEntries(["competitionId", "title", "gradeFrom", "gradeTo", "level", "durationMinutes", "negativePercent", "printSets", "instructions"].map((k) => [k, formData.get(k) ?? undefined])));
  if (!parsed.success) return { values: keepValues(formData), error: "Please fix the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const bp = readBlueprint(formData);
  if (bp.error) return { values: keepValues(formData), error: bp.error };
  const v = parsed.data;
  const comp = await db.query.competitions.findFirst({ where: eq(schema.competitions.id, v.competitionId), columns: { code: true } });
  if (!comp) return { values: keepValues(formData), fieldErrors: { competitionId: "Choose a competition." } };

  const seed = newSeed();
  // Check first, so a shortfall is explained before anything is saved.
  const check = pickQuestions(await loadPool(v), bp.rows, seed);
  if (!check.ok) return { values: keepValues(formData), error: shortfallMessage(check.shortfalls, bp.rows) };
  const result = await db.transaction(async (tx) => {
    const [paper] = await tx
      .insert(schema.papers)
      .values({
        ...v,
        instructions: v.instructions || null,
        code: sql`${`P-${comp.code}-`} || nextval('paper_code_seq')`,
        shuffleQuestions: formData.get("shuffleQuestions") === "on",
        shuffleOptions: formData.get("shuffleOptions") === "on",
        blueprint: bp.rows,
        seed,
        createdBy: actor.id,
      })
      .returning({ id: schema.papers.id, code: schema.papers.code });
    const filled = await fillPaper(tx, paper.id, { ...v, blueprint: bp.rows, seed });
    if (!filled.ok) throw new Error(filled.error);
    return { paper, filled };
  });
  await audit({ actorUserId: actor.id, action: "paper.created", entityType: "paper", entityId: result.paper.id, after: { code: result.paper.code, questions: result.filled.count } });
  revalidatePath("/admin/exams");
  redirect(`/admin/exams/papers/${result.paper.id}?created=1`);
}

type Simple = { error?: string; ok?: string } | undefined;

async function draftPaper(id: string) {
  if (!uuid.safeParse(id).success) return null;
  return (await db.query.papers.findFirst({ where: eq(schema.papers.id, id) })) ?? null;
}

export async function paperAction(_prev: Simple, formData: FormData): Promise<Simple> {
  const actor = await assertPermission("exams.manage");
  const op = String(formData.get("op"));
  const paper = await draftPaper(String(formData.get("id")));
  if (!paper) return { error: "Paper not found." };
  const path = `/admin/exams/papers/${paper.id}`;

  if (op === "regenerate" || op === "swap") {
    if (paper.status !== "draft") return { error: "This paper is final. Reopen it as a draft before changing questions." };
    if (op === "regenerate") {
      const seed = newSeed();
      const r = await db.transaction(async (tx) => fillPaper(tx, paper.id, { ...paper, seed }));
      if (!r.ok) return { error: r.error };
      await audit({ actorUserId: actor.id, action: "paper.regenerated", entityType: "paper", entityId: paper.id, after: { questions: r.count } });
      revalidatePath(path);
      return { ok: `New set of ${r.count} questions picked.` };
    }
    const pqId = String(formData.get("pq"));
    if (!uuid.safeParse(pqId).success) return { error: "Question not found." };
    const msg = await db.transaction(async (tx) => {
      const [pq] = await tx.select().from(schema.paperQuestions).where(and(eq(schema.paperQuestions.id, pqId), eq(schema.paperQuestions.paperId, paper.id)));
      if (!pq) return { error: "Question not found." };
      const q = await swapCandidate(tx, paper, pq.snapshot);
      if (!q) return { error: `There's no other approved ${pq.snapshot.difficulty} "${pq.snapshot.topic}" question to swap in.` };
      await tx
        .update(schema.paperQuestions)
        .set({ questionId: q.id, questionVersion: q.version, snapshot: { type: q.type, stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation, topic: q.topic, difficulty: q.difficulty, marks: q.marks, gradeFrom: q.gradeFrom, gradeTo: q.gradeTo, level: q.level, tags: q.tags } })
        .where(eq(schema.paperQuestions.id, pq.id));
      await tx.update(schema.papers).set({ totalMarks: sql`(select coalesce(sum((snapshot->>'marks')::int),0) from paper_questions where paper_id = ${paper.id})` }).where(eq(schema.papers.id, paper.id));
      return { ok: `Question ${pq.position} swapped.` };
    });
    if (msg.ok) await audit({ actorUserId: actor.id, action: "paper.question_swapped", entityType: "paper", entityId: paper.id });
    revalidatePath(path);
    return msg;
  }

  if (op === "finalise") {
    if (paper.status !== "draft") return { error: "Already final." };
    const [{ n }] = await db.select({ n: count() }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paper.id));
    if (!n) return { error: "The paper has no questions." };
    await db.update(schema.papers).set({ status: "final", finalisedBy: actor.id, finalisedAt: new Date() }).where(and(eq(schema.papers.id, paper.id), eq(schema.papers.status, "draft")));
    await audit({ actorUserId: actor.id, action: "paper.finalised", entityType: "paper", entityId: paper.id });
    revalidatePath(path);
    return { ok: "Paper is final. Questions are locked and it can now be scheduled or printed." };
  }

  if (op === "reopen" || op === "delete") {
    const [{ n }] = await db.select({ n: count() }).from(schema.examSessions).where(eq(schema.examSessions.paperId, paper.id));
    if (n) return { error: "This paper has exam sessions, so it can't be changed or deleted. Make a new paper instead." };
    if (op === "reopen") {
      await db.update(schema.papers).set({ status: "draft", finalisedBy: null, finalisedAt: null }).where(eq(schema.papers.id, paper.id));
      await audit({ actorUserId: actor.id, action: "paper.reopened", entityType: "paper", entityId: paper.id });
      revalidatePath(path);
      return { ok: "Reopened as a draft." };
    }
    if (paper.status !== "draft") return { error: "Reopen the paper as a draft before deleting it." };
    await db.delete(schema.papers).where(eq(schema.papers.id, paper.id));
    await audit({ actorUserId: actor.id, action: "paper.deleted", entityType: "paper", entityId: paper.id, before: { code: paper.code } });
    revalidatePath("/admin/exams");
    redirect("/admin/exams?deleted=1");
  }
  return { error: "Unknown action." };
}

/** Pakistan has no daylight saving, so local times are always UTC+5. */
const fromLocal = (s: string) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? new Date(`${s}:00+05:00`) : null);

export async function createSessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("exams.manage");
  const fe: Record<string, string> = {};
  const paperId = String(formData.get("paperId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const opensAt = fromLocal(String(formData.get("opensAt") ?? ""));
  const closesAt = fromLocal(String(formData.get("closesAt") ?? ""));
  if (title.length < 3 || title.length > 160) fe.title = "Give the session a title, e.g. Main exam, morning.";
  if (!opensAt) fe.opensAt = "Choose when students can start.";
  if (!closesAt) fe.closesAt = "Choose when the session closes.";
  if (opensAt && closesAt && closesAt <= opensAt) fe.closesAt = "Closing time must be after opening time.";
  const paper = uuid.safeParse(paperId).success ? await db.query.papers.findFirst({ where: eq(schema.papers.id, paperId) }) : null;
  if (!paper) fe.paperId = "Choose a paper.";
  else if (paper.status !== "final") fe.paperId = "Only final papers can be scheduled.";
  if (!fe.closesAt && opensAt && closesAt && paper && closesAt.getTime() - opensAt.getTime() < paper.durationMinutes * 60_000) fe.closesAt = `The window is shorter than the paper's ${paper.durationMinutes} minutes.`;
  if (Object.keys(fe).length) return { values: keepValues(formData), error: "Please fix the highlighted fields.", fieldErrors: fe };
  const [row] = await db.insert(schema.examSessions).values({ paperId: paper!.id, competitionId: paper!.competitionId, title, opensAt: opensAt!, closesAt: closesAt!, createdBy: actor.id }).returning({ id: schema.examSessions.id });
  await audit({ actorUserId: actor.id, action: "exam_session.created", entityType: "exam_session", entityId: row.id, after: { paper: paper!.code, opensAt, closesAt } });
  revalidatePath("/admin/exams");
  redirect(`/admin/exams/sessions/${row.id}?created=1`);
}

export async function sessionAction(_prev: Simple, formData: FormData): Promise<Simple> {
  const actor = await assertPermission("exams.manage");
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) return { error: "Session not found." };
  const s = await db.query.examSessions.findFirst({ where: eq(schema.examSessions.id, id) });
  if (!s) return { error: "Session not found." };
  const op = String(formData.get("op"));
  if (op === "cancel") {
    const [{ n }] = await db.select({ n: count() }).from(schema.examAttempts).where(eq(schema.examAttempts.sessionId, id));
    if (n) return { error: "Students have already started this session, so it can't be cancelled. You can end their attempts instead." };
    await db.update(schema.examSessions).set({ status: "cancelled" }).where(eq(schema.examSessions.id, id));
    await audit({ actorUserId: actor.id, action: "exam_session.cancelled", entityType: "exam_session", entityId: id });
    revalidatePath(`/admin/exams/sessions/${id}`);
    return { ok: "Session cancelled. Students won't see it." };
  }
  if (op === "end_attempt") {
    const attemptId = String(formData.get("attempt"));
    if (!uuid.safeParse(attemptId).success) return { error: "Attempt not found." };
    const a = await db.query.examAttempts.findFirst({ where: and(eq(schema.examAttempts.id, attemptId), eq(schema.examAttempts.sessionId, id)) });
    if (!a) return { error: "Attempt not found." };
    if (a.status === "submitted") return { error: "Already submitted." };
    await finaliseAttempt(a.id, "staff");
    await audit({ actorUserId: actor.id, action: "exam_attempt.ended_by_staff", entityType: "exam_attempt", entityId: a.id });
    revalidatePath(`/admin/exams/sessions/${id}`);
    return { ok: "Attempt ended and marked. The student's saved answers were kept." };
  }
  return { error: "Unknown action." };
}
