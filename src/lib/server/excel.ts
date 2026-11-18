import "server-only";
import ExcelJS from "exceljs";
import { MAX_IMPORT_ROWS, TEMPLATE_COLUMNS, mapHeaders, type ColumnKey } from "@/lib/student-import";

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
