"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { audit } from "@/lib/server/audit";

export async function setEnquiryStatusAction(formData: FormData) {
  const actor = await assertPermission("enquiries.manage");
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(["new", "in_progress", "closed"]).parse(formData.get("status"));
  const [before] = await db.select({ status: schema.contactEnquiries.status }).from(schema.contactEnquiries).where(eq(schema.contactEnquiries.id, id));
  if (!before) return;
  await db.update(schema.contactEnquiries).set({ status }).where(eq(schema.contactEnquiries.id, id));
  await audit({ actorUserId: actor.id, action: "enquiry.status_changed", entityType: "enquiry", entityId: id, before, after: { status } });
  revalidatePath("/admin/enquiries");
}
