import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { gradesLabel, isRegistrationReady } from "@/lib/competition-types";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata: Metadata = { title: "Competitions" };

export default async function CompetitionsAdmin() {
  const user = await requirePermission("competitions.view");
  const rows = await db.select().from(schema.competitions).orderBy(asc(schema.competitions.sortOrder), asc(schema.competitions.name));
  return (
    <>
      <PageHeader
        title="Competitions"
        description="Schools can register only when a competition is published and has grades, fee, exam date and closing date."
        actions={can(user, "competitions.manage") && <Link href="/admin/competitions/new" className={buttonClass("primary", "md")}><Plus className="size-4" aria-hidden /> New competition</Link>}
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Competition</th><th className={th}>Status</th><th className={th}>Grades</th><th className={th}>Fee</th><th className={th}>Exam date</th><th className={th}>Registration</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => {
                const ready = isRegistrationReady({ ...c, accent: "blue", content: c.content });
                return (
                  <tr key={c.id} className="hover:bg-surface/50">
                    <td className={td}><Link href={`/admin/competitions/${c.id}`} className="font-semibold text-navy-900 hover:underline">{c.name}</Link><p className="font-mono text-xs text-muted">{c.code}</p></td>
                    <td className={td}>{c.status === "published" ? <Pill tone="green">Published</Pill> : c.status === "draft" ? <Pill tone="amber">Draft</Pill> : <Pill>Archived</Pill>}</td>
                    <td className={`${td} text-muted`}>{gradesLabel(c).replace("Grades to be announced", "Not set")}</td>
                    <td className={`${td} text-muted`}>{c.feePkr != null ? formatPKR(c.feePkr) : "Not set"}</td>
                    <td className={`${td} text-muted`}>{c.examDate ? formatDate(c.examDate) : "Not set"}</td>
                    <td className={td}>{c.status === "published" && ready ? <Pill tone="green">Open to schools</Pill> : <Pill tone="amber">Details missing</Pill>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
