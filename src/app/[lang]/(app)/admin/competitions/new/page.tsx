import type { Metadata } from "next";
import Link from "next/link";
import { can, requirePermission } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui";
import { CompetitionForm } from "../competition-form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("New competition") };
}

export default async function NewCompetition() {
  const { tr } = await getTr();
  const user = await requirePermission("competitions.manage");
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/competitions" className="text-muted hover:text-navy-700">{tr("← Competitions")}</Link></p>
      <PageHeader title={tr("New competition")} />
      <CompetitionForm
        canPublish={can(user, "competitions.publish")}
        values={{ name: "", slug: "", code: "", kind: "olympiad", accent: "blue", icon: "book", summary: "", gradeFrom: "", gradeTo: "", modes: ["online", "paper"], levels: "1", durationMinutes: "", feePkr: "", registrationCloses: "", examDate: "", status: "draft", sortOrder: "10", overview: "", objectives: "", eligibility: "", format: "", syllabus: "", rules: "", awards: "", faqs: "" }}
      />
    </>
  );
}
