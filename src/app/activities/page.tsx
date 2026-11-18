import type { Metadata } from "next";
import { activities } from "@/content/competitions";
import { CompetitionCard } from "@/components/competition-card";
import { PageHero } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Extracurricular activities",
  description: "Art, spelling, quiz and other skills-based competitions for students.",
};

export default function ActivitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Extracurricular"
        title="Creative and skills-based competitions"
        intro="Not every talent shows up in a subject exam. These events celebrate creativity, confidence and curiosity."
      />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((c) => <CompetitionCard key={c.slug} c={c} />)}
        </div>
      </section>
    </>
  );
}
