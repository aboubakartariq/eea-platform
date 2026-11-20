import "server-only";
import { and, eq, gte, inArray, lte, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { BlueprintRow } from "@/db/schema";
import { pickQuestions, type PoolQuestion } from "@/lib/exam/engine";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type PaperScope = { competitionId: string; gradeFrom: number; gradeTo: number; level: number };

/** Approved questions that suit the whole grade range of a paper. */
export function poolWhere(p: PaperScope) {
  return and(
    eq(schema.questions.competitionId, p.competitionId),
    eq(schema.questions.status, "approved"),
    eq(schema.questions.level, p.level),
    lte(schema.questions.gradeFrom, p.gradeFrom),
    gte(schema.questions.gradeTo, p.gradeTo),
  );
}

export async function loadPool(p: PaperScope, exec: Tx | typeof db = db): Promise<PoolQuestion[]> {
  return exec.select({ id: schema.questions.id, topic: schema.questions.topic, difficulty: schema.questions.difficulty, marks: schema.questions.marks }).from(schema.questions).where(poolWhere(p));
}

/** Available approved questions by topic and difficulty, for the blueprint builder. */
export async function poolSummary(p: PaperScope) {
  return db
    .select({ topic: schema.questions.topic, difficulty: schema.questions.difficulty, n: sql<number>`count(*)::int` })
    .from(schema.questions)
    .where(poolWhere(p))
    .groupBy(schema.questions.topic, schema.questions.difficulty)
    .orderBy(schema.questions.topic);
}

export const shortfallMessage = (s: { row: number; wanted: number; found: number }[], blueprint: BlueprintRow[]) =>
  "Not enough approved questions. " +
  s
    .map((x) => {
      const r = blueprint[x.row - 1];
      const what = [r.difficulty, r.topic].filter(Boolean).join(" ") || "any";
      return `Row ${x.row}: ${x.wanted} needed (${what}), ${x.found} available.`;
    })
    .join(" ");

/** Replaces a draft paper's questions with a fresh pick from its blueprint. */
export async function fillPaper(tx: Tx, paperId: string, p: PaperScope & { blueprint: BlueprintRow[]; seed: number }) {
  const pool = await loadPool(p, tx);
  const picked = pickQuestions(pool, p.blueprint, p.seed);
  if (!picked.ok) return { ok: false as const, error: shortfallMessage(picked.shortfalls, p.blueprint) };
  const qs = await tx.select().from(schema.questions).where(inArray(schema.questions.id, picked.ids));
  const byId = new Map(qs.map((q) => [q.id, q]));
  await tx.delete(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paperId));
  await tx.insert(schema.paperQuestions).values(
    picked.ids.map((id, i) => {
      const q = byId.get(id)!;
      return {
        paperId,
        position: i + 1,
        questionId: id,
        questionVersion: q.version,
        snapshot: { type: q.type, stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation, topic: q.topic, difficulty: q.difficulty, marks: q.marks, gradeFrom: q.gradeFrom, gradeTo: q.gradeTo, level: q.level, tags: q.tags },
      };
    }),
  );
  const totalMarks = picked.ids.reduce((sum, id) => sum + byId.get(id)!.marks, 0);
  await tx.update(schema.papers).set({ totalMarks, seed: p.seed }).where(eq(schema.papers.id, paperId));
  return { ok: true as const, count: picked.ids.length, totalMarks };
}

/** A different approved question with the same topic and difficulty that is not already on the paper. */
export async function swapCandidate(tx: Tx, paper: PaperScope & { id: string }, current: { topic: string; difficulty: "easy" | "medium" | "hard" }) {
  const onPaper = tx.select({ id: schema.paperQuestions.questionId }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paper.id));
  const [q] = await tx
    .select()
    .from(schema.questions)
    .where(and(poolWhere(paper), eq(schema.questions.topic, current.topic), eq(schema.questions.difficulty, current.difficulty), notInArray(schema.questions.id, onPaper)))
    .orderBy(sql`random()`)
    .limit(1);
  return q ?? null;
}
