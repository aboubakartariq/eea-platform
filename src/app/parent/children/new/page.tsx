import type { Metadata } from "next";
import Link from "next/link";
import { requireParent } from "@/lib/auth/family";
import { Card, PageHeader } from "@/components/admin/ui";
import { AddChildForm } from "./form";

export const metadata: Metadata = { title: "Add a child" };

export default async function AddChild() {
  await requireParent();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/parent" className="text-muted hover:text-navy-700">← My children</Link></p>
      <PageHeader title="Add a child" description="For children whose school isn't registering them. If the school is taking part, link your child instead so results reach the school too." />
      <Card className="max-w-2xl p-6 sm:p-8"><AddChildForm /></Card>
    </>
  );
}
