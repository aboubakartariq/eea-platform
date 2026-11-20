import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { describeAction } from "@/lib/audit-labels";
import { Card, DateTime, PageHeader, Pill, td } from "@/components/admin/ui";
import { UserActions, UserRolesForm } from "./user-forms";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("User") };
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { tr, msg } = await getTr();
  const actor = await requirePermission("users.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
  if (!user) notFound();

  const [assigned, staffRoles, activity] = await Promise.all([
    db.select({ id: schema.roles.id, name: schema.roles.name, scope: schema.roles.scope }).from(schema.userRoles).innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId)).where(eq(schema.userRoles.userId, id)),
    db.select({ id: schema.roles.id, name: schema.roles.name, description: schema.roles.description, key: schema.roles.key }).from(schema.roles).where(eq(schema.roles.scope, "global")).orderBy(schema.roles.name),
    can(actor, "audit.view")
      ? db.select({ id: schema.auditLogs.id, action: schema.auditLogs.action, createdAt: schema.auditLogs.createdAt, ip: schema.auditLogs.ip }).from(schema.auditLogs).where(and(eq(schema.auditLogs.entityType, "user"), eq(schema.auditLogs.entityId, id))).orderBy(desc(schema.auditLogs.id)).limit(15)
      : Promise.resolve([]),
  ]);
  const manage = can(actor, "users.manage");

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/users" className="text-muted hover:text-navy-700">{tr("← Users")}</Link></p>
      <PageHeader title={user.name} description={user.email ?? user.username ?? ""} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card title={tr("Account")}>
            <dl className="grid gap-px bg-line sm:grid-cols-2 [&>div]:bg-white [&>div]:px-5 [&>div]:py-4">
              <div><dt className="text-xs text-muted">{tr("Status")}</dt><dd className="mt-1">{user.status === "active" ? <Pill tone="green">{tr("Active")}</Pill> : <Pill tone="red">{user.status}</Pill>}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Type")}</dt><dd className="mt-1 font-medium capitalize">{user.kind}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Two-step verification")}</dt><dd className="mt-1">{user.totpEnabledAt ? <Pill tone="green">{tr("On")}</Pill> : <Pill tone="amber">{tr("Not set up")}</Pill>}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Last sign-in")}</dt><dd className="mt-1 text-sm">{user.lastLoginAt ? <DateTime value={user.lastLoginAt} /> : tr("Never")}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Phone")}</dt><dd className="mt-1 text-sm">{user.phone || "—"}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Created")}</dt><dd className="mt-1 text-sm"><DateTime value={user.createdAt} /></dd></div>
            </dl>
          </Card>
          {user.kind === "staff" && (
            <Card title={tr("Roles")} className="p-0">
              <div className="p-5">
                {manage ? (
                  <UserRolesForm userId={user.id} roles={staffRoles} selected={assigned.map((a) => a.id)} />
                ) : (
                  <p className="text-sm">{assigned.map((a) => a.name).join(", ") || tr("No roles")}</p>
                )}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          {manage && actor.id !== user.id && (
            <Card title={tr("Actions")} className="p-0">
              <div className="p-5"><UserActions userId={user.id} status={user.status} hasTotp={Boolean(user.totpEnabledAt)} /></div>
            </Card>
          )}
          {can(actor, "audit.view") && (
            <Card title={tr("Recent account activity")}>
              <table className="w-full text-sm"><tbody className="divide-y divide-line">
                {activity.length === 0 ? <tr><td className={`${td} text-muted`}>{tr("No activity recorded.")}</td></tr> : activity.map((a) => (
                  <tr key={a.id}><td className={td}>{msg(describeAction(a.action))}<p className="text-xs text-muted">{a.ip ?? ""}</p></td><td className={`${td} text-end text-muted`}><DateTime value={a.createdAt} /></td></tr>
                ))}
              </tbody></table>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
