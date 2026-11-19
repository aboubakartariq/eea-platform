import { describe, expect, it } from "vitest";
import { DEFAULT_AWARD_RULES, awardFor, rankAndAward, topPercent, validateRules, type RankInput } from "@/lib/results/rank";
import { parseSheetAnswer, setOrder, markAnswer } from "@/lib/exam/engine";

const r = (id: string, score: number, o: Partial<RankInput> = {}): RankInput => ({ id, grade: 5, schoolId: "s1", absent: false, score, maxScore: 10, correct: score, answered: 10, ...o });

describe("ranking", () => {
  it("ranks per grade with shared ranks for exact ties", () => {
    const out = rankAndAward([r("a", 8), r("b", 9), r("c", 8), r("d", 5), r("e", 10, { grade: 6 })], DEFAULT_AWARD_RULES);
    const by = Object.fromEntries(out.map((x) => [x.id, x]));
    expect([by.b.rank, by.a.rank, by.c.rank, by.d.rank]).toEqual([1, 2, 2, 4]);
    expect(by.e.rank).toBe(1);
    expect(by.a.cohortSize).toBe(4);
  });
  it("breaks score ties by accuracy", () => {
    const out = rankAndAward([r("careful", 7, { correct: 7, answered: 7 }), r("guesser", 7, { correct: 8, answered: 10 })], []);
    expect(out.find((x) => x.id === "careful")!.rank).toBe(1);
    expect(out.find((x) => x.id === "guesser")!.rank).toBe(2);
  });
  it("ranks within school separately and leaves absentees unranked", () => {
    const out = rankAndAward([r("a", 9), r("b", 6, { schoolId: "s2" }), r("c", 4), r("x", 0, { absent: true }), r("solo", 8, { schoolId: null })], DEFAULT_AWARD_RULES);
    const by = Object.fromEntries(out.map((x) => [x.id, x]));
    expect([by.a.rankInSchool, by.c.rankInSchool, by.b.rankInSchool]).toEqual([1, 2, 1]);
    expect(by.solo.rankInSchool).toBeNull();
    expect(by.x).toMatchObject({ rank: null, award: null, percent: null });
  });
  it("gives the first award whose rule matches", () => {
    const out = rankAndAward([r("a", 10), r("b", 9), r("c", 9), r("d", 8), r("e", 7.5), r("f", 2)], DEFAULT_AWARD_RULES);
    expect(out.map((x) => x.award)).toEqual(["gold", "silver", "silver", "merit", "merit", "participation"]);
    expect(awardFor([{ key: "top", label: "Top 10%", kind: "merit", rule: { type: "top_percent", value: 10 } }], { rank: 3, cohortSize: 30, percent: 50 })?.key).toBe("top");
    expect(topPercent(3, 30)).toBe(10);
  });
  it("checks award rules", () => {
    expect(validateRules(DEFAULT_AWARD_RULES)).toBeNull();
    expect(validateRules([{ key: "Gold!", label: "G", kind: "medal", rule: { type: "rank", max: 1 } }])).toMatch(/lower-case/);
    expect(validateRules([{ key: "m", label: "", kind: "merit", rule: { type: "min_percent", value: 0 } }])).toBeTruthy();
  });
});

describe("paper answer sheets", () => {
  it("keeps version A in paper order and shuffles others the same way every time", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(setOrder(items, 42, "A")).toEqual(items);
    expect(setOrder(items, 42, "B")).toEqual(setOrder(items, 42, "B"));
    expect(setOrder(items, 42, "B")).not.toEqual(items);
  });
  it("reads typed answers and marks them", () => {
    expect(parseSheetAnswer("multiple", "c, a")).toEqual({ options: ["C", "A"] });
    expect(parseSheetAnswer("true_false", "False")).toEqual({ options: ["B"] });
    expect(parseSheetAnswer("single", "")).toEqual({ options: [] });
    expect(markAnswer({ type: "true_false", answer: { options: ["A"] }, marks: 1 }, parseSheetAnswer("true_false", "T")).correct).toBe(true);
    expect(markAnswer({ type: "numeric", answer: { value: 75 }, marks: 2 }, parseSheetAnswer("numeric", 75)).marks).toBe(2);
  });
});
