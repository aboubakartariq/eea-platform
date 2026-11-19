export const statusTone = (s: string) => (s === "approved" ? "green" : s === "review" ? "blue" : s === "retired" ? "grey" : "amber") as "green" | "blue" | "grey" | "amber";
export const gradeShort = (g: number) => (g === 0 ? "KG" : String(g));
export const gradeRange = (a: number, b: number) => (a === b ? `Grade ${gradeShort(a)}` : `Grades ${gradeShort(a)}–${gradeShort(b)}`);
export const GRADE_OPTIONS = [{ v: "0", l: "KG" }, ...Array.from({ length: 12 }, (_, i) => ({ v: String(i + 1), l: `Grade ${i + 1}` }))];
export const BLUEPRINT_ROWS = 10;
