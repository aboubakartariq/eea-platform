import { getPublishedCompetitions } from "@/lib/competitions";
import { CompetitionsBrowser } from "@/components/competitions-browser";
import { PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("competitions", "/competitions");

export default async function CompetitionsPage() {
  const { t } = await getI18n();
  const items = await getPublishedCompetitions();
  return (
    <>
      <PageHero eyebrow={t.competitions.eyebrow} title={t.competitions.title} intro={t.competitions.intro} />
      <section className="bg-surface py-14 sm:py-16">
        <div className="container-page">
          <CompetitionsBrowser items={items} />
        </div>
      </section>
    </>
  );
}
