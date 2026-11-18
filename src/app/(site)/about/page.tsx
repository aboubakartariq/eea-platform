import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, Lightbulb, Scale, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHero, SectionHeading } from "@/components/ui/misc";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `About ${site.legalName}: who we are, what we do and what we stand for.`,
};

const values = [
  { icon: Scale, title: "Fairness", text: "Every student is judged by the same published rules, on a paper made for their grade." },
  { icon: Lightbulb, title: "Real learning", text: "Questions reward understanding and curiosity, not just memorisation." },
  { icon: ShieldCheck, title: "Trust", text: "Results are checked twice and every certificate can be verified." },
  { icon: HeartHandshake, title: "Care", text: "Children's data is protected, and every participant is recognised for taking part." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="We help students discover what they are good at" intro={site.description} />
      <section className="py-20">
        <div className="container-page grid items-center gap-14 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <SectionHeading eyebrow="Our mission" title="Competitions that are fair, inspiring and open to every school" />
            <div className="prose-eea mt-6 max-w-2xl">
              <p>
                {site.legalName} organises olympiads and extracurricular competitions for students from Grades 1 to 10. Schools of every size and board can take part, online or on paper.
              </p>
              <p>
                We believe a good competition does more than produce a winner. It gives every student a goal to work towards, a fair measure of where they stand, and recognition for the effort they put in.
              </p>
            </div>
          </div>
          <figure className="rounded-[2rem] bg-surface p-10 text-center">
            <Image src="/brand/eea-seal.svg" alt="The EEA seal" width={260} height={260} className="mx-auto" />
            <figcaption className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-muted">
              Our seal shows three classmates. The student in the middle raises their arms towards the gold star: success that is shared and celebrated together.
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="border-t border-line bg-surface py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Our values" title="What we stand for" align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-[var(--radius-card)] bg-white p-7 ring-1 ring-line">
                <v.icon className="size-8 text-navy-600" aria-hidden strokeWidth={1.6} />
                <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{v.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <LinkButton href="/contact" size="lg">Get in touch</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
