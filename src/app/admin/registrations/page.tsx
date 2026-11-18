import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sum, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { Card, DateTime, EmptyState, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { formatPKR } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrations" };

export default async function RegistrationsAdmin() {
  await requirePermission("registrations.view");
  const [rows, [totals], byCompetition] = await Promise.all([
    db
      .select({ id: schema.registrations.id, reference: schema.registrations.reference, school: schema.schools.name, schoolId: schema.schools.id, competition: schema.competitions.name, mode: schema.registrations.mode, students: schema.registrations.studentCount, total: schema.registrations.totalPkr, status: schema.registrations.status, createdAt: schema.registrations.createdAt })
      .from(schema.registrations)
      .innerJoin(schema.schools, eq(schema.schools.id, schema.registrations.schoolId))
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId))
      .orderBy(desc(schema.registrations.createdAt))
      .limit(300),
    db.select({ students: sum(schema.registrations.studentCount), amount: sum(schema.registrations.totalPkr), n: count() }).from(schema.registrations).where(eq(schema.registrations.status, "pending_payment")),
    db.select({ name: schema.competitions.name, n: count() }).from(schema.registrationItems).innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrationItems.competitionId)).groupBy(schema.competitions.name),
  ]);
  return (
    <>
      <PageHeader title="Registrations" description="Competition registrations submitted by schools. Payment collection and confirmation arrive with the finance module." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting payment" value={totals.n} hint={`${Number(totals.students ?? 0)} students`} />
        <StatCard label="Amount due" value={formatPKR(Number(totals.amount ?? 0))} />
        {byCompetition.slice(0, 2).map((c) => <StatCard key={c.name} label={c.name} value={c.n} hint="students registered" />)}
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState title="No registrations yet">Schools register students from their school portal.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Reference</th><th className={th}>School</th><th className={th}>Competition</th><th className={th}>Students</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Date</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/50">
                    <td className={`${td} font-mono text-xs`}>{r.reference}</td>
                    <td className={td}><Link href={`/admin/schools/${r.schoolId}`} className="font-medium text-navy-900 hover:underline">{r.school}</Link></td>
                    <td className={td}>{r.competition} <span className="text-xs text-muted capitalize">· {r.mode}</span></td>
                    <td className={`${td} tabular-nums`}>{r.students}</td>
                    <td className={`${td} tabular-nums`}>{formatPKR(r.total)}</td>
                    <td className={td}><Pill tone={r.status === "confirmed" ? "green" : r.status === "cancelled" ? "red" : "amber"}>{r.status.replace("_", " ")}</Pill></td>
                    <td className={`${td} text-muted`}><DateTime value={r.createdAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
