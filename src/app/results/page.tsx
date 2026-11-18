import type { Metadata } from "next";
import { CheckCircle2, ListOrdered, Scale, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Notice, PageHero, SectionHeading } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Results",
  description: "How EEA results and rankings are calculated, checked and published.",
};

const steps = [
  { icon: CheckCircle2, title: "Marked automatically", text: "Online answers and scanned paper answer sheets are marked against the approved answer key." },
  { icon: ListOrdered, title: "Ranked per grade", text: "Ranks are calculated at school, city, province and national level for each grade." },
  { icon: Scale, title: "Clear tie-breaks", text: "Equal scores are separated by published rules, such as higher accuracy and less time taken." },
  { icon: ShieldCheck, title: "Checked and approved", text: "Results are reviewed and approved by two people before they are published." },
];

export default function ResultsPage() {
  return (
    <>
      <PageHero eyebrow="Results" title="Results and rankings" intro="Students and schools see full results in their dashboards. Position holders are listed publicly with permission." />
      <section className="py-16">
        <div className="container-page space-y-14">
          <Notice title="No results published yet">
            Results for each competition appear here after they are approved. You will be able to search by roll number and date of birth, and schools will receive a full report in their dashboard.
          </Notice>
          <div>
            <SectionHeading eyebrow="How results work" title="Fair, checked and transparent" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.title} className="rounded-[var(--radius-card)] border border-line p-6">
                  <s.icon className="size-7 text-brand-blue" aria-hidden />
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] bg-surface p-6">
            <p className="flex-1 text-muted">Have an EEA certificate? Check that it is genuine.</p>
            <LinkButton href="/verify" variant="outline">Verify a certificate</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
