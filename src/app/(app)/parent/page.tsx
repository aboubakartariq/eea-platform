import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, Link2, UserPlus } from "lucide-react";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth/family";
import { gradeName } from "@/lib/competition-types";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My children" };

export default async function ParentHome({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireParent();
  const welcome = (await searchParams).welcome;
  const children = await db
    .select({ s: schema.students, school: schema.schools.name, login: schema.users.id })
    .from(schema.studentGuardians)
    .innerJoin(schema.students, eq(schema.students.id, schema.studentGuardians.studentId))
    .leftJoin(schema.schools, eq(schema.schools.id, schema.students.schoolId))
    .leftJoin(schema.users, eq(schema.users.studentId, schema.students.id))
    .where(eq(schema.studentGuardians.userId, user.id))
    .orderBy(asc(schema.students.firstName));
  const entries = children.length
    ? await db
        .select({ studentId: schema.registrationItems.studentId, competition: schema.competitions.name, examDate: schema.competitions.examDate, status: schema.registrations.status })
        .from(schema.registrationItems)
        .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
        .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrationItems.competitionId))
        .innerJoin(schema.studentGuardians, eq(schema.studentGuardians.studentId, schema.registrationItems.studentId))
        .where(eq(schema.studentGuardians.userId, user.id))
    : [];

  return (
    <>
      <PageHeader
        title={welcome ? `Welcome, ${user.name.split(" ")[0]}` : "My children"}
        description="Link a child their school has registered, or add a child yourself."
        actions={<>
          <Link href="/parent/children/link" className={buttonClass("primary", "md")}><Link2 className="size-4" aria-hidden /> Link a child</Link>
          <Link href="/parent/children/new" className={buttonClass("outline", "md")}><UserPlus className="size-4" aria-hidden /> Add a child</Link>
        </>}
      />
      {children.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-bold">Is your child registered through their school?</h2>
            <p className="mt-2 text-sm text-muted">You&apos;ll need their EEA student ID (from the school), their date of birth and the mobile number the school has for you.</p>
            <Link href="/parent/children/link" className={buttonClass("primary", "md", "mt-5")}>Link my child</Link>
          </Card>
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-bold">School not taking part?</h2>
            <p className="mt-2 text-sm text-muted">Add your child yourself and register them for online competitions they can take from home.</p>
            <Link href="/parent/children/new" className={buttonClass("outline", "md", "mt-5")}>Add my child</Link>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map(({ s, school, login }) => {
            const mine = entries.filter((e) => e.studentId === s.id);
            return (
              <Link key={s.id} href={`/parent/children/${s.id}`} className="group rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{s.firstName} {s.lastName}</h2>
                    <p className="text-sm text-muted">{gradeName(s.grade)} · {school ?? s.schoolName ?? "Individual entrant"}</p>
                    <p className="mt-1 font-mono text-xs text-muted">{s.code}</p>
                  </div>
                  {login ? <Pill tone="green">Has a login</Pill> : <Pill tone="amber">No login yet</Pill>}
                </div>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {mine.length === 0 ? <li className="text-muted">Not registered for any competition yet.</li> : mine.map((e) => (
                    <li key={e.competition} className="flex justify-between gap-3"><span className="font-medium text-navy-900">{e.competition}</span><span className="text-muted">{e.examDate ? formatDate(e.examDate) : "Date to be announced"}</span></li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy-600">Manage <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
