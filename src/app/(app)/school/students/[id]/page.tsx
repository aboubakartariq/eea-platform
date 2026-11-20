import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { gradeName } from "@/lib/competition-types";
import { Card, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { StudentLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Student" };

export default async function SchoolStudent({ params }: { params: Promise<{ id: string }> }) {
  const { school, canManage } = await requireSchool();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const student = await db.query.students.findFirst({ where: and(eq(schema.students.id, id), eq(schema.students.schoolId, school.id)) });
  if (!student) notFound();
  const [login, entries, [parentLinks]] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.studentId, id), columns: { id: true, lastLoginAt: true } }),
    db.select({ competition: schema.competitions.name, examDate: schema.competitions.examDate, status: schema.registrations.status }).from(schema.registrationItems).innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId)).innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrationItems.competitionId)).where(eq(schema.registrationItems.studentId, id)),
    db.select({ n: schema.studentGuardians.userId }).from(schema.studentGuardians).where(eq(schema.studentGuardians.studentId, id)).limit(1),
  ]);
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/students" className="text-muted hover:text-navy-700">← Students</Link></p>
      <PageHeader title={`${student.firstName} ${student.lastName}`} description={`${gradeName(student.grade)}${student.section ? ` · ${student.section}` : ""} · Student ID ${student.code}`} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card title="Details">
            <dl className="grid gap-px bg-line sm:grid-cols-2 [&>div]:bg-white [&>div]:px-5 [&>div]:py-4 text-sm">
              <div><dt className="text-xs text-muted">Date of birth</dt><dd className="mt-1">{student.dateOfBirth.split("-").reverse().join("/")}</dd></div>
              <div><dt className="text-xs text-muted">Gender</dt><dd className="mt-1">{student.gender === "F" ? "Female" : student.gender === "M" ? "Male" : "—"}</dd></div>
              <div><dt className="text-xs text-muted">Parent</dt><dd className="mt-1">{student.guardianName}<p className="text-muted">{student.guardianPhone}</p></dd></div>
              <div><dt className="text-xs text-muted">Parent account</dt><dd className="mt-1">{parentLinks ? <Pill tone="green">Linked</Pill> : <Pill>Not linked yet</Pill>}</dd></div>
            </dl>
          </Card>
          <Card title="Competitions">
            {entries.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Not registered for any competition.</p> : (
              <table className="w-full text-sm"><thead className="border-b border-line bg-surface/60"><tr><th className={th}>Competition</th><th className={th}>Exam date</th><th className={th}>Status</th></tr></thead>
                <tbody className="divide-y divide-line">{entries.map((e) => <tr key={e.competition}><td className={`${td} font-medium text-navy-900`}>{e.competition}</td><td className={`${td} text-muted`}>{e.examDate ? formatDate(e.examDate) : "To be announced"}</td><td className={td}><Pill tone={e.status === "confirmed" ? "green" : "amber"}>{e.status === "confirmed" ? "Confirmed" : "Awaiting payment"}</Pill></td></tr>)}</tbody>
              </table>
            )}
          </Card>
        </div>
        <Card title="Student login" className="p-0">
          <div className="p-5">
            <p className="mb-4 text-sm text-muted">Students sign in with their student ID <strong className="font-mono text-navy-900">{student.code}</strong>. {login ? "A login exists; set a new password if they forgot it." : "Create a login so they can take online exams. Parents can also do this from their account."}</p>
            {canManage ? <StudentLoginForm studentId={student.id} exists={Boolean(login)} /> : <p className="text-sm text-muted">Only the coordinator can set student passwords.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
