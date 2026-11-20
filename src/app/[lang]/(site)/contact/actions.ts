"use server";

import { localizeState } from "@/i18n/server";
import { keepValues, type FormValues } from "@/lib/form-values";
import { z } from "zod";
import { db, schema } from "@/db";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestInfo } from "@/lib/server/request";

export type ContactState = { values?: FormValues; ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(32).regex(/^[+0-9 ()-]*$/, "Use digits only.").optional().or(z.literal("")),
  audience: z.enum(["parent", "school", "student", "other"], { message: "Choose who you are." }),
  subject: z.string().trim().min(3, "Add a short subject.").max(160),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(4000),
});

async function run(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real visitors never fill this hidden field.
  if (String(formData.get("website") ?? "").length > 0) return { ok: true };

  const parsed = contactSchema.safeParse(Object.fromEntries(["name", "email", "phone", "audience", "subject", "message"].map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { values: keepValues(formData), fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };

  const { ip } = await requestInfo();
  if (!(await rateLimit(`contact:${ip ?? "unknown"}`, 5, 60 * 60))) {
    return { values: keepValues(formData), error: "You've sent several messages recently. Please try again in an hour." };
  }
  const d = parsed.data;
  const [row] = await db.insert(schema.contactEnquiries).values({ ...d, phone: d.phone || null, ip }).returning({ id: schema.contactEnquiries.id });
  await audit({ action: "enquiry.received", entityType: "enquiry", entityId: row.id });
  return { ok: true };
}

export async function submitContactAction(prev: ContactState, formData: FormData): Promise<ContactState> {
  return localizeState(await run(prev, formData), formData);
}
