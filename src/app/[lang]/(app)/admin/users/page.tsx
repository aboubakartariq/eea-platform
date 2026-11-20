import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { buttonClass } from "@/components/ui/button";
import { Card, DateTime, EmptyState, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Users") };
}

export default async function UsersPage() {
  const { tr } = await getTr();
  const user = await requirePermission("users.view");
  const rows = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, username: schema.users.username, kind: schema.users.kind, status: schema.users.status, totp: schema.users.totpEnabledAt, lastLoginAt: schema.users.lastLoginAt, role: schema.roles.name })
    .from(schema.users)
    .leftJoin(schema.userRoles, eq(schema.userRoles.userId, schema.users.id))
    .leftJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
    .orderBy(asc(schema.users.name));

  const users = [...rows.reduce((m, r) => {
    const u = m.get(r.id) ?? { ...r, roles: [] as string[] };
    if (r.role) u.roles.push(r.role);
    return m.set(r.id, u);
  }, new Map<string, (typeof rows)[number] & { roles: string[] }>()).values()];

  return (
    <>
      <PageHeader
        title={tr("Users")}
        description={tr("Staff, school, parent and student accounts.")}
        actions={can(user, "users.manage") && (
          <Link href="/admin/users/new" className={buttonClass("primary", "md")}><Plus className="size-4" aria-hidden />{" "}{tr("Add staff member")}</Link>
        )}
      />
      <Card>
        {users.length === 0 ? (
          <EmptyState title={tr("No users yet")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60">
                <tr><th className={th}>{tr("Name")}</th><th className={th}>{tr("Roles")}</th><th className={th}>{tr("Status")}</th><th className={th}>{tr("Two-step")}</th><th className={th}>{tr("Last sign-in")}</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50">
                    <td className={td}>
                      <Link href={`/admin/users/${u.id}`} className="font-semibold text-navy-900 hover:underline">{u.name}</Link>
                      <p className="text-xs text-muted">{u.email ?? u.username}</p>
                    </td>
                    <td className={`${td} text-muted`}>{u.roles.join(", ") || "—"}</td>
                    <td className={td}>{u.status === "active" ? <Pill tone="green">{tr("Active")}</Pill> : u.status === "disabled" ? <Pill tone="red">{tr("Disabled")}</Pill> : <Pill tone="amber">{tr("Pending")}</Pill>}</td>
                    <td className={td}>{u.totp ? <Pill tone="green">{tr("On")}</Pill> : <Pill tone={u.kind === "staff" ? "amber" : "grey"}>{u.kind === "staff" ? tr("Not set up") : tr("Off")}</Pill>}</td>
                    <td className={`${td} text-muted`}>{u.lastLoginAt ? <DateTime value={u.lastLoginAt} /> : tr("Never")}</td>
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
