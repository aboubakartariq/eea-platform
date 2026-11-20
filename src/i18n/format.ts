import { fill } from "./config";
import type { Dictionary } from "./dictionaries/en";

type Grades = { gradeFrom: number | null; gradeTo: number | null };

export const gradeText = (t: Dictionary, g: number) => (g === 0 ? t.grades.kg : fill(t.grades.grade, { n: g }));

export function gradesText(t: Dictionary, c: Grades) {
  if (c.gradeFrom == null || c.gradeTo == null) return t.grades.tba;
  if (c.gradeFrom === c.gradeTo) return gradeText(t, c.gradeFrom);
  return c.gradeFrom === 0 ? fill(t.grades.kgRange, { to: c.gradeTo }) : fill(t.grades.range, { from: c.gradeFrom, to: c.gradeTo });
}

/** Just the numbers, for tight spaces: "1–8". */
export const gradesShort = (c: Grades) => (c.gradeFrom == null || c.gradeTo == null ? null : c.gradeFrom === c.gradeTo ? String(c.gradeFrom || "KG") : `${c.gradeFrom || "KG"}–${c.gradeTo}`);

export const modesText = (t: Dictionary, modes: string[]) => modes.map((m) => (m === "online" ? t.common.online : t.common.paper)).join(` ${t.common.or} `);

const at = (iso: string) => new Date(`${iso}T00:00:00+05:00`);
export const dateLong = (intl: string, iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" }).format(at(iso));
export const dateShort = (intl: string, iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", timeZone: "Asia/Karachi" }).format(at(iso));
export const pkr = (intl: string, amount: number) => `PKR ${amount.toLocaleString(intl.startsWith("ar") ? "en-PK" : intl)}`;

/** A competition's name and summary in the visitor's language, falling back to what staff entered. */
export function competitionText(t: Dictionary, c: { slug: string; name: string; summary: string }) {
  const tr = t.competitionNames[c.slug];
  return { name: tr?.name ?? c.name, summary: tr?.summary ?? c.summary };
}
