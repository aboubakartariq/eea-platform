"use server";

import { keepValues } from "@/lib/form-values";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { audit } from "@/lib/server/audit";
import type { FormState } from "@/lib/auth/actions";

export async function updateRolePermissionsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("roles.manage");
  const roleId = z.string().uuid().parse(formData.get("roleId"));
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.id, roleId) });
  if (!role) return { values: keepValues(formData), error: "Role not found." };
  if (role.key === "super_admin") return { values: keepValues(formData), error: "The Super Administrator role always has every permission." };

  const requested = formData.getAll("permissions").map(String);
  if (requested.some((p) => !(p in PERMISSIONS))) return { values: keepValues(formData), error: "Unknown permission." };
  const portalOnly = role.scope !== "global";
  if (requested.some((p) => p.startsWith("portal.") !== portalOnly)) {
    return { values: keepValues(formData), error: portalOnly ? "School and family roles can only have portal permissions." : "Staff roles can't have portal permissions." };
  }

  const before = (await db.select({ p: schema.rolePermissions.permissionKey }).from(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId))).map((r) => r.p).sort();
  const after = [...new Set(requested)].sort();
  await db.transaction(async (tx) => {
    await tx.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
    if (after.length) await tx.insert(schema.rolePermissions).values(after.map((p) => ({ roleId, permissionKey: p })));
  });
  await audit({
    actorUserId: actor.id,
    action: "role.permissions_changed",
    entityType: "role",
    entityId: roleId,
    before: { added: [], removed: before.filter((p) => !after.includes(p)) },
    after: { added: after.filter((p) => !before.includes(p)), role: role.key },
  });
  revalidatePath(`/admin/roles/${roleId}`);
  return { ok: "Permissions saved. They apply the next time each user loads a page." };
}
