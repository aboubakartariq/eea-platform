import { requireSchool } from "@/lib/auth/school";
import { buildTemplate } from "@/lib/server/excel";

export async function GET() {
  await requireSchool();
  const buf = await buildTemplate();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="EEA-student-list-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
