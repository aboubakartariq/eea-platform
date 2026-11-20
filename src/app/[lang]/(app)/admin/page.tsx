import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, gt, like, or, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { Card, DateTime, EmptyState, PageHeader, StatCard, td } from "@/components/admin/ui";
import { describeAction } from "@/lib/audit-labels";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Dashboard") };
}

export default async function Dashboard() {
  const { tr, msg } = await getTr();
  const user = await requirePermission("dashboard.view");

  const [work] = (
    await db.execute<{ review: number; openSessions: number; writing: number; draftResults: number; approvedResults: number; certificates: number; parcels: number }>(sql`
      select
        (select count(*)::int from questions where status = 'review') as "review",
        (select count(*)::int from exam_sessions where status = 'scheduled' and now() between opens_at and closes_at) as "openSessions",
        (select count(*)::int from exam_attempts where status = 'in_progress' and deadline_at > now()) as "writing",
        (select count(*)::int from result_sets where status = 'draft') as "draftResults",
        (select count(*)::int from result_sets where status = 'approved') as "approvedResults",
        (select count(*)::int from certificates where revoked_at is null) as "certificates",
        (select count(*)::int from award_dispatches d join result_sets rs on rs.id = d.result_set_id where rs.status <> 'withdrawn' and d.status in ('pending','packed')) as "parcels"
    `)
  ).rows;
  const [[schools], [pendingSchools], [staff], [newEnquiries], [failedLogins], [students], [entries], [competitions]] = await Promise.all([
    db.select({ n: count() }).from(schema.schools),
    db.select({ n: count() }).from(schema.schools).where(eq(schema.schools.status, "pending")),
    db.select({ n: count() }).from(schema.users).where(and(eq(schema.users.kind, "staff"), eq(schema.users.status, "active"))),
    db.select({ n: count() }).from(schema.contactEnquiries).where(eq(schema.contactEnquiries.status, "new")),
    db.select({ n: count() }).from(schema.auditLogs).where(and(gt(schema.auditLogs.createdAt, sql`now() - interval '24 hours'`), or(like(schema.auditLogs.action, "login.failed"), like(schema.auditLogs.action, "login.locked"), like(schema.auditLogs.action, "login.totp_failed")))),
    db.select({ n: count() }).from(schema.students).where(eq(schema.students.archived, false)),
    db.select({ n: count(), due: sum(schema.registrations.totalPkr) }).from(schema.registrations).where(eq(schema.registrations.status, "pending_payment")),
    db.select({ n: count() }).from(schema.competitions).where(eq(schema.competitions.status, "published")),
  ]);

  const recent = can(user, "audit.view")
    ? await db
        .select({ id: schema.auditLogs.id, action: schema.auditLogs.action, createdAt: schema.auditLogs.createdAt, actor: schema.users.name })
        .from(schema.auditLogs)
        .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
        .orderBy(desc(schema.auditLogs.id))
        .limit(8)
    : [];

  return (
    <>
      <PageHeader title={tr("Welcome, {name}", { name: user.name.split(" ")[0] })} description={tr("Live figures from the database.")} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={tr("Schools")} value={schools.n} hint={tr("{n} awaiting approval", { n: pendingSchools.n })} href={can(user, "schools.view") ? "/admin/schools" : undefined} />
        <StatCard label={tr("Students")} value={students.n} href={can(user, "students.view") ? "/admin/students" : undefined} />
        <StatCard label={tr("Registrations awaiting payment")} value={entries.n} hint={tr("PKR {localeString} due", { localeString: Number(entries.due ?? 0).toLocaleString("en-PK") })} href={can(user, "registrations.view") ? "/admin/registrations" : undefined} />
        <StatCard label={tr("Published competitions")} value={competitions.n} href={can(user, "competitions.view") ? "/admin/competitions" : undefined} />
        <StatCard label={tr("New enquiries")} value={newEnquiries.n} hint={tr("From the website contact form")} href={can(user, "enquiries.view") ? "/admin/enquiries" : undefined} />
        <StatCard label={tr("Active staff accounts")} value={staff.n} href={can(user, "users.view") ? "/admin/users" : undefined} />
        <StatCard label={tr("Failed sign-ins (24 h)")} value={failedLogins.n} hint={tr("Wrong passwords, codes and lockouts")} href={can(user, "audit.view") ? "/admin/audit?q=login" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {can(user, "audit.view") && (
          <Card title={tr("Recent activity")} action={<Link href="/admin/audit" className="text-sm font-semibold text-navy-600 hover:underline">{tr("View all")}</Link>}>
            {recent.length === 0 ? (
              <EmptyState title={tr("No activity yet")} />
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td className={td}>
                        <span className="font-medium text-navy-900">{r.actor ?? tr("System")}</span>{" "}
                        <span className="text-muted">{msg(describeAction(r.action))}</span>
                      </td>
                      <td className={`${td} text-end text-muted`}><DateTime value={r.createdAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
        <Card title={tr("Exams and results")}>
          <ul className="divide-y divide-line text-sm">
            {[
              [tr("Questions waiting for review"), work.review, "/admin/questions?status=review"],
              [tr("Online exams open now"), work.openSessions, "/admin/exams"],
              [tr("Students writing an exam now"), work.writing, "/admin/exams"],
              [tr("Results waiting for approval"), work.draftResults, "/admin/results"],
              [tr("Results approved, not yet published"), work.approvedResults, "/admin/results"],
              [tr("Certificates issued"), work.certificates, "/admin/certificates"],
              [tr("Medal parcels not yet dispatched"), work.parcels, "/admin/awards"],
            ].map(([t, n, href]) => (
              <li key={String(t)}>
                <Link href={String(href)} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface/60">
                  <span className="text-ink">{t}</span>
                  <span className={`font-display text-lg font-bold tabular-nums ${Number(n) > 0 ? "text-navy-900" : "text-muted"}`}>{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
