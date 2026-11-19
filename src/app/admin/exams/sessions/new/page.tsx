import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { gradeRange } from "@/lib/question-ui";
import { PageHeader } from "@/components/admin/ui";
import { SessionForm } from "./session-form";

export const metadata: Metadata = { title: "Schedule online session" };

export default async function NewSession({ searchParams }: { searchParams: Promise<{ paper?: string }> }) {
  await requirePermission("exams.manage");
  const { paper } = await searchParams;
  const papers = await db
    .select({ id: schema.papers.id, code: schema.papers.code, title: schema.papers.title, gradeFrom: schema.papers.gradeFrom, gradeTo: schema.papers.gradeTo, duration: schema.papers.durationMinutes, competition: schema.competitions.name })
    .from(schema.papers)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.papers.competitionId))
    .where(eq(schema.papers.status, "final"))
    .orderBy(desc(schema.papers.finalisedAt));
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/exams" className="text-muted hover:text-navy-700">← Examinations</Link></p>
      <PageHeader title="Schedule an online session" description="Students whose online registration is paid and whose grade fits the paper can start any time in the window. Each gets the paper's full time, but never past the closing time." />
      {papers.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-muted ring-1 ring-line">There are no final papers yet. <Link href="/admin/exams/papers/new" className="font-semibold text-navy-600 hover:underline">Make a paper</Link> and mark it final first.</p>
      ) : (
        <SessionForm papers={papers.map((p) => ({ id: p.id, label: `${p.code} · ${p.title} (${p.competition}, ${gradeRange(p.gradeFrom, p.gradeTo)}, ${p.duration} min)` }))} paper={paper} />
      )}
    </>
  );
}
