import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { Card, DateTime, EmptyState, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Registrations") };
}

export default async function Registrations() {
  const { tr, intl } = await getTr();
  const { school } = await requireSchool();
  const rows = await db
    .select({ id: schema.registrations.id, reference: schema.registrations.reference, competition: schema.competitions.name, mode: schema.registrations.mode, students: schema.registrations.studentCount, total: schema.registrations.totalPkr, status: schema.registrations.status, createdAt: schema.registrations.createdAt })
    .from(schema.registrations)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId))
    .where(eq(schema.registrations.schoolId, school.id))
    .orderBy(desc(schema.registrations.createdAt));
  return (
    <>
      <PageHeader title={tr("Registrations")} actions={<Link href="/school/register" className={buttonClass("gold", "md")}>{tr("Register students")}</Link>} />
      <Card>
        {rows.length === 0 ? <EmptyState title={tr("No registrations yet")}>{tr("Choose a competition and select your students.")}</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Reference")}</th><th className={th}>{tr("Competition")}</th><th className={th}>{tr("Students")}</th><th className={th}>{tr("Total")}</th><th className={th}>{tr("Status")}</th><th className={th}>{tr("Date")}</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/50">
                    <td className={td}><Link href={`/school/registrations/${r.id}`} className="font-mono text-xs font-semibold text-navy-600 hover:underline">{r.reference}</Link></td>
                    <td className={td}>{r.competition} <span className="text-xs text-muted">· {r.mode === "online" ? tr("Online") : tr("Paper")}</span></td>
                    <td className={`${td} tabular-nums`}>{r.students}</td>
                    <td className={`${td} tabular-nums`}>{formatPKR(r.total, intl)}</td>
                    <td className={td}><Pill tone={r.status === "confirmed" ? "green" : r.status === "cancelled" ? "red" : "amber"}>{r.status === "pending_payment" ? tr("Awaiting payment") : r.status}</Pill></td>
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
