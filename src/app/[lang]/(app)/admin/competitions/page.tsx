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
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Competitions") };
}

export default async function CompetitionsAdmin() {
  const { tr, msg, intl } = await getTr();
  const user = await requirePermission("competitions.view");
  const rows = await db.select().from(schema.competitions).orderBy(asc(schema.competitions.sortOrder), asc(schema.competitions.name));
  return (
    <>
      <PageHeader
        title={tr("Competitions")}
        description={tr("Schools can register only when a competition is published and has grades, fee, exam date and closing date.")}
        actions={can(user, "competitions.manage") && <Link href="/admin/competitions/new" className={buttonClass("primary", "md")}><Plus className="size-4" aria-hidden />{" "}{tr("New competition")}</Link>}
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("Competition")}</th><th className={th}>{tr("Status")}</th><th className={th}>{tr("Grades")}</th><th className={th}>{tr("Fee")}</th><th className={th}>{tr("Exam date")}</th><th className={th}>{tr("Registration")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => {
                const ready = isRegistrationReady({ ...c, accent: "blue", content: c.content });
                return (
                  <tr key={c.id} className="hover:bg-surface/50">
                    <td className={td}><Link href={`/admin/competitions/${c.id}`} className="font-semibold text-navy-900 hover:underline">{c.name}</Link><p className="font-mono text-xs text-muted">{c.code}</p></td>
                    <td className={td}>{c.status === "published" ? <Pill tone="green">{tr("Published")}</Pill> : c.status === "draft" ? <Pill tone="amber">{tr("Draft")}</Pill> : <Pill>{tr("Archived")}</Pill>}</td>
                    <td className={`${td} text-muted`}>{c.gradeFrom == null || c.gradeTo == null ? tr("Not set") : msg(gradesLabel(c))}</td>
                    <td className={`${td} text-muted`}>{c.feePkr != null ? formatPKR(c.feePkr, intl) : tr("Not set")}</td>
                    <td className={`${td} text-muted`}>{c.examDate ? formatDate(c.examDate, intl) : tr("Not set")}</td>
                    <td className={td}>{c.status === "published" && ready ? <Pill tone="green">{tr("Open to schools")}</Pill> : <Pill tone="amber">{tr("Details missing")}</Pill>}</td>
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
