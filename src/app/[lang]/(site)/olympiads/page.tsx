import { getPublishedCompetitions } from "@/lib/competitions";
import { CompetitionCard } from "@/components/competition-card";
import { Notice, PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("olympiads", "/olympiads");

export default async function OlympiadsPage() {
  const { t } = await getI18n();
  const p = t.olympiads;
  const items = (await getPublishedCompetitions()).filter((c) => c.kind === "olympiad");
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page">
          {items.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map((c) => <CompetitionCard key={c.slug} c={c} />)}</div>
          ) : (
            <Notice title={p.emptyTitle}>{p.empty}</Notice>
          )}
        </div>
      </section>
    </>
  );
}
