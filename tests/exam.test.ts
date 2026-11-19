import { describe, expect, it } from "vitest";
import { validateQuestion } from "@/lib/questions";
import { validateQuestionRow, mapQuestionHeaders, QUESTION_COLUMNS } from "@/lib/question-import";
import { deadlineFor, hashSeed, markAnswer, pickQuestions, rng, shuffle } from "@/lib/exam/engine";

const base = { competitionId: "c1", gradeFrom: 3, gradeTo: 4, topic: "Fractions", difficulty: "easy", stem: "What is 1/2 + 1/4?" };

describe("validateQuestion", () => {
  it("accepts a single-choice question", () => {
    const r = validateQuestion({ ...base, type: "single", optionText: { A: "3/4", B: "2/6" }, correct: ["a"] });
    expect(r.ok && r.value.answer).toEqual({ options: ["A"] });
  });
  it("rejects gaps in options and a correct letter that is not an option", () => {
    const gap = validateQuestion({ ...base, type: "single", optionText: { A: "1", C: "2" }, correct: ["A"] });
    expect(!gap.ok && gap.errors.options).toMatch(/without leaving gaps/);
    const bad = validateQuestion({ ...base, type: "single", optionText: { A: "1", B: "2" }, correct: ["D"] });
    expect(!bad.ok && bad.errors.answer).toBeTruthy();
  });
  it("needs two or more correct options for multiple choice", () => {
    const r = validateQuestion({ ...base, type: "multiple", optionText: { A: "1", B: "2", C: "3" }, correct: ["A"] });
    expect(r.ok).toBe(false);
  });
  it("checks grades run in order", () => {
    const r = validateQuestion({ ...base, gradeFrom: 5, gradeTo: 2, type: "true_false", correct: ["True"] });
    expect(!r.ok && r.errors.gradeTo).toBeTruthy();
  });
  it("handles numeric and short answers", () => {
    const n = validateQuestion({ ...base, type: "numeric", numericValue: "0.75", tolerance: "0.01" });
    expect(n.ok && n.value.answer).toEqual({ value: 0.75, tolerance: 0.01 });
    const s = validateQuestion({ ...base, type: "short", accepted: ["three quarters", " Three  Quarters "] });
    expect(s.ok && s.value.answer.accepted).toEqual(["three quarters", "Three Quarters"]);
  });
});

describe("question Excel rows", () => {
  const comps = new Map([["MMO", "c1"]]);
  it("finds headers regardless of case and spacing", () => {
    const { missing } = mapQuestionHeaders(QUESTION_COLUMNS.map((c) => c.header.toUpperCase()));
    expect(missing).toEqual([]);
  });
  it("accepts the template example row", () => {
    const row = Object.fromEntries(QUESTION_COLUMNS.map((c) => [c.key, c.example]));
    expect(validateQuestionRow(row, comps).ok).toBe(true);
  });
  it("explains an unknown competition and type", () => {
    const r = validateQuestionRow({ competition: "XYZ", type: "Essay", stem: "Q?", gradeFrom: "KG", gradeTo: 1, difficulty: "easy", topic: "T", answer: "A" }, comps);
    const text = !r.ok ? r.errors.join(" ") : "";
    expect(text).toMatch(/"XYZ" is not recognised/);
    expect(text).toMatch(/Type must be/);
  });
});

describe("engine", () => {
  it("shuffles the same way for the same seed", () => {
    const a = shuffle([1, 2, 3, 4, 5, 6], rng(hashSeed("x", 1)));
    const b = shuffle([1, 2, 3, 4, 5, 6], rng(hashSeed("x", 1)));
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
  const pool = [
    ...Array.from({ length: 4 }, (_, i) => ({ id: `fe${i}`, topic: "Fractions", difficulty: "easy" as const, marks: 1 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `gh${i}`, topic: "Geometry", difficulty: "hard" as const, marks: 2 })),
  ];
  it("fills specific rows first and never repeats a question", () => {
    const r = pickQuestions(pool, [{ topic: null, difficulty: null, count: 4 }, { topic: "fractions", difficulty: "easy", count: 3 }], 7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(new Set(r.ids).size).toBe(7);
      expect(r.ids.slice(4).every((id) => id.startsWith("fe"))).toBe(true);
    }
  });
  it("reports shortfalls", () => {
    const r = pickQuestions(pool, [{ topic: "Geometry", difficulty: null, count: 5 }], 1);
    expect(!r.ok && r.shortfalls).toEqual([{ row: 1, wanted: 5, found: 3 }]);
  });
  it("marks every type, with negative marking only for wrong answers", () => {
    expect(markAnswer({ type: "single", answer: { options: ["B"] }, marks: 2 }, { options: ["B"] }).marks).toBe(2);
    expect(markAnswer({ type: "single", answer: { options: ["B"] }, marks: 2 }, { options: ["A"] }, 25).marks).toBe(-0.5);
    expect(markAnswer({ type: "single", answer: { options: ["B"] }, marks: 2 }, { options: [] }, 25)).toEqual({ answered: false, correct: false, marks: 0 });
    expect(markAnswer({ type: "multiple", answer: { options: ["A", "C"] }, marks: 1 }, { options: ["C", "A"] }).correct).toBe(true);
    expect(markAnswer({ type: "multiple", answer: { options: ["A", "C"] }, marks: 1 }, { options: ["A"] }).correct).toBe(false);
    expect(markAnswer({ type: "numeric", answer: { value: 0.75, tolerance: 0.01 }, marks: 1 }, { text: "0.76" }).correct).toBe(true);
    expect(markAnswer({ type: "numeric", answer: { value: 1000, tolerance: 0 }, marks: 1 }, { text: "1,000" }).correct).toBe(true);
    expect(markAnswer({ type: "short", answer: { accepted: ["Lahore"] }, marks: 1 }, { text: "  lahore. " }).correct).toBe(true);
  });
  it("never lets the deadline pass the session close", () => {
    const start = new Date("2027-03-01T09:50:00Z");
    expect(deadlineFor(start, 60, new Date("2027-03-01T10:00:00Z")).toISOString()).toBe("2027-03-01T10:00:00.000Z");
    expect(deadlineFor(start, 30, new Date("2027-03-01T12:00:00Z")).toISOString()).toBe("2027-03-01T10:20:00.000Z");
  });
});
