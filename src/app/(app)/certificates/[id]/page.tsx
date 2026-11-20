import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { canSeeStudent } from "@/lib/server/entries";
import { certificateView } from "@/lib/server/certificates";
import { Certificate } from "@/components/certificates/certificate";
import { PrintButton } from "@/components/ui/print-button";

export const metadata: Metadata = { title: "Certificate", robots: { index: false, follow: false } };

async function View({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const c = await certificateView(id);
  if (!c || !(await canSeeStudent(user, c.studentId, "certificates.view"))) notFound();
  // Families and schools see a certificate only once its results are published.
  if (!user.isStaff && !c.visible) notFound();
  return (
    <>
      <div className="mx-auto mb-5 flex max-w-[1100px] flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">Print on A4 landscape, or choose &ldquo;Save as PDF&rdquo;. <Link href={`/verify/${c.verifyCode}`} className="font-semibold text-navy-600 hover:underline">Public verification page</Link></p>
        <PrintButton />
      </div>
      {c.revokedAt && <p className="mx-auto mb-4 max-w-[1100px] rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200 print:hidden">This certificate was revoked: {c.revokedReason}</p>}
      <Certificate {...c} revoked={!!c.revokedAt} />
    </>
  );
}

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="min-h-dvh bg-surface p-4 sm:p-8 print:bg-white print:p-0">
      <style>{`@page { size: A4 landscape; margin: 0 } @media print { .certificate { width: 297mm; height: 210mm; } }`}</style>
      <Suspense fallback={<p className="text-center text-muted">Loading certificate…</p>}>
        <View params={params} />
      </Suspense>
    </main>
  );
}
