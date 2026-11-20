import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, count, eq } from "drizzle-orm";
import { Printer } from "lucide-react";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { answerText, typeLabel } from "@/lib/questions";
import { gradeRange } from "@/lib/question-ui";
import { setLetter } from "@/lib/exam/engine";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/form";
import { PaperActions, SwapButton } from "./paper-actions";
import { getTr } from "@/i18n/app-server";
import { difficultyLabel } from "@/lib/question-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Paper") };
}

export default async function PaperPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { tr, msg } = await getTr();
  const user = await requirePermission("exams.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const paper = await db.query.papers.findFirst({ where: eq(schema.papers.id, id) });
  if (!paper) notFound();
  const [comp, items, [{ n: sessions }]] = await Promise.all([
    db.query.competitions.findFirst({ where: eq(schema.competitions.id, paper.competitionId), columns: { name: true } }),
    db.select().from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, id)).orderBy(asc(schema.paperQuestions.position)),
    db.select({ n: count() }).from(schema.examSessions).where(eq(schema.examSessions.paperId, id)),
  ]);
  const { created } = await searchParams;
  const manage = can(user, "exams.manage");
  const draft = paper.status === "draft";
  const blueprint = paper.blueprint.map((r) => `${r.count} × ${[r.difficulty, r.topic].filter(Boolean).join(" ") || "any"}`).join(" · ");

  return (
    <>
      <p className="mb-2 text-sm print:hidden"><Link href="/admin/exams" className="text-muted hover:text-navy-700">{tr("← Examinations")}</Link></p>
      <PageHeader
        title={paper.title}
        description={`${paper.code} · ${comp?.name} · ${msg(gradeRange(paper.gradeFrom, paper.gradeTo))}${paper.level > 1 ? tr(" · Level {level}", { level: paper.level }) : ""} · ${items.length} questions · ${paper.totalMarks} marks · ${paper.durationMinutes} minutes`}
        actions={draft ? <Pill tone="amber">{tr("Draft")}</Pill> : <Pill tone="green">{tr("Final")}</Pill>}
      />
      {created && <div className="mb-6"><FormMessage ok={tr("Paper generated with {length} questions. Check them, swap any you don't want, then make it final.", { length: items.length })} /></div>}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">{tr("Settings")}</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted">{tr("Blueprint")}</dt><dd>{blueprint}</dd>
            <dt className="text-muted">{tr("Negative marking")}</dt><dd>{paper.negativePercent ? tr("{negativePercent}% of the marks for a wrong answer", { negativePercent: paper.negativePercent }) : tr("None")}</dd>
            <dt className="text-muted">{tr("Online order")}</dt><dd>{paper.shuffleQuestions ? tr("Different for each student") : tr("Same for everyone")}{paper.shuffleOptions ? tr(", options shuffled") : ""}</dd>
            <dt className="text-muted">{tr("Online sessions")}</dt><dd>{sessions}</dd>
          </dl>
          {manage && <div className="mt-4"><PaperActions id={paper.id} status={paper.status} hasSessions={sessions > 0} /></div>}
          {!draft && sessions > 0 && <p className="mt-3 text-xs text-muted">{tr("This paper has online sessions, so it stays final.")}</p>}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">{tr("Print")}</h2>
          <p className="mt-1 text-sm text-muted">{tr("Each version has the same questions in a different order. Open one and use your browser's Print or Save as PDF.")}{draft && tr(" Draft papers print with a DRAFT mark.")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: paper.printSets }, (_, i) => (
              <span key={i} className="inline-flex gap-1">
                <Link href={`/admin/exams/papers/${paper.id}/print?set=${setLetter(i)}`} target="_blank" className={buttonClass("outline", "sm")}><Printer className="size-4" aria-hidden />{" "}{tr("Version {setLetter}", { setLetter: setLetter(i) })}</Link>
                <Link href={`/admin/exams/papers/${paper.id}/print?set=${setLetter(i)}&key=1`} target="_blank" className={buttonClass("ghost", "sm")}>{tr("Answer key {setLetter}", { setLetter: setLetter(i) })}</Link>
              </span>
            ))}
          </div>
        </Card>
      </div>
      <Card title={tr("Questions")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>#</th><th className={th}>{tr("Question")}</th><th className={th}>{tr("Topic")}</th><th className={th}>{tr("Answer")}</th><th className={th}>{tr("Marks")}</th>{draft && manage && <th className={th}><span className="sr-only">{tr("Swap")}</span></th>}</tr></thead>
            <tbody className="divide-y divide-line">
              {items.map((q) => (
                <tr key={q.id}>
                  <td className={`${td} tabular-nums text-muted`}>{q.position}</td>
                  <td className={`${td} max-w-lg`}>
                    <p className="whitespace-pre-line">{q.snapshot.stem}</p>
                    {q.snapshot.type !== "numeric" && q.snapshot.type !== "short" && q.snapshot.type !== "true_false" && <p className="mt-1 text-xs text-muted">{q.snapshot.options.map((o) => `${o.id}) ${o.text}`).join("   ")}</p>}
                    <p className="mt-1 text-xs text-muted"><Link href={`/admin/questions/${q.questionId}`} className="hover:underline">{tr("{typeLabel} · version {questionVersion}", { typeLabel: msg(typeLabel(q.snapshot.type)), questionVersion: q.questionVersion })}</Link></p>
                  </td>
                  <td className={td}>{q.snapshot.topic}<br /><span className="text-xs capitalize text-muted">{msg(difficultyLabel(q.snapshot.difficulty))}</span></td>
                  <td className={`${td} font-semibold text-emerald-800`}>{answerText(q.snapshot)}</td>
                  <td className={`${td} tabular-nums`}>{q.snapshot.marks}</td>
                  {draft && manage && <td className={td}><SwapButton paperId={paper.id} pq={q.id} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
