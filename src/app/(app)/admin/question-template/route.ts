import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { buildQuestionTemplate } from "@/lib/server/excel";

export async function GET() {
  await requirePermission("questions.manage");
  const comps = await db.select({ code: schema.competitions.code }).from(schema.competitions).orderBy(asc(schema.competitions.sortOrder));
  const buf = await buildQuestionTemplate(comps.map((c) => c.code));
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="EEA-question-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
