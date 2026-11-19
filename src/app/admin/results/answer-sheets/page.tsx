import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { gradeRange } from "@/lib/question-ui";
import { paperEntrants } from "@/lib/server/results";
import { buttonClass } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { SheetUpload } from "./sheet-upload";

export const metadata: Metadata = { title: "Paper answer sheets" };

export default async function AnswerSheets() {
  await requirePermission("results.manage");
  const papers = await db
    .select({ id: schema.papers.id, code: schema.papers.code, title: schema.papers.title, competitionId: schema.papers.competitionId, gradeFrom: schema.papers.gradeFrom, gradeTo: schema.papers.gradeTo, competition: schema.competitions.name })
    .from(schema.papers)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.papers.competitionId))
    .where(eq(schema.papers.status, "final"))
    .orderBy(desc(schema.papers.finalisedAt));
  const withCounts = await Promise.all(
    papers.map(async (p) => {
      const entrants = await paperEntrants(p);
      const sheets = await db.select({ id: schema.paperScripts.id }).from(schema.paperScripts).where(eq(schema.paperScripts.paperId, p.id));
      return { ...p, entrants: entrants.length, sheets: sheets.length };
    }),
  );
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/results" className="text-muted hover:text-navy-700">← Results</Link></p>
      <PageHeader title="Paper answer sheets" description="Download the sheet for a paper (it lists every confirmed paper entrant with their roll number and version), type in each student's answers, and upload it. Every row is checked and marked against that version's key; nothing is saved if a row is wrong." />
      {withCounts.length === 0 ? <Card><EmptyState title="No final papers yet">Make a paper final under Examinations first.</EmptyState></Card> : (
        <div className="space-y-4">
          {withCounts.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{p.title}</h2>
                  <p className="text-sm text-muted"><span className="font-mono">{p.code}</span> · {p.competition} · {gradeRange(p.gradeFrom, p.gradeTo)}</p>
                  <p className="mt-1 text-sm"><strong>{p.sheets}</strong> of {p.entrants} paper entrant{p.entrants === 1 ? "" : "s"} entered</p>
                </div>
                {p.entrants > 0 && <a href={`/admin/answer-sheet-template/${p.id}`} className={buttonClass("outline", "sm")}><Download className="size-4" aria-hidden /> Answer sheet ({p.entrants} students)</a>}
              </div>
              {p.entrants > 0 ? <div className="mt-4 border-t border-line pt-4"><SheetUpload paperId={p.id} /></div> : <p className="mt-3 text-sm text-muted">No confirmed paper-mode students in these grades yet.</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
