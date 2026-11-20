import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { Card, DateTime, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { formatPKR } from "@/lib/utils";
import { ReviewButtons } from "./review-buttons";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("School") };
}

export default async function SchoolAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { tr, intl } = await getTr();
  const actor = await requirePermission("schools.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const school = await db.query.schools.findFirst({ where: eq(schema.schools.id, id) });
  if (!school) notFound();
  const [coordinators, [{ n: studentCount }], regs, campuses] = await Promise.all([
    db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, phone: schema.users.phone, status: schema.users.status, role: schema.roles.name }).from(schema.userRoles).innerJoin(schema.users, eq(schema.users.id, schema.userRoles.userId)).innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId)).where(eq(schema.userRoles.schoolId, id)),
    db.select({ n: count() }).from(schema.students).where(eq(schema.students.schoolId, id)),
    db.select({ id: schema.registrations.id, reference: schema.registrations.reference, competition: schema.competitions.name, students: schema.registrations.studentCount, total: schema.registrations.totalPkr, status: schema.registrations.status, createdAt: schema.registrations.createdAt }).from(schema.registrations).innerJoin(schema.competitions, eq(schema.competitions.id, schema.registrations.competitionId)).where(eq(schema.registrations.schoolId, id)).orderBy(desc(schema.registrations.createdAt)),
    db.select().from(schema.campuses).where(eq(schema.campuses.schoolId, id)),
  ]);
  const tone = { pending: "amber", approved: "green", rejected: "red", suspended: "red" } as const;

  return (
    <>
      <p className="mb-2 text-sm"><Link href={`/admin/schools?status=${school.status}`} className="text-muted hover:text-navy-700">{tr("← Schools")}</Link></p>
      <PageHeader title={school.name} description={`${school.city} · ${school.code ?? tr("School ID issued on approval")}`} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title={tr("School details")}>
            <dl className="grid gap-px bg-line sm:grid-cols-2 [&>div]:bg-white [&>div]:px-5 [&>div]:py-4">
              <div><dt className="text-xs text-muted">{tr("Status")}</dt><dd className="mt-1"><Pill tone={tone[school.status]}>{school.status}</Pill></dd></div>
              <div><dt className="text-xs text-muted">{tr("Principal")}</dt><dd className="mt-1 font-medium">{school.principalName}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Official email")}</dt><dd className="mt-1 text-sm"><a href={`mailto:${school.officialEmail}`} className="text-navy-600 hover:underline">{school.officialEmail}</a></dd></div>
              <div><dt className="text-xs text-muted">{tr("Phone")}</dt><dd className="mt-1 text-sm">{school.phone}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted">{tr("Address")}</dt><dd className="mt-1 text-sm">{school.address}, {school.city}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Campuses")}</dt><dd className="mt-1 text-sm">{campuses.map((c) => c.name).join(", ") || "—"}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Students")}</dt><dd className="mt-1 text-sm tabular-nums">{studentCount}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Registered on")}</dt><dd className="mt-1 text-sm"><DateTime value={school.createdAt} /></dd></div>
              <div><dt className="text-xs text-muted">{tr("Approved on")}</dt><dd className="mt-1 text-sm">{school.approvedAt ? <DateTime value={school.approvedAt} /> : "—"}</dd></div>
            </dl>
          </Card>
          <Card title={tr("Competition registrations")}>
            {regs.length === 0 ? <p className="px-5 py-6 text-sm text-muted">{tr("No registrations yet.")}</p> : (
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Reference")}</th><th className={th}>{tr("Competition")}</th><th className={th}>{tr("Students")}</th><th className={th}>{tr("Total")}</th><th className={th}>{tr("Status")}</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {regs.map((r) => (
                    <tr key={r.id}><td className={`${td} font-mono text-xs`}>{r.reference}</td><td className={td}>{r.competition}</td><td className={`${td} tabular-nums`}>{r.students}</td><td className={`${td} tabular-nums`}>{formatPKR(r.total, intl)}</td><td className={td}><Pill tone={r.status === "confirmed" ? "green" : r.status === "cancelled" ? "red" : "amber"}>{r.status.replace("_", " ")}</Pill></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          {can(actor, "schools.approve") && (
            <Card title={tr("Review")} className="p-0"><div className="p-5"><ReviewButtons schoolId={school.id} status={school.status} /></div></Card>
          )}
          <Card title={tr("Coordinators")}>
            <ul className="divide-y divide-line text-sm">
              {coordinators.map((c) => (
                <li key={c.id + c.role} className="px-5 py-3.5">
                  <p className="font-semibold text-navy-900">{c.name} <span className="font-normal text-muted">· {c.role}</span></p>
                  <p className="text-muted">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                  <p className="mt-1"><Pill tone={c.status === "active" ? "green" : c.status === "pending" ? "amber" : "red"}>{c.status}</Pill></p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
