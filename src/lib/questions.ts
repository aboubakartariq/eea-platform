/**
 * Question rules shared by the editor, the Excel import and the exam engine.
 * Pure functions only, so they can be unit-tested.
 */
import type { QuestionAnswer, QuestionOption, QuestionSnapshot } from "@/db/schema";

export const QUESTION_TYPES = [
  { key: "single", label: "Single choice", hint: "One correct option" },
  { key: "multiple", label: "Multiple choice", hint: "Two or more correct options; all must be chosen" },
  { key: "true_false", label: "True / False", hint: "" },
  { key: "numeric", label: "Number", hint: "Student types a number" },
  { key: "short", label: "Short answer", hint: "Student types a word or phrase" },
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number]["key"];
export const typeLabel = (t: string) => QUESTION_TYPES.find((x) => x.key === t)?.label ?? t;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const OPTION_IDS = ["A", "B", "C", "D", "E", "F"] as const;
export const TRUE_FALSE_OPTIONS: QuestionOption[] = [
  { id: "A", text: "True" },
  { id: "B", text: "False" },
];

export const STATUS_LABELS: Record<string, string> = { draft: "Draft", review: "Waiting for review", approved: "Approved", retired: "Retired" };

export type QuestionInput = {
  competitionId: string;
  gradeFrom: number;
  gradeTo: number;
  level: number;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  answer: QuestionAnswer;
  explanation: string | null;
  topic: string;
  difficulty: Difficulty;
  tags: string[];
  marks: number;
};

export type RawQuestion = {
  competitionId?: string;
  gradeFrom?: string | number | null;
  gradeTo?: string | number | null;
  level?: string | number | null;
  type?: string;
  stem?: string;
  /** Option texts keyed A–F. Empty strings are ignored. */
  optionText?: Partial<Record<string, string>>;
  /** Correct option letters, for choice types. */
  correct?: string[];
  numericValue?: string | number | null;
  tolerance?: string | number | null;
  accepted?: string[];
  explanation?: string | null;
  topic?: string;
  difficulty?: string;
  tags?: string[];
  marks?: string | number | null;
};

const int = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};
const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();

/** Checks a question and returns either the cleaned question or field errors. */
export function validateQuestion(raw: RawQuestion): { ok: true; value: QuestionInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const type = raw.type as QuestionType;
  if (!QUESTION_TYPES.some((t) => t.key === type)) errors.type = "Choose a question type.";
  if (!raw.competitionId) errors.competitionId = "Choose a competition.";

  const gradeFrom = int(raw.gradeFrom);
  const gradeTo = int(raw.gradeTo);
  if (gradeFrom === null || Number.isNaN(gradeFrom) || gradeFrom < 0 || gradeFrom > 12) errors.gradeFrom = "Choose the first grade (KG to 12).";
  if (gradeTo === null || Number.isNaN(gradeTo) || gradeTo < 0 || gradeTo > 12) errors.gradeTo = "Choose the last grade (KG to 12).";
  if (!errors.gradeFrom && !errors.gradeTo && gradeFrom! > gradeTo!) errors.gradeTo = "The last grade must be the same as or after the first grade.";

  const level = int(raw.level) ?? 1;
  if (Number.isNaN(level) || level < 1 || level > 3) errors.level = "Level must be 1, 2 or 3.";
  const marks = int(raw.marks) ?? 1;
  if (Number.isNaN(marks) || marks < 1 || marks > 20) errors.marks = "Marks must be a whole number from 1 to 20.";

  const stem = String(raw.stem ?? "").trim();
  if (stem.length < 3) errors.stem = "Write the question.";
  else if (stem.length > 4000) errors.stem = "The question is too long (4,000 characters at most).";

  const topic = clean(raw.topic);
  if (!topic) errors.topic = "Enter a topic, e.g. Fractions.";
  else if (topic.length > 80) errors.topic = "Keep the topic under 80 characters.";

  const difficulty = String(raw.difficulty ?? "").toLowerCase() as Difficulty;
  if (!DIFFICULTIES.includes(difficulty)) errors.difficulty = "Choose easy, medium or hard.";

  const explanation = String(raw.explanation ?? "").trim() || null;
  if (explanation && explanation.length > 4000) errors.explanation = "The explanation is too long.";
  const tags = [...new Set((raw.tags ?? []).map((t) => clean(t).toLowerCase()).filter(Boolean))].slice(0, 12);

  let options: QuestionOption[] = [];
  let answer: QuestionAnswer = {};

  if (type === "single" || type === "multiple") {
    const texts = raw.optionText ?? {};
    options = OPTION_IDS.map((id) => ({ id, text: String(texts[id] ?? "").trim() })).filter((o) => o.text);
    // Options must be filled from A without gaps, so letters on paper match the key.
    const filled = OPTION_IDS.filter((id) => String(texts[id] ?? "").trim());
    const gap = filled.some((id, i) => id !== OPTION_IDS[i]);
    if (options.length < 2) errors.options = "Give at least two options.";
    else if (gap) errors.options = "Fill options in order from A, without leaving gaps.";
    else if (options.some((o) => o.text.length > 500)) errors.options = "Each option must be under 500 characters.";
    else if (new Set(options.map((o) => o.text.toLowerCase())).size !== options.length) errors.options = "Two options are the same.";
    const correct = [...new Set((raw.correct ?? []).map((c) => c.trim().toUpperCase()))].filter(Boolean);
    if (!errors.options) {
      if (correct.some((c) => !options.some((o) => o.id === c))) errors.answer = "The correct answer must be one of the options you filled in.";
      else if (type === "single" && correct.length !== 1) errors.answer = "Choose exactly one correct option.";
      else if (type === "multiple" && correct.length < 2) errors.answer = "Choose at least two correct options (use Single choice for one).";
      else if (type === "multiple" && correct.length === options.length) errors.answer = "Not every option can be correct.";
    }
    answer = { options: correct.sort() };
  } else if (type === "true_false") {
    options = TRUE_FALSE_OPTIONS;
    const c = (raw.correct ?? [])[0]?.trim().toUpperCase();
    const id = c === "A" || c === "TRUE" || c === "T" ? "A" : c === "B" || c === "FALSE" || c === "F" ? "B" : null;
    if (!id || (raw.correct ?? []).length !== 1) errors.answer = "Choose True or False as the correct answer.";
    answer = { options: id ? [id] : [] };
  } else if (type === "numeric") {
    const value = Number(String(raw.numericValue ?? "").replace(/,/g, ""));
    const tolRaw = raw.tolerance === null || raw.tolerance === undefined || raw.tolerance === "" ? 0 : Number(raw.tolerance);
    if (raw.numericValue === null || raw.numericValue === undefined || String(raw.numericValue).trim() === "" || !Number.isFinite(value)) errors.answer = "Enter the correct number.";
    if (!Number.isFinite(tolRaw) || tolRaw < 0) errors.tolerance = "Tolerance must be zero or a positive number.";
    answer = { value, tolerance: tolRaw || 0 };
  } else if (type === "short") {
    const accepted = [...new Set((raw.accepted ?? []).map((a) => clean(a)).filter(Boolean))];
    if (!accepted.length) errors.answer = "Enter at least one accepted answer.";
    else if (accepted.some((a) => a.length > 120)) errors.answer = "Accepted answers must be under 120 characters.";
    answer = { accepted };
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { competitionId: raw.competitionId!, gradeFrom: gradeFrom!, gradeTo: gradeTo!, level, type, stem, options, answer, explanation, topic, difficulty, tags, marks },
  };
}

export const toSnapshot = (q: Omit<QuestionInput, "competitionId">): QuestionSnapshot => ({
  type: q.type,
  stem: q.stem,
  options: q.options,
  answer: q.answer,
  explanation: q.explanation,
  topic: q.topic,
  difficulty: q.difficulty,
  marks: q.marks,
  gradeFrom: q.gradeFrom,
  gradeTo: q.gradeTo,
  level: q.level,
  tags: q.tags,
});

/** Human-readable correct answer, for answer keys and the review screen. */
export function answerText(q: Pick<QuestionSnapshot, "type" | "answer" | "options">) {
  if (q.type === "numeric") return `${q.answer.value}${q.answer.tolerance ? ` (± ${q.answer.tolerance})` : ""}`;
  if (q.type === "short") return (q.answer.accepted ?? []).join(" / ");
  if (q.type === "true_false") return q.answer.options?.[0] === "A" ? "True" : "False";
  return (q.answer.options ?? []).join(", ");
}
