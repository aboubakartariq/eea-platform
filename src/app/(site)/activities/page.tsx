import type { Metadata } from "next";
import { getPublishedCompetitions } from "@/lib/competitions";
import { CompetitionCard } from "@/components/competition-card";
import { Notice, PageHero } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Extracurricular activities", description: "Creative and skills-based competitions for students." };

export default async function ActivitiesPage() {
  const items = (await getPublishedCompetitions()).filter((c) => c.kind === "activity");
  return (
    <>
      <PageHero eyebrow="Extracurricular" title="Creative and skills-based competitions" intro="Not every talent shows up in a subject exam. These events celebrate creativity, confidence and curiosity." />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page">
          {items.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((c) => <CompetitionCard key={c.slug} c={c} />)}</div>
          ) : (
            <Notice title="Extracurricular competitions are coming">
              Art, spelling, quiz and other activity competitions will be announced here. Meanwhile, explore our olympiads.
            </Notice>
          )}
        </div>
      </section>
    </>
  );
}
