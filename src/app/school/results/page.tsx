import type { Metadata } from "next";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { requireSchool } from "@/lib/auth/school";
import { gradeName } from "@/lib/competition-types";
import { schoolResultCompetitions, schoolResults } from "@/lib/server/school-results";
import { buttonClass } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, StatCard, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Results" };

export default async function SchoolResults({ searchParams }: { searchParams: Promise<{ competition?: string }> }) {
  const { school } = await requireSchool();
  const comps = await schoolResultCompetitions(school.id);
  const { competition } = await searchParams;
  const current = comps.find((c) => c.id === competition) ?? comps[0];
  const rows = current ? await schoolResults(school.id, current.id) : [];
  const sat = rows.filter((r) => !r.absent);
  const avg = sat.length ? Math.round(sat.reduce((s, r) => s + Number(r.percent), 0) / sat.length) : 0;
  const medals = sat.filter((r) => r.award && /medal/i.test(r.award)).length;
  return (
    <>
      <PageHeader
        title="Results"
        description="Your students' published results. Ranks are among all students in the same grade across Pakistan; school rank is among your own students."
        actions={<Link href="/admit-card/school" target="_blank" className={buttonClass("outline", "md")}><Printer className="size-4" aria-hidden /> Print admit cards</Link>}
      />
      {!current ? (
        <Card><EmptyState title="No results published yet">Results appear here as soon as EEA publishes them.</EmptyState></Card>
      ) : (
        <>
          {comps.length > 1 && (
            <nav className="mb-4 flex flex-wrap gap-2" aria-label="Competitions">
              {comps.map((c) => <Link key={c.id} href={`?competition=${c.id}`} aria-current={c.id === current.id ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${c.id === current.id ? "bg-navy-600 text-white" : "bg-white text-navy-800 ring-1 ring-line"}`}>{c.name}</Link>)}
            </nav>
          )}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Students who sat" value={sat.length} hint={`${rows.length - sat.length} absent`} />
            <StatCard label="Average score" value={`${avg}%`} />
            <StatCard label="Medals" value={medals} />
          </div>
          <Card title={current.name} action={<a href={`/school/results/export?competition=${current.id}`} className={buttonClass("outline", "sm")}><Download className="size-4" aria-hidden /> Excel</a>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Student</th><th className={th}>Grade</th><th className={th}>Score</th><th className={th}>Rank in grade</th><th className={th}>School rank</th><th className={th}>Award</th><th className={th}>Certificate</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className={td}>{r.first} {r.last}<p className="font-mono text-xs text-muted">{r.roll}</p></td>
                      <td className={`${td} text-muted`}>{gradeName(r.grade)}{r.section ? ` · ${r.section}` : ""}</td>
                      <td className={`${td} tabular-nums`}>{r.absent ? "Absent" : `${Number(r.score)} / ${r.max}`}</td>
                      <td className={`${td} tabular-nums`}>{r.absent ? "—" : `${r.rank} of ${r.cohort}`}</td>
                      <td className={`${td} tabular-nums`}>{r.rankInSchool ?? "—"}</td>
                      <td className={td}>{r.award ?? "—"}</td>
                      <td className={td}>{r.certificateId && !r.revoked ? <Link href={`/certificates/${r.certificateId}`} target="_blank" className="font-semibold text-navy-600 hover:underline">Open</Link> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
