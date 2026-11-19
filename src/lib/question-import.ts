/**
 * Excel question import: column map and row checks. Pure, so it is unit-tested.
 * Every imported question starts as a draft and must be reviewed and approved.
 */
import { OPTION_IDS, validateQuestion, type QuestionInput } from "@/lib/questions";

export const QUESTION_COLUMNS = [
  { key: "competition", header: "Competition code", required: true, width: 16, example: "MMO" },
  { key: "gradeFrom", header: "Grade from", required: true, width: 11, example: "3" },
  { key: "gradeTo", header: "Grade to", required: true, width: 11, example: "4" },
  { key: "level", header: "Level", required: false, width: 8, example: "1" },
  { key: "type", header: "Type", required: true, width: 16, example: "Single choice" },
  { key: "stem", header: "Question", required: true, width: 60, example: "What is 25 × 4?" },
  { key: "A", header: "Option A", required: false, width: 18, example: "90" },
  { key: "B", header: "Option B", required: false, width: 18, example: "100" },
  { key: "C", header: "Option C", required: false, width: 18, example: "110" },
  { key: "D", header: "Option D", required: false, width: 18, example: "125" },
  { key: "E", header: "Option E", required: false, width: 14, example: "" },
  { key: "F", header: "Option F", required: false, width: 14, example: "" },
  { key: "answer", header: "Correct answer", required: true, width: 22, example: "B" },
  { key: "tolerance", header: "Tolerance", required: false, width: 11, example: "" },
  { key: "marks", header: "Marks", required: false, width: 8, example: "1" },
  { key: "difficulty", header: "Difficulty", required: true, width: 12, example: "Easy" },
  { key: "topic", header: "Topic", required: true, width: 20, example: "Multiplication" },
  { key: "tags", header: "Tags", required: false, width: 20, example: "mental, speed" },
  { key: "explanation", header: "Explanation", required: false, width: 40, example: "25 × 4 = 100." },
] as const;
export type QuestionColumnKey = (typeof QUESTION_COLUMNS)[number]["key"];
export const MAX_QUESTION_ROWS = 1000;

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");

export function mapQuestionHeaders(headers: unknown[]) {
  const map = new Map<number, QuestionColumnKey>();
  headers.forEach((h, i) => {
    const col = QUESTION_COLUMNS.find((c) => norm(c.header) === norm(h));
    if (col && ![...map.values()].includes(col.key)) map.set(i, col.key);
  });
  const found = new Set(map.values());
  const missing = QUESTION_COLUMNS.filter((c) => c.required && !found.has(c.key)).map((c) => c.header);
  return { map, missing };
}

const TYPE_WORDS: Record<string, QuestionInput["type"]> = {
  single: "single", singlechoice: "single", mcq: "single",
  multiple: "multiple", multiplechoice: "multiple", multi: "multiple",
  truefalse: "true_false", tf: "true_false",
  number: "numeric", numeric: "numeric",
  short: "short", shortanswer: "short", text: "short",
};

const gradeValue = (v: unknown) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "kg" || s === "k") return 0;
  return s === "" ? null : s;
};

/** Checks one row. `competitions` maps upper-case competition codes to ids. */
export function validateQuestionRow(raw: Partial<Record<QuestionColumnKey, unknown>>, competitions: Map<string, string>) {
  const s = (k: QuestionColumnKey) => (raw[k] == null ? "" : String(raw[k]).trim());
  const code = s("competition").toUpperCase();
  const competitionId = competitions.get(code);
  const type = TYPE_WORDS[norm(s("type"))];
  const answer = s("answer");
  const optionText = Object.fromEntries(OPTION_IDS.map((id) => [id, s(id)]));
  const result = validateQuestion({
    competitionId,
    gradeFrom: gradeValue(raw.gradeFrom),
    gradeTo: gradeValue(raw.gradeTo),
    level: s("level") || 1,
    type: type ?? "",
    stem: s("stem"),
    optionText,
    correct: type === "single" || type === "multiple" || type === "true_false" ? answer.split(/[,;/\s]+/).filter(Boolean) : [],
    numericValue: type === "numeric" ? answer : null,
    tolerance: s("tolerance"),
    accepted: type === "short" ? answer.split("|") : [],
    explanation: s("explanation"),
    topic: s("topic"),
    difficulty: s("difficulty").toLowerCase(),
    tags: s("tags").split(","),
    marks: s("marks") || 1,
  });
  if (result.ok) return { ok: true as const, value: result.value };
  const errors = Object.entries(result.errors).map(([field, message]) => {
    if (field === "competitionId") return code ? `Competition code "${code}" is not recognised.` : "Competition code is missing.";
    if (field === "type") return `Type must be Single choice, Multiple choice, True/False, Number or Short answer${s("type") ? ` (found "${s("type")}")` : ""}.`;
    return message;
  });
  return { ok: false as const, errors };
}
