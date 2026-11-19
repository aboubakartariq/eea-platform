import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, inArray, lt, lte, ne, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { AttemptOrderItem, AttemptResponse } from "@/db/schema";
import { SAVE_GRACE_MS, deadlineFor, hashSeed, markAnswer, rng, shuffle } from "@/lib/exam/engine";
import { requestInfo } from "./request";

/** Online, paid registrations for this student whose grade fits the paper. */
function eligibleFor(studentId: string, extra: SQL) {
  return db
    .select({
      sessionId: schema.examSessions.id,
      title: schema.examSessions.title,
      opensAt: schema.examSessions.opensAt,
      closesAt: schema.examSessions.closesAt,
      paperId: schema.papers.id,
      durationMinutes: schema.papers.durationMinutes,
      questionCount: sql<number>`(select count(*)::int from paper_questions pq where pq.paper_id = ${schema.papers.id})`,
      competitionId: schema.competitions.id,
      competition: schema.competitions.name,
    })
    .from(schema.registrationItems)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
    .innerJoin(schema.examSessions, eq(schema.examSessions.competitionId, schema.registrationItems.competitionId))
    .innerJoin(schema.papers, eq(schema.papers.id, schema.examSessions.paperId))
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.examSessions.competitionId))
    .where(
      and(
        eq(schema.registrationItems.studentId, studentId),
        eq(schema.registrations.mode, "online"),
        eq(schema.registrations.status, "confirmed"),
        eq(schema.examSessions.status, "scheduled"),
        eq(schema.papers.status, "final"),
        lte(schema.papers.gradeFrom, schema.registrationItems.grade),
        gte(schema.papers.gradeTo, schema.registrationItems.grade),
        extra,
      ),
    );
}

/** Sessions a student can see on their portal, with their attempt if they've started. */
export async function studentExams(studentId: string) {
  await expireOverdue({ studentId });
  const sessions = await eligibleFor(studentId, gte(schema.examSessions.closesAt, sql`now() - interval '14 days'`)).orderBy(asc(schema.examSessions.opensAt));
  const attempts = await db.select().from(schema.examAttempts).where(eq(schema.examAttempts.studentId, studentId));
  const byCompetition = new Map(attempts.map((a) => [a.competitionId, a]));
  const seen = new Set<string>();
  return sessions
    .filter((s) => !seen.has(s.sessionId) && seen.add(s.sessionId))
    .map((s) => {
      const attempt = byCompetition.get(s.competitionId) ?? null;
      return { ...s, attempt: attempt && attempt.sessionId === s.sessionId ? attempt : null, satElsewhere: !!attempt && attempt.sessionId !== s.sessionId };
    })
    .filter((s) => !s.satElsewhere);
}

export type StartResult = { ok: true; attemptId: string } | { ok: false; error: string };

export async function startAttempt(studentId: string, sessionId: string): Promise<StartResult> {
  const [s] = await eligibleFor(studentId, eq(schema.examSessions.id, sessionId));
  if (!s) return { ok: false, error: "This exam isn't available to you. Ask your school or parent to check your registration." };
  const existing = await db.query.examAttempts.findFirst({ where: and(eq(schema.examAttempts.studentId, studentId), eq(schema.examAttempts.competitionId, s.competitionId)) });
  if (existing) {
    if (existing.sessionId !== sessionId) return { ok: false, error: "You've already sat this competition in another session." };
    return { ok: true, attemptId: existing.id };
  }
  const now = new Date();
  if (now < s.opensAt) return { ok: false, error: "This exam hasn't opened yet." };
  if (now.getTime() > s.closesAt.getTime() - 60_000) return { ok: false, error: "This exam has closed." };

  const paper = (await db.query.papers.findFirst({ where: eq(schema.papers.id, s.paperId) }))!;
  const pqs = await db.select({ id: schema.paperQuestions.id, snapshot: schema.paperQuestions.snapshot }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paper.id)).orderBy(asc(schema.paperQuestions.position));
  const id = randomUUID();
  const random = rng(hashSeed(id));
  const ordered = paper.shuffleQuestions ? shuffle(pqs, random) : pqs;
  const order: AttemptOrderItem[] = ordered.map((pq) => {
    const ids = pq.snapshot.options.map((o) => o.id);
    const shuffleOpts = paper.shuffleOptions && (pq.snapshot.type === "single" || pq.snapshot.type === "multiple");
    return { pq: pq.id, opts: shuffleOpts ? shuffle(ids, random) : ids };
  });
  const { ip, userAgent } = await requestInfo();
  const inserted = await db
    .insert(schema.examAttempts)
    .values({
      id,
      sessionId,
      paperId: paper.id,
      competitionId: s.competitionId,
      studentId,
      questionOrder: order,
      startedAt: now,
      deadlineAt: deadlineFor(now, paper.durationMinutes, s.closesAt),
      maxScore: paper.totalMarks,
      ip,
      userAgent,
    })
    .onConflictDoNothing()
    .returning({ id: schema.examAttempts.id });
  if (!inserted.length) {
    // Two tabs pressed Start at once: use the attempt the other one made.
    const again = await db.query.examAttempts.findFirst({ where: and(eq(schema.examAttempts.studentId, studentId), eq(schema.examAttempts.competitionId, s.competitionId)) });
    return again && again.sessionId === sessionId ? { ok: true, attemptId: again.id } : { ok: false, error: "You've already sat this competition." };
  }
  return { ok: true, attemptId: id };
}

/** What the exam screen needs. Correct answers are never included. */
export async function attemptView(attemptId: string, studentId: string) {
  const attempt = await db.query.examAttempts.findFirst({ where: and(eq(schema.examAttempts.id, attemptId), eq(schema.examAttempts.studentId, studentId)) });
  if (!attempt) return null;
  if (attempt.status === "in_progress" && Date.now() > attempt.deadlineAt.getTime() + SAVE_GRACE_MS) {
    await finaliseAttempt(attempt.id, "time");
    return attemptView(attemptId, studentId);
  }
  const [session, paper] = await Promise.all([
    db.query.examSessions.findFirst({ where: eq(schema.examSessions.id, attempt.sessionId) }),
    db.query.papers.findFirst({ where: eq(schema.papers.id, attempt.paperId) }),
  ]);
  const competition = await db.query.competitions.findFirst({ where: eq(schema.competitions.id, attempt.competitionId), columns: { name: true } });
  const ids = attempt.questionOrder.map((o) => o.pq);
  const [pqs, answers] = await Promise.all([
    ids.length ? db.select().from(schema.paperQuestions).where(inArray(schema.paperQuestions.id, ids)) : Promise.resolve([]),
    db.select().from(schema.attemptAnswers).where(eq(schema.attemptAnswers.attemptId, attempt.id)),
  ]);
  const byId = new Map(pqs.map((p) => [p.id, p]));
  const saved = new Map(answers.map((a) => [a.paperQuestionId, a]));
  const questions = attempt.questionOrder.map((o, i) => {
    const pq = byId.get(o.pq)!;
    const text = new Map(pq.snapshot.options.map((x) => [x.id, x.text]));
    return {
      id: pq.id,
      number: i + 1,
      type: pq.snapshot.type,
      stem: pq.snapshot.stem,
      marks: pq.snapshot.marks,
      options: o.opts.map((id) => ({ id, text: text.get(id) ?? "" })),
      response: saved.get(pq.id)?.response ?? null,
      flagged: saved.get(pq.id)?.flagged ?? false,
    };
  });
  return {
    attempt: { id: attempt.id, status: attempt.status, deadlineAt: attempt.deadlineAt, submittedAt: attempt.submittedAt, submittedReason: attempt.submittedReason },
    title: session?.title ?? "",
    competition: competition?.name ?? "",
    instructions: paper?.instructions ?? null,
    negativePercent: paper?.negativePercent ?? 0,
    questions,
  };
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: "closed" | "invalid" | "not_found" };

export async function saveAnswer(studentId: string, input: { attemptId: string; pq: string; response: AttemptResponse; flagged: boolean }): Promise<SaveResult> {
  const attempt = await db.query.examAttempts.findFirst({ where: and(eq(schema.examAttempts.id, input.attemptId), eq(schema.examAttempts.studentId, studentId)) });
  if (!attempt) return { ok: false, reason: "not_found" };
  if (attempt.status !== "in_progress") return { ok: false, reason: "closed" };
  if (Date.now() > attempt.deadlineAt.getTime() + SAVE_GRACE_MS) {
    await finaliseAttempt(attempt.id, "time");
    return { ok: false, reason: "closed" };
  }
  const item = attempt.questionOrder.find((o) => o.pq === input.pq);
  if (!item) return { ok: false, reason: "invalid" };
  const pq = await db.query.paperQuestions.findFirst({ where: eq(schema.paperQuestions.id, input.pq), columns: { snapshot: true } });
  if (!pq) return { ok: false, reason: "invalid" };

  // Keep only a response that fits the question.
  const t = pq.snapshot.type;
  let response: AttemptResponse;
  if (t === "numeric" || t === "short") {
    const text = String(input.response.text ?? "").slice(0, 200);
    if (t === "numeric" && text.trim() && !/^-?[\d,]*\.?\d*$/.test(text.trim())) return { ok: false, reason: "invalid" };
    response = { text };
  } else {
    const valid = new Set(item.opts);
    const options = [...new Set((input.response.options ?? []).map(String))].filter((o) => valid.has(o));
    if (t !== "multiple" && options.length > 1) return { ok: false, reason: "invalid" };
    response = { options };
  }
  const now = new Date();
  const done = await db.transaction(async (tx) => {
    // Lock the attempt row so a save can't land after submission.
    const [locked] = await tx.select({ status: schema.examAttempts.status }).from(schema.examAttempts).where(eq(schema.examAttempts.id, attempt.id)).for("update");
    if (locked?.status !== "in_progress") return false;
    await tx
      .insert(schema.attemptAnswers)
      .values({ attemptId: attempt.id, paperQuestionId: input.pq, response, flagged: !!input.flagged, savedAt: now })
      .onConflictDoUpdate({ target: [schema.attemptAnswers.attemptId, schema.attemptAnswers.paperQuestionId], set: { response, flagged: !!input.flagged, savedAt: now } });
    await tx.update(schema.examAttempts).set({ lastSavedAt: now }).where(eq(schema.examAttempts.id, attempt.id));
    return true;
  });
  return done ? { ok: true, savedAt: now.toISOString() } : { ok: false, reason: "closed" };
}

/** Submits and auto-marks an attempt. Safe to call twice. */
export async function finaliseAttempt(attemptId: string, reason: "student" | "time" | "staff") {
  await db.transaction(async (tx) => {
    const [a] = await tx.select().from(schema.examAttempts).where(eq(schema.examAttempts.id, attemptId)).for("update");
    if (!a || a.status !== "in_progress") return;
    const [paper] = await tx.select({ negativePercent: schema.papers.negativePercent }).from(schema.papers).where(eq(schema.papers.id, a.paperId));
    const pqs = await tx.select({ id: schema.paperQuestions.id, snapshot: schema.paperQuestions.snapshot }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, a.paperId));
    const answers = await tx.select().from(schema.attemptAnswers).where(eq(schema.attemptAnswers.attemptId, a.id));
    const byPq = new Map(answers.map((x) => [x.paperQuestionId, x]));
    let score = 0;
    let correctCount = 0;
    for (const pq of pqs) {
      const ans = byPq.get(pq.id);
      const m = markAnswer(pq.snapshot, ans?.response, paper?.negativePercent ?? 0);
      score += m.marks;
      if (m.correct) correctCount++;
      if (ans) await tx.update(schema.attemptAnswers).set({ correct: m.answered ? m.correct : null, marksAwarded: String(m.marks) }).where(and(eq(schema.attemptAnswers.attemptId, a.id), eq(schema.attemptAnswers.paperQuestionId, pq.id)));
    }
    const now = new Date();
    await tx
      .update(schema.examAttempts)
      .set({ status: "submitted", submittedAt: reason === "time" && now > a.deadlineAt ? a.deadlineAt : now, submittedReason: reason, score: score.toFixed(2), correctCount })
      .where(eq(schema.examAttempts.id, a.id));
  });
}

/** Submits attempts whose time has run out (students who closed the tab). */
export async function expireOverdue(scope: { sessionId?: string; studentId?: string }) {
  const overdue = await db
    .select({ id: schema.examAttempts.id })
    .from(schema.examAttempts)
    .where(
      and(
        eq(schema.examAttempts.status, "in_progress"),
        lt(schema.examAttempts.deadlineAt, sql`now() - make_interval(secs => ${SAVE_GRACE_MS / 1000})`),
        scope.sessionId ? eq(schema.examAttempts.sessionId, scope.sessionId) : undefined,
        scope.studentId ? eq(schema.examAttempts.studentId, scope.studentId) : undefined,
      ),
    )
    .limit(500);
  for (const a of overdue) await finaliseAttempt(a.id, "time");
  return overdue.length;
}

export async function recordFocusLost(studentId: string, attemptId: string) {
  await db
    .update(schema.examAttempts)
    .set({ focusLost: sql`${schema.examAttempts.focusLost} + 1` })
    .where(and(eq(schema.examAttempts.id, attemptId), eq(schema.examAttempts.studentId, studentId), eq(schema.examAttempts.status, "in_progress"), ne(schema.examAttempts.focusLost, 1000)));
}
