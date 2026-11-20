import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { answerText } from "@/lib/questions";
import { gradeRange } from "@/lib/question-ui";
import { setLetter, setOrder } from "@/lib/exam/engine";
import { audit } from "@/lib/server/audit";
import { PrintButton } from "@/components/ui/print-button";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Print paper") };
}

export default async function PrintPaper({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ set?: string; key?: string }> }) {
  const { tr, msg } = await getTr();
  const user = await requirePermission("exams.view");
  const { id } = await params;
  const sp = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const paper = await db.query.papers.findFirst({ where: eq(schema.papers.id, id) });
  if (!paper) notFound();
  const sets = Array.from({ length: paper.printSets }, (_, i) => setLetter(i));
  const set = sets.includes(String(sp.set)) ? String(sp.set) : "A";
  const key = sp.key === "1";
  // Answer keys are for the exam team only.
  if (key && !can(user, "exams.manage")) notFound();
  const [comp, items] = await Promise.all([
    db.query.competitions.findFirst({ where: eq(schema.competitions.id, paper.competitionId), columns: { name: true } }),
    db.select().from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, id)).orderBy(asc(schema.paperQuestions.position)),
  ]);
  // Version A keeps the paper's order; other versions are shuffled from the paper's seed.
  const ordered = setOrder(items, paper.seed, set);
  if (key) await audit({ actorUserId: user.id, action: "paper.answer_key_viewed", entityType: "paper", entityId: paper.id, after: { set } });

  return (
    <article className="mx-auto max-w-3xl bg-white p-8 text-[15px] text-ink print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">{tr("Use Print, then choose “Save as PDF” to keep a file.")}</p>
        <PrintButton />
      </div>
      {paper.status === "draft" && <p className="mb-4 rounded-lg border-2 border-red-600 py-1 text-center text-lg font-bold tracking-[0.3em] text-red-700">{tr("DRAFT — NOT FOR USE")}</p>}
      <header className="border-b-2 border-navy-800 pb-4 text-center">
        <p className="font-display text-sm font-bold tracking-wide text-navy-700 uppercase">{tr("Educational Extracurricular Activities")}</p>
        <h1 className="mt-1 text-2xl font-bold">{paper.title}{key ? tr(" — Answer key") : ""}</h1>
        <p className="mt-1 text-sm">{comp?.name} · {msg(gradeRange(paper.gradeFrom, paper.gradeTo))}{paper.level > 1 ? " · " + tr("Level {l}", { l: paper.level }) : ""} · {tr("Version {set}", { set })}</p>
        <p className="text-sm">{tr("Time: {durationMinutes} minutes · Total marks: {totalMarks}", { durationMinutes: paper.durationMinutes, totalMarks: paper.totalMarks })}{paper.negativePercent ? " · " + tr("{n}% deducted for each wrong answer", { n: paper.negativePercent }) : ""}</p>
      </header>
      {key ? (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead><tr className="border-b border-ink"><th className="py-1.5 text-start">Q</th><th className="text-start">{tr("Answer")}</th><th className="text-start">{tr("Marks")}</th><th className="text-start">{tr("Topic")}</th></tr></thead>
          <tbody>
            {ordered.map((q, i) => (
              <tr key={q.id} className="border-b border-line"><td className="py-1.5 tabular-nums">{i + 1}</td><td className="font-semibold">{answerText(q.snapshot)}</td><td>{q.snapshot.marks}</td><td>{q.snapshot.topic}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[tr("Student name"), tr("Student ID"), tr("School"), tr("Roll number")].map((l) => <p key={l}>{l}: <span className="inline-block w-48 border-b border-ink" /></p>)}
          </section>
          {paper.instructions && <p className="mt-5 whitespace-pre-line rounded-lg bg-surface p-3 text-sm print:border print:border-line">{paper.instructions}</p>}
          <ol className="mt-6 space-y-5">
            {ordered.map((q, i) => (
              <li key={q.id} className="break-inside-avoid">
                <p className="font-medium"><span className="me-2 font-bold">{i + 1}.</span><span className="whitespace-pre-line">{q.snapshot.stem}</span> <span className="text-xs text-muted">[{q.snapshot.marks}]</span></p>
                {q.snapshot.type === "single" || q.snapshot.type === "multiple" ? (
                  <ol className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 ps-6">
                    {q.snapshot.options.map((o) => <li key={o.id}><span className="me-1.5 font-semibold">({o.id})</span>{o.text}</li>)}
                  </ol>
                ) : q.snapshot.type === "true_false" ? (
                  <p className="mt-2 ps-6">{tr("(A) True     (B) False")}</p>
                ) : (
                  <p className="mt-3 ps-6">{tr("Answer:")}{" "}<span className="inline-block w-56 border-b border-ink" /></p>
                )}
                {q.snapshot.type === "multiple" && <p className="mt-1 ps-6 text-xs text-muted">{tr("Choose all correct options.")}</p>}
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="mt-10 text-center text-xs text-muted">{tr("{code} · Version {set}", { code: paper.code, set })}</p>
    </article>
  );
}
