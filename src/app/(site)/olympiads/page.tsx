import type { Metadata } from "next";
import { olympiads } from "@/content/competitions";
import { CompetitionCard } from "@/components/competition-card";
import { PageHero } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Olympiads",
  description: "Subject olympiads in mathematics, science and English for Grades 1 to 10.",
};

export default function OlympiadsPage() {
  return (
    <>
      <PageHero
        eyebrow="Olympiads"
        title="Olympiads that go beyond the textbook"
        intro="Grade-specific papers that reward understanding and reasoning. Top performers of each grade qualify for Level 2."
      />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {olympiads.map((c) => <CompetitionCard key={c.slug} c={c} />)}
        </div>
      </section>
    </>
  );
}
