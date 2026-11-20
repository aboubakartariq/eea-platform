import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { gradeName } from "@/lib/competition-types";
import { Card, EmptyState, PageHeader, td, th } from "@/components/admin/ui";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Students") };
}

export default async function StudentsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { tr, msg } = await getTr();
  await requirePermission("students.view");
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const where = and(eq(schema.students.archived, false), q ? or(ilike(schema.students.firstName, `%${q}%`), ilike(schema.students.lastName, `%${q}%`), ilike(schema.students.code, `%${q}%`), ilike(schema.schools.name, `%${q}%`), ilike(schema.students.schoolName, `%${q}%`)) : undefined);
  const [rows, [{ n }]] = await Promise.all([
    db.select({ id: schema.students.id, code: schema.students.code, first: schema.students.firstName, last: schema.students.lastName, grade: schema.students.grade, section: schema.students.section, school: schema.schools.name, schoolId: schema.schools.id, schoolName: schema.students.schoolName })
      .from(schema.students).leftJoin(schema.schools, eq(schema.schools.id, schema.students.schoolId)).where(where)
      .orderBy(asc(schema.schools.name), asc(schema.students.grade), asc(schema.students.lastName)).limit(200),
    db.select({ n: count() }).from(schema.students).leftJoin(schema.schools, eq(schema.schools.id, schema.students.schoolId)).where(where),
  ]);
  return (
    <>
      <PageHeader title={tr("Students")} description={tr("{n} student records added by schools. Contact details are visible only to authorised staff.", { n })} />
      <form className="mb-4" role="search">
        <label htmlFor="q" className="sr-only">{tr("Search students")}</label>
        <input id="q" name="q" defaultValue={q} placeholder={tr("Name, student ID or school")} className="h-11 w-full max-w-md rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-navy-600" />
      </form>
      <Card>
        {rows.length === 0 ? <EmptyState title={tr("No students found")} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Student ID")}</th><th className={th}>{tr("Name")}</th><th className={th}>{tr("Grade")}</th><th className={th}>{tr("School")}</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => (
                  <tr key={s.id}><td className={`${td} font-mono text-xs`}>{s.code}</td><td className={`${td} font-medium text-navy-900`}>{s.first} {s.last}</td><td className={td}>{msg(gradeName(s.grade))}{s.section ? ` · ${s.section}` : ""}</td><td className={td}>{s.schoolId ? <Link href={`/admin/schools/${s.schoolId}`} className="text-navy-600 hover:underline">{s.school}</Link> : <span className="text-muted">{tr("Individual")}{s.schoolName ? ` · ${s.schoolName}` : ""}</span>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {n > rows.length && <p className="mt-3 text-sm text-muted">{tr("Showing the first {length}. Search to narrow the list.", { length: rows.length })}</p>}
    </>
  );
}
