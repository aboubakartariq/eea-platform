import Link from "next/link";
import { Award, Download } from "lucide-react";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { gradeName } from "@/lib/competition-types";
import { topPercent } from "@/lib/results/rank";
import { topicBreakdown } from "@/lib/server/results";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/admin/ui";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

type R = {
  id: string; competition: string; competitionId: string; studentId: string; grade: number; absent: boolean; score: string | null; maxScore: number | null; percent: string | null;
  rank: number | null; cohortSize: number | null; rankInSchool: number | null; schoolCohortSize: number | null; awardLabel: string | null; certificateId: string | null; certificateRevoked: Date | null;
};

/** One published result, with strongest and weakest topics. Server component. */
export async function ResultCard({ r }: { r: R }) {
  if (r.absent) {
    return (
      <Card className="p-6">
        <p className="text-sm font-semibold text-brand-blue">{r.competition}</p>
        <p className="mt-2 text-muted">Marked absent, so there is no score for this competition.</p>
      </Card>
    );
  }
  const res = await db.query.results.findFirst({ where: eq(schema.results.id, r.id), columns: { source: true, registrationItemId: true } });
  const topics = res ? await topicBreakdown({ source: res.source, registrationItemId: res.registrationItemId, studentId: r.studentId, competitionId: r.competitionId }) : [];
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-blue">{r.competition}</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy-900 tabular-nums">{Number(r.score)} <span className="text-lg text-muted">/ {r.maxScore}</span></p>
          <p className="text-sm text-muted">{Number(r.percent)}%</p>
        </div>
        {r.awardLabel && <p className="inline-flex items-center gap-2 rounded-full bg-gold-50 px-4 py-2 font-semibold text-gold-700 ring-1 ring-gold/30"><Award className="size-5" aria-hidden />{r.awardLabel}</p>}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">Rank in {gradeName(r.grade)}</dt><dd className="font-display text-xl font-bold">{ordinal(r.rank!)} <span className="text-sm font-normal text-muted">of {r.cohortSize}</span></dd></div>
        {r.cohortSize! >= 10 && <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">Position</dt><dd className="font-display text-xl font-bold">Top {topPercent(r.rank!, r.cohortSize!)}%</dd></div>}
        {r.rankInSchool && <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">In school</dt><dd className="font-display text-xl font-bold">{ordinal(r.rankInSchool)} <span className="text-sm font-normal text-muted">of {r.schoolCohortSize}</span></dd></div>}
      </dl>
      {topics.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">By topic</p>
          <ul className="mt-2 space-y-2">
            {topics.map((t) => (
              <li key={t.topic} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate">{t.topic}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-surface ring-1 ring-line" role="img" aria-label={`${t.percent}% correct`}><span className="block h-full rounded-full bg-brand-blue" style={{ width: `${t.percent}%` }} /></span>
                <span className="text-xs text-muted tabular-nums">{t.correct}/{t.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.certificateId && !r.certificateRevoked && (
        <Link href={`/certificates/${r.certificateId}`} className={buttonClass("outline", "sm", "mt-5")}><Download className="size-4" aria-hidden /> Certificate</Link>
      )}
    </Card>
  );
}
