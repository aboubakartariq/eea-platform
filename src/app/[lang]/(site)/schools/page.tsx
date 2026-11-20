import { BadgeCheck, ClipboardList, FileSpreadsheet, Headphones, LineChart, MonitorSmartphone, Receipt, School } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Faq, PageHero, SectionHeading } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("schools", "/schools");

const benefitIcons = [FileSpreadsheet, MonitorSmartphone, Receipt, ClipboardList, LineChart, BadgeCheck];
const partnerIcons = [School, Headphones, BadgeCheck];

export default async function SchoolsPage() {
  const { t, href } = await getI18n();
  const p = t.schools;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro}>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={href("/register/school")} variant="gold" size="lg">{p.register}</LinkButton>
          <LinkButton href={href("/contact")} variant="outline" size="lg">{p.talk}</LinkButton>
        </div>
      </PageHero>

      <section className="py-20">
        <div className="container-page">
          <SectionHeading eyebrow={p.benefitsEyebrow} title={p.benefitsTitle} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {p.benefits.map((b, i) => {
              const Icon = benefitIcons[i] ?? BadgeCheck;
              return (
                <div key={b.title} className="rounded-[var(--radius-card)] border border-line p-7">
                  <Icon className="size-8 text-navy-600" aria-hidden strokeWidth={1.6} />
                  <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow={p.processEyebrow} title={p.processTitle} intro={p.processIntro} />
          <ol className="relative space-y-8 border-s-2 border-navy-100 ps-8">
            {p.process.map((step, i) => (
              <li key={step.title} className="relative">
                <span className="absolute -start-[3.05rem] grid size-9 place-items-center rounded-full bg-navy-600 font-display text-sm font-bold text-white ring-4 ring-surface">{i + 1}</span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={p.partnerEyebrow} title={p.partnerTitle} intro={p.partnerIntro} />
            <ul className="mt-8 space-y-3">
              {p.partnerPoints.map((text, i) => {
                const Icon = partnerIcons[i] ?? BadgeCheck;
                return <li key={text} className="flex items-center gap-3 font-medium"><Icon className="size-5 shrink-0 text-gold" aria-hidden />{text}</li>;
              })}
            </ul>
          </div>
          <Faq items={p.faqs} />
        </div>
      </section>
    </>
  );
}
