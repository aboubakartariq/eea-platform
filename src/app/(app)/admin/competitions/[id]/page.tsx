import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { contentToForm } from "@/lib/competition-form";
import { FormMessage } from "@/components/ui/form";
import { PageHeader } from "@/components/admin/ui";
import { CompetitionForm } from "../competition-form";

export const metadata: Metadata = { title: "Edit competition" };

export default async function EditCompetition({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const user = await requirePermission("competitions.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const c = await db.query.competitions.findFirst({ where: eq(schema.competitions.id, id) });
  if (!c) notFound();
  const [{ n: registered }] = await db.select({ n: count() }).from(schema.registrationItems).where(eq(schema.registrationItems.competitionId, id));
  const { saved } = await searchParams;
  const s = (v: number | null) => (v == null ? "" : String(v));

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/competitions" className="text-muted hover:text-navy-700">← Competitions</Link></p>
      <PageHeader
        title={c.name}
        description={`${registered} student${registered === 1 ? "" : "s"} registered so far.`}
        actions={c.status === "published" && <Link href={`/competitions/${c.slug}`} target="_blank" className="text-sm font-semibold text-navy-600 hover:underline">View public page ↗</Link>}
      />
      {saved && <div className="mb-6"><FormMessage ok="Competition created." /></div>}
      {can(user, "competitions.manage") ? (
        <CompetitionForm
          canPublish={can(user, "competitions.publish")}
          values={{
            id: c.id, name: c.name, slug: c.slug, code: c.code, kind: c.kind, accent: c.accent, icon: c.icon, summary: c.summary,
            gradeFrom: s(c.gradeFrom), gradeTo: s(c.gradeTo), modes: c.modes, levels: String(c.levels), durationMinutes: s(c.durationMinutes), feePkr: s(c.feePkr),
            registrationCloses: c.registrationCloses ?? "", examDate: c.examDate ?? "", status: c.status, sortOrder: String(c.sortOrder),
            ...contentToForm(c.content),
          }}
        />
      ) : (
        <p className="text-muted">You can view competitions but not edit them.</p>
      )}
    </>
  );
}
