/**
 * Exam engine: seeded shuffling, paper picking and marking. Pure functions only,
 * so the same seed always gives the same paper and every rule can be tested.
 */
import type { AttemptResponse, BlueprintRow, QuestionSnapshot } from "@/db/schema";

/** Small, fast seeded random number generator (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Turns any string (an attempt id, a set letter) into a 32-bit seed. */
export function hashSeed(...parts: (string | number)[]) {
  let h = 2166136261;
  for (const ch of parts.join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type PoolQuestion = { id: string; topic: string; difficulty: "easy" | "medium" | "hard"; marks: number };

/**
 * Picks questions for each blueprint row without repeats. A row with no topic or
 * difficulty accepts any. Rows are filled most specific first, so a broad row
 * does not use up the questions a narrow row needs.
 */
export function pickQuestions(pool: PoolQuestion[], blueprint: BlueprintRow[], seed: number):
  | { ok: true; ids: string[] }
  | { ok: false; shortfalls: { row: number; wanted: number; found: number }[] } {
  const random = rng(seed);
  const order = blueprint
    .map((row, index) => ({ row, index, specificity: (row.topic ? 2 : 0) + (row.difficulty ? 1 : 0) }))
    .sort((a, b) => b.specificity - a.specificity || a.index - b.index);
  const used = new Set<string>();
  const picked: string[][] = blueprint.map(() => []);
  const shortfalls: { row: number; wanted: number; found: number }[] = [];
  for (const { row, index } of order) {
    const topic = row.topic?.trim().toLowerCase();
    const candidates = shuffle(
      pool.filter((q) => !used.has(q.id) && (!topic || q.topic.trim().toLowerCase() === topic) && (!row.difficulty || q.difficulty === row.difficulty)),
      random,
    );
    const take = candidates.slice(0, row.count);
    take.forEach((q) => used.add(q.id));
    picked[index] = take.map((q) => q.id);
    if (take.length < row.count) shortfalls.push({ row: index + 1, wanted: row.count, found: take.length });
  }
  if (shortfalls.length) return { ok: false, shortfalls: shortfalls.sort((a, b) => a.row - b.row) };
  return { ok: true, ids: picked.flat() };
}

export const normaliseText = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ").trim();

export const isAnswered = (r: AttemptResponse | null | undefined) => !!r && ((r.options?.length ?? 0) > 0 || (r.text ?? "").trim() !== "");

/** Marks one answer. Blank answers score zero; wrong answers lose negativePercent of the marks. */
export function markAnswer(q: Pick<QuestionSnapshot, "type" | "answer" | "marks">, response: AttemptResponse | null | undefined, negativePercent = 0) {
  if (!isAnswered(response)) return { answered: false, correct: false, marks: 0 };
  let correct = false;
  if (q.type === "single" || q.type === "true_false" || q.type === "multiple") {
    const given = [...new Set(response!.options ?? [])].sort();
    const want = [...(q.answer.options ?? [])].sort();
    correct = given.length === want.length && given.every((g, i) => g === want[i]);
  } else if (q.type === "numeric") {
    const text = (response!.text ?? "").replace(/,/g, "").trim();
    const n = text === "" ? NaN : Number(text);
    correct = Number.isFinite(n) && Math.abs(n - (q.answer.value ?? NaN)) <= (q.answer.tolerance ?? 0) + 1e-9;
  } else if (q.type === "short") {
    const given = normaliseText(response!.text ?? "");
    correct = (q.answer.accepted ?? []).some((a) => normaliseText(a) === given);
  }
  const marks = correct ? q.marks : -Math.round(q.marks * negativePercent) / 100;
  return { answered: true, correct, marks };
}

/** Deadline: the paper's duration from the start, but never after the session closes. */
export const deadlineFor = (startedAt: Date, durationMinutes: number, closesAt: Date) =>
  new Date(Math.min(startedAt.getTime() + durationMinutes * 60_000, closesAt.getTime()));

/** Saves arriving this long after the deadline are still accepted (slow networks). */
export const SAVE_GRACE_MS = 20_000;

export const setLetter = (i: number) => String.fromCharCode(65 + i);
