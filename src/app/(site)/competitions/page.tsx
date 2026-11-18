import type { Metadata } from "next";
import { getPublishedCompetitions } from "@/lib/competitions";
import { CompetitionsBrowser } from "@/components/competitions-browser";
import { PageHero } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Find olympiads and extracurricular competitions by grade, type and exam mode.",
};

export default async function CompetitionsPage() {
  const items = await getPublishedCompetitions();
  return (
    <>
      <PageHero eyebrow="Competitions" title="Find the right competition" intro="Filter by grade, type and exam mode. Every competition page has the dates, fees, rules and awards." />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page">
          <CompetitionsBrowser items={items} />
        </div>
      </section>
    </>
  );
}
