import "server-only";
import ExcelJS from "exceljs";
import { MAX_IMPORT_ROWS, TEMPLATE_COLUMNS, mapHeaders, type ColumnKey } from "@/lib/student-import";
import { MAX_QUESTION_ROWS, QUESTION_COLUMNS, mapQuestionHeaders, type QuestionColumnKey } from "@/lib/question-import";

const cellValue = (v: ExcelJS.CellValue): unknown => {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if ("result" in v) return cellValue(v.result as ExcelJS.CellValue); // formula
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String(v.text); // hyperlink
    return null;
  }
  return v;
};

/** Reads the first worksheet. Header row = first non-empty row. */
export async function readStudentSheet(buffer: ArrayBuffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return { error: "The file has no worksheet." } as const;

  let headerRow = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
    const values = (ws.getRow(r).values as ExcelJS.CellValue[]).slice(1);
    if (values.some((v) => v != null && String(cellValue(v)).trim())) { headerRow = r; break; }
  }
  if (!headerRow) return { error: "The sheet is empty." } as const;
  const headers = (ws.getRow(headerRow).values as ExcelJS.CellValue[]).slice(1).map(cellValue);
  const { map, missing } = mapHeaders(headers);
  if (missing.length) return { error: `These columns are missing: ${missing.join(", ")}. Please use the EEA template.` } as const;

  const rows: { rowNumber: number; raw: Partial<Record<ColumnKey, unknown>> }[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw: Partial<Record<ColumnKey, unknown>> = {};
    let any = false;
    for (const [i, key] of map) {
      const v = cellValue(row.getCell(i + 1).value);
      if (v != null && String(v).trim() !== "") any = true;
      raw[key] = v;
    }
    if (!any) continue;
    rows.push({ rowNumber: r, raw });
    if (rows.length > MAX_IMPORT_ROWS) return { error: `The file has more than ${MAX_IMPORT_ROWS} students. Please split it into smaller files.` } as const;
  }
  if (!rows.length) return { error: "No student rows were found under the header row." } as const;
  return { rows } as const;
}

export async function buildTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "EEA";
  const ws = wb.addWorksheet("Students", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E3192" } };
  header.height = 22;
  TEMPLATE_COLUMNS.forEach((c, i) => {
    if (c.required) ws.getCell(1, i + 1).note = "Required";
  });
  ws.addRow(Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c.key, c.example])));
  ws.getRow(2).font = { italic: true, color: { argb: "FF5B5D72" } };
  for (let r = 2; r <= 1001; r++) {
    ws.getCell(r, 3).numFmt = "@"; // keep dates as typed text
    ws.getCell(r, 8).numFmt = "@"; // keep leading zero in mobile numbers
    ws.getCell(r, 4).dataValidation = { type: "list", allowBlank: false, formulae: ['"KG,1,2,3,4,5,6,7,8,9,10,11,12"'] };
    ws.getCell(r, 6).dataValidation = { type: "list", allowBlank: true, formulae: ['"F,M"'] };
  }
  const help = wb.addWorksheet("How to fill");
  help.getColumn(1).width = 100;
  [
    "How to fill the EEA student list",
    "",
    "1. One student per row on the Students sheet. Delete the example row (Ayesha Khan) first.",
    "2. Required: first name, last name, date of birth, grade, parent or guardian name, parent mobile.",
    "3. Date of birth: DD/MM/YYYY, for example 14/03/2016.",
    "4. Grade: KG or a number from 1 to 12.",
    "5. Parent mobile: for example 0300 1234567.",
    "6. Upload the file in the School Portal. You will see every problem before anything is saved.",
  ].forEach((t, i) => {
    const c = help.getCell(i + 1, 1);
    c.value = t;
    if (i === 0) c.font = { bold: true, size: 14, color: { argb: "FF2E3192" } };
  });
  return wb.xlsx.writeBuffer();
}

/* ------------------------------------------------------------ Question bank */


export async function readQuestionSheet(buffer: ArrayBuffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return { error: "The file has no worksheet." } as const;
  let headerRow = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
    const values = (ws.getRow(r).values as ExcelJS.CellValue[]).slice(1);
    if (values.some((v) => v != null && String(cellValue(v)).trim())) { headerRow = r; break; }
  }
  if (!headerRow) return { error: "The sheet is empty." } as const;
  const { map, missing } = mapQuestionHeaders((ws.getRow(headerRow).values as ExcelJS.CellValue[]).slice(1).map(cellValue));
  if (missing.length) return { error: `These columns are missing: ${missing.join(", ")}. Please use the EEA question template.` } as const;
  const rows: { rowNumber: number; raw: Partial<Record<QuestionColumnKey, unknown>> }[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw: Partial<Record<QuestionColumnKey, unknown>> = {};
    let any = false;
    for (const [i, key] of map) {
      const v = cellValue(row.getCell(i + 1).value);
      if (v != null && String(v).trim() !== "") any = true;
      raw[key] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
    }
    if (!any) continue;
    rows.push({ rowNumber: r, raw });
    if (rows.length > MAX_QUESTION_ROWS) return { error: `The file has more than ${MAX_QUESTION_ROWS} questions. Please split it.` } as const;
  }
  if (!rows.length) return { error: "No question rows were found under the header row." } as const;
  return { rows } as const;
}

export async function buildQuestionTemplate(competitionCodes: string[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "EEA";
  const ws = wb.addWorksheet("Questions", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = QUESTION_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E3192" } };
  header.height = 22;
  ws.addRow(Object.fromEntries(QUESTION_COLUMNS.map((c) => [c.key, c.example])));
  ws.getRow(2).font = { italic: true, color: { argb: "FF5B5D72" } };
  const col = (key: QuestionColumnKey) => QUESTION_COLUMNS.findIndex((c) => c.key === key) + 1;
  for (let r = 2; r <= 1001; r++) {
    if (competitionCodes.length) ws.getCell(r, col("competition")).dataValidation = { type: "list", allowBlank: false, formulae: [`"${competitionCodes.join(",")}"`] };
    ws.getCell(r, col("type")).dataValidation = { type: "list", allowBlank: false, formulae: ['"Single choice,Multiple choice,True/False,Number,Short answer"'] };
    ws.getCell(r, col("difficulty")).dataValidation = { type: "list", allowBlank: false, formulae: ['"Easy,Medium,Hard"'] };
    for (const k of ["gradeFrom", "gradeTo"] as const) ws.getCell(r, col(k)).dataValidation = { type: "list", allowBlank: false, formulae: ['"KG,1,2,3,4,5,6,7,8,9,10,11,12"'] };
    ws.getCell(r, col("answer")).numFmt = "@";
  }
  const help = wb.addWorksheet("How to fill");
  help.getColumn(1).width = 110;
  [
    "How to fill the EEA question template",
    "",
    "1. One question per row. Delete the example row first.",
    "2. Competition code: the short code shown under Admin › Competitions (for example MMO).",
    "3. Grade from / Grade to: the grades the question suits. KG or 1–12.",
    "4. Type and Correct answer:",
    "   • Single choice: fill Option A, B, … in order, then the correct letter, e.g. B",
    "   • Multiple choice: the correct letters separated by commas, e.g. A, C",
    "   • True/False: True or False (leave the option columns empty)",
    "   • Number: the number, e.g. 0.75. Put an allowed margin in Tolerance if needed, e.g. 0.01",
    "   • Short answer: every accepted answer separated by |, e.g. Lahore | Lahore city",
    "5. Difficulty: Easy, Medium or Hard. Topic: one short topic, e.g. Fractions.",
    "6. Every imported question starts as a draft. A second person must approve it before it can go on a paper.",
  ].forEach((line, i) => {
    help.getCell(i + 1, 1).value = line;
    if (i === 0) help.getCell(1, 1).font = { bold: true, size: 14 };
  });
  return wb.xlsx.writeBuffer();
}

/* ----------------------------------------------------------- Answer sheets */

export type SheetRow = { rowNumber: number; roll: string; version: string; absent: boolean; answers: unknown[] };

export async function buildAnswerSheetTemplate(paper: { code: string; title: string; questions: number; printSets: number }, students: { roll: string; name: string; school: string; grade: string; version: string }[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "EEA";
  const ws = wb.addWorksheet("Answer sheets", { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
  const qs = Array.from({ length: paper.questions }, (_, i) => `Q${i + 1}`);
  ws.columns = [
    { header: "Roll number", key: "roll", width: 18 },
    { header: "Student name", key: "name", width: 26 },
    { header: "School", key: "school", width: 26 },
    { header: "Grade", key: "grade", width: 8 },
    { header: "Version", key: "version", width: 9 },
    { header: "Absent", key: "absent", width: 8 },
    ...qs.map((q) => ({ header: q, key: q, width: 6 })),
  ];
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E3192" } };
  for (const s of students) ws.addRow({ ...s });
  const letters = Array.from({ length: paper.printSets }, (_, i) => String.fromCharCode(65 + i)).join(",");
  for (let r = 2; r <= Math.max(students.length + 1, 2); r++) {
    ws.getCell(r, 5).dataValidation = { type: "list", allowBlank: false, formulae: [`"${letters}"`] };
    ws.getCell(r, 6).dataValidation = { type: "list", allowBlank: true, formulae: ['"Yes"'] };
    for (let c = 7; c < 7 + qs.length; c++) ws.getCell(r, c).numFmt = "@";
  }
  const help = wb.addWorksheet("How to fill");
  help.getColumn(1).width = 110;
  [
    `Answer sheets for ${paper.code} · ${paper.title}`,
    "",
    "1. One row per student. Roll numbers are filled in for everyone registered for this paper.",
    "2. Version: the letter printed on the student's paper (it is on their admit card).",
    "3. Q1, Q2 …: the question numbers as printed on that version. Type exactly what the student chose:",
    "   • a letter, e.g. B   • several letters for multiple choice, e.g. A, C   • True/False: A or B (or T / F)",
    "   • numbers and short answers as written. Leave a cell empty if the student left it blank.",
    "4. Absent: type Yes for students who did not sit the exam, and leave their answers empty.",
    "5. Uploading again replaces the earlier sheet for the same students.",
  ].forEach((line, i) => {
    help.getCell(i + 1, 1).value = line;
    if (i === 0) help.getCell(1, 1).font = { bold: true, size: 14 };
  });
  return wb.xlsx.writeBuffer();
}

export async function readAnswerSheet(buffer: ArrayBuffer, questions: number) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return { error: "The file has no worksheet." } as const;
  const norm = (v: unknown) => String(cellValue(v as ExcelJS.CellValue) ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const headers = (ws.getRow(1).values as ExcelJS.CellValue[]).slice(1).map(norm);
  const col = (name: string) => headers.indexOf(name) + 1;
  const roll = col("rollnumber"), version = col("version"), absent = col("absent");
  if (!roll || !version) return { error: "The first row must have Roll number and Version columns. Please use the template for this paper." } as const;
  const qCols = Array.from({ length: questions }, (_, i) => col(`q${i + 1}`));
  const missing = qCols.map((c, i) => (c ? null : `Q${i + 1}`)).filter(Boolean);
  if (missing.length) return { error: `These question columns are missing: ${missing.slice(0, 8).join(", ") + (missing.length > 8 ? "…" : "")}. This paper has ${questions} questions.` } as const;
  const rows: SheetRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (c: number) => (c ? cellValue(row.getCell(c).value) : null);
    const rollValue = String(get(roll) ?? "").trim().toUpperCase();
    const answers = qCols.map((c) => get(c));
    if (!rollValue && answers.every((a) => a == null || String(a).trim() === "")) continue;
    rows.push({ rowNumber: r, roll: rollValue, version: String(get(version) ?? "").trim().toUpperCase(), absent: /^(yes|y|ab|absent|1|true)$/i.test(String(get(absent) ?? "").trim()), answers });
    if (rows.length > 5000) return { error: "The file has more than 5,000 rows. Please split it." } as const;
  }
  if (!rows.length) return { error: "No student rows were found." } as const;
  return { rows } as const;
}
