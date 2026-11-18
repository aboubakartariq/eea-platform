import { z } from "zod";
import type { CompetitionContent } from "@/db/schema";

/**
 * Converts the admin competition form (plain text areas, one item per line)
 * to and from the structured competition content. Pure functions, unit-tested.
 */

const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const pairs = (s: string) =>
  lines(s).flatMap((l) => {
    const i = l.indexOf(":");
    if (i < 1) return [];
    const a = l.slice(0, i).trim();
    const b = l.slice(i + 1).trim();
    return a && b ? [[a, b] as const] : [];
  });

export function parseContent(f: Record<string, string>): CompetitionContent {
  const faqs: { q: string; a: string }[] = [];
  let q: string | null = null;
  for (const l of lines(f.faqs ?? "")) {
    if (/^q[:.]/i.test(l)) q = l.slice(2).trim();
    else if (/^a[:.]/i.test(l) && q) {
      faqs.push({ q, a: l.slice(2).trim() });
      q = null;
    }
  }
  return {
    overview: (f.overview ?? "").trim() || undefined,
    objectives: lines(f.objectives ?? ""),
    eligibility: lines(f.eligibility ?? ""),
    format: pairs(f.format ?? "").map(([label, value]) => ({ label, value })),
    syllabus: pairs(f.syllabus ?? "").map(([band, topics]) => ({ band, topics: topics.split(";").map((t) => t.trim()).filter(Boolean) })),
    rules: lines(f.rules ?? ""),
    awards: pairs(f.awards ?? "").map(([title, detail]) => ({ title, detail })),
    faqs,
  };
}

export function contentToForm(c: CompetitionContent) {
  return {
    overview: c.overview ?? "",
    objectives: (c.objectives ?? []).join("\n"),
    eligibility: (c.eligibility ?? []).join("\n"),
    format: (c.format ?? []).map((x) => `${x.label}: ${x.value}`).join("\n"),
    syllabus: (c.syllabus ?? []).map((x) => `${x.band}: ${x.topics.join("; ")}`).join("\n"),
    rules: (c.rules ?? []).join("\n"),
    awards: (c.awards ?? []).map((x) => `${x.title}: ${x.detail}`).join("\n"),
    faqs: (c.faqs ?? []).map((x) => `Q: ${x.q}\nA: ${x.a}`).join("\n"),
  };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(min).max(max).nullable());
const optDate = z.preprocess((v) => (v === "" || v == null ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.").nullable());

export const competitionSchema = z
  .object({
    name: z.string().trim().min(3, "Enter the competition name.").max(120),
    slug: z.string().trim().max(80).optional(),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,8}$/, "2–8 capital letters or digits, e.g. MMO."),
    kind: z.enum(["olympiad", "activity"]),
    accent: z.enum(["blue", "gold", "magenta", "navy"]),
    icon: z.enum(["sigma", "flask", "book", "spell", "palette", "globe", "brain"]),
    summary: z.string().trim().min(10, "Write a one-line summary.").max(240),
    gradeFrom: optInt(0, 12),
    gradeTo: optInt(0, 12),
    modes: z.array(z.enum(["online", "paper"])).min(1, "Choose at least one exam mode."),
    levels: z.coerce.number().int().min(1).max(3),
    durationMinutes: optInt(10, 300),
    feePkr: optInt(0, 1_000_000),
    registrationCloses: optDate,
    examDate: optDate,
    status: z.enum(["draft", "published", "archived"]),
    sortOrder: z.coerce.number().int().min(0).max(999),
  })
  .refine((v) => v.gradeFrom == null || v.gradeTo == null || v.gradeFrom <= v.gradeTo, { message: "The first grade must not be after the last grade.", path: ["gradeTo"] })
  .refine((v) => (v.gradeFrom == null) === (v.gradeTo == null), { message: "Set both the first and last grade, or neither.", path: ["gradeTo"] })
  .refine((v) => !v.registrationCloses || !v.examDate || v.registrationCloses <= v.examDate, { message: "Registration must close on or before the exam date.", path: ["registrationCloses"] });

export type CompetitionInput = z.infer<typeof competitionSchema>;
