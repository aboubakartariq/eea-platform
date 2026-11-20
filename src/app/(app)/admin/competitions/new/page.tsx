import type { Metadata } from "next";
import Link from "next/link";
import { can, requirePermission } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui";
import { CompetitionForm } from "../competition-form";

export const metadata: Metadata = { title: "New competition" };

export default async function NewCompetition() {
  const user = await requirePermission("competitions.manage");
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/competitions" className="text-muted hover:text-navy-700">← Competitions</Link></p>
      <PageHeader title="New competition" />
      <CompetitionForm
        canPublish={can(user, "competitions.publish")}
        values={{ name: "", slug: "", code: "", kind: "olympiad", accent: "blue", icon: "book", summary: "", gradeFrom: "", gradeTo: "", modes: ["online", "paper"], levels: "1", durationMinutes: "", feePkr: "", registrationCloses: "", examDate: "", status: "draft", sortOrder: "10", overview: "", objectives: "", eligibility: "", format: "", syllabus: "", rules: "", awards: "", faqs: "" }}
      />
    </>
  );
}
