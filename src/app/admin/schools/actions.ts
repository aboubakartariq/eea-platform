"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { destroyUserSessions } from "@/lib/auth/session";
import { audit } from "@/lib/server/audit";
import type { FormState } from "@/lib/auth/actions";

const cityCode = async (city: string) => (city.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "PAK").padEnd(3, "X");

async function schoolUserIds(schoolId: string) {
  const rows = await db.select({ userId: schema.userRoles.userId }).from(schema.userRoles).where(eq(schema.userRoles.schoolId, schoolId));
  return [...new Set(rows.map((r) => r.userId))];
}

export async function reviewSchoolAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("schools.approve");
  const id = z.string().uuid().parse(formData.get("schoolId"));
  const decision = z.enum(["approve", "reject", "suspend", "reinstate"]).parse(formData.get("decision"));
  const school = await db.query.schools.findFirst({ where: eq(schema.schools.id, id) });
  if (!school) return { error: "School not found." };
  const users = await schoolUserIds(id);

  if (decision === "approve" || decision === "reinstate") {
    if (decision === "approve" && school.status !== "pending") return { error: "Only pending schools can be approved." };
    let code = school.code;
    if (!code) {
      const [{ n }] = await db.execute<{ n: string }>(sql`select nextval('school_code_seq')::text as n`).then((r) => r.rows);
      code = `EEA-${await cityCode(school.city)}-${n.padStart(5, "0")}`;
    }
    await db.transaction(async (tx) => {
      await tx.update(schema.schools).set({ status: "approved", code, approvedAt: school.approvedAt ?? new Date(), approvedBy: school.approvedBy ?? actor.id }).where(eq(schema.schools.id, id));
      if (users.length) await tx.update(schema.users).set({ status: "active" }).where(and(inArray(schema.users.id, users), sql`${schema.users.status} <> 'active'`));
    });
    await audit({ actorUserId: actor.id, action: decision === "approve" ? "school.approved" : "school.reinstated", entityType: "school", entityId: id, before: { status: school.status }, after: { status: "approved", code } });
    revalidatePath(`/admin/schools/${id}`);
    return { ok: decision === "approve" ? `Approved. School ID ${code}. The coordinator can now sign in.` : "School reinstated." };
  }

  const status = decision === "reject" ? "rejected" : "suspended";
  await db.transaction(async (tx) => {
    await tx.update(schema.schools).set({ status }).where(eq(schema.schools.id, id));
    if (users.length) await tx.update(schema.users).set({ status: "disabled" }).where(inArray(schema.users.id, users));
  });
  for (const u of users) await destroyUserSessions(u);
  await audit({ actorUserId: actor.id, action: `school.${status}`, entityType: "school", entityId: id, before: { status: school.status }, after: { status } });
  revalidatePath(`/admin/schools/${id}`);
  return { ok: status === "rejected" ? "Registration rejected. The coordinator account is disabled." : "School suspended and its users signed out." };
}
