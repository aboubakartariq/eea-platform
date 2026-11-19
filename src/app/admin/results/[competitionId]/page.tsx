import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { Download } from "lucide-react";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { gradeName } from "@/lib/competition-types";
import { DEFAULT_AWARD_RULES } from "@/lib/results/rank";
import { resultStatus } from "@/lib/results/status";
import { serverNow } from "@/lib/server/clock";
import { gatherScores, liveResultSet } from "@/lib/server/results";
import { buttonClass } from "@/components/ui/button";
import { Card, DateTime, EmptyState, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { CalculateForm, SetActions } from "./controls";

export const metadata: Metadata = { title: "Competition results" };

export default async function CompetitionResults({ params, searchParams }: { params: Promise<{ competitionId: string }>; searchParams: Promise<{ grade?: string }> }) {
  const user = await requirePermission("results.view");
  const { competitionId } = await params;
  if (!z.string().uuid().safeParse(competitionId).success) notFound();
  const comp = await db.query.competitions.findFirst({ where: eq(schema.competitions.id, competitionId) });
  if (!comp) notFound();
  const [set, inputs, lastWithdrawn] = await Promise.all([
    liveResultSet(competitionId),
    gatherScores(competitionId),
    db.query.resultSets.findFirst({ where: and(eq(schema.resultSets.competitionId, competitionId), eq(schema.resultSets.status, "withdrawn")), orderBy: (t, { desc }) => desc(t.updatedAt) }),
  ]);
  const st = resultStatus(set, serverNow());
  const grades = set ? (await db.selectDistinct({ g: schema.results.grade }).from(schema.results).where(eq(schema.results.resultSetId, set.id)).orderBy(asc(schema.results.grade))).map((x) => x.g) : [];
  const { grade: g } = await searchParams;
  const grade = grades.includes(Number(g)) ? Number(g) : grades[0];
  const rows = set && grade !== undefined
    ? await db
        .select({ id: schema.results.id, rank: schema.results.rank, cohort: schema.results.cohortSize, rankInSchool: schema.results.rankInSchool, score: schema.results.score, max: schema.results.maxScore, percent: schema.results.percent, award: schema.results.awardLabel, absent: schema.results.absent, source: schema.results.source, first: schema.students.firstName, last: schema.students.lastName, code: schema.students.code, school: sql<string>`coalesce(${schema.schools.name}, ${schema.students.schoolName}, 'Individual')`, roll: schema.registrationItems.rollNumber })
        .from(schema.results)
        .innerJoin(schema.students, eq(schema.students.id, schema.results.studentId))
        .innerJoin(schema.registrationItems, eq(schema.registrationItems.id, schema.results.registrationItemId))
        .leftJoin(schema.schools, eq(schema.schools.id, schema.results.schoolId))
        .where(and(eq(schema.results.resultSetId, set.id), eq(schema.results.grade, grade)))
        .orderBy(sql`${schema.results.rank} asc nulls last`, asc(schema.students.lastName))
    : [];
  const awardCounts = set ? await db.select({ label: schema.results.awardLabel, n: sql<number>`count(*)::int` }).from(schema.results).where(and(eq(schema.results.resultSetId, set.id), sql`${schema.results.awardLabel} is not null`)).groupBy(schema.results.awardLabel) : [];
  const people = set ? await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, [set.calculatedBy, set.approvedBy, set.publishedBy].filter((x): x is string => !!x).concat("00000000-0000-0000-0000-000000000000"))) : [];
  const who = (id: string | null) => people.find((p) => p.id === id)?.name ?? "—";
  const online = inputs.rows.filter((r) => r.source === "online"), paper = inputs.rows.filter((r) => r.source === "paper");

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/results" className="text-muted hover:text-navy-700">← Results</Link></p>
      <PageHeader title={`${comp.name} results`} description="Ranks are per grade: higher score first, then higher accuracy. Students equal on both share a rank." actions={<Pill tone={st.tone}>{st.label}</Pill>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Confirmed students" value={inputs.rows.length} />
        <StatCard label="Online exams submitted" value={online.filter((r) => !r.absent).length} hint={`of ${online.length} online${inputs.writing ? ` · ${inputs.writing} writing now` : ""}`} />
        <StatCard label="Paper sheets entered" value={paper.length - inputs.missingSheets} hint={`of ${paper.length} on paper`} />
        <StatCard label="Results" value={set ? set.resultCount : "—"} hint={set ? `${set.absentCount} absent` : undefined} />
      </div>
      {lastWithdrawn && !set && <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">Earlier results were withdrawn: {lastWithdrawn.withdrawnReason}</p>}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {(!set || set.status === "draft") && can(user, "results.manage") && (
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">{set ? "Recalculate" : "Calculate"}</h2>
            <CalculateForm competitionId={comp.id} rules={set?.awardRules ?? lastWithdrawn?.awardRules ?? DEFAULT_AWARD_RULES} recalc={!!set} />
          </Card>
        )}
        {set && (
          <Card className="p-5">
            <h2 className="font-semibold">Approval and publishing</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted">Calculated</dt><dd>{who(set.calculatedBy)} · <DateTime value={set.calculatedAt} /></dd>
              <dt className="text-muted">Approved</dt><dd>{set.approvedAt ? <>{who(set.approvedBy)} · <DateTime value={set.approvedAt} /></> : "Not yet"}</dd>
              <dt className="text-muted">Published</dt><dd>{set.status === "published" && set.publishAt ? <>{who(set.publishedBy)} · visible from <DateTime value={set.publishAt} /></> : "Not yet"}</dd>
              {awardCounts.length > 0 && <><dt className="text-muted">Awards</dt><dd>{awardCounts.map((a) => `${a.n} ${a.label}`).join(" · ")}</dd></>}
            </dl>
            <div className="mt-4"><SetActions setId={set.id} status={set.status} canApprove={can(user, "results.approve")} canPublish={can(user, "results.publish")} isCalculator={set.calculatedBy === user.id} /></div>
          </Card>
        )}
      </div>

      {set && (
        <Card title="Results by grade" action={<a href={`/admin/results/${comp.id}/export`} className={buttonClass("outline", "sm")}><Download className="size-4" aria-hidden /> Excel</a>}>
          <nav className="flex flex-wrap gap-2 border-b border-line px-5 py-3" aria-label="Grades">
            {grades.map((x) => <Link key={x} href={`?grade=${x}`} aria-current={x === grade ? "page" : undefined} className={`rounded-full px-3 py-1 text-sm font-semibold ${x === grade ? "bg-navy-600 text-white" : "bg-surface text-navy-800 hover:bg-navy-50"}`}>{gradeName(x)}</Link>)}
          </nav>
          {rows.length === 0 ? <EmptyState title="No results" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Rank</th><th className={th}>Student</th><th className={th}>School</th><th className={th}>Score</th><th className={th}>Award</th><th className={th}>School rank</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className={`${td} font-display font-bold tabular-nums`}>{r.absent ? <span className="font-sans text-xs font-normal text-muted">Absent</span> : `${r.rank} / ${r.cohort}`}</td>
                      <td className={td}>{r.first} {r.last}<p className="font-mono text-xs text-muted">{r.roll} · {r.source}</p></td>
                      <td className={`${td} text-muted`}>{r.school}</td>
                      <td className={`${td} tabular-nums`}>{r.absent ? "—" : <>{Number(r.score)} / {r.max} <span className="text-xs text-muted">({Number(r.percent)}%)</span></>}</td>
                      <td className={td}>{r.award ?? "—"}</td>
                      <td className={`${td} tabular-nums text-muted`}>{r.rankInSchool ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
