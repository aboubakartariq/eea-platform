import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { FileSpreadsheet, Plus } from "lucide-react";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { DIFFICULTIES, QUESTION_TYPES, STATUS_LABELS, typeLabel } from "@/lib/questions";
import { difficultyLabel, gradeRange, statusTone } from "@/lib/question-ui";
import { buttonClass } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { BulkBar, SelectAll } from "./bulk-bar";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Question bank") };
}

type Search = { competition?: string; status?: string; type?: string; difficulty?: string; q?: string };
const PAGE = 200;

export default async function QuestionsAdmin({ searchParams }: { searchParams: Promise<Search> }) {
  const { tr, msg } = await getTr();
  const user = await requirePermission("questions.view");
  const f = await searchParams;
  const comps = await db.select({ id: schema.competitions.id, name: schema.competitions.name, code: schema.competitions.code }).from(schema.competitions).orderBy(asc(schema.competitions.sortOrder));

  const where: SQL[] = [];
  if (f.competition && comps.some((c) => c.id === f.competition)) where.push(eq(schema.questions.competitionId, f.competition));
  if (f.status && f.status in STATUS_LABELS) where.push(eq(schema.questions.status, f.status as "draft"));
  if (f.type && QUESTION_TYPES.some((t) => t.key === f.type)) where.push(eq(schema.questions.type, f.type as "single"));
  if (f.difficulty && (DIFFICULTIES as readonly string[]).includes(f.difficulty)) where.push(eq(schema.questions.difficulty, f.difficulty as "easy"));
  const q = (f.q ?? "").trim().slice(0, 80);
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    where.push(or(ilike(schema.questions.stem, like), ilike(schema.questions.code, like), ilike(schema.questions.topic, like))!);
  }
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ n: total }], byStatus] = await Promise.all([
    db
      .select({ id: schema.questions.id, code: schema.questions.code, stem: schema.questions.stem, type: schema.questions.type, topic: schema.questions.topic, difficulty: schema.questions.difficulty, gradeFrom: schema.questions.gradeFrom, gradeTo: schema.questions.gradeTo, level: schema.questions.level, marks: schema.questions.marks, status: schema.questions.status, version: schema.questions.version, competition: schema.competitions.code })
      .from(schema.questions)
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.questions.competitionId))
      .where(cond)
      .orderBy(desc(schema.questions.updatedAt))
      .limit(PAGE),
    db.select({ n: count() }).from(schema.questions).where(cond),
    db.select({ status: schema.questions.status, n: count() }).from(schema.questions).groupBy(schema.questions.status),
  ]);
  const tally = (s: string) => byStatus.find((b) => b.status === s)?.n ?? 0;
  const canManage = can(user, "questions.manage");
  const canApprove = can(user, "questions.approve");
  const select = "h-10 rounded-xl border border-line bg-white px-3 text-sm";

  return (
    <>
      <PageHeader
        title={tr("Question bank")}
        description={tr("Questions go from draft to review to approved. Only approved questions can be put on a paper, and the person who wrote a question cannot approve it.")}
        actions={canManage && (
          <div className="flex gap-2">
            <Link href="/admin/questions/import" className={buttonClass("outline", "md")}><FileSpreadsheet className="size-4" aria-hidden />{" "}{tr("Import from Excel")}</Link>
            <Link href="/admin/questions/new" className={buttonClass("primary", "md")}><Plus className="size-4" aria-hidden />{" "}{tr("New question")}</Link>
          </div>
        )}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={tr("Approved")} value={tally("approved")} href="/admin/questions?status=approved" />
        <StatCard label={tr("Waiting for review")} value={tally("review")} href="/admin/questions?status=review" />
        <StatCard label={tr("Drafts")} value={tally("draft")} href="/admin/questions?status=draft" />
        <StatCard label={tr("Retired")} value={tally("retired")} href="/admin/questions?status=retired" />
      </div>

      <form className="mb-4 flex flex-wrap items-end gap-3" role="search">
        <input name="q" defaultValue={q} placeholder={tr("Search question, code or topic")} aria-label={tr("Search")} className={`${select} w-64`} />
        <select name="competition" defaultValue={f.competition ?? ""} aria-label={tr("Competition")} className={select}>
          <option value="">{tr("All competitions")}</option>
          {comps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={f.status ?? ""} aria-label={tr("Status")} className={select}>
          <option value="">{tr("Any status")}</option>
          {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select name="type" defaultValue={f.type ?? ""} aria-label={tr("Type")} className={select}>
          <option value="">{tr("Any type")}</option>
          {QUESTION_TYPES.map((t) => <option key={t.key} value={t.key}>{msg(t.label)}</option>)}
        </select>
        <select name="difficulty" defaultValue={f.difficulty ?? ""} aria-label={tr("Difficulty")} className={select}>
          <option value="">{tr("Any difficulty")}</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>
        <button className={buttonClass("outline", "sm")}>{tr("Filter")}</button>
        {(q || f.competition || f.status || f.type || f.difficulty) && <Link href="/admin/questions" className="pb-2 text-sm text-muted hover:text-navy-700">{tr("Clear")}</Link>}
      </form>

      <Card>
        {(canManage || canApprove) && <div className={rows.length ? "border-b border-line px-5 py-3" : "px-5 pt-4"}><BulkBar canManage={canManage} canApprove={canApprove} hasRows={rows.length > 0} /></div>}
        {rows.length === 0 ? (
          <EmptyState title={total === 0 && !cond ? tr("The question bank is empty") : tr("No questions match")}>
            {canManage ? tr("Write questions one by one or import a whole set from Excel.") : tr("Questions appear here once the exam team adds them.")}
          </EmptyState>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface/60">
                  <tr>
                    {(canManage || canApprove) && <th className={`${th} w-8`}><SelectAll /></th>}
                    <th className={th}>{tr("Question")}</th><th className={th}>{tr("Competition")}</th><th className={th}>{tr("Topic")}</th><th className={th}>{tr("Type")}</th><th className={th}>{tr("Status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-surface/50">
                      {(canManage || canApprove) && <td className={td}><input type="checkbox" name="ids" value={r.id} form="bulk" aria-label={tr("Tick {code}", { code: r.code })} className="size-4 accent-navy-600" /></td>}
                      <td className={`${td} max-w-md`}>
                        <Link href={`/admin/questions/${r.id}`} className="line-clamp-2 font-medium text-navy-900 hover:underline">{r.stem}</Link>
                        <p className="font-mono text-xs text-muted">{r.code} · v{r.version} · {r.marks === 1 ? tr("1 mark") : tr("{marks} marks", { marks: r.marks })}</p>
                      </td>
                      <td className={`${td} text-muted`}><span className="font-mono">{r.competition}</span><br /><span className="text-xs">{msg(gradeRange(r.gradeFrom, r.gradeTo))}{r.level > 1 ? tr(" · L{level}", { level: r.level }) : ""}</span></td>
                      <td className={td}>{r.topic}<br /><span className="text-xs text-muted capitalize">{msg(difficultyLabel(r.difficulty))}</span></td>
                      <td className={`${td} text-muted`}>{msg(typeLabel(r.type))}</td>
                      <td className={td}><Pill tone={statusTone(r.status)}>{msg(STATUS_LABELS[r.status])}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > PAGE && <p className="border-t border-line px-5 py-3 text-sm text-muted">{tr("Showing the {PAGE} most recently changed of {total}. Use the filters to narrow the list.", { PAGE, total })}</p>}
          </>
        )}
      </Card>
    </>
  );
}
