import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";
import { requireSchool } from "@/lib/auth/school";
import { admitCards } from "@/lib/server/admit-cards";
import { AdmitCard } from "@/components/certificates/admit-card";
import { PrintButton } from "@/components/ui/print-button";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Admit cards"), robots: { index: false, follow: false } };
}

async function Cards({ searchParams }: { searchParams: Promise<{ competition?: string }> }) {
  const { tr } = await getTr();
  const { school } = await requireSchool();
  const { competition } = await searchParams;
  const cards = await admitCards({ schoolId: school.id, competitionId: z.string().uuid().safeParse(competition).success ? competition : undefined });
  if (!cards.length) return <p className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-line">{tr("No admit cards yet. They are issued when a registration's payment is confirmed.")}</p>;
  return (
    <>
      <p className="mb-4 text-sm text-muted print:hidden">{tr("Admit cards for {name}: {length}. Two print on each A4 page.", { length: cards.length, name: school.name })}</p>
      <div className="space-y-5">{cards.map((c) => <AdmitCard key={c.itemId} c={c} />)}</div>
    </>
  );
}

export default async function SchoolAdmitCards({ searchParams }: { searchParams: Promise<{ competition?: string }> }) {
  const { tr } = await getTr();
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8 print:p-0">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <Suspense fallback={<p className="text-muted">{tr("Loading…")}</p>}><Cards searchParams={searchParams} /></Suspense>
    </main>
  );
}
