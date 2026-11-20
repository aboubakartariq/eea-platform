"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import type { FormState } from "@/lib/auth/actions";
import { keepValues } from "@/lib/form-values";
import { audit } from "@/lib/server/audit";

const PLACEHOLDERS = ["{name}", "{school}", "{award}", "{competition}", "{year}", "{grade}"];

export async function saveTemplateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("certificates.manage");
  const competitionId = String(formData.get("competitionId"));
  if (!z.string().uuid().safeParse(competitionId).success) return { error: "Competition not found." };
  const heading = String(formData.get("heading") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const fe: Record<string, string> = {};
  if (heading.length < 3 || heading.length > 80) fe.heading = "A heading of 3 to 80 characters, e.g. Certificate.";
  if (body.length < 10 || body.length > 600) fe.body = "Write the wording (10 to 600 characters).";
  else if (!body.includes("{name}")) fe.body = "The wording must include {name}.";
  else {
    const unknown = (body.match(/\{[a-z]+\}/g) ?? []).filter((p) => !PLACEHOLDERS.includes(p));
    if (unknown.length) fe.body = `Unknown placeholder ${unknown[0]}. Use ${PLACEHOLDERS.join(", ")}.`;
  }
  const signatories = [0, 1, 2]
    .map((i) => ({ name: String(formData.get(`sigName${i}`) ?? "").trim().slice(0, 80), title: String(formData.get(`sigTitle${i}`) ?? "").trim().slice(0, 80) }))
    .filter((s) => s.name || s.title);
  if (Object.keys(fe).length) return { values: keepValues(formData), error: "Please fix the highlighted fields.", fieldErrors: fe };
  await db
    .insert(schema.certificateTemplates)
    .values({ competitionId, heading, body, signatories, updatedBy: actor.id })
    .onConflictDoUpdate({ target: schema.certificateTemplates.competitionId, set: { heading, body, signatories, updatedBy: actor.id, updatedAt: new Date() } });
  await audit({ actorUserId: actor.id, action: "certificate_template.saved", entityType: "competition", entityId: competitionId, after: { heading, body, signatories } });
  revalidatePath("/admin/certificates");
  return { ok: "Saved. Certificates show the new wording straight away, including ones already issued." };
}

export async function revokeCertificateAction(_prev: { error?: string; ok?: string } | undefined, formData: FormData) {
  const actor = await assertPermission("certificates.manage");
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  if (!z.string().uuid().safeParse(id).success) return { error: "Certificate not found." };
  if (reason.length < 5) return { error: "Give a reason for revoking." };
  const done = await db.update(schema.certificates).set({ revokedAt: new Date(), revokedReason: reason, revokedBy: actor.id }).where(and(eq(schema.certificates.id, id), isNull(schema.certificates.revokedAt))).returning({ serial: schema.certificates.serial });
  if (!done.length) return { error: "Already revoked." };
  await audit({ actorUserId: actor.id, action: "certificate.revoked", entityType: "certificate", entityId: id, after: { serial: done[0].serial, reason } });
  revalidatePath("/admin/certificates");
  return { ok: `Certificate ${done[0].serial} revoked. Its verification page now says so.` };
}
