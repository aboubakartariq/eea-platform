"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { audit } from "@/lib/server/audit";

const input = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "packed", "dispatched", "delivered"]),
  address: z.string().trim().max(400),
  courier: z.string().trim().max(60),
  tracking: z.string().trim().max(80),
});

export async function updateDispatchAction(_prev: { error?: string; ok?: string } | undefined, formData: FormData) {
  const actor = await assertPermission("awards.manage");
  const p = input.safeParse(Object.fromEntries(["id", "status", "address", "courier", "tracking"].map((k) => [k, formData.get(k) ?? ""])));
  if (!p.success) return { error: "Check the details and try again." };
  const v = p.data;
  if ((v.status === "dispatched" || v.status === "delivered") && (!v.courier || !v.tracking || !v.address)) return { error: "Enter the address, courier and tracking number before marking it dispatched." };
  const before = await db.query.awardDispatches.findFirst({ where: eq(schema.awardDispatches.id, v.id) });
  if (!before) return { error: "Not found." };
  const now = new Date();
  await db
    .update(schema.awardDispatches)
    .set({
      status: v.status, address: v.address || null, courier: v.courier || null, tracking: v.tracking || null, updatedBy: actor.id,
      dispatchedAt: v.status === "dispatched" || v.status === "delivered" ? before.dispatchedAt ?? now : null,
      deliveredAt: v.status === "delivered" ? before.deliveredAt ?? now : null,
    })
    .where(eq(schema.awardDispatches.id, v.id));
  await audit({ actorUserId: actor.id, action: "award_dispatch.updated", entityType: "award_dispatch", entityId: v.id, before: { status: before.status }, after: { status: v.status, courier: v.courier, tracking: v.tracking } });
  revalidatePath("/admin/awards");
  return { ok: "Saved." };
}
