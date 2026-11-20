import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { gradeName } from "@/lib/competition-types";
import { Card, EmptyState, PageHeader, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
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
      <PageHeader title="Students" description={`${n} student records added by schools. Contact details are visible only to authorised staff.`} />
      <form className="mb-4" role="search">
        <label htmlFor="q" className="sr-only">Search students</label>
        <input id="q" name="q" defaultValue={q} placeholder="Name, student ID or school" className="h-11 w-full max-w-md rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-navy-600" />
      </form>
      <Card>
        {rows.length === 0 ? <EmptyState title="No students found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Student ID</th><th className={th}>Name</th><th className={th}>Grade</th><th className={th}>School</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => (
                  <tr key={s.id}><td className={`${td} font-mono text-xs`}>{s.code}</td><td className={`${td} font-medium text-navy-900`}>{s.first} {s.last}</td><td className={td}>{gradeName(s.grade)}{s.section ? ` · ${s.section}` : ""}</td><td className={td}>{s.schoolId ? <Link href={`/admin/schools/${s.schoolId}`} className="text-navy-600 hover:underline">{s.school}</Link> : <span className="text-muted">Individual{s.schoolName ? ` · ${s.schoolName}` : ""}</span>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {n > rows.length && <p className="mt-3 text-sm text-muted">Showing the first {rows.length}. Search to narrow the list.</p>}
    </>
  );
}
