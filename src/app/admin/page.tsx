import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, gt, like, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { Card, DateTime, EmptyState, PageHeader, StatCard, td } from "@/components/admin/ui";
import { describeAction } from "@/lib/audit-labels";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requirePermission("dashboard.view");

  const [[schools], [pendingSchools], [staff], [newEnquiries], [failedLogins]] = await Promise.all([
    db.select({ n: count() }).from(schema.schools),
    db.select({ n: count() }).from(schema.schools).where(eq(schema.schools.status, "pending")),
    db.select({ n: count() }).from(schema.users).where(and(eq(schema.users.kind, "staff"), eq(schema.users.status, "active"))),
    db.select({ n: count() }).from(schema.contactEnquiries).where(eq(schema.contactEnquiries.status, "new")),
    db.select({ n: count() }).from(schema.auditLogs).where(and(gt(schema.auditLogs.createdAt, sql`now() - interval '24 hours'`), or(like(schema.auditLogs.action, "login.failed"), like(schema.auditLogs.action, "login.locked"), like(schema.auditLogs.action, "login.totp_failed")))),
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
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="Live figures from the database. More figures appear here as each module goes live." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools" value={schools.n} hint={`${pendingSchools.n} awaiting approval`} />
        <StatCard label="New enquiries" value={newEnquiries.n} hint="From the website contact form" href={can(user, "enquiries.view") ? "/admin/enquiries" : undefined} />
        <StatCard label="Active staff accounts" value={staff.n} href={can(user, "users.view") ? "/admin/users" : undefined} />
        <StatCard label="Failed sign-ins (24 h)" value={failedLogins.n} hint="Wrong passwords, codes and lockouts" href={can(user, "audit.view") ? "/admin/audit?q=login" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {can(user, "audit.view") && (
          <Card title="Recent activity" action={<Link href="/admin/audit" className="text-sm font-semibold text-navy-600 hover:underline">View all</Link>}>
            {recent.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td className={td}>
                        <span className="font-medium text-navy-900">{r.actor ?? "System"}</span>{" "}
                        <span className="text-muted">{describeAction(r.action)}</span>
                      </td>
                      <td className={`${td} text-right text-muted`}><DateTime value={r.createdAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
        <Card title="Coming to this dashboard">
          <ul className="divide-y divide-line text-sm">
            {[
              ["Students, competitions and registrations", 4],
              ["Upcoming and completed examinations", 5],
              ["Results awaiting publication, certificates", 6],
              ["Revenue and pending payments", 7],
            ].map(([t, p]) => (
              <li key={t} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <span className="text-ink">{t}</span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">Phase {p}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
