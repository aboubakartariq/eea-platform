/**
 * Ranking and awards. Pure functions, unit-tested.
 * Order within a grade: higher score, then higher accuracy (correct ÷ answered).
 * Students equal on both share a rank (1, 1, 3 …).
 */
import type { AwardRule } from "@/db/schema";

export type RankInput = { id: string; grade: number; schoolId: string | null; absent: boolean; score: number; maxScore: number; correct: number; answered: number };
export type Ranked = RankInput & { percent: number | null; rank: number | null; cohortSize: number | null; rankInSchool: number | null; schoolCohortSize: number | null; award: string | null; awardLabel: string | null };

export const DEFAULT_AWARD_RULES: AwardRule[] = [
  { key: "gold", label: "Gold Medal", kind: "medal", rule: { type: "rank", max: 1 } },
  { key: "silver", label: "Silver Medal", kind: "medal", rule: { type: "rank", max: 2 } },
  { key: "bronze", label: "Bronze Medal", kind: "medal", rule: { type: "rank", max: 3 } },
  { key: "merit", label: "Certificate of Merit", kind: "merit", rule: { type: "min_percent", value: 75 } },
  { key: "participation", label: "Certificate of Participation", kind: "participation", rule: { type: "all" } },
];

const accuracy = (r: RankInput) => (r.answered > 0 ? r.correct / r.answered : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** -1 if a is ahead of b, 1 if behind, 0 if equal. */
export function compare(a: RankInput, b: RankInput) {
  if (round2(a.score) !== round2(b.score)) return round2(b.score) - round2(a.score) > 0 ? 1 : -1;
  const d = accuracy(b) - accuracy(a);
  if (Math.abs(d) > 1e-9) return d > 0 ? 1 : -1;
  return 0;
}

function rankGroup<T extends RankInput>(group: T[], set: (r: T, rank: number, size: number) => void) {
  const sorted = [...group].sort(compare);
  let rank = 0;
  sorted.forEach((r, i) => {
    if (i === 0 || compare(sorted[i - 1], r) !== 0) rank = i + 1;
    set(r, rank, sorted.length);
  });
}

export function awardFor(rules: AwardRule[], r: { rank: number; cohortSize: number; percent: number }) {
  for (const a of rules) {
    const x = a.rule;
    const hit =
      x.type === "all" ||
      (x.type === "rank" && r.rank <= x.max) ||
      (x.type === "top_percent" && r.rank <= Math.max(1, Math.ceil((r.cohortSize * x.value) / 100))) ||
      (x.type === "min_percent" && r.percent >= x.value);
    if (hit) return a;
  }
  return null;
}

export function rankAndAward(rows: RankInput[], rules: AwardRule[]): Ranked[] {
  const out: Ranked[] = rows.map((r) => ({
    ...r,
    percent: r.absent || r.maxScore <= 0 ? null : round2(Math.max(0, (r.score / r.maxScore) * 100)),
    rank: null, cohortSize: null, rankInSchool: null, schoolCohortSize: null, award: null, awardLabel: null,
  }));
  const present = out.filter((r) => !r.absent);
  const byKey = (key: (r: Ranked) => string) => present.reduce((m, r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]), new Map<string, Ranked[]>());
  for (const group of byKey((r) => String(r.grade)).values()) rankGroup(group, (r, rank, size) => { r.rank = rank; r.cohortSize = size; });
  for (const group of byKey((r) => `${r.grade}|${r.schoolId ?? `solo:${r.id}`}`).values()) {
    if (!group[0].schoolId) continue;
    rankGroup(group, (r, rank, size) => { r.rankInSchool = rank; r.schoolCohortSize = size; });
  }
  for (const r of present) {
    const a = awardFor(rules, { rank: r.rank!, cohortSize: r.cohortSize!, percent: r.percent ?? 0 });
    r.award = a?.key ?? null;
    r.awardLabel = a?.label ?? null;
  }
  return out;
}

/** "Top 5%" style label from a rank. */
export const topPercent = (rank: number, size: number) => Math.max(1, Math.ceil((rank / size) * 100));

export function validateRules(rules: AwardRule[]): string | null {
  if (!rules.length) return "Add at least one award.";
  const keys = new Set<string>();
  for (const a of rules) {
    if (!/^[a-z][a-z0-9_]{1,23}$/.test(a.key)) return `Award key "${a.key}" must be short lower-case letters.`;
    if (keys.has(a.key)) return `Award "${a.key}" is listed twice.`;
    keys.add(a.key);
    if (!a.label.trim() || a.label.length > 60) return "Every award needs a name under 60 characters.";
    const x = a.rule;
    if (x.type === "rank" && !(Number.isInteger(x.max) && x.max >= 1 && x.max <= 1000)) return `${a.label}: rank must be a whole number from 1.`;
    if ((x.type === "top_percent" || x.type === "min_percent") && !(x.value > 0 && x.value <= 100)) return `${a.label}: percentage must be from 1 to 100.`;
  }
  return null;
}
