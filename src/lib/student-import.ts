import { z } from "zod";

/**
 * Student Excel import: column mapping, cleaning and validation.
 * Pure functions (no database), so they are unit-tested in tests/student-import.test.ts.
 */

export const TEMPLATE_COLUMNS = [
  { key: "firstName", header: "First name", required: true, width: 18, example: "Ayesha" },
  { key: "lastName", header: "Last name", required: true, width: 18, example: "Khan" },
  { key: "dateOfBirth", header: "Date of birth (DD/MM/YYYY)", required: true, width: 26, example: "14/03/2016" },
  { key: "grade", header: "Grade (KG or 1-12)", required: true, width: 18, example: "4" },
  { key: "section", header: "Section", required: false, width: 10, example: "B" },
  { key: "gender", header: "Gender (F/M)", required: false, width: 14, example: "F" },
  { key: "guardianName", header: "Parent or guardian name", required: true, width: 26, example: "Imran Khan" },
  { key: "guardianPhone", header: "Parent mobile", required: true, width: 18, example: "0300 1234567" },
  { key: "guardianEmail", header: "Parent email", required: false, width: 26, example: "" },
] as const;

export type ColumnKey = (typeof TEMPLATE_COLUMNS)[number]["key"];
export const MAX_IMPORT_ROWS = 2000;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const HEADER_ALIASES: Record<string, ColumnKey> = {
  firstname: "firstName", first: "firstName", givenname: "firstName", name: "firstName",
  lastname: "lastName", surname: "lastName", familyname: "lastName", last: "lastName",
  dateofbirth: "dateOfBirth", dob: "dateOfBirth", birthdate: "dateOfBirth", dateofbirthddmmyyyy: "dateOfBirth",
  grade: "grade", class: "grade", gradekgor112: "grade",
  section: "section",
  gender: "gender", sex: "gender", genderfm: "gender",
  guardianname: "guardianName", parentname: "guardianName", fathername: "guardianName", parentorguardianname: "guardianName", mothername: "guardianName",
  guardianphone: "guardianPhone", parentphone: "guardianPhone", parentmobile: "guardianPhone", mobile: "guardianPhone", phone: "guardianPhone", contact: "guardianPhone",
  guardianemail: "guardianEmail", parentemail: "guardianEmail", email: "guardianEmail",
};

/** Maps each spreadsheet column index to a field. Returns the missing required fields too. */
export function mapHeaders(headers: unknown[]) {
  const map = new Map<number, ColumnKey>();
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[norm(String(h ?? ""))];
    if (key && ![...map.values()].includes(key)) map.set(i, key);
  });
  const found = new Set(map.values());
  const missing = TEMPLATE_COLUMNS.filter((c) => c.required && !found.has(c.key)).map((c) => c.header);
  return { map, missing };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Accepts Excel dates, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD. Returns ISO date or null. */
export function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === "number" && value > 20000 && value < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000); // Excel serial date
    return parseDate(d);
  }
  const s = String(value ?? "").trim();
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseGrade(value: unknown): number | null {
  const s = String(value ?? "").trim().toLowerCase().replace(/^(grade|class)\s*/, "");
  if (["kg", "k", "prep", "kindergarten", "0"].includes(s)) return 0;
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/** Pakistani mobiles (03xx…) become +923xx…; other international numbers are kept with their +code. */
export function normalisePhone(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^03\d{9}$/.test(digits)) return `+92${digits.slice(1)}`;
  if (/^923\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\+923\d{9}$/.test(digits)) return digits;
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  return null;
}

const cleanName = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");

export type CleanStudent = {
  firstName: string; lastName: string; dateOfBirth: string; grade: number; section: string | null; gender: "F" | "M" | null;
  guardianName: string; guardianPhone: string; guardianEmail: string | null;
};

export const dedupeKey = (s: Pick<CleanStudent, "firstName" | "lastName" | "dateOfBirth">) =>
  `${s.firstName.toLowerCase()}|${s.lastName.toLowerCase()}|${s.dateOfBirth}`;

const emailSchema = z.string().email();

/** Validates one spreadsheet row. `today` (YYYY-MM-DD) is passed in so results are deterministic. */
export function validateRow(raw: Partial<Record<ColumnKey, unknown>>, today: string): { value?: CleanStudent; errors: string[] } {
  const errors: string[] = [];
  const firstName = cleanName(raw.firstName);
  const lastName = cleanName(raw.lastName);
  if (firstName.length < 1) errors.push("First name is missing.");
  else if (firstName.length > 60) errors.push("First name is too long.");
  if (lastName.length < 1) errors.push("Last name is missing.");
  else if (lastName.length > 60) errors.push("Last name is too long.");

  const dateOfBirth = parseDate(raw.dateOfBirth);
  if (!dateOfBirth) errors.push("Date of birth must be a real date, e.g. 14/03/2016.");
  else {
    const age = Number(today.slice(0, 4)) - Number(dateOfBirth.slice(0, 4));
    if (dateOfBirth > today) errors.push("Date of birth is in the future.");
    else if (age < 3 || age > 20) errors.push("Date of birth gives an age outside 3–20 years.");
  }

  const grade = parseGrade(raw.grade);
  if (grade === null) errors.push("Grade must be KG or a number from 1 to 12.");

  const section = cleanName(raw.section).slice(0, 20) || null;
  const g = String(raw.gender ?? "").trim().toLowerCase();
  const gender = !g ? null : ["f", "female", "girl"].includes(g) ? "F" : ["m", "male", "boy"].includes(g) ? "M" : undefined;
  if (gender === undefined) errors.push("Gender must be F or M (or left empty).");

  const guardianName = cleanName(raw.guardianName);
  if (guardianName.length < 2) errors.push("Parent or guardian name is missing.");
  const guardianPhone = normalisePhone(raw.guardianPhone);
  if (!guardianPhone) errors.push("Parent mobile must be a valid number, e.g. 0300 1234567.");
  const emailRaw = String(raw.guardianEmail ?? "").trim().toLowerCase();
  const guardianEmail = emailRaw || null;
  if (guardianEmail && !emailSchema.safeParse(guardianEmail).success) errors.push("Parent email is not valid.");

  if (errors.length) return { errors };
  return {
    errors,
    value: { firstName, lastName, dateOfBirth: dateOfBirth!, grade: grade!, section, gender: gender ?? null, guardianName, guardianPhone: guardianPhone!, guardianEmail },
  };
}

export type CheckedRow = { rowNumber: number; data: Record<string, string | number | null>; errors: string[]; status: "valid" | "error" | "duplicate"; value?: CleanStudent };

/** Validates all rows and flags duplicates inside the file and against existing students. */
export function checkRows(rows: { rowNumber: number; raw: Partial<Record<ColumnKey, unknown>> }[], existingKeys: Set<string>, today: string): CheckedRow[] {
  const seen = new Map<string, number>();
  return rows.map(({ rowNumber, raw }) => {
    const data = Object.fromEntries(TEMPLATE_COLUMNS.map((c) => {
      const v = raw[c.key];
      return [c.key, v instanceof Date ? parseDate(v) : v == null || v === "" ? null : typeof v === "number" ? v : String(v).trim()];
    }));
    const { value, errors } = validateRow(raw, today);
    if (!value) return { rowNumber, data, errors, status: "error" as const };
    const key = dedupeKey(value);
    if (existingKeys.has(key)) return { rowNumber, data, errors: ["This student is already in your school's list."], status: "duplicate" as const, value };
    if (seen.has(key)) return { rowNumber, data, errors: [`Same student as row ${seen.get(key)}.`], status: "duplicate" as const, value };
    seen.set(key, rowNumber);
    return { rowNumber, data, errors: [], status: "valid" as const, value };
  });
}
