import Link from "next/link";
import { BadgeCheck, CalendarDays, FileSpreadsheet, GraduationCap, MonitorSmartphone, School, Users } from "lucide-react";
import { byExamDate, getPublishedCompetitions } from "@/lib/competitions";
import { gradesLabel } from "@/lib/competition-types";
import { generalFaqs, news, testimonials } from "@/content/general";
import { CompetitionIcon } from "@/components/competition-card";
import { CertificateSample } from "@/components/home/certificate-sample";
import { HeroStage } from "@/components/home/hero-stage";
import { LinkButton } from "@/components/ui/button";
import { accentStyles, Faq } from "@/components/ui/misc";
import { cn, formatDate, formatPKR, formatShortDate } from "@/lib/utils";

/** The real order of events for a school, from sign-up to certificates. */
const journey = [
  { icon: School, title: "Register your school", text: "Fill in one form. We check it and send your school ID." },
  { icon: FileSpreadsheet, title: "Add your students", text: "Upload your class list in Excel, or add students one by one." },
  { icon: MonitorSmartphone, title: "Choose online or paper", text: "Enter students for each competition and pay one invoice." },
  { icon: GraduationCap, title: "Sit the exam", text: "On a laptop or phone at the set time, or on paper at your school." },
  { icon: BadgeCheck, title: "Results and certificates", text: "Ranks, topic-by-topic feedback and certificates anyone can check." },
];

export default async function Home() {
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
              Every student deserves a podium.
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-white/75 sm:text-xl">
              Olympiads in maths, English, science and reasoning for Grades 1 to 10. Students sit them online or on paper at school, and every result comes with a fair rank and a certificate anyone can check.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href="/schools" variant="gold" size="lg">Register your school</LinkButton>
              <Link href="/competitions" className="inline-flex h-13 items-center rounded-full px-7 text-base font-semibold text-white ring-1 ring-white/35 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                See the competitions
              </Link>
            </div>
            {next && (
              <Link href={`/competitions/${next.slug}`} className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/[0.12]">
                <CalendarDays className="size-6 text-gold" aria-hidden />
                <span className="text-sm leading-snug">
                  <span className="block text-white/60">Next competition</span>
                  <span className="font-semibold">{next.name}, {formatShortDate(next.examDate!)}</span>
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
            <h2 id="olympiads-h" className="max-w-2xl font-display text-4xl leading-tight font-bold tracking-[-0.02em] sm:text-5xl">Four olympiads, one fair stage</h2>
            <Link href="/competitions" className="font-semibold text-navy-600 underline-offset-4 hover:underline">All competitions</Link>
          </div>
          <ul className="mt-12 divide-y divide-line border-y border-line">
            {competitions.map((c) => {
              const a = accentStyles[c.accent];
              return (
                <li key={c.id}>
                  <Link href={`/competitions/${c.slug}`} className="group relative grid items-center gap-x-8 gap-y-3 py-7 pl-6 transition-colors hover:bg-surface sm:grid-cols-[auto_1fr_auto] sm:py-9">
                    <span aria-hidden className={cn("absolute top-0 bottom-0 left-0 w-1.5 origin-bottom scale-y-50 transition-transform duration-300 group-hover:scale-y-100", a.solid)} />
                    <CompetitionIcon c={c} className="hidden sm:grid" />
                    <span>
                      <span className="block font-display text-2xl font-bold tracking-[-0.01em] text-navy-900 sm:text-3xl">{c.name}</span>
                      <span className="mt-1.5 block max-w-2xl text-muted">{c.summary}</span>
                    </span>
                    {c.gradeFrom == null && !c.examDate && !c.feePkr ? (
                      <span className="text-sm text-muted sm:w-[25rem] sm:text-right">Grades, dates and fee coming soon</span>
                    ) : (
                      <dl className="grid grid-cols-3 gap-x-6 text-sm sm:w-[25rem]">
                        <div><dt className="text-muted">Grades</dt><dd className="mt-0.5 font-semibold text-navy-900">{c.gradeFrom == null ? "Soon" : gradesLabel(c).replace(/^Grades? /, "")}</dd></div>
                        <div><dt className="text-muted">Exam</dt><dd className="mt-0.5 font-semibold text-navy-900">{c.examDate ? formatShortDate(c.examDate) : "Soon"}</dd></div>
                        <div><dt className="text-muted">Fee</dt><dd className="mt-0.5 font-semibold text-navy-900">{c.feePkr ? formatPKR(c.feePkr) : "Soon"}</dd></div>
                      </dl>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-sm text-muted">Syllabus, rules and awards are on each competition&apos;s page.</p>
        </div>
      </section>

      {/* The journey: a real sequence */}
      <section className="bg-surface py-20 sm:py-28" aria-labelledby="journey-h">
        <div className="container-page">
          <h2 id="journey-h" className="max-w-2xl font-display text-4xl leading-tight font-bold tracking-[-0.02em] sm:text-5xl">From class list to certificate</h2>
          <p className="mt-4 max-w-xl text-lg text-muted">What taking part looks like for a school. Parents can also enter a child on their own for online exams.</p>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-5 md:gap-6">
            <span aria-hidden className="absolute top-6 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-gold via-brand-blue to-magenta md:block" />
            {journey.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="relative grid size-12 place-items-center rounded-full bg-white font-display text-lg font-bold text-navy-800 shadow-sm ring-1 ring-line">{i + 1}</span>
                <h3 className="mt-5 flex items-center gap-2 text-lg font-semibold"><s.icon className="size-5 text-brand-blue" aria-hidden />{s.title}</h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap gap-3">
            <LinkButton href="/schools" size="lg">How it works for schools</LinkButton>
            <LinkButton href="/register/parent" variant="outline" size="lg">Enter my child</LinkButton>
          </div>
        </div>
      </section>

      {/* Certificates you can check */}
      <section className="overflow-hidden py-20 sm:py-28" aria-labelledby="verify-h">
        <div className="container-page grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 id="verify-h" className="max-w-xl font-display text-4xl leading-tight font-bold tracking-[-0.02em] sm:text-5xl">A certificate anyone can check</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Every certificate carries its own number and a QR code. A university, a school or a relative can scan it and see straight away that it is genuine, and who it was awarded to.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Users, text: "Ranked against every student in the same grade, and within their own school." },
                { icon: GraduationCap, text: "A topic-by-topic breakdown shows what to practise next." },
                { icon: BadgeCheck, text: "Results are checked and approved by two people before they are published." },
              ].map((f) => (
                <li key={f.text} className="flex gap-3"><f.icon className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden /><span>{f.text}</span></li>
              ))}
            </ul>
            <LinkButton href="/verify" variant="outline" size="lg" className="mt-10">Check a certificate</LinkButton>
          </div>
          <div className="relative">
            <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(247,148,29,0.18),transparent)]" />
            <CertificateSample />
          </div>
        </div>
      </section>

      {/* Testimonials appear only when real ones are added */}
      {testimonials.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="container-page">
            <h2 className="font-display text-4xl font-bold tracking-[-0.02em]">What schools and parents say</h2>
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
            <h2 className="font-display text-4xl font-bold tracking-[-0.02em]">News and announcements</h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {news.slice(0, 3).map((n) => (
                <li key={n.slug}>
                  <Link href={`/news/${n.slug}`} className="block rounded-[var(--radius-card)] border border-line p-6 hover:border-navy-200">
                    <p className="text-sm text-muted">{formatDate(n.date)}</p>
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
            <h2 className="font-display text-4xl leading-tight font-bold tracking-[-0.02em]">Questions parents and schools ask</h2>
            <p className="mt-6 text-muted">
              Something else?{" "}
              <Link href="/contact" className="font-semibold text-navy-600 underline underline-offset-4">Contact us</Link>.
            </p>
          </div>
          <Faq items={generalFaqs} />
        </div>
      </section>

      {/* Closing stage */}
      <section className="relative isolate overflow-hidden bg-[#14164F] py-20 text-white sm:py-24">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_120%,rgba(247,148,29,0.35),transparent_70%)]" />
        <div className="container-page flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl font-display text-4xl leading-tight font-extrabold tracking-[-0.02em] text-white sm:text-5xl">Bring your students to the stage this year.</h2>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/register" variant="gold" size="lg">Register now</LinkButton>
            <Link href="/competitions" className="inline-flex h-13 items-center rounded-full px-7 text-base font-semibold text-white ring-1 ring-white/35 hover:bg-white/10">Browse competitions</Link>
          </div>
        </div>
      </section>
    </>
  );
}
