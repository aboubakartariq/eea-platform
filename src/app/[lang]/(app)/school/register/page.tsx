import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireSchool } from "@/lib/auth/school";
import { getOpenCompetitions, getPublishedCompetitions } from "@/lib/competitions";
import { gradesLabel, modesLabel } from "@/lib/competition-types";
import { CompetitionIcon } from "@/components/competition-card";
import { Card, PageHeader } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/utils";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Register for competitions") };
}

export default async function RegisterIndex() {
  const { tr, msg, intl } = await getTr();
  await requireSchool();
  const [open, all] = await Promise.all([getOpenCompetitions(), getPublishedCompetitions()]);
  const openIds = new Set(open.map((c) => c.id));
  const upcoming = all.filter((c) => !openIds.has(c.id));
  return (
    <>
      <PageHeader title={tr("Register for competitions")} description={tr("Choose a competition, then select the students taking part.")} />
      {open.length === 0 && <Card className="mb-6 p-6 text-sm text-muted">{tr("No competition is open for registration yet. EEA will publish the dates soon.")}</Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {open.map((c) => (
          <Link key={c.id} href={`/school/register/${c.slug}`} className="group flex gap-4 rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow hover:shadow-md">
            <CompetitionIcon c={c} />
            <div className="flex-1">
              <h2 className="text-lg font-bold">{c.name}</h2>
              <p className="mt-1 text-sm text-muted">{tr("{grade} · {modesLabel} · {amount} per student", { grade: msg(gradesLabel(c)), modesLabel: msg(modesLabel(c.modes)), amount: formatPKR(c.feePkr!, intl) })}</p>
              <p className="mt-1 text-sm text-muted">{tr("Exam {date} · Registration closes {closes}", { date: formatDate(c.examDate!, intl), closes: formatDate(c.registrationCloses!, intl) })}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-navy-600">{tr("Select students")}{" "}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden /></span>
            </div>
          </Link>
        ))}
      </div>
      {upcoming.length > 0 && (
        <Card title={tr("Opening soon")} className="mt-6">
          <ul className="divide-y divide-line text-sm">
            {upcoming.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5"><span className="font-medium text-navy-900">{c.name}</span><span className="text-muted">{tr("Details to be announced")}</span></li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
