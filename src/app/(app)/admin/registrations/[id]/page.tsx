import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { gradeName } from "@/lib/competition-types";
import { Card, DateTime, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/utils";
import { PaymentForm } from "./payment-form";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "Registration" };
const METHOD: Record<string, string> = { bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque" };

export default async function RegistrationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string }> }) {
  const user = await requirePermission("registrations.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, id) });
  if (!reg) notFound();
  const [comp, school, parent, items, payments] = await Promise.all([
    db.query.competitions.findFirst({ where: eq(schema.competitions.id, reg.competitionId), columns: { name: true } }),
    reg.schoolId ? db.query.schools.findFirst({ where: eq(schema.schools.id, reg.schoolId), columns: { name: true, code: true } }) : null,
    reg.guardianUserId ? db.query.users.findFirst({ where: eq(schema.users.id, reg.guardianUserId), columns: { name: true } }) : null,
    db.select({ code: schema.students.code, first: schema.students.firstName, last: schema.students.lastName, grade: schema.registrationItems.grade }).from(schema.registrationItems).innerJoin(schema.students, eq(schema.students.id, schema.registrationItems.studentId)).where(eq(schema.registrationItems.registrationId, id)).orderBy(asc(schema.students.lastName)),
    can(user, "finance.view") ? db.select({ method: schema.manualPayments.method, reference: schema.manualPayments.reference, amount: schema.manualPayments.amountPkr, receivedOn: schema.manualPayments.receivedOn, at: schema.manualPayments.createdAt, by: schema.users.name }).from(schema.manualPayments).leftJoin(schema.users, eq(schema.users.id, schema.manualPayments.recordedBy)).where(eq(schema.manualPayments.registrationId, id)) : Promise.resolve([]),
  ]);
  const { paid } = await searchParams;
  return (
    <>
      {paid && reg.status === "confirmed" && <div className="mb-4"><FormMessage ok="Payment recorded. The registration is confirmed." /></div>}
      <p className="mb-2 text-sm"><Link href="/admin/registrations" className="text-muted hover:text-navy-700">← Registrations</Link></p>
      <PageHeader title={reg.reference} description={`${comp?.name} · ${reg.mode === "online" ? "Online" : "Paper"} · ${school ? `${school.name} (${school.code})` : `Individual · parent ${parent?.name ?? ""}`}`} actions={<Pill tone={reg.status === "confirmed" ? "green" : reg.status === "cancelled" ? "red" : "amber"}>{reg.status.replace("_", " ")}</Pill>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title={`${items.length} students · ${formatPKR(reg.totalPkr)}`}>
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Student</th><th className={th}>ID</th><th className={th}>Grade</th></tr></thead>
            <tbody className="divide-y divide-line">{items.map((s) => <tr key={s.code}><td className={td}>{s.first} {s.last}</td><td className={`${td} font-mono text-xs`}>{s.code}</td><td className={td}>{gradeName(s.grade)}</td></tr>)}</tbody>
          </table>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Payment</h2>
          {payments.map((p, i) => (
            <div key={i} className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
              {formatPKR(p.amount)} by {METHOD[p.method] ?? p.method} · ref <span className="font-mono">{p.reference}</span><br />
              <span className="text-xs">Received {formatDate(p.receivedOn)} · recorded by {p.by ?? "—"}, <DateTime value={p.at} /></span>
            </div>
          ))}
          {reg.status === "pending_payment" && (can(user, "finance.manage") ? (
            <div className="mt-3">
              <p className="mb-4 text-sm text-muted">When the school or parent pays by bank transfer, cash or cheque, record it here to confirm the registration. Online payment comes with the finance module.</p>
              <PaymentForm id={reg.id} total={reg.totalPkr} />
            </div>
          ) : <p className="mt-2 text-sm text-muted">Waiting for payment. Finance staff record payments.</p>)}
        </Card>
      </div>
    </>
  );
}
