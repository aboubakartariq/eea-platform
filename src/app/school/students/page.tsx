import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { FileSpreadsheet, UserPlus } from "lucide-react";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { gradeName } from "@/lib/competition-types";
import { Card, EmptyState, PageHeader, td, th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ grade?: string; q?: string }> }) {
  const { school, canManage } = await requireSchool();
  const sp = await searchParams;
  const grade = sp.grade !== undefined && sp.grade !== "" && /^\d{1,2}$/.test(sp.grade) ? Number(sp.grade) : null;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const where = and(
    eq(schema.students.schoolId, school.id),
    eq(schema.students.archived, false),
    grade !== null ? eq(schema.students.grade, grade) : undefined,
    q ? or(ilike(schema.students.firstName, `%${q}%`), ilike(schema.students.lastName, `%${q}%`), ilike(schema.students.code, `%${q}%`)) : undefined,
  );
  const [rows, grades, [{ n: total }]] = await Promise.all([
    db.select().from(schema.students).where(where).orderBy(asc(schema.students.grade), asc(schema.students.section), asc(schema.students.lastName), asc(schema.students.firstName)).limit(500),
    db.select({ grade: schema.students.grade, n: count() }).from(schema.students).where(and(eq(schema.students.schoolId, school.id), eq(schema.students.archived, false))).groupBy(schema.students.grade).orderBy(schema.students.grade),
    db.select({ n: count() }).from(schema.students).where(and(eq(schema.students.schoolId, school.id), eq(schema.students.archived, false))),
  ]);

  return (
    <>
      <PageHeader
        title="Students"
        description={`${total} student${total === 1 ? "" : "s"} in your school's list.`}
        actions={canManage && (
          <>
            <Link href="/school/students/import" className={buttonClass("gold", "md")}><FileSpreadsheet className="size-4" aria-hidden /> Import from Excel</Link>
            <Link href="/school/students/new" className={buttonClass("outline", "md")}><UserPlus className="size-4" aria-hidden /> Add a student</Link>
          </>
        )}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/school/students" className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ${grade === null ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line hover:bg-navy-50"}`}>All grades</Link>
        {grades.map((g) => (
          <Link key={g.grade} href={`/school/students?grade=${g.grade}`} className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ${grade === g.grade ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line hover:bg-navy-50"}`}>
            {gradeName(g.grade)} <span className="opacity-70">{g.n}</span>
          </Link>
        ))}
        <form className="ml-auto" role="search">
          {grade !== null && <input type="hidden" name="grade" value={grade} />}
          <label htmlFor="q" className="sr-only">Search students</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name or student ID" className="h-10 w-60 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-navy-600" />
        </form>
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title={total === 0 ? "No students yet" : "No students match"}>{total === 0 && "Import your class lists from Excel or add students one by one."}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Student ID</th><th className={th}>Name</th><th className={th}>Grade</th><th className={th}>Date of birth</th><th className={th}>Parent</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className={`${td} font-mono text-xs`}>{s.code}</td>
                    <td className={td}><Link href={`/school/students/${s.id}`} className="font-medium text-navy-900 hover:underline">{s.firstName} {s.lastName}</Link></td>
                    <td className={td}>{gradeName(s.grade)}{s.section ? ` · ${s.section}` : ""}</td>
                    <td className={`${td} tabular-nums text-muted`}>{s.dateOfBirth.split("-").reverse().join("/")}</td>
                    <td className={`${td} text-muted`}>{s.guardianName}<p className="text-xs">{s.guardianPhone}</p></td>
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
