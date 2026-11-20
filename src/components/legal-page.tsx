import { PageHero } from "@/components/ui/misc";
import { getI18n } from "@/i18n/server";

/** Policies are written in English; other languages show a translated title and introduction. */
export async function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: { h: string; p: string[] }[] }) {
  const { t, locale } = await getI18n();
  return (
    <>
      <PageHero eyebrow={t.legal.eyebrow} title={title} intro={intro} />
      <section className="py-16">
        <div className="container-page max-w-3xl space-y-4">
          {locale !== "en" && <p className="rounded-2xl bg-surface p-4 text-sm text-muted">{t.legal.englishOnly}</p>}
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-300/60">{t.legal.draft}</p>
          <div className="prose-eea mt-8" lang="en" dir="ltr">
            {sections.map((s) => (
              <div key={s.h}>
                <h2>{s.h}</h2>
                {s.p.map((x) => <p key={x}>{x}</p>)}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
