import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/admin/ui";
import { RolePermissionsForm } from "./role-form";

export const metadata: Metadata = { title: "Role" };

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("roles.manage");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.id, id) });
  if (!role) notFound();
  const current = (await db.select({ p: schema.rolePermissions.permissionKey }).from(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, id))).map((r) => r.p);

  const portal = role.scope !== "global";
  const groups = new Map<string, { key: string; description: string }[]>();
  for (const [key, v] of Object.entries(PERMISSIONS)) {
    if (key.startsWith("portal.") !== portal) continue;
    groups.set(v.module, [...(groups.get(v.module) ?? []), { key, description: v.description }]);
  }

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/roles" className="text-muted hover:text-navy-700">← Roles</Link></p>
      <PageHeader title={role.name} description={role.description} />
      <RolePermissionsForm roleId={role.id} locked={role.key === "super_admin"} groups={[...groups.entries()]} selected={current} />
    </>
  );
}
