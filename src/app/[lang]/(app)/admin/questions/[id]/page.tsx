import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { STATUS_LABELS, answerText } from "@/lib/questions";
import { statusTone } from "@/lib/question-ui";
import { Card, DateTime, PageHeader, Pill } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/form";
import { QuestionForm } from "../question-form";
import { ReviewPanel } from "./review-panel";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Question") };
}

export default async function QuestionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { tr, msg } = await getTr();
  const user = await requirePermission("questions.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const q = await db.query.questions.findFirst({ where: eq(schema.questions.id, id) });
  if (!q) notFound();
  const [competitions, versions, onPapers, people] = await Promise.all([
    db.select({ id: schema.competitions.id, name: schema.competitions.name }).from(schema.competitions).orderBy(asc(schema.competitions.sortOrder)),
    db.select({ version: schema.questionVersions.version, at: schema.questionVersions.createdAt, by: schema.users.name, snapshot: schema.questionVersions.snapshot }).from(schema.questionVersions).leftJoin(schema.users, eq(schema.users.id, schema.questionVersions.changedBy)).where(eq(schema.questionVersions.questionId, id)).orderBy(desc(schema.questionVersions.version)),
    db.select({ id: schema.papers.id, code: schema.papers.code, title: schema.papers.title, version: schema.paperQuestions.questionVersion, status: schema.papers.status }).from(schema.paperQuestions).innerJoin(schema.papers, eq(schema.papers.id, schema.paperQuestions.paperId)).where(eq(schema.paperQuestions.questionId, id)),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, [q.createdBy, q.approvedBy].filter((x): x is string => !!x).concat("00000000-0000-0000-0000-000000000000"))),
  ]);
  const name = (uid: string | null) => people.find((p) => p.id === uid)?.name ?? "—";
  const { saved } = await searchParams;
  const canManage = can(user, "questions.manage");
  const a = q.answer;
  const initial: Record<string, string | string[]> = {
    id: q.id, competitionId: q.competitionId, gradeFrom: String(q.gradeFrom), gradeTo: String(q.gradeTo), level: String(q.level), type: q.type, stem: q.stem,
    ...Object.fromEntries(q.options.map((o) => [`opt${o.id}`, o.text])),
    correct: a.options ?? [], numericValue: a.value != null ? String(a.value) : "", tolerance: a.tolerance ? String(a.tolerance) : "", accepted: (a.accepted ?? []).join("\n"),
    explanation: q.explanation ?? "", topic: q.topic, difficulty: q.difficulty, tags: q.tags.join(", "), marks: String(q.marks),
  };

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/questions" className="text-muted hover:text-navy-700">{tr("← Question bank")}</Link></p>
      <PageHeader title={tr("Question {code}", { code: q.code })} description={tr("Version {version} · written by {name}{x}", { version: q.version, name: name(q.createdBy), x: q.source === "excel" ? tr(" (Excel import)") : "" })} actions={<Pill tone={statusTone(q.status)}>{msg(STATUS_LABELS[q.status])}</Pill>} />
      {saved && <div className="mb-6"><FormMessage ok={tr("Question saved as a draft.")} /></div>}
      {q.reviewNote && q.status === "draft" && <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"><strong>{tr("Reviewer's note:")}</strong> {q.reviewNote}</div>}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          {q.status === "approved" && canManage && <p className="mb-4 text-sm text-muted">{tr("Editing an approved question saves a new version that needs approving again. Papers already made keep the version they used.")}</p>}
          <QuestionForm initial={initial} competitions={competitions} readOnly={!canManage || q.status === "retired"} />
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold">{tr("Review")}</h2>
            <p className="mt-1 text-sm text-muted">{tr("Correct answer:")}{" "}<strong className="text-navy-900">{answerText(q)}</strong></p>
            {q.approvedAt && <p className="mt-1 text-xs text-muted">{tr("Approved by {name}", { name: name(q.approvedBy) })} · <DateTime value={q.approvedAt} /></p>}
            <div className="mt-4"><ReviewPanel id={q.id} status={q.status} canManage={canManage} canApprove={can(user, "questions.approve")} isAuthor={q.updatedBy === user.id} /></div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">{tr("Used on papers")}</h2>
            {onPapers.length === 0 ? <p className="mt-1 text-sm text-muted">{tr("Not used yet.")}</p> : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {onPapers.map((p) => <li key={p.id}><Link href={`/admin/exams/papers/${p.id}`} className="font-medium text-navy-700 hover:underline">{p.code}</Link> <span className="text-muted">· v{p.version}{p.status === "final" ? tr(" · final") : ""}</span></li>)}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">{tr("History")}</h2>
            <ol className="mt-2 space-y-3 text-sm">
              {versions.map((v) => (
                <li key={v.version}>
                  <p className="font-medium">{tr("Version {version}", { version: v.version })}{" "}<span className="font-normal text-muted">· {v.by ?? "—"}</span></p>
                  <p className="text-xs text-muted"><DateTime value={v.at} />{" "}{tr("· answer {answerText}", { answerText: answerText(v.snapshot) })}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
