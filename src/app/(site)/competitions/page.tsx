import type { Metadata } from "next";
import { competitions } from "@/content/competitions";
import { CompetitionsBrowser } from "@/components/competitions-browser";
import { PageHero } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Find olympiads and extracurricular competitions by grade, type and exam mode.",
};

export default function CompetitionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Competitions"
        title="Find the right competition"
        intro="Filter by grade, type and exam mode. Every competition page has the syllabus, dates, fees, rules and awards."
      />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page">
          <CompetitionsBrowser items={competitions} />
        </div>
      </section>
    </>
  );
}
