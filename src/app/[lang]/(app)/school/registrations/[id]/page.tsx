import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { gradeName } from "@/lib/competition-types";
import { Card, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/utils";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Registration") };
}

export default async function RegistrationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { tr, msg, intl } = await getTr();
  const { school } = await requireSchool();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [reg] = await db
    .select({ r: schema.registrations, competition: schema.competitions.name, examDate: schema.competitions.examDate })
    .from(schema.registrations)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId))
    .where(and(eq(schema.registrations.id, id), eq(schema.registrations.schoolId, school.id)));
  if (!reg) notFound();
  const items = await db
    .select({ code: schema.students.code, first: schema.students.firstName, last: schema.students.lastName, grade: schema.registrationItems.grade, section: schema.students.section })
    .from(schema.registrationItems)
    .innerJoin(schema.students, eq(schema.students.id, schema.registrationItems.studentId))
    .where(eq(schema.registrationItems.registrationId, id))
    .orderBy(asc(schema.registrationItems.grade), asc(schema.students.lastName));
  const isNew = (await searchParams).new;

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/registrations" className="text-muted hover:text-navy-700">{tr("← Registrations")}</Link></p>
      <PageHeader title={reg.competition} description={`Reference ${reg.r.reference} · ${reg.r.mode === "online" ? tr("Online exam") : tr("Paper exam at school")}${reg.examDate ? ` · ${formatDate(reg.examDate, intl)}` : ""}`} />
      {isNew && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-6 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-sm text-emerald-900">{tr("Registration submitted. Quote reference {reference} when you pay.", { reference: reg.r.reference })}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={tr("Students")} value={reg.r.studentCount} />
        <StatCard label={tr("Fee per student")} value={formatPKR(reg.r.feePkr, intl)} />
        <StatCard label={tr("Total due")} value={formatPKR(reg.r.totalPkr, intl)} hint={reg.r.status === "pending_payment" ? tr("Awaiting payment") : reg.r.status} />
      </div>
      {reg.r.status === "pending_payment" && (
        <Card className="mt-6 p-6">
          <h2 className="font-semibold">{tr("How to pay")}</h2>
          <p className="mt-2 text-sm text-muted">{tr("Online payment is being set up. Until then, EEA will contact your coordinator with payment details. Your registration is confirmed once payment is received, and admit cards follow after that.")}</p>
        </Card>
      )}
      <Card title={tr("Registered students")} className="mt-6">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Student ID")}</th><th className={th}>{tr("Name")}</th><th className={th}>{tr("Grade")}</th><th className={th}>{tr("Status")}</th></tr></thead>
          <tbody className="divide-y divide-line">
            {items.map((s) => (
              <tr key={s.code}><td className={`${td} font-mono text-xs`}>{s.code}</td><td className={`${td} font-medium text-navy-900`}>{s.first} {s.last}</td><td className={td}>{msg(gradeName(s.grade))}{s.section ? ` · ${s.section}` : ""}</td><td className={td}><Pill tone={reg.r.status === "confirmed" ? "green" : "amber"}>{reg.r.status === "confirmed" ? tr("Confirmed") : tr("Awaiting payment")}</Pill></td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
