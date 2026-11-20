"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import type { FormState } from "@/lib/auth/actions";
import { keepValues } from "@/lib/form-values";
import { audit } from "@/lib/server/audit";
import { issueRollNumbers } from "@/lib/server/entries";

const paymentSchema = z.object({
  id: z.string().uuid(),
  method: z.enum(["bank_transfer", "cash", "cheque"], { message: "Choose how it was paid." }),
  reference: z.string().trim().min(3, "Enter the bank reference, receipt or cheque number.").max(80),
  amountPkr: z.coerce.number({ message: "Enter the amount received." }).int("Whole rupees only.").positive("Enter the amount received."),
  receivedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date it was received."),
});

/** Finance staff record a payment received outside the website and confirm the registration. */
export async function recordPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("finance.manage");
  const parsed = paymentSchema.safeParse(Object.fromEntries(["id", "method", "reference", "amountPkr", "receivedOn"].map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { values: keepValues(formData), error: "Please fix the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const v = parsed.data;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  if (v.receivedOn > today) return { values: keepValues(formData), fieldErrors: { receivedOn: "The date can't be in the future." } };
  const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, v.id) });
  if (!reg) return { error: "Registration not found." };
  if (reg.status !== "pending_payment") return { error: "This registration is not waiting for payment." };
  if (v.amountPkr !== reg.totalPkr) return { values: keepValues(formData), fieldErrors: { amountPkr: `The amount due is PKR ${reg.totalPkr.toLocaleString("en-PK")}. Part payments can't be recorded yet.` } };
  const ok = await db.transaction(async (tx) => {
    const done = await tx.update(schema.registrations).set({ status: "confirmed" }).where(and(eq(schema.registrations.id, reg.id), eq(schema.registrations.status, "pending_payment"))).returning({ id: schema.registrations.id });
    if (!done.length) return false;
    await tx.insert(schema.manualPayments).values({ registrationId: reg.id, method: v.method, reference: v.reference, amountPkr: v.amountPkr, receivedOn: v.receivedOn, recordedBy: actor.id });
    await issueRollNumbers(tx, reg.id);
    return true;
  });
  if (!ok) return { error: "Someone else updated this registration just now. Reload the page." };
  await audit({ actorUserId: actor.id, action: "payment.recorded", entityType: "registration", entityId: reg.id, before: { status: reg.status }, after: { status: "confirmed", method: v.method, reference: v.reference, amountPkr: v.amountPkr, receivedOn: v.receivedOn } });
  revalidatePath(`/admin/registrations/${reg.id}`);
  revalidatePath("/admin/registrations");
  redirect(`/admin/registrations/${reg.id}?paid=1`);
}
