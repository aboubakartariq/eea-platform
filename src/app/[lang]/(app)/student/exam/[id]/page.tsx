import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { requireStudent } from "@/lib/auth/family";
import { serverNow } from "@/lib/server/clock";
import { attemptView } from "@/lib/server/attempts";
import { buttonClass } from "@/components/ui/button";
import { ExamScreen } from "./exam-screen";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Exam") };
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { tr } = await getTr();
  const { student } = await requireStudent();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const view = await attemptView(id, student.id);
  if (!view) notFound();

  if (view.attempt.status === "submitted") {
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 text-center ring-1 ring-line">
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{tr("Your answers have been submitted")}</h1>
        <p className="mt-2 text-muted">
          {view.competition} · {view.title}.{" "}
          {view.attempt.submittedReason === "time" ? tr("Time ran out, so everything you had saved was submitted for you.") : view.attempt.submittedReason === "staff" ? tr("The exam team ended your exam; everything you had saved was kept.") : tr("Well done for finishing!")}
        </p>
        <p className="mt-2 text-sm text-muted">{tr("Results are published after the competition closes. They'll appear in your portal.")}</p>
        <Link href="/student" className={buttonClass("primary", "lg", "mt-6")}>{tr("Back to my competitions")}</Link>
      </div>
    );
  }

  return (
    <ExamScreen
      attemptId={view.attempt.id}
      title={view.title}
      competition={view.competition}
      instructions={view.instructions}
      negativePercent={view.negativePercent}
      questions={view.questions}
      deadline={view.attempt.deadlineAt.getTime()}
      serverNow={serverNow()}
    />
  );
}
