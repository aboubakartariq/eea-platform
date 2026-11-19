import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { DEFAULT_TEMPLATE } from "@/lib/server/certificates";
import { Card, PageHeader } from "@/components/admin/ui";
import { TemplateForm } from "../../forms";

export const metadata: Metadata = { title: "Certificate design" };

export default async function TemplatePage({ params }: { params: Promise<{ competitionId: string }> }) {
  await requirePermission("certificates.manage");
  const { competitionId } = await params;
  if (!z.string().uuid().safeParse(competitionId).success) notFound();
  const comp = await db.query.competitions.findFirst({ where: eq(schema.competitions.id, competitionId), columns: { name: true } });
  if (!comp) notFound();
  const tpl = (await db.query.certificateTemplates.findFirst({ where: eq(schema.certificateTemplates.competitionId, competitionId) })) ?? DEFAULT_TEMPLATE;
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/certificates" className="text-muted hover:text-navy-700">← Certificates</Link></p>
      <PageHeader title={`${comp.name} certificate`} description="The award name (e.g. Gold Medal), the student's name, the QR code and the certificate number are added automatically." />
      <Card className="max-w-3xl p-6"><TemplateForm competitionId={competitionId} heading={tpl.heading} body={tpl.body} signatories={tpl.signatories} /></Card>
    </>
  );
}
