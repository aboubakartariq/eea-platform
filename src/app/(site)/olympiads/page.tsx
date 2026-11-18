import type { Metadata } from "next";
import { getPublishedCompetitions } from "@/lib/competitions";
import { CompetitionCard } from "@/components/competition-card";
import { Notice, PageHero } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Olympiads", description: "EEA's olympiads in mental maths, English, science and reasoning." };

export default async function OlympiadsPage() {
  const items = (await getPublishedCompetitions()).filter((c) => c.kind === "olympiad");
  return (
    <>
      <PageHero eyebrow="Olympiads" title="Olympiads that go beyond the textbook" intro="Grade-specific papers that reward understanding, speed and reasoning." />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page">
          {items.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map((c) => <CompetitionCard key={c.slug} c={c} />)}</div>
          ) : (
            <Notice title="Olympiads will be announced soon">Check back for this season&apos;s olympiads.</Notice>
          )}
        </div>
      </section>
    </>
  );
}
