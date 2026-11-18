import { PageHero } from "@/components/ui/misc";

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: { h: string; p: string[] }[] }) {
  return (
    <>
      <PageHero eyebrow="Policies" title={title} intro={intro} />
      <section className="py-16">
        <div className="container-page max-w-3xl">
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-300/60">
            Draft for review. This policy must be checked by EEA and its legal adviser before the website launches.
          </p>
          <div className="prose-eea mt-8">
            {sections.map((s) => (
              <div key={s.h}>
                <h2>{s.h}</h2>
                {s.p.map((t) => <p key={t}>{t}</p>)}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
