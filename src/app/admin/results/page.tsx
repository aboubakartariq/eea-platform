import type { Metadata } from "next";
import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { FileSpreadsheet } from "lucide-react";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { resultStatus } from "@/lib/results/status";
import { serverNow } from "@/lib/server/clock";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { IssueRollNumbers } from "./ui";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsAdmin() {
  const user = await requirePermission("results.view");
  const rows = await db
    .select({
      id: schema.competitions.id, name: schema.competitions.name, code: schema.competitions.code,
      confirmed: sql<number>`(select count(*)::int from registration_items ri join registrations r on r.id = ri.registration_id where ri.competition_id = competitions.id and r.status = 'confirmed')`,
      noRoll: sql<number>`(select count(*)::int from registration_items ri join registrations r on r.id = ri.registration_id where ri.competition_id = competitions.id and r.status = 'confirmed' and ri.roll_number is null)`,
      online: sql<number>`(select count(*)::int from exam_attempts a where a.competition_id = competitions.id and a.status = 'submitted')`,
      sheets: sql<number>`(select count(*)::int from paper_scripts ps join registration_items ri on ri.id = ps.registration_item_id where ri.competition_id = competitions.id)`,
      status: sql<string | null>`(select status from result_sets rs where rs.competition_id = competitions.id and rs.status <> 'withdrawn')`,
      publishAt: sql<Date | null>`(select publish_at from result_sets rs where rs.competition_id = competitions.id and rs.status <> 'withdrawn')`,
    })
    .from(schema.competitions)
    .orderBy(asc(schema.competitions.sortOrder));
  const now = serverNow();
  const missing = rows.reduce((s, r) => s + r.noRoll, 0);
  return (
    <>
      <PageHeader
        title="Results"
        description="Results are calculated from online exams and paper answer sheets, approved by a second person, then published to students, parents and schools."
        actions={can(user, "results.manage") && <Link href="/admin/results/answer-sheets" className={buttonClass("outline", "md")}><FileSpreadsheet className="size-4" aria-hidden /> Paper answer sheets</Link>}
      />
      {missing > 0 && can(user, "results.manage") && (
        <Card className="mb-6 p-5">
          <p className="mb-3 text-sm text-muted">{missing} confirmed student{missing === 1 ? " has" : "s have"} no roll number (confirmed before roll numbers existed).</p>
          <IssueRollNumbers />
        </Card>
      )}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Competition</th><th className={th}>Confirmed</th><th className={th}>Online submitted</th><th className={th}>Answer sheets</th><th className={th}>Results</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const sObj = r.status ? { status: r.status, publishAt: r.publishAt ? new Date(r.publishAt) : null } : null;
                const st = resultStatus(sObj, now);
                return (
                  <tr key={r.id} className="hover:bg-surface/50">
                    <td className={td}><Link href={`/admin/results/${r.id}`} className="font-semibold text-navy-900 hover:underline">{r.name}</Link><p className="font-mono text-xs text-muted">{r.code}</p></td>
                    <td className={`${td} tabular-nums`}>{r.confirmed}</td>
                    <td className={`${td} tabular-nums`}>{r.online}</td>
                    <td className={`${td} tabular-nums`}>{r.sheets}</td>
                    <td className={td}><Pill tone={st.tone}>{st.label}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
