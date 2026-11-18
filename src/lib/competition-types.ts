import type { CompetitionContent } from "@/db/schema";

export type Accent = "gold" | "blue" | "magenta" | "navy";

/** A competition as the public website and portals see it. Missing details are null ("to be announced"). */
export type PublicCompetition = {
  id: string;
  slug: string;
  name: string;
  code: string;
  kind: "olympiad" | "activity";
  accent: Accent;
  icon: string;
  summary: string;
  gradeFrom: number | null;
  gradeTo: number | null;
  modes: string[];
  levels: number;
  durationMinutes: number | null;
  feePkr: number | null;
  registrationCloses: string | null;
  examDate: string | null;
  content: CompetitionContent;
};

export const gradeName = (g: number) => (g === 0 ? "KG" : `Grade ${g}`);

export function gradesLabel(c: Pick<PublicCompetition, "gradeFrom" | "gradeTo">) {
  if (c.gradeFrom == null || c.gradeTo == null) return "Grades to be announced";
  if (c.gradeFrom === c.gradeTo) return gradeName(c.gradeFrom);
  return c.gradeFrom === 0 ? `KG–Grade ${c.gradeTo}` : `Grades ${c.gradeFrom}–${c.gradeTo}`;
}

export const modesLabel = (modes: string[]) => modes.map((m) => (m === "online" ? "Online" : "Paper")).join(" or ");

/** All details needed before schools can register. */
export const isRegistrationReady = (c: PublicCompetition) =>
  c.gradeFrom != null && c.gradeTo != null && c.feePkr != null && c.examDate != null && c.registrationCloses != null && c.modes.length > 0;

export const isEligible = (c: Pick<PublicCompetition, "gradeFrom" | "gradeTo">, grade: number) =>
  c.gradeFrom != null && c.gradeTo != null && grade >= c.gradeFrom && grade <= c.gradeTo;
