import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { gradeName } from "@/lib/competition-types";
import { versionFor } from "@/lib/server/entries";
import { buildAnswerSheetTemplate } from "@/lib/server/excel";
import { paperEntrants } from "@/lib/server/results";

export async function GET(_req: Request, { params }: { params: Promise<{ paperId: string }> }) {
  await requirePermission("results.manage");
  const { paperId } = await params;
  if (!z.string().uuid().safeParse(paperId).success) return new Response("Not found", { status: 404 });
  const paper = await db.query.papers.findFirst({ where: eq(schema.papers.id, paperId) });
  if (!paper || paper.status !== "final") return new Response("Not found", { status: 404 });
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.paperQuestions).where(eq(schema.paperQuestions.paperId, paperId));
  const students = (await paperEntrants(paper)).map((e) => ({ roll: e.roll!, name: `${e.first} ${e.last}`, school: e.school, grade: gradeName(e.grade), version: versionFor(e.roll!, paper.printSets) }));
  const buf = await buildAnswerSheetTemplate({ code: paper.code, title: paper.title, questions: n, printSets: paper.printSets }, students);
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${paper.code}-answer-sheets.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
