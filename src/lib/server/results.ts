import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, lte, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { AwardRule, ScriptLine } from "@/db/schema";
import { markAnswer, parseSheetAnswer, setOrder } from "@/lib/exam/engine";
import { rankAndAward, type RankInput } from "@/lib/results/rank";
import { expireOverdue } from "./attempts";
import type { SheetRow } from "./excel";
import { versionFor } from "./entries";

/** The competition's result set that is not withdrawn, if any. */
export async function liveResultSet(competitionId: string) {
  return (await db.query.resultSets.findFirst({ where: and(eq(schema.resultSets.competitionId, competitionId), ne(schema.resultSets.status, "withdrawn")) })) ?? null;
}

/** SQL condition: results students, parents and schools may see now. */
export const visibleSet = sql`${schema.resultSets.status} = 'published' and ${schema.resultSets.publishAt} <= now()`;

/** Students who should sit a paper on paper: confirmed, paper mode, grade in range, roll number issued. */
export function paperEntrants(paper: { competitionId: string; gradeFrom: number; gradeTo: number }) {
  return db
    .select({
      itemId: schema.registrationItems.id,
      roll: schema.registrationItems.rollNumber,
      grade: schema.registrationItems.grade,
      first: schema.students.firstName,
      last: schema.students.lastName,
      school: sql<string>`coalesce(${schema.schools.name}, ${schema.students.schoolName}, '')`,
    })
    .from(schema.registrationItems)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
    .innerJoin(schema.students, eq(schema.students.id, schema.registrationItems.studentId))
    .leftJoin(schema.schools, eq(schema.schools.id, schema.registrations.schoolId))
    .where(
      and(
        eq(schema.registrationItems.competitionId, paper.competitionId),
        eq(schema.registrations.mode, "paper"),
        eq(schema.registrations.status, "confirmed"),
        sql`${schema.registrationItems.grade} between ${paper.gradeFrom} and ${paper.gradeTo}`,
        sql`${schema.registrationItems.rollNumber} is not null`,
      ),
    )
    .orderBy(asc(schema.registrationItems.rollNumber));
}

export type ImportOutcome = { ok: true; saved: number; absent: number } | { ok: false; error: string; rowErrors?: { row: number; errors: string[] }[] };

/** Checks and marks a whole answer-sheet file. Saves nothing if any row is wrong. */
export async function importAnswerSheets(paperId: string, rows: SheetRow[], actorId: string): Promise<ImportOutcome> {
  const paper = await db.query.papers.findFirst({ where: eq(schema.papers.id, paperId) });
  if (!paper || paper.status !== "final") return { ok: false, error: "Only final papers can take answer sheets." };
  const live = await liveResultSet(paper.competitionId);
  if (live && live.status !== "draft") return { ok: false, error: "Results for this competition are approved or published. Withdraw them before changing answer sheets." };

  const items = await db.select().from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paper.id)).orderBy(asc(schema.paperQuestions.position));
  const entrants = await paperEntrants(paper);
  const byRoll = new Map(entrants.map((e) => [e.roll!, e]));
  const letters = Array.from({ length: paper.printSets }, (_, i) => String.fromCharCode(65 + i));
  const rowErrors: { row: number; errors: string[] }[] = [];
  const seen = new Map<string, number>();
  const scripts: (typeof schema.paperScripts.$inferInsert)[] = [];

  for (const r of rows) {
    const errors: string[] = [];
    const e = byRoll.get(r.roll);
    if (!r.roll) errors.push("Roll number is missing.");
    else if (!e) errors.push(`Roll number ${r.roll} is not a confirmed paper entrant for this paper's grades.`);
    else if (seen.has(r.roll)) errors.push(`Roll number ${r.roll} is also on row ${seen.get(r.roll)}.`);
    if (!letters.includes(r.version)) errors.push(`Version must be ${letters.join(" or ")}.`);
    else if (e && r.version !== versionFor(r.roll, paper.printSets)) errors.push(`Version ${r.version} doesn't match the admit card (version ${versionFor(r.roll, paper.printSets)}). Check the paper.`);
    const filled = r.answers.filter((a) => a != null && String(a).trim() !== "").length;
    if (r.absent && filled) errors.push("Marked absent but has answers.");
    const order = letters.includes(r.version) ? setOrder(items, paper.seed, r.version) : items;
    const lines: ScriptLine[] = [];
    if (!r.absent && !errors.length) {
      order.forEach((pq, i) => {
        const response = parseSheetAnswer(pq.snapshot.type, r.answers[i]);
        const valid = new Set(pq.snapshot.options.map((o) => o.id));
        const bad = (response.options ?? []).filter((o) => !valid.has(o));
        if (bad.length) errors.push(`Q${i + 1}: "${String(r.answers[i])}" is not an option on this question.`);
        else if ((pq.snapshot.type === "single" || pq.snapshot.type === "true_false") && (response.options?.length ?? 0) > 1) errors.push(`Q${i + 1}: only one answer allowed.`);
        const m = markAnswer(pq.snapshot, response, paper.negativePercent);
        lines.push({ pq: pq.id, response, correct: m.correct, marks: m.marks, answered: m.answered });
      });
    }
    if (errors.length) { rowErrors.push({ row: r.rowNumber, errors }); continue; }
    seen.set(r.roll, r.rowNumber);
    const score = lines.reduce((s, l) => s + l.marks, 0);
    scripts.push({
      registrationItemId: e!.itemId, paperId: paper.id, setLetter: r.version, absent: r.absent, lines,
      score: score.toFixed(2), maxScore: paper.totalMarks, correctCount: lines.filter((l) => l.correct).length, answeredCount: lines.filter((l) => l.answered).length, enteredBy: actorId,
    });
  }
  if (rowErrors.length) return { ok: false, error: `Nothing was saved. ${rowErrors.length} row${rowErrors.length === 1 ? " has" : "s have"} problems.`, rowErrors: rowErrors.slice(0, 200) };

  await db.transaction(async (tx) => {
    for (const s of scripts) {
      await tx.insert(schema.paperScripts).values(s).onConflictDoUpdate({
        target: schema.paperScripts.registrationItemId,
        set: { paperId: s.paperId, setLetter: s.setLetter, absent: s.absent, lines: s.lines, score: s.score, maxScore: s.maxScore, correctCount: s.correctCount, answeredCount: s.answeredCount, enteredBy: actorId, updatedAt: new Date() },
      });
    }
  });
  return { ok: true, saved: scripts.length, absent: scripts.filter((s) => s.absent).length };
}

/** Everything needed to calculate a competition: who is entered and what they scored. */
export async function gatherScores(competitionId: string) {
  await expireOverdue({});
  const entries = await db
    .select({
      itemId: schema.registrationItems.id,
      studentId: schema.registrationItems.studentId,
      grade: schema.registrationItems.grade,
      mode: schema.registrations.mode,
      schoolId: schema.registrations.schoolId,
    })
    .from(schema.registrationItems)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
    .where(and(eq(schema.registrationItems.competitionId, competitionId), eq(schema.registrations.status, "confirmed")));
  const [attempts, scripts] = await Promise.all([
    db.select().from(schema.examAttempts).where(eq(schema.examAttempts.competitionId, competitionId)),
    entries.length ? db.select().from(schema.paperScripts).where(inArray(schema.paperScripts.registrationItemId, entries.map((e) => e.itemId))) : Promise.resolve([]),
  ]);
  const attemptBy = new Map(attempts.map((a) => [a.studentId, a]));
  const scriptBy = new Map(scripts.map((s) => [s.registrationItemId, s]));
  const answered = attempts.length
    ? await db
        .select({ attemptId: schema.attemptAnswers.attemptId, n: sql<number>`count(*) filter (where ${schema.attemptAnswers.correct} is not null)::int` })
        .from(schema.attemptAnswers)
        .where(inArray(schema.attemptAnswers.attemptId, attempts.map((a) => a.id)))
        .groupBy(schema.attemptAnswers.attemptId)
    : [];
  const answeredBy = new Map(answered.map((a) => [a.attemptId, a.n]));

  let writing = 0, missingSheets = 0;
  const rows = entries.map((e) => {
    const base = { id: e.itemId, studentId: e.studentId, grade: e.grade, schoolId: e.schoolId, source: e.mode };
    if (e.mode === "online") {
      const a = attemptBy.get(e.studentId);
      if (a?.status === "in_progress") writing++;
      if (!a || a.status !== "submitted") return { ...base, absent: true, score: 0, maxScore: 0, correct: 0, answered: 0, timeTaken: null };
      const time = a.submittedAt ? Math.round((a.submittedAt.getTime() - a.startedAt.getTime()) / 1000) : null;
      return { ...base, absent: false, score: Number(a.score ?? 0), maxScore: a.maxScore, correct: a.correctCount ?? 0, answered: answeredBy.get(a.id) ?? 0, timeTaken: time };
    }
    const s = scriptBy.get(e.itemId);
    if (!s) missingSheets++;
    if (!s || s.absent) return { ...base, absent: true, score: 0, maxScore: s?.maxScore ?? 0, correct: 0, answered: 0, timeTaken: null };
    return { ...base, absent: false, score: Number(s.score), maxScore: s.maxScore, correct: s.correctCount, answered: s.answeredCount, timeTaken: null };
  });
  return { rows, writing, missingSheets };
}

/** Replaces the draft result set for a competition with a fresh calculation. */
export async function calculateResults(competitionId: string, rules: AwardRule[], actorId: string) {
  const live = await liveResultSet(competitionId);
  if (live && live.status !== "draft") return { ok: false as const, error: "Results are already approved or published. Withdraw them before recalculating." };
  const { rows, writing, missingSheets } = await gatherScores(competitionId);
  if (writing) return { ok: false as const, error: `${writing} student${writing === 1 ? " is" : "s are"} still writing the online exam. Calculate after the session closes.` };
  if (!rows.length) return { ok: false as const, error: "No confirmed registrations for this competition." };
  const ranked = rankAndAward(rows as (RankInput & (typeof rows)[number])[], rules);
  const extra = new Map(rows.map((r) => [r.id, r]));

  const setId = await db.transaction(async (tx) => {
    if (live) await tx.delete(schema.resultSets).where(eq(schema.resultSets.id, live.id));
    const [set] = await tx
      .insert(schema.resultSets)
      .values({ competitionId, awardRules: rules, calculatedBy: actorId, resultCount: ranked.filter((r) => !r.absent).length, absentCount: ranked.filter((r) => r.absent).length })
      .returning({ id: schema.resultSets.id });
    for (let i = 0; i < ranked.length; i += 500) {
      await tx.insert(schema.results).values(
        ranked.slice(i, i + 500).map((r) => {
          const x = extra.get(r.id)!;
          return {
            resultSetId: set.id, competitionId, studentId: x.studentId, registrationItemId: r.id, schoolId: r.schoolId, grade: r.grade, source: x.source, absent: r.absent,
            score: r.absent ? null : r.score.toFixed(2), maxScore: r.absent ? null : r.maxScore, percent: r.percent == null ? null : r.percent.toFixed(2),
            correctCount: r.absent ? null : r.correct, answeredCount: r.absent ? null : r.answered, timeTakenSeconds: x.timeTaken,
            rank: r.rank, cohortSize: r.cohortSize, rankInSchool: r.rankInSchool, schoolCohortSize: r.schoolCohortSize, award: r.award, awardLabel: r.awardLabel,
          };
        }),
      );
    }
    return set.id;
  });
  return { ok: true as const, setId, count: ranked.length, absent: ranked.filter((r) => r.absent).length, missingSheets };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const newVerifyCode = () => Array.from(randomBytes(10), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
export const formatVerifyCode = (c: string) => `${c.slice(0, 5)}-${c.slice(5)}`;

/** Publishes an approved set: issues certificates and creates award dispatches. */
export async function publishResults(setId: string, publishAt: Date, actorId: string) {
  return db.transaction(async (tx) => {
    const [set] = await tx.select().from(schema.resultSets).where(eq(schema.resultSets.id, setId)).for("update");
    if (!set || set.status !== "approved") return { ok: false as const, error: "Only approved results can be published." };
    const comp = (await tx.select({ examDate: schema.competitions.examDate }).from(schema.competitions).where(eq(schema.competitions.id, set.competitionId)))[0];
    const yy = (comp?.examDate ?? new Date().toISOString()).slice(2, 4);
    const winners = await tx
      .select({
        id: schema.results.id, studentId: schema.results.studentId, grade: schema.results.grade, award: schema.results.award, awardLabel: schema.results.awardLabel, schoolId: schema.results.schoolId,
        first: schema.students.firstName, last: schema.students.lastName, school: sql<string | null>`coalesce(${schema.schools.name}, ${schema.students.schoolName})`,
        guardian: schema.registrations.guardianUserId,
      })
      .from(schema.results)
      .innerJoin(schema.students, eq(schema.students.id, schema.results.studentId))
      .innerJoin(schema.registrationItems, eq(schema.registrationItems.id, schema.results.registrationItemId))
      .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
      .leftJoin(schema.schools, eq(schema.schools.id, schema.results.schoolId))
      .where(and(eq(schema.results.resultSetId, setId), eq(schema.results.absent, false), sql`${schema.results.award} is not null`));
    for (let i = 0; i < winners.length; i += 500) {
      const chunk = winners.slice(i, i + 500);
      if (!chunk.length) break;
      await tx.insert(schema.certificates).values(
        chunk.map((w) => ({
          serial: sql`${`EEA-C-${yy}-`} || nextval('certificate_seq')`,
          verifyCode: newVerifyCode(),
          resultId: w.id, studentId: w.studentId, competitionId: set.competitionId,
          studentName: `${w.first} ${w.last}`, schoolName: w.school, grade: w.grade, award: w.award!, awardLabel: w.awardLabel!,
          issuedAt: publishAt,
        })),
      );
    }
    // Physical awards (medal tiers) go to the school, or to the parent for individual entrants.
    const medalKeys = new Set(set.awardRules.filter((r) => r.kind === "medal").map((r) => r.key));
    const groups = new Map<string, { schoolId: string | null; guardian: string | null; items: Map<string, number> }>();
    for (const w of winners.filter((w) => medalKeys.has(w.award!))) {
      const key = w.schoolId ? `s:${w.schoolId}` : `g:${w.guardian}`;
      const g = groups.get(key) ?? { schoolId: w.schoolId, guardian: w.schoolId ? null : w.guardian, items: new Map() };
      g.items.set(w.awardLabel!, (g.items.get(w.awardLabel!) ?? 0) + 1);
      groups.set(key, g);
    }
    if (groups.size) {
      await tx.insert(schema.awardDispatches).values(
        [...groups.values()].map((g) => ({ resultSetId: setId, schoolId: g.schoolId, guardianUserId: g.guardian, items: [...g.items].map(([label, count]) => ({ label, count })) })),
      );
    }
    await tx.update(schema.resultSets).set({ status: "published", publishAt, publishedBy: actorId }).where(eq(schema.resultSets.id, setId));
    return { ok: true as const, certificates: winners.length, dispatches: groups.size };
  });
}

/** Withdraws published results for correction; their certificates are revoked. */
export async function withdrawResults(setId: string, reason: string, actorId: string) {
  return db.transaction(async (tx) => {
    const [set] = await tx.select().from(schema.resultSets).where(eq(schema.resultSets.id, setId)).for("update");
    if (!set || (set.status !== "published" && set.status !== "approved")) return { ok: false as const, error: "Only approved or published results can be withdrawn." };
    const ids = tx.select({ id: schema.results.id }).from(schema.results).where(eq(schema.results.resultSetId, setId));
    const revoked = await tx
      .update(schema.certificates)
      .set({ revokedAt: new Date(), revokedReason: `Results withdrawn for correction: ${reason}`, revokedBy: actorId })
      .where(and(inArray(schema.certificates.resultId, ids), sql`${schema.certificates.revokedAt} is null`))
      .returning({ id: schema.certificates.id });
    await tx.update(schema.resultSets).set({ status: "withdrawn", withdrawnReason: reason, withdrawnBy: actorId }).where(eq(schema.resultSets.id, setId));
    return { ok: true as const, revoked: revoked.length };
  });
}

/** A student's published results, newest first. */
export async function publishedResultsFor(studentIds: string[]) {
  if (!studentIds.length) return [];
  return db
    .select({
      id: schema.results.id, studentId: schema.results.studentId, competition: schema.competitions.name, competitionId: schema.competitions.id, grade: schema.results.grade,
      absent: schema.results.absent, score: schema.results.score, maxScore: schema.results.maxScore, percent: schema.results.percent,
      rank: schema.results.rank, cohortSize: schema.results.cohortSize, rankInSchool: schema.results.rankInSchool, schoolCohortSize: schema.results.schoolCohortSize,
      awardLabel: schema.results.awardLabel, award: schema.results.award, publishAt: schema.resultSets.publishAt,
      certificateId: schema.certificates.id, certificateRevoked: schema.certificates.revokedAt,
    })
    .from(schema.results)
    .innerJoin(schema.resultSets, eq(schema.resultSets.id, schema.results.resultSetId))
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.results.competitionId))
    .leftJoin(schema.certificates, eq(schema.certificates.resultId, schema.results.id))
    .where(and(inArray(schema.results.studentId, studentIds), visibleSet, lte(schema.resultSets.publishAt, sql`now()`)))
    .orderBy(sql`${schema.resultSets.publishAt} desc`);
}

/** Topic breakdown for one result: online answers or the paper answer sheet. */
export async function topicBreakdown(result: { source: string; registrationItemId: string; studentId: string; competitionId: string }) {
  const tally = new Map<string, { correct: number; total: number }>();
  const add = (topic: string, correct: boolean) => {
    const t = tally.get(topic) ?? { correct: 0, total: 0 };
    t.total++;
    if (correct) t.correct++;
    tally.set(topic, t);
  };
  if (result.source === "online") {
    const a = await db.query.examAttempts.findFirst({ where: and(eq(schema.examAttempts.studentId, result.studentId), eq(schema.examAttempts.competitionId, result.competitionId)) });
    if (!a) return [];
    const [pqs, answers] = await Promise.all([
      db.select({ id: schema.paperQuestions.id, snapshot: schema.paperQuestions.snapshot }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, a.paperId)),
      db.select({ pq: schema.attemptAnswers.paperQuestionId, correct: schema.attemptAnswers.correct }).from(schema.attemptAnswers).where(eq(schema.attemptAnswers.attemptId, a.id)),
    ]);
    const ok = new Map(answers.map((x) => [x.pq, !!x.correct]));
    for (const pq of pqs) add(pq.snapshot.topic, ok.get(pq.id) ?? false);
  } else {
    const s = await db.query.paperScripts.findFirst({ where: eq(schema.paperScripts.registrationItemId, result.registrationItemId) });
    if (!s) return [];
    const pqs = await db.select({ id: schema.paperQuestions.id, topic: sql<string>`${schema.paperQuestions.snapshot}->>'topic'` }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, s.paperId));
    const topic = new Map(pqs.map((p) => [p.id, p.topic]));
    for (const l of s.lines) add(topic.get(l.pq) ?? "Other", l.correct);
  }
  return [...tally].map(([topic, t]) => ({ topic, ...t, percent: Math.round((t.correct / t.total) * 100) })).sort((a, b) => b.percent - a.percent);
}
