import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { GRADE_OPTIONS, gradeRange } from "@/lib/question-ui";
import { poolSummary } from "@/lib/server/papers";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader, td, th } from "@/components/admin/ui";
import { PaperForm } from "./paper-form";

export const metadata: Metadata = { title: "New paper" };

type Search = { competition?: string; gradeFrom?: string; gradeTo?: string; level?: string };

export default async function NewPaper({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission("exams.manage");
  const f = await searchParams;
  const comps = await db.select({ id: schema.competitions.id, name: schema.competitions.name, duration: schema.competitions.durationMinutes, levels: schema.competitions.levels }).from(schema.competitions).orderBy(asc(schema.competitions.sortOrder));
  const comp = comps.find((c) => c.id === f.competition);
  const g = (s?: string) => (s && /^\d{1,2}$/.test(s) && Number(s) <= 12 ? Number(s) : null);
  const gradeFrom = g(f.gradeFrom), gradeTo = g(f.gradeTo);
  const level = [1, 2, 3].includes(Number(f.level)) ? Number(f.level) : 1;
  const scope = comp && gradeFrom !== null && gradeTo !== null && gradeFrom <= gradeTo ? { competitionId: comp.id, gradeFrom, gradeTo, level } : null;
  const summary = scope ? await poolSummary(scope) : [];
  const topics = [...new Set(summary.map((s) => s.topic))];
  const cell = (topic: string, d: string) => summary.find((s) => s.topic === topic && s.difficulty === d)?.n ?? 0;
  const total = summary.reduce((s, r) => s + r.n, 0);
  const select = "h-11 rounded-xl border border-line bg-white px-3 text-sm";

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/exams" className="text-muted hover:text-navy-700">← Examinations</Link></p>
      <PageHeader title="New paper" description="First choose who the paper is for, to see which approved questions are available." />
      <Card className="mb-6 p-5">
        <form className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold text-navy-900">Competition<br />
            <select name="competition" defaultValue={f.competition ?? ""} className={`${select} mt-1.5 w-64`} required>
              <option value="">Choose…</option>
              {comps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy-900">First grade<br />
            <select name="gradeFrom" defaultValue={f.gradeFrom ?? ""} className={`${select} mt-1.5`} required><option value="">—</option>{GRADE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          </label>
          <label className="text-sm font-semibold text-navy-900">Last grade<br />
            <select name="gradeTo" defaultValue={f.gradeTo ?? ""} className={`${select} mt-1.5`} required><option value="">—</option>{GRADE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          </label>
          <label className="text-sm font-semibold text-navy-900">Level<br />
            <select name="level" defaultValue={String(level)} className={`${select} mt-1.5`}>{[1, 2, 3].map((l) => <option key={l} value={l}>Level {l}</option>)}</select>
          </label>
          <button className={buttonClass("outline", "md")}>Show available questions</button>
        </form>
        {f.competition && !scope && <p className="mt-3 text-sm text-red-700">Choose a competition and a grade range where the last grade is not before the first.</p>}
      </Card>

      {scope && (
        <>
          <Card title={`Approved questions for ${comp!.name}, ${gradeRange(scope.gradeFrom, scope.gradeTo)}${level > 1 ? `, Level ${level}` : ""}: ${total}`} className="mb-6">
            {total === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No approved questions suit this range yet. A question suits a paper when its grades cover all of the paper&apos;s grades. <Link href={`/admin/questions/new?competition=${comp!.id}`} className="font-semibold text-navy-600 hover:underline">Add questions →</Link></p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Topic</th><th className={th}>Easy</th><th className={th}>Medium</th><th className={th}>Hard</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {topics.map((t) => <tr key={t}><td className={td}>{t}</td>{["easy", "medium", "hard"].map((d) => <td key={d} className={`${td} tabular-nums text-muted`}>{cell(t, d)}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {total > 0 && <PaperForm scope={{ ...scope, competitionName: comp!.name }} topics={topics} defaultDuration={comp!.duration ?? 60} />}
        </>
      )}
    </>
  );
}
