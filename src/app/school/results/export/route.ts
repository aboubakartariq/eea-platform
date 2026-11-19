import ExcelJS from "exceljs";
import { z } from "zod";
import { requireSchool } from "@/lib/auth/school";
import { gradeName } from "@/lib/competition-types";
import { audit } from "@/lib/server/audit";
import { schoolResults } from "@/lib/server/school-results";

export async function GET(req: Request) {
  const { school, user } = await requireSchool();
  const competition = new URL(req.url).searchParams.get("competition") ?? "";
  if (!z.string().uuid().safeParse(competition).success) return new Response("Not found", { status: 404 });
  const rows = await schoolResults(school.id, competition);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Results", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Roll number", key: "roll", width: 16 }, { header: "Student ID", key: "code", width: 14 }, { header: "Name", key: "name", width: 26 }, { header: "Grade", key: "grade", width: 9 }, { header: "Section", key: "section", width: 9 },
    { header: "Score", key: "score", width: 8 }, { header: "Out of", key: "max", width: 8 }, { header: "%", key: "percent", width: 7 }, { header: "Rank in grade", key: "rank", width: 13 }, { header: "Of", key: "cohort", width: 7 }, { header: "School rank", key: "rankInSchool", width: 11 }, { header: "Award", key: "award", width: 26 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow({ ...r, name: `${r.first} ${r.last}`, grade: gradeName(r.grade), score: r.absent ? "Absent" : Number(r.score), percent: r.percent == null ? null : Number(r.percent) });
  await audit({ actorUserId: user.id, action: "school_results.exported", entityType: "school", entityId: school.id, after: { competition, rows: rows.length } });
  return new Response((await wb.xlsx.writeBuffer()) as ArrayBuffer, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${school.code}-results.xlsx"`, "Cache-Control": "no-store" },
  });
}
