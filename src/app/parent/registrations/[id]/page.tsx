import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth/family";
import { gradeName } from "@/lib/competition-types";
import { Card, PageHeader, StatCard, td, th } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata: Metadata = { title: "Registration" };

export default async function ParentRegistration({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const user = await requireParent();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [reg] = await db.select({ r: schema.registrations, competition: schema.competitions.name, examDate: schema.competitions.examDate }).from(schema.registrations).innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId)).where(and(eq(schema.registrations.id, id), eq(schema.registrations.guardianUserId, user.id)));
  if (!reg) notFound();
  const kids = await db.select({ code: schema.students.code, first: schema.students.firstName, last: schema.students.lastName, grade: schema.registrationItems.grade }).from(schema.registrationItems).innerJoin(schema.students, eq(schema.students.id, schema.registrationItems.studentId)).where(eq(schema.registrationItems.registrationId, id));
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/parent/registrations" className="text-muted hover:text-navy-700">← Registrations</Link></p>
      <PageHeader title={reg.competition} description={`Reference ${reg.r.reference} · Online${reg.examDate ? ` · ${formatDate(reg.examDate)}` : ""}`} />
      {(await searchParams).new && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-6 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-sm text-emerald-900">Registration submitted. Quote reference <strong>{reg.r.reference}</strong> when you pay.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Children" value={reg.r.studentCount} />
        <StatCard label="Fee per child" value={formatPKR(reg.r.feePkr)} />
        <StatCard label="Total due" value={formatPKR(reg.r.totalPkr)} hint={reg.r.status === "pending_payment" ? "Awaiting payment" : reg.r.status} />
      </div>
      {reg.r.status === "pending_payment" && <Card className="mt-6 p-6"><h2 className="font-semibold">How to pay</h2><p className="mt-2 text-sm text-muted">Online payment is being set up. Until then, EEA will contact you with payment details. The entry is confirmed once payment is received.</p></Card>}
      <Card title="Children entered" className="mt-6">
        <table className="w-full text-sm"><thead className="border-b border-line bg-surface/60"><tr><th className={th}>Student ID</th><th className={th}>Name</th><th className={th}>Grade</th></tr></thead>
          <tbody className="divide-y divide-line">{kids.map((k) => <tr key={k.code}><td className={`${td} font-mono text-xs`}>{k.code}</td><td className={`${td} font-medium text-navy-900`}>{k.first} {k.last}</td><td className={td}>{gradeName(k.grade)}</td></tr>)}</tbody>
        </table>
      </Card>
    </>
  );
}
