import type { Metadata } from "next";
import Link from "next/link";
import { requireParent } from "@/lib/auth/family";
import { Card, PageHeader } from "@/components/admin/ui";
import { LinkChildForm } from "./form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Link a child") };
}

export default async function LinkChild() {
  const { tr } = await getTr();
  await requireParent();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/parent" className="text-muted hover:text-navy-700">{tr("← My children")}</Link></p>
      <PageHeader title={tr("Link a child registered by their school")} description={tr("These details must match the school's record. This keeps children's information private.")} />
      <Card className="max-w-xl p-6 sm:p-8"><LinkChildForm /></Card>
    </>
  );
}
