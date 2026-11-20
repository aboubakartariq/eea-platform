import Link from "next/link";
import { BadgeCheck, CalendarDays, FileSpreadsheet, GraduationCap, MonitorSmartphone, School, Users } from "lucide-react";
import { byExamDate, getPublishedCompetitions } from "@/lib/competitions";
import { news, testimonials } from "@/content/general";
import { getI18n } from "@/i18n/server";
import { competitionText, dateLong, dateShort, gradesShort, pkr } from "@/i18n/format";
import { CompetitionIcon } from "@/components/competition-card";
import { CertificateSample } from "@/components/home/certificate-sample";
import { HeroStage } from "@/components/home/hero-stage";
import { LinkButton } from "@/components/ui/button";
import { accentStyles, Faq } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/** Icons for the real order of events for a school, from sign-up to certificates. */
const journeyIcons = [School, FileSpreadsheet, MonitorSmartphone, GraduationCap, BadgeCheck];
const verifyIcons = [Users, GraduationCap, BadgeCheck];

export default async function Home() {
  const { t, href, intl } = await getI18n();
  const h = t.home;
  const competitions = (await getPublishedCompetitions()).sort(byExamDate);
  const next = competitions.find((c) => c.examDate);

  return (
    <>
      {/* Hero: the winners' stage */}
      <section className="relative isolate overflow-hidden bg-[#14164F] text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_75%_45%,#2E3192_0%,transparent_70%),radial-gradient(40%_50%_at_95%_90%,rgba(236,0,140,0.28)_0%,transparent_70%),radial-gradient(40%_50%_at_45%_100%,rgba(0,114,188,0.35)_0%,transparent_70%)]" />
        <div className="container-page grid min-h-[calc(100svh-4.5rem)] items-center gap-6 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-10">
          <div className="relative z-10 order-2 max-w-xl animate-fade-up lg:order-none">
            <h1 className="font-display text-[clamp(2.6rem,5.2vw,4.75rem)] leading-[0.98] font-extrabold tracking-[-0.03em] text-white">
              {h.title}
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-white/75 sm:text-xl">
              {h.intro}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href={href("/schools")} variant="gold" size="lg">{h.registerSchool}</LinkButton>
              <Link href={href("/competitions")} className="inline-flex h-13 items-center rounded-full px-7 text-base font-semibold text-white ring-1 ring-white/35 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                {h.seeCompetitions}
              </Link>
            </div>
            {next && (
              <Link href={href(`/competitions/${next.slug}`)} className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/[0.12]">
                <CalendarDays className="size-6 text-gold" aria-hidden />
                <span className="text-sm leading-snug">
                  <span className="block text-white/60">{h.nextCompetition}</span>
                  <span className="font-semibold">{competitionText(t, next).name}, {dateShort(intl, next.examDate!)}</span>
                </span>
              </Link>
            )}
          </div>
          <div className="relative order-1 -mx-4 h-[360px] sm:h-[480px] lg:order-none lg:mx-0 lg:mb-0 lg:h-[min(720px,82svh)]">
            <HeroStage />
          </div>
        </div>
      </section>

      {/* The olympiads, as lanes */}
      <section className="py-20 sm:py-28" aria-labelledby="olympiads-h">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="olympiads-h" className="max-w-2xl font-display text-4xl leading-tight font-bold tracking-[-0.02em] sm:text-5xl">{h.olympiadsTitle}</h2>
            <Link href={href("/competitions")} className="font-semibold text-navy-600 underline-offset-4 hover:underline">{h.allCompetitions}</Link>
          </div>
          <ul className="mt-12 divide-y divide-line border-y border-line">
            {competitions.map((c) => {
              const a = accentStyles[c.accent];
              const text = competitionText(t, c);
              return (
                <li key={c.id}>
                  <Link href={href(`/competitions/${c.slug}`)} className="group relative grid items-center gap-x-8 gap-y-3 py-7 ps-6 transition-colors hover:bg-surface sm:grid-cols-[auto_1fr_auto] sm:py-9">
                    <span aria-hidden className={cn("absolute top-0 bottom-0 start-0 w-1.5 origin-bottom scale-y-50 transition-transform duration-300 group-hover:scale-y-100", a.solid)} />
                    <CompetitionIcon c={c} className="hidden sm:grid" />
                    <span>
                      <span className="block font-display text-2xl font-bold tracking-[-0.01em] text-navy-900 sm:text-3xl">{text.name}</span>
                      <span className="mt-1.5 block max-w-2xl text-muted">{text.summary}</span>
                    </span>
                    {c.gradeFrom == null && !c.examDate && !c.feePkr ? (
                      <span className="text-sm text-muted sm:w-[25rem] sm:text-end">{h.detailsSoon}</span>
                    ) : (
                      <dl className="grid grid-cols-3 gap-x-6 text-sm sm:w-[25rem]">
                        <div><dt className="text-muted">{h.grades}</dt><dd className="mt-0.5 font-semibold text-navy-900">{gradesShort(c) ?? t.common.soon}</dd></div>
                        <div><dt className="text-muted">{h.exam}</dt><dd className="mt-0.5 font-semibold text-navy-900">{c.examDate ? dateShort(intl, c.examDate) : t.common.soon}</dd></div>
                        <div><dt className="text-muted">{h.fee}</dt><dd className="mt-0.5 font-semibold text-navy-900">{c.feePkr ? pkr(intl, c.feePkr) : t.common.soon}</dd></div>
                      </dl>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-sm text-muted">{h.detailsOnPage}</p>
        </div>
      </section>

      {/* The journey: a real sequence */}
      <section className="bg-surface py-20 sm:py-28" aria-labelledby="journey-h">
        <div className="container-page">
          <h2 id="journey-h" className="max-w-2xl font-display text-4xl leading-tight font-bold tracking-[-0.02em] sm:text-5xl">{h.journeyTitle}</h2>
          <p className="mt-4 max-w-xl text-lg text-muted">{h.journeyIntro}</p>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-5 md:gap-6">
            <span aria-hidden className="absolute top-6 inset-x-[10%] hidden h-px bg-gradient-to-r rtl:bg-gradient-to-l from-gold via-brand-blue to-magenta md:block" />
            {h.journey.map((s, i) => {
              const Icon = journeyIcons[i] ?? BadgeCheck;
              return (
              <li key={s.title} className="relative">
                <span className="relative grid size-12 place-items-center rounded-full bg-white font-display text-lg font-bold text-navy-800 shadow-sm ring-1 ring-line">{i + 1}</span>
                <h3 className="mt-5 flex items-center gap-2 text-lg font-semibold"><Icon className="size-5 shrink-0 text-brand-blue" aria-hidden />{s.title}</h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </li>
              );
            })}
          </ol>
          <div className="mt-12 flex flex-wrap gap-3">
            <LinkButton href={href("/schools")} size="lg">{h.howForSchools}</LinkButton>
            <LinkButton href={href("/register/parent")} variant="outline" size="lg">{h.enterChild}</LinkButton>
          </div>
        </div>
      </section>

      {/* Certificates you can check */}
      <section className="overflow-hidden py-20 sm:py-28" aria-labelledby="verify-h">
        <div className="container-page grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 id="verify-h" className="max-w-xl font-display text-4xl leading-tight font-bold tracking-[-0.02em] sm:text-5xl">{h.verifyTitle}</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              {h.verifyIntro}
            </p>
            <ul className="mt-8 space-y-4">
              {h.verifyPoints.map((text, i) => {
                const Icon = verifyIcons[i] ?? BadgeCheck;
                return <li key={text} className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden /><span>{text}</span></li>;
              })}
            </ul>
            <LinkButton href={href("/verify")} variant="outline" size="lg" className="mt-10">{h.checkCertificate}</LinkButton>
          </div>
          <div className="relative">
            <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(247,148,29,0.18),transparent)]" />
            <CertificateSample t={h.sample} />
          </div>
        </div>
      </section>

      {/* Testimonials appear only when real ones are added */}
      {testimonials.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="container-page">
            <h2 className="font-display text-4xl font-bold tracking-[-0.02em]">{h.testimonials}</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.name} className="rounded-[var(--radius-card)] border border-line p-7">
                  <blockquote className="leading-relaxed text-ink">“{t.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm"><span className="font-semibold text-navy-900">{t.name}</span><span className="block text-muted">{t.role}</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News appears only when articles are published */}
      {news.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="container-page">
            <h2 className="font-display text-4xl font-bold tracking-[-0.02em]">{h.newsTitle}</h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {news.slice(0, 3).map((n) => (
                <li key={n.slug}>
                  <Link href={href(`/news/${n.slug}`)} className="block rounded-[var(--radius-card)] border border-line p-6 hover:border-navy-200">
                    <p className="text-sm text-muted">{dateLong(intl, n.date)}</p>
                    <h3 className="mt-2 text-lg font-semibold">{n.title}</h3>
                    <p className="mt-2 text-muted">{n.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-4xl leading-tight font-bold tracking-[-0.02em]">{h.faqTitle}</h2>
            <p className="mt-6 text-muted">
              {h.faqMore}{" "}
              <Link href={href("/contact")} className="font-semibold text-navy-600 underline underline-offset-4">{t.common.contactUs}</Link>.
            </p>
          </div>
          <Faq items={t.faqs} />
        </div>
      </section>

      {/* Closing stage */}
      <section className="relative isolate overflow-hidden bg-[#14164F] py-20 text-white sm:py-24">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_120%,rgba(247,148,29,0.35),transparent_70%)]" />
        <div className="container-page flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl font-display text-4xl leading-tight font-extrabold tracking-[-0.02em] text-white sm:text-5xl">{h.closingTitle}</h2>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={href("/register")} variant="gold" size="lg">{t.common.registerNow}</LinkButton>
            <Link href={href("/competitions")} className="inline-flex h-13 items-center rounded-full px-7 text-base font-semibold text-white ring-1 ring-white/35 hover:bg-white/10">{h.browse}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
