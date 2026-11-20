import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { getOpenCompetitions } from "@/lib/competitions";
import { gradesLabel } from "@/lib/competition-types";
import { Card, PageHeader } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/utils";
import { StudentPicker } from "./student-picker";

export const metadata: Metadata = { title: "Select students" };

export default async function RegisterCompetition({ params }: { params: Promise<{ slug: string }> }) {
  const { school, canManage } = await requireSchool();
  const { slug } = await params;
  const c = (await getOpenCompetitions()).find((x) => x.slug === slug);
  if (!c) notFound();
  const students = await db
    .select({ id: schema.students.id, code: schema.students.code, firstName: schema.students.firstName, lastName: schema.students.lastName, grade: schema.students.grade, section: schema.students.section, registeredFor: schema.registrationItems.id })
    .from(schema.students)
    .leftJoin(schema.registrationItems, and(eq(schema.registrationItems.studentId, schema.students.id), eq(schema.registrationItems.competitionId, c.id)))
    .where(and(eq(schema.students.schoolId, school.id), eq(schema.students.archived, false), gte(schema.students.grade, c.gradeFrom!), lte(schema.students.grade, c.gradeTo!)))
    .orderBy(asc(schema.students.grade), asc(schema.students.section), asc(schema.students.lastName));

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/register" className="text-muted hover:text-navy-700">← Competitions</Link></p>
      <PageHeader title={c.name} description={`${gradesLabel(c)} · ${formatPKR(c.feePkr!)} per student · exam ${formatDate(c.examDate!)} · registration closes ${formatDate(c.registrationCloses!)}`} />
      {!canManage ? (
        <Card className="p-6 text-sm text-muted">Only your school&apos;s coordinator can register students.</Card>
      ) : students.length === 0 ? (
        <Card className="p-6 text-sm text-muted">You have no students in {gradesLabel(c)} yet. <Link href="/school/students/import" className="font-semibold text-navy-600 underline">Import your class lists</Link> first.</Card>
      ) : (
        <StudentPicker
          competitionId={c.id}
          fee={c.feePkr!}
          modes={c.modes}
          students={students.map((s) => ({ id: s.id, code: s.code, name: `${s.firstName} ${s.lastName}`, grade: s.grade, section: s.section, registered: Boolean(s.registeredFor) }))}
        />
      )}
    </>
  );
}
