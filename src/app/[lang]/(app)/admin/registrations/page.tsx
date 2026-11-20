import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sum, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { Card, DateTime, EmptyState, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { formatPKR } from "@/lib/utils";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Registrations") };
}

export default async function RegistrationsAdmin() {
  const { tr, intl } = await getTr();
  await requirePermission("registrations.view");
  const [rows, [totals], byCompetition] = await Promise.all([
    db
      .select({ id: schema.registrations.id, reference: schema.registrations.reference, school: schema.schools.name, schoolId: schema.schools.id, parent: schema.users.name, competition: schema.competitions.name, mode: schema.registrations.mode, students: schema.registrations.studentCount, total: schema.registrations.totalPkr, status: schema.registrations.status, createdAt: schema.registrations.createdAt })
      .from(schema.registrations)
      .leftJoin(schema.schools, eq(schema.schools.id, schema.registrations.schoolId))
      .leftJoin(schema.users, eq(schema.users.id, schema.registrations.guardianUserId))
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId))
      .orderBy(desc(schema.registrations.createdAt))
      .limit(300),
    db.select({ students: sum(schema.registrations.studentCount), amount: sum(schema.registrations.totalPkr), n: count() }).from(schema.registrations).where(eq(schema.registrations.status, "pending_payment")),
    db.select({ name: schema.competitions.name, n: count() }).from(schema.registrationItems).innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrationItems.competitionId)).groupBy(schema.competitions.name),
  ]);
  return (
    <>
      <PageHeader title={tr("Registrations")} description={tr("Competition registrations from schools and parents. Open a registration to record a bank transfer, cash or cheque payment and confirm it. Online payment arrives with the finance module.")} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={tr("Awaiting payment")} value={totals.n} hint={tr("{x} students", { x: Number(totals.students ?? 0) })} />
        <StatCard label={tr("Amount due")} value={formatPKR(Number(totals.amount ?? 0), intl)} />
        {byCompetition.slice(0, 2).map((c) => <StatCard key={c.name} label={c.name} value={c.n} hint={tr("Students registered")} />)}
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState title={tr("No registrations yet")}>{tr("Schools register students from their school portal.")}</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Reference")}</th><th className={th}>{tr("School")}</th><th className={th}>{tr("Competition")}</th><th className={th}>{tr("Students")}</th><th className={th}>{tr("Total")}</th><th className={th}>{tr("Status")}</th><th className={th}>{tr("Date")}</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/50">
                    <td className={`${td} font-mono text-xs`}><Link href={`/admin/registrations/${r.id}`} className="font-semibold text-navy-700 hover:underline">{r.reference}</Link></td>
                    <td className={td}>{r.schoolId ? <Link href={`/admin/schools/${r.schoolId}`} className="font-medium text-navy-900 hover:underline">{r.school}</Link> : <span>{tr("Individual")}{" "}<span className="text-xs text-muted">{tr("· parent {parent}", { parent: r.parent })}</span></span>}</td>
                    <td className={td}>{r.competition} <span className="text-xs text-muted capitalize">· {r.mode}</span></td>
                    <td className={`${td} tabular-nums`}>{r.students}</td>
                    <td className={`${td} tabular-nums`}>{formatPKR(r.total, intl)}</td>
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
