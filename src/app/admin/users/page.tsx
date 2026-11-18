import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { buttonClass } from "@/components/ui/button";
import { Card, DateTime, EmptyState, PageHeader, Pill, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await requirePermission("users.view");
  const rows = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, kind: schema.users.kind, status: schema.users.status, totp: schema.users.totpEnabledAt, lastLoginAt: schema.users.lastLoginAt, role: schema.roles.name })
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
        title="Users"
        description="Staff accounts and their roles. School, student and parent accounts appear here once the portals open."
        actions={can(user, "users.manage") && (
          <Link href="/admin/users/new" className={buttonClass("primary", "md")}><Plus className="size-4" aria-hidden /> Add staff member</Link>
        )}
      />
      <Card>
        {users.length === 0 ? (
          <EmptyState title="No users yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60">
                <tr><th className={th}>Name</th><th className={th}>Roles</th><th className={th}>Status</th><th className={th}>Two-step</th><th className={th}>Last sign-in</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50">
                    <td className={td}>
                      <Link href={`/admin/users/${u.id}`} className="font-semibold text-navy-900 hover:underline">{u.name}</Link>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className={`${td} text-muted`}>{u.roles.join(", ") || "—"}</td>
                    <td className={td}>{u.status === "active" ? <Pill tone="green">Active</Pill> : u.status === "disabled" ? <Pill tone="red">Disabled</Pill> : <Pill tone="amber">Pending</Pill>}</td>
                    <td className={td}>{u.totp ? <Pill tone="green">On</Pill> : <Pill tone={u.kind === "staff" ? "amber" : "grey"}>{u.kind === "staff" ? "Not set up" : "Off"}</Pill>}</td>
                    <td className={`${td} text-muted`}>{u.lastLoginAt ? <DateTime value={u.lastLoginAt} /> : "Never"}</td>
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
