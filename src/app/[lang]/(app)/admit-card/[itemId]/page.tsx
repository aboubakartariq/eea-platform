import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { admitCards } from "@/lib/server/admit-cards";
import { canSeeStudent } from "@/lib/server/entries";
import { AdmitCard } from "@/components/certificates/admit-card";
import { PrintButton } from "@/components/ui/print-button";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Admit card"), robots: { index: false, follow: false } };
}

async function View({ params }: { params: Promise<{ itemId: string }> }) {
  const user = await requireUser();
  const { itemId } = await params;
  if (!z.string().uuid().safeParse(itemId).success) notFound();
  const [card] = await admitCards({ itemIds: [itemId] });
  if (!card || !(await canSeeStudent(user, card.studentId, "registrations.view"))) notFound();
  return <AdmitCard c={card} />;
}

export default async function AdmitCardPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { tr } = await getTr();
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8 print:p-0">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <Suspense fallback={<p className="text-muted">{tr("Loading…")}</p>}><View params={params} /></Suspense>
    </main>
  );
}
