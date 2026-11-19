"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireStudent } from "@/lib/auth/family";
import { finaliseAttempt, recordFocusLost, saveAnswer, startAttempt, type SaveResult } from "@/lib/server/attempts";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";

const uuid = z.string().uuid();

export async function startExamAction(_prev: { error?: string } | undefined, formData: FormData): Promise<{ error?: string }> {
  const { user, student } = await requireStudent();
  const sessionId = String(formData.get("session"));
  if (!uuid.safeParse(sessionId).success) return { error: "Exam not found." };
  const r = await startAttempt(student.id, sessionId);
  if (!r.ok) return { error: r.error };
  await audit({ actorUserId: user.id, action: "exam_attempt.opened", entityType: "exam_attempt", entityId: r.attemptId });
  redirect(`/student/exam/${r.attemptId}`);
}

const saveInput = z.object({
  attemptId: uuid,
  pq: uuid,
  response: z.object({ options: z.array(z.string().max(2)).max(6).optional(), text: z.string().max(200).optional() }),
  flagged: z.boolean(),
});

export async function saveAnswerAction(input: unknown): Promise<SaveResult> {
  const { student } = await requireStudent();
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  if (!(await rateLimit(`exam-save:${student.id}`, 600, 60))) return { ok: false, reason: "invalid" };
  return saveAnswer(student.id, parsed.data);
}

export async function submitExamAction(attemptId: string): Promise<{ ok: boolean }> {
  const { user, student } = await requireStudent();
  if (!uuid.safeParse(attemptId).success) return { ok: false };
  const a = await db.query.examAttempts.findFirst({ where: and(eq(schema.examAttempts.id, attemptId), eq(schema.examAttempts.studentId, student.id)) });
  if (!a) return { ok: false };
  if (a.status === "in_progress") {
    await finaliseAttempt(a.id, Date.now() >= a.deadlineAt.getTime() ? "time" : "student");
    await audit({ actorUserId: user.id, action: "exam_attempt.submitted", entityType: "exam_attempt", entityId: a.id });
  }
  return { ok: true };
}

export async function focusLostAction(attemptId: string) {
  const { student } = await requireStudent();
  if (uuid.safeParse(attemptId).success) await recordFocusLost(student.id, attemptId);
}
