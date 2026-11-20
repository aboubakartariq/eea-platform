import type { Metadata } from "next";
import Link from "next/link";
import { requireSchool } from "@/lib/auth/school";
import { Card, PageHeader } from "@/components/admin/ui";
import { NewStudentForm } from "./form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Add a student") };
}

export default async function NewStudent() {
  const { tr } = await getTr();
  await requireSchool();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/students" className="text-muted hover:text-navy-700">{tr("← Students")}</Link></p>
      <PageHeader title={tr("Add a student")} description={tr("For many students at once, use the Excel import.")} />
      <Card className="max-w-3xl p-6 sm:p-8"><NewStudentForm /></Card>
    </>
  );
}
