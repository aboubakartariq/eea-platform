import { describe, expect, it } from "vitest";
import { checkRows, mapHeaders, normalisePhone, parseDate, parseGrade, validateRow } from "@/lib/student-import";
import { parseContent, contentToForm } from "@/lib/competition-form";

const TODAY = "2026-11-18";
const good = { firstName: " Ayesha ", lastName: "Khan", dateOfBirth: "14/03/2016", grade: "4", guardianName: "Imran Khan", guardianPhone: "0300-1234567" };

describe("header mapping", () => {
  it("maps template headers and common alternatives", () => {
    const { map, missing } = mapHeaders(["First name", "Surname", "DOB", "Class", "Father Name", "Mobile", "Email"]);
    expect([...map.values()]).toEqual(["firstName", "lastName", "dateOfBirth", "grade", "guardianName", "guardianPhone", "guardianEmail"]);
    expect(missing).toEqual([]);
  });
  it("reports missing required columns", () => {
    expect(mapHeaders(["First name", "Last name"]).missing).toContain("Date of birth (DD/MM/YYYY)");
  });
});

describe("cell parsing", () => {
  it("parses dates in Pakistani and ISO formats and Excel dates", () => {
    expect(parseDate("14/03/2016")).toBe("2016-03-14");
    expect(parseDate("2016-03-14")).toBe("2016-03-14");
    expect(parseDate(new Date(Date.UTC(2016, 2, 14)))).toBe("2016-03-14");
    expect(parseDate(42443)).toBe("2016-03-14"); // Excel serial number
    expect(parseDate("31/02/2016")).toBeNull();
    expect(parseDate("March 2016")).toBeNull();
  });
  it("parses grades", () => {
    expect(parseGrade("KG")).toBe(0);
    expect(parseGrade("Grade 7")).toBe(7);
    expect(parseGrade(10)).toBe(10);
    expect(parseGrade("13")).toBeNull();
    expect(parseGrade("")).toBeNull();
  });
  it("normalises phone numbers", () => {
    expect(normalisePhone("0300 1234567")).toBe("+923001234567");
    expect(normalisePhone("92-300-1234567")).toBe("+923001234567");
    expect(normalisePhone("+44 7700 900123")).toBe("+447700900123");
    expect(normalisePhone("12345")).toBeNull();
  });
});

describe("row validation", () => {
  it("accepts a good row and cleans it", () => {
    const r = validateRow(good, TODAY);
    expect(r.errors).toEqual([]);
    expect(r.value).toMatchObject({ firstName: "Ayesha", grade: 4, dateOfBirth: "2016-03-14", guardianPhone: "+923001234567", gender: null });
  });
  it("lists every problem in a bad row", () => {
    const r = validateRow({ firstName: "", lastName: "X", dateOfBirth: "2030-01-01", grade: "15", gender: "x", guardianName: "", guardianPhone: "1", guardianEmail: "nope" }, TODAY);
    expect(r.value).toBeUndefined();
    expect(r.errors).toHaveLength(7);
  });
  it("flags duplicates within the file and against existing students", () => {
    const rows = [
      { rowNumber: 2, raw: good },
      { rowNumber: 3, raw: { ...good, firstName: "AYESHA" } },
      { rowNumber: 4, raw: { ...good, firstName: "Sana" } },
      { rowNumber: 5, raw: { ...good, grade: "x" } },
    ];
    const out = checkRows(rows, new Set(["sana|khan|2016-03-14"]), TODAY);
    expect(out.map((r) => r.status)).toEqual(["valid", "duplicate", "duplicate", "error"]);
    expect(out[1].errors[0]).toMatch(/row 2/);
  });
});

describe("competition content form", () => {
  it("round-trips the admin text areas", () => {
    const content = parseContent({
      overview: "Fast maths.",
      objectives: "Speed\n\nAccuracy",
      format: "Questions: 50\nType: MCQ",
      syllabus: "Grades 1–2: Addition; Subtraction",
      awards: "Medals: Top 10%",
      faqs: "Q: Calculators?\nA: Not allowed.",
    });
    expect(content.objectives).toEqual(["Speed", "Accuracy"]);
    expect(content.syllabus).toEqual([{ band: "Grades 1–2", topics: ["Addition", "Subtraction"] }]);
    expect(content.faqs).toEqual([{ q: "Calculators?", a: "Not allowed." }]);
    expect(parseContent(contentToForm(content))).toEqual(content);
  });
});
