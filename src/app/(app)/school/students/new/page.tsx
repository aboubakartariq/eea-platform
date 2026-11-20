import type { Metadata } from "next";
import Link from "next/link";
import { requireSchool } from "@/lib/auth/school";
import { Card, PageHeader } from "@/components/admin/ui";
import { NewStudentForm } from "./form";

export const metadata: Metadata = { title: "Add a student" };

export default async function NewStudent() {
  await requireSchool();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/students" className="text-muted hover:text-navy-700">← Students</Link></p>
      <PageHeader title="Add a student" description="For many students at once, use the Excel import." />
      <Card className="max-w-3xl p-6 sm:p-8"><NewStudentForm /></Card>
    </>
  );
}
