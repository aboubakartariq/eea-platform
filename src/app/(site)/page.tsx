import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  FileSpreadsheet,
  LineChart,
  MonitorSmartphone,
  PencilLine,
  ScrollText,
  ShieldCheck,
  Trophy,
  UserPlus,
} from "lucide-react";
import { activities, competitions, olympiads } from "@/content/competitions";
import { generalFaqs, news, testimonials } from "@/content/general";
import { CompetitionCard, CompetitionIcon } from "@/components/competition-card";
import { LinkButton } from "@/components/ui/button";
import { Faq, SectionHeading } from "@/components/ui/misc";
import { Reveal } from "@/components/reveal";
import { formatDate, formatShortDate } from "@/lib/utils";

const upcoming = [...competitions].sort((a, b) => a.examDate.localeCompare(b.examDate));
const next = upcoming[0];

const steps = [
  { icon: UserPlus, title: "Register", text: "Schools register their students in bulk; students can also register on their own." },
  { icon: ScrollText, title: "Prepare", text: "Use the syllabus, sample papers and free practice tests for each grade." },
  { icon: PencilLine, title: "Compete", text: "Take the exam online or on paper at school, on the scheduled date." },
  { icon: Trophy, title: "Celebrate", text: "Get results, ranks, certificates and awards, all verifiable online." },
];

const reasons = [
  { icon: MonitorSmartphone, title: "Online and paper exams", text: "The same competition, two ways to take it, one results system." },
  { icon: ShieldCheck, title: "Fair and transparent", text: "Grade-specific papers, published rules and clear tie-break criteria." },
  { icon: BadgeCheck, title: "Verifiable certificates", text: "Every certificate carries a unique number and a QR code." },
  { icon: LineChart, title: "Performance insights", text: "Students and schools see strengths and areas to improve, not just a score." },
  { icon: FileSpreadsheet, title: "Built for schools", text: "Excel upload, one invoice, admit cards and results in one dashboard." },
  { icon: Award, title: "Meaningful awards", text: "Trophies, medals and merit certificates that recognise real effort." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" aria-hidden />
        <div className="container-page relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow animate-fade-up">Olympiads · Competitions · Awards</p>
            <h1 className="mt-4 animate-fade-up text-4xl leading-[1.08] font-bold sm:text-6xl">
              Competitions that help every student <span className="text-brand-blue">shine</span>
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-muted [animation-delay:80ms]">
              Olympiads and extracurricular competitions for Grades 1 to 10, online and on paper, with fair rankings and certificates anyone can verify.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 animate-fade-up [animation-delay:160ms]">
              <LinkButton href="/competitions" variant="gold" size="lg">
                Explore competitions <ArrowRight className="size-5" aria-hidden />
              </LinkButton>
              <LinkButton href="/schools" variant="outline" size="lg">
                Register your school
              </LinkButton>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-navy-800 animate-fade-up [animation-delay:240ms]">
              {["Grades 1–10", "Online and paper", "QR-verified certificates"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <BadgeCheck className="size-5 text-brand-blue" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-up pt-12 pb-16 [animation-delay:120ms]">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-navy-50 to-gold-50 blur-2xl" aria-hidden />
            <Image
              src="/brand/eea-seal.svg"
              alt="Educational Extracurricular Activities seal: three students with a gold star"
              width={520}
              height={520}
              priority
              className="relative mx-auto w-[82%] drop-shadow-[0_30px_40px_rgba(20,22,74,0.18)]"
            />
            {next && (
              <Link
                href={`/competitions/${next.slug}`}
                className="absolute bottom-0 left-0 flex items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-lg shadow-navy-900/10 backdrop-blur hover:border-navy-200 sm:-left-6"
              >
                <CalendarCheck className="size-8 text-gold" aria-hidden />
                <span>
                  <span className="block text-xs text-muted">Next competition</span>
                  <span className="block text-sm font-semibold text-navy-900">
                    {next.name} · {formatShortDate(next.examDate)}
                  </span>
                </span>
              </Link>
            )}
            <div className="absolute top-0 right-0 hidden items-center gap-2 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-lg shadow-navy-900/10 sm:flex">
              <Trophy className="size-6 text-magenta" aria-hidden />
              <span className="text-sm font-semibold text-navy-900">Trophies · Medals · Certificates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="bg-surface py-20 sm:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Upcoming" title="Upcoming competitions" intro="Register before the deadline. Each competition has its own syllabus, sample papers and practice tests." />
            <LinkButton href="/competitions" variant="outline">
              All competitions <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 3).map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.06}>
                <CompetitionCard c={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Categories" title="Something for every kind of talent" align="center" />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {[
              { title: "Olympiads", href: "/olympiads", text: "Subject competitions that stretch students beyond the textbook.", items: olympiads, tone: "bg-navy-600 text-white", sub: "text-navy-100" },
              { title: "Extracurricular", href: "/activities", text: "Creative and skills-based events, from art to spelling and quizzes.", items: activities, tone: "bg-gold-50 text-navy-900", sub: "text-muted" },
            ].map((cat, i) => (
              <Reveal key={cat.title} delay={i * 0.08}>
                <Link href={cat.href} className={`group block h-full rounded-[1.75rem] p-8 sm:p-10 ${cat.tone}`}>
                  <h3 className={`text-3xl font-bold ${i === 0 ? "text-white" : ""}`}>{cat.title}</h3>
                  <p className={`mt-3 max-w-md text-lg ${cat.sub}`}>{cat.text}</p>
                  <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                    {cat.items.map((c) => (
                      <li key={c.slug} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${i === 0 ? "bg-white/10" : "bg-white"}`}>
                        <CompetitionIcon c={c} className="size-10 rounded-xl" />
                        <span className="font-semibold">{c.name}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mt-8 inline-flex items-center gap-2 font-semibold">
                    Explore {cat.title.toLowerCase()} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="From registration to the winner's stage in four steps" align="center" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <div className="relative h-full rounded-[var(--radius-card)] bg-white p-7 ring-1 ring-line">
                  <span className="font-display text-sm font-bold text-gold-700">Step {i + 1}</span>
                  <s.icon className="mt-4 size-9 text-navy-600" aria-hidden strokeWidth={1.6} />
                  <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why EEA */}
      <section className="py-20 sm:py-24">
        <div className="container-page grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Why EEA"
            title="Built around fairness, trust and real learning"
            intro="Every part of the experience, from the first registration to the final certificate, is designed to be clear for students, simple for schools and reassuring for parents."
          />
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {reasons.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.04}>
                <div className="flex gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-600">
                    <r.icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{r.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted">{r.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Schools */}
      <section className="px-4 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-navy-800 px-6 py-16 text-white sm:px-14 sm:py-20">
          <Image src="/brand/eea-students.svg" alt="" width={420} height={420} aria-hidden className="pointer-events-none absolute -right-16 -bottom-16 opacity-[0.08]" />
          <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow !text-gold">For schools</p>
              <h2 className="mt-3 text-3xl font-bold !text-white sm:text-4xl">Run every competition from one school dashboard</h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy-100">
                Register whole classes from Excel, track payments, download admit cards and see results the moment they are published.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/schools" variant="gold" size="lg">
                  Partner with EEA
                </LinkButton>
                <LinkButton href="/contact" variant="white" size="lg">
                  Talk to our team
                </LinkButton>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: FileSpreadsheet, t: "Bulk Excel registration with error checks" },
                { icon: ClipboardList, t: "Admit cards and roll numbers in one click" },
                { icon: LineChart, t: "Grade- and subject-wise result reports" },
                { icon: BadgeCheck, t: "Certificates for students, teachers and the school" },
              ].map((f) => (
                <li key={f.t} className="flex gap-3 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10">
                  <f.icon className="size-6 shrink-0 text-gold" aria-hidden />
                  <span className="font-medium">{f.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials appear only when real ones are added in the CMS */}
      {testimonials.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="container-page">
            <SectionHeading eyebrow="Voices" title="What schools and parents say" align="center" />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.name} className="rounded-[var(--radius-card)] border border-line p-7">
                  <blockquote className="leading-relaxed text-ink">“{t.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold text-navy-900">{t.name}</span>
                    <span className="block text-muted">{t.role}</span>
                  </figcaption>
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
            <SectionHeading eyebrow="News" title="Latest news and announcements" />
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {news.slice(0, 3).map((n) => (
                <li key={n.slug}>
                  <Link href={`/news/${n.slug}`} className="block rounded-[var(--radius-card)] border border-line p-6 hover:border-navy-200">
                    <p className="text-xs text-muted">{formatDate(n.date)}</p>
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
      <section className="py-20 sm:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="FAQ" title="Questions parents and schools ask" />
            <p className="mt-6 text-muted">
              Can&apos;t find your answer?{" "}
              <Link href="/contact" className="font-semibold text-navy-600 underline underline-offset-4">
                Contact us
              </Link>
              .
            </p>
          </div>
          <Faq items={generalFaqs} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-8 rounded-[2rem] bg-gold-50 p-8 ring-1 ring-gold/25 sm:p-12 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-bold">Ready to take part?</h2>
              <p className="mt-3 max-w-xl text-lg text-muted">Choose a competition, check the dates and register through your school or on your own.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/register" size="lg">
                Register now
              </LinkButton>
              <LinkButton href="/competitions" variant="outline" size="lg">
                Browse competitions
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
