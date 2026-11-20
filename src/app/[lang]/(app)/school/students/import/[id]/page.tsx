import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { TEMPLATE_COLUMNS } from "@/lib/student-import";
import { Card, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cancelImportAction, confirmImportAction } from "../../actions";
import { getTr } from "@/i18n/app-server";
import { N_ } from "@/i18n/tr";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Check your file") };
}

const tone = { valid: "green", error: "red", duplicate: "amber", imported: "blue" } as const;
const label = { valid: N_("Ready"), error: N_("Needs fixing"), duplicate: N_("Duplicate"), imported: N_("Imported") } as const;

export default async function ImportPreview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ show?: string }> }) {
  const { tr } = await getTr();
  const { school, canManage } = await requireSchool();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const imp = await db.query.bulkImports.findFirst({ where: and(eq(schema.bulkImports.id, id), eq(schema.bulkImports.schoolId, school.id)) });
  if (!imp) notFound();
  const show = (await searchParams).show;
  const filter = show === "problems" ? ["error", "duplicate"] : null;
  const rows = (await db.select().from(schema.importRows).where(eq(schema.importRows.importId, id)).orderBy(asc(schema.importRows.rowNumber))).filter((r) => !filter || filter.includes(r.status));
  const cols = TEMPLATE_COLUMNS.filter((c) => ["firstName", "lastName", "dateOfBirth", "grade", "guardianName", "guardianPhone"].includes(c.key));
  const previewed = imp.status === "previewed";

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/students/import" className="text-muted hover:text-navy-700">{tr("← Import")}</Link></p>
      <PageHeader title={previewed ? tr("Check your file") : imp.status === "imported" ? tr("Import complete") : tr("Import cancelled")} description={imp.fileName} />

      {imp.status === "imported" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-6 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-sm text-emerald-900">{tr("Students added to your list: {n}. Rows that needed fixing were skipped; correct them in Excel and upload them again.", { n: imp.importedRows })}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={tr("Rows in file")} value={imp.totalRows} />
        <StatCard label={tr("Ready to import")} value={imp.validRows} />
        <StatCard label={tr("Need fixing")} value={imp.errorRows} />
        <StatCard label={tr("Duplicates (skipped)")} value={imp.duplicateRows} />
      </div>

      {previewed && canManage && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-line">
          <p className="flex-1 text-sm text-muted">
            {imp.validRows > 0 ? tr("Import the ready rows now ({n}). Rows that need fixing are skipped.", { n: imp.validRows }) : tr("No rows are ready. Fix the problems in Excel and upload the file again.")}
          </p>
          <form action={cancelImportAction}><input type="hidden" name="importId" value={imp.id} /><button className={buttonClass("outline", "md")}>{tr("Cancel")}</button></form>
          {imp.validRows > 0 && <form action={confirmImportAction}><input type="hidden" name="importId" value={imp.id} /><button className={buttonClass("gold", "md")}>{tr("Import {validRows} students", { validRows: imp.validRows })}</button></form>}
        </div>
      )}

      <div className="mt-6 mb-3 flex gap-2 text-sm">
        <Link href={`/school/students/import/${id}`} className={`rounded-full px-3.5 py-1.5 ring-1 ${!filter ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line"}`}>{tr("All rows")}</Link>
        <Link href={`/school/students/import/${id}?show=problems`} className={`rounded-full px-3.5 py-1.5 ring-1 ${filter ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line"}`}>{tr("Only problems")}</Link>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Row")}</th><th className={th}>{tr("Status")}</th>{cols.map((c) => <th key={c.key} className={th}>{c.header.replace(/ \(.*\)/, "")}</th>)}<th className={th}>{tr("What to fix")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={r.status === "error" ? "bg-red-50/40" : r.status === "duplicate" ? "bg-amber-50/40" : ""}>
                  <td className={`${td} tabular-nums text-muted`}>{r.rowNumber}</td>
                  <td className={td}><Pill tone={tone[r.status as keyof typeof tone]}>{tr(label[r.status as keyof typeof label])}</Pill></td>
                  {cols.map((c) => <td key={c.key} className={td}>{r.data[c.key] ?? <span className="text-muted">—</span>}</td>)}
                  <td className={`${td} text-xs text-red-800`}>{r.errors.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
