import { getPublishedCompetitions } from "@/lib/competitions";
import { CompetitionCard } from "@/components/competition-card";
import { Notice, PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("activities", "/activities");

export default async function ActivitiesPage() {
  const { t } = await getI18n();
  const p = t.activities;
  const items = (await getPublishedCompetitions()).filter((c) => c.kind === "activity");
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page">
          {items.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((c) => <CompetitionCard key={c.slug} c={c} />)}</div>
          ) : (
            <Notice title={p.emptyTitle}>{p.empty}</Notice>
          )}
        </div>
      </section>
    </>
  );
}
