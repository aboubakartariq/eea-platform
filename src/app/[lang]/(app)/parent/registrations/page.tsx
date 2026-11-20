import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth/family";
import { Card, DateTime, EmptyState, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { formatPKR } from "@/lib/utils";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Registrations") };
}

export default async function ParentRegistrations() {
  const { tr, intl } = await getTr();
  const user = await requireParent();
  const rows = await db
    .select({ id: schema.registrations.id, reference: schema.registrations.reference, competition: schema.competitions.name, students: schema.registrations.studentCount, total: schema.registrations.totalPkr, status: schema.registrations.status, createdAt: schema.registrations.createdAt })
    .from(schema.registrations)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId))
    .where(eq(schema.registrations.guardianUserId, user.id))
    .orderBy(desc(schema.registrations.createdAt));
  return (
    <>
      <PageHeader title={tr("Registrations")} description={tr("Competitions you entered your children for. Entries made by a school appear on each child's page.")} />
      <Card>
        {rows.length === 0 ? <EmptyState title={tr("No registrations yet")} /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Reference")}</th><th className={th}>{tr("Competition")}</th><th className={th}>{tr("Children")}</th><th className={th}>{tr("Total")}</th><th className={th}>{tr("Status")}</th><th className={th}>{tr("Date")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={td}><Link href={`/parent/registrations/${r.id}`} className="font-mono text-xs font-semibold text-navy-600 hover:underline">{r.reference}</Link></td>
                  <td className={td}>{r.competition}</td><td className={`${td} tabular-nums`}>{r.students}</td><td className={`${td} tabular-nums`}>{formatPKR(r.total, intl)}</td>
                  <td className={td}><Pill tone={r.status === "confirmed" ? "green" : r.status === "cancelled" ? "red" : "amber"}>{r.status === "pending_payment" ? tr("Awaiting payment") : r.status}</Pill></td>
                  <td className={`${td} text-muted`}><DateTime value={r.createdAt} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
