import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { sessionState } from "@/lib/exam/session-state";
import { expireOverdue } from "@/lib/server/attempts";
import { Card, DateTime, EmptyState, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/form";
import { CancelSession, EndAttempt } from "./session-controls";

export const metadata: Metadata = { title: "Online session" };

export default async function SessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requirePermission("exams.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const s = await db.query.examSessions.findFirst({ where: eq(schema.examSessions.id, id) });
  if (!s) notFound();
  await expireOverdue({ sessionId: id });
  const paper = (await db.query.papers.findFirst({ where: eq(schema.papers.id, s.paperId) }))!;
  const [attempts, [eligible]] = await Promise.all([
    db
      .select({ id: schema.examAttempts.id, status: schema.examAttempts.status, startedAt: schema.examAttempts.startedAt, deadlineAt: schema.examAttempts.deadlineAt, submittedAt: schema.examAttempts.submittedAt, reason: schema.examAttempts.submittedReason, lastSavedAt: schema.examAttempts.lastSavedAt, focusLost: schema.examAttempts.focusLost, code: schema.students.code, first: schema.students.firstName, last: schema.students.lastName, answered: sql<number>`(select count(*)::int from attempt_answers aa where aa.attempt_id = ${schema.examAttempts.id} and (jsonb_array_length(coalesce(aa.response->'options','[]'::jsonb)) > 0 or coalesce(aa.response->>'text','') <> ''))` })
      .from(schema.examAttempts)
      .innerJoin(schema.students, eq(schema.students.id, schema.examAttempts.studentId))
      .where(eq(schema.examAttempts.sessionId, id))
      .orderBy(asc(schema.examAttempts.startedAt)),
    db
      .select({ n: sql<number>`count(distinct ${schema.registrationItems.studentId})::int` })
      .from(schema.registrationItems)
      .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
      .where(and(eq(schema.registrationItems.competitionId, s.competitionId), eq(schema.registrations.mode, "online"), eq(schema.registrations.status, "confirmed"), gte(schema.registrationItems.grade, paper.gradeFrom), lte(schema.registrationItems.grade, paper.gradeTo))),
  ]);
  const { created } = await searchParams;
  const st = sessionState(s);
  const total = (await db.select({ n: sql<number>`count(*)::int` }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paper.id)))[0].n;
  const manage = can(user, "exams.manage");
  const inProgress = attempts.filter((a) => a.status === "in_progress").length;

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/exams" className="text-muted hover:text-navy-700">← Examinations</Link></p>
      <PageHeader title={s.title} description={`Paper ${paper.code} · ${paper.title}`} actions={<Pill tone={st.tone}>{st.label}</Pill>} />
      {created && <div className="mb-6"><FormMessage ok="Session scheduled. Eligible students will see it in their portal." /></div>}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eligible students" value={eligible?.n ?? 0} hint="Paid online registrations in the paper's grades" />
        <StatCard label="Started" value={attempts.length} />
        <StatCard label="Writing now" value={inProgress} />
        <StatCard label="Submitted" value={attempts.length - inProgress} />
      </div>
      <Card className="mb-6 p-5">
        <dl className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">Opens</dt><dd><DateTime value={s.opensAt} /></dd>
          <dt className="text-muted">Closes</dt><dd><DateTime value={s.closesAt} /></dd>
          <dt className="text-muted">Time per student</dt><dd>{paper.durationMinutes} minutes, ending no later than the closing time</dd>
        </dl>
        {manage && s.status === "scheduled" && attempts.length === 0 && <div className="mt-4"><CancelSession id={s.id} /></div>}
      </Card>
      <Card title="Students">
        {attempts.length === 0 ? <EmptyState title="Nobody has started yet">This list updates when you reload the page.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Student</th><th className={th}>Started</th><th className={th}>Answered</th><th className={th}>Last saved</th><th className={th}>Left the page</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td className={td}>{a.first} {a.last}<p className="font-mono text-xs text-muted">{a.code}</p></td>
                    <td className={`${td} text-muted`}><DateTime value={a.startedAt} /></td>
                    <td className={`${td} tabular-nums`}>{a.answered} / {total}</td>
                    <td className={`${td} text-muted`}>{a.lastSavedAt ? <DateTime value={a.lastSavedAt} /> : "—"}</td>
                    <td className={`${td} tabular-nums ${a.focusLost > 3 ? "font-semibold text-red-700" : "text-muted"}`}>{a.focusLost}×</td>
                    <td className={td}>
                      {a.status === "submitted" ? <Pill tone="green">{a.reason === "time" ? "Time ran out" : a.reason === "staff" ? "Ended by staff" : "Submitted"}</Pill> : (
                        <div className="flex items-center gap-3"><Pill tone="blue">Writing</Pill>{manage && <EndAttempt id={s.id} attempt={a.id} />}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-5 py-3 text-xs text-muted">Scores are calculated on submission and released through Results (next phase); they are not shown to students yet.</p>
      </Card>
    </>
  );
}
