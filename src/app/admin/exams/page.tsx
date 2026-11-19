import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { CalendarPlus, Plus } from "lucide-react";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { gradeRange } from "@/lib/question-ui";
import { buttonClass } from "@/components/ui/button";
import { Card, DateTime, EmptyState, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/form";
import { sessionState } from "@/lib/exam/session-state";

export const metadata: Metadata = { title: "Examinations" };

export default async function ExamsAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requirePermission("exams.view");
  const { deleted } = await searchParams;
  const [papers, sessions] = await Promise.all([
    db
      .select({ id: schema.papers.id, code: schema.papers.code, title: schema.papers.title, status: schema.papers.status, gradeFrom: schema.papers.gradeFrom, gradeTo: schema.papers.gradeTo, level: schema.papers.level, totalMarks: schema.papers.totalMarks, duration: schema.papers.durationMinutes, competition: schema.competitions.name, questions: sql<number>`(select count(*)::int from paper_questions pq where pq.paper_id = ${schema.papers.id})` })
      .from(schema.papers)
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.papers.competitionId))
      .orderBy(desc(schema.papers.createdAt))
      .limit(200),
    db
      .select({ id: schema.examSessions.id, title: schema.examSessions.title, opensAt: schema.examSessions.opensAt, closesAt: schema.examSessions.closesAt, status: schema.examSessions.status, paper: schema.papers.code, competition: schema.competitions.name, attempts: sql<number>`(select count(*)::int from exam_attempts a where a.session_id = ${schema.examSessions.id})` })
      .from(schema.examSessions)
      .innerJoin(schema.papers, eq(schema.papers.id, schema.examSessions.paperId))
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.examSessions.competitionId))
      .orderBy(desc(schema.examSessions.opensAt))
      .limit(200),
  ]);
  const manage = can(user, "exams.manage");
  return (
    <>
      <PageHeader
        title="Examinations"
        description="Build papers from approved questions, make them final, then schedule online sessions or print paper versions."
        actions={manage && (
          <div className="flex gap-2">
            <Link href="/admin/exams/sessions/new" className={buttonClass("outline", "md")}><CalendarPlus className="size-4" aria-hidden /> Schedule online session</Link>
            <Link href="/admin/exams/papers/new" className={buttonClass("primary", "md")}><Plus className="size-4" aria-hidden /> New paper</Link>
          </div>
        )}
      />
      {deleted && <div className="mb-6"><FormMessage ok="Draft paper deleted." /></div>}
      <Card title="Papers" className="mb-6">
        {papers.length === 0 ? <EmptyState title="No papers yet">A paper is generated from a blueprint: how many questions of each topic and difficulty.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Paper</th><th className={th}>Competition</th><th className={th}>Questions</th><th className={th}>Time</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {papers.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/50">
                    <td className={td}><Link href={`/admin/exams/papers/${p.id}`} className="font-semibold text-navy-900 hover:underline">{p.title}</Link><p className="font-mono text-xs text-muted">{p.code}</p></td>
                    <td className={`${td} text-muted`}>{p.competition}<br /><span className="text-xs">{gradeRange(p.gradeFrom, p.gradeTo)}{p.level > 1 ? ` · Level ${p.level}` : ""}</span></td>
                    <td className={`${td} tabular-nums`}>{p.questions} <span className="text-xs text-muted">· {p.totalMarks} marks</span></td>
                    <td className={`${td} text-muted`}>{p.duration} min</td>
                    <td className={td}>{p.status === "final" ? <Pill tone="green">Final</Pill> : <Pill tone="amber">Draft</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card title="Online sessions">
        {sessions.length === 0 ? <EmptyState title="No online sessions yet">Schedule a session once a paper is final. Students with paid online registrations see it in their portal.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Session</th><th className={th}>Opens</th><th className={th}>Closes</th><th className={th}>Started</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {sessions.map((s) => {
                  const st = sessionState(s);
                  return (
                    <tr key={s.id} className="hover:bg-surface/50">
                      <td className={td}><Link href={`/admin/exams/sessions/${s.id}`} className="font-semibold text-navy-900 hover:underline">{s.title}</Link><p className="text-xs text-muted">{s.competition} · <span className="font-mono">{s.paper}</span></p></td>
                      <td className={`${td} text-muted`}><DateTime value={s.opensAt} /></td>
                      <td className={`${td} text-muted`}><DateTime value={s.closesAt} /></td>
                      <td className={`${td} tabular-nums`}>{s.attempts}</td>
                      <td className={td}><Pill tone={st.tone}>{st.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
