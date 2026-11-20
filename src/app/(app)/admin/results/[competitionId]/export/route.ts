import ExcelJS from "exceljs";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { gradeName } from "@/lib/competition-types";
import { audit } from "@/lib/server/audit";
import { liveResultSet } from "@/lib/server/results";

export async function GET(_req: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  const user = await requirePermission("results.view");
  const { competitionId } = await params;
  if (!z.string().uuid().safeParse(competitionId).success) return new Response("Not found", { status: 404 });
  const comp = await db.query.competitions.findFirst({ where: eq(schema.competitions.id, competitionId) });
  const set = await liveResultSet(competitionId);
  if (!comp || !set) return new Response("Not found", { status: 404 });
  const rows = await db
    .select({ grade: schema.results.grade, rank: schema.results.rank, cohort: schema.results.cohortSize, roll: schema.registrationItems.rollNumber, code: schema.students.code, first: schema.students.firstName, last: schema.students.lastName, school: sql<string>`coalesce(${schema.schools.name}, ${schema.students.schoolName}, 'Individual')`, source: schema.results.source, absent: schema.results.absent, score: schema.results.score, max: schema.results.maxScore, percent: schema.results.percent, award: schema.results.awardLabel, rankInSchool: schema.results.rankInSchool })
    .from(schema.results)
    .innerJoin(schema.students, eq(schema.students.id, schema.results.studentId))
    .innerJoin(schema.registrationItems, eq(schema.registrationItems.id, schema.results.registrationItemId))
    .leftJoin(schema.schools, eq(schema.schools.id, schema.results.schoolId))
    .where(eq(schema.results.resultSetId, set.id))
    .orderBy(asc(schema.results.grade), sql`${schema.results.rank} asc nulls last`);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Results", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Grade", key: "grade", width: 9 }, { header: "Rank", key: "rank", width: 8 }, { header: "Of", key: "cohort", width: 6 }, { header: "Roll number", key: "roll", width: 16 },
    { header: "Student ID", key: "code", width: 14 }, { header: "Name", key: "name", width: 26 }, { header: "School", key: "school", width: 30 }, { header: "Mode", key: "source", width: 8 },
    { header: "Score", key: "score", width: 8 }, { header: "Out of", key: "max", width: 8 }, { header: "%", key: "percent", width: 7 }, { header: "Award", key: "award", width: 26 }, { header: "School rank", key: "rankInSchool", width: 11 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow({ ...r, grade: gradeName(r.grade), name: `${r.first} ${r.last}`, rank: r.absent ? "Absent" : r.rank, score: r.score == null ? null : Number(r.score), percent: r.percent == null ? null : Number(r.percent) });
  await audit({ actorUserId: user.id, action: "results.exported", entityType: "result_set", entityId: set.id, after: { rows: rows.length } });
  return new Response((await wb.xlsx.writeBuffer()) as ArrayBuffer, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${comp.code}-results.xlsx"`, "Cache-Control": "no-store" },
  });
}
