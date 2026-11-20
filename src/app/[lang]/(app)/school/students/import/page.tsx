import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db, schema } from "@/db";
import { requireSchool } from "@/lib/auth/school";
import { Card, DateTime, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { UploadForm } from "./upload-form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Import students from Excel") };
}

export default async function ImportPage() {
  const { tr } = await getTr();
  const { school, canManage } = await requireSchool();
  const history = await db.select().from(schema.bulkImports).where(eq(schema.bulkImports.schoolId, school.id)).orderBy(desc(schema.bulkImports.createdAt)).limit(20);
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/students" className="text-muted hover:text-navy-700">{tr("← Students")}</Link></p>
      <PageHeader title={tr("Import students from Excel")} description={tr("Upload your class lists. You'll see every row checked before anything is saved.")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6 sm:p-8">
          <span className="font-display text-sm font-bold text-gold-700">{tr("Step 1")}</span>
          <h2 className="mt-1 text-lg font-semibold">{tr("Download the template")}</h2>
          <p className="mt-2 text-sm text-muted">{tr("One student per row: name, date of birth, grade, section, and a parent's name and mobile. Your own sheet works too if it has these columns.")}</p>
          <a href="/school/student-template" download className={buttonClass("outline", "md", "mt-5")}><Download className="size-4" aria-hidden />{" "}{tr("Download Excel template")}</a>
        </Card>
        <Card className="p-6 sm:p-8">
          <span className="font-display text-sm font-bold text-gold-700">{tr("Step 2")}</span>
          <h2 className="mt-1 text-lg font-semibold">{tr("Upload the completed file")}</h2>
          {canManage ? <UploadForm /> : <p className="mt-2 text-sm text-muted">{tr("Only your school's coordinator can import students.")}</p>}
        </Card>
      </div>
      {history.length > 0 && (
        <Card title={tr("Previous uploads")} className="mt-6">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("File")}</th><th className={th}>{tr("Rows")}</th><th className={th}>{tr("Result")}</th><th className={th}>{tr("Uploaded")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className={td}><Link href={`/school/students/import/${h.id}`} className="font-medium text-navy-900 hover:underline">{h.fileName}</Link></td>
                  <td className={`${td} tabular-nums`}>{h.totalRows}</td>
                  <td className={td}>{h.status === "imported" ? <Pill tone="green">{tr("{importedRows} imported", { importedRows: h.importedRows })}</Pill> : h.status === "cancelled" ? <Pill>{tr("Cancelled")}</Pill> : <Pill tone="amber">{tr("Waiting for you to confirm")}</Pill>}</td>
                  <td className={`${td} text-muted`}><DateTime value={h.createdAt} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
