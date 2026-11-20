import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui";
import { QuestionForm } from "../question-form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("New question") };
}

export default async function NewQuestion({ searchParams }: { searchParams: Promise<{ competition?: string }> }) {
  const { tr } = await getTr();
  await requirePermission("questions.manage");
  const { competition } = await searchParams;
  const competitions = await db.select({ id: schema.competitions.id, name: schema.competitions.name }).from(schema.competitions).orderBy(asc(schema.competitions.sortOrder));
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/questions" className="text-muted hover:text-navy-700">{tr("← Question bank")}</Link></p>
      <PageHeader title={tr("New question")} description={tr("It is saved as a draft. Send it for review when it's ready; someone else then approves it.")} />
      <QuestionForm competitions={competitions} initial={{ competitionId: competition ?? "", type: "single", level: "1", marks: "1", difficulty: "medium" }} />
    </>
  );
}
