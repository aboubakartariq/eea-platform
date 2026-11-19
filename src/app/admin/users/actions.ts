"use server";

import { keepValues, type FormValues } from "@/lib/form-values";
import { revalidatePath } from "next/cache";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { hashPassword, temporaryPassword } from "@/lib/auth/password";
import { destroyUserSessions } from "@/lib/auth/session";
import { audit } from "@/lib/server/audit";
import type { FormState } from "@/lib/auth/actions";

export type UserFormState = ({ values?: FormValues; error?: string; fieldErrors?: Record<string, string>; ok?: string; tempPassword?: string }) | undefined;

/** Only global (staff) roles can be assigned here; school and family roles are given through the portals. */
async function staffRoles(ids: string[]) {
  if (!ids.length) return [];
  return db.select().from(schema.roles).where(and(inArray(schema.roles.id, ids), eq(schema.roles.scope, "global")));
}

async function activeSuperAdminCount(excludingUserId?: string) {
  const [row] = await db
    .select({ n: count() })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
    .innerJoin(schema.users, eq(schema.users.id, schema.userRoles.userId))
    .where(and(eq(schema.roles.key, "super_admin"), eq(schema.users.status, "active"), excludingUserId ? sql`${schema.users.id} <> ${excludingUserId}` : undefined));
  return row.n;
}

const isSuperAdmin = (actor: Awaited<ReturnType<typeof assertPermission>>) => actor.roles.some((r) => r.key === "super_admin");

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter the person's full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  roleIds: z.array(z.string().uuid()).min(1, "Choose at least one role."),
});

export async function createStaffUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await assertPermission("users.manage");
  const parsed = createSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone") ?? "", roleIds: formData.getAll("roleIds") });
  if (!parsed.success) return { values: keepValues(formData), fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const { name, email, phone, roleIds } = parsed.data;

  const roles = await staffRoles(roleIds);
  if (roles.length !== roleIds.length) return { values: keepValues(formData), error: "One of the chosen roles can't be given to staff." };
  if (roles.some((r) => r.key === "super_admin") && !isSuperAdmin(actor)) return { values: keepValues(formData), error: "Only a Super Administrator can create another Super Administrator." };

  const exists = await db.query.users.findFirst({ where: sql`lower(${schema.users.email}) = ${email}` });
  if (exists) return { values: keepValues(formData), fieldErrors: { email: "A user with this email already exists." } };

  const tempPassword = temporaryPassword();
  const user = await db.transaction(async (tx) => {
    const [u] = await tx.insert(schema.users).values({ name, email, phone: phone || null, kind: "staff", passwordHash: await hashPassword(tempPassword), mustChangePassword: true }).returning();
    await tx.insert(schema.userRoles).values(roles.map((r) => ({ userId: u.id, roleId: r.id })));
    return u;
  });
  await audit({ actorUserId: actor.id, action: "user.created", entityType: "user", entityId: user.id, after: { name, email, roles: roles.map((r) => r.key) } });
  revalidatePath("/admin/users");
  return { ok: `${name} can now sign in with ${email}.`, tempPassword };
}

export async function updateUserRolesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("users.manage");
  const userId = z.string().uuid().parse(formData.get("userId"));
  const roleIds = z.array(z.string().uuid()).parse(formData.getAll("roleIds"));
  const target = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!target || target.kind !== "staff") return { values: keepValues(formData), error: "Staff user not found." };

  const current = await db
    .select({ id: schema.roles.id, key: schema.roles.key })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
    .where(and(eq(schema.userRoles.userId, userId), eq(schema.roles.scope, "global")));
  const next = await staffRoles(roleIds);
  if (next.length !== roleIds.length) return { values: keepValues(formData), error: "One of the chosen roles can't be given to staff." };
  if (next.length === 0) return { values: keepValues(formData), error: "A staff member needs at least one role. Disable the account instead." };

  const hadSuper = current.some((r) => r.key === "super_admin");
  const willHaveSuper = next.some((r) => r.key === "super_admin");
  if (hadSuper !== willHaveSuper && !isSuperAdmin(actor)) return { values: keepValues(formData), error: "Only a Super Administrator can add or remove the Super Administrator role." };
  if (hadSuper && !willHaveSuper && (await activeSuperAdminCount(userId)) === 0) return { values: keepValues(formData), error: "This is the last Super Administrator. Make someone else Super Administrator first." };

  await db.transaction(async (tx) => {
    if (current.length) await tx.delete(schema.userRoles).where(and(eq(schema.userRoles.userId, userId), inArray(schema.userRoles.roleId, current.map((r) => r.id))));
    await tx.insert(schema.userRoles).values(next.map((r) => ({ userId, roleId: r.id })));
  });
  await audit({ actorUserId: actor.id, action: "user.roles_changed", entityType: "user", entityId: userId, before: { roles: current.map((r) => r.key) }, after: { roles: next.map((r) => r.key) } });
  revalidatePath(`/admin/users/${userId}`);
  return { ok: "Roles saved. They apply the next time this person loads a page." };
}

export async function setUserStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("users.manage");
  const userId = z.string().uuid().parse(formData.get("userId"));
  const status = z.enum(["active", "disabled"]).parse(formData.get("status"));
  if (userId === actor.id) return { values: keepValues(formData), error: "You can't disable your own account." };
  const target = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!target) return { values: keepValues(formData), error: "User not found." };

  if (status === "disabled") {
    const targetIsSuper = (await db.select({ k: schema.roles.key }).from(schema.userRoles).innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId)).where(eq(schema.userRoles.userId, userId))).some((r) => r.k === "super_admin");
    if (targetIsSuper && !isSuperAdmin(actor)) return { values: keepValues(formData), error: "Only a Super Administrator can disable a Super Administrator." };
    if (targetIsSuper && (await activeSuperAdminCount(userId)) === 0) return { values: keepValues(formData), error: "This is the last Super Administrator and can't be disabled." };
  }
  await db.update(schema.users).set({ status }).where(eq(schema.users.id, userId));
  if (status === "disabled") await destroyUserSessions(userId);
  await audit({ actorUserId: actor.id, action: status === "disabled" ? "user.disabled" : "user.enabled", entityType: "user", entityId: userId, before: { status: target.status }, after: { status } });
  revalidatePath(`/admin/users/${userId}`);
  return { ok: status === "disabled" ? "Account disabled and signed out everywhere." : "Account re-enabled." };
}

export async function resetPasswordAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await assertPermission("users.manage");
  const userId = z.string().uuid().parse(formData.get("userId"));
  if (userId === actor.id) return { values: keepValues(formData), error: "Change your own password from your account page." };
  const target = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!target) return { values: keepValues(formData), error: "User not found." };
  const tempPassword = temporaryPassword();
  await db.update(schema.users).set({ passwordHash: await hashPassword(tempPassword), mustChangePassword: true, failedLoginCount: 0, lockedUntil: null }).where(eq(schema.users.id, userId));
  await destroyUserSessions(userId);
  await audit({ actorUserId: actor.id, action: "user.password_reset", entityType: "user", entityId: userId });
  return { ok: "Password reset. Give the person this temporary password; they must change it when they sign in.", tempPassword };
}

export async function resetTwoFactorAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("users.manage");
  const userId = z.string().uuid().parse(formData.get("userId"));
  if (userId === actor.id) return { values: keepValues(formData), error: "Ask another administrator to reset your own two-step verification." };
  await db.update(schema.users).set({ totpSecretEnc: null, totpEnabledAt: null, totpLastStep: null }).where(eq(schema.users.id, userId));
  await destroyUserSessions(userId);
  await audit({ actorUserId: actor.id, action: "user.2fa_reset", entityType: "user", entityId: userId });
  revalidatePath(`/admin/users/${userId}`);
  return { ok: "Two-step verification reset. The person will set it up again at their next sign-in." };
}
