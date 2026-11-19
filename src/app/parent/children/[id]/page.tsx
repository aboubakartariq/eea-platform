import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireOwnChild } from "@/lib/auth/family";
import { gradeName } from "@/lib/competition-types";
import { Card, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { ChildLoginForm } from "./login-form";
import { publishedResultsFor } from "@/lib/server/results";
import { ResultCard } from "@/components/portal/result-card";

export const metadata: Metadata = { title: "Child" };

export default async function ChildPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ linked?: string; added?: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { student } = await requireOwnChild(id);
  const sp = await searchParams;
  const [school, login, entries] = await Promise.all([
    student.schoolId ? db.query.schools.findFirst({ where: eq(schema.schools.id, student.schoolId), columns: { name: true } }) : Promise.resolve(null),
    db.query.users.findFirst({ where: eq(schema.users.studentId, student.id), columns: { id: true, lastLoginAt: true } }),
    db
      .select({ competition: schema.competitions.name, examDate: schema.competitions.examDate, mode: schema.registrations.mode, status: schema.registrations.status, viaSchool: schema.registrations.schoolId, itemId: schema.registrationItems.id, roll: schema.registrationItems.rollNumber })
      .from(schema.registrationItems)
      .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrationItems.competitionId))
      .where(eq(schema.registrationItems.studentId, student.id)),
  ]);
  const results = await publishedResultsFor([student.id]);

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/parent" className="text-muted hover:text-navy-700">← My children</Link></p>
      <PageHeader title={`${student.firstName} ${student.lastName}`} description={`${gradeName(student.grade)} · ${school?.name ?? student.schoolName ?? "Individual entrant"} · Student ID ${student.code}`} />
      {(sp.linked || sp.added) && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-6 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-sm text-emerald-900">{sp.linked ? `${student.firstName} is now linked to your account.` : `${student.firstName} has been added with student ID ${student.code}.`} Next, create a login for exam day.</p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Competitions">
          {entries.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted">Not registered for any competition yet. <Link href="/parent/register" className="font-semibold text-navy-600 underline">Register now</Link></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Competition</th><th className={th}>Exam date</th><th className={th}>Entered by</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {entries.map((e) => (
                  <tr key={e.competition}>
                    <td className={`${td} font-medium text-navy-900`}>{e.competition}<p className="text-xs text-muted">{e.mode === "online" ? "Online" : "Paper, at school"}</p></td>
                    <td className={`${td} text-muted`}>{e.examDate ? formatDate(e.examDate) : "To be announced"}</td>
                    <td className={`${td} text-muted`}>{e.viaSchool ? "School" : "You"}</td>
                    <td className={td}><Pill tone={e.status === "confirmed" ? "green" : "amber"}>{e.status === "confirmed" ? "Confirmed" : "Awaiting payment"}</Pill>{e.roll && <Link href={`/admit-card/${e.itemId}`} className="mt-1 block text-xs font-semibold text-navy-600 hover:underline">Admit card</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title={login ? "Exam-day login" : "Create a login for exam day"} className="p-0">
          <div className="p-5">
            <p className="mb-4 text-sm text-muted">
              {login
                ? <>Your child signs in with student ID <strong className="font-mono text-navy-900">{student.code}</strong>. {login.lastLoginAt ? "They have signed in before." : "They haven't signed in yet."} You can set a new password here.</>
                : <>Your child will sign in with student ID <strong className="font-mono text-navy-900">{student.code}</strong> and the password you choose. Results and certificates stay in your parent account too.</>}
            </p>
            <ChildLoginForm studentId={student.id} exists={Boolean(login)} />
          </div>
        </Card>
      </div>
      {results.length > 0 && (
        <section className="mt-8" aria-labelledby="results-h">
          <h2 id="results-h" className="mb-3 text-xl font-bold">Results</h2>
          <div className="grid gap-4 md:grid-cols-2">{results.map((r) => <ResultCard key={r.id} r={r} />)}</div>
        </section>
      )}
    </>
  );
}
