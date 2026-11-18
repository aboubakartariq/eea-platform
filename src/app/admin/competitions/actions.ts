"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission, can } from "@/lib/auth/dal";
import { COMPETITIONS_TAG } from "@/lib/competitions";
import { competitionSchema, parseContent, slugify } from "@/lib/competition-form";
import { audit } from "@/lib/server/audit";
import type { FormState } from "@/lib/auth/actions";

const TEXT_FIELDS = ["overview", "objectives", "eligibility", "format", "syllabus", "rules", "awards", "faqs"];

export async function saveCompetitionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await assertPermission("competitions.manage");
  const id = formData.get("id") ? z.string().uuid().parse(formData.get("id")) : null;
  const raw = Object.fromEntries(
    ["name", "slug", "code", "kind", "accent", "icon", "summary", "gradeFrom", "gradeTo", "levels", "durationMinutes", "feePkr", "registrationCloses", "examDate", "status", "sortOrder"].map((k) => [k, formData.get(k) ?? ""]),
  );
  const parsed = competitionSchema.safeParse({ ...raw, modes: formData.getAll("modes") });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const v = parsed.data;
  const content = parseContent(Object.fromEntries(TEXT_FIELDS.map((k) => [k, String(formData.get(k) ?? "")])));
  const slug = slugify(v.slug || v.name);
  if (!slug) return { fieldErrors: { slug: "Enter a web address name." } };

  const before = id ? await db.query.competitions.findFirst({ where: eq(schema.competitions.id, id) }) : null;
  if (id && !before) return { error: "Competition not found." };
  if (v.status !== (before?.status ?? "draft") && !can(actor, "competitions.publish")) {
    return { fieldErrors: { status: "You can save drafts, but publishing or archiving needs the publish permission." } };
  }
  const clash = await db.query.competitions.findFirst({ where: and(eq(schema.competitions.slug, slug), id ? ne(schema.competitions.id, id) : undefined) });
  if (clash) return { fieldErrors: { slug: "Another competition already uses this web address." } };
  const codeClash = await db.query.competitions.findFirst({ where: and(eq(schema.competitions.code, v.code), id ? ne(schema.competitions.id, id) : undefined) });
  if (codeClash) return { fieldErrors: { code: "Another competition already uses this code." } };

  const values = { ...v, slug, content };
  let savedId = id;
  if (id) {
    await db.update(schema.competitions).set(values).where(eq(schema.competitions.id, id));
  } else {
    const [row] = await db.insert(schema.competitions).values(values).returning({ id: schema.competitions.id });
    savedId = row.id;
  }
  const summaryAfter = { name: v.name, status: v.status, gradeFrom: v.gradeFrom, gradeTo: v.gradeTo, feePkr: v.feePkr, examDate: v.examDate, registrationCloses: v.registrationCloses };
  const summaryBefore = before ? { name: before.name, status: before.status, gradeFrom: before.gradeFrom, gradeTo: before.gradeTo, feePkr: before.feePkr, examDate: before.examDate, registrationCloses: before.registrationCloses } : null;
  await audit({ actorUserId: actor.id, action: id ? "competition.updated" : "competition.created", entityType: "competition", entityId: savedId!, before: summaryBefore, after: summaryAfter });
  updateTag(COMPETITIONS_TAG);
  if (!id) redirect(`/admin/competitions/${savedId}?saved=1`);
  return { ok: "Saved. The public website shows the change straight away." };
}
