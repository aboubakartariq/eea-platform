"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import type { AwardRule } from "@/db/schema";
import { assertPermission } from "@/lib/auth/dal";
import { validateRules } from "@/lib/results/rank";
import { audit } from "@/lib/server/audit";
import { issueRollNumbers } from "@/lib/server/entries";
import { readAnswerSheet } from "@/lib/server/excel";
import { calculateResults, importAnswerSheets, publishResults, withdrawResults } from "@/lib/server/results";

type Simple = { error?: string; ok?: string } | undefined;
const uuid = z.string().uuid();

function readRules(formData: FormData): { rules: AwardRule[]; error?: string } {
  const rules: AwardRule[] = [];
  for (let i = 0; i < 8; i++) {
    const label = String(formData.get(`awLabel${i}`) ?? "").trim();
    if (!label) continue;
    const kind = String(formData.get(`awKind${i}`));
    const type = String(formData.get(`awType${i}`));
    const value = Number(formData.get(`awValue${i}`));
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24) || `award_${i}`;
    const rule: AwardRule["rule"] = type === "rank" ? { type, max: value } : type === "top_percent" || type === "min_percent" ? { type, value } : { type: "all" };
    rules.push({ key: /^[a-z]/.test(key) ? key : `a_${key}`.slice(0, 24), label, kind: kind === "medal" || kind === "merit" ? kind : "participation", rule });
  }
  return { rules, error: validateRules(rules) ?? undefined };
}

export async function calculateAction(_prev: Simple, formData: FormData): Promise<Simple> {
  const actor = await assertPermission("results.manage");
  const competitionId = String(formData.get("competitionId"));
  if (!uuid.safeParse(competitionId).success) return { error: "Competition not found." };
  const { rules, error } = readRules(formData);
  if (error) return { error };
  const r = await calculateResults(competitionId, rules, actor.id);
  if (!r.ok) return { error: r.error };
  await audit({ actorUserId: actor.id, action: "results.calculated", entityType: "result_set", entityId: r.setId, after: { competitionId, count: r.count, absent: r.absent, rules } });
  revalidatePath(`/admin/results/${competitionId}`);
  return { ok: r.missingSheets ? `Calculated ${r.count} results (${r.absent} absent). Paper entrants with no answer sheet yet, shown as absent: ${r.missingSheets}. Check them, then ask a second person to approve.` : `Calculated ${r.count} results (${r.absent} absent). Check them, then ask a second person to approve.` };
}

export async function resultSetAction(_prev: Simple, formData: FormData): Promise<Simple> {
  const op = String(formData.get("op"));
  const setId = String(formData.get("setId"));
  if (!uuid.safeParse(setId).success) return { error: "Results not found." };
  const actor = await assertPermission(op === "approve" ? "results.approve" : "results.publish");
  const set = await db.query.resultSets.findFirst({ where: eq(schema.resultSets.id, setId) });
  if (!set) return { error: "Results not found." };
  const path = `/admin/results/${set.competitionId}`;

  if (op === "approve") {
    if (set.status !== "draft") return { error: "Only draft results can be approved." };
    if (set.calculatedBy === actor.id) return { error: "You calculated these results, so someone else must approve them." };
    const done = await db.update(schema.resultSets).set({ status: "approved", approvedBy: actor.id, approvedAt: new Date() }).where(and(eq(schema.resultSets.id, setId), eq(schema.resultSets.status, "draft"))).returning({ id: schema.resultSets.id });
    if (!done.length) return { error: "These results changed just now. Reload the page." };
    await audit({ actorUserId: actor.id, action: "results.approved", entityType: "result_set", entityId: setId });
    revalidatePath(path);
    return { ok: "Approved. They can now be published." };
  }
  if (op === "publish") {
    const when = String(formData.get("when") ?? "now");
    let publishAt = new Date();
    if (when === "later") {
      const local = String(formData.get("publishAt") ?? "");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return { error: "Choose the date and time to publish." };
      publishAt = new Date(`${local}:00+05:00`);
      if (publishAt.getTime() < Date.now()) return { error: "The publishing time is in the past. Choose a later time or publish now." };
    }
    const r = await publishResults(setId, publishAt, actor.id);
    if (!r.ok) return { error: r.error };
    await audit({ actorUserId: actor.id, action: "results.published", entityType: "result_set", entityId: setId, after: { publishAt, certificates: r.certificates, dispatches: r.dispatches } });
    revalidatePath(path);
    const done = `Certificates issued: ${r.certificates}. Award parcels to send: ${r.dispatches}.`;
    return { ok: when === "later" ? `Scheduled. ${done}` : `Published. ${done}` };
  }
  if (op === "withdraw") {
    const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
    if (reason.length < 5) return { error: "Explain why the results are being withdrawn." };
    const r = await withdrawResults(setId, reason, actor.id);
    if (!r.ok) return { error: r.error };
    await audit({ actorUserId: actor.id, action: "results.withdrawn", entityType: "result_set", entityId: setId, after: { reason, certificatesRevoked: r.revoked } });
    revalidatePath(path);
    return { ok: `Withdrawn. Certificates revoked: ${r.revoked}. Recalculate when the correction is made.` };
  }
  return { error: "Unknown action." };
}

export type SheetImportState = { error?: string; ok?: string; rowErrors?: { row: number; errors: string[] }[] } | undefined;

export async function importSheetsAction(_prev: SheetImportState, formData: FormData): Promise<SheetImportState> {
  const actor = await assertPermission("results.manage");
  const paperId = String(formData.get("paperId"));
  if (!uuid.safeParse(paperId).success) return { error: "Choose a paper." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the filled-in Excel file." };
  if (file.size > 3 * 1024 * 1024 || !/\.xlsx$/i.test(file.name)) return { error: "Upload an Excel .xlsx file under 3 MB." };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paperId));
  let sheet: Awaited<ReturnType<typeof readAnswerSheet>>;
  try {
    sheet = await readAnswerSheet(await file.arrayBuffer(), n);
  } catch {
    return { error: "This file couldn't be read as an Excel workbook." };
  }
  if ("error" in sheet) return { error: sheet.error };
  const r = await importAnswerSheets(paperId, sheet.rows, actor.id);
  if (!r.ok) return { error: r.error, rowErrors: r.rowErrors };
  await audit({ actorUserId: actor.id, action: "answer_sheets.imported", entityType: "paper", entityId: paperId, after: { file: file.name.slice(0, 200), saved: r.saved, absent: r.absent } });
  revalidatePath("/admin/results/answer-sheets");
  return { ok: `Marked and saved ${r.saved} answer sheets (${r.absent} absent).` };
}

/** Back-fills roll numbers for confirmed registrations that don't have them. */
export async function issueRollNumbersAction(_prev: Simple, _formData: FormData): Promise<Simple> {
  const actor = await assertPermission("results.manage");
  const regs = await db
    .selectDistinct({ id: schema.registrations.id })
    .from(schema.registrations)
    .innerJoin(schema.registrationItems, eq(schema.registrationItems.registrationId, schema.registrations.id))
    .where(and(eq(schema.registrations.status, "confirmed"), isNull(schema.registrationItems.rollNumber)));
  let n = 0;
  for (const r of regs) n += await issueRollNumbers(db, r.id);
  if (n) await audit({ actorUserId: actor.id, action: "roll_numbers.issued", after: { count: n } });
  revalidatePath("/admin/results");
  return { ok: n ? `Issued ${n} roll numbers.` : "Every confirmed student already has a roll number." };
}
