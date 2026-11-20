import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, sum } from "drizzle-orm";
import { ArrowRight, FileSpreadsheet, UserPlus } from "lucide-react";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { getOpenCompetitions } from "@/lib/competitions";
import { gradeName, gradesLabel } from "@/lib/competition-types";
import { Card, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { formatDate, formatPKR } from "@/lib/utils";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Overview") };
}

export default async function SchoolHome() {
  const { tr, msg, intl } = await getTr();
  const { school, user } = await requireSchool();
  const [[{ n: students }], byGrade, [due], open, recent] = await Promise.all([
    db.select({ n: count() }).from(schema.students).where(and(eq(schema.students.schoolId, school.id), eq(schema.students.archived, false))),
    db.select({ grade: schema.students.grade, n: count() }).from(schema.students).where(and(eq(schema.students.schoolId, school.id), eq(schema.students.archived, false))).groupBy(schema.students.grade).orderBy(schema.students.grade),
    db.select({ amount: sum(schema.registrations.totalPkr), n: count() }).from(schema.registrations).where(and(eq(schema.registrations.schoolId, school.id), eq(schema.registrations.status, "pending_payment"))),
    getOpenCompetitions(),
    db.select({ id: schema.registrations.id, reference: schema.registrations.reference, competition: schema.competitions.name, students: schema.registrations.studentCount, total: schema.registrations.totalPkr, status: schema.registrations.status }).from(schema.registrations).innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId)).where(eq(schema.registrations.schoolId, school.id)).orderBy(desc(schema.registrations.createdAt)).limit(5),
  ]);
  const [{ n: registeredStudents }] = await db.select({ n: count() }).from(schema.registrationItems).innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId)).where(eq(schema.registrations.schoolId, school.id));

  return (
    <>
      <PageHeader title={tr("Assalam o Alaikum, {name}", { name: user.name.split(" ")[0] })} description={tr("School ID {code}. Add your students, then register them for competitions.", { code: school.code })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={tr("Students")} value={students} href="/school/students" hint={byGrade.length ? byGrade.map((g) => `${msg(gradeName(g.grade))}: ${g.n}`).join(" · ") : tr("None added yet")} />
        <StatCard label={tr("Competition entries")} value={registeredStudents} href="/school/registrations" />
        <StatCard label={tr("Amount due")} value={formatPKR(Number(due.amount ?? 0), intl)} hint={tr("Registrations awaiting payment: {n}", { n: due.n })} href="/school/registrations" />
      </div>

      {students === 0 && (
        <Card className="mt-6 p-6 sm:p-8">
          <h2 className="text-xl font-bold">{tr("Start by adding your students")}</h2>
          <p className="mt-2 max-w-xl text-muted">{tr("Upload your class lists from Excel in one go, or add students one at a time.")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/school/students/import" className={buttonClass("gold", "md")}><FileSpreadsheet className="size-4" aria-hidden />{" "}{tr("Import from Excel")}</Link>
            <Link href="/school/students/new" className={buttonClass("outline", "md")}><UserPlus className="size-4" aria-hidden />{" "}{tr("Add a student")}</Link>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={tr("Open for registration")}>
          {open.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">{tr("No competitions are open for registration right now. EEA will announce dates soon.")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {open.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-navy-900">{c.name}</p>
                    <p className="text-sm text-muted">{tr("{grade} · {amount} per student · closes {date}", { grade: msg(gradesLabel(c)), amount: formatPKR(c.feePkr!, intl), date: formatDate(c.registrationCloses!, intl) })}</p>
                  </div>
                  <Link href={`/school/register/${c.slug}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-navy-600 hover:underline">{tr("Register")}{" "}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={tr("Recent registrations")} action={<Link href="/school/registrations" className="text-sm font-semibold text-navy-600 hover:underline">{tr("View all")}</Link>}>
          {recent.length === 0 ? <p className="px-5 py-6 text-sm text-muted">{tr("No registrations yet.")}</p> : (
            <ul className="divide-y divide-line text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <Link href={`/school/registrations/${r.id}`} className="hover:underline"><span className="font-semibold text-navy-900">{r.competition}</span> <span className="text-muted">{tr("· {students} students", { students: r.students })}</span></Link>
                  <span className="flex items-center gap-3"><span className="tabular-nums">{formatPKR(r.total, intl)}</span><Pill tone={r.status === "confirmed" ? "green" : r.status === "cancelled" ? "red" : "amber"}>{r.status === "pending_payment" ? tr("Awaiting payment") : r.status}</Pill></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
