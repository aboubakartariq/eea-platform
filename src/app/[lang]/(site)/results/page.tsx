import { CheckCircle2, ListOrdered, Scale, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHero, SectionHeading } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";
import { LookupForm } from "./lookup-form";

export const generateMetadata = () => pageMetadata("results", "/results");

const icons = [CheckCircle2, ListOrdered, Scale, ShieldCheck];

export default async function ResultsPage() {
  const { t, href } = await getI18n();
  const p = t.results;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="py-16">
        <div className="container-page space-y-14">
          <LookupForm />
          <div>
            <SectionHeading eyebrow={p.howEyebrow} title={p.howTitle} />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {p.steps.map((s, i) => {
                const Icon = icons[i] ?? CheckCircle2;
                return (
                  <div key={s.title} className="rounded-[var(--radius-card)] border border-line p-6">
                    <Icon className="size-7 text-brand-blue" aria-hidden />
                    <h3 className="mt-4 font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] bg-surface p-6">
            <p className="flex-1 text-muted">{p.haveCertificate}</p>
            <LinkButton href={href("/verify")} variant="outline">{p.verify}</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
