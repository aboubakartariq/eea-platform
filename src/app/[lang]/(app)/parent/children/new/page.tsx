import type { Metadata } from "next";
import Link from "next/link";
import { requireParent } from "@/lib/auth/family";
import { Card, PageHeader } from "@/components/admin/ui";
import { AddChildForm } from "./form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Add a child") };
}

export default async function AddChild() {
  const { tr } = await getTr();
  await requireParent();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/parent" className="text-muted hover:text-navy-700">{tr("← My children")}</Link></p>
      <PageHeader title={tr("Add a child")} description={tr("For children whose school isn't registering them. If the school is taking part, link your child instead so results reach the school too.")} />
      <Card className="max-w-2xl p-6 sm:p-8"><AddChildForm /></Card>
    </>
  );
}
