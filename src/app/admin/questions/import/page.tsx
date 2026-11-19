import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/admin/ui";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Import questions" };

export default async function ImportQuestions() {
  await requirePermission("questions.manage");
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/questions" className="text-muted hover:text-navy-700">← Question bank</Link></p>
      <PageHeader title="Import questions from Excel" description="Every row is checked first. If any row has a problem, nothing is imported and you'll see which rows to fix." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6"><ImportForm /></Card>
        <Card className="p-6">
          <h2 className="font-semibold">1. Download the template</h2>
          <p className="mt-1 text-sm text-muted">It lists your competition codes and explains how to write each answer type.</p>
          <a href="/admin/question-template" className={buttonClass("outline", "md", "mt-4")}><Download className="size-4" aria-hidden /> Question template</a>
          <h2 className="mt-6 font-semibold">2. Upload it here</h2>
          <p className="mt-1 text-sm text-muted">Up to 1,000 questions per file. They arrive as drafts.</p>
        </Card>
      </div>
    </>
  );
}
