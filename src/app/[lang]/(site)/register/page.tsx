import { CheckCircle2, School, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("register", "/register");

export default async function RegisterPage() {
  const { t, href } = await getI18n();
  const p = t.register;
  const paths = [
    { id: "school", icon: School, ...p.school, link: "/register/school", variant: "gold" as const },
    { id: "individual", icon: UserRound, ...p.parent, link: "/register/parent", variant: "primary" as const },
  ];
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="py-16">
        <div className="container-page space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {paths.map((x) => (
              <article key={x.id} id={x.id} className="scroll-mt-28 rounded-[1.75rem] border border-line p-8 sm:p-10">
                <span className="grid size-14 place-items-center rounded-2xl bg-navy-50 text-navy-600"><x.icon className="size-7" aria-hidden /></span>
                <h2 className="mt-6 text-2xl font-bold">{x.title}</h2>
                <p className="mt-1 text-muted">{x.who}</p>
                <ul className="mt-6 space-y-3">
                  {x.points.map((pt) => <li key={pt} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden />{pt}</li>)}
                </ul>
                <LinkButton href={href(x.link)} variant={x.variant} size="lg" className="mt-8">{x.button}</LinkButton>
              </article>
            ))}
          </div>
          <p className="text-sm text-muted">{t.common.feesInPkr} {t.common.portalsEnglish}</p>
        </div>
      </section>
    </>
  );
}
