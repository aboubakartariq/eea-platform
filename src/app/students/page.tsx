import type { Metadata } from "next";
import { BookOpenCheck, ChartNoAxesColumn, FolderHeart, Laptop, Medal, Timer } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHero, SectionHeading } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "For students",
  description: "Prepare, practise and compete. Your results, certificates and achievements in one place.",
};

const items = [
  { icon: BookOpenCheck, title: "Know what to study", text: "Grade-wise syllabus for every competition, so you prepare for the right topics." },
  { icon: Laptop, title: "Practise like the real thing", text: "Practice tests use the same exam screen as the real competition." },
  { icon: Timer, title: "A calm exam screen", text: "Clear timer, question palette and mark-for-review. Your answers save as you go." },
  { icon: ChartNoAxesColumn, title: "Understand your result", text: "See your score, rank and the topics where you did best." },
  { icon: Medal, title: "Earn recognition", text: "Medals, trophies and certificates that anyone can verify with a QR code." },
  { icon: FolderHeart, title: "Build a portfolio", text: "All your competitions and achievements collected year after year." },
];

export default function StudentsPage() {
  return (
    <>
      <PageHero
        eyebrow="For students"
        title="Prepare, compete and celebrate"
        intro="Whether it is your first olympiad or your fifth, everything you need is in one place."
      >
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/competitions" variant="gold" size="lg">Find a competition</LinkButton>
          <LinkButton href="/resources" variant="outline" size="lg">Learning resources</LinkButton>
        </div>
      </PageHero>
      <section className="py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Your journey" title="What you get as an EEA participant" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <div key={b.title} className="rounded-[var(--radius-card)] border border-line p-7">
                <b.icon className="size-8 text-magenta" aria-hidden strokeWidth={1.6} />
                <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pb-24">
        <div className="container-page">
          <div className="rounded-[2rem] bg-navy-50 p-8 sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Is your school not taking part?</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">
              You can still register on your own and take online competitions from home with a parent&apos;s permission.
            </p>
            <LinkButton href="/register#individual" className="mt-6" size="lg">Register individually</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
