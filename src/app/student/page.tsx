import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Award, BookOpenCheck, CalendarDays, Laptop } from "lucide-react";
import { db, schema } from "@/db";
import { requireStudent } from "@/lib/auth/family";
import { serverNow } from "@/lib/server/clock";
import { gradeName } from "@/lib/competition-types";
import { CompetitionIcon } from "@/components/competition-card";
import { Card, Pill } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { studentExams } from "@/lib/server/attempts";
import { DateTime } from "@/components/admin/ui";
import { StartExam } from "./start-exam";

export const metadata: Metadata = { title: "My competitions" };

const daysUntil = (iso: string) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86400000);
};

export default async function StudentHome() {
  const { student } = await requireStudent();
  const [school, entries, exams] = await Promise.all([
    student.schoolId ? db.query.schools.findFirst({ where: eq(schema.schools.id, student.schoolId), columns: { name: true } }) : Promise.resolve(null),
    db
      .select({ id: schema.competitions.id, slug: schema.competitions.slug, name: schema.competitions.name, icon: schema.competitions.icon, accent: schema.competitions.accent, examDate: schema.competitions.examDate, duration: schema.competitions.durationMinutes, mode: schema.registrations.mode, status: schema.registrations.status })
      .from(schema.registrationItems)
      .innerJoin(schema.registrations, eq(schema.registrations.id, schema.registrationItems.registrationId))
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrationItems.competitionId))
      .where(eq(schema.registrationItems.studentId, student.id))
      .orderBy(asc(schema.competitions.examDate)),
    studentExams(student.id),
  ]);
  const now = serverNow();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hi {student.firstName}!</h1>
        <p className="mt-1.5 text-muted">{gradeName(student.grade)} · {school?.name ?? student.schoolName ?? "Individual entrant"} · Student ID <span className="font-mono">{student.code}</span></p>
      </div>

      {exams.length > 0 && (
        <section className="mb-8" aria-labelledby="exams-h">
          <h2 id="exams-h" className="mb-3 text-xl font-bold">Online exams</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((x) => {
              const open = now >= x.opensAt.getTime() && now < x.closesAt.getTime() - 60_000;
              const a = x.attempt;
              return (
                <Card key={x.sessionId} className="p-6">
                  <p className="text-sm font-semibold text-brand-blue">{x.competition}</p>
                  <h3 className="mt-0.5 text-lg font-bold">{x.title}</h3>
                  <p className="mt-1 text-sm text-muted">{x.questionCount} questions · {x.durationMinutes} minutes</p>
                  <p className="mt-1 text-sm text-muted">Open <DateTime value={x.opensAt} /> to <DateTime value={x.closesAt} /></p>
                  <div className="mt-4 border-t border-line pt-4">
                    {a?.status === "submitted" ? <Pill tone="green">Submitted</Pill>
                      : a ? <StartExam session={x.sessionId} label="Continue my exam" />
                      : open ? <StartExam session={x.sessionId} label="Start exam" />
                      : now < x.opensAt.getTime() ? <p className="text-sm text-muted">The Start button appears here when the exam opens.</p>
                      : <Pill>Closed</Pill>}
                    {!a && open && <p className="mt-2 text-xs text-muted">Once you start, the clock keeps running even if you close the page.</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {entries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold text-navy-900">You&apos;re not registered for a competition yet</p>
          <p className="mt-1 text-sm text-muted">Ask your school or your parent to register you. Your competitions will appear here.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((e) => {
            const days = e.examDate ? daysUntil(e.examDate) : null;
            return (
              <Card key={e.id} className="p-6">
                <div className="flex items-start gap-4">
                  <CompetitionIcon c={{ icon: e.icon, accent: (["gold", "blue", "magenta", "navy"].includes(e.accent) ? e.accent : "blue") as "blue" }} />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{e.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><CalendarDays className="size-4 text-gold" aria-hidden />{e.examDate ? formatDate(e.examDate) : "Date to be announced"}{e.duration ? ` · ${e.duration} minutes` : ""}</p>
                    <p className="mt-1 text-sm text-muted">{e.mode === "online" ? "Online exam" : "Paper exam at your school"}</p>
                  </div>
                  {days !== null && days >= 0 && (
                    <div className="rounded-2xl bg-gold-50 px-4 py-2 text-center ring-1 ring-gold/30">
                      <p className="font-display text-2xl font-bold text-navy-900 tabular-nums">{days}</p>
                      <p className="text-[11px] font-semibold text-gold-700">{days === 1 ? "day to go" : "days to go"}</p>
                    </div>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  {e.status === "confirmed" ? <Pill tone="green">Confirmed</Pill> : <Pill tone="amber">Waiting for payment</Pill>}
                  <Link href={`/competitions/${e.slug}#syllabus`} className="ml-auto text-sm font-semibold text-navy-600 hover:underline">What to study →</Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Laptop, title: "Exam day", text: "When your online exam opens, a Start button appears at the top of this page." },
          { icon: BookOpenCheck, title: "Results", text: "Your score, rank and strongest topics appear here after each competition." },
          { icon: Award, title: "Certificates", text: "Download your certificates here. Anyone can check them with the QR code." },
        ].map((x) => (
          <Card key={x.title} className="p-5">
            <x.icon className="size-7 text-brand-blue" aria-hidden />
            <h3 className="mt-3 font-semibold">{x.title}</h3>
            <p className="mt-1 text-sm text-muted">{x.text}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
