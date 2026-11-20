import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { Card, PageHeader, Pill, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage() {
  await requirePermission("roles.manage");
  const roles = await db.select().from(schema.roles).orderBy(schema.roles.name);
  const perms = await db.select({ roleId: schema.rolePermissions.roleId, n: count() }).from(schema.rolePermissions).groupBy(schema.rolePermissions.roleId);
  const members = await db.select({ roleId: schema.userRoles.roleId, n: count() }).from(schema.userRoles).innerJoin(schema.users, eq(schema.users.id, schema.userRoles.userId)).where(eq(schema.users.status, "active")).groupBy(schema.userRoles.roleId);
  const pn = new Map(perms.map((p) => [p.roleId, p.n]));
  const mn = new Map(members.map((m) => [m.roleId, m.n]));
  const scopeLabel = { global: "Staff", school: "School", self: "Family" } as Record<string, string>;

  return (
    <>
      <PageHeader title="Roles" description="Each role is a set of permissions. Change what a role can do, and everyone with that role is updated." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Role</th><th className={th}>Type</th><th className={th}>Permissions</th><th className={th}>Active users</th></tr></thead>
            <tbody className="divide-y divide-line">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-surface/50">
                  <td className={td}>
                    <Link href={`/admin/roles/${r.id}`} className="font-semibold text-navy-900 hover:underline">{r.name}</Link>
                    <p className="text-xs text-muted">{r.description}</p>
                  </td>
                  <td className={td}><Pill tone={r.scope === "global" ? "blue" : "grey"}>{scopeLabel[r.scope]}</Pill></td>
                  <td className={`${td} tabular-nums`}>{pn.get(r.id) ?? 0}</td>
                  <td className={`${td} tabular-nums`}>{mn.get(r.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
