import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CalendarDays, CheckCircle2, Clock, Layers, MonitorSmartphone, Users, Wallet } from "lucide-react";
import { getPublishedCompetition, getPublishedCompetitions } from "@/lib/competitions";
import { isRegistrationReady } from "@/lib/competition-types";
import { LOCALES, fill, localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { competitionText, dateLong, gradesText, modesText, pkr } from "@/i18n/format";
import { CompetitionIcon } from "@/components/competition-card";
import { LinkButton } from "@/components/ui/button";
import { Badge, Faq, Notice } from "@/components/ui/misc";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  const items = await getPublishedCompetitions();
  return items.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublishedCompetition(slug);
  if (!c) notFound();
  const { t, locale } = await getI18n();
  const text = competitionText(t, c);
  const path = `/competitions/${c.slug}`;
  return {
    title: text.name,
    description: `${text.summary} ${gradesText(t, c)}.`,
    alternates: { canonical: localePath(locale, path), languages: { ...Object.fromEntries(LOCALES.map((l) => [l.code, localePath(l.code, path)])), "x-default": path } },
  };
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getPublishedCompetition(slug);
  if (!c) notFound();
  const k = c.content;
  const ready = isRegistrationReady(c);
  const { t, href, intl, locale } = await getI18n();
  const d = t.competition;
  const TBA = t.common.tba;
  const text = competitionText(t, c);

  const facts = [
    { icon: Users, label: d.facts.grades, value: c.gradeFrom == null ? TBA : gradesText(t, c) },
    { icon: MonitorSmartphone, label: d.facts.mode, value: c.modes.length ? modesText(t, c.modes) : TBA },
    { icon: Clock, label: d.facts.duration, value: c.durationMinutes ? fill(d.facts.minutes, { n: c.durationMinutes }) : TBA },
    { icon: Layers, label: d.facts.levels, value: String(c.levels) },
    { icon: CalendarDays, label: d.facts.examDate, value: c.examDate ? dateLong(intl, c.examDate) : TBA },
    { icon: Wallet, label: d.facts.fee, value: c.feePkr != null ? pkr(intl, c.feePkr) : TBA },
  ];

  const sections = [
    { id: "overview", label: d.sections.overview, show: true },
    { id: "eligibility", label: d.sections.eligibility, show: true },
    { id: "dates", label: d.sections.dates, show: true },
    { id: "format", label: d.sections.format, show: Boolean(k.format?.length) },
    { id: "syllabus", label: d.sections.syllabus, show: true },
    { id: "rules", label: d.sections.rules, show: Boolean(k.rules?.length) },
    { id: "awards", label: d.sections.awards, show: true },
    { id: "results", label: d.sections.results, show: true },
    { id: "faqs", label: d.sections.faqs, show: Boolean(k.faqs?.length) },
  ].filter((s) => s.show);

  const eventJsonLd = c.examDate && {
    "@context": "https://schema.org",
    "@type": "Event",
    name: c.name,
    startDate: c.examDate,
    eventAttendanceMode: c.modes.includes("online") ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    organizer: { "@type": "Organization", name: site.legalName, url: site.url },
    description: k.overview ?? c.summary,
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="dot-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="container-page relative py-14 sm:py-18">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href={href("/competitions")} className="hover:text-navy-700">{d.breadcrumb}</Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{text.name}</span>
          </nav>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <CompetitionIcon c={c} className="size-16 rounded-3xl [&_svg]:size-8" />
            <div className="flex-1">
              <Badge tone={c.accent}>{c.kind === "olympiad" ? t.common.olympiad : t.common.extracurricular}</Badge>
              <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{text.name}</h1>
              <p className="mt-4 max-w-2xl text-lg text-muted">{text.summary}</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <LinkButton href={href("/register")} variant="gold" size="lg">{ready ? d.register : d.howToRegister}</LinkButton>
              <p className="text-xs text-muted">{c.registrationCloses ? fill(d.closes, { date: dateLong(intl, c.registrationCloses) }) : d.datesTba}</p>
            </div>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-line ring-1 ring-line sm:grid-cols-3 lg:grid-cols-6">
            {facts.map((f) => (
              <div key={f.label} className="bg-white p-5">
                <dt className="flex items-center gap-1.5 text-xs text-muted"><f.icon className="size-4 text-brand-blue" aria-hidden />{f.label}</dt>
                <dd className={`mt-1 font-semibold ${f.value === TBA ? "text-muted" : "text-navy-900"}`}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label={d.onThisPage} className="sticky top-28">
            <p className="eyebrow mb-3">{d.onThisPage}</p>
            <ul className="space-y-1 border-s border-line">
              {sections.map((s) => (
                <li key={s.id}><a href={`#${s.id}`} className="-ms-px block border-s-2 border-transparent py-1.5 ps-4 text-sm text-muted hover:border-navy-600 hover:text-navy-800">{s.label}</a></li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 space-y-16 [&>section]:scroll-mt-28">
          {locale !== "en" && <p className="rounded-2xl bg-surface px-4 py-3 text-sm text-muted">{d.englishOnly}</p>}
          <section id="overview">
            <h2 className="text-2xl font-bold">{d.sections.overview}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted" lang={k.overview ? "en" : undefined}>{k.overview ?? text.summary}</p>
            {Boolean(k.objectives?.length) && (
              <>
                <h3 className="mt-8 text-lg font-semibold">{d.objectives}</h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {k.objectives!.map((o) => (
                    <li key={o} className="flex gap-3 rounded-2xl bg-surface p-4"><CheckCircle2 className="size-5 shrink-0 text-brand-blue" aria-hidden /><span>{o}</span></li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section id="eligibility">
            <h2 className="text-2xl font-bold">{d.sections.eligibility}</h2>
            <ul className="mt-4 space-y-2 text-muted">
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden />{c.gradeFrom != null ? fill(d.eligibleGrades, { grades: gradesText(t, c) }) : d.eligibleTba}</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden />{d.eligibleHow}</li>
              {k.eligibility?.map((e) => <li key={e} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden />{e}</li>)}
            </ul>
          </section>

          <section id="dates">
            <h2 className="text-2xl font-bold">{d.sections.dates}</h2>
            <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line">
              <table className="w-full text-start text-sm">
                <tbody className="divide-y divide-line">
                  <tr><th className="w-1/2 bg-surface p-4 text-start font-medium">{d.registrationCloses}</th><td className="p-4">{c.registrationCloses ? dateLong(intl, c.registrationCloses) : TBA}</td></tr>
                  <tr><th className="bg-surface p-4 text-start font-medium">{c.levels > 1 ? d.level1 : d.facts.examDate}</th><td className="p-4">{c.examDate ? dateLong(intl, c.examDate) : TBA}</td></tr>
                  {c.levels > 1 && <tr><th className="bg-surface p-4 text-start font-medium">{d.level2}</th><td className="p-4">{d.level2Text}</td></tr>}
                  <tr><th className="bg-surface p-4 text-start font-medium">{d.feePerStudent}</th><td className="p-4">{c.feePkr != null ? pkr(intl, c.feePkr) : TBA}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {Boolean(k.format?.length) && (
            <section id="format">
              <h2 className="text-2xl font-bold">{d.sections.format}</h2>
              <dl className="mt-5 divide-y divide-line rounded-[var(--radius-card)] border border-line">
                {k.format!.map((f) => (
                  <div key={f.label} className="grid gap-1 p-4 sm:grid-cols-[200px_1fr]"><dt className="font-medium text-navy-900">{f.label}</dt><dd className="text-muted">{f.value}</dd></div>
                ))}
              </dl>
            </section>
          )}

          <section id="syllabus">
            <h2 className="text-2xl font-bold">{d.syllabusTitle}</h2>
            <div className="mt-5">
              {k.syllabus?.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {k.syllabus.map((s) => (
                    <div key={s.band} className="rounded-[var(--radius-card)] border border-line p-5">
                      <h3 className="font-semibold">{s.band}</h3>
                      <ul className="mt-3 space-y-1.5 text-sm text-muted">{s.topics.map((t) => <li key={t}>• {t}</li>)}</ul>
                    </div>
                  ))}
                </div>
              ) : (
                <Notice title={d.syllabusSoonTitle}>{d.syllabusSoon}</Notice>
              )}
            </div>
          </section>

          {Boolean(k.rules?.length) && (
            <section id="rules">
              <h2 className="text-2xl font-bold">{d.rulesTitle}</h2>
              <ol className="mt-5 list-decimal space-y-2 ps-5 text-muted marker:font-semibold marker:text-navy-600">{k.rules!.map((r) => <li key={r} className="ps-1">{r}</li>)}</ol>
            </section>
          )}

          <section id="awards">
            <h2 className="text-2xl font-bold">{d.awardsTitle}</h2>
            <div className="mt-5">
              {k.awards?.length ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {k.awards.map((a) => (
                    <li key={a.title} className="flex gap-4 rounded-[var(--radius-card)] border border-line p-5">
                      <Award className="size-7 shrink-0 text-gold" aria-hidden />
                      <div><h3 className="font-semibold">{a.title}</h3><p className="mt-1 text-sm text-muted">{a.detail}</p></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Notice title={d.awardsSoonTitle}>{d.awardsSoon}</Notice>
              )}
            </div>
          </section>

          <section id="results">
            <h2 className="text-2xl font-bold">{d.resultsTitle}</h2>
            <div className="mt-5">
              <Notice title={d.resultsNoticeTitle}>
                {d.resultsNotice} <Link href={href("/results")} className="font-semibold text-navy-600 underline underline-offset-4">{d.howResultsWork}</Link>
              </Notice>
            </div>
          </section>

          {Boolean(k.faqs?.length) && (
            <section id="faqs">
              <h2 className="text-2xl font-bold">{d.faqsTitle}</h2>
              <div className="mt-5"><Faq items={k.faqs!} /></div>
            </section>
          )}
        </div>
      </div>
      {eventJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />}
    </>
  );
}
